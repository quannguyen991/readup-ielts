import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { DEFAULT_LEARN_SETTINGS, type LearnSettings, type WordStage } from '@/services/vocab/topic-study';
import type { MistakeKind } from '@/services/vocab/mistake';

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
  /** Nhật ký lỗi đã gọi tên (mới nhất cuối), giữ tối đa 400 dòng. */
  mistakeLog: MistakeEntry[];
  logMistake: (slug: string, word: string, kind: MistakeKind) => void;
  /** Cài đặt màn Học — dùng chung mọi bộ, như một thói quen học của người dùng. */
  learnSettings: LearnSettings;
  /** slug → lần cuối mở một màn luyện của bộ (thẻ "Học lần cuối" ở thư viện bộ từ). */
  lastAt: Record<string, string>;
  /** Ghi mốc "vừa học bộ này" — mỗi màn luyện gọi một lần khi mở. */
  touch: (slug: string) => void;
  toggleStar: (slug: string, word: string) => void;
  setLearnSettings: (s: LearnSettings) => void;
  setStage: (slug: string, word: string, stage: WordStage) => void;
  addScore: (slug: string, score: number) => void;
  resetTopic: (slug: string) => void;
};

export const useTopicStudyStore = create<TopicStudyState>()(
  persist(
    (set) => ({
      stages: {},
      scores: {},
      starred: {},
      lapses: {},
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
      resetTopic: (slug) =>
        set((s) => {
          const stages = { ...s.stages };
          delete stages[slug];
          const lapses = { ...s.lapses };
          delete lapses[slug];
          return { stages, lapses };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}topic-study`,
      storage: storage<TopicStudyState>(),
      version: 1,
      partialize: (s) =>
        ({ stages: s.stages, scores: s.scores, starred: s.starred, lapses: s.lapses, mistakeLog: s.mistakeLog, learnSettings: s.learnSettings, lastAt: s.lastAt }) as TopicStudyState,
      // Bản lưu cũ chưa có trường cài đặt mới: trộn với mặc định thay vì để undefined.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<TopicStudyState>;
        return { ...current, ...p, learnSettings: { ...DEFAULT_LEARN_SETTINGS, ...(p.learnSettings ?? {}) } };
      },
    },
  ),
);

/** Số từ đã NHỚ được (chặng 2) trong một bộ. */
export function masteredCount(stages: Record<string, WordStage> | undefined): number {
  return Object.values(stages ?? {}).filter((v) => v === 2).length;
}
