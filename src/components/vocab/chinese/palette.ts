import { Platform } from 'react-native';

/**
 * Bảng màu "Band 9 · Từ vựng tiếng Trung" (bản navy): nền chàm đêm, thẻ kem, chữ mận đỏ, vàng nhạt.
 * Nền trang là navy (phủ lên banner mờ); thẻ và khối nội dung là kem, nên chữ trên thẻ dùng `ink`.
 * Chữ đặt trực tiếp trên nền trang dùng `onPage`/`onPageSoft` (sáng).
 * Chỉ dùng cho màn học tiếng Trung; phần còn lại của app giữ bảng tím/Chiikawa.
 */
export const ZH = {
  paper: '#FFFFFF',
  card: '#FFFBF3',
  cream2: '#FBF4E6',
  ink: '#4A1A24',
  ink2: '#6E4B4F',
  mist: '#A8998A',
  gold: '#C49A4A',
  gold2: '#E9C98A',
  goldSoft: '#D9B878',
  line: '#EAD9B8',
  seal: '#8E2232',
  seal2: '#A83A4A',
  sage: '#4E7A5C',
  sageSoft: '#DDE9D2',
  dangerSoft: '#F3D5CF',
  goldSoftBg: '#F4E6C2',
  onPage: '#4A1A24',
  onPageSoft: '#6E4B4F',
} as const;

/**
 * Một hệ bo góc và viền cho cả trang, để mọi mảnh nhìn như cùng một tờ giấy:
 * tờ chính 24, khối bên trong 16, nút và ô nhỏ 12. Viền bên trong luôn là ZH.line;
 * vàng chỉ dùng cho viền ngoài tờ giấy và thanh tiến độ.
 */
export const RADIUS = { sheet: 24, block: 16, control: 12 } as const;

/** Màu thanh điệu: 1 đỏ son, 2 vàng hổ phách, 3 xanh lá, 4 xanh chàm, 5 (nhẹ) xám. */
export const ZH_TONE: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#B3262E',
  2: '#B5701C',
  3: '#3E7A57',
  4: '#2F5B8A',
  5: '#9C8580',
};

const TONE_OF: Record<string, 1 | 2 | 3 | 4> = {
  ā: 1, á: 2, ǎ: 3, à: 4, ē: 1, é: 2, ě: 3, è: 4, ī: 1, í: 2, ǐ: 3, ì: 4,
  ō: 1, ó: 2, ǒ: 3, ò: 4, ū: 1, ú: 2, ǔ: 3, ù: 4, ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4,
};

/** Thanh điệu của một âm tiết pinyin (đọc dấu thanh; không có dấu thì coi là thanh nhẹ 5). */
export function toneOf(py: string): 1 | 2 | 3 | 4 | 5 {
  for (const ch of py) {
    const t = TONE_OF[ch];
    if (t) return t;
  }
  return 5;
}

export function toneLabel(tone: 1 | 2 | 3 | 4 | 5): string {
  return tone === 5 ? 'thanh nhẹ' : `thanh ${tone}`;
}

/**
 * Chữ Hán: phông sans (Noto Sans SC) trên web, không thư pháp, không serif.
 * Native dùng phông CJK hệ thống.
 */
export const HANZI_FAMILY = Platform.select({
  web: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  default: undefined,
}) as string | undefined;

/**
 * Tiêu đề: cùng phông sans đậm của app (Inter, như class `font-heavy`). Không dùng serif nữa.
 * Chữ Hán vẫn dùng HANZI_FAMILY.
 */
export const HEAD_FAMILY = Platform.select({
  web: "'InterTight_600SemiBold', 'Inter_600SemiBold', system-ui, sans-serif",
  default: 'InterTight_600SemiBold',
}) as string | undefined;
