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

export function isMemberOnlyPath(pathname: string): boolean {
  const p = pathname.split('?')[0]!.replace(/\/+$/, '') || '/';
  return MEMBER_ONLY_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`) || p.startsWith(`${prefix}-`));
}
