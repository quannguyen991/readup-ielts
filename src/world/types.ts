import type { Pt } from './geometry';

export type RoadType = 'avenue' | 'street' | 'lane' | 'alley' | 'path';
export type SidewalkSide = 'both' | 'left' | 'right' | 'none';

export type RoadNode = { id: string; x: number; y: number; /** cố ý cụt (ngõ cụt, bãi đậu) */ deadEnd?: boolean };

/** Đoạn đường: nối hai nút; `via` là các điểm uốn trung gian (toạ độ ô toàn cục). */
export type RoadSegment = {
  id: string;
  a: string;
  b: string;
  via?: [number, number][];
  curve?: boolean;
  type: RoadType;
  /** Bề rộng mặt đường (ô). Mặc định theo loại. */
  width?: number;
  sidewalk?: SidewalkSide;
  sidewalkWidth?: number;
  /** Vạch kẻ giữa đường (mặc định true cho avenue/street). */
  lanes?: boolean;
  trees?: boolean;
  lamps?: boolean;
  /** Mặt đường gạch đỏ thay vì nhựa. */
  surface?: 'asphalt' | 'brick' | 'path';
};

export type River = {
  id: string;
  pts: [number, number][];
  /** Bề rộng nước (ô) tại từng điểm; nội suy theo cung. */
  width: number[];
  curve?: boolean;
  /** Lối đi ven sông: bề rộng (ô) và mặt. */
  promenade?: { width: number; surface: 'brick' | 'sidewalk' };
  /** Kè đá ở bờ (mặc định true). */
  embankment?: boolean;
  wobble?: number;
};

export type Pond = { id: string; cx: number; cy: number; rx: number; ry: number };

export type Bridge = {
  id: string;
  /** Hai đầu (ô toàn cục), nằm trên mặt đường/ lối đi hai bờ. */
  a: [number, number];
  b: [number, number];
  width: number;
  kind: 'road' | 'foot';
  /** Đoạn đường mà cầu nối tiếp (để kiểm tra đầu cầu). */
  joins?: [string, string];
};

export type AreaShape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'poly'; pts: [number, number][] };

export type Area = {
  id: string;
  type: 'plaza' | 'park' | 'sand' | 'lotground';
  shape: AreaShape;
  name?: string;
};

export type SpriteRef = { id: string; src: string; w: number; h: number };

export type Lot = {
  id: string;
  /** Ô góc trên-trái và cỡ nền (ô): luôn bao trọn sprite. */
  x: number;
  y: number;
  w: number;
  h: number;
  sprite: SpriteRef;
  poiId?: string;
  district?: string;
  /** Lối vào nội thất (portal) — nếu có. */
  portalTo?: string;
  name?: string;
};

export type Decor = { id: string; kind: 'tree' | 'lamp' | 'bench' | 'fountain' | 'bush' | 'stall' | 'bollard'; x: number; y: number; variant?: number };

export type District = { id: string; name: string; rect: [number, number, number, number] };

/** Lối mở có chủ đích ở mép thế giới để nối thêm quận trong bản mở rộng sau. */
export type DistrictGateway = { id: string; direction: 'north' | 'east' | 'south' | 'west'; node: string };

export type Portal = {
  id: string;
  fromMap: string;
  /** Ô kích hoạt (thảm cửa) trong bản đồ nguồn. */
  fromTile: [number, number];
  toMap: string;
  /** Ô xuất hiện ở bản đồ đích và hướng quay mặt. */
  toSpawn: [number, number];
  entryDir: 'up' | 'down' | 'left' | 'right';
  exitDir: 'up' | 'down' | 'left' | 'right';
};

export type Blueprint = {
  id: string;
  name: string;
  seed: number;
  /** Số chunk theo mỗi chiều (nguồn gốc ở chunk (0,0)). */
  chunksX: number;
  chunksY: number;
  /** Tuỳ chọn thu gọn khu chơi trong các chunk biên, vẫn giữ nguyên lưới chunk. */
  widthTiles?: number;
  heightTiles?: number;
  palette: 'hanoi' | 'saigon';
  nodes: RoadNode[];
  roads: RoadSegment[];
  rivers: River[];
  ponds: Pond[];
  bridges: Bridge[];
  areas: Area[];
  lots: Lot[];
  decor: Decor[];
  districts: District[];
  gateways?: DistrictGateway[];
  portals: Portal[];
  spawn: [number, number];
};

export type { Pt };
