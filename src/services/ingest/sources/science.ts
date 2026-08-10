import { fetchJson, fetchText } from '../http';
import { decode, stripHtml } from '../rss';
import type { FetchContext, RawArticle, SourceResult } from '../types';

/**
 * PLOS ONE (CC BY) và arXiv abstracts — Loại A, được lưu toàn văn phần
 * abstract/tóm tắt mà API công khai trả về.
 */

type PlosResponse = {
  response?: {
    docs?: Array<{
      id?: string;
      title_display?: string;
      abstract?: string[];
      publication_date?: string;
      subject?: string[];
    }>;
  };
};

const PLOS_QUERIES: Array<{ topic: string; query: string }> = [
  { topic: 'environment', query: 'subject:"Climate change"' },
  { topic: 'health', query: 'subject:"Public health"' },
  { topic: 'psychology', query: 'subject:"Cognitive psychology"' },
  { topic: 'science', query: 'subject:"Ecology"' },
];

export async function fetchPlos(ctx: FetchContext): Promise<SourceResult> {
  const articles: RawArticle[] = [];
  const errors: string[] = [];

  for (const { topic, query } of PLOS_QUERIES) {
    if (articles.length >= ctx.limit) break;

    try {
      const url =
        'https://api.plos.org/search?' +
        new URLSearchParams({
          q: `${query} AND doc_type:full`,
          fl: 'id,title_display,abstract,publication_date,subject',
          wt: 'json',
          rows: '4',
          sort: 'publication_date desc',
        }).toString();

      const json = await fetchJson<PlosResponse>(url, { timeoutMs: 25_000 });

      for (const doc of json.response?.docs ?? []) {
        if (articles.length >= ctx.limit) break;

        const abstract = (doc.abstract ?? []).join('\n\n').trim();
        const title = doc.title_display ? stripHtml(doc.title_display) : null;
        if (!abstract || !title || countWords(abstract) < 150) continue;

        articles.push({
          externalId: `plos-${doc.id}`,
          title,
          sourceName: 'PLOS ONE',
          sourceUrl: `https://journals.plos.org/plosone/article?id=${doc.id}`,
          topic,
          track: 'academic',
          licenseType: 'cc_by',
          attribution: `Nguồn: PLOS ONE, giấy phép CC BY 4.0. DOI ${doc.id}`,
          ...(doc.publication_date ? { publishedAt: doc.publication_date } : {}),
          summary: abstract.slice(0, 300),
          bodyText: stripHtml(abstract),
        });
      }

      ctx.log(`  ✓ PLOS ONE (${topic})`);
    } catch (err) {
      errors.push(`PLOS ONE ${topic}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { source: 'PLOS ONE', articles, errors };
}

const ARXIV_QUERIES: Array<{ topic: string; category: string }> = [
  { topic: 'technology', category: 'cs.AI' },
  { topic: 'science', category: 'physics.ao-ph' },
  { topic: 'health', category: 'q-bio.NC' },
];

export async function fetchArxiv(ctx: FetchContext): Promise<SourceResult> {
  const articles: RawArticle[] = [];
  const errors: string[] = [];

  for (const { topic, category } of ARXIV_QUERIES) {
    if (articles.length >= ctx.limit) break;

    try {
      const url =
        'http://export.arxiv.org/api/query?' +
        new URLSearchParams({
          search_query: `cat:${category}`,
          start: '0',
          max_results: '4',
          sortBy: 'submittedDate',
          sortOrder: 'descending',
        }).toString();

      const xml = await fetchText(url, { timeoutMs: 25_000 });

      for (const entry of xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []) {
        if (articles.length >= ctx.limit) break;

        const id = tag(entry, 'id');
        const title = tag(entry, 'title');
        const summary = tag(entry, 'summary');
        const published = tag(entry, 'published');
        if (!id || !title || !summary || countWords(summary) < 130) continue;

        articles.push({
          externalId: `arxiv-${id.split('/').pop()}`,
          title: decode(title).replace(/\s+/g, ' ').trim(),
          sourceName: 'arXiv',
          sourceUrl: id,
          topic,
          track: 'academic',
          licenseType: 'cc_by',
          attribution: `Nguồn: arXiv abstract, ${id}`,
          ...(published ? { publishedAt: published } : {}),
          summary: summary.slice(0, 300),
          bodyText: decode(summary).replace(/\s+/g, ' ').trim(),
        });
      }

      ctx.log(`  ✓ arXiv (${category})`);
    } catch (err) {
      errors.push(`arXiv ${category}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { source: 'arXiv', articles, errors };
}

function tag(block: string, name: string): string | null {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match?.[1]?.trim() ?? null;
}

function countWords(text: string): number {
  return (text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
}
