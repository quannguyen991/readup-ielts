/**
 * Design tokens — nguồn sự thật duy nhất cho màu / bo góc / khoảng cách / chữ.
 * Tailwind (tailwind.config.js) mirror lại đúng bộ này để dùng qua className,
 * còn file TS này dùng cho SVG, biểu đồ và những chỗ cần giá trị runtime.
 */

import { themed } from './palette-state';

/** Bảng Chiikawa: hồng sữa, nâu mận cho chữ. Chỉ ghi đè các khoá cần đổi. */
const CHIIKAWA_COLOR = {
  canvas: '#FFF5F8',
  surfaceAlt: '#FFF9FB',
  border: '#FBE3EC',
  borderStrong: '#F5CADB',
  ink: '#4A2433',
  body: '#7A4E62',
  muted: '#A3768B',
  subtle: '#C9A3B3',
  primary: '#D65E86',
  primaryDark: '#B94A70',
  primarySoft: '#FFEAF1',
  accent: '#F4A6C0',
  accentDark: '#E68AAE',
  accentSoft: '#FFF3F7',
  info: '#C97A9A',
  infoSoft: '#FDF0F5',
};

export const color = themed({
  canvas: '#F9F7F3',
  surface: '#FFFFFF',
  surfaceAlt: '#FBF7F1',
  border: '#F5F1E9',
  borderStrong: '#F0E9DC',

  ink: '#0F172A',
  body: '#334155',
  muted: '#64748B',
  subtle: '#94A3B8',

  primary: '#8F6E36',
  primaryDark: '#7E6230',
  primarySoft: '#FBF7EE',

  accent: '#CCA35B',
  accentDark: '#C3923E',
  accentSoft: '#FCF9F3',

  success: '#16A34A',
  successSoft: '#E8F8EE',
  danger: '#F04438',
  dangerSoft: '#FEECEB',
  warning: '#F59E0B',
  warningSoft: '#FEF4E6',
  info: '#B07A3A',
  infoSoft: '#FAF4EA',

  white: '#FFFFFF',
} as const, CHIIKAWA_COLOR);

/**
 * Bảng màu "giấy kẻ ô" — tông xanh tím + giấy kem, dùng cho các màn TÁC VỤ
 * (viết bài, dịch câu, chép chính tả) và trang giới thiệu.
 *
 * Tách hẳn khỏi `color` ở trên chứ không trộn vào: hai bảng phục vụ hai loại
 * màn khác nhau. `color` (xanh dương / tím / nền xám) là bảng của các màn quản
 * lý — bảng điều khiển, thư viện, tiến độ, nơi người dùng đang DUYỆT. Bảng
 * dưới đây là của các màn NGỒI LÀM, nơi màn hình phải lùi lại cho nội dung nổi
 * lên. Trộn chung thành một bảng thì mọi màn đều phải chọn tông thủ công và
 * dần dần trôi mỗi nơi một kiểu.
 */
/** Bảng Chiikawa cho giấy kẻ ô: các màu chàm/vàng đổi sang hồng mận. */
const CHIIKAWA_PAPER = {
  brand: '#D65E86',
  brandDark: '#B94A70',
  brandDeep: '#7A2E4E',
  brandMid: '#D65E86',
  brandSoft: '#FCE4EC',
  brandTint: '#FFF4F8',
  card: '#FFFAFC',
  canvas: '#FFF5F8',
  fill: '#FCE4EC',
  fillEdge: '#E68AAE',
  gold: '#F4A6C0',
  goldSoft: '#FFE3EE',
  ink: '#4A2433',
  body: '#7A4E62',
  muted: '#A3768B',
};

export const paper = themed({
  /** Tông chàm giữa của nền loang — dùng khi cần MỘT màu đại diện, không gradient. */
  brand: '#B8955A',
  brandDark: '#8F6E36',
  /** Chàm rất đậm — chip nổi bật, chữ nhấn trên nền sáng. */
  brandDeep: '#0F1D33',
  /** Chàm vừa — nút chính, nút phát, viền ô chữ đang nhập. */
  brandMid: '#B8955A',
  /** Nhạt — nền chip, viền mảnh trên nền giấy. */
  brandSoft: '#EFE3C8',
  brandTint: '#FAF5EA',

  /** Giấy kem của thẻ nổi trên nền xanh tím. Cố ý giữ tông ẤM: thẻ giấy ngả
   *  vàng đặt trên nền lạnh là cách tách lớp rõ nhất mà không cần thêm viền. */
  card: '#FDFBF3',
  /** Nền trang của các màn luyện tập nền sáng (chép chính tả). */
  canvas: '#F7F4EF',
  /** Ô chữ đã điền đúng — vẫn để vàng kem như bút dạ quang, nằm trong thẻ
   *  trắng nên không chạm tới nền trang. */
  fill: '#FBF6D0',
  fillEdge: '#C9A227',

  /** Vàng Premium. */
  gold: '#F0B429',
  goldSoft: '#FFF4D1',

  /** Chữ trên nền giấy. */
  ink: '#1A1A33',
  body: '#3B3B57',
  muted: '#7B7B99',
} as const, CHIIKAWA_PAPER);

/** Gradient xanh → tím dùng cho banner hero (ảnh 3, 4, 5). */
export const gradient = {
  /**
   * Khối đầu trang tối (Lộ trình, Thanh toán, Mua chung, Mời bạn, Thi thử SAT…).
   * Từng là xanh dương → tím (#BA8B3A → #CCA35B); người dùng "rất ghét màu xanh
   * kiểu này" (27/09/2026). Thử đá than thì bị chê "màu đen lạc quẻ". Chốt dải
   * xanh sáng cùng tông mục đang chọn ở thanh bên (ảnh người dùng đưa), chỉ
   * đậm hơn chút để chữ trắng còn đọc được.
   */
  hero: ['#C9A35E', '#A8843F', '#7E6230'] as const,
  heroSoft: ['#F7F0E1', '#FCF9F3'] as const,
  primaryButton: ['#D6B774', '#967334'] as const,
} as const;

/** Màu highlight 5 tông cho công cụ bôi màu trong màn hình đọc (ảnh 2). */
export const highlightColors = {
  yellow: { key: 'yellow', label: 'Vàng', fill: '#FEF3C7', dot: '#F5C242' },
  green: { key: 'green', label: 'Xanh lá', fill: '#DCFCE7', dot: '#3BC66B' },
  blue: { key: 'blue', label: 'Xanh dương', fill: '#F3E6C8', dot: '#CDA55F' },
  purple: { key: 'purple', label: 'Tím', fill: '#FBF5EC', dot: '#DCC08F' },
  pink: { key: 'pink', label: 'Hồng', fill: '#FCE7F3', dot: '#EC7BB0' },
} as const;

export type HighlightColorKey = keyof typeof highlightColors;

/** 5 trạng thái của một từ (spec mục 6) và màu tô tương ứng trong bài đọc. */
export const wordStatusColor = {
  new: { fill: '#F8F0E1', ink: '#BA8B3A' },
  learning: { fill: '#FEF4E6', ink: '#B26A00' },
  familiar: { fill: '#FAF4E9', ink: '#C3923E' },
  known: { fill: '#E8F8EE', ink: '#0F7A38' },
  ignored: { fill: '#FBF7F1', ink: '#64748B' },
} as const;

export const radius = {
  sm: 8,
  md: 12,
  panel: 14,
  card: 16,
  lg: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

/** Khớp với `fontSize` trong tailwind.config.js — sửa một bên thì sửa cả bên kia. */
export const fontSize = {
  label: 13,
  body: 16,
  bodyLg: 17,
  cardTitle: 18,
  sectionTitle: 22,
  stat: 30,
  pageTitle: 34,
  hero: 38,
} as const;

export const fontFamily = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extrabold: 'BeVietnamPro_800ExtraBold',
} as const;

/** Đổ bóng rất nhẹ của card trắng trong ảnh tham chiếu. */
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#9C7A3A',
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;

export const layout = {
  sidebarWidth: 232,
  topNavHeight: 72,
  contentMaxWidth: 1440,
  /** Dưới ngưỡng này thì đổi sang layout mobile (bottom tabs). */
  desktopBreakpoint: 1024,
} as const;

/**
 * Cặp màu gradient chéo cho thẻ "sticker" (viền đen dày + bóng lệch cứng —
 * xem `StickerCard`), một cặp cho mỗi tông ý nghĩa đã có (primary/accent/...).
 * Dùng CHUNG một chỗ để `StickerCard` xuất hiện ở nhiều màn (Từ vựng chủ đề,
 * Luyện câu, các ô thống kê sticker) luôn ra đúng cùng một bộ màu, không lệch
 * nhau giữa các lần tự gõ tay ở từng file.
 */
export const stickerGradient = {
  primary: ['#A5C0FA', '#5B8BEE'],
  accent: ['#C4ADF8', '#7C3AED'],
  success: ['#6EE7A8', '#16A34A'],
  warning: ['#FCD34D', '#D97706'],
  danger: ['#FCA5A5', '#DC2626'],
  info: ['#67E8F9', '#0891B2'],
  rose: ['#F9A8D4', '#DB2777'],
} as const satisfies Record<string, readonly [string, string]>;

/** Bảng màu cho biểu đồ (Progress — ảnh 3). */
// Biểu đồ: mỗi chuỗi số một sắc khác hẳn nhau (vàng kim, xanh đậm, đỏ, lá,
// trời, hồng) — màu biểu đồ là DỮ LIỆU, không được đồng tông với nhau.
export const chartPalette = [
  '#A8843F',
  '#24375A',
  '#E0533D',
  '#16A34A',
  '#0EA5E9',
  '#F472B6',
] as const;
