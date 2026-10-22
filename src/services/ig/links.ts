/**
 * Danh sách link cho trang /ig. Dữ liệu là một file JSON công khai do hệ thống bên ngoài ghi;
 * web chỉ đọc, không đọc database. Mỗi dòng: id, title, url, category, order, active, updated_at.
 */
export type IgLink = {
  id: string;
  title: string;
  url: string;
  category: string;
  order: number;
  active: boolean;
  updatedAt: string | null;
};

/** Chỉ nhận đường dẫn trong 9band.com hoặc đường dẫn tương đối, để không mở link lạ từ file. */
function isSafeUrl(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (u.hostname === '9band.com' || u.hostname.endsWith('.9band.com'));
  } catch {
    return false;
  }
}

/** Đọc JSON thô (mảng dòng, hoặc { items: [...] }). Dòng hỏng bị bỏ qua; kết quả đã lọc `active` và sắp theo `order`. */
export function parseIgLinks(raw: unknown): IgLink[] {
  const rows = Array.isArray(raw) ? raw : raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items) ? (raw as { items: unknown[] }).items : [];
  const out: IgLink[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === 'string' ? r.id.trim() : '';
    const title = typeof r.title === 'string' ? r.title.trim() : '';
    const url = typeof r.url === 'string' ? r.url.trim() : '';
    if (!id || !title || !url || !isSafeUrl(url)) continue;
    if (r.active === false) continue;
    out.push({
      id,
      title,
      url,
      category: typeof r.category === 'string' ? r.category : '',
      order: typeof r.order === 'number' && Number.isFinite(r.order) ? r.order : Number.MAX_SAFE_INTEGER,
      active: true,
      updatedAt: typeof r.updated_at === 'string' ? r.updated_at : null,
    });
  }
  return out.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'vi'));
}
