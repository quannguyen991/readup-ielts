import { BLANK, type VocabItem } from './generate';
import { frameFor } from './frames';

/**
 * Hàng rào cho câu "Từ trong ngữ cảnh".
 *
 * NÓI TRƯỚC CHỖ NÓ KHÔNG LÀM ĐƯỢC. Hàng rào này kiểm được HÌNH THỨC — đúng một
 * chỗ trống, bốn phương án khác nhau, đáp án không lộ trong câu, không phương án
 * nào là biến thể hình thái của phương án khác. Nó KHÔNG kiểm được điều quan
 * trọng nhất: ngữ cảnh có ép ra đúng một từ hay không. Đó là phán đoán ngữ
 * nghĩa, và nó nằm ở bộ nhiễu SOẠN TAY chứ không nằm ở đây.
 *
 * Ghi rõ giới hạn này thay vì để người đọc mã tưởng hàng rào lo hết — cùng lý do
 * mà nhãn xuất xứ phải có trạng thái `not-run`: một hàng rào im lặng về chỗ nó
 * không với tới được thì đọc ra như một lời bảo đảm.
 */

export type VocabRejection =
  | 'no-blank'
  | 'multiple-blanks'
  | 'answer-leaks-in-passage'
  | 'duplicate-options'
  | 'morphological-overlap'
  | 'unknown-word'
  | 'answer-index-mismatch'
  | 'passage-too-short';

export type VocabVerdict = { ok: true } | { ok: false; reason: VocabRejection };

/** Hai từ có cùng gốc không: `precise` vs `precisely`, `persistent` vs `persist`. */
function sameStem(a: string, b: string): boolean {
  const strip = (w: string) => w.toLowerCase().replace(/(ly|ness|ity|ing|ed|es|s)$/, '');
  const x = strip(a);
  const y = strip(b);
  if (x === y) return true;
  const [shortW, longW] = x.length <= y.length ? [x, y] : [y, x];
  return shortW.length >= 5 && longW.startsWith(shortW);
}

export function verifyVocabItem(item: VocabItem): VocabVerdict {
  const blanks = item.passage.split(BLANK).length - 1;
  if (blanks === 0) return { ok: false, reason: 'no-blank' };
  if (blanks > 1) return { ok: false, reason: 'multiple-blanks' };

  if (item.passage.replace(BLANK, '').trim().length < 80) {
    return { ok: false, reason: 'passage-too-short' };
  }

  if (!frameFor(item.word)) return { ok: false, reason: 'unknown-word' };
  if (item.options[item.answerIndex] !== item.word) {
    return { ok: false, reason: 'answer-index-mismatch' };
  }

  const lower = item.options.map((o) => o.toLowerCase());
  if (new Set(lower).size !== lower.length) return { ok: false, reason: 'duplicate-options' };

  /*
    ĐÁP ÁN KHÔNG ĐƯỢC XUẤT HIỆN LẠI TRONG CHÍNH BÀI DẪN. Câu nào lặp lại từ đích
    ở chỗ khác là câu tự lộ: người học dò chuỗi là ra, không cần hiểu nghĩa.
  */
  const body = item.passage.replace(BLANK, ' ').toLowerCase();
  for (const opt of item.options) {
    if (new RegExp(`(?<![a-z])${opt.toLowerCase()}(?![a-z])`).test(body)) {
      return { ok: false, reason: 'answer-leaks-in-passage' };
    }
  }

  /*
    KHÔNG PHƯƠNG ÁN NÀO ĐƯỢC CÙNG GỐC VỚI PHƯƠNG ÁN KHÁC. `precise` cạnh
    `precisely` là hai cách viết một ý — người học không chọn được, và nếu chọn
    trúng thì cũng không chứng minh được gì.
  */
  for (let i = 0; i < item.options.length; i += 1) {
    for (let j = i + 1; j < item.options.length; j += 1) {
      if (sameStem(item.options[i]!, item.options[j]!)) {
        return { ok: false, reason: 'morphological-overlap' };
      }
    }
  }

  return { ok: true };
}
