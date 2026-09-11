import { useMemo } from 'react';

import { useNow } from '@/lib/clock';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_PREFIX, storage, uid } from './persist';
import {
  CARD_KINDS,
  applyGrade,
  cardKey,
  emptyCard,
  isDue,
  type CardKind,
  type StoredCard,
} from '@/services/vocab/schedule';
import type { WordStatusKind } from '@/types/database';

/**
 * Sổ từ + lịch ôn FSRS, lưu ngay trên thiết bị.
 * Mỗi từ BẮT BUỘC lưu kèm nguyên câu gốc nơi gặp (yêu cầu trong spec) — đó là
 * thứ giúp nhớ nghĩa theo ngữ cảnh chứ không phải nghĩa từ điển rời rạc.
 */

export type VocabEntry = {
  id: string;
  word: string;
  lemma: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definitionContext: string | null;
  definitionGeneral: string | null;
  definitionVi: string | null;
  exampleSentence: string | null;
  /** Nguyên câu trong bài nơi gặp từ này. */
  sourceSentence: string;
  articleId: string | null;
  articleTitle: string | null;
  paragraphIndex: number | null;
  isCollocation: boolean;
  masteryPercent: number;
  createdAt: string;
};

/*
  Kiểu thẻ và luật xếp lịch nằm ở `services/vocab/schedule.ts` — module thuần,
  không chạm tới `react-native` nên test được bằng bộ test của Node. Xuất lại ở
  đây để mọi nơi đang nhập từ store không phải đổi đường nhập.
*/
export { CARD_KINDS, type CardKind, type StoredCard };

export type ReviewLogEntry = {
  id: string;
  vocabId: string;
  cardKind: CardKind;
  rating: 1 | 2 | 3 | 4;
  reviewedAt: string;
  durationMs: number;
};

type VocabState = {
  entries: Record<string, VocabEntry>;
  /** khoá: `${vocabId}:${cardKind}` */
  cards: Record<string, StoredCard>;
  wordStatus: Record<string, { status: WordStatusKind; timesSeen: number; lastSeenAt: string }>;
  reviewLog: ReviewLogEntry[];

  saveWord: (input: Omit<VocabEntry, 'id' | 'createdAt' | 'masteryPercent'>) => string;
  removeWord: (id: string) => void;
  setWordStatus: (lemma: string, status: WordStatusKind) => void;
  markSeen: (lemmas: string[]) => void;
  gradeCard: (vocabId: string, kind: CardKind, rating: 1 | 2 | 3 | 4, durationMs?: number) => void;

  getEntry: (id: string) => VocabEntry | undefined;
  hasLemma: (lemma: string) => boolean;
  dueCards: (now?: Date) => Array<{ entry: VocabEntry; kind: CardKind; card: StoredCard }>;
  statusOf: (lemma: string) => WordStatusKind;
};


export const useVocabStore = create<VocabState>()(
  persist(
    (set, get) => ({
      entries: {},
      cards: {},
      wordStatus: {},
      reviewLog: [],

      saveWord: (input) => {
        const existing = Object.values(get().entries).find(
          (e) => e.lemma === input.lemma && e.articleId === input.articleId,
        );
        if (existing) return existing.id;

        const id = uid();
        const entry: VocabEntry = {
          ...input,
          id,
          masteryPercent: 0,
          createdAt: new Date().toISOString(),
        };

        const now = new Date();
        const newCards: Record<string, StoredCard> = {};
        for (const kind of CARD_KINDS) {
          newCards[cardKey(id, kind)] = emptyCard(now);
        }

        set((state) => ({
          entries: { ...state.entries, [id]: entry },
          cards: { ...state.cards, ...newCards },
          wordStatus: {
            ...state.wordStatus,
            [input.lemma]: {
              status: 'learning',
              timesSeen: (state.wordStatus[input.lemma]?.timesSeen ?? 0) + 1,
              lastSeenAt: now.toISOString(),
            },
          },
        }));

        return id;
      },

      removeWord: (id) =>
        set((state) => {
          const entries = { ...state.entries };
          delete entries[id];

          const cards = { ...state.cards };
          for (const kind of CARD_KINDS) delete cards[cardKey(id, kind)];

          return { entries, cards };
        }),

      setWordStatus: (lemma, status) =>
        set((state) => ({
          wordStatus: {
            ...state.wordStatus,
            [lemma]: {
              status,
              timesSeen: state.wordStatus[lemma]?.timesSeen ?? 1,
              lastSeenAt: new Date().toISOString(),
            },
          },
        })),

      markSeen: (lemmas) =>
        set((state) => {
          const now = new Date().toISOString();
          const wordStatus = { ...state.wordStatus };

          for (const lemma of lemmas) {
            const prev = wordStatus[lemma];
            wordStatus[lemma] = {
              status: prev?.status ?? 'new',
              timesSeen: (prev?.timesSeen ?? 0) + 1,
              lastSeenAt: now,
            };
          }

          return { wordStatus };
        }),

      gradeCard: (vocabId, kind, rating, durationMs = 0) => {
        /*
          LUẬT XẾP LỊCH NẰM Ở `services/vocab/schedule.ts`, không nằm ở đây.

          Store thì kéo theo `persist` → `AsyncStorage` → `react-native`, mà bộ
          test của Node không dịch nổi `react-native/index.js` — nên mọi thứ
          viết trong store đều không test được. Đó chính là lý do `gradeCard`
          từng âm thầm bỏ qua khi thiếu thẻ mà không ai phát hiện.

          Giờ chỗ này chỉ còn việc gắn kết quả vào state; phần quyết định ngày
          ôn lại có test canh.
        */
        const now = new Date();
        const outcome = applyGrade(get().cards, vocabId, kind, rating, now);

        set((state) => {
          const cards = { ...state.cards, [outcome.key]: outcome.card };
          const entry = state.entries[vocabId];

          const entries = entry
            ? {
                ...state.entries,
                [vocabId]: { ...entry, masteryPercent: outcome.masteryPercent },
              }
            : state.entries;

          const lemma = entry?.lemma;
          const wordStatus = lemma
            ? {
                ...state.wordStatus,
                [lemma]: {
                  status: outcome.status,
                  timesSeen: (state.wordStatus[lemma]?.timesSeen ?? 0) + 1,
                  lastSeenAt: now.toISOString(),
                },
              }
            : state.wordStatus;

          return {
            cards,
            entries,
            wordStatus,
            reviewLog: [
              {
                id: uid(),
                vocabId,
                cardKind: kind,
                rating,
                reviewedAt: now.toISOString(),
                durationMs,
              },
              ...state.reviewLog,
            ].slice(0, 2000),
          };
        });
      },

      getEntry: (id) => get().entries[id],

      hasLemma: (lemma) => Object.values(get().entries).some((e) => e.lemma === lemma),

      dueCards: (now = new Date()) => {
        const { entries, cards } = get();
        const due: Array<{ entry: VocabEntry; kind: CardKind; card: StoredCard }> = [];

        for (const entry of Object.values(entries)) {
          for (const kind of CARD_KINDS) {
            const card = cards[cardKey(entry.id, kind)];
            if (card && isDue(card, now)) {
              due.push({ entry, kind, card });
            }
          }
        }

        return due.sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime());
      },

      statusOf: (lemma) => get().wordStatus[lemma]?.status ?? 'new',
    }),
    { name: `${STORAGE_PREFIX}vocab`, storage: storage<VocabState>(), version: 1 },
  ),
);

/**
 * Hook đọc thẻ đến hạn.
 *
 * Không gọi `useVocabStore((s) => s.dueCards())` trực tiếp trong component:
 * hàm đó tạo mảng mới mỗi lần chạy nên zustand luôn thấy "state đã đổi" và
 * component rơi vào vòng lặp render vô hạn. Ở đây chỉ select state thô rồi
 * memo hoá kết quả.
 */
export function useDueCards(): Array<{ entry: VocabEntry; kind: CardKind; card: StoredCard }> {
  const entries = useVocabStore((s) => s.entries);
  const cards = useVocabStore((s) => s.cards);

  // Cùng lý do như ở `app/progress.tsx`: Date.now() trong useMemo vừa phá tính
  // thuần tuý của render, vừa khiến danh sách tới hạn đứng im. Dùng đồng hồ chung
  // thì thẻ đến hạn lúc 9h01 tự hiện ra mà không cần người dùng bấm gì.
  const now = useNow();

  return useMemo(() => {
    const due: Array<{ entry: VocabEntry; kind: CardKind; card: StoredCard }> = [];

    for (const entry of Object.values(entries)) {
      for (const kind of CARD_KINDS) {
        const card = cards[cardKey(entry.id, kind)];
        if (card && new Date(card.due).getTime() <= now) due.push({ entry, kind, card });
      }
    }

    return due.sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime());
  }, [entries, cards]);
}

