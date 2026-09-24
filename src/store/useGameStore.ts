import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { useGameFx } from './useGameFx';
import { setSfxMuted, sfx } from '@/services/audio/sfx';
import { dateKey } from '@/services/gamification/points';
import {
  dailyQuests,
  EMPTY_DAY,
  EMPTY_LIFE,
  enemyAt,
  FEVER_AT,
  ITEMS,
  levelForXp,
  MAX_HEARTS,
  newAchievements,
  resolveAnswer,
  resolveBatch,
  type AnswerOutcome,
  type DayStats,
  type GamePayload,
  type ItemKind,
  type Lifetime,
} from '@/services/game/rules';

/**
 * TRẠNG THÁI GAME KHI HỌC: XP, cấp, trận đấu với quái đang đứng trước mặt, túi
 * đồ, nhiệm vụ ngày, huy hiệu. Luật nằm hết ở `services/game/rules.ts`; ở đây
 * chỉ gọi luật, ghi kết quả, và bắn sự kiện sang `useGameFx` để giao diện diễn.
 *
 * Mọi màn học gọi đúng MỘT chỗ: `answer(đúng/sai, nguồn)` khi chấm từng câu, hoặc
 * `awardBatch(số đúng, tổng, nguồn)` khi bài chỉ chấm lúc nộp. Tắt game ở trang
 * Nhân vật thì hai hàm này không làm gì — việc học vẫn y nguyên.
 *
 * ÂM THANH CŨNG PHÁT Ở ĐÂY, không ở từng màn: nhờ vậy mọi phần học — từ vựng,
 * SAT, chép chính tả, đọc theo… — có đủ tiếng đúng, tiếng chém, tiếng trúng đòn
 * mà không màn nào phải nhớ tự gọi. Tắt game thì câu đúng vẫn còn tiếng "đúng".
 */

export type GameSource = 'vocab' | 'math' | 'verbal' | 'listen' | 'translate' | 'read' | 'shadow' | 'weekly' | 'quest' | 'duel';

/** Túi đồ khởi đầu — đủ để thấy mỗi món làm gì trước khi phải kiếm. */
const STARTER_ITEMS: Record<ItemKind, number> = { potion: 1, shield: 1, double: 0, hint: 3 };

type GameState = GamePayload & {
  enabled: boolean;
  /** Âm thanh hiệu ứng — mỗi máy tự chọn, không đồng bộ. */
  sound: boolean;
  setSound: (on: boolean) => void;
  answer: (correct: boolean, source: GameSource) => AnswerOutcome | null;
  awardBatch: (correct: number, total: number, source: GameSource) => void;
  /** XP tính sẵn từ nơi khác (trận Quest): cộng thẳng, kèm số câu cho nhiệm vụ ngày. */
  gainXp: (amount: number, correct: number, total: number, source: GameSource) => void;
  spendItem: (kind: ItemKind) => boolean;
  addItem: (kind: ItemKind, n?: number) => void;
  claimQuest: (id: string) => boolean;
  setEnabled: (on: boolean) => void;
};

function initial(): GamePayload {
  return {
    xp: 0,
    combo: 0,
    hearts: MAX_HEARTS,
    enemyIndex: 0,
    enemyHp: enemyAt(0).hp,
    shield: false,
    doubleLeft: 0,
    items: { ...STARTER_ITEMS },
    life: { ...EMPTY_LIFE },
    day: dateKey(new Date()),
    today: { ...EMPTY_DAY },
    claimed: [],
    achievements: {},
  };
}

/** Sang ngày mới thì nhiệm vụ ngày làm lại từ đầu. */
function rolled(s: GamePayload): Pick<GamePayload, 'day' | 'today' | 'claimed'> {
  const day = dateKey(new Date());
  return s.day === day ? { day, today: s.today, claimed: s.claimed } : { day, today: { ...EMPTY_DAY }, claimed: [] };
}

/** Nhiệm vụ nào vừa chạm đích trong lượt này — để báo "xong nhiệm vụ, vào nhận thưởng". */
function questsJustDone(day: string, before: DayStats, after: DayStats): string[] {
  return dailyQuests(day)
    .filter((q) => before[q.metric] < q.goal && after[q.metric] >= q.goal)
    .map((q) => q.title);
}

function awardAchievements(life: Lifetime, have: Record<string, string>): Record<string, string> {
  const fresh = newAchievements(life, have);
  if (fresh.length === 0) return have;
  const at = new Date().toISOString();
  const next = { ...have };
  for (const a of fresh) {
    next[a.id] = at;
    useGameFx.getState().push({ kind: 'achievement', title: a.title, glyph: a.glyph });
  }
  sfx.sparkle(0.9);
  return next;
}

/** Hạ quái xong mà con kế tiếp là boss thì nó gầm lên lúc bước vào. */
function roarIfBoss(nextEnemyIndex: number, at: number): void {
  if (enemyAt(nextEnemyIndex).boss) sfx.bossRoar(at);
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial(),
      enabled: true,
      sound: true,

      answer: (correct) => {
        const s = get();
        if (!s.enabled) {
          // Tắt game vẫn giữ tiếng "đúng" — tín hiệu học, không phải trang trí.
          if (correct) sfx.correct(1);
          return null;
        }
        const fx = useGameFx.getState();
        const o = resolveAnswer(s, correct);
        const { day, today: before, claimed } = rolled(s);
        const today: DayStats = {
          correct: before.correct + (correct ? 1 : 0),
          answers: before.answers + 1,
          bestCombo: Math.max(before.bestCombo, o.state.combo),
          defeated: before.defeated + (o.defeated ? 1 : 0),
          xp: before.xp + o.xpGained,
        };
        const life: Lifetime = {
          correct: s.life.correct + (correct ? 1 : 0),
          answers: s.life.answers + 1,
          bestCombo: Math.max(s.life.bestCombo, o.state.combo),
          defeated: s.life.defeated + (o.defeated ? 1 : 0),
          xp: o.state.xp,
          knockouts: s.life.knockouts + (o.knockedOut ? 1 : 0),
        };
        const items = { ...s.items };
        for (const k of o.defeated?.loot ?? []) items[k] += 1;

        if (correct) fx.push({ kind: 'hit', xp: o.xpGained - (o.defeated?.bonusXp ?? 0), damage: o.damage, crit: o.crit, combo: o.state.combo });
        else fx.push({ kind: o.blocked ? 'blocked' : o.knockedOut ? 'knockout' : 'hurt' });
        if (o.defeated) fx.push({ kind: 'defeat', enemyIndex: s.enemyIndex, name: o.defeated.name, loot: o.defeated.loot, bonusXp: o.defeated.bonusXp, boss: o.defeated.boss });
        if (o.levelUp) fx.push({ kind: 'levelup', level: o.levelUp });
        const doneQuests = questsJustDone(day, before, today);
        for (const title of doneQuests) fx.push({ kind: 'quest', title });

        // Tiếng xếp đúng nhịp hoạt cảnh của thanh trận đấu: chém → nổ tan → gầm boss → lên cấp.
        if (correct) {
          sfx.hit(o.state.combo, o.crit);
          if (o.state.combo === FEVER_AT) sfx.fever(0.3);
        } else if (o.blocked) sfx.block();
        else if (o.knockedOut) sfx.knockout();
        else {
          sfx.hurt();
          if (o.state.hearts === 1) sfx.heartbeat(0.55);
        }
        if (o.defeated) {
          sfx.defeat(o.defeated.boss, 0.24);
          roarIfBoss(o.state.enemyIndex, 1.05);
        }
        if (o.levelUp) sfx.levelUp(o.defeated ? 0.8 : 0.4);
        if (doneQuests.length > 0) sfx.sparkle(1.2);

        set({ ...o.state, items, day, today, claimed, life, achievements: awardAchievements(life, s.achievements) });
        return o;
      },

      awardBatch: (correct, total) => {
        const s = get();
        if (!s.enabled || total <= 0) return;
        const fx = useGameFx.getState();
        const o = resolveBatch(s, correct);
        const { day, today: before, claimed } = rolled(s);
        const today: DayStats = {
          correct: before.correct + correct,
          answers: before.answers + total,
          bestCombo: before.bestCombo,
          defeated: before.defeated + o.defeated.length,
          xp: before.xp + o.xpGained,
        };
        const life: Lifetime = {
          ...s.life,
          correct: s.life.correct + correct,
          answers: s.life.answers + total,
          defeated: s.life.defeated + o.defeated.length,
          xp: o.state.xp,
        };
        const items = { ...s.items };
        for (const d of o.defeated) for (const k of d.loot) items[k] += 1;

        fx.push({ kind: 'batch', xp: o.xpGained, correct, total, defeated: o.defeated.length });
        o.defeated.forEach((d, i) => fx.push({ kind: 'defeat', enemyIndex: s.enemyIndex + i, name: d.name, loot: d.loot, bonusXp: d.bonusXp, boss: d.boss }));
        if (o.levelUp) fx.push({ kind: 'levelup', level: o.levelUp });
        const doneQuests = questsJustDone(day, before, today);
        for (const title of doneQuests) fx.push({ kind: 'quest', title });

        // Nộp bài: tiếng xu đếm theo số câu đúng, rồi nổ quái / lên cấp nếu có.
        if (correct > 0) sfx.coins(correct);
        if (o.defeated.length > 0) {
          sfx.defeat(o.defeated.some((d) => d.boss), 0.45);
          roarIfBoss(o.state.enemyIndex, 1.2);
        }
        if (o.levelUp) sfx.levelUp(o.defeated.length > 0 ? 0.95 : 0.55);
        if (doneQuests.length > 0) sfx.sparkle(1.3);

        set({ ...o.state, items, day, today, claimed, life, achievements: awardAchievements(life, s.achievements) });
      },

      gainXp: (amount, correct, total) => {
        const s = get();
        if (!s.enabled || amount <= 0) return;
        const fx = useGameFx.getState();
        const xp = s.xp + Math.round(amount);
        const { day, today: before, claimed } = rolled(s);
        const today: DayStats = { ...before, correct: before.correct + correct, answers: before.answers + total, xp: before.xp + Math.round(amount) };
        const life: Lifetime = { ...s.life, correct: s.life.correct + correct, answers: s.life.answers + total, xp };
        const levelBefore = levelForXp(s.xp);
        const levelAfter = levelForXp(xp);
        fx.push({ kind: 'batch', xp: Math.round(amount), correct, total, defeated: 0 });
        if (levelAfter > levelBefore) {
          fx.push({ kind: 'levelup', level: levelAfter });
          sfx.levelUp(0.3);
        }
        for (const title of questsJustDone(day, before, today)) fx.push({ kind: 'quest', title });
        set({ xp, day, today, claimed, life, achievements: awardAchievements(life, s.achievements) });
      },

      spendItem: (kind) => {
        const s = get();
        if ((s.items[kind] ?? 0) <= 0) return false;
        const fx = useGameFx.getState();
        if (kind === 'potion') {
          if (s.hearts >= MAX_HEARTS) return false;
          set({ hearts: Math.min(MAX_HEARTS, s.hearts + 2) });
        } else if (kind === 'shield') {
          if (s.shield) return false;
          set({ shield: true });
        } else if (kind === 'double') {
          set({ doubleLeft: s.doubleLeft + 10 });
        } else if (kind === 'hint') {
          // Gợi ý chỉ có nghĩa khi màn đang mở có câu hỏi nhận gợi ý.
          if (!fx.hint || !fx.hint()) return false;
        }
        set({ items: { ...get().items, [kind]: s.items[kind] - 1 } });
        fx.push({ kind: 'item', item: kind, title: ITEMS[kind].name });
        if (kind === 'potion') sfx.potion();
        else if (kind === 'shield') sfx.shieldUp();
        else if (kind === 'double') sfx.powerUp();
        else sfx.owl();
        return true;
      },

      addItem: (kind, n = 1) => {
        const s = get();
        set({ items: { ...s.items, [kind]: (s.items[kind] ?? 0) + n } });
      },

      claimQuest: (id) => {
        const s = get();
        const { day, today, claimed } = rolled(s);
        const quest = dailyQuests(day).find((q) => q.id === id);
        if (!quest || claimed.includes(id) || today[quest.metric] < quest.goal) return false;
        const xp = s.xp + quest.rewardXp;
        const items = { ...s.items };
        if (quest.rewardItem) items[quest.rewardItem] += 1;
        const fx = useGameFx.getState();
        fx.push({ kind: 'batch', xp: quest.rewardXp, correct: 0, total: 0, defeated: 0 });
        if (levelForXp(xp) > levelForXp(s.xp)) {
          fx.push({ kind: 'levelup', level: levelForXp(xp) });
          sfx.levelUp();
        } else sfx.sparkle();
        const life = { ...s.life, xp };
        set({ xp, items, day, today, claimed: [...claimed, id], life, achievements: awardAchievements(life, s.achievements) });
        return true;
      },

      setEnabled: (on) => set({ enabled: on }),

      setSound: (on) => {
        setSfxMuted(!on);
        set({ sound: on });
        if (on) sfx.correct(1);
      },
    }),
    {
      name: `${STORAGE_PREFIX}game`,
      storage: storage(),
      version: 1,
      partialize: (s) => {
        const { answer: _a, awardBatch: _b, gainXp: _g, spendItem: _u, addItem: _i, claimQuest: _c, setEnabled: _e, setSound: _s, ...data } = s;
        return data;
      },
      // Máy đã tắt tiếng từ lần trước thì im ngay từ tiếng đầu tiên của phiên mới.
      onRehydrateStorage: () => (state) => {
        if (state) setSfxMuted(!state.sound);
      },
    },
  ),
);

/** Dữ liệu để đồng bộ: mọi thứ trừ hai công tắc game và âm thanh (mỗi máy tự chọn). */
export function gamePayload(): GamePayload {
  const { enabled: _on, sound: _snd, answer: _a, awardBatch: _b, gainXp: _g, spendItem: _u, addItem: _i, claimQuest: _c, setEnabled: _e, setSound: _s, ...data } = useGameStore.getState();
  return data;
}
