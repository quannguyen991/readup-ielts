import { GLASS } from '@/components/layout/phone-theme';
import { GOLD_SKY, INK_G, BODY_G, MUTED_G } from '@/components/gallery/glass';
import { themed, paletteId } from '@/theme/palette-state';

/**
 * Bảng màu khu luyện nói theo chủ đề của app:
 * - Giao diện mặc định: vàng kim (nền trời vàng kem, chữ nâu mực, nút vàng đậm).
 * - Giao diện Chiikawa: hồng (nền trời hồng, chữ mận, nút hồng).
 *
 * Dùng `themed()` như các token khác: đọc lúc vẽ, nên đổi chủ đề là khu này đổi theo.
 * Các màu trạng thái (xanh, vàng, đỏ) giữ nguyên ở cả hai để người học đọc điểm nhất quán.
 */
const BASE = {
  bg: GOLD_SKY as readonly string[],
  ink: INK_G as string,
  body: BODY_G as string,
  muted: MUTED_G as string,
  line: 'rgba(184,149,90,0.32)',
  glass: 'rgba(255,252,242,0.55)',
  glassStrong: 'rgba(255,255,255,0.72)',
  /** Màu nhấn: vàng đậm để chữ trắng trên nút vẫn đọc được. */
  blue: '#8F6E36',
  violet: '#A7833F',
  green: '#2E7D4F',
  amber: '#A8741A',
  red: '#B33A2A',
  orange: '#B9661B',
  /** Nền nổi (modal, thanh tab): kem ấm, hơi đặc để chữ nổi trên cảnh vàng. */
  paper: 'rgba(255,252,242,0.97)',
};

const CHIIKAWA = {
  bg: ['#FFF8FA', '#FCE4EC', '#F9C6D8', '#F4B0C9', '#FBE8EF'] as readonly string[],
  ink: '#4A2433',
  body: '#7A4E62',
  muted: '#A3768B',
  line: 'rgba(214,94,134,0.3)',
  glass: 'rgba(255,246,250,0.6)',
  glassStrong: 'rgba(255,255,255,0.8)',
  blue: '#C64E79',
  violet: '#D65E86',
  orange: '#C64E79',
  paper: 'rgba(255,247,250,0.97)',
};

export const HUB = themed(BASE, CHIIKAWA) as typeof BASE;

/** Thẻ kính của app, bo góc 16. Dùng dạng mảng: `[GLASS_CARD, { padding: 16 }]`. */
export const GLASS_CARD = [GLASS, { borderRadius: 16 }] as never;

export const BAND_COLOR = { good: '#2E7D4F', fair: '#A8741A', poor: '#B33A2A', unknown: '#8E95B3' } as const;

export const DIFF_COLOR = { EASY: '#2E7D4F', MEDIUM: '#8F6E36', HARD: '#B9661B' } as const;

export const TAG_COLOR = { NEW: '#8F6E36', BETA: '#A7833F', PREMIUM: '#A8741A' } as const;

/** Quả cầu AI theo mood và chủ đề. */
const GLOW_BASE: Record<'idle' | 'speaking' | 'listening' | 'thinking', [string, string]> = {
  idle: ['#F4DA94', '#B8955A'],
  speaking: ['#FBE7AE', '#A7833F'],
  listening: ['#B9E3C4', '#4E9A6A'],
  thinking: ['#FBD38D', '#C0822E'],
};
const GLOW_CHIIKAWA: Record<'idle' | 'speaking' | 'listening' | 'thinking', [string, string]> = {
  idle: ['#FCE4EC', '#D65E86'],
  speaking: ['#FFD0E1', '#C64E79'],
  listening: ['#D7F3E0', '#4E9A6A'],
  thinking: ['#FFE3B3', '#E0609A'],
};
export function glowFor(mood: 'idle' | 'speaking' | 'listening' | 'thinking'): [string, string] {
  return paletteId() === 'chiikawa' ? GLOW_CHIIKAWA[mood] : GLOW_BASE[mood];
}
