/**
 * Chấm bài chép/dịch câu tiếng Trung, tiếng Nhật THEO TỪNG KÝ TỰ, đúng thứ tự (LCS).
 * Bỏ qua dấu câu, khoảng trắng, chữ hoa/thường, toàn/bán góc; katakana coi như hiragana.
 */

export type CjkCharStatus = 'correct' | 'missing' | 'punct';

export type CjkGrade = {
  /** Câu nguồn từng ký tự: đúng / thiếu / dấu câu (không tính điểm). */
  source: { ch: string; status: CjkCharStatus }[];
  /** Ký tự người học gõ thừa hoặc sai chỗ. */
  extra: string[];
  correct: number;
  total: number;
  /** 0–1 trên tổng ký tự của câu nguồn. */
  accuracy: number;
};

function foldChar(ch: string): string {
  const c = ch.normalize('NFKC').toLowerCase();
  // katakana → hiragana (ァ..ヶ)
  return c.replace(/[ァ-ヶ]/g, (k) => String.fromCharCode(k.charCodeAt(0) - 0x60));
}

const KEEP = /[\p{L}\p{N}ー]/u;

/** Các ký tự tính điểm của một chuỗi, kèm vị trí trong chuỗi gốc. */
function scored(text: string): { ch: string; idx: number }[] {
  const out: { ch: string; idx: number }[] = [];
  const chars = Array.from(text);
  chars.forEach((raw, idx) => {
    const f = foldChar(raw);
    for (const c of Array.from(f)) if (KEEP.test(c)) out.push({ ch: c, idx });
  });
  return out;
}

export function gradeCjk(sourceText: string, typedText: string): CjkGrade {
  const s = scored(sourceText);
  const t = scored(typedText);
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i]![j] = s[i]!.ch === t[j]!.ch ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  const okSource = new Set<number>();
  const okTyped = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (s[i]!.ch === t[j]!.ch) {
      okSource.add(i);
      okTyped.add(j);
      i += 1;
      j += 1;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) i += 1;
    else j += 1;
  }
  const status = new Map<number, CjkCharStatus>();
  s.forEach((x, k) => status.set(x.idx, okSource.has(k) ? (status.get(x.idx) === 'missing' ? 'missing' : 'correct') : 'missing'));
  const source = Array.from(sourceText).map((ch, idx) => ({ ch, status: (status.get(idx) ?? 'punct') as CjkCharStatus }));
  const extra = t.filter((_, k) => !okTyped.has(k)).map((x) => x.ch);
  const correct = okSource.size;
  return { source, extra, correct, total: n, accuracy: n === 0 ? 0 : correct / n };
}

/** Đạt khi đúng từ 85% ký tự và không thừa quá nhiều. */
export function isCjkPass(g: CjkGrade): boolean {
  return g.total > 0 && g.accuracy >= 0.85 && g.extra.length <= Math.max(1, Math.round(g.total * 0.15));
}
