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
