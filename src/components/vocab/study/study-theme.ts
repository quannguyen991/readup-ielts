/**
 * BỘ MÀU CHỦ ĐỀ cho mọi màn ôn từ vựng — một nguồn duy nhất (thuần dữ liệu, test được).
 *
 * Mỗi chủ đề có: nền trời (CSS), màu thẻ + chữ + viền, màu ô phương án, màu chữ NẰM NGOÀI
 * thẻ (`onBg`), và loại lớp hoạt hình (`layer`). Màn học đọc màu qua `useStudyTheme()`,
 * nền vẽ ở `StudyBackdrop` — không màn nào tự chọn màu.
 *
 * Độ tương phản chữ được test (WCAG AA >= 4,5:1) ở `study-theme.test.ts`.
 * "Mặc định" giữ nguyên nền cảnh bay pixel + thẻ trắng như trước.
 */
export type ThemeId = 'plain' | 'scene' | 'space' | 'sakura' | 'forest' | 'sunset' | 'rain' | 'journey' | 'px-auto' | 'px-tokyo' | 'px-paris' | 'px-london' | 'px-singapore' | 'px-hanoi' | 'art-dark' | 'art-light';
export type ThemeLayer = 'none' | 'scene' | 'stars' | 'petals' | 'mist' | 'dusk' | 'rain' | 'world' | 'pxscene';

export type StudyTheme = {
  id: ThemeId;
  vi: string;
  en: string;
  /** Thẻ nền tối (chữ sáng) — bật bộ ghi đè màu chữ của lớp CSS. */
  dark: boolean;
  /** Có lớp trang trí (nền động, sao, cảnh) — chủ đề "Mặc định" phẳng thì không. */
  fx: boolean;
  layer: ThemeLayer;
  /** Màu nền phẳng dưới cùng (và ước lượng màu nền để đo tương phản). */
  skyBase: string;
  /** Các màu nền thật sự có thể nằm sau chữ `onBg` (để test tương phản mọi đầu mút). */
  skyStops: string[];
  /** CSS `background` của lớp trời. */
  sky: string;
  /** Hình xem trước trong Cài đặt. */
  swatch: string;
  card: string;
  cardBorder: string;
  ink: string;
  muted: string;
  /** Nền nhạt trong thẻ (khối phụ, nút phụ). */
  soft: string;
  /** Ô nhập chữ. */
  field: string;
  fieldBorder: string;
  optBg: string;
  optBorder: string;
  optNum: string;
  chipBg: string;
  chipInk: string;
  /** Nút chính. */
  accent: string;
  accentDisabled: string;
  good: string;
  goodBg: string;
  bad: string;
  badBg: string;
  /** Nhấn vàng cam cho nhãn "hỏi lại" / cảnh báo nhẹ. */
  warn: string;
  /** Chữ nằm ngoài thẻ (tiêu đề, dòng số liệu). */
  onBg: string;
  /** Nền nhỏ cho nút "Thoát" / "Cài đặt" trên nền trời. */
  pill: string;
  pillInk: string;
};

const LIGHT_BASE = {
  dark: false,
  fx: true,
  soft: '#F9F6F1',
  field: '#FCFBF8',
  fieldBorder: '#E1D9CB',
  optBg: '#FFFFFF',
  optBorder: '#EDE6D8',
  optNum: '#F7F4EE',
  chipBg: '#F7F4EE',
  chipInk: '#0F172A',
  accent: '#8F6E36',
  accentDisabled: '#F4E7D1',
  good: '#15803D',
  goodBg: '#F0FAF3',
  bad: '#BE123C',
  badBg: '#FEF2F4',
  warn: '#B45309',
  ink: '#0F172A',
  muted: '#5B6678',
  pill: 'rgba(255,255,255,0.8)',
  pillInk: '#0F172A',
} as const;

const DARK_BASE = {
  dark: true,
  fx: true,
  ink: '#F1F5F9',
  muted: '#AEB9CC',
  soft: 'rgba(255,255,255,0.07)',
  field: 'rgba(255,255,255,0.08)',
  fieldBorder: 'rgba(255,255,255,0.22)',
  optBg: 'rgba(255,255,255,0.06)',
  optBorder: 'rgba(255,255,255,0.18)',
  optNum: 'rgba(255,255,255,0.10)',
  chipBg: 'rgba(255,255,255,0.10)',
  chipInk: '#E2E8F0',
  accent: '#8F6E36',
  accentDisabled: 'rgba(143,110,54,0.45)',
  good: '#4ADE80',
  goodBg: 'rgba(74,222,128,0.12)',
  bad: '#FB7185',
  badBg: 'rgba(251,113,133,0.12)',
  warn: '#FBBF24',
  onBg: '#FFFFFF',
  pill: 'rgba(255,255,255,0.14)',
  pillInk: '#F1F5F9',
} as const;

/**
 * TRANH NỔI TIẾNG là một "chủ đề" nữa: ảnh nằm sau, thẻ học trong mờ đặc (~92–94%) để chữ và màu đúng/sai
 * đạt AA trên bất kỳ vùng nào của tranh. Chỉ có hai bộ màu theo TÔNG của tranh (tối / sáng); bức nào thuộc
 * tông nào do `src/data/backdrops.ts` quyết. Không nằm trong `THEME_ORDER` (người học chọn ở mục Tranh).
 */
const ART_THEMES: Record<'art-dark' | 'art-light', StudyTheme> = {
  'art-dark': {
    ...DARK_BASE,
    id: 'art-dark',
    vi: 'Tranh (nền tối)',
    en: 'Painting (dark)',
    layer: 'none',
    skyBase: '#0B1020',
    skyStops: ['#0B1020', '#2A3560'],
    sky: '#0B1020',
    swatch: '#0B1020',
    card: 'rgba(10,14,32,0.92)',
    cardBorder: 'rgba(255,255,255,0.16)',
    pill: 'rgba(10,14,32,0.72)',
  },
  'art-light': {
    ...LIGHT_BASE,
    id: 'art-light',
    vi: 'Tranh (nền sáng)',
    en: 'Painting (light)',
    layer: 'none',
    skyBase: '#EDE9E1',
    skyStops: ['#F6F0DC', '#D9D2BC'],
    sky: '#EDE9E1',
    swatch: '#EDE9E1',
    card: 'rgba(255,255,255,0.94)',
    cardBorder: 'rgba(15,23,42,0.08)',
    onBg: '#1E293B',
    pill: 'rgba(255,255,255,0.9)',
  },
};
export const ART_THEME_IDS: readonly ThemeId[] = ['art-dark', 'art-light'];
export function isArtTheme(id: string): boolean {
  return id === 'art-dark' || id === 'art-light';
}


/**
 * CẢNH THÀNH PHỐ PIXEL CHUYỂN ĐỘNG (vẽ bằng mã, xem components/travel/pxscene): mỗi cảnh một chủ đề, thẻ học tối mờ ~92%
 * để chữ đạt AA trên mọi vùng của cảnh; chữ ngoài thẻ trắng trên lớp phủ tối của nền. `px-auto` lấy cảnh theo thành phố
 * người học đang ở trong Du ngoạn.
 */
const PX_BASE = { ...DARK_BASE, layer: 'pxscene', card: 'rgba(8,10,28,0.92)', cardBorder: 'rgba(160,170,255,0.24)' } as const;
const PX_THEMES: Record<'px-auto' | 'px-tokyo' | 'px-paris' | 'px-london' | 'px-singapore' | 'px-hanoi', StudyTheme> = {
  'px-auto': { ...PX_BASE, id: 'px-auto', vi: 'Thành phố đang ở', en: 'City you are in', skyBase: '#0B0F2A', skyStops: ['#070A1E', '#0B0F2A'], sky: '#0B0F2A', swatch: 'linear-gradient(135deg,#14103A,#A44A86 55%,#FFB070)' },
  'px-tokyo': { ...PX_BASE, id: 'px-tokyo', vi: 'Tokyo đêm mưa', en: 'Tokyo, rainy night', skyBase: '#0A0A24', skyStops: ['#06061A', '#0A0A24'], sky: '#0A0A24', swatch: 'linear-gradient(180deg,#06061A,#2A1B55 60%,#FF4FD8)' },
  'px-paris': { ...PX_BASE, id: 'px-paris', vi: 'Paris hoàng hôn', en: 'Paris at dusk', skyBase: '#1B1448', skyStops: ['#150F3C', '#1B1448'], sky: '#1B1448', swatch: 'linear-gradient(180deg,#2A1B6A,#A44A86 55%,#FFC080)' },
  'px-london': { ...PX_BASE, id: 'px-london', vi: 'London chiều mưa', en: 'London, rainy evening', skyBase: '#141B33', skyStops: ['#0E1428', '#141B33'], sky: '#141B33', swatch: 'linear-gradient(180deg,#151C33,#566A8E 70%,#D12B35)' },
  'px-singapore': { ...PX_BASE, id: 'px-singapore', vi: 'Singapore pháo hoa', en: 'Singapore fireworks', skyBase: '#0A0D30', skyStops: ['#05071F', '#0A0D30'], sky: '#0A0D30', swatch: 'linear-gradient(180deg,#05071F,#27256E 55%,#4FE3FF)' },
  'px-hanoi': { ...PX_BASE, id: 'px-hanoi', vi: 'Hồ Gươm sớm mai', en: 'Hoan Kiem at dawn', skyBase: '#14202E', skyStops: ['#0E1824', '#14202E'], sky: '#14202E', swatch: 'linear-gradient(180deg,#6C9CC4,#F7D9A8 55%,#C8402A)' },
};

export const STUDY_THEMES: Record<ThemeId, StudyTheme> = {
  ...ART_THEMES,
  ...PX_THEMES,
  plain: {
    ...LIGHT_BASE,
    id: 'plain',
    vi: 'Mặc định',
    en: 'Plain',
    fx: false,
    layer: 'none',
    skyBase: '#EDE9E1',
    skyStops: ['#EDE9E1'],
    sky: '#EDE9E1',
    swatch: '#EDE9E1',
    card: '#FFFFFF',
    cardBorder: 'rgba(15,23,42,0.07)',
    onBg: '#1E293B',
    pill: 'rgba(255,255,255,0.9)',
  },
  scene: {
    ...LIGHT_BASE,
    id: 'scene',
    vi: 'Cảnh bay pixel',
    en: 'Pixel flight',
    layer: 'scene',
    skyBase: '#0F1D33',
    skyStops: ['#0F1D33'],
    sky: '#0F1D33',
    swatch: 'linear-gradient(180deg,#5B8BD6 0%,#9FC2EE 60%,#C9DDF5 100%)',
    card: '#FFFFFF',
    cardBorder: 'transparent',
    onBg: '#FFFFFF',
    pill: 'rgba(255,255,255,0.8)',
  },
  space: {
    ...DARK_BASE,
    id: 'space',
    vi: 'Vũ trụ',
    en: 'Deep space',
    layer: 'stars',
    skyBase: '#070B1F',
    skyStops: ['#04061A', '#0B1038', '#1B1148'],
    sky:
      'radial-gradient(60% 50% at 80% 12%, rgba(124,92,255,0.30), transparent 70%),' +
      'radial-gradient(50% 45% at 12% 85%, rgba(56,189,248,0.18), transparent 70%),' +
      'linear-gradient(180deg,#04061A 0%,#0B1038 55%,#1B1148 100%)',
    swatch: 'radial-gradient(circle at 75% 20%,#7C5CFF55,transparent 55%),linear-gradient(180deg,#04061A,#1B1148)',
    card: 'rgba(14,20,48,0.90)',
    cardBorder: 'rgba(148,163,255,0.22)',
  },
  sakura: {
    ...LIGHT_BASE,
    id: 'sakura',
    vi: 'Hoa anh đào',
    en: 'Cherry blossom',
    layer: 'petals',
    skyBase: '#FBD3DF',
    skyStops: ['#FDE3EA', '#FBD3DF', '#F4B6CB'],
    sky: 'linear-gradient(180deg,#FDE3EA 0%,#FBD3DF 55%,#F4B6CB 100%)',
    swatch: 'linear-gradient(180deg,#FDE3EA,#F4B6CB)',
    card: '#FFFAF7',
    cardBorder: 'rgba(214,120,150,0.25)',
    soft: '#FCEFF1',
    accent: '#B4436C',
    accentDisabled: '#F3D3DE',
    onBg: '#4A1D33',
    pill: 'rgba(255,255,255,0.78)',
  },
  forest: {
    ...LIGHT_BASE,
    id: 'forest',
    vi: 'Rừng sương mù',
    en: 'Misty forest',
    layer: 'mist',
    skyBase: '#C5D8CF',
    skyStops: ['#DCE9E3', '#C5D8CF', '#A6C2B6'],
    sky: 'linear-gradient(180deg,#DCE9E3 0%,#C5D8CF 55%,#A6C2B6 100%)',
    swatch: 'linear-gradient(180deg,#DCE9E3,#8FB0A2)',
    card: '#FBFCF9',
    cardBorder: 'rgba(60,110,90,0.22)',
    soft: '#EEF4F0',
    accent: '#2F6B55',
    accentDisabled: '#CFE0D7',
    onBg: '#0F2F26',
    pill: 'rgba(255,255,255,0.78)',
  },
  sunset: {
    ...LIGHT_BASE,
    id: 'sunset',
    vi: 'Hoàng hôn',
    en: 'Sunset',
    layer: 'dusk',
    skyBase: '#F7B79A',
    skyStops: ['#FFE0C2', '#F7B79A', '#E9A0B8', '#CDB0E6'],
    sky:
      'radial-gradient(70% 40% at 50% 100%, rgba(255,214,150,0.65), transparent 70%),' +
      'linear-gradient(180deg,#FFE0C2 0%,#F7B79A 38%,#E9A0B8 72%,#CDB0E6 100%)',
    swatch: 'linear-gradient(180deg,#FFE0C2,#F7B79A 40%,#E9A0B8 75%,#CDB0E6)',
    card: '#FFFAF5',
    cardBorder: 'rgba(200,110,90,0.25)',
    soft: '#FDEFE6',
    accent: '#B5552F',
    accentDisabled: '#F5D5C5',
    onBg: '#3A1A2E',
    pill: 'rgba(255,255,255,0.78)',
  },
  journey: {
    ...DARK_BASE,
    id: 'journey',
    vi: 'Bản đồ bay',
    en: 'Flight map',
    layer: 'world',
    skyBase: '#0A2A44',
    skyStops: ['#06182A', '#0A2A44', '#0F3A55'],
    sky: 'linear-gradient(180deg,#06182A 0%,#0A2A44 55%,#0F3A55 100%)',
    swatch: 'linear-gradient(180deg,#0A5C74 0%,#0A3F5C 55%,#06182A 100%)',
    card: 'rgba(8,24,40,0.92)',
    cardBorder: 'rgba(120,200,220,0.28)',
  },
  rain: {
    ...DARK_BASE,
    id: 'rain',
    vi: 'Đêm mưa',
    en: 'Rainy night',
    layer: 'rain',
    skyBase: '#0D1622',
    skyStops: ['#0A111B', '#0D1622', '#16263A'],
    sky: 'linear-gradient(180deg,#0A111B 0%,#0D1622 50%,#16263A 100%)',
    swatch: 'repeating-linear-gradient(100deg,transparent 0 6px,rgba(180,210,255,0.35) 6px 7px),linear-gradient(180deg,#0A111B,#16263A)',
    card: 'rgba(16,28,44,0.92)',
    cardBorder: 'rgba(148,190,230,0.22)',
  },
};

/** Chủ đề chọn được khi bật "Nền & hiệu ứng" (Mặc định phẳng là lúc tắt). */
export const THEME_ORDER: readonly ThemeId[] = ['scene', 'px-auto', 'px-tokyo', 'px-paris', 'px-london', 'px-singapore', 'px-hanoi', 'journey', 'space', 'sakura', 'forest', 'sunset', 'rain'];
export const ALL_THEMES: readonly ThemeId[] = ['plain', ...THEME_ORDER];

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(STUDY_THEMES, v);
}

export function themeOf(id: unknown): StudyTheme {
  return isThemeId(id) ? STUDY_THEMES[id] : STUDY_THEMES.plain;
}

/* ---- độ tương phản WCAG (dùng ở test và khi chỉnh màu) ---- */

function parse(c: string): [number, number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(c.trim());
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = /^rgba?\(([^)]+)\)$/.exec(c.trim());
  if (m) {
    const p = m[1]!.split(',').map((x) => parseFloat(x));
    return [p[0]!, p[1]!, p[2]!, p[3] ?? 1];
  }
  throw new Error(`màu không đọc được: ${c}`);
}

/** Trộn màu có alpha lên nền đặc. */
export function over(fg: string, bg: string): [number, number, number] {
  const [r, g, b, a] = parse(fg);
  const [br, bgc, bb] = parse(bg);
  return [r * a + br * (1 - a), g * a + bgc * (1 - a), b * a + bb * (1 - a)];
}

function lum([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Tỉ lệ tương phản của chữ `fg` trên nền `bg` (nền có thể có alpha — trộn lên `under`). */
export function contrast(fg: string, bg: string, under = '#000000'): number {
  const back = over(bg, under);
  const rgbBack = `rgb(${back[0]},${back[1]},${back[2]})`;
  const f = over(fg, rgbBack);
  const l1 = lum(f);
  const l2 = lum(back);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
