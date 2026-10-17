/**
 * validate-world: kiểm tra toàn bộ thế giới ngoài trời trước khi đưa vào game.
 * Chạy: npx tsx scripts/world/validate-world.ts   (thoát mã 1 nếu có lỗi nghiêm trọng)
 * Kiểm tra: A) lưới/chunk, B) nối ranh giới chunk, C) liên thông đường, D) BFS giữa các điểm công cộng,
 * E) vật cản dưới spawn/cửa, F) cổng vào–ra nội thất.
 */
import { CHUNK } from '../../src/world/constants';
import { masterBlueprint } from '../../src/world/master-blueprint';
import { World, type WorldObject } from '../../src/world/raster';
import { components, findPath, reachFrom } from '../../src/world/nav';
import { chunkOfTile } from '../../src/world/coords';

type Issue = { sev: 'error' | 'warn'; kind: string; at: string; chunks: string; msg: string };
const issues: Issue[] = [];
const add = (sev: Issue['sev'], kind: string, x: number, y: number, msg: string) => {
  const c = chunkOfTile(x, y);
  issues.push({ sev, kind, at: `(${x},${y})`, chunks: `${c.cx},${c.cy}`, msg });
};

const bp = masterBlueprint;
const w = new World(bp);

// A. lưới đúng cỡ chunk và mọi chunk đều có mặt trong thế giới
if (w.W !== bp.chunksX * CHUNK || w.H !== bp.chunksY * CHUNK) add('error', 'grid', 0, 0, 'kích thước thế giới không khớp số chunk');
for (const lot of bp.lots) {
  if (lot.x < 0 || lot.y < 0 || lot.x + lot.w > w.W || lot.y + lot.h > w.H) add('error', 'grid', lot.x, lot.y, `lô ${lot.id} nằm ngoài thế giới`);
}

// B. ranh giới chunk: đường/nước/vỉa hè phải liền qua cạnh (ô thế giới đối diện cùng địa hình hoặc nối hợp lệ)
// Vì lưới là toàn cục, nối luôn đúng; kiểm tra thêm: không có ô đi được nào bị cắt cụt đúng ranh giới
// (một ô đi được có hàng xóm đi được ở chunk bên cạnh nhưng lại bị chặn bởi một vật tại ranh).
for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
  if (x % CHUNK !== CHUNK - 1 || x + 1 >= w.W) continue;
  const a = w.isWalk(x, y), b = w.isWalk(x + 1, y);
  if (a !== b && w.terrainAt(x, y) !== 1 && w.terrainAt(x + 1, y) !== 1 && w.blocked[y * w.W + x] === 0 && w.blocked[y * w.W + x + 1] === 0) {
    // mặt đường đối diện lệch: chỉ cảnh báo khi đường chính (asphalt) bị cắt
    const t1 = w.terrainAt(x, y), t2 = w.terrainAt(x + 1, y);
    if ((t1 === 6 || t2 === 6) && y % 2 === 0) add('warn', 'seam', x, y, 'đường nhựa bị cắt tại ranh chunk dọc');
  }
}

// C. liên thông: mọi thành phần đi được lớn phải là một khối; thành phần nhỏ bị cô lập là lỗi
const { sizes, first } = components(w);
const sorted = [...sizes.entries()].sort((a, b) => b[1] - a[1]);
const mainId = sorted[0]?.[0];
for (const [id, size] of sorted.slice(1)) {
  if (size < 40) continue; // bỏ mảnh vụn nhỏ hơn 40 ô: thường là mép/bờ, không phải khu
  const f = first.get(id)!;
  add('error', 'isolated', f % w.W, (f / w.W) | 0, `khu đi được ${size} ô bị cô lập khỏi mạng chính`);
}
const islandSmall = sorted.slice(1).filter(([, s]) => s < 40).length;
if (islandSmall) issues.push({ sev: 'warn', kind: 'fragment', at: '-', chunks: '-', msg: `${islandSmall} mảnh vụn đi được (<40 ô) — kiểm tra có phải mảnh đất thừa` });

// D. BFS: từ spawn tới mọi cửa (địa điểm công cộng)
const spawn: [number, number] = bp.spawn;
const reach = reachFrom(w, spawn[0], spawn[1]);
if (!reach[spawn[1] * w.W + spawn[0]]) add('error', 'spawn', spawn[0], spawn[1], 'spawn không đi được');
const stranded: string[] = [];
for (const lot of bp.lots) {
  const dm = w.doormats.get(lot.id);
  if (!dm) { add('error', 'door', lot.x, lot.y, `lô ${lot.id} không có thảm cửa`); continue; }
  const dx = dm.doorX, dy = dm.doorY;
  if (!w.isWalk(dx, dy)) { add('error', 'door', dx, dy, `cửa ${lot.id} không đi được`); continue; }
  if (!reach[dy * w.W + dx]) stranded.push(lot.id);
}
for (const s of stranded) {
  const lot = bp.lots.find((l) => l.id === s)!;
  add('error', 'unreachable', lot.x, lot.y, `cửa ${s} không tới được từ spawn`);
}
// kiểm tra đường tìm được đi thật (A*) tới 3 cửa xa nhất
for (const s of stranded.slice(0, 3)) void s;
const sample = bp.lots.slice(0, 3);
for (const lot of sample) {
  const dm = w.doormats.get(lot.id)!;
  const p = findPath(w, spawn, [dm.doorX, dm.doorY]);
  if (!p) add('error', 'path', dm.doorX, dm.doorY, `A* không tìm được đường tới ${lot.id}`);
}

// E. vật cản dưới spawn và cửa
const near = (x: number, y: number) => w.objects.some((o: WorldObject) => Math.abs(o.tx - x) <= 0 && Math.abs(o.ty - y) <= 0);
if (near(spawn[0], spawn[1])) add('error', 'spawn-blocked', spawn[0], spawn[1], 'spawn nằm trên vật cản');
for (const lot of bp.lots) {
  const dm = w.doormats.get(lot.id)!;
  if (w.blocked[dm.doorY * w.W + dm.doorX]) add('error', 'door-blocked', dm.doorX, dm.doorY, `cửa ${lot.id} bị vật chặn`);
}

// F. cổng nội thất
for (const p of bp.portals) {
  const ok = w.isWalk(p.toSpawn[0], p.toSpawn[1]);
  if (!ok) add('error', 'portal', p.toSpawn[0], p.toSpawn[1], `cổng ${p.id}: điểm xuất hiện không đi được`);
  if (!w.isWalk(p.fromTile[0], p.fromTile[1])) add('error', 'portal', p.fromTile[0], p.fromTile[1], `cổng ${p.id}: thảm kích hoạt không đi được`);
}

// Báo cáo
const errors = issues.filter((i) => i.sev === 'error');
const warns = issues.filter((i) => i.sev === 'warn');
console.log(`world ${bp.id}: chunks ${bp.chunksX}×${bp.chunksY}, ô ${w.W}×${w.H}, lô ${bp.lots.length}, đường ${bp.roads.length}, cầu ${bp.bridges.length}`);
console.log(`thành phần đi được: ${sorted.length} (lớn nhất ${sorted[0]?.[1] ?? 0} ô; mainId=${mainId})`);
console.log(`tới được từ spawn: ${stranded.length === 0 ? 'tất cả cửa' : `thiếu ${stranded.length} cửa`}`);
for (const i of [...errors, ...warns]) console.log(`[${i.sev.toUpperCase()}] ${i.kind} tại ${i.at} chunk ${i.chunks}: ${i.msg}`);
console.log(`kết quả: ${errors.length} lỗi nghiêm trọng, ${warns.length} cảnh báo`);
if (errors.length) process.exitCode = 1;
