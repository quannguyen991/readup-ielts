/**
 * ĐẤU 1–1 — hai người cùng làm 10 câu trắc nghiệm từ vựng, thời gian thực.
 *
 * Hai máy KHÔNG gửi câu hỏi cho nhau: chủ phòng chỉ phát một HẠT (seed) và mã
 * bộ từ, mỗi máy tự dựng đúng cùng 10 câu từ hạt đó (hàm thuần dưới đây). Qua
 * kênh chỉ đi những gói nhỏ: "tôi trả lời câu 3, đúng, 128 điểm".
 *
 * Điểm: đúng được 100 + thưởng nhanh (tối đa 50, giảm dần về 0 ở giây thứ 10);
 * sai hoặc hết giờ được 0. Bằng điểm thì ai tổng thời gian ít hơn thắng.
 */
import { makeChoices, seededRng, shuffled, type StudyWord } from '@/services/vocab/topic-study';

export const DUEL_LENGTH = 10;
export const QUESTION_MS = 10_000;

/** Bỏ các ký tự dễ nhìn nhầm (0/O, 1/I/L). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeRoomCode(rand: () => number = Math.random): string {
  return Array.from({ length: 5 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join('');
}

export function isRoomCode(code: string): boolean {
  return new RegExp(`^[${ALPHABET}]{5}$`).test(code);
}

export type DuelQuestion = { word: StudyWord; enToVi: boolean; options: string[]; correctIndex: number };

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Cùng hạt + cùng bộ từ → cùng 10 câu, cùng thứ tự phương án, ở mọi máy. */
export function buildDuel(words: readonly StudyWord[], seed: string): DuelQuestion[] {
  const rand = seededRng(hash(seed));
  return shuffled(words, rand)
    .slice(0, Math.min(DUEL_LENGTH, words.length))
    .map((word, i) => {
      const enToVi = i % 2 === 0;
      const { options, correctIndex } = makeChoices(word, words, (w) => (enToVi ? w.meaningVi : w.word), rand);
      return { word, enToVi, options, correctIndex };
    });
}

export function pointsFor(correct: boolean, ms: number): number {
  if (!correct || ms > QUESTION_MS) return 0;
  return 100 + Math.round(50 * Math.max(0, 1 - ms / QUESTION_MS));
}

export type PlayerTally = { score: number; ms: number; answered: number; correct: number };

export function emptyTally(): PlayerTally {
  return { score: 0, ms: 0, answered: 0, correct: 0 };
}

export function addAnswer(t: PlayerTally, correct: boolean, ms: number): PlayerTally {
  return {
    score: t.score + pointsFor(correct, ms),
    ms: t.ms + Math.min(ms, QUESTION_MS),
    answered: t.answered + 1,
    correct: t.correct + (correct ? 1 : 0),
  };
}

/** 1: a thắng, -1: b thắng, 0: hoà tuyệt đối. */
export function compareTally(a: PlayerTally, b: PlayerTally): 1 | -1 | 0 {
  if (a.score !== b.score) return a.score > b.score ? 1 : -1;
  if (a.ms !== b.ms) return a.ms < b.ms ? 1 : -1;
  return 0;
}

/** Cách nhau không quá chừng này điểm (dưới một câu đúng) thì gọi là "sát nút". */
export const CLOSE_GAP = 50;

/** Dòng tiêu đề màn kết quả, nhìn từ phía `mine`. */
export function verdictTitle(mine: PlayerTally, theirs: PlayerTally | null): string {
  if (!theirs) return 'Xong!';
  const v = compareTally(mine, theirs);
  if (v === 0) return 'Hoà!';
  const close = Math.abs(mine.score - theirs.score) <= CLOSE_GAP;
  if (v === 1) return close ? 'Thắng sát nút! 🏆' : 'Bạn thắng! 🏆';
  return close ? 'Thua sát nút!' : 'Thua rồi — phục thù nhé!';
}
