import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, todayKey, uid } from './persist';
import type { QuestionType } from '@/types/database';

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
};

export type TestSession = {
  id: string;
  articleId: string;
  articleTitle: string;
  mode: 'practice' | 'mock_test';
  rawScore: number;
  total: number;
  accuracy: number;
  estimatedBand: number;
  durationMs: number;
  finishedAt: string;
  attempts: AttemptRecord[];
};

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

  setProgress: (articleId: string, percent: number, paragraph: number) => void;
  addSession: (session: Omit<TestSession, 'id' | 'finishedAt'>) => string;
  logStudyTime: (activity: StudyActivityKind, minutes: number) => void;
  logQuestions: (count: number) => void;
  logWordsReviewed: (count: number) => void;
  logWpm: (wpm: number) => void;
  toggleBookmark: (articleId: string) => void;
  setTargetBand: (band: number) => void;
  setDailyGoal: (minutes: number) => void;

  isBookmarked: (articleId: string) => boolean;
  getSession: (id: string) => TestSession | undefined;
  streak: () => { current: number; longest: number; days: string[] };
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
      byActivity: emptyActivity(),
    }
  );
}

/** Quy điểm thô 40 câu sang band IELTS Reading Academic (bảng quy đổi thông dụng). */
export function rawScoreToBand(correct: number, total: number): number {
  const scaled = total === 0 ? 0 : Math.round((correct / total) * 40);
  const table: Array<[number, number]> = [
    [39, 9],
    [37, 8.5],
    [35, 8],
    [33, 7.5],
    [30, 7],
    [27, 6.5],
    [23, 6],
    [19, 5.5],
    [15, 5],
    [13, 4.5],
    [10, 4],
    [8, 3.5],
    [6, 3],
    [0, 2.5],
  ];

  for (const [threshold, band] of table) {
    if (scaled >= threshold) return band;
  }
  return 2.5;
}

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

      logWpm: (wpm) =>
        set((state) => ({ readingWpm: [Math.round(wpm), ...state.readingWpm].slice(0, 60) })),

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

      streak: () => {
        const days = Object.values(get().daily)
          .filter((d) => d.minutes > 0 || d.questions > 0)
          .map((d) => d.date)
          .sort()
          .reverse();

        if (days.length === 0) return { current: 0, longest: 0, days: [] };

        const dayMs = 86_400_000;
        const today = new Date(todayKey()).getTime();
        const first = new Date(days[0] as string).getTime();

        let current = 0;
        // Chuỗi chỉ còn sống nếu hoạt động gần nhất là hôm nay hoặc hôm qua.
        if (today - first <= dayMs) {
          current = 1;
          for (let i = 1; i < days.length; i += 1) {
            const prev = new Date(days[i - 1] as string).getTime();
            const cur = new Date(days[i] as string).getTime();
            if (prev - cur === dayMs) current += 1;
            else break;
          }
        }

        let longest = 1;
        let run = 1;
        for (let i = 1; i < days.length; i += 1) {
          const prev = new Date(days[i - 1] as string).getTime();
          const cur = new Date(days[i] as string).getTime();
          if (prev - cur === dayMs) run += 1;
          else run = 1;
          longest = Math.max(longest, run);
        }

        return { current, longest: Math.max(longest, current), days };
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
    { name: `${STORAGE_PREFIX}study`, storage: storage<StudyState>(), version: 1 },
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
  return useMemo(() => streak(), [daily, streak]);
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
