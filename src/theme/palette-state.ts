/**
 * BẢNG MÀU ĐANG DÙNG — một biến trong bộ nhớ, đọc đồng bộ ở mọi nơi render.
 *
 * Gốc app (app/_layout.tsx) đặt bảng theo chủ đề, sau khi trình duyệt đã hydrate,
 * rồi dựng lại cả cây (key theo bảng) — nên mọi giá trị đọc qua `themed()` đều mới.
 * Không lưu gì xuống máy: chủ đề đã lưu sẵn trong store phần thưởng.
 */
export type PaletteId = 'classic' | 'chiikawa' | 'pixel' | 'cyber';

let current: PaletteId = 'classic';

export function setPaletteId(id: PaletteId): void {
  current = id;
}

export function paletteId(): PaletteId {
  return current;
}

/**
 * Bảng gốc + phần ghi đè của bảng Chiikawa. Khoá nào không có trong bảng Chiikawa
 * thì giữ giá trị gốc. Đọc qua proxy nên luôn lấy bảng đang bật tại thời điểm đọc.
 */
export function themed<T extends object>(base: T, chiikawa: { [K in keyof T]?: unknown }): T {
  const over = chiikawa as Record<string | symbol, unknown>;
  return new Proxy(base, {
    get(target, key, receiver) {
      if (current === 'chiikawa' && key in over) return over[key];
      return Reflect.get(target, key, receiver);
    },
  });
}

/** Màu vàng viết cứng trong giao diện → màu tương ứng của bảng Chiikawa (khi đang bật). */
const CHIIKAWA_HEX: Record<string, string> = {
  '#8B6CF0': '#D65E86',
  '#F0644F': '#E68AAE',
  '#8C6A1F': '#C64E79',
  '#3B2A10': '#4A2433',
  '#EBC26A': '#EE8DB1',
  '#F4DA94': '#F7A9C6',
  '#E6BA66': '#E87AA3',
  '#F4E2B0': '#FCE4EC',
  '#9C8552': '#A3768B',
  '#6E5626': '#7A4E62',
  '#FBEFCB': '#FCE4EC',
  '#FEF3C7': '#FFF0F5',
  '#E2B54E': '#E77AA0',
  '#E9CF9A': '#F5CADB',
  '#B8862B': '#B94A70',
  '#6A4BD9': '#C64E79',
  '#F2B632': '#F48FB1',
  '#FBF5EC': '#FFF5F8',
  '#F9F6F1': '#FFF5F8',
  '#F6F3EE': '#FFF0F5',
  '#F6DC8E': '#F9C2D8',
  '#FDE68A': '#FCD3E3',
  '#F59E0B': '#E77AA0',
};

/** Màu vàng kim viết cứng → tím pixel khi đang bật theme Pixel (cùng các khoá với bảng Chiikawa). */
const PIXEL_HEX: Record<string, string> = {
  '#8B6CF0': '#9D7BFF',
  '#F0644F': '#B79CFF',
  '#8C6A1F': '#6A44D0',
  '#3B2A10': '#2B1B4E',
  '#EBC26A': '#C4B0FF',
  '#F4DA94': '#E4D9FF',
  '#E6BA66': '#B79CFF',
  '#F4E2B0': '#EFE8FF',
  '#9C8552': '#7B66AA',
  '#6E5626': '#4B3A72',
  '#FBEFCB': '#F1EBFF',
  '#FEF3C7': '#F5F0FF',
  '#E2B54E': '#A88BFF',
  '#E9CF9A': '#CFBFFF',
  '#B8862B': '#7B55E8',
  '#6A4BD9': '#6A44D0',
  '#F2B632': '#B79CFF',
  '#FBF5EC': '#FBF7FF',
  '#F9F6F1': '#FBF7FF',
  '#F6F3EE': '#F3EEFF',
  '#F6DC8E': '#D6C6FF',
  '#FDE68A': '#D9CBFF',
  '#F59E0B': '#9D7BFF',
  '#0F1D33': '#2B1B4E',
};

const PIXEL_RGBA: Array<[RegExp, string]> = [
  [/^rgba\(233,\s*181,\s*74,/, 'rgba(157,123,255,'],
  [/^rgba\(156,\s*133,\s*82,/, 'rgba(123,102,170,'],
  [/^rgba\(59,\s*42,\s*16,/, 'rgba(43,27,78,'],
  [/^rgba\(255,\s*250,\s*235,/, 'rgba(251,247,255,'],
];

/** Cùng các khoá vàng với bảng Pixel, nhưng đổi sang xanh cyber: nền tối navy, chữ sáng, điểm nhấn cyan. */
const CYBER_HEX: Record<string, string> = {
  '#8B6CF0': '#00B8D9',
  '#F0644F': '#00D0EE',
  '#8C6A1F': '#0A7FB3',
  '#3B2A10': '#E6F6FF',
  '#EBC26A': '#33E0FF',
  '#F4DA94': '#0E3B5C',
  '#E6BA66': '#00C8E8',
  '#F4E2B0': '#22406E',
  '#9C8552': '#6E8FAE',
  '#6E5626': '#A9D8EE',
  '#FBEFCB': '#1F3760',
  '#FEF3C7': '#1D3459',
  '#E2B54E': '#22D3EE',
  '#E9CF9A': '#0F3354',
  '#B8862B': '#0891B2',
  '#6A4BD9': '#0E7490',
  '#F2B632': '#00E5FF',
  '#FBF5EC': '#1B2D4F',
  '#F9F6F1': '#1B2D4F',
  '#F6F3EE': '#17284A',
  '#F6DC8E': '#124766',
  '#FDE68A': '#124766',
  '#F59E0B': '#00E5FF',
  '#0F1D33': '#E6F6FF',
};

const CYBER_RGBA: Array<[RegExp, string]> = [
  [/^rgba\(233,\s*181,\s*74,/, 'rgba(0,229,255,'],
  [/^rgba\(156,\s*133,\s*82,/, 'rgba(110,143,174,'],
  [/^rgba\(59,\s*42,\s*16,/, 'rgba(230,246,255,'],
  [/^rgba\(255,\s*250,\s*235,/, 'rgba(15,26,46,'],
];

const CHIIKAWA_RGBA: Array<[RegExp, string]> = [
  [/^rgba\(233,\s*181,\s*74,/, 'rgba(214,94,134,'],
  [/^rgba\(156,\s*133,\s*82,/, 'rgba(163,118,139,'],
  [/^rgba\(59,\s*42,\s*16,/, 'rgba(74,36,51,'],
  [/^rgba\(255,\s*250,\s*235,/, 'rgba(255,240,246,'],
];

/** Đổi một mã màu vàng sang hồng khi đang bật Chiikawa; mã khác giữ nguyên. */
export function themedHex(hex: string): string {
  if (current === 'pixel' || current === 'cyber') {
    const [hexMap, rgbaMap] = current === 'cyber' ? [CYBER_HEX, CYBER_RGBA] : [PIXEL_HEX, PIXEL_RGBA];
    if (hex.startsWith('rgba(')) {
      for (const [re, to] of rgbaMap) if (re.test(hex)) return hex.replace(re, to);
      return hex;
    }
    return hexMap[hex.toUpperCase()] ?? hex;
  }
  if (current !== 'chiikawa') return hex;
  if (hex.startsWith('rgba(')) {
    for (const [re, to] of CHIIKAWA_RGBA) if (re.test(hex)) return hex.replace(re, to);
    return hex;
  }
  return CHIIKAWA_HEX[hex.toUpperCase()] ?? hex;
}
