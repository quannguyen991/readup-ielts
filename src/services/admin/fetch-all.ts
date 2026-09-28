/**
 * Đọc HẾT các dòng của một truy vấn Supabase, theo từng trang.
 *
 * VÌ SAO: máy chủ PostgREST của Supabase trả tối đa 1.000 dòng mỗi lần gọi
 * (cài đặt "Max rows" của dự án) — kể cả khi mã xin `.limit(50000)`. Nó cắt
 * IM LẶNG, không báo lỗi. Trang quản trị từng đứng yên ở đúng 1.000 lượt xem
 * (28/09/2026) vì thế. Supabase không giới hạn số lượt ghi; chỉ lần đọc bị cắt.
 *
 * `page(from, to)` phải dựng truy vấn có `.range(from, to)` và thứ tự cố định
 * (`.order(...)`), nếu không các trang có thể trùng hoặc sót dòng.
 */
export const PAGE_SIZE = 1000;

export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>,
  maxRows = 200_000,
): Promise<{ rows: T[]; error: { message: string; code?: string } | null; truncated: boolean }> {
  const rows: T[] = [];
  for (let from = 0; from < maxRows; from += PAGE_SIZE) {
    const { data, error } = await page(from, Math.min(from + PAGE_SIZE, maxRows) - 1);
    if (error) return { rows, error, truncated: false };
    const got = data ?? [];
    rows.push(...got);
    if (got.length < PAGE_SIZE) return { rows, error: null, truncated: false };
  }
  return { rows, error: null, truncated: true };
}
