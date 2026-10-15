/**
 * BẢNG MÀU ĐANG DÙNG — một biến trong bộ nhớ, đọc đồng bộ ở mọi nơi render.
 *
 * Gốc app (app/_layout.tsx) đặt bảng theo chủ đề, sau khi trình duyệt đã hydrate,
 * rồi dựng lại cả cây (key theo bảng) — nên mọi giá trị đọc qua `themed()` đều mới.
 * Không lưu gì xuống máy: chủ đề đã lưu sẵn trong store phần thưởng.
 */
export type PaletteId = 'classic' | 'chiikawa';

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
  '#B8955A': '#D65E86',
  '#CCA35B': '#E68AAE',
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
  '#A8843F': '#C64E79',
  '#F2B632': '#F48FB1',
  '#FBF5EC': '#FFF5F8',
  '#F9F6F1': '#FFF5F8',
  '#F6F3EE': '#FFF0F5',
  '#F6DC8E': '#F9C2D8',
  '#FDE68A': '#FCD3E3',
  '#F59E0B': '#E77AA0',
};

const CHIIKAWA_RGBA: Array<[RegExp, string]> = [
  [/^rgba\(233,\s*181,\s*74,/, 'rgba(214,94,134,'],
  [/^rgba\(156,\s*133,\s*82,/, 'rgba(163,118,139,'],
  [/^rgba\(59,\s*42,\s*16,/, 'rgba(74,36,51,'],
  [/^rgba\(255,\s*250,\s*235,/, 'rgba(255,240,246,'],
];

/** Đổi một mã màu vàng sang hồng khi đang bật Chiikawa; mã khác giữ nguyên. */
export function themedHex(hex: string): string {
  if (current !== 'chiikawa') return hex;
  if (hex.startsWith('rgba(')) {
    for (const [re, to] of CHIIKAWA_RGBA) if (re.test(hex)) return hex.replace(re, to);
    return hex;
  }
  return CHIIKAWA_HEX[hex.toUpperCase()] ?? hex;
}
