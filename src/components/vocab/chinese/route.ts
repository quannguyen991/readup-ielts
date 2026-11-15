/**
 * Nhận diện trang MỘT BÀI tiếng Trung: `/vocabulary/topic/book-hsk-…`.
 *
 * Chỉ khớp đúng trang bài (không khớp /learn, /quiz… của bài): các trang con đó vẫn dùng
 * giao diện chung, nên nền Band 9 không áp cho chúng. Thêm bộ tiếng Trung khác thì thêm tiền tố ở đây.
 */
const ZH_LESSON_ROUTE = /^\/vocabulary\/topic\/book-hsk-[^/]+$/;

export function isChineseStudyRoute(pathname: string): boolean {
  return ZH_LESSON_ROUTE.test(pathname);
}

/**
 * Mọi màn của bộ từ tiếng Trung: chọn bộ HSK (`/vocabulary/book/book-hsk-…`), danh sách buổi,
 * trang bài và các chế độ học (`/vocabulary/topic/book-hsk-…/learn|quiz|…`). Các màn này dùng giấy Band 9.
 */
const ZH_VOCAB_ROUTE = /^\/vocabulary\/(book|topic)\/book-hsk-[^/]+(\/[^/]+)*$/;

export function isChineseVocabRoute(pathname: string): boolean {
  return ZH_VOCAB_ROUTE.test(pathname);
}
