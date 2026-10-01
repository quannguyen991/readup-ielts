import { getArticleWithBody } from '@/data/articles';
import { streamWithFallback } from '@/services/ai/fallback';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/chat  { articleId, messages: [{role, content}] }
 * Trả về text/plain dạng stream để chat hiện chữ dần như đang gõ.
 *
 * Toàn văn bài đọc được đưa vào system prompt; trợ giảng trả lời tiếng Việt và
 * luôn trích dẫn số đoạn.
 *
 * Đi qua bộ hai proxy như mọi tính năng AI khác. Bản trước gọi thẳng SDK
 * Anthropic bằng `ANTHROPIC_API_KEY` — biến chưa bao giờ được cấu hình, nên
 * chatbox trả 503 mọi lúc.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      articleId?: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    // getArticleWithBody trả undefined cho cả bài chỉ tiêu đề lẫn bài mất
    // chunk — hai trường hợp đó với trợ giảng là như nhau: không có gì để đọc.
    const article = body.articleId ? getArticleWithBody(body.articleId) : undefined;
    if (!article) {
      return new Response(
        msg(
          request,
          'Bài này không có toàn văn nên trợ giảng không đọc được.',
          "This article has no full text, so the tutor can't read it.",
        ),
        { status: 422 },
      );
    }

    const passage = article.paragraphs
      .map((p, index) => `[Đoạn ${index + 1}] ${p}`)
      .join('\n\n')
      .slice(0, 40_000);

    const system = [
      'Bạn là trợ giảng IELTS Reading, đang kèm một người học Việt Nam nhắm band 7.0.',
      'Luôn trả lời bằng tiếng Việt, ngắn gọn, đi thẳng vào việc.',
      'Khi nhắc tới nội dung bài, BẮT BUỘC trích rõ đoạn số mấy, ví dụ "(Đoạn 3)".',
      'Chỉ dựa vào bài đọc dưới đây, không bịa thêm thông tin bên ngoài.',
      '',
      `TIÊU ĐỀ: ${article.title}`,
      '',
      'BÀI ĐỌC:',
      passage,
    ].join('\n');

    /*
      Lịch sử chat gộp vào MỘT lượt hỏi, không gửi thành nhiều message.

      Giao thức tương thích OpenAI có nhận mảng messages, nhưng lớp gọi chung
      của app chỉ nhận một cặp system/user — và giữ nó đơn giản như thế đáng giá
      hơn: chatbox là chỗ duy nhất cần nhiều lượt, còn bốn việc kia thì không.
      Mười hai lượt gần nhất là đủ ngữ cảnh cho một buổi hỏi bài.
    */
    const history = (body.messages ?? []).slice(-12);
    const question = history
      .map((m) => `${m.role === 'user' ? 'Người học' : 'Trợ giảng'}: ${m.content}`)
      .join('\n\n');

    const result = await streamWithFallback({
      purpose: 'chat',
      system,
      user: question || 'Chào bạn.',
      temperature: 0.3,
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const piece of result.stream) {
            controller.enqueue(encoder.encode(piece));
          }
        } catch (err) {
          /*
            Đứt giữa chừng thì nói thẳng là đứt.

            Đóng stream im lặng sẽ để lại một câu cụt giữa chừng trông y như câu
            trả lời đã xong — người học đọc rồi tin, mà nửa sau không bao giờ tới.
          */
          const message = errorText(request, err, 'lỗi không xác định', 'unknown error');
          controller.enqueue(
            encoder.encode(msg(request, `\n\n[Mất kết nối giữa chừng: ${message}]`, `\n\n[Connection lost midway: ${message}]`)),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-cache' },
    });
  } catch (err) {
    const message = errorText(request, err, 'Lỗi không xác định', 'Unknown error');
    return new Response(message, { status: 500 });
  }
}
