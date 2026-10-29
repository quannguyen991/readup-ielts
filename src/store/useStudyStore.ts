import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, todayKey, uid } from './persist';
import { useRewardStore } from './useRewardStore';
import { currentStreak, isActiveDay, longestStreak } from '@/services/gamification/points';
import type { EvidenceMark } from '@/services/proofloop/types';
import type { ExamKind, QuestionType } from '@/types/database';

/**
 * Tiến độ học: đọc tới đâu, làm bài ra sao, chuỗi ngày, thời gian theo hoạt động.
 * Đây là nguồn cho Dashboard và Progress.
 */

export type StudyActivityKind = 'practice' | 'mock_test' | 'review' | 'reading_library';

export type AttemptRecord = {
  questionId: string;
  type: QuestionType;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentMs: number;
  markedForReview: boolean;
  /**
   * PROOFLOOP — chỗ người học tự khoanh làm bằng chứng cho câu trả lời này.
   *
   * TUỲ CHỌN, và phải giữ như vậy: mọi lượt làm bài đã lưu từ trước đều không
   * có trường này, còn bài SAT và bài dán tay thì chưa bật ProofLoop. Bắt buộc
   * nó là làm hỏng toàn bộ lịch sử cũ.
   *
   * `undefined` nghĩa là KHÔNG ĐO — không phải đo rồi thấy sai. Hai thứ đó dẫn
   * tới hai trạng thái khác nhau ở `services/proofloop/state.ts`, và gộp chúng
   * lại là biến một lượt không được hỏi thành một lượt bị chấm là chọn sai.
   */
  evidenceMark?: EvidenceMark | null;
};

export type TestSession = {
  id: string;
  articleId: string;
  articleTitle: string;
  /** Kỳ thi của bài đã làm — quyết định lượt này có quy ra band được hay không. */
  exam: ExamKind;
  mode: 'practice' | 'mock_test';
  /**
   * Đường dẫn hub của Mock Test chứa passage này; chỉ có ở lượt thi thử. Hub so khớp theo nó để
   * một passage dùng lại ở đề khác (Đổi bộ đề) không bị tính là đã làm.
   */
  mockKey?: string;
  rawScore: number;
  total: number;
  accuracy: number;
  /**
   * null với lượt làm bài SAT: band là thang của riêng IELTS, gắn "Band 4.5"
   * lên một bài SAT là nói sai. Mọi chỗ tính trung bình band phải lọc bỏ null
   * chứ không được coi là 0.
   */
  estimatedBand: number | null;
  durationMs: number;
  finishedAt: string;
  attempts: AttemptRecord[];
};

/** Một lượt làm bộ từ vựng (quiz/kiểm tra): để hiện trong Lịch sử học. Số câu đã đếm vào `daily` riêng. */
export type VocabRun = {
  id: string;
  deck: string;
  title: string;
  correct: number;
  total: number;
  finishedAt: string;
};

/** Khớp `MAX_VOCAB_RUNS` ở services/sync/store-merges.ts (file đó không được import vào store). */
const MAX_VOCAB_RUNS = 200;

export type ReadingProgress = {
  articleId: string;
  percentCompleted: number;
  lastParagraph: number;
  lastReadAt: string;
};

export type DailyRecord = {
  date: string;
  minutes: number;
  questions: number;
  wordsReviewed: number;
  /**
   * Số việc đã hoàn thành trong ngày (nghe, viết, nói, nhiệm vụ…) — để ngày có việc nhưng
   * chưa có phút/câu vẫn được tính vào chuỗi. Ngày cũ không có trường này: đọc qua `?? 0`.
   */
  events?: number;
  /** Từ đã học trong ngày, khoá dạng `bộ|từ` và không trùng: nguồn cho lịch ôn chung. */
  studied?: string[];
  byActivity: Record<StudyActivityKind, number>;
};

type StudyState = {
  progress: Record<string, ReadingProgress>;
  sessions: TestSession[];
  daily: Record<string, DailyRecord>;
  bookmarks: string[];
  targetBand: number;
  dailyGoalMinutes: number;
  readingWpm: number[];
  vocabRuns: VocabRun[];

  setProgress: (articleId: string, percent: number, paragraph: number) => void;
  addSession: (session: Omit<TestSession, 'id' | 'finishedAt'>) => string;
  logStudyTime: (activity: StudyActivityKind, minutes: number) => void;
  logQuestions: (count: number) => void;
  logWordStudied: (slug: string, word: string) => void;
  logWordsReviewed: (count: number) => void;
  /** Ghi một việc đã hoàn thành (không có phút hay câu): chỉ để ngày đó được tính là ngày học. */
  logEvent: () => void;
  logWpm: (wpm: number) => void;
  /** Ghi một lượt làm bộ từ vựng vào lịch sử, và tính là một việc đã làm trong ngày. */
  logVocabRun: (run: { deck: string; title: string; correct: number; total: number }) => void;
  /** Ghi hoặc cập nhật một lượt đang học theo `id`: lần đầu tạo dòng, các lần sau chỉ sửa dòng đó. */
  recordVocabRun: (id: string, run: { deck: string; title: string; correct: number; total: number }) => void;
  toggleBookmark: (articleId: string) => void;
  setTargetBand: (band: number) => void;
  setDailyGoal: (minutes: number) => void;

  isBookmarked: (articleId: string) => boolean;
  getSession: (id: string) => TestSession | undefined;
  /** Chuỗi ngày: hiện tại, dài nhất, và các ngày có hoạt động (mới trước). Ngày đông băng tính như đã học. */
  streak: (frozen?: readonly string[]) => { current: number; longest: number; days: string[] };
  accuracyByType: () => Array<{ type: QuestionType; correct: number; total: number; percent: number }>;
  recentDays: (count: number) => DailyRecord[];
};

const emptyActivity = (): Record<StudyActivityKind, number> => ({
  practice: 0,
  mock_test: 0,
  review: 0,
  reading_library: 0,
});

function ensureDay(state: StudyState, date = todayKey()): DailyRecord {
  return (
    state.daily[date] ?? {
      date,
      minutes: 0,
      questions: 0,
      wordsReviewed: 0,
      events: 0,
      byActivity: emptyActivity(),
    }
  );
}

export { rawScoreToBand } from '@/lib/band';

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      progress: {},
      sessions: [],
      daily: {},
      bookmarks: [],
      targetBand: 7,
      dailyGoalMinutes: 60,
      readingWpm: [],
      vocabRuns: [],

      setProgress: (articleId, percent, paragraph) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [articleId]: {
              articleId,
              percentCompleted: Math.max(
                state.progress[articleId]?.percentCompleted ?? 0,
                Math.round(percent),
              ),
              lastParagraph: paragraph,
              lastReadAt: new Date().toISOString(),
            },
          },
        })),

      addSession: (session) => {
        const id = uid();
        set((state) => {
          const date = todayKey();
          const day = ensureDay(state, date);
          const activity: StudyActivityKind =
            session.mode === 'mock_test' ? 'mock_test' : 'practice';

          return {
            sessions: [
              { ...session, id, finishedAt: new Date().toISOString() },
              ...state.sessions,
            ].slice(0, 500),
            daily: {
              ...state.daily,
              [date]: {
                ...day,
                questions: day.questions + session.total,
                minutes: day.minutes + Math.round(session.durationMs / 60000),
                byActivity: {
                  ...day.byActivity,
                  [activity]: day.byActivity[activity] + Math.round(session.durationMs / 60000),
                },
              },
            },
          };
        });
        return id;
      },

      logStudyTime: (activity, minutes) =>
        set((state) => {
          const date = todayKey();
          const day = ensureDay(state, date);
          return {
            daily: {
              ...state.daily,
              [date]: {
                ...day,
                minutes: day.minutes + minutes,
                byActivity: { ...day.byActivity, [activity]: day.byActivity[activity] + minutes },
              },
            },
          };
        }),

      logQuestions: (count) =>
        set((state) => {
          const date = todayKey();
          const day = ensureDay(state, date);
          return { daily: { ...state.daily, [date]: { ...day, questions: day.questions + count } } };
        }),

      logWordStudied: (slug, word) =>
        set((state) => {
          const date = todayKey();
          const day = ensureDay(state, date);
          const key = `${slug}|${word}`;
          const studied = day.studied ?? [];
          if (studied.includes(key)) return state;
          // Mỗi từ lần đầu học trong ngày cũng được tính vào số từ đã ôn của ngày đó.
          return { daily: { ...state.daily, [date]: { ...day, studied: [...studied, key], wordsReviewed: day.wordsReviewed + 1 } } };
        }),

      logWordsReviewed: (count) =>
        set((state) => {
          const date = todayKey();
          const day = ensureDay(state, date);
          return {
            daily: {
              ...state.daily,
              [date]: { ...day, wordsReviewed: day.wordsReviewed + count },
            },
          };
        }),

      logEvent: () =>
        set((state) => {
          const date = todayKey();
          const day = ensureDay(state, date);
          return { daily: { ...state.daily, [date]: { ...day, events: (day.events ?? 0) + 1 } } };
        }),

      logWpm: (wpm) =>
        set((state) => ({ readingWpm: [Math.round(wpm), ...state.readingWpm].slice(0, 60) })),

      logVocabRun: (run) =>
        set((state) => {
          const date = todayKey();
          const day = ensureDay(state, date);
          const entry: VocabRun = { ...run, id: uid(), finishedAt: new Date().toISOString() };
          return {
            vocabRuns: [entry, ...state.vocabRuns].slice(0, MAX_VOCAB_RUNS),
            daily: { ...state.daily, [date]: { ...day, events: (day.events ?? 0) + 1 } },
          };
        }),

      recordVocabRun: (id, run) =>
        set((state) => {
          const at = new Date().toISOString();
          if (state.vocabRuns.some((v) => v.id === id)) {
            return { vocabRuns: state.vocabRuns.map((v) => (v.id === id ? { ...v, ...run, finishedAt: at } : v)) };
          }
          const date = todayKey();
          const day = ensureDay(state, date);
          return {
            vocabRuns: [{ ...run, id, finishedAt: at }, ...state.vocabRuns].slice(0, MAX_VOCAB_RUNS),
            daily: { ...state.daily, [date]: { ...day, events: (day.events ?? 0) + 1 } },
          };
        }),

      toggleBookmark: (articleId) =>
        set((state) => ({
          bookmarks: state.bookmarks.includes(articleId)
            ? state.bookmarks.filter((id) => id !== articleId)
            : [articleId, ...state.bookmarks],
        })),

      setTargetBand: (band) => set({ targetBand: band }),
      setDailyGoal: (minutes) => set({ dailyGoalMinutes: minutes }),

      isBookmarked: (articleId) => get().bookmarks.includes(articleId),
      getSession: (id) => get().sessions.find((s) => s.id === id),

      streak: (frozen = []) => {
        const daily = get().daily;
        const days = Object.values(daily)
          .filter(isActiveDay)
          .map((d) => d.date)
          .sort()
          .reverse();
        // Luật chuỗi nằm ở points.ts, dùng chung với Hồ sơ, Xếp hạng và Cửa hàng.
        return {
          current: currentStreak(daily, new Date(), frozen),
          longest: longestStreak(daily, frozen),
          days,
        };
      },

      accuracyByType: () => {
        const tally = new Map<QuestionType, { correct: number; total: number }>();

        for (const session of get().sessions) {
          for (const attempt of session.attempts) {
            const entry = tally.get(attempt.type) ?? { correct: 0, total: 0 };
            entry.total += 1;
            if (attempt.isCorrect) entry.correct += 1;
            tally.set(attempt.type, entry);
          }
        }

        return [...tally.entries()]
          .map(([type, v]) => ({
            type,
            correct: v.correct,
            total: v.total,
            percent: v.total === 0 ? 0 : Math.round((v.correct / v.total) * 100),
          }))
          .sort((a, b) => a.percent - b.percent);
      },

      recentDays: (count) => {
        const out: DailyRecord[] = [];
        const now = new Date(todayKey());

        for (let i = count - 1; i >= 0; i -= 1) {
          const date = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
          out.push(
            get().daily[date] ?? {
              date,
              minutes: 0,
              questions: 0,
              wordsReviewed: 0,
              byActivity: emptyActivity(),
            },
          );
        }

        return out;
      },
    }),
    {
      name: `${STORAGE_PREFIX}study`,
      storage: storage<StudyState>(),
      // v2: TestSession có thêm `exam`. PHẢI migrate chứ không được bỏ state —
      // đây là toàn bộ lịch sử luyện tập của người dùng. Lượt cũ đều là IELTS
      // vì lúc đó kho bài chưa có SAT.
      version: 2,
      migrate: (persisted) => {
        const state = persisted as StudyState | undefined;
        if (!state?.sessions) return state as StudyState;

        return {
          ...state,
          sessions: state.sessions.map((session) => ({
            ...session,
            exam: session.exam ?? 'ielts',
          })),
        };
      },
    },
  ),
);

/**
 * Hook cho các số liệu dẫn xuất.
 *
 * Gọi thẳng `useStudyStore((s) => s.streak())` trong component sẽ tạo object
 * mới mỗi lần render → zustand coi như state đổi → vòng lặp render vô hạn.
 * Các hook dưới đây chỉ select state thô rồi memo hoá kết quả.
 */
export function useStreak(): { current: number; longest: number; days: string[] } {
  const daily = useStudyStore((s) => s.daily);
  const streak = useStudyStore((s) => s.streak);
  const frozen = useRewardStore((s) => s.frozenDays);
  return useMemo(() => streak(frozen), [daily, frozen, streak]);
}

export function useAccuracyByType(): ReturnType<StudyState['accuracyByType']> {
  const sessions = useStudyStore((s) => s.sessions);
  const accuracyByType = useStudyStore((s) => s.accuracyByType);
  return useMemo(() => accuracyByType(), [sessions, accuracyByType]);
}

export function useRecentDays(count: number): DailyRecord[] {
  const daily = useStudyStore((s) => s.daily);
  const recentDays = useStudyStore((s) => s.recentDays);
  return useMemo(() => recentDays(count), [daily, count, recentDays]);
}
