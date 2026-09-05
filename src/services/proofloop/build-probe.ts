import {
  validateDraft,
  type DraftContext,
  type DraftRejection,
  type ProbeDraft,
} from './draft-schema';
import { FORBIDDEN_FIELDS, PROBE_BRIEF } from './prompts/probe';
import type { ProbeKind } from './types';

export type ProbeInput = {
  /** Loại đã do bảng `probe-table` định. Model chép lại, không được chọn. */
  kind: ProbeKind;
  passage: string;
  questionPrompt: string;
  correctAnswer: string;
  truthEvidenceText: string;
  /** Cụm người học đã khoanh. `null` nghĩa là chưa khoanh gì. */
  learnerPhrase: string | null;
  /**
   * Lý do bản nháp trước bị loại, để lần thử sau không lặp lại đúng lỗi ấy.
   *
   * Thử lại mà không nói vì sao trượt thì chỉ là quay xúc xắc thêm một lần: cùng
   * lời dặn, cùng bài, model có rất ít lý do để ra khác đi. Đo thật cho thấy
   * điều đó — hàng rào bịt mắt loại cả hai lần liên tiếp với cùng một kiểu lỗi.
   */
  retryBecause?: RetryReason | null;
};

/** Lý do loại mà nói lại cho model thì nó sửa được. */
export type RetryReason =
  | 'answerable-without-passage'
  | 'stem-leaks-decisive-phrase'
  | 'transfer-reuses-original-evidence'
  | 'transfer-reuses-original-stem'
  | 'evidence-paragraph-mismatch'
  | 'duplicate-options'
  | 'evidence-not-verbatim';

const RETRY_NOTE: Readonly<Record<RetryReason, string>> = Object.freeze({
  'answerable-without-passage':
    'Your previous attempt was REJECTED: another model answered it correctly WITHOUT reading the passage. The question must be unanswerable from general knowledge or from the shape of the options alone. Make every option plausible to someone who has not read the text, so that only the passage separates them.',
  'stem-leaks-decisive-phrase':
    'Your previous attempt was REJECTED: the decisive phrase appeared inside the question stem, so the learner could match strings instead of reading. Keep that wording out of the stem.',
  'transfer-reuses-original-evidence':
    'Your previous attempt was REJECTED: it reused the original evidence sentence. Build the question on different content.',
  'transfer-reuses-original-stem':
    'Your previous attempt was REJECTED: it restated the original question. Ask something genuinely different.',
  'evidence-paragraph-mismatch':
    'Your previous attempt was REJECTED: evidenceParagraphIndex did not point at the paragraph containing evidenceText. Count paragraphs from 0.',
  'duplicate-options': 'Your previous attempt was REJECTED: two options were the same. Make every option distinct.',
  'evidence-not-verbatim':
    'Your previous attempt was REJECTED: evidenceText was not copied verbatim from the passage. Copy it character for character.',
});

/** Lý do này nói lại cho model thì có ích, hay chỉ là nhiễu. */
export function retryNoteFor(reason: string): string | null {
  return RETRY_NOTE[reason as RetryReason] ?? null;
}

export type ParseResult =
  | { ok: true; draft: ProbeDraft }
  | { ok: false; reason: DraftRejection | 'not-json' };

/**
 * Dựng lời dặn cho model.
 *
 * Hàm này thuần và có test, tách hẳn khỏi việc gọi mạng — vì phần đáng kiểm là
 * nội dung lời dặn, không phải cái ống dẫn. Việc gọi mạng nằm ở API route.
 */
export function buildProbePrompt(input: ProbeInput): string {
  const retry = input.retryBecause ? RETRY_NOTE[input.retryBecause] : null;
  return [
    'You build ONE diagnostic probe for an IELTS Reading learner.',
    'You do not judge the learner. You only build the probe.',
    // Đặt ngay đầu, trước cả bài đọc: lời dặn sửa lỗi nằm cuối một prompt dài
    // thì model hay bỏ qua, mà đây đúng là câu quan trọng nhất của lần thử này.
    ...(retry ? ['', retry] : []),
    '',
    `PROBE KIND (assigned, do not change): ${input.kind}`,
    `TASK: ${PROBE_BRIEF[input.kind]}`,
    '',
    'PASSAGE:',
    input.passage,
    '',
    `ORIGINAL QUESTION: ${input.questionPrompt}`,
    `CORRECT ANSWER: ${input.correctAnswer}`,
    `SENTENCE THAT SUPPORTS IT: ${input.truthEvidenceText}`,
    `LEARNER MARKED AS EVIDENCE: ${input.learnerPhrase ?? 'nothing'}`,
    '',
    'Return ONE JSON object and nothing else:',
    '{"kind":string,"stem":string,"options":string[],"correctOption":number,',
    '"evidenceText":string,"evidenceParagraphIndex":number,"decisivePhrase":string,',
    '"whyEachWrong":string[],"insufficientEvidence":boolean}',
    '',
    'HARD RULES:',
    `1. "kind" must be exactly "${input.kind}".`,
    '2. "evidenceText" must be copied VERBATIM from the passage above.',
    '3. "decisivePhrase" must be a substring of "evidenceText".',
    '4. "whyEachWrong" must have exactly one entry per WRONG option.',
    '5. "options" must have at least two entries.',
    `6. Never output these fields: ${FORBIDDEN_FIELDS.join(', ')}.`,
    '   You do not decide what the learner understands. A fixed rule engine does that.',
    '7. If the passage does not support a fair probe of this kind, set',
    '   "insufficientEvidence": true. Saying so is correct behaviour, not failure.',
  ].join('\n');
}

/**
 * Lấy JSON ra khỏi câu trả lời.
 *
 * Model hay bọc JSON trong khối mã, hoặc kèm một câu dẫn trước và một câu chào
 * sau. Cắt từ dấu `{` đầu tới `}` cuối là cách chịu được cả ba kiểu đó mà không
 * cần model phải ngoan.
 */
function extractJson(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced?.[1] ?? text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Đọc câu trả lời rồi đưa thẳng qua hàng rào `validateDraft`.
 *
 * Đọc được KHÔNG có nghĩa là nhận. Hai bước tách bạch: `not-json` là model nói
 * không đúng định dạng, còn các lý do khác là model nói đúng định dạng nhưng
 * sai nội dung. Gộp hai thứ đó lại thì lúc hỏng không biết hỏng ở đâu.
 */
export function parseProbeResponse(text: string, ctx: DraftContext): ParseResult {
  const raw = extractJson(text);
  if (raw === null) return { ok: false, reason: 'not-json' };
  return validateDraft(raw, ctx);
}
