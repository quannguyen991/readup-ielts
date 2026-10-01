import { errorText, msg } from '@/lib/server-locale';
import { emailConfigured, isMissingTable, pushConfigured, requireUser, setupNeededResponse, toLocale, type PrefsRow } from '@/services/reminders/server';

/**
 * GET  /api/reminders/prefs — cài đặt nhắc học của người gọi + máy chủ đã bật
 *      kênh nào (thiếu khoá VAPID / Resend thì kênh đó tắt ở giao diện).
 * POST /api/reminders/prefs — đổi { emailEnabled?, locale? }. Push bật/tắt qua
 *      `/api/reminders/subscribe` vì nó gắn với từng máy.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const caller = await requireUser(request);
    if (!caller.ok) return caller.response;
    const { data, error } = await caller.db
      .from('reminder_prefs')
      .select('user_id, push_enabled, email_enabled, locale, last_sent_on')
      .eq('user_id', caller.userId)
      .maybeSingle();
    if (isMissingTable(error)) return setupNeededResponse(request);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const { count } = await caller.db
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', caller.userId);
    const row = data as PrefsRow | null;
    return Response.json({
      pushEnabled: !!row?.push_enabled,
      emailEnabled: !!row?.email_enabled,
      locale: toLocale(row?.locale),
      lastSentOn: row?.last_sent_on ?? null,
      devices: count ?? 0,
      email: caller.email,
      server: { push: pushConfigured(), email: emailConfigured() },
    });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không đọc được cài đặt nhắc học.', 'Could not load reminder settings.') }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const caller = await requireUser(request);
    if (!caller.ok) return caller.response;
    const body = (await request.json().catch(() => ({}))) as { emailEnabled?: unknown; locale?: unknown };
    const patch: Record<string, unknown> = { user_id: caller.userId, updated_at: new Date().toISOString() };
    if (typeof body.emailEnabled === 'boolean') {
      if (body.emailEnabled && !caller.email) {
        return Response.json({ error: msg(request, 'Tài khoản này chưa có email.', 'This account has no email address.') }, { status: 400 });
      }
      patch.email_enabled = body.emailEnabled;
    }
    if (body.locale !== undefined) patch.locale = toLocale(body.locale);

    const { error } = await caller.db.from('reminder_prefs').upsert(patch, { onConflict: 'user_id' });
    if (isMissingTable(error)) return setupNeededResponse(request);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không lưu được cài đặt nhắc học.', 'Could not save reminder settings.') }, { status: 500 });
  }
}
