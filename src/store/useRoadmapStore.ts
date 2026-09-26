import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { buildCustomPlan, type CustomPlan, type PlanInput } from '@/services/plan/custom';

/**
 * Lộ trình của người học: những gì họ đã khai (mục tiêu, ngày thi, giờ học) và
 * những khối họ tự đánh dấu là đã làm. Bản thân lộ trình KHÔNG lưu — nó dựng lại
 * từ `input` mỗi lần (`buildCustomPlan` là hàm thuần), nên đổi luật chia giờ là
 * lộ trình của mọi người đổi theo, không có bản cũ nằm kẹt trong máy.
 *
 * Chưa khai gì thì `input` là null và mọi nơi hiện lời mời lập lộ trình —
 * không bao giờ hiện một lộ trình mẫu như thể đó là của người học.
 */
export type RoadmapState = {
  input: PlanInput | null;
  /** Khối đã làm, khoá theo `PlanBlock.id` ("YYYY-MM-DD:n"). */
  done: Record<string, true>;
  updatedAt: string | null;
  setInput: (input: PlanInput) => void;
  toggleDone: (blockId: string) => void;
  reset: () => void;
};

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set) => ({
      input: null,
      done: {},
      updatedAt: null,
      setInput: (input) => set({ input, updatedAt: new Date().toISOString() }),
      toggleDone: (blockId) =>
        set((s) => {
          const done = { ...s.done };
          if (done[blockId]) delete done[blockId];
          else done[blockId] = true;
          return { done, updatedAt: new Date().toISOString() };
        }),
      reset: () => set({ input: null, done: {}, updatedAt: new Date().toISOString() }),
    }),
    {
      name: `${STORAGE_PREFIX}roadmap`,
      storage: storage<RoadmapState>(),
      version: 1,
      partialize: (s) => ({ input: s.input, done: s.done, updatedAt: s.updatedAt }) as RoadmapState,
    },
  ),
);

export type RoadmapPayload = Pick<RoadmapState, 'input' | 'done' | 'updatedAt'>;

/**
 * Gộp hai máy: bản khai mới hơn thắng (người học sửa lộ trình ở đâu thì theo
 * đó), còn dấu "đã làm" thì hợp lại — làm ở máy nào cũng là đã làm.
 */
export function mergeRoadmap(local: RoadmapPayload | null, remote: RoadmapPayload | null): RoadmapPayload {
  if (!remote) return local ?? { input: null, done: {}, updatedAt: null };
  if (!local) return remote;
  const newer = (local.updatedAt ?? '') >= (remote.updatedAt ?? '') ? local : remote;
  return { input: newer.input, done: { ...remote.done, ...local.done }, updatedAt: newer.updatedAt };
}

/** Lộ trình dựng từ bản khai, nhớ theo bản khai. */
export function useCustomPlan(): CustomPlan | null {
  const input = useRoadmapStore((s) => s.input);
  return useMemo(() => (input ? buildCustomPlan(input) : null), [input]);
}
