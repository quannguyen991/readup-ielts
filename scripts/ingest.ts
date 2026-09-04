/**
 * Cào bài đọc từ các nguồn công khai, chấm độ khó, ghi ra seed dùng offline
 * (src/data/seed/index.json + bodies/) và (nếu đã cấu hình) đẩy lên Supabase.
 *
 *   npm run ingest                       # cào tiếp, giữ kho cũ + nguồn mới
 *   npm run ingest -- --limit 8          # giới hạn mỗi nguồn
 *   npm run ingest -- --replace          # bỏ hết kho cũ, cào lại từ đầu
 *   npm run ingest -- --resume           # bỏ qua nguồn đã ghi xong ở lần chạy trước
 *   npm run ingest -- --push             # đẩy tiếp lên Supabase
 *   npm run ingest -- --only official --only plos
 *   npm run ingest -- --only sat         # cả cụm nguồn SAT
 */
import 'dotenv/config';

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { fetchText } from '../src/services/ingest/http';
import { dedupe, normalizeArticle } from '../src/services/ingest/pipeline';
import type { ArticleBody, SeedIndexEntry } from '../src/services/ingest/seed-writer';
import { writeSeedBundle } from '../src/services/ingest/seed-writer';
import { FULL_TEXT_FEEDS, HEADLINE_FEEDS, fetchFeed } from '../src/services/ingest/sources/feeds';
import { fetchGutenbergSat } from '../src/services/ingest/sources/gutenberg';
import { fetchOfficialPractice } from '../src/services/ingest/sources/official-practice';
import { fetchSatScience } from '../src/services/ingest/sources/sat-science';
import { fetchArxiv, fetchPlos } from '../src/services/ingest/sources/science';
import {
  fetchWikipedia,
  fetchWikipediaCategories,
} from '../src/services/ingest/sources/wikipedia';
import type { IngestedArticle, SourceResult } from '../src/services/ingest/types';

const ROOT = resolve(import.meta.dirname, '..');
const SEED_DIR = resolve(ROOT, 'src/data/seed');
const INDEX_PATH = resolve(SEED_DIR, 'index.json');
const STATE_PATH = resolve(SEED_DIR, '.ingest-state.json');
const COMMON_WORDS_PATH = resolve(ROOT, 'src/data/common-words.json');
const COMMON_WORDS_URL =
  'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const log = (m: string) => console.log(m);

  // replace = bắt đầu từ rỗng; resume = tiếp tục kho cũ. Hai ý ngược nhau —
  // cho cả hai cùng lúc thì phải đoán ý nào thắng, nên chặn thẳng thay vì đoán.
  if (args.replace && args.resume) {
    log(
      '✗ --replace và --resume không thể dùng cùng lúc ' +
        '(replace = bỏ hết cào lại từ đầu, resume = tiếp tục kho cũ).',
    );
    process.exitCode = 1;
    return;
  }

  // index.json không còn mang body (Task 6 tách seed thành index + chunk),
  // nên "chấm lại độ khó từ seed" không còn dữ liệu để chấm. Giữ cờ lại (chỉ
  // để không vỡ dòng lệnh cũ vì unknown flag), đổi thân thành thông báo.
  if (args.rescore) {
    log(
      'Cờ --rescore đã bỏ: body giờ nằm trong chunk, không nằm trong index.\n' +
        'Muốn chấm lại thì chạy lại nguồn tương ứng, ví dụ: npm run ingest -- --only wikipedia-categories',
    );
    return;
  }

  const commonWords = await loadCommonWords(log);
  const ctx = { limit: args.limit, log };

  const state = loadState(args.resume);
  const rejected: Record<string, number> = {};
  const { articles: existingArticles, corruptCount } = args.replace
    ? { articles: [] as IngestedArticle[], corruptCount: 0 }
    : loadExistingIndex();
  let collected: IngestedArticle[] = existingArticles;

  /** Chạy một nguồn rồi ghi seed ngay — job dài 5-8 phút nên không được mất giữa đường. */
  const runSource = async (
    key: string,
    label: string,
    run: () => Promise<SourceResult> | SourceResult,
  ): Promise<void> => {
    if (!matches(args.only, key)) return;
    if (state.doneSources.includes(key)) {
      log(`\n▸ ${label} — bỏ qua, đã xong ở lần chạy trước (--resume)`);
      return;
    }

    log(`\n▸ ${label}`);

    let result: SourceResult;
    try {
      result = await run();
    } catch (err) {
      log(`  ✗ ${label} lỗi hẳn: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    for (const raw of result.articles) {
      const normalized = normalizeArticle(raw, commonWords);
      if (!normalized.ok) {
        rejected[normalized.reason] = (rejected[normalized.reason] ?? 0) + 1;
        continue;
      }
      collected.push(normalized.article);
    }

    collected = dedupe(collected);
    const written = writeSeedBundle(SEED_DIR, collected);

    state.doneSources.push(key);
    saveState(state);

    for (const e of result.errors.slice(0, 5)) log(`  - ${e}`);
    log(
      `  ✓ ${label}: kho bài hiện ${collected.length} bài · ${written.chunkCount} chunk (đã ghi seed)`,
    );
  };

  await runSource('wikipedia', 'Wikipedia — tiêu đề curated (sàn chất lượng)', () =>
    fetchWikipedia(ctx, 'en'),
  );
  await runSource('simple-wikipedia', 'Simple Wikipedia — tiêu đề curated', () =>
    fetchWikipedia({ ...ctx, limit: Math.ceil(args.limit / 2) }, 'simple'),
  );
  await runSource('wikipedia-categories', 'Wikipedia — crawl theo category', () =>
    fetchWikipediaCategories(ctx, 'en'),
  );
  await runSource('simple-wikipedia-categories', 'Simple Wikipedia — crawl theo category', () =>
    fetchWikipediaCategories(ctx, 'simple'),
  );
  await runSource('feeds', 'NASA (public domain)', async () => {
    const results = await Promise.all(FULL_TEXT_FEEDS.map((feed) => fetchFeed(feed, ctx)));
    return mergeResults('Loại A qua RSS', results);
  });
  await runSource('plos', 'PLOS ONE (CC BY)', () => fetchPlos(ctx));
  await runSource('arxiv', 'arXiv abstracts', () => fetchArxiv(ctx));
  await runSource('official', 'Đề chính thức IELTS / British Council', () =>
    fetchOfficialPractice(ctx),
  );
  /*
    NGUỒN LOẠI B ĐÃ TẮT — không chạy mặc định nữa, phải gọi `--only headlines`.

    Nguồn này chỉ lấy được tiêu đề của báo có bản quyền (BBC, Guardian,
    Economist, NPR, ScienceDaily, Phys.org, CDC), nên bài nó tạo ra không đọc
    được trong app: bấm vào là nhảy sang trang gốc, thêm mấy bước và một màn
    quảng cáo, rồi mới tới bài. Trong thư viện toàn bài đọc trọn vẹn thì 41 bài
    kiểu đó là 41 cái bẫy — nhìn y hệt bài đọc được cho tới lúc bấm vào.

    KHÔNG thể sửa bằng cách cào toàn văn về: đó là báo có bản quyền, và ghi
    nguồn không phải là giấy phép sao chép. `normalizeArticle` cũng chặn sẵn
    (xem `pipeline.ts`, có test canh) — nên cách duy nhất còn lại là đừng thêm
    những bài không đọc được vào thư viện ngay từ đầu.

    Bài đã lỡ thêm cũng đã gỡ khỏi `index.json`. Link đề chính thức (Cambridge,
    College Board, Khan Academy) thì GIỮ: nó gắn nhãn "Đề chính thức", không ai
    mong đọc nguyên đề thi trong app, nên nó không lừa ai cả.
  */
  if (args.only.includes('headlines')) {
    await runSource('headlines', 'Loại B — CHỈ tiêu đề + link gốc', async () => {
      const results = await Promise.all(
        HEADLINE_FEEDS.map((feed) => fetchFeed(feed, { ...ctx, limit: Math.min(args.limit, 6) })),
      );
      return mergeResults('Loại B', results);
    });
  }

  // Nguồn SAT. Khoá bắt đầu bằng `sat-` nên `--only sat` gọi được cả cụm.
  await runSource(
    'sat-gutenberg',
    'SAT — văn học, văn kiện lập quốc, khoa học kinh điển (Project Gutenberg)',
    () => fetchGutenbergSat(ctx),
  );
  await runSource('sat-science', 'SAT — khoa học & khoa học xã hội đương đại', () =>
    fetchSatScience(ctx),
  );

  const written = writeSeedBundle(SEED_DIR, collected);

  printSummary({ log, collected, written, rejected, corruptCount });

  // KHÔNG xoá state file dù mọi nguồn (theo --only, nếu có) đã chạy xong.
  // --resume chỉ được ĐỌC khi gõ tay (xem loadState: resume=false bỏ qua
  // file này hoàn toàn), nên file cũ còn tồn tại không làm `npm run ingest`
  // trơn bỏ sót nguồn nào — không có nguy cơ "âm thầm bỏ qua". Giữ lại còn
  // được việc: thêm nguồn mới vào code rồi chạy --resume sẽ chỉ chạy nguồn
  // mới đó, khỏi cào lại toàn bộ các nguồn cũ đã xong.
  if (existsSync(STATE_PATH)) {
    log(`\n(${STATE_PATH} vẫn còn — dùng --resume ở lần chạy sau để bỏ qua các nguồn đã xong.)`);
  }

  if (args.push) await pushToSupabase(collected, log);
}

function parseArgs(argv: string[]) {
  const args = {
    limit: 12,
    push: false,
    replace: false,
    rescore: false,
    resume: false,
    only: [] as string[],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--limit') args.limit = Math.max(1, Number(argv[++i]) || 12);
    else if (arg === '--push') args.push = true;
    else if (arg === '--replace') args.replace = true;
    else if (arg === '--rescore') args.rescore = true;
    else if (arg === '--resume') args.resume = true;
    else if (arg === '--only') args.only.push(String(argv[++i]));
  }

  return args;
}

/**
 * `--only` nhận cả tên nguồn lẻ lẫn tên NHÓM ('ielts' / 'sat').
 *
 * Nhóm suy ra từ tiền tố khoá chứ không tra bảng riêng: bảng riêng là thứ sẽ
 * lệch với danh sách runSource ngay lần thêm nguồn tiếp theo.
 */
function matches(only: string[], key: string): boolean {
  if (only.length === 0 || only.includes(key)) return true;
  return only.includes(key.startsWith('sat-') ? 'sat' : 'ielts');
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

type IngestState = { doneSources: string[] };

function loadState(resume: boolean): IngestState {
  if (!resume || !existsSync(STATE_PATH)) return { doneSources: [] };
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as IngestState;
  } catch {
    return { doneSources: [] };
  }
}

function saveState(state: IngestState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function mergeResults(label: string, results: SourceResult[]): SourceResult {
  return {
    source: label,
    articles: results.flatMap((r) => r.articles),
    errors: results.flatMap((r) => r.errors),
  };
}

/**
 * Nạp lại index.json VÀ gắn lại body từ bodies/chunk-*.json.
 *
 * writeSeedBundle ghi lại TOÀN BỘ kho bài mỗi lần gọi — xoá sạch chunk cũ rồi
 * ghi lại đúng những gì được truyền vào (xem comment trong seed-writer.ts).
 * index.json tự nó không mang body, đó là lý do nó nhẹ; nhưng nếu hàm này
 * trả bài cũ ra với bodyText: null, lần writeSeedBundle kế tiếp sẽ xoá toàn
 * văn của MỌI bài đã cào trước đó — biến kho 1000 bài đọc được thành 1000
 * bài rỗng, không một dòng lỗi nào báo. Vì vậy phải đọc thẳng file chunk
 * bằng fs (KHÔNG qua bodies/registry.ts — file đó dùng require() chuỗi
 * literal cho Metro bundler lúc build app, không phải cho script Node này)
 * để gắn lại body trước khi đưa các bài đó vào `collected`.
 */
function loadExistingIndex(): { articles: IngestedArticle[]; corruptCount: number } {
  if (!existsSync(INDEX_PATH)) return { articles: [], corruptCount: 0 };

  let index: SeedIndexEntry[];
  try {
    index = JSON.parse(readFileSync(INDEX_PATH, 'utf8')) as SeedIndexEntry[];
  } catch {
    return { articles: [], corruptCount: 0 };
  }

  const bodiesDir = join(SEED_DIR, 'bodies');
  const bodyById = new Map<string, ArticleBody>();

  if (existsSync(bodiesDir)) {
    // Glob bằng readdirSync + regex thay vì đoán tên file theo chunkCount cũ,
    // để một file chunk bị xoá/đổi tên không làm cả script sập.
    const chunkFiles = readdirSync(bodiesDir).filter((name) => /^chunk-\d+\.json$/.test(name));

    for (const name of chunkFiles) {
      try {
        const chunk = JSON.parse(readFileSync(join(bodiesDir, name), 'utf8')) as Record<
          string,
          ArticleBody
        >;
        for (const [id, body] of Object.entries(chunk)) bodyById.set(id, body);
      } catch {
        // Một chunk hỏng không được làm sập cả script — bài của nó sẽ tự
        // rơi vào nhánh "không tìm thấy body" và bị đếm corrupt bên dưới.
      }
    }
  }

  let corruptCount = 0;
  const articles: IngestedArticle[] = index.map((entry) => {
    const { chunk, ...meta } = entry;
    const body = bodyById.get(entry.id);

    if (body) return { ...meta, bodyText: body.bodyText, paragraphs: body.paragraphs };

    // index nói bài này có chunk nhưng không tìm thấy body tương ứng trên
    // đĩa — kho seed đã hỏng một phần TỪ TRƯỚC lần chạy này (bài Loại B /
    // official có chunk: null ngay từ đầu, không rơi vào nhánh này).
    if (chunk !== null) corruptCount += 1;

    return { ...meta, bodyText: null, paragraphs: [] };
  });

  return { articles, corruptCount };
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

function formatCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
}

/** Bảng điều khiển duy nhất của người vận hành khi chạy job 5-8 phút — phải đủ để chẩn đoán, không cần đọc log thô. */
function printSummary(input: {
  log: (m: string) => void;
  collected: IngestedArticle[];
  written: { indexCount: number; chunkCount: number };
  rejected: Record<string, number>;
  corruptCount: number;
}): void {
  const { log, collected, written, rejected, corruptCount } = input;

  log('\n── Kết quả ──');
  log(`Kho bài: ${written.indexCount} bài · ${written.chunkCount} chunk body`);
  log(`Có toàn văn: ${collected.filter((a) => a.bodyText !== null).length}`);
  log(`Chỉ tiêu đề:  ${collected.filter((a) => a.bodyText === null).length}`);
  log(`Phân bố kỳ thi: ${formatCounts(countBy(collected, (a) => a.exam))}`);
  log(`Phân bố tier: ${formatCounts(countBy(collected, (a) => a.passageTier ?? 'null'))}`);
  log(`Phân bố CEFR: ${formatCounts(countBy(collected, (a) => a.cefrLevel ?? 'null'))}`);

  const sat = collected.filter((a) => a.exam === 'sat');
  if (sat.length > 0) {
    log(`Loại văn bản SAT: ${formatCounts(countBy(sat, (a) => a.satTextType ?? 'null'))}`);
  }

  if (Object.keys(rejected).length > 0) {
    const total = Object.values(rejected).reduce((sum, n) => sum + n, 0);
    log(`\nBài bị loại theo lý do (tổng ${total}): ${formatCounts(rejected)}`);
  }

  if (corruptCount > 0) {
    log(
      `\n⚠ ${corruptCount} bài trong index.json có chunk nhưng KHÔNG tìm thấy body trong ` +
        `bodies/ — kho seed có thể đã hỏng một phần từ trước lần chạy này.`,
    );
  }
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
    exam: a.exam,
    passage_tier: a.passageTier,
    sat_text_type: a.satTextType,
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
