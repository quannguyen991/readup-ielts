/**
 * Dựng kho tri thức cho hỏi đáp cả kho, từ seed bài đọc của app.
 *
 *   npm run kb:ingest                 # dựng corpus, chỉ ghi ra tệp, KHÔNG đẩy
 *   npm run kb:ingest -- --push       # đẩy tiếp phần chưa nạp lên LightRAG
 *   npm run kb:ingest -- --push --lai # bỏ sổ tiến độ, đẩy lại từ đầu
 *   npm run kb:ingest -- --limit 20   # chỉ lấy 20 bài đầu, để thử
 *   npm run kb:ingest -- --trang-thai # chỉ hỏi trạng thái chỉ mục rồi thoát
 *
 * VÌ SAO CÓ SỔ TIẾN ĐỘ. Nạp 1.400 bài mất hàng giờ và hay đứt giữa chừng (đường
 * hầm rớt, máy chủ khởi động lại). Không ghi lại thì lần chạy sau nạp trùng, và
 * LightRAG sẽ index lại từ đầu những bài đã xong — tốn đúng thứ đắt nhất là lượt
 * gọi mô hình. Sổ ghi theo `id` của seed, nằm cạnh seed.
 *
 * ĐẨY XONG KHÔNG PHẢI LÀ INDEX XONG. LightRAG nhận tài liệu vào hàng đợi rồi
 * index nền. Dùng `--trang-thai` để xem hàng đợi rút chưa.
 */
import 'dotenv/config';

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { ArticleBody, SeedIndexEntry } from '../src/services/ingest/seed-writer';
import {
  demTrangThai,
  docCauHinh,
  napMe,
  trangThaiDuongOng,
} from '../src/services/tutor/kb-admin';
import type { KbDoc } from '../src/services/tutor/kb-corpus';
import { batches, buildKbDoc, conLai } from '../src/services/tutor/kb-corpus';

const ROOT = resolve(import.meta.dirname, '..');
const SEED_DIR = resolve(ROOT, 'src/data/seed');
const INDEX_PATH = resolve(SEED_DIR, 'index.json');
const BODIES_DIR = resolve(SEED_DIR, 'bodies');
const CORPUS_PATH = resolve(ROOT, '.kb/corpus.jsonl');
const STATE_PATH = resolve(ROOT, '.kb/da-nap.json');

/** Mẻ 20 bài — bằng với lần nạp đầu, để máy chủ nhận cùng một tải quen thuộc. */
const CO_ME = 20;

async function main(): Promise<void> {
  const args = docThamSo(process.argv.slice(2));

  if (args.trangThai) {
    await inTrangThai();
    return;
  }

  const docs = dungCorpus(args.limit);
  ghiCorpus(docs);

  if (!args.push) {
    console.log('\nChưa đẩy gì cả. Thêm --push để nạp lên LightRAG.');
    return;
  }

  const daNap = args.lai ? new Set<string>() : docSo();
  const canNap = conLai(docs, daNap);
  console.log(
    `\nĐẩy lên kho: ${canNap.length} bài (đã nạp trước đó ${daNap.size}, tổng ${docs.length}).`,
  );
  if (canNap.length === 0) return;

  const cfg = docCauHinh();
  const me = batches(canNap, CO_ME);
  let xong = 0;

  for (const [i, lo] of me.entries()) {
    try {
      await napMe(cfg, lo);
    } catch (err) {
      // Dừng hẳn thay vì bỏ qua mẻ hỏng: sổ tiến độ đã ghi tới đây, lần sau chạy
      // tiếp đúng chỗ này. Bỏ qua rồi chạy tiếp là cách tạo ra lỗ hổng trong kho
      // mà không ai biết — kho thiếu bài thì câu trả lời sai mà vẫn nghe có lý.
      console.error(`\nMẻ ${i + 1}/${me.length} hỏng: ${(err as Error).message}`);
      console.error('Đã dừng. Sửa xong chạy lại lệnh này, nó nạp tiếp chỗ dở.');
      process.exitCode = 1;
      return;
    }

    lo.forEach((d) => daNap.add(d.id));
    ghiSo(daNap);
    xong += lo.length;
    console.log(`   mẻ ${i + 1}/${me.length} · ${xong}/${canNap.length} bài`);
  }

  console.log('\nĐẩy xong. LightRAG index nền — xem tiến độ bằng: npm run kb:ingest -- --trang-thai');
}

/** Đọc seed rồi dựng danh sách tài liệu, kèm báo cáo số bài bị bỏ qua. */
function dungCorpus(limit: number | null): KbDoc[] {
  const metas = JSON.parse(readFileSync(INDEX_PATH, 'utf8')) as SeedIndexEntry[];
  const than = new Map<number, Record<string, ArticleBody>>();

  const docs: KbDoc[] = [];
  let khongCoThan = 0;

  for (const meta of metas) {
    const body = layThan(than, meta);
    const doc = buildKbDoc(meta, body);
    if (!doc) {
      khongCoThan += 1;
      continue;
    }
    docs.push(doc);
    if (limit && docs.length >= limit) break;
  }

  console.log(
    `Seed: ${metas.length} bài · dựng được ${docs.length} tài liệu · bỏ qua ${khongCoThan} bài không có thân bài.`,
  );
  return docs;
}

/**
 * Nạp chunk thân bài theo yêu cầu.
 *
 * Đọc thẳng bằng `fs` chứ không qua `data/article-repository`: tệp đó dùng
 * `require()` chuỗi literal cho Metro, còn đây là một script Node.
 */
function layThan(
  cache: Map<number, Record<string, ArticleBody>>,
  meta: SeedIndexEntry,
): ArticleBody | null {
  if (meta.chunk === null || meta.chunk === undefined) return null;
  if (!cache.has(meta.chunk)) {
    const ten = `chunk-${String(meta.chunk).padStart(2, '0')}.json`;
    const duong = resolve(BODIES_DIR, ten);
    cache.set(
      meta.chunk,
      existsSync(duong) ? (JSON.parse(readFileSync(duong, 'utf8')) as Record<string, ArticleBody>) : {},
    );
  }
  return cache.get(meta.chunk)?.[meta.id] ?? null;
}

function ghiCorpus(docs: readonly KbDoc[]): void {
  mkdirSync(dirname(CORPUS_PATH), { recursive: true });
  const van = docs.map((d) => JSON.stringify({ id: d.id, file_source: d.fileSource, text: d.text })).join('\n');
  writeFileSync(CORPUS_PATH, `${van}\n`, 'utf8');
  console.log(`Đã ghi ${CORPUS_PATH}`);
}

function docSo(): Set<string> {
  if (!existsSync(STATE_PATH)) return new Set();
  try {
    const d = JSON.parse(readFileSync(STATE_PATH, 'utf8')) as { ids?: string[] };
    return new Set(d.ids ?? []);
  } catch {
    // Sổ hỏng thì coi như chưa nạp gì: nạp trùng chỉ tốn thời gian, còn tin vào
    // một sổ hỏng thì bỏ sót bài, và bỏ sót thì không ai nhìn thấy.
    return new Set();
  }
}

function ghiSo(ids: ReadonlySet<string>): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify({ ids: [...ids] }, null, 0), 'utf8');
}

async function inTrangThai(): Promise<void> {
  const cfg = docCauHinh();
  const [dem, ong] = await Promise.all([demTrangThai(cfg), trangThaiDuongOng(cfg)]);
  console.log(
    `Chỉ mục: đã xong ${dem.processed} · đang chạy ${dem.processing} · chờ ${dem.pending} · lỗi ${dem.failed} · tổng ${dem.all}`,
  );
  console.log(`Đường ống: ${ong.busy ? 'đang chạy' : 'nghỉ'} · ${ong.job}`);
  if (ong.message) console.log(`   ${ong.message.slice(0, 200)}`);
}

function docThamSo(argv: string[]) {
  const args = { push: false, lai: false, trangThai: false, limit: null as number | null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--push') args.push = true;
    else if (a === '--lai') args.lai = true;
    else if (a === '--trang-thai') args.trangThai = true;
    else if (a === '--limit') args.limit = Math.max(1, Number(argv[++i]) || 1);
  }
  return args;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
