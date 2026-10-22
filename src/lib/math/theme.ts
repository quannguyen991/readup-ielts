import type { IconName } from '@/components/ui/Icon';
import type { MathDomain } from './types';

/**
 * Màu và biểu tượng của bốn domain.
 *
 * MỖI DOMAIN MỘT MÀU RIÊNG, dùng thống nhất ở mọi chỗ: thẻ lộ trình, chip lọc,
 * viền bài tập, thanh tiến độ. Nhờ vậy người học nhận ra "đây là mảng hình học"
 * bằng màu trước khi kịp đọc chữ — mà với một module có 19 kỹ năng thì đó là
 * khác biệt giữa quét mắt hai giây và đọc cả trang.
 *
 * Bốn màu chọn cách nhau đủ xa trên vòng màu (chàm → tím → lục lam → cam) để
 * vẫn phân biệt được khi in đen trắng hoặc khi người dùng loạn sắc: độ đậm của
 * chúng cũng khác nhau, không chỉ khác tông.
 */
export type DomainStyle = {
  solid: string;
  soft: string;
  ink: string;
  gradient: [string, string];
  icon: IconName;
  /** Tên ngắn tiếng Việt, dùng cho chip lọc chật chỗ. */
  short: string;
};

export const MATH_DOMAIN_STYLE: Record<MathDomain, DomainStyle> = {
  algebra: {
    solid: '#4F46E5',
    soft: '#EEF0FF',
    ink: '#3730A3',
    gradient: ['#6366F1', '#4338CA'],
    icon: 'letters',
    short: 'Đại số',
  },
  advanced_math: {
    solid: '#A855F7',
    soft: '#F8EFFF',
    ink: '#7E22CE',
    gradient: ['#C084FC', '#9333EA'],
    icon: 'sparkle',
    short: 'Nâng cao',
  },
  problem_solving_data: {
    solid: '#0EA5E9',
    soft: '#E4F6FE',
    ink: '#0369A1',
    gradient: ['#38BDF8', '#0284C7'],
    icon: 'trending',
    short: 'Số liệu',
  },
  geometry_trig: {
    solid: '#F97316',
    soft: '#F3F0FB',
    ink: '#6A4BD9',
    gradient: ['#FB923C', '#6A4BD9'],
    icon: 'grid',
    short: 'Hình học',
  },
};

/** Kiểu bài tập — quyết định người học nên vào với tâm thế nào. */
export type MathSetKind = 'warmup' | 'practice' | 'speed' | 'checkpoint' | 'mixed' | 'exam' | 'quiz' | 'unit_test';

export type SetKindStyle = {
  label: string;
  solid: string;
  soft: string;
  ink: string;
  icon: IconName;
  /** Một câu nói rõ bài này để làm gì — hiện khi mở thẻ. */
  purpose: string;
};

export const MATH_SET_KIND_STYLE: Record<MathSetKind, SetKindStyle> = {
  warmup: {
    label: 'Khởi động',
    solid: '#16A34A',
    soft: '#E8F8EE',
    ink: '#0F7A38',
    icon: 'flame',
    purpose: 'Vài câu ngắn để làm quen dạng. Sai ở đây là chuyện bình thường.',
  },
  practice: {
    label: 'Luyện kỹ',
    solid: '#5B8BEE',
    soft: '#EFF5FF',
    ink: '#4A7FE8',
    icon: 'pencil',
    purpose: 'Bộ chính của kỹ năng này. Làm chậm cũng được, miễn hiểu từng bước.',
  },
  speed: {
    label: 'Tốc độ',
    solid: '#EC4899',
    soft: '#FFE9F3',
    ink: '#9D174D',
    icon: 'clock',
    purpose:
      'Cùng dạng bài nhưng ít thời gian hơn hẳn nhịp đề thật. Luyện quá tốc độ ở đây để lúc thi thấy đồng hồ dễ thở.',
  },
  checkpoint: {
    label: 'Kiểm tra',
    solid: '#F59E0B',
    soft: '#F3F0FB',
    ink: '#6A4BD9',
    icon: 'target',
    purpose: 'Đúng nhịp đề thật. Qua được mới tính là nắm kỹ năng này.',
  },
  mixed: {
    label: 'Ôn trộn',
    solid: '#A855F7',
    soft: '#F8EFFF',
    ink: '#7E22CE',
    icon: 'refresh',
    purpose: 'Trộn nhiều kỹ năng, không báo trước dạng — giống lúc thi thật.',
  },
  exam: {
    label: 'Đề tổng hợp',
    solid: '#E11D48',
    soft: '#FFE8EE',
    ink: '#9F1239',
    icon: 'clipboard',
    purpose: 'Khổ đúng một module đề thật: 22 câu, 35 phút, trộn cả bốn domain.',
  },
  quiz: {
    label: 'Quiz',
    solid: '#0F766E',
    soft: '#E6F7F5',
    ink: '#0F625B',
    icon: 'check',
    purpose: 'Bốn câu kiểm tra nhanh, trộn các kỹ năng trong unit.',
  },
  unit_test: {
    label: 'Bài kiểm tra unit',
    solid: '#4338CA',
    soft: '#EEF2FF',
    ink: '#3730A3',
    icon: 'clipboard',
    purpose: 'Bài kiểm tra cân bằng theo kỹ năng để tìm phần cần ôn lại.',
  },
};

/** Ngưỡng coi là "qua" một bài kiểm tra. */
export const CHECKPOINT_PASS_RATIO = 0.7;
