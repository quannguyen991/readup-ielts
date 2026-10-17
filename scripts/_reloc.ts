// @ts-nocheck
import { CITY_MAPS } from '@/data/travel/maps';
import { buildSceneWorld, footprintRect, spriteRect } from '@/components/travel/engine/scene';
import { isWalkPx } from '@/components/travel/engine/imageWorld';
const city = process.argv[2] || 'hanoi';
const m: any = (CITY_MAPS as any)[city];
const S = m.scene.sprites;
const objs: any[] = m.scene.objects;
const pois = m.pois;
const poiObj = (id: string) => objs.find((o) => o.poiId === id);
const w0 = buildSceneWorld(m);
const ONLY = process.argv[3]; const bad = pois.filter((p: any) => !isWalkPx(w0, p.door.x, p.door.y)).map((p: any) => poiObj(p.id));
// thêm các vật có cửa tới không được
import { findPathPx } from '@/components/travel/engine/imageWorld';
for (const p of pois) if (isWalkPx(w0, p.door.x, p.door.y) && !findPathPx(w0, m.spawn, p.door)) bad.push(poiObj(p.id));
const badIds = new Set(bad.map((o: any) => o.id).filter((id: string) => !ONLY || id === ONLY));
console.log('bad', [...badIds].join(','));
// thế giới không có các vật xấu
const m2: any = { ...m, scene: { ...m.scene, objects: objs.filter((o) => !badIds.has(o.id)) } };
const w = buildSceneWorld(m2);
const { mw, mh, cell } = w;
const walk = Uint8Array.from(w.walk);
const start = Math.floor(m.spawn.y / cell) * mw + Math.floor(m.spawn.x / cell);
function reach(wk: Uint8Array) {
  const seen = new Uint8Array(mw * mh); const q = [start]; seen[start] = 1;
  for (let h = 0; h < q.length; h++) { const c = q[h]; const x = c % mw, y = (c / mw) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= mw || ny >= mh) continue; const n = ny * mw + nx; if (wk[n] && !seen[n]) { seen[n] = 1; q.push(n); } } }
  return seen;
}
const cellOf = (x: number, y: number) => Math.floor(y / cell) * mw + Math.floor(x / cell);
const placed: any[] = objs.filter((o) => !badIds.has(o.id));
const rects = () => placed.filter((o) => !o.id.startsWith('seam')).map((o) => spriteRect(o, S[o.sprite]));
const okDoors = pois.filter((p: any) => !badIds.has(poiObj(p.id).id));
const WORLD = m.image.w ?? m.size?.w;
import { readFileSync as rf } from 'node:fs';
const LOT = rf(`scripts/_lots_${city}.bin`);
const lotAt = (x: number, y: number) => LOT[Math.max(0, Math.min(w.h - 1, Math.round(y))) * w.w + Math.max(0, Math.min(w.w - 1, Math.round(x)))];
const moves: any[] = [];
const base0 = reach(walk);
const baseOk = (p: any) => base0[cellOf(p.door.x, p.door.y)] === 1;
for (const o of bad) {
  const sp = S[o.sprite]; const dx = o.door.dx, dy = o.door.dy;
  const fpr = (x: number, y: number) => ({ x: x + o.footprint.x, y: y + o.footprint.y, w: o.footprint.w, h: o.footprint.h });
  const cands: [number, number, number][] = [];
  for (let y = 10; y < w.h - 6; y += 4) for (let x = 10; x < w.w - 10; x += 4) cands.push([(x - o.x) ** 2 + (y - o.y) ** 2, x, y]);
  cands.sort((a, b) => a[0] - b[0]);
  const R = rects();
  let best: any = null; const rej: Record<string, number> = {};
  const R_ = (k: string) => { rej[k] = (rej[k] || 0) + 1; };
  for (const pass of [1, 2]) { if (best) break;
  for (const [, x, y] of cands) {
    if (x - sp.w / 2 < 0 || x + sp.w / 2 > w.w || y - sp.h < 0 || y > w.h - 4) continue;
    const bx = { x: x - sp.w / 2 - 1, y: y - sp.h - 1, w: sp.w + 2, h: sp.h + 2 };
    if (R.some((r) => bx.x < r.x + r.w && bx.x + bx.w > r.x && bx.y < r.y + r.h && bx.y + bx.h > r.y)) { R_('overlap'); continue; }
    // đáy sprite phải trên đất (không nước): kiểm vài điểm dọc chân
    const f = fpr(x, y);
    let wet = 0, tot = 0;
    for (let yy = f.y; yy < f.y + f.h; yy += cell) for (let xx = f.x; xx < f.x + f.w; xx += cell) { tot++; if (w.water[cellOf(xx, yy)]) wet++; }
    if (wet > 0) { R_('wet'); continue; }
    // chân phải nằm trên ô đi được (lô xám hoặc đường), cửa đi được
    let wk = 0; for (let yy = f.y; yy < f.y + f.h; yy += cell) for (let xx = f.x; xx < f.x + f.w; xx += cell) if (walk[cellOf(xx, yy)]) wk++;
    if (pass === 1 && wk < tot * 0.6) { R_('footnotwalk'); continue; }
    let lg = 0, lt = 0; for (let yy = f.y; yy < f.y + f.h; yy += 2) for (let xx = f.x; xx < f.x + f.w; xx += 2) { lt++; lg += lotAt(xx, yy); }
    if (pass === 1 && lg < lt * 0.5) { R_('notlot'); continue; }
    const door = { x: x + dx, y: y + dy };
    if (!walk[cellOf(door.x, door.y)]) { R_('doorblocked'); continue; }
    const t = Uint8Array.from(walk);
    for (let yy = f.y; yy < f.y + f.h; yy += 1) for (let xx = f.x; xx < f.x + f.w; xx += 1) { const c = cellOf(xx, yy); if (c >= 0 && c < t.length) t[c] = 0; }
    const seen = reach(t);
    if (!seen[cellOf(door.x, door.y)]) { R_('doorunreach'); continue; }
    if (okDoors.some((p: any) => baseOk(p) && !seen[cellOf(p.door.x, p.door.y)])) { R_('cuts'); continue; }
    best = [x, y, pass]; walk.set(t); break;
  }
  }
  console.log(o.id, '->', best, 'was', o.x, o.y, JSON.stringify(rej));
  if (best) { o.x = best[0]; o.y = best[1]; placed.push(o); moves.push({ id: o.id, x: best[0], y: best[1], paint: best[2] === 2 ? { x0: Math.round(best[0] + o.footprint.x - 5), y0: Math.round(best[1] + o.footprint.y - 3), x1: Math.round(best[0] + o.footprint.x + o.footprint.w + 5), y1: Math.round(best[1] + 3) } : null }); okDoors.push(pois.find((p: any) => p.id === o.poiId)); }
}
import { writeFileSync } from 'node:fs';
writeFileSync(`scripts/_reloc_${city}.json`, JSON.stringify(moves));
