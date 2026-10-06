/**
 * Quà đăng ký: tài khoản MỚI nhận gói Plus miễn phí trong `WELCOME_DAYS` ngày (người dùng yêu cầu 06/10/2026; ban đầu là Pro, đổi sang Plus cùng ngày để giới hạn bớt AI).
 *
 * Cấp ở MÁY CHỦ (`/api/welcome-pro`) bằng cách ghi `profiles.plan` — nên là gói thật, kể cả hạn mức AI máy chủ — chứ không
 * phải lượt học thử cục bộ. Chỉ một lần cho mỗi tài khoản: điều kiện là hồ sơ còn Free và `plan_started_at` chưa từng được đặt
 * (cột này chỉ được ghi khi có gói, nên trống nghĩa là chưa từng có gói nào), và tài khoản được tạo trong `WELCOME_WINDOW_DAYS`
 * ngày gần đây — tài khoản cũ không được tặng.
 */
export const WELCOME_PLAN = 'plus' as const;
export const WELCOME_DAYS = 14;
export const WELCOME_WINDOW_DAYS = 3;

export type WelcomeVerdict = 'ok' | 'not_new' | 'already';

export function welcomeEligibility(input: {
  userCreatedAt: string | null | undefined;
  plan: string | null | undefined;
  planStartedAt: string | null | undefined;
  now?: Date;
}): WelcomeVerdict {
  const now = input.now ?? new Date();
  if ((input.plan ?? 'free') !== 'free' || input.planStartedAt) return 'already';
  const created = input.userCreatedAt ? new Date(input.userCreatedAt).getTime() : NaN;
  if (!Number.isFinite(created)) return 'not_new';
  const ageDays = (now.getTime() - created) / (24 * 3600 * 1000);
  return ageDays <= WELCOME_WINDOW_DAYS ? 'ok' : 'not_new';
}

export function welcomeExpiry(now: Date = new Date()): string {
  const until = new Date(now.getTime());
  until.setDate(until.getDate() + WELCOME_DAYS);
  return until.toISOString();
}
