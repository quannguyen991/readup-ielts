import { errorText, msg } from '@/lib/server-locale';
import { isMissingTable, requireUser, setupNeededResponse, toLocale } from '@/services/reminders/server';

/**
 * POST   /api/reminders/subscribe — lưu đăng ký đẩy của máy này + bật push.
 *        Body: { subscription: PushSubscriptionJSON, locale?: 'vi' | 'en' }
 * DELETE /api/reminders/subscribe — gỡ đăng ký của máy này. Body: { endpoint }
 *        Không còn máy nào thì tắt push trong `reminder_prefs`.
 *
 * Danh tính lấy từ access token. Một endpoint chỉ thuộc một người: đăng nhập
 * tài khoản khác trên cùng trình duyệt rồi bật lại thì endpoint chuyển chủ.
 */
type SubscribeBody = {
  subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  locale?: unknown;
};

const isStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

export async function POST(request: Request): Promise<Response> {
  try {
    const caller = await requireUser(request);
    if (!caller.ok) return caller.response;
    const body = (await request.json().catch(() => ({}))) as SubscribeBody;
    const sub = body.subscription;
    const endpoint = sub?.endpoint;
    const p256dh = sub?.keys?.p256dh;
    const auth = sub?.keys?.auth;
    if (!isStr(endpoint, 1000) || !/^https:\/\//u.test(endpoint) || !isStr(p256dh, 200) || !isStr(auth, 100)) {
      return Response.json({ error: msg(request, 'Đăng ký thông báo không hợp lệ.', 'Invalid push subscription.') }, { status: 400 });
    }
    const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 300) || null;

    const { error } = await caller.db
      .from('push_subscriptions')
      .upsert({ user_id: caller.userId, endpoint, p256dh, auth, user_agent: userAgent }, { onConflict: 'endpoint' });
    if (isMissingTable(error)) return setupNeededResponse(request);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const { error: prefsError } = await caller.db
      .from('reminder_prefs')
      .upsert({ user_id: caller.userId, push_enabled: true, locale: toLocale(body.locale), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (prefsError) return Response.json({ error: prefsError.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không lưu được đăng ký thông báo.', 'Could not save the subscription.') }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const caller = await requireUser(request);
    if (!caller.ok) return caller.response;
    const body = (await request.json().catch(() => ({}))) as { endpoint?: unknown };
    if (!isStr(body.endpoint, 1000)) {
      return Response.json({ error: msg(request, 'Thiếu endpoint.', 'Missing endpoint.') }, { status: 400 });
    }

    const { error } = await caller.db.from('push_subscriptions').delete().eq('user_id', caller.userId).eq('endpoint', body.endpoint);
    if (isMissingTable(error)) return setupNeededResponse(request);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const { count, error: countError } = await caller.db
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', caller.userId);
    if (countError) return Response.json({ error: countError.message }, { status: 500 });
    if (!count) {
      await caller.db.from('reminder_prefs').update({ push_enabled: false, updated_at: new Date().toISOString() }).eq('user_id', caller.userId);
    }
    return Response.json({ ok: true, devices: count ?? 0 });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không gỡ được đăng ký thông báo.', 'Could not remove the subscription.') }, { status: 500 });
  }
}
