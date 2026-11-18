// Xuất bìa các bộ sách (books.json) thành webp 2x vào public/books/vocab-books/<id>.webp.
// Chạy: node scripts/vocab/book-covers/render.mjs [id ...]   (không có id = tất cả)
import { chromium } from 'file:///D:/Claude/fb-group-poster/node_modules/playwright-core/index.mjs';
import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const outDir = resolve(root, 'public/books/vocab-books');
mkdirSync(outDir, { recursive: true });

const all = JSON.parse(readFileSync(resolve(here, 'books.json'), 'utf8')).map((b) => b.id);
const only = process.argv.slice(2);
const ids = only.length ? only : all;

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 300, height: 380 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));

for (const id of ids) {
  await page.goto(pathToFileURL(resolve(here, 'gen.html')).href + `?id=${encodeURIComponent(id)}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.waitForTimeout(350);
  const png = await page.locator('#cover').screenshot({ omitBackground: true });
  await sharp(png).webp({ quality: 90, alphaQuality: 100 }).toFile(resolve(outDir, `${id}.webp`));
  console.log('ok', id);
}
await browser.close();
if (errs.length) console.log('page errors:', [...new Set(errs)].join('\n'));
