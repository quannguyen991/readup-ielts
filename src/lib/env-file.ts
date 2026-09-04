/**
 * Trộn giá trị mới vào nội dung một file .env, giữ nguyên phần còn lại.
 *
 * Tách khỏi `scripts/provision-supabase.ts` để test được. Đây là chỗ nguy hiểm
 * nhất trong toàn bộ luồng cài đặt: `.env.local` đang giữ `OPENAI_API_KEY` của
 * người dùng, và một hàm ghi file cẩu thả sẽ xoá nó đi mà không ai biết cho tới
 * lúc chấm bài Writing hỏng vài ngày sau.
 *
 * Ba điều nó phải giữ:
 *   1. Dòng không liên quan còn nguyên, kể cả comment và dòng trắng.
 *   2. Khoá đã có thì SỬA TẠI CHỖ, không thêm dòng thứ hai cùng tên (dòng sau
 *      thắng khi đọc, nên trùng khoá là một quả bom hẹn giờ).
 *   3. Khoá chưa có thì nối vào cuối, có tiêu đề để biết ai sinh ra nó.
 */
export function mergeEnvFile(existing: string, values: Record<string, string>): string {
  const lines = existing === '' ? [] : existing.split(/\r?\n/);
  const remaining = new Map(Object.entries(values));

  const next = lines.map((line) => {
    const at = line.indexOf('=');
    if (at <= 0 || line.trim().startsWith('#')) return line;
    const key = line.slice(0, at).trim();
    const value = remaining.get(key);
    if (value === undefined) return line;
    remaining.delete(key);
    return `${key}=${value}`;
  });

  if (remaining.size > 0) {
    if (next.length > 0 && (next[next.length - 1] ?? '').trim() !== '') next.push('');
    next.push('# Supabase — sinh bởi scripts/provision-supabase.ts');
    for (const [key, value] of remaining) next.push(`${key}=${value}`);
    next.push('');
  }

  return next.join('\n');
}

/** Đọc file .env thành cặp khoá–giá trị. Bỏ qua comment và dòng trắng. */
export function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const at = trimmed.indexOf('=');
    if (at <= 0) continue;
    out[trimmed.slice(0, at).trim()] = trimmed
      .slice(at + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return out;
}
