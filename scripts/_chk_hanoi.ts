import { CITY_MAPS } from '@/data/travel/maps';
import { buildSceneWorld } from '@/components/travel/engine/scene';
import { findPathPx, isWalkPx } from '@/components/travel/engine/imageWorld';
const m: any = (CITY_MAPS as any)[process.argv[2] || 'hanoi'];
const w = buildSceneWorld(m);
let bad = 0;
for (const p of m.pois) {
  const walk = isWalkPx(w, p.door.x, p.door.y);
  const path = walk ? findPathPx(w, m.spawn, p.door) : null;
  if (!walk || !path) { bad++; console.log(p.id, p.door, walk ? 'KHONG TOI DUOC' : 'CUA KHONG DI DUOC'); }
}
console.log('pois', m.pois.length, 'bad', bad, 'spawn', m.spawn);
import { spriteRect } from '@/components/travel/engine/scene';
const S = m.scene.sprites; const os = m.scene.objects.filter((o: any) => !o.id.startsWith('seam'));
let ov = 0;
for (let i = 0; i < os.length; i++) for (let j = i + 1; j < os.length; j++) {
  const a = spriteRect(os[i], S[os[i].sprite]), b = spriteRect(os[j], S[os[j].sprite]);
  const smallA = S[os[i].sprite].w < 20 || S[os[j].sprite].w < 20; // đèn, xe nhỏ
  if (!smallA && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) { ov++; console.log('CHONG', os[i].id, os[j].id); }
}
let oob = 0; const WW = m.image.w, HH = m.image.h;
for (const o of os) { const r = spriteRect(o, S[o.sprite]); if (r.x < 0 || r.y < 0 || r.x + r.w > WW || r.y + r.h > HH) { oob++; console.log('RA NGOAI', o.id); } }
for (const n of m.npcs) if (!isWalkPx(w, n.at.x, n.at.y)) console.log('NPC khong di duoc', n.id ?? n.name, n.at);
console.log('overlaps', ov, 'oob', oob, 'objects', os.length);
// vật không phải địa điểm đặt trên nước?
for (const o of os) { if (o.poiId) continue; const cx = Math.floor(o.x / w.cell), cy = Math.floor((o.y - 1) / w.cell); if (w.water[cy * w.mw + cx]) console.log('TREN NUOC', o.id, o.x, o.y); }
