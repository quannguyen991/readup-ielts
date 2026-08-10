import { analyzeText } from './readability';
import type { IngestedArticle, RawArticle } from './types';

/**
 * Chuẩn hoá bài thô: tách đoạn, chấm độ khó, sinh slug và id ổn định.
 * Bài Loại B (headline_only) không có body nên bỏ qua phần chấm điểm.
 */
export function normalizeArticle(
  raw: RawArticle,
  commonWords: ReadonlySet<string>,
): IngestedArticle {
  const paragraphs = raw.bodyText
    ? raw.bodyText
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const analysis = raw.bodyText ? analyzeText(raw.bodyText, commonWords) : null;

  return {
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
    bodyText: raw.bodyText,
    paragraphs,
    thumbnailUrl: raw.thumbnailUrl ?? null,
    cefrLevel: analysis?.cefr ?? null,
    bandRange: analysis?.bandRange ?? null,
    wordCount: analysis?.wordCount ?? null,
    estMinutes: analysis?.estMinutes ?? null,
    readabilityScore: analysis?.fkGrade ?? null,
    rareWordRatio: analysis?.rareWordRatio ?? null,
  };
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
