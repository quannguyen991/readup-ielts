import { getArticleById, getArticleWithBody, isReadable } from '@/data/articles';
import { AiError } from '@/services/ai/errors';
import { generateQuestionsWithClaude } from '@/services/ai/questions';
import { questionCacheKey, readSharedQuestionSet, writeSharedQuestionSet } from '@/services/questions/cache';
import type { QuestionType } from '@/types/database';

/**
 * POST /api/questions  { articleId, count?, focusType?, types?, passage? }
 *
 * `passage` là VĂN BẢN GỬI KÈM, dùng cho nội dung không nằm trong kho: văn bản
 * người dùng tự dán, và phụ đề video YouTube. Không có nó thì hai tính năng ấy
 * gọi vào đây đều nhận 404 rồi âm thầm rơi về bộ sinh offline — mà bộ offline
 * chỉ làm được MỘT dạng câu. Nói cách khác: tính năng "dán văn bản rồi làm đề"
 * chưa bao giờ thật sự sinh đề bằng AI, dù giao diện không hề nói thế.
 *
 * Văn bản gửi kèm KHÔNG ghi vào cache dùng chung: cache khoá theo id bài, mà id
 * của văn bản người dùng là ngẫu nhiên trên máy họ — ghi vào chỉ làm phình cache
 * bằng những mục không ai đọc lại. Nó cũng là nội dung riêng của người ta.
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
      passage?: { title?: string; paragraphs?: string[]; cefrLevel?: string | null };
    };

    if (!body.articleId) {
      return Response.json({ error: 'Thiếu articleId.' }, { status: 400 });
    }

    const inline = readInlinePassage(body.passage);
    if (inline) {
      const questionSet = await generateQuestionsWithClaude(
        {
          id: body.articleId,
          title: inline.title,
          paragraphs: inline.paragraphs,
          exam: 'ielts',
          cefrLevel: null,
        },
        {
          ...(body.count ? { count: body.count } : {}),
          ...(body.focusType ? { focusType: body.focusType } : {}),
          ...(body.types?.length ? { types: body.types } : {}),
        },
      );
      return Response.json(questionSet);
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

/** Giới hạn văn bản gửi kèm. Đủ cho một bài đọc dài hoặc một video 20 phút. */
const MAX_INLINE_PARAGRAPHS = 60;
const MAX_INLINE_CHARS = 24_000;

/**
 * Đọc và siết văn bản gửi kèm.
 *
 * Siết ngay tại cửa chứ không tin phía gọi: đây là endpoint công khai, và một
 * request mang theo mười nghìn đoạn sẽ đẩy thẳng vào lời gọi AI — vừa tốn tiền
 * vừa chắc chắn vượt trần thời gian của hàm serverless.
 *
 * Trả về `null` khi không có văn bản kèm, để luồng cũ (tra bài theo id) chạy
 * tiếp như thường.
 */
function readInlinePassage(
  raw: { title?: string; paragraphs?: string[] } | undefined,
): { title: string; paragraphs: string[] } | null {
  if (!raw || !Array.isArray(raw.paragraphs)) return null;

  const paragraphs: string[] = [];
  let chars = 0;
  for (const p of raw.paragraphs) {
    if (typeof p !== 'string') continue;
    const clean = p.replace(/\s+/g, ' ').trim();
    // Đoạn quá ngắn không đủ để hỏi bất cứ điều gì.
    if (clean.split(' ').length < 8) continue;
    paragraphs.push(clean);
    chars += clean.length;
    if (paragraphs.length >= MAX_INLINE_PARAGRAPHS || chars >= MAX_INLINE_CHARS) break;
  }

  if (paragraphs.length === 0) return null;
  return { title: (raw.title ?? '').trim() || 'Văn bản gửi kèm', paragraphs };
}
