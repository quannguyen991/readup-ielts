import { CITY_MAPS } from '@/data/travel/maps';
import { buildSceneWorld, spriteRect } from '@/components/travel/engine/scene';
const m: any = (CITY_MAPS as any).hanoi;
const w = buildSceneWorld(m);
const { mw, mh, cell } = w;
let walkN = 0, waterN = 0; for (let i = 0; i < mw * mh; i++) { if (w.walk[i]) walkN++; if (w.water[i]) waterN++; }
console.log('cells', mw, mh, 'walk', walkN, 'water', waterN);
// ascii thu nhỏ 1 ô = 8 ô
const rows: string[] = [];
for (let j = 0; j < mh; j += 6) { let s = ''; for (let i = 0; i < mw; i += 4) { const c = j * mw + i; s += w.water[c] ? '~' : w.walk[c] ? '#' : '.'; } rows.push(s); }
console.log(rows.join('\n'));
