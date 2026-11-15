import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { MAX_ATTEMPTS, emptySynced, readSynced, storeItems, type HsaSynced, type StoredAttempt } from '@/services/hsa/attempts';
import { CRITERIA, type CriterionId } from '@/services/hsa/criteria';
import { placementIdOf } from '@/services/hsa/placement';
import type { DayPlan } from '@/services/hsa/plan';
import type { HsaProfile } from '@/services/hsa/profile';
import type { AttemptItem } from '@/services/hsa/scoring';

import { STORAGE_PREFIX, storage, uid } from './persist';

/**
 * Dữ liệu học HSA của người dùng: hồ sơ, từng lượt làm bài (gọn, theo mã câu), kế hoạch mỗi ngày và các
 * bài đã đánh dấu xong. Đồng bộ lên tài khoản qua khoá `hsa` (`services/sync/stores.ts`). KHÔNG có điểm xếp
 * hạng riêng: phút học và số câu đã làm được ghi vào nhật ký học chung (`useStudyStore`), nên bảng xếp
 * hạng là một, tính chung cho mọi nội dung.
 */
type HsaState = HsaSynced & {
  setProfile: (profile: HsaProfile) => void;
  recordAttempt: (input: { activity: string; items: readonly AttemptItem[]; seconds: number }) => { id: string };
  setPlan: (day: string, plan: DayPlan) => void;
  toggleTask: (day: string, taskId: string) => void;
  resetAll: () => void;
};

export const useHsaStore = create<HsaState>()(
  persist(
    (set) => ({
      ...emptySynced(),

      setProfile: (profile) => set({ profile }),

      recordAttempt: ({ activity, items, seconds }) => {
        const id = uid();
        const attempt: StoredAttempt = { id, activity, finishedAt: new Date().toISOString(), seconds: Math.max(0, Math.round(seconds)), items: storeItems(items) };
        set((state) => ({ attempts: [attempt, ...state.attempts].slice(0, MAX_ATTEMPTS) }));
        return { id };
      },

      setPlan: (day, plan) => set((state) => ({ plans: { ...state.plans, [day]: plan } })),

      toggleTask: (day, taskId) =>
        set((state) => {
          const key = `${day}|${taskId}`;
          const done = { ...state.done };
          if (done[key]) delete done[key];
          else done[key] = true;
          return { done };
        }),

      resetAll: () => set({ ...emptySynced() }),
    }),
    {
      name: `${STORAGE_PREFIX}hsa`,
      storage: storage<HsaState>(),
      // Dữ liệu từ ổ lưu có thể cũ hoặc hỏng: đọc qua `readSynced` rồi mới nhập vào kho.
      merge: (persisted, current) => ({ ...current, ...readSynced(persisted) }),
    },
  ),
);

export function hsaPayload(): HsaSynced {
  const s = useHsaStore.getState();
  return { profile: s.profile, attempts: s.attempts, plans: s.plans, done: s.done };
}

/** Phần nào của bài test đầu vào đã làm: mã lượt làm gần nhất của từng tiêu chí. */
export function placementAttempts(attempts: readonly StoredAttempt[]): Partial<Record<CriterionId, StoredAttempt>> {
  const out: Partial<Record<CriterionId, StoredAttempt>> = {};
  for (const a of attempts) {
    const id = placementIdOf(a.activity);
    if (id && !out[id]) out[id] = a;
  }
  return out;
}

export function placementDone(attempts: readonly StoredAttempt[]): boolean {
  const map = placementAttempts(attempts);
  return CRITERIA.every((c) => !!map[c.id]);
}
