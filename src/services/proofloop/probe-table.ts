import type { ProbeKind, ProofState } from './types';

/**
 * TRẠNG THÁI → LOẠI PHÉP THỬ. Cố định, công bố, KHÔNG do model chọn.
 *
 * Nguyên tắc đặt bảng: mỗi phép thử chỉ được cô lập ĐÚNG MỘT biến. Đó là chỗ
 * chữ "thiết kế thí nghiệm" thành thật chứ không phải mỹ từ. Một phép thử vừa
 * đo định vị vừa đo suy luận thì trả lời xong vẫn không biết hỏng ở đâu.
 *
 *   aligned-correct     → transfer           cô lập: nội dung
 *       đáp án đúng, khoanh đúng. Có thể đã hiểu, cũng có thể nhớ đáp án hoặc
 *       may. Chỉ đổi bài mới tách được hai khả năng đó.
 *
 *   misaligned-correct  → evidence-reselect  cô lập: định vị bằng chứng
 *       đáp án đúng nhưng khoanh sai. Có thể bắt từ khoá, có thể khoanh nhầm.
 *       Cho khoanh lại, KHÔNG giải thích trước — giải thích trước là mớm.
 *
 *   aligned-wrong       → entailment         cô lập: quan hệ suy ra
 *       đã tìm ra đúng chỗ mà vẫn sai. Bỏ hẳn bước đi tìm, chỉ hỏi bài có đỡ
 *       mệnh đề này không. Tách được paraphrase / suy luận vượt / False-NG.
 *
 *   misaligned-wrong    → locate             cô lập: định vị
 *       chưa tìm ra chỗ. Bỏ hẳn bước suy luận, chỉ hỏi đoạn nào.
 *
 *   unobserved          → không có phép thử
 *       chưa quan sát được gì thì chưa có điều chưa biết nào để làm rõ.
 */
export const PROBE_TABLE: Readonly<Record<ProofState, ProbeKind | null>> = Object.freeze({
  'unobserved': null,
  'aligned-correct': 'transfer',
  'misaligned-correct': 'evidence-reselect',
  'aligned-wrong': 'entailment',
  'misaligned-wrong': 'locate',
});

export function probeFor(state: ProofState): ProbeKind | null {
  return PROBE_TABLE[state];
}
