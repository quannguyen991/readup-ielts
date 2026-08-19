import { CHUNKS } from './seed/bodies/registry';
import type { ArticleBody, SeedIndexEntry } from '@/services/ingest/seed-writer';

/**
 * Đọc toàn văn bài theo yêu cầu.
 *
 * `require()` trong Metro là ĐỒNG BỘ — nó hoãn phần parse JSON tới lần gọi
 * đầu, chứ không trả Promise. Nên hàm này đồng bộ được và màn đọc không cần
 * trạng thái loading. Đổi sang Supabase về sau thì phải chuyển thành async.
 */
export type ArticleMeta = SeedIndexEntry;
export type { ArticleBody };

const loaded = new Map<number, Record<string, ArticleBody> | null>();

export function chunkOf(chunkIndex: number | null): Record<string, ArticleBody> | null {
  if (chunkIndex === null) return null;
  if (loaded.has(chunkIndex)) return loaded.get(chunkIndex) ?? null;

  const loader = CHUNKS[chunkIndex];
  let value: Record<string, ArticleBody> | null = null;

  if (loader) {
    try {
      value = loader() as Record<string, ArticleBody>;
    } catch {
      // Chunk thiếu hoặc hỏng: không làm sập app, màn đọc sẽ hiện thông báo.
      value = null;
    }
  }

  loaded.set(chunkIndex, value);
  return value;
}

export function pickBody(
  chunk: Record<string, ArticleBody> | null,
  id: string,
): ArticleBody | null {
  if (!chunk || typeof chunk !== 'object') return null;
  const body = chunk[id];
  if (!body || typeof body.bodyText !== 'string' || !Array.isArray(body.paragraphs)) return null;
  return body;
}

export function getArticleBody(meta: Pick<ArticleMeta, 'id' | 'chunk'>): ArticleBody | null {
  return pickBody(chunkOf(meta.chunk), meta.id);
}
