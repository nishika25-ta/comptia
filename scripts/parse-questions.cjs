#!/usr/bin/env node
/* eslint-disable */
// Parse the sample questions text into structured JSON.

const fs = require("fs");
const path = require("path");

const INPUT = path.resolve(__dirname, "..", "data", "raw", "sample_questions.txt");
const OUTPUT = path.resolve(__dirname, "..", "src", "data", "questions.json");

const HEADER_RE = /^Question\s*#:(\d+)\s*-\s*\[([^\]]+)\]\s*$/;
const ANSWER_RE = /^Answer\s*:\s*([A-F](?:\s*[A-F])*)\s*$/;

function isNoise(line) {
  const t = line.trim();
  if (t === "") return true;
  if (/^CompTIA\s*-\s*SY0-701/i.test(t)) return true;
  if (/^Pass Your Certification/i.test(t)) return true;
  if (/^\d+\s+of\s+4\d\d$/.test(t)) return true;
  if (/^[A-F]\.\s*$/.test(t)) return true;
  return false;
}

function splitBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(HEADER_RE);
    if (m) {
      if (current) blocks.push(current);
      current = {
        id: parseInt(m[1], 10),
        category: m[2].trim(),
        lines: [],
      };
    } else if (current) {
      current.lines.push(line);
    }
  }

  if (current) blocks.push(current);
  return blocks;
}

function parseBlock(block) {
  let answerIdx = -1;
  let answerLetters = [];

  for (let i = 0; i < block.lines.length; i++) {
    const m = block.lines[i].match(ANSWER_RE);
    if (m) {
      answerIdx = i;
      answerLetters = m[1].trim().split(/\s+/);
      break;
    }
  }

  if (answerIdx < 0) {
    return {
      id: block.id,
      category: block.category,
      error: "no_answer",
      raw: block.lines.join("\n"),
    };
  }

  // Lines before the answer = question text + options (with noise)
  const preRaw = block.lines.slice(0, answerIdx);
  const preLines = preRaw
    .filter((l) => !isNoise(l))
    .map((l) => l.replace(/\s+$/g, ""))
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Find last line that contains a question mark or 'Select two/three'/'Choose two/three' marker.
  // Falls back to a line ending with ':' when no such line exists.
  let qTextEnd = -1;
  for (let i = preLines.length - 1; i >= 0; i--) {
    const l = preLines[i];
    if (
      /\?/.test(l) ||
      /\bSelect\s*(two|three)\b/i.test(l) ||
      /\bChoose\s*(two|three)\b/i.test(l)
    ) {
      qTextEnd = i;
      break;
    }
  }
  if (qTextEnd === -1) {
    for (let i = preLines.length - 1; i >= 0; i--) {
      if (/:\s*$/.test(preLines[i])) {
        qTextEnd = i;
        break;
      }
    }
  }

  let questionText;
  let options;

  if (qTextEnd >= 0 && qTextEnd < preLines.length - 1) {
    questionText = preLines.slice(0, qTextEnd + 1).join(" ").replace(/\s+/g, " ").trim();
    options = preLines.slice(qTextEnd + 1);
  } else {
    // Fallback: last 4 lines are options
    const optCount = answerLetters.some((l) => l.charCodeAt(0) >= 69) ? 6 : 4; // E=69
    if (preLines.length > optCount) {
      questionText = preLines
        .slice(0, preLines.length - optCount)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      options = preLines.slice(preLines.length - optCount);
    } else {
      questionText = "";
      options = preLines.slice();
    }
  }

  // Post-answer = explanation
  const postLines = block.lines
    .slice(answerIdx + 1)
    .filter((l) => !isNoise(l))
    .map((l) => l.replace(/\s+$/g, ""));

  // Strip leading "Explanation" header if present
  while (postLines.length && /^Explanation\s*$/i.test(postLines[0].trim())) {
    postLines.shift();
  }

  // Group consecutive lines into paragraphs (assume runs of non-empty lines join with space).
  // Since we already filtered empty lines via isNoise, treat each remaining line as part of a paragraph.
  // We'll simply join all with space, but separate "References" / "Reference:" sections with newlines.
  const explanationLines = [];
  let buffer = [];
  for (const line of postLines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (buffer.length) {
        explanationLines.push(buffer.join(" "));
        buffer = [];
      }
    } else {
      buffer.push(trimmed);
    }
  }
  if (buffer.length) explanationLines.push(buffer.join(" "));

  const explanation = explanationLines.join("\n\n").trim();

  // Sanity check: options should be 4 or 6 in length normally
  const result = {
    id: block.id,
    category: block.category,
    questionText,
    options,
    answer: answerLetters,
    multi: answerLetters.length > 1,
    explanation,
  };

  // Validation flags
  const issues = [];
  if (!questionText) issues.push("empty_question");
  if (options.length < 2) issues.push(`few_options:${options.length}`);
  if (options.length > 8) issues.push(`many_options:${options.length}`);
  for (const letter of answerLetters) {
    const idx = letter.charCodeAt(0) - "A".charCodeAt(0);
    if (idx >= options.length) issues.push(`answer_out_of_range:${letter}`);
  }
  if (issues.length) result._issues = issues;

  return result;
}

function main() {
  const text = fs.readFileSync(INPUT, "utf8");
  const blocks = splitBlocks(text);
  console.log(`Found ${blocks.length} question blocks`);

  const parsed = blocks.map(parseBlock);
  const ok = parsed.filter((p) => !p.error && !p._issues);
  const issues = parsed.filter((p) => p._issues);
  const errors = parsed.filter((p) => p.error);

  console.log(`OK: ${ok.length}`);
  console.log(`With issues: ${issues.length}`);
  console.log(`Errors (no answer): ${errors.length}`);

  if (issues.length > 0) {
    const sample = issues.slice(0, 10);
    console.log("Sample issues:");
    for (const q of sample) {
      console.log(
        `  Q${q.id} [${q.category}] issues=${JSON.stringify(q._issues)} options=${q.options.length}`
      );
    }
  }

  if (errors.length > 0) {
    console.log("Errors:");
    for (const q of errors.slice(0, 5)) {
      console.log(`  Q${q.id} [${q.category}]`);
      console.log(`    raw: ${q.raw.slice(0, 200)}...`);
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(parsed, null, 2));

  console.log(`Wrote ${parsed.length} questions to ${OUTPUT}`);

  // Also write categories summary
  const categories = {};
  for (const q of parsed) {
    if (!q.category) continue;
    categories[q.category] = (categories[q.category] || 0) + 1;
  }
  console.log("Categories:");
  for (const [k, v] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }
}

main();
