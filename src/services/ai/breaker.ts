/**
 * Cầu dao theo từng cửa AI: một cửa vừa trả 429/503/403 thì NGHỈ một lúc, các
 * lượt hỏi sau đi thẳng sang cửa khác (hoặc báo bận ngay) thay vì gõ cửa đang
 * hỏng ở MỌI lượt rồi chờ hết hạn mức.
 *
 *   429  hết hạn mức (Groq: token/ngày) .... nghỉ 60 giây (hoặc Retry-After)
 *   5xx  nhà cung cấp quá tải/sập .......... nghỉ 45 giây
 *   403  bị chặn (khoá, lớp chống bot) ..... nghỉ 10 phút — thử lại cũng vô ích
 *   khác (timeout, rỗng) .................... nghỉ 30 giây
 *
 * Trạng thái nằm trong bộ nhớ của từng instance serverless: không chia sẻ giữa
 * các instance, nhưng đủ để chặn một người bấm gửi liên tục. Hàm thuần có `now`
 * truyền vào để test.
 */

const until = new Map<string, number>();

export function cooldownMs(status: number | null): number {
  if (status === 403) return 10 * 60_000;
  if (status === 429) return 60_000;
  if (status !== null && status >= 500) return 45_000;
  return 30_000;
}

/** Lấy mã HTTP từ chuỗi lỗi dạng "HTTP 429: ...". */
export function statusFromReason(reason: string): number | null {
  const m = /^HTTP (\d{3})/.exec(reason);
  return m ? Number(m[1]) : null;
}

export function breakerKey(endpoint: string, model: string | undefined): string {
  return `${endpoint}|${model ?? ''}`;
}

export function isOpen(key: string, now = Date.now()): boolean {
  const t = until.get(key);
  if (t === undefined) return false;
  if (t <= now) {
    until.delete(key);
    return false;
  }
  return true;
}

export function recordFailure(key: string, reason: string, now = Date.now()): void {
  until.set(key, now + cooldownMs(statusFromReason(reason)));
}

export function recordSuccess(key: string): void {
  until.delete(key);
}

export function resetBreakers(): void {
  until.clear();
}
