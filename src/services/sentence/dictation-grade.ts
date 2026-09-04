/**
 * Chấm bài chép chính tả: so câu người học gõ với câu nguồn, THEO TỪ và THEO
 * ĐÚNG THỨ TỰ — không phải chỉ đếm hai câu có chung bao nhiêu từ.
 *
 * "Chung bao nhiêu từ" (kiểu `gradeParaphrase` ở writing) không đủ ở đây: gõ
 * đúng 12 từ nhưng đảo lộn thứ tự vẫn được điểm tuyệt đối, trong khi đó chính
 * là lỗi chép chính tả điển hình nhất (nghe kịp từ nhưng ghi sai trật tự câu).
 * Dùng LCS (longest common subsequence) theo từ: từ nào nằm trong dãy con
 * chung dài nhất, ĐÚNG THỨ TỰ, mới tính là ĐÚNG. Từ thiếu (có trong câu nguồn,
 * không khớp được) và từ thừa (người học gõ ra nhưng không khớp được) đều lộ
 * ra trong `tokens`, đủ để tô màu từng từ trên màn hình.
 */

export type DictationTokenStatus = 'correct' | 'missing' | 'extra';

export type DictationToken = {
  /** Nguyên văn (giữ hoa/thường và dấu câu) — chỉ dùng để HIỂN THỊ. */
  word: string;
  status: DictationTokenStatus;
};

export type DictationGrade = {
  /** Theo đúng thứ tự đọc: từ nguồn (đúng/thiếu) xen với từ thừa tại đúng vị trí lệch. */
  tokens: DictationToken[];
  correctCount: number;
  totalSourceWords: number;
  /** 0–1. Trên tổng số từ của câu NGUỒN, không phải câu người học gõ. */
  accuracy: number;
};

/** Hạ về so sánh được: bỏ hoa/thường, gộp dấu nháy đơn cong/thẳng, bỏ dấu câu ở đầu/cuối từ. */
function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']/g, '');
}

function tokenize(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

export function gradeDictation(source: string, typed: string): DictationGrade {
  const sourceWords = tokenize(source);
  const typedWords = tokenize(typed);
  const normSource = sourceWords.map(normalizeWord);
  const normTyped = typedWords.map(normalizeWord);

  const n = normSource.length;
  const m = normTyped.length;

  // dp[i][j] = độ dài LCS của normSource[i..] và normTyped[j..].
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      const a = dp[i + 1]?.[j + 1] ?? 0;
      const b = dp[i + 1]?.[j] ?? 0;
      const c = dp[i]?.[j + 1] ?? 0;
      dp[i]![j] = normSource[i] === normTyped[j] && normSource[i] !== '' ? a + 1 : Math.max(b, c);
    }
  }

  const tokens: DictationToken[] = [];
  let correctCount = 0;
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (normSource[i] === normTyped[j] && normSource[i] !== '') {
      tokens.push({ word: sourceWords[i]!, status: 'correct' });
      correctCount += 1;
      i += 1;
      j += 1;
    } else if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0)) {
      tokens.push({ word: sourceWords[i]!, status: 'missing' });
      i += 1;
    } else {
      tokens.push({ word: typedWords[j]!, status: 'extra' });
      j += 1;
    }
  }
  while (i < n) {
    tokens.push({ word: sourceWords[i]!, status: 'missing' });
    i += 1;
  }
  while (j < m) {
    tokens.push({ word: typedWords[j]!, status: 'extra' });
    j += 1;
  }

  return {
    tokens,
    correctCount,
    totalSourceWords: n,
    accuracy: n === 0 ? 0 : correctCount / n,
  };
}
