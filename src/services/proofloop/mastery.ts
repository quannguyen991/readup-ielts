import type { MicroSkill, ProbeKind } from './types';

export type ProbeOutcome = {
  skill: MicroSkill;
  kind: ProbeKind;
  passed: boolean;
  /** Bài đọc nơi lỗi xuất hiện. */
  sourceArticleId: string;
  /** Bài đọc của chính phép thử. Khác `sourceArticleId` thì mới là chuyển giao. */
  probeArticleId: string;
};

export type MasteryLedger = Readonly<Record<MicroSkill, boolean>>;

export function emptyLedger(): MasteryLedger {
  return { locate: false, paraphrase: false, entailment: false, quantifier: false };
}

/**
 * Chỉ `transfer` trên một bài KHÁC mới sinh ra mastery (§2.3).
 *
 * Hai lối chặn ở đây, và cả hai đều có lý do:
 *
 * 1. Loại phép thử phải là `transfer`. Vượt P2 hay P3 nghĩa là đã làm rõ được
 *    một điều chưa biết — không phải đã chuyển hoá thành kỹ năng. Hạ chuẩn để
 *    bảng trông đẹp hơn chính là thứ ràng buộc này sinh ra để chặn.
 *
 * 2. Bài của phép thử phải khác bài gốc. Làm lại đúng bài cũ thì không tách
 *    được "đã hiểu" khỏi "nhớ đáp án", mà tách được hai thứ đó chính là toàn bộ
 *    lý do phép thử chuyển giao tồn tại.
 *
 * Một lần trượt sau đó GỠ LẠI xác nhận: mastery là phát biểu về hiện tại, không
 * phải huy chương đã trao.
 */
export function applyOutcome(ledger: MasteryLedger, outcome: ProbeOutcome): MasteryLedger {
  if (outcome.kind !== 'transfer') return ledger;
  if (outcome.probeArticleId === outcome.sourceArticleId) return ledger;
  return { ...ledger, [outcome.skill]: outcome.passed };
}

export function statusOf(
  ledger: MasteryLedger,
  skill: MicroSkill,
): 'confirmed' | 'not-confirmed' {
  return ledger[skill] ? 'confirmed' : 'not-confirmed';
}
