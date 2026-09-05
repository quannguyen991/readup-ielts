import type { ProbeDraft } from './draft-schema';

/**
 * Phép thử đối kháng: bắt một model trả lời câu hỏi mà KHÔNG cho đọc bài.
 *
 * Ý ở đây đơn giản đến mức gần như hiển nhiên, nhưng không hệ thống sinh đề nào
 * tôi biết chịu làm: một câu hỏi đọc hiểu mà trả lời được khi chưa đọc bài thì
 * nó không đo đọc hiểu. Nó đang đo kiến thức nền, hoặc đang đo hình dáng của bốn
 * phương án — hai thứ mà đề thi thật cũng hay đo nhầm, và người học thì học được
 * cách đoán chứ không học được cách đọc.
 *
 * Không luật hình thức nào bắt được lỗi này. Câu "According to the passage, is
 * water wet?" đúng định dạng, trích dẫn nguyên văn, đủ số phương án — và vô
 * dụng. Chỉ có cách thử: che bài đi rồi xem có trả lời được không.
 *
 * VÌ SAO KHÔNG ĐỂ MODEL TỰ CHẤM PHÉP THỬ CỦA CHÍNH NÓ. Model ở đây không được
 * hỏi "câu này hay không", vì đó lại là một phán đoán không kiểm được. Nó chỉ
 * được giao đúng một việc làm được và kiểm được: TRẢ LỜI. Kết luận rút ra từ
 * việc nó trả lời đúng hay sai, và luật rút kết luận nằm ở `judgeBlindAnswer`,
 * thuần và có test.
 */

export type BlindAnswer = {
  /** Phương án model chọn. `null` khi nó nói không xác định được. */
  choice: number | null;
  /** Model có cho rằng câu này xác định được khi chưa đọc bài không. */
  determinable: boolean;
};

export type BlindVerdict =
  /** Che bài đi thì không trả lời được — đúng là câu đo đọc hiểu. */
  | { ok: true; note: 'blind-model-could-not-answer' }
  /** Trúng nhưng model tự nhận là đoán. Không loại, nhưng ghi lại. */
  | { ok: true; note: 'blind-guess-hit' }
  /** Trả lời sai — càng chắc là phải đọc bài mới làm được. */
  | { ok: true; note: 'blind-model-answered-wrong' }
  /** Trả lời đúng VÀ nói là xác định được. Câu này không đo đọc hiểu. */
  | { ok: false; note: 'answerable-without-passage' };

/**
 * Lời dặn cho model bị bịt mắt.
 *
 * Cố ý KHÔNG nói đây là bài kiểm tra chất lượng đề. Nói ra thì model đoán được
 * câu trả lời "đúng ý người hỏi" là "không xác định được", và nó sẽ trả lời như
 * vậy cho mọi câu — lúc đó hàng rào này luôn xanh và không chặn gì nữa.
 *
 * Cũng cố ý cho phép nó nói không biết. Không cho lối ra thì nó buộc phải chọn
 * bừa, và một lần chọn bừa trúng trong ba phương án sẽ loại oan một câu tốt.
 */
export function buildBlindPrompt(draft: ProbeDraft): string {
  return [
    'Answer this multiple-choice question.',
    'You have NOT been given the source text, and you will not be given it.',
    '',
    `QUESTION: ${draft.stem}`,
    '',
    'OPTIONS:',
    ...draft.options.map((o, i) => `${i}. ${o}`),
    '',
    'Return ONE JSON object and nothing else:',
    '{"choice": <option number, or null if you cannot tell>, "determinable": <true if the',
    'answer can be determined from general knowledge or from the options alone, false if',
    'you would need the source text>}',
    '',
    'Answer honestly. Guessing is allowed, but if you are guessing set "determinable" to false.',
  ].join('\n');
}

/** Đọc câu trả lời của model bị bịt mắt. `null` khi không đọc nổi. */
export function readBlindAnswer(text: string, optionCount: number): BlindAnswer | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced?.[1] ?? text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;

  const d = raw as Record<string, unknown>;
  const determinable = d.determinable === true;

  if (d.choice === null || d.choice === undefined) return { choice: null, determinable };
  if (typeof d.choice !== 'number' || !Number.isInteger(d.choice)) return null;
  // Chọn ra ngoài dải là câu trả lời hỏng, không phải câu trả lời "không biết".
  if (d.choice < 0 || d.choice >= optionCount) return null;

  return { choice: d.choice, determinable };
}

/**
 * Luật rút kết luận — thuần, không gọi model.
 *
 * CHỈ LOẠI KHI CẢ HAI TÍN HIỆU CÙNG CHỈ MỘT HƯỚNG: trả lời trúng, VÀ tự nhận là
 * xác định được. Trúng mà nhận là đoán thì với ba phương án, một phần ba số câu
 * tốt sẽ bị loại oan — và loại oan thì mọi phép thử đều rơi về "không dựng
 * được", đúng cái chết mà `draft-schema.ts` đã cảnh báo một lần rồi.
 *
 * Trường hợp trúng-mà-nhận-đoán vẫn được ghi lại. Một câu bị đoán trúng nhiều
 * lần không phải chuyện ngẫu nhiên nữa, nhưng kết luận ấy phải rút từ SỐ LIỆU
 * gộp lại, không rút từ một lần thử.
 */
export function judgeBlindAnswer(draft: ProbeDraft, blind: BlindAnswer): BlindVerdict {
  if (blind.choice === null) return { ok: true, note: 'blind-model-could-not-answer' };
  if (blind.choice !== draft.correctOption) return { ok: true, note: 'blind-model-answered-wrong' };
  return blind.determinable
    ? { ok: false, note: 'answerable-without-passage' }
    : { ok: true, note: 'blind-guess-hit' };
}
