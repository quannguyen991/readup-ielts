import { evaluate, supportsThesis, valueAt } from './evaluate';
import type { EvidenceItem } from './types';

/**
 * Hàng rào: câu nào không qua thì BỎ, không hạ chuẩn cho đủ số.
 *
 * Cùng kỷ luật với `services/questions/verify.ts` của bộ sinh IELTS: mỗi câu dựng
 * xong đi qua đây ngay, hỏng thì thử hạt giống khác. Không có đường nào để một
 * câu chưa kiểm lọt ra ngoài.
 *
 * LUẬT SỐ 1 LÀ LUẬT ĐẮT NHẤT NẾU SAI. Một câu trắc nghiệm có hai đáp án đúng thì
 * người học làm đúng vẫn bị chấm sai, và họ sẽ không bao giờ biết vì sao — họ sẽ
 * nghĩ mình hiểu sai. Thà loại oan một câu tốt.
 */

export type EvidenceRejection =
  /** Không có phương án nào vừa đúng vừa đỡ nhận định. */
  | 'no-correct-option'
  /** Nhiều hơn một phương án đúng với bảng VÀ đỡ nhận định. */
  | 'multiple-correct-options'
  /** `answerIndex` không trỏ vào phương án đúng ấy. */
  | 'answer-index-mismatch'
  /** Hai phương án trùng chữ sau khi chuẩn hoá. */
  | 'duplicate-options'
  /** Phương án nêu một con số không có trong bảng mà không mang mã `not_in_table`. */
  | 'unexplained-number'
  /** Bảng không đọc được: thiếu hàng, thiếu cột, có ô trống. */
  | 'malformed-table';

export type EvidenceVerdict = { ok: true } | { ok: false; reason: EvidenceRejection };

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Mọi con số xuất hiện trong một câu chữ. */
function numbersIn(text: string): number[] {
  return [...text.matchAll(/\d+/g)].map((m) => Number(m[0]));
}

export function verifyEvidenceItem(item: EvidenceItem): EvidenceVerdict {
  const { table, options } = item;

  if (table.rows.length < 3 || table.columns.length < 2) return { ok: false, reason: 'malformed-table' };
  if (table.rows.some((r) => r.values.length !== table.columns.length)) {
    return { ok: false, reason: 'malformed-table' };
  }
  if (table.rows.some((r) => r.values.some((v) => !Number.isFinite(v)))) {
    return { ok: false, reason: 'malformed-table' };
  }

  const texts = options.map((o) => norm(o.text));
  if (new Set(texts).size !== texts.length) return { ok: false, reason: 'duplicate-options' };

  /*
    ĐÚNG = vừa đúng với bảng, VỪA đỡ nhận định. Tách hai điều kiện là toàn bộ lý
    do dạng đề này khó: một phương án đúng mà không đỡ nhận định vẫn là phương án
    SAI, và đó chính là nhiễu `accurate_but_irrelevant`.
  */
  const correct = options
    .map((o, i) => ({ i, ok: evaluate(table, o.claim) && supportsThesis(o.claim, item.thesis) }))
    .filter((x) => x.ok)
    .map((x) => x.i);

  if (correct.length === 0) return { ok: false, reason: 'no-correct-option' };
  if (correct.length > 1) return { ok: false, reason: 'multiple-correct-options' };
  if (correct[0] !== item.answerIndex) return { ok: false, reason: 'answer-index-mismatch' };

  /*
    MỌI CON SỐ TRONG PHƯƠNG ÁN PHẢI CÓ TRONG BẢNG — trừ phương án mang mã
    `not_in_table`, vốn tồn tại chính để nêu một số lạ. Không có luật này thì một
    lỗi làm tròn hay một số bịa lọt vào phương án khác mà không ai thấy.

    Nhãn cột cũng là số ("2019"), nên chúng được tính là hợp lệ.
  */
  const allowed = new Set<number>([
    ...table.rows.flatMap((r) => r.values),
    ...table.columns.map(Number).filter(Number.isFinite),
  ]);
  // Mức chênh lệch cũng được nêu trong câu chữ của phương án đúng.
  for (const r of table.rows) allowed.add(Math.abs(r.values[1]! - r.values[0]!));

  for (const o of options) {
    if (o.code === 'not_in_table') continue;
    if (numbersIn(o.text).some((n) => !allowed.has(n))) {
      return { ok: false, reason: 'unexplained-number' };
    }
  }

  // Phương án `not_in_table` phải THẬT SỰ nêu số lạ, nếu không nó chỉ là nhiễu rỗng.
  for (const o of options) {
    if (o.code !== 'not_in_table') continue;
    if (o.claim.kind !== 'value') continue;
    if (valueAt(table, o.claim.entity, o.claim.column) === o.claim.value) {
      return { ok: false, reason: 'unexplained-number' };
    }
  }

  return { ok: true };
}
