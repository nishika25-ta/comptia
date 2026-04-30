#!/usr/bin/env node
/* eslint-disable */
// Quick headless smoke test: load every page, log console errors, capture page text.

const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE || "http://localhost:5174";

async function checkPage(page, path, expectedTexts = []) {
  const errors = [];
  const consoleListener = (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  };
  const pageErrorListener = (err) => errors.push(`PAGE ERROR: ${err.message}`);
  page.on("console", consoleListener);
  page.on("pageerror", pageErrorListener);

  const url = `${BASE}${path}`;
  await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));

  const text = await page.evaluate(() => document.body.innerText);
  const titleOk = expectedTexts.every((t) => text.includes(t));

  page.off("console", consoleListener);
  page.off("pageerror", pageErrorListener);

  console.log(`\n=== ${path} ===`);
  console.log(`  textLength: ${text.length}, errors: ${errors.length}`);
  if (errors.length) {
    for (const e of errors.slice(0, 3)) console.log(`  ERROR: ${e.slice(0, 200)}`);
  }
  if (expectedTexts.length) {
    console.log(`  expectedTexts present: ${titleOk}`);
    if (!titleOk) {
      for (const t of expectedTexts) {
        if (!text.includes(t)) console.log(`    MISSING: "${t}"`);
      }
    }
  }
  return { errors, text, titleOk };
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  let totalErrors = 0;

  const checks = [
    {
      path: "/",
      expected: [
        "Security+ Sandbox",
        "Master the Security+",
        "Practice questions",
      ],
    },
    { path: "/practice", expected: ["Practice mode", "Pool size"] },
    { path: "/exam", expected: ["Exam mode", "Presets"] },
    {
      path: "/notes",
      expected: ["Study Notes", "Summarize Fundamental"],
    },
    {
      path: "/notes/1",
      expected: ["Summarize Fundamental", "Information Security"],
    },
    {
      path: "/notes/8",
      expected: ["Vulnerability"],
    },
    { path: "/glossary", expected: ["Security+ glossary", "access badge"] },
    { path: "/progress", expected: ["study dashboard"] },
  ];

  for (const c of checks) {
    const r = await checkPage(page, c.path, c.expected);
    if (r.errors.length) totalErrors += r.errors.length;
    if (!r.titleOk) totalErrors += 1;
  }

  await browser.close();

  console.log(`\nTotal issues: ${totalErrors}`);
  process.exit(totalErrors > 0 ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
