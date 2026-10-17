/**
 * ĐUA XE TỪ — luật thuần, không phụ thuộc React.
 *
 * Người chơi đua với một xe đối thủ trên đường dài 100 đoạn. Mỗi câu trả lời:
 *   - đúng: xe tăng tốc (12 + 2 × combo, combo tối đa 5), combo + 1;
 *   - sai hoặc hết giờ: trượt bánh, lùi 3 đoạn (không xuống dưới 0), combo về 0.
 * Sau mỗi câu, đối thủ luôn chạy thêm 7–12 đoạn (theo hạt giống, nên cùng hạt thì cùng nhịp).
 * Về đích trước (đủ 100) là thắng ngay; hết câu thì ai xa hơn thắng; bằng nhau thì thua.
 */
import { pointsFor } from '@/services/duel/duel';
import { mulberry32 } from '@/services/questions/rng';

export const RACE_LENGTH = 10;
export const FINISH = 100;
export const BOOST_BASE = 12;
export const SLIP = 3;
export const COMBO_CAP = 5;

export type RaceStatus = 'racing' | 'won' | 'lost';

export type RaceState = {
  /** Số câu đã trả lời. */
  q: number;
  total: number;
  me: number;
  rival: number;
  combo: number;
  bestCombo: number;
  score: number;
  correct: number;
  status: RaceStatus;
};

export type RaceStep = {
  state: RaceState;
  /** Đoạn xe bạn vừa tăng (dương) hoặc trượt lùi (âm). */
  delta: number;
  /** Đối thủ vừa chạy thêm bao nhiêu đoạn. */
  rivalDelta: number;
};

/** Rng của đối thủ theo hạt giống — cùng hạt thì cùng nhịp đua. */
export function rivalRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return mulberry32(h >>> 0);
}

export function createRace(total = RACE_LENGTH): RaceState {
  return { q: 0, total, me: 0, rival: 0, combo: 0, bestCombo: 0, score: 0, correct: 0, status: 'racing' };
}

/** Gain khi trả lời đúng với combo hiện tại. */
export function boostFor(combo: number): number {
  return BOOST_BASE + 2 * Math.min(Math.max(0, combo), COMBO_CAP);
}

/** Chấm một câu. `rng` là của đối thủ (xem `rivalRng`). Không sửa `s`. */
export function resolveRaceAnswer(s: RaceState, ok: boolean, ms: number, rng: () => number): RaceStep {
  if (s.status !== 'racing') return { state: s, delta: 0, rivalDelta: 0 };
  const delta = ok ? boostFor(s.combo) : -SLIP;
  const me = Math.max(0, Math.min(FINISH, s.me + delta));
  const combo = ok ? s.combo + 1 : 0;
  const rivalDelta = 7 + Math.floor(rng() * 6);
  const rival = Math.min(FINISH, s.rival + rivalDelta);
  const q = s.q + 1;
  const score = s.score + (ok ? pointsFor(true, ms) : 0);
  const correct = s.correct + (ok ? 1 : 0);
  let status: RaceStatus = 'racing';
  if (me >= FINISH) status = 'won';
  else if (rival >= FINISH) status = 'lost';
  else if (q >= s.total) status = me > rival ? 'won' : 'lost';
  return {
    state: { q, total: s.total, me, rival, combo, bestCombo: Math.max(s.bestCombo, combo), score, correct, status },
    delta,
    rivalDelta,
  };
}
