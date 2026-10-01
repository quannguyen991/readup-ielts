/**
 * ĐỜI SỐNG TRONG THÀNH PHỐ — phần "chơi cùng thành phố" kiểu Play Together:
 * nhân vật đi dạo, câu cá / bắt bọ bằng câu hỏi từ vựng, trang trí nhà.
 *
 * Mọi luật ở đây là hàm THUẦN (test ở `life.test.ts`); cảnh 3D và giao diện chỉ
 * gọi vào. Toạ độ nhân vật tính theo Ô (số thực): ô (x, y) chiếm [x, x+1) × [y, y+1).
 *
 * Luật sao: mỗi con bắt được cho vài sao theo độ hiếm, nhưng CÓ TRẦN MỖI NGÀY
 * (`CATCH_DAILY_CAP`) — câu cá là phần thưởng phụ cho việc ôn từ, không phải
 * cách cày sao thay cho học bài.
 */
import { catalogItem } from '@/data/city/catalog';
import { isDone, type Site } from './construction';
import { entranceTile, footprintTiles, isUnlocked, key } from './placement';
import { heightAt, isWater, tileAt, type LandWork, type Terrain } from './terrain';
import type { RoadTile } from './placement';
import { furnitureById } from '@/data/city/furniture';

export { FURNITURE, furnitureById, furnitureShopId, type Furniture, type FurnitureKind } from '@/data/city/furniture';

// ------------------------------------------------------------------ đi dạo

export type WalkWorld = {
  terrain: Terrain;
  works: Record<string, LandWork>;
  regions: readonly number[];
  roads: Record<string, RoadTile>;
  sites: readonly Site[];
};

export type WalkIndex = {
  world: WalkWorld;
  /** Ô có công trình đứng (không đi xuyên được). */
  solid: Set<string>;
};

export function walkIndex(world: WalkWorld): WalkIndex {
  const solid = new Set<string>();
  for (const s of world.sites) {
    const it = catalogItem(s.type);
    if (!it) continue;
    // Bến thuyền nằm trên mặt nước: đi lên sàn được.
    if (it.place.on === 'waterfront') continue;
    for (const [x, y] of footprintTiles(s.x, s.y, it.size, s.rot)) solid.add(key(x, y));
  }
  return { world, solid };
}

/** Bước lên / xuống tối đa giữa hai ô kề nhau (bậc cao độ). Dốc hơn là vách núi. */
export const MAX_STEP = 2;

/** Ô có đứng được không. */
export function canStand(ix: WalkIndex, x: number, y: number): boolean {
  const { world } = ix;
  const t = tileAt(world.terrain, x, y);
  if (!t) return false;
  if (!isUnlocked(world, x, y)) return false;
  if (ix.solid.has(key(x, y))) return false;
  // Nước: chỉ đi được trên cầu.
  if (isWater(t)) return !!world.roads[key(x, y)];
  return true;
}

/** Đi được từ ô a sang ô kề b không (đứng được và không phải vách dốc). */
export function canStep(ix: WalkIndex, ax: number, ay: number, bx: number, by: number): boolean {
  if (!canStand(ix, bx, by)) return false;
  if (ax === bx && ay === by) return true;
  const { terrain, works, roads } = ix.world;
  // Trên cầu thì không tính dốc (cầu bắc ngang mặt nước).
  if (roads[key(bx, by)] && isWater(tileAt(terrain, bx, by))) return true;
  if (roads[key(ax, ay)] && isWater(tileAt(terrain, ax, ay))) return true;
  return Math.abs(heightAt(terrain, works, bx, by) - heightAt(terrain, works, ax, ay)) <= MAX_STEP;
}

/** Bán kính thân nhân vật (ô). */
export const BODY = 0.22;

/**
 * Dời nhân vật một bước (dx, dy tính bằng ô), trượt dọc tường: thử từng trục
 * riêng, trục nào bị chặn thì giữ nguyên trục đó.
 */
export function moveAvatar(ix: WalkIndex, pos: readonly [number, number], dx: number, dy: number): [number, number] {
  let [x, y] = pos;
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  const okAt = (px: number, py: number) => {
    // Bốn góc của thân phải cùng đứng được.
    for (const [ox, oy] of [
      [-BODY, -BODY],
      [BODY, -BODY],
      [-BODY, BODY],
      [BODY, BODY],
    ] as const) {
      const cx = Math.floor(px + ox);
      const cy = Math.floor(py + oy);
      if (!canStep(ix, tx, ty, cx, cy)) return false;
    }
    return true;
  };
  if (dx !== 0 && okAt(x + dx, y)) x += dx;
  if (dy !== 0 && okAt(x, y + dy)) y += dy;
  return [x, y];
}

/** Chỗ xuất phát: ô đứng được gần tâm các công trình nhất (hoặc gần giữa bản đồ). */
export function spawnPoint(ix: WalkIndex, near: readonly [number, number]): [number, number] {
  const size = ix.world.terrain.size;
  let best: [number, number] | null = null;
  let bestD = Infinity;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!canStand(ix, x, y)) continue;
      // Ưu tiên đứng trên đường.
      const d = Math.hypot(x + 0.5 - near[0], y + 0.5 - near[1]) - (ix.world.roads[key(x, y)] ? 1.5 : 0);
      if (d < bestD) {
        bestD = d;
        best = [x + 0.5, y + 0.5];
      }
    }
  }
  return best ?? [size / 2, size / 2];
}

/**
 * Đường đi ngắn nhất (theo 8 hướng, không cắt góc tường) từ ô `from` tới ô
 * `to`. Ô đích đứng không được (bấm vào nhà) thì đi tới ô đứng được gần nó
 * nhất. Trả về danh sách tâm ô, không gồm ô xuất phát; `null` nếu không tới được.
 */
export function findPath(ix: WalkIndex, from: readonly [number, number], to: readonly [number, number], maxNodes = 4000): [number, number][] | null {
  const size = ix.world.terrain.size;
  const [fx, fy] = from;
  let goal: [number, number] | null = canStand(ix, to[0], to[1]) ? [to[0], to[1]] : null;
  if (!goal) {
    let best = Infinity;
    for (let r = 1; r <= 3 && !goal; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const x = to[0] + dx;
          const y = to[1] + dy;
          if (!canStand(ix, x, y)) continue;
          const d = Math.hypot(dx, dy) + Math.hypot(x - fx, y - fy) * 0.01;
          if (d < best) {
            best = d;
            goal = [x, y];
          }
        }
  }
  if (!goal) return null;
  const id = (x: number, y: number) => y * size + x;
  const prev = new Map<number, number>([[id(fx, fy), -1]]);
  const queue: [number, number][] = [[fx, fy]];
  const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let qi = 0; qi < queue.length && qi < maxNodes; qi++) {
    const [x, y] = queue[qi]!;
    if (x === goal[0] && y === goal[1]) {
      const out: [number, number][] = [];
      let cur = id(x, y);
      while (cur !== id(fx, fy)) {
        out.push([(cur % size) + 0.5, Math.floor(cur / size) + 0.5]);
        cur = prev.get(cur)!;
      }
      return out.reverse();
    }
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (prev.has(id(nx, ny)) || !canStep(ix, x, y, nx, ny)) continue;
      // Đi chéo chỉ khi hai ô cạnh cũng đi được (không lách qua góc nhà).
      if (dx !== 0 && dy !== 0 && (!canStep(ix, x, y, nx, y) || !canStep(ix, x, y, x, ny))) continue;
      prev.set(id(nx, ny), id(x, y));
      queue.push([nx, ny]);
    }
  }
  return null;
}

// ------------------------------------------------------------------ việc làm được ở chỗ đang đứng

export type Activity =
  | { kind: 'enter'; siteId: string; type: string; route: string }
  | { kind: 'home'; siteId: string }
  | { kind: 'fish' }
  | { kind: 'bug' };

const HOME_TYPES = new Set(['house_wood', 'house_brick', 'townhouse']);
const BUG_NATURE = new Set(['tree', 'pine', 'palm', 'bush', 'flowers']);

/**
 * Việc làm được ngay chỗ nhân vật đứng, theo thứ tự ưu tiên: vào công trình kỹ
 * năng (cửa trong 1,3 ô) → vào nhà → câu cá (sát mép nước) → bắt bọ (cạnh cây,
 * bụi, hoa chưa bị đường / nhà đè).
 */
export function activityAt(ix: WalkIndex, pos: readonly [number, number]): Activity | null {
  const { world } = ix;
  const [px, py] = pos;
  let door: { a: Activity; d: number } | null = null;
  for (const s of world.sites) {
    if (!isDone(s)) continue;
    const it = catalogItem(s.type);
    if (!it) continue;
    const skill = it.skill;
    const home = HOME_TYPES.has(s.type);
    if (!skill && !home) continue;
    const [ex, ey] = entranceTile(s.x, s.y, it.size, s.rot);
    const d = Math.hypot(ex + 0.5 - px, ey + 0.5 - py);
    if (d > 1.3) continue;
    const a: Activity = skill ? { kind: 'enter', siteId: s.id, type: s.type, route: skill.route } : { kind: 'home', siteId: s.id };
    // Công trình kỹ năng thắng nhà ở khi cùng gần.
    const score = d - (skill ? 0.5 : 0);
    if (!door || score < door.d) door = { a, d: score };
  }
  if (door) return door.a;

  const tx = Math.floor(px);
  const ty = Math.floor(py);
  const here = tileAt(world.terrain, tx, ty);
  if (!here || isWater(here)) return null;
  let water = false;
  let bug = false;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const x = tx + ox;
      const y = ty + oy;
      const t = tileAt(world.terrain, x, y);
      if (!t || !isUnlocked(world, x, y)) continue;
      if (isWater(t) && !world.roads[key(x, y)]) water = true;
      if (t.nature && BUG_NATURE.has(t.nature) && !world.roads[key(x, y)] && !ix.solid.has(key(x, y))) bug = true;
    }
  }
  if (water) return { kind: 'fish' };
  if (bug) return { kind: 'bug' };
  return null;
}

// ------------------------------------------------------------------ bộ sưu tập

export type CatchKind = 'fish' | 'bug';
export type Rarity = 1 | 2 | 3 | 4;

export type Species = { id: string; kind: CatchKind; vi: string; en: string; glyph: string; rarity: Rarity };

export const RARITY_INFO: Record<Rarity, { vi: string; weight: number; stars: number; color: string }> = {
  1: { vi: 'Thường', weight: 60, stars: 2, color: '#64748B' },
  2: { vi: 'Hiếm', weight: 28, stars: 4, color: '#2563EB' },
  3: { vi: 'Quý', weight: 10, stars: 8, color: '#9333EA' },
  4: { vi: 'Huyền thoại', weight: 2, stars: 20, color: '#D97706' },
};

export const SPECIES: readonly Species[] = [
  { id: 'fish-ro', kind: 'fish', vi: 'Cá rô', en: 'Climbing perch', glyph: '🐟', rarity: 1 },
  { id: 'fish-chep', kind: 'fish', vi: 'Cá chép', en: 'Carp', glyph: '🐟', rarity: 1 },
  { id: 'fish-tom', kind: 'fish', vi: 'Tôm càng', en: 'River prawn', glyph: '🦐', rarity: 1 },
  { id: 'fish-cua', kind: 'fish', vi: 'Cua đồng', en: 'Paddy crab', glyph: '🦀', rarity: 1 },
  { id: 'fish-he', kind: 'fish', vi: 'Cá hề', en: 'Clownfish', glyph: '🐠', rarity: 2 },
  { id: 'fish-noc', kind: 'fish', vi: 'Cá nóc', en: 'Pufferfish', glyph: '🐡', rarity: 2 },
  { id: 'fish-muc', kind: 'fish', vi: 'Mực ống', en: 'Squid', glyph: '🦑', rarity: 2 },
  { id: 'fish-rua', kind: 'fish', vi: 'Rùa biển', en: 'Sea turtle', glyph: '🐢', rarity: 3 },
  { id: 'fish-bach-tuoc', kind: 'fish', vi: 'Bạch tuộc', en: 'Octopus', glyph: '🐙', rarity: 3 },
  { id: 'fish-ca-heo', kind: 'fish', vi: 'Cá heo', en: 'Dolphin', glyph: '🐬', rarity: 4 },
  { id: 'bug-kien', kind: 'bug', vi: 'Kiến', en: 'Ant', glyph: '🐜', rarity: 1 },
  { id: 'bug-oc-sen', kind: 'bug', vi: 'Ốc sên', en: 'Snail', glyph: '🐌', rarity: 1 },
  { id: 'bug-giun', kind: 'bug', vi: 'Sâu xanh', en: 'Caterpillar', glyph: '🐛', rarity: 1 },
  { id: 'bug-bo-rua', kind: 'bug', vi: 'Bọ rùa', en: 'Ladybird', glyph: '🐞', rarity: 1 },
  { id: 'bug-ong', kind: 'bug', vi: 'Ong mật', en: 'Honeybee', glyph: '🐝', rarity: 2 },
  { id: 'bug-de', kind: 'bug', vi: 'Dế mèn', en: 'Cricket', glyph: '🦗', rarity: 2 },
  { id: 'bug-bo-canh-cam', kind: 'bug', vi: 'Bọ cánh cam', en: 'Scarab beetle', glyph: '🪲', rarity: 2 },
  { id: 'bug-buom', kind: 'bug', vi: 'Bướm phượng', en: 'Swallowtail', glyph: '🦋', rarity: 3 },
  { id: 'bug-chuon-chuon', kind: 'bug', vi: 'Chuồn chuồn kim', en: 'Damselfly', glyph: '🪰', rarity: 3 },
  { id: 'bug-dom-dom', kind: 'bug', vi: 'Đom đóm vàng', en: 'Golden firefly', glyph: '✨', rarity: 4 },
];

export function speciesById(id: string): Species | undefined {
  return SPECIES.find((s) => s.id === id);
}

/**
 * Bốc một con theo độ hiếm. `r` trong [0, 1). Trả lời đúng NHANH (`fast`) thì
 * nhân đôi cơ hội với loài từ Quý trở lên — thưởng cho việc thuộc từ thật.
 */
export function rollCatch(kind: CatchKind, r: number, fast = false): Species {
  const pool = SPECIES.filter((s) => s.kind === kind);
  // Trọng số là của cả BẬC hiếm (60/28/10/2 %), chia đều cho các loài trong bậc.
  const inTier = (r: Rarity) => pool.filter((s) => s.rarity === r).length;
  const w = (s: Species) => (RARITY_INFO[s.rarity].weight / inTier(s.rarity)) * (fast && s.rarity >= 3 ? 2 : 1);
  const total = pool.reduce((a, s) => a + w(s), 0);
  let x = Math.min(0.999999, Math.max(0, r)) * total;
  for (const s of pool) {
    x -= w(s);
    if (x < 0) return s;
  }
  return pool[pool.length - 1]!;
}

/** Trần sao mỗi ngày từ câu cá + bắt bọ. */
export const CATCH_DAILY_CAP = 40;

/** Sao thật sự được cộng cho một lần bắt, sau khi tính trần ngày. */
export function catchStars(rarity: Rarity, grantedToday: number): number {
  return Math.max(0, Math.min(RARITY_INFO[rarity].stars, CATCH_DAILY_CAP - Math.max(0, grantedToday)));
}

/** Khoá ghi sao câu cá của một ngày trong `prizes` của kho phần thưởng. */
export const catchPrizeKey = (dayKey: string) => `city-catch:${dayKey}`;

export type Collection = Record<string, { n: number; first: string }>;

export function addToCollection(c: Collection, speciesId: string, at: string): Collection {
  const cur = c[speciesId];
  return { ...c, [speciesId]: { n: (cur?.n ?? 0) + 1, first: cur?.first ?? at } };
}

/** Gộp hai máy: lấy số lần lớn hơn và ngày gặp đầu sớm hơn. */
export function mergeCollection(a: Collection | undefined, b: Collection | undefined): Collection {
  const out: Collection = { ...(a ?? {}) };
  for (const [id, v] of Object.entries(b ?? {})) {
    const cur = out[id];
    out[id] = cur ? { n: Math.max(cur.n, v.n), first: cur.first < v.first ? cur.first : v.first } : v;
  }
  return out;
}

// ------------------------------------------------------------------ câu hỏi từ vựng

export type QuizWord = {
  word: string;
  meaningVi: string;
  /** Định nghĩa tiếng Anh (nếu bộ từ có) — dùng làm lựa chọn khi giao diện là English. */
  definitionEn?: string;
};
export type CatchQuestion = { word: string; options: string[]; answer: number };

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Một câu trắc nghiệm nghĩa: từ lấy trong `focus` (từ đang học) nếu có, không
 * thì trong `pool`; ba nhiễu là nghĩa KHÁC của từ khác trong `pool`.
 * `rand` là hàm ngẫu nhiên [0, 1) (test truyền hàm tất định).
 *
 * `en` (giao diện English): lựa chọn là định nghĩa tiếng Anh — chỉ khi từ hỏi
 * CÓ định nghĩa và đủ ba nhiễu cũng có. Thiếu thì cả câu dùng nghĩa tiếng Việt,
 * không trộn hai thứ tiếng trong một câu (lựa chọn khác tiếng là lộ đáp án).
 */
export function makeQuestion(focus: readonly QuizWord[], pool: readonly QuizWord[], rand: () => number, en = false): CatchQuestion | null {
  const src = focus.length > 0 ? focus : pool;
  if (src.length === 0) return null;
  const target = src[Math.floor(rand() * src.length)]!;
  const hasEn = (w: QuizWord) => !!w.definitionEn?.trim();
  const pick = (useEn: boolean): CatchQuestion | null => {
    const text = (w: QuizWord) => (useEn ? w.definitionEn!.trim() : w.meaningVi);
    const candidates = useEn ? pool.filter(hasEn) : pool;
    const seen = new Set([norm(text(target))]);
    const wrong: string[] = [];
    for (let tries = 0; wrong.length < 3 && tries < 200 && candidates.length > 0; tries++) {
      const w = candidates[Math.floor(rand() * candidates.length)];
      if (!w || norm(w.word) === norm(target.word) || seen.has(norm(text(w)))) continue;
      seen.add(norm(text(w)));
      wrong.push(text(w));
    }
    if (wrong.length < 3) return null;
    const answer = Math.floor(rand() * 4);
    const options = [...wrong];
    options.splice(answer, 0, text(target));
    return { word: target.word, options, answer };
  };
  return (en && hasEn(target) ? pick(true) : null) ?? pick(false);
}

// ------------------------------------------------------------------ nhà & nội thất

export const ROOM = 8;

export type Placed = { uid: string; item: string; x: number; y: number; rot: 0 | 1 };
export type HomeLayout = { items: Placed[]; floor: string; wall: string };

export const EMPTY_HOME: HomeLayout = { items: [], floor: '#E7D3B0', wall: '#F8EFE2' };

export function placedTiles(p: Pick<Placed, 'item' | 'x' | 'y' | 'rot'>): [number, number][] {
  const f = furnitureById(p.item);
  if (!f) return [];
  const [w, d] = p.rot === 1 ? [f.size[1], f.size[0]] : f.size;
  const out: [number, number][] = [];
  for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) out.push([p.x + i, p.y + j]);
  return out;
}

export type FurnitureCheck = { ok: true } | { ok: false; reason: 'unknown' | 'outside' | 'overlap' | 'wall_only' };

/**
 * Đặt được không. Sàn 8×8 ô; đồ treo tường chỉ nằm ở hàng sát tường trong
 * (y = 0), không chiếm sàn; thảm nằm dưới đồ khác nên chỉ không chồng lên thảm;
 * đồ đặt sàn không chồng lên đồ đặt sàn khác.
 */
export function canPlaceFurniture(layout: HomeLayout, p: Omit<Placed, 'uid'>, ignoreUid?: string): FurnitureCheck {
  const f = furnitureById(p.item);
  if (!f) return { ok: false, reason: 'unknown' };
  const tiles = placedTiles(p);
  if (tiles.some(([x, y]) => x < 0 || y < 0 || x >= ROOM || y >= ROOM)) return { ok: false, reason: 'outside' };
  if (f.kind === 'wall' && tiles.some(([, y]) => y !== 0)) return { ok: false, reason: 'wall_only' };
  const mine = new Set(tiles.map(([x, y]) => key(x, y)));
  for (const o of layout.items) {
    if (o.uid === ignoreUid) continue;
    const of = furnitureById(o.item);
    if (!of || of.kind !== f.kind) continue;
    if (placedTiles(o).some(([x, y]) => mine.has(key(x, y)))) return { ok: false, reason: 'overlap' };
  }
  return { ok: true };
}

/** Số món đang đặt trong phòng của một loại (không đặt nhiều hơn số đã mua). */
export function placedCount(layout: HomeLayout, item: string): number {
  return layout.items.filter((p) => p.item === item).length;
}

// ------------------------------------------------------------------ thăm nhà bạn

export const NOTE_MAX = 120;

/** Làm sạch lời nhắn sổ lưu bút: bỏ ký tự điều khiển, gộp khoảng trắng, cắt độ dài. */
export function cleanNote(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s
    .replace(/[\u0000-\u001F\u007F​-‏‪-‮]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NOTE_MAX);
}

export type GuestNote = { by: string; name: string; text: string; at: string };
export type CitySocial = { likes: string[]; notes: GuestNote[] };
export const EMPTY_SOCIAL: CitySocial = { likes: [], notes: [] };
export const NOTES_KEPT = 40;

/** Thích một lần mỗi người; bấm lại là bỏ thích. */
export function toggleLike(s: CitySocial, by: string): { social: CitySocial; liked: boolean } {
  const has = s.likes.includes(by);
  return { social: { ...s, likes: has ? s.likes.filter((x) => x !== by) : [...s.likes, by] }, liked: !has };
}

/** Mỗi người một lời nhắn mỗi ngày trên một thành phố; giữ `NOTES_KEPT` lời mới nhất. */
export function addNote(s: CitySocial, note: GuestNote): { ok: true; social: CitySocial } | { ok: false; reason: 'empty' | 'daily' } {
  if (!note.text) return { ok: false, reason: 'empty' };
  const day = note.at.slice(0, 10);
  if (s.notes.some((n) => n.by === note.by && n.at.slice(0, 10) === day)) return { ok: false, reason: 'daily' };
  return { ok: true, social: { ...s, notes: [note, ...s.notes].slice(0, NOTES_KEPT) } };
}
