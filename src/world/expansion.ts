import type { Blueprint, Lot } from './types';

const WORLD_WIDTH = 128;
const WORLD_HEIGHT = 64;
const CORE_OFFSET: [number, number] = [28, 14];

type Pair = [number, number];
type LotSeed = { id: string; name: string; x: number; y: number; w: number; h: number; sprite: string; size: Pair; district: string };

const shops: LotSeed[] = [
  // West: four close-set shop rows, with the narrow Hàng Mã frontage at the edge.
  { id: 'west-hang-ma', name: 'Phố Hàng Mã', x: 1, y: 18, w: 5, h: 6, sprite: 'hangma', size: [37, 61], district: 'old-quarter-extension' },
  { id: 'west-cafe-giang', name: 'Cà phê Giảng', x: 8, y: 18, w: 5, h: 6, sprite: 'cafegiang', size: [43, 66], district: 'old-quarter-extension' },
  { id: 'west-banh-mi-chao', name: 'Bánh mì chảo', x: 15, y: 18, w: 5, h: 6, sprite: 'banhmichao', size: [57, 66], district: 'old-quarter-extension' },
  { id: 'west-old-house', name: 'Nhà ống phố cổ', x: 22, y: 18, w: 6, h: 6, sprite: 'oldquarter', size: [115, 69], district: 'old-quarter-extension' },
  { id: 'west-go-dong-da', name: 'Gò Đống Đa', x: 1, y: 27, w: 6, h: 6, sprite: 'godongda', size: [80, 77], district: 'study-quarter' },
  { id: 'west-kim-lien', name: 'Nhà lưu niệm Kim Liên', x: 8, y: 27, w: 6, h: 6, sprite: 'kimlien', size: [74, 61], district: 'study-quarter' },
  { id: 'west-hoa-lo', name: 'Di tích Hỏa Lò', x: 15, y: 27, w: 6, h: 6, sprite: 'hoalo', size: [72, 55], district: 'civic-quarter' },
  { id: 'west-pho-bowl', name: 'Phở bò phố nhỏ', x: 22, y: 27, w: 6, h: 6, sprite: 'pho', size: [86, 77], district: 'food-street' },
  { id: 'west-honguom', name: 'Quảng trường Đông Kinh Nghĩa Thục', x: 1, y: 36, w: 6, h: 6, sprite: 'honguom', size: [80, 66], district: 'civic-quarter' },
  { id: 'west-egg-coffee', name: 'Cà phê trứng ngõ nhỏ', x: 8, y: 36, w: 5, h: 6, sprite: 'eggcoffee', size: [65, 78], district: 'food-street' },
  { id: 'west-banh-mi', name: 'Bánh mì Hà Nội', x: 15, y: 36, w: 6, h: 6, sprite: 'banhmi', size: [96, 59], district: 'food-street' },
  { id: 'west-bia-hoi', name: 'Bia hơi góc phố', x: 22, y: 36, w: 6, h: 6, sprite: 'biahoi', size: [96, 61], district: 'food-street' },
  { id: 'west-dan-toc', name: 'Bảo tàng Dân tộc học', x: 1, y: 45, w: 6, h: 6, sprite: 'dantoc', size: [83, 49], district: 'cultural-quarter' },
  { id: 'west-pho-cafe', name: 'Quán phở đầu ngõ', x: 8, y: 45, w: 6, h: 6, sprite: 'pho', size: [86, 77], district: 'food-street' },
  { id: 'west-bun-cha', name: 'Bún chả phố Huế', x: 15, y: 45, w: 6, h: 6, sprite: 'buncha', size: [83, 63], district: 'food-street' },
  { id: 'west-cafe-corner', name: 'Cà phê vỉa hè', x: 22, y: 45, w: 6, h: 6, sprite: 'cafegiang', size: [43, 66], district: 'food-street' },

  // East: market, artisan and food lanes. Small storefront art alternates to avoid a repeated facade wall.
  { id: 'east-pho-house', name: 'Phở gia truyền', x: 101, y: 18, w: 6, h: 6, sprite: 'pho', size: [86, 77], district: 'food-cafe-quarter' },
  { id: 'east-egg-coffee', name: 'Cà phê trứng ven phố', x: 108, y: 18, w: 5, h: 6, sprite: 'eggcoffee', size: [65, 78], district: 'food-cafe-quarter' },
  { id: 'east-banh-mi-chao', name: 'Bánh mì chảo phố Tràng Tiền', x: 115, y: 18, w: 5, h: 6, sprite: 'banhmichao', size: [57, 66], district: 'food-cafe-quarter' },
  { id: 'east-hang-ma', name: 'Gian hàng Hàng Mã', x: 122, y: 18, w: 5, h: 6, sprite: 'hangma', size: [37, 61], district: 'old-quarter-extension' },
  { id: 'east-cho-hom', name: 'Chợ Hôm', x: 101, y: 27, w: 6, h: 6, sprite: 'chohom', size: [83, 53], district: 'market-quarter' },
  { id: 'east-phung-hung', name: 'Phố bích họa Phùng Hưng', x: 108, y: 27, w: 6, h: 6, sprite: 'phunghung', size: [87, 78], district: 'cultural-quarter' },
  { id: 'east-cafe', name: 'Cà phê bên chợ', x: 115, y: 27, w: 5, h: 6, sprite: 'cafegiang', size: [43, 66], district: 'food-cafe-quarter' },
  { id: 'east-bia-hoi', name: 'Bia hơi phố Đông', x: 121, y: 27, w: 6, h: 6, sprite: 'biahoi', size: [96, 61], district: 'food-cafe-quarter' },
  { id: 'east-huong-lien', name: 'Bún chả Hương Liên', x: 101, y: 36, w: 5, h: 6, sprite: 'huonglien', size: [54, 66], district: 'food-cafe-quarter' },
  { id: 'east-bun-cha', name: 'Bún chả phố cổ', x: 108, y: 36, w: 6, h: 6, sprite: 'buncha', size: [83, 63], district: 'food-cafe-quarter' },
  { id: 'east-banh-mi', name: 'Bánh mì nóng', x: 115, y: 36, w: 6, h: 6, sprite: 'banhmi', size: [96, 59], district: 'food-cafe-quarter' },
  { id: 'east-egg-tea', name: 'Trà sen phố Đông', x: 122, y: 36, w: 5, h: 6, sprite: 'eggcoffee', size: [65, 78], district: 'food-cafe-quarter' },
  { id: 'east-long-bien-market', name: 'Chợ ven cầu Long Biên', x: 101, y: 45, w: 6, h: 6, sprite: 'chollongbien', size: [80, 63], district: 'market-quarter' },
  { id: 'east-hang-bac', name: 'Phố Hàng Bạc', x: 108, y: 45, w: 6, h: 6, sprite: 'hangbac', size: [87, 78], district: 'old-quarter-extension' },
  { id: 'east-bun-shop', name: 'Bún riêu cua đồng', x: 115, y: 45, w: 6, h: 6, sprite: 'buncha', size: [83, 63], district: 'food-cafe-quarter' },
  { id: 'east-cafe-lane', name: 'Quán cà phê góc phố', x: 122, y: 45, w: 5, h: 6, sprite: 'cafegiang', size: [43, 66], district: 'food-cafe-quarter' },
];

const civicLots: LotSeed[] = [
  { id: 'north-mausoleum', name: 'Lăng Chủ tịch Hồ Chí Minh', x: 5, y: 2, w: 9, h: 7, sprite: 'mausoleum', size: [121, 74], district: 'civic-quarter' },
  { id: 'north-ba-dinh', name: 'Quảng trường Ba Đình', x: 15, y: 2, w: 6, h: 7, sprite: 'badinh', size: [84, 69], district: 'civic-quarter' },
  { id: 'north-flag-tower', name: 'Cột cờ Hà Nội', x: 31, y: 3, w: 7, h: 7, sprite: 'cotco', size: [84, 85], district: 'cultural-quarter' },
  { id: 'north-quan-thanh', name: 'Đền Quán Thánh', x: 88, y: 3, w: 6, h: 7, sprite: 'quanthanh', size: [60, 63], district: 'cultural-quarter' },
  { id: 'north-phu-tay-ho', name: 'Phủ Tây Hồ', x: 107, y: 2, w: 7, h: 7, sprite: 'phutayho', size: [74, 61], district: 'cultural-quarter' },
  { id: 'south-hoang-thanh', name: 'Hoàng thành Thăng Long', x: 37, y: 52, w: 7, h: 7, sprite: 'hoangthanh', size: [81, 65], district: 'cultural-quarter' },
  { id: 'south-go-dong-da', name: 'Gò Đống Đa', x: 2, y: 52, w: 7, h: 7, sprite: 'godongda', size: [80, 77], district: 'study-quarter' },
  { id: 'south-kim-lien', name: 'Nhà lưu niệm Kim Liên', x: 12, y: 52, w: 7, h: 7, sprite: 'kimlien', size: [74, 61], district: 'study-quarter' },
  { id: 'south-history-museum', name: 'Bảo tàng Lịch sử', x: 22, y: 52, w: 7, h: 7, sprite: 'lichsu', size: [73, 57], district: 'cultural-quarter' },
  { id: 'south-opera-court', name: 'Nhà hát Thành phố', x: 79, y: 52, w: 7, h: 7, sprite: 'nhatholon', size: [77, 79], district: 'transit-quarter' },
  { id: 'south-post-office', name: 'Bưu điện Hà Nội', x: 91, y: 52, w: 7, h: 7, sprite: 'buudien', size: [79, 50], district: 'transit-quarter' },
  { id: 'south-keangnam', name: 'Keangnam Landmark Tower', x: 103, y: 52, w: 7, h: 7, sprite: 'keangnam', size: [71, 82], district: 'mixed-use-quarter' },
  { id: 'south-quan-su', name: 'Nhà thờ Cửa Bắc', x: 114, y: 52, w: 7, h: 7, sprite: 'quansu', size: [86, 56], district: 'civic-quarter' },
  { id: 'north-garden-cafe-west', name: 'Cà phê vườn phía Tây', x: 23, y: 1, w: 5, h: 5, sprite: 'cafegiang', size: [43, 66], district: 'food-cafe-quarter' },
  { id: 'north-study-tea', name: 'Trà sen vườn học', x: 42, y: 1, w: 5, h: 5, sprite: 'eggcoffee', size: [65, 78], district: 'food-cafe-quarter' },
  { id: 'north-lotus-pho', name: 'Phở ven hồ sen', x: 78, y: 1, w: 6, h: 5, sprite: 'pho', size: [86, 77], district: 'food-cafe-quarter' },
  { id: 'north-garden-bakery', name: 'Bánh mì cổng vườn', x: 96, y: 1, w: 6, h: 5, sprite: 'banhmi', size: [96, 59], district: 'food-cafe-quarter' },
  // A continuous, fine-grain frontage below the garden loop turns the north edge into a real neighborhood.
  { id: 'north-hang-ma-alley', name: 'Hàng Mã ngõ Bắc', x: 0, y: 7, w: 4, h: 4, sprite: 'hangma', size: [37, 61], district: 'old-quarter-extension' },
  { id: 'north-banh-mi-corner', name: 'Bánh mì góc vườn', x: 22, y: 7, w: 6, h: 4, sprite: 'banhmichao', size: [57, 66], district: 'food-cafe-quarter' },
  { id: 'north-cafe-atelier', name: 'Cà phê hiên vườn', x: 39, y: 7, w: 5, h: 4, sprite: 'cafegiang', size: [43, 66], district: 'food-cafe-quarter' },
  { id: 'north-tea-house', name: 'Trà sen đường dạo', x: 48, y: 7, w: 5, h: 4, sprite: 'eggcoffee', size: [65, 78], district: 'food-cafe-quarter' },
  { id: 'north-pho-corner', name: 'Phở góc hồ', x: 72, y: 7, w: 5, h: 4, sprite: 'pho', size: [86, 77], district: 'food-cafe-quarter' },
  { id: 'north-lotus-flowers', name: 'Tiệm hoa ven hồ', x: 54, y: 7, w: 4, h: 4, sprite: 'flowers', size: [73, 56], district: 'cultural-quarter' },
  { id: 'north-hang-bac', name: 'Hàng Bạc phía Bắc', x: 115, y: 7, w: 6, h: 4, sprite: 'hangbac', size: [87, 78], district: 'old-quarter-extension' },
];

const newLot = (seed: LotSeed): Lot => ({
  ...seed,
  poiId: seed.id,
  sprite: { id: seed.id, src: `/travel/sprites/hanoi/${seed.sprite}.webp`, w: seed.size[0], h: seed.size[1] },
});

const movePair = (p: Pair, dx: number, dy: number): Pair => [p[0] + dx, p[1] + dy];

function shiftCore(core: Blueprint): Blueprint {
  const [dx, dy] = CORE_OFFSET;
  return {
    ...core,
    chunksX: 4,
    chunksY: 2,
    widthTiles: WORLD_WIDTH,
    heightTiles: WORLD_HEIGHT,
    nodes: core.nodes.map((node) => ({ ...node, x: node.x + dx, y: node.y + dy })),
    roads: core.roads.map((road) => ({ ...road, via: road.via?.map((p) => movePair(p, dx, dy)) })),
    rivers: core.rivers.map((river) => ({ ...river, pts: river.pts.map((p) => movePair(p, dx, dy)) })),
    ponds: core.ponds.map((pond) => ({ ...pond, cx: pond.cx + dx, cy: pond.cy + dy })),
    bridges: core.bridges.map((bridge) => ({ ...bridge, a: movePair(bridge.a, dx, dy), b: movePair(bridge.b, dx, dy) })),
    areas: core.areas.map((area) => {
      const shape = area.shape;
      if (shape.kind === 'rect') return { ...area, shape: { ...shape, x: shape.x + dx, y: shape.y + dy } };
      if (shape.kind === 'ellipse') return { ...area, shape: { ...shape, cx: shape.cx + dx, cy: shape.cy + dy } };
      return { ...area, shape: { ...shape, pts: shape.pts.map((p) => movePair(p, dx, dy)) } };
    }),
    lots: core.lots.map((lot) => ({ ...lot, x: lot.x + dx, y: lot.y + dy })),
    decor: core.decor.map((item) => ({ ...item, x: item.x + dx, y: item.y + dy })),
    districts: core.districts.map((district) => ({ ...district, rect: [district.rect[0] + dx, district.rect[1] + dy, district.rect[2], district.rect[3]] })),
    portals: core.portals.map((portal) => ({
      ...portal,
      fromTile: portal.fromMap === core.id ? movePair(portal.fromTile, dx, dy) : portal.fromTile,
      toSpawn: portal.toMap === core.id ? movePair(portal.toSpawn, dx, dy) : portal.toSpawn,
    })),
    spawn: movePair(core.spawn, dx, dy),
  };
}

/**
 * Extends the dense Hanoi showcase core with four walkable districts. The core keeps its local layout;
 * the surrounding streets use edge nodes as explicit hand-off points for future chunks.
 */
export function expandHanoiBlueprint(compactCore: Blueprint): Blueprint {
  const core = shiftCore(compactCore);
  const nodes: Blueprint['nodes'] = [
    // Western old-quarter / study connections.
    { id: 'west-gateway', x: 0, y: 32 }, { id: 'west-mid', x: 14, y: 32 }, { id: 'west-back-street', x: 26, y: 32 },
    { id: 'west-north-mid', x: 14, y: 22 }, { id: 'west-north-gate-link', x: 28, y: 22 },
    { id: 'west-inner-mid', x: 14, y: 27 }, { id: 'west-inner-core-link', x: 28, y: 27 },
    { id: 'west-south-mid', x: 14, y: 39 }, { id: 'west-south-core-link', x: 28, y: 39 },
    { id: 'west-market-mid', x: 14, y: 44 }, { id: 'west-market-core-link', x: 28, y: 44 },
    { id: 'west-campus-mid', x: 14, y: 52 }, { id: 'west-campus-gate-link', x: 28, y: 52 },
    { id: 'west-lane-north', x: 5, y: 22 }, { id: 'west-lane-central', x: 5, y: 44 }, { id: 'west-lane-south', x: 5, y: 52 },
    { id: 'west-alley-north', x: 22, y: 22 }, { id: 'west-alley-central', x: 22, y: 39 }, { id: 'west-alley-south', x: 22, y: 52 },

    // Eastern food / market connections.
    { id: 'east-gateway', x: 127, y: 34 }, { id: 'east-mid', x: 114, y: 34 }, { id: 'east-back-street', x: 100, y: 34 },
    { id: 'east-north-mid', x: 114, y: 22 }, { id: 'east-north-core-link', x: 100, y: 22 },
    { id: 'east-inner-mid', x: 114, y: 27 }, { id: 'east-inner-core-link', x: 100, y: 27 },
    { id: 'east-south-mid', x: 114, y: 39 }, { id: 'east-south-core-link', x: 100, y: 39 },
    { id: 'east-market-mid', x: 114, y: 44 }, { id: 'east-market-core-link', x: 100, y: 44 },
    { id: 'east-transit-mid', x: 114, y: 52 }, { id: 'east-transit-core-link', x: 100, y: 52 },
    { id: 'east-lane-north', x: 105, y: 22 }, { id: 'east-lane-central', x: 105, y: 44 }, { id: 'east-lane-south', x: 105, y: 52 },
    { id: 'east-alley-north', x: 122, y: 22 }, { id: 'east-alley-central', x: 122, y: 39 }, { id: 'east-alley-south', x: 122, y: 52 },

    // Cultural garden and event campus routes, linked into the side streets to skirt the river edge.
    { id: 'north-gateway', x: 64, y: 0 }, { id: 'north-gateway-inside', x: 64, y: 3 },
    { id: 'north-plaza', x: 64, y: 11 }, { id: 'north-west-garden', x: 45, y: 9 },
    { id: 'north-east-garden', x: 83, y: 9 }, { id: 'north-west-approach', x: 18, y: 14 }, { id: 'north-east-approach', x: 110, y: 14 },
    { id: 'north-west-waterfront', x: 18, y: 22 }, { id: 'north-east-waterfront', x: 110, y: 22 },
    { id: 'north-mausoleum-walk', x: 10, y: 12 }, { id: 'north-flag-walk', x: 34, y: 12 },
    { id: 'north-quan-thanh-walk', x: 91, y: 12 }, { id: 'north-tay-ho-walk', x: 110, y: 12 },
    { id: 'north-cafe-west-walk', x: 20, y: 8 }, { id: 'north-cafe-middle-walk', x: 44, y: 8 },
    { id: 'north-cafe-east-walk', x: 81, y: 8 }, { id: 'north-cafe-far-east-walk', x: 99, y: 8 },
    { id: 'north-frontage-west-start', x: 0, y: 11 }, { id: 'north-frontage-west-end', x: 55, y: 11 },
    { id: 'north-frontage-west-junction', x: 45, y: 11 },
    { id: 'north-frontage-east-start', x: 71, y: 11 }, { id: 'north-frontage-east-end', x: 127, y: 11 },
    { id: 'north-frontage-east-junction', x: 83, y: 11 },
    { id: 'south-gateway', x: 64, y: 63 }, { id: 'south-event-square', x: 64, y: 56 },
    { id: 'south-campus-west', x: 35, y: 56 }, { id: 'south-campus-east', x: 76, y: 56 },
    { id: 'south-campus-cross', x: 35, y: 61 }, { id: 'south-transit-cross', x: 98, y: 61 },
    { id: 'south-hoang-thanh-approach', x: 40, y: 61 },
    { id: 'south-west-frontage', x: 5, y: 61 }, { id: 'south-west-lane', x: 14, y: 61 }, { id: 'south-west-market', x: 22, y: 61 },
    { id: 'south-east-frontage', x: 105, y: 61 }, { id: 'south-east-lane', x: 114, y: 61 }, { id: 'south-east-market', x: 122, y: 61 },
  ];

  const roads: Blueprint['roads'] = [
    // West side street loops. Narrow brick lanes keep the shop rows walkable and visually tight.
    { id: 'west-entry-spine', a: 'west-gateway', b: 'west-back-street', type: 'street', width: 2.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-north-row-a', a: 'west-north-mid', b: 'west-north-gate-link', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-north-row-b', a: 'west-inner-mid', b: 'west-inner-core-link', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-main-row', a: 'west-mid', b: 'avenue-west', type: 'avenue', width: 3, sidewalk: 'both', sidewalkWidth: 1, trees: true },
    { id: 'west-south-row', a: 'west-south-mid', b: 'west-south-core-link', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-market-row', a: 'west-market-mid', b: 'west-market-core-link', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-campus-row', a: 'west-campus-mid', b: 'west-campus-gate-link', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-inner-vertical', a: 'west-north-mid', b: 'west-campus-mid', type: 'street', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-outer-vertical', a: 'west-lane-north', b: 'west-lane-south', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-alley-vertical', a: 'west-alley-north', b: 'west-alley-south', type: 'alley', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-north-approach', a: 'north-west-approach', b: 'north-west-waterfront', type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-north-connector', a: 'north-west-approach', b: 'west-north-mid', curve: true, via: [[17, 17], [14, 20]], type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'west-south-connector', a: 'west-campus-mid', b: 'south-campus-west', curve: true, via: [[20, 55], [27, 56]], type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },

    // East side streets mirror the access rhythm without mirroring the exact block shapes.
    { id: 'east-entry-spine', a: 'east-back-street', b: 'east-gateway', type: 'street', width: 2.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-north-row-a', a: 'east-north-core-link', b: 'east-north-mid', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-north-row-b', a: 'east-inner-core-link', b: 'east-inner-mid', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-main-row', a: 'avenue-east', b: 'east-back-street', type: 'avenue', width: 3, sidewalk: 'both', sidewalkWidth: 1, trees: true },
    { id: 'east-south-row', a: 'east-south-core-link', b: 'east-south-mid', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-market-row', a: 'east-market-core-link', b: 'east-market-mid', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-transit-row', a: 'east-transit-core-link', b: 'east-transit-mid', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-inner-vertical', a: 'east-north-mid', b: 'east-transit-mid', type: 'street', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-outer-vertical', a: 'east-lane-north', b: 'east-lane-south', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-alley-vertical', a: 'east-alley-north', b: 'east-alley-south', type: 'alley', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-north-approach', a: 'north-east-approach', b: 'north-east-waterfront', type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-north-connector', a: 'north-east-approach', b: 'east-north-mid', curve: true, via: [[111, 17], [114, 20]], type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'east-south-connector', a: 'east-transit-mid', b: 'south-transit-cross', type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },

    // Garden paths go around the pond and then fan into both waterfront approaches.
    { id: 'north-garden-west-loop', a: 'north-gateway', b: 'north-west-garden', curve: true, via: [[55, 2], [48, 4]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-gateway-entry', a: 'north-gateway', b: 'north-gateway-inside', type: 'path', width: 3, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-garden-east-loop', a: 'north-gateway', b: 'north-east-garden', curve: true, via: [[73, 2], [80, 4]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-garden-cross-link', a: 'north-west-garden', b: 'north-east-garden', curve: true, via: [[53, 11], [76, 11]], type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-garden-west-to-waterfront', a: 'north-west-garden', b: 'north-west-approach', curve: true, via: [[45, 11], [25, 11], [18, 12]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-garden-east-to-waterfront', a: 'north-east-garden', b: 'north-east-approach', curve: true, via: [[83, 11], [109, 11]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-west-shop-frontage', a: 'north-frontage-west-start', b: 'north-frontage-west-end', type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-east-shop-frontage', a: 'north-frontage-east-start', b: 'north-frontage-east-end', type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-west-shop-link', a: 'north-west-garden', b: 'north-frontage-west-junction', type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-east-shop-link', a: 'north-east-garden', b: 'north-frontage-east-junction', type: 'path', width: 1.5, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-mausoleum-path', a: 'north-mausoleum-walk', b: 'north-west-approach', curve: true, via: [[13, 13], [17, 14]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-flag-path', a: 'north-flag-walk', b: 'north-west-garden', type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-quan-thanh-path', a: 'north-quan-thanh-walk', b: 'north-east-garden', type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-tay-ho-path', a: 'north-tay-ho-walk', b: 'north-east-approach', type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-cafe-west-path', a: 'north-cafe-west-walk', b: 'north-west-approach', curve: true, via: [[19, 10], [18, 12]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-cafe-middle-path', a: 'north-cafe-middle-walk', b: 'north-west-garden', type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-cafe-east-path', a: 'north-cafe-east-walk', b: 'north-east-garden', type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'north-cafe-far-east-path', a: 'north-cafe-far-east-walk', b: 'north-east-approach', curve: true, via: [[103, 8], [108, 10]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-event-avenue', a: 'market-road-mid', b: 'south-event-square', type: 'street', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-event-west', a: 'south-event-square', b: 'south-campus-west', curve: true, via: [[54, 58], [45, 57]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-event-east', a: 'south-event-square', b: 'south-campus-east', curve: true, via: [[73, 57], [82, 58]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-campus-west-loop', a: 'south-campus-west', b: 'south-campus-cross', type: 'street', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-hoang-thanh-path', a: 'south-campus-west', b: 'south-hoang-thanh-approach', type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-campus-east-loop', a: 'south-campus-east', b: 'south-transit-cross', type: 'street', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-event-exit', a: 'south-event-square', b: 'south-gateway', curve: true, via: [[64, 59]], type: 'path', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-west-market-approach', a: 'west-campus-mid', b: 'south-west-lane', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-west-frontage-loop', a: 'west-lane-south', b: 'south-west-frontage', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-west-lower-loop', a: 'south-west-frontage', b: 'south-west-market', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-east-market-approach', a: 'east-transit-mid', b: 'south-east-lane', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-east-frontage-loop', a: 'east-lane-south', b: 'south-east-frontage', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
    { id: 'south-east-lower-loop', a: 'south-east-frontage', b: 'south-east-market', type: 'lane', width: 2, sidewalk: 'none', surface: 'brick', lanes: false },
  ];

  const movedNodes = nodes.map((node) => node);
  const joinedNodes = [...core.nodes, ...movedNodes];
  const areas: Blueprint['areas'] = [
    { id: 'north-cultural-garden', type: 'park', shape: { kind: 'poly', pts: [[29, 0], [99, 0], [105, 5], [101, 13], [92, 18], [34, 18], [25, 12], [24, 5]] }, name: 'Cultural Garden & Pavilion Walk' },
    { id: 'north-garden-pond', type: 'park', shape: { kind: 'ellipse', cx: 64, cy: 6, rx: 11, ry: 4 }, name: 'Lotus Pond Garden' },
    { id: 'north-ceremony-plaza', type: 'plaza', shape: { kind: 'ellipse', cx: 64, cy: 11, rx: 5, ry: 1.5 }, name: 'Cultural Gate Plaza' },
    { id: 'west-market-pocket', type: 'plaza', shape: { kind: 'ellipse', cx: 14, cy: 25, rx: 2, ry: 1 }, name: 'Old Quarter Pocket Square' },
    { id: 'south-event-park', type: 'park', shape: { kind: 'poly', pts: [[34, 52], [73, 51], [77, 56], [74, 63], [34, 63], [29, 58]] }, name: 'Festival Park' },
    { id: 'south-festival-plaza', type: 'plaza', shape: { kind: 'ellipse', cx: 64, cy: 58, rx: 8, ry: 4 }, name: 'Festival Square' },
    { id: 'south-pond', type: 'park', shape: { kind: 'ellipse', cx: 51, cy: 59, rx: 4, ry: 2.5 }, name: 'Study Garden Pond' },
  ];

  const extensionDecor: Blueprint['decor'] = [
    { id: 'north-garden-fountain', kind: 'fountain', x: 64, y: 11 },
    { id: 'north-bench-west', kind: 'bench', x: 38, y: 12 }, { id: 'north-bench-east', kind: 'bench', x: 90, y: 12 },
    { id: 'north-market-stall-a', kind: 'stall', x: 31, y: 12, variant: 1 }, { id: 'north-market-stall-b', kind: 'stall', x: 96, y: 12, variant: 2 },
    { id: 'west-tea-stall', kind: 'stall', x: 6, y: 25, variant: 0 }, { id: 'west-food-stall', kind: 'stall', x: 20, y: 43, variant: 2 },
    { id: 'west-lane-lamp', kind: 'lamp', x: 14, y: 49 }, { id: 'east-market-stall', kind: 'stall', x: 105, y: 25, variant: 1 },
    { id: 'east-noodle-stall', kind: 'stall', x: 121, y: 43, variant: 0 }, { id: 'east-lane-lamp', kind: 'lamp', x: 114, y: 49 },
    { id: 'festival-fountain', kind: 'fountain', x: 64, y: 59 },
    { id: 'festival-stall-west', kind: 'stall', x: 46, y: 55, variant: 2 }, { id: 'festival-stall-east', kind: 'stall', x: 83, y: 55, variant: 1 },
    { id: 'festival-bench-west', kind: 'bench', x: 52, y: 62 }, { id: 'festival-bench-east', kind: 'bench', x: 76, y: 62 },
  ];

  const lotList: Lot[] = [...core.lots, ...shops.map(newLot), ...civicLots.map(newLot)];
  const dx = CORE_OFFSET[0];
  const dy = CORE_OFFSET[1];
  const coreDistricts = core.districts.map((district) => ({ ...district, id: `core-${district.id}` }));
  const extensionDistricts: Blueprint['districts'] = [
    { id: 'north-cultural-district', name: 'Cultural Garden & Lotus Pond', rect: [0, 0, 128, 19] },
    { id: 'west-old-quarter-expansion', name: 'Old Quarter, Cafés & Study Lanes', rect: [0, 17, 28, 34] },
    { id: 'west-study-district', name: 'University & Memorial Gardens', rect: [0, 48, 30, 16] },
    { id: 'east-food-district', name: 'Food Street & Market Arcades', rect: [100, 17, 28, 34] },
    { id: 'east-mixed-use-district', name: 'Transit & Mixed Use', rect: [98, 49, 30, 15] },
    { id: 'south-festival-district', name: 'Festival Park & Gathering Square', rect: [30, 50, 65, 14] },
  ];

  return {
    ...core,
    id: 'band9-hanoi-riverside',
    name: 'Hanoi Riverside — Band 9 Expanded City',
    chunksX: 4,
    chunksY: 2,
    widthTiles: WORLD_WIDTH,
    heightTiles: WORLD_HEIGHT,
    nodes: joinedNodes,
    roads: [...core.roads, ...roads],
    bridges: core.bridges,
    areas: [...core.areas, ...areas],
    ponds: [...core.ponds, { id: 'north-lotus-pond', cx: 64, cy: 6, rx: 6, ry: 2 }, { id: 'south-study-pond', cx: 51, cy: 59, rx: 4, ry: 2.5 }],
    lots: lotList,
    decor: [...core.decor, ...extensionDecor],
    districts: [...coreDistricts, ...extensionDistricts],
    gateways: [
      { id: 'west-old-quarter-gateway', direction: 'west', node: 'west-gateway' },
      { id: 'east-food-street-gateway', direction: 'east', node: 'east-gateway' },
      { id: 'north-cultural-gateway', direction: 'north', node: 'north-gateway' },
      { id: 'south-festival-gateway', direction: 'south', node: 'south-gateway' },
    ],
    spawn: [64, 32],
    // The core cafe's reciprocal doorway remains shifted with its matching lot.
    portals: core.portals,
  };
}
