import type { HighlightColorKey } from '@/theme/tokens';
import type { Highlight } from '@/store/useReaderStore';

/**
 * Xử lý chữ thuần của khối bài đọc (không đụng giao diện) — tách khỏi
 * `PassageView.tsx` để test được mà không nạp react-native.
 */

export function highlightRanges(
  text: string,
  highlights: Highlight[],
): { id: string; start: number; end: number; color: HighlightColorKey }[] {
  const ranges: { id: string; start: number; end: number; color: HighlightColorKey }[] = [];

  // Vệt mới nhất đứng trước: tô chồng lên vệt cũ thì thấy màu mới.
  for (const highlight of [...highlights].reverse()) {
    const exact =
      highlight.start !== undefined && text.slice(highlight.start, highlight.start + highlight.text.length) === highlight.text
        ? highlight.start
        : -1;
    const start = exact >= 0 ? exact : text.indexOf(highlight.text);
    if (start === -1) continue;
    ranges.push({ id: highlight.id, start, end: start + highlight.text.length, color: highlight.color });
  }

  return ranges;
}

/** Nới [start, end) ra cho trọn từ ở hai đầu và bỏ khoảng trắng thừa — bôi lẹm nửa chữ vẫn tô cả chữ. */
export function snapToWords(text: string, start: number, end: number): { start: number; end: number } {
  let s = Math.max(0, Math.min(start, end));
  let e = Math.min(text.length, Math.max(start, end));
  const isWordChar = (c: string | undefined) => !!c && /[\p{L}\p{N}'’-]/u.test(c);
  while (s > 0 && isWordChar(text[s - 1]) && isWordChar(text[s])) s--;
  while (e < text.length && isWordChar(text[e - 1]) && isWordChar(text[e])) e++;
  while (s < e && /\s/.test(text[s]!)) s++;
  while (e > s && /\s/.test(text[e - 1]!)) e--;
  return { start: s, end: e };
}

/** Vị trí đầu–cuối của câu chứa `position` — cùng luật cắt câu với `sentenceAround`. */
export function sentenceBounds(text: string, position: number): { start: number; end: number } {
  const sentence = sentenceAround(text, position);
  const from = Math.max(0, text.lastIndexOf(sentence, position));
  const start = text.slice(from, from + sentence.length) === sentence ? from : Math.max(0, text.indexOf(sentence));
  return { start, end: start + sentence.length };
}

/** Câu chứa vị trí ký tự đã cho — dùng làm ngữ cảnh khi tra từ. */
export function sentenceAround(text: string, position: number): string {
  const before = text.slice(0, position);
  const after = text.slice(position);

  const start = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('! '),
    before.lastIndexOf('? '),
  );
  const endMatch = after.match(/[.!?](\s|$)/);
  const end = endMatch?.index !== undefined ? position + endMatch.index + 1 : text.length;

  return text.slice(start === -1 ? 0 : start + 2, end).trim();
}
