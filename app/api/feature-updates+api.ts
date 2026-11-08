import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';

/**
 * API "Cập nhật tính năng" cho bảng tin Thông báo.
 *   GET → các lần đổi trạng thái ý tưởng gần nhất (công khai, không cần đăng nhập).
 * Các dòng được trigger SQL tự thêm khi feature_requests.status đổi (migration 20261108000100).
 */

type Row = { id: string; request_id: string | null; title: string; status: string; created_at: string };

export async function GET(request: Request): Promise<Response> {
  const db = getSupabaseAdmin() as unknown as SupabaseClient;
  const { data, error } = await db
    .from('feature_updates')
    .select('id, request_id, title, status, created_at')
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) {
    const setupNeeded = error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '');
    return Response.json(
      { error: msg(request, 'Chưa tải được cập nhật. Thử lại sau.', 'Could not load updates. Please try again.'), ...(setupNeeded ? { setupNeeded: true } : {}) },
      { status: setupNeeded ? 503 : 500 },
    );
  }
  const items = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    requestId: r.request_id,
    title: r.title,
    status: r.status,
    createdAt: r.created_at,
  }));
  return Response.json({ items });
}
