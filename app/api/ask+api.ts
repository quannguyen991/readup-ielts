import { streamWithFallback } from '@/services/ai/fallback';

/**
 * POST /api/ask  { messages: [{role, content}] }
 *
 * Hỏi đáp chung, KHÔNG gắn với bài đọc nào — khác `/api/chat`, vốn bắt buộc có
 * `articleId` và chỉ được phép dựa vào đúng bài ấy.
 *
 * VÌ SAO TÁCH ROUTE CHỨ KHÔNG NỚI `/api/chat`. Ràng buộc "chỉ dựa vào bài đọc
 * dưới đây, không bịa thêm" là thứ làm trợ giảng trong màn đọc đáng tin. Cho
 * `articleId` thành tuỳ chọn là bỏ ràng buộc ấy đi ở mọi lượt gọi, kể cả lượt
 * đang có bài — và không ai nhận ra cho tới lúc nó trích một đoạn không tồn tại.
 *
 * Ở đây không có bài để bám, nên đổi sang một ràng buộc khác kiểm được: NÓI
 * KHÔNG BIẾT KHI KHÔNG BIẾT. Chỗ này hay bị hỏi về hạn mức gói, ngày thi, điểm
 * quy đổi — những thứ model đoán rất trôi chảy và sai rất thường.
 */

const SYSTEM = [
  'Bạn là trợ giảng của ReadUp, một app luyện IELTS và SAT cho người học Việt Nam.',
  'Trả lời bằng tiếng Việt, ngắn gọn, đi thẳng vào việc. Không mở đầu bằng lời chào.',
  '',
  // Bong bóng hỏi nhanh vẽ câu trả lời bằng <Text> trần, không có bộ dựng
  // markdown. Để model dùng ** thì người đọc thấy nguyên dấu sao giữa câu.
  'Viết bằng chữ thường, KHÔNG dùng markdown: không **đậm**, không # tiêu đề,',
  'không bảng. Cần liệt kê thì mỗi dòng bắt đầu bằng một dấu gạch ngang.',
  '',
  'Bạn giúp được: giải thích ngữ pháp và từ vựng, cách làm từng dạng câu hỏi,',
  'chiến lược làm bài, và hướng dẫn dùng các phần trong app.',
  '',
  'BA ĐIỀU KHÔNG ĐƯỢC LÀM:',
  '1. Không đoán về giá gói, hạn mức, hay số liệu trong tài khoản người dùng —',
  '   bạn không nhìn thấy những thứ đó. Chỉ bảo họ mở trang Nâng cấp để xem.',
  '2. Không chấm điểm hay đoán band cho một bài viết chỉ nhìn qua vài dòng.',
  '   Chấm Writing là việc của màn Writing, nơi có đủ tiêu chí và biên nhận kiểm chứng.',
  '3. Không bịa số liệu, tên riêng, hay trích dẫn. Không chắc thì nói thẳng là không chắc.',
  '',
  'Nếu câu hỏi nằm ngoài chuyện học tiếng Anh và dùng app, nói ngắn gọn rằng đó',
  'không phải việc bạn giúp được, rồi thôi.',
].join('\n');

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      messages?: { role: 'user' | 'assistant'; content: string }[];
    };

    /*
      Mười hai lượt gần nhất, gộp vào một lượt hỏi — cùng cách với `/api/chat`.

      Lớp gọi chung của app chỉ nhận một cặp system/user, và giữ nguyên như vậy
      đáng giá hơn là nới nó ra cho riêng chỗ này.
    */
    const history = (body.messages ?? []).slice(-12);
    if (history.length === 0) {
      return new Response('Chưa có câu hỏi nào.', { status: 400 });
    }

    const question = history
      .map((m) => `${m.role === 'user' ? 'Người học' : 'Trợ giảng'}: ${m.content}`)
      .join('\n\n');

    const result = await streamWithFallback({
      purpose: 'chat',
      system: SYSTEM,
      user: question,
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
          // Đứt giữa chừng thì nói thẳng là đứt: đóng im lặng sẽ để lại một câu
          // cụt trông y như câu đã trả lời xong.
          const message = err instanceof Error ? err.message : 'lỗi không xác định';
          controller.enqueue(encoder.encode(`\n\n[Mất kết nối giữa chừng: ${message}]`));
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
