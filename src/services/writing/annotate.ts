import type { AnnotationCategory, WritingAnnotation } from '@/lib/writing/types';

/**
 * Neo annotation của model vào đúng vị trí trong bài viết.
 *
 * Model trả **chuỗi trích**, không trả offset — model đếm ký tự không đáng tin,
 * và một offset lệch vài ký tự sẽ tô sáng đúng vào giữa một từ khác.
 *
 * Nguyên tắc quan trọng nhất: **không tìm thấy thì BỎ, không đoán**. Bỏ một
 * annotation thì người học mất một gợi ý; tô sai chỗ thì họ sửa nhầm một câu
 * vốn đúng, và mất niềm tin vào toàn bộ phần chấm.
 */

/** Annotation model trả về, chưa có vị trí. */
export type RawAnnotation = {
  quote: string;
  category: AnnotationCategory;
  severity: 'minor' | 'major';
  whyVi: string;
  fix: string;
};

export function anchorAnnotations(
  text: string,
  raws: RawAnnotation[],
): WritingAnnotation[] {
  const taken: Array<[number, number]> = [];
  const out: WritingAnnotation[] = [];

  for (const rawItem of raws) {
    const quote = rawItem.quote.trim();
    if (quote === '' || text === '') continue;

    const span = locate(text, quote, taken);
    if (!span) continue;

    taken.push(span);
    out.push({ ...rawItem, quote, start: span[0], end: span[1] });
  }

  // Xếp theo vị trí trong bài, không theo thứ tự model trả về: màn kết quả đọc
  // từ trên xuống, mà model hay trả lỗi nặng trước bất kể nó nằm ở đâu.
  return out.sort((a, b) => a.start - b.start);
}

/** Ba mức khớp, dừng ở mức đầu tiên tìm được. */
function locate(
  text: string,
  quote: string,
  taken: Array<[number, number]>,
): [number, number] | null {
  return (
    findExact(text, quote, taken) ??
    findCaseInsensitive(text, quote, taken) ??
    findLooseWhitespace(text, quote, taken)
  );
}

function findExact(
  text: string,
  quote: string,
  taken: Array<[number, number]>,
): [number, number] | null {
  return scan(text, taken, (from) => {
    const at = text.indexOf(quote, from);
    return at === -1 ? null : [at, at + quote.length];
  });
}

function findCaseInsensitive(
  text: string,
  quote: string,
  taken: Array<[number, number]>,
): [number, number] | null {
  const lowerText = text.toLowerCase();
  const lowerQuote = quote.toLowerCase();
  return scan(text, taken, (from) => {
    const at = lowerText.indexOf(lowerQuote, from);
    return at === -1 ? null : [at, at + quote.length];
  });
}

/**
 * Khớp khi chỉ lệch khoảng trắng: model hay chép lại đoạn trích với hai dấu
 * cách, hoặc nuốt mất dấu xuống dòng.
 */
function findLooseWhitespace(
  text: string,
  quote: string,
  taken: Array<[number, number]>,
): [number, number] | null {
  const pattern = quote
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join('\\s+');
  if (pattern === '') return null;

  const re = new RegExp(pattern, 'gi');
  let m: RegExpExecArray | null = re.exec(text);
  while (m) {
    const span: [number, number] = [m.index, m.index + m[0].length];
    if (!overlaps(span, taken)) return span;
    m = re.exec(text);
  }
  return null;
}

/**
 * Quét từ đầu bài, bỏ qua những chỗ đã có annotation khác chiếm.
 *
 * Nhờ vậy hai lỗi trên cùng một chữ lặp lại (`toward` xuất hiện hai lần) được
 * neo vào hai chỗ khác nhau thay vì chồng lên nhau.
 */
function scan(
  text: string,
  taken: Array<[number, number]>,
  next: (from: number) => [number, number] | null,
): [number, number] | null {
  let from = 0;
  while (from <= text.length) {
    const span = next(from);
    if (!span) return null;
    if (!overlaps(span, taken)) return span;
    from = span[0] + 1;
  }
  return null;
}

function overlaps(span: [number, number], taken: Array<[number, number]>): boolean {
  return taken.some(([s, e]) => span[0] < e && s < span[1]);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
