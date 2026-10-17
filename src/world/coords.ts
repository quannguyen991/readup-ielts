import { CHUNK, TILE } from './constants';

/** Chia nguyên làm tròn xuống (đúng với số âm). */
export const floorDiv = (a: number, b: number): number => Math.floor(a / b);
/** Dư luôn không âm. */
export const mod = (a: number, b: number): number => ((a % b) + b) % b;

export type ChunkId = { cx: number; cy: number };
export const chunkKey = (cx: number, cy: number): string => `${cx},${cy}`;

/** Chunk chứa ô toàn cục (wx, wy). */
export const chunkOfTile = (wx: number, wy: number): ChunkId => ({ cx: floorDiv(wx, CHUNK), cy: floorDiv(wy, CHUNK) });
/** Ô cục bộ trong chunk. */
export const localOfTile = (wx: number, wy: number): { lx: number; ly: number } => ({ lx: mod(wx, CHUNK), ly: mod(wy, CHUNK) });
/** worldTileX = chunkX * CHUNK + localTileX */
export const worldTile = (cx: number, cy: number, lx: number, ly: number): { wx: number; wy: number } => ({ wx: cx * CHUNK + lx, wy: cy * CHUNK + ly });
export const chunkOfPx = (px: number, py: number): ChunkId => chunkOfTile(Math.floor(px / TILE), Math.floor(py / TILE));

/** Hướng của bốn cạnh chunk. */
export const DIRS = { N: { dx: 0, dy: -1 }, S: { dx: 0, dy: 1 }, E: { dx: 1, dy: 0 }, W: { dx: -1, dy: 0 } } as const;
export type Dir = keyof typeof DIRS;
export const neighbourChunk = (c: ChunkId, d: Dir): ChunkId => ({ cx: c.cx + DIRS[d].dx, cy: c.cy + DIRS[d].dy });
