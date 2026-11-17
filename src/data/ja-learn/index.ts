import grammarJson from './grammar.json';

/** Ngữ pháp JLPT N5–N1 do Band 9 tự biên soạn (khung điểm ngữ pháp theo mức thường dạy, không chép giáo trình nào). */
export type JaLevel = 5 | 4 | 3 | 2 | 1;
export const JA_LEVELS: readonly JaLevel[] = [5, 4, 3, 2, 1];

export type JaGrammarExample = { ja: string; vi: string; /** Đoạn cần tô, là chuỗi con của `ja`. */ mark: string };
export type JaGrammarPoint = {
  id: string;
  level: JaLevel;
  order: number;
  pattern: string;
  meaning: string;
  form: string;
  tip: string;
  examples: JaGrammarExample[];
};

export const JA_GRAMMAR: JaGrammarPoint[] = grammarJson as JaGrammarPoint[];
export const jaGrammarOfLevel = (level: JaLevel) => JA_GRAMMAR.filter((g) => g.level === level);
export const jaLevelLabel = (level: JaLevel) => `N${level}`;

const fold = (s: string) => {
  const lower = s.toLowerCase();
  const nfd = typeof lower.normalize === 'function' ? lower.normalize('NFD').replace(/[̀-ͯ]/g, '') : lower;
  return nfd.replace(/đ/g, 'd').trim();
};

/** Tìm theo mẫu câu, nghĩa, ghi chú hoặc câu ví dụ (không dấu cũng được). */
export function searchJaGrammar(query: string, level?: JaLevel): JaGrammarPoint[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return JA_GRAMMAR.filter((g) => (!level || g.level === level) && words.every((w) => fold(`${g.pattern} ${g.meaning} ${g.form} ${g.tip} ${g.examples.map((e) => `${e.ja} ${e.vi}`).join(' ')}`).includes(w)));
}

export type JaCloze = { id: string; before: string; after: string; options: string[]; answer: number; point: JaGrammarPoint; full: string; vi: string };

/** Câu điền chỗ trống: che đoạn `mark` của một ví dụ, 3 đáp án nhiễu lấy từ điểm khác cùng cấp. */
export function makeCloze(level: JaLevel, count = 10, rnd: () => number = Math.random): JaCloze[] {
  const pts = jaGrammarOfLevel(level);
  const shuffle = <T,>(a: readonly T[]) => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      [r[i], r[j]] = [r[j]!, r[i]!];
    }
    return r;
  };
  return shuffle(pts)
    .slice(0, count)
    .map((p) => {
      const ex = p.examples[Math.floor(rnd() * p.examples.length)]!;
      const at = ex.ja.indexOf(ex.mark);
      const others = shuffle(pts.filter((q) => q.id !== p.id).flatMap((q) => q.examples.map((e) => e.mark)).filter((m) => m !== ex.mark));
      // Ưu tiên đáp án nhiễu có độ dài gần đoạn đúng để không lộ ra nhờ hình dạng.
      const distractors = Array.from(new Set(others))
        .sort((a, b) => Math.abs(a.length - ex.mark.length) - Math.abs(b.length - ex.mark.length))
        .slice(0, 3);
      const options = shuffle([ex.mark, ...distractors]);
      return { id: `${p.id}:${at}`, before: ex.ja.slice(0, at), after: ex.ja.slice(at + ex.mark.length), options, answer: options.indexOf(ex.mark), point: p, full: ex.ja, vi: ex.vi };
    });
}
