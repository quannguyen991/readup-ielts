/**
 * Ngôn ngữ thiết kế khu luyện nói (Hub) — SÁNG, ẤM, đồng bộ với phần còn lại của Band 9:
 * - Nền kem vàng nhạt (#FFF9EF → #F6EBDA), thẻ trắng viền be, bóng nâu mờ.
 * - Chữ nâu đậm (#2A1808 ink, #573E29 body, #7C6552 muted); nhấn nâu vàng #8C531B.
 * - Tên khoá cũ (COSMIC, GLASS_CARD…) giữ nguyên để mọi màn Hub tự đổi theo.
 */

export const COSMIC = {
  bg: ['#FFF9EF', '#FBF3E4', '#F6EBDA'] as readonly string[],
  ink: '#2A1808',
  body: '#573E29',
  muted: '#7C6552',
  line: '#EADFCF',
  glass: '#FFFFFF',
  glassStrong: '#FAF3E8',
  cardBg: '#FFFFFF',
  cardBorder: '#EFE5D8',
  blue: '#8C531B',
  sky: '#A8671F',
  cyan: '#0E8FA8',
  violet: '#7C5CE0',
  green: '#16A34A',
  amber: '#D98A0B',
  orange: '#EA6A12',
  red: '#DC3F3F',
  paper: '#FFF9EF',
  primary: '#8C531B',
  gold: '#C8923A',
  goldSoft: '#F7E7C6',
};

export const HUB = COSMIC;

/** Thẻ trắng bo góc 18, viền be, bóng nâu rất nhẹ. Dùng dạng mảng: `[GLASS_CARD, { padding: 16 }]`. */
export const GLASS_CARD = {
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  borderWidth: 1,
  borderColor: '#EFE5D8',
  shadowColor: '#784415',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 5 },
} as const;

/** Nền chip/ô lồng trong thẻ (thay cho rgba trắng mờ của bản tối). */
export const SOFT_FILL = '#FAF3E8';
export const SOFT_LINE = '#EADFCF';

export const BAND_COLOR = {
  good: '#16A34A',
  fair: '#D98A0B',
  poor: '#DC3F3F',
  unknown: '#A38F7E',
} as const;

export const DIFF_COLOR = {
  EASY: '#16A34A',
  MEDIUM: '#8C531B',
  HARD: '#EA6A12',
} as const;

export const BADGE_STYLES = {
  NEW: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  BETA: { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' },
  PREMIUM: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  EASY: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  MEDIUM: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  HARD: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' },
  SO_CAP: { bg: '#F5EBDD', text: '#6A5645', border: '#EADFCF' },
} as const;

export const TAG_COLOR = {
  NEW: '#0369A1',
  BETA: '#6D28D9',
  PREMIUM: '#B45309',
} as const;

/** Quả cầu AI theo trạng thái — vàng kim / cam / xanh ngọc cho hợp nền sáng. */
const GLOW_COSMIC: Record<'idle' | 'speaking' | 'listening' | 'thinking', [string, string]> = {
  idle: ['#F5C451', '#E08A1E'],
  speaking: ['#F59E0B', '#EA580C'],
  listening: ['#34D399', '#0EA5A5'],
  thinking: ['#A78BFA', '#EC4899'],
};

export function glowFor(mood: 'idle' | 'speaking' | 'listening' | 'thinking'): [string, string] {
  return GLOW_COSMIC[mood];
}
