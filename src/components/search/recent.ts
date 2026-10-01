/**
 * Câu tìm gần đây — chỉ là tiện ích trên máy này, nên để ở localStorage.
 *
 * Mọi lượt đọc/ghi bọc try/catch: tab ẩn danh, trang chặn lưu trữ hoặc lúc dựng
 * phía máy chủ đều có thể ném lỗi, và mất danh sách gần đây không được làm hỏng
 * ô tìm kiếm.
 */
const KEY = 'band9.search.recent.v1';
const MAX = 6;

export function loadRecent(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((q): q is string => typeof q === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function saveRecent(query: string): string[] {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return loadRecent();
  const next = [q, ...loadRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Không lưu được thì thôi — danh sách gần đây chỉ là tiện ích.
  }
  return next;
}

export function clearRecent(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
  } catch {
    // như trên
  }
}
