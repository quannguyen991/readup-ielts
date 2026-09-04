import { getWritingPromptById } from '@/data/writing-repository';
import { countWords } from '@/lib/writing/word-count';
import { AiError } from '@/services/ai/errors';
import { evaluateWriting } from '@/services/ai/writing-evaluator';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/writing/evaluate  { promptId, bodyText }
 *
 * Chạy server-side để khoá không xuống client.
 *
 * Client gọi route này sau khi nộp bài; nếu hỏng (chưa cấu hình khoá, mạng lỗi,
 * model trả rác) thì màn kết quả vẫn hiển thị được nhờ bộ phân tích offline
 * chạy ngay trên máy — cùng khuôn với `app/api/questions+api.ts`.
 *
 * CẦN ĐĂNG NHẬP VÀ TRỪ HẠN MỨC Ở MÁY CHỦ. Bản đầu của route này không kiểm gì
 * cả: ai biết địa chỉ cũng gọi được, không cần tài khoản, không giới hạn — và
 * mỗi lượt chấm là một lời gọi AI tốn tiền thật. Bộ đếm trong `useBillingStore`
 * nằm ở trình duyệt của chính người dùng nên nó không chặn được ai.
 *
 * Bài viết vẫn được chấm bằng bộ phân tích offline khi hết hạn mức, nên người
 * dùng không bị bỏ trắng — họ chỉ mất phần nhận xét của AI.
 */

/** Chặn bài quá dài: 3000 từ là gấp mười lần một bài Task 2 hợp lệ. */
const MAX_WORDS = 3000;

export async function POST(request: Request): Promise<Response> {
  const admin = getSupabaseAdmin();
  let userId = '';

  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json(
        { error: 'Đăng nhập để chấm bài bằng AI. Nhận xét offline vẫn dùng được khi chưa đăng nhập.' },
        { status: 401 },
      );
    }
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 });
    }
    userId = auth.user.id;

    const body = (await request.json()) as { promptId?: string; bodyText?: string };

    if (!body.promptId) {
      return Response.json({ error: 'Thiếu promptId.' }, { status: 400 });
    }
    const text = (body.bodyText ?? '').trim();
    if (text === '') {
      return Response.json({ error: 'Bài viết đang trống.' }, { status: 400 });
    }

    const words = countWords(text);
    if (words > MAX_WORDS) {
      return Response.json(
        { error: `Bài dài ${words} từ, vượt giới hạn ${MAX_WORDS} từ.` },
        { status: 413 },
      );
    }

    const prompt = getWritingPromptById(body.promptId);
    if (!prompt) {
      return Response.json({ error: 'Không tìm thấy đề.' }, { status: 404 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error:
            'Chưa cấu hình OPENAI_API_KEY nên không chấm bằng AI được. Phần phân tích nhanh vẫn dùng bình thường.',
          code: 'missing_config',
        },
        { status: 503 },
      );
    }

    // Trừ hạn mức TRƯỚC khi gọi AI. Trừ sau thì bấm rồi huỷ liên tục là cách
    // khai thác đơn giản nhất; hỏng thật thì hoàn lại ngay bên dưới.
    const verdict = await consumeAiCall(admin, userId);
    if (!verdict.allowed) {
      return Response.json(
        {
          error: verdict.message,
          code: 'quota_exceeded',
          used: verdict.used,
          limit: verdict.limit,
          plan: verdict.plan,
        },
        { status: 429 },
      );
    }

    try {
      const result = await evaluateWriting({ prompt, bodyText: text });
      return Response.json({
        ...result,
        usage: { used: verdict.used, limit: verdict.limit, plan: verdict.plan },
      });
    } catch (aiError) {
      // Cả hai proxy hỏng là lỗi của ta, không phải của người dùng.
      await refundAiCall(admin, userId);
      throw aiError;
    }
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: err.message, code: err.code }, { status: 502 });
    }
    return Response.json({ error: 'Lỗi không xác định khi chấm bài.' }, { status: 500 });
  }
}
