/**
 * Bảng màu và font của giao diện trang chủ kiểu nhân vật (cute-home).
 *
 * Tông kem sữa, pastel và mực tím than thay cho mực đen: chữ đọc mềm hơn trên
 * nền màu nhạt. Chỉ dùng ở giao diện này; các màn khác vẫn theo tokens chung.
 */
export const CUTE = {
  canvas: '#FFF7EE',
  milk: '#FFFDF9',
  /** Viền và chữ chính: mực tím than, không đen tuyệt đối. */
  ink: '#4B3A4F',
  inkSoft: '#7D6B80',
  line: '#EED9E0',
  /** Viền mực cho nhân vật. */
  outline: '#3E2F45',
  blush: '#FFB7C8',
  strawberry: '#F27C9B',
  pink: '#FFDCE6',
  sky: '#D5ECFF',
  mint: '#D9F3E3',
  butter: '#FFEFB5',
  lilac: '#E9DEFB',
  peach: '#FFE0CC',
  leaf: '#9AD9A5',
} as const;

/** Font UI thống nhất đã đăng ký trong app/_layout.tsx. */
export const CUTE_FONT = {
  regular: 'Nunito_400Regular',
  semi: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_700Bold',
  black: 'Nunito_700Bold',
} as const;
