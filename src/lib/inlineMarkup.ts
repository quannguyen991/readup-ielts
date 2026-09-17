/**
 * Đọc chữ in đậm/nghiêng trong dữ liệu bài song ngữ.
 *
 * Kho mang sẵn <i>…</i> và <b>…</b> từ bản sách gốc — tên riêng, thuật ngữ,
 * từ được bàn tới ("the word <i>salary</i>"). Trước đây màn đọc in nguyên thẻ
 * ra màn hình, rồi có lúc gỡ hẳn đi; cả hai đều sai. Chữ nghiêng ở đây mang
 * nghĩa: nó báo "đây là một từ đang được nói tới, không phải đang được dùng".
 *
 * Chỉ nhận b/i/em/strong. Thẻ nào khác thì bỏ thẻ, giữ chữ.
 */
export type InlineRun = { text: string; italic: boolean; bold: boolean };

export function parseInline(source: string): InlineRun[] {
  const runs: InlineRun[] = [];
  let italic = 0;
  let bold = 0;
  let last = 0;
  const re = /<(\/?)(b|i|em|strong)>|<\/?[a-z][^>]*>/gi;
  const push = (text: string) => {
    if (!text) return;
    const prev = runs[runs.length - 1];
    const it = italic > 0;
    const bd = bold > 0;
    if (prev && prev.italic === it && prev.bold === bd) prev.text += text;
    else runs.push({ text, italic: it, bold: bd });
  };
  for (const m of source.matchAll(re)) {
    push(source.slice(last, m.index));
    last = (m.index ?? 0) + m[0].length;
    const tag = m[2]?.toLowerCase();
    if (!tag) continue;
    const delta = m[1] ? -1 : 1;
    if (tag === 'i' || tag === 'em') italic = Math.max(0, italic + delta);
    else bold = Math.max(0, bold + delta);
  }
  push(source.slice(last));
  return runs;
}

export function stripInline(source: string): string {
  return source.replace(/<\/?[a-z][^>]*>/gi, '');
}
