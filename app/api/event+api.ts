import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { parseAppEvent } from '@/services/analytics/app-event-rules';
import { isBot } from '@/services/analytics/traffic';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * POST /api/event — ghi MỘT sự kiện (start_lesson, complete_lesson, sign_up) vào `app_events`.
 *
 * Luôn trả 204, kể cả khi hỏng: đây là việc đếm, không được làm lỗi trang người học.
 * Bảng chưa tạo (chưa chạy migration) thì im lặng bỏ qua.
 */
export async function POST(request: Request): Promise<Response> {
  const done = new Response(null, { status: 204 });
  try {
    const ua = request.headers.get('user-agent') ?? '';
    if (!ua || isBot(ua)) return done;

    const event = parseAppEvent(await request.json().catch(() => null));
    if (!event) return done;

    const db = getSupabaseAdmin() as unknown as SupabaseClient;
    const { error } = await db.from('app_events').insert({
      name: event.name,
      visitor: event.visitor,
      session: event.session,
      path: event.path,
      signed_in: event.signedIn,
      utm_source: event.utm.utm_source,
      utm_medium: event.utm.utm_medium,
      utm_campaign: event.utm.utm_campaign,
      utm_content: event.utm.utm_content,
    });
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') console.warn('[event]', error.message);
  } catch (err) {
    console.warn('[event]', err instanceof Error ? err.message : err);
  }
  return done;
}
