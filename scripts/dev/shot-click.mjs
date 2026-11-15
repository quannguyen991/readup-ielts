// Mở trang, bấm phần tử có chữ cho trước, rồi chụp: node scripts/dev/shot-click.mjs <url> <out.png> "<chữ cần bấm>" [width=1440] [height=1000] [waitMs=4000]
import { chromium } from 'file:///D:/Claude/fb-group-poster/node_modules/playwright-core/index.mjs';
const [url, out, label, w = '1440', h = '1000', wait = '4000'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(url, { waitUntil: 'load', timeout: 480000 });
await page.waitForTimeout(+wait);
await page.getByText(label, { exact: true }).first().click({ timeout: 20000 }).catch((e) => console.log('không bấm được:', String(e).slice(0, 80)));
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
await browser.close();
console.log('ok', out);
