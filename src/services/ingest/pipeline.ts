import { checkQuality, type RejectReason } from './quality-gate';
import { analyzeText } from './readability';
import { assignTier, countWords, truncateToTier } from './tiers';
import type { IngestedArticle, RawArticle } from './types';

export type NormalizeResult =
  | { ok: true; article: IngestedArticle }
  | { ok: false; reason: RejectReason };

/** Số từ dùng để chấm độ khó — mẫu cố định nên bài dài không bị lệch điểm. */
const SCORING_SAMPLE_WORDS = 800;

/**
 * Chuẩn hoá bài thô. Thứ tự bắt buộc:
 * gate → chấm mẫu → gán tier → cắt theo tier → chấm lại trên bản đã cắt.
 * Bài Loại B không có body nên bỏ qua toàn bộ phần chấm điểm.
 */
export function normalizeArticle(
  raw: RawArticle,
  commonWords: ReadonlySet<string>,
): NormalizeResult {
  const base = {
    id: stableId(raw.externalId),
    externalId: raw.externalId,
    title: raw.title.trim(),
    slug: slugify(raw.title),
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    topic: raw.topic,
    track: raw.track,
    licenseType: raw.licenseType,
    attribution: raw.attribution ?? null,
    publishedAt: raw.publishedAt ?? null,
    summary: raw.summary?.trim() ?? null,
    thumbnailUrl: raw.thumbnailUrl ?? null,
  };

  // Loại B (headline_only) không được phép có body dù nguồn có lỡ gửi kèm —
  // đây là bất biến bản quyền, không phải tối ưu. CHECK constraint ở DB chỉ
  // bắt khi push lên Supabase; ghi seed JSON cục bộ (thứ app thực sự đọc)
  // không đi qua đó, nên chặn ở đây mới là chốt chặn thật sự.
  if (!raw.bodyText || raw.licenseType === 'headline_only') {
    return {
      ok: true,
      article: {
        ...base,
        passageTier: raw.passageTier ?? 'headline',
        bodyText: null,
        paragraphs: [],
        cefrLevel: null,
        bandRange: null,
        wordCount: null,
        estMinutes: null,
        readabilityScore: null,
        rareWordRatio: null,
      },
    };
  }

  const paragraphs = raw.bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const gate = checkQuality(base.title, paragraphs);
  if (!gate.ok) return { ok: false, reason: gate.reason };

  const sampleCefr = analyzeText(sampleForScoring(paragraphs), commonWords).cefr;
  const tier = raw.passageTier ?? assignTier(countWords(raw.bodyText), sampleCefr);
  if (tier === null) return { ok: false, reason: 'too_short' };

  const kept = truncateToTier(paragraphs, tier);
  const bodyText = kept.join('\n\n');
  const analysis = analyzeText(bodyText, commonWords);

  return {
    ok: true,
    article: {
      ...base,
      passageTier: tier,
      bodyText,
      paragraphs: kept,
      cefrLevel: analysis.cefr,
      bandRange: analysis.bandRange,
      wordCount: analysis.wordCount,
      estMinutes: analysis.estMinutes,
      readabilityScore: analysis.fkGrade,
      rareWordRatio: analysis.rareWordRatio,
    },
  };
}

function sampleForScoring(paragraphs: string[]): string {
  const kept: string[] = [];
  let total = 0;

  for (const paragraph of paragraphs) {
    kept.push(paragraph);
    total += countWords(paragraph);
    if (total >= SCORING_SAMPLE_WORDS) break;
  }

  return kept.join('\n\n');
}

/** Bỏ trùng theo externalId, rồi theo tiêu đề đã chuẩn hoá. */
export function dedupe(articles: IngestedArticle[]): IngestedArticle[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: IngestedArticle[] = [];

  for (const article of articles) {
    const titleKey = article.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (seenIds.has(article.externalId) || seenTitles.has(titleKey)) continue;
    seenIds.add(article.externalId);
    seenTitles.add(titleKey);
    result.push(article);
  }

  return result;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * UUID v4-format sinh xác định từ externalId, để chạy lại ingest không đổi id
 * (quan trọng: tiến độ đọc và sổ từ đang trỏ vào id này).
 */
export function stableId(externalId: string): string {
  const hex = fnv1a128(externalId);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    ((parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

function fnv1a128(input: string): string {
  // Bốn vòng FNV-1a 32-bit với hạt giống khác nhau → 128 bit hex.
  const seeds = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
  return seeds
    .map((seed) => {
      let h = seed >>> 0;
      for (let i = 0; i < input.length; i += 1) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      return h.toString(16).padStart(8, '0');
    })
    .join('');
}
