import { errorText } from '@/lib/server-locale';
import { fetchAllPages } from '@/services/admin/fetch-all';
import { generateClassCode } from '@/services/classes/code';
import { CLASS_NAME_MAX, MAX_ACTIVE_CLASSES_PER_TEACHER, cleanName } from '@/services/classes/rules';
import {
  ASSIGNMENT_COLUMNS,
  CLASS_COLUMNS,
  dbFail,
  fail,
  getClass,
  identify,
  profileNames,
  readJson,
  type AssignmentRow,
  type ClassRow,
  type MemberRow,
} from '@/services/classes/server';

/**
 * /api/classes — lớp của tôi.
 *
 * GET    → { teaching: lớp tôi dạy (kèm số học sinh), joined: lớp tôi học (kèm bài giao) }
 * POST   { name }                → tạo lớp, trả mã lớp
 * PATCH  { id, name?, archived? } → giáo viên đổi tên / lưu trữ lớp
 * DELETE { id }                  → giáo viên xoá hẳn lớp (thành viên, bài giao đi theo)
 *
 * Học sinh KHÔNG thấy danh sách bạn cùng lớp, chỉ thấy tên lớp, tên giáo viên
 * và bài giao.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;

    const { data: teachingRows, error: tErr } = await db
      .from('classes')
      .select(CLASS_COLUMNS)
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);
    if (tErr) return dbFail(request, tErr);
    const teaching = (teachingRows ?? []) as ClassRow[];

    const counts = new Map<string, number>();
    if (teaching.length > 0) {
      const ids = teaching.map((c) => c.id);
      const got = await fetchAllPages<{ class_id: string }>((from, to) =>
        db.from('class_members').select('class_id, user_id').in('class_id', ids).order('class_id').order('user_id').range(from, to),
      );
      if (got.error) return dbFail(request, got.error);
      for (const r of got.rows) counts.set(r.class_id, (counts.get(r.class_id) ?? 0) + 1);
    }

    const { data: myRows, error: mErr } = await db.from('class_members').select('class_id, user_id, display_name, joined_at').eq('user_id', userId).limit(500);
    if (mErr) return dbFail(request, mErr);
    const memberships = (myRows ?? []) as MemberRow[];

    let joined: unknown[] = [];
    if (memberships.length > 0) {
      const classIds = memberships.map((m) => m.class_id);
      const { data: cls, error: cErr } = await db.from('classes').select(CLASS_COLUMNS).in('id', classIds);
      if (cErr) return dbFail(request, cErr);
      const { data: asg, error: aErr } = await db
        .from('class_assignments')
        .select(ASSIGNMENT_COLUMNS)
        .in('class_id', classIds)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (aErr) return dbFail(request, aErr);
      const classes = (cls ?? []) as ClassRow[];
      const teacherNames = await profileNames(db, [...new Set(classes.map((c) => c.teacher_id))]);
      joined = memberships
        .map((m) => {
          const c = classes.find((x) => x.id === m.class_id);
          if (!c) return null;
          return {
            id: c.id,
            name: c.name,
            archived: c.archived,
            teacherName: teacherNames.get(c.teacher_id) ?? null,
            displayName: m.display_name,
            joinedAt: m.joined_at,
            assignments: ((asg ?? []) as AssignmentRow[]).filter((a) => a.class_id === c.id).map(stripClass),
          };
        })
        .filter(Boolean);
    }

    return Response.json({
      teaching: teaching.map((c) => ({ id: c.id, code: c.code, name: c.name, archived: c.archived, createdAt: c.created_at, memberCount: counts.get(c.id) ?? 0 })),
      joined,
    });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không đọc được danh sách lớp.', 'Could not load your classes.') }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;
    const body = await readJson<{ name: unknown }>(request);
    const name = cleanName(body.name, CLASS_NAME_MAX);
    if (!name) return fail(request, 400, `Tên lớp từ 1 tới ${CLASS_NAME_MAX} ký tự.`, `Class name must be 1–${CLASS_NAME_MAX} characters.`);

    const { count, error: cErr } = await db.from('classes').select('id', { count: 'exact', head: true }).eq('teacher_id', userId).eq('archived', false);
    if (cErr) return dbFail(request, cErr);
    if ((count ?? 0) >= MAX_ACTIVE_CLASSES_PER_TEACHER) {
      return fail(
        request,
        409,
        `Mỗi giáo viên mở tối đa ${MAX_ACTIVE_CLASSES_PER_TEACHER} lớp. Lưu trữ bớt lớp cũ rồi tạo lớp mới.`,
        `You can have at most ${MAX_ACTIVE_CLASSES_PER_TEACHER} open classes. Archive an old one first.`,
      );
    }

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data, error } = await db
        .from('classes')
        .insert({ code: generateClassCode(), name, teacher_id: userId })
        .select(CLASS_COLUMNS)
        .single();
      if (!error && data) {
        const c = data as ClassRow;
        return Response.json({ class: { id: c.id, code: c.code, name: c.name, archived: c.archived, createdAt: c.created_at, memberCount: 0 } });
      }
      // 23505 = trùng mã lớp — hiếm, sinh mã khác là xong.
      if (error && error.code !== '23505') return dbFail(request, error);
    }
    return fail(request, 503, 'Không sinh được mã lớp chưa trùng. Thử lại sau ít phút.', "Couldn't generate a unique class code. Try again shortly.");
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không tạo được lớp.', 'Could not create the class.') }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;
    const body = await readJson<{ id: unknown; name: unknown; archived: unknown }>(request);
    const { row, error } = await getClass(db, body.id);
    if (error) return dbFail(request, error);
    if (!row || row.teacher_id !== userId) return fail(request, 404, 'Không tìm thấy lớp.', 'Class not found.');

    const patch: Partial<Pick<ClassRow, 'name' | 'archived'>> = {};
    if (body.name !== undefined) {
      const name = cleanName(body.name, CLASS_NAME_MAX);
      if (!name) return fail(request, 400, `Tên lớp từ 1 tới ${CLASS_NAME_MAX} ký tự.`, `Class name must be 1–${CLASS_NAME_MAX} characters.`);
      patch.name = name;
    }
    if (typeof body.archived === 'boolean') {
      if (!body.archived && row.archived) {
        const { count } = await db.from('classes').select('id', { count: 'exact', head: true }).eq('teacher_id', userId).eq('archived', false);
        if ((count ?? 0) >= MAX_ACTIVE_CLASSES_PER_TEACHER) {
          return fail(request, 409, `Đang mở đủ ${MAX_ACTIVE_CLASSES_PER_TEACHER} lớp.`, `You already have ${MAX_ACTIVE_CLASSES_PER_TEACHER} open classes.`);
        }
      }
      patch.archived = body.archived;
    }
    if (Object.keys(patch).length === 0) return fail(request, 400, 'Không có gì để đổi.', 'Nothing to change.');

    const { error: uErr } = await db.from('classes').update(patch).eq('id', row.id).eq('teacher_id', userId);
    if (uErr) return dbFail(request, uErr);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không lưu được.', 'Could not save.') }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;
    const body = await readJson<{ id: unknown }>(request);
    const { row, error } = await getClass(db, body.id);
    if (error) return dbFail(request, error);
    if (!row || row.teacher_id !== userId) return fail(request, 404, 'Không tìm thấy lớp.', 'Class not found.');
    const { error: dErr } = await db.from('classes').delete().eq('id', row.id).eq('teacher_id', userId);
    if (dErr) return dbFail(request, dErr);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không xoá được lớp.', 'Could not delete the class.') }, { status: 500 });
  }
}

function stripClass(a: AssignmentRow) {
  return { id: a.id, kind: a.kind, ref: a.ref, title: a.title, due_on: a.due_on, created_at: a.created_at };
}
