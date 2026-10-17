import { CHUNK, CHUNK_PX, TILE } from './constants';
import { chunkKey, type ChunkId, type Dir, DIRS } from './coords';
import type { Painter } from './tileart';
import type { World, WorldObject } from './raster';

/**
 * Chunk = đơn vị lưu trữ / nạp dữ liệu, KHÔNG phải bản đồ vẽ riêng: nội dung chỉ là lát cắt của lưới toàn cục.
 * `halo` là một vòng ô của chunk lân cận (để autotile/kiểm tra không coi mép chunk là mép địa hình).
 */
export type ChunkData = {
  cx: number;
  cy: number;
  /** Địa hình CHUNK×CHUNK (hàng trước). */
  terrain: Uint8Array;
  blocked: Uint8Array;
  /** Vòng ngoài (CHUNK+2)×(CHUNK+2) địa hình, gồm cả ô chunk liền kề; ngoài thế giới thì kẹp theo mép. */
  halo: Uint8Array;
  owned: string[];
  neighbours: Partial<Record<Dir, ChunkId>>;
};

export function buildChunk(world: World, cx: number, cy: number): ChunkData {
  const terrain = new Uint8Array(CHUNK * CHUNK);
  const blocked = new Uint8Array(CHUNK * CHUNK);
  const halo = new Uint8Array((CHUNK + 2) * (CHUNK + 2));
  for (let y = -1; y <= CHUNK; y++) {
    for (let x = -1; x <= CHUNK; x++) {
      const wx = cx * CHUNK + x;
      const wy = cy * CHUNK + y;
      halo[(y + 1) * (CHUNK + 2) + (x + 1)] = world.terrainAt(wx, wy);
      if (x >= 0 && y >= 0 && x < CHUNK && y < CHUNK) {
        terrain[y * CHUNK + x] = world.terrainAt(wx, wy);
        blocked[y * CHUNK + x] = world.inside(wx, wy) ? world.blocked[wy * world.W + wx]! : 1;
      }
    }
  }
  const neighbours: ChunkData['neighbours'] = {};
  for (const d of Object.keys(DIRS) as Dir[]) {
    const nx = cx + DIRS[d].dx;
    const ny = cy + DIRS[d].dy;
    if (nx >= 0 && ny >= 0 && nx < world.bp.chunksX && ny < world.bp.chunksY) neighbours[d] = { cx: nx, cy: ny };
  }
  const owned = world.objects.filter((o) => {
    const c = world.ownerOf(o);
    return c.cx === cx && c.cy === cy;
  }).map((o) => o.id);
  return { cx, cy, terrain, blocked, halo, owned, neighbours };
}

export { chunkKey };

/** Dựng ảnh địa hình của một chunk (RGBA CHUNK_PX × CHUNK_PX). Hàng xóm đọc từ lưới toàn cục nên liền mạch. */
export function renderChunk(world: World, painter: Painter, cx: number, cy: number, phase = 0): Uint8ClampedArray {
  const out = new Uint8ClampedArray(CHUNK_PX * CHUNK_PX * 4);
  for (let ly = 0; ly < CHUNK; ly++) {
    for (let lx = 0; lx < CHUNK; lx++) painter.paintTile(world, cx * CHUNK + lx, cy * CHUNK + ly, out, CHUNK_PX, lx * TILE, ly * TILE, phase);
  }
  return out;
}

/** Ảnh địa hình cả thế giới (RGBA) — dùng để xuất ảnh kiểm chứng và làm tham chiếu. */
export function renderWorld(world: World, painter: Painter, phase = 0): { w: number; h: number; data: Uint8ClampedArray } {
  const w = world.W * TILE;
  const h = world.H * TILE;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let ty = 0; ty < world.H; ty++) for (let tx = 0; tx < world.W; tx++) painter.paintTile(world, tx, ty, out, w, tx * TILE, ty * TILE, phase);
  return { w, h, data: out };
}

export function objectsOfChunk(world: World, cx: number, cy: number): WorldObject[] {
  return world.objects.filter((o) => {
    const c = world.ownerOf(o);
    return c.cx === cx && c.cy === cy;
  });
}
