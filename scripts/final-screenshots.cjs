#!/usr/bin/env node
/* eslint-disable */
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE || "http://localhost:5174";
const OUT_DIR = path.resolve(__dirname, "..", "data", "screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const pages = [
    ["/", "home.png"],
    ["/notes/3", "lesson-3.png"],
    ["/glossary", "glossary.png"],
    ["/exam", "exam-setup.png"],
    ["/progress", "progress.png"],
  ];

  for (const [route, file] of pages) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    const out = path.join(OUT_DIR, file);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  ${route} -> ${out}`);
  }

  // Mobile pass
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "light" },
  ]);
  const mobilePages = [
    ["/", "home-mobile.png"],
    ["/notes", "notes-mobile.png"],
    ["/notes/3", "lesson-3-mobile.png"],
    ["/practice", "practice-mobile.png"],
  ];
  for (const [route, file] of mobilePages) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    const out = path.join(OUT_DIR, file);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  ${route} (mobile) -> ${out}`);
  }

  await browser.close();
})();
