import { isExamRoute } from '@/navigation/focus-routes';

/**
 * Các khu vực HỌC: chỉ những trang này mới cộng giờ học. Trang chủ, cài đặt, cửa
 * hàng, bảng xếp hạng, trò chơi (Thành phố, Du ngoạn, Bản đồ) và trang tài khoản
 * không cộng — nếu không, đứng ở Cửa hàng cũng thành "đang học".
 */
const STUDY_AREAS = [
  'ielts',
  'ielts-source-practice',
  'read',
  'bilingual',
  'listening',
  'sat',
  'sat-rw',
  'math',
  'write',
  'speaking',
  'vocabulary',
  'sentence',
  'shadow',
  'review',
  'practice',
  'practice-mixed',
  'mock-run',
  'mock-tests',
  'paste',
  'library',
  'mastery',
];

const STUDY_ROUTE = new RegExp(`^/(${STUDY_AREAS.join('|')})(/|$)`);

/** Trang lịch sử nghe chỉ là bảng xem lại, không phải học. */
const NOT_STUDY = [/^\/listening\/history$/];

export function isStudyRoute(pathname: string): boolean {
  return STUDY_ROUTE.test(pathname) && !NOT_STUDY.some((re) => re.test(pathname));
}

/**
 * Màn có đồng hồ thi hoặc đang chấm điểm theo giờ: hoãn giờ nghỉ tới khi nộp bài.
 * Gồm mọi màn thi của `focus-routes`, phòng nói (micro + đồng hồ), và phòng viết
 * (tính giờ). Phòng đọc "Đi thi" chưa khai báo ở đây — xem báo cáo cuối việc.
 */
export function isBreakExemptRoute(pathname: string): boolean {
  return isExamRoute(pathname) || /^\/speaking\/room$/.test(pathname) || /^\/write(\/|$)/.test(pathname) || /^\/mock-run(\/|$)/.test(pathname);
}
