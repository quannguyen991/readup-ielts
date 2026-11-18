// Hồ sơ CPU khi chuyển tab: node scripts/dev/profile-switch.mjs [baseUrl] [tab1,tab2,...]
// Làm nóng từng trang một lần (bỏ chi phí biên dịch lần đầu của bản dev), rồi ghi CPU profile lúc bấm chuyển tab
// và in ra các hàm tốn thời gian nhất (thời gian riêng, mili giây), gộp theo tệp.
import { chromium } from 'file:///D:/Claude/fb-group-poster/node_modules/playwright-core/index.mjs';

const base = process.argv[2] || 'http://localhost:8082';
const tabs = (process.argv[3] || 'IELTS,SAT,Hôm nay,IELTS,SAT').split(',');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const cdp = await page.context().newCDPSession(page);
await page.goto(base + '/cute-home', { waitUntil: 'load', timeout: 480000 });
await page.waitForTimeout(6000);

const click = async (name) => {
  // Mục thanh bên: phần tử thấy được nằm trong 260px bên trái.
  const c = page.getByText(name, { exact: true });
  const n = await c.count();
  for (let i = 0; i < n; i++) {
    const bb = await c.nth(i).boundingBox();
    if (bb && bb.x < 260 && bb.width > 0 && bb.height > 0) return c.nth(i).click({ timeout: 8000 });
  }
  throw new Error('không thấy mục ' + name);
};
// làm nóng
for (const t of new Set(tabs)) {
  await click(t).catch((e) => console.log('warm fail', t, String(e).slice(0, 60)));
  await page.waitForTimeout(3500);
}
await click('Hôm nay').catch(() => {});
await page.waitForTimeout(2500);

await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await cdp.send('Profiler.start');
const t0 = Date.now();
for (const t of tabs) {
  await click(t).catch((e) => console.log('click fail', t, String(e).slice(0, 60)));
  await page.waitForTimeout(1500);
}
const { profile } = await cdp.send('Profiler.stop');
const wall = Date.now() - t0;

const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + (profile.timeDeltas[i] || 0)));
const byFn = new Map();
const byFile = new Map();
let busy = 0;
for (const [id, us] of self) {
  const n = nodes.get(id);
  const fn = n.callFrame.functionName || '(anonymous)';
  if (['(idle)', '(program)', '(garbage collector)'].includes(fn)) {
    if (fn === '(garbage collector)') byFn.set('(GC)', (byFn.get('(GC)') || 0) + us);
    continue;
  }
  busy += us;
  const file = (n.callFrame.url || '').replace(/^.*\/(node_modules\/|src\/|app\/)/, '$1').split('?')[0].slice(-70) || '(native)';
  const key = `${fn} @ ${file}:${n.callFrame.lineNumber}`;
  byFn.set(key, (byFn.get(key) || 0) + us);
  byFile.set(file, (byFile.get(file) || 0) + us);
}
const top = (m, k) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
console.log(`tab: ${tabs.join(' > ')}  | wall ${wall} ms | CPU JS ${(busy / 1000).toFixed(0)} ms`);
console.log('\n--- theo tệp (ms) ---');
for (const [k, v] of top(byFile, 14)) console.log(String(Math.round(v / 1000)).padStart(6), k);
console.log('\n--- theo hàm (ms) ---');
for (const [k, v] of top(byFn, 22)) console.log(String(Math.round(v / 1000)).padStart(6), k);
await browser.close();
