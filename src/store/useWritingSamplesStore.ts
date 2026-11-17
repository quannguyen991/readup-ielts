import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

type WritingSamplesState = {
  drafts: Record<string, string>;
  completed: Record<string, string>;
  read: Record<string, string>;
  saveDraft: (key: string, text: string) => void;
  markComplete: (key: string) => void;
  markRead: (sampleId: string) => void;
  clearDraft: (key: string) => void;
};

/** Progress for paragraph-by-paragraph translation of the model library. */
export const useWritingSamplesStore = create<WritingSamplesState>()(
  persist(
    (set) => ({
      drafts: {},
      completed: {},
      read: {},
      saveDraft: (key, text) => set((state) => ({ drafts: { ...state.drafts, [key]: text } })),
      markComplete: (key) =>
        set((state) => ({ completed: { ...state.completed, [key]: new Date().toISOString() } })),
      markRead: (sampleId) =>
        set((state) => (state.read[sampleId] ? state : { read: { ...state.read, [sampleId]: new Date().toISOString() } })),
      clearDraft: (key) =>
        set((state) => {
          const drafts = { ...state.drafts };
          delete drafts[key];
          return { drafts };
        }),
    }),
    { name: `${STORAGE_PREFIX}writing-samples`, storage: storage() },
  ),
);
