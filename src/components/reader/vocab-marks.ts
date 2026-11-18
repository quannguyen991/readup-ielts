/**
 * Tô màu TỪ VỰNG TRỌNG TÂM trong bài đọc song ngữ.
 *
 * Ba loại, ba cách nhìn khác nhau (để mắt phân biệt được ngay, không cần chú thích dài):
 *  - `word`   từ đơn đáng học          → gạch chân màu tím
 *  - `phrase` cụm / thành ngữ trọng tâm → nền vàng
 *  - `colloc` cụm kết hợp đi kèm từ     → nền xanh
 *
 * Hàm thuần: nhận danh sách chữ của đoạn (đúng thứ tự token đang vẽ) và danh sách từ vựng của bài.
 */

export type MarkKind = 'word' | 'phrase' | 'colloc';

export type MarkVocab = { word: string; collocation?: string };

export const MARK_STYLE: Record<MarkKind, { label: string; labelEn: string; bg: string; line: string; ink: string }> = {
  word: { label: 'Từ trọng tâm', labelEn: 'Key word', bg: 'rgba(124,92,240,0)', line: '#7C5CF0', ink: '#5B3FD0' },
  phrase: { label: 'Cụm / thành ngữ', labelEn: 'Phrase / idiom', bg: 'rgba(250,204,21,0.38)', line: 'rgba(250,204,21,0)', ink: '#5A4300' },
  colloc: { label: 'Cụm kết hợp', labelEn: 'Collocation', bg: 'rgba(96,165,250,0.30)', line: 'rgba(96,165,250,0)', ink: '#0B3C86' },
};

/** Chuẩn hoá một token: thường hoá, bỏ dấu câu hai đầu, dấu nháy cong → thẳng. */
export function normMark(s: string): string {
  return s.toLowerCase().replace(/[’‘]/g, "'").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').replace(/'s$/, '');
}

/** Gốc từ rất nhẹ: đủ để "enlisted" khớp "enlist" mà không nhầm "led" với "lead". */
export function stemMark(w: string): string {
  const s = normMark(w);
  if (s.length < 5) return s;
  for (const suf of ['ingly', 'edly', 'ing', 'ed', 'es', 'ly', 's']) {
    if (s.endsWith(suf) && s.length - suf.length >= 4) return s.slice(0, -suf.length);
  }
  return s;
}

const sameWord = (a: string, b: string) => {
  const x = normMark(a);
  const y = normMark(b);
  return x === y || (x.length >= 4 && y.length >= 4 && stemMark(x) === stemMark(y));
};

function wordsOf(phrase: string): string[] {
  return phrase.split(/\s+/).map(normMark).filter(Boolean);
}

/**
 * Với mỗi token, trả loại tô màu (hoặc undefined). `texts[i]` là chữ gốc của token thứ i.
 * Cụm nhiều từ được ưu tiên hơn từ đơn nằm trong nó.
 */
export function markKinds(texts: readonly string[], vocab: readonly MarkVocab[]): (MarkKind | undefined)[] {
  const out: (MarkKind | undefined)[] = new Array(texts.length).fill(undefined);
  if (texts.length === 0 || vocab.length === 0) return out;
  const norm = texts.map(normMark);

  const markRuns = (words: string[], kind: MarkKind, overwrite: boolean) => {
    const n = words.length;
    if (n === 0) return;
    for (let i = 0; i + n <= texts.length; i++) {
      let ok = true;
      for (let k = 0; k < n; k++) {
        if (!sameWord(norm[i + k]!, words[k]!)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let k = 0; k < n; k++) if (overwrite || out[i + k] === undefined) out[i + k] = kind;
      i += n - 1;
    }
  };

  const singles: string[] = [];
  for (const v of vocab) {
    const w = wordsOf(v.word);
    if (w.length > 1) markRuns(w, 'phrase', true);
    else if (w.length === 1 && w[0]!.length >= 3) singles.push(w[0]!);
  }
  for (const v of vocab) {
    if (!v.collocation) continue;
    for (const part of v.collocation.split(/[;,/]|\bor\b/)) {
      const w = wordsOf(part);
      if (w.length > 1) markRuns(w, 'colloc', false);
    }
  }
  for (const s of singles) markRuns([s], 'word', false);
  return out;
}
