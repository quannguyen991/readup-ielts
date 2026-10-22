/**
 * Bảng màu của phòng thi SAT — bình tĩnh như giấy thi: mặt câu hỏi trắng, nhấn
 * chàm đậm Band 9, vàng kim chỉ dùng cho điểm nhấn nhỏ (cờ đánh dấu, vệt tô).
 */
export const EXAM = {
  /** Thanh trên / dưới: kem Band 9. */
  bar: '#F3F0FB',
  barLine: '#DDD3C0',
  page: '#FFFFFF',
  navy: '#0F1D33',
  navySoft: '#5B6B85',
  ink: '#1B2233',
  body: '#3A4252',
  muted: '#6B7280',
  line: '#F3F0FB',
  optionLine: '#B9BFCB',
  gold: '#8B6CF0',
  goldDeep: '#6A4BD9',
  goldSoft: '#E2C88F',
  success: '#15803D',
  successSoft: '#ECF8F0',
  danger: '#6A4BD9',
  dangerSoft: '#F3F0FB',
} as const;

/** Từ bề ngang này trở lên: chia đôi bài đọc / câu hỏi, thanh công cụ có chữ. */
export const EXAM_WIDE = 1000;
