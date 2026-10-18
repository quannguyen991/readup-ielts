/** Cấp độ của một từ trong bộ Oxford. */
export type OxfordLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

/** Một từ trong bộ từ vựng Oxford: nghĩa tiếng Việt ngắn và một câu ví dụ. */
export type OxfordEntry = {
  word: string;
  /** Từ loại viết tắt: n, v, adj, adv, prep, conj, pron, det, phr. */
  pos: string;
  level: OxfordLevel;
  /** Một trong OXFORD_TOPICS. */
  topic: string;
  meaningVi: string;
  example: string;
};

/** 18 chủ đề dùng chung cho cả hai bộ, theo thứ tự hiển thị. */
export const OXFORD_TOPICS = [
  'Con người & Quan hệ',
  'Cảm xúc & Tính cách',
  'Cơ thể & Sức khoẻ',
  'Ăn uống',
  'Nhà cửa & Đời sống',
  'Kinh tế & Tiền bạc',
  'Giáo dục',
  'Công việc',
  'Du lịch & Giao thông',
  'Đô thị & Nơi chốn',
  'Thiên nhiên & Môi trường',
  'Khoa học & Công nghệ',
  'Truyền thông',
  'Văn hoá & Nghệ thuật',
  'Thể thao & Giải trí',
  'Xã hội & Pháp luật',
  'Thời gian & Số lượng',
  'Hành động chung',
] as const;
