/**
 * Tổng quan người dùng cho trang quản trị — CHỈ SỐ ĐẾM, không email, không id.
 *
 * Ba nguồn, mỗi nguồn trả lời một câu hỏi khác nhau:
 * - `auth.users`: bao nhiêu tài khoản, đăng ký khi nào, đăng nhập lần cuối khi nào;
 * - `profiles`: đang dùng gói gì, còn hạn không;
 * - `user_state`: có HỌC THẬT không — mốc đồng bộ dữ liệu học gần nhất. Đăng
 *   nhập mà không làm gì thì không tính là đang học.
 *
 * Người dùng chế độ Khách (không đăng nhập) không có trong ba nguồn này; lượt
 * xem của họ nằm ở Vercel Web Analytics.
 */

export type StatsUser = { created_at: string; last_sign_in_at: string | null };
export type StatsProfile = { plan: string; plan_expires_at: string | null; role: string };
export type StatsState = { user_id: string; updated_at: string };

export type UserStats = {
  accounts: number;
  signups7: number;
  signups30: number;
  signedIn7: number;
  signedIn30: number;
  learners7: number;
  learners30: number;
  learnersEver: number;
  admins: number;
  /** Gói → số tài khoản; gói trả phí tách còn hạn / hết hạn. */
  plans: Record<string, number>;
  /** "YYYY-MM" → số đăng ký, tăng dần theo tháng. */
  signupsByMonth: [string, number][];
};

const DAY = 86_400_000;

export function summarizeUsers(
  users: readonly StatsUser[],
  profiles: readonly StatsProfile[],
  states: readonly StatsState[],
  now: number,
): UserStats {
  const within = (iso: string | null, days: number) => !!iso && now - new Date(iso).getTime() <= days * DAY;

  const lastActivity = new Map<string, number>();
  for (const s of states) {
    const t = new Date(s.updated_at).getTime();
    const prev = lastActivity.get(s.user_id);
    if (prev === undefined || prev < t) lastActivity.set(s.user_id, t);
  }
  const activity = [...lastActivity.values()];

  const plans: Record<string, number> = {};
  for (const p of profiles) {
    const paid = p.plan !== 'free';
    const active = !p.plan_expires_at || new Date(p.plan_expires_at).getTime() > now;
    const key = paid ? `${p.plan} · ${active ? 'còn hạn' : 'hết hạn'}` : p.plan;
    plans[key] = (plans[key] ?? 0) + 1;
  }

  const byMonth = new Map<string, number>();
  for (const u of users) {
    const m = u.created_at.slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
  }

  return {
    accounts: users.length,
    signups7: users.filter((u) => within(u.created_at, 7)).length,
    signups30: users.filter((u) => within(u.created_at, 30)).length,
    signedIn7: users.filter((u) => within(u.last_sign_in_at, 7)).length,
    signedIn30: users.filter((u) => within(u.last_sign_in_at, 30)).length,
    learners7: activity.filter((t) => now - t <= 7 * DAY).length,
    learners30: activity.filter((t) => now - t <= 30 * DAY).length,
    learnersEver: activity.length,
    admins: profiles.filter((p) => p.role === 'admin').length,
    plans,
    signupsByMonth: [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)),
  };
}
