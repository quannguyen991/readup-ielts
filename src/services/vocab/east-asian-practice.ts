import type { StudyWord } from './topic-study';

/** Luyện nghe / nói / trắc nghiệm cho bộ tiếng Trung và tiếng Nhật. */

export const isEastAsian = (w?: StudyWord | null) => w?.language === 'ja' || w?.language === 'zh';

export const speechLang = (w?: StudyWord | null) => (w?.language === 'ja' ? 'ja-JP' : w?.language === 'zh' ? 'zh-CN' : 'en-US');

/** Từ đồng âm đánh số (本1, 点2) -> bỏ số cuối để đọc/so khớp. */
export const spoken = (w: StudyWord) => w.word.replace(/\d+$/, '');

/** Bỏ dấu thanh, khoảng trắng, dấu câu, đổi katakana -> hiragana để so cách đọc. */
export function readingKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase()
    .replace(/[\s·・。、，,.!?！？~～ー'’-]/g, '');
}

/** Máy nhận giọng nghe được gì → đúng nếu chứa từ đó, hoặc trùng cách đọc (pinyin không dấu / kana). */
export function heardMatches(alts: readonly string[], w: StudyWord): boolean {
  const target = spoken(w).replace(/[～〜（）()／/]/g, '');
  const reading = readingKey(w.language === 'ja' ? w.ipa : w.ipa);
  return alts.some((a) => {
    const t = a.replace(/[\s。、，,.!?！？]/g, '');
    return (target && t.includes(target)) || (reading.length >= 2 && readingKey(a) === reading);
  });
}

/** Gõ cách đọc cũng được tính đúng khi chép chính tả (không cần bộ gõ chữ Hán). */
export function typedMatches(typed: string, w: StudyWord): boolean {
  const k = readingKey(typed);
  if (!k) return false;
  const targets = [spoken(w), readingKey(w.ipa), readingKey(w.romanization ?? '')].map((x) => readingKey(x));
  return targets.some((t) => t && t === k);
}

export type EaQuestion = {
  kind: 'meaning' | 'word' | 'cloze' | 'listen' | 'listenSentence';
  word: StudyWord;
  prompt: string;
  /** Câu/chữ hiện dưới đề (ví dụ câu có chỗ trống). */
  stem?: string;
  options: string[];
  correct: number;
  /** Văn bản để máy đọc (dạng nghe). */
  audio?: string;
};

const label = (w: StudyWord) => w.meaningVi.split(';')[0]!.trim();

function pickOthers(word: StudyWord, pool: readonly StudyWord[], n: number, rng: () => number, by: (w: StudyWord) => string): StudyWord[] {
  const own = by(word);
  const seen = new Set([own]);
  const out: StudyWord[] = [];
  // ưu tiên cùng loại từ để đáp án nhiễu hợp lý
  const same = pool.filter((p) => p.pos === word.pos);
  for (const list of [same, pool]) {
    let guard = 0;
    while (out.length < n && guard++ < 400) {
      const p = list[Math.floor(rng() * list.length)];
      if (!p) break;
      const key = by(p);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

function arrange(correct: string, others: string[], rng: () => number) {
  const options = [correct, ...others];
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }
  return { options, correct: options.indexOf(correct) };
}

export function buildEaQuestion(word: StudyWord, pool: readonly StudyWord[], rng: () => number, kinds: EaQuestion['kind'][]): EaQuestion {
  const usable = kinds.filter((k) => (k === 'cloze' || k === 'listenSentence' ? Boolean(word.example && word.example.includes(spoken(word))) : true));
  const kind = usable[Math.floor(rng() * usable.length)] ?? 'meaning';
  const zh = word.language === 'zh';
  const lang = zh ? 'tiếng Trung' : 'tiếng Nhật';

  if (kind === 'word') {
    const o = pickOthers(word, pool, 3, rng, (w) => spoken(w));
    const a = arrange(spoken(word), o.map(spoken), rng);
    return { kind, word, prompt: `Từ ${lang} nào có nghĩa là:`, stem: label(word), ...a };
  }
  if (kind === 'cloze') {
    const o = pickOthers(word, pool, 3, rng, (w) => spoken(w));
    const a = arrange(spoken(word), o.map(spoken), rng);
    return { kind, word, prompt: 'Điền từ vào chỗ trống:', stem: word.example.replace(spoken(word), '＿＿＿'), ...a };
  }
  if (kind === 'listen' || kind === 'listenSentence') {
    const sentence = kind === 'listenSentence';
    const o = pickOthers(word, pool, 3, rng, label);
    const a = arrange(label(word), o.map(label), rng);
    return { kind, word, prompt: sentence ? 'Nghe câu, chọn nghĩa của từ được dùng:' : 'Nghe và chọn nghĩa đúng:', audio: sentence ? word.example : spoken(word), ...a };
  }
  const o = pickOthers(word, pool, 3, rng, label);
  const a = arrange(label(word), o.map(label), rng);
  return { kind: 'meaning', word, prompt: 'Chọn nghĩa đúng của:', stem: spoken(word), ...a };
}

/** Độ giống giữa lời máy nghe được và câu mẫu (0..1), tính theo chữ, bỏ dấu câu. */
export function similarity(a: string, b: string): number {
  const clean = (s: string) => Array.from(readingKey(s));
  const x = clean(a);
  const y = clean(b);
  if (!x.length || !y.length) return 0;
  const prev = new Array<number>(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i += 1) {
    let diag = 0;
    for (let j = 1; j <= y.length; j += 1) {
      const tmp = prev[j]!;
      prev[j] = x[i - 1] === y[j - 1] ? diag + 1 : Math.max(prev[j]!, prev[j - 1]!);
      diag = tmp;
    }
  }
  return prev[y.length]! / Math.max(x.length, y.length);
}
