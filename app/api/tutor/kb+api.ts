import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { AiError } from '@/services/ai/errors';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { askKnowledgeBase } from '@/services/tutor/knowledge-base';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/tutor/kb
 * body: { question: string, history?: [{role, content}] }
 *
 * Hỏi đáp trên CẢ KHO bài đọc (LightRAG ở HoaiDuc). Xem `services/tutor/knowledge-base`
 * để biết vì sao việc này tách khỏi `/api/chat` và `/api/ask`.
 *
 * BẢO MẬT + TÍNH TIỀN giống hệt `/api/reading/coach`: một lượt là tiền thật, nên
 *   1. Bắt đăng nhập, hạn mức đếm Ở MÁY CHỦ (bộ đếm trình duyệt không chặn được ai).
 *   2. Cộng lượt TRƯỚC khi gọi; hỏng thì `refundAiCall` trả lại — nếu không, bấm
 *      rồi huỷ liên tục là cách khai thác đơn giản nhất.
 *
 * KHÁC coach một điểm: khi kho tri thức (máy HoaiDuc/tunnel) không gọi được, đây
 * KHÔNG phải lỗi người dùng gây ra, nên trả lượt và báo một lỗi có nội dung. Phía
 * ReadUp bắt lỗi này thì rơi về `/api/ask` (hỏi đáp chung, không grounded) để
 * người dùng không gặp màn trắng.
 */

export async function POST(request: Request): Promise<Response> {
  const admin = getSupabaseAdmin();
  let userId = '';

  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json({ error: msg(request, 'Đăng nhập để hỏi đáp trên cả kho bài đọc.', 'Sign in to ask questions across the whole reading library.') }, { status: 401 });
    }

    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }
    userId = auth.user.id;

    const body = (await request.json()) as {
      question?: unknown;
      history?: unknown;
    };

    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!question) {
      return Response.json({ error: msg(request, 'Chưa có câu hỏi nào.', 'No question yet.') }, { status: 400 });
    }

    const history = (Array.isArray(body.history) ? body.history : []).filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        !!m &&
        typeof (m as { content?: unknown }).content === 'string' &&
        ((m as { role?: unknown }).role === 'user' || (m as { role?: unknown }).role === 'assistant'),
    );

    const verdict = await consumeAiCall(admin, userId, request);
    if (!verdict.allowed) {
      return Response.json(
        { error: verdict.message, used: verdict.used, limit: verdict.limit, plan: verdict.plan },
        { status: 429 },
      );
    }

    try {
      const answer = await askKnowledgeBase({ question, history });
      return Response.json({
        text: answer.text,
        sources: answer.sources,
        usage: { used: verdict.used, limit: verdict.limit, plan: verdict.plan },
      });
    } catch (kbError) {
      // Kho tri thức hỏng là lỗi của ta, không phải của người dùng — trả lại lượt.
      await refundAiCall(admin, userId);
      const code = kbError instanceof AiError ? kbError.code : 'server_error';
      const message = errorText(request, kbError, 'Kho tri thức không phản hồi.', 'The knowledge base is not responding.');
      // 503: phía ReadUp hiểu đây là tín hiệu rơi về `/api/ask`.
      return Response.json({ error: message, code }, { status: 503 });
    }
  } catch (err) {
    const message = errorText(request, err, 'Lỗi không xác định', 'Unknown error');
    return Response.json({ error: message }, { status: 500 });
  }
}
