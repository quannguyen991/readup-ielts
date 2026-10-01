/**
 * SERVER-ONLY. Phần dùng chung của `app/api/classes/**`.
 *
 * Ba bảng lớp học bật RLS mà không có policy (migration
 * `20261001000200_classes.sql`), nên mọi lượt đọc ghi ở đây dùng service key và
 * TỰ kiểm tra quyền: ai là giáo viên của lớp, ai là thành viên. Đừng import file
 * này từ code chạy trên trình duyệt.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { fetchAllPages } from '@/services/admin/fetch-all';
import { displayableName } from '@/services/gamification/display-name';

import type { Assignment, StudentData } from './assignments';

export type ClassRow = { id: string; code: string; name: string; teacher_id: string; archived: boolean; created_at: string };
export type MemberRow = { class_id: string; user_id: string; display_name: string; joined_at: string };
export type AssignmentRow = Assignment & { class_id: string };

export const CLASS_COLUMNS = 'id, code, name, teacher_id, archived, created_at';
export const ASSIGNMENT_COLUMNS = 'id, class_id, kind, ref, title, due_on, created_at';

export type Who = { db: SupabaseClient; userId: string };

/** Người gọi, từ access token ở header Authorization (giống các route khác). */
export async function identify(request: Request): Promise<{ ok: true; who: Who } | { ok: false; error: Response }> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return { ok: false, error: fail(request, 401, 'Cần đăng nhập.', 'Please sign in.') };
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { ok: false, error: fail(request, 401, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') };
  return { ok: true, who: { db: admin as unknown as SupabaseClient, userId: data.user.id } };
}

export function fail(request: Request, status: number, vi: string, en: string): Response {
  return Response.json({ error: msg(request, vi, en) }, { status });
}

/** Lỗi khi bảng chưa tạo (chưa chạy migration) — báo rõ thay vì lỗi khó hiểu. */
export function dbFail(request: Request, error: { message: string; code?: string }): Response {
  if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message)) {
    return Response.json(
      {
        error: msg(request, 'Tính năng Lớp học chưa được bật trên máy chủ.', 'Classes are not enabled on the server yet.'),
        setupNeeded: true,
      },
      { status: 503 },
    );
  }
  return Response.json({ error: error.message }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    const body = (await request.json()) as unknown;
    return body && typeof body === 'object' ? (body as Partial<T>) : {};
  } catch {
    return {};
  }
}

export async function getClass(db: SupabaseClient, id: unknown): Promise<{ row: ClassRow | null; error: { message: string; code?: string } | null }> {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return { row: null, error: null };
  const { data, error } = await db.from('classes').select(CLASS_COLUMNS).eq('id', id).maybeSingle();
  return { row: (data as ClassRow | null) ?? null, error };
}

/** Tên hiển thị trong hồ sơ — đã lọc kiểu "tên" giống email. null nếu không dùng được. */
export async function profileNames(db: SupabaseClient, ids: readonly string[]): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data } = await db.from('profiles').select('id, display_name').in('id', chunk);
    for (const p of (data ?? []) as { id: string; display_name: string | null }[]) out.set(p.id, displayableName(p.display_name));
  }
  return out;
}

/**
 * Dữ liệu học của các học sinh, CHỈ những nhánh payload cần cho bảng tiến độ
 * (PostgREST cắt bằng `payload->nhánh`, khỏi kéo cả sổ từ vài trăm KB mỗi em).
 * Đọc theo nhóm 100 người và theo trang 1.000 dòng (`fetchAllPages`).
 */
export async function loadStudentData(db: SupabaseClient, userIds: readonly string[], extra: readonly ('math' | 'speaking')[]): Promise<{ data: Map<string, StudentData>; error: { message: string } | null }> {
  const data = new Map<string, StudentData>();
  for (const id of userIds) data.set(id, { synced: false });

  type Spec = { key: string; select: string; put: (d: StudentData, row: Record<string, unknown>) => void };
  const specs: Spec[] = [
    { key: 'study', select: 'user_id, daily:payload->daily', put: (d, r) => (d.study = { daily: (r.daily as never) ?? null }) },
    {
      key: 'topic_study',
      select: 'user_id, stages:payload->stages, lastAt:payload->lastAt',
      put: (d, r) => (d.topicStudy = { stages: (r.stages as never) ?? null, lastAt: (r.lastAt as never) ?? null }),
    },
    { key: 'sat_roadmap', select: 'user_id, progress:payload->progress', put: (d, r) => (d.satRoadmap = { progress: (r.progress as never) ?? null }) },
  ];
  if (extra.includes('math')) specs.push({ key: 'math', select: 'user_id, sessions:payload->sessions', put: (d, r) => (d.math = { sessions: Array.isArray(r.sessions) ? (r.sessions as never) : [] }) });
  if (extra.includes('speaking')) specs.push({ key: 'speaking', select: 'user_id, attempts:payload->attempts', put: (d, r) => (d.speaking = { attempts: Array.isArray(r.attempts) ? (r.attempts as never) : [] }) });

  for (let i = 0; i < userIds.length; i += 100) {
    const chunk = userIds.slice(i, i + 100);

    // Ai đã từng đồng bộ (có ít nhất một khoá bất kỳ).
    const any = await fetchAllPages<{ user_id: string; store_key: string }>((from, to) =>
      db.from('user_state').select('user_id, store_key').in('user_id', chunk).order('user_id').order('store_key').range(from, to),
    );
    if (any.error) return { data, error: any.error };
    for (const r of any.rows) {
      const d = data.get(r.user_id);
      if (d) d.synced = true;
    }

    for (const spec of specs) {
      const got = await fetchAllPages<Record<string, unknown>>((from, to) =>
        db.from('user_state').select(spec.select).eq('store_key', spec.key).in('user_id', chunk).order('user_id').range(from, to) as never,
      );
      if (got.error) return { data, error: got.error };
      for (const row of got.rows) {
        const d = data.get(String(row.user_id));
        if (d) spec.put(d, row);
      }
    }
  }
  return { data, error: null };
}
