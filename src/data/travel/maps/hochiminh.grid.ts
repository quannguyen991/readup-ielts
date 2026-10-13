/**
 * TP. HỒ CHÍ MINH — BẢN LƯỚI GỌN (đối chiếu Google Maps, theo cách làm của Hà Nội). Vẽ bằng mã trên lưới ô 112×100 (thu gọn, mọi địa điểm trong một khu như bản Singapore):
 * các địa điểm chính nằm gọn trong một khu, phố đặc kín, đường và khối phố lấy từ OpenStreetMap thật.
 *
 * Vị trí địa điểm: lấy TOẠ ĐỘ thật từ Google Maps (`HCM_GEO` bên dưới), quy đổi lên lưới theo tỉ lệ 10 ô/km với
 * Chợ Bến Thành ở ô (72,64). Sau đó mỗi địa điểm được đặt vào ô đất trống gần nhất (không đè nước, đường, nhau).
 * Củ Chi và bến Mê Kông nằm ngoài lưới nên được đặt ở mép bản đồ, đúng hướng. Sông Sài Gòn vẽ theo vài toạ độ cầu/bến
 * thật nên chỉ gần đúng về hình dạng.
 */
import type { CityMap, Npc, Poi, PoiKind, Route, Tile } from '@/services/travel/types';
import { poisOfCity } from '../pois';
import { doorOf, MapBuilder } from './builder';
import { withCatalog } from './imagemap';
import { mulberry32 } from '../sprites/paint';

const W = 128;
const H = 112;

/** Chợ Bến Thành ở ô (72,64). 10,77°N: 109,4 km mỗi độ kinh, 111,2 km mỗi độ vĩ. */
const ANCHOR = { lat: 10.7725, lon: 106.698, x: 72, y: 56 };
const KM_LAT = 111.2;
const KM_LON = 109.4;
const TILES_PER_KM = 10;
export function geoToGrid(lat: number, lon: number): { x: number; y: number } {
  return {
    x: ANCHOR.x + (lon - ANCHOR.lon) * KM_LON * TILES_PER_KM,
    y: ANCHOR.y - (lat - ANCHOR.lat) * KM_LAT * TILES_PER_KM,
  };
}

const FACADE: Partial<Record<PoiKind, string>> = {
  airport: 'terminal',
  market: 'market',
  restaurant: 'restaurant',
  cafe: 'cafe',
  museum: 'museum',
  hotel: 'hotel',
  station: 'station',
  garden: 'garden',
  landmark: 'hall',
};

/** Chữ biển của quán vỉa hè và cửa hàng có tên riêng (ghi trong HCM_GEO). */
const signOf = (slug: string) => HCM_GEO.find((g) => g.slug === slug)?.sign;

const LABEL: Record<string, string> = {
  airport: 'AIRPORT',
  market: 'MARKET',
  restaurant: 'FOOD',
  cafe: 'CAFE',
  museum: 'MUSEUM',
  hotel: 'HOTEL',
  station: 'STATION',
  garden: 'PARK',
  landmark: 'SIGHT',
};

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Địa điểm và toạ độ. `lat/lon`: trang địa điểm trên Google Maps (tham số !3d/!4d), kiểm ngày 12/10/2026.
 * `generic`: mẫu chung (quán vỉa hè, xe đẩy), không phải địa điểm cụ thể có toạ độ thật.
 * `w × h`: cỡ vùng chiếm, theo ô.
 */
export type Geo = { slug: string; lat: number; lon: number; w: number; h: number; generic?: boolean; sign?: string };
export const HCM_GEO: Geo[] = [
  // Công trình và địa điểm có toạ độ thật
  { slug: 'gate', lat: 10.8169828, lon: 106.6565808, w: 6, h: 6 },
  { slug: 'benthanh', lat: 10.7725168, lon: 106.6980208, w: 6, h: 5 },
  { slug: 'notredame', lat: 10.7797855, lon: 106.6990189, w: 5, h: 6 },
  { slug: 'postoffice', lat: 10.7799129, lon: 106.699902, w: 6, h: 6 },
  { slug: 'independence', lat: 10.7769942, lon: 106.6953021, w: 6, h: 4 },
  { slug: 'opera', lat: 10.7766128, lon: 106.7031715, w: 6, h: 5 },
  { slug: 'thienhau', lat: 10.7532496, lon: 106.6611735, w: 6, h: 5 },
  { slug: 'warmuseum', lat: 10.7795106, lon: 106.6920916, w: 6, h: 5 },
  { slug: 'buivien', lat: 10.767351, lon: 106.6938836, w: 6, h: 6 },
  { slug: 'cuchi', lat: 11.141591, lon: 106.4615963, w: 6, h: 6 },
  { slug: 'mekong', lat: 10.352342, lon: 106.3625885, w: 6, h: 5 },
  { slug: 'skydeck', lat: 10.7951153, lon: 106.7221002, w: 5, h: 6 },
  { slug: 'bitexco', lat: 10.7717064, lon: 106.7043759, w: 3, h: 6 },
  { slug: 'landmark81', lat: 10.7951153, lon: 106.7221002, w: 5, h: 6 },
  { slug: 'nguyenhue', lat: 10.7740408, lon: 106.7037237, w: 6, h: 5 },
  { slug: 'nharong', lat: 10.7682488, lon: 106.7068028, w: 6, h: 6 },
  { slug: 'vinhnghiem', lat: 10.79039, lon: 106.6822801, w: 6, h: 5 },
  { slug: 'taodan', lat: 10.7755796, lon: 106.6920797, w: 6, h: 6 },
  { slug: 'thaocam', lat: 10.7873344, lon: 106.7050566, w: 6, h: 5 },
  { slug: 'tandinh', lat: 10.7883359, lon: 106.6906789, w: 5, h: 6 },
  { slug: 'lanhong', lat: 10.8022201, lon: 106.697085, w: 6, h: 6 },
  { slug: 'binhtay', lat: 10.7493638, lon: 106.6510455, w: 6, h: 5 },
  { slug: 'lichsutp', lat: 10.788075, lon: 106.7047291, w: 6, h: 5 },
  { slug: 'conrua', lat: 10.7826608, lon: 106.695915, w: 6, h: 6 },
  // Mẫu chung: quán vỉa hè, xe đẩy, quán ăn ven đường (không có toạ độ thật)
  { slug: 'comtam', lat: 10.7712, lon: 106.6915, w: 6, h: 6, generic: true },
  { slug: 'banhmi', lat: 10.7735, lon: 106.6975, w: 6, h: 6, generic: true },
  { slug: 'phoshop', lat: 10.769, lon: 106.699, w: 6, h: 6, generic: true },
  { slug: 'cafesua', lat: 10.7745, lon: 106.701, w: 6, h: 6, generic: true },
  { slug: 'jade', lat: 10.7922, lon: 106.6945, w: 5, h: 5 },
  { slug: 'khaitri', lat: 10.7758, lon: 106.6998, w: 5, h: 5 },
  { slug: 'vincom', lat: 10.7788, lon: 106.7019, w: 5, h: 5 },
  { slug: 'bxmiendong', lat: 10.8154, lon: 106.7142, w: 5, h: 5 },
  { slug: 'mymythuat', lat: 10.7734, lon: 106.6962, w: 5, h: 5 },
  { slug: 'cong239', lat: 10.7714, lon: 106.6945, w: 5, h: 5 },
  { slug: 'bachdang', lat: 10.7712, lon: 106.7063, w: 5, h: 5 },
  { slug: 'vinhkhanh', lat: 10.7584, lon: 106.7039, w: 5, h: 5 },
  { slug: 'kimbien', lat: 10.7562, lon: 106.6583, w: 5, h: 5 },
  { slug: 'bunbo', lat: 10.7745, lon: 106.698, w: 4, h: 4, generic: true },
  { slug: 'banhxeo', lat: 10.777, lon: 106.6935, w: 4, h: 4, generic: true },
  { slug: 'chetrau', lat: 10.7715, lon: 106.699, w: 4, h: 4, generic: true },
  { slug: 'trasua', lat: 10.779, lon: 106.7005, w: 4, h: 4, generic: true },
  { slug: 'capheberu', lat: 10.7752, lon: 106.692, w: 4, h: 4, generic: true },
  { slug: 'nhau', lat: 10.7635, lon: 106.699, w: 4, h: 4, generic: true },
  { slug: 'sachcu', lat: 10.7805, lon: 106.6945, w: 4, h: 4, generic: true },
  { slug: 'tapho', lat: 10.77, lon: 106.6955, w: 4, h: 4, generic: true },
  { slug: 'vang', lat: 10.773, lon: 106.7, w: 4, h: 4, generic: true },
  { slug: 'thuocbac', lat: 10.7685, lon: 106.685, w: 4, h: 4, generic: true },
  { slug: 'aodai', lat: 10.7812, lon: 106.697, w: 4, h: 4, generic: true },
  { slug: 'khachsan', lat: 10.7855, lon: 106.688, w: 4, h: 4, generic: true },
  { slug: 'nhanghi', lat: 10.795, lon: 106.693, w: 4, h: 4, generic: true },
  { slug: 'benxe', lat: 10.766, lon: 106.7, w: 4, h: 4, generic: true },
  { slug: 'chohoa', lat: 10.772, lon: 106.688, w: 4, h: 4, generic: true },
  { slug: 'rapchieu', lat: 10.769, lon: 106.6915, w: 4, h: 4, generic: true },
  { slug: 'caphetb', lat: 10.8, lon: 106.656, w: 4, h: 4, generic: true },
  { slug: 'comnhat', lat: 10.804, lon: 106.702, w: 4, h: 4, generic: true },
  { slug: 'phoga', lat: 10.775171, lon: 106.701221, w: 5, h: 5, generic: true, sign: 'PHO GA' },
  { slug: 'phobo', lat: 10.776543, lon: 106.67496, w: 5, h: 5, generic: true, sign: 'PHO BO' },
  { slug: 'bunmam', lat: 10.77788, lon: 106.699191, w: 5, h: 5, generic: true, sign: 'BUN MAM' },
  { slug: 'bunrieu', lat: 10.799574, lon: 106.695762, w: 5, h: 5, generic: true, sign: 'BUN RIEU' },
  { slug: 'hutieu', lat: 10.779009, lon: 106.697217, w: 5, h: 5, generic: true, sign: 'HU TIEU' },
  { slug: 'comga', lat: 10.806386, lon: 106.702075, w: 5, h: 5, generic: true, sign: 'COM GA' },
  { slug: 'bunthit', lat: 10.780079, lon: 106.69956, w: 5, h: 5, generic: true, sign: 'BUN THIT' },
  { slug: 'banhcuon', lat: 10.764416, lon: 106.67359, w: 5, h: 5, generic: true, sign: 'BANH CUON' },
  { slug: 'banhcanh', lat: 10.77137, lon: 106.696538, w: 5, h: 5, generic: true, sign: 'BANH CANH' },
  { slug: 'chaolong', lat: 10.772759, lon: 106.698213, w: 5, h: 5, generic: true, sign: 'CHAO LONG' },
  { slug: 'banhbeo', lat: 10.764403, lon: 106.691933, w: 5, h: 5, generic: true, sign: 'BANH BEO' },
  { slug: 'xoi', lat: 10.778637, lon: 106.697798, w: 5, h: 5, generic: true, sign: 'XOI' },
  { slug: 'banhbao', lat: 10.774839, lon: 106.685836, w: 5, h: 5, generic: true, sign: 'BANH BAO' },
  { slug: 'nuongtam', lat: 10.770041, lon: 106.665354, w: 5, h: 5, generic: true, sign: 'NUONG' },
  { slug: 'lau', lat: 10.775886, lon: 106.7019, w: 5, h: 5, generic: true, sign: 'LAU BO' },
  { slug: 'oc', lat: 10.772418, lon: 106.692773, w: 5, h: 5, generic: true, sign: 'OC' },
  { slug: 'cafevot', lat: 10.778796, lon: 106.671452, w: 5, h: 5, generic: true, sign: 'CA PHE' },
  { slug: 'caphetrung', lat: 10.806146, lon: 106.708737, w: 5, h: 5, generic: true, sign: 'CA TRUNG' },
  { slug: 'sinhto', lat: 10.758395, lon: 106.686429, w: 5, h: 5, generic: true, sign: 'SINH TO' },
  { slug: 'nuocmia', lat: 10.773915, lon: 106.697362, w: 5, h: 5, generic: true, sign: 'NUOC MIA' },
  { slug: 'nuocep', lat: 10.779259, lon: 106.703995, w: 5, h: 5, generic: true, sign: 'NUOC EP' },
  { slug: 'kem', lat: 10.778401, lon: 106.700522, w: 5, h: 5, generic: true, sign: 'KEM' },
  { slug: 'banhflan', lat: 10.765013, lon: 106.704553, w: 5, h: 5, generic: true, sign: 'FLAN' },
  { slug: 'suadau', lat: 10.771273, lon: 106.701251, w: 5, h: 5, generic: true, sign: 'SUA DAU' },
  { slug: 'banhngot', lat: 10.802362, lon: 106.701771, w: 5, h: 5, generic: true, sign: 'BANH NGOT' },
  { slug: 'tratiem', lat: 10.782672, lon: 106.674459, w: 5, h: 5, generic: true, sign: 'TRA' },
  { slug: 'banhtrang', lat: 10.768096, lon: 106.675165, w: 5, h: 5, generic: true, sign: 'BANH TRANG' },
  { slug: 'vitquay', lat: 10.775906, lon: 106.690145, w: 5, h: 5, generic: true, sign: 'VIT QUAY' },
  { slug: 'haisan', lat: 10.776912, lon: 106.697348, w: 5, h: 5, generic: true, sign: 'HAI SAN' },
  { slug: 'bialo', lat: 10.770656, lon: 106.672919, w: 5, h: 5, generic: true, sign: 'BIA HOI' },
  { slug: 'nonla', lat: 10.804276, lon: 106.707875, w: 5, h: 5, generic: true, sign: 'NON LA' },
  { slug: 'tranhtiem', lat: 10.808597, lon: 106.706544, w: 5, h: 5, generic: true, sign: 'TRANH' },
  { slug: 'giaydep', lat: 10.7736, lon: 106.672368, w: 5, h: 5, generic: true, sign: 'GIAY DEP' },
  { slug: 'quanao', lat: 10.776394, lon: 106.662643, w: 5, h: 5, generic: true, sign: 'QUAN AO' },
  { slug: 'suaxe', lat: 10.77118, lon: 106.692349, w: 5, h: 5, generic: true, sign: 'SUA XE' },
  { slug: 'tiemanh', lat: 10.775324, lon: 106.66266, w: 5, h: 5, generic: true, sign: 'ANH' },
  { slug: 'dienthoai', lat: 10.803141, lon: 106.715342, w: 5, h: 5, generic: true, sign: 'DIEN THOAI' },
  { slug: 'nhasach', lat: 10.75875, lon: 106.678012, w: 5, h: 5, generic: true, sign: 'NHA SACH' },
  { slug: 'cattoc', lat: 10.76688, lon: 106.680321, w: 5, h: 5, generic: true, sign: 'CAT TOC' },
  { slug: 'nhathuoc', lat: 10.80279, lon: 106.707026, w: 5, h: 5, generic: true, sign: 'NHA THUOC' },
  { slug: 'minimart', lat: 10.773359, lon: 106.695862, w: 5, h: 5, generic: true, sign: 'MINI MART' },
  { slug: 'trongiam', lat: 10.781269, lon: 106.70294, w: 5, h: 5, generic: true, sign: 'GOM SU' },
  { slug: 'nhatro', lat: 10.779503, lon: 106.677604, w: 5, h: 5, generic: true, sign: 'NHA TRO' },
  { slug: 'kara', lat: 10.760712, lon: 106.686451, w: 5, h: 5, generic: true, sign: 'KARAOKE' },
  { slug: 'caphesantuong', lat: 10.7835, lon: 106.687, w: 4, h: 4, generic: true },
  { slug: 'chothinghe', lat: 10.8005, lon: 106.712, w: 5, h: 5 },
  { slug: 'bachkhoa', lat: 10.7726, lon: 106.66, w: 5, h: 5 },
  { slug: 'quanoc', lat: 10.7565, lon: 106.701, w: 4, h: 4, generic: true },
  { slug: 'comtam10', lat: 10.769, lon: 106.67, w: 4, h: 4, generic: true },
  { slug: 'giatla', lat: 10.78, lon: 106.679, w: 4, h: 4, generic: true },
  { slug: 'quannhau', lat: 10.765, lon: 106.688, w: 4, h: 4, generic: true },
];

/**
 * Mọi địa điểm có tranh pixel (public/travel/sprites/hochiminh-art/<slug>.png): công trình vẽ theo ảnh tham khảo Commons,
 * quán ăn đặc trưng (cơm tấm, bánh mì, phở, cà phê sữa đá) và công viên, hồ, phố đi bộ vẽ cùng phong cách với Hà Nội.
 */
export const HCM_ART_SLUGS = new Set<string>([
  'benthanh',
  'notredame',
  'postoffice',
  'opera',
  'warmuseum',
  'bitexco',
  'landmark81',
  'skydeck',
  'binhtay',
  'thaocam',
  'gate',
  'lanhong',
  'thienhau',
  'independence',
  'vinhnghiem',
  'tandinh',
  'nharong',
  'lichsutp',
  'cuchi',
  'buivien',
  'mekong',
  'taodan',
  'conrua',
  'nguyenhue',
  'comtam',
  'banhmi',
  'phoshop',
  'cafesua',
  // Quán vẽ bằng ChatGPT (bảng 2×2), cắt bằng cutsheet.py
  'phoga',
  'bunrieu',
  'cafevot',
  'cattoc',
  'phobo',
  'hutieu',
  'comga',
  'bunmam',
  'bunthit',
  'banhcuon',
  'banhcanh',
  'chaolong',
  'banhbeo',
  'xoi',
  'banhbao',
  'nuongtam',
  'lau',
  'oc',
  'caphetrung',
  'sinhto',
  'nuocmia',
  'nuocep',
  'kem',
  'banhflan',
  'suadau',
  'banhngot',
  'tratiem',
  'banhtrang',
  'vitquay',
  'haisan',
  'bialo',
  'nonla',
  'tranhtiem',
  'giaydep',
  'quanao',
  'suaxe',
  'tiemanh',
  'dienthoai',
  'nhasach',
  'nhathuoc',
  'trongiam',
  'nhatro',
  'kara',
  'minimart',
]);

// ---------------------------------------------------------------- thành phố dạng khối (kiểu Hà Nội, rộng hơn)

const VEHICLE_ART = 'art:hochiminh-vehicles/';
const MOTOS = ['moto_red', 'moto_blue', 'moto_white', 'moto_green'];
const CARS = ['car_green', 'car_yellow', 'car_white', 'car_grey'];

/** Khối: đường 2 ô, vỉa hè 1 ô, phần trong 12×12. Địa điểm lớn chiếm cả khối; quán vỉa hè chia 4 khu 5×5. */
const PITCH = 16;
const INNER = 12;
const QUAD_ORIGIN: Array<[number, number]> = [[3, 3], [10, 3], [3, 10], [10, 10]];
const QUAD = 5;
/** Khối có công viên (chỉ số khối, đếm theo hàng từ trên xuống). */
const PARK_BLOCKS = new Set<number>([10, 21, 33, 44]);

/** Sông Sài Gòn vẽ đơn giản: dải nước chạy dọc phía đông, uốn nhẹ. */
function riverX(y: number): number {
  return 88 + Math.round(4 * Math.sin(y / 17));
}
const RIVER_WIDTH = 5;

function buildOnce(): CityMap {
  const m = new MapBuilder(W, H, 'g');
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
  const bcols = W / PITCH;
  const brows = H / PITCH;
  const isWater = (x: number, y: number) => {
    const rx = riverX(y);
    return x >= rx && x < rx + RIVER_WIDTH;
  };

  // 1) Nền: đường, vỉa hè, khối trong, sông.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x % PITCH;
      const v = y % PITCH;
      const block = Math.floor(y / PITCH) * bcols + Math.floor(x / PITCH);
      let c = 'g';
      if (isWater(x, y)) c = 'w';
      else if (u < 2 || v < 2) c = 'r';
      else if (u === 2 || u === 15 || v === 2 || v === 15) c = 'p';
      else if (PARK_BLOCKS.has(block)) c = 'f';
      m.ground[y]![x] = c;
    }
  }
  // Đường lớn vẽ đè lên sông (cầu).
  // Đại lộ có vạch: hàng và cột đường chính dùng ký hiệu h/v; đường nhỏ hơn là r.
  for (let r = 0; r < brows; r++) for (let x = 0; x < W; x++) m.ground[r * PITCH]![x] = r % 2 === 0 ? 'h' : 'r';
  for (let c = 0; c < bcols; c++) for (let y = 0; y < H; y++) m.ground[y]![c * PITCH] = c % 2 === 0 ? 'v' : 'r';

  // 2) Khối: có nước thì bỏ qua; còn lại là khối trống.
  type Block = { bx: number; by: number; ox: number; oy: number; water: boolean; used: boolean };
  const blocks: Block[] = [];
  for (let by = 0; by < brows; by++) for (let bx = 0; bx < bcols; bx++) {
    const ox = bx * PITCH;
    const oy = by * PITCH;
    let water = false;
    for (let j = 0; j < PITCH && !water; j++) for (let i = 0; i < PITCH; i++) if (m.ground[oy + j]![ox + i] === 'w') { water = true; break; }
    blocks.push({ bx, by, ox, oy, water, used: false });
  }

  // 3) Gán địa điểm. Mỗi khối 12×12 ô chứa một trong ba dạng: một địa điểm lớn (cả khối), hai địa điểm nhỏ cạnh nhau
  // (mỗi bên nửa khối, tối đa 6×6), hoặc bốn quán 5×5 ở góc. Địa điểm vào chỗ trống gần vị trí thật nhất nên đứng sát nhau.
  const catalog = poisOfCity('hochiminh');
  const geoOf = (slug: string) => HCM_GEO.find((g) => g.slug === slug);
  const slugOf = (id: string) => id.split('-').slice(1).join('-');
  const distAnchor = (slug: string) => {
    const g = geoOf(slug);
    if (!g) return Infinity;
    const t = geoToGrid(g.lat, g.lon);
    return (t.x - ANCHOR.x) ** 2 + (t.y - ANCHOR.y) ** 2;
  };
  const byDist = (a: { id: string }, b: { id: string }) => distAnchor(slugOf(a.id)) - distAnchor(slugOf(b.id)) || (a.id < b.id ? -1 : 1);
  const named = catalog.filter((c) => !geoOf(slugOf(c.id))?.generic).sort(byDist);
  const small = catalog.filter((c) => geoOf(slugOf(c.id))?.generic).sort(byDist);
  const PLAZA_IDS = new Set(['hochiminh-benthanh', 'hochiminh-nguyenhue']);
  const fpOf = new Map<string, Rect>();
  const blockOfId = new Map<string, Block>();
  const kindOf = new Map<Block, 'free' | 'full' | 'half' | 'quad' | 'park'>();
  blocks.forEach((b, i) => kindOf.set(b, b.water ? 'full' : PARK_BLOCKS.has(i) ? 'park' : 'free'));
  const halfCount = new Map<Block, number>();
  const quadUsed = new Map<Block, Set<number>>();
  const plazaBlocks = new Set<Block>();

  /** Đặt một địa điểm w×h gần tâm `t`. Trả về false nếu hết chỗ. */
  const place = (id: string, w: number, h: number, t: { x: number; y: number }, opts: { half: boolean; quad: boolean; full: boolean }): boolean => {
    const cands: Array<{ cost: number; apply: () => void }> = [];
    for (const b of blocks) {
      const k = kindOf.get(b)!;
      if (k === 'park' || k === 'full') continue;
      if (opts.full) {
        if (k !== 'free') continue;
        cands.push({
          cost: (b.ox + 8 - t.x) ** 2 + (b.oy + 8 - t.y) ** 2,
          apply: () => {
            kindOf.set(b, 'full');
            fpOf.set(id, { x: b.ox + 3 + Math.floor((INNER - w) / 2), y: b.oy + 3 + INNER - h, w, h });
            blockOfId.set(id, b);
          },
        });
        continue;
      }
      if (opts.half && w <= 6 && h <= 6 && (k === 'free' || k === 'half') && (halfCount.get(b) ?? 0) < 2) {
        const idx = halfCount.get(b) ?? 0;
        const rx = b.ox + 3 + idx * 6;
        const ry = b.oy + 9;
        cands.push({
          cost: (rx + 3 - t.x) ** 2 + (ry + 3 - t.y) ** 2,
          apply: () => {
            halfCount.set(b, idx + 1);
            kindOf.set(b, 'half');
            fpOf.set(id, { x: rx + Math.floor((6 - w) / 2), y: ry + 6 - h, w, h });
            blockOfId.set(id, b);
          },
        });
      }
      if (opts.quad && w <= QUAD && h <= QUAD && (k === 'free' || k === 'quad')) {
        const used = quadUsed.get(b) ?? new Set<number>();
        QUAD_ORIGIN.forEach(([qx, qy], qi) => {
          if (used.has(qi)) return;
          const ax = b.ox + qx;
          const ay = b.oy + qy;
          cands.push({
            cost: (ax + 2.5 - t.x) ** 2 + (ay + 2.5 - t.y) ** 2,
            apply: () => {
              used.add(qi);
              quadUsed.set(b, used);
              kindOf.set(b, 'quad');
              fpOf.set(id, { x: ax + Math.floor((QUAD - w) / 2), y: ay + QUAD - h, w, h });
              blockOfId.set(id, b);
            },
          });
        });
      }
    }
    if (cands.length === 0) return false;
    cands.sort((a, b) => a.cost - b.cost);
    cands[0]!.apply();
    return true;
  };

  for (const c of named) {
    const slug = slugOf(c.id);
    const g = geoOf(slug)!;
    const t = geoToGrid(g.lat, g.lon);
    const plaza = PLAZA_IDS.has(c.id);
    const ok = place(c.id, Math.min(g.w, INNER), Math.min(g.h, INNER), t, { half: !plaza, quad: true, full: plaza || g.w > 6 || g.h > 6 });
    if (!ok) throw new Error(`TP.HCM: hết khối cho ${c.id}`);
    if (plaza) plazaBlocks.add(blockOfId.get(c.id)!);
  }
  for (const c of small) {
    const slug = slugOf(c.id);
    const g = geoOf(slug)!;
    const t = geoToGrid(g.lat, g.lon);
    const ok = place(c.id, Math.min(g.w, QUAD), Math.min(g.h, QUAD), t, { half: false, quad: true, full: false });
    if (!ok) throw new Error(`TP.HCM: hết khu cho ${c.id}`);
  }
  for (const b of plazaBlocks) {
    for (let j = 3; j < 3 + INNER; j++) for (let i = 3; i < 3 + INNER; i++) m.ground[b.oy + j]![b.ox + i] = 'P';
    // Quảng trường tròn lát đá với vòng cây ở ngoài (kiểu Hà Nội).
    for (let j = 0; j < PITCH; j++) for (let i = 0; i < PITCH; i++) {
      const r = Math.hypot(i - 8 + 0.5, j - 8 + 0.5);
      if (r <= 4.5) m.ground[b.oy + j]![b.ox + i] = 'P';
      else if (r <= 7 && i >= 3 && i <= 14 && j >= 3 && j <= 14) m.ground[b.oy + j]![b.ox + i] = 'c';
    }
  }
  for (const b of blocks) {
    if (kindOf.get(b) === 'park') {
      for (let j = 3; j < 3 + INNER; j++) for (let i = 3; i < 3 + INNER; i++) m.ground[b.oy + j]![b.ox + i] = 'f';
    }
  }

  // 4) Nhà: mọi ô trong khối không phải địa điểm, cửa hàng hay đường đi là nhà (xen kẽ nhà và quán), để các khối đặc như thành phố.
  const footprintTiles = new Set<number>();
  for (const fp of fpOf.values()) for (let j = 0; j < fp.h; j++) for (let i = 0; i < fp.w; i++) footprintTiles.add((fp.y + j) * W + fp.x + i);
  for (const b of blocks) {
    const k = kindOf.get(b)!;
    if (b.water || k === 'park' || k === 'full') continue;
    for (let j = 3; j < 3 + INNER; j++) for (let i = 3; i < 3 + INNER; i++) {
      if (i === 8 || i === 9 || j === 8 || j === 9) continue;
      const x = b.ox + i;
      const y = b.oy + j;
      if (footprintTiles.has(y * W + x)) continue;
      m.objs[y]![x] = (b.bx + b.by + i + j) % 3 === 0 ? '%' : '#';
    }
  }

  // 4b) Điểm nhấn kiểu Hà Nội: một hồ tròn và hai quảng trường tròn trong các khối còn trống gần trung tâm.
  const freeBlocks = blocks
    .filter((b) => kindOf.get(b) === 'free' && !b.water)
    .sort((a, b) => ((a.ox + 8 - (ANCHOR.x + 16)) ** 2 + (a.oy + 8 - ANCHOR.y) ** 2) - ((b.ox + 8 - (ANCHOR.x + 16)) ** 2 + (b.oy + 8 - ANCHOR.y) ** 2));
  const clearBlock = (b: Block) => {
    for (let j = 0; j < PITCH; j++) for (let i = 0; i < PITCH; i++) m.objs[b.oy + j]![b.ox + i] = '.';
  };
  const circle = (b: Block, rIn: number, rOut: number, inner: string, ring: string) => {
    for (let j = 0; j < PITCH; j++) for (let i = 0; i < PITCH; i++) {
      const r = Math.hypot(i - 8 + 0.5, j - 8 + 0.5);
      if (r <= rIn) m.ground[b.oy + j]![b.ox + i] = inner;
      else if (r <= rOut && i >= 3 && i <= 14 && j >= 3 && j <= 14) m.ground[b.oy + j]![b.ox + i] = ring;
    }
  };
  if (freeBlocks.length >= 3) {
    const lake = freeBlocks[0]!;
    clearBlock(lake);
    circle(lake, 5.2, 6.8, 'w', 'p');
    for (let j = 3; j <= 14; j++) for (let i = 3; i <= 14; i++) {
      const r = Math.hypot(i - 8 + 0.5, j - 8 + 0.5);
      if (r > 6.8) m.ground[lake.oy + j]![lake.ox + i] = 'f';
    }
    for (const sq of [freeBlocks[1]!, freeBlocks[2]!]) {
      clearBlock(sq);
      circle(sq, 4.5, 7, 'P', 'c');
    }
    m.ground[freeBlocks[1]!.oy + 8]![freeBlocks[1]!.ox + 8] = 'P';
  }

  // 5) Địa điểm: cửa ở ngay dưới mặt tiền, luôn nằm trên vỉa hè hoặc lối đi.
  const doors = new Set<string>();
  const pois: Poi[] = [];
  for (const c of catalog) {
    const slug = slugOf(c.id);
    const fp = fpOf.get(c.id)!;
    const d: Tile = doorOf(fp);
    doors.add(`${d.x},${d.y}`);
    m.clear(d.x, d.y, 1, 1);
    for (let j = 0; j < fp.h; j++) for (let i = 0; i < fp.w; i++) m.clear(fp.x + i, fp.y + j, 1, 1);
    pois.push(
      withCatalog({
        id: c.id,
        kind: c.kind,
        name: c.name,
        content: c.content,
        reward: c.reward,
        door: d,
        footprint: fp,
        sprite: HCM_ART_SLUGS.has(slug) ? `art:hochiminh-art/${slug}` : `fac:${FACADE[c.kind] ?? 'shop'}:${signOf(slug) ?? LABEL[c.kind] ?? 'SIGHT'}`,
      }),
    );
  }

  // 6) Đồ đạc: cây và hoa trong vườn, đèn, biển và thùng rác trên vỉa hè.
  const rnd = mulberry32(2026);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x % PITCH;
    const v = y % PITCH;
    const g = m.ground[y]![x];
    if (m.objs[y]![x] !== '.' || footprintTiles.has(y * W + x) || doors.has(`${x},${y}`)) continue;
    if (g === 'p' && u === 2 && v === 2) m.o(x, y, 'G');
    else if (g === 'p' && u === 2 && y % 8 === 5) m.o(x, y, 'L');
    else if (g === 'p' && v === 2 && x % 8 === 5) m.o(x, y, 'L');
    else if (g === 'p' && u === 15 && y % 10 === 7) m.o(x, y, 'n');
    else if (g === 'f' && u % 3 === 0 && v % 3 === 0) m.o(x, y, rnd() < 0.6 ? 'T' : 'U');
    else if (g === 'f' && rnd() < 0.3) m.o(x, y, 'aei'[Math.floor(rnd() * 3)]!);
    else if (g === 'p' && u === 2 && v % 4 === 1 && rnd() < 0.6) m.o(x, y, 'T');
    else if (g === 'P' && u === 6 && v === 6) m.o(x, y, 'o');
  }
  for (const d of doors) {
    const [dx, dy] = d.split(',').map(Number) as [number, number];
    m.clear(dx, dy, 1, 1);
  }

  // 7) Tuyến xe: mỗi hàng và cột đường là một tuyến, chạy hai chiều (cầu qua sông là đường lớn).
  const routes: Route[] = [];
  const lines: Array<Array<[number, number]>> = [];
  for (let r = 0; r < brows; r++) lines.push(Array.from({ length: W }, (_, x) => [x, r * PITCH]));
  for (let c = 0; c < bcols; c++) lines.push(Array.from({ length: H }, (_, y) => [c * PITCH, y]));
  let mi = 0;
  let ci = 0;
  lines.forEach((cells, i) => {
    const path = cells.map(([x, y]) => ({ x, y }));
    if (i === 0) routes.push({ id: 'hochiminh-bus-0', sprite: 'bus', path, speed: 2, count: 2 });
    for (const rev of [false, true]) {
      const p = rev ? [...path].reverse() : path;
      if ((i + (rev ? 1 : 0)) % 2 === 0) routes.push({ id: `hochiminh-moto-${mi}`, sprite: `${VEHICLE_ART}${MOTOS[mi++ % MOTOS.length]}`, path: p, speed: 2.4, count: 3 });
      else routes.push({ id: `hochiminh-car-${ci}`, sprite: `${VEHICLE_ART}${CARS[ci++ % CARS.length]}`, path: p, speed: 2.2, count: 2 });
    }
  });

  // 8) Điểm xuất phát và người.
  const footprintOk = (x: number, y: number) => !footprintTiles.has(y * W + x) && !doors.has(`${x},${y}`);
  const nearestWalk = (px: number, py: number): Tile => {
    let best: Tile = { x: px, y: py };
    let bd = Infinity;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const g = m.ground[y]![x]!;
      if (m.objs[y]![x] !== '.' || !(g === 'r' || g === 'p' || g === 'f' || g === 'P' || g === 'g') || !footprintOk(x, y)) continue;
      const d = (x - px) ** 2 + (y - py) ** 2;
      if (d < bd) {
        bd = d;
        best = { x, y };
      }
    }
    return best;
  };
  const spawn = nearestWalk(ANCHOR.x, ANCHOR.y);
  const npcs: Npc[] = [];
  const addNpc = (id: string, sprite: string, at: Tile, lines: Npc['lines'], path?: Tile[]) => {
    npcs.push({ id, sprite, at, lines, ...(path ? { path } : {}) });
  };
  addNpc('hochiminh-npc-vendor', 'npc_vendor', nearestWalk(ANCHOR.x + 2, ANCHOR.y + 6), [
    { en: 'Lottery tickets! Buy one and today may be your lucky day.', vi: 'Vé số đây! Mua một tờ, biết đâu hôm nay trúng.' },
    { en: 'Ben Thanh is busy in the morning, so come early.', vi: 'Chợ Bến Thành đông từ sáng sớm, đi sớm cho thoải mái.' },
  ]);
  addNpc('hochiminh-npc-guard', 'npc_guard', nearestWalk(ANCHOR.x - 8, ANCHOR.y + 1), [
    { en: 'Mind the scooters when you cross, they never stop here.', vi: 'Qua đường cẩn thận, xe máy ở đây không bao giờ dừng.' },
    { en: 'The river is the heart of the city.', vi: 'Dòng sông là trái tim của thành phố.' },
  ]);
  addNpc('hochiminh-npc-tourist', 'npc_tourist', nearestWalk(ANCHOR.x + 12, ANCHOR.y - 4), [
    { en: 'Which way is Notre-Dame? I keep getting lost.', vi: 'Nhà thờ Đức Bà đi hướng nào vậy? Mình lạc mãi.' },
    { en: 'Is it true that Saigon never sleeps?', vi: 'Nghe nói Sài Gòn không bao giờ ngủ, có đúng không?' },
  ]);
  addNpc('hochiminh-npc-local', 'npc_local', nearestWalk(ANCHOR.x - 2, ANCHOR.y - 9), [
    { en: 'Coffee first, then the rest of the day. That is the Saigon way.', vi: 'Uống cà phê trước đã, rồi tính việc trong ngày.' },
    { en: 'The motorbikes here are like a river, just go with the flow.', vi: 'Xe máy ở đây như dòng nước, cứ thuận dòng mà đi.' },
  ]);
  const npcSprites = ['npc_local', 'npc_kid', 'npc_tourist', 'npc_elder', 'npc_vendor'];
  lines.slice(0, 6).forEach((cells, i) => {
    const path = cells.map(([x, y]) => ({ x, y: Math.min(H - 1, y + 1) }));
    addNpc(`hochiminh-walker-${i}`, npcSprites[i % npcSprites.length]!, path[0]!, [
      { en: 'Nice morning for a walk.', vi: 'Buổi sáng đi dạo thật dễ chịu.' },
    ], path);
  });

  return { ...m.build({
    id: 'hochiminh',
    name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' },
    utcOffsetHours: 7,
    palette: 'hochiminh',
    spawn,
    pois,
    npcs,
    routes,
    sounds: ['city-day'],
  }), interiors: true };
}

export const hochiminhGrid: CityMap = buildOnce();
