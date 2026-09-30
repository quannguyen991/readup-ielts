import { AiError, toAiError } from './errors';
import { chatWithFallback, extractJson } from './fallback';
import { validateGrade, type SpeakingGrade } from '@/services/speaking/grade';
import type { AttemptMetrics } from '@/services/speaking/metrics';
import { speakingSystemPrompt, speakingUserPrompt, type GradeAnswerInput } from '@/services/speaking/prompt';

/**
 * SERVER-ONLY. Chấm một lượt Speaking bằng AI — MỘT lời gọi cho cả lượt.
 *
 * Dùng chung đường AI với chấm Writing (`purpose: 'writing'`): cùng loại việc
 * (chấm theo band descriptor, trả JSON có trích dẫn), nên cùng thứ tự cửa và
 * cùng ngân sách thời gian.
 *
 * THỬ LẠI CHỈ KHI MODEL TRẢ RÁC (JSON hỏng, thiếu band), và chỉ một lần.
 * Không bọc `withRetry` cho lỗi mạng/proxy: `chatWithFallback` đã tự đi qua cả
 * ba cửa trong ~50 giây; gọi lại cả vòng đó là vượt trần 60 giây của Vercel và
 * hàm bị giết giữa chừng — người dùng nhận 504 trắng thay vì một lỗi có lời.
 */
export async function gradeSpeaking(input: {
  typed: boolean;
  answers: GradeAnswerInput[];
  metrics: AttemptMetrics;
}): Promise<SpeakingGrade> {
  const system = speakingSystemPrompt(input.typed);
  const user = speakingUserPrompt(input);
  const started = Date.now();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const result = await chatWithFallback({ purpose: 'writing', system, user, temperature: 0.2 });
      const raw = extractJson<unknown>(result.text);
      try {
        return validateGrade(raw, {
          transcripts: input.answers.map((a) => a.transcript),
          typed: input.typed,
          metrics: input.metrics,
          model: result.model,
        });
      } catch (err) {
        throw new AiError('bad_response', err instanceof Error ? err.message : 'Phiếu chấm không hợp lệ.');
      }
    } catch (err) {
      lastError = err;
      const bad = err instanceof AiError && err.code === 'bad_response';
      // Còn dư thời gian mới thử lại (một lượt gọi thường mất 10–25 giây).
      if (!bad || Date.now() - started > 25_000) break;
    }
  }
  throw toAiError(lastError, 'Không chấm được bài nói. Thử lại sau ít phút.');
}
