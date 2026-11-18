/**
 * Bộ nhớ đệm clip phát âm trong RAM (web).
 *
 * VÌ SAO CÓ: trước đây mỗi lần bấm loa là `new Audio(url)` rồi mới tải mp3 từ mạng, nên có độ trễ
 * 100–800 ms (khởi động lạnh, mạng di động) trước khi nghe tiếng. Giờ clip của từ sắp tới được tải
 * sẵn thành Blob; lúc phát chỉ việc gắn `blob:` URL — tiếng ra gần như tức thì.
 *
 * Hàm thuần theo `deps` để test được, không đụng React Native.
 */

export type CacheDeps = {
  fetch?: (url: string) => Promise<{ ok: boolean; blob(): Promise<Blob> }>;
  createObjectURL?: (b: Blob) => string;
  revokeObjectURL?: (u: string) => void;
  /** Số clip tối đa giữ trong RAM (mỗi clip ~10–20 KB). */
  cap?: number;
  /** Số yêu cầu tải song song. */
  concurrency?: number;
};

export type ClipCache = {
  /** `blob:` URL nếu đã có trong RAM, không thì undefined. */
  get(url: string): string | undefined;
  /** Tải nền (bỏ qua nếu đã có / đang tải / vừa hỏng). */
  prefetch(url: string): void;
  /** Tải và chờ xong; trả blob URL hoặc null nếu lỗi. */
  load(url: string): Promise<string | null>;
  size(): number;
};

export function createClipCache(deps: CacheDeps = {}): ClipCache {
  const cap = deps.cap ?? 240;
  const concurrency = deps.concurrency ?? 3;
  const f = deps.fetch ?? (typeof fetch === 'function' ? (fetch as unknown as NonNullable<CacheDeps['fetch']>) : null);
  const mk = deps.createObjectURL ?? ((b: Blob) => URL.createObjectURL(b));
  const rv = deps.revokeObjectURL ?? ((u: string) => URL.revokeObjectURL(u));
  const store = new Map<string, string>(); // thứ tự chèn = thứ tự dùng gần nhất
  const inflight = new Map<string, Promise<string | null>>();
  const failed = new Set<string>();
  const queue: (() => void)[] = [];
  let active = 0;

  const pump = () => {
    while (active < concurrency && queue.length) {
      active += 1;
      queue.shift()!();
    }
  };

  const run = (url: string): Promise<string | null> =>
    new Promise((resolve) => {
      queue.push(() => {
        (async () => {
          try {
            if (!f) return null;
            const res = await f(url);
            if (!res.ok) throw new Error(String((res as { status?: number }).status ?? 'http'));
            const blobUrl = mk(await res.blob());
            store.set(url, blobUrl);
            while (store.size > cap) {
              const [oldKey, oldVal] = store.entries().next().value as [string, string];
              store.delete(oldKey);
              // Có thể đang phát clip cũ này: thu hồi muộn.
              setTimeout(() => rv(oldVal), 60_000);
            }
            return blobUrl;
          } catch {
            failed.add(url);
            return null;
          }
        })().then((r) => {
          inflight.delete(url);
          active -= 1;
          resolve(r);
          pump();
        });
      });
      pump();
    });

  return {
    get(url) {
      const v = store.get(url);
      if (v !== undefined) {
        // làm mới thứ tự dùng gần nhất
        store.delete(url);
        store.set(url, v);
      }
      return v;
    },
    prefetch(url) {
      if (store.has(url) || inflight.has(url) || failed.has(url)) return;
      const p = run(url);
      inflight.set(url, p);
    },
    load(url) {
      const hit = store.get(url);
      if (hit) return Promise.resolve(hit);
      if (failed.has(url)) return Promise.resolve(null);
      let p = inflight.get(url);
      if (!p) {
        p = run(url);
        inflight.set(url, p);
      }
      return p;
    },
    size: () => store.size,
  };
}
