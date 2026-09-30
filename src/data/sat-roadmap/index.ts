import { getTemplate } from '@/services/math/templates';
import { generateMathItem } from '@/services/math/generator';
import type { MathItem } from '@/lib/math/types';
import { CHAPTERS_A } from './chapters-a';
import { CHAPTERS_B } from './chapters-b';
import type { Level, RoadChapter } from './types';

export * from './types';

/** 27 chương, theo thứ tự chủ đề của giáo trình. */
export const ROAD_CHAPTERS: readonly RoadChapter[] = [...CHAPTERS_A, ...CHAPTERS_B];

export function chapterById(id: string | undefined): RoadChapter | undefined {
  return ROAD_CHAPTERS.find((c) => c.id === id);
}

/** Số câu mỗi lượt quiz của một mức. */
export const QUIZ_SIZE = 10;
/** Đạt từ tỉ lệ này thì coi như qua mức (gợi ý sang mức kế). */
export const PASS_RATIO = 0.8;

/** Các template đang có thật trong danh bạ (bỏ qua slug chưa viết xong). */
export function liveTemplates(chapter: RoadChapter, level: Level): string[] {
  return chapter.templates[level].filter((s) => !!getTemplate(s));
}

/**
 * Một lượt quiz 10 câu cho (chương, mức, lượt thứ `round`): xoay vòng các
 * template của mức đó, hạt theo lượt — làm lại lượt cũ thì gặp đúng câu cũ,
 * lượt mới là câu mới (mỗi template sinh vô hạn câu).
 */
export function buildLevelQuiz(chapter: RoadChapter, level: Level, round: number): MathItem[] {
  const slugs = liveTemplates(chapter, level);
  if (slugs.length === 0) return [];
  return Array.from({ length: QUIZ_SIZE }, (_, i) => generateMathItem(slugs[i % slugs.length]!, `road:${chapter.id}:${level}:r${round}:${i}`));
}

/** Bộ bài bám sách có chạy được không (mọi slug đều có template thật). */
export function bookSetReady(chapter: RoadChapter): boolean {
  const set = chapter.bookSet ?? [];
  return set.length > 0 && set.every((b) => !!getTemplate(b.slug));
}

/**
 * Bộ bài bám sách: đúng số bài và thứ tự bài tập cuối chương của giáo trình,
 * mỗi câu cùng dạng với bài tương ứng. Hạt theo lượt — lượt mới là số mới.
 */
export function buildBookSet(chapter: RoadChapter, round: number): MathItem[] {
  if (!bookSetReady(chapter)) return [];
  return chapter.bookSet!.map((b, i) => generateMathItem(b.slug, `road:${chapter.id}:book:r${round}:${i}`));
}

/** Số câu của bộ "Luyện thêm" mỗi chương. */
export const EXTRA_SIZE = 20;
/** Chia mức của bộ Luyện thêm: 7 dễ → 7 trung bình → 6 khó. */
const EXTRA_SPLIT: Array<[Level, number]> = [
  ['easy', 7],
  ['medium', 7],
  ['hard', 6],
];

/**
 * LUYỆN THÊM 20 CÂU ngoài bộ bài theo sách (người dùng yêu cầu 30/09/2026):
 * lấy template của cả ba mức, ưu tiên những dạng KHÔNG nằm trong bộ bài theo
 * sách (còn ít hơn 2 dạng như vậy thì dùng cả mức), xếp dễ → khó. Mỗi lượt
 * xoay điểm bắt đầu và đổi hạt, nên là 20 câu mới.
 */
export function buildExtraSet(chapter: RoadChapter, round: number): MathItem[] {
  const inBook = new Set((chapter.bookSet ?? []).map((b) => b.slug));
  const out: MathItem[] = [];
  let i = 0;
  for (const [lv, n] of EXTRA_SPLIT) {
    const all = liveTemplates(chapter, lv);
    const outside = all.filter((s) => !inBook.has(s));
    const pool = outside.length >= 2 ? outside : all;
    if (pool.length === 0) continue;
    for (let k = 0; k < n; k++, i++) out.push(generateMathItem(pool[(k + round) % pool.length]!, `road:${chapter.id}:extra:r${round}:${i}`));
  }
  return out;
}
