import { getArticleById, isReadable } from '@/data/articles';
import { AiError } from '@/services/ai/errors';
import { generateQuestionsWithClaude } from '@/services/ai/questions';
import type { QuestionType } from '@/types/database';

/**
 * POST /api/questions  { articleId, count?, focusType? }
 *
 * Chạy server-side để ANTHROPIC_API_KEY không xuống client.
 * Client gọi route này trước; nếu lỗi (chưa có key, mạng hỏng…) thì tự rơi về
 * bộ sinh đề offline nên luôn có đề để làm.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      articleId?: string;
      count?: number;
      focusType?: QuestionType;
    };

    if (!body.articleId) {
      return Response.json({ error: 'Thiếu articleId.' }, { status: 400 });
    }

    const article = getArticleById(body.articleId);
    if (!article) {
      return Response.json({ error: 'Không tìm thấy bài đọc.' }, { status: 404 });
    }

    if (!isReadable(article)) {
      return Response.json(
        {
          error:
            'Bài này thuộc nguồn có bản quyền (chỉ lưu tiêu đề), không sinh đề được. Mở link gốc để đọc.',
        },
        { status: 422 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'Chưa cấu hình ANTHROPIC_API_KEY.', code: 'missing_config' },
        { status: 503 },
      );
    }

    const questionSet = await generateQuestionsWithClaude(
      { id: article.id, title: article.title, paragraphs: article.paragraphs },
      {
        count: body.count ?? 12,
        ...(body.focusType ? { focusType: body.focusType } : {}),
      },
    );

    return Response.json(questionSet);
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: err.message, code: err.code }, { status: err.status ?? 502 });
    }
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    return Response.json({ error: message }, { status: 500 });
  }
}
