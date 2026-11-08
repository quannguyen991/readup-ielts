import { fetchChunk, tryReadChunkSync } from './article-chunk-source';
import type { ArticleBody, SeedIndexEntry } from '@/services/ingest/seed-writer';

/**
 * Đọc toàn văn bài theo yêu cầu.
 *
 * Web: chunk được tải lười qua HTTP (public/data/bodies). Hàm đồng bộ `chunkOf` /
 * `getArticleBody` trả ngay nếu chunk đã có; chưa có thì bắt đầu tải và trả null,
 * xong việc sẽ báo người đăng ký (xem useChunkVersion) để màn hình vẽ lại.
 * Native: nạp đồng bộ như trước, nên hành vi không đổi.
 * Máy chủ: dùng loadArticleBody (async) vì nó tải chunk qua HTTP.
 */
export type ArticleMeta = SeedIndexEntry;
export type { ArticleBody };

type Chunk = Record<string, ArticleBody>;

const loaded = new Map<number, Chunk | null>();
const pending = new Map<number, Promise<Chunk | null>>();
const listeners = new Set<() => void>();
let version = 0;

function emit(): void {
  version += 1;
  for (const l of listeners) l();
}

/** Đăng ký nhận báo khi có chunk mới nạp xong. Trả hàm huỷ đăng ký. */
export function subscribeChunks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Số phiên bản dữ liệu chunk; đổi mỗi khi có chunk nạp xong. */
export function chunkVersion(): number {
  return version;
}

/** Nạp chunk (async). Gọi nhiều lần vẫn chỉ tải một lần. */
export function loadChunk(chunkIndex: number): Promise<Chunk | null> {
  if (loaded.has(chunkIndex)) return Promise.resolve(loaded.get(chunkIndex) ?? null);
  const running = pending.get(chunkIndex);
  if (running) return running;

  const next = fetchChunk(chunkIndex).then(
    (value) => {
      const chunk = (value as Chunk | null) ?? null;
      loaded.set(chunkIndex, chunk);
      pending.delete(chunkIndex);
      emit();
      return chunk;
    },
    () => {
      // Lỗi mạng hoặc chunk hỏng: ghi nhận null để không tải lại vô hạn khi vẽ lại.
      loaded.set(chunkIndex, null);
      pending.delete(chunkIndex);
      emit();
      return null;
    },
  );
  pending.set(chunkIndex, next);
  return next;
}

function syncRead(chunkIndex: number): Chunk | null | undefined {
  try {
    return tryReadChunkSync(chunkIndex) as Chunk | null | undefined;
  } catch {
    // Chunk thiếu hoặc hỏng: không làm sập app, màn đọc sẽ hiện thông báo.
    return null;
  }
}

/** Đồng bộ: trả chunk nếu đã có; web thì bắt đầu tải nền và trả null lúc đầu. */
export function chunkOf(chunkIndex: number | null): Chunk | null {
  if (chunkIndex == null) return null;
  if (loaded.has(chunkIndex)) return loaded.get(chunkIndex) ?? null;

  // Node (máy chủ, test, script) và native đọc đồng bộ được; trình duyệt thì không.
  const direct = syncRead(chunkIndex);
  if (direct !== undefined) {
    loaded.set(chunkIndex, direct);
    return direct;
  }

  void loadChunk(chunkIndex);
  return null;
}

export function pickBody(chunk: Chunk | null, id: string): ArticleBody | null {
  if (!chunk || typeof chunk !== 'object') return null;
  const body = chunk[id];
  if (!body || typeof body.bodyText !== 'string' || !Array.isArray(body.paragraphs)) return null;
  return body;
}

/** Đồng bộ (web: null cho đến khi chunk tải xong; người đăng ký sẽ được báo). */
export function getArticleBody(meta: Pick<ArticleMeta, 'id' | 'chunk'>): ArticleBody | null {
  return pickBody(chunkOf(meta.chunk), meta.id);
}

/** Bất đồng bộ: dùng ở máy chủ và nơi cần chắc chắn có toàn văn. */
export async function loadArticleBody(meta: Pick<ArticleMeta, 'id' | 'chunk'>): Promise<ArticleBody | null> {
  if (meta.chunk == null) return null;
  return pickBody(await loadChunk(meta.chunk), meta.id);
}

/** Nạp mọi chunk chứa các bài đã cho (bất đồng bộ). Dùng trước các pipeline quét cả kho. */
export async function loadBodiesFor(metas: ReadonlyArray<Pick<ArticleMeta, 'chunk'>>): Promise<void> {
  const indexes = new Set<number>();
  for (const m of metas) if (m.chunk != null) indexes.add(m.chunk);
  await Promise.all([...indexes].map((i) => loadChunk(i)));
}

/** Đã có đủ chunk chứa các bài đã cho chưa (không kích hoạt tải). */
export function bodiesReady(metas: ReadonlyArray<Pick<ArticleMeta, 'chunk'>>): boolean {
  return metas.every((m) => m.chunk == null || loaded.has(m.chunk));
}
