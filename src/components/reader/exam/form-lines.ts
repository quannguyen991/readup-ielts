/**
 * Tách một dòng của khuôn điền chỗ trống thành mảnh chữ và mảnh ô trống.
 * `{{3}}` là ô trống thứ 3 của nhóm. Hàm thuần để test được không cần dựng giao diện.
 */
export type FormPart = { text: string } | { blank: number };

const TOKEN = /\{\{\s*(\d+)\s*\}\}/g;

export function parseFormLine(line: string): FormPart[] {
  const parts: FormPart[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ text: line.slice(last, at) });
    parts.push({ blank: Number(m[1]) });
    last = at + m[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last) });
  return parts;
}

/** Hàng của bảng: bỏ dấu `|` đầu / cuối rồi tách ô. */
export function parseTableRow(line: string): string[] {
  const cells = line.split('|').map((c) => c.trim());
  if (cells[0] === '') cells.shift();
  if (cells[cells.length - 1] === '') cells.pop();
  return cells;
}

/** Các số ô trống xuất hiện trong khuôn, theo thứ tự. */
export function blanksIn(lines: string[]): number[] {
  const out: number[] = [];
  for (const l of lines) for (const p of parseFormLine(l)) if ('blank' in p) out.push(p.blank);
  return out;
}
