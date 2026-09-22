export type CombatOutcome = {
  correct: boolean;
  damage: number;
  enemyDamage: number;
  combo: number;
  playerHp: number;
  enemyHp: number;
  defeated: boolean;
};

export function resolveCombatAnswer(input: {
  isCorrect: boolean;
  combo: number;
  playerHp: number;
  enemyHp: number;
  enemyMaxHp: number;
}): CombatOutcome {
  const nextCombo = input.isCorrect ? Math.min(input.combo + 1, 5) : 0;
  const damage = input.isCorrect ? 18 + nextCombo * 4 : 0;
  const enemyDamage = input.isCorrect ? 0 : 7;
  const enemyHp = Math.max(0, input.enemyHp - damage);
  const playerHp = Math.max(0, input.playerHp - enemyDamage);
  return {
    correct: input.isCorrect,
    damage,
    enemyDamage,
    combo: nextCombo,
    playerHp,
    enemyHp,
    defeated: enemyHp <= 0,
  };
}

/**
 * Tỉ lệ đúng tối thiểu để VƯỢT một node (được 1 sao, mở node kế tiếp).
 *
 * Trước đây không có ngưỡng: đúng 0/8 vẫn 1 sao, vẫn "Chiến thắng nhờ kiến
 * thức", vẫn mở node mới — mà máu mình mất 7 mỗi câu sai nên cũng không bao giờ
 * cạn. Bấm bừa là qua hết ba map. Một trò chơi học tập mà không thua được thì
 * sao và phần thưởng không còn nói gì về việc đã học.
 *
 * 50% là mức cao gấp đôi đoán mò trên 4 phương án. Đổi độ khó thì đổi ở đây.
 */
export const PASS_ACCURACY = 0.5;

export function starsForAccuracy(correct: number, total: number): 0 | 1 | 2 | 3 {
  const accuracy = total > 0 ? correct / total : 0;
  return accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy >= PASS_ACCURACY ? 1 : 0;
}

export function xpForBattle(correct: number, total: number, stars: number): number {
  return Math.max(25, correct * 20 + total * 5 + stars * 25);
}
