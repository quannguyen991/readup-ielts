import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, uid } from './persist';
import type { HighlightColorKey } from '@/theme/tokens';

/** Bôi màu, ghi chú, cỡ chữ và lịch sử chat — tất cả gắn theo bài đọc. */

export type Highlight = {
  id: string;
  articleId: string;
  paragraphIndex: number;
  text: string;
  color: HighlightColorKey;
  note: string | null;
  evidenceForQuestionId: string | null;
  createdAt: string;
};

export type Note = {
  id: string;
  articleId: string | null;
  articleTitle: string | null;
  paragraphIndex: number | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  articleId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type SavedPrompt = { id: string; title: string; body: string };

type ReaderState = {
  highlights: Highlight[];
  notes: Note[];
  chats: Record<string, ChatMessage[]>;
  savedPrompts: SavedPrompt[];
  fontScale: number;
  ttsRate: number;

  addHighlight: (input: Omit<Highlight, 'id' | 'createdAt'>) => string;
  removeHighlight: (id: string) => void;
  clearHighlights: (articleId: string) => void;
  highlightsFor: (articleId: string) => Highlight[];

  addNote: (input: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, body: string) => void;
  removeNote: (id: string) => void;
  notesFor: (articleId: string) => Note[];

  addChatMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  clearChat: (articleId: string) => void;

  savePrompt: (title: string, body: string) => void;
  removePrompt: (id: string) => void;

  setFontScale: (scale: number) => void;
  setTtsRate: (rate: number) => void;
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      highlights: [],
      notes: [],
      chats: {},
      savedPrompts: [],
      fontScale: 1,
      ttsRate: 1,

      addHighlight: (input) => {
        const id = uid();
        set((state) => ({
          highlights: [
            { ...input, id, createdAt: new Date().toISOString() },
            ...state.highlights,
          ],
        }));
        return id;
      },

      removeHighlight: (id) =>
        set((state) => ({ highlights: state.highlights.filter((h) => h.id !== id) })),

      clearHighlights: (articleId) =>
        set((state) => ({
          highlights: state.highlights.filter((h) => h.articleId !== articleId),
        })),

      highlightsFor: (articleId) => get().highlights.filter((h) => h.articleId === articleId),

      addNote: (input) => {
        const id = uid();
        const now = new Date().toISOString();
        set((state) => ({
          notes: [{ ...input, id, createdAt: now, updatedAt: now }, ...state.notes],
        }));
        return id;
      },

      updateNote: (id, body) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, body, updatedAt: new Date().toISOString() } : n,
          ),
        })),

      removeNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),

      notesFor: (articleId) => get().notes.filter((n) => n.articleId === articleId),

      addChatMessage: (message) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [message.articleId]: [
              ...(state.chats[message.articleId] ?? []),
              { ...message, id: uid(), createdAt: new Date().toISOString() },
            ],
          },
        })),

      clearChat: (articleId) =>
        set((state) => ({ chats: { ...state.chats, [articleId]: [] } })),

      savePrompt: (title, body) =>
        set((state) => ({
          savedPrompts: [...state.savedPrompts, { id: uid(), title, body }],
        })),

      removePrompt: (id) =>
        set((state) => ({ savedPrompts: state.savedPrompts.filter((p) => p.id !== id) })),

      setFontScale: (fontScale) => set({ fontScale: Math.min(1.6, Math.max(0.85, fontScale)) }),
      setTtsRate: (ttsRate) => set({ ttsRate: Math.min(2, Math.max(0.75, ttsRate)) }),
    }),
    { name: `${STORAGE_PREFIX}reader`, storage: storage<ReaderState>(), version: 1 },
  ),
);
