import { errorText } from '@/lib/server-locale';
import { fetchAllPages } from '@/services/admin/fetch-all';
import { storesNeeded, type Assignment } from '@/services/classes/assignments';
import { deckWords } from '@/services/classes/catalog';
import { summarizeStudent } from '@/services/classes/progress';
import { ASSIGNMENT_COLUMNS, dbFail, fail, getClass, identify, loadStudentData, profileNames, type AssignmentRow, type MemberRow } from '@/services/classes/server';

/**
 * GET /api/classes/detail?id=… — một lớp.
 *
 * Giáo viên của lớp: thông tin lớp, bài giao, và TÓM TẮT tiến độ từng học sinh
 * (chỉ số đếm, `services/classes/progress.ts`) — không payload thô, không email.
 * Học sinh trong lớp: tên lớp, tên giáo viên, bài giao (máy học sinh tự tính
 * phần đã xong từ dữ liệu trên máy, mới hơn bản đã đồng bộ).
 * Người ngoài: 404, như lớp không tồn tại.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const id = await identify(request);
    if (!id.ok) return id.error;
    const { db, userId } = id.who;
    const { row: c, error } = await getClass(db, new URL(request.url).searchParams.get('id'));
    if (error) return dbFail(request, error);
    if (!c) return fail(request, 404, 'Không tìm thấy lớp.', 'Class not found.');

    const { data: asg, error: aErr } = await db.from('class_assignments').select(ASSIGNMENT_COLUMNS).eq('class_id', c.id).order('created_at', { ascending: false }).limit(500);
    if (aErr) return dbFail(request, aErr);
    const assignments: Assignment[] = ((asg ?? []) as AssignmentRow[]).map((a) => ({ id: a.id, kind: a.kind, ref: a.ref, title: a.title, due_on: a.due_on, created_at: a.created_at }));

    if (c.teacher_id !== userId) {
      const { data: me } = await db.from('class_members').select('display_name, joined_at').eq('class_id', c.id).eq('user_id', userId).maybeSingle();
      if (!me) return fail(request, 404, 'Không tìm thấy lớp.', 'Class not found.');
      const names = await profileNames(db, [c.teacher_id]);
      return Response.json({
        role: 'student',
        class: { id: c.id, name: c.name, archived: c.archived, teacherName: names.get(c.teacher_id) ?? null },
        me: { displayName: (me as { display_name: string }).display_name, joinedAt: (me as { joined_at: string }).joined_at },
        assignments,
      });
    }

    const got = await fetchAllPages<MemberRow>((from, to) =>
      db.from('class_members').select('class_id, user_id, display_name, joined_at').eq('class_id', c.id).order('joined_at').order('user_id').range(from, to),
    );
    if (got.error) return dbFail(request, got.error);
    const members = got.rows;

    const loaded = await loadStudentData(
      db,
      members.map((m) => m.user_id),
      storesNeeded(assignments.map((a) => a.kind)),
    );
    if (loaded.error) return dbFail(request, loaded.error);

    const now = Date.now();
    return Response.json({
      role: 'teacher',
      class: { id: c.id, code: c.code, name: c.name, archived: c.archived, createdAt: c.created_at },
      assignments,
      generatedAt: new Date(now).toISOString(),
      members: members.map((m) => ({
        userId: m.user_id,
        displayName: m.display_name,
        joinedAt: m.joined_at,
        summary: summarizeStudent(loaded.data.get(m.user_id) ?? { synced: false }, assignments, now, { deckWords }),
      })),
    });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không đọc được lớp.', 'Could not load the class.') }, { status: 500 });
  }
}
