import { errorText, localeOf, msg } from '@/lib/server-locale';
import { testReminder, vnTodayKey } from '@/services/reminders/build';
import {
  emailConfigured,
  isMissingTable,
  loadPayloads,
  loadSubscriptions,
  pushConfigured,
  requireUser,
  sendEmail,
  sendPush,
  setupNeededResponse,
  type PrefsRow,
} from '@/services/reminders/server';

/**
 * POST /api/reminders/test — gửi ngay MỘT lời nhắc tới chính người gọi, qua mọi
 * kênh họ đã bật. Nội dung là lời nhắc thật của hôm nay nếu có; không có gì để
 * nhắc thì là một câu thử. Không đụng `last_sent_on`: gửi thử không làm mất
 * lời nhắc tối nay.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const caller = await requireUser(request);
    if (!caller.ok) return caller.response;
    const locale = localeOf(request);

    const { data, error } = await caller.db
      .from('reminder_prefs')
      .select('user_id, push_enabled, email_enabled, locale, last_sent_on')
      .eq('user_id', caller.userId)
      .maybeSingle();
    if (isMissingTable(error)) return setupNeededResponse(request);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const prefs = data as PrefsRow | null;

    const payloads = (await loadPayloads(caller.db, [caller.userId])).get(caller.userId) ?? {};
    const reminder = testReminder(payloads, vnTodayKey(), locale);

    const subs = (await loadSubscriptions(caller.db, [caller.userId])).get(caller.userId) ?? [];
    const push = pushConfigured() ? await sendPush(caller.db, subs, reminder) : null;

    let email: 'sent' | 'failed' | 'off' | 'not_configured' = 'off';
    if (prefs?.email_enabled && caller.email) {
      email = !emailConfigured() ? 'not_configured' : (await sendEmail(caller.email, reminder, locale)) ? 'sent' : 'failed';
    }

    if (!push?.sent && email !== 'sent') {
      return Response.json(
        {
          ok: false,
          push,
          email,
          error: msg(
            request,
            'Chưa gửi được tới đâu: chưa có máy nào bật thông báo, và email chưa bật (hoặc gửi lỗi).',
            'Nothing was delivered: no device has notifications on, and email is off (or failed).',
          ),
        },
        { status: 409 },
      );
    }
    return Response.json({ ok: true, push, email, title: reminder.title });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không gửi thử được.', 'Could not send the test.') }, { status: 500 });
  }
}
