import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, uid } from './persist';
import type { SentenceTopic } from '@/data/sentence-drills';
import {
  addExpressRound,
  bumpStat,
  expressScore,
  itemKey,
  mergeStats,
  paragraphResult,
  statsFromSessions,
  type LearnMode,
  type StatMap,
} from '@/services/sentence/learn-status';

/**
 * Lịch sử luyện tập của hai bài cấp câu: chép chính tả và dịch Việt→Anh.
 *
 * MỘT STORE CHUNG CHO CẢ HAI, phân biệt bằng `mode` — giống cách `useMathStore`
 * dùng một `sessions` cho cả chẩn đoán/drill/mock. Hai bài dùng chung đúng một
 * hình dạng "một buổi = nhiều lượt trả lời + tổng kết", chỉ khác Ở CHỖ một lượt
 * trả lời của dictation có `accuracy` (chấm được thật), còn của translation có
 * `selfCorrect` (người học tự đánh giá, vì dịch không có một đáp án đúng duy nhất
 * — xem lý do đầy đủ ở đầu `sentence-drills.ts`).
 *
 * CHỈ LƯU LOCAL (zustand persist), không đồng bộ Supabase — đúng tiền lệ của
 * `useMathStore` (lịch sử làm bài Math cũng chỉ lưu trên máy). Tính năng còn
 * đang ở mẻ khởi đầu 30 câu/bài; thêm một bảng + route + RLS cho lịch sử luyện
 * tập là việc làm sau, khi đã biết tính năng có được dùng thật hay không.
 */

export type DictationAttempt = {
  itemId: string;
  topic: SentenceTopic;
  typed: string;
  accuracy: number;
  timeSpentMs: number;
};

export type TranslationAttempt = {
  itemId: string;
  topic: SentenceTopic;
  typed: string;
  /** Người học tự đánh giá sau khi so với đáp án mẫu — không có chấm tự động. */
  selfCorrect: boolean;
  timeSpentMs: number;
};

export type SentenceSessionRecord =
  | {
      id: string;
      mode: 'dictation';
      attempts: DictationAttempt[];
      total: number;
      durationMs: number;
      finishedAt: string;
      /**
       * Bộ đề đã luyện, nếu lượt này bắt đầu từ thư viện bộ đề.
       *
       * Tuỳ chọn chứ không bắt buộc: lượt bốc ngẫu nhiên 10 câu từ kho cũ không
       * thuộc bộ nào, và những lượt đã lưu trên máy người dùng TRƯỚC khi có thư
       * viện bộ đề cũng không có trường này.
       */
      setId?: string;
    }
  | {
      id: string;
      mode: 'translation';
      attempts: TranslationAttempt[];
      total: number;
      durationMs: number;
      finishedAt: string;
      /** Bộ đề đã luyện — cùng lý do tuỳ chọn như ở nhánh `dictation`. */
      setId?: string;
    };

/** Một lần nộp bài Tự diễn đạt: câu người học viết + lỗi đã chỉ ra. */
export type ExpressRound = {
  text: string;
  at: string;
  /** Số lỗi cứng ở lần nộp này. */
  errors: number;
  /** Đã đúng ý, đúng cấu trúc đích. */
  passed: boolean;
};

export type ExpressRecord = {
  rounds: ExpressRound[];
  /** Đã xem mức gợi ý cao nhất bao nhiêu (0–3). */
  hintLevel: number;
};

/** Bài Viết cả đoạn đã nộp (mỗi lần nộp là một dòng). */
export type ParagraphSubmission = {
  id: string;
  promptId: string;
  text: string;
  at: string;
  sentences: number;
  /** Số câu không còn lỗi cứng. */
  cleanSentences: number;
  words: number;
  /** Số câu tối thiểu của đề (để tính "đã học"). */
  minSentences?: number;
};

type SentenceState = {
  sessions: SentenceSessionRecord[];
  /** Thống kê theo từng câu, ghi ngay khi xong câu. Khoá: `mode:itemId`. */
  itemStats: StatMap;
  /** Tự diễn đạt: lịch sử các lần chỉnh, khoá theo itemId. */
  express: Record<string, ExpressRecord>;
  /** Viết cả đoạn: các bài đã nộp, mới nhất trước. */
  paragraphs: ParagraphSubmission[];
  addSession: (session: Omit<SentenceSessionRecord, 'id' | 'finishedAt'>) => string;
  /** Ghi một lượt làm câu (điểm 0–1, `passed` = tính là đã học). */
  recordItem: (mode: LearnMode, itemId: string, score: number, passed: boolean) => void;
  recordExpressRound: (itemId: string, round: Omit<ExpressRound, 'at'>, hintLevel: number) => void;
  addParagraph: (entry: Omit<ParagraphSubmission, 'id' | 'at'>) => string;
  clearHistory: () => void;
};

export const useSentenceStore = create<SentenceState>()(
  persist(
    (set) => ({
      sessions: [],
      itemStats: {},
      express: {},
      paragraphs: [],

      addSession: (session) => {
        const id = uid();
        const record = { ...session, id, finishedAt: new Date().toISOString() } as SentenceSessionRecord;
        set((state) => ({ sessions: [record, ...state.sessions] }));
        return id;
      },

      recordItem: (mode, itemId, score, passed) =>
        set((state) => {
          const key = itemKey(mode, itemId);
          // Câu chưa có ghi riêng thì khởi từ lịch sử cũ để `tries` không tụt về 0.
          const base = state.itemStats[key] ?? statsFromSessions(state.sessions)[key];
          return { itemStats: { ...state.itemStats, [key]: bumpStat(base, score, passed, new Date().toISOString()) } };
        }),

      recordExpressRound: (itemId, round, hintLevel) =>
        set((state) => {
          const prev = state.express[itemId];
          const at = new Date().toISOString();
          const rec: ExpressRecord = addExpressRound(prev, { ...round, at }, hintLevel);
          const key = itemKey('express', itemId);
          const score = expressScore(round);
          const base = state.itemStats[key];
          return {
            express: { ...state.express, [itemId]: rec },
            itemStats: { ...state.itemStats, [key]: bumpStat(base, score, round.passed, at) },
          };
        }),

      addParagraph: (entry) => {
        const id = uid();
        const at = new Date().toISOString();
        set((state) => {
          const key = itemKey('paragraph', entry.promptId);
          const base = state.itemStats[key];
          const res = paragraphResult(entry.sentences, entry.cleanSentences, entry.minSentences ?? 4);
          return {
            paragraphs: [{ ...entry, id, at }, ...state.paragraphs].slice(0, 60),
            itemStats: { ...state.itemStats, [key]: bumpStat(base, res.score, res.passed, at) },
          };
        });
        return id;
      },

      clearHistory: () => set({ sessions: [], itemStats: {}, express: {}, paragraphs: [] }),
    }),
    { name: `${STORAGE_PREFIX}sentence`, storage: storage<SentenceState>() },
  ),
);

/** Điểm một buổi dictation: tỉ lệ trung bình các lượt trả lời trong buổi đó. */
function dictationSessionScore(session: Extract<SentenceSessionRecord, { mode: 'dictation' }>): number {
  if (session.attempts.length === 0) return 0;
  const sum = session.attempts.reduce((acc, a) => acc + a.accuracy, 0);
  return sum / session.attempts.length;
}

/** Điểm một buổi translation: tỉ lệ câu người học tự đánh giá là đúng. */
function translationSessionScore(session: Extract<SentenceSessionRecord, { mode: 'translation' }>): number {
  if (session.attempts.length === 0) return 0;
  return session.attempts.filter((a) => a.selfCorrect).length / session.attempts.length;
}

export type SentenceModeStats = {
  sessions: number;
  attempts: number;
  /** Trung bình accuracy (dictation) hoặc tỉ lệ tự-đúng (translation) trên MỌI lượt, null nếu chưa luyện lượt nào. */
  avgScore: number | null;
  /** Điểm buổi GẦN NHẤT — để biết "lần vừa rồi thế nào" chứ không chỉ trung bình toàn thời gian. */
  latestScore: number | null;
};

function statsFor(sessions: SentenceSessionRecord[], mode: 'dictation' | 'translation'): SentenceModeStats {
  const matched = sessions.filter((s): s is Extract<SentenceSessionRecord, { mode: typeof mode }> => s.mode === mode);
  const attempts = matched.reduce((acc, s) => acc + s.attempts.length, 0);
  if (matched.length === 0) {
    return { sessions: 0, attempts: 0, avgScore: null, latestScore: null };
  }
  const scores = matched.map((s) => (mode === 'dictation' ? dictationSessionScore(s as never) : translationSessionScore(s as never)));
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { sessions: matched.length, attempts, avgScore, latestScore: scores[0] ?? null };
}

/** Thống kê từng câu: nguồn cũ (bài đã xong) + ghi mới theo từng câu. */
export function useLearnStats(): StatMap {
  const sessions = useSentenceStore((s) => s.sessions);
  const itemStats = useSentenceStore((s) => s.itemStats);
  return useMemo(() => mergeStats(statsFromSessions(sessions), itemStats), [sessions, itemStats]);
}

export function useSentenceStats(): { dictation: SentenceModeStats; translation: SentenceModeStats } {
  const sessions = useSentenceStore((s) => s.sessions);
  return useMemo(
    () => ({
      dictation: statsFor(sessions, 'dictation'),
      translation: statsFor(sessions, 'translation'),
    }),
    [sessions],
  );
}
