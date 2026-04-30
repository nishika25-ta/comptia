#!/usr/bin/env node
/* eslint-disable */
// Extract raw text from a PDF using pdf-parse and write to disk.
// Usage: node scripts/extract-pdf-text.cjs <input.pdf> <output.txt>

const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) {
    console.error("Usage: node extract-pdf-text.cjs <input.pdf> <output.txt>");
    process.exit(1);
  }

  const absIn = path.resolve(inputPath);
  const absOut = path.resolve(outputPath);

  console.log(`Reading: ${absIn}`);
  const dataBuffer = fs.readFileSync(absIn);

  const data = await pdf(dataBuffer);

  console.log(`Pages: ${data.numpages}`);
  console.log(`Text length: ${data.text.length}`);

  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  fs.writeFileSync(absOut, data.text, "utf8");

  console.log(`Wrote: ${absOut}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
