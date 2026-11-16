// Xuất bìa bộ từ Cambridge 10–21 thành ảnh webp (2x) vào public/books/cam-vocab/cam-N.webp.
// Chạy: node scripts/vocab/cam-vocab-covers/render.mjs [n ...]   (không có n = cả 12 bộ)
import { chromium } from 'file:///D:/Claude/fb-group-poster/node_modules/playwright-core/index.mjs';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const outDir = resolve(root, 'public/books/cam-vocab');
mkdirSync(outDir, { recursive: true });

const only = process.argv.slice(2).map(Number).filter(Boolean);
const books = only.length ? only : [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 300, height: 380 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));

for (const n of books) {
  await page.goto(pathToFileURL(resolve(here, 'gen.html')).href + `?n=${n}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.waitForTimeout(400);
  const png = await page.locator('#cover').screenshot({ omitBackground: true });
  const out = resolve(outDir, `cam-${n}.webp`);
  await sharp(png).webp({ quality: 90, alphaQuality: 100 }).toFile(out);
  console.log('ok', out);
}
await browser.close();
if (errs.length) console.log('page errors:', [...new Set(errs)].join('\n'));
