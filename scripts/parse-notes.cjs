#!/usr/bin/env node
/* eslint-disable */
// Parse the Student Guides text into structured notes JSON.
// This version produces structured blocks: headings, paragraphs, lists, callouts.

const fs = require("fs");
const path = require("path");

const INPUT = path.resolve(__dirname, "..", "data", "raw", "student_guides.txt");
const OUTPUT_NOTES = path.resolve(__dirname, "..", "src", "data", "notes.json");
const OUTPUT_GLOSSARY = path.resolve(__dirname, "..", "src", "data", "glossary.json");

// ---------------------------------------------------------------------------
// Cleanup of mojibake produced by PDF text extraction.
// ---------------------------------------------------------------------------
function cleanText(s) {
  return s
    .replace(/â˘/g, "•")
    .replace(/âˇ/g, "·")
    .replace(/âŒ/g, "–")
    .replace(/âŞ/g, "—")
    .replace(/âŠ/g, "©")
    .replace(/â\u0090/g, "—")
    .replace(/ÂŽ/g, "®")
    .replace(/Â¡/g, "¡")
    .replace(/Â§/g, "§")
    .replace(/Â°/g, "°")
    .replace(/Âą/g, "±")
    .replace(/ÂŠ/g, "©")
    .replace(/Â /g, " ")
    .replace(/Â/g, "")
    .replace(/â/g, "'")
    .replace(/â/g, "'")
    .replace(/â/g, "\"")
    .replace(/â/g, "\"")
    .replace(/â/g, "—");
}

// ---------------------------------------------------------------------------
// Page footer / boilerplate filtering.
// ---------------------------------------------------------------------------
function isPageFooter(line) {
  const t = line.trim();
  if (t === "") return false;
  if (/^SY0-701_/.test(t)) return true;
  if (/LICENSED FOR USE ONLY BY/.test(t)) return true;
  if (/^Lesson\s+\d+:.*\|\s*Topic\s+\d+[A-Z]\s*$/.test(t)) return true;
  if (/The Official CompTIA Security\+ Student Guide \(Exam SY0-701\)\s*\|\s*\d+\s*$/.test(t)) return true;
  if (/^\d+\s*\|\s*The Official CompTIA Security\+/.test(t)) return true;
  if (/^Table of Contents\s*\|\s*[ivxlcdm]+\s*$/i.test(t)) return true;
  if (/^Table of Contents\s*$/i.test(t)) return true;
  if (/^[ivxlcdm]+\s*\|\s*Table of Contents\s*$/i.test(t)) return true;
  if (/^[ivxlcdm]+\s*\|\s*Preface\s*$/i.test(t)) return true;
  if (/^[ivxlcdm]+\s*\|\s*About This Course\s*$/i.test(t)) return true;
  if (/^Preface\s*\|\s*[ivxlcdm]+\s*$/i.test(t)) return true;
  if (/^About This Course\s*$/.test(t)) return true;
  if (/^Glossary\s*\|\s*G-/.test(t)) return true;
  if (/^G-\d+\s*\|\s*Glossary/.test(t)) return true;
  if (/^Solutions\s*\|\s*S-/.test(t)) return true;
  if (/^S-\d+\s*\|\s*Solutions/.test(t)) return true;
  if (/^Index\s*\|\s*I-/.test(t)) return true;
  if (/^I-\d+\s*\|\s*Index/.test(t)) return true;
  if (/^A-\d+\s*\|\s*Appendix/.test(t)) return true;
  if (/^Glossary\s*$/.test(t)) return true;
  if (/^Index\s*$/.test(t)) return true;
  if (/^Solutions\s*$/.test(t)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Lesson + topic discovery.
// ---------------------------------------------------------------------------
const LESSON_RE = /^Lesson\s+(\d+)\s*$/;
const TOPIC_RE = /^Topic\s+(\d+)([A-Z])\s*$/;

// Recognise common section markers that should become callouts / dividers.
const SPECIAL_HEADINGS = new Map([
  ["LESSON INTRODUCTION", "intro-heading"],
  ["EXAM OBJECTIVES COVERED", "objectives"],
  ["Lesson Objectives", "lesson-objectives"],
  ["Lesson Activities", "activities"],
  ["Summary", "summary"],
  ["Review Activity:", "review"],
]);

// Known sub-heading prefixes that mark new sections within a lesson summary
// (e.g. "Guidelines for Implementing Cryptographic Solutions").
const KNOWN_SUMMARY_PREFIXES = ["Guidelines for", "Practice Question", "In Practice"];

function isLikelySubHeading(line) {
  // A topic sub-heading is a short, title-cased line that does not end with sentence
  // punctuation and that is not a sentence (no internal periods, no question mark).
  const t = line.trim();
  if (t.length === 0 || t.length > 80) return false;
  if (/[.?!]\s*$/.test(t)) return false;
  if (/\d/.test(t.split(" ")[0])) return false; // skip "1.2 Summarize..." etc.
  if (/[:;]/.test(t)) return false;
  if (t.split(/\s+/).length > 8) return false;
  // Must be Title Case: each significant word starts with capital, OR all caps.
  const words = t.split(/\s+/);
  const minorWords = new Set([
    "and",
    "or",
    "of",
    "in",
    "to",
    "for",
    "with",
    "the",
    "a",
    "an",
    "on",
    "from",
    "as",
    "but",
    "by",
    "at",
    "vs",
  ]);
  let titleCaseHits = 0;
  let total = 0;
  for (const w of words) {
    if (!w) continue;
    total++;
    const lower = minorWords.has(w.toLowerCase());
    if (lower) {
      titleCaseHits++;
      continue;
    }
    if (/^[A-Z]/.test(w[0]) || /^\(/.test(w)) titleCaseHits++;
  }
  if (total === 0) return false;
  return titleCaseHits === total;
}

// ---------------------------------------------------------------------------
// Block builder
// ---------------------------------------------------------------------------
//
// We turn each topic body into a sequence of structured blocks:
//   { type: 'heading', text }
//   { type: 'paragraph', text }
//   { type: 'list', items: [{ term?, text }] }
//   { type: 'callout', kind: 'objectives' | 'guideline' | 'review' | 'note', heading?, text?, items? }
//
// The classifier walks line-by-line with a small state machine.

function buildBlocks(rawLines) {
  // Step 1: strip footers and clean mojibake.
  const lines = [];
  for (const raw of rawLines) {
    if (isPageFooter(raw)) continue;
    lines.push(cleanText(raw));
  }

  // Step 2: collapse the PDF's bullet-on-its-own-line pattern into single bullet lines.
  // Pattern observed: "• \nText\n…", "•\n \nText\n…", or with lone trailing whitespace.
  const collapsed = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // The bullet character can appear alone or with trailing space.
    if (/^\s*•\s*$/.test(line)) {
      // Walk forward until the next non-empty line; that becomes the bullet's first content line.
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length) {
        collapsed.push("• " + lines[j].trim());
        i = j;
      } else {
        collapsed.push("");
      }
    } else if (/^\s*•\s+\S/.test(line)) {
      collapsed.push(line.replace(/^\s*•\s+/, "• ").trim());
    } else {
      collapsed.push(line);
    }
  }

  // Step 3: paragraph reconstruction. Empty lines are paragraph breaks.
  // Bullets always start a new paragraph block.
  // Lines that look like sub-headings also force a paragraph break.
  // A line is a heading if:
  //   • it is short (1–7 words, ≤ 60 chars)
  //   • title-cased (every major word starts with a capital, or all caps)
  //   • does not end with terminal punctuation
  //   • the previous content ended with a sentence terminator OR was a heading
  //   • the next non-empty line starts with a Capital letter
  const paragraphs = []; // each is { kind: 'bullet'|'text'|'heading', text }
  let buffer = [];
  let bufferKind = "text";
  let lastWasHeading = false;
  let lastBufferEndsTerminated = true; // start of stream = "terminated"

  function flush() {
    if (buffer.length === 0) return;
    const text = buffer.join(" ").replace(/\s+/g, " ").trim();
    if (text) paragraphs.push({ kind: bufferKind, text });
    if (text) {
      lastBufferEndsTerminated = /[.!?:]\s*$/.test(text);
      lastWasHeading = bufferKind === "heading";
    }
    buffer = [];
    bufferKind = "text";
  }

  function lookAhead(start) {
    for (let k = start; k < collapsed.length; k++) {
      const t = collapsed[k].trim();
      if (t === "") continue;
      return t;
    }
    return "";
  }

  for (let idx = 0; idx < collapsed.length; idx++) {
    const line = collapsed[idx];
    const t = line.trim();
    if (t === "") {
      flush();
      continue;
    }
    if (t.startsWith("• ")) {
      flush();
      bufferKind = "bullet";
      buffer.push(t.slice(2).trim());
      // Bullets are typically multi-line; we keep accumulating until next bullet,
      // empty line, or heading.
      continue;
    }
    // Detect a heading. Only check at the start of a fresh paragraph
    // (i.e. when buffer is empty or the previous LINE in the buffer ended a sentence).
    let bufferEndsTerminated;
    if (buffer.length === 0) {
      bufferEndsTerminated = lastBufferEndsTerminated;
    } else {
      bufferEndsTerminated = /[.!?:]\s*$/.test(buffer[buffer.length - 1]);
    }
    const isCandidate =
      bufferKind !== "bullet" &&
      (buffer.length === 0 || bufferEndsTerminated);
    const isAllCapsBanner =
      isCandidate &&
      /^[A-Z][A-Z0-9 ,&'\-]{3,80}$/.test(t) &&
      t.split(/\s+/).length <= 8 &&
      t === t.toUpperCase();
    if (isCandidate && (isLikelySubHeading(t) || isAllCapsBanner)) {
      // Confirm by peeking at the next non-empty line: it should start with a capital
      // (or numeric objective like "1.2 Summarize…") and not be another short heading.
      const next = lookAhead(idx + 1);
      const nextLooksHeading = next && isLikelySubHeading(next) && !isAllCapsBanner;
      const nextStartsSentence =
        !!next && (/^[A-Z]/.test(next) || /^\d+(\.\d+)?\s+\S/.test(next));
      if (nextStartsSentence && !nextLooksHeading) {
        flush();
        paragraphs.push({ kind: "heading", text: t });
        lastBufferEndsTerminated = true;
        lastWasHeading = true;
        continue;
      }
    }
    // Continuation of the current paragraph
    buffer.push(t);
  }
  flush();

  // Step 4: classify each paragraph into a structured block.
  const blocks = [];

  function pushHeading(text) {
    blocks.push({ type: "heading", text });
  }
  function pushParagraph(text) {
    if (!text || text.length < 3) return;
    blocks.push({ type: "paragraph", text });
  }

  let i = 0;
  while (i < paragraphs.length) {
    const p = paragraphs[i];
    const text = p.text;

    if (p.kind === "heading") {
      // Some headings are actually section markers we want to convert into rich
      // callouts (objectives, lesson objectives, review activity, etc.).
      if (text === "LESSON INTRODUCTION") {
        // Drop the marker — Lesson page renders intro separately and we want a
        // clean look without the all-caps banner.
        i++;
        continue;
      }
      if (text === "EXAM OBJECTIVES COVERED") {
        i++;
        const objectives = [];
        // Following: a numeric objective line (e.g. "1.2 Summarize fundamental…").
        // Sometimes the body text was merged with the objective sentence into one
        // paragraph; in that case we extract just the leading "<X.Y …sentence.>"
        // chunk and push the rest back as a regular paragraph.
        if (
          i < paragraphs.length &&
          paragraphs[i].kind === "text" &&
          /^[\d.]+\s+\S/.test(paragraphs[i].text)
        ) {
          const merged = paragraphs[i].text;
          const sm = merged.match(/^([\d.]+\s+[^.!?]*[.!?])\s*(.*)$/);
          if (sm) {
            objectives.push(sm[1].trim());
            const rest = sm[2].trim();
            if (rest) {
              // Replace this paragraph with just the body remnant so subsequent
              // logic can pick it up as a normal paragraph.
              paragraphs[i] = { kind: "text", text: rest };
            } else {
              i++;
            }
          } else if (merged.length < 200) {
            objectives.push(merged);
            i++;
          }
        }
        while (i < paragraphs.length && paragraphs[i].kind === "bullet") {
          objectives.push(paragraphs[i].text);
          i++;
        }
        if (objectives.length) {
          blocks.push({
            type: "callout",
            kind: "objectives",
            heading: "Exam objectives covered",
            items: objectives,
          });
        }
        continue;
      }
      if (text === "Lesson Objectives") {
        i++;
        let lead = "";
        if (i < paragraphs.length && paragraphs[i].kind === "text") {
          lead = paragraphs[i].text;
          i++;
        }
        const items = [];
        while (i < paragraphs.length && paragraphs[i].kind === "bullet") {
          items.push(paragraphs[i].text);
          i++;
        }
        blocks.push({
          type: "callout",
          kind: "lesson-objectives",
          heading: "In this lesson, you will:",
          lead,
          items,
        });
        continue;
      }
      if (/^Review Activity:/i.test(text)) {
        i++;
        const questions = [];
        if (
          i < paragraphs.length &&
          paragraphs[i].kind === "text" &&
          /Answer the following/i.test(paragraphs[i].text)
        ) {
          i++;
        }
        while (
          i < paragraphs.length &&
          paragraphs[i].kind === "text" &&
          /^\d+\.\s*/.test(paragraphs[i].text)
        ) {
          questions.push(paragraphs[i].text.replace(/^\d+\.\s*/, "").trim());
          i++;
        }
        if (questions.length) {
          blocks.push({
            type: "callout",
            kind: "review",
            heading: "Review activity",
            items: questions,
          });
        }
        continue;
      }
      if (KNOWN_SUMMARY_PREFIXES.some((pfx) => text.startsWith(pfx))) {
        // "Guidelines for …" — render as a heading still, but emphasised.
        pushHeading(text);
        i++;
        continue;
      }
      pushHeading(text);
      i++;
      continue;
    }

    if (p.kind === "bullet") {
      // Coalesce consecutive bullet paragraphs into one list block.
      const items = [];
      while (i < paragraphs.length && paragraphs[i].kind === "bullet") {
        const raw = paragraphs[i].text;
        // Term must be one or more capitalised words (each "Word" pattern), separated
        // by spaces, hyphens, slashes, or "&" — so we cannot accidentally swallow a
        // verb like "means" or "is".
        const TERM = "(?:[A-Z][A-Za-z0-9.'’-]+(?:[ /&-][A-Z][A-Za-z0-9.'’-]+)*)";
        // Pattern 1: "Term—definition" or "Term —definition"
        let m = raw.match(new RegExp(`^(${TERM})\\s*[—-]\\s*(.+)$`));
        if (!m) {
          // Pattern 2: "Term means …" / "Term refers to …" / "Term is …"
          m = raw.match(
            new RegExp(`^(${TERM})\\s+(means|refers to|stands for|describes)\\s+(.+)$`)
          );
          if (m) {
            items.push({
              term: m[1].trim(),
              text: `${m[2]} ${m[3]}`.trim(),
            });
            i++;
            continue;
          }
        }
        if (m) {
          items.push({ term: m[1].trim(), text: m[2].trim() });
        } else {
          items.push({ text: raw });
        }
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    // Default: paragraph.
    pushParagraph(text);
    i++;
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Top-level parsing: walk text, build lesson + topic structures.
// ---------------------------------------------------------------------------
function parseNotes(text) {
  const lines = text.split(/\r?\n/);

  // Stop processing main content when we hit the glossary section.
  let mainContentEnd = lines.length;
  for (let i = 0; i < lines.length - 3; i++) {
    if (
      /^acceptable use policy/.test(lines[i].trim()) &&
      /\(AUP\)/.test(lines[i].trim())
    ) {
      mainContentEnd = i;
      break;
    }
  }

  // Walk lines and group them into [lesson] -> [topic] -> raw line buckets.
  const lessons = [];
  const lessonMap = new Map();
  let currentLesson = null;
  let currentTopic = null;
  // Lines for the active container (lesson intro or topic body).
  let buffer = [];

  function ensureLesson(id, title) {
    if (lessonMap.has(id)) {
      const l = lessonMap.get(id);
      if (
        title &&
        !/^Summary/i.test(title) &&
        (!l.title || /^Summary/i.test(l.title))
      ) {
        l.title = title;
      }
      return l;
    }
    const lesson = {
      id,
      title: title || "",
      introBlocks: [],
      summaryBlocks: [],
      topics: [],
      _introLines: [],
      _summaryLines: [],
    };
    lessonMap.set(id, lesson);
    lessons.push(lesson);
    return lesson;
  }

  function flushBuffer() {
    if (buffer.length === 0) return;
    if (!currentLesson) {
      // Not yet inside any lesson — discard anything accumulated (front matter, TOC, preface).
      buffer = [];
      return;
    }
    if (currentTopic) {
      currentTopic._lines.push(...buffer);
    } else {
      // If the lesson already has topics, this is summary content; otherwise it's intro.
      if (currentLesson.topics.length > 0) {
        currentLesson._summaryLines.push(...buffer);
      } else {
        currentLesson._introLines.push(...buffer);
      }
    }
    buffer = [];
  }

  for (let i = 0; i < mainContentEnd; i++) {
    const line = lines[i];

    if (isPageFooter(line)) continue;

    const trimmed = cleanText(line).trim();

    const lessonM = trimmed.match(LESSON_RE);
    if (lessonM) {
      flushBuffer();
      // Title is on the following non-empty lines.
      const titleParts = [];
      let j = i + 1;
      while (j < mainContentEnd) {
        if (isPageFooter(lines[j])) {
          j++;
          continue;
        }
        const t = cleanText(lines[j]).trim();
        if (
          t === "" ||
          /^Lesson\s+\d+/.test(t) ||
          /^Topic\s+\d+[A-Z]/.test(t) ||
          /^LESSON INTRODUCTION$/i.test(t) ||
          /^Lesson Objectives$/i.test(t) ||
          /^EXAM OBJECTIVES COVERED$/i.test(t) ||
          /^Summary$/i.test(t)
        )
          break;
        titleParts.push(t);
        j++;
        if (titleParts.length >= 4) break;
      }
      const title = titleParts.join(" ").replace(/\s+/g, " ").trim();
      currentLesson = ensureLesson(parseInt(lessonM[1], 10), title);
      currentTopic = null;
      i = j - 1;
      continue;
    }

    const topicM = trimmed.match(TOPIC_RE);
    if (topicM && currentLesson) {
      flushBuffer();
      const titleParts = [];
      let j = i + 1;
      while (j < mainContentEnd) {
        if (isPageFooter(lines[j])) {
          j++;
          continue;
        }
        const t = cleanText(lines[j]).trim();
        if (
          t === "" ||
          /^Lesson\s+\d+/.test(t) ||
          /^Topic\s+\d+[A-Z]/.test(t) ||
          /^EXAM OBJECTIVES COVERED$/i.test(t)
        )
          break;
        titleParts.push(t);
        j++;
        if (titleParts.length >= 4) break;
      }
      const title = titleParts.join(" ").replace(/\s+/g, " ").trim();
      const existing = currentLesson.topics.find(
        (t) => t.id === `${topicM[1]}${topicM[2]}`
      );
      if (existing) {
        currentTopic = existing;
      } else {
        currentTopic = {
          id: `${topicM[1]}${topicM[2]}`,
          title,
          blocks: [],
          _lines: [],
        };
        currentLesson.topics.push(currentTopic);
      }
      i = j - 1;
      continue;
    }

    buffer.push(line);
  }
  flushBuffer();

  // Build structured blocks for each container.
  for (const lesson of lessons) {
    lesson.introBlocks = buildBlocks(lesson._introLines);
    lesson.summaryBlocks = buildBlocks(lesson._summaryLines);
    delete lesson._introLines;
    delete lesson._summaryLines;
    for (const topic of lesson.topics) {
      topic.blocks = buildBlocks(topic._lines);
      delete topic._lines;
    }
    // Drop topics that ended up with no content (rare).
    lesson.topics = lesson.topics.filter((t) => t.blocks.length > 0);
    lesson.topics.sort((a, b) => a.id.localeCompare(b.id));
  }

  lessons.sort((a, b) => a.id - b.id);

  return lessons.filter(
    (l) =>
      l.id > 0 &&
      (l.introBlocks.length > 0 ||
        l.summaryBlocks.length > 0 ||
        l.topics.length > 0)
  );
}

// ---------------------------------------------------------------------------
// Glossary parsing (unchanged behaviour, lifted from the previous parser).
// ---------------------------------------------------------------------------
function parseGlossary(text) {
  const lines = text.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length - 3; i++) {
    if (
      /^acceptable use policy/.test(lines[i].trim()) &&
      /\(AUP\)/.test(lines[i].trim())
    ) {
      start = i;
      break;
    }
  }
  if (start < 0) return [];

  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (/^SY0-701_Index_/.test(lines[i])) {
      end = i;
      break;
    }
  }

  const cleaned = [];
  for (let i = start; i < end; i++) {
    if (isPageFooter(lines[i])) continue;
    const t = cleanText(lines[i]).trim();
    if (t === "") continue;
    cleaned.push(t);
  }

  const entries = [];
  let buffer = [];
  let prevText = "";

  function flush() {
    if (buffer.length === 0) return;
    const text = buffer.join(" ").replace(/\s+/g, " ").trim();
    const m = text.match(
      /^([a-z][a-zA-Z0-9 ()\-/'+,&.]{1,80}?)\s+([A-Z][A-Za-z].*)$/
    );
    if (m) {
      const term = m[1].trim();
      const def = m[2].trim();
      if (term && def && term.length < 100 && def.length > 5) {
        entries.push({ term, definition: def });
      }
    }
    buffer = [];
  }

  for (const line of cleaned) {
    if (/^[A-Z]$/.test(line)) continue;

    const startsLowercase = /^[a-z]/.test(line);
    const hasTermDefShape = /^[a-z][a-zA-Z0-9 .()\-/'+,&]{0,80}\s+[A-Z]([a-z]|$|\s)/.test(line);
    const prevEnded = prevText === "" || /[.!?]\s*$/.test(prevText.trim());

    const isNewEntry = startsLowercase && hasTermDefShape && prevEnded;

    if (isNewEntry) {
      flush();
      prevText = "";
      buffer.push(line);
      prevText = line;
    } else {
      buffer.push(line);
      prevText = (prevText + " " + line).slice(-2000);
    }
  }
  flush();

  return entries;
}

// ---------------------------------------------------------------------------
function main() {
  const text = fs.readFileSync(INPUT, "utf8");

  const lessons = parseNotes(text);
  console.log(`Parsed ${lessons.length} lessons`);
  for (const l of lessons) {
    let total = l.introBlocks.length + l.summaryBlocks.length;
    let headings = 0;
    let lists = 0;
    let callouts = 0;
    for (const t of l.topics) {
      total += t.blocks.length;
      headings += t.blocks.filter((b) => b.type === "heading").length;
      lists += t.blocks.filter((b) => b.type === "list").length;
      callouts += t.blocks.filter((b) => b.type === "callout").length;
    }
    console.log(
      `  Lesson ${l.id}: "${l.title.slice(0, 60)}" — ${l.topics.length} topics, ${total} blocks (${headings} headings, ${lists} lists, ${callouts} callouts)`
    );
  }

  fs.mkdirSync(path.dirname(OUTPUT_NOTES), { recursive: true });
  fs.writeFileSync(OUTPUT_NOTES, JSON.stringify(lessons, null, 2));
  console.log(`Wrote ${OUTPUT_NOTES}`);

  const glossary = parseGlossary(text);
  console.log(`Parsed ${glossary.length} glossary entries`);
  fs.writeFileSync(OUTPUT_GLOSSARY, JSON.stringify(glossary, null, 2));
  console.log(`Wrote ${OUTPUT_GLOSSARY}`);
}

main();
