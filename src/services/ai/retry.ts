import { AiError, toAiError } from './errors';

type RetryOptions = {
  /** Số lần thử tối đa, tính cả lần đầu. */
  attempts?: number;
  /** Thời gian chờ cơ sở (ms), tăng theo cấp số nhân + jitter. */
  baseDelayMs?: number;
  maxDelayMs?: number;
  label?: string;
  onRetry?: (info: { attempt: number; delayMs: number; error: AiError }) => void;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Bọc một lời gọi AI với retry luỹ thừa + jitter.
 * Chỉ thử lại với lỗi tạm thời (429 / 5xx / mạng / timeout).
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    attempts = 3,
    baseDelayMs = 800,
    maxDelayMs = 15_000,
    label = 'AI call',
    onRetry,
  } = options;

  let lastError: AiError | undefined;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      const aiError = toAiError(err, `${label} thất bại`);
      lastError = aiError;

      if (!aiError.retryable || attempt === attempts) throw aiError;

      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const delayMs = Math.round(backoff * (0.7 + Math.random() * 0.6));
      onRetry?.({ attempt, delayMs, error: aiError });
      await sleep(delayMs);
    }
  }

  throw lastError ?? new AiError('unknown', `${label} thất bại không rõ nguyên nhân`);
}
