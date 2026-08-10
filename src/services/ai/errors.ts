/** Lỗi chuẩn hoá cho toàn bộ lớp gọi AI, để UI và script xử lý nhất quán. */
export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly status: number | undefined;
  readonly retryable: boolean;

  constructor(
    code: AiErrorCode,
    message: string,
    options: { status?: number; retryable?: boolean; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'AiError';
    this.code = code;
    this.status = options.status;
    this.retryable = options.retryable ?? DEFAULT_RETRYABLE.has(code);
  }
}

export type AiErrorCode =
  | 'missing_config'
  | 'rate_limited'
  | 'timeout'
  | 'network'
  | 'server_error'
  | 'invalid_request'
  | 'content_filtered'
  | 'bad_response'
  | 'unknown';

const DEFAULT_RETRYABLE = new Set<AiErrorCode>([
  'rate_limited',
  'timeout',
  'network',
  'server_error',
]);

/** Suy ra AiError từ lỗi thô của SDK OpenAI / Anthropic / fetch. */
export function toAiError(err: unknown, fallbackMessage: string): AiError {
  if (err instanceof AiError) return err;

  const anyErr = err as { status?: number; code?: string; name?: string; message?: string };
  const status = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  const message = anyErr?.message ?? fallbackMessage;

  if (anyErr?.name === 'AbortError' || anyErr?.code === 'ETIMEDOUT') {
    return new AiError('timeout', `Hết thời gian chờ: ${message}`, { status, cause: err });
  }
  if (anyErr?.code === 'ECONNRESET' || anyErr?.code === 'ENOTFOUND' || anyErr?.code === 'EAI_AGAIN') {
    return new AiError('network', `Lỗi mạng: ${message}`, { cause: err });
  }
  if (status === 429) {
    return new AiError('rate_limited', `Bị giới hạn tần suất: ${message}`, { status, cause: err });
  }
  if (status !== undefined && status >= 500) {
    return new AiError('server_error', `Lỗi phía server AI (${status}): ${message}`, {
      status,
      cause: err,
    });
  }
  if (status === 400 && /safety|content|policy/i.test(message)) {
    return new AiError('content_filtered', `Nội dung bị từ chối: ${message}`, {
      status,
      cause: err,
    });
  }
  if (status !== undefined && status >= 400) {
    return new AiError('invalid_request', `Yêu cầu không hợp lệ (${status}): ${message}`, {
      status,
      cause: err,
    });
  }

  return new AiError('unknown', `${fallbackMessage}: ${message}`, { status, cause: err });
}
