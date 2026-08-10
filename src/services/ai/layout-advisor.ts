import { AI_MODELS, getOpenAI } from './client';
import { AiError } from './errors';
import { withRetry } from './retry';

/**
 * SERVER-ONLY. Hỏi ý kiến bố cục khi dựng UI (theo yêu cầu trong prompt gốc):
 * mô tả màn hình đang dựng, nhận về nhận xét cụ thể về thứ bậc thị giác,
 * mật độ thông tin và thứ tự đọc.
 */

const SYSTEM_PROMPT = [
  'Bạn là product designer cao cấp chuyên về app học ngôn ngữ.',
  'Bạn đang review bố cục của một app luyện IELTS Reading có hệ thiết kế sau:',
  'nền xám rất nhạt #F7F8FC, card trắng bo 16px với đổ bóng rất nhẹ,',
  'primary xanh dương #2563EB, accent tím #7C3AED, banner gradient xanh → tím,',
  'icon đặt trong hình tròn nền pastel, chữ Plus Jakarta Sans,',
  'web có sidebar trái cố định, mobile có bottom tab 5 mục.',
  '',
  'Trả lời bằng tiếng Việt, ngắn gọn, đi thẳng vào vấn đề.',
  'Cấu trúc: (1) vấn đề lớn nhất, (2) 3–5 điều chỉnh cụ thể theo thứ tự ưu tiên,',
  '(3) một thứ nên bỏ đi. Không khen xã giao, không liệt kê nguyên tắc chung chung.',
].join('\n');

export async function askLayoutAdvice(question: string): Promise<string> {
  if (!question.trim()) {
    throw new AiError('invalid_request', 'Câu hỏi bố cục đang rỗng.');
  }

  return withRetry(
    async () => {
      const client = getOpenAI();
      const response = await client.chat.completions.create({
        model: AI_MODELS.layoutAdvisor,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
        temperature: 0.4,
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (!text) throw new AiError('bad_response', 'Phản hồi tư vấn bố cục rỗng.');
      return text;
    },
    { label: 'askLayoutAdvice' },
  );
}
