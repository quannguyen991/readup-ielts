/**
 * BỐ CỤC "4 MẢNH" DÙNG CHUNG cho các thành phố vẽ lại trên khung của Singapore (Tokyo, New York…): ảnh ĐẤT 4 mảnh được vẽ lại
 * theo chủ đề nhưng GIỮ NGUYÊN hình học (đường, ô đất trống, đài tròn, nước, cầu) nên dùng chung lưới đi được, đường nối,
 * vị trí ô đất của Singapore. Mỗi thành phố chỉ cần: bộ sprite công trình riêng, gán công trình/địa điểm vào các ô đất, NPC.
 * Toạ độ là điểm nguồn của ảnh đất; (x, y) của vật là GIỮA-ĐÁY sprite.
 */
import type { CityId, CityMap, MapObject, Npc, SceneSprite } from '@/services/travel/types';
import type { Bi } from '@/i18n/useL';
import { poiGeometry } from '@/components/travel/engine/scene';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { imageMap, imagePoi } from './imagemap';
import { seamDecor } from './seams';
import { SINGAPORE_SCENE_MASK, SINGAPORE_SCENE_MASK_CELL } from './singapore.scene-walk';
import { SINGAPORE_SCENE_E_MASK } from './singapore.scene-walk-e';
import { SINGAPORE_SCENE_S_MASK } from './singapore.scene-walk-s';
import { SINGAPORE_SCENE_SE_MASK } from './singapore.scene-walk-se';

export const PW = 418;
export const PH = 235;
export const OV = 20;
export const EX = PW - OV;
export const SY = PH - OV;
export const WORLD = { w: EX + PW, h: SY + PH };

const linkLine = (from: number, to: number, a: { x: number; y: number }, b: { x: number; y: number }, r = 10, step = 12) => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
  return Array.from({ length: n + 1 }, (_, i) => ({ from, to, x: Math.round(a.x + ((b.x - a.x) * i) / n), y: Math.round(a.y + ((b.y - a.y) * i) / n), r }));
};

export const SG_LINKS = [
  { from: 0, to: 1, x: EX + OV / 2, y: 111, r: 12 },
  { from: 0, to: 2, x: 221, y: SY + OV / 2, r: 12 },
  ...linkLine(2, 3, { x: EX + 2, y: SY + 105 }, { x: EX + OV - 2, y: SY + 70 }),
  ...linkLine(1, 3, { x: EX + 240, y: SY + 2 }, { x: EX + 170, y: SY + OV - 2 }),
];

type Foot = { x: number; y: number; w: number; h: number };
const DOOR = { dx: 0, dy: 6 };

/** Các ô đất công trình (giống Singapore). */
export const SLOTS = {
  top: { x: 230, y: 72, f: { x: -54, y: -20, w: 108, h: 20 } as Foot, door: { dx: 0, dy: 6 } },
  left: { x: 117, y: 95, f: { x: -56, y: -22, w: 112, h: 22 } as Foot, door: DOOR },
  bottomLeft: { x: 125, y: 184, f: { x: -54, y: -26, w: 108, h: 26 } as Foot, door: { dx: 0, dy: 5 } },
  bottomRight: { x: 342, y: 178, f: { x: -44, y: -20, w: 88, h: 20 } as Foot, door: { dx: -1, dy: 5 } },
  right: { x: 333, y: 104, f: { x: -26, y: -16, w: 52, h: 16 } as Foot, door: DOOR },
  center: { x: 230, y: 120, f: { x: -30, y: -22, w: 60, h: 22 } as Foot, door: { dx: 0, dy: 7 } },
  gate: { x: 210, y: 228, f: { x: -56, y: -16, w: 112, h: 16 } as Foot, door: { dx: 0, dy: 5 } },
  cornerNE: { x: 352, y: 62, f: { x: -48, y: -14, w: 96, h: 14 } as Foot, door: DOOR },
  eTop: { x: EX + 116, y: 66, f: { x: -54, y: -18, w: 108, h: 18 } as Foot, door: { dx: -1, dy: 5 } },
  eMid: { x: EX + 237, y: 77, f: { x: -36, y: -16, w: 72, h: 16 } as Foot, door: DOOR },
  eRight: { x: EX + 310, y: 122, f: { x: -46, y: -16, w: 92, h: 16 } as Foot, door: DOOR },
  seLeft: { x: EX + 96, y: SY + 54, f: { x: -54, y: -16, w: 108, h: 16 } as Foot, door: DOOR },
  seRight: { x: EX + 248, y: SY + 58, f: { x: -54, y: -16, w: 108, h: 16 } as Foot, door: DOOR },
  seLow: { x: EX + 279, y: SY + 122, f: { x: -48, y: -18, w: 96, h: 18 } as Foot, door: DOOR },
  sLeft: { x: 117, y: SY + 86, f: { x: -48, y: -18, w: 96, h: 18 } as Foot, door: DOOR },
  sRight: { x: 326, y: SY + 86, f: { x: -50, y: -18, w: 100, h: 18 } as Foot, door: DOOR },
  sLowLeft: { x: 127, y: SY + 154, f: { x: -50, y: -18, w: 100, h: 18 } as Foot, door: DOOR },
  sMidRight: { x: 326, y: SY + 146, f: { x: -48, y: -18, w: 96, h: 18 } as Foot, door: DOOR },
  sBottomRight: { x: 330, y: SY + 200, f: { x: -46, y: -20, w: 92, h: 20 } as Foot, door: DOOR },
} as const;

export type SlotId = keyof typeof SLOTS;

/** Đạo cụ cảnh quan (cây, ghế, đèn) đặt dọc lối dạo — vị trí lấy từ Singapore. */
const PROP_SPOTS: { id: string; kind: 'treeA' | 'treeB' | 'bench' | 'lamp'; x: number; y: number }[] = [
  { id: 'p1', kind: 'treeA', x: 168, y: 132 }, { id: 'p2', kind: 'treeB', x: 292, y: 130 }, { id: 'p3', kind: 'treeA', x: 70, y: 140 }, { id: 'p4', kind: 'treeB', x: 258, y: 196 },
  { id: 'b1', kind: 'bench', x: 190, y: 126 }, { id: 'b2', kind: 'bench', x: 300, y: 120 },
  { id: 'l1', kind: 'lamp', x: 150, y: 116 }, { id: 'l2', kind: 'lamp', x: 215, y: 118 }, { id: 'l3', kind: 'lamp', x: 320, y: 118 }, { id: 'l4', kind: 'lamp', x: 180, y: 205 },
  { id: 'e-p1', kind: 'treeA', x: EX + 40, y: 150 }, { id: 'e-p2', kind: 'treeB', x: EX + 380, y: 150 }, { id: 'e-p3', kind: 'treeA', x: EX + 300, y: 185 }, { id: 'e-p4', kind: 'treeB', x: EX + 105, y: 168 }, { id: 'e-p5', kind: 'treeA', x: EX + 222, y: 190 },
  { id: 'e-b1', kind: 'bench', x: EX + 160, y: 152 }, { id: 'e-b2', kind: 'bench', x: EX + 230, y: 106 },
  { id: 'e-l1', kind: 'lamp', x: EX + 150, y: 76 }, { id: 'e-l2', kind: 'lamp', x: EX + 240, y: 140 },
  { id: 'se-p1', kind: 'treeA', x: EX + 88, y: SY + 140 }, { id: 'se-p2', kind: 'treeB', x: EX + 210, y: SY + 150 }, { id: 'se-p3', kind: 'treeA', x: EX + 330, y: SY + 140 },
  { id: 'se-b1', kind: 'bench', x: EX + 150, y: SY + 110 }, { id: 'se-l1', kind: 'lamp', x: EX + 200, y: SY + 100 },
  { id: 's-p1', kind: 'treeA', x: 60, y: SY + 120 }, { id: 's-p2', kind: 'treeB', x: 270, y: SY + 60 }, { id: 's-p3', kind: 'treeA', x: 207, y: SY + 180 },
  { id: 's-b1', kind: 'bench', x: 258, y: SY + 120 }, { id: 's-l1', kind: 'lamp', x: 190, y: SY + 60 }, { id: 's-l2', kind: 'lamp', x: 270, y: SY + 100 },
];

const PROP_FOOT: Record<'treeA' | 'treeB' | 'bench' | 'lamp', Foot> = {
  treeA: { x: -4, y: -6, w: 8, h: 6 },
  treeB: { x: -4, y: -6, w: 8, h: 6 },
  bench: { x: -12, y: -5, w: 24, h: 5 },
  lamp: { x: -2, y: -3, w: 4, h: 3 },
};

export type SgCityConfig = {
  id: CityId;
  name: Bi;
  utcOffsetHours: number;
  /** Sprite công trình (tệp trong /travel/sprites/<id>/). Phải có: treeA, treeB, bench, lamp. */
  sprites: Record<string, SceneSprite>;
  /** Công trình đặt vào từng ô đất; `poi` là mã địa điểm trong danh mục. Ô nào không khai thì để trống. */
  slots: Partial<Record<SlotId, { sprite: string; poi?: string }>>;
  npcs: Npc[];
  spawn?: { x: number; y: number };
  /** Bỏ qua các đạo cụ (cây/ghế/đèn) ở những ô này nếu trùng công trình. */
  skipProps?: string[];
};

export function buildSgLayoutCity(cfg: SgCityConfig): CityMap {
  const fp = (sprite: string, frac = 0.4, inset = 0.06): Foot => {
    const s = cfg.sprites[sprite]!;
    return { x: -Math.round((s.w * (1 - inset * 2)) / 2), y: -Math.round(s.h * frac), w: Math.round(s.w * (1 - inset * 2)), h: Math.round(s.h * frac) };
  };
  const objects: MapObject[] = [];
  for (const [slot, def] of Object.entries(cfg.slots) as [SlotId, { sprite: string; poi?: string }][]) {
    const s = SLOTS[slot];
    objects.push({ id: slot, sprite: def.sprite, x: s.x, y: s.y, footprint: s.f, ...(def.poi ? { poiId: def.poi, door: s.door } : {}) });
  }
  for (const p of PROP_SPOTS) {
    if (cfg.skipProps?.includes(p.id)) continue;
    const sprite = p.kind === 'treeA' ? 'treeA' : p.kind === 'treeB' ? 'treeB' : p.kind;
    objects.push({ id: p.id, sprite, x: p.x, y: p.y, footprint: PROP_FOOT[p.kind], ...(p.kind === 'lamp' ? { glow: { dx: 0, dy: -44, r: 26 } } : {}) });
  }
  void fp;
  const mask = composeMask(
    WORLD,
    SINGAPORE_SCENE_MASK_CELL,
    [
      { x: 0, y: 0, w: PW, h: PH, cell: SINGAPORE_SCENE_MASK_CELL, rows: SINGAPORE_SCENE_MASK },
      { x: EX, y: 0, w: PW, h: PH, cell: SINGAPORE_SCENE_MASK_CELL, rows: SINGAPORE_SCENE_E_MASK },
      { x: 0, y: SY, w: PW, h: PH, cell: SINGAPORE_SCENE_MASK_CELL, rows: SINGAPORE_SCENE_S_MASK },
      { x: EX, y: SY, w: PW, h: PH, cell: SINGAPORE_SCENE_MASK_CELL, rows: SINGAPORE_SCENE_SE_MASK },
    ],
    SG_LINKS,
  );
  const seams = seamDecor({
    prefix: 'seam',
    maskRows: mask,
    cell: SINGAPORE_SCENE_MASK_CELL,
    lines: [
      { x0: EX + OV / 2, y0: 10, x1: EX + OV / 2, y1: PH - 4 },
      { x0: EX + OV / 2, y0: SY + 4, x1: EX + OV / 2, y1: WORLD.h - 10 },
      { x0: 10, y0: SY + OV / 2, x1: PW - 4, y1: SY + OV / 2 },
      { x0: EX + 4, y0: SY + OV / 2, x1: WORLD.w - 10, y1: SY + OV / 2 },
    ],
    gaps: SG_LINKS,
    sprites: ['treeA', 'treeB'],
  });
  const poiOf = (poiId: string) => {
    const o = objects.find((x) => x.poiId === poiId);
    if (!o) throw new Error(`Không có công trình cho địa điểm ${poiId}`);
    const g = poiGeometry(o, cfg.sprites[o.sprite]!);
    return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
  };
  const poiIds = Object.values(cfg.slots).flatMap((d) => (d?.poi ? [d.poi] : []));
  const m = imageMap({
    id: cfg.id,
    name: cfg.name,
    utcOffsetHours: cfg.utcOffsetHours,
    spawn: cfg.spawn ?? { x: 230, y: 200 },
    pois: poiIds.map(poiOf),
    npcs: cfg.npcs,
    routes: [
      { id: `${cfg.id}-boat-w`, sprite: 'mini_boat', path: [{ x: 14, y: 70 }, { x: 14, y: 150 }], speed: 0.7 },
      { id: `${cfg.id}-plane`, sprite: 'mini_plane', path: [{ x: -30, y: 22 }, { x: 450, y: 70 }], speed: 3.6, loop: true, layer: 'sky' },
    ],
    size: WORLD,
    panels: [
      { suffix: '', x: 0, y: 0 },
      { suffix: '-e', x: EX, y: 0 },
      { suffix: '-s', x: 0, y: SY },
      { suffix: '-se', x: EX, y: SY },
    ],
    links: SG_LINKS,
    mask: { cell: SINGAPORE_SCENE_MASK_CELL, rows: mask },
    sounds: ['city-day', 'water-lap'],
    terrain: true,
  });
  m.scene = { sprites: cfg.sprites, objects: [...objects, ...seams], ambient: 16 };
  return m;
}
