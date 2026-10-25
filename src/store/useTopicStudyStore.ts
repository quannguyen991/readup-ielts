import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { DEFAULT_LEARN_SETTINGS, type LearnSettings, type WordStage } from '@/services/vocab/topic-study';
import type { MistakeKind } from '@/services/vocab/mistake';
import { isThemeId, type ThemeId } from '@/components/vocab/study/study-theme';
import { remapTopicStudy } from '@/services/vocab/sat-slug-migration';
import { stageAfterQuiz } from '@/services/vocab/deck-status';
import { loadByDay, nextReview, repairReviews, type ReviewEntry } from '@/services/vocab/review-schedule';
import { backupLeitner, gradeTopicWord, leitnerToFsrs } from '@/services/vocab/topic-fsrs';
import { useVocabStore } from './useVocabStore';
import type { LoopState } from '@/services/vocab/learn-loop';
import { todayKey } from './persist';

/** Một lỗi đã gọi tên ở màn học từ vựng — nguồn của Hồ sơ lỗi. */
export type MistakeEntry = { kind: MistakeKind; word: string; slug: string; at: string };
const MISTAKE_LOG_CAP = 400;

/**
 * Tiến độ học theo từng bộ từ chủ đề: mỗi từ đang ở chặng nào, và điểm cao của
 * trò chơi.
 *
 * Tách khỏi sổ từ FSRS (`useVocabStore`) có chủ ý: sổ từ là những từ người học
 * CHỌN giữ lại để ôn dài hạn; còn đây chỉ ghi "trong bộ 50 từ này, tôi đã đi
 * tới đâu". Học xong một từ ở đây không tự đẩy nó vào lịch ôn — người học tự
 * bấm lưu nếu muốn.
 */
export type GameScore = { score: number; at: string };

type TopicStudyState = {
  /** slug → từ → chặng (0 chưa học, 1 nhận ra, 2 nhớ được). */
  stages: Record<string, Record<string, WordStage>>;
  /** slug → năm điểm cao nhất của trò chơi, giảm dần. */
  scores: Record<string, GameScore[]>;
  /** slug → các từ người học gắn sao để học riêng. */
  starred: Record<string, string[]>;
  /** slug → từ → số lần làm sai trong màn Học. Vòng sau hỏi từ sai nhiều trước. */
  lapses: Record<string, Record<string, number>>;
  addLapse: (slug: string, word: string) => void;
  /** slug → từ → hộp ôn + ngày đến hạn (`services/vocab/review-schedule.ts`). */
  reviews: Record<string, Record<string, ReviewEntry>>;
  /** Đã chuyển lịch Leitner cũ sang thẻ FSRS chung (chỉ một lần). */
  leitnerMigrated: boolean;
  migrateToSingleSchedule: () => void;
  /** slug → lúc bấm "Xoá tiến độ" (dấu xoá để đồng bộ nhiều máy không làm sống lại tiến độ cũ). */
  resets: Record<string, string>;
  /** Ghi một lần trả lời (đúng / sai) vào lịch ôn theo ngày. */
  review: (slug: string, word: string, correct: boolean) => void;
  /**
   * Một câu luyện ở màn KHÔNG tự chấm chặng (Điền chỗ trống, Chép chính tả, Bài kiểm tra, Bong bóng): vừa vào lịch ôn
   * vừa đẩy chặng của từ (đúng lên một nấc, sai về tối đa 1) — để "Đã nhớ / Cần ôn" ở trang bộ từ chạy theo.
   */
  practice: (slug: string, word: string, correct: boolean) => void;
  /** Nhật ký lỗi đã gọi tên (mới nhất cuối), giữ tối đa 400 dòng. */
  mistakeLog: MistakeEntry[];
  logMistake: (slug: string, word: string, kind: MistakeKind) => void;
  /** Cài đặt màn Học — dùng chung mọi bộ, như một thói quen học của người dùng. */
  learnSettings: LearnSettings;
  /** Chủ đề nền + màu khi bật "Nền & hiệu ứng" (theo máy, không đồng bộ). */
  studyTheme: ThemeId;
  setStudyTheme: (id: ThemeId) => void;
  /** "Nền & hiệu ứng": TẮT mặc định — màn học phẳng, nhẹ, không lớp trang trí nào được dựng. */
  studyFx: boolean;
  setStudyFx: (on: boolean) => void;
  /** slug → lần cuối mở một màn luyện của bộ (thẻ "Học lần cuối" ở thư viện bộ từ). */
  lastAt: Record<string, string>;
  /** Ghi mốc "vừa học bộ này" — mỗi màn luyện gọi một lần khi mở. */
  touch: (slug: string) => void;
  toggleStar: (slug: string, word: string) => void;
  setLearnSettings: (s: LearnSettings) => void;
  setStage: (slug: string, word: string, stage: WordStage) => void;
  addScore: (slug: string, score: number) => void;
  resetTopic: (slug: string) => void;
  /** Vòng học đang dở của từng bộ: học tới đâu lưu tới đó, mở lại thì tiếp tục đúng vòng. */
  activeRound: Record<string, SavedRound>;
  setActiveRound: (slug: string, round: SavedRound | null) => void;
};

export type SavedRound = {
  words: string[];
  plan: LoopState;
  asked: number;
  wrong: number;
  streak: number;
  step: number;
};

export const useTopicStudyStore = create<TopicStudyState>()(
  persist(
    (set) => ({
      stages: {},
      scores: {},
      starred: {},
      lapses: {},
      reviews: {},
      leitnerMigrated: false,
      resets: {},
      review: (slug, word, correct) => {
        useVocabStore.setState((v) => gradeTopicWord(v, slug, word, correct, new Date()));
      },
      practice: (slug, word, correct) => {
        useVocabStore.setState((v) => gradeTopicWord(v, slug, word, correct, new Date()));
        set((s) => ({
          stages: { ...s.stages, [slug]: { ...(s.stages[slug] ?? {}), [word]: stageAfterQuiz(s.stages[slug]?.[word], correct) } },
          lastAt: { ...s.lastAt, [slug]: new Date().toISOString() },
        }));
      },
      // Chuyển lịch Leitner cũ sang thẻ FSRS chung, một lần. Sao lưu trước; không sao lưu được thì không chuyển.
      migrateToSingleSchedule: () => {
        const s = useTopicStudyStore.getState();
        if (s.leitnerMigrated) return;
        if (!backupLeitner(s.reviews, s.stages, todayKey())) return;
        const vocab = useVocabStore.getState();
        useVocabStore.setState(leitnerToFsrs({ entries: vocab.entries, cards: vocab.cards }, s.reviews, s.stages, new Date()));
        set({ leitnerMigrated: true });
      },
      mistakeLog: [],
      lastAt: {},
      touch: (slug) => set((s) => ({ lastAt: { ...s.lastAt, [slug]: new Date().toISOString() } })),
      logMistake: (slug, word, kind) =>
        set((s) => ({
          mistakeLog: [...s.mistakeLog, { kind, word, slug, at: new Date().toISOString() }].slice(-MISTAKE_LOG_CAP),
          lastAt: { ...s.lastAt, [slug]: new Date().toISOString() },
        })),
      addLapse: (slug, word) =>
        set((s) => ({
          lapses: { ...s.lapses, [slug]: { ...(s.lapses[slug] ?? {}), [word]: (s.lapses[slug]?.[word] ?? 0) + 1 } },
          lastAt: { ...s.lastAt, [slug]: new Date().toISOString() },
        })),
      learnSettings: DEFAULT_LEARN_SETTINGS,
      studyTheme: 'scene',
      setStudyTheme: (studyTheme) => set({ studyTheme }),
      studyFx: false,
      setStudyFx: (studyFx) => set({ studyFx }),
      toggleStar: (slug, word) =>
        set((s) => {
          const cur = s.starred[slug] ?? [];
          const next = cur.includes(word) ? cur.filter((w) => w !== word) : [...cur, word];
          return { starred: { ...s.starred, [slug]: next } };
        }),
      setLearnSettings: (learnSettings) => set({ learnSettings }),
      setStage: (slug, word, stage) =>
        set((s) => ({
          stages: { ...s.stages, [slug]: { ...(s.stages[slug] ?? {}), [word]: stage } },
          lastAt: { ...s.lastAt, [slug]: new Date().toISOString() },
        })),
      addScore: (slug, score) =>
        set((s) => ({
          scores: {
            ...s.scores,
            [slug]: [...(s.scores[slug] ?? []), { score, at: new Date().toISOString() }]
              .sort((a, b) => b.score - a.score)
              .slice(0, 5),
          },
          lastAt: { ...s.lastAt, [slug]: new Date().toISOString() },
        })),
      activeRound: {},
      setActiveRound: (slug, round) =>
        set((s) => {
          const next = { ...s.activeRound };
          if (round) next[slug] = round;
          else delete next[slug];
          return { activeRound: next };
        }),
      resetTopic: (slug) =>
        set((s) => {
          const stages = { ...s.stages };
          delete stages[slug];
          const lapses = { ...s.lapses };
          delete lapses[slug];
          const reviews = { ...s.reviews };
          delete reviews[slug];
          const lastAt = { ...s.lastAt };
          delete lastAt[slug];
          // Dấu xoá: gộp với máy khác không được làm sống lại tiến độ cũ.
          return { stages, lapses, reviews, lastAt, resets: { ...s.resets, [slug]: new Date().toISOString() } };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}topic-study`,
      storage: storage<TopicStudyState>(),
      version: 2,
      // v2: lật thẻ + ABCD luôn bật, điền chỗ trống và gõ từ tắt mặc định — đưa lựa chọn cũ về mặc định một lần.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<TopicStudyState>;
        if (version < 2 && s.learnSettings) return { ...s, learnSettings: { ...s.learnSettings, kinds: [...DEFAULT_LEARN_SETTINGS.kinds] } } as TopicStudyState;
        return s as TopicStudyState;
      },
      partialize: (s) =>
        ({ stages: s.stages, scores: s.scores, starred: s.starred, lapses: s.lapses, reviews: s.reviews, leitnerMigrated: s.leitnerMigrated, resets: s.resets, mistakeLog: s.mistakeLog, learnSettings: s.learnSettings, lastAt: s.lastAt, studyTheme: s.studyTheme, studyFx: s.studyFx, activeRound: s.activeRound }) as TopicStudyState,
      // Bản lưu cũ chưa có trường cài đặt mới: trộn với mặc định thay vì để undefined.
      merge: (persisted, current) => {
        // Bài SAT Math đổi cấu trúc 29/09/2026: dời tiến độ theo từ sang bài mới.
        const p = remapTopicStudy((persisted ?? {}) as Partial<TopicStudyState>);
        const learnSettings = { ...DEFAULT_LEARN_SETTINGS, ...(p.learnSettings ?? {}) };
        // Bản lưu từ trước khi có dạng Điền chỗ trống: ai đang dùng đúng bộ dạng mặc định cũ thì có luôn dạng mới.
        const k = learnSettings.kinds;
        if (k.length === 3 && ['flash', 'mcq', 'type'].every((x) => k.includes(x as never))) learnSettings.kinds = [...DEFAULT_LEARN_SETTINGS.kinds];
        const studyTheme = isThemeId((p as { studyTheme?: unknown }).studyTheme) ? (p as { studyTheme: ThemeId }).studyTheme : 'scene';
        const studyFx = (p as { studyFx?: unknown }).studyFx === true;
        // Lịch ôn lưu bởi bản cũ có thể bị đẩy xa quá cửa sổ của hộp (trần 15 từ/ngày): kéo về, xếp từ hôm nay.
        const reviews = repairReviews((p as { reviews?: Record<string, Record<string, ReviewEntry>> }).reviews, todayKey());
        const resets = (p as { resets?: Record<string, string> }).resets ?? {};
        return { ...current, ...p, reviews, resets, learnSettings, studyTheme, studyFx };
      },
    },
  ),
);

/** Số từ đã NHỚ được (chặng 2) trong một bộ. */
export function masteredCount(stages: Record<string, WordStage> | undefined): number {
  return Object.values(stages ?? {}).filter((v) => v === 2).length;
}
