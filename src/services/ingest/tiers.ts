import { extractWords, splitSentences } from './readability';
import type { CefrLevel, PassageTier } from '@/types/database';

/**
 * Ba tier cộng lại ≈ 2700 từ. Lưu ý: ielts.org KHÔNG công bố tổng số từ của
 * một đề — 2700 là con số hiệu chỉnh trong spec, không phải chuẩn official.
 */
export type { PassageTier };

export type PassageTierSpec = {
  tier: 'p1' | 'p2' | 'p3';
  /** Số từ tối thiểu để tier này thành ứng viên. */
  minWords: number;
  /** Khổ mục tiêu sau khi cắt. */
  targetWords: number;
  /** Dải CEFR kỳ vọng, dùng để chọn giữa các ứng viên. */
  cefr: CefrLevel[];
};

/** Xếp tăng dần theo minWords — assignTier dựa vào thứ tự này. */
export const TIER_SPECS: readonly PassageTierSpec[] = [
  { tier: 'p1', minWords: 650, targetWords: 750, cefr: ['A1', 'A2', 'B1'] },
  { tier: 'p2', minWords: 800, targetWords: 900, cefr: ['B2'] },
  { tier: 'p3', minWords: 950, targetWords: 1050, cefr: ['C1', 'C2'] },
];

export const SHORT_ACADEMIC_MIN_WORDS = 150;

export function countWords(text: string): number {
  return extractWords(text).length;
}

export function tierSpec(tier: PassageTier): PassageTierSpec | null {
  return TIER_SPECS.find((s) => s.tier === tier) ?? null;
}

/**
 * Độ dài lọc ra tier khả thi, độ khó chọn trong số đó.
 * Trả null nghĩa là bài quá ngắn, nên loại bỏ hẳn.
 */
export function assignTier(availableWords: number, cefr: CefrLevel | null): PassageTier | null {
  if (availableWords < SHORT_ACADEMIC_MIN_WORDS) return null;

  const candidates = TIER_SPECS.filter((s) => availableWords >= s.minWords);
  if (candidates.length === 0) return 'short_academic';

  if (cefr) {
    const matched = candidates.find((s) => s.cefr.includes(cefr));
    if (matched) return matched.tier;
  }

  return candidates[candidates.length - 1]!.tier;
}

/**
 * Tích lũy các đơn vị (đoạn hoặc câu) cho tới khi đạt khổ mục tiêu,
 * luôn giữ ít nhất đơn vị đầu để passage không rỗng.
 */
function accumulate<T>(units: T[], target: number, countFn: (unit: T) => number): T[] {
  const kept: T[] = [];
  let total = 0;

  for (const unit of units) {
    const n = countFn(unit);
    // Luôn nhận đơn vị đầu, kể cả khi nó đã vượt khổ — không để passage rỗng.
    if (kept.length > 0 && total + n > target) break;
    kept.push(unit);
    total += n;
    if (total >= target) break;
  }

  return kept;
}

/** Cắt tại ranh giới đoạn cho tới khi đạt khổ mục tiêu của tier. */
export function truncateToTier(paragraphs: string[], tier: PassageTier): string[] {
  const spec = tierSpec(tier);
  if (!spec) return paragraphs;

  const target = spec.targetWords;
  const kept = accumulate(paragraphs, target, countWords);

  // Wikipedia đôi khi có một đoạn cực dài. Cắt tiếp theo câu để giữ hợp đồng tier.
  if (kept.length === 1 && countWords(kept[0]!) > target * 1.5) {
    kept[0] = truncateBySentence(kept[0]!, target);
  }

  return kept;
}

function truncateBySentence(paragraph: string, target: number): string {
  const sentences = splitSentences(paragraph);
  const kept = accumulate(sentences, target, countWords);
  return kept.join(' ');
}
