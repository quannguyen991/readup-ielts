/**
 * Chấm phát âm theo TỪ, dựa trên bản chữ mà bộ nhận giọng trả về.
 *
 * Trung thực về giới hạn: đây là đối chiếu chữ, không phải phân tích âm thanh.
 * Một từ "đúng chữ" có thể vẫn phát âm chưa chuẩn, và ngược lại máy nghe sai một
 * từ đúng. Vì vậy điểm dùng để hướng dẫn luyện tập, không phải band chính thức.
 */

export type WordScore = {
  target: string;
  heard: string | null;
  /** 0–100. */
  score: number;
  band: 'good' | 'fair' | 'poor';
};

export function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z']/g, '');
}

export function tokens(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w.length > 0);
}

/** Khoảng cách Levenshtein giữa hai chuỗi. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return prev[b.length] ?? 0;
}

export function bandOf(score: number): WordScore['band'] {
  if (score >= 85) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

/** Ngưỡng màu của đề bài: xanh ≥ 85, vàng 60–84, đỏ < 60. */
export function scoreWord(target: string, heard: string | null): number {
  const t = normalizeWord(target);
  const h = heard ? normalizeWord(heard) : '';
  if (!t) return 100;
  if (!h) return 0;
  const longest = Math.max(t.length, h.length);
  return Math.max(0, Math.round((1 - editDistance(t, h) / longest) * 100));
}

/**
 * Căn từng từ mục tiêu với bản nghe được theo thứ tự, bỏ qua từ thừa của máy.
 * Một từ không khớp chỗ nào thì nhận điểm 0 và được đánh dấu đỏ.
 */
export function scoreTranscript(target: string, transcript: string): { words: WordScore[]; overall: number } {
  const targets = target.split(/\s+/).filter(Boolean);
  const heard = tokens(transcript);
  let cursor = 0;
  const words: WordScore[] = targets.map((raw) => {
    // Tìm từ nghe được gần nhất (trong cửa sổ nhỏ) để không lệch cả câu vì một từ thiếu.
    let best = -1;
    let bestScore = -1;
    for (let k = cursor; k < Math.min(heard.length, cursor + 3); k += 1) {
      const s = scoreWord(raw, heard[k] ?? null);
      if (s > bestScore) {
        bestScore = s;
        best = k;
      }
    }
    const hit = best >= 0 && bestScore >= 50 ? heard[best] ?? null : null;
    if (hit !== null) cursor = best + 1;
    const score = hit !== null ? bestScore : 0;
    return { target: raw, heard: hit, score, band: bandOf(score) };
  });
  const overall = words.length ? Math.round(words.reduce((sum, w) => sum + w.score, 0) / words.length) : 0;
  return { words, overall };
}
