/**
 * MƯA TỪ VỰNG: game solo. Mỗi lượt là một câu: từ tiếng Anh hiện ở đầu màn, bốn
 * bong bóng nghĩa tiếng Việt rơi cùng lúc. Chạm đúng bong bóng để bắt; chạm sai, hoặc
 * để bong bóng ĐÚNG chạm đáy, là mất một tim. Bong bóng SAI chạm đáy thì không sao.
 *
 * Hàm thuần, không React, không store. Mỗi câu kết thúc đúng MỘT lần (bắt đúng, chạm
 * sai, hoặc đúng rơi tới đáy), và đúng một sự kiện trả lời được sinh ra; màn hình gọi
 * `useGameStore.answer` đúng một lần theo sự kiện đó (xem `answerOf`).
 *
 * Điểm bắt đúng dùng `pointsFor` của Đấu 1–1: 100 + thưởng nhanh (tối đa 50), tính theo
 * tỉ lệ thời gian bong bóng đã rơi so với lúc nó rơi tới đáy.
 */
import { pointsFor, QUESTION_MS } from '../duel/duel';
import { makeChoices, seededRng, shuffled, type StudyWord } from '../vocab/topic-study';

export const RAIN_LENGTH = 10;
export const RAIN_HEARTS = 3;
/** Tâm bong bóng tới mức này (% chiều cao sân) thì chạm đáy. */
export const FLOOR = 92;
/** Tâm bong bóng lúc mới ra: trên mép sân, nên nó trượt vào chứ không bật ra. */
export const SPAWN_Y = -10;
/** Nghỉ giữa hai câu (ms) để kịp thấy kết quả. */
export const PAUSE_MS = 900;
/** Tâm của bốn làn (% chiều rộng sân). Bong bóng một câu rơi vào bốn làn khác nhau. */
export const LANES = [14, 38, 62, 86] as const;

/** Tốc độ rơi (% chiều cao sân mỗi giây). Tăng đều theo số câu đã qua. */
export function speedFor(index: number): number {
  return 9 + 1.5 * Math.max(0, index);
}

/** Thời gian (ms) để một bong bóng tốc độ `speed` (% mỗi giây) rơi từ lúc ra tới đáy. */
export function fallMs(speed: number): number {
  return ((FLOOR - SPAWN_Y) / speed) * 1000;
}

export type RainQuestion = { word: string; options: string[]; correctIndex: number };

export type Drop = {
  id: number;
  /** Tâm bong bóng, % chiều rộng và % chiều cao sân. */
  x: number;
  y: number;
  /** Tốc độ riêng của bong bóng này (% mỗi giây): lệch nhau chút để bong bóng sai có thể chạm đáy trước. */
  speed: number;
  text: string;
  correct: boolean;
  /** Ms kể từ lúc câu này ra. */
  age: number;
  /** Lệch pha cho chuyển động lắc nhẹ (chỉ để vẽ). */
  phase: number;
};

export type RainStatus = 'playing' | 'won' | 'lost';

export type RainGame = {
  status: RainStatus;
  questions: readonly RainQuestion[];
  qIndex: number;
  drops: Drop[];
  /** Câu hiện tại đã có kết quả chưa. Đã có thì chờ hết `pauseLeft` rồi sang câu sau. */
  resolved: boolean;
  pauseLeft: number;
  hearts: number;
  score: number;
  combo: number;
  bestCombo: number;
  correct: number;
  /** Chạm sai + đúng rơi tới đáy. */
  wrong: number;
  /** Trong `wrong`: số lần bong bóng đúng để rơi tới đáy. */
  missed: number;
  answered: number;
  nextId: number;
  seed: number;
  /** Số nhịp đã chạy (để làm khoá cho hiệu ứng). */
  ticks: number;
};

export type RainEvent =
  | { kind: 'caught'; drop: number; text: string; x: number; y: number; points: number; combo: number; word: string }
  | { kind: 'wrongTap'; drop: number; text: string; x: number; y: number; word: string }
  | { kind: 'missed'; drop: number; text: string; x: number; y: number; word: string }
  | { kind: 'passed'; drop: number; text: string; x: number; y: number }
  | { kind: 'next'; qIndex: number }
  | { kind: 'won' }
  | { kind: 'lost' };

export type RainStep = { game: RainGame; events: RainEvent[] };

/** Hạt từ một chuỗi (ví dụ "bộ:lượt"). Cùng chuỗi ra cùng hạt. */
export function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Dựng các câu từ bộ từ: mỗi từ đúng làm đáp án, ba nghĩa khác trong bộ làm nhiễu.
 * Từ nào không đủ bốn nghĩa khác nhau thì bỏ qua. Cùng hạt ra cùng bộ câu.
 */
export function buildRainQuestions(words: readonly StudyWord[], seed: number, length = RAIN_LENGTH): RainQuestion[] {
  const rng = seededRng(seed);
  const usable = words.filter((w) => w.word.trim() && w.meaningVi.trim());
  const out: RainQuestion[] = [];
  for (const target of shuffled(usable, rng)) {
    if (out.length >= length) break;
    const { options, correctIndex } = makeChoices(target, usable, (w) => w.meaningVi, rng);
    if (options.length < 4) continue;
    out.push({ word: target.word, options, correctIndex });
  }
  return out;
}

/** Bốn bong bóng của câu thứ `index`, vào bốn làn xáo trộn theo hạt. */
function spawn(q: RainQuestion, index: number, seed: number, nextId: number): Drop[] {
  const rng = seededRng(seed + index * 7919 + 1);
  const lanes = shuffled([0, 1, 2, 3], rng);
  return q.options.map((text, i) => ({
    id: nextId + i,
    x: LANES[lanes[i]!]! + (rng() - 0.5) * 2.4,
    y: SPAWN_Y,
    speed: speedFor(index) * (0.85 + 0.3 * rng()),
    text,
    correct: i === q.correctIndex,
    age: 0,
    phase: rng() * Math.PI * 2,
  }));
}

export function createRainGame(questions: readonly RainQuestion[], seed = 1): RainGame {
  const drops = questions.length > 0 ? spawn(questions[0]!, 0, seed, 1) : [];
  return {
    status: questions.length > 0 ? 'playing' : 'won',
    questions,
    qIndex: 0,
    drops,
    resolved: questions.length === 0,
    pauseLeft: 0,
    hearts: RAIN_HEARTS,
    score: 0,
    combo: 0,
    bestCombo: 0,
    correct: 0,
    wrong: 0,
    missed: 0,
    answered: 0,
    nextId: 1 + drops.length,
    seed,
    ticks: 0,
  };
}

/** Sự kiện trả lời được → đúng/sai để gọi store; sự kiện khác thì null. */
export function answerOf(ev: RainEvent): { correct: boolean; word: string } | null {
  if (ev.kind === 'caught') return { correct: true, word: ev.word };
  if (ev.kind === 'wrongTap' || ev.kind === 'missed') return { correct: false, word: ev.word };
  return null;
}

/** Câu tiếp theo, hoặc thắng nếu đã hết câu. */
function nextQuestion(g: RainGame): RainStep {
  const next = g.qIndex + 1;
  if (next >= g.questions.length) {
    return { game: { ...g, status: 'won', drops: [], pauseLeft: 0 }, events: [{ kind: 'won' }] };
  }
  const drops = spawn(g.questions[next]!, next, g.seed, g.nextId);
  return {
    game: { ...g, qIndex: next, drops, resolved: false, pauseLeft: 0, nextId: g.nextId + drops.length },
    events: [{ kind: 'next', qIndex: next }],
  };
}

/** Mất một tim cho một câu sai. Hết tim thì thua ngay. */
function loseHeart(g: RainGame, missed: boolean): { game: RainGame; lost: boolean } {
  const hearts = Math.max(0, g.hearts - 1);
  return {
    game: {
      ...g,
      status: hearts === 0 ? 'lost' : 'playing',
      hearts,
      combo: 0,
      wrong: g.wrong + 1,
      missed: g.missed + (missed ? 1 : 0),
      answered: g.answered + 1,
      resolved: true,
      drops: [],
      pauseLeft: PAUSE_MS,
    },
    lost: hearts === 0,
  };
}

/** Một nhịp: bong bóng rơi; đúng bong bóng chạm đáy thì câu kết thúc; hết nghỉ thì sang câu sau. */
export function tickRain(g: RainGame, dtMs: number): RainStep {
  if (g.status !== 'playing') return { game: g, events: [] };
  const dt = Math.max(0, Math.min(dtMs, 100));
  if (g.resolved) {
    const pauseLeft = g.pauseLeft - dt;
    if (pauseLeft > 0) return { game: { ...g, pauseLeft, ticks: g.ticks + 1 }, events: [] };
    const r = nextQuestion(g);
    return { game: { ...r.game, ticks: g.ticks + 1 }, events: r.events };
  }
  const q = g.questions[g.qIndex]!;
  const moved = g.drops.map((d) => ({ ...d, y: d.y + (d.speed * dt) / 1000, age: d.age + dt }));
  const reached = moved.filter((d) => d.y >= FLOOR);
  const rest = moved.filter((d) => d.y < FLOOR);
  const trueOne = reached.find((d) => d.correct);
  if (trueOne) {
    // Bong bóng sai đã chạm đáy cùng nhịp thì bỏ qua: câu này đã thua vì bong bóng đúng.
    const r = loseHeart({ ...g, drops: rest }, true);
    const ev: RainEvent = { kind: 'missed', drop: trueOne.id, text: trueOne.text, x: trueOne.x, y: FLOOR, word: q.word };
    return { game: { ...r.game, ticks: g.ticks + 1 }, events: [ev, ...(r.lost ? [{ kind: 'lost' } as RainEvent] : [])] };
  }
  const passed: RainEvent[] = reached.map((d) => ({ kind: 'passed', drop: d.id, text: d.text, x: d.x, y: FLOOR }));
  return { game: { ...g, drops: rest, ticks: g.ticks + 1 }, events: passed };
}

/** Chạm một bong bóng. Chỉ có tác dụng khi câu đang mở. */
export function tapRain(g: RainGame, dropId: number): RainStep {
  if (g.status !== 'playing' || g.resolved) return { game: g, events: [] };
  const d = g.drops.find((x) => x.id === dropId);
  if (!d) return { game: g, events: [] };
  const q = g.questions[g.qIndex]!;
  if (d.correct) {
    const frac = Math.min(1, d.age / fallMs(d.speed));
    const points = pointsFor(true, Math.round(frac * QUESTION_MS));
    const combo = g.combo + 1;
    return {
      game: {
        ...g,
        score: g.score + points,
        combo,
        bestCombo: Math.max(g.bestCombo, combo),
        correct: g.correct + 1,
        answered: g.answered + 1,
        resolved: true,
        drops: [],
        pauseLeft: PAUSE_MS,
      },
      events: [{ kind: 'caught', drop: d.id, text: d.text, x: d.x, y: d.y, points, combo, word: q.word }],
    };
  }
  const r = loseHeart(g, false);
  const ev: RainEvent = { kind: 'wrongTap', drop: d.id, text: d.text, x: d.x, y: d.y, word: q.word };
  return { game: r.game, events: [ev, ...(r.lost ? [{ kind: 'lost' } as RainEvent] : [])] };
}
