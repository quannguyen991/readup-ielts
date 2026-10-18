import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { displayableName } from '@/services/gamification/display-name';

/**
 * API "Yêu cầu tính năng".
 *   GET  ?sort=votes|new|mine  → danh sách (không cần đăng nhập để xem; có token thì đánh dấu "đã bình chọn").
 *   POST {action:'create', title, body}  → gửi ý tưởng (cần đăng nhập).
 *   POST {action:'vote', id}             → bật/tắt "Tôi cũng muốn" (cần đăng nhập).
 * Bảng: feature_requests, feature_votes (migration 20261018000100).
 */

type Row = { id: string; author_id: string; title: string; body: string; status: string; created_at: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(request: Request, status: number, vi: string, en: string, setupNeeded = false): Response {
  return Response.json({ error: msg(request, vi, en), ...(setupNeeded ? { setupNeeded: true } : {}) }, { status });
}

function dbFail(request: Request, error: { code?: string; message?: string }): Response {
  if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')) {
    return fail(request, 503, 'Mục này chưa được bật trên máy chủ. Cần áp dụng migration Supabase mới.', 'This feature is not enabled on the server yet. Apply the new Supabase migration.', true);
  }
  return fail(request, 500, 'Chưa tải được dữ liệu. Thử lại sau.', 'Could not load data. Please try again.');
}

async function userOf(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    return error || !data.user ? null : data.user.id;
  } catch {
    return null;
  }
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json();
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') ?? 'votes';
  const me = await userOf(request);
  const db = getSupabaseAdmin() as unknown as SupabaseClient;

  let query = db.from('feature_requests').select('id, author_id, title, body, status, created_at').eq('hidden', false).limit(300);
  if (sort === 'mine') {
    if (!me) return fail(request, 401, 'Đăng nhập để xem ý tưởng của bạn.', 'Sign in to see your ideas.');
    query = query.eq('author_id', me);
  }
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) return dbFail(request, error);
  const rows = (data ?? []) as Row[];
  const ids = rows.map((r) => r.id);

  const votes = new Map<string, number>();
  const mine = new Set<string>();
  if (ids.length) {
    const { data: vs, error: ve } = await db.from('feature_votes').select('request_id, user_id').in('request_id', ids);
    if (ve) return dbFail(request, ve);
    for (const v of (vs ?? []) as { request_id: string; user_id: string }[]) {
      votes.set(v.request_id, (votes.get(v.request_id) ?? 0) + 1);
      if (me && v.user_id === me) mine.add(v.request_id);
    }
  }

  const authors = [...new Set(rows.map((r) => r.author_id))].filter((id) => UUID.test(id));
  const names = new Map<string, string | null>();
  if (authors.length) {
    const { data: ps } = await db.from('profiles').select('id, display_name').in('id', authors);
    for (const p of (ps ?? []) as { id: string; display_name: string | null }[]) names.set(p.id, displayableName(p.display_name));
  }

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    status: r.status,
    createdAt: r.created_at,
    votes: votes.get(r.id) ?? 0,
    voted: mine.has(r.id),
    isMine: !!me && r.author_id === me,
    authorName: names.get(r.author_id) ?? 'Bạn học',
  }));
  if (sort === 'votes') items.sort((a, b) => b.votes - a.votes || (a.createdAt < b.createdAt ? 1 : -1));
  return Response.json({ items, signedIn: !!me });
}

export async function POST(request: Request): Promise<Response> {
  const me = await userOf(request);
  if (!me) return fail(request, 401, 'Đăng nhập để gửi ý tưởng.', 'Sign in to send an idea.');
  const input = await readJson(request);
  const db = getSupabaseAdmin() as unknown as SupabaseClient;

  if (input.action === 'create') {
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const body = typeof input.body === 'string' ? input.body.trim() : '';
    if (title.length < 3 || title.length > 120) return fail(request, 400, 'Tiêu đề cần từ 3 đến 120 ký tự.', 'The title needs 3 to 120 characters.');
    if (body.length > 1500) return fail(request, 400, 'Mô tả tối đa 1500 ký tự.', 'The description is at most 1500 characters.');
    const { error } = await db.from('feature_requests').insert({ author_id: me, title, body, status: 'new' });
    if (error) return dbFail(request, error);
    return Response.json({ ok: true }, { status: 201 });
  }

  if (input.action === 'vote') {
    const id = typeof input.id === 'string' ? input.id : '';
    if (!UUID.test(id)) return fail(request, 400, 'Ý tưởng không hợp lệ.', 'Invalid idea.');
    const { data: existing, error: se } = await db.from('feature_votes').select('user_id').eq('request_id', id).eq('user_id', me).maybeSingle();
    if (se) return dbFail(request, se);
    if (existing) {
      const { error } = await db.from('feature_votes').delete().eq('request_id', id).eq('user_id', me);
      if (error) return dbFail(request, error);
      return Response.json({ ok: true, voted: false });
    }
    const { error } = await db.from('feature_votes').insert({ request_id: id, user_id: me });
    if (error) return dbFail(request, error);
    return Response.json({ ok: true, voted: true });
  }

  return fail(request, 400, 'Thao tác không hợp lệ.', 'Unknown action.');
}

