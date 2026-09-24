/**
 * LUẬT GAME KHI HỌC — hàm thuần, không chạm React hay store.
 *
 * Mỗi câu trả lời ở bất kỳ màn học nào (từ vựng, SAT Math, SAT Verbal, đọc theo…)
 * là một lượt đánh (ý từ game học của FreeCareerPath: "trả lời đúng để gây sát
 * thương cho quái"):
 *   - đúng: cộng XP, tăng combo, chém quái; combo đủ 5 thì CHÍ MẠNG (gấp đôi);
 *   - sai: combo về 0, quái đánh lại mất một tim (có Khiên thì chặn được).
 * Hạ quái thì được thưởng thêm XP và có thể rơi đồ; quái sau khoẻ hơn. Hết tim
 * thì bị đánh lui (quái hồi máu, tim đầy lại) — KHÔNG bao giờ chặn việc học.
 *
 * XP ở đây là điểm GAME (lên cấp, nhiệm vụ, huy hiệu), tách khỏi điểm xếp hạng ở
 * `gamification/points.ts` vốn tính từ thời gian học có trần ngày.
 */

export const XP_CORRECT = 10;
export const MAX_HEARTS = 5;
/** Cứ mỗi bội số của số này trong combo là một đòn chí mạng. */
export const CRIT_EVERY = 5;

export type ItemKind = 'potion' | 'shield' | 'double' | 'hint';

export const ITEMS: Record<ItemKind, { name: string; detail: string; glyph: string }> = {
  potion: { name: 'Bình máu', detail: 'Hồi 2 tim.', glyph: '🧪' },
  shield: { name: 'Khiên', detail: 'Chặn một câu sai: không mất tim, không mất combo.', glyph: '🛡️' },
  double: { name: 'Nhân đôi XP', detail: '10 câu đúng tiếp theo được gấp đôi XP.', glyph: '⚡' },
  hint: { name: 'Gợi ý của Cú', detail: 'Câu trắc nghiệm đang làm bỏ bớt 2 phương án sai.', glyph: '🦉' },
};

/** Thưởng combo: từ câu đúng thứ 3 liên tiếp, +2 mỗi câu, tối đa +20. */
export function comboBonus(combo: number): number {
  return combo < 3 ? 0 : Math.min(20, (combo - 2) * 2);
}

// ---------------------------------------------------------------- cấp độ

/** Tổng XP cần để ĐẠT cấp `level` (cấp 1 = 0 XP, cấp 2 = 100, cấp 3 = 300, cấp 4 = 600…). */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

export function levelProgress(xp: number): { level: number; into: number; need: number } {
  const level = levelForXp(xp);
  const base = xpForLevel(level);
  return { level, into: xp - base, need: xpForLevel(level + 1) - base };
}

/** Danh hiệu theo cấp — cho có chuyện để kể, không mở khoá gì. */
export function titleForLevel(level: number): string {
  if (level >= 30) return 'Huyền thoại';
  if (level >= 20) return 'Đại sư';
  if (level >= 12) return 'Hiệp sĩ chữ';
  if (level >= 7) return 'Thợ săn quái';
  if (level >= 3) return 'Tập sự';
  return 'Tân binh';
}

// ---------------------------------------------------------------- quái

export type EnemyDef = { id: string; name: string; baseHp: number; color: string; taunt: string };

/** Bảy loài quái, lần lượt xuất hiện; hết vòng thì quay lại, khoẻ hơn. */
export const ENEMIES: EnemyDef[] = [
  { id: 'typo-bug', name: 'Bọ Lỗi Chính Tả', baseHp: 60, color: '#84cc16', taunt: 'Gõ thiếu một chữ là tao sống!' },
  { id: 'comma-slime', name: 'Nhớt Dấu Phẩy', baseHp: 80, color: '#38bdf8', taunt: 'Câu ghép không dấu, ngon!' },
  { id: 'tense-ghost', name: 'Ma Chia Thì', baseHp: 100, color: '#c4b5fd', taunt: 'Hôm qua hay hôm nay?' },
  { id: 'math-golem', name: 'Người Đá Phương Trình', baseHp: 120, color: '#f59e0b', taunt: 'Quên đổi dấu kìa!' },
  { id: 'idiom-bat', name: 'Dơi Thành Ngữ', baseHp: 130, color: '#f472b6', taunt: 'Hiểu từng chữ, sai cả câu.' },
  { id: 'false-friend', name: 'Rương Từ Giả', baseHp: 150, color: '#b7791f', taunt: 'Trông quen mà nghĩa khác đó!' },
  { id: 'blank-dragon', name: 'Rồng Trang Trắng', baseHp: 190, color: '#ef4444', taunt: 'Tờ giấy trắng là của ta!' },
];

/** Quái thứ `index` (đếm từ 0, tính cả những con đã hạ). Mỗi vòng qua đủ bảy loài, máu +40%. */
export function enemyAt(index: number): EnemyDef & { hp: number; round: number } {
  const def = ENEMIES[index % ENEMIES.length]!;
  const round = Math.floor(index / ENEMIES.length);
  return { ...def, hp: Math.round(def.baseHp * (1 + round * 0.4)), round };
}

/** Sát thương một câu đúng: 20 + 3 × combo, chí mạng thì gấp đôi. */
export function damageFor(combo: number, crit: boolean): number {
  return (20 + 3 * combo) * (crit ? 2 : 1);
}

/** Đồ rơi khi hạ quái: con chẵn rơi đồ, xoay vòng bốn món — đoán trước được, không phải quay xổ số. */
export function lootFor(defeatedIndex: number): ItemKind | null {
  if (defeatedIndex % 2 === 1) return null;
  const order: ItemKind[] = ['potion', 'hint', 'shield', 'double'];
  return order[(defeatedIndex / 2) % order.length]!;
}

// ---------------------------------------------------------------- một lượt trả lời

export type BattleState = {
  xp: number;
  combo: number;
  hearts: number;
  enemyIndex: number;
  enemyHp: number;
  shield: boolean;
  doubleLeft: number;
};

export type AnswerOutcome = {
  state: BattleState;
  xpGained: number;
  damage: number;
  crit: boolean;
  /** Khiên vừa chặn câu sai này. */
  blocked: boolean;
  hurt: boolean;
  knockedOut: boolean;
  defeated: { name: string; bonusXp: number; loot: ItemKind | null } | null;
  levelUp: number | null;
};

export function resolveAnswer(s: BattleState, correct: boolean): AnswerOutcome {
  const before = levelForXp(s.xp);
  if (!correct) {
    if (s.shield) {
      return { state: { ...s, shield: false }, xpGained: 0, damage: 0, crit: false, blocked: true, hurt: false, knockedOut: false, defeated: null, levelUp: null };
    }
    const hearts = s.hearts - 1;
    if (hearts <= 0) {
      // Bị đánh lui: quái hồi đầy máu, tim đầy lại — học tiếp như thường.
      const enemy = enemyAt(s.enemyIndex);
      return {
        state: { ...s, combo: 0, hearts: MAX_HEARTS, enemyHp: enemy.hp },
        xpGained: 0,
        damage: 0,
        crit: false,
        blocked: false,
        hurt: true,
        knockedOut: true,
        defeated: null,
        levelUp: null,
      };
    }
    return { state: { ...s, combo: 0, hearts }, xpGained: 0, damage: 0, crit: false, blocked: false, hurt: true, knockedOut: false, defeated: null, levelUp: null };
  }

  const combo = s.combo + 1;
  const crit = combo % CRIT_EVERY === 0;
  const multiplier = (crit ? 2 : 1) * (s.doubleLeft > 0 ? 2 : 1);
  let xpGained = (XP_CORRECT + comboBonus(combo)) * multiplier;
  const damage = damageFor(combo, crit);
  let enemyIndex = s.enemyIndex;
  let enemyHp = s.enemyHp - damage;
  let defeated: AnswerOutcome['defeated'] = null;
  if (enemyHp <= 0) {
    const enemy = enemyAt(s.enemyIndex);
    const bonusXp = Math.round(enemy.hp / 2);
    xpGained += bonusXp;
    defeated = { name: enemy.name, bonusXp, loot: lootFor(s.enemyIndex) };
    enemyIndex += 1;
    enemyHp = enemyAt(enemyIndex).hp;
  }
  const xp = s.xp + xpGained;
  const after = levelForXp(xp);
  return {
    state: { ...s, xp, combo, enemyIndex, enemyHp, doubleLeft: Math.max(0, s.doubleLeft - 1) },
    xpGained,
    damage,
    crit,
    blocked: false,
    hurt: false,
    knockedOut: false,
    defeated,
    levelUp: after > before ? after : null,
  };
}

/**
 * Bài chấm một lượt ở cuối (bài kiểm tra, đề tuần, câu hỏi sau bài đọc): mỗi câu
 * đúng 10 XP và một nhát 20 máu, KHÔNG có combo (không biết thứ tự đúng sai) và
 * KHÔNG mất tim — làm sai trong bài kiểm tra đã là cái giá đủ rồi.
 */
export function resolveBatch(
  s: BattleState,
  correct: number,
): { state: BattleState; xpGained: number; damage: number; defeated: { name: string; bonusXp: number; loot: ItemKind | null }[]; levelUp: number | null } {
  const before = levelForXp(s.xp);
  const hits = Math.max(0, Math.floor(correct));
  const doubled = Math.min(hits, s.doubleLeft);
  let xpGained = hits * XP_CORRECT + doubled * XP_CORRECT;
  const damage = hits * 20;
  let enemyIndex = s.enemyIndex;
  let enemyHp = s.enemyHp - damage;
  const defeated: { name: string; bonusXp: number; loot: ItemKind | null }[] = [];
  while (enemyHp <= 0) {
    const enemy = enemyAt(enemyIndex);
    const bonusXp = Math.round(enemy.hp / 2);
    xpGained += bonusXp;
    defeated.push({ name: enemy.name, bonusXp, loot: lootFor(enemyIndex) });
    const overflow = -enemyHp;
    enemyIndex += 1;
    enemyHp = enemyAt(enemyIndex).hp - overflow;
  }
  const xp = s.xp + xpGained;
  const after = levelForXp(xp);
  return {
    state: { ...s, xp, enemyIndex, enemyHp, doubleLeft: s.doubleLeft - doubled },
    xpGained,
    damage,
    defeated,
    levelUp: after > before ? after : null,
  };
}

// ---------------------------------------------------------------- nhiệm vụ ngày

export type DayStats = { correct: number; answers: number; bestCombo: number; defeated: number; xp: number };

export type DailyQuest = { id: string; title: string; metric: keyof DayStats; goal: number; rewardXp: number; rewardItem: ItemKind | null };

const QUEST_POOL: DailyQuest[] = [
  { id: 'correct-20', title: 'Trả lời đúng 20 câu', metric: 'correct', goal: 20, rewardXp: 60, rewardItem: null },
  { id: 'correct-40', title: 'Trả lời đúng 40 câu', metric: 'correct', goal: 40, rewardXp: 120, rewardItem: 'double' },
  { id: 'answers-30', title: 'Làm 30 câu bất kỳ', metric: 'answers', goal: 30, rewardXp: 50, rewardItem: null },
  { id: 'combo-8', title: 'Đạt combo 8', metric: 'bestCombo', goal: 8, rewardXp: 80, rewardItem: 'shield' },
  { id: 'combo-15', title: 'Đạt combo 15', metric: 'bestCombo', goal: 15, rewardXp: 150, rewardItem: 'hint' },
  { id: 'defeat-2', title: 'Hạ 2 con quái', metric: 'defeated', goal: 2, rewardXp: 70, rewardItem: 'potion' },
  { id: 'defeat-4', title: 'Hạ 4 con quái', metric: 'defeated', goal: 4, rewardXp: 140, rewardItem: 'hint' },
  { id: 'xp-300', title: 'Kiếm 300 XP', metric: 'xp', goal: 300, rewardXp: 90, rewardItem: null },
];

function hashDay(day: string): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i += 1) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Ba nhiệm vụ của ngày `day` (YYYY-MM-DD) — giống nhau cho mọi người, mỗi ngày một bộ khác. */
export function dailyQuests(day: string): DailyQuest[] {
  const h = hashDay(day);
  const picks: DailyQuest[] = [];
  const used = new Set<string>();
  for (let k = 0; picks.length < 3 && k < 40; k += 1) {
    const q = QUEST_POOL[(h + k * 7 + (h >>> (k % 16))) % QUEST_POOL.length]!;
    // Không lấy hai nhiệm vụ cùng thước đo trong một ngày.
    if (used.has(q.metric)) continue;
    used.add(q.metric);
    picks.push(q);
  }
  return picks;
}

// ---------------------------------------------------------------- huy hiệu

export type Lifetime = { correct: number; answers: number; bestCombo: number; defeated: number; xp: number; knockouts: number };

export type Achievement = { id: string; title: string; detail: string; glyph: string; test: (l: Lifetime) => boolean };

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-blood', title: 'Nhát chém đầu', detail: 'Trả lời đúng câu đầu tiên.', glyph: '🗡️', test: (l) => l.correct >= 1 },
  { id: 'hundred', title: 'Trăm câu đúng', detail: 'Đúng tổng cộng 100 câu.', glyph: '💯', test: (l) => l.correct >= 100 },
  { id: 'thousand', title: 'Nghìn câu đúng', detail: 'Đúng tổng cộng 1.000 câu.', glyph: '🏔️', test: (l) => l.correct >= 1000 },
  { id: 'combo-10', title: 'Chuỗi lửa', detail: 'Đạt combo 10.', glyph: '🔥', test: (l) => l.bestCombo >= 10 },
  { id: 'combo-25', title: 'Không thể cản', detail: 'Đạt combo 25.', glyph: '☄️', test: (l) => l.bestCombo >= 25 },
  { id: 'hunter-5', title: 'Thợ săn', detail: 'Hạ 5 con quái.', glyph: '🏹', test: (l) => l.defeated >= 5 },
  { id: 'hunter-7', title: 'Đủ bộ quái', detail: 'Hạ đủ bảy loài quái.', glyph: '📖', test: (l) => l.defeated >= ENEMIES.length },
  { id: 'dragon', title: 'Diệt Rồng Trang Trắng', detail: 'Hạ 14 con quái — hai vòng.', glyph: '🐉', test: (l) => l.defeated >= ENEMIES.length * 2 },
  { id: 'level-5', title: 'Cấp 5', detail: 'Lên cấp 5.', glyph: '⭐', test: (l) => levelForXp(l.xp) >= 5 },
  { id: 'level-10', title: 'Cấp 10', detail: 'Lên cấp 10.', glyph: '🌟', test: (l) => levelForXp(l.xp) >= 10 },
  { id: 'rise-again', title: 'Ngã rồi đứng dậy', detail: 'Bị đánh lui rồi vẫn học tiếp.', glyph: '🩹', test: (l) => l.knockouts >= 1 && l.correct >= 10 },
];

export function newAchievements(l: Lifetime, have: Record<string, string>): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !have[a.id] && a.test(l));
}

// ---------------------------------------------------------------- đồng bộ hai máy

export type GamePayload = BattleState & {
  items: Record<ItemKind, number>;
  life: Lifetime;
  day: string;
  today: DayStats;
  claimed: string[];
  achievements: Record<string, string>;
};

export const EMPTY_LIFE: Lifetime = { correct: 0, answers: 0, bestCombo: 0, defeated: 0, xp: 0, knockouts: 0 };
export const EMPTY_DAY: DayStats = { correct: 0, answers: 0, bestCombo: 0, defeated: 0, xp: 0 };

/**
 * Gộp hai máy: máy nào nhiều XP hơn thì giữ nguyên trận đấu và túi đồ của máy đó
 * (trộn quái của máy này với máu của máy kia là ra trạng thái không có thật).
 * Những thứ chỉ tăng — huy hiệu, kỷ lục, số câu — thì lấy phần lớn nhất của cả hai.
 */
export function mergeGame(local: GamePayload | null, remote: GamePayload | null): GamePayload | null {
  if (!local) return remote;
  if (!remote) return local;
  const base = remote.xp > local.xp ? remote : local;
  const other = base === local ? remote : local;
  const life = { ...EMPTY_LIFE };
  for (const k of Object.keys(life) as (keyof Lifetime)[]) life[k] = Math.max(local.life?.[k] ?? 0, remote.life?.[k] ?? 0);
  const achievements: Record<string, string> = { ...other.achievements };
  for (const [id, at] of Object.entries(base.achievements ?? {})) {
    achievements[id] = achievements[id] && achievements[id]! < at ? achievements[id]! : at;
  }
  let today = base.today;
  let claimed = base.claimed;
  if (other.day === base.day) {
    today = { ...EMPTY_DAY };
    for (const k of Object.keys(today) as (keyof DayStats)[]) today[k] = Math.max(base.today?.[k] ?? 0, other.today?.[k] ?? 0);
    claimed = [...new Set([...(base.claimed ?? []), ...(other.claimed ?? [])])];
  }
  return { ...base, life, achievements, today, claimed };
}
