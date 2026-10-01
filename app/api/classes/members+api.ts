import { errorText } from '@/lib/server-locale';
import { DISPLAY_NAME_MAX, cleanName } from '@/services/classes/rules';
import { dbFail, fail, getClass, identify, readJson } from '@/services/classes/server';

/**
 * /api/classes/members
 *
 * DELETE { classId }          → học sinh rời lớp
 * DELETE { classId, userId }  → giáo viên mời một học sinh ra khỏi lớp
 * PATCH  { classId, displayName } → học sinh đổi tên mình trong lớp
 */
export async function DELETE(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;
    const body = await readJson<{ classId: unknown; userId: unknown }>(request);
    const { row: c, error } = await getClass(db, body.classId);
    if (error) return dbFail(request, error);
    if (!c) return fail(request, 404, 'Không tìm thấy lớp.', 'Class not found.');

    const target = typeof body.userId === 'string' && body.userId ? body.userId : userId;
    if (target !== userId && c.teacher_id !== userId) return fail(request, 403, 'Chỉ giáo viên của lớp mới mời học sinh ra được.', 'Only the class teacher can remove students.');

    const { error: dErr } = await db.from('class_members').delete().eq('class_id', c.id).eq('user_id', target);
    if (dErr) return dbFail(request, dErr);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không thực hiện được.', 'Could not do that.') }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;
    const body = await readJson<{ classId: unknown; displayName: unknown }>(request);
    const name = cleanName(body.displayName, DISPLAY_NAME_MAX);
    if (!name || name.includes('@')) return fail(request, 400, `Tên trong lớp từ 1 tới ${DISPLAY_NAME_MAX} ký tự, không dùng email.`, `Your name must be 1–${DISPLAY_NAME_MAX} characters and not an email.`);
    const { row: c, error } = await getClass(db, body.classId);
    if (error) return dbFail(request, error);
    if (!c) return fail(request, 404, 'Không tìm thấy lớp.', 'Class not found.');
    const { data, error: uErr } = await db.from('class_members').update({ display_name: name }).eq('class_id', c.id).eq('user_id', userId).select('user_id');
    if (uErr) return dbFail(request, uErr);
    if (!data || data.length === 0) return fail(request, 404, 'Bạn không ở trong lớp này.', "You're not in this class.");
    return Response.json({ ok: true, displayName: name });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không lưu được.', 'Could not save.') }, { status: 500 });
  }
}
