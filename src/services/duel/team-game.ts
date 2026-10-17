export type TeamPower = 'comet' | 'double' | 'eclipse' | 'stardust';

export type TeamScoreResult = {
  scores: number[];
  earned: number;
  bonus: number;
  message: string;
};

/** Chấm một lượt trên màn hình chung; bonus chỉ được áp dụng khi đội trả lời đúng. */
export function scoreTeamAnswer(
  scores: readonly number[],
  activeTeam: number,
  correct: boolean,
  power: TeamPower | null,
): TeamScoreResult {
  const next = [...scores];
  if (!Number.isInteger(activeTeam) || activeTeam < 0 || activeTeam >= next.length) {
    return { scores: next, earned: 0, bonus: 0, message: '' };
  }
  if (!correct) return { scores: next, earned: 0, bonus: 0, message: 'Sai lượt này — giữ nguyên điểm.' };

  const base = 100;
  let bonus = 0;
  let message = 'Đúng! +100 điểm.';
  if (power === 'comet') {
    bonus = 40;
    message = 'Sao chổi! +40 điểm thưởng.';
  } else if (power === 'double') {
    bonus = base;
    message = 'Tinh thể nhân đôi! +100 điểm thưởng.';
  } else if (power === 'eclipse') {
    let rivalIndex = -1;
    for (let index = 0; index < next.length; index += 1) {
      if (index !== activeTeam && (rivalIndex < 0 || next[index]! > next[rivalIndex]!)) rivalIndex = index;
    }
    if (rivalIndex >= 0) {
      const stolen = Math.min(25, next[rivalIndex]!);
      next[rivalIndex] = Math.max(0, next[rivalIndex]! - stolen);
      bonus = stolen;
      message = stolen ? `Nhật thực! Đổi ${stolen} điểm từ đội đang dẫn.` : 'Nhật thực! +100 điểm.';
    } else message = 'Nhật thực! +100 điểm.';
  } else if (power === 'stardust') {
    for (let i = 0; i < next.length; i += 1) if (i !== activeTeam) next[i] = (next[i] ?? 0) + 10;
    message = 'Bụi sao! Đội bạn +100, các đội khác +10 điểm.';
  }
  next[activeTeam] = (next[activeTeam] ?? 0) + base + bonus;
  return { scores: next, earned: base + bonus, bonus, message };
}

export function teamWinners(scores: readonly number[]): number[] {
  if (scores.length === 0) return [];
  const highest = Math.max(...scores);
  return scores.flatMap((score, index) => score === highest ? [index] : []);
}
