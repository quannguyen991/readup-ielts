/**
 * Bìa vẽ bằng code cho 7 bộ sách từ vựng (thẻ ở thư viện "Sách từ vựng").
 * Kiểu: nền tối, tiêu đề lớn, nhãn màu, vòng số từ ở góc dưới, dải chéo màu ở góc trên.
 * Không dùng logo hay tên nhà xuất bản — chỉ tên sách và màu nhấn của app.
 */
export type BookCoverSpec = {
  /** Dòng nhỏ trên cùng. */
  top: string;
  /** Tiêu đề lớn, xuống dòng bằng "\n". */
  big: string;
  bigSize: number;
  /** Nhãn màu giữa bìa. */
  tag: string;
  /** Dòng nghiêng dưới nhãn. */
  sub: string;
  /** Dòng đậm ở góc dưới bên trái (chủ đề chính của sách). */
  detail: string;
  /** Màu nhấn: nhãn, dải chéo, vòng số. */
  accent: string;
};

const TOP = 'Band 9 · Sách từ vựng';

export const BOOK_COVERS: Record<string, BookCoverSpec> = {
  'book-ericas-vocabulary': {
    top: TOP,
    big: 'ERICA’S\nVOCAB',
    bigSize: 36,
    tag: 'TRONG NGỮ CẢNH',
    sub: 'A New Approach',
    detail: 'Từ dễ nhầm · Từ nối',
    accent: '#E0A526',
  },
  'book-sat-power-vocab': {
    top: TOP,
    big: 'POWER\nVOCAB',
    bigSize: 36,
    tag: 'GỐC TỪ & MẸO',
    sub: 'Luyện SAT từ gốc',
    detail: 'Liên tưởng · Thuật ngữ',
    accent: '#E4572E',
  },
  'book-vocab-in-use-elementary': {
    top: TOP,
    big: 'ELEMENTARY',
    bigSize: 30,
    tag: 'CƠ BẢN',
    sub: 'Từ hằng ngày quanh bạn',
    detail: 'Gia đình · Nhà cửa',
    accent: '#34A853',
  },
  'book-vocab-in-use-preintermediate': {
    top: TOP,
    big: 'PRE-\nINTERMEDIATE',
    bigSize: 26,
    tag: 'SƠ TRUNG CẤP',
    sub: 'Sinh hoạt và học tập',
    detail: 'Du lịch · Công việc',
    accent: '#2F80ED',
  },
  'book-vocab-in-use-upperintermediate': {
    top: TOP,
    big: 'UPPER-\nINTERMEDIATE',
    bigSize: 26,
    tag: 'TRUNG CẤP CAO',
    sub: 'Cảm xúc và khái niệm',
    detail: 'Từ nối · Cụm động từ',
    accent: '#9B51E0',
  },
  'book-vocab-in-use-advanced': {
    top: TOP,
    big: 'ADVANCED',
    bigSize: 34,
    tag: 'NÂNG CAO',
    sub: 'Từ học thuật, đúng ngữ cảnh',
    detail: 'Môi trường · Sức khỏe',
    accent: '#EB5757',
  },
  'book-1100-words': {
    top: TOP,
    big: '1100\nWORDS',
    bigSize: 40,
    tag: 'HỌC THEO TUẦN',
    sub: 'You Need to Know',
    detail: 'Từ học thuật · Thành ngữ',
    accent: '#1FA59A',
  },
};
