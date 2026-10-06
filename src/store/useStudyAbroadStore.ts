import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { DEFAULT_DORM_DECORATIONS, STUDY_ABROAD_DECORATIONS, type DormSlot } from '@/data/study-abroad-dorm';

type StudyAbroadState = {
  completed: string[];
  decorations: Record<DormSlot, string>;
  restedAt: string | null;
  completeMission: (id: string) => void;
  setDecoration: (slot: DormSlot, itemId: string) => void;
  rest: () => void;
  reset: () => void;
};

export const useStudyAbroadStore = create<StudyAbroadState>()(
  persist(
    (set) => ({
      completed: [],
      decorations: { ...DEFAULT_DORM_DECORATIONS },
      restedAt: null,
      completeMission: (id) => set((state) => state.completed.includes(id) ? state : { completed: [...state.completed, id] }),
      setDecoration: (slot, itemId) => set((state) => {
        const item = STUDY_ABROAD_DECORATIONS.find((decoration) => decoration.id === itemId && decoration.slot === slot);
        if (!item || (item.unlockMission && !state.completed.includes(item.unlockMission))) return state;
        return { decorations: { ...state.decorations, [slot]: itemId } };
      }),
      rest: () => set({ restedAt: new Date().toISOString() }),
      reset: () => set({ completed: [], decorations: { ...DEFAULT_DORM_DECORATIONS }, restedAt: null }),
    }),
    {
      name: `${STORAGE_PREFIX}study-abroad`,
      storage: storage<StudyAbroadState>(),
      version: 1,
      partialize: (state) => ({ completed: state.completed, decorations: state.decorations, restedAt: state.restedAt }) as StudyAbroadState,
      merge: (persisted, current) => {
        const saved = persisted as Partial<StudyAbroadState>;
        return {
          ...current,
          ...saved,
          decorations: { ...DEFAULT_DORM_DECORATIONS, ...(saved.decorations ?? {}) },
          completeMission: current.completeMission,
          setDecoration: current.setDecoration,
          rest: current.rest,
          reset: current.reset,
        };
      },
    },
  ),
);
