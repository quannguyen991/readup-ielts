/**
 * ĐẤU CHIẾU LỚP (kiểu Kahoot) — luật thuần, không phụ thuộc React hay kênh mạng.
 *
 * Khác phòng đấu 1–1 (`duel.ts`, ai làm theo nhịp nấy), ở đây chủ phòng điều khiển
 * nhịp: mọi học sinh cùng nhìn một câu, cùng đếm ngược, rồi cùng xem đáp án.
 *
 * Hai luật chơi dùng chung một khung:
 *   - `show`: chỉ tính điểm; cuối ván xếp hạng theo điểm.
 *   - `survival`: sai hoặc quá giờ mất một mạng (3 mạng). Người cuối cùng còn mạng thắng.
 *     Nếu CẢ LỚP cùng sai một câu thì không ai mất mạng — để một câu khó không
 *     loại sạch cả phòng trong một lượt.
 *
 * Chủ phòng là nguồn sự thật: máy chủ phòng tính kết quả rồi phát `ShowState`
 * cho mọi người. Học sinh và màn chiếu chỉ vẽ lại trạng thái đó.
 */
import { pointsFor, QUESTION_MS } from './duel';

export type ShowMode = 'show' | 'survival';
export type ShowPhase = 'lobby' | 'counting' | 'question' | 'reveal' | 'done';

export const SHOW_QUESTIONS = 10;
export const SHOW_LIMIT_MS = QUESTION_MS;
export const SURVIVAL_LIVES = 3;
/** Thời gian đếm ngược trước câu đầu tiên. */
export const COUNTDOWN_MS = 3000;

export type ShowReveal = {
  correctIndex: number;
  /** Số học sinh chọn mỗi phương án (hết giờ thì không tính vào đâu cả). */
  counts: number[];
  /** Ai trả lời đúng câu này. */
  correct: string[];
  /** Ai bị loại ở câu này (chỉ có ở `survival`). */
  eliminated: string[];
};

export type ShowState = {
  phase: ShowPhase;
  mode: ShowMode;
  deck: string;
  seed: string;
  /** Vị trí câu hiện tại, bắt đầu từ 0; -1 khi chưa có câu nào. */
  index: number;
  total: number;
  /** Mốc bắt đầu câu hiện tại (epoch ms) và giới hạn thời gian của câu. */
  at: number;
  limit: number;
  /** Danh sách người được chơi, khoá lúc bắt đầu ván. */
  roster: string[];
  names: Record<string, string>;
  lives: Record<string, number>;
  scores: Record<string, number>;
  /** Những người đã trả lời câu hiện tại. */
  answered: string[];
  reveal: ShowReveal | null;
  /** Thứ hạng khi kết thúc, người đứng đầu ở đầu mảng. */
  ranking: string[] | null;
};

export function emptyShowState(mode: ShowMode, deck: string): ShowState {
  return {
    phase: 'lobby',
    mode,
    deck,
    seed: '',
    index: -1,
    total: SHOW_QUESTIONS,
    at: 0,
    limit: SHOW_LIMIT_MS,
    roster: [],
    names: {},
    lives: {},
    scores: {},
    answered: [],
    reveal: null,
    ranking: null,
  };
}

/** Một lần trả lời của học sinh; `choice` = -1 nghĩa là hết giờ hoặc bỏ qua. */
export type ShowAnswer = { id: string; index: number; choice: number; ms: number };

/**
 * Chấm một câu khi chủ phòng chốt đáp án. Trả về bảng mới (điểm, mạng, ai bị loại)
 * mà KHÔNG sửa đầu vào.
 */
export function resolveRound(
  state: Pick<ShowState, 'mode' | 'roster' | 'lives' | 'scores'>,
  answers: ShowAnswer[],
  correctIndex: number,
): { scores: Record<string, number>; lives: Record<string, number>; counts: number[]; correct: string[]; eliminated: string[] } {
  const byId = new Map(answers.map((a) => [a.id, a]));
  const counts = [0, 0, 0, 0];
  const correct: string[] = [];
  const scores = { ...state.scores };
  for (const id of state.roster) {
    const a = byId.get(id);
    const ok = !!a && a.choice === correctIndex && a.ms <= SHOW_LIMIT_MS;
    if (a && a.choice >= 0 && a.choice < 4) counts[a.choice] = (counts[a.choice] ?? 0) + 1;
    if (ok) correct.push(id);
    scores[id] = (scores[id] ?? 0) + (a ? pointsFor(ok, a.ms) : 0);
  }

  const lives = { ...state.lives };
  const eliminated: string[] = [];
  if (state.mode === 'survival') {
    const alive = state.roster.filter((id) => (lives[id] ?? 0) > 0);
    const wrong = alive.filter((id) => !correct.includes(id));
    // Cả lớp cùng sai thì không ai mất mạng.
    if (wrong.length > 0 && wrong.length < alive.length) {
      for (const id of wrong) {
        lives[id] = Math.max(0, (lives[id] ?? 0) - 1);
        if (lives[id] === 0) eliminated.push(id);
      }
    }
  }
  return { scores, lives, counts, correct, eliminated };
}

/** Ván có kết thúc chưa: hết câu, hoặc (survival) chỉ còn một người có mạng. */
export function isOver(state: Pick<ShowState, 'mode' | 'roster' | 'lives' | 'index' | 'total'>): boolean {
  if (state.index + 1 >= state.total) return true;
  if (state.mode === 'survival' && state.roster.length >= 2) {
    const alive = state.roster.filter((id) => (state.lives[id] ?? 0) > 0);
    return alive.length <= 1;
  }
  return false;
}

/**
 * Thứ hạng cuối ván. Survival: ai còn mạng đứng trên, rồi tới mạng còn lại, rồi điểm.
 * Show: điểm cao đứng trên.
 */
export function rankingOf(state: Pick<ShowState, 'mode' | 'roster' | 'lives' | 'scores'>): string[] {
  const ids = [...state.roster];
  return ids.sort((a, b) => {
    if (state.mode === 'survival') {
      const la = state.lives[a] ?? 0;
      const lb = state.lives[b] ?? 0;
      if ((la > 0) !== (lb > 0)) return la > 0 ? -1 : 1;
      if (la !== lb) return lb - la;
    }
    return (state.scores[b] ?? 0) - (state.scores[a] ?? 0);
  });
}
