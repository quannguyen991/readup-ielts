import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { errorText, msg } from '@/lib/server-locale';
import { TOEFL_WRITING } from '@/data/intl/writing';
import { TOEIC_WRITING } from '@/data/intl/writing';
import { chatWithFallback } from '@/services/ai/fallback';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { buildGradeMessages, parseIntlGrade } from '@/services/intl/grading';

/**
 * POST /api/intl/grade  body: { exam: 'toeic' | 'toefl', taskId, text }
 *
 * Chấm bài Viết TOEIC/TOEFL bằng AI. TẮT MẶC ĐỊNH: chỉ chạy khi máy chủ có
 * `INTL_AI_GRADING=1`, vì mỗi lượt là tiền thật. Đăng nhập bắt buộc, và lượt được
 * trừ ở máy chủ trước khi gọi AI, như các tính năng AI khác.
 */

const MAX_TEXT = 4000;

export async function POST(request: Request): Promise<Response> {
  if (process.env.INTL_AI_GRADING !== '1') {
    return Response.json(
      { error: msg(request, 'Chấm bằng AI chưa được bật trên máy chủ.', 'AI grading is not enabled on the server.') },
      { status: 503 },
    );
  }

  const admin = getSupabaseAdmin();
  let userId = '';
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json({ error: msg(request, 'Đăng nhập để chấm bài bằng AI.', 'Sign in to grade with AI.') }, { status: 401 });
    }
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }
    userId = auth.user.id;

    const body = (await request.json()) as { exam?: unknown; taskId?: unknown; text?: unknown };
    const exam = body.exam === 'toeic' || body.exam === 'toefl' ? body.exam : null;
    const taskId = typeof body.taskId === 'string' ? body.taskId : '';
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT) : '';
    const task = exam === 'toeic'
      ? TOEIC_WRITING.find((t) => t.id === taskId)
      : exam === 'toefl'
        ? TOEFL_WRITING.find((t) => t.id === taskId)
        : undefined;
    if (!exam || !task) {
      return Response.json({ error: msg(request, 'Không tìm thấy bài viết này.', 'This writing task does not exist.') }, { status: 400 });
    }
    if (text.length < 20) {
      return Response.json({ error: msg(request, 'Bài còn quá ngắn để chấm.', 'The response is too short to grade.') }, { status: 400 });
    }

    const verdict = await consumeAiCall(admin, userId, request);
    if (!verdict.allowed) {
      return Response.json({ error: verdict.message, used: verdict.used, limit: verdict.limit, plan: verdict.plan }, { status: 429 });
    }

    try {
      const { system, user } = buildGradeMessages({
        exam,
        title: task.title.vi,
        prompt: task.prompt,
        minWords: task.minWords,
        checklist: task.checklist.map((c) => c.vi),
        text,
      });
      const result = await chatWithFallback({ system, user, temperature: 0.2, purpose: 'writing' });
      const grade = parseIntlGrade(result.text);
      return Response.json({ grade, usage: { used: verdict.used, limit: verdict.limit, plan: verdict.plan } });
    } catch (aiError) {
      await refundAiCall(admin, userId);
      throw aiError;
    }
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Lỗi khi chấm bài', 'Grading failed') }, { status: 500 });
  }
}
