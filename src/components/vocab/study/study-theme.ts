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
export type ThemeId = 'chiikawa' | 'plain' | 'scene' | 'space' | 'sakura' | 'forest' | 'sunset' | 'rain' | 'journey' | 'beach' | 'snow' | 'bamboo' | 'aurora' | 'px-auto' | 'px-tokyo' | 'px-paris' | 'px-london' | 'px-singapore' | 'px-hanoi' | 'art-dark' | 'art-light' | 'zh-band9' | 'ea-skin' | 'sakuranight' | 'snowfall' | 'noel' | 'europe' | 'lantern' | 'seigaiha' | 'fuji' | 'bling' | 'swirl' | 'inkwash' | 'maple' | 'hanabi' | 'koi' | 'tet' | 'firefly' | 'deepsea' | 'paris' | 'desert' | 'lavender' | 'candy' | 'torii';
export type ThemeLayer = 'none' | 'scene' | 'stars' | 'petals' | 'mist' | 'dusk' | 'rain' | 'world' | 'pxscene' | 'waves' | 'snow' | 'bamboo' | 'aurora' | 'sakuranight' | 'snowfall' | 'noel' | 'europe' | 'lantern' | 'seigaiha' | 'fuji' | 'bling' | 'swirl' | 'inkwash' | 'maple' | 'hanabi' | 'koi' | 'tet' | 'firefly' | 'deepsea' | 'paris' | 'desert' | 'lavender' | 'candy' | 'torii';

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
  /** Hoa văn trang trí (bộ tiếng Trung/Nhật): góc khung, dải mây, màu viền. */
  deco?: { corner: number; cloud?: number; accent: string };
};

const LIGHT_BASE = {
  dark: false,
  fx: true,
  soft: '#F3F0FB',
  field: '#F3F0FB',
  fieldBorder: '#E1D9CB',
  optBg: '#FFFFFF',
  optBorder: '#F3F0FB',
  optNum: '#F3F0FB',
  chipBg: '#F3F0FB',
  chipInk: '#0F172A',
  accent: '#6A4BD9',
  accentDisabled: '#F3F0FB',
  good: '#15803D',
  goodBg: '#F0FAF3',
  bad: '#BE123C',
  badBg: '#FEF2F4',
  warn: '#6A4BD9',
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
  accent: '#6A4BD9',
  accentDisabled: 'rgba(106, 75, 217,0.45)',
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
    skyBase: '#F3F0FB',
    skyStops: ['#F3F0FB', '#D9D2BC'],
    sky: '#F3F0FB',
    swatch: '#F3F0FB',
    card: 'rgba(255,255,255,0.94)',
    cardBorder: 'rgba(15,23,42,0.08)',
    onBg: '#1E293B',
    pill: 'rgba(255,255,255,0.9)',
  },
};

/** Chủ đề Chiikawa: nền hồng sữa, thẻ trắng viền hồng, chữ nâu mận. Chọn tự động khi bật giao diện Chiikawa. */
const CHIIKAWA_STUDY: StudyTheme = {
  ...LIGHT_BASE,
  id: 'chiikawa',
  vi: 'Chiikawa',
  en: 'Chiikawa',
  layer: 'petals',
  skyBase: '#FFF5F8',
  skyStops: ['#FFF0F4', '#FFE7EE'],
  sky: 'linear-gradient(180deg,#FFF5F8,#FFE7EE)',
  swatch: '#FFE7EE',
  card: 'rgba(255,255,255,0.94)',
  cardBorder: '#F5CADB',
  ink: '#4A2433',
  muted: '#7A4E62',
  onBg: '#4A2433',
  accent: '#D65E86',
  accentDisabled: '#F6D5E1',
  pill: 'rgba(255,255,255,0.9)',
  pillInk: '#4A2433',
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

/** Khung cảnh vẽ bằng CSS và vài thẻ div (không ảnh): biển, tuyết, rừng tre, cực quang. */
const SCENE_THEMES: Record<'beach' | 'snow' | 'bamboo' | 'aurora', StudyTheme> = {
  beach: {
    ...LIGHT_BASE,
    id: 'beach',
    vi: 'Biển chiều',
    en: 'Seaside afternoon',
    layer: 'waves',
    skyBase: '#BFE3F2',
    skyStops: ['#BFE3F2', '#E9F6F9', '#F3F0FB'],
    sky: 'linear-gradient(180deg,#8FD0EC 0%,#D6EEF6 52%,#F3F0FB 100%)',
    swatch: 'linear-gradient(180deg,#8FD0EC 0%,#F3F0FB 60%,#2E8BB8 61%,#1B5F86 100%)',
    card: 'rgba(255,255,255,0.94)',
    cardBorder: 'rgba(40,120,160,0.22)',
    soft: '#EEF8FB',
    accent: '#1F6E96',
    accentDisabled: '#CFE7F1',
    onBg: '#0E3B52',
    pill: 'rgba(255,255,255,0.8)',
  },
  snow: {
    ...DARK_BASE,
    id: 'snow',
    vi: 'Đêm tuyết',
    en: 'Snowy night',
    layer: 'snow',
    skyBase: '#0E1A2E',
    skyStops: ['#0A1424', '#0E1A2E', '#1C2D4A'],
    sky: 'linear-gradient(180deg,#0A1424 0%,#0E1A2E 55%,#1C2D4A 100%)',
    swatch: 'linear-gradient(180deg,#0A1424,#1C2D4A)',
    card: 'rgba(14,26,46,0.92)',
    cardBorder: 'rgba(190,215,255,0.22)',
  },
  bamboo: {
    ...LIGHT_BASE,
    id: 'bamboo',
    vi: 'Rừng tre',
    en: 'Bamboo grove',
    layer: 'bamboo',
    skyBase: '#E4EFD9',
    skyStops: ['#E4EFD9', '#C6DDB0', '#9FC285'],
    sky: 'linear-gradient(180deg,#EEF6E6 0%,#CFE5BA 55%,#A8CB8C 100%)',
    swatch: 'linear-gradient(180deg,#EEF6E6,#8DB873)',
    card: '#FBFDF8',
    cardBorder: 'rgba(60,110,50,0.22)',
    soft: '#F1F7EA',
    accent: '#3F7A34',
    accentDisabled: '#D5E7C7',
    onBg: '#1F3D17',
    pill: 'rgba(255,255,255,0.8)',
  },
  aurora: {
    ...DARK_BASE,
    id: 'aurora',
    vi: 'Cực quang',
    en: 'Aurora',
    layer: 'aurora',
    skyBase: '#06141F',
    skyStops: ['#04101A', '#06141F', '#0B2A3A'],
    sky: 'linear-gradient(180deg,#04101A 0%,#06141F 60%,#0B2A3A 100%)',
    swatch: 'linear-gradient(180deg,#06141F,#2BD9A0 45%,#7C5CFF 75%,#06141F)',
    card: 'rgba(6,20,31,0.9)',
    cardBorder: 'rgba(110,240,200,0.22)',
  },
};

/**
 * Bộ NỀN MÙA & VĂN HOÁ (hoa anh đào đêm, tuyết, Noel, châu Âu, Trung Hoa, Nhật Bản, vàng kim, tím loang).
 * Toàn bằng CSS (xem StudyBackdrop.web.tsx); màu chữ/thẻ ở đây đã được test tương phản như các chủ đề khác.
 */
const FEST_THEMES: Record<'sakuranight' | 'snowfall' | 'noel' | 'europe' | 'lantern' | 'seigaiha' | 'fuji' | 'bling' | 'swirl' | 'inkwash' | 'maple' | 'hanabi' | 'koi' | 'tet' | 'firefly' | 'deepsea' | 'paris' | 'desert' | 'lavender' | 'candy' | 'torii', StudyTheme> = {
  sakuranight: {
    ...DARK_BASE,
    id: 'sakuranight',
    vi: 'Đêm hoa anh đào',
    en: 'Cherry blossom night',
    layer: 'sakuranight',
    skyBase: '#1B1034',
    skyStops: ['#150C2B', '#2A1448', '#5A2459'],
    sky: 'linear-gradient(180deg,#150C2B 0%,#2A1448 55%,#5A2459 100%)',
    swatch: 'radial-gradient(circle at 78% 22%,#FFE9F2 0 7%,transparent 8%),linear-gradient(180deg,#150C2B,#5A2459)',
    card: 'rgba(28,14,50,0.92)',
    cardBorder: 'rgba(255,170,205,0.28)',
    accent: '#B23B78',
    accentDisabled: 'rgba(178,59,120,0.45)',
  },
  snowfall: {
    ...LIGHT_BASE,
    id: 'snowfall',
    vi: 'Tuyết rơi',
    en: 'Snowfall',
    layer: 'snowfall',
    skyBase: '#D5E6F7',
    skyStops: ['#C6DCF2', '#E3EFFA', '#F6FAFF'],
    sky: 'linear-gradient(180deg,#C6DCF2 0%,#E3EFFA 55%,#F6FAFF 100%)',
    swatch: 'linear-gradient(180deg,#C6DCF2,#F6FAFF 70%,#FFFFFF)',
    card: '#FBFDFF',
    cardBorder: 'rgba(60,110,170,0.22)',
    soft: '#EDF4FB',
    accent: '#2F6DB5',
    accentDisabled: '#CFE0F1',
    onBg: '#12304D',
    pill: 'rgba(255,255,255,0.85)',
  },
  noel: {
    ...DARK_BASE,
    id: 'noel',
    vi: 'Giáng sinh',
    en: 'Christmas',
    layer: 'noel',
    skyBase: '#0C2A20',
    skyStops: ['#071C15', '#0C2A20', '#14392B'],
    sky: 'linear-gradient(180deg,#071C15 0%,#0C2A20 55%,#14392B 100%)',
    swatch: 'radial-gradient(circle at 20% 15%,#FF4D5E 0 5%,transparent 6%),radial-gradient(circle at 70% 25%,#FFD65A 0 5%,transparent 6%),linear-gradient(180deg,#071C15,#14392B)',
    card: 'rgba(10,36,27,0.92)',
    cardBorder: 'rgba(255,214,120,0.3)',
    accent: '#C5283D',
    accentDisabled: 'rgba(197,40,61,0.45)',
  },
  europe: {
    ...DARK_BASE,
    id: 'europe',
    vi: 'Châu Âu hoàng kim',
    en: 'Golden Europe',
    layer: 'europe',
    skyBase: '#1A1D45',
    skyStops: ['#111437', '#2A2160', '#7A416E'],
    sky: 'linear-gradient(180deg,#111437 0%,#2A2160 55%,#7A416E 100%)',
    swatch: 'linear-gradient(180deg,#111437,#7A416E 70%,#F2B56B)',
    card: 'rgba(18,20,52,0.92)',
    cardBorder: 'rgba(242,200,130,0.32)',
    accent: '#8A5A12',
    accentDisabled: 'rgba(138,90,18,0.45)',
  },
  lantern: {
    ...DARK_BASE,
    id: 'lantern',
    vi: 'Lồng đèn Trung Hoa',
    en: 'Chinese lanterns',
    layer: 'lantern',
    skyBase: '#3A0B14',
    skyStops: ['#2A070E', '#45101B', '#6B1B26'],
    sky: 'linear-gradient(180deg,#2A070E 0%,#45101B 55%,#6B1B26 100%)',
    swatch: 'radial-gradient(circle at 30% 30%,#FF5A3C 0 14%,transparent 15%),radial-gradient(circle at 70% 40%,#FFB02E 0 11%,transparent 12%),linear-gradient(180deg,#2A070E,#6B1B26)',
    card: 'rgba(48,10,18,0.93)',
    cardBorder: 'rgba(255,196,90,0.35)',
    accent: '#B3261E',
    accentDisabled: 'rgba(179,38,30,0.45)',
    onBg: '#FFF4E0',
  },
  seigaiha: {
    ...LIGHT_BASE,
    id: 'seigaiha',
    vi: 'Sóng Nhật Bản',
    en: 'Seigaiha waves',
    layer: 'seigaiha',
    skyBase: '#F2E7D2',
    skyStops: ['#F8EFDD', '#F2E7D2', '#E8D6B6'],
    sky: 'linear-gradient(180deg,#F8EFDD 0%,#F2E7D2 55%,#E8D6B6 100%)',
    swatch: 'radial-gradient(circle at 70% 28%,#D9463A 0 14%,transparent 15%),linear-gradient(180deg,#F8EFDD 0 60%,#2B4C7E 61%)',
    card: '#FFFBF2',
    cardBorder: 'rgba(120,80,40,0.25)',
    soft: '#F7EEDC',
    accent: '#B3261E',
    accentDisabled: '#EBD3C9',
    onBg: '#2A1810',
    pill: 'rgba(255,251,242,0.9)',
  },
  fuji: {
    ...LIGHT_BASE,
    id: 'fuji',
    vi: 'Núi Phú Sĩ bình minh',
    en: 'Mount Fuji at dawn',
    layer: 'fuji',
    skyBase: '#F6C9B4',
    skyStops: ['#9CC3E6', '#F2D3C8', '#F7BFA6'],
    sky: 'linear-gradient(180deg,#9CC3E6 0%,#F2D3C8 55%,#F7BFA6 100%)',
    swatch: 'linear-gradient(180deg,#9CC3E6,#F7BFA6 70%,#3C4F7A 71%)',
    card: '#FFFBF6',
    cardBorder: 'rgba(170,90,70,0.25)',
    soft: '#FBEFE6',
    accent: '#B8341F',
    accentDisabled: '#EBCFC6',
    onBg: '#2B1710',
    pill: 'rgba(255,251,246,0.88)',
  },
  bling: {
    ...DARK_BASE,
    id: 'bling',
    vi: 'Vàng kim lấp lánh',
    en: 'Gold sparkle',
    layer: 'bling',
    skyBase: '#0E0C12',
    skyStops: ['#09080D', '#13100F', '#241A0B'],
    sky: 'linear-gradient(180deg,#09080D 0%,#13100F 55%,#241A0B 100%)',
    swatch: 'radial-gradient(circle at 70% 30%,#FFE9A8 0 4%,transparent 5%),radial-gradient(circle at 30% 60%,#FFD36B 0 3%,transparent 4%),linear-gradient(180deg,#09080D,#3A2A0E)',
    card: 'rgba(18,15,12,0.93)',
    cardBorder: 'rgba(255,205,110,0.38)',
    accent: '#8A6410',
    accentDisabled: 'rgba(138,100,16,0.45)',
  },
  inkwash: {
    ...LIGHT_BASE,
    id: 'inkwash',
    vi: 'Sơn thuỷ mực tàu',
    en: 'Ink-wash mountains',
    layer: 'inkwash',
    skyBase: '#ECE7DA',
    skyStops: ['#F4EFE3', '#E6E1D3', '#D3D0C3'],
    sky: 'linear-gradient(180deg,#F4EFE3 0%,#E6E1D3 55%,#D3D0C3 100%)',
    swatch: 'linear-gradient(180deg,#F4EFE3 0 45%,#9AA3A3 46% 70%,#5C676A 71%)',
    card: '#FCFAF4',
    cardBorder: 'rgba(60,70,70,0.25)',
    soft: '#F3EFE4',
    accent: '#8E2A22',
    accentDisabled: '#E3D0CB',
    onBg: '#1E2A33',
    pill: 'rgba(252,250,244,0.9)',
  },
  maple: {
    ...LIGHT_BASE,
    id: 'maple',
    vi: 'Lá phong mùa thu',
    en: 'Autumn maple',
    layer: 'maple',
    skyBase: '#F6D2AC',
    skyStops: ['#FBE9CF', '#F7CFA3', '#F0AE85'],
    sky: 'linear-gradient(180deg,#FBE9CF 0%,#F7CFA3 55%,#F0AE85 100%)',
    swatch: 'linear-gradient(180deg,#FBE9CF,#F0AE85)',
    card: '#FFFBF4',
    cardBorder: 'rgba(170,90,40,0.25)',
    soft: '#FBEEDD',
    accent: '#B03A12',
    accentDisabled: '#EDD2C4',
    onBg: '#4A1C0E',
    pill: 'rgba(255,251,244,0.88)',
  },
  hanabi: {
    ...DARK_BASE,
    id: 'hanabi',
    vi: 'Pháo hoa Nhật Bản',
    en: 'Summer fireworks',
    layer: 'hanabi',
    skyBase: '#0B1030',
    skyStops: ['#070B24', '#14134A', '#2A1A5E'],
    sky: 'linear-gradient(180deg,#070B24 0%,#14134A 55%,#2A1A5E 100%)',
    swatch: 'radial-gradient(circle at 30% 35%,#FF6FB0 0 6%,transparent 22%),radial-gradient(circle at 72% 30%,#FFD65A 0 6%,transparent 22%),linear-gradient(180deg,#070B24,#2A1A5E)',
    card: 'rgba(12,14,48,0.92)',
    cardBorder: 'rgba(170,180,255,0.3)',
    accent: '#B23B78',
    accentDisabled: 'rgba(178,59,120,0.45)',
  },
  koi: {
    ...DARK_BASE,
    id: 'koi',
    vi: 'Ao cá koi',
    en: 'Koi pond',
    layer: 'koi',
    skyBase: '#07272E',
    skyStops: ['#05202A', '#0A3A44', '#0E4A52'],
    sky: 'linear-gradient(180deg,#05202A 0%,#0A3A44 55%,#0E4A52 100%)',
    swatch: 'radial-gradient(ellipse at 35% 40%,#FF7A3C 0 8%,transparent 9%),radial-gradient(ellipse at 65% 65%,#FFFFFF 0 7%,transparent 8%),linear-gradient(180deg,#05202A,#0E4A52)',
    card: 'rgba(6,34,42,0.92)',
    cardBorder: 'rgba(130,230,220,0.28)',
    accent: '#B8421C',
    accentDisabled: 'rgba(184,66,28,0.45)',
  },
  tet: {
    ...DARK_BASE,
    id: 'tet',
    vi: 'Tết cổ truyền',
    en: 'Lunar New Year',
    layer: 'tet',
    skyBase: '#4A0D14',
    skyStops: ['#34070D', '#5A1019', '#7E1A22'],
    sky: 'linear-gradient(180deg,#34070D 0%,#5A1019 55%,#7E1A22 100%)',
    swatch: 'radial-gradient(circle at 30% 30%,#FFD65A 0 12%,transparent 13%),radial-gradient(circle at 70% 45%,#FF8FB0 0 10%,transparent 11%),linear-gradient(180deg,#34070D,#7E1A22)',
    card: 'rgba(54,10,16,0.93)',
    cardBorder: 'rgba(255,214,110,0.38)',
    accent: '#B3261E',
    accentDisabled: 'rgba(179,38,30,0.45)',
    onBg: '#FFF4E0',
  },
  firefly: {
    ...DARK_BASE,
    id: 'firefly',
    vi: 'Rừng đom đóm',
    en: 'Firefly forest',
    layer: 'firefly',
    skyBase: '#07180F',
    skyStops: ['#051009', '#0A2416', '#12382A'],
    sky: 'linear-gradient(180deg,#051009 0%,#0A2416 55%,#12382A 100%)',
    swatch: 'radial-gradient(circle at 30% 40%,#F4FF9A 0 4%,transparent 8%),radial-gradient(circle at 68% 60%,#F4FF9A 0 3%,transparent 7%),linear-gradient(180deg,#051009,#12382A)',
    card: 'rgba(8,28,18,0.92)',
    cardBorder: 'rgba(190,240,130,0.28)',
    accent: '#2E7D46',
    accentDisabled: 'rgba(46,125,70,0.45)',
  },
  deepsea: {
    ...DARK_BASE,
    id: 'deepsea',
    vi: 'Biển sâu',
    en: 'Deep sea',
    layer: 'deepsea',
    skyBase: '#06323F',
    skyStops: ['#04202B', '#08425A', '#0C5C74'],
    sky: 'linear-gradient(180deg,#04202B 0%,#08425A 55%,#0C5C74 100%)',
    swatch: 'radial-gradient(circle at 30% 70%,rgba(255,255,255,.7) 0 4%,transparent 6%),radial-gradient(circle at 65% 45%,rgba(255,255,255,.6) 0 3%,transparent 5%),linear-gradient(180deg,#04202B,#0C5C74)',
    card: 'rgba(5,36,48,0.92)',
    cardBorder: 'rgba(130,230,255,0.3)',
    accent: '#0F6E86',
    accentDisabled: 'rgba(15,110,134,0.45)',
  },
  paris: {
    ...DARK_BASE,
    id: 'paris',
    vi: 'Paris đêm',
    en: 'Paris at night',
    layer: 'paris',
    skyBase: '#1A1746',
    skyStops: ['#100E33', '#241D5C', '#5A3478'],
    sky: 'linear-gradient(180deg,#100E33 0%,#241D5C 55%,#5A3478 100%)',
    swatch: 'linear-gradient(180deg,#100E33,#5A3478 75%,#161235 76%)',
    card: 'rgba(18,16,52,0.92)',
    cardBorder: 'rgba(255,200,140,0.3)',
    accent: '#B23B78',
    accentDisabled: 'rgba(178,59,120,0.45)',
  },
  desert: {
    ...LIGHT_BASE,
    id: 'desert',
    vi: 'Sa mạc hoàng hôn',
    en: 'Desert sunset',
    layer: 'desert',
    skyBase: '#FBD9A8',
    skyStops: ['#FCE6C4', '#FAD29B', '#F2B27A'],
    sky: 'linear-gradient(180deg,#FCE6C4 0%,#FAD29B 55%,#F2B27A 100%)',
    swatch: 'linear-gradient(180deg,#FCE6C4,#F2B27A 60%,#C97B3E 61%)',
    card: '#FFFBF3',
    cardBorder: 'rgba(170,100,40,0.25)',
    soft: '#FBEFDC',
    accent: '#A8481A',
    accentDisabled: '#EBD3C2',
    onBg: '#3E1D0C',
    pill: 'rgba(255,251,243,0.88)',
  },
  lavender: {
    ...LIGHT_BASE,
    id: 'lavender',
    vi: 'Cánh đồng oải hương',
    en: 'Lavender fields',
    layer: 'lavender',
    skyBase: '#E4DAF5',
    skyStops: ['#D6E4F7', '#E8DFF6', '#F4E6F0'],
    sky: 'linear-gradient(180deg,#D6E4F7 0%,#E8DFF6 55%,#F4E6F0 100%)',
    swatch: 'linear-gradient(180deg,#D6E4F7,#F4E6F0 55%,#8D70C8 56%)',
    card: '#FEFCFF',
    cardBorder: 'rgba(110,80,170,0.25)',
    soft: '#F3EEFA',
    accent: '#6A3FB5',
    accentDisabled: '#DDD2EE',
    onBg: '#2A1A4A',
    pill: 'rgba(254,252,255,0.88)',
  },
  candy: {
    ...LIGHT_BASE,
    id: 'candy',
    vi: 'Kẹo ngọt pastel',
    en: 'Candy pastel',
    layer: 'candy',
    skyBase: '#FFE9F3',
    skyStops: ['#FFE3F0', '#E8F4FF', '#FFF3D6'],
    sky: 'linear-gradient(135deg,#FFE3F0 0%,#E8F4FF 55%,#FFF3D6 100%)',
    swatch: 'radial-gradient(circle at 25% 30%,#FF9EC7 0 22%,transparent 50%),radial-gradient(circle at 75% 35%,#9EE6FF 0 20%,transparent 48%),radial-gradient(circle at 55% 85%,#FFE08A 0 22%,transparent 50%),#FFF6FA',
    card: '#FFFDFE',
    cardBorder: 'rgba(200,80,140,0.25)',
    soft: '#FFF0F7',
    accent: '#C2307A',
    accentDisabled: '#F1D3E2',
    onBg: '#4A1636',
    pill: 'rgba(255,253,254,0.88)',
  },
  torii: {
    ...DARK_BASE,
    id: 'torii',
    vi: 'Cổng torii hoàng hôn',
    en: 'Torii at dusk',
    layer: 'torii',
    skyBase: '#2E1850',
    skyStops: ['#2E1850', '#6E2F62', '#A84F63'],
    sky: 'linear-gradient(180deg,#2E1850 0%,#6E2F62 55%,#A84F63 100%)',
    swatch: 'linear-gradient(180deg,#3A1F5C,#E58A6A 70%,#1E1030 71%)',
    card: 'rgba(36,16,52,0.93)',
    cardBorder: 'rgba(255,190,150,0.35)',
    accent: '#B3261E',
    accentDisabled: 'rgba(179,38,30,0.45)',
  },
  swirl: {
    ...DARK_BASE,
    id: 'swirl',
    vi: 'Tím loang',
    en: 'Paint swirl',
    layer: 'swirl',
    skyBase: '#1B1040',
    skyStops: ['#150B34', '#241358', '#3A1A78'],
    sky: 'linear-gradient(135deg,#150B34 0%,#241358 55%,#3A1A78 100%)',
    swatch: 'radial-gradient(circle at 20% 25%,#FF4FA3 0 22%,transparent 50%),radial-gradient(circle at 80% 30%,#FFB23F 0 18%,transparent 48%),radial-gradient(circle at 60% 85%,#1FC8E8 0 22%,transparent 50%),#2A1470',
    card: 'rgba(24,12,56,0.9)',
    cardBorder: 'rgba(200,170,255,0.3)',
  },
};


/**
 * Giấy Band 9 cho màn học tiếng Trung: giấy kem có núi mực (vẽ bởi ChineseBackdrop), thẻ kem, mực chàm,
 * son đỏ. KHÔNG nằm trong THEME_ORDER: người học không tự chọn; màn học tiếng Trung tự áp (xem useStoreTheme).
 * Màu lấy đúng từ src/components/vocab/chinese/palette.ts; không import ở đây vì file này chạy được trong test thuần Node.
 */
const ZH_BAND9_STUDY: StudyTheme = {
  ...LIGHT_BASE,
  id: 'zh-band9',
  vi: 'Giấy Band 9',
  en: 'Band 9 paper',
  fx: false,
  layer: 'none',
  skyBase: '#F3EDE1',
  skyStops: ['#FBF7EE', '#F3EDE1', '#EBE1CB'],
  sky: 'linear-gradient(180deg,#FBF7EE 0%,#F3EDE1 55%,#EBE1CB 100%)',
  swatch: 'linear-gradient(180deg,#FBF7EE,#EBE1CB)',
  card: '#FFFDF7',
  cardBorder: '#E6D9BF',
  ink: '#0F1D33',
  muted: '#3B4A63',
  soft: '#FBF6EA',
  field: '#FFFDF7',
  fieldBorder: '#E6D9BF',
  optBg: '#FFFDF7',
  optBorder: '#E6D9BF',
  optNum: '#FBF6EA',
  chipBg: '#F5ECD9',
  chipInk: '#3B4A63',
  accent: '#B3412E',
  accentDisabled: '#E9D3C9',
  good: '#4F6E4C',
  goodBg: '#E4EEDD',
  bad: '#B3412E',
  badBg: '#F8E3DE',
  warn: '#8A5E1C',
  onBg: '#0F1D33',
  pill: 'rgba(255,253,247,0.9)',
  pillInk: '#0F1D33',
};

export const STUDY_THEMES: Record<ThemeId, StudyTheme> = {
  chiikawa: CHIIKAWA_STUDY,
  'zh-band9': ZH_BAND9_STUDY,
  // Chủ đề sinh từ skin (xem eastasia/eaStudyTheme.ts); bản này chỉ giữ chỗ cho kiểu Record.
  'ea-skin': { ...ZH_BAND9_STUDY, id: 'ea-skin' },
  ...SCENE_THEMES,
  ...FEST_THEMES,
  ...ART_THEMES,
  ...PX_THEMES,
  plain: {
    ...LIGHT_BASE,
    id: 'plain',
    vi: 'Mặc định',
    en: 'Plain',
    fx: false,
    layer: 'none',
    skyBase: '#F3F0FB',
    skyStops: ['#F3F0FB'],
    sky: '#F3F0FB',
    swatch: '#F3F0FB',
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
    card: '#F3F0FB',
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
    skyStops: ['#F3F0FB', '#F7B79A', '#E9A0B8', '#CDB0E6'],
    sky:
      'radial-gradient(70% 40% at 50% 100%, rgba(255,214,150,0.65), transparent 70%),' +
      'linear-gradient(180deg,#F3F0FB 0%,#F7B79A 38%,#E9A0B8 72%,#CDB0E6 100%)',
    swatch: 'linear-gradient(180deg,#F3F0FB,#F7B79A 40%,#E9A0B8 75%,#CDB0E6)',
    card: '#F3F0FB',
    cardBorder: 'rgba(200,110,90,0.25)',
    soft: '#F3F0FB',
    accent: '#6A4BD9',
    accentDisabled: '#F3F0FB',
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
export const THEME_ORDER: readonly ThemeId[] = ['scene', 'sakuranight', 'snowfall', 'noel', 'europe', 'lantern', 'seigaiha', 'fuji', 'bling', 'swirl', 'inkwash', 'maple', 'hanabi', 'koi', 'tet', 'firefly', 'deepsea', 'paris', 'desert', 'lavender', 'candy', 'torii', 'px-auto', 'px-tokyo', 'px-paris', 'px-london', 'px-singapore', 'px-hanoi', 'journey', 'beach', 'snow', 'bamboo', 'aurora', 'space', 'sakura', 'forest', 'sunset', 'rain'];
export const ALL_THEMES: readonly ThemeId[] = ['plain', ...THEME_ORDER];

/** Màu nhấn của nút/thanh đang chọn: giấy Band 9 dùng son đỏ của nó, các chủ đề khác giữ màu cũ (`fallback`). */
export function accentFor(t: StudyTheme, fallback: string): string {
  return t.id === 'zh-band9' || t.id === 'ea-skin' ? t.accent : fallback;
}

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
