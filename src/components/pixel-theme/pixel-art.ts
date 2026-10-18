import { Platform } from 'react-native';

import { CUTE_PALETTES } from '@/components/layout/cute-palettes';
import { useRewardStore } from '@/store/useRewardStore';

/**
 * Họ giao diện PIXEL: hai chủ đề mua bằng sao ở Đổi quà, dùng chung một cách vẽ
 * (khung viền đậm, bóng lệch đặc, góc gần vuông, nền lưới) nhưng khác bảng màu.
 *
 *   theme-pixel  Pixel · Y2K tím   — lilac, hồng, xanh ngọc, dễ thương
 *   theme-cyber  Cyber · Neon xanh — đen navy, cyan neon, xanh điện, cho vibe con trai
 *
 * Chỉ dùng màu và hình khối tự vẽ. Không chép hình minh hoạ hay logo của ai.
 * Không dùng font pixel: các font pixel phổ biến thiếu chữ tiếng Việt (ví dụ Silkscreen),
 * nên chữ vẫn là Nunito như mọi giao diện khác.
 */
export const PIXEL_THEME_ID = 'theme-pixel';
export const CYBER_THEME_ID = 'theme-cyber';

export type PixelTheme = {
  id: 'theme-pixel' | 'theme-cyber' | 'theme-pink';
  /** Màu viền, chữ đậm và bóng lệch. */
  line: string;
  /** Viền mảnh giữa các khối. */
  lineSoft: string;
  /** Mặt thẻ. */
  paper: string;
  /** Nền khung phụ (canvas). */
  canvas: string;
  /** Chữ chính. */
  text: string;
  /** Chữ phụ. */
  body: string;
  muted: string;
  subtle: string;
  /** Điểm nhấn chữ (đường dẫn, số liệu). */
  accent: string;
  /** Hai mép bevel: sáng ở trên-trái, tối ở dưới-phải. */
  hi: string;
  lo: string;
  /** Màu bóng lệch đặc của thẻ và nút. */
  shadow: string;
  /** Nền trang: gradient và lưới. */
  bgTop: string;
  bgBottom: string;
  grid: string;
  /** Nút chính / thương hiệu: hai đầu gradient và chữ trên nút. */
  fillTop: string;
  fillBottom: string;
  onFill: string;
  /** Các nút khác màu. */
  secondary: string;
  danger: string;
  /** Nền thẻ sticker (hai tông, sáng → đậm). */
  sticker: readonly [string, string];
  /** Nền khối hero và các khối lưới (cùng cấu trúc với bảng nền cũ). */
  palette: {
    label: string;
    labelEn: string;
    swatch: string;
    browse: readonly [string, string, string];
    study: readonly [string, string, string];
    browseLine: string;
    studyLine: string;
  };
  /** Vệt highlight vàng cũ → hai tông của theme. */
  gold: readonly [string, string, string];
  selection: string;
  /** Độ dày viền và bo góc: pixel dày, cyber mảnh và bo nhẹ. */
  bw: number;
  radius: number;
  /** Bóng của thẻ, nút và khối hero (chuỗi box-shadow đầy đủ). */
  elev: string;
  elevBtn: string;
  elevLg: string;
};

const PURPLE: PixelTheme = {
  id: 'theme-pixel',
  line: '#2B1B4E',
  lineSoft: '#B9A6F0',
  paper: '#FBF7FF',
  canvas: '#EFE8FF',
  text: '#2B1B4E',
  body: '#4B3A72',
  muted: '#6B5A8E',
  subtle: '#9A8BBE',
  accent: '#6A44D0',
  hi: '#FFFFFF',
  lo: '#D6C6FF',
  shadow: '#2B1B4E',
  bgTop: '#C8B6FF',
  bgBottom: '#E9DDFF',
  grid: 'rgba(255,255,255,0.32)',
  fillTop: '#B79CFF',
  fillBottom: '#8A63F0',
  onFill: '#2B1B4E',
  secondary: '#8FE3FF',
  danger: '#FF7A7A',
  sticker: ['#C9B6FF', '#7B55E8'],
  palette: {
    label: 'Mặc định',
    labelEn: 'Default',
    swatch: '#9D7BFF',
    browse: ['#D9CCFF', '#E6DDFF', '#F1EBFF'],
    study: ['#FBF7FF', '#F3EEFF', '#E9DFFF'],
    browseLine: 'rgba(43, 27, 78, 0.10)',
    studyLine: 'rgba(43, 27, 78, 0.12)',
  },
  gold: ['#E4D9FF', '#B79CFF', '#9D7BFF'],
  selection: '#BBA3FF',
  bw: 3,
  radius: 6,
  elev: 'inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #D6C6FF, 4px 4px 0 #2B1B4E',
  elevBtn: '3px 3px 0 #2B1B4E',
  elevLg: '6px 6px 0 #2B1B4E',
};

const CYBER: PixelTheme = {
  id: 'theme-cyber',
  line: '#3DD9F5',
  lineSoft: '#1F3A5F',
  paper: '#1B2D4F',
  canvas: '#17284A',
  text: '#F3F8FF',
  body: '#C5D5EA',
  muted: '#8FA6C4',
  subtle: '#64809F',
  accent: '#8BF3FF',
  hi: '#2A4170',
  lo: '#0F1D36',
  shadow: '#3DD9F5',
  bgTop: '#0E1B33',
  bgBottom: '#1A2F55',
  grid: 'rgba(120,200,255,0.07)',
  fillTop: '#4C8DFF',
  fillBottom: '#1E4FD1',
  onFill: '#FFFFFF',
  secondary: '#5EE7FF',
  danger: '#FF5C7A',
  sticker: ['#243D66', '#15264A'],
  palette: {
    label: 'Cyber · Neon xanh',
    labelEn: 'Cyber · Neon blue',
    swatch: '#3DD9F5',
    browse: ['#1A2F55', '#1F3760', '#243F6B'],
    study: ['#1D3459', '#192C4F', '#152545'],
    browseLine: 'rgba(120, 200, 255, 0.10)',
    studyLine: 'rgba(120, 200, 255, 0.12)',
  },
  gold: ['#2A4E80', '#5BC8EE', '#8BF3FF'],
  selection: '#2E5C8F',
  bw: 1.5,
  radius: 10,
  elev: '0 0 0 1px rgba(61,217,245,0.22), 0 14px 34px -14px rgba(61,217,245,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
  elevBtn: '0 0 0 1px rgba(61,217,245,0.35), 0 8px 22px -10px rgba(61,217,245,0.55), inset 0 1px 0 rgba(255,255,255,0.22)',
  elevLg: '0 0 0 1px rgba(61,217,245,0.25), 0 20px 50px -18px rgba(61,217,245,0.40), inset 0 1px 0 rgba(255,255,255,0.10)',
};

/**
 * Hồng — bảng màu MẶC ĐỊNH của toàn app (khi người dùng chưa chọn theme nào). Lấy từ theme tím
 * rồi đổi màu, nên hình khối, độ dày viền và bóng vẫn như cũ. Hai theme mua bằng sao ở trên không đổi.
 */
const PINK: PixelTheme = {
  ...PURPLE,
  id: 'theme-pink',
  line: '#5A1E3C',
  lineSoft: '#FFB3CC',
  paper: '#FFF7FA',
  canvas: '#FFE3EE',
  text: '#5A1E3C',
  body: '#7A3556',
  muted: '#9A5C7C',
  subtle: '#C48AA6',
  accent: '#E0457B',
  hi: '#FFFFFF',
  lo: '#FFC2D8',
  shadow: '#5A1E3C',
  bgTop: '#FFC2D8',
  bgBottom: '#FFE6F0',
  grid: 'rgba(255,255,255,0.4)',
  fillTop: '#FF9EC0',
  fillBottom: '#F0628F',
  onFill: '#5A1E3C',
  secondary: '#FFD1E3',
  danger: '#FF6B8B',
  sticker: ['#FFC2D8', '#F0628F'],
  palette: {
    label: 'Hồng',
    labelEn: 'Pink',
    swatch: '#FF9EC0',
    browse: ['#FFD1E3', '#FFE3EE', '#FFF0F6'],
    study: ['#FFF7FA', '#FFEEF5', '#FFE0EC'],
    browseLine: 'rgba(90, 30, 60, 0.10)',
    studyLine: 'rgba(90, 30, 60, 0.12)',
  },
  gold: ['#FFE3EE', '#FF9EC0', '#F0628F'],
  selection: '#FFB3CC',
  elev: 'inset 3px 3px 0 #FFFFFF, inset -3px -3px 0 #FFC2D8, 4px 4px 0 #5A1E3C',
  elevBtn: '3px 3px 0 #5A1E3C',
  elevLg: '6px 6px 0 #5A1E3C',
};

export const PIXEL_THEMES: Record<PixelTheme['id'], PixelTheme> = {
  'theme-pixel': PURPLE,
  'theme-cyber': CYBER,
  'theme-pink': PINK,
};

/**
 * Bảng màu đang bật: hồng khi chọn theme máy chơi điện tử (mua trong Đổi quà); theme pixel/cyber khi đã mua và chọn;
 * null với các theme khác (Chiikawa, Sakura…) để chúng giữ giao diện riêng.
 */
export const ARCADE_THEME_ID = 'theme-arcade';

export function usePixelTheme(): PixelTheme | null {
  const id = useRewardStore((s) => s.theme);
  if (id === ARCADE_THEME_ID) return PINK;
  return id === PIXEL_THEME_ID || id === CYBER_THEME_ID ? PIXEL_THEMES[id] : null;
}

/** Đúng khi đang bật một chủ đề thuộc họ pixel. */
export function usePixelOn(): boolean {
  return usePixelTheme() !== null;
}

/** Nền trang: gradient kèm lưới (web). Trên máy khác chỉ còn màu nền. */
export function pixelPageBg(t: PixelTheme) {
  // Cyber vẽ nền bằng lớp neon trên body (global.css), nên trang phải trong suốt để lớp đó hiện.
  if (t.id === 'theme-cyber') return { backgroundColor: 'transparent' } as const;
  return {
    backgroundColor: t.bgBottom,
    ...(Platform.OS === 'web'
      ? {
          backgroundImage: `linear-gradient(180deg, ${t.bgTop} 0%, ${t.bgBottom} 70%), linear-gradient(${t.grid} 1px, transparent 1px), linear-gradient(90deg, ${t.grid} 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 24px 24px, 24px 24px',
        }
      : {}),
  } as const;
}

/** Thẻ pixel: viền đậm 3px, góc gần vuông, bóng lệch đặc. */
export function pixelCardStyle(t: PixelTheme) {
  return {
    borderRadius: t.radius,
    borderWidth: t.bw,
    borderColor: t.line,
    backgroundColor: t.paper,
    ...(Platform.OS === 'web' ? { boxShadow: t.elev } : {}),
  } as const;
}

/** Nút pixel: viền đậm, góc gần vuông, bóng lệch đặc; màu theo vai trò của nút. */
export function pixelButtonStyle(variant: string, t: PixelTheme): object {
  const ghost = variant === 'ghost';
  const fill: Record<string, string> = {
    primary: t.fillBottom,
    brand: t.fillBottom,
    secondary: t.secondary,
    danger: t.danger,
    onDark: t.line,
    onDarkSolid: t.paper,
    brandOutline: t.paper,
    outline: t.paper,
    ghost: 'transparent',
  };
  return {
    borderRadius: t.radius,
    borderWidth: ghost ? 0 : t.bw,
    borderColor: t.line,
    backgroundColor: fill[variant] ?? t.paper,
    ...(!ghost && Platform.OS === 'web' ? { boxShadow: t.elevBtn } : {}),
  };
}

/** Màu chữ trên nút pixel: chữ tối trên nền sáng, chữ trắng trên nút chính đậm. */
export function pixelLabelColor(variant: string, t: PixelTheme): string {
  if (variant === 'primary' || variant === 'brand') return t.onFill;
  if (variant === 'danger') return t.onFill;
  return t.text;
}
