import type { QuestionType } from '@/types/database';

/**
 * Hàng rào bịt mắt cho ĐỀ CHÍNH — bắt một model trả lời khi chưa được đọc bài.
 *
 * VÌ SAO TỆP NÀY TỒN TẠI KHI ĐÃ CÓ `proofloop/blind-check.ts`. Cái kia chạy trên
 * `ProbeDraft` và chỉ được gọi ở nhánh `isTransfer` — nhánh hiếm nhất trong cả
 * app. Nghĩa là hàng rào làm nên toàn bộ luận điểm của dự án đang canh cổng phụ,
 * còn cổng chính — mọi câu hỏi mà mọi người học gặp trong mọi lượt luyện — thì
 * bỏ ngỏ. Tệp này làm cùng một việc trên `GeneratedQuestion` để nó đứng được ở
 * đúng cửa ấy.
 *
 * VIẾT LÀM HÀM THUẦN, TÁCH HẲN LỜI GỌI MODEL. Ba lý do: chạy được trong test mà
 * không cần mạng; ghép được với `services/questions/verify.ts` mà không phải sửa
 * tệp ấy; và giữ đúng luật của dự án — model chỉ được TRẢ LỜI, còn kết luận rút
 * ra từ câu trả lời là việc của một hàm có test.
 *
 * MẶC ĐỊNH AN TOÀN LÀ GIỮ CÂU LẠI. Thiếu thông tin, đọc không nổi bản trả lời,
 * model im lặng — tất cả đều ra "giữ". Loại oan một câu tốt đắt hơn giữ lại một
 * câu đáng ngờ, vì câu đáng ngờ vẫn còn hàng rào luật đứng sau, còn câu bị loại
 * oan thì mất hẳn.
 */

export type BlindProbe = {
  questionId: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correctAnswer: string;
};

export type BlindReply = {
  /** Phương án model chọn, hoặc `null` khi nó nói không xác định được. */
  answer: string | null;
  /** Model có cho rằng câu này xác định được khi chưa đọc bài không. */
  determinable: boolean;
};

export type BlindGateVerdict =
  | { ok: true; note: 'could-not-answer' | 'answered-wrong' | 'guess-hit' }
  /** Trả lời đúng VÀ tự nhận xác định được. Câu này không đo đọc hiểu. */
  | { ok: false; note: 'answerable-without-passage' };

/**
 * Dạng mà đáp án là MỘT VỊ TRÍ TRONG BÀI, không phải một mệnh đề.
 *
 * KHÔNG ĐƯỢC ĐƯA VÀO HÀNG RÀO, và đây không phải chuyện tiết kiệm — nó là chuyện
 * phép đo có nghĩa hay không.
 *
 * "Đoạn nào chứa thông tin sau?" hay "Chọn tiêu đề cho đoạn 3" khi bịt mắt thì
 * không phải KHÓ, mà là BẤT KHẢ: không nhìn thấy bài thì không có đoạn nào để
 * trỏ. Model sẽ luôn trượt hoặc luôn nói không biết, nên những câu ấy KHÔNG BAO
 * GIỜ bị loại — và mỗi câu như vậy lọt vào mẫu số là một lần kéo tỉ lệ xuống mà
 * không hề đo được gì.
 *
 * Đo thật trên 599 lượt: nhóm này 68 lượt, loại đúng 1 (1,5%). Gộp chúng vào
 * làm tỉ lệ chung tụt từ 32,0% xuống 28,5% — tức là gần bốn điểm phần trăm biến
 * mất vào những câu mà hàng rào không có cách nào phán xử.
 *
 * Dạng ĐIỀN TỪ lấy chữ nguyên văn từ bài cũng nằm đây, vì lý do gần giống: đáp
 * án là một cụm chữ cụ thể trong bài, đoán trúng gần như không xảy ra. Dạng ấy
 * đã có hàng rào luật lo — nó bắt đáp án phải có thật trong bài.
 */
const NOT_A_PROPOSITION: ReadonlySet<QuestionType> = new Set<QuestionType>([
  // đáp án là chữ trích từ bài
  'sentence_completion',
  'summary_completion',
  'short_answer',
  // đáp án là một vị trí trong bài
  'matching_headings',
  'matching_information',
  'matching_features',
  'matching_sentence_endings',
]);

/**
 * Câu dạng này có phán xử được bằng phép thử bịt mắt không.
 *
 * `false` nghĩa là KHÔNG ĐO ĐƯỢC, không phải "đã đỗ". Chỗ gọi phải bỏ hẳn câu ra
 * khỏi mẫu chứ không ghi nó là sạch.
 */
export function worthBlindChecking(type: QuestionType): boolean {
  return !NOT_A_PROPOSITION.has(type);
}

const TFNG_LABELS = ['TRUE', 'FALSE', 'NOT GIVEN'] as const;
const YNNG_LABELS = ['YES', 'NO', 'NOT GIVEN'] as const;

function labelsFor(type: QuestionType): readonly string[] | null {
  if (type === 'true_false_not_given') return TFNG_LABELS;
  if (type === 'yes_no_not_given') return YNNG_LABELS;
  return null;
}

/**
 * Chuẩn hoá để so đáp án.
 *
 * Bỏ luôn khoảng trắng bên trong: model trả "NOTGIVEN" và đề ghi "NOT GIVEN" là
 * cùng một đáp án, mà so nguyên văn thì thành "trả lời sai" — hàng rào bỏ lọt
 * đúng cái nó sinh ra để bắt.
 */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, '')
    .trim();
}

export function buildBlindPrompt(probe: BlindProbe): string {
  const labels = labelsFor(probe.type);
  const lines = [
    'Answer this question.',
    'You have NOT been given the source text, and you will not be given it.',
    '',
    `QUESTION: ${probe.prompt}`,
    '',
  ];

  if (labels) {
    lines.push(`Reply with exactly one of: ${labels.join(', ')}.`, '');
  } else if (probe.options && probe.options.length > 0) {
    lines.push('OPTIONS:', ...probe.options.map((o, i) => `${i}. ${o}`), '');
  }

  lines.push(
    'Return ONE JSON object and nothing else:',
    '{"answer": <your answer, or null if you cannot tell>, "determinable": <true if the',
    'answer can be determined from general knowledge or from the options alone, false if',
    'you would need the source text>}',
    '',
    'Answer honestly. Guessing is allowed, but if you are guessing set "determinable" to false.',
  );
  return lines.join('\n');
}

/** Đọc bản trả lời. `null` khi không đọc nổi — và không đoán bù. */
export function readBlindReply(text: string): BlindReply | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const o = parsed as Record<string, unknown>;

  /*
    NHẬN CẢ SỐ, KHÔNG CHỈ CHUỖI.

    Lời dặn nêu phương án dưới dạng "0. …", "1. …", nên model rất tự nhiên trả về
    `{"answer": 2}` — một SỐ. Bản trước chỉ nhận chuỗi, nên mọi lượt như vậy bị
    coi là "đọc không nổi" và ghi thành `not-run`. Đo thật thấy 18% số lượt rơi
    vào đó: gần một phần năm số câu không được kiểm, mà lại KHÔNG phải vì hàng
    rào hỏng — chỉ vì bộ đọc kén kiểu dữ liệu.

    Hỏng kiểu này nguy hiểm hơn hỏng to tiếng: nó không báo lỗi, nó chỉ lặng lẽ
    làm mẫu số nhỏ đi và thiên lệch về phía những câu model chịu trả lời bằng chữ.
  */
  const raw = o.answer;
  const answer =
    typeof raw === 'string'
      ? raw
      : typeof raw === 'number' && Number.isFinite(raw)
        ? String(raw)
        : raw === null
          ? null
          : undefined;
  if (answer === undefined) return null;

  // Thiếu `determinable` thì coi như KHÔNG xác định được: mặc định an toàn là
  // giữ câu lại, không phải loại nó.
  return { answer, determinable: o.determinable === true };
}

/**
 * Đáp án model đưa ra có trúng không.
 *
 * Nhận cả chỉ số phương án: model rất hay trả về "2" thay vì chép lại câu chữ.
 * Không nhận dạng ấy thì hàng rào coi như model trả lời sai, và một câu đáng
 * loại sẽ lọt qua.
 */
function hits(probe: BlindProbe, answer: string): boolean {
  const target = norm(probe.correctAnswer);
  if (norm(answer) === target) return true;

  const options = probe.options;
  if (options && options.length > 0) {
    const index = Number.parseInt(answer.trim(), 10);
    if (Number.isInteger(index) && index >= 0 && index < options.length) {
      return norm(options[index]!) === target;
    }
  }
  return false;
}

/**
 * Rút kết luận từ câu trả lời của model bị bịt mắt.
 *
 * Model KHÔNG được hỏi "câu này hay không" — đó lại là một phán đoán không kiểm
 * được. Nó chỉ được giao đúng một việc làm được và kiểm được: trả lời. Luật rút
 * kết luận nằm ở đây, thuần và có test.
 */
export function judgeBlindReply(probe: BlindProbe, reply: BlindReply): BlindGateVerdict {
  if (reply.answer === null) return { ok: true, note: 'could-not-answer' };
  if (!hits(probe, reply.answer)) return { ok: true, note: 'answered-wrong' };
  // Trúng, nhưng model tự nhận là đoán. Giữ lại và ghi vào biên nhận: một lần
  // trúng trong ba bốn phương án không đủ để kết luận câu hỏi hỏng.
  if (!reply.determinable) return { ok: true, note: 'guess-hit' };
  return { ok: false, note: 'answerable-without-passage' };
}
