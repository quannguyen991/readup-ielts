import { getWritingPromptById } from '@/data/writing-repository';
import { countWords } from '@/lib/writing/word-count';
import { AiError } from '@/services/ai/errors';
import { evaluateWriting } from '@/services/ai/writing-evaluator';

/**
 * POST /api/writing/evaluate  { promptId, bodyText }
 *
 * Chạy server-side để khoá không xuống client.
 *
 * Client gọi route này sau khi nộp bài; nếu hỏng (chưa cấu hình khoá, mạng lỗi,
 * model trả rác) thì màn kết quả vẫn hiển thị được nhờ bộ phân tích offline
 * chạy ngay trên máy — cùng khuôn với `app/api/questions+api.ts`.
 */

/** Chặn bài quá dài: 3000 từ là gấp mười lần một bài Task 2 hợp lệ. */
const MAX_WORDS = 3000;

export async function POST(request: Request): Promise<Response> {
  try {
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

    const result = await evaluateWriting({ prompt, bodyText: text });
    return Response.json(result);
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: err.message, code: err.code }, { status: 502 });
    }
    return Response.json({ error: 'Lỗi không xác định khi chấm bài.' }, { status: 500 });
  }
}
