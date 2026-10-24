import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { classifyUserAgent, isBot, normalizePath, referrerHost } from '@/services/analytics/traffic';

/**
 * POST /api/track — ghi MỘT lượt xem trang vào `page_views`.
 *
 * Nhận từ trình duyệt: mã khách, mã phiên, đường dẫn, trang giới thiệu, bề
 * ngang màn hình, đã đăng nhập hay chưa. Thiết bị / hệ điều hành / trình duyệt
 * do MÁY CHỦ suy ra từ header User-Agent rồi bỏ chuỗi gốc; nước lấy từ header
 * của Vercel. Không lưu IP.
 *
 * Luôn trả 204, kể cả khi hỏng: đây là việc đếm, không được làm chậm hay làm
 * lỗi trang người học đang xem. Bảng chưa tạo (chưa chạy migration) thì im lặng
 * bỏ qua.
 */
const ID = /^[A-Za-z0-9_-]{8,40}$/;

export async function POST(request: Request): Promise<Response> {
  const done = new Response(null, { status: 204 });
  try {
    const ua = request.headers.get('user-agent') ?? '';
    if (!ua || isBot(ua)) return done;

    const body = (await request.json().catch(() => null)) as {
      visitor?: unknown;
      session?: unknown;
      path?: unknown;
      referrer?: unknown;
      width?: unknown;
      signedIn?: unknown;
      utm_source?: unknown;
      utm_medium?: unknown;
      utm_campaign?: unknown;
      utm_content?: unknown;
    } | null;
    if (!body || typeof body.visitor !== 'string' || !ID.test(body.visitor) || typeof body.path !== 'string') return done;

    const width = typeof body.width === 'number' && Number.isFinite(body.width) ? body.width : undefined;
    const { device, os, browser } = classifyUserAgent(ua, width);
    const host = request.headers.get('host') ?? undefined;
    const country = (request.headers.get('x-vercel-ip-country') ?? '').slice(0, 2).toUpperCase() || null;

    const db = getSupabaseAdmin() as unknown as SupabaseClient;
    const cleanStr = (v: unknown) => (typeof v === 'string' ? v.slice(0, 100).trim() || null : null);
    const row = {
      visitor: body.visitor,
      session: typeof body.session === 'string' && ID.test(body.session) ? body.session : null,
      path: normalizePath(body.path),
      device,
      os,
      browser,
      referrer: referrerHost(typeof body.referrer === 'string' ? body.referrer : null, host),
      country,
      signed_in: body.signedIn === true,
    };
    const utm = {
      utm_source: cleanStr(body.utm_source),
      utm_medium: cleanStr(body.utm_medium),
      utm_campaign: cleanStr(body.utm_campaign),
      utm_content: cleanStr(body.utm_content),
    };
    let { error } = await db.from('page_views').insert({ ...row, ...utm });
    // Bảng chưa có cột UTM (migration 20261023000100 chưa chạy): vẫn ghi lượt xem, bỏ UTM.
    if (error?.code === 'PGRST204') ({ error } = await db.from('page_views').insert(row));
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') console.warn('[track]', error.message);
  } catch (err) {
    console.warn('[track]', err instanceof Error ? err.message : err);
  }
  return done;
}
