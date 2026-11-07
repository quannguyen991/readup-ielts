/**
 * Bộ đề luyện theo dạng: mỗi dạng Reading/Listening có 10 set × 20 câu.
 * Nguồn: raw/<dạng>/NN.json (viết tay hoặc sinh bằng luật), gộp bằng
 * `node scripts/ielts/build-drill-sets.mjs`. Test khoá số lượng ở index.test.ts.
 */
import tfng from './generated/reading-tfng.json';
import headings from './generated/reading-matching-headings.json';
import summary from './generated/reading-summary-completion.json';
import info from './generated/reading-matching-info.json';
import mcq from './generated/reading-multiple-choice.json';
import form from './generated/listening-form-completion.json';
import maps from './generated/listening-map-labelling.json';
import lmatch from './generated/listening-matching.json';

export type DrillSetQuestion = {
  prompt: string;
  options?: string[];
  /** Bài đọc riêng của câu này (ghi đè context của set). */
  context?: string;
  answer: string;
  why: string;
  quote?: string;
  /** Chỉ Map labelling: câu này dùng bản đồ thứ mấy trong set. */
  mapIndex?: number;
};

export type DrillMap = { title: string; entrance: string; cells: string[] };

export type DrillSet = {
  id: string;
  title: string;
  topic: string;
  /** Reading: bài đọc. Listening: kịch bản "Tên: lời thoại" mỗi dòng. */
  context?: string;
  options?: string[];
  maps?: DrillMap[];
  questions: DrillSetQuestion[];
};

export const TFNG_OPTIONS = ['TRUE', 'FALSE', 'NOT GIVEN'];

const BY_TYPE: Record<string, DrillSet[]> = {
  'reading-tfng': tfng as DrillSet[],
  'reading-matching-headings': headings as DrillSet[],
  'reading-summary-completion': summary as DrillSet[],
  'reading-matching-info': info as DrillSet[],
  'reading-multiple-choice': mcq as DrillSet[],
  'listening-form-completion': form as DrillSet[],
  'listening-map-labelling': maps as DrillSet[],
  'listening-matching': lmatch as DrillSet[],
};

export function getDrillSets(typeId: string): DrillSet[] {
  return BY_TYPE[typeId] ?? [];
}

export function getDrillSet(typeId: string, setId: string): DrillSet | undefined {
  return getDrillSets(typeId).find((s) => s.id === setId);
}

export function hasDrillSets(typeId: string): boolean {
  return (BY_TYPE[typeId]?.length ?? 0) > 0;
}

/** Phương án của một câu: ghi đè theo câu > của set > bộ cố định của TFNG. */
export function optionsOf(typeId: string, set: DrillSet, q: DrillSetQuestion): string[] | undefined {
  if (typeId === 'reading-tfng') return TFNG_OPTIONS;
  return q.options ?? set.options;
}

const squash = (s: string) => s.toLowerCase().replace(/[£\s,.\-_]/g, '');

/** Chấm một câu: trắc nghiệm so nguyên văn, ô gõ so không phân biệt hoa thường/dấu cách, đáp án phụ cách nhau " | ". */
export function isDrillCorrect(answer: string, given: string): boolean {
  const g = squash(given);
  if (!g) return false;
  return answer.split('|').some((a) => squash(a) === g);
}
