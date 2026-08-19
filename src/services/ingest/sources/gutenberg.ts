import { createPacer, fetchText, mapWithConcurrency } from '../http';
import { pickExcerpts, stripGutenbergBoilerplate, toProseParagraphs, type Excerpt } from '../excerpt';
import { GUTENBERG_WORKS, SAT_TEXT_TYPE_LABEL, type GutenbergWork } from './gutenberg-works';
import type { FetchContext, RawArticle, SourceResult } from '../types';
import type { PassageTier } from '@/types/database';

/**
 * Passage SAT cắt từ sách public domain trên Project Gutenberg.
 *
 * Vì sao không lưu cả cuốn: một bài đọc trong app phải bằng đúng khổ một
 * passage đề thi. Nên mỗi tác phẩm được cắt thành vài trích đoạn liền mạch —
 * đúng cách đề thi thật trích sách — chứ không phải một "bài" 200.000 từ.
 *
 * Toàn bộ là public domain nên được lưu toàn văn trích đoạn, kèm attribution
 * ghi rõ tác giả, tác phẩm, năm và đường dẫn bản gốc.
 */

/**
 * Số trích đoạn lấy từ mỗi tác phẩm. Sách ngắn ra ít hơn — không ép.
 *
 * Giữ ở mức này vì hai lý do. Ngân sách: `index.json` được bundle thẳng vào app
 * (~980 byte/bài) và có trần 1500 KB; ở mức 6+3 thì riêng nhánh này đẩy index
 * lên 1535 KB. Chất lượng: lấy quá nhiều đoạn từ cùng một cuốn là luyện đi
 * luyện lại một giọng văn, thà trải ra nhiều tác phẩm hơn.
 */
const SHORT_PER_WORK = 5;
const LONG_PER_WORK = 2;

/**
 * Khổ SAT ngắn chính thức là 25–150 từ, nhưng dưới 60 từ thì không đủ chỗ cho
 * một câu hỏi tử tế, nên sàn thực dụng đặt ở 60.
 */
const SHORT_SPEC = { targetWords: 130, minWords: 60, maxWords: 150 } as const;
const LONG_SPEC = { targetWords: 720, minWords: 500, maxWords: 750 } as const;

/** Gutenberg là máy chủ tình nguyện — giữ nhịp thưa, mỗi file cả trăm KB. */
const FETCH_CONCURRENCY = 2;
const FETCH_SPACING_MS = 800;

const pace = createPacer(FETCH_SPACING_MS);

export async function fetchGutenbergSat(ctx: FetchContext): Promise<SourceResult> {
  const errors: string[] = [];
  const works = GUTENBERG_WORKS.slice(0, ctx.limit);

  ctx.log(`  · Project Gutenberg: ${works.length} tác phẩm, bắt đầu tải toàn văn`);

  const perWork = await mapWithConcurrency(works, FETCH_CONCURRENCY, async (work) => {
    try {
      const text = await downloadBook(work.id);
      const paragraphs = toProseParagraphs(stripGutenbergBoilerplate(text));

      if (paragraphs.length === 0) {
        errors.push(`Gutenberg #${work.id} "${work.title}": không tách được đoạn văn xuôi nào`);
        return [];
      }

      // Cắt khổ dài TRƯỚC, rồi cấm khổ ngắn lấy đè lên — nếu không, mỗi bài
      // ngắn sẽ là một mẩu đã nằm sẵn trong bài dài, kho bài trùng nội dung.
      const long = pickExcerpts(paragraphs, { count: LONG_PER_WORK, ...LONG_SPEC });
      const short = pickExcerpts(paragraphs, {
        count: SHORT_PER_WORK,
        ...SHORT_SPEC,
        avoid: long.map((e) => ({ start: e.startIndex, end: e.startIndex + e.paragraphs.length })),
      });

      if (long.length + short.length === 0) {
        errors.push(`Gutenberg #${work.id} "${work.title}": không cắt được trích đoạn nào đúng khổ`);
        return [];
      }

      return [
        ...short.map((e, i) => toRawArticle(work, e, 'sat_short', i + 1)),
        ...long.map((e, i) => toRawArticle(work, e, 'sat_long', i + 1)),
      ];
    } catch (err) {
      errors.push(
        `Gutenberg #${work.id} "${work.title}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
  });

  const articles = perWork.flat();
  ctx.log(
    `  ✓ Project Gutenberg: ${articles.length} passage` +
      ` (${articles.filter((a) => a.passageTier === 'sat_short').length} khổ ngắn,` +
      ` ${articles.filter((a) => a.passageTier === 'sat_long').length} khổ dài)`,
  );

  return { source: 'Project Gutenberg', articles, errors };
}

/**
 * Hai đường tải cùng trỏ về một file. `cache/epub` là đường trực tiếp; một số
 * sách cũ chỉ có ở `ebooks/<id>.txt.utf-8`. Thử lần lượt để một cuốn hỏng đường
 * dẫn không kéo theo cả nguồn.
 */
async function downloadBook(id: number): Promise<string> {
  const urls = [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
  ];

  let lastError: unknown;
  for (const url of urls) {
    try {
      return await fetchText(url, { timeoutMs: 60_000, pace });
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function toRawArticle(
  work: GutenbergWork,
  excerpt: Excerpt,
  tier: Extract<PassageTier, 'sat_short' | 'sat_long'>,
  ordinal: number,
): RawArticle {
  const bookUrl = `https://www.gutenberg.org/ebooks/${work.id}`;
  const era = work.year < 0 ? `${Math.abs(work.year)} TCN` : String(work.year);
  const kind = tier === 'sat_short' ? 'đoạn ngắn' : 'đoạn dài';

  return {
    // Neo theo chỉ số đoạn: chạy lại ingest trên cùng bản sách ra đúng id cũ,
    // nên tiến độ đọc và sổ từ của người học không bị mồ côi.
    externalId: `sat-gutenberg-${work.id}-${tier}-${excerpt.startIndex}`,
    title: `${work.title} — ${tier === 'sat_short' ? 'passage' : 'long passage'} ${ordinal}`,
    sourceName: 'Project Gutenberg',
    sourceUrl: bookUrl,
    topic: work.topic,
    track: 'academic',
    exam: 'sat',
    satTextType: work.satTextType,
    passageTier: tier,
    licenseType: 'public_domain',
    attribution: `Nguồn: ${work.author}, "${work.title}" (${era}), public domain qua Project Gutenberg. ${bookUrl}`,
    summary:
      `Trích đoạn ${SAT_TEXT_TYPE_LABEL[work.satTextType]} khổ SAT (${kind}) từ "${work.title}"` +
      ` của ${work.author}, ${era}.`,
    bodyText: excerpt.paragraphs.join('\n\n'),
  };
}
