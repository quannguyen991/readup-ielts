import { createHash, timingSafeEqual } from 'node:crypto';

import { buildReminder, vnTodayKey } from '@/services/reminders/build';
import { fetchAllPages } from '@/services/admin/fetch-all';
import {
  emailConfigured,
  isMissingTable,
  loadPayloads,
  loadSubscriptions,
  pushConfigured,
  sendEmail,
  sendPush,
  toLocale,
  untypedAdmin,
  type PrefsRow,
} from '@/services/reminders/server';

/**
 * GET /api/cron/reminders — Vercel Cron gọi mỗi ngày 13:00 UTC = 20:00 giờ Việt Nam
 * (`vercel.json`). Vercel tự gắn `Authorization: Bearer $CRON_SECRET`; thiếu
 * biến đó thì route từ chối mọi lượt gọi, không chạy "mở".
 *
 * Mỗi người đã bật ít nhất một kênh và chưa được nhắc hôm nay (ngày Việt Nam):
 * đọc payload đồng bộ → `buildReminder` → `null` thì im lặng; có lời nhắc thì
 * đẩy tới mọi máy (xoá máy trả 404/410) và gửi email nếu đã bật + máy chủ có
 * khoá Resend; gửi được ít nhất một kênh thì ghi `last_sent_on`.
 *
 * Hàm serverless có trần 60 giây: làm theo lô và dừng nhận lô mới khi gần hết
 * giờ; ai chưa tới lượt thì trả về trong `remaining` (gọi lại route là làm
 * tiếp, người đã nhắc hôm nay bị bỏ qua nhờ `last_sent_on`).
 */
const BATCH = 50;
const TIME_BUDGET_MS = 45_000;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = request.headers.get('authorization') ?? '';
  const a = createHash('sha256').update(got).digest();
  const b = createHash('sha256').update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const started = Date.now();
  try {
    const db = untypedAdmin();
    const today = vnTodayKey();
    const canPush = pushConfigured();
    const canEmail = emailConfigured();

    const { rows, error } = await fetchAllPages<PrefsRow>((from, to) =>
      db
        .from('reminder_prefs')
        .select('user_id, push_enabled, email_enabled, locale, last_sent_on')
        .or('push_enabled.eq.true,email_enabled.eq.true')
        .order('user_id')
        .range(from, to),
    );
    if (isMissingTable(error)) return Response.json({ setupNeeded: true }, { status: 503 });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const todo = rows.filter((r) => r.last_sent_on !== today && ((r.push_enabled && canPush) || (r.email_enabled && canEmail)));
    const stats = { today, candidates: todo.length, reminded: 0, quiet: 0, pushSent: 0, pushRemoved: 0, emailSent: 0, undelivered: 0, remaining: 0 };

    for (let i = 0; i < todo.length; i += BATCH) {
      if (Date.now() - started > TIME_BUDGET_MS) {
        stats.remaining = todo.length - i;
        break;
      }
      const batch = todo.slice(i, i + BATCH);
      const ids = batch.map((r) => r.user_id);
      const [payloads, subs] = await Promise.all([loadPayloads(db, ids), canPush ? loadSubscriptions(db, ids) : Promise.resolve(new Map())]);

      const sentIds: string[] = [];
      await Promise.all(
        batch.map(async (prefs) => {
          const locale = toLocale(prefs.locale);
          const reminder = buildReminder(payloads.get(prefs.user_id) ?? {}, today, locale);
          if (!reminder) {
            stats.quiet += 1;
            return;
          }
          let delivered = false;
          try {
            if (prefs.push_enabled && canPush) {
              const r = await sendPush(db, subs.get(prefs.user_id) ?? [], reminder);
              stats.pushSent += r.sent;
              stats.pushRemoved += r.removed;
              if (r.sent > 0) delivered = true;
            }
            if (prefs.email_enabled && canEmail) {
              const { data } = await db.auth.admin.getUserById(prefs.user_id);
              const email = data?.user?.email;
              if (email && (await sendEmail(email, reminder, locale))) {
                stats.emailSent += 1;
                delivered = true;
              }
            }
          } catch {
            // Một người lỗi không được làm hỏng cả lô.
          }
          if (delivered) {
            stats.reminded += 1;
            sentIds.push(prefs.user_id);
          } else stats.undelivered += 1;
        }),
      );

      if (sentIds.length) {
        await db.from('reminder_prefs').update({ last_sent_on: today }).in('user_id', sentIds);
      }
    }

    return Response.json(stats);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
