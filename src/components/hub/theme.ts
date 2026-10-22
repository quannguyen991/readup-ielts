/**
 * Ngôn ngữ thiết kế khu luyện nói (Hub) — SÁNG, ẤM, đồng bộ với phần còn lại của Band 9:
 * - Nền kem vàng nhạt (#F3F0FB → #F3F0FB), thẻ trắng viền be, bóng nâu mờ.
 * - Chữ nâu đậm (#2B2350 ink, #2B2350 body, #7C6552 muted); nhấn nâu vàng #6A4BD9.
 * - Tên khoá cũ (COSMIC, GLASS_CARD…) giữ nguyên để mọi màn Hub tự đổi theo.
 */

export const COSMIC = {
  bg: ['#F3F0FB', '#F3F0FB', '#F3F0FB'] as readonly string[],
  ink: '#2B2350',
  body: '#2B2350',
  muted: '#7C6552',
  line: '#F3F0FB',
  glass: '#FFFFFF',
  glassStrong: '#F3F0FB',
  cardBg: '#FFFFFF',
  cardBorder: '#F3F0FB',
  blue: '#6A4BD9',
  sky: '#6A4BD9',
  cyan: '#0E8FA8',
  violet: '#7C5CE0',
  green: '#16A34A',
  amber: '#6A4BD9',
  orange: '#6A4BD9',
  red: '#DC3F3F',
  paper: '#F3F0FB',
  primary: '#6A4BD9',
  gold: '#C8923A',
  goldSoft: '#F3F0FB',
};

export const HUB = COSMIC;

/** Thẻ trắng bo góc 18, viền be, bóng nâu rất nhẹ. Dùng dạng mảng: `[GLASS_CARD, { padding: 16 }]`. */
export const GLASS_CARD = {
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  borderWidth: 1,
  borderColor: '#F3F0FB',
  shadowColor: '#2B2350',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 5 },
} as const;

/** Nền chip/ô lồng trong thẻ (thay cho rgba trắng mờ của bản tối). */
export const SOFT_FILL = '#F3F0FB';
export const SOFT_LINE = '#F3F0FB';

export const BAND_COLOR = {
  good: '#16A34A',
  fair: '#6A4BD9',
  poor: '#DC3F3F',
  unknown: '#A38F7E',
} as const;

export const DIFF_COLOR = {
  EASY: '#16A34A',
  MEDIUM: '#6A4BD9',
  HARD: '#6A4BD9',
} as const;

export const BADGE_STYLES = {
  NEW: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  BETA: { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' },
  PREMIUM: { bg: '#F3F0FB', text: '#6A4BD9', border: '#FDE68A' },
  EASY: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  MEDIUM: { bg: '#F3F0FB', text: '#6A4BD9', border: '#FDE68A' },
  HARD: { bg: '#F3F0FB', text: '#6A4BD9', border: '#FED7AA' },
  SO_CAP: { bg: '#F3F0FB', text: '#6A5645', border: '#F3F0FB' },
} as const;

export const TAG_COLOR = {
  NEW: '#0369A1',
  BETA: '#6D28D9',
  PREMIUM: '#6A4BD9',
} as const;

/** Quả cầu AI theo trạng thái — vàng kim / cam / xanh ngọc cho hợp nền sáng. */
const GLOW_COSMIC: Record<'idle' | 'speaking' | 'listening' | 'thinking', [string, string]> = {
  idle: ['#F5C451', '#6A4BD9'],
  speaking: ['#F59E0B', '#6A4BD9'],
  listening: ['#34D399', '#0EA5A5'],
  thinking: ['#A78BFA', '#EC4899'],
};

export function glowFor(mood: 'idle' | 'speaking' | 'listening' | 'thinking'): [string, string] {
  return GLOW_COSMIC[mood];
}
