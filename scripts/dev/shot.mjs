// Chụp trang bằng Chrome headless: node scripts/dev/shot.mjs <url> <out.png> [width=1440] [height=900] [full=0] [waitMs=2500]
import { chromium } from 'file:///D:/Claude/fb-group-poster/node_modules/playwright-core/index.mjs';
const [url, out, w = '1440', h = '900', full = '0', wait = '2500'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 200)));
await page.goto(url, { waitUntil: 'load', timeout: 480000 });
await page.waitForTimeout(+wait);
await page.screenshot({ path: out, fullPage: full === '1' });
if (errs.length) console.log('console errors:\n' + [...new Set(errs)].slice(0, 8).join('\n'));
await browser.close();
console.log('ok', out);
