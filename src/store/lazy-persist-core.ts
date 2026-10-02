/**
 * Lõi của "ghi trễ" (thuần, test được): gom nhiều lần ghi cùng khoá, chỉ ghi thật sau
 * `debounceMs` yên (tối đa chờ `maxWaitMs`), và `flush()` ghi ngay — gọi khi tab ẩn / đóng.
 * `get` trả giá trị đang chờ ghi trước, để đọc luôn thấy bản mới nhất.
 */
export type LazyWriter = {
  set(name: string, value: unknown): void;
  get(name: string): unknown | undefined;
  has(name: string): boolean;
  remove(name: string): void;
  flush(): void;
  readonly size: number;
};

export function createLazyWriter(deps: {
  write: (name: string, value: unknown) => void;
  debounceMs?: number;
  maxWaitMs?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (t: unknown) => void;
}): LazyWriter {
  const debounceMs = deps.debounceMs ?? 500;
  const maxWaitMs = deps.maxWaitMs ?? 2000;
  const now = deps.now ?? Date.now;
  const setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((t) => clearTimeout(t as ReturnType<typeof setTimeout>));
  const pending = new Map<string, unknown>();
  let timer: unknown = null;
  let firstAt = 0;

  const flush = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
    firstAt = 0;
    const items = [...pending];
    pending.clear();
    for (const [name, value] of items) {
      try {
        deps.write(name, value);
      } catch {
        /* đầy bộ nhớ / chế độ riêng tư — bỏ qua */
      }
    }
  };

  return {
    set(name, value) {
      pending.set(name, value);
      const t = now();
      if (!firstAt) firstAt = t;
      if (timer !== null) clearTimer(timer);
      timer = setTimer(flush, Math.max(0, Math.min(debounceMs, firstAt + maxWaitMs - t)));
    },
    get: (name) => pending.get(name),
    has: (name) => pending.has(name),
    remove: (name) => void pending.delete(name),
    flush,
    get size() {
      return pending.size;
    },
  };
}
