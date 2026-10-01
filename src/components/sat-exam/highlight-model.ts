/**
 * Vệt tô và ghi chú trên đoạn văn của phòng thi — phần chữ thuần, không đụng
 * giao diện, để test được.
 *
 * Vị trí tính bằng KÝ TỰ trong chuỗi của từng khối văn bản (Text 1 / Text 2 là
 * hai khối), không bằng nút DOM: giao diện vẽ lại thành các mẩu <span> mỗi lần
 * tô, nên nút DOM cũ không còn sống tới lần sau.
 */

export type MarkColor = 'yellow' | 'blue' | 'pink';

export type Mark = {
  id: string;
  block: number;
  start: number;
  end: number;
  /** `null` = chỉ gạch chân, không tô nền. */
  color: MarkColor | null;
  underline: boolean;
  note: string;
};

export const MARK_FILL: Record<MarkColor, string> = {
  yellow: '#FBE7A1',
  blue: '#CFE3F7',
  pink: '#F8D3DF',
};

/**
 * Thêm một vệt mới. Vệt cũ chồng lên đoạn mới bị CẮT bớt (hoặc tách đôi) — vệt
 * mới thắng, đúng như tô bút dạ quang đè lên chỗ đã tô.
 */
export function addMark(marks: Mark[], next: Mark): Mark[] {
  const out: Mark[] = [];
  for (const m of marks) {
    if (m.block !== next.block || m.end <= next.start || m.start >= next.end) {
      out.push(m);
      continue;
    }
    if (m.start < next.start) out.push({ ...m, end: next.start });
    if (m.end > next.end) out.push({ ...m, id: `${m.id}~`, start: next.end, note: m.start < next.start ? '' : m.note });
  }
  out.push(next);
  return out.sort((a, b) => a.block - b.block || a.start - b.start);
}

export type Segment = {
  start: number;
  end: number;
  text: string;
  mark: Mark | null;
  /** Đề bài gạch chân sẵn đoạn này. */
  given: boolean;
};

/** Cắt một khối thành các mẩu liền nhau theo mọi mép vệt tô và mép gạch chân của đề. */
export function segmentsOf(
  text: string,
  marks: Mark[],
  given: { start: number; end: number } | null,
): Segment[] {
  const cuts = new Set<number>([0, text.length]);
  for (const m of marks) {
    cuts.add(Math.max(0, Math.min(text.length, m.start)));
    cuts.add(Math.max(0, Math.min(text.length, m.end)));
  }
  if (given) {
    cuts.add(given.start);
    cuts.add(given.end);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const out: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const s = points[i]!;
    const e = points[i + 1]!;
    if (e <= s) continue;
    const mark = marks.find((m) => m.start <= s && m.end >= e) ?? null;
    out.push({
      start: s,
      end: e,
      text: text.slice(s, e),
      mark,
      given: !!given && given.start <= s && given.end >= e,
    });
  }
  return out;
}

/** Vị trí đoạn đề bài gạch chân sẵn trong một khối, hoặc `null`. */
export function givenRange(text: string, underline?: string): { start: number; end: number } | null {
  if (!underline) return null;
  const at = text.indexOf(underline);
  return at < 0 ? null : { start: at, end: at + underline.length };
}
