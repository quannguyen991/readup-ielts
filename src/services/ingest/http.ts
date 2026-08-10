/** Tiện ích HTTP dùng chung cho các nguồn: timeout, retry nhẹ, User-Agent rõ ràng. */

/**
 * Wikimedia yêu cầu User-Agent có địa chỉ liên hệ thật, nếu không sẽ trả 429.
 * Đổi được qua env INGEST_CONTACT.
 */
const CONTACT = process.env.INGEST_CONTACT ?? 'readup-contact@example.com';
const USER_AGENT = `ReadUpIELTS/0.1 (personal English reading study app; ${CONTACT})`;

export async function fetchText(
  url: string,
  options: { timeoutMs?: number; attempts?: number; headers?: Record<string, string> } = {},
): Promise<string> {
  const { timeoutMs = 30_000, attempts = 3, headers = {} } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: { 'user-agent': USER_AGENT, accept: '*/*', ...headers },
        signal: controller.signal,
      });

      if (!res.ok) {
        // 4xx không phải lỗi tạm thời → dừng ngay, khỏi tốn thời gian.
        if (res.status < 500 && res.status !== 429) {
          throw new Error(`HTTP ${res.status} khi tải ${url}`);
        }
        throw new Error(`HTTP ${res.status} (tạm thời) khi tải ${url}`);
      }

      return await res.text();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      const retryable = /tạm thời|abort|network|fetch failed|ECONN|ETIMEDOUT/i.test(message);
      if (!retryable || attempt === attempts) break;
      await sleep(700 * 2 ** (attempt - 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function fetchJson<T>(
  url: string,
  options?: { timeoutMs?: number; attempts?: number; headers?: Record<string, string> },
): Promise<T> {
  const text = await fetchText(url, {
    ...options,
    headers: { accept: 'application/json', ...options?.headers },
  });
  return JSON.parse(text) as T;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chạy fn trên từng item với tối đa `limit` việc song song.
 * Giữ đúng thứ tự kết quả theo thứ tự item đầu vào.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const worker = async (): Promise<void> => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index]!, index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker),
  );

  return results;
}

/**
 * Tạo một bộ điều nhịp DÙNG CHUNG cho nhiều worker: đảm bảo mọi lệnh gọi tới
 * hàm trả về (dù đến từ worker nào) cách nhau tối thiểu `spacingMs`, tính
 * trên một mốc thời gian toàn cục duy nhất — không phải chia lịch riêng theo
 * từng worker (cách đó dễ trôi vì khoảng cách thật phụ thuộc độ trễ response
 * của từng request, hai worker có thể vẫn bắn trùng lúc).
 *
 * Race-free: đoạn "đọc mốc hiện tại (nextSlot) → tính start = max(now,
 * nextSlot) → ghi mốc mới (start + spacingMs)" chạy hoàn toàn đồng bộ, không
 * có `await` xen giữa. JS chỉ nhường lượt cho tác vụ khác tại điểm `await`,
 * nên trong đúng đoạn đồng bộ đó không lệnh gọi nào khác có thể chen vào đọc
 * `nextSlot` trước khi lệnh gọi hiện tại ghi xong — mỗi lệnh gọi luôn "giữ
 * chỗ" trên giá trị mới nhất. Việc chờ thật sự (sleep) diễn ra SAU khi đã
 * giữ chỗ xong, nên nhiều worker gọi đồng thời vẫn xếp hàng đúng thứ tự và
 * đúng khoảng cách, không worker nào giành được cùng một khe.
 */
export function createPacer(spacingMs: number): () => Promise<void> {
  let nextSlot = 0;

  return function pace(): Promise<void> {
    const now = Date.now();
    const start = Math.max(now, nextSlot);
    nextSlot = start + spacingMs;
    return sleep(start - now);
  };
}
