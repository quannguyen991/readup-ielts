/**
 * Bộ sách PDF tặng kèm — 11 cuốn, soạn riêng cho ReadUp.
 *
 * DANH SÁCH CHỌN TAY, KHÔNG QUÉT THƯ MỤC. Thư mục sách gốc còn chứa lộ trình học
 * cá nhân, lịch tuần, danh mục Scribd và các script dựng sách — quét cả thư mục
 * là đem bán luôn những thứ đó. Chỉ file có tên ở đây mới được
 * `scripts/upload-books.ts` đẩy lên kho, và chỉ id có ở đây mới tải được.
 *
 * SỐ TRANG ĐO TRÊN ĐÚNG FILE PDF, và `catalog.test.ts` đếm lại mỗi lần chạy test
 * trên máy có thư mục sách. Sách build lại mà đổi số trang thì test đỏ, nhắc sửa
 * ở đây — trang giá đang in con số tổng.
 */

export type BookId =
  | 'ielts-reading'
  | 'ielts-listening'
  | 'ielts-vocab'
  | 'ielts-task1'
  | 'ielts-task2'
  | 'ielts-speaking'
  | 'sat-math-20w'
  | 'sat-math-30u'
  | 'sat-rw-16w'
  | 'sat-rw-16u'
  | 'bilingual';

export type Book = {
  id: BookId;
  /** Tên file trong thư mục sách và trong kho `books/masters/`. */
  file: string;
  exam: 'IELTS' | 'SAT' | 'Song ngữ';
  title: string;
  subtitle: string;
  pages: number;
  /** Dung lượng file gốc, MB — hiện cạnh nút tải để người dùng mạng yếu biết trước. */
  sizeMb: number;
};

export const BOOKS: readonly Book[] = [
  {
    id: 'ielts-reading',
    file: '01-IELTS-Reading-Duong-toi-7.5.pdf',
    exam: 'IELTS',
    title: 'IELTS Reading',
    subtitle: 'Đường tới 7.5+ trong 20 tuần',
    pages: 483,
    sizeMb: 5.8,
  },
  {
    id: 'ielts-listening',
    file: '02-IELTS-Listening.pdf',
    exam: 'IELTS',
    title: 'IELTS Listening',
    subtitle: 'Từ vựng, mẫu câu và bẫy đề',
    pages: 324,
    sizeMb: 4.4,
  },
  {
    id: 'ielts-vocab',
    file: '03-IELTS-Tu-vung-20-Unit.pdf',
    exam: 'IELTS',
    title: 'Từ vựng IELTS',
    subtitle: '20 unit, mỗi ngày một unit',
    pages: 383,
    sizeMb: 4.9,
  },
  {
    id: 'ielts-task1',
    file: '04-IELTS-Writing-Task-1.pdf',
    exam: 'IELTS',
    title: 'IELTS Writing Task 1',
    subtitle: 'Giáo trình và lộ trình 45 ngày',
    pages: 314,
    sizeMb: 5.5,
  },
  {
    id: 'ielts-task2',
    file: '05-IELTS-Writing-Task-2.pdf',
    exam: 'IELTS',
    title: 'IELTS Writing Task 2',
    subtitle: 'Giáo trình và lộ trình 60 ngày',
    pages: 261,
    sizeMb: 4.9,
  },
  {
    id: 'ielts-speaking',
    file: '06-IELTS-Speaking.pdf',
    exam: 'IELTS',
    title: 'IELTS Speaking',
    subtitle: 'Giáo trình và lộ trình 60 ngày',
    pages: 349,
    sizeMb: 4.1,
  },
  {
    id: 'sat-math-20w',
    file: '07-SAT-Math-20-tuan.pdf',
    exam: 'SAT',
    title: 'SAT Math',
    subtitle: 'Đường tới 700+ trong 20 tuần',
    pages: 225,
    sizeMb: 6.0,
  },
  {
    id: 'sat-math-30u',
    file: '08-SAT-Math-30-Unit-luyen-tap.pdf',
    exam: 'SAT',
    title: 'SAT Math · 30 unit',
    subtitle: 'Luyện tập có lời giải',
    pages: 385,
    sizeMb: 3.7,
  },
  {
    id: 'sat-rw-16w',
    file: '09-SAT-Reading-Writing-16-tuan.pdf',
    exam: 'SAT',
    title: 'SAT Reading & Writing',
    subtitle: 'Đường tới 700+ trong 16 tuần',
    pages: 321,
    sizeMb: 7.1,
  },
  {
    id: 'sat-rw-16u',
    file: '10-SAT-RW-16-Unit-luyen-tap.pdf',
    exam: 'SAT',
    title: 'SAT Reading & Writing · 16 unit',
    subtitle: 'Luyện tập có lời giải',
    pages: 251,
    sizeMb: 2.2,
  },
  {
    id: 'bilingual',
    file: '11-Doc-song-ngu-Anh-Viet.pdf',
    exam: 'Song ngữ',
    title: 'Đọc song ngữ Anh – Việt',
    subtitle: 'Bài đọc kiểu báo chí, chú giải chạy dọc trang',
    pages: 624,
    sizeMb: 9.7,
  },
];

export const BOOK_TOTALS = {
  count: BOOKS.length,
  pages: BOOKS.reduce((sum, book) => sum + book.pages, 0),
} as const;

export function bookById(id: string): Book | null {
  return BOOKS.find((book) => book.id === id) ?? null;
}

/** Tên file khi tải về: có chữ ReadUp để người mua tìm lại được trong thư mục Downloads. */
export function downloadName(book: Book): string {
  return `ReadUp-${book.file.replace(/^\d+-/, '')}`;
}
