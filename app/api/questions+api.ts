import { getArticleById, getArticleWithBody, isReadable } from '@/data/articles';
import { AiError } from '@/services/ai/errors';
import { generateQuestionsWithClaude } from '@/services/ai/questions';
import { questionCacheKey, readSharedQuestionSet, writeSharedQuestionSet } from '@/services/questions/cache';
import type { QuestionType } from '@/types/database';

/**
 * POST /api/questions  { articleId, count?, focusType?, types? }
 *
 * Chạy server-side để khoá proxy AI không xuống client.
 * Client gọi route này trước; nếu lỗi (chưa có key, mạng hỏng…) thì tự rơi về
 * bộ sinh đề offline nên luôn có đề để làm.
 *
 * CÓ CACHE DÙNG CHUNG (03/09/2026): trước khi gọi AI, kiểm bộ đề CHUNG cho
 * đúng bài + đúng đơn hàng dạng câu (`questionCacheKey`) — có thì trả ngay,
 * không mất 20 giây gọi AI lại cho một kết quả gần như giống hệt lần trước.
 * Sinh mới xong thì ghi lại vào cache cho người MỞ SAU, không phải chỉ người
 * MỞ TRƯỚC được hưởng.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      articleId?: string;
      count?: number;
      focusType?: QuestionType;
      types?: QuestionType[];
    };

    if (!body.articleId) {
      return Response.json({ error: 'Thiếu articleId.' }, { status: 400 });
    }

    const meta = getArticleById(body.articleId);
    if (!meta) {
      return Response.json({ error: 'Không tìm thấy bài đọc.' }, { status: 404 });
    }

    if (!isReadable(meta)) {
      return Response.json(
        {
          error:
            'Bài này thuộc nguồn có bản quyền (chỉ lưu tiêu đề), không sinh đề được. Mở link gốc để đọc.',
        },
        { status: 422 },
      );
    }

    // Toàn văn nằm trong chunk riêng, không nằm trong index.
    const article = getArticleWithBody(body.articleId);
    if (!article) {
      return Response.json(
        { error: 'Không nạp được toàn văn của bài này. Chạy lại `npm run ingest`.' },
        { status: 422 },
      );
    }

    const requestedTypes = questionCacheKey({ types: body.types, focusType: body.focusType });

    const cached = await readSharedQuestionSet(article.id, requestedTypes);
    if (cached) return Response.json(cached);

    const questionSet = await generateQuestionsWithClaude(
      {
        id: article.id,
        title: article.title,
        paragraphs: article.paragraphs,
        // Quyết định cả bộ dạng câu lẫn số câu — bài SAT phải ra đề SAT.
        exam: article.exam,
        cefrLevel: article.cefrLevel,
      },
      {
        ...(body.count ? { count: body.count } : {}),
        ...(body.focusType ? { focusType: body.focusType } : {}),
        // Bộ lọc "Loại câu hỏi" ở màn Luyện tập gửi xuống đây. Đây là ĐẶT HÀNG
        // chứ không phải lọc: đề chưa tồn tại lúc chọn, nó sinh ra theo đơn.
        ...(Array.isArray(body.types) && body.types.length > 0 ? { types: body.types } : {}),
      },
    );

    /*
      PHẢI `await`, không được `void`.

      Bản đầu dùng `void writeSharedQuestionSet(...)` với ý định "người dùng
      đang chờ câu trả lời của họ, đừng bắt họ chờ thêm việc ghi cache cho
      người sau". Sai — đã kiểm trên production: gọi 3 lần liên tiếp cùng một
      bài, cả ba lần đều mất ~22 giây, tức KHÔNG lần nào cache thật sự được ghi.

      Nguyên nhân: hàm serverless trên Vercel có thể bị ĐÓNG BĂNG/DỌN NGAY SAU
      KHI `Response` đã trả về, không đợi các Promise chưa `await` chạy nốt —
      đây là hành vi nền tảng, không phải lỗi logic trong `writeSharedQuestionSet`.
      `void` khiến việc ghi cache có khả năng bị giết giữa chừng mỗi lần, nên
      cache không bao giờ thật sự ấm lên.

      Đổi lại: chờ thêm vài trăm mili-giây cho hai lệnh INSERT là cái giá không
      đáng kể so với 20+ giây đã tốn để sinh đề — và đổi lại NGƯỜI MỞ SAU thật
      sự được hưởng cache, đúng mục đích cả tính năng này sinh ra.
    */
    await writeSharedQuestionSet(article.id, requestedTypes, questionSet);

    return Response.json({ ...questionSet, requestedTypes });
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: err.message, code: err.code }, { status: err.status ?? 502 });
    }
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    return Response.json({ error: message }, { status: 500 });
  }
}
