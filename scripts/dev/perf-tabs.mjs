// Đo độ mượt: node scripts/dev/perf-tabs.mjs [baseUrl=http://localhost:8082] [routes,phẩy] [tabs,phẩy]
//  1) Mỗi trang đứng yên 3 giây: số khung/giây thật, và CPU luồng chính tốn bao nhiêu % cho script, tính bố cục, tính style.
//  2) Chuyển tab bằng cách bấm thanh bên: thời gian từ lúc bấm tới khi đổi địa chỉ, tới khi vẽ xong khung kế, và tổng thời gian chặn.
import { chromium } from 'file:///D:/Claude/fb-group-poster/node_modules/playwright-core/index.mjs';

const base = process.argv[2] || 'http://localhost:8082';
const routes = (process.argv[3] || '/cute-home,/practice,/sat,/leaderboard,/progress,/lo-trinh-hoc,/vocabulary').split(',');
const tabs = (process.argv[4] || 'IELTS,SAT,Từ vựng,Quest,Hôm nay,IELTS,SAT').split(',');

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');

const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
const installProbe = () =>
  page.evaluate(() => {
    window.__lt = [];
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({ entryTypes: ['longtask'] });
    } catch {}
    window.__fps = (ms) =>
      new Promise((res) => {
        let n = 0, worst = 0, last = performance.now();
        const t0 = last;
        (function f(t) {
          n++;
          worst = Math.max(worst, t - last);
          last = t;
          if (t - t0 < ms) requestAnimationFrame(f);
          else res({ fps: Math.round((n / (t - t0)) * 1000), worst: Math.round(worst) });
        })(t0);
      });
  });

console.log('=== TRANG ĐỨNG YÊN (3 giây) ===');
console.log('route'.padEnd(18), 'fps'.padStart(4), 'worst'.padStart(6), 'script%'.padStart(8), 'layout%'.padStart(8), 'style%'.padStart(7), 'task%'.padStart(6));
for (const r of routes) {
  await page.goto(base + r, { waitUntil: 'load', timeout: 480000 });
  await page.waitForTimeout(6000);
  await installProbe();
  const m0 = await metrics();
  const f = await page.evaluate(() => window.__fps(3000));
  const m1 = await metrics();
  const d = (k) => (((m1[k] ?? 0) - (m0[k] ?? 0)) / 3) * 100;
  console.log(r.padEnd(18), String(f.fps).padStart(4), String(f.worst).padStart(6), d('ScriptDuration').toFixed(0).padStart(8), d('LayoutDuration').toFixed(0).padStart(8), d('RecalcStyleDuration').toFixed(0).padStart(7), d('TaskDuration').toFixed(0).padStart(6));
}

console.log('\n=== CHUYỂN TAB (bấm thanh bên) ===');
await page.goto(base + '/cute-home', { waitUntil: 'load', timeout: 480000 });
await page.waitForTimeout(6000);
await installProbe();
console.log('tab'.padEnd(12), 'url'.padStart(6), 'paint'.padStart(7), 'block'.padStart(7), 'longTasks');
for (const name of tabs) {
  const before = await page.url();
  const cands = page.getByText(name, { exact: true });
  let target = null;
  for (let i = 0; i < (await cands.count()); i++) {
    const bb = await cands.nth(i).boundingBox();
    if (bb && bb.x < 260 && bb.width > 0 && bb.height > 0) { target = cands.nth(i); break; }
  }
  if (!target) { console.log('không thấy', name); continue; }
  await page.evaluate(() => { window.__lt.length = 0; window.__t0 = performance.now(); });
  await target.click({ timeout: 10000 }).catch((e) => console.log('click fail', name, String(e).slice(0, 80)));
  const t = await page.evaluate(
    () =>
      new Promise((res) => {
        const start = window.__t0;
        let urlAt = null;
        const loc0 = location.pathname;
        (function poll() {
          if (urlAt === null && location.pathname !== loc0) urlAt = performance.now() - start;
          if (performance.now() - start > 4000 || (urlAt !== null && performance.now() - start > urlAt + 600)) {
            requestAnimationFrame(() => requestAnimationFrame(() => res({ urlAt: urlAt === null ? -1 : Math.round(urlAt), paint: Math.round(performance.now() - start) })));
          } else setTimeout(poll, 16);
        })();
      }),
  );
  await page.waitForTimeout(400);
  const lt = await page.evaluate(() => window.__lt.map((x) => Math.round(x)));
  console.log(name.padEnd(12), String(t.urlAt).padStart(6), '-'.padStart(7), String(lt.reduce((a, b) => a + b, 0)).padStart(7), JSON.stringify(lt), '->', (await page.url()).replace(base, ''));
}
await browser.close();
