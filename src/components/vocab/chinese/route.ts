/** Nhận diện trang một bài từ vựng tiếng Trung. */
const ZH_LESSON_ROUTE = /^\/vocabulary\/topic\/book-(?:hsk|hanyu)-[^/]+$/;

export function isChineseStudyRoute(pathname: string): boolean {
  return ZH_LESSON_ROUTE.test(pathname);
}

/**
 * Mọi màn của bộ từ tiếng Trung: HSK và giáo trình Hán ngữ, gồm danh sách sách, buổi,
 * bài và các chế độ luyện. Tất cả dùng cùng giao diện học tiếng Trung của Band 9.
 */
const ZH_VOCAB_ROUTE = /^\/vocabulary\/(book|topic)\/book-(?:hsk|hanyu)-[^/]+(?:\/[^/]+)*$/;

export function isChineseVocabRoute(pathname: string): boolean {
  return ZH_VOCAB_ROUTE.test(pathname);
}
