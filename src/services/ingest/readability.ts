import type { CefrLevel } from '@/types/database';

/**
 * Chấm độ khó bài đọc: Flesch-Kincaid Grade Level + tỉ lệ từ hiếm,
 * quy ra CEFR và band range IELTS.
 */

export type ReadabilityResult = {
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  /** Flesch-Kincaid Grade Level (số lớp học Mỹ). */
  fkGrade: number;
  /** Flesch Reading Ease (0–100, càng cao càng dễ). */
  readingEase: number;
  /** Tỉ lệ từ nằm ngoài 5.000 từ phổ biến nhất. */
  rareWordRatio: number;
  cefr: CefrLevel;
  bandRange: string;
  estMinutes: number;
};

/** Ngưỡng 5.000 từ đầu trong danh sách tần suất = "từ phổ biến". */
const COMMON_WORD_CUTOFF = 5000;

export function analyzeText(text: string, commonWords: ReadonlySet<string>): ReadabilityResult {
  const sentences = splitSentences(text);
  const words = extractWords(text);

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;

  const fkGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  const readingEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;

  const contentWords = words.filter((w) => w.length > 2);
  const rareCount = contentWords.filter((w) => !commonWords.has(w)).length;
  const rareWordRatio = contentWords.length > 0 ? rareCount / contentWords.length : 0;

  const cefr = toCefr(fkGrade, rareWordRatio);

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    fkGrade: round(fkGrade, 2),
    readingEase: round(readingEase, 2),
    rareWordRatio: round(rareWordRatio, 4),
    cefr,
    bandRange: BAND_BY_CEFR[cefr],
    // Người học IELTS đọc bài học thuật ở khoảng 180 wpm.
    estMinutes: Math.max(1, Math.round(wordCount / 180)),
  };
}

/**
 * Kết hợp hai tín hiệu: độ phức tạp câu (FK) và mật độ từ hiếm.
 * Điểm tổng hợp rồi cắt ngưỡng — bài câu ngắn nhưng đầy thuật ngữ vẫn bị
 * xếp khó, đúng với cảm nhận thực tế khi đọc.
 */
function toCefr(fkGrade: number, rareWordRatio: number): CefrLevel {
  const score = fkGrade + rareWordRatio * 12;

  // Ngưỡng hiệu chỉnh trên chính kho bài đã cào (trung vị FK 14.5, từ hiếm 26%)
  // sao cho bài học thuật cỡ IELTS Academic rơi vào B2–C1, không dồn hết vào C2.
  if (score < 7) return 'A1';
  if (score < 10) return 'A2';
  if (score < 13) return 'B1';
  if (score < 16.5) return 'B2';
  if (score < 20.5) return 'C1';
  return 'C2';
}

const BAND_BY_CEFR: Record<CefrLevel, string> = {
  A1: 'Band 3–4',
  A2: 'Band 4–5',
  B1: 'Band 5–6',
  B2: 'Band 6–7',
  C1: 'Band 7–8',
  C2: 'Band 8–9',
};

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function extractWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z'-]*/g) ?? []).map((w) => w.replace(/^'+|'+$/g, ''));
}

/** Đếm âm tiết theo heuristic — đủ chính xác cho công thức Flesch-Kincaid. */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;

  const trimmed = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');

  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

export { COMMON_WORD_CUTOFF };

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
