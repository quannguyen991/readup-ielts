import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, uid } from './persist';
import { QUEST_MAPS, getQuestNode } from '@/services/quest/maps';
import { buildQuestQuestions } from '@/services/quest/question-pool';
import { xpForBattle, starsForAccuracy } from '@/services/quest/combat';
import type { QuestBattle, QuestBattleResult, QuestProgress, QuestSubject } from '@/services/quest/types';

type QuestState = QuestProgress & {
  activeBattle: QuestBattle | null;
  startBattle: (nodeId: string, subject?: QuestSubject) => QuestBattle | null;
  finishBattle: (result: Omit<QuestBattleResult, 'xp' | 'stars' | 'completedAt'>) => QuestBattleResult;
  clearActiveBattle: () => void;
  isNodeUnlocked: (nodeId: string) => boolean;
};

const initial: QuestProgress = {
  xp: 0,
  level: 1,
  stars: {},
  // Cho phép thử cả ba thế giới ngay từ đầu; các node phía sau vẫn mở dần.
  unlockedNodes: QUEST_MAPS.map((map) => map.nodes[0]!.id),
  completedBattles: [],
  wrongQuestionIds: [],
  ownedCosmetics: [],
  equippedCosmetic: null,
};

function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 500) + 1);
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      ...initial,
      activeBattle: null,

      startBattle: (nodeId, subject = 'mixed') => {
        const node = getQuestNode(nodeId);
        if (!node || !get().isNodeUnlocked(nodeId)) return null;
        const battle: QuestBattle = {
          id: uid(),
          nodeId,
          mapId: node.mapId,
          subject,
          questions: buildQuestQuestions(`${nodeId}:${Date.now()}`, node.questions, subject),
          startedAt: new Date().toISOString(),
        };
        set({ activeBattle: battle });
        return battle;
      },

      finishBattle: (result) => {
        const stars = starsForAccuracy(result.correct, result.total);
        const xp = xpForBattle(result.correct, result.total, stars);
        const completedAt = new Date().toISOString();
        const completed: QuestBattleResult = { ...result, stars, xp, completedAt };
        set((state) => {
          const currentStars = state.stars[result.nodeId] ?? 0;
          const starsForNode = Math.max(currentStars, stars);
          const node = getQuestNode(result.nodeId);
          const nextNode = node?.mapId ? QUEST_MAPS.find((map) => map.id === node.mapId)?.nodes.find((n) => n.index === (node.index + 1)) : undefined;
          const unlocked = nextNode && starsForNode > 0 && !state.unlockedNodes.includes(nextNode.id)
            ? [...state.unlockedNodes, nextNode.id]
            : state.unlockedNodes;
          return {
            xp: state.xp + xp,
            level: levelForXp(state.xp + xp),
            stars: { ...state.stars, [result.nodeId]: starsForNode },
            unlockedNodes: unlocked,
            // Chỉ trận MỚI NHẤT giữ bản sao câu sai (có cả đoạn văn Verbal):
            // 50 trận × 10 câu kèm đoạn văn là cả megabyte trong localStorage.
            completedBattles: [
              completed,
              ...state.completedBattles.map(({ wrongQuestions: _dropped, ...rest }) => rest),
            ].slice(0, 50),
            wrongQuestionIds: [...new Set([...result.wrongQuestionIds, ...state.wrongQuestionIds])].slice(0, 100),
            ownedCosmetics: stars === 3
              ? [...new Set([...state.ownedCosmetics, `${result.mapId}-skin-basic`])]
              : state.ownedCosmetics,
            activeBattle: null,
          };
        });
        return completed;
      },

      clearActiveBattle: () => set({ activeBattle: null }),
      isNodeUnlocked: (nodeId) => get().unlockedNodes.includes(nodeId),
    }),
    {
      name: `${STORAGE_PREFIX}quest`,
      storage: storage<QuestState>(),
      version: 1,
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        stars: state.stars,
        unlockedNodes: state.unlockedNodes,
        completedBattles: state.completedBattles,
        wrongQuestionIds: state.wrongQuestionIds,
        ownedCosmetics: state.ownedCosmetics,
        equippedCosmetic: state.equippedCosmetic,
      } as QuestState),
    },
  ),
);
