import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_PREFS, sanitizePrefs, type BackdropChoice, type BackdropPrefs } from '@/data/backdrops';
import { STORAGE_PREFIX, storage } from './persist';

/** Nền tranh pixel của màn đọc báo — theo MÁY, mặc định TẮT. */
type State = BackdropPrefs & {
  setOn: (on: boolean) => void;
  setChoice: (choice: BackdropChoice) => void;
  setMotion: (motion: boolean) => void;
};

export const useBackdropStore = create<State>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFS,
      setOn: (on) => set({ on }),
      setChoice: (choice) => set({ choice, on: true }),
      setMotion: (motion) => set({ motion }),
    }),
    {
      name: `${STORAGE_PREFIX}reading-backdrop`,
      storage: storage<State>(),
      version: 1,
      partialize: (s) => ({ on: s.on, choice: s.choice, motion: s.motion }) as State,
      merge: (persisted, current) => ({ ...current, ...sanitizePrefs(persisted) }),
    },
  ),
);
