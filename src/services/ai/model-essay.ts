import { getOpenAI } from './client';
import { AiError, toAiError } from './errors';
import { withRetry } from './retry';
import { scoreWriting } from './writing-evaluator';
import { countWords } from '@/lib/writing/word-count';
import type { WritingPrompt } from '@/lib/writing/types';

/**
 * SERVER-ONLY. Soạn bài mẫu bằng AI, rồi CHẤM NGƯỢC chính bài đó.
 *
 * Bảo AI "viết một bài band 7" rồi tin luôn là sai: model không có cách nào tự
 * biết bài nó vừa viết rơi vào band nào. Nên sau khi viết, bài được đưa qua
 * đúng đường chấm mà người học dùng; lệch quá nửa bậc thì viết lại kèm phản hồi.
 *
 * Kể cả khi khớp band, kết quả vẫn phải gắn nhãn **"bài tham khảo do AI soạn"**.
 * Không có gì bảo chứng band của một bài do AI viết, và nói quá lên thì người
 * học sẽ bắt chước một bài không đáng bắt chước.
 */

export type ModelEssay = {
  promptId: string;
  targetBand: number;
  bodyText: string;
  wordCount: number;
  /** Band đo lại được sau khi chấm ngược. Null nghĩa là kiểm định thất bại. */
  verifiedLow: number | null;
  verifiedHigh: number | null;
  /** Số lần phải viết lại. 0 nghĩa là đạt ngay lần đầu. */
  attempts: number;
  model: string;
};

/** Lệch quá mức này so với band mục tiêu thì viết lại. */
const TOLERANCE = 0.5;
/** Viết lại tối đa một lần: mỗi vòng tốn hai lượt gọi model. */
const MAX_RETRIES = 1;

function writingModel(): string {
  return process.env.WRITING_MODEL ?? process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini';
}

const BAND_GUIDE: Record<string, string> = {
  '6': `Band 6: có overview nhưng mờ. Câu chủ yếu là câu đơn và câu ghép đơn giản. Từ vựng đủ dùng nhưng lặp (dùng lại "increase" và "decrease" nhiều lần). Có vài lỗi ngữ pháp nhỏ nhưng không gây hiểu sai. KHÔNG viết hay hơn mức này.`,
  '7': `Band 7: overview rõ ràng, nêu đúng xu hướng chính. Có câu phức, mệnh đề quan hệ, phân từ. Từ vựng linh hoạt, ít lặp. Đa số câu không có lỗi. Chưa cần tinh tế như band 8.`,
  '8': `Band 8: chọn lọc rất khéo, làm nổi bật đúng điều quan trọng nhất. Câu đa dạng và tự nhiên, collocation chuẩn. Gần như không có lỗi.`,
};

export async function generateModelEssay(input: {
  prompt: WritingPrompt;
  targetBand: number;
}): Promise<ModelEssay> {
  const { prompt, targetBand } = input;
  const model = writingModel();

  let bodyText = '';
  let verified: { bandLow: number; bandHigh: number } | null = null;
  let feedback = '';

  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      bodyText = await withRetry(() => writeEssay(model, prompt, targetBand, feedback));

      const score = await scoreWriting({ prompt, bodyText });
      const mid = (score.bandLow + score.bandHigh) / 2;

      if (Math.abs(mid - targetBand) <= TOLERANCE) {
        return {
          promptId: prompt.id,
          targetBand,
          bodyText,
          wordCount: countWords(bodyText),
          verifiedLow: score.bandLow,
          verifiedHigh: score.bandHigh,
          attempts: attempt,
          model,
        };
      }

      verified = { bandLow: score.bandLow, bandHigh: score.bandHigh };
      feedback =
        mid > targetBand
          ? `Bài trước bị chấm ${score.bandLow}, CAO hơn mục tiêu ${targetBand}. Viết đơn giản hơn: bớt câu phức, dùng lại từ vựng nhiều hơn, để lại vài lỗi nhỏ.`
          : `Bài trước bị chấm ${score.bandLow}, THẤP hơn mục tiêu ${targetBand}. Viết chắc hơn: thêm câu phức, đa dạng từ vựng, bảo đảm overview rõ.`;
    }

    // Hết lượt viết lại mà vẫn lệch: trả bài cuối kèm band đo được, để màn hình
    // nói rõ "chưa khớp band mục tiêu" thay vì im lặng dán nhãn sai.
    return {
      promptId: prompt.id,
      targetBand,
      bodyText,
      wordCount: countWords(bodyText),
      verifiedLow: verified?.bandLow ?? null,
      verifiedHigh: verified?.bandHigh ?? null,
      attempts: MAX_RETRIES + 1,
      model,
    };
  } catch (err) {
    throw toAiError(err, 'Không soạn được bài mẫu. Thử lại sau ít phút.');
  }
}

async function writeEssay(
  model: string,
  prompt: WritingPrompt,
  targetBand: number,
  feedback: string,
): Promise<string> {
  const isTask1 = prompt.task === 'ielts_task1';
  const guide = BAND_GUIDE[String(Math.floor(targetBand))] ?? BAND_GUIDE['7'];

  const system = `Bạn viết bài mẫu cho người luyện IELTS Writing.

Viết một bài ${isTask1 ? 'IELTS Writing Task 1' : 'IELTS Writing Task 2'} ở đúng mức ${targetBand}.

${guide}

QUY TẮC BẮT BUỘC:
1. Viết ${prompt.minWords}–${Math.round(prompt.minWords * 1.25)} từ.
2. ${isTask1 ? 'Bốn đoạn: mở bài, overview, hai đoạn thân bài. KHÔNG có kết luận. Overview KHÔNG được có con số.' : 'Bốn đoạn: mở bài có thesis, hai đoạn thân bài, kết luận.'}
3. ${isTask1 ? 'Mọi con số phải LẤY ĐÚNG từ dữ liệu biểu đồ được cung cấp. Không được bịa số.' : 'Không bịa số liệu thống kê.'}
4. Trả về DUY NHẤT phần bài viết. Không tiêu đề, không lời dẫn, không giải thích, không markdown.`;

  const user = [
    `ĐỀ BÀI: ${prompt.promptText}`,
    prompt.chartData ? `DỮ LIỆU BIỂU ĐỒ (JSON):\n${JSON.stringify(prompt.chartData)}` : '',
    feedback ? `LẦN TRƯỚC CHƯA ĐẠT: ${feedback}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const res = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const text = res.choices[0]?.message?.content?.trim();
  if (!text) throw new AiError('bad_response', 'Model không trả về bài viết nào.');

  // Cắt fence nếu model vẫn bọc markdown dù đã bảo đừng.
  return text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
}
