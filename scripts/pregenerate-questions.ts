/**
 * Soạn sẵn đề cho cả kho bài đọc — làm ẤM cache dùng chung TRƯỚC khi người
 * dùng thật mở tới, thay vì để người đầu tiên mở mỗi bài phải chờ 20-40 giây.
 *
 *   npx tsx scripts/pregenerate-questions.ts                # toàn bộ IELTS đọc được
 *   npx tsx scripts/pregenerate-questions.ts --exam sat      # toàn bộ SAT đọc được
 *   npx tsx scripts/pregenerate-questions.ts --limit 50      # thử 50 bài đầu
 *   npx tsx scripts/pregenerate-questions.ts --concurrency 6
 *
 * GỌI THẲNG ENDPOINT ĐÃ DEPLOY (`/api/questions`), không gọi lại
 * `generateQuestionsWithClaude` trực tiếp trong script. Lý do: route đã có sẵn
 * toàn bộ luật (đọc cache trước, khoá đơn hàng dạng câu, ghi cache sau) — gọi
 * qua HTTP đảm bảo script và người dùng thật đi CHUNG một đường, không có nguy
 * cơ script tự vẽ ra một đường ghi cache khác rồi lệch với route.
 *
 * CHỊU ĐƯỢC PROXY THẤT THƯỜNG: đã đo thấy có lượt chỉ về được 4/12 câu (một lô
 * hỏng trong ba lô song song) hoặc lỗi 502/504 thoáng qua. Mỗi bài thử lại tối
 * đa 2 lần nếu kết quả quá mỏng hoặc lỗi mạng — không thử lại vô hạn, vì một
 * bài mãi không sinh được thì để lần MỞ THẬT sau tự sinh, không đáng giữ script
 * chạy mãi vì một bài.
 */
import { filterArticles } from '../src/data/articles';
import { MIN_CACHEABLE_QUESTIONS } from '../src/services/questions/cache';

const API_URL = process.env.PREGEN_API_URL ?? 'https://readup-ielts.vercel.app/api/questions';
/*
  Dùng CHUNG ngưỡng với `writeSharedQuestionSet` — route chỉ ghi cache từ
  ngần này câu trở lên, nên script coi dưới ngưỡng là "chưa cache được, đáng
  thử lại" cũng phải đúng NGẦN ẤY, không phải một con số tự chọn riêng. Lệch
  hai ngưỡng là y hệt lỗi đã sửa: script tưởng đã xong nhưng route lại không
  ghi, hoặc ngược lại script cứ thử lại một kết quả mà route đã ghim rồi.
*/
const MIN_ACCEPTABLE_QUESTIONS = MIN_CACHEABLE_QUESTIONS;
const MAX_ATTEMPTS = 3;

type Args = { exam: 'ielts' | 'sat'; limit: number | null; concurrency: number };

function parseArgs(argv: string[]): Args {
  const flag = (name: string) => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };
  return {
    exam: flag('--exam') === 'sat' ? 'sat' : 'ielts',
    limit: flag('--limit') ? Number(flag('--limit')) : null,
    concurrency: flag('--concurrency') ? Number(flag('--concurrency')) : 8,
  };
}

async function generateOne(articleId: string): Promise<{ ok: boolean; n: number; note: string }> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
        signal: AbortSignal.timeout(90_000),
      });
      const body = (await res.json().catch(() => null)) as { questions?: unknown[]; generatedBy?: string } | null;
      const n = body?.questions?.length ?? 0;

      // Bộ offline luôn ít câu và chỉ Multiple Choice — KHÔNG đáng cache, để
      // lần mở thật sau còn cơ hội thử lại AI (route không cache bộ offline).
      if (body?.generatedBy === 'ai' && n >= MIN_ACCEPTABLE_QUESTIONS) {
        return { ok: true, n, note: `HTTP ${res.status}` };
      }
      if (attempt < MAX_ATTEMPTS) continue;
      return { ok: false, n, note: `HTTP ${res.status}, generatedBy=${body?.generatedBy ?? '?'}` };
    } catch (err) {
      if (attempt < MAX_ATTEMPTS) continue;
      return { ok: false, n: 0, note: err instanceof Error ? err.message.slice(0, 80) : 'lỗi lạ' };
    }
  }
  return { ok: false, n: 0, note: 'không tới được' };
}

/** Chạy `items` qua `worker`, tối đa `concurrency` việc cùng lúc. */
async function runPool<T>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<void>) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]!, index);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let articles = filterArticles({ kind: 'readable', exam: args.exam, sort: 'easiest' });
  if (args.limit) articles = articles.slice(0, args.limit);

  console.log(`Soạn sẵn đề cho ${articles.length} bài ${args.exam.toUpperCase()}, ${args.concurrency} luồng song song.\n`);

  let done = 0;
  let ok = 0;
  let totalQuestions = 0;
  const failed: string[] = [];
  const startedAt = Date.now();

  await runPool(articles, args.concurrency, async (article) => {
    const result = await generateOne(article.id);
    done += 1;
    if (result.ok) {
      ok += 1;
      totalQuestions += result.n;
    } else {
      failed.push(`${article.id} (${article.title}): ${result.note}`);
    }

    if (done % 10 === 0 || done === articles.length) {
      const elapsedMin = ((Date.now() - startedAt) / 60_000).toFixed(1);
      console.log(`  ${done}/${articles.length} · ✓ ${ok} · ✗ ${failed.length} · ${elapsedMin} phút`);
    }
  });

  const elapsedMin = ((Date.now() - startedAt) / 60_000).toFixed(1);
  console.log(`\nXong sau ${elapsedMin} phút. ${ok}/${articles.length} bài đã có cache (${totalQuestions} câu).`);

  if (failed.length > 0) {
    console.log(`\n${failed.length} bài chưa cache được — sẽ tự sinh lúc người dùng mở thật:`);
    for (const line of failed.slice(0, 20)) console.log(`  · ${line}`);
    if (failed.length > 20) console.log(`  … và ${failed.length - 20} bài nữa`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
