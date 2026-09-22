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

export function starsForAccuracy(correct: number, total: number): 1 | 2 | 3 {
  const accuracy = total > 0 ? correct / total : 0;
  return accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
}

export function xpForBattle(correct: number, total: number, stars: number): number {
  return Math.max(25, correct * 20 + total * 5 + stars * 25);
}
