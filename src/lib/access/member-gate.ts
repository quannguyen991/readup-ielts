/**
 * Khách (chưa đăng nhập) dùng thử được phần cốt lõi; các tính năng nặng hoặc có AI/trò chơi/xã hội dành cho thành viên.
 * Hàm thuần: nhận đường dẫn, trả về có thuộc khu dành cho thành viên không.
 *
 * Giữ MỞ cho khách: trang chủ, từ vựng, kho bài đọc, câu/đoạn luyện, SAT Math + SAT Verbal (đã có hạn mức theo gói),
 * Du ngoạn và Du học (/quest, mở cho mọi người), trang gói/giá, đăng nhập, điều khoản.
 * Chặn theo TIỀN TỐ để mọi trang con của khu đó cũng bị chặn.
 */
export const MEMBER_ONLY_PREFIXES = [
  '/speaking',
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
  vi: ['Listening', 'Speaking', 'Writing', 'Thi thử', 'Đọc báo song ngữ', 'Cộng đồng'],
  en: ['Listening', 'Speaking', 'Writing', 'Mock tests', 'Bilingual news', 'Community'],
};
export const FREE_SUMMARY = {
  vi: ['Từ vựng', 'Reading', 'Luyện câu', 'SAT Math', 'SAT Reading & Writing', 'Du ngoạn', 'Du học'],
  en: ['Vocabulary', 'Reading', 'Sentence practice', 'SAT Math', 'SAT Reading & Writing', 'Travel', 'Study Abroad'],
};

/**
 * TẠM MỞ cho khách để thử các nút trong trang Quest (đấu, tuần, xếp hạng, quà, shadow).
 * Đặt lại [] là khoá lại như cũ. Danh sách MEMBER_ONLY_PREFIXES không đổi.
 */
export const TEMP_OPEN_PREFIXES: readonly string[] = ['/duel', '/weekly', '/leaderboard', '/shop', '/shadow'];

export function isMemberOnlyPath(pathname: string): boolean {
  const p = pathname.split('?')[0]!.replace(/\/+$/, '') || '/';
  // Mở cho khách: /write (xem đề, viết bài) và /ielts/skills/reading-tfng
  if (p === '/write' || p.startsWith('/write/')) return false;
  if (p === '/ielts/skills/reading-tfng' || p.startsWith('/ielts/skills/')) return false;
  if (TEMP_OPEN_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) return false;
  return MEMBER_ONLY_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`) || p.startsWith(`${prefix}-`));
}
