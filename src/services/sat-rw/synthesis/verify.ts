import type { SynthesisItem } from './generate';
import { subjectBySlug } from './subjects';

/**
 * Hàng rào cho câu Rhetorical Synthesis.
 *
 * Luật đắt nhất vẫn là luật số một: đúng MỘT phương án phục vụ mục đích. Hai
 * phương án cùng phục vụ thì người học làm đúng vẫn bị chấm sai, và họ sẽ nghĩ
 * mình hiểu sai chứ không nghĩ đề hỏng.
 *
 * Khác Command of Evidence ở một chỗ: ở đó "đúng" và "đỡ nhận định" là hai phép
 * kiểm tách rời. Ở đây MỌI phương án lấy từ ghi chú đều đúng theo định nghĩa —
 * chúng in ngay trên đề. Nên chỉ còn một phép kiểm: có phục vụ mục đích không.
 * Điều đó làm cái bẫy `accurate_but_irrelevant` mạnh hơn hẳn, chứ không yếu đi.
 */

export type SynthesisRejection =
  | 'unknown-subject'
  | 'unknown-goal'
  | 'no-correct-option'
  | 'multiple-correct-options'
  | 'answer-index-mismatch'
  | 'duplicate-options'
  /** Phương án mang mã `accurate_but_irrelevant` nhưng không có trong ghi chú. */
  | 'distractor-not-in-notes'
  /** Phương án mang mã `not_in_notes` nhưng lại có trong ghi chú. */
  | 'fabrication-actually-in-notes'
  | 'too-few-notes';

export type SynthesisVerdict = { ok: true } | { ok: false; reason: SynthesisRejection };

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function verifySynthesisItem(item: SynthesisItem): SynthesisVerdict {
  const subject = subjectBySlug(item.subjectSlug);
  if (!subject) return { ok: false, reason: 'unknown-subject' };
  if (!subject.goals.some((g) => g.tag === item.goalTag)) return { ok: false, reason: 'unknown-goal' };
  if (item.notes.length < 4) return { ok: false, reason: 'too-few-notes' };

  const texts = item.options.map(norm);
  if (new Set(texts).size !== texts.length) return { ok: false, reason: 'duplicate-options' };

  const noteSet = new Set(item.notes.map(norm));

  /*
    ĐÁP ÁN ĐƯỢC TÍNH LẠI TỪ NHÃN, không tin `answerIndex` của bộ sinh. Hàng rào
    mà tin con số bộ sinh đưa sang thì nó chỉ kiểm được chính mình.
  */
  const serving = item.options
    .map((text, i) => ({
      i,
      fact: subject.facts.find((f) => norm(f.text) === norm(text)),
    }))
    .filter((x) => x.fact?.tags.includes(item.goalTag))
    .map((x) => x.i);

  if (serving.length === 0) return { ok: false, reason: 'no-correct-option' };
  if (serving.length > 1) return { ok: false, reason: 'multiple-correct-options' };
  if (serving[0] !== item.answerIndex) return { ok: false, reason: 'answer-index-mismatch' };

  for (const [i, why] of item.optionWhy.entries()) {
    const inNotes = noteSet.has(norm(item.options[i]!));
    if (why === 'accurate_but_irrelevant' && !inNotes) {
      return { ok: false, reason: 'distractor-not-in-notes' };
    }
    if (why === 'not_in_notes' && inNotes) {
      return { ok: false, reason: 'fabrication-actually-in-notes' };
    }
  }

  return { ok: true };
}
