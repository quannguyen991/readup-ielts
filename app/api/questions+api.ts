import { getArticleById, isReadable, loadArticleWithBody } from '@/data/articles';
import { AiError } from '@/services/ai/errors';
import { generateQuestionsWithClaude } from '@/services/ai/questions';
import { blueprintFor, type PassageBlueprint } from '@/services/questions/blueprint';
import { questionCacheKey, readSharedQuestionSet, writeSharedQuestionSet } from '@/services/questions/cache';
import { sanitizeBlocks } from '@/services/questions/mix';
import type { QuestionType } from '@/types/database';
import { msg } from '@/lib/server-locale';

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
      /** Bộ trộn dạng tự chọn: [{ type, count }] — xem `services/questions/mix.ts`. */
      blocks?: unknown;
      passage?: { title?: string; paragraphs?: string[]; cefrLevel?: string | null };
    };

    if (!body.articleId) {
      return Response.json({ error: msg(request, 'Thiếu articleId.', 'articleId is required.') }, { status: 400 });
    }

    const blocks = sanitizeBlocks(body.blocks);
    if (blocks === null) {
      return Response.json({ error: msg(request, 'Bộ trộn dạng bài không hợp lệ.', 'Invalid question mix.') }, { status: 400 });
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
          ...(blocks ? { blocks } : {}),
        },
      );
      return Response.json(questionSet);
    }

    const meta = getArticleById(body.articleId);
    if (!meta) {
      return Response.json({ error: msg(request, 'Không tìm thấy bài đọc.', 'Article not found.') }, { status: 404 });
    }

    if (!isReadable(meta)) {
      return Response.json(
        {
          error: msg(
            request,
            'Bài này thuộc nguồn có bản quyền (chỉ lưu tiêu đề), không sinh đề được. Mở link gốc để đọc.',
            "This article is from a copyrighted source (title only), so questions can't be generated. Open the original link to read it.",
          ),
        },
        { status: 422 },
      );
    }

    // Toàn văn nằm trong chunk riêng, không nằm trong index.
    const article = await loadArticleWithBody(body.articleId);
    if (!article) {
      return Response.json(
        {
          error: msg(
            request,
            'Không nạp được toàn văn của bài này. Chạy lại `npm run ingest`.',
            "Couldn't load this article's full text. Run `npm run ingest` again.",
          ),
        },
        { status: 422 },
      );
    }

    /*
      BẢN THIẾT KẾ SUY RA TỪ KHỔ PASSAGE, KHÔNG DO CLIENT GỬI XUỐNG.

      Khổ bài đã nói vị trí của nó trong đề: p1 là passage 1, p3 là passage 3.
      Để client gửi xuống thì hai người mở cùng một bài có thể nhận hai cấu trúc
      khác nhau, mà cache lại khoá chung — người sau sẽ nhận đề của người trước.

      Chỉ áp cho IELTS. Đề SAT có cấu trúc riêng hẳn, và ép nó vào khuôn ba
      passage của IELTS là dựng sai kỳ thi.

      Bộ lọc "Loại câu hỏi" THẮNG bản thiết kế: người đã tự chọn dạng là người
      đang luyện đúng dạng ấy, không phải người đang thi thử.
      Cũng vậy với `focusType` và `count` do người gọi chỉ định.
    */
    const blueprint: PassageBlueprint | undefined =
      article.exam === 'ielts' &&
      !blocks &&
      !body.focusType &&
      !body.count &&
      !(Array.isArray(body.types) && body.types.length > 0)
        ? blueprintFor(positionOf(article.passageTier), article.id)
        : undefined;

    const requestedTypes = questionCacheKey({ types: body.types, focusType: body.focusType, ...(blocks ? { blocks } : {}) });

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
        ...(blueprint ? { blueprint } : {}),
        ...(blocks ? { blocks } : {}),
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
    /*
      KHÔNG đưa chi tiết nhà cung cấp ra phản hồi.

      `AiError.message` của lớp gọi AI mang tên máy chủ, tên model và thân phản hồi
      lỗi của proxy — thứ người dùng không cần và không được thấy. Chi tiết đi vào
      log máy chủ; người dùng nhận một câu chung theo mã lỗi.
    */
    console.error('[api/questions]', err instanceof Error ? err.message.slice(0, 400) : String(err));
    if (err instanceof AiError) {
      const text =
        err.code === 'invalid_request'
          ? msg(request, 'Bài này không dùng được để tạo đề.', "This passage can't be used to build questions.")
          : err.code === 'rate_limited'
            ? msg(request, 'Đang có quá nhiều yêu cầu tạo đề. Thử lại sau ít phút.', 'Too many requests right now. Try again in a few minutes.')
            : msg(request, 'Chưa tạo được đề lúc này. Thử lại sau ít phút.', "Couldn't generate questions right now. Please try again in a few minutes.");
      return Response.json({ error: text, code: err.code }, { status: err.status ?? 502 });
    }
    return Response.json({ error: msg(request, 'Chưa tạo được đề lúc này.', "Couldn't generate questions right now.") }, { status: 500 });
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

/**
 * Khổ passage nói vị trí của bài trong đề.
 *
 * `short_academic` là bài ngắn ngoài khuôn ba passage; xếp nó vào vị trí 1 vì
 * bố cục passage 1 nhẹ nhất và hợp với bài ngắn nhất. Xếp vào vị trí 3 sẽ đòi
 * một bài 200 từ gánh năm câu trắc nghiệm suy luận.
 */
function positionOf(tier: string | null | undefined): 1 | 2 | 3 {
  if (tier === 'p3') return 3;
  if (tier === 'p2') return 2;
  return 1;
}
