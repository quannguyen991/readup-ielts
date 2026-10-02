import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { MAX_LISTENING_ATTEMPTS } from '@/services/listening/attempts';
import type { ListeningAttempt } from '@/services/listening/types';

/**
 * Listening: lượt làm bài (đồng bộ lên tài khoản bằng khoá `listening`) và
 * cài đặt phòng thi (chỉ ở máy: tốc độ, thi thật, tự phát).
 */
type State = {
  attempts: ListeningAttempt[];
  settings: { realTest: boolean; speed: number; autoPlay: boolean };
  add: (a: ListeningAttempt) => void;
  remove: (id: string) => void;
  setSettings: (patch: Partial<State['settings']>) => void;
};

export const useListeningStore = create<State>()(
  persist(
    (set) => ({
      attempts: [],
      settings: { realTest: false, speed: 1, autoPlay: true },
      add: (a) => set((s) => ({ attempts: [a, ...s.attempts.filter((x) => x.id !== a.id)].slice(0, MAX_LISTENING_ATTEMPTS) })),
      remove: (id) => set((s) => ({ attempts: s.attempts.filter((a) => a.id !== id) })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: `${STORAGE_PREFIX}listening`,
      storage: storage<State>(),
      version: 1,
      partialize: (s) => ({ attempts: s.attempts, settings: s.settings }) as State,
    },
  ),
);
