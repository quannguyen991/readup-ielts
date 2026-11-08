/**
 * Bản native: app cài sẵn trên máy nên toàn văn vẫn nạp đồng bộ qua registry như cũ.
 * Web và Node dùng article-chunk-source.ts, để registry không lọt vào bundle web.
 */
import { CHUNKS } from './seed/bodies/registry';

type Chunk = Record<string, unknown>;

export function tryReadChunkSync(index: number): Chunk | null | undefined {
  const loader = CHUNKS[index];
  if (!loader) return null;
  return loader() as Chunk;
}

export async function fetchChunk(index: number): Promise<Chunk | null> {
  return tryReadChunkSync(index) ?? null;
}
