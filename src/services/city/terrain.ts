/**
 * ĐỊA HÌNH của Thành Phố Tri Thức — sinh từ (loại, seed). Cùng seed luôn ra
 * cùng địa hình và cùng các ô xây được; store chỉ lưu loại + seed + những ô
 * người học đã xử lý (san thềm, gia cố nền) — không lưu cả lưới.
 *
 * Ba loại:
 * - `plains`   Đồng bằng ven sông: đồng cỏ gần phẳng, một con sông uốn cong,
 *              bờ cát, bãi cây và đá. Nhiều ô dễ xây.
 * - `coast`    Ven biển: bờ biển cong, bãi cát, vùng nước nông, một doi đất
 *              nhô ra biển có mỏm đá (chỗ cho hải đăng), đá ngầm rải rác.
 * - `mountain` Miền núi: đồi bậc thang, vách đá, thung lũng có suối, vài vùng
 *              đất bằng ở giữa; sườn quá dốc bị khoá cho tới khi san thềm.
 *
 * Lưới `MAP.size` × `MAP.size` ô, chia vùng `MAP.region` × `MAP.region`; bốn
 * vùng giữa mở sẵn, các vùng còn lại mở dần theo kỷ + hạ tầng (xem placement).
 */
import type { TerrainKind } from '@/data/city/catalog';

export const MAP = { size: 40, region: 10 } as const;
export const REGIONS_PER_SIDE = MAP.size / MAP.region;
/** Vùng mở sẵn: 2×2 vùng giữa. */
export const START_REGIONS: readonly number[] = [5, 6, 9, 10];

export type TileKind = 'grass' | 'meadow' | 'sand' | 'rock' | 'water' | 'shallow' | 'stream';
export type Nature = 'tree' | 'pine' | 'palm' | 'rock' | 'bush' | 'flowers' | null;

export type Tile = {
  /** Cao độ (bậc). Ô nước có h = 0; đất liền ≥ 1. */
  h: number;
  kind: TileKind;
  nature: Nature;
};

export type Terrain = {
  kind: TerrainKind;
  seed: number;
  size: number;
  tiles: Tile[];
};

// ------------------------------------------------------------------ nhiễu có seed

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Nhiễu giá trị 2D, 0..1. */
export function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

export function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + o * 101);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// ------------------------------------------------------------------ sinh địa hình

function blank(size: number): Tile[] {
  return Array.from({ length: size * size }, () => ({ h: 1, kind: 'grass' as TileKind, nature: null as Nature }));
}

function scatterNature(tiles: Tile[], size: number, seed: number, opts: { trees: number; rocks: number; palms?: boolean }) {
  const r = mulberry(seed ^ 0x5bd1e995);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = tiles[y * size + x]!;
      if (t.kind === 'water' || t.kind === 'shallow' || t.kind === 'stream') continue;
      const forest = fbm(x / 7, y / 7, seed + 17);
      const roll = r();
      if (t.kind === 'rock') {
        if (roll < 0.25) t.nature = 'rock';
        continue;
      }
      if (t.kind === 'sand') {
        if (opts.palms && roll < 0.07) t.nature = 'palm';
        else if (roll < 0.03) t.nature = 'rock';
        continue;
      }
      if (forest > 0.6 && roll < opts.trees) t.nature = t.h >= 3 || roll < 0.15 ? 'pine' : 'tree';
      else if (roll < opts.rocks) t.nature = 'rock';
      else if (roll < opts.rocks + 0.04) t.nature = 'bush';
      else if (roll < opts.rocks + 0.08 && t.kind === 'meadow') t.nature = 'flowers';
    }
  }
}

function genPlains(seed: number, size: number): Tile[] {
  const tiles = blank(size);
  const r = mulberry(seed);
  const phase = r() * Math.PI * 2;
  const amp = 2.2 + r() * 1.6;
  const base = 25 + r() * 3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = tiles[y * size + x]!;
      const hill = fbm(x / 9, y / 9, seed + 3);
      t.h = hill > 0.66 ? 2 : 1;
      t.kind = fbm(x / 5, y / 5, seed + 9) > 0.58 ? 'meadow' : 'grass';
      // Sông uốn cong theo trục x.
      const center = base + amp * Math.sin(x * 0.22 + phase) + (fbm(x / 6, 0, seed + 5) - 0.5) * 3;
      const d = Math.abs(y - center);
      if (d < 1.25) {
        t.h = 0;
        t.kind = 'water';
      } else if (d < 1.9) {
        t.h = 0;
        t.kind = 'shallow';
      } else if (d < 2.8) {
        t.h = 1;
        t.kind = 'sand';
      }
    }
  }
  scatterNature(tiles, size, seed, { trees: 0.55, rocks: 0.025 });
  return tiles;
}

function genCoast(seed: number, size: number): Tile[] {
  const tiles = blank(size);
  const r = mulberry(seed);
  const phase = r() * Math.PI * 2;
  const spitX = 26 + Math.floor(r() * 6);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = tiles[y * size + x]!;
      // Bờ biển cong: biển ở phía nam + góc đông nam.
      let coast = 27 + 3.2 * Math.sin(x * 0.19 + phase) + (fbm(x / 5, 3, seed + 7) - 0.5) * 4 - Math.max(0, x - 30) * 0.55;
      // Doi đất nhô ra biển.
      const spit = Math.max(0, 1 - Math.abs(x - spitX) / 2.2);
      coast += spit * 8;
      const d = y - coast;
      t.kind = fbm(x / 5, y / 5, seed + 9) > 0.62 ? 'meadow' : 'grass';
      t.h = fbm(x / 8, y / 8, seed + 3) > 0.7 && d < -6 ? 2 : 1;
      if (d > 2.6) {
        t.h = 0;
        t.kind = 'water';
      } else if (d > 0.4) {
        t.h = 0;
        t.kind = 'shallow';
      } else if (d > -2.2) {
        t.h = 1;
        t.kind = 'sand';
      }
      // Mỏm đá ở đầu doi đất + đá ngầm.
      if (spit > 0.3 && d > -1.8 && d <= 0.4) {
        t.h = 1;
        t.kind = 'rock';
      }
      if (t.kind === 'water' && hash2(x, y, seed + 77) < 0.035) {
        t.h = 1;
        t.kind = 'rock';
      }
    }
  }
  scatterNature(tiles, size, seed, { trees: 0.45, rocks: 0.02, palms: true });
  return tiles;
}

/** Đỉnh núi cao nhất (bậc); từ `SNOW_H` trở lên phủ tuyết. */
export const MOUNTAIN_MAX_H = 9;
export const SNOW_H = 8;

function genMountain(seed: number, size: number): Tile[] {
  const tiles = blank(size);
  const r = mulberry(seed);
  const phase = r() * Math.PI * 2;
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = tiles[y * size + x]!;
      // Núi cao dần ra rìa, lòng chảo tương đối bằng ở giữa. Nhiễu "sống núi"
      // (1 − |2n − 1|) tạo dãy đỉnh nhọn thay vì một cao nguyên phẳng.
      const dist = Math.hypot(x - c, y - c) / c;
      const n = fbm(x / 8, y / 8, seed + 3, 5);
      const ridge = 1 - Math.abs(fbm(x / 5.5, y / 5.5, seed + 11, 4) * 2 - 1);
      const edge = Math.min(0.75, Math.max(0, dist - 0.4));
      let h = 1 + n * 2.4 + edge * 5 + (ridge > 0.6 ? (ridge - 0.6) * 12 * edge : 0);
      // Hai thềm bằng lớn ở giữa để có chỗ khởi đầu.
      if (dist < 0.32) h = 1 + (n > 0.62 ? 1 : 0);
      t.h = Math.max(1, Math.min(MOUNTAIN_MAX_H, Math.round(h)));
      t.kind = t.h >= 6 ? 'rock' : t.h >= 4 && fbm(x / 4, y / 4, seed + 13) > 0.55 ? 'rock' : fbm(x / 5, y / 5, seed + 9) > 0.6 ? 'meadow' : 'grass';
      // Suối chảy qua thung lũng từ bắc xuống nam.
      const sx = c - 3 + 3.5 * Math.sin(y * 0.24 + phase) + (fbm(0, y / 6, seed + 5) - 0.5) * 3;
      if (Math.abs(x - sx) < 0.75) {
        t.h = Math.max(1, t.h - 1);
        t.kind = 'stream';
      }
    }
  }
  // Suối luôn thấp hơn hai bờ.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = tiles[y * size + x]!;
      if (t.kind !== 'stream') continue;
      const bank = Math.min(tiles[y * size + Math.max(0, x - 1)]!.h, tiles[y * size + Math.min(size - 1, x + 1)]!.h);
      t.h = Math.max(0, Math.min(t.h, bank - 1));
    }
  }
  scatterNature(tiles, size, seed, { trees: 0.6, rocks: 0.05 });
  return tiles;
}

const cache = new Map<string, Terrain>();

export function generateTerrain(kind: TerrainKind, seed: number): Terrain {
  const key = `${kind}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = MAP.size;
  const tiles = kind === 'plains' ? genPlains(seed, size) : kind === 'coast' ? genCoast(seed, size) : genMountain(seed, size);
  const t: Terrain = { kind, seed, size, tiles };
  if (cache.size > 12) cache.clear();
  cache.set(key, t);
  return t;
}

// ------------------------------------------------------------------ truy vấn ô

export type LandWork = 'terrace' | 'reinforce';

export function tileAt(t: Terrain, x: number, y: number): Tile | null {
  if (x < 0 || y < 0 || x >= t.size || y >= t.size) return null;
  return t.tiles[y * t.size + x]!;
}

export function isWater(tile: Tile | null): boolean {
  return !!tile && (tile.kind === 'water' || tile.kind === 'shallow' || tile.kind === 'stream');
}

/**
 * Cao độ hiệu lực của ô, tính cả san thềm: ô đã san được hạ/nâng về cao độ
 * phổ biến nhất của các ô đất liền kề (thềm bằng mà nó nối vào).
 */
export function heightAt(t: Terrain, works: Record<string, LandWork>, x: number, y: number): number {
  const tile = tileAt(t, x, y);
  if (!tile) return 0;
  if (works[`${x},${y}`] !== 'terrace') return tile.h;
  const counts = new Map<number, number>();
  for (const [dx, dy] of NEIGHBORS) {
    const n = tileAt(t, x + dx, y + dy);
    if (!n || isWater(n)) continue;
    counts.set(n.h, (counts.get(n.h) ?? 0) + 1);
  }
  let best = tile.h;
  let bestN = 0;
  for (const [h, n] of counts) if (n > bestN || (n === bestN && h < best)) [best, bestN] = [h, n];
  return best;
}

export const NEIGHBORS: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Ô "dốc": chênh ≥ 2 bậc với một ô đất liền kề (mép vách). San thềm gỡ được. */
export function isSteep(t: Terrain, works: Record<string, LandWork>, x: number, y: number): boolean {
  if (works[`${x},${y}`] === 'terrace') return false;
  const h = heightAt(t, works, x, y);
  return NEIGHBORS.some(([dx, dy]) => {
    const n = tileAt(t, x + dx, y + dy);
    if (!n || isWater(n)) return false;
    return Math.abs(heightAt(t, works, x + dx, y + dy) - h) >= 2;
  });
}

export function regionOf(x: number, y: number): number {
  return Math.floor(y / MAP.region) * REGIONS_PER_SIDE + Math.floor(x / MAP.region);
}

export function regionBounds(id: number): { x0: number; y0: number; x1: number; y1: number } {
  const rx = id % REGIONS_PER_SIDE;
  const ry = Math.floor(id / REGIONS_PER_SIDE);
  return { x0: rx * MAP.region, y0: ry * MAP.region, x1: (rx + 1) * MAP.region - 1, y1: (ry + 1) * MAP.region - 1 };
}

/** Thống kê để test/bản xem trước: số ô đất xây được, nước, cát, đá, dốc. */
export function terrainStats(t: Terrain): { land: number; water: number; sand: number; rock: number; steep: number; maxH: number } {
  let land = 0,
    water = 0,
    sand = 0,
    rock = 0,
    steep = 0,
    maxH = 0;
  for (let y = 0; y < t.size; y++) {
    for (let x = 0; x < t.size; x++) {
      const tile = t.tiles[y * t.size + x]!;
      maxH = Math.max(maxH, tile.h);
      if (isWater(tile)) water++;
      else if (tile.kind === 'rock') rock++;
      else if (tile.kind === 'sand') sand++;
      else if (isSteep(t, {}, x, y)) steep++;
      else land++;
    }
  }
  return { land, water, sand, rock, steep, maxH };
}
