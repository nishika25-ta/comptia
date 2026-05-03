#!/usr/bin/env node
/**
 * Bleed repair: split glued explanations when the next question stem begins
 * after `. ` or `? ` (CertIQ PDF concatenation artifacts).
 */
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "..", "src", "data", "questions2.json");

/** First words of the following question stem after an explanation paragraph */
const STARTERS = [
  "Which of the following",
  "An employee clicked",
  "An employee receives",
  "An enterprise is trying",
  "A company prevented",
  "A company is ",
  "A company wants ",
  "A company recently ",
  "A company's ",
  "Several employees received",
  "An organization's internet-facing",
  "An organization ",
  "The Chief Executive Officer",
  "The security team",
  "A data administrator is configuring",
  "A systems administrator ",
  "A security administrator ",
  "A penetration tester ",
  "A technician ",
  "An administrator ",
  "An analyst ",
  "An attacker ",
  "After observing ",
  "After reviewing ",
  "During ",
  "While troubleshooting ",
  "Users ",
  "Employees ",
];

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findBleedCut(explanation) {
  if (!explanation || explanation.length < 90) return -1;
  let cut = -1;
  for (const st of STARTERS) {
    for (const sep of ["\\?\\s+", "\\.\\s+"]) {
      const re = new RegExp(`${sep}(?=${esc(st)})`, "i");
      const m = explanation.match(re);
      if (m && m.index !== undefined && m.index >= 65) {
        const pos = m.index + 1;
        if (cut === -1 || pos < cut) cut = pos;
      }
    }
  }
  return cut;
}

function cleanStem(questionText) {
  let t = questionText.replace(/\s+/g, " ").trim();
  const m = t.match(
    /\?\s+(?=Which of the following[^\n?!]{5,}\?\s*$|\([^)]*Choose two[^)]*\)\s*$)/i
  );
  if (m && m.index !== undefined && m.index > 40) {
    t = t.slice(m.index + 1).trim();
  }
  return t;
}

function normalizeSpaces(s) {
  return s.replace(/\s+/g, " ").trim();
}

function auditAnswers(q) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  const ansSet = new Set(q.answer.map((x) => x.toUpperCase()));
  const optsLen = q.options.length;
  for (const a of ansSet) {
    const idx = letters.indexOf(a);
    if (idx >= 0 && idx >= optsLen)
      return { ok: false, reason: `answer ${a} vs ${optsLen} options` };
  }
  return { ok: true };
}

function main() {
  const qs = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const report = {
    bleedShifts: 0,
    stemsTrimmed: 0,
    answerIssues: [],
    shortExpl: [],
  };

  for (const q of qs) {
    const before = normalizeSpaces(q.questionText);
    q.questionText = normalizeSpaces(cleanStem(q.questionText));
    if (q.questionText !== before) report.stemsTrimmed++;
  }

  let pending = "";
  for (let i = 0; i < qs.length; i++) {
    if (pending) {
      qs[i].questionText = normalizeSpaces(pending + " " + qs[i].questionText);
      pending = "";
      report.bleedShifts++;
    }

    const ex = qs[i].explanation || "";
    const cut = findBleedCut(ex);
    let clean = ex;
    let bleed = "";
    if (cut >= 0) {
      clean = ex.slice(0, cut).trim();
      bleed = ex.slice(cut).trim().replace(/\s+/g, " ");
    }

    qs[i].explanation = normalizeSpaces(clean);

    if (qs[i].explanation.length > 0 && qs[i].explanation.length < 40)
      report.shortExpl.push(qs[i].id);

    if (bleed) pending = bleed;

    const chk = auditAnswers(qs[i]);
    if (!chk.ok) report.answerIssues.push({ id: qs[i].id, msg: chk.reason });
  }

  if (pending) {
    const last = qs[qs.length - 1];
    last.explanation = normalizeSpaces(last.explanation + " " + pending);
    report.trailingBleedMerged = true;
  }

  fs.writeFileSync(OUT, JSON.stringify(qs, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main();
