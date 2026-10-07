/**
 * Khách (chưa đăng nhập) dùng thử được phần cốt lõi; các tính năng nặng hoặc có AI/trò chơi/xã hội dành cho thành viên.
 * Hàm thuần: nhận đường dẫn, trả về có thuộc khu dành cho thành viên không.
 *
 * Giữ MỞ cho khách: trang chủ, từ vựng, kho bài đọc, câu/đoạn luyện, SAT Math + SAT Verbal (đã có hạn mức theo gói),
 * trang gói/giá, đăng nhập, điều khoản. Chặn theo TIỀN TỐ để mọi trang con của khu đó cũng bị chặn.
 */
export const MEMBER_ONLY_PREFIXES = [
  '/quest', // Du ngoạn, Du học, Thành phố tri thức, xếp hạng, cửa hàng quà
  '/speaking',
  '/write',
  '/listening',
  '/history',
  '/community',
  '/bilingual',
  '/duel',
  '/shadow',
  '/leaderboard',
  '/weekly',
  '/mock-tests',
  '/ielts',
  '/class',
  '/teacher',
  '/shop',
  '/sat/full-test',
] as const;

/** Tên hiển thị của từng khu bị khoá (màn khoá ghi rõ người học đang mở cái gì). Thứ tự: tiền tố dài trước. */
const FEATURE_NAMES: [prefix: string, vi: string, en: string][] = [
  ['/sat/full-test', 'Thi thử SAT', 'SAT mock test'],
  ['/mock-tests', 'Thi thử', 'Mock tests'],
  ['/quest', 'Du ngoạn & Du học', 'Travel & Study Abroad'],
  ['/speaking', 'Speaking', 'Speaking'],
  ['/write', 'Writing', 'Writing'],
  ['/listening', 'Listening', 'Listening'],
  ['/history', 'Lịch sử', 'History'],
  ['/community', 'Cộng đồng', 'Community'],
  ['/bilingual', 'Đọc báo song ngữ', 'Bilingual news'],
  ['/duel', 'Đấu từ vựng', 'Vocabulary duel'],
  ['/shadow', 'Luyện nói nhại', 'Shadowing'],
  ['/leaderboard', 'Bảng xếp hạng', 'Leaderboard'],
  ['/weekly', 'Thử thách tuần', 'Weekly challenge'],
  ['/ielts', 'Công cụ IELTS', 'IELTS tools'],
  ['/class', 'Lớp học', 'Classes'],
  ['/teacher', 'Lớp học', 'Classes'],
  ['/shop', 'Cửa hàng', 'Shop'],
];

/** Tên tính năng của trang bị khoá (null nếu trang không bị khoá). */
export function lockedFeatureName(pathname: string, en: boolean): string | null {
  const p = pathname.split('?')[0]!.replace(/\/+$/, '') || '/';
  const hit = FEATURE_NAMES.find(([prefix]) => p === prefix || p.startsWith(`${prefix}/`) || p.startsWith(`${prefix}-`));
  return hit ? (en ? hit[2] : hit[1]) : null;
}

/** Màn khoá liệt kê ngắn: phần cần tài khoản và phần khách dùng ngay (khớp `MEMBER_ONLY_PREFIXES`). */
export const LOCKED_SUMMARY = {
  vi: ['Listening', 'Speaking', 'Writing', 'Thi thử', 'Đọc báo song ngữ', 'Du ngoạn', 'Cộng đồng'],
  en: ['Listening', 'Speaking', 'Writing', 'Mock tests', 'Bilingual news', 'Travel', 'Community'],
};
export const FREE_SUMMARY = {
  vi: ['Từ vựng', 'Reading', 'Luyện câu', 'SAT Math', 'SAT Reading & Writing'],
  en: ['Vocabulary', 'Reading', 'Sentence practice', 'SAT Math', 'SAT Reading & Writing'],
};

export function isMemberOnlyPath(pathname: string): boolean {
  const p = pathname.split('?')[0]!.replace(/\/+$/, '') || '/';
  return MEMBER_ONLY_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`) || p.startsWith(`${prefix}-`));
}
