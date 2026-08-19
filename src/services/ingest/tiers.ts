import { extractWords, splitSentences } from './readability';
import type { CefrLevel, PassageTier } from '@/types/database';

/**
 * Ba tier cộng lại ≈ 2700 từ. Lưu ý: ielts.org KHÔNG công bố tổng số từ của
 * một đề — 2700 là con số hiệu chỉnh trong spec, không phải chuẩn official.
 */
export type { PassageTier };

/** Khổ chữ của một tier — phần cắt bài chỉ cần bấy nhiêu thông tin. */
export type TierSize = {
  tier: PassageTier;
  /**
   * Sàn của tier: vừa là điều kiện để tier thành ứng viên trong `assignTier`,
   * vừa là mức mà `truncateToTier` được phép vượt khổ mục tiêu để đạt cho bằng
   * được (chưa đủ sàn thì thà dài hơn target còn hơn ra một mẩu cụt).
   */
  minWords: number;
  /** Khổ mục tiêu sau khi cắt. */
  targetWords: number;
  /** Trần cứng: một đoạn đơn dài hơn mức này sẽ bị cắt tiếp theo câu. */
  maxWords?: number;
};

export type PassageTierSpec = TierSize & {
  tier: 'p1' | 'p2' | 'p3';
  /** Dải CEFR kỳ vọng, dùng để chọn giữa các ứng viên. */
  cefr: CefrLevel[];
};

/**
 * Xếp tăng dần theo minWords — assignTier dựa vào thứ tự này.
 *
 * `maxWords` = khổ mục tiêu + dung sai. Không khai thì trần mặc định là
 * target*1.5, đủ rộng để lọt một đoạn Wikipedia 1424 từ vào tier p3 (đã gặp
 * thật: bài "Cultural expressions") — đúng kiểu bài mà tier sinh ra để chặn.
 */
export const TIER_SPECS: readonly PassageTierSpec[] = [
  { tier: 'p1', minWords: 650, targetWords: 750, maxWords: 900, cefr: ['A1', 'A2', 'B1'] },
  { tier: 'p2', minWords: 800, targetWords: 900, maxWords: 1050, cefr: ['B2'] },
  { tier: 'p3', minWords: 950, targetWords: 1050, maxWords: 1250, cefr: ['C1', 'C2'] },
];

/**
 * Khổ passage SAT. KHÔNG nằm trong TIER_SPECS vì assignTier không được phép
 * tự suy ra tier SAT từ độ dài — nguồn SAT luôn tự khai tier của mình.
 *
 * - `sat_short`: khổ của SAT số hoá hiện hành, mỗi đoạn 25–150 từ và đi kèm
 *   đúng một câu hỏi. Đây là khổ chuẩn của đề thi hiện tại.
 * - `sat_long`: khổ đoạn 500–750 từ của SAT giấy (trước 2024). Không còn trong
 *   đề thi thật nhưng vẫn là bài luyện đọc dài hơi tốt, nên giữ thành tier riêng
 *   để người học chọn — không trộn lẫn với khổ đang thi.
 */
export const SAT_TIER_SPECS: readonly TierSize[] = [
  // Khổ chính thức của sat_short là 25–150 từ. Sàn ở đây đặt 60 chứ không phải
  // 25: dưới 60 từ thì đoạn không đủ chỗ cho một câu hỏi tử tế. 25 vẫn là
  // ngưỡng của quality gate (xem gateLimitsFor) — hai việc khác nhau.
  { tier: 'sat_short', minWords: 60, targetWords: 130, maxWords: 150 },
  { tier: 'sat_long', minWords: 500, targetWords: 720, maxWords: 750 },
];

export const SHORT_ACADEMIC_MIN_WORDS = 150;

export function countWords(text: string): number {
  return extractWords(text).length;
}

export function tierSpec(tier: PassageTier): TierSize | null {
  return (
    TIER_SPECS.find((s) => s.tier === tier) ?? SAT_TIER_SPECS.find((s) => s.tier === tier) ?? null
  );
}

/**
 * Ngưỡng quality gate suy ra từ tier đã khai. Passage SAT ngắn chỉ có 25–150 từ
 * trong một hai đoạn, nên ngưỡng mặc định (4 đoạn / 150 từ) sẽ loại sạch chúng.
 */
export function gateLimitsFor(tier: PassageTier): { minParagraphs: number; minWords: number } {
  // 25 là sàn chính thức của khổ SAT ngắn. Gate chỉ hỏi "văn bản này có dùng
  // được không", còn việc chọn khổ đẹp là của SAT_TIER_SPECS.
  if (tier === 'sat_short') return { minParagraphs: 1, minWords: 25 };
  if (tier === 'sat_long') return { minParagraphs: 2, minWords: 500 };
  return { minParagraphs: DEFAULT_MIN_PARAGRAPHS, minWords: SHORT_ACADEMIC_MIN_WORDS };
}

/** Bài prose thường có ít nhất bấy nhiêu đoạn; dưới mức đó gần như là stub. */
export const DEFAULT_MIN_PARAGRAPHS = 4;

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

/** Ba mốc khổ chữ dùng cho mọi phép gom đoạn. */
export type SizeBounds = { targetWords: number; minWords: number; maxWords: number };

/**
 * Hạ tier khi bản ĐÃ CẮT ngắn hơn sàn của tier được gán lúc đầu.
 *
 * `assignTier` chấm trên tổng số từ có sẵn, nhưng một bài mà cả mục là một đoạn
 * khổng lồ sẽ bị `truncateToTier` cắt theo câu và có thể dừng khá xa dưới khổ —
 * đã gặp thật: bài "Cultural expressions" gán p3 rồi ra 893 từ. Dán nhãn
 * "Passage 3 (~1050 từ)" lên bài 893 từ là nói sai với người học.
 *
 * Chỉ áp cho tier IELTS do code tự suy ra. Tier SAT luôn do nguồn khai nên
 * không đi qua đây.
 */
export function refineTier(tier: PassageTier, wordCount: number): PassageTier {
  const spec = TIER_SPECS.find((s) => s.tier === tier);
  if (!spec || wordCount >= spec.minWords) return tier;
  return assignTier(wordCount, null) ?? tier;
}

/**
 * Tích lũy các đơn vị (đoạn hoặc câu) cho tới khi đạt khổ mục tiêu,
 * luôn giữ ít nhất đơn vị đầu để passage không rỗng.
 *
 * Xuất ra ngoài vì `excerpt.ts` phải gom theo ĐÚNG luật này: bài do nó cắt sẽ
 * đi qua `truncateToTier` một lần nữa trong pipeline, hai luật lệch nhau là
 * lần cắt thứ hai xén mất phần đầu bài — đã gặp thật, một passage 139 từ bị
 * xén còn 39 từ.
 */
export function accumulate<T>(units: T[], bounds: SizeBounds, countFn: (unit: T) => number): T[] {
  const kept: T[] = [];
  let total = 0;

  for (const unit of units) {
    const n = countFn(unit);

    // Luôn nhận đơn vị đầu, kể cả khi nó đã vượt khổ — không để passage rỗng.
    if (kept.length > 0) {
      if (total + n > bounds.maxWords) break;
      // Chưa đạt sàn thì được vượt khổ mục tiêu, miễn còn dưới trần: thà dài
      // hơn target một chút còn hơn ra một passage cụt.
      if (total + n > bounds.targetWords && total >= bounds.minWords) break;
    }

    kept.push(unit);
    total += n;
    if (total >= bounds.targetWords) break;
  }

  return kept;
}

/** Cắt tại ranh giới đoạn cho tới khi đạt khổ mục tiêu của tier. */
export function truncateToTier(paragraphs: string[], tier: PassageTier): string[] {
  const spec = tierSpec(tier);
  if (!spec) return paragraphs;

  const target = spec.targetWords;
  // Tier SAT khai maxWords vì khổ của nó là ràng buộc cứng chứ không phải mục
  // tiêu mềm: một đoạn 160 từ vẫn dưới target*1.5 nhưng đã vượt trần 150 của
  // sat_short.
  const hardMax = spec.maxWords ?? target * 1.5;
  const kept = accumulate(
    paragraphs,
    { targetWords: target, minWords: spec.minWords, maxWords: hardMax },
    countWords,
  );

  // Wikipedia đôi khi có một đoạn cực dài. Cắt tiếp theo câu để giữ hợp đồng tier.
  if (kept.length === 1 && countWords(kept[0]!) > hardMax) {
    kept[0] = truncateBySentence(kept[0]!, target);
  }

  return kept;
}

export function truncateBySentence(paragraph: string, target: number): string {
  const sentences = splitSentences(paragraph);
  // Cắt theo câu thì không được vượt khổ mục tiêu, nên sàn bằng 0 và trần bằng
  // chính target.
  const kept = accumulate(
    sentences,
    { targetWords: target, minWords: 0, maxWords: target },
    countWords,
  );
  return kept.join(' ');
}
