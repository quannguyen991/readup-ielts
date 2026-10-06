import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { WELCOME_DAYS, WELCOME_PLAN, welcomeEligibility, welcomeExpiry } from '@/lib/billing/welcome';

/**
 * POST /api/welcome-pro — tặng tài khoản MỚI gói Plus (`WELCOME_PLAN`) `WELCOME_DAYS` ngày (một lần duy nhất).
 *
 * Gói được ghi vào `profiles` bằng service_role nên là gói THẬT ở máy chủ (cả hạn mức AI). Điều kiện và lý do xem
 * `src/lib/billing/welcome.ts`. Gọi lại nhiều lần an toàn: lần thứ hai trở đi trả `granted: false`.
 * Cập nhật có điều kiện (`plan = free` và `plan_started_at is null`) nên hai yêu cầu đồng thời cũng chỉ cấp một lần.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) return Response.json({ error: msg(request, 'Thiếu access token.', 'Missing access token.') }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }
    const user = auth.user;

    const { data: row } = await admin.from('profiles').select('plan, plan_started_at, plan_expires_at').eq('id', user.id).maybeSingle();
    const profile = row as { plan?: string | null; plan_started_at?: string | null; plan_expires_at?: string | null } | null;
    if (!profile) return Response.json({ granted: false, reason: 'no_profile' });

    const verdict = welcomeEligibility({ userCreatedAt: user.created_at, plan: profile.plan, planStartedAt: profile.plan_started_at });
    if (verdict !== 'ok') return Response.json({ granted: false, reason: verdict });

    const now = new Date();
    const expiresAt = welcomeExpiry(now);
    const { data: updated, error } = await admin
      .from('profiles')
      .update({ plan: WELCOME_PLAN, plan_started_at: now.toISOString(), plan_expires_at: expiresAt })
      .eq('id', user.id)
      .eq('plan', 'free')
      .is('plan_started_at', null)
      .select('id');
    if (error) return Response.json({ error: msg(request, 'Chưa tặng được gói. Thử lại sau.', 'Could not apply the gift. Please try again later.') }, { status: 502 });
    if (!updated || updated.length === 0) return Response.json({ granted: false, reason: 'already' });

    return Response.json({ granted: true, plan: WELCOME_PLAN, expiresAt, days: WELCOME_DAYS });
  } catch {
    return Response.json({ error: msg(request, 'Chưa tặng được gói. Thử lại sau.', 'Could not apply the gift. Please try again later.') }, { status: 502 });
  }
}
