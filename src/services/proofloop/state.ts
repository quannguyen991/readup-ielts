import type { Observation, ProofState } from './types';

/**
 * Phân loại thuần xác định — KHÔNG gọi model.
 *
 * Đây là chỗ giữ quyền kết luận của cả hệ thống. Model không có đường nào chạm
 * vào hàm này, và đó là chủ đích: nếu model được phép nói "học sinh đã hiểu"
 * thì một lời giải thích trôi chảy sẽ tự phong cho mình là bằng chứng học tập.
 *
 * Hàm này chỉ trả lời một câu quan sát được: đáp án có đúng không, và đoạn
 * người học khoanh có phải đoạn thật sự đỡ đáp án không. Nó KHÔNG trả lời
 * "vì sao sai" — đó là việc của phép thử tiếp theo.
 */
export function classify(obs: Observation): ProofState {
  // Hai lối ra này phải đứng trước mọi thứ khác. Không khoanh gì, hoặc câu hỏi
  // không có đối chứng, đều là "chưa đo được" — khác hẳn "đo rồi thấy sai".
  if (obs.mark === null) return 'unobserved';
  if (obs.truthParagraphIndex === null) return 'unobserved';

  const aligned = obs.mark.paragraphIndex === obs.truthParagraphIndex;

  if (obs.answerCorrect) return aligned ? 'aligned-correct' : 'misaligned-correct';
  return aligned ? 'aligned-wrong' : 'misaligned-wrong';
}
