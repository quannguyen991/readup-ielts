import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CHUNK_SIZE, buildSeedBundle, renderRegistry, writeSeedBundle } from './seed-writer';
import type { IngestedArticle } from './types';

function article(i: number, withBody = true): IngestedArticle {
  return {
    id: `id-${i}`,
    externalId: `ext-${i}`,
    title: `Article ${i}`,
    slug: `article-${i}`,
    sourceName: 'Wikipedia',
    sourceUrl: 'https://example.org/a',
    topic: 'science',
    track: 'academic',
    exam: 'ielts',
    satTextType: null,
    licenseType: withBody ? 'cc_by_sa' : 'headline_only',
    passageTier: withBody ? 'p1' : 'headline',
    attribution: null,
    publishedAt: null,
    summary: 'summary',
    bodyText: withBody ? `body of ${i}\n\nsecond paragraph` : null,
    paragraphs: withBody ? [`body of ${i}`, 'second paragraph'] : [],
    thumbnailUrl: null,
    cefrLevel: withBody ? 'B1' : null,
    bandRange: withBody ? 'Band 5–6' : null,
    wordCount: withBody ? 5 : null,
    estMinutes: withBody ? 1 : null,
    readabilityScore: withBody ? 8 : null,
    rareWordRatio: withBody ? 0.1 : null,
  };
}

test('buildSeedBundle: index KHÔNG chứa bodyText hay paragraphs', () => {
  const { index } = buildSeedBundle([article(1)]);
  const entry = index[0]! as Record<string, unknown>;

  assert.equal('bodyText' in entry, false, 'index không được mang bodyText');
  assert.equal('paragraphs' in entry, false, 'index không được mang paragraphs');
  assert.equal(entry.title, 'Article 1');
  assert.equal(entry.passageTier, 'p1');
});

test('buildSeedBundle: body nằm trong chunk, tra được theo id', () => {
  const { index, chunks } = buildSeedBundle([article(1)]);
  const chunkIndex = index[0]!.chunk!;

  assert.equal(typeof chunkIndex, 'number');
  assert.deepEqual(chunks[chunkIndex]!['id-1'], {
    bodyText: 'body of 1\n\nsecond paragraph',
    paragraphs: ['body of 1', 'second paragraph'],
  });
});

test('buildSeedBundle: bài không có body thì chunk là null', () => {
  const { index, chunks } = buildSeedBundle([article(1, false)]);

  assert.equal(index[0]!.chunk, null);
  assert.equal(chunks.length, 0, 'không sinh chunk rỗng');
});

test('buildSeedBundle: chia chunk theo CHUNK_SIZE', () => {
  const articles = Array.from({ length: CHUNK_SIZE + 3 }, (_, i) => article(i));
  const { index, chunks } = buildSeedBundle(articles);

  assert.equal(chunks.length, 2);
  assert.equal(Object.keys(chunks[0]!).length, CHUNK_SIZE);
  assert.equal(Object.keys(chunks[1]!).length, 3);
  assert.equal(index[CHUNK_SIZE]!.chunk, 1);
});

test('buildSeedBundle: bài không body không chiếm slot chunk', () => {
  const articles = [article(0, false), article(1), article(2, false), article(3)];
  const { index, chunks } = buildSeedBundle(articles);

  assert.equal(chunks.length, 1);
  assert.deepEqual(Object.keys(chunks[0]!).sort(), ['id-1', 'id-3']);
  assert.equal(index[0]!.chunk, null);
  assert.equal(index[1]!.chunk, 0);
});

test('renderRegistry: sinh require() TĨNH cho Metro thấy được lúc build', () => {
  const code = renderRegistry(2);

  assert.match(code, /require\('\.\/chunk-00\.json'\)/);
  assert.match(code, /require\('\.\/chunk-01\.json'\)/);
  // Không được dùng template string trong require — Metro không phân tích được.
  assert.equal(/require\(`/.test(code), false);
});

test('renderRegistry: 0 chunk vẫn ra file hợp lệ', () => {
  const code = renderRegistry(0);
  assert.match(code, /export const CHUNKS/);
});

// Không thuộc 7 test của brief — thêm để chốt phần fs glue của writeSeedBundle
// (bản thân buildSeedBundle/renderRegistry đã được test thuần ở trên).
// LUÔN chạy trên thư mục tạm, không bao giờ đụng vào src/data/seed thật.
test('writeSeedBundle: ghi đúng tên file và dọn chunk cũ mồ côi', () => {
  const dir = mkdtempSync(join(tmpdir(), 'seed-writer-test-'));
  try {
    const bodiesDir = join(dir, 'bodies');
    mkdirSync(bodiesDir, { recursive: true });
    // Giả lập chunk mồ côi còn sót lại từ một lần chạy trước với kho bài lớn hơn.
    writeFileSync(join(bodiesDir, 'chunk-99.json'), '{}', 'utf8');

    const articles = Array.from({ length: CHUNK_SIZE + 3 }, (_, i) => article(i));
    const result = writeSeedBundle(dir, articles);

    assert.equal(result.chunkCount, 2);
    assert.equal(result.indexCount, CHUNK_SIZE + 3);

    assert.equal(existsSync(join(dir, 'index.json')), true);
    assert.equal(existsSync(join(bodiesDir, 'chunk-00.json')), true);
    assert.equal(existsSync(join(bodiesDir, 'chunk-01.json')), true);
    assert.equal(existsSync(join(bodiesDir, 'chunk-99.json')), false, 'chunk mồ côi phải bị xoá');
    assert.equal(existsSync(join(bodiesDir, 'registry.ts')), true);

    const registry = readFileSync(join(bodiesDir, 'registry.ts'), 'utf8');
    assert.match(registry, /require\('\.\/chunk-00\.json'\)/);
    assert.match(registry, /require\('\.\/chunk-01\.json'\)/);

    const chunk0 = JSON.parse(readFileSync(join(bodiesDir, 'chunk-00.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    assert.equal(Object.keys(chunk0).length, CHUNK_SIZE);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
