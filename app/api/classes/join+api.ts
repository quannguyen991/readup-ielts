import { errorText } from '@/lib/server-locale';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isValidClassCode, normalizeClassCode } from '@/services/classes/code';
import { DISPLAY_NAME_MAX, MAX_MEMBERS_PER_CLASS, cleanName } from '@/services/classes/rules';
import { CLASS_COLUMNS, dbFail, fail, identify, profileNames, readJson, type ClassRow } from '@/services/classes/server';
import { anonymousName } from '@/services/gamification/display-name';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * /api/classes/join — vào lớp bằng mã.
 *
 * GET  ?code=ABC234 → tên lớp và tên giáo viên, để học sinh thấy mình sắp vào
 *                     lớp nào. KHÔNG cần đăng nhập (người bấm link mời thường
 *                     chưa đăng nhập); không trả danh sách học sinh hay số liệu.
 *                     Có token thì kèm `member` / `isTeacher`.
 * POST { code, displayName? } → vào lớp. Tên mặc định là tên trong hồ sơ.
 */
async function findByCode(db: SupabaseClient, raw: unknown): Promise<{ row: ClassRow | null; error: { message: string; code?: string } | null; valid: boolean }> {
  const code = normalizeClassCode(String(raw ?? ''));
  if (!isValidClassCode(code)) return { row: null, error: null, valid: false };
  const { data, error } = await db.from('classes').select(CLASS_COLUMNS).eq('code', code).maybeSingle();
  return { row: (data as ClassRow | null) ?? null, error, valid: true };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const db = getSupabaseAdmin() as unknown as SupabaseClient;
    const found = await findByCode(db, new URL(request.url).searchParams.get('code'));
    if (!found.valid) return fail(request, 400, 'Mã lớp gồm 6 ký tự (chữ và số).', 'A class code is 6 letters and digits.');
    if (found.error) return dbFail(request, found.error);
    if (!found.row || found.row.archived) return fail(request, 404, 'Không có lớp nào mang mã này.', 'No class has this code.');

    const names = await profileNames(db, [found.row.teacher_id]);
    let member = false;
    let isTeacher = false;
    if (request.headers.get('authorization')) {
      const id = await identify(request);
      if (id.ok) {
        isTeacher = id.who.userId === found.row.teacher_id;
        const { data } = await db.from('class_members').select('user_id').eq('class_id', found.row.id).eq('user_id', id.who.userId).maybeSingle();
        member = !!data;
      }
    }
    return Response.json({ class: { id: found.row.id, name: found.row.name, teacherName: names.get(found.row.teacher_id) ?? null }, member, isTeacher });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không tra được mã lớp.', 'Could not look up the class code.') }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;
    const body = await readJson<{ code: unknown; displayName: unknown }>(request);
    const found = await findByCode(db, body.code);
    if (!found.valid) return fail(request, 400, 'Mã lớp gồm 6 ký tự (chữ và số).', 'A class code is 6 letters and digits.');
    if (found.error) return dbFail(request, found.error);
    const c = found.row;
    if (!c || c.archived) return fail(request, 404, 'Không có lớp nào mang mã này.', 'No class has this code.');
    if (c.teacher_id === userId) return fail(request, 409, 'Đây là lớp của bạn — giáo viên không cần vào lớp.', "This is your own class — teachers don't need to join.");

    const { data: existing } = await db.from('class_members').select('user_id').eq('class_id', c.id).eq('user_id', userId).maybeSingle();
    if (existing) return Response.json({ class: { id: c.id, name: c.name }, already: true });

    const { count, error: cErr } = await db.from('class_members').select('user_id', { count: 'exact', head: true }).eq('class_id', c.id);
    if (cErr) return dbFail(request, cErr);
    if ((count ?? 0) >= MAX_MEMBERS_PER_CLASS) {
      return fail(request, 409, `Lớp đã đủ ${MAX_MEMBERS_PER_CLASS} học sinh.`, `This class is full (${MAX_MEMBERS_PER_CLASS} students).`);
    }

    let displayName: string | null = null;
    if (body.displayName !== undefined && body.displayName !== null && body.displayName !== '') {
      displayName = cleanName(body.displayName, DISPLAY_NAME_MAX);
      if (!displayName) return fail(request, 400, `Tên trong lớp từ 1 tới ${DISPLAY_NAME_MAX} ký tự.`, `Your name in class must be 1–${DISPLAY_NAME_MAX} characters.`);
      if (displayName.includes('@')) return fail(request, 400, 'Đừng dùng email làm tên trong lớp.', "Please don't use an email address as your name.");
    }
    if (!displayName) displayName = (await profileNames(db, [userId])).get(userId) ?? anonymousName(userId);

    const { error } = await db.from('class_members').insert({ class_id: c.id, user_id: userId, display_name: displayName });
    if (error && error.code !== '23505') return dbFail(request, error);
    return Response.json({ class: { id: c.id, name: c.name }, already: false });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không vào được lớp.', 'Could not join the class.') }, { status: 500 });
  }
}
