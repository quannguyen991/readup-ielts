// Đếm độ nặng DOM của từng trang: node scripts/dev/dom-size.mjs [baseUrl] [routes]
import { chromium } from 'file:///D:/Claude/fb-group-poster/node_modules/playwright-core/index.mjs';
const base = process.argv[2] || 'http://localhost:8083';
const routes = (process.argv[3] || '/cute-home,/practice,/sat,/leaderboard,/progress,/lo-trinh-hoc,/vocabulary,/quest').split(',');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
console.log('route'.padEnd(18), 'nodes'.padStart(6), 'imgs'.padStart(5), 'svg'.padStart(4), 'anim'.padStart(5), 'filter'.padStart(6), 'shadow'.padStart(6), 'bgImg'.padStart(5));
for (const r of routes) {
  await page.goto(base + r, { waitUntil: 'load', timeout: 480000 });
  await page.waitForTimeout(5000);
  const m = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    let anim = 0, filter = 0, shadow = 0, bg = 0;
    for (const e of all) {
      const cs = getComputedStyle(e);
      if (cs.animationName && cs.animationName !== 'none') anim++;
      if (cs.filter && cs.filter !== 'none') filter++;
      if (cs.boxShadow && cs.boxShadow !== 'none') shadow++;
      if (cs.backgroundImage && cs.backgroundImage !== 'none') bg++;
    }
    return { nodes: all.length, imgs: document.images.length, svg: document.querySelectorAll('svg').length, anim, filter, shadow, bg };
  });
  console.log(r.padEnd(18), String(m.nodes).padStart(6), String(m.imgs).padStart(5), String(m.svg).padStart(4), String(m.anim).padStart(5), String(m.filter).padStart(6), String(m.shadow).padStart(6), String(m.bg).padStart(5));
}
await browser.close();
