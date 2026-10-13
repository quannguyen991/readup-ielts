/**
 * NỀN HỌC đổi bằng sao — nền phía sau mọi màn học (đọc bài, làm bài, tra từ,
 * luyện nghe...). Thay cho nền lưới sáng mặc định của `LightGrid`.
 *
 * Mọi mẫu đều SÁNG và nhạt: thẻ nội dung vẫn là giấy trắng, nền chỉ đủ màu để
 * tách thẻ ra khỏi trang (lý do chọn nền sáng cho màn làm việc ghi ở
 * `LightGrid.tsx`). Không có mẫu nền tối cho màn học — một thẻ trắng giữa nền
 * đen là bắt mắt điều tiết suốt buổi.
 *
 * Chỉ là dữ liệu vẽ; giá và tên ở `services/gamification/shop.ts`.
 */
export type StudyBgLook =
  | 'mint'
  | 'peach'
  | 'lemon'
  | 'lavender'
  | 'sky'
  | 'kraft'
  | 'notebook'
  | 'sage'
  | 'sand'
  | 'rose'
  | 'aqua'
  | 'dusk';

/** Hoạ tiết phủ lên nền. */
export type StudyPattern = 'grid' | 'dots' | 'ruled' | 'diagonal' | 'plain';

export type StudyBackground = {
  /** Ba điểm màu của nền chuyển màu chéo (sáng). */
  stops: readonly [string, string, string];
  /** Màu nét hoạ tiết (rất mờ). */
  line: string;
  pattern: StudyPattern;
  /** Hai vệt loang mềm ở góc trên trái / dưới phải. */
  blobs: readonly [string, string];
  /** Vở học trò: đường lề đỏ bên trái. */
  margin?: string;
  cell?: number;
};

export const STUDY_BACKGROUNDS: Record<StudyBgLook, StudyBackground> = {
  mint: { stops: ['#E6F7EF', '#DDF3E8', '#E9F6F0'], line: 'rgba(20,110,80,0.11)', pattern: 'grid', blobs: ['#6EE7B7', '#A7F3D0'] },
  peach: { stops: ['#FFF1EA', '#FDE8DF', '#FCEBF1'], line: 'rgba(190,90,60,0.10)', pattern: 'grid', blobs: ['#FDBA74', '#F9A8D4'] },
  lemon: { stops: ['#FFFAE3', '#FDF4D2', '#FFF7E6'], line: 'rgba(160,120,20,0.18)', pattern: 'dots', blobs: ['#FDE047', '#FDBA74'], cell: 22 },
  lavender: { stops: ['#F2EDFD', '#ECE6FB', '#F5EFFC'], line: 'rgba(110,80,190,0.18)', pattern: 'dots', blobs: ['#C4B5FD', '#F0ABFC'], cell: 22 },
  sky: { stops: ['#E9F4FD', '#E1EFFB', '#EBF2FD'], line: 'rgba(40,110,190,0.13)', pattern: 'ruled', blobs: ['#7DD3FC', '#A5B4FC'], cell: 30 },
  kraft: { stops: ['#F5EDDF', '#EFE5D2', '#F3EADB'], line: 'rgba(120,90,40,0.16)', pattern: 'dots', blobs: ['#E7C9A0', '#D6B98C'], cell: 18 },
  notebook: { stops: ['#FDFDF8', '#FAFAF2', '#FCFCF6'], line: 'rgba(59,130,246,0.20)', pattern: 'ruled', blobs: ['#DBEAFE', '#FEF3C7'], margin: 'rgba(239,68,68,0.35)', cell: 28 },
  sage: { stops: ['#EEF4EA', '#E7EFE2', '#EEF3EC'], line: 'rgba(70,110,60,0.10)', pattern: 'diagonal', blobs: ['#BBF7D0', '#D9F99D'], cell: 26 },
  sand: { stops: ['#FBF4E8', '#F7EEDF', '#F9F2E7'], line: 'rgba(150,110,50,0.10)', pattern: 'plain', blobs: ['#FDE68A', '#FECACA'] },
  rose: { stops: ['#FCEFF4', '#F9E7EF', '#FBF0F6'], line: 'rgba(190,60,110,0.10)', pattern: 'grid', blobs: ['#F9A8D4', '#FDA4AF'] },
  aqua: { stops: ['#E7F8F9', '#DDF3F5', '#E8F5F9'], line: 'rgba(20,130,150,0.11)', pattern: 'diagonal', blobs: ['#67E8F9', '#93C5FD'], cell: 26 },
  dusk: { stops: ['#F4ECF9', '#F1E6F4', '#FCEDE8'], line: 'rgba(130,70,150,0.10)', pattern: 'grid', blobs: ['#D8B4FE', '#FDBA74'] },
};

export function studyBackground(look: string | null | undefined): StudyBackground | null {
  return look && look in STUDY_BACKGROUNDS ? STUDY_BACKGROUNDS[look as StudyBgLook] : null;
}

/**
 * NỀN TRANG THEO GIAO DIỆN (theme đổi bằng sao): áp dụng ở MỌI trang khi người
 * dùng chưa chọn Nền học riêng. Tông vừa (như nền xanh mặc định) để thẻ trắng
 * nổi lên và chữ đen đặt thẳng trên nền vẫn đọc được — kể cả với giao diện có
 * thanh bên tối (Vũ trụ sao đêm, Cyberpunk…), nền trang vẫn sáng.
 */
export const THEME_PAGE_BACKGROUNDS: Record<string, StudyBackground> = {
  'theme-chiikawa': { stops: ['#FFF0F4', '#FFE7EE', '#FCEAF2'], line: 'rgba(198,90,120,0.10)', pattern: 'grid', blobs: ['#F7CBD8', '#FCE8EE'] },
  'theme-midnight': { stops: ['#9AA8EC', '#8A96DE', '#A395E2'], line: 'rgba(30,35,110,0.14)', pattern: 'grid', blobs: ['#818CF8', '#C084FC'] },
  'theme-sakura': { stops: ['#F8BBD5', '#F3A9C9', '#F6B6DA'], line: 'rgba(150,30,90,0.12)', pattern: 'grid', blobs: ['#F9A8D4', '#FBCFE8'] },
  'theme-cyberpunk': { stops: ['#9EE3F4', '#B6A8F6', '#F0A6D4'], line: 'rgba(60,20,120,0.14)', pattern: 'grid', blobs: ['#22D3EE', '#F472B6'] },
  'theme-ocean': { stops: ['#94D5F1', '#82C6EA', '#93BCEE'], line: 'rgba(10,70,130,0.14)', pattern: 'grid', blobs: ['#38BDF8', '#60A5FA'] },
  'theme-sunset': { stops: ['#FBC39D', '#F6ABB9', '#DCA8E7'], line: 'rgba(140,50,60,0.12)', pattern: 'grid', blobs: ['#FB923C', '#E879F9'] },
  'theme-lavender': { stops: ['#CBBAF8', '#BDAAF4', '#D6BAF3'], line: 'rgba(80,40,160,0.13)', pattern: 'dots', blobs: ['#A78BFA', '#E9D5FF'], cell: 24 },
  'theme-nord': { stops: ['#B6C8DD', '#A8BCD4', '#BAC6DC'], line: 'rgba(40,60,90,0.14)', pattern: 'grid', blobs: ['#88C0D0', '#E5E9F0'] },
  'theme-matcha': { stops: ['#BCE4AB', '#AADA9C', '#C3E6B5'], line: 'rgba(30,90,30,0.12)', pattern: 'grid', blobs: ['#86EFAC', '#D9F99D'] },
  'theme-sepia': { stops: ['#F1DBB3', '#E9CE9F', '#F0D8B7'], line: 'rgba(120,80,20,0.14)', pattern: 'ruled', blobs: ['#FCD34D', '#FDBA74'], cell: 30 },
  'theme-emerald': { stops: ['#A0E7C7', '#89DBB8', '#A1DAD2'], line: 'rgba(10,90,60,0.13)', pattern: 'grid', blobs: ['#34D399', '#5EEAD4'] },
};

/** Pha một màu hex về phía trắng (0..1) — bản nhạt cho màn học. */
export function lighten(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const ch = (v: number) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

/** Bản NHẠT của một nền trang, cho màn học (đọc lâu không chói). */
export function studyVariant(bg: StudyBackground): StudyBackground {
  return { ...bg, stops: [lighten(bg.stops[0], 0.62), lighten(bg.stops[1], 0.62), lighten(bg.stops[2], 0.62)] };
}

/**
 * Nền cho một trang. Ưu tiên: Nền học người dùng chọn → nền theo Giao diện đang
 * dùng → null (nền mặc định của loại trang đó).
 *  - `browse`: trang duyệt (trang chủ, thư viện…) — dùng tông vừa.
 *  - `study`: màn học — Nền học giữ nguyên (đã nhạt sẵn), nền theo giao diện thì pha nhạt.
 */
export function pageBackgroundFor(kind: 'browse' | 'study', studyBgLook: string | null | undefined, themeId: string | null | undefined): StudyBackground | null {
  const own = studyBackground(studyBgLook);
  if (own) return own;
  const byTheme = themeId ? THEME_PAGE_BACKGROUNDS[themeId] : undefined;
  if (byTheme) return kind === 'study' ? studyVariant(byTheme) : byTheme;
  return null;
}
