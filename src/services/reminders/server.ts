/**
 * SERVER-ONLY: phần chạm mạng của nhắc học — xác minh người gọi, đọc/ghi hai
 * bảng `reminder_prefs` / `push_subscriptions`, gửi thông báo đẩy (web-push) và
 * email (Resend). Luật "nhắc gì, có nên nhắc không" nằm ở `build.ts` (hàm thuần).
 *
 * Hai bảng bật RLS mà không có policy nào và đã thu hồi quyền của anon /
 * authenticated (`supabase/migrations/20261001000100_reminders.sql`): mọi lượt
 * đọc ghi đi qua API route bằng service key, và danh tính luôn lấy từ access
 * token chứ không từ body.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';

import type { Locale } from '@/i18n/keys';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { SITE_ORIGIN } from '@/lib/site';
import { fetchAllPages } from '@/services/admin/fetch-all';

import type { Reminder, ReminderPayloads } from './build';

/** Các khoá `user_state` lời nhắc đọc tới — không kéo payload nặng khác. `vocab` giữ lịch ôn FSRS thật. */
export const REMINDER_STORE_KEYS = ['topic_study', 'vocab', 'study', 'reward'] as const;

export type PrefsRow = {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  locale: string | null;
  last_sent_on: string | null;
};

export type SubscriptionRow = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };

/** Bảng chưa tạo (chưa chạy migration). */
export function isMissingTable(error: { code?: string } | null | undefined): boolean {
  return !!error && (error.code === 'PGRST205' || error.code === '42P01');
}

export function untypedAdmin(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

export function pushConfigured(): boolean {
  return !!(process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function emailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL);
}

export function toLocale(v: unknown): Locale {
  return v === 'en' ? 'en' : 'vi';
}

type Caller = { ok: true; userId: string; email: string | null; db: SupabaseClient } | { ok: false; response: Response };

/** Người gọi từ header `Authorization: Bearer <access token>`. */
export async function requireUser(request: Request): Promise<Caller> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return { ok: false, response: Response.json({ error: msg(request, 'Cần đăng nhập.', 'Please sign in.') }, { status: 401 }) };
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, response: Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 }) };
  }
  return { ok: true, userId: data.user.id, email: data.user.email ?? null, db: untypedAdmin() };
}

export function setupNeededResponse(request: Request): Response {
  return Response.json(
    { setupNeeded: true, error: msg(request, 'Máy chủ chưa bật nhắc học (chưa tạo bảng).', 'Reminders are not set up on the server yet.') },
    { status: 503 },
  );
}

/** Payload của nhiều người một lượt, đọc theo trang (PostgREST cắt 1.000 dòng mỗi lần). */
export async function loadPayloads(db: SupabaseClient, userIds: string[]): Promise<Map<string, ReminderPayloads>> {
  const out = new Map<string, ReminderPayloads>();
  if (!userIds.length) return out;
  const { rows, error } = await fetchAllPages<{ user_id: string; store_key: string; payload: unknown }>((from, to) =>
    db
      .from('user_state')
      .select('user_id, store_key, payload')
      .in('user_id', userIds)
      .in('store_key', [...REMINDER_STORE_KEYS])
      .order('user_id')
      .order('store_key')
      .range(from, to),
  );
  if (error) throw new Error(error.message);
  for (const r of rows) {
    const p = out.get(r.user_id) ?? {};
    p[r.store_key] = r.payload;
    out.set(r.user_id, p);
  }
  return out;
}

export async function loadSubscriptions(db: SupabaseClient, userIds: string[]): Promise<Map<string, SubscriptionRow[]>> {
  const out = new Map<string, SubscriptionRow[]>();
  if (!userIds.length) return out;
  const { rows, error } = await fetchAllPages<SubscriptionRow>((from, to) =>
    db
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', userIds)
      .order('id')
      .range(from, to),
  );
  if (error) throw new Error(error.message);
  for (const r of rows) out.set(r.user_id, [...(out.get(r.user_id) ?? []), r]);
  return out;
}

let vapidReady = false;
function ensureVapid(): void {
  if (vapidReady) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || SITE_ORIGIN,
    process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '',
    process.env.VAPID_PRIVATE_KEY ?? '',
  );
  vapidReady = true;
}

export type PushResult = { sent: number; failed: number; removed: number };

/**
 * Gửi một lời nhắc tới mọi máy đã đăng ký của một người. Máy trả 404/410 (đã
 * huỷ đăng ký, gỡ app, xoá dữ liệu trang) thì xoá luôn đăng ký đó.
 */
export async function sendPush(db: SupabaseClient, subs: SubscriptionRow[], reminder: Reminder): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, removed: 0 };
  if (!subs.length || !pushConfigured()) return result;
  ensureVapid();
  const payload = JSON.stringify({ title: reminder.title, body: reminder.body, url: reminder.url, tag: 'band9-reminder' });
  const gone: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 60 * 60, urgency: 'normal' });
        result.sent += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(s.id);
        else result.failed += 1;
      }
    }),
  );
  if (gone.length) {
    await db.from('push_subscriptions').delete().in('id', gone);
    result.removed = gone.length;
  }
  return result;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function reminderEmailHtml(reminder: Reminder, locale: Locale): string {
  const en = locale === 'en';
  const cta = en ? 'Open Band 9' : 'Mở Band 9';
  const foot = en
    ? 'You get this because you turned on email reminders in Band 9 settings.'
    : 'Bạn nhận thư này vì đã bật nhắc học qua email trong Cài đặt của Band 9.';
  const off = en ? 'Turn off' : 'Tắt nhắc';
  return `<!doctype html><html><body style="margin:0;background:#F3F0FB;font-family:Arial,Helvetica,sans-serif;color:#0F1D33">
<div style="max-width:520px;margin:0 auto;padding:28px 20px">
<div style="font-weight:800;font-size:18px;letter-spacing:.5px;color:#0F1D33">Band 9</div>
<div style="margin-top:16px;background:#FFFFFF;border-radius:16px;padding:24px;border:1px solid #E6DCC8">
<h1 style="margin:0;font-size:22px;line-height:1.3;color:#0F1D33">${escapeHtml(reminder.title)}</h1>
<p style="margin:12px 0 20px;font-size:16px;line-height:1.5;color:#33415C">${escapeHtml(reminder.body)}</p>
<a href="${escapeHtml(reminder.url)}" style="display:inline-block;background:#0F1D33;color:#F3F0FB;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">${cta}</a>
</div>
<p style="margin-top:16px;font-size:13px;color:#6B6455">${foot} <a href="${SITE_ORIGIN}/settings" style="color:#6A4BD9">${off}</a></p>
</div></body></html>`;
}

/** Gửi email qua Resend. Thiếu khoá hoặc địa chỉ gửi thì không gửi (trả false). */
export async function sendEmail(to: string, reminder: Reminder, locale: Locale): Promise<boolean> {
  if (!emailConfigured() || !to) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.REMINDER_FROM_EMAIL,
      to: [to],
      subject: reminder.title,
      html: reminderEmailHtml(reminder, locale),
      text: `${reminder.title}\n\n${reminder.body}\n\n${reminder.url}`,
    }),
  });
  return res.ok;
}
