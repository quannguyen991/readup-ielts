import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchAllPages } from '@/services/admin/fetch-all';
import { requireAdmin } from '@/services/admin/guard';
import { summarizeTraffic, type PageViewRow } from '@/services/analytics/traffic';

/**
 * GET /api/admin/traffic?days=7|30 — lượt truy cập web cho trang quản trị.
 *
 * Trả số đã GOM (người truy cập, lượt xem, thiết bị, hệ điều hành, trình duyệt,
 * nước, trang, nguồn vào) — không trả từng dòng, không có mã khách nào đi ra.
 *
 * Bảng `page_views` chưa tạo thì trả `setupNeeded` để trang quản trị hướng dẫn
 * chạy migration `20260926000100_page_views.sql`, thay vì báo lỗi khó hiểu.
 */
// Đọc theo trang 1.000 dòng (trần của PostgREST — xem `fetch-all.ts`); trước
// đây xin `.limit(50000)` một lần và bị cắt im lặng còn đúng 1.000 lượt.
const MAX_ROWS = 200_000;

export async function GET(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;

    const url = new URL(request.url);
    const days = url.searchParams.get('days') === '30' ? 30 : 7;
    const since = new Date(Date.now() - (days + 1) * 86_400_000).toISOString();

    const db = guard.admin as unknown as SupabaseClient;
    const { rows, error, truncated } = await fetchAllPages<PageViewRow>(
      (from, to) =>
        db
          .from('page_views')
          .select('id, at, visitor, session, path, device, os, browser, referrer, country, signed_in')
          .gte('at', since)
          .order('at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to),
      MAX_ROWS,
    );

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') return Response.json({ setupNeeded: true });
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ summary: summarizeTraffic(rows, new Date(), days), truncated });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Lỗi không xác định' }, { status: 500 });
  }
}
