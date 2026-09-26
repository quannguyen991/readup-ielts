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
    } | null;
    if (!body || typeof body.visitor !== 'string' || !ID.test(body.visitor) || typeof body.path !== 'string') return done;

    const width = typeof body.width === 'number' && Number.isFinite(body.width) ? body.width : undefined;
    const { device, os, browser } = classifyUserAgent(ua, width);
    const host = request.headers.get('host') ?? undefined;
    const country = (request.headers.get('x-vercel-ip-country') ?? '').slice(0, 2).toUpperCase() || null;

    const db = getSupabaseAdmin() as unknown as SupabaseClient;
    const { error } = await db.from('page_views').insert({
      visitor: body.visitor,
      session: typeof body.session === 'string' && ID.test(body.session) ? body.session : null,
      path: normalizePath(body.path),
      device,
      os,
      browser,
      referrer: referrerHost(typeof body.referrer === 'string' ? body.referrer : null, host),
      country,
      signed_in: body.signedIn === true,
    });
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') console.warn('[track]', error.message);
  } catch (err) {
    console.warn('[track]', err instanceof Error ? err.message : err);
  }
  return done;
}
