/**
 * Hằng số chung của thế giới ngoài trời. Mọi tọa độ trong blueprint là TỌA ĐỘ Ô TOÀN CỤC (số thực, đơn vị ô),
 * gốc (0,0) ở góc trên-trái của chunk (0,0). Một ô = TILE điểm ảnh, một chunk = CHUNK × CHUNK ô.
 */
export const TILE = 16;
/** 32 ô = 512 điểm: nhẹ cho canvas di động, vẫn đủ lớn để đường/sông vắt qua nhiều chunk. */
export const CHUNK = 32;
export const CHUNK_PX = TILE * CHUNK;

/** Mã địa hình trong lưới toàn cục (Uint8). */
export const T = {
  VOID: 0,
  WATER: 1,
  GRASS: 2,
  PARK: 3,
  SAND: 4,
  PLAZA: 5,
  ASPHALT: 6,
  BRICK: 7,
  SIDEWALK: 8,
  PATH: 9,
  BRIDGE: 10,
  LOT: 11,
} as const;
export type Terrain = (typeof T)[keyof typeof T];

export const TERRAIN_NAME: Record<number, string> = {
  0: 'void', 1: 'water', 2: 'grass', 3: 'park', 4: 'sand', 5: 'plaza', 6: 'asphalt', 7: 'brick', 8: 'sidewalk', 9: 'path', 10: 'bridge', 11: 'lot',
};

/** Địa hình đi bộ được (chưa kể vật cản). */
export const WALKABLE: ReadonlySet<number> = new Set([T.GRASS, T.PARK, T.SAND, T.PLAZA, T.ASPHALT, T.BRICK, T.SIDEWALK, T.PATH, T.BRIDGE, T.LOT]);
/** Mặt cứng (gạch/đá/nhựa) khác với mặt mềm (cỏ/cát). */
export const HARD: ReadonlySet<number> = new Set([T.PLAZA, T.ASPHALT, T.BRICK, T.SIDEWALK, T.PATH, T.BRIDGE, T.LOT]);
export const SOFT: ReadonlySet<number> = new Set([T.GRASS, T.PARK, T.SAND]);
/** Mặt có xe/đường phố (dùng cho vạch kẻ, kiểm tra nối đường). */
export const ROADLIKE: ReadonlySet<number> = new Set([T.ASPHALT, T.BRICK, T.PATH, T.BRIDGE]);
