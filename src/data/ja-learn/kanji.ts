import kanjiJson from './kanji.json';
import type { JaLevel } from './index';

/** Kanji JLPT N5–N1 (OpenJLPT từ KANJIDIC2, CC BY-SA 4.0; âm Hán Việt từ KANJIDIC2). */
export type JaKanji = {
  c: string;
  lv: JaLevel;
  /** Số nét. */
  st: number | null;
  /** Âm On (katakana). */
  on: string[];
  /** Âm Kun (hiragana, dấu chấm tách okurigana). */
  kun: string[];
  /** Nghĩa tiếng Anh. */
  en: string[];
  /** Âm Hán Việt. */
  hv: string[];
  /** Từ thường gặp chứa chữ này. */
  w: string[];
};

export const JA_KANJI: JaKanji[] = kanjiJson as JaKanji[];
export const jaKanjiOfLevel = (level: JaLevel) => JA_KANJI.filter((k) => k.lv === level);

const fold = (s: string) => {
  const lower = s.toLowerCase();
  const nfd = typeof lower.normalize === 'function' ? lower.normalize('NFD').replace(/[̀-ͯ]/g, '') : lower;
  return nfd.replace(/đ/g, 'd').trim();
};

/** Tìm theo chữ kanji, âm Hán Việt (có/không dấu), cách đọc, nghĩa tiếng Anh hoặc từ ví dụ. */
export function searchJaKanji(query: string, level?: JaLevel): JaKanji[] {
  const q = query.trim();
  if (!q) return [];
  const words = fold(q).split(/\s+/).filter(Boolean);
  return JA_KANJI.filter((k) => {
    if (level && k.lv !== level) return false;
    if (q.length === 1 && k.c === q) return true;
    const hay = fold(`${k.hv.join(' ')} ${k.en.join(' ')} ${k.on.join(' ')} ${k.kun.join(' ')} ${k.w.join(' ')} ${k.c}`);
    return words.every((w) => hay.includes(w));
  });
}

export type KanjiQuestion = { id: string; kanji: JaKanji; options: string[]; answer: number };

/** Hỏi âm Hán Việt của một kanji; 3 đáp án nhiễu lấy từ kanji khác cùng cấp. */
export function makeKanjiQuiz(level: JaLevel, count = 10, rnd: () => number = Math.random): KanjiQuestion[] {
  const pool = jaKanjiOfLevel(level).filter((k) => k.hv.length > 0);
  const shuffle = <T,>(a: readonly T[]) => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      [r[i], r[j]] = [r[j]!, r[i]!];
    }
    return r;
  };
  return shuffle(pool)
    .slice(0, count)
    .map((k) => {
      const right = k.hv[0]!;
      const others = Array.from(new Set(pool.filter((x) => x.c !== k.c && !x.hv.includes(right)).map((x) => x.hv[0]!)));
      const options = shuffle([right, ...shuffle(others).slice(0, 3)]);
      return { id: k.c, kanji: k, options, answer: options.indexOf(right) };
    });
}
