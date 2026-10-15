/**
 * BẢNG MÀU VÀNG KIM CHO GIAO DIỆN ĐIỆN THOẠI — trang chủ, luyện tập, lập lộ trình và
 * hồ sơ cùng dùng: vàng kim dịu, thẻ kính ngà ấm, nút vàng kim có điểm sáng nhẹ.
 *
 * Chủ đề Chiikawa đổi sang bảng hồng (xem `themed`): cùng tên khoá, khác giá trị.
 *
 * Chỉ là hằng số style. Trên web, gradient, bóng và backdropFilter do trình duyệt vẽ;
 * native bỏ qua các thuộc tính chỉ có trên web và rơi về màu đặc.
 */
import { themed } from '@/theme/palette-state';

const GOLD_BASE = {
  ink: '#3B2A10',
  body: '#6E5626',
  muted: '#9C8552',
  deep: '#8C6A1F',
  pill: '#EDCB7E',
  tint: 'rgba(233,181,74,0.18)',
  avatar: '#F4E2B0',
};

const GOLD_CHIIKAWA = {
  ink: '#4A2433',
  body: '#7A4E62',
  muted: '#A3768B',
  deep: '#C64E79',
  pill: '#F9C6D8',
  tint: 'rgba(214,94,134,0.16)',
  avatar: '#FCE4EC',
};

const GLASS_BASE = {
  backgroundColor: 'rgba(255,252,242,0.5)',
  backgroundImage:
    'linear-gradient(155deg, rgba(255,255,255,0.78) 0%, rgba(255,250,236,0.45) 50%, rgba(240,220,160,0.18) 100%)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.9)',
  boxShadow: '0 14px 32px rgba(150,110,40,0.14), inset 0 1px 0 rgba(255,255,255,0.95)',
  // Bỏ blur: mỗi thẻ kính là một lớp mờ phải vẽ lại khi cuộn, điện thoại giật. Nền đặc vẫn giữ nét kính.
};

const GLASS_CHIIKAWA = {
  backgroundColor: 'rgba(255,246,250,0.6)',
  backgroundImage:
    'linear-gradient(155deg, rgba(255,255,255,0.85) 0%, rgba(255,240,246,0.5) 50%, rgba(246,190,212,0.22) 100%)',
  borderColor: 'rgba(255,255,255,0.95)',
  boxShadow: '0 14px 32px rgba(198,90,120,0.16), inset 0 1px 0 rgba(255,255,255,0.95)',
};

const GOLD_BUTTON_BASE = {
  backgroundColor: '#EBC26A',
  backgroundImage:
    'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.08) 48%, rgba(255,255,255,0) 54%, rgba(120,70,10,0.08) 100%), linear-gradient(115deg, #FFF8E0 0%, #F4DA94 30%, #E6BA66 60%, #F7E4B0 82%, #EDC57C 100%)',
  borderWidth: 1,
  borderColor: 'rgba(255,246,214,0.9)',
  boxShadow: '0 6px 14px rgba(170,120,40,0.22), inset 0 1px 0 rgba(255,255,255,0.85)',
};

const GOLD_BUTTON_CHIIKAWA = {
  backgroundColor: '#EE8DB1',
  backgroundImage:
    'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.08) 48%, rgba(255,255,255,0) 54%, rgba(120,20,60,0.08) 100%), linear-gradient(115deg, #FFE3EE 0%, #F7A9C6 30%, #E87AA3 60%, #FBD0E0 82%, #F29BBB 100%)',
  borderColor: 'rgba(255,240,246,0.9)',
  boxShadow: '0 6px 14px rgba(198,90,120,0.28), inset 0 1px 0 rgba(255,255,255,0.85)',
};

/** Chữ và màu nền vàng kem (hồng khi chọn Chiikawa). */
export const GOLD = themed(GOLD_BASE, GOLD_CHIIKAWA);

/** Thẻ kính ngà ấm: trong suốt nhẹ, mép sáng, ánh vàng rất mỏng ở góc dưới. */
export const GLASS = themed(GLASS_BASE as object, GLASS_CHIIKAWA) as object;

/** Nút vàng kim dịu: thân vàng nhạt, điểm sáng ở mép trên, bóng mỏng. Native rơi về màu đặc. */
export const GOLD_BUTTON = themed(GOLD_BUTTON_BASE as object, GOLD_BUTTON_CHIIKAWA) as object;
