import { AiError } from '@/services/ai/errors';
import { chatWithFallback, extractJson } from '@/services/ai/fallback';
import {
  TRANSFER_SYSTEM,
  buildTransferPrompt,
  parseTransferProbe,
} from '@/services/writing/transfer-probe';
import type { AnnotationCategory } from '@/lib/writing/types';

/**
 * POST /api/writing/transfer  { category, originalQuote, whyVi }
 *
 * Soạn một câu MỚI mang đúng loại lỗi vừa được chỉ ra trong bài người học, để
 * kiểm xem họ có nhận ra và sửa được lỗi ấy ở chỗ khác hay không.
 *
 * SERVER-ONLY, và cố ý ĐỘC LẬP với lượt chấm bài. Chấm bài đã tốn 30 giây; ghép
 * thêm việc này vào đó sẽ đẩy lượt gọi vượt trần thời gian của hàm serverless,
 * mà phần lớn người xem bản chấm không bấm sang bước chuyển giao.
 *
 * MODEL KHÔNG ĐƯỢC TUYÊN BỐ NGƯỜI HỌC ĐÃ HIỂU. Nó chỉ soạn câu và đưa bản sửa
 * mẫu; phần chấm nằm ở `gradeTransfer`, còn quyền công nhận nằm ở
 * `services/mastery`. Ranh giới ấy là thứ giữ cho cả cơ chế có nghĩa.
 */

const CATEGORIES = new Set<AnnotationCategory>([
  'grammar',
  'lexis',
  'cohesion',
  'expression',
  'task',
]);

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      category?: string;
      originalQuote?: string;
      whyVi?: string;
    };

    const category = body.category as AnnotationCategory;
    if (!CATEGORIES.has(category)) {
      return Response.json({ error: 'Loại lỗi không hợp lệ.' }, { status: 400 });
    }

    const originalQuote = (body.originalQuote ?? '').trim();
    if (originalQuote.length < 3) {
      return Response.json({ error: 'Thiếu câu gốc.' }, { status: 400 });
    }

    /*
      Thử tối đa hai lượt.

      Bản đầu bị từ chối vì những lý do máy kiểm được — model quên gài lỗi, hoặc
      trả lại chính câu cũ. Cho một lượt nữa là đủ để vượt qua phần lớn ca ấy;
      thử mãi thì chỉ tốn tiền và đẩy người dùng vào một vòng chờ dài.
    */
    let lastReject = '';
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await chatWithFallback({
        purpose: 'writing',
        system: TRANSFER_SYSTEM,
        user: buildTransferPrompt({ category, originalQuote, whyVi: body.whyVi ?? '' }),
        temperature: 0.8,
      });

      const parsed = parseTransferProbe(extractJson(result.text), { category, originalQuote });
      if (!('rejected' in parsed)) {
        return Response.json({ ...parsed, model: result.model });
      }
      lastReject = parsed.rejected;
    }

    return Response.json(
      { error: `Chưa soạn được câu kiểm dùng được (${lastReject}). Thử lại giúp.` },
      { status: 502 },
    );
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: err.message }, { status: 503 });
    }
    return Response.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}
