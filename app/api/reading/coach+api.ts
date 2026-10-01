import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { coachReading, type WrongAnswer } from '@/services/ai/reading-coach';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/reading/coach
 * body: { articleTitle, total, correct, wrong: WrongAnswer[] }
 *
 * Nhận xét chiến lược làm bài từ những câu đã sai.
 *
 * BỐN ĐIỂM, theo thứ tự quan trọng:
 *
 * 1. Cần đăng nhập, và HẠN MỨC ĐẾM Ở MÁY CHỦ. Mỗi lượt là tiền thật; bộ đếm ở
 *    trình duyệt chỉ để hiện số, không chặn được ai.
 * 2. Cộng lượt TRƯỚC khi gọi AI. Cộng sau thì bấm rồi huỷ liên tục là cách khai
 *    thác đơn giản nhất. Hỏng thật thì `refundAiCall` trả lại.
 * 3. Nội dung câu hỏi do CLIENT gửi lên — và điều đó chấp nhận được ở đây: dữ
 *    liệu này vốn nằm trong bundle mà ai cũng đọc được, và bịa nội dung chỉ làm
 *    hỏng nhận xét của chính người bịa. Không có gì để chiếm đoạt.
 * 4. KHÔNG có câu sai nào thì không gọi AI. Trả về lời chúc mừng và giữ lại
 *    lượt — tính tiền một lượt để nói "bạn làm đúng hết" là vô lý.
 */

const MAX_WRONG = 20;

export async function POST(request: Request): Promise<Response> {
  const admin = getSupabaseAdmin();
  let userId = '';

  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json(
        { error: msg(request, 'Đăng nhập để nhận nhận xét chiến lược từ AI.', 'Sign in to get AI strategy feedback.') },
        { status: 401 },
      );
    }

    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }
    userId = auth.user.id;

    const body = (await request.json()) as {
      articleTitle?: unknown;
      total?: unknown;
      correct?: unknown;
      wrong?: unknown;
    };

    const wrong = (Array.isArray(body.wrong) ? body.wrong : [])
      .filter((w): w is WrongAnswer => {
        const item = w as Partial<WrongAnswer>;
        return (
          typeof item?.questionId === 'string' &&
          typeof item.prompt === 'string' &&
          typeof item.correctAnswer === 'string'
        );
      })
      // Cắt trần số câu gửi lên: một lượt full test có thể 40 câu, và gửi hết
      // vừa chậm vừa loãng — mẫu hình lỗi lộ ra từ mươi câu là đủ.
      .slice(0, MAX_WRONG);

    if (wrong.length === 0) {
      return Response.json({
        skipped: true,
        message: msg(
          request,
          'Lượt này bạn không sai câu nào — chưa có gì để phân tích.',
          'You got every question right this time — nothing to analyse yet.',
        ),
      });
    }

    const verdict = await consumeAiCall(admin, userId, request);
    if (!verdict.allowed) {
      return Response.json(
        { error: verdict.message, used: verdict.used, limit: verdict.limit, plan: verdict.plan },
        { status: 429 },
      );
    }

    try {
      const coaching = await coachReading({
        articleTitle: typeof body.articleTitle === 'string' ? body.articleTitle : 'Bài đọc',
        total: Number(body.total) || wrong.length,
        correct: Number(body.correct) || 0,
        wrong,
      });

      return Response.json({
        coaching,
        usage: { used: verdict.used, limit: verdict.limit, plan: verdict.plan },
      });
    } catch (aiError) {
      // AI hỏng là lỗi của ta, không phải của người dùng — trả lại lượt.
      await refundAiCall(admin, userId);
      throw aiError;
    }
  } catch (err) {
    const message = errorText(request, err, 'Lỗi không xác định', 'Unknown error');
    return Response.json({ error: message }, { status: 500 });
  }
}
