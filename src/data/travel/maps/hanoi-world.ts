/** Live Hanoi travel scene generated from the shared, chunk-aware Band 9 blueprint. */
import type { CityMap, MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { HANOI_STREET } from '@/data/travel/hanoi-street';
import { T, TILE } from '@/world/constants';
import { masterBlueprint } from '@/world/master-blueprint';
import { World } from '@/world/raster';
import { decorSprite } from '@/world/sprites';
import { imageMap, imagePoi } from './imagemap';

const world = new World(masterBlueprint);
const WIDTH = world.W * TILE;
const HEIGHT = world.H * TILE;
const TERRAIN_BASE = '/travel/terrain/hanoiband9';
const PROP_BASE = '/travel/sprites/hanoi-world-props';

/** Existing Hanoi catalog entries stay linked to the corresponding preserved or expanded lots. */
const POI_LOTS: Record<string, string> = {
  'hanoi-vanmieu': 'literature-temple',
  'hanoi-pho': 'pho-shop',
  'hanoi-motcot': 'mot-cot',
  'hanoi-oldquarter': 'old-quarter-house',
  'hanoi-dongxuan': 'dong-xuan',
  'hanoi-counter': 'station-cafe',
  'hanoi-thaprua': 'thap-rua',
  'hanoi-opera': 'opera-house',
  'hanoi-flowers': 'flower-shop',
  'hanoi-puppet': 'puppet-theatre',
  'hanoi-mausoleum': 'north-mausoleum',
  'hanoi-tranquoc': 'tran-quoc',
  'hanoi-doanmon': 'doan-mon',
  'hanoi-biahoi': 'bia-hoi',
  'hanoi-longbien': 'long-bien',
  'hanoi-buncha': 'bun-cha',
  'hanoi-gate': 'airport-terminal',
  'hanoi-board': 'airport-gift',
  'hanoi-eggcoffee': 'egg-coffee',
  'hanoi-nhatholon': 'south-opera-court',
  'hanoi-buudien': 'post-office',
  'hanoi-quansu': 'south-quan-su',
  'hanoi-ngocson': 'ngoc-son',
  'hanoi-cotco': 'north-flag-tower',
  'hanoi-quanthanh': 'north-quan-thanh',
  'hanoi-hoalo': 'west-hoa-lo',
  'hanoi-lichsu': 'south-history-museum',
  'hanoi-badinh': 'north-ba-dinh',
  'hanoi-dantoc': 'west-dan-toc',
  'hanoi-kimlien': 'west-kim-lien',
  'hanoi-hangma': 'west-hang-ma',
  'hanoi-godongda': 'west-go-dong-da',
  'hanoi-phutayho': 'north-phu-tay-ho',
  'hanoi-honguom': 'west-honguom',
  'hanoi-hoangthanh': 'south-hoang-thanh',
  'hanoi-hangbac': 'east-hang-bac',
  'hanoi-chohom': 'east-cho-hom',
  'hanoi-phunghung': 'east-phung-hung',
  'hanoi-huonglien': 'east-huong-lien',
  'hanoi-keangnam': 'south-keangnam',
  'hanoi-chollongbien': 'east-long-bien-market',
  'hanoi-cafegiang': 'west-cafe-giang',
  'hanoi-banhmichao': 'west-banh-mi-chao',
  'hanoi-banhmi': 'banh-mi',
  ...Object.fromEntries(HANOI_STREET.map((x) => [`hanoi-${x.lot}`, x.lot])),
};

const lotsById = new Map(masterBlueprint.lots.map((lot) => [lot.id, lot]));
const props = new Map<string, SceneSprite>();
const sprites: Record<string, SceneSprite> = {};

for (const lot of masterBlueprint.lots) {
  sprites[`lot:${lot.id}`] = { src: lot.sprite.src, w: lot.sprite.w, h: lot.sprite.h };
}

const point = (tileX: number, tileY: number) => ({ x: (tileX + 0.5) * TILE, y: (tileY + 0.5) * TILE });
const objectById = new Map<string, MapObject>();
const objects: MapObject[] = world.objects.map((item) => {
  if (item.kind === 'building') {
    const lot = lotsById.get(item.lotId ?? item.id);
    if (!lot) throw new Error(`Missing Hanoi world lot ${item.id}`);
    const sprite = `lot:${lot.id}`;
    const poiId = Object.entries(POI_LOTS).find(([, target]) => target === lot.id)?.[0];
    const object: MapObject = {
      id: item.id,
      sprite,
      x: item.px,
      y: item.py,
      footprint: {
        x: lot.x * TILE - item.px,
        y: lot.y * TILE - item.py,
        w: lot.w * TILE,
        h: Math.max(TILE, (lot.h - 1) * TILE),
      },
      door: { dx: 0, dy: TILE / 2 },
      ...(poiId ? { poiId } : {}),
    };
    objectById.set(lot.id, object);
    return object;
  }

  const spriteKey = `prop:${item.kind}:${item.variant}`;
  let sprite = props.get(spriteKey);
  if (!sprite) {
    const px = decorSprite(item.kind, item.variant);
    if (!px) throw new Error(`Missing Hanoi world prop sprite ${spriteKey}`);
    sprite = { src: `${PROP_BASE}/${item.kind}-${item.variant}.png`, w: px.w, h: px.h };
    props.set(spriteKey, sprite);
    sprites[spriteKey] = sprite;
  }
  const xs = item.block.map(([x]) => x);
  const ys = item.block.map(([, y]) => y);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const x1 = Math.max(...xs) + 1;
  const y1 = Math.max(...ys) + 1;
  return {
    id: item.id,
    sprite: spriteKey,
    x: item.px,
    y: item.py,
    footprint: {
      x: x0 * TILE - item.px,
      y: y0 * TILE - item.py,
      w: (x1 - x0) * TILE,
      h: (y1 - y0) * TILE,
    },
  };
});

const pois = Object.entries(POI_LOTS).map(([poiId, lotId]) => {
  const object = objectById.get(lotId);
  const sprite = object ? sprites[object.sprite] : undefined;
  if (!object || !sprite) throw new Error(`Missing Hanoi world POI lot ${lotId} (${poiId})`);
  return imagePoi(poiId, poiGeometry(object, sprite));
});

const nearestWalkPoint = (x: number, y: number) => {
  for (let radius = 0; radius <= 12; radius++) {
    let best: { x: number; y: number; d: number } | null = null;
    for (let ty = Math.max(0, y - radius); ty <= Math.min(world.H - 1, y + radius); ty++) {
      for (let tx = Math.max(0, x - radius); tx <= Math.min(world.W - 1, x + radius); tx++) {
        if (Math.max(Math.abs(tx - x), Math.abs(ty - y)) !== radius || !world.isWalk(tx, ty)) continue;
        const d = (tx - x) ** 2 + (ty - y) ** 2;
        if (!best || d < best.d) best = { x: tx, y: ty, d };
      }
    }
    if (best) return point(best.x, best.y);
  }
  throw new Error(`No walkable Hanoi world point near ${x},${y}`);
};

const npc = (id: string, sprite: string, tile: [number, number], en: string, vi: string): Npc => ({
  id,
  sprite,
  at: nearestWalkPoint(tile[0], tile[1]),
  lines: [{ en, vi }],
});

const npcs: Npc[] = [
  npc('hanoi-npc-pho', 'npc_vendor', [34, 31], 'The broth is simmering. Would you like beef or chicken pho?', 'Nước dùng đang sôi. Bạn muốn phở bò hay phở gà?'),
  npc('hanoi-npc-local', 'npc_local', [58, 29], 'I walk the lake path every morning before the cafés open.', 'Sáng nào tôi cũng đi dạo ven hồ trước khi quán cà phê mở cửa.'),
  npc('hanoi-npc-tourist', 'npc_tourist', [68, 31], 'Which bridge takes me to the old quarter?', 'Cây cầu nào dẫn tôi sang khu phố cổ vậy?'),
  npc('hanoi-npc-kid', 'npc_kid', [64, 35], 'The lanterns look beautiful when the sun goes down!', 'Đèn lồng đẹp lắm khi trời tối!'),
  npc('hanoi-npc-elder', 'npc_elder', [18, 37], 'Each narrow lane has its own little specialty shop.', 'Mỗi con ngõ nhỏ lại có một cửa hàng đặc trưng riêng.'),
  npc('hanoi-npc-guard', 'npc_guard', [93, 47], 'The station forecourt is just beyond the garden.', 'Sân ga nằm ngay sau khu vườn.'),
  npc('hanoi-npc-guide', 'npc_staff', [42, 13], 'The cultural garden paths loop around the lotus pond.', 'Các lối đi trong vườn văn hóa vòng quanh hồ sen.'),
  npc('hanoi-npc-student', 'npc_kid', [34, 55], 'I come here to study under the shade trees.', 'Em đến đây học bài dưới bóng cây.'),
  npc('hanoi-npc-fisher', 'npc_elder', [16, 24], 'The riverside promenade is quiet at this hour.', 'Giờ này lối dạo ven sông yên tĩnh lắm.'),
  npc('hanoi-npc-traveller', 'npc_tourist', [105, 36], 'I am looking for a good place to try egg coffee.', 'Mình đang tìm một quán cà phê trứng ngon.'),
  npc('hanoi-npc-porter', 'npc_guard', [101, 58], 'Keep to the brick path to reach the transit square.', 'Cứ đi theo lối gạch để tới quảng trường giao thông.'),
  npc('hanoi-npc-cat', 'cat_sit', [64, 58], 'Meow!', 'Meo!'),
];

const rows = Array.from({ length: world.H }, (_, y) => {
  let row = '';
  for (let x = 0; x < world.W; x++) {
    row += world.terrainAt(x, y) === T.WATER ? '~' : world.isWalk(x, y) ? '#' : '.';
  }
  return row;
});

const map: CityMap = imageMap({
  id: 'hanoi',
  name: { vi: 'Hà Nội', en: 'Hanoi' },
  utcOffsetHours: 7,
  palette: 'hanoi',
  terrain: true,
  scale: 4,
  size: { w: WIDTH, h: HEIGHT },
  spawn: point(masterBlueprint.spawn[0], masterBlueprint.spawn[1]),
  pois,
  npcs,
  routes: [
    { id: 'hanoi-world-boat', sprite: 'mini_boat', path: [point(30, 16), point(96, 16)], speed: 0.8 },
    { id: 'hanoi-world-plane', sprite: 'mini_plane', path: [point(88, 58), point(121, 58)], speed: 3.2, loop: true, layer: 'sky' },
  ],
  mask: { cell: TILE, rows },
});

map.image!.src = `${TERRAIN_BASE}.png`;
map.image!.smallSrc = `${TERRAIN_BASE}.small.png`;
map.image!.lights = world.objects.filter((item) => item.kind === 'lamp').filter((_, i) => i % 2 === 0).map((item) => ({ x: item.px, y: item.py - 16, r: 38 }));
map.scene = { sprites, objects, ambient: 12 };

export const hanoiWorld: CityMap = map;

