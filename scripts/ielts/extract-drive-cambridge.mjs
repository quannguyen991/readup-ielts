import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const privateDir = path.join(root, '.local-private', 'ielts-ocr');
const files = [
  ...[1, 2, 3, 4].flatMap((number) => [`cambridge20-reading-test${number}.pdf`, `cambridge20-listening-test${number}.pdf`]),
];

for (const file of files) {
  const data = new Uint8Array(await readFile(path.join(privateDir, file)));
  const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => 'str' in item ? item.str : '').filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    pages.push({ page: pageNumber, text });
  }
  const output = path.join(privateDir, `${path.parse(file).name}.pages.json`);
  await writeFile(output, JSON.stringify({ file, pages }), 'utf8');
  console.log(`${file}: ${pages.length} pages, ${pages.filter((page) => page.text.length > 30).length} text pages`);
}
