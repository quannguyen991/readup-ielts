import { errorText } from '@/lib/server-locale';
import { isAssignmentKind } from '@/services/classes/assignments';
import { findCatalogItem } from '@/services/classes/catalog';
import { ASSIGNMENT_TITLE_MAX, MAX_ASSIGNMENTS_PER_CLASS, cleanName, parseDueOn } from '@/services/classes/rules';
import { ASSIGNMENT_COLUMNS, dbFail, fail, getClass, identify, readJson } from '@/services/classes/server';

/**
 * /api/classes/assignments — giáo viên giao bài.
 *
 * POST   { classId, kind, ref, title?, dueOn? } → giao một bài. `ref` phải là nội
 *        dung có thật trong danh mục (`services/classes/catalog.ts`); tiêu đề bỏ
 *        trống thì lấy tên nội dung.
 * DELETE { id } → gỡ bài giao.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;
    const body = await readJson<{ classId: unknown; kind: unknown; ref: unknown; title: unknown; dueOn: unknown }>(request);

    const { row: c, error } = await getClass(db, body.classId);
    if (error) return dbFail(request, error);
    if (!c || c.teacher_id !== userId) return fail(request, 404, 'Không tìm thấy lớp.', 'Class not found.');

    if (!isAssignmentKind(body.kind)) return fail(request, 400, 'Loại bài không hợp lệ.', 'Unknown assignment type.');
    const item = typeof body.ref === 'string' ? findCatalogItem(body.kind, body.ref) : undefined;
    if (!item) return fail(request, 400, 'Không tìm thấy nội dung này trong app.', "That content doesn't exist in the app.");

    const dueOn = parseDueOn(body.dueOn);
    if (dueOn === false) return fail(request, 400, 'Hạn nộp phải là ngày dạng YYYY-MM-DD.', 'Due date must be a YYYY-MM-DD date.');

    let title = item.title.vi;
    if (body.title !== undefined && body.title !== null && body.title !== '') {
      const t = cleanName(body.title, ASSIGNMENT_TITLE_MAX);
      if (!t) return fail(request, 400, `Tiêu đề tối đa ${ASSIGNMENT_TITLE_MAX} ký tự.`, `Title must be at most ${ASSIGNMENT_TITLE_MAX} characters.`);
      title = t;
    }

    const { count, error: cErr } = await db.from('class_assignments').select('id', { count: 'exact', head: true }).eq('class_id', c.id);
    if (cErr) return dbFail(request, cErr);
    if ((count ?? 0) >= MAX_ASSIGNMENTS_PER_CLASS) {
      return fail(request, 409, `Mỗi lớp tối đa ${MAX_ASSIGNMENTS_PER_CLASS} bài giao. Gỡ bớt bài cũ trước.`, `A class can hold ${MAX_ASSIGNMENTS_PER_CLASS} assignments. Remove old ones first.`);
    }

    const { data, error: iErr } = await db
      .from('class_assignments')
      .insert({ class_id: c.id, kind: body.kind, ref: item.ref, title: title.slice(0, ASSIGNMENT_TITLE_MAX), due_on: dueOn })
      .select(ASSIGNMENT_COLUMNS)
      .single();
    if (iErr) return dbFail(request, iErr);
    return Response.json({ assignment: data });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không giao được bài.', 'Could not create the assignment.') }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;
    const body = await readJson<{ id: unknown }>(request);
    if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)) return fail(request, 400, 'Thiếu mã bài giao.', 'Missing assignment id.');

    const { data: a, error } = await db.from('class_assignments').select('id, class_id').eq('id', body.id).maybeSingle();
    if (error) return dbFail(request, error);
    if (!a) return fail(request, 404, 'Không tìm thấy bài giao.', 'Assignment not found.');
    const { row: c, error: cErr } = await getClass(db, (a as { class_id: string }).class_id);
    if (cErr) return dbFail(request, cErr);
    if (!c || c.teacher_id !== userId) return fail(request, 404, 'Không tìm thấy bài giao.', 'Assignment not found.');

    const { error: dErr } = await db.from('class_assignments').delete().eq('id', body.id);
    if (dErr) return dbFail(request, dErr);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không gỡ được bài.', 'Could not remove the assignment.') }, { status: 500 });
  }
}
