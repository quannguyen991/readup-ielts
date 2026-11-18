/**
 * Đổi MỌI màu tím/chàm viết cứng trong style sang hồng khi đang bật giao diện Chiikawa.
 *
 * Giao diện mặc định của Band 9 là tím chàm; hơn 800 chỗ viết thẳng mã màu (#2B2350,
 * #6A4BD9, #F3F0FB…) vào style nên không thể sửa từng chỗ. Móc này được gắn vào bộ biên
 * dịch style của react-native-web (xem metro.config.js + rnw-color-hook.js): mọi giá
 * trị màu đi qua đây trước khi thành CSS. Chỉ tác động khi bảng màu là `chiikawa`.
 */
import { paletteId } from './palette-state';

/** Màu cố định: chữ và viền đã có tên trong bảng Chiikawa (tokens.ts) nên dùng đúng mã đó. */
const EXACT: Record<string, string> = {
  F8F7FC: 'FFF5F8',
  F3F0FB: 'FFF0F5',
  F5F2FF: 'FFF3F8',
  EEE9FF: 'FFE8F0',
  F1ECFF: 'FFEAF1',
  EDE9FE: 'FFEAF1',
  F1EEFB: 'FFF1F6',
  EAE4F8: 'FDE3EC',
  E6E1F3: 'FBE3EC',
  D9D2EC: 'F5CADB',
  '2B2350': '4A2433',
  '3F3A62': '7A4E62',
  '7A72A0': 'A3768B',
  '8E86B0': 'B58A9E',
  A59CC4: 'C9A3B3',
  '6A4BD9': 'C64E79',
  '7C5CF0': 'D65E86',
  '8B6CF0': 'D65E86',
  '5A3EBA': 'B94A70',
  '4A3299': '9A3A5C',
  A38BFA: 'EE8DB1',
  BFAAFF: 'F7A9C6',
  D9CCFF: 'FCCFE0',
  EBE5FF: 'FFE3EE',
};

function toHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  const l = (mx + mn) / 2;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function fromHsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * Màu thuộc họ thương hiệu cũ (tím/chàm, xanh dương/lơ, vàng/cam) → hồng, giữ nguyên độ sáng.
 * Xanh lá và đỏ giữ nguyên vì mang nghĩa đúng/sai; xám trung tính cũng giữ.
 */
function recolorRgb(r: number, g: number, b: number): [number, number, number] | null {
  const [h, s, l] = toHsl(r, g, b);
  if (Math.max(r, g, b) - Math.min(r, g, b) < 4) return null;
  const purple = h >= 236 && h <= 300;
  const blue = h >= 175 && h < 236 && s >= (l < 0.3 ? 0.2 : 0.35);
  const warm = h >= 12 && h <= 90 && s >= 0.45;
  if (!purple && !blue && !warm) return null;
  if (purple && s < 0.06 && l < 0.97) return null; // xám trung tính
  if (l >= 0.9) return fromHsl(340, 0.85, Math.min(0.975, l));
  if (l >= 0.55) return fromHsl(340, Math.min(Math.max(s, 0.4), 0.72), l);
  if (l >= 0.3) return fromHsl(338, Math.min(Math.max(s, 0.4), 0.6), l);
  return fromHsl(340, 0.32, l + 0.03); // tối → mận tối
}

const cache = new Map<string, string>();

function recolor(value: string): string {
  const v = value.trim();
  let m = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(v);
  if (m) {
    const key = m[1]!.toUpperCase();
    const exact = EXACT[key];
    if (exact) return '#' + exact + (m[2] ?? '');
    const rgb = recolorRgb(parseInt(key.slice(0, 2), 16), parseInt(key.slice(2, 4), 16), parseInt(key.slice(4, 6), 16));
    if (!rgb) return value;
    return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase() + (m[2] ?? '');
  }
  m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(v);
  if (m) {
    const rgb = recolorRgb(+m[1]!, +m[2]!, +m[3]!);
    if (!rgb) return value;
    return m[4] !== undefined ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${m[4]})` : `rgb(${rgb.join(',')})`;
  }
  return value;
}

/** Gọi cho từng giá trị màu trước khi biên dịch style. Không phải chuỗi / không bật Chiikawa → giữ nguyên. */
export function chiikawaRecolor<T>(value: T): T {
  if (typeof value !== 'string' || paletteId() !== 'chiikawa') return value;
  const hit = cache.get(value);
  if (hit !== undefined) return hit as unknown as T;
  const out = recolor(value);
  cache.set(value, out);
  return out as unknown as T;
}

/**
 * Thẻ đặc có chữ trắng (StickerCard, chip tiêu đề hero): mọi hue về họ hồng, lệch nhẹ theo hue gốc
 * để các thẻ vẫn phân biệt được, đủ đậm để chữ trắng đọc rõ.
 */
export function chiikawaCard(hex: string): string {
  if (paletteId() !== 'chiikawa') return hex;
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = m[1]!;
  const [h, s, l] = toHsl(parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16));
  if (s < 0.12 || l < 0.12) return chiikawaRecolor(hex);
  const targetHue = 322 + ((h % 360) / 360) * 36; // 322–358: tím hồng → đỏ hồng
  const pastel = l > 0.86;
  const rgb = fromHsl(targetHue, pastel ? 0.8 : Math.min(Math.max(s, 0.42), 0.68), pastel ? l : Math.min(Math.max(l, 0.5), 0.86));
  return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Thẻ hoạ tiết không chữ (TileArt, AreaArt, GlossOrb): bảng pastel kiểu Chiikawa, GIỮ sự đa dạng màu
 * (hồng, kem vàng, bạc hà, xanh trời, cam đào). Chỉ tím/chàm đổi sang hồng; mọi màu được làm dịu lại.
 */
export function chiikawaTile(hex: string): string {
  if (paletteId() !== 'chiikawa') return hex;
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = m[1]!;
  const [h, s, l] = toHsl(parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16));
  if (s < 0.12) return chiikawaRecolor(hex);
  const hue = h >= 236 && h <= 300 ? 338 : h;
  // Độ bão hoà cố ý nằm DƯỚI ngưỡng của recolorRgb (xanh dương < 0.35, vàng/cam < 0.45) để móc màu
  // không ép các màu pastel này sang hồng lần nữa.
  const blue = hue >= 175 && hue < 236;
  const rgb = fromHsl(hue, blue ? 0.33 : 0.42, 0.62 + 0.24 * l);
  return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
