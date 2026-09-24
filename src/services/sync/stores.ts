import { registerSyncedStore, type SyncedStore } from './engine';
import {
  mergeBilling,
  mergeMath,
  mergeStudy,
  mergeQuest,
  mergeVocab,
  type BillingPayload,
  type MathPayload,
  type StudyPayload,
  type QuestPayload,
  type VocabPayload,
} from './store-merges';
import { useBillingStore } from '@/store/useBillingStore';
import { useMathStore } from '@/store/useMathStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { useQuestStore } from '@/store/useQuestStore';
import { useWeeklyStore } from '@/store/useWeeklyStore';
import { useSatRwStore } from '@/store/useSatRwStore';
import { gamePayload, useGameStore } from '@/store/useGameStore';
import { mergeGame, type GamePayload } from '@/services/game/rules';
import { mergeRwAttempts, type RwAttempt } from '@/services/sat-rw/progress';
import { mergeWeekly, type WeeklyResult } from '@/services/weekly/challenge';

/**
 * Nối từng zustand store vào engine đồng bộ.
 *
 * File này CHỈ làm việc nối dây: đọc state ra, ghi state vào. Toàn bộ luật gộp
 * nằm ở `store-merges.ts` dưới dạng hàm thuần, nên chỗ dễ sai nhất được test
 * mà không cần dựng React.
 *
 * Thêm một store vào đồng bộ = viết một hàm gộp ở file kia rồi thêm một khối ở
 * đây. Không phải sửa engine.
 */

const mathStore: SyncedStore = {
  key: 'math',
  read: () => ({ sessions: useMathStore.getState().sessions }),
  write: (payload) => {
    useMathStore.setState({ sessions: ((payload as MathPayload).sessions ?? []) as never });
  },
  merge: mergeMath,
};

const studyStore: SyncedStore = {
  key: 'study',
  read: () => {
    const s = useStudyStore.getState();
    return {
      sessions: s.sessions,
      progress: s.progress,
      daily: s.daily,
      bookmarks: s.bookmarks,
      targetBand: s.targetBand,
      dailyGoalMinutes: s.dailyGoalMinutes,
      readingWpm: s.readingWpm,
    };
  },
  write: (payload) => {
    const data = payload as StudyPayload;
    useStudyStore.setState({
      sessions: (data.sessions ?? []) as never,
      progress: (data.progress ?? {}) as never,
      daily: (data.daily ?? {}) as never,
      bookmarks: data.bookmarks ?? [],
      targetBand: data.targetBand,
      dailyGoalMinutes: data.dailyGoalMinutes,
      readingWpm: data.readingWpm ?? [],
    });
  },
  merge: mergeStudy,
};

const vocabStore: SyncedStore = {
  key: 'vocab',
  read: () => {
    const s = useVocabStore.getState();
    return { entries: s.entries, cards: s.cards, wordStatus: s.wordStatus, reviewLog: s.reviewLog };
  },
  write: (payload) => {
    const data = payload as VocabPayload;
    useVocabStore.setState({
      entries: (data.entries ?? {}) as never,
      cards: (data.cards ?? {}) as never,
      wordStatus: (data.wordStatus ?? {}) as never,
      reviewLog: (data.reviewLog ?? []) as never,
    });
  },
  merge: mergeVocab,
};

const billingStore: SyncedStore = {
  key: 'billing',
  read: () => {
    const s = useBillingStore.getState();
    return { plan: s.plan, expiresAt: s.expiresAt, source: s.source, usage: s.usage };
  },
  write: (payload) => {
    const data = payload as BillingPayload;
    useBillingStore.setState({
      plan: data.plan ?? 'free',
      expiresAt: data.expiresAt ?? null,
      source: data.source ?? 'local',
      usage: (data.usage ?? {}) as never,
    });
  },
  merge: mergeBilling,
};

const questStore: SyncedStore = {
  key: 'quest',
  read: () => {
    const s = useQuestStore.getState();
    return { xp: s.xp, level: s.level, stars: s.stars, unlockedNodes: s.unlockedNodes, completedBattles: s.completedBattles, wrongQuestionIds: s.wrongQuestionIds, ownedCosmetics: s.ownedCosmetics, equippedCosmetic: s.equippedCosmetic };
  },
  write: (payload) => {
    const data = payload as QuestPayload;
    useQuestStore.setState({
      xp: data.xp ?? 0,
      level: data.level ?? 1,
      stars: data.stars ?? {},
      unlockedNodes: data.unlockedNodes ?? [],
      completedBattles: data.completedBattles ?? [],
      wrongQuestionIds: data.wrongQuestionIds ?? [],
      ownedCosmetics: data.ownedCosmetics ?? [],
      equippedCosmetic: data.equippedCosmetic ?? null,
    });
  },
  merge: mergeQuest,
};

/** Đề của tuần: máy chủ đọc khoá này để xếp hạng cả nước (`/api/weekly`). */
const weeklyStore: SyncedStore = {
  key: 'weekly',
  read: () => ({ results: useWeeklyStore.getState().results }),
  write: (payload) => {
    useWeeklyStore.setState({ results: ((payload as { results?: Record<string, WeeklyResult> }).results ?? {}) as never });
  },
  merge: (local, remote) => ({
    results: mergeWeekly(
      (local as { results?: Record<string, WeeklyResult> } | null)?.results,
      (remote as { results?: Record<string, WeeklyResult> } | null)?.results,
    ),
  }),
};

/** SAT Verbal: lượt làm theo câu — để đổi máy không mất, và báo cáo phụ huynh đọc được. */
const satRwStore: SyncedStore = {
  key: 'satrw',
  read: () => ({ attempts: useSatRwStore.getState().attempts }),
  write: (payload) => {
    useSatRwStore.setState({ attempts: ((payload as { attempts?: Record<string, RwAttempt> }).attempts ?? {}) as never });
  },
  merge: (local, remote) => ({
    attempts: mergeRwAttempts(
      (local as { attempts?: Record<string, RwAttempt> } | null)?.attempts,
      (remote as { attempts?: Record<string, RwAttempt> } | null)?.attempts,
    ),
  }),
};

/**
 * Game khi học: máy nào nhiều XP hơn thì giữ nguyên trận đấu và túi đồ của máy
 * đó; huy hiệu, kỷ lục và số câu lấy phần lớn nhất. Công tắc bật/tắt không đồng bộ.
 */
const gameStore: SyncedStore = {
  key: 'game',
  read: () => gamePayload(),
  write: (payload) => {
    if (payload) useGameStore.setState(payload as GamePayload);
  },
  merge: (local, remote) => mergeGame(local as GamePayload | null, remote as GamePayload | null),
};

/** Gọi một lần lúc khởi động app. */
export function registerAllSyncedStores(): void {
  registerSyncedStore(mathStore);
  registerSyncedStore(studyStore);
  registerSyncedStore(vocabStore);
  registerSyncedStore(billingStore);
  registerSyncedStore(questStore);
  registerSyncedStore(weeklyStore);
  registerSyncedStore(satRwStore);
  registerSyncedStore(gameStore);
}
