#!/usr/bin/env node
/* eslint-disable */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE || "http://localhost:5174";
const OUT_DIR = path.resolve(__dirname, "..", "screenshots");

async function shoot(page, urlPath, fileName, opts = {}) {
  await page.goto(`${BASE}${urlPath}`, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, opts.delay || 800));
  await page.screenshot({
    path: path.join(OUT_DIR, fileName),
    fullPage: opts.fullPage !== false,
  });
  console.log(`  Saved ${fileName}`);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    // Light mode, desktop
    let page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "light" },
    ]);
    await page.evaluateOnNewDocument(() =>
      localStorage.setItem("sx-theme", "light")
    );
    console.log("Light desktop ...");
    await shoot(page, "/", "01-home-light.png");
    await shoot(page, "/notes", "02-notes-light.png");
    await shoot(page, "/notes/1", "03-lesson-light.png");
    await shoot(page, "/practice", "04-practice-light.png");
    await shoot(page, "/exam", "05-exam-light.png");
    await shoot(page, "/glossary", "06-glossary-light.png");
    await shoot(page, "/progress", "07-progress-light.png");
    await page.close();

    // Dark mode, desktop
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluateOnNewDocument(() =>
      localStorage.setItem("sx-theme", "dark")
    );
    console.log("Dark desktop ...");
    await shoot(page, "/", "11-home-dark.png");
    await shoot(page, "/notes/1", "12-lesson-dark.png");
    await shoot(page, "/practice", "13-practice-dark.png");
    await page.close();

    // Mobile, light
    page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "light" },
    ]);
    await page.evaluateOnNewDocument(() =>
      localStorage.setItem("sx-theme", "light")
    );
    console.log("Mobile ...");
    await shoot(page, "/", "21-home-mobile.png");
    await shoot(page, "/notes/1", "22-lesson-mobile.png");
    await page.close();
  } finally {
    await browser.close();
  }
  console.log("Done.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
