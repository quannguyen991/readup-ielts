/**
 * Gộp dữ liệu giữa MÁY NÀY và ĐÁM MÂY.
 *
 * Đây là chỗ dễ mất dữ liệu nhất trong cả tính năng đồng bộ, nên nó được tách
 * riêng ra thành hàm thuần để test được từng ca.
 *
 * NGUYÊN TẮC GỐC: KHÔNG BAO GIỜ XOÁ BẰNG CÁCH GHI ĐÈ. Kịch bản thật hay gặp là
 * người học làm bài trên điện thoại lúc mất mạng, rồi mở máy tính. Nếu đồng bộ
 * là "bên nào mới hơn thì thắng cả cụm" thì buổi học trên điện thoại biến mất
 * không dấu vết — và người dùng sẽ không bao giờ tin app nữa.
 *
 * Nên với dữ liệu chỉ-thêm (lịch sử làm bài) thì gộp là HỢP HAI TẬP. Chỉ những
 * thứ bản chất là một giá trị duy nhất (mục tiêu band, phút học mỗi ngày) mới
 * dùng "bên mới hơn thắng", và chỉ ở mức từng trường một.
 */

/**
 * Hợp hai danh sách theo khoá, giữ bản có sẵn ở `preferred` khi trùng khoá.
 *
 * Dùng cho mọi lịch sử chỉ-thêm: lượt làm bài, phiên đọc, lượt ôn từ. Trùng
 * khoá nghĩa là cùng một bản ghi đã đồng bộ trước đó, không phải xung đột.
 */
export function unionByKey<T>(
  preferred: T[],
  other: T[],
  keyOf: (item: T) => string,
): T[] {
  const seen = new Map<string, T>();
  for (const item of preferred) seen.set(keyOf(item), item);
  for (const item of other) {
    const key = keyOf(item);
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

/**
 * Hợp hai bản ghi dạng từ điển, mỗi khoá chọn bản "mới hơn" theo hàm so sánh.
 *
 * Dùng cho tiến độ đọc từng bài: hai máy cùng đọc một bài thì giữ bản đọc xa
 * hơn, chứ không phải bản ghi sau.
 */
export function mergeRecords<V>(
  local: Record<string, V>,
  remote: Record<string, V>,
  pick: (a: V, b: V) => V,
): Record<string, V> {
  const out: Record<string, V> = { ...remote };
  for (const [key, value] of Object.entries(local)) {
    const existing = out[key];
    out[key] = existing === undefined ? value : pick(value, existing);
  }
  return out;
}

/** Hợp hai mảng chuỗi, bỏ trùng, giữ thứ tự xuất hiện đầu tiên. */
export function unionStrings(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

/**
 * Giá trị đơn: bên nào được sửa gần đây hơn thì thắng.
 *
 * Chỉ dùng cho CÀI ĐẶT, không dùng cho dữ liệu tích luỹ. Mục tiêu band là một
 * lựa chọn — đổi ở máy này thì máy kia phải theo. Số câu đã làm thì không.
 */
export function latestWins<T>(
  local: { value: T; at: number },
  remote: { value: T; at: number },
): T {
  return local.at >= remote.at ? local.value : remote.value;
}

/** Cộng dồn theo khoá — dùng cho số phút học mỗi ngày ghi ở hai máy khác nhau. */
export function maxByKey(
  local: Record<string, number>,
  remote: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = { ...remote };
  for (const [key, value] of Object.entries(local)) {
    out[key] = Math.max(out[key] ?? 0, value);
  }
  return out;
}

/**
 * Xếp lịch sử mới nhất lên đầu.
 *
 * Gộp xong thì thứ tự lộn xộn vì hai nguồn đan vào nhau, mà mọi màn hình đều
 * giả định phần tử đầu là lượt gần nhất.
 */
export function sortByFinishedDesc<T extends { finishedAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
}
