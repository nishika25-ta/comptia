#!/usr/bin/env node
/* eslint-disable */
// Interactive smoke test: simulate answering a question and taking an exam.

const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:5173";

async function takeScreenshot(page, filename) {
  const path = require("path");
  const out = path.resolve(__dirname, "..", "data", "screenshots", filename);
  require("fs").mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: true });
  console.log(`  screenshot: ${out}`);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));

  // Test 1: Practice page - select an option and submit
  console.log("\n--- Practice flow ---");
  await page.goto(`${BASE}/practice`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));

  // Click first option button (button with letter A inside QuestionCard)
  const pickedFirst = await page.evaluate(() => {
    const btns = Array.from(
      document.querySelectorAll("button")
    ).filter((b) => /^[A-F]\s+/.test(b.innerText.trim()) || b.innerText.startsWith("A"));
    if (btns.length > 0) {
      btns[0].click();
      return btns[0].innerText.slice(0, 100);
    }
    return null;
  });
  console.log(`  Picked first option: ${pickedFirst}`);

  // Click Submit
  const submitClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const submit = btns.find((b) => b.innerText.trim() === "Submit");
    if (submit) {
      submit.click();
      return true;
    }
    return false;
  });
  console.log(`  Clicked Submit: ${submitClicked}`);
  await new Promise((r) => setTimeout(r, 800));

  // After submit, check for "Correct answer:" text
  const text = await page.evaluate(() => document.body.innerText);
  const showsAnswer = text.includes("Correct answer:");
  console.log(`  Shows correct answer after submit: ${showsAnswer}`);
  await takeScreenshot(page, "practice-answered.png");

  // Click Next
  const nextClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const next = btns.find((b) => b.innerText.trim().startsWith("Next"));
    if (next) {
      next.click();
      return true;
    }
    return false;
  });
  console.log(`  Clicked Next: ${nextClicked}`);

  // Test 2: Exam setup
  console.log("\n--- Exam setup ---");
  await page.goto(`${BASE}/exam`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));

  // Click "Quick check" preset
  const presetPicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const preset = btns.find((b) => b.innerText.includes("Quick check"));
    if (preset) {
      preset.click();
      return true;
    }
    return false;
  });
  console.log(`  Picked Quick check preset: ${presetPicked}`);

  // Click "Start exam"
  const startClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const start = btns.find((b) => b.innerText.trim().includes("Start exam"));
    if (start) {
      start.click();
      return true;
    }
    return false;
  });
  console.log(`  Clicked Start exam: ${startClicked}`);
  await new Promise((r) => setTimeout(r, 1500));

  // Should be on /exam/run
  const examUrl = page.url();
  console.log(`  Current URL: ${examUrl}`);
  const examText = await page.evaluate(() => document.body.innerText);
  console.log(`  Shows timer: ${/\d+:\d+/.test(examText)}`);
  console.log(`  Shows question navigator: ${examText.includes("Question navigator")}`);
  await takeScreenshot(page, "exam-run.png");

  // Answer a few questions and submit
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const opts = btns.filter((b) => /^[A-F]$/.test(b.innerText.trim().split(/\s+/)[0]) && b.innerText.length > 5);
      if (opts.length > 0) opts[0].click();
    });
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const next = btns.find((b) => b.innerText.trim().startsWith("Next"));
      if (next) next.click();
    });
    await new Promise((r) => setTimeout(r, 300));
  }

  // Submit exam (handle confirm)
  page.on("dialog", async (d) => {
    await d.accept();
  });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const submit = btns.find((b) => b.innerText.trim().includes("Submit exam"));
    if (submit) submit.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const reviewUrl = page.url();
  console.log(`  After submit URL: ${reviewUrl}`);
  const reviewText = await page.evaluate(() => document.body.innerText);
  console.log(`  Shows score: ${/\d+%/.test(reviewText)}`);
  console.log(`  Shows breakdown: ${reviewText.includes("Breakdown")}`);
  await takeScreenshot(page, "exam-review.png");

  // Test 3: Notes search
  console.log("\n--- Notes search ---");
  await page.goto(`${BASE}/notes`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  await page.type('input[type="search"]', "phishing");
  await new Promise((r) => setTimeout(r, 500));
  const searchText = await page.evaluate(() => document.body.innerText);
  console.log(`  Search results visible: ${searchText.includes("matches")}`);
  await takeScreenshot(page, "notes-search.png");

  await browser.close();

  console.log(`\nTotal JS errors: ${errors.length}`);
  if (errors.length) {
    for (const e of errors.slice(0, 5)) console.log(`  ${e.slice(0, 200)}`);
  }
  process.exit(errors.length > 0 ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
