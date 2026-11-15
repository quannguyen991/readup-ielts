// Thời gian render theo từng component khi chuyển tab (bản dev của React): node scripts/dev/profile-react.mjs [baseUrl] [tabs,phẩy]
// Móc vào __REACT_DEVTOOLS_GLOBAL_HOOK__, mỗi lần commit cộng "thời gian riêng" (actualDuration trừ con) của các fiber vừa render.
import { chromium } from 'file:///D:/Claude/fb-group-poster/node_modules/playwright-core/index.mjs';

const base = process.argv[2] || 'http://localhost:8083';
const tabs = (process.argv[3] || 'IELTS,SAT,Hôm nay,IELTS,SAT').split(',');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.addInitScript(() => {
  window.__self = {};
  window.__count = {};
  window.__commits = 0;
  window.__last = 0;
  window.__rec = false;
  const nameOf = (t) => (typeof t === 'string' ? t : t && (t.displayName || t.name || (t.render && (t.render.displayName || t.render.name)) || (t.type && (t.type.displayName || t.type.name)))) || '?';
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject(r) { this.renderers.set(1, r); return 1; },
    onCommitFiberRoot(id, root) {
      const since = window.__last;
      window.__last = performance.now();
      if (!window.__rec) return;
      window.__commits++;
      const stack = [root.current];
      while (stack.length) {
        const f = stack.pop();
        if (f.sibling) stack.push(f.sibling);
        if (f.child) stack.push(f.child);
        if (!(f.actualStartTime >= since) || !(f.actualDuration > 0)) continue;
        let ch = 0;
        for (let c = f.child; c; c = c.sibling) ch += c.actualDuration || 0;
        const self = f.actualDuration - ch;
        const n = nameOf(f.type);
        window.__count[n] = (window.__count[n] || 0) + 1;
        if (self > 0.05) window.__self[n] = (window.__self[n] || 0) + self;
      }
    },
    onCommitFiberUnmount() {},
    checkDCE() {},
    onPostCommitFiberRoot() {},
  };
});
await page.goto(base + '/cute-home', { waitUntil: 'load', timeout: 480000 });
await page.waitForTimeout(6000);
const click = async (name) => {
  const c = page.getByText(name, { exact: true });
  const n = await c.count();
  for (let i = 0; i < n; i++) {
    const bb = await c.nth(i).boundingBox();
    if (bb && bb.x < 260 && bb.width > 0 && bb.height > 0) return c.nth(i).click({ timeout: 8000 });
  }
  throw new Error('không thấy mục ' + name);
};
for (const t of new Set(tabs)) {
  await click(t).catch(() => {});
  await page.waitForTimeout(3500);
}
await click('Hôm nay').catch(() => {});
await page.waitForTimeout(2500);
await page.evaluate(() => { window.__rec = true; window.__self = {}; window.__count = {}; window.__commits = 0; });
for (const t of tabs) {
  await click(t).catch((e) => console.log('click fail', t));
  await page.waitForTimeout(1500);
}
const r = await page.evaluate(() => ({ commits: window.__commits, self: window.__self, count: window.__count }));
const rows = Object.entries(r.self).sort((a, b) => b[1] - a[1]).slice(0, 28);
const total = Object.values(r.self).reduce((a, b) => a + b, 0);
console.log(`chuyển ${tabs.join(' > ')} | commits ${r.commits} | render riêng ${total.toFixed(0)} ms`);
console.log('ms'.padStart(6), 'lần'.padStart(6), 'component');
for (const [n, v] of rows) console.log(v.toFixed(1).padStart(6), String(r.count[n]).padStart(6), n);
await browser.close();
