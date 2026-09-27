/**
 * Design tokens — nguồn sự thật duy nhất cho màu / bo góc / khoảng cách / chữ.
 * Tailwind (tailwind.config.js) mirror lại đúng bộ này để dùng qua className,
 * còn file TS này dùng cho SVG, biểu đồ và những chỗ cần giá trị runtime.
 */

export const color = {
  canvas: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F4FB',
  border: '#E9EDF5',
  borderStrong: '#DCE3F0',

  ink: '#0F172A',
  body: '#334155',
  muted: '#64748B',
  subtle: '#94A3B8',

  primary: '#5B8BEE',
  primaryDark: '#4A7FE8',
  primarySoft: '#EFF5FF',

  accent: '#7C3AED',
  accentDark: '#6B28D9',
  accentSoft: '#F5F1FE',

  success: '#16A34A',
  successSoft: '#E8F8EE',
  danger: '#F04438',
  dangerSoft: '#FEECEB',
  warning: '#F59E0B',
  warningSoft: '#FEF4E6',
  info: '#0EA5E9',
  infoSoft: '#E6F6FE',

  white: '#FFFFFF',
} as const;

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
export const paper = {
  /** Tông chàm giữa của nền loang — dùng khi cần MỘT màu đại diện, không gradient. */
  brand: '#4A7FE8',
  brandDark: '#3F6DD6',
  /** Chàm rất đậm — chip nổi bật, chữ nhấn trên nền sáng. */
  brandDeep: '#1E1B6B',
  /** Chàm vừa — nút chính, nút phát, viền ô chữ đang nhập. */
  brandMid: '#5B8BEE',
  /** Nhạt — nền chip, viền mảnh trên nền giấy. */
  brandSoft: '#E1E2F6',
  brandTint: '#F2F3FD',

  /** Giấy kem của thẻ nổi trên nền xanh tím. Cố ý giữ tông ẤM: thẻ giấy ngả
   *  vàng đặt trên nền lạnh là cách tách lớp rõ nhất mà không cần thêm viền. */
  card: '#FDFBF3',
  /** Nền trang của các màn luyện tập nền sáng (chép chính tả). */
  canvas: '#EFF0F7',
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
} as const;

/** Gradient xanh → tím dùng cho banner hero (ảnh 3, 4, 5). */
export const gradient = {
  /**
   * Khối đầu trang tối (Lộ trình, Thanh toán, Mua chung, Mời bạn, Thi thử SAT…).
   * Từng là xanh dương → tím (#1D4FD7 → #7C3AED); người dùng "rất ghét màu xanh
   * kiểu này" (27/09/2026). Thử đá than thì bị chê "màu đen lạc quẻ". Chốt dải
   * xanh sáng cùng tông mục đang chọn ở thanh bên (ảnh người dùng đưa), chỉ
   * đậm hơn chút để chữ trắng còn đọc được.
   */
  hero: ['#6A93F0', '#4F7FE6', '#3F6DD6'] as const,
  heroSoft: ['#EFF5FF', '#F5F1FE'] as const,
  primaryButton: ['#7FA3F6', '#4A7FE8'] as const,
} as const;

/** Màu highlight 5 tông cho công cụ bôi màu trong màn hình đọc (ảnh 2). */
export const highlightColors = {
  yellow: { key: 'yellow', label: 'Vàng', fill: '#FEF3C7', dot: '#F5C242' },
  green: { key: 'green', label: 'Xanh lá', fill: '#DCFCE7', dot: '#3BC66B' },
  blue: { key: 'blue', label: 'Xanh dương', fill: '#DBEAFE', dot: '#4A90E2' },
  purple: { key: 'purple', label: 'Tím', fill: '#EDE9FE', dot: '#9B7BF0' },
  pink: { key: 'pink', label: 'Hồng', fill: '#FCE7F3', dot: '#EC7BB0' },
} as const;

export type HighlightColorKey = keyof typeof highlightColors;

/** 5 trạng thái của một từ (spec mục 6) và màu tô tương ứng trong bài đọc. */
export const wordStatusColor = {
  new: { fill: '#DBE7FE', ink: '#1D4FD7' },
  learning: { fill: '#FEF4E6', ink: '#B26A00' },
  familiar: { fill: '#EDE6FD', ink: '#6B28D9' },
  known: { fill: '#E8F8EE', ink: '#0F7A38' },
  ignored: { fill: '#F1F4FB', ink: '#64748B' },
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
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
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
    shadowColor: '#2563EB',
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
export const chartPalette = [
  '#2563EB',
  '#7C3AED',
  '#8B5CF6',
  '#C4ADF8',
  '#0EA5E9',
  '#16A34A',
] as const;
