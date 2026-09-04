import type { ProbeKind } from './types';

export type ProbeDraft = {
  kind: ProbeKind;
  stem: string;
  options: string[];
  correctOption: number;
  evidenceText: string;
  evidenceParagraphIndex: number;
  decisivePhrase: string;
  whyEachWrong: string[];
  insufficientEvidence: boolean;
};

export type DraftRejection =
  | 'not-an-object'
  | 'forbidden-field'
  | 'shape-invalid'
  | 'kind-mismatch'
  | 'evidence-not-verbatim'
  | 'phrase-not-in-evidence'
  | 'why-count-mismatch'
  | 'correct-option-out-of-range'
  | 'insufficient-evidence';

export type DraftContext = { passage: string; expectedKind: ProbeKind };

export type DraftResult =
  | { ok: true; draft: ProbeDraft }
  | { ok: false; reason: DraftRejection };

/**
 * Sáu trường model KHÔNG BAO GIỜ được ghi.
 *
 * Nếu model được phép ghi "đã hiểu" thì một lời giải thích trôi chảy sẽ tự
 * phong cho mình là bằng chứng học tập. Quyền kết luận nằm ở bộ luật, và bộ
 * luật được công bố.
 *
 * Danh sách này phải khớp với danh sách nêu trong prompt — prompt nói cấm, chỗ
 * này thi hành. Nói mà không thi hành thì chỉ là lời khuyên gửi cho model.
 */
const FORBIDDEN = [
  'state',
  'diagnosis',
  'mastery',
  'skillLevel',
  'nextLesson',
  'understood',
] as const;

/**
 * So nguyên văn nhưng tha khoảng trắng thừa và hoa thường.
 *
 * Model hay trả lại chữ đã bị chuẩn hoá nhẹ so với bài gốc. Đó không phải bịa,
 * nên loại vì chuyện đó là loại oan — mà loại oan thì mọi phép thử đều rơi về
 * "chưa đủ dữ liệu" và tính năng coi như chết.
 */
function normalise(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Bảy luật kiểm chạy SAU KHI model đã nói.
 *
 * Đây là chỗ biến "AI không được bịa" từ một câu trong prompt thành điều kiện
 * kiểm được. Prompt là lời dặn; hàm này là hàng rào.
 */
export function validateDraft(raw: unknown, ctx: DraftContext): DraftResult {
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'not-an-object' };
  const d = raw as Record<string, unknown>;

  for (const field of FORBIDDEN) {
    if (field in d) return { ok: false, reason: 'forbidden-field' };
  }

  // Lối thoát trung thực của model: bài không đủ căn cứ thì nói ra, đừng bịa.
  if (d.insufficientEvidence === true) return { ok: false, reason: 'insufficient-evidence' };

  const shapeOk =
    typeof d.kind === 'string' &&
    typeof d.stem === 'string' &&
    Array.isArray(d.options) &&
    d.options.every((o) => typeof o === 'string') &&
    d.options.length >= 2 &&
    typeof d.correctOption === 'number' &&
    Number.isInteger(d.correctOption) &&
    typeof d.evidenceText === 'string' &&
    typeof d.evidenceParagraphIndex === 'number' &&
    typeof d.decisivePhrase === 'string' &&
    Array.isArray(d.whyEachWrong) &&
    d.whyEachWrong.every((w) => typeof w === 'string');
  if (!shapeOk) return { ok: false, reason: 'shape-invalid' };

  const draft = d as unknown as ProbeDraft;

  // Luật chọn loại nằm ở bảng, không ở model. Model chép lại loại được giao;
  // chép sai nghĩa là nó đang tự quyết định, và đó là điều bị cấm.
  if (draft.kind !== ctx.expectedKind) return { ok: false, reason: 'kind-mismatch' };

  if (!normalise(ctx.passage).includes(normalise(draft.evidenceText))) {
    return { ok: false, reason: 'evidence-not-verbatim' };
  }

  if (!normalise(draft.evidenceText).includes(normalise(draft.decisivePhrase))) {
    return { ok: false, reason: 'phrase-not-in-evidence' };
  }

  if (draft.whyEachWrong.length !== draft.options.length - 1) {
    return { ok: false, reason: 'why-count-mismatch' };
  }

  if (draft.correctOption < 0 || draft.correctOption >= draft.options.length) {
    return { ok: false, reason: 'correct-option-out-of-range' };
  }

  return { ok: true, draft };
}
