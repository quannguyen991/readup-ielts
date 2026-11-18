// Kiểm phát âm trên trình duyệt thật: node scripts/dev/audio-check.mjs <url có ?audioDebug=1> [waitMs=12000]
// In ra các sự kiện [vocab-audio] (playing/ended/error) kèm đường dẫn nguồn (blob: = đã có trong bộ đệm RAM).
import { chromium } from 'file:///D:/Claude/fb-group-poster/node_modules/playwright-core/index.mjs';
const [url, wait = '12000'] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const t0 = Date.now();
const lines = [];
page.on('console', (m) => {
  const t = m.text();
  if (t.includes('[vocab-audio]')) lines.push(`${((Date.now() - t0) / 1000).toFixed(2)}s ${t.replace('[vocab-audio] ', '').slice(0, 220)}`);
});
const reqs = [];
page.on('request', (r) => { if (/\/audio\//.test(r.url())) reqs.push(r.url().replace(/^https?:\/\/[^/]+/, '')); });
await page.goto(url, { waitUntil: 'load', timeout: 480000 });
await page.mouse.click(600, 400).catch(() => undefined);
await page.waitForTimeout(+wait);
console.log(lines.join('\n') || '(không có sự kiện phát)');
console.log('audio requests:', reqs.length);
console.log(reqs.slice(0, 12).join('\n'));
await browser.close();
