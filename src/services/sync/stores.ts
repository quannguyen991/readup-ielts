import { registerSyncedStore, type SyncedStore } from './engine';
import { useLocaleStore } from '@/i18n/useT';
import { repairReviews } from '@/services/vocab/review-schedule';
import { todayKey } from '@/store/persist';
import {
  mergeBilling,
  mergeMath,
  mergeStudy,
  mergeTopicStudy,
  mergeVocab,
  type BillingPayload,
  type MathPayload,
  type StudyPayload,
  type TopicStudyPayload,
  type VocabPayload,
} from './store-merges';
import { useBillingStore } from '@/store/useBillingStore';
import { remapTopicStudy } from '@/services/vocab/sat-slug-migration';
import { useMathStore } from '@/store/useMathStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { useWeeklyStore } from '@/store/useWeeklyStore';
import { useSatRwStore } from '@/store/useSatRwStore';
import { gamePayload, useGameStore } from '@/store/useGameStore';
import { rewardPayload, useRewardStore } from '@/store/useRewardStore';
import { mergeRoadmap, useRoadmapStore, type RoadmapPayload } from '@/store/useRoadmapStore';
import { cityPayload, useCityStore } from '@/store/useCityStore';
import { mergeRoadmapProgress, useSatRoadmapStore, type RoadmapProgress } from '@/store/useSatRoadmapStore';
import { cityLifePayload, mergeCityLife, useCityLifeStore, type CityLifePayload } from '@/store/useCityLifeStore';
import { mergeCity, type CityPayload } from '@/services/city/sync';
import { mergeReward, type RewardPayload } from '@/services/gamification/shop';
import { mergeGame, type GamePayload } from '@/services/game/rules';
import { mergeRwAttempts, type RwAttempt } from '@/services/sat-rw/progress';
import { mergeWeekly, type WeeklyResult } from '@/services/weekly/challenge';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { mergeSpeakingAttempts, type SpeakingAttempt } from '@/services/speaking/attempts';
import { useListeningStore } from '@/store/useListeningStore';
import { mergeListeningAttempts } from '@/services/listening/attempts';
import type { ListeningAttempt } from '@/services/listening/types';
import { travelPayload, useTravelStore } from '@/store/useTravelStore';
import { mergeTravel, normalizeTravel } from '@/services/travel/sync';
import { historyPayload, useHistoryStore } from '@/store/useHistoryStore';
import { mergeStudyAbroad, normalizeStudyAbroad } from '@/services/study-abroad/sync';
import { useStudyAbroadStore } from '@/store/useStudyAbroadStore';
import { mergeStartup, normalizeStartup } from '@/services/startup/sync';
import { useStartupStore } from '@/store/useStartupStore';
import { mergeHistory, normalizeHistory } from '@/services/history/progress';

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

/**
 * Đồ đã đổi bằng sao: món đã mua, sao đã tiêu, ngày giữ chuỗi, đồ đang đeo. Đồng bộ
 * để mua trên máy này thì máy kia cũng có — và để bảng xếp hạng hiện được avatar,
 * bìa của từng người (máy chủ đọc phần đồ đang đeo, không đọc gì khác).
 */
const rewardStore: SyncedStore = {
  key: 'reward',
  read: () => rewardPayload(),
  write: (payload) => {
    if (payload) useRewardStore.setState(payload as RewardPayload);
  },
  merge: (local, remote) => mergeReward(local as RewardPayload | null, remote as RewardPayload | null),
};

/** Thành phố Tri thức: vật liệu, nhà đã xây. Bản sửa sau thắng (xem `mergeCity`). */
const cityStore: SyncedStore = {
  key: 'city',
  read: () => cityPayload(),
  write: (payload) => {
    if (payload) useCityStore.setState(payload as CityPayload);
  },
  merge: (local, remote) => mergeCity(local as CityPayload | null, remote as CityPayload | null),
};

/** Đời sống trong thành phố: bộ sưu tập cá / bọ, cách bày trong nhà. */
const cityLifeStore: SyncedStore = {
  key: 'city_life',
  read: () => cityLifePayload(),
  write: (payload) => {
    if (payload) useCityLifeStore.setState(payload as CityLifePayload);
  },
  merge: (local, remote) => mergeCityLife(local as CityLifePayload | null, remote as CityLifePayload | null),
};

/** Ngôn ngữ giao diện (VI / EN): máy nào đổi sau thì thắng. */
type LocalePayload = { locale?: 'vi' | 'en'; changedAt?: string };
const localeStore: SyncedStore = {
  key: 'locale',
  read: () => {
    const st = useLocaleStore.getState();
    return { locale: st.locale, changedAt: st.changedAt };
  },
  write: (payload) => {
    const p = payload as LocalePayload | null;
    if (p?.locale === 'vi' || p?.locale === 'en') useLocaleStore.setState({ locale: p.locale, changedAt: p.changedAt ?? '' });
  },
  merge: (local, remote) => {
    const l = (local ?? {}) as LocalePayload;
    const r = (remote ?? {}) as LocalePayload;
    return (r.changedAt ?? '') > (l.changedAt ?? '') ? r : l;
  },
};

/** Lộ trình SAT Math theo chủ đề: điểm cao nhất từng chương × mức. */
const satRoadmapStore: SyncedStore = {
  key: 'sat_roadmap',
  read: () => ({ progress: useSatRoadmapStore.getState().progress }),
  write: (payload) => {
    const p = (payload as { progress?: RoadmapProgress } | null)?.progress;
    if (p) useSatRoadmapStore.setState({ progress: p });
  },
  merge: (local, remote) => ({
    progress: mergeRoadmapProgress((local as { progress?: RoadmapProgress } | null)?.progress, (remote as { progress?: RoadmapProgress } | null)?.progress),
  }),
};

/** Phòng luyện nói: lượt thi (bản chữ, chỉ số, điểm AI). Hợp theo id, giữ 50 lượt mới nhất. */
const speakingStore: SyncedStore = {
  key: 'speaking',
  read: () => ({ attempts: useSpeakingStore.getState().attempts }),
  write: (payload) => {
    const list = (payload as { attempts?: SpeakingAttempt[] } | null)?.attempts;
    if (Array.isArray(list)) useSpeakingStore.setState({ attempts: list });
  },
  merge: (local, remote) => ({
    attempts: mergeSpeakingAttempts(
      (local as { attempts?: SpeakingAttempt[] } | null)?.attempts,
      (remote as { attempts?: SpeakingAttempt[] } | null)?.attempts,
    ),
  }),
};

/** Listening: lượt làm bài lẻ / full đề. Hợp theo id, giữ 100 lượt mới nhất. */
const listeningStore: SyncedStore = {
  key: 'listening',
  read: () => ({ attempts: useListeningStore.getState().attempts }),
  write: (payload) => {
    const list = (payload as { attempts?: ListeningAttempt[] } | null)?.attempts;
    if (Array.isArray(list)) useListeningStore.setState({ attempts: list });
  },
  merge: (local, remote) => ({
    attempts: mergeListeningAttempts(
      (local as { attempts?: ListeningAttempt[] } | null)?.attempts,
      (remote as { attempts?: ListeningAttempt[] } | null)?.attempts,
    ),
  }),
};

/**
 * Du ngoạn Band 9: vé / xu tính từ sổ cái (hợp theo mã khoản, không cộng đôi),
 * tiến độ lấy số lớn, vị trí và tuỳ chọn theo bản mới hơn (xem `services/travel/sync.ts`).
 */
const travelStore: SyncedStore = {
  key: 'travel',
  read: () => travelPayload(),
  write: (payload) => {
    if (payload) useTravelStore.setState(normalizeTravel(payload));
  },
  merge: (local, remote) => mergeTravel(local, remote),
};

/** Khám phá lịch sử Việt Nam: cảnh đã đọc xong / đang đọc dở / đáp án. Cộng thêm, đã đọc xong là một chiều. */
const historyStore: SyncedStore = {
  key: 'history',
  read: () => historyPayload(),
  write: (payload) => {
    if (payload) useHistoryStore.setState({ topics: normalizeHistory(payload).topics });
  },
  merge: (local, remote) => mergeHistory(local as never, remote as never),
};

/** Học kỳ du học: nhiệm vụ đã xong (một chiều), đồ trang trí phòng, lần nghỉ. */
const studyAbroadStore: SyncedStore = {
  key: 'study_abroad',
  read: () => {
    const s = useStudyAbroadStore.getState();
    return { completed: s.completed, decorations: s.decorations, restedAt: s.restedAt, ledger: s.ledger };
  },
  write: (payload) => {
    if (payload) useStudyAbroadStore.setState(normalizeStudyAbroad(payload));
  },
  merge: (local, remote) => mergeStudyAbroad(local, remote),
};

/** Quán khởi nghiệp: quán đã mở, sổ quán, món riêng. Vốn nằm ở sổ đồng du học (store Du học). */
const startupStore: SyncedStore = {
  key: 'startup',
  read: () => {
    const s = useStartupStore.getState();
    return { shops: s.shops, ledger: s.ledger, customRecipes: s.customRecipes };
  },
  write: (payload) => {
    if (payload) {
      const n = normalizeStartup(payload);
      useStartupStore.setState({ shops: n.shops, ledger: n.ledger, customRecipes: n.customRecipes });
    }
  },
  merge: (local, remote) => mergeStartup(local, remote),
};

/** Gọi một lần lúc khởi động app. */
/** Lộ trình tự lập: bản khai + dấu đã làm. */
const roadmapStore: SyncedStore = {
  key: 'roadmap',
  read: () => {
    const s = useRoadmapStore.getState();
    return { input: s.input, done: s.done, updatedAt: s.updatedAt };
  },
  write: (payload) => {
    const data = payload as RoadmapPayload;
    useRoadmapStore.setState({ input: data.input ?? null, done: data.done ?? {}, updatedAt: data.updatedAt ?? null });
  },
  merge: (local, remote) => mergeRoadmap(local as RoadmapPayload | null, remote as RoadmapPayload | null),
};

/** Tiến độ 50 bộ từ chủ đề (stages, scores, starred, lapses, mistakeLog, lastAt). */
const topicStudyStore: SyncedStore = {
  key: 'topic_study',
  read: () => {
    const s = useTopicStudyStore.getState();
    return {
      stages: s.stages,
      scores: s.scores,
      starred: s.starred,
      lapses: s.lapses,
      // Lịch ôn Leitner: hàm gộp đã lo từ 30/09 nhưng trước 01/10 chưa được đọc ra
      // nên không lên máy chủ — lời nhắc "còn N từ cần ôn" (cron) đọc trường này.
      reviews: s.reviews,
      resets: s.resets,
      mistakeLog: s.mistakeLog,
      learnSettings: s.learnSettings,
      lastAt: s.lastAt,
    };
  },
  write: (payload) => {
    const data = payload as TopicStudyPayload;
    useTopicStudyStore.setState({
      stages: (data.stages ?? {}) as never,
      scores: (data.scores ?? {}) as never,
      starred: (data.starred ?? {}) as never,
      lapses: (data.lapses ?? {}) as never,
      // Máy chủ có thể còn lịch cũ bị đẩy xa: sửa trước khi nhận.
      reviews: repairReviews((data.reviews ?? {}) as never, todayKey()),
      resets: (data.resets ?? {}) as never,
      mistakeLog: (data.mistakeLog ?? []) as never,
      learnSettings: (data.learnSettings ?? useTopicStudyStore.getState().learnSettings) as never,
      lastAt: (data.lastAt ?? {}) as never,
    });
  },
  // Bản trên máy chủ có thể còn mã bài SAT Math cũ: chuyển cả hai bên trước khi gộp.
  merge: (local, remote) => mergeTopicStudy(remapTopicStudy(local as never), remote ? remapTopicStudy(remote as never) : remote),
};

export function registerAllSyncedStores(): void {
  registerSyncedStore(roadmapStore);
  registerSyncedStore(mathStore);
  registerSyncedStore(studyStore);
  registerSyncedStore(vocabStore);
  registerSyncedStore(topicStudyStore);
  registerSyncedStore(billingStore);
  registerSyncedStore(weeklyStore);
  registerSyncedStore(satRwStore);
  registerSyncedStore(gameStore);
  registerSyncedStore(rewardStore);
  registerSyncedStore(cityStore);
  registerSyncedStore(cityLifeStore);
  registerSyncedStore(satRoadmapStore);
  registerSyncedStore(localeStore);
  registerSyncedStore(speakingStore);
  registerSyncedStore(travelStore);
  registerSyncedStore(listeningStore);
  registerSyncedStore(historyStore);
  registerSyncedStore(studyAbroadStore);
  registerSyncedStore(startupStore);
}
