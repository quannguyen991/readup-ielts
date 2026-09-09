import type { ModuleTier } from './build';

/**
 * Quy số câu đúng ra thang 200–800 cho phần Reading and Writing.
 *
 * ĐÂY LÀ ƯỚC LƯỢNG, KHÔNG PHẢI BẢNG QUY ĐỔI CHÍNH THỨC — cùng lối nói và cùng
 * cách làm với `services/math/scoring.ts`, để hai phần thi không nói hai giọng.
 * College Board không công bố bảng quy đổi của đề số hoá, và bảng ấy còn đổi
 * theo từng kỳ thi.
 *
 * TRẦN ĐIỂM PHỤ THUỘC MODULE 2 ĐÃ ĐI HƯỚNG NÀO. Ai bị đẩy sang module dễ thì
 * làm đúng hết cũng không chạm được trần — đó là cách đề thích ứng thật hoạt
 * động, và giấu điều đó đi sẽ cho người học một con số đẹp mà sai.
 */

export const RW_SCORE_RANGE: Record<ModuleTier, [number, number]> = {
  easier: [200, 600],
  harder: [400, 800],
};

export function estimateRwScore(correct: number, total: number, tier: ModuleTier): number {
  if (total <= 0) return RW_SCORE_RANGE[tier][0];
  const [low, high] = RW_SCORE_RANGE[tier];
  const ratio = Math.min(1, Math.max(0, correct / total));
  return Math.round((low + (high - low) * ratio) / 10) * 10;
}

/**
 * Điểm tổng 400–1600.
 *
 * Cộng thẳng hai phần, đúng cách SAT làm. Hàm nhận điểm CHỨ KHÔNG nhận số câu
 * đúng: mỗi phần có trần riêng tuỳ module 2 đã đi hướng nào, nên cộng số câu rồi
 * mới quy đổi sẽ ra một con số không có thật.
 */
export function totalSatScore(readingWriting: number, math: number): number {
  return readingWriting + math;
}
