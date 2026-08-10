import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { IngestedArticle } from './types';

/**
 * Kho bài chia làm hai phần:
 * - index.json  : metadata mọi bài, bundle sẵn để Library duyệt/lọc tức thì
 * - bodies/chunk-NN.json : body, nạp lười qua require() nên hoãn được phần parse
 *
 * Lý do: src/data/articles.ts từng import cả kho bài vào JS bundle. 126 bài đã
 * 1.8MB; 1000 bài sẽ ~14MB.
 */
export const CHUNK_SIZE = 50;

export type ArticleBody = { bodyText: string; paragraphs: string[] };

export type SeedIndexEntry = Omit<IngestedArticle, 'bodyText' | 'paragraphs'> & {
  /** null khi bài không có body (Loại B, đề official). */
  chunk: number | null;
};

export function buildSeedBundle(articles: IngestedArticle[]): {
  index: SeedIndexEntry[];
  chunks: Array<Record<string, ArticleBody>>;
} {
  const index: SeedIndexEntry[] = [];
  const chunks: Array<Record<string, ArticleBody>> = [];
  let withBody = 0;

  for (const article of articles) {
    const { bodyText, paragraphs, ...meta } = article;

    if (bodyText === null) {
      index.push({ ...meta, chunk: null });
      continue;
    }

    const chunkIndex = Math.floor(withBody / CHUNK_SIZE);
    if (!chunks[chunkIndex]) chunks[chunkIndex] = {};
    chunks[chunkIndex][article.id] = { bodyText, paragraphs };

    index.push({ ...meta, chunk: chunkIndex });
    withBody += 1;
  }

  return { index, chunks };
}

/** Map phải TĨNH: Metro chỉ thấy require() có chuỗi literal lúc build. */
export function renderRegistry(chunkCount: number): string {
  const lines = Array.from(
    { length: chunkCount },
    (_, i) => `  ${i}: () => require('./chunk-${String(i).padStart(2, '0')}.json'),`,
  );

  return [
    '// FILE NÀY DO scripts/ingest.ts SINH RA. ĐỪNG SỬA TAY.',
    '// require() phải là chuỗi literal để Metro phân tích được lúc build.',
    '',
    'export const CHUNKS: Record<number, () => unknown> = {',
    ...lines,
    '};',
    '',
  ].join('\n');
}

export function writeSeedBundle(
  seedDir: string,
  articles: IngestedArticle[],
): { chunkCount: number; indexCount: number } {
  const { index, chunks } = buildSeedBundle(articles);
  const bodiesDir = join(seedDir, 'bodies');

  mkdirSync(bodiesDir, { recursive: true });

  // Xoá chunk cũ, tránh để lại file mồ côi khi kho bài co lại.
  for (const name of readdirSync(bodiesDir)) {
    if (/^chunk-\d+\.json$/.test(name)) rmSync(join(bodiesDir, name));
  }

  writeFileSync(join(seedDir, 'index.json'), JSON.stringify(index, null, 2), 'utf8');

  chunks.forEach((chunk, i) => {
    const name = `chunk-${String(i).padStart(2, '0')}.json`;
    writeFileSync(join(bodiesDir, name), JSON.stringify(chunk), 'utf8');
  });

  writeFileSync(join(bodiesDir, 'registry.ts'), renderRegistry(chunks.length), 'utf8');

  return { chunkCount: chunks.length, indexCount: index.length };
}
