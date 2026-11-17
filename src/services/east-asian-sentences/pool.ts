import { EAST_ASIAN_VOCAB_BOOKS } from '../../data/east-asian-vocab';
import extraSentences from '../../data/east-asian-sentences-extra.json';
import { ZH_DIALOGUES } from '../../data/zh-learn';

export type EaLang = 'zh' | 'ja';

export type EaSentence = {
  id: string;
  lang: EaLang;
  /** Câu gốc (giản thể / tiếng Nhật). */
  text: string;
  vi: string;
  en?: string;
  /** Pinyin (tiếng Trung). Tiếng Nhật chưa có dữ liệu cách đọc. */
  reading?: string;
  /** Nhãn cấp: "HSK 3" / "JLPT N4". */
  level: string;
};

export const EA_LEVELS: Record<EaLang, string[]> = {
  zh: ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'],
  ja: ['JLPT N5', 'JLPT N4', 'JLPT N3', 'JLPT N2', 'JLPT N1'],
};

const CJK = /[぀-ヿ㐀-鿿]/;
const MIN_CHARS = 4;
const MAX_CHARS = 36;

function scoredLength(text: string): number {
  return Array.from(text).filter((c) => /[\p{L}\p{N}]/u.test(c)).length;
}

let cache: Record<EaLang, EaSentence[]> | null = null;

/** Gom câu ví dụ của kho từ vựng (HSK 1–6, JLPT N5–N1) và lời thoại HSK; bỏ trùng, bỏ câu quá ngắn/dài. */
export function buildPool(): Record<EaLang, EaSentence[]> {
  if (cache) return cache;
  const out: Record<EaLang, EaSentence[]> = { zh: [], ja: [] };
  const seen = new Set<string>();
  const add = (s: EaSentence) => {
    const n = scoredLength(s.text);
    const key = `${s.lang}|${s.text}`;
    if (!CJK.test(s.text) || n < MIN_CHARS || n > MAX_CHARS || !s.vi.trim() || seen.has(key)) return;
    seen.add(key);
    out[s.lang].push(s);
  };
  for (const book of EAST_ASIAN_VOCAB_BOOKS) {
    for (const theme of book.topics) {
      for (const w of theme.words) {
        const lang = w.language;
        if ((lang !== 'zh' && lang !== 'ja') || !w.example || !w.exampleVi) continue;
        const level = EA_LEVELS[lang].find((l) => l === w.band);
        if (!level) continue;
        add({ id: `${lang}:${w.example}`, lang, text: w.example.trim(), vi: w.exampleVi.trim(), en: w.exampleEn, reading: w.exampleReading, level });
      }
    }
  }
  for (const d of ZH_DIALOGUES) {
    d.lines.forEach((l) => add({ id: `zh:${l.zh}`, lang: 'zh', text: l.zh.trim(), vi: l.vi.trim(), reading: l.py, level: `HSK ${d.level}` }));
  }
  const extra = extraSentences as { zh: { l: string; t: string; py: string; vi: string }[]; ja: { l: string; t: string; vi: string }[] };
  for (const r of extra.zh) add({ id: `zh:${r.t}`, lang: 'zh', text: r.t, vi: r.vi, reading: r.py, level: r.l });
  for (const r of extra.ja) add({ id: `ja:${r.t}`, lang: 'ja', text: r.t, vi: r.vi, level: r.l });
  cache = out;
  return out;
}

export function sentencesOf(lang: EaLang, level: string): EaSentence[] {
  return buildPool()[lang].filter((s) => s.level === level);
}

/** Mức có đủ câu để luyện (>= 10). */
export function levelsWithSentences(lang: EaLang): string[] {
  return EA_LEVELS[lang].filter((l) => sentencesOf(lang, l).length >= 10);
}

export function shuffled<T>(items: readonly T[], rnd: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Chọn `count` câu, trải đều độ dài (ngắn → dài) để mỗi lượt không toàn câu quá khó. */
export function pickRound(lang: EaLang, level: string, count = 10, rnd: () => number = Math.random): EaSentence[] {
  const picked = shuffled(sentencesOf(lang, level), rnd).slice(0, count);
  return picked.sort((a, b) => a.text.length - b.text.length);
}

/** 3 đáp án Việt gây nhiễu, cùng cấp, độ dài gần câu đúng. */
export function distractorsVi(target: EaSentence, count = 3, rnd: () => number = Math.random): string[] {
  const near = sentencesOf(target.lang, target.level).filter((s) => s.vi !== target.vi && Math.abs(s.text.length - target.text.length) <= 6);
  const pool = near.length >= count ? near : sentencesOf(target.lang, target.level).filter((s) => s.vi !== target.vi);
  return shuffled(pool, rnd).slice(0, count).map((s) => s.vi);
}
