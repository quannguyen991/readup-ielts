import Anthropic from '@anthropic-ai/sdk';

import { getArticleById, isReadable } from '@/data/articles';
import { AI_MODELS } from '@/services/ai/client';

/**
 * POST /api/chat  { articleId, messages: [{role, content}] }
 * Trả về text/plain dạng stream để chat hiện chữ dần như đang gõ.
 *
 * Toàn văn bài đọc được đưa vào system prompt; trợ giảng trả lời tiếng Việt và
 * luôn trích dẫn số đoạn.
 */
export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('Chưa cấu hình ANTHROPIC_API_KEY nên chatbox chưa dùng được.', {
      status: 503,
    });
  }

  try {
    const body = (await request.json()) as {
      articleId?: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    const article = body.articleId ? getArticleById(body.articleId) : undefined;
    if (!article || !isReadable(article)) {
      return new Response('Bài này không có toàn văn nên trợ giảng không đọc được.', {
        status: 422,
      });
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

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const response = client.messages.stream({
            model: AI_MODELS.claude,
            max_tokens: 2000,
            system,
            messages: (body.messages ?? []).slice(-12),
          });

          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Lỗi không xác định';
          controller.enqueue(encoder.encode(`\n\n[Lỗi khi gọi Claude: ${message}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-cache' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    return new Response(message, { status: 500 });
  }
}
