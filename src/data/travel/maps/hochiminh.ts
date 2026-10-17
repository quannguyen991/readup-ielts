/**
 * TP. HỒ CHÍ MINH — CHẾ ĐỘ ĐỐI TƯỢNG, MẢNH A (trung tâm Sài Gòn bên sông). Ảnh ĐẤT `public/travel/terrain/hochiminh.small.png`
 * (418×235) + lưới đi được `hochiminh.scene-walk.ts` (khoá `hochiminh-scene`); công trình là sprite đứng riêng trong
 * `public/travel/sprites/hochiminh/`, (x,y) là GIỮA-ĐÁY. Cầu đá bên phải nối sang mảnh E, vạch qua đường dưới nối sang mảnh S.
 * Gán địa điểm: Dinh Độc Lập (ô trên giữa), Nhà thờ Đức Bà (trái trên), Bưu điện (trái giữa), Landmark 81 (phải trên),
 * Bitexco (phải giữa), chợ Bến Thành (trái dưới), quán cơm tấm (dưới giữa), xe bánh mì (phải dưới); bể nước giữa để trống.
 * Các sprite còn lại (opera, warmuseum, phoshop, cafesua, thienhau, skydeck, cuchi, mekong, airport, buivien) để dành cho E/S/SE.
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { HOCHIMINH_SCENE_MASK, HOCHIMINH_SCENE_MASK_CELL } from './hochiminh.scene-walk';
import { HOCHIMINH_SCENE_E_MASK } from './hochiminh.scene-walk-e';
import { HOCHIMINH_SCENE_S_MASK } from './hochiminh.scene-walk-s';
import { HOCHIMINH_SCENE_SE_MASK } from './hochiminh.scene-walk-se';
import { HOCHIMINH_SCENE_NW_MASK } from './hochiminh.scene-walk-nw';
import { HOCHIMINH_SCENE_N_MASK } from './hochiminh.scene-walk-n';
import { HOCHIMINH_SCENE_NE_MASK } from './hochiminh.scene-walk-ne';
import { HOCHIMINH_SCENE_W_MASK } from './hochiminh.scene-walk-w';
import { HOCHIMINH_SCENE_SW_MASK } from './hochiminh.scene-walk-sw';
import { HOCHIMINH_SCENE_NEE_MASK } from './hochiminh.scene-walk-nee';
import { HOCHIMINH_SCENE_EE_MASK } from './hochiminh.scene-walk-ee';
import { HOCHIMINH_SCENE_ESE_MASK } from './hochiminh.scene-walk-ese';

/** Thế giới 2×2 mảnh 418×235 chồng nhau OV điểm (hoà Bayer): E lệch phải, S lệch xuống, SE lệch cả hai. Hộp bao 816×450. */
const PW = 418;
const PH = 235;
const OV = 20;
const EX = PW - OV;
const SY = PH - OV;
const WORLD = { w: EX + PW, h: SY + PH };
/** Thế giới 3×3 mảnh: mảnh A (gốc cũ) nằm ở SHIFT; thêm hàng Bắc (NW, N, NE) và cột Tây (W, SW). Mọi toạ độ cũ đều dịch theo SHIFT. */
const SHIFT = { x: PW - OV, y: PH - OV };
const sh = <T extends { x: number; y: number }>(p: T): T => ({ ...p, x: p.x + SHIFT.x, y: p.y + SHIFT.y });
/** Cột Đông thứ hai (EE, ESE) nối tiếp cột E, chỉ có ở hai hàng giữa và nam (bờ sông và khu lô đất bên phải). */
const EE_X = SHIFT.x + 2 * EX;
const WORLD3 = { w: EE_X + PW, h: SHIFT.y + WORLD.h };

const linkLine = (from: number, to: number, a: { x: number; y: number }, b: { x: number; y: number }, r = 10, step = 12) => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
  return Array.from({ length: n + 1 }, (_, i) => ({ from, to, x: Math.round(a.x + ((b.x - a.x) * i) / n), y: Math.round(a.y + ((b.y - a.y) * i) / n), r }));
};
const LINKS_A = [
  { from: 0, to: 1, x: EX + OV / 2, y: 98, r: 12 }, // cầu đá bên phải A ↔ cầu bên trái E
  { from: 0, to: 2, x: 209, y: SY + OV / 2, r: 12 }, // vạch qua đường dưới A ↔ vạch trên S
  ...linkLine(2, 3, { x: EX + 2, y: SY + 110 }, { x: EX + OV - 2, y: SY + 74 }),
  ...linkLine(1, 3, { x: EX + 212, y: SY + 2 }, { x: EX + 176, y: SY + OV - 2 }),
];
/** Ba cầu: một qua kênh Tây Bắc (giữa mảnh Tây Bắc và Tây), hai qua kênh trên đỉnh mảnh A (nối mảnh Bắc). */
const BRIDGES = [
  { x: 100, y: 208 },
  { x: 280, y: 208 },
  { x: 560, y: 250 },
  { x: 720, y: 250 },
];
/** Cầu nối cũ (giữ làm khe cho trang trí). */
const LINKS_BASE = LINKS_A.map(sh);
/** Điểm dọc mọi ranh giới giữa các mảnh (mỗi 10 ô), bỏ chỗ nước: nhờ vậy mảnh nào cũng đi tới được. */
const seamPoints = () => {
  const out: { from: number; to: number; x: number; y: number; r: number }[] = [];
  const vertical: [number, number][] = [[SHIFT.x + OV / 2, 0], [SHIFT.x + EX + OV / 2, 0], [EE_X + OV / 2, 0]];
  for (const [x, y0] of vertical) for (let y = y0; y <= WORLD3.h; y += 10) out.push({ from: 0, to: 0, x, y, r: 10 });
  // ranh giới ngang: hàng trên chỉ tới hết mảnh E (x ≤ SHIFT.x + EX + PW), hàng giữa/nam tới hết cột EE
  for (let x = 0; x <= WORLD3.w; x += 10) out.push({ from: 0, to: 0, x, y: SHIFT.y + OV / 2, r: 10 });
  for (let x = 0; x <= WORLD3.w; x += 10) out.push({ from: 0, to: 0, x, y: SHIFT.y + SY + OV / 2, r: 10 });
  return out;
};
import { vietnamTiles } from './vietnam.tiles';

const SPRITES: Record<string, SceneSprite> = {
  palace: { w: 130, h: 65 },
  notredame: { w: 78, h: 81 },
  postoffice: { w: 120, h: 72 },
  landmark81: { w: 69, h: 76 },
  bitexco: { w: 66, h: 75 },
  benthanh: { w: 120, h: 76 },
  comtam: { w: 79, h: 65 },
  banhmi: { w: 86, h: 63 },
  skydeck: { w: 93, h: 80 },
  opera: { w: 106, h: 65 },
  thienhau: { w: 130, h: 72 },
  phoshop: { w: 85, h: 70 },
  warmuseum: { w: 122, h: 66 },
  cafesua: { w: 109, h: 69 },
  buivien: { w: 121, h: 64 },
  cuchi: { file: 'cuchi.png', w: 59, h: 51 },
  mekong: { w: 124, h: 68 },
  airport: { w: 142, h: 70 },
  bridge_ns: { w: 18, h: 28 },
  trade: { file: 'trade.png', w: 40, h: 80 },
  seambush_a: { file: 'seambush_a.png', w: 16, h: 14 },
  seambush_b: { file: 'seambush_b.png', w: 18, h: 15 },
  seambush_c: { file: 'seambush_c.png', w: 14, h: 12 },
  shophouse: { file: 'shophouse.png', w: 42, h: 42 },
  ngochoang: { file: 'ngochoang.png', w: 86, h: 57 },
  giaclam: { file: 'giaclam.png', w: 87, h: 78 },
  kimbien: { file: 'kimbien.png', w: 87, h: 50 },
  levantam: { file: 'levantam.png', w: 87, h: 78 },
  'palace-84': { file: 'palace.png', w: 109, h: 55 },
  'landmark81-84': { file: 'landmark81.png', w: 58, h: 64 },
  'benthanh-76': { file: 'benthanh.png', w: 91, h: 58 },
  'thienhau-76': { file: 'thienhau.png', w: 99, h: 55 },
  'buivien-76': { file: 'buivien.png', w: 92, h: 49 },
  'mekong-84': { file: 'mekong-84.png', w: 58, h: 52 },
  conrua: { file: 'conrua.png', w: 55, h: 49 },
  taodan: { file: 'taodan.png', w: 63, h: 63 },
  lanhong: { file: 'lanhong.png', w: 65, h: 62 },
  vinhnghiem: { file: 'vinhnghiem.png', w: 69, h: 70 },
  tandinh: { file: 'tandinh.png', w: 64, h: 68 },
  lichsutp: { file: 'lichsutp.png', w: 69, h: 58 },
  thaocam: { file: 'thaocam.png', w: 72, h: 59 },
  nharong: { file: 'nharong.png', w: 84, h: 68 },
  binhtay: { file: 'binhtay.png', w: 89, h: 68 },
  nguyenhue: { file: 'nguyenhue.png', w: 75, h: 74 },
  phoga: { file: 'phoga.png', w: 42, h: 40 },
  phobo: { file: 'phobo.png', w: 43, h: 41 },
  bunmam: { file: 'bunmam.png', w: 43, h: 41 },
  bunrieu: { file: 'bunrieu.png', w: 44, h: 41 },
  hutieu: { file: 'hutieu.png', w: 46, h: 42 },
  comga: { file: 'comga.png', w: 49, h: 45 },
  bunthit: { file: 'bunthit.png', w: 53, h: 48 },
  banhcuon: { file: 'banhcuon.png', w: 51, h: 46 },
  banhcanh: { file: 'banhcanh.png', w: 49, h: 47 },
  chaolong: { file: 'chaolong.png', w: 48, h: 46 },
  banhbeo: { file: 'banhbeo.png', w: 48, h: 44 },
  xoi: { file: 'xoi.png', w: 48, h: 44 },
  banhbao: { file: 'banhbao.png', w: 45, h: 44 },
  nuongtam: { file: 'nuongtam.png', w: 47, h: 44 },
  oc: { file: 'oc.png', w: 45, h: 44 },
  cafevot: { file: 'cafevot.png', w: 53, h: 53 },
  sinhto: { file: 'sinhto.png', w: 49, h: 45 },
  nuocmia: { file: 'nuocmia.png', w: 50, h: 50 },
  nuocep: { file: 'nuocep.png', w: 50, h: 44 },
  kem: { file: 'kem.png', w: 57, h: 51 },
  banhflan: { file: 'banhflan.png', w: 52, h: 51 },
  suadau: { file: 'suadau.png', w: 37, h: 35 },
  banhngot: { file: 'banhngot.png', w: 42, h: 40 },
  tratiem: { file: 'tratiem.png', w: 51, h: 49 },
  banhtrang: { file: 'banhtrang.png', w: 54, h: 49 },
  vitquay: { file: 'vitquay.png', w: 54, h: 49 },
  haisan: { file: 'haisan.png', w: 54, h: 48 },
  bialo: { file: 'bialo.png', w: 62, h: 55 },
  nonla: { file: 'nonla.png', w: 59, h: 54 },
  tranhtiem: { file: 'tranhtiem.png', w: 51, h: 44 },
  giaydep: { file: 'giaydep.png', w: 43, h: 40 },
  quanao: { file: 'quanao.png', w: 41, h: 44 },
  suaxe: { file: 'suaxe.png', w: 54, h: 44 },
  dienthoai: { file: 'dienthoai.png', w: 44, h: 44 },
  nhasach: { file: 'nhasach.png', w: 46, h: 44 },
  trongiam: { file: 'trongiam.png', w: 59, h: 44 },
  tiemvang: { file: 'tiemvang.png', w: 39, h: 36 },
  banhxeo: { file: 'banhxeo.png', w: 40, h: 36 },
  trasua: { file: 'trasua.png', w: 39, h: 36 },
  tiemhoa: { file: 'tiemhoa.png', w: 38, h: 36 },
  sachcu: { file: 'sachcu.png', w: 32, h: 30 },
  quanche: { file: 'quanche.png', w: 32, h: 30 },
  giatui: { file: 'giatui.png', w: 30, h: 28 },
  xedap: { file: 'xedap.png', w: 43, h: 40 },
  comchay: { file: 'comchay.png', w: 42, h: 40 },
  buucuc: { file: 'buucuc.png', w: 41, h: 40 },
  quanbia: { file: 'quanbia.png', w: 28, h: 26 },
  dodien: { file: 'dodien.png', w: 46, h: 42 },
  tiemanh: { file: 'tiemanh.png', w: 42, h: 44 },
  nhathuoc: { file: 'nhathuoc.png', w: 42, h: 44 },
  minimart: { file: 'minimart.png', w: 42, h: 44 },
  nhatro: { file: 'nhatro.png', w: 41, h: 44 },
  cattoc: { file: 'cattoc.png', w: 42, h: 44 },
  kara: { file: 'kara.png', w: 48, h: 44 },
  lau: { file: 'lau.png', w: 46, h: 44 },
  caphetrung: { file: 'caphetrung.png', w: 45, h: 44 },
  bunbo: { file: 'bunbo.png', w: 48, h: 44 },
  suachua: { file: 'suachua.png', w: 47, h: 44 },
  chechuoi: { file: 'chechuoi.png', w: 51, h: 44 },
  sapbao: { file: 'sapbao.png', w: 49, h: 44 },
  xekem: { file: 'xekem.png', w: 38, h: 44 },
  xenuocmia: { file: 'xenuocmia.png', w: 42, h: 44 },
  xebapnuong: { file: 'xebapnuong.png', w: 51, h: 44 },
  xetraicay: { file: 'xetraicay.png', w: 42, h: 44 },
  xedapdung: { file: 'xedapdung.png', w: 54, h: 44 },
  banghe: { file: 'banghe.png', w: 70, h: 39 },
  xebanhmi: { file: 'xebanhmi.png', w: 37, h: 44 }, 
  lamp: { file: '../hanoi/lamp.png', w: 16, h: 72 },
  lampS: { file: '../hanoi/lamp.png', w: 16, h: 30, crop: { x: 0, y: 42, w: 16, h: 30 } },
};

const fp = (sprite: string, frac = 0.22, inset = 0.1) => {
  const s = SPRITES[sprite]!;
  const w = Math.round(s.w * (1 - inset * 2));
  const h = Math.max(4, Math.round(s.h * frac));
  return { x: -Math.round(w / 2), y: -h, w, h };
};
const O = (id: string, sprite: string, x: number, y: number, extra: Partial<MapObject> = {}): MapObject => ({ id, sprite, x, y, footprint: fp(sprite), ...extra });

const OBJECTS: MapObject[] = [
  O('palace', 'palace-84', 228, 77, { poiId: 'hochiminh-independence', door: { dx: 0, dy: 8 } }),
  O('notredame', 'notredame', 85, 87, { poiId: 'hochiminh-notredame', door: { dx: 0, dy: 5 } }),
  O('postoffice', 'postoffice', 280, 308, { poiId: 'hochiminh-postoffice', door: { dx: -1, dy: 14 } }),
  O('landmark81', 'landmark81-84', 382, 90, { poiId: 'hochiminh-landmark81', door: { dx: 0, dy: 6 } }),
  O('bitexco', 'bitexco', 322, 125, { poiId: 'hochiminh-bitexco', door: { dx: 0, dy: 13 } }),
  O('benthanh', 'benthanh-76', 86, 185, { poiId: 'hochiminh-benthanh', door: { dx: 0, dy: 11 } }),
  O('comtam', 'comtam', 212, 187, { poiId: 'hochiminh-comtam', door: { dx: 0, dy: 5 } }),
  O('banhmi', 'banhmi', 335, 186, { poiId: 'hochiminh-banhmi', door: { dx: 0, dy: 10 } }),
  // ---- mảnh E (lệch x = EX)
  O('e-skydeck', 'skydeck', 475, 92, { poiId: 'hochiminh-skydeck', door: { dx: 0, dy: 16 } }),
  O('e-opera', 'opera', EX + 175, 84, { poiId: 'hochiminh-opera', door: { dx: 0, dy: 4 } }),
  O('e-thienhau', 'thienhau-76', 674, 100, { poiId: 'hochiminh-thienhau', door: { dx: 0, dy: 8 } }),
  O('e-phoshop', 'phoshop', 767, 110, { poiId: 'hochiminh-phoshop', door: { dx: 0, dy: 8 } }),
  O('e-warmuseum', 'warmuseum', EX + 116, 185, { poiId: 'hochiminh-warmuseum', door: { dx: 0, dy: 6 }, footprint: { x: -34, y: -14, w: 68, h: 14 } }),
  O('e-cafesua', 'cafesua', EX + 250, 195, { poiId: 'hochiminh-cafesua', door: { dx: 0, dy: 6 } }),
  // ---- mảnh S (lệch y = SY)
  O('s-buivien', 'buivien-76', 52, 303, { poiId: 'hochiminh-buivien', door: { dx: 0, dy: 5 } }),
  O('s-cuchi', 'cuchi', 155, SY + 77, { poiId: 'hochiminh-cuchi', door: { dx: 0, dy: 19 } }),
  O('s-mekong', 'mekong-84', 147, 362, { poiId: 'hochiminh-mekong', door: { dx: 0, dy: 6 } }),
  // ---- mảnh SE (lệch x = EX, y = SY): sân bay Tân Sơn Nhất
  O('se-airport', 'airport', EX + 235, SY + 62, { poiId: 'hochiminh-gate', door: { dx: 0, dy: 5 } }),
];
/** Địa điểm mới ở 5 mảnh mới: toạ độ là toạ độ thế giới 3×3 (không dịch), đặt giữa ô đất trống. */
const NEW_OBJECTS: MapObject[] = [
  // quán ăn vỉa hè ở 4 mảnh mới (tranh có biển hiệu, chỗ đặt là ô đất trống)
  O('nw-phoga', 'phoga', 120, 55, { poiId: 'hochiminh-phoga', door: { dx: 3, dy: 2 } }),
  O('nw-phobo', 'phobo', 180, 55, { poiId: 'hochiminh-phobo', door: { dx: -1, dy: 2 } }),
  O('nw-bunmam', 'bunmam', 266, 55, { poiId: 'hochiminh-bunmam', door: { dx: -1, dy: 2 } }),
  O('nw-bunrieu', 'bunrieu', 340, 55, { poiId: 'hochiminh-bunrieu', door: { dx: 3, dy: 2 } }),
  O('nw-hutieu', 'hutieu', 170, 106, { poiId: 'hochiminh-hutieu', door: { dx: -1, dy: 3 } }),
  O('sw-comga', 'comga', 370, 484, { poiId: 'hochiminh-comga', door: { dx: 1, dy: 1 } }),
  O('nw-bunthit', 'bunthit', 340, 106, { poiId: 'hochiminh-bunthit', door: { dx: -1, dy: 1 } }),
  O('nw-banhcuon', 'banhcuon', 120, 158, { poiId: 'hochiminh-banhcuon', door: { dx: -1, dy: 1 } }),
  O('nw-banhcanh', 'banhcanh', 180, 158, { poiId: 'hochiminh-banhcanh', door: { dx: -1, dy: 1 } }),
  O('nw-chaolong', 'chaolong', 340, 158, { poiId: 'hochiminh-chaolong', door: { dx: -1, dy: 1 } }),
  O('ne-banhbeo', 'banhbeo', 897, 71, { poiId: 'hochiminh-banhbeo', door: { dx: 1, dy: 15 } }),
  O('ne-xoi', 'xoi', 1048, 89, { poiId: 'hochiminh-xoi', door: { dx: -1, dy: 8 } }),
  O('ne-banhbao', 'banhbao', 903, 121, { poiId: 'hochiminh-banhbao', door: { dx: 0, dy: 12 } }),
  O('ne-nuongtam', 'nuongtam', 965, 155, { poiId: 'hochiminh-nuongtam', door: { dx: 0, dy: 3 } }),
  O('ne-oc', 'oc', 963, 204, { poiId: 'hochiminh-oc', door: { dx: -2, dy: 7 } }),
  O('w-cafevot', 'cafevot', 168, 291, { poiId: 'hochiminh-cafevot', door: { dx: 0, dy: 3 } }),
  O('w-sinhto', 'sinhto', 364, 332, { poiId: 'hochiminh-sinhto', door: { dx: 0, dy: 3 } }),
  O('w-nuocmia', 'nuocmia', 168, 356, { poiId: 'hochiminh-nuocmia', door: { dx: -1, dy: 5 } }),
  O('w-nuocep', 'nuocep', 366, 384, { poiId: 'hochiminh-nuocep', door: { dx: -1, dy: 5 } }),
  O('w-kem', 'kem', 168, 421, { poiId: 'hochiminh-kem', door: { dx: 0, dy: 3 } }),
  O('w-banhflan', 'banhflan', 268, 421, { poiId: 'hochiminh-banhflan', door: { dx: 0, dy: 3 } }),
  O('w-suadau', 'suadau', 366, 431, { poiId: 'hochiminh-suadau', door: { dx: 0, dy: 3 } }),
  O('w-banhngot', 'banhngot', 365, 278, { poiId: 'hochiminh-banhngot', door: { dx: 0, dy: 3 } }),
  O('sw-tratiem', 'tratiem', 84, 497, { poiId: 'hochiminh-tratiem', door: { dx: 0, dy: 3 } }),
  O('sw-banhtrang', 'banhtrang', 172, 497, { poiId: 'hochiminh-banhtrang', door: { dx: 0, dy: 3 } }),
  O('sw-vitquay', 'vitquay', 274, 497, { poiId: 'hochiminh-vitquay', door: { dx: 0, dy: 3 } }),
  O('sw-haisan', 'haisan', 376, 534, { poiId: 'hochiminh-haisan', door: { dx: -1, dy: 9 } }),
  O('sw-bialo', 'bialo', 84, 570, { poiId: 'hochiminh-bialo', door: { dx: 0, dy: 3 } }),
  O('sw-nonla', 'nonla', 172, 570, { poiId: 'hochiminh-nonla', door: { dx: 0, dy: 3 } }),
  O('sw-tranhtiem', 'tranhtiem', 376, 592, { poiId: 'hochiminh-tranhtiem', door: { dx: 0, dy: 3 } }),
  O('sw-giaydep', 'giaydep', 374, 634, { poiId: 'hochiminh-giaydep', door: { dx: 0, dy: 3 } }),
  // cầu đá nhỏ bắc qua kênh Tây Bắc (không chặn lối đi, chỉ để hiện cầu)
  O('nw-conrua', 'conrua', 119, 106, { poiId: 'hochiminh-conrua', door: { dx: 0, dy: 1 } }),
  O('nw-taodan', 'taodan', 267, 158, { poiId: 'hochiminh-taodan', door: { dx: 0, dy: 1 } }),
  O('n-lanhong', 'lanhong', 600, 80, { poiId: 'hochiminh-lanhong', door: { dx: -1, dy: 5 } }),
  O('n-vinhnghiem', 'vinhnghiem', 668, 80, { poiId: 'hochiminh-vinhnghiem', door: { dx: -1, dy: 7 } }),
  O('n-tandinh', 'tandinh', 600, 167, { poiId: 'hochiminh-tandinh', door: { dx: -1, dy: -16 } }),
  O('n-lichsutp', 'lichsutp', 668, 167, { poiId: 'hochiminh-lichsutp', door: { dx: 5, dy: 6 } }),
  O('ne-thaocam', 'thaocam', 966, 89, { poiId: 'hochiminh-thaocam', door: { dx: -1, dy: 6 } }),
  O('ne-nharong', 'nharong', 1052, 204, { poiId: 'hochiminh-nharong', door: { dx: 0, dy: 3 } }),
  O('w-binhtay', 'binhtay', 268, 356, { poiId: 'hochiminh-binhtay', door: { dx: -1, dy: 5 } }),
  O('sw-nguyenhue', 'nguyenhue', 274, 570, { poiId: 'hochiminh-nguyenhue', door: { dx: 0, dy: 3 } }),
  // toà Saigon Trade Center (Tôn Đức Thắng, Quận 1) đứng ở lô đất đầu tiên bên bờ sông, mảnh EE (chỉ trang trí)
  O('ee-trade', 'trade', 1466, 408),
  // 13 quán có tranh chưa đặt, đặt vào lô đất xám trống (mỗi quán đúng một lô, cửa ở mép dưới)
  O('x-quanao', 'quanao', 751, 607, { poiId: 'hochiminh-quanao', door: { dx: 0, dy: 4 } }),
  O('x-suaxe', 'suaxe', 667, 594, { poiId: 'hochiminh-suaxe', door: { dx: 0, dy: 4 } }),
  O('x-dienthoai', 'dienthoai', 900, 487, { poiId: 'hochiminh-dienthoai', door: { dx: 0, dy: 8 } }),
  O('x-nhasach', 'nhasach', 1042, 554, { poiId: 'hochiminh-nhasach', door: { dx: 0, dy: 8 } }),
  O('x-trongiam', 'trongiam', 268, 283, { poiId: 'hochiminh-trongiam', door: { dx: 0, dy: 4 } }),
  O('x-tiemanh', 'tiemanh', 1472, 315, { poiId: 'hochiminh-tiemanh', door: { dx: 0, dy: 4 } }),
  O('x-nhathuoc', 'nhathuoc', 1573, 316, { poiId: 'hochiminh-nhathuoc', door: { dx: 0, dy: 2 } }),
  O('x-minimart', 'minimart', 1575, 360, { poiId: 'hochiminh-minimart', door: { dx: 0, dy: 4 } }),
  O('x-nhatro', 'nhatro', 1576, 410, { poiId: 'hochiminh-nhatro', door: { dx: 0, dy: 4 } }),
  O('x-cattoc', 'cattoc', 1380, 487, { poiId: 'hochiminh-cattoc', door: { dx: 0, dy: 4 } }),
  O('x-kara', 'kara', 1476, 565, { poiId: 'hochiminh-kara', door: { dx: 0, dy: 4 } }),
  O('x-lau', 'lau', 1476, 623, { poiId: 'hochiminh-lau', door: { dx: 0, dy: 4 } }),
  O('x-caphetrung', 'caphetrung', 1571, 565, { poiId: 'hochiminh-caphetrung', door: { dx: 0, dy: 4 } }),
  O('x12-tiemvang', 'tiemvang', 444, 60, { poiId: 'hochiminh-tiemvang', door: { dx: 0, dy: 4 } }),
  O('x12-banhxeo', 'banhxeo', 766, 60, { poiId: 'hochiminh-banhxeo', door: { dx: 0, dy: 4 } }),
  O('x12-trasua', 'trasua', 444, 149, { poiId: 'hochiminh-trasua', door: { dx: 0, dy: 4 } }),
  O('x12-tiemhoa', 'tiemhoa', 765, 149, { poiId: 'hochiminh-tiemhoa', door: { dx: 0, dy: 4 } }),
  O('x12-sachcu', 'sachcu', 1506, 248, { poiId: 'hochiminh-sachcu', door: { dx: 0, dy: 4 } }),
  O('x12-quanche', 'quanche', 1571, 249, { poiId: 'hochiminh-quanche', door: { dx: 0, dy: 4 } }),
  O('x12-giatui', 'giatui', 509, 329, { poiId: 'hochiminh-giatui', door: { dx: 0, dy: 11 } }),
  O('x12-xedap', 'xedap', 1471, 481),
  O('x12-comchay', 'comchay', 1573, 624, { poiId: 'hochiminh-comchay', door: { dx: 0, dy: 4 } }),
  O('x12-buucuc', 'buucuc', 1386, 559, { poiId: 'hochiminh-buucuc', door: { dx: 0, dy: 4 } }),
  O('x12-quanbia', 'quanbia', 1159, 549, { poiId: 'hochiminh-quanbia', door: { dx: 0, dy: 13 } }),
  O('x12-dodien', 'dodien', 1385, 618, { poiId: 'hochiminh-dodien', door: { dx: 0, dy: 4 } }),
  // cột đèn dọc mép đại lộ (không chặn lối đi, không có địa điểm)
  O('hcm-lamp-1', 'lampS', 458, 436, { footprint: { x: -5, y: -6, w: 10, h: 6 } }),
  O('hcm-lamp-2', 'lampS', 554, 436, { footprint: { x: -5, y: -6, w: 10, h: 6 } }),
  O('hcm-lamp-3', 'lampS', 746, 436, { footprint: { x: -5, y: -6, w: 10, h: 6 } }),
  // đạo cụ vỉa hè đặc trưng Sài Gòn (trang trí): xe bánh mì đẩy, bộ bàn ghế nhựa, xe đạp dựa tường
  O('hcm-xebanhmi', 'xebanhmi', 218, 450),
  // quán ven đường và xe bán hàng trên vỉa hè
  O('v-bunbo', 'bunbo', 796, 460, { poiId: 'hochiminh-bunbo', door: { dx: 0, dy: 4 } }),
  O('v-suachua', 'suachua', 456, 564, { poiId: 'hochiminh-suachua', door: { dx: 0, dy: 4 } }),
  O('v-chechuoi', 'chechuoi', 852, 496, { poiId: 'hochiminh-chechuoi', door: { dx: 0, dy: 4 } }),
  O('v-sapbao', 'sapbao', 792, 516, { poiId: 'hochiminh-sapbao', door: { dx: 0, dy: 4 } }),
  O('v-xekem', 'xekem', 1308, 436),
  O('v-xenuocmia', 'xenuocmia', 1388, 372),
  O('v-xebapnuong', 'xebapnuong', 1204, 372),
  O('v-xetraicay', 'xetraicay', 1236, 296),
  // nhà phố 3 tầng ở lô đất trống (trang trí)
  O('v-shophouse', 'shophouse', 1567, 487),
  // địa điểm mới (chùa, chợ, công viên) ở các lô trống
  O('x13-ngochoang', 'ngochoang', 1315, 57, { poiId: 'hochiminh-ngochoang', door: { dx: 0, dy: 4 } }),
  O('x13-giaclam', 'giaclam', 1489, 78, { poiId: 'hochiminh-giaclam', door: { dx: 0, dy: 4 } }),
  O('x13-kimbien', 'kimbien', 911, 654, { poiId: 'hochiminh-kimbien', door: { dx: 0, dy: 4 } }),
  O('x13-levantam', 'levantam', 1285, 216, { poiId: 'hochiminh-levantam', door: { dx: 0, dy: 4 } }),
];
const SCENE_OBJECTS = [
  ...OBJECTS.map(sh),
  ...NEW_OBJECTS,
  ...BRIDGES.map((b, i): MapObject => ({ id: `bridge-${i}`, sprite: 'bridge_ns', x: b.x, y: b.y, footprint: { x: -1, y: -1, w: 2, h: 2 } })),
];

const poiOf = (poiId: string) => {
  const o = SCENE_OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'hochiminh-npc-xe',
    sprite: 'npc_local',
    at: { x: 156, y: 108 },
    path: [{ x: 156, y: 129 }],
    lines: [
      { en: 'Crossing the street here? Just walk slowly and the bikes will go around you.', vi: 'Qua đường ở đây hả? Cứ đi chậm, xe máy sẽ tự tránh bạn.' },
      { en: 'Try iced coffee with milk. It is the Saigon way.', vi: 'Thử cà phê sữa đá đi. Đúng kiểu Sài Gòn đó.' },
    ],
  },
  {
    id: 'hochiminh-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 270, y: 140 },
    path: [{ x: 270, y: 100 }],
    lines: [{ en: 'Excuse me, which way to Ben Thanh Market?', vi: 'Xin lỗi, đi Chợ Bến Thành đường nào ạ?' }],
  },
  {
    id: 'hochiminh-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 300, y: 196 },
    lines: [{ en: 'Banh mi! Hot and crunchy. Pork or egg?', vi: 'Bánh mì nóng giòn đây! Thịt hay trứng?' }],
  },
  {
    id: 'hochiminh-npc-kid',
    sprite: 'npc_kid',
    at: { x: 200, y: 137 },
    lines: [{ en: 'Dad says the cathedral bricks came all the way from France.', vi: 'Bố bảo gạch của nhà thờ chở từ Pháp sang đó.' }],
  },
  {
    id: 'hochiminh-npc-guide',
    sprite: 'npc_staff',
    at: { x: EX + 212, y: 160 },
    path: [{ x: EX + 212, y: 200 }],
    lines: [
      { en: 'The Sky Deck is on the 49th floor. The lift takes less than a minute.', vi: 'Đài quan sát ở tầng 49. Thang máy đi chưa tới một phút.' },
      { en: 'Please keep quiet inside the temple.', vi: 'Xin giữ yên lặng khi vào chùa.' },
    ],
  },
  {
    id: 'hochiminh-npc-student',
    sprite: 'npc_kid',
    at: { x: 209, y: SY + 40 },
    path: [{ x: 209, y: SY + 90 }],
    lines: [{ en: 'Bui Vien is crowded at night. Hold on to your bag!', vi: 'Phố Bùi Viện tối rất đông. Giữ chặt túi nhé!' }],
  },
  {
    id: 'hochiminh-npc-boatman',
    sprite: 'npc_elder',
    at: { x: 190, y: SY + 153 },
    lines: [{ en: 'A boat trip to the Mekong Delta takes the whole day. Bring a hat.', vi: 'Đi thuyền xuống đồng bằng sông Cửu Long mất cả ngày. Nhớ mang nón.' }],
  },
  {
    id: 'hochiminh-npc-traveller',
    sprite: 'npc_tourist',
    at: { x: EX + 300, y: SY + 175 },
    path: [{ x: EX + 380, y: SY + 175 }],
    lines: [
      { en: 'Excuse me, which gate is the flight to Hanoi?', vi: 'Xin lỗi, chuyến bay đi Hà Nội ở cổng nào ạ?' },
      { en: 'It is so hot! I need an iced coffee.', vi: 'Nóng quá! Mình cần một ly cà phê đá.' },
    ],
  },
  { id: 'hochiminh-npc-cat', sprite: 'cat_sit', at: { x: 150, y: 214 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

/** Tài xế công nghệ và khách chờ xe trên đại lộ (toạ độ thế giới, không dịch): Grab, Be, Xanh SM. */
const NPCS_NEW: Npc[] = [
  {
    id: 'hochiminh-npc-grab',
    sprite: 'npc_local',
    at: { x: 262, y: 444 },
    path: [{ x: 294, y: 444 }],
    lines: [
      { en: 'Grab is here! Where should I pick you up?', vi: 'Grab đây! Bạn đặt xe ở điểm nào để tôi đón?' },
      { en: 'Tap the pin on the app and I will find you.', vi: 'Bấm ghim trên app, tôi sẽ tìm ra bạn.' },
    ],
  },
  {
    id: 'hochiminh-npc-be',
    sprite: 'npc_staff',
    at: { x: 470, y: 444 },
    lines: [{ en: 'Be driver here. Wait a few minutes, the car is close.', vi: 'Tài xế Be đây. Chờ vài phút nữa nhé, xe gần tới rồi.' }],
  },
  {
    id: 'hochiminh-npc-xanhsm',
    sprite: 'npc_vendor',
    at: { x: 640, y: 444 },
    path: [{ x: 610, y: 444 }],
    lines: [
      { en: 'Xanh SM, electric and quiet. Want a ride?', vi: 'Xanh SM, xe điện êm và yên lặng. Bạn muốn đi không?' },
    ],
  },
  {
    id: 'hochiminh-npc-khach',
    sprite: 'npc_tourist',
    at: { x: 360, y: 444 },
    lines: [{ en: 'Why is my Grab still not here? It said two minutes.', vi: 'Sao xe Grab vẫn chưa tới? App báo hai phút rồi mà.' }],
  },
];

const PARTS = [
    { x: 0, y: 0, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_NW_MASK },
    { x: SHIFT.x, y: 0, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_N_MASK },
    { x: SHIFT.x + EX, y: 0, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_NE_MASK },
    { x: 0, y: SHIFT.y, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_W_MASK },
    { x: SHIFT.x, y: SHIFT.y, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_MASK },
    { x: SHIFT.x + EX, y: SHIFT.y, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_E_MASK },
    { x: 0, y: SHIFT.y + SY, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_SW_MASK },
    { x: SHIFT.x, y: SHIFT.y + SY, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_S_MASK },
    { x: SHIFT.x + EX, y: SHIFT.y + SY, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_SE_MASK },
    { x: EE_X, y: SHIFT.y, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_EE_MASK },
    { x: EE_X, y: SHIFT.y + SY, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_ESE_MASK },
    { x: EE_X, y: 0, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_NEE_MASK },
];
const MASK_BASE = composeMask(WORLD3, HOCHIMINH_SCENE_MASK_CELL, PARTS, LINKS_BASE);
const LINKS = [
  ...LINKS_BASE,
  // các cầu (xem BRIDGES): mỗi cầu là một cột điểm nối đi được băng qua kênh
  ...BRIDGES.flatMap((b) => Array.from({ length: 13 }, (_, i) => ({ from: 0, to: 0, x: b.x, y: b.y - 58 + i * 8, r: 8 }))),
  ...seamPoints().filter((p) => {
    // bỏ điểm nối nếu trong khung quanh nó (r = 10) có nước, để nước không bị lát thành đường
    for (let dy = -p.r; dy <= p.r; dy += 2) for (let dx = -p.r; dx <= p.r; dx += 2) {
      if (MASK_BASE[Math.floor((p.y + dy) / HOCHIMINH_SCENE_MASK_CELL)]?.[Math.floor((p.x + dx) / HOCHIMINH_SCENE_MASK_CELL)] === '~') return false;
    }
    return true;
  }),
];
// nối các khu đi được bị tách (vỉa hè mới, mảnh góc) về mạng chính, không qua nước
const ISLAND_LINKS = [
  ...linkLine(0, 0, { x: 141, y: 157 }, { x: 141, y: 165 }, 10, 12),
  ...linkLine(0, 0, { x: 639, y: 159 }, { x: 639, y: 153 }, 10, 12),
  ...linkLine(0, 0, { x: 437, y: 217 }, { x: 425, y: 217 }, 10, 12),
  ...linkLine(0, 0, { x: 425, y: 217 }, { x: 413, y: 217 }, 10, 12),
  ...linkLine(0, 0, { x: 413, y: 217 }, { x: 401, y: 217 }, 10, 12),
  ...linkLine(0, 0, { x: 401, y: 217 }, { x: 399, y: 217 }, 10, 12),
  ...linkLine(0, 0, { x: 803, y: 237 }, { x: 803, y: 225 }, 10, 12),
  ...linkLine(0, 0, { x: 803, y: 225 }, { x: 799, y: 225 }, 10, 12),
  ...linkLine(0, 0, { x: 991, y: 279 }, { x: 991, y: 291 }, 10, 12),
  ...linkLine(0, 0, { x: 991, y: 291 }, { x: 991, y: 301 }, 10, 12),
  ...linkLine(0, 0, { x: 1205, y: 373 }, { x: 1205, y: 361 }, 10, 12),
  ...linkLine(0, 0, { x: 1195, y: 451 }, { x: 1195, y: 463 }, 10, 12),
  ...linkLine(0, 0, { x: 1195, y: 463 }, { x: 1195, y: 475 }, 10, 12),
  ...linkLine(0, 0, { x: 1195, y: 475 }, { x: 1195, y: 487 }, 10, 12),
  ...linkLine(0, 0, { x: 1195, y: 487 }, { x: 1195, y: 499 }, 10, 12),
  ...linkLine(0, 0, { x: 1195, y: 499 }, { x: 1195, y: 501 }, 10, 12),
  ...linkLine(0, 0, { x: 443, y: 467 }, { x: 443, y: 455 }, 10, 12),
  ...linkLine(0, 0, { x: 443, y: 455 }, { x: 443, y: 449 }, 10, 12),
  ...linkLine(0, 0, { x: 413, y: 525 }, { x: 401, y: 525 }, 10, 12),
  ...linkLine(0, 0, { x: 981, y: 269 }, { x: 981, y: 281 }, 10, 12),
  ...linkLine(0, 0, { x: 981, y: 281 }, { x: 981, y: 293 }, 10, 12),
  ...linkLine(0, 0, { x: 981, y: 293 }, { x: 981, y: 301 }, 10, 12),
  ...linkLine(0, 0, { x: 1195, y: 373 }, { x: 1195, y: 361 }, 10, 12),
  ...linkLine(0, 0, { x: 971, y: 259 }, { x: 971, y: 247 }, 10, 12),
  ...linkLine(0, 0, { x: 971, y: 247 }, { x: 971, y: 235 }, 10, 12),
  ...linkLine(0, 0, { x: 1185, y: 373 }, { x: 1181, y: 365 }, 10, 12),
  ...linkLine(0, 0, { x: 1181, y: 365 }, { x: 1185, y: 361 }, 10, 12),
  ...linkLine(0, 0, { x: 1323, y: 1 }, { x: 1335, y: 1 }, 10, 12),
  ...linkLine(0, 0, { x: 1335, y: 1 }, { x: 1347, y: 1 }, 10, 12),
  ...linkLine(0, 0, { x: 1347, y: 1 }, { x: 1353, y: 7 }, 10, 12),
  ...linkLine(0, 0, { x: 1353, y: 7 }, { x: 1353, y: 19 }, 10, 12),
  ...linkLine(0, 0, { x: 1353, y: 19 }, { x: 1353, y: 31 }, 10, 12),
  ...linkLine(0, 0, { x: 1353, y: 31 }, { x: 1353, y: 43 }, 10, 12),
  ...linkLine(0, 0, { x: 1353, y: 43 }, { x: 1353, y: 47 }, 10, 12),
];
const LINKS_ALL = [...LINKS, ...ISLAND_LINKS];
const MASK = composeMask(WORLD3, HOCHIMINH_SCENE_MASK_CELL, PARTS, LINKS_ALL);


import { seamHedge } from './seams';
/** Hàng bụi/cây dọc mọi mép mảnh (che đường nối cho quyện hoà; không có đèn). */
const SEAMS = seamHedge({
  prefix: 'seam',
  maskRows: MASK,
  cell: HOCHIMINH_SCENE_MASK_CELL,
  lines: [
    { x0: 408, y0: 10, x1: 408, y1: 665 - 10 },
    { x0: 806, y0: 10, x1: 806, y1: 665 - 10 },
    { x0: 1204, y0: 10, x1: 1204, y1: 665 - 10 },
    { x0: 10, y0: 225, x1: 1602, y1: 225 },
    { x0: 10, y0: 440, x1: 1602, y1: 440 },
  ],
  gaps: LINKS_ALL,
  sprites: ['seambush_a', 'seambush_b', 'seambush_c'],
  spacing: 12,
});

export const hochiminh = (() => {
  const m = imageMap({
    id: 'hochiminh',
    name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' },
    utcOffsetHours: 7,
    terrain: true,
    spawn: sh({ x: 209, y: 214 }),
    pois: SCENE_OBJECTS.filter((o) => o.poiId).map((o) => poiOf(o.poiId!)),
    npcs: [...NPCS.map((n) => ({ ...n, at: sh(n.at), ...(n.path ? { path: n.path.map(sh) } : {}) })), ...NPCS_NEW],
    routes: [
      { id: 'hochiminh-boat', sprite: 'mini_boat', path: [{ x: 60, y: 13 }, { x: 340, y: 13 }].map(sh), speed: 0.9 },
      { id: 'hochiminh-plane', sprite: 'mini_plane', path: [{ x: EX + 100, y: SY + 190 }, { x: EX + 470, y: SY + 190 }].map(sh), speed: 3.2, loop: true, layer: 'sky' },
    ],
    size: WORLD3,
    panels: [
      { suffix: '-nw', x: 0, y: 0 },
      { suffix: '-n', x: SHIFT.x, y: 0 },
      { suffix: '-ne', x: SHIFT.x + EX, y: 0 },
      { suffix: '-w', x: 0, y: SHIFT.y },
      { suffix: '', x: SHIFT.x, y: SHIFT.y },
      { suffix: '-e', x: SHIFT.x + EX, y: SHIFT.y },
      { suffix: '-sw', x: 0, y: SHIFT.y + SY },
      { suffix: '-s', x: SHIFT.x, y: SHIFT.y + SY },
      { suffix: '-se', x: SHIFT.x + EX, y: SHIFT.y + SY },
      { suffix: '-ee', x: EE_X, y: SHIFT.y },
      { suffix: '-ese', x: EE_X, y: SHIFT.y + SY },
      { suffix: '-nee', x: EE_X, y: 0 },
    ],
    links: LINKS_ALL,
    mask: { cell: HOCHIMINH_SCENE_MASK_CELL, rows: MASK },
    sounds: ['city-day'],
  });
  m.scene = { sprites: SPRITES, objects: [...SCENE_OBJECTS, ...SEAMS], ambient: 12 };
  return m;
})();

/** Dự phòng khi chưa tải được ảnh đất: bản đồ ô chung của các thành phố Việt Nam. */
export const hochiminhTiles = vietnamTiles({ id: 'hochiminh', name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' }, npcs: [] });
