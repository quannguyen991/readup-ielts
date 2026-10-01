import { getWritingPromptById } from '@/data/writing-repository';
import { AiError } from '@/services/ai/errors';
import { generateModelEssay } from '@/services/ai/model-essay';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/writing/model-essay  { promptId, targetBand }
 *
 * Soạn bài mẫu theo yêu cầu rồi chấm ngược chính nó. Sinh theo yêu cầu chứ
 * không sinh sẵn cả kho: 60 đề × 3 mức band là 180 bài, mỗi bài tốn ba lượt gọi
 * model — tốn tiền cho phần lớn bài chẳng ai mở ra xem. Client tự lưu lại bài
 * đã sinh nên chỉ tốn một lần cho mỗi đề.
 */

const ALLOWED_BANDS = [6, 7, 8];

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { promptId?: string; targetBand?: number };

    if (!body.promptId) {
      return Response.json({ error: msg(request, 'Thiếu promptId.', 'promptId is required.') }, { status: 400 });
    }
    const targetBand = body.targetBand ?? 7;
    if (!ALLOWED_BANDS.includes(targetBand)) {
      return Response.json(
        { error: msg(request, `targetBand phải là một trong ${ALLOWED_BANDS.join(', ')}.`, `targetBand must be one of ${ALLOWED_BANDS.join(', ')}.`) },
        { status: 400 },
      );
    }

    const prompt = getWritingPromptById(body.promptId);
    if (!prompt) {
      return Response.json({ error: msg(request, 'Không tìm thấy đề.', 'Prompt not found.') }, { status: 404 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: msg(
            request,
            'Chưa cấu hình OPENAI_API_KEY nên không soạn được bài mẫu.',
            "OPENAI_API_KEY isn't configured, so a model essay can't be written.",
          ),
          code: 'missing_config',
        },
        { status: 503 },
      );
    }

    const essay = await generateModelEssay({ prompt, targetBand });
    return Response.json(essay);
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: errorText(request, err, err.message, "Couldn't write a model essay. Please try again in a few minutes."), code: err.code }, { status: 502 });
    }
    return Response.json({ error: msg(request, 'Lỗi không xác định khi soạn bài mẫu.', 'Unknown error while writing the model essay.') }, { status: 500 });
  }
}
