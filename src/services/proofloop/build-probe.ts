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
};

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
  return [
    'You build ONE diagnostic probe for an IELTS Reading learner.',
    'You do not judge the learner. You only build the probe.',
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
