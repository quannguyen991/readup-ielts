import { extractWords } from './readability';
import { SHORT_ACADEMIC_MIN_WORDS } from './tiers';

/**
 * Chặn rác trước khi vào kho bài. Cần thiết vì crawl theo category Wikipedia
 * trả về cả trang định hướng, trang danh sách và stub — đã kiểm thật:
 * Category:Climate_change có mục "1st Special Envoy for Drought and climate
 * change of Somalia".
 */
export type RejectReason =
  | 'disambiguation'
  | 'list_article'
  | 'too_few_paragraphs'
  | 'low_prose_ratio'
  | 'non_latin_heavy'
  | 'too_short';

export type QualityVerdict = { ok: true } | { ok: false; reason: RejectReason };

const MIN_PARAGRAPHS = 4;
/** Tỉ lệ ký tự là chữ cái trên tổng ký tự không phải khoảng trắng. */
const MIN_PROSE_RATIO = 0.75;
const MAX_NON_LATIN_RATIO = 0.15;

export function checkQuality(title: string, paragraphs: string[]): QualityVerdict {
  if (/^list of /i.test(title.trim())) return { ok: false, reason: 'list_article' };
  if (/\(disambiguation\)/i.test(title)) return { ok: false, reason: 'disambiguation' };

  const text = paragraphs.join('\n\n');

  // "may refer to" chỉ tính khi nằm ở đầu bài — giữa bài có thể là câu bình thường.
  if (/\bmay refer to\b/i.test(text.slice(0, 400))) {
    return { ok: false, reason: 'disambiguation' };
  }

  if (paragraphs.length < MIN_PARAGRAPHS) return { ok: false, reason: 'too_few_paragraphs' };

  // Cùng ngưỡng tối thiểu với assignTier — dưới đó bài không dùng được dù sao.
  if (extractWords(text).length < SHORT_ACADEMIC_MIN_WORDS) return { ok: false, reason: 'too_short' };

  const nonSpace = text.replace(/\s/g, '').length;
  if (nonSpace > 0) {
    const letters = (text.match(/[A-Za-z]/g) ?? []).length;
    if (letters / nonSpace < MIN_PROSE_RATIO) return { ok: false, reason: 'low_prose_ratio' };

    // Phạm vi U+0020–U+024F là space + Latin + Latin Extended-B.
    // Bất kỳ ký tự nào ngoài phạm vi này được tính là non-Latin.
    const nonLatin = (text.match(/[^ -ɏ\s]/g) ?? []).length;
    if (nonLatin / nonSpace > MAX_NON_LATIN_RATIO) {
      return { ok: false, reason: 'non_latin_heavy' };
    }
  }

  return { ok: true };
}
