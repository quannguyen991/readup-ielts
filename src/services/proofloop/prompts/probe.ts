import type { ProbeKind } from '../types';

/**
 * Việc mỗi phép thử phải làm — viết cho model, một câu, không diễn giải thêm.
 *
 * Viết bằng tiếng Anh vì bài đọc, câu hỏi và đáp án đều bằng tiếng Anh; trộn
 * hai ngôn ngữ trong cùng một lời dặn làm model bám lời dặn kém hẳn.
 *
 * Mỗi câu dưới đây phải nêu rõ CÁI GÌ BỊ CẤM, không chỉ cái phải làm. Với
 * `evidence-reselect`, "đừng giải thích" quan trọng hơn "hãy hỏi lại" — giải
 * thích trước là mớm đáp án, và phép thử mất sạch giá trị.
 */
export const PROBE_BRIEF: Readonly<Record<ProbeKind, string>> = Object.freeze({
  transfer:
    'Build ONE new question testing the same micro-skill on DIFFERENT content within this passage. Do not reuse the original wording or the original evidence sentence.',
  'evidence-reselect':
    'Do NOT explain or reveal the answer. Build ONE question asking the learner to identify which sentence in the passage actually supports the correct answer.',
  entailment:
    'Quote the evidence sentence, then give three claims about it: exactly one entailed by it, one contradicted by it, and one that cannot be determined from it. Do not ask the learner to locate anything.',
  locate:
    'Do NOT ask for the answer and do NOT reveal it. Ask only which paragraph contains the information needed to answer.',
});

/** Phải khớp danh sách `FORBIDDEN` trong `draft-schema.ts`. */
export const FORBIDDEN_FIELDS = [
  'state',
  'diagnosis',
  'mastery',
  'skillLevel',
  'nextLesson',
  'understood',
];
