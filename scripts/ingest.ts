/**
 * Cào bài đọc từ các nguồn công khai, chấm độ khó, ghi ra seed dùng offline
 * và (nếu đã cấu hình) đẩy lên Supabase.
 *
 *   npm run ingest                       # cào + ghi src/data/seed/articles.json
 *   npm run ingest -- --limit 8          # giới hạn mỗi nguồn
 *   npm run ingest -- --push             # đẩy tiếp lên Supabase
 *   npm run ingest -- --only wikipedia
 */
import 'dotenv/config';

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { fetchText } from '../src/services/ingest/http';
import { dedupe, normalizeArticle } from '../src/services/ingest/pipeline';
import { analyzeText } from '../src/services/ingest/readability';
import { FULL_TEXT_FEEDS, HEADLINE_FEEDS, fetchFeed } from '../src/services/ingest/sources/feeds';
import { fetchArxiv, fetchPlos } from '../src/services/ingest/sources/science';
import { fetchWikipedia } from '../src/services/ingest/sources/wikipedia';
import type { IngestedArticle, SourceResult } from '../src/services/ingest/types';

const ROOT = resolve(import.meta.dirname, '..');
const SEED_PATH = resolve(ROOT, 'src/data/seed/articles.json');
const COMMON_WORDS_PATH = resolve(ROOT, 'src/data/common-words.json');
const COMMON_WORDS_URL =
  'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const log = (m: string) => console.log(m);

  const commonWords = await loadCommonWords(log);
  const ctx = { limit: args.limit, log };

  // Chấm lại độ khó cho kho bài hiện có mà không gọi mạng.
  if (args.rescore) {
    const existing = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as IngestedArticle[];
    const rescored = existing.map((a) => {
      if (!a.bodyText) return a;
      const analysis = analyzeText(a.bodyText, commonWords);
      return {
        ...a,
        cefrLevel: analysis.cefr,
        bandRange: analysis.bandRange,
        wordCount: analysis.wordCount,
        estMinutes: analysis.estMinutes,
        readabilityScore: analysis.fkGrade,
        rareWordRatio: analysis.rareWordRatio,
      };
    });
    writeSeed(rescored);
    const dist = rescored.reduce<Record<string, number>>((acc, a) => {
      if (a.cefrLevel) acc[a.cefrLevel] = (acc[a.cefrLevel] ?? 0) + 1;
      return acc;
    }, {});
    log(`Đã chấm lại ${rescored.filter((a) => a.bodyText).length} bài: ${JSON.stringify(dist)}`);
    return;
  }

  const results: SourceResult[] = [];

  if (matches(args.only, 'wikipedia')) {
    log('\n▸ Wikipedia (CC BY-SA, lưu toàn văn kèm attribution)');
    results.push(await fetchWikipedia(ctx, 'en'));
  }
  if (matches(args.only, 'simple-wikipedia')) {
    log('\n▸ Simple Wikipedia (bản dễ đọc hơn)');
    results.push(await fetchWikipedia({ ...ctx, limit: Math.ceil(args.limit / 2) }, 'simple'));
  }
  if (matches(args.only, 'feeds')) {
    log('\n▸ Nguồn Loại A qua RSS (public domain / mở)');
    for (const feed of FULL_TEXT_FEEDS) results.push(await fetchFeed(feed, ctx));
  }
  if (matches(args.only, 'plos')) {
    log('\n▸ PLOS ONE (CC BY)');
    results.push(await fetchPlos(ctx));
  }
  if (matches(args.only, 'arxiv')) {
    log('\n▸ arXiv abstracts');
    results.push(await fetchArxiv(ctx));
  }
  if (matches(args.only, 'headlines')) {
    log('\n▸ Nguồn Loại B — CHỈ tiêu đề + link gốc, không lưu toàn văn');
    for (const feed of HEADLINE_FEEDS) {
      results.push(await fetchFeed(feed, { ...ctx, limit: Math.min(args.limit, 6) }));
    }
  }

  const raw = results.flatMap((r) => r.articles);
  const errors = results.flatMap((r) => r.errors);

  const articles = dedupe(raw.map((r) => normalizeArticle(r, commonWords)));

  const merged = args.replace ? articles : mergeWithExisting(articles);
  writeSeed(merged);

  log('\n── Kết quả ──');
  log(`Lấy về: ${raw.length} bài · sau khi bỏ trùng: ${articles.length} · seed hiện có: ${merged.length}`);
  log(`Loại A (có toàn văn): ${merged.filter((a) => a.bodyText).length}`);
  log(`Loại B (chỉ tiêu đề):  ${merged.filter((a) => !a.bodyText).length}`);
  log(`Ghi vào: ${SEED_PATH}`);

  if (errors.length > 0) {
    log(`\nNguồn lỗi hoặc bỏ qua (${errors.length}):`);
    for (const e of errors.slice(0, 20)) log(`  - ${e}`);
  }

  if (args.push) await pushToSupabase(merged, log);
}

function parseArgs(argv: string[]) {
  const args = { limit: 12, push: false, replace: false, rescore: false, only: [] as string[] };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--limit') args.limit = Math.max(1, Number(argv[++i]) || 12);
    else if (arg === '--push') args.push = true;
    else if (arg === '--replace') args.replace = true;
    else if (arg === '--rescore') args.rescore = true;
    else if (arg === '--only') args.only.push(String(argv[++i]));
  }

  return args;
}

function matches(only: string[], key: string): boolean {
  return only.length === 0 || only.includes(key);
}

/** Danh sách từ phổ biến để tính tỉ lệ từ hiếm — tải một lần rồi cache. */
async function loadCommonWords(log: (m: string) => void): Promise<ReadonlySet<string>> {
  if (existsSync(COMMON_WORDS_PATH)) {
    const words = JSON.parse(readFileSync(COMMON_WORDS_PATH, 'utf8')) as string[];
    return new Set(words);
  }

  log('Tải danh sách 10.000 từ tiếng Anh phổ biến (chỉ lần đầu)…');
  const text = await fetchText(COMMON_WORDS_URL);
  const words = text
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5000);

  mkdirSync(dirname(COMMON_WORDS_PATH), { recursive: true });
  writeFileSync(COMMON_WORDS_PATH, JSON.stringify(words), 'utf8');
  log(`  ✓ lưu ${words.length} từ vào ${COMMON_WORDS_PATH}`);

  return new Set(words);
}

/** Giữ lại bài cũ, thêm bài mới — id ổn định nên không sinh bản sao. */
function mergeWithExisting(fresh: IngestedArticle[]): IngestedArticle[] {
  if (!existsSync(SEED_PATH)) return fresh;

  const existing = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as IngestedArticle[];
  const byId = new Map(existing.map((a) => [a.externalId, a]));
  for (const article of fresh) byId.set(article.externalId, article);

  return [...byId.values()];
}

function writeSeed(articles: IngestedArticle[]): void {
  mkdirSync(dirname(SEED_PATH), { recursive: true });
  const sorted = [...articles].sort((a, b) => a.title.localeCompare(b.title));
  writeFileSync(SEED_PATH, JSON.stringify(sorted, null, 2), 'utf8');
}

async function pushToSupabase(articles: IngestedArticle[], log: (m: string) => void): Promise<void> {
  const missing = ['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_KEY'].filter(
    (n) => !process.env[n],
  );
  if (missing.length > 0) {
    log(`\nBỏ qua --push: thiếu ${missing.join(', ')} trong .env.local.`);
    return;
  }

  const { getSupabaseAdmin } = await import('../src/lib/supabase-admin');
  const supabase = getSupabaseAdmin();

  const { data: topics } = await supabase.from('topics').select('id, slug');
  const topicId = new Map((topics ?? []).map((t) => [t.slug, t.id]));

  const rows = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    source_name: a.sourceName,
    source_url: a.sourceUrl,
    topic: a.topic,
    topic_id: topicId.get(a.topic) ?? null,
    track: a.track,
    cefr_level: a.cefrLevel,
    band_range: a.bandRange,
    word_count: a.wordCount,
    est_minutes: a.estMinutes,
    body_text: a.bodyText,
    summary: a.summary,
    thumbnail_url: a.thumbnailUrl,
    license_type: a.licenseType,
    attribution: a.attribution,
    readability_score: a.readabilityScore,
    rare_word_ratio: a.rareWordRatio,
    published_at: a.publishedAt,
    is_private: false,
  }));

  const { error } = await supabase.from('articles').upsert(rows, { onConflict: 'id' });

  if (error) {
    log(`\n✗ Đẩy lên Supabase thất bại: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  log(`\n✓ Đã đẩy ${rows.length} bài lên Supabase.`);
}

main().catch((err: unknown) => {
  console.error('Ingest dừng do lỗi:', err);
  process.exit(1);
});
