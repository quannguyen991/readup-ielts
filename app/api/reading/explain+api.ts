import { getArticleWithBody } from '@/data/articles';
import { AiError } from '@/services/ai/errors';
import { chatWithFallback } from '@/services/ai/fallback';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/reading/explain
 * { articleId, prompt, correctAnswer, userAnswer, evidenceText, typeLabel }
 *
 * Giải MỘT câu, theo đúng các bước một người luyện thi thật sự đi.
 *
 * VÌ SAO TÁCH KHỎI `/api/reading/coach`. Trợ giảng nhìn CẢ LƯỢT làm bài và tìm
 * mẫu hình lỗi giữa các câu — đó là câu trả lời cho "tôi hay hỏng kiểu gì". Chỗ
 * này trả lời một câu khác hẳn: "vì sao đáp án câu 7 là FALSE mà không phải NOT
 * GIVEN". Nhập hai việc vào một lời gọi thì cả hai đều ra loãng.
 *
 * BẮT ĐI THEO BƯỚC, KHÔNG CHO VIẾT VĂN XUÔI. Một đoạn giải trôi chảy đọc thì
 * thích nhưng không dùng lại được: lần sau gặp câu tương tự, người học vẫn không
 * biết bắt đầu từ đâu. Bốn bước cố định — khoanh từ khoá, tìm chỗ trong bài,
 * đối chiếu, kết luận — thì lần sau họ tự đi lại được chính bốn bước ấy.
 */

const SYSTEM = [
  'Bạn giải một câu IELTS Reading cho người học Việt Nam.',
  'Trả lời bằng tiếng Việt, ngắn gọn, KHÔNG dùng markdown và không có lời mở đầu.',
  '',
  'Đi đúng bốn bước, mỗi bước một dòng bắt đầu bằng nhãn của nó:',
  'TỪ KHOÁ: những chữ trong câu hỏi cần bám vào, và cách chúng có thể được viết lại.',
  'TÌM TRONG BÀI: câu hoặc cụm trong bài đọc đỡ đáp án — trích nguyên văn trong ngoặc kép.',
  'ĐỐI CHIẾU: so câu hỏi với câu vừa trích, chỉ rõ chỗ giống và chỗ lệch.',
  'KẾT LUẬN: vì sao ra đáp án đó, và nếu người học chọn khác thì họ đã lệch ở đâu.',
  '',
  'BA ĐIỀU KHÔNG ĐƯỢC LÀM:',
  '1. Không trích câu không có trong bài đọc được gửi kèm.',
  '2. Không nói về trình độ hay thái độ của người học. Chỉ nói về câu chữ.',
  '3. Không đổi đáp án đúng đã cho — nhiệm vụ là giải thích nó, không phải chấm lại.',
].join('\n');

type Body = {
  articleId?: string;
  prompt?: string;
  correctAnswer?: string;
  userAnswer?: string | null;
  evidenceText?: string;
  typeLabel?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Body;

    if (!body.articleId || !body.prompt || !body.correctAnswer) {
      return Response.json(
        { error: msg(request, 'Thiếu articleId, prompt hoặc correctAnswer.', 'articleId, prompt or correctAnswer is missing.') },
        { status: 400 },
      );
    }

    const article = getArticleWithBody(body.articleId);
    if (!article) {
      return Response.json(
        { error: msg(request, 'Không nạp được toàn văn bài này nên không giải được.', "Couldn't load this article's full text, so it can't be explained.") },
        { status: 422 },
      );
    }

    /*
      Gửi bài đọc có ĐÁNH SỐ ĐOẠN.

      Không đánh số thì lời giải chỉ nói được "trong bài có nói…", còn người học
      vẫn phải tự dò lại từ đầu. Có số đoạn thì bước "tìm trong bài" chỉ thẳng
      được chỗ, và chính chỗ ấy mới là thứ họ cần tập nhìn ra.
    */
    const passage = article.paragraphs
      .map((p, i) => `[Đoạn ${i + 1}] ${p}`)
      .join('\n\n')
      .slice(0, 18_000);

    const user = [
      `DẠNG CÂU: ${body.typeLabel ?? 'không rõ'}`,
      `CÂU HỎI: ${body.prompt}`,
      `ĐÁP ÁN ĐÚNG: ${body.correctAnswer}`,
      `NGƯỜI HỌC TRẢ LỜI: ${body.userAnswer?.trim() ? body.userAnswer : '(bỏ trống)'}`,
      body.evidenceText ? `CÂU ĐỠ ĐÁP ÁN THEO BỘ ĐỀ: ${body.evidenceText}` : '',
      '',
      'BÀI ĐỌC:',
      passage,
    ]
      .filter(Boolean)
      .join('\n');

    const result = await chatWithFallback({
      purpose: 'questions',
      system: SYSTEM,
      user,
      temperature: 0.2,
    });

    return Response.json({ text: result.text, model: result.model });
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: errorText(request, err, err.message, "Couldn't explain this question right now. Please try again in a few minutes."), code: err.code }, { status: 502 });
    }
    const message = errorText(request, err, 'Lỗi không xác định', 'Unknown error');
    return Response.json({ error: message }, { status: 500 });
  }
}
