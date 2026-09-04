import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, uid } from './persist';
import type {
  MathDomain,
  MathErrorTag,
  MathFormat,
  MathSessionMode,
  MathSkill,
} from '@/lib/math/types';
import { readDiagnostic, type DiagnosticReading } from '@/services/math/diagnostic';
import type { ModuleTier } from '@/services/math/scoring';
import {
  countErrorTags,
  rankSkillsToPractice,
  summarizeByDomain,
  summarizeBySkill,
} from '@/services/math/scoring';

/**
 * Lịch sử làm bài Math.
 *
 * KHÔNG LƯU NỘI DUNG CÂU HỎI, chỉ lưu `itemId`. Id có dạng
 * `<template_slug>:<seed>` và bộ sinh là hàm thuần theo id, nên mở lại màn
 * Review là dựng lại đúng câu ấy — kể cả đề bài, lựa chọn, thứ tự lựa chọn và
 * lời giải. Lưu cả câu hỏi vào storage vừa phình dung lượng vừa tạo ra hai
 * nguồn sự thật có thể lệch nhau khi template được sửa.
 *
 * Đổi lại: SỬA MỘT TEMPLATE LÀ ĐỔI LUÔN NHỮNG CÂU CŨ dựng lại từ id của nó. Với
 * bài đã chấm xong thì kết quả (đúng/sai, nhãn lỗi) vẫn giữ nguyên vì chúng
 * được lưu thật; chỉ phần hiển thị lại câu hỏi là theo template mới.
 */

export type MathAttemptRecord = {
  itemId: string;
  skill: MathSkill;
  domain: MathDomain;
  format: MathFormat;
  /** mcq: chỉ số lựa chọn đã chọn. grid-in: đúng chuỗi người học đã gõ. */
  userAnswer: string | null;
  isCorrect: boolean;
  /** Nhãn lỗi của nhiễu đã chọn. null khi đúng, khi bỏ trống, hoặc khi nhiễu không có nhãn. */
  errorTag: MathErrorTag | null;
  timeSpentMs: number;
};

export type MathSessionRecord = {
  id: string;
  mode: MathSessionMode;
  /** Chỉ lượt drill và lượt học một kỹ năng mới có giá trị ở đây. */
  skill: MathSkill | null;
  /** Bộ đề trong lộ trình. null với chẩn đoán, mock và drill tự do. */
  setId: string | null;
  attempts: MathAttemptRecord[];
  rawScore: number;
  total: number;
  durationMs: number;
  finishedAt: string;
  /** Chỉ mock: bậc độ khó của module 2. */
  moduleTier: ModuleTier | null;
  /** Chỉ mock: điểm ƯỚC LƯỢNG 200–800. null với mọi chế độ khác. */
  estimatedScore: number | null;
};

type MathState = {
  sessions: MathSessionRecord[];
  addSession: (session: Omit<MathSessionRecord, 'id' | 'finishedAt'>) => string;
  getSession: (id: string) => MathSessionRecord | undefined;
  clearHistory: () => void;
};

export const useMathStore = create<MathState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (session) => {
        const id = uid();
        const record: MathSessionRecord = {
          ...session,
          id,
          finishedAt: new Date().toISOString(),
        };
        set((state) => ({ sessions: [record, ...state.sessions] }));
        return id;
      },

      getSession: (id) => get().sessions.find((s) => s.id === id),

      clearHistory: () => set({ sessions: [] }),
    }),
    { name: `${STORAGE_PREFIX}math`, storage: storage<MathState>() },
  ),
);

/** Mọi lượt trả lời đã ghi, mới nhất trước. */
function allAttempts(sessions: MathSessionRecord[]): MathAttemptRecord[] {
  return sessions.flatMap((s) => s.attempts);
}

export function useMathSkillStats() {
  const sessions = useMathStore((s) => s.sessions);
  return useMemo(() => summarizeBySkill(allAttempts(sessions)), [sessions]);
}

export function useMathDomainStats() {
  const sessions = useMathStore((s) => s.sessions);
  return useMemo(() => summarizeByDomain(allAttempts(sessions)), [sessions]);
}

export function useMathErrorTags() {
  const sessions = useMathStore((s) => s.sessions);
  return useMemo(() => countErrorTags(allAttempts(sessions)), [sessions]);
}

/** Kỹ năng nên luyện tiếp, đã xếp hạng. */
export function useMathPriority() {
  const stats = useMathSkillStats();
  return useMemo(() => rankSkillsToPractice(stats), [stats]);
}

/**
 * Bài chẩn đoán gần nhất, đã đọc thành nhận định.
 *
 * Chỉ lấy MỘT lượt chẩn đoán chứ không gộp mọi lượt: bài chẩn đoán là một lát
 * cắt tại một thời điểm, gộp hai lần cách nhau ba tuần lại thì con số không còn
 * nói về thời điểm nào cả.
 */
export function useLatestDiagnostic(): { session: MathSessionRecord; reading: DiagnosticReading } | null {
  const sessions = useMathStore((s) => s.sessions);
  return useMemo(() => {
    const session = sessions.find((s) => s.mode === 'diagnostic');
    if (!session) return null;
    return { session, reading: readDiagnostic(session.attempts) };
  }, [sessions]);
}

/**
 * Tiến độ theo BỘ ĐỀ của lộ trình.
 *
 * `rounds` là số lần đã làm xong bộ ấy, và nó chính là hạt của lần làm tiếp
 * theo — nhờ vậy làm lại lần hai ra đề khác chứ không phải đề cũ.
 */
export type SetProgress = {
  rounds: number;
  bestRatio: number;
  lastRatio: number;
};

export function useMathSetProgress(): Record<string, SetProgress> {
  const sessions = useMathStore((s) => s.sessions);
  return useMemo(() => {
    const map: Record<string, SetProgress> = {};
    // Duyệt từ cũ tới mới để `lastRatio` cuối cùng là lượt gần nhất.
    for (const session of [...sessions].reverse()) {
      if (!session.setId || session.total === 0) continue;
      const ratio = session.rawScore / session.total;
      const current = map[session.setId];
      map[session.setId] = {
        rounds: (current?.rounds ?? 0) + 1,
        bestRatio: Math.max(current?.bestRatio ?? 0, ratio),
        lastRatio: ratio,
      };
    }
    return map;
  }, [sessions]);
}

export function useMathTotals() {
  const sessions = useMathStore((s) => s.sessions);
  return useMemo(() => {
    const attempts = allAttempts(sessions);
    const mocks = sessions.filter((s) => s.mode === 'mock' && s.estimatedScore !== null);
    return {
      sessions: sessions.length,
      questions: attempts.length,
      correct: attempts.filter((a) => a.isCorrect).length,
      bestMockScore: mocks.length === 0 ? null : Math.max(...mocks.map((s) => s.estimatedScore ?? 0)),
      latestMockScore: mocks[0]?.estimatedScore ?? null,
    };
  }, [sessions]);
}
