import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';

import { STORAGE_PREFIX, storage, uid } from './persist';
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

/** Thẻ FSRS được serialize sang JSON (Date → ISO string). */
export type StoredCard = Omit<Card, 'due' | 'last_review'> & {
  due: string;
  last_review: string | null;
};

export type CardKind = 'word_to_meaning' | 'meaning_to_word' | 'cloze' | 'multiple_choice';

export const CARD_KINDS: CardKind[] = [
  'word_to_meaning',
  'meaning_to_word',
  'cloze',
  'multiple_choice',
];

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

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, enable_short_term: true }));

const cardKey = (vocabId: string, kind: CardKind) => `${vocabId}:${kind}`;

function toStored(card: Card): StoredCard {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

function fromStored(card: StoredCard): Card {
  return {
    ...card,
    due: new Date(card.due),
    ...(card.last_review ? { last_review: new Date(card.last_review) } : {}),
  } as Card;
}

/** Mastery quy từ trạng thái + độ ổn định của thẻ, để hiện thanh % trong UI. */
function masteryFromCards(cards: StoredCard[]): number {
  if (cards.length === 0) return 0;

  const score = cards.reduce((sum, card) => {
    const base = card.state === State.Review ? 55 : card.state === State.Learning ? 25 : 5;
    const stabilityBonus = Math.min(45, Math.log2(1 + card.stability) * 12);
    return sum + base + stabilityBonus;
  }, 0);

  return Math.round(Math.min(100, score / cards.length));
}

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
          newCards[cardKey(id, kind)] = toStored(createEmptyCard(now));
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
        const key = cardKey(vocabId, kind);
        const stored = get().cards[key];
        if (!stored) return;

        const now = new Date();
        const result = scheduler.next(fromStored(stored), now, rating as Grade);
        const nextCard = toStored(result.card);

        set((state) => {
          const cards = { ...state.cards, [key]: nextCard };
          const entry = state.entries[vocabId];

          const entries = entry
            ? {
                ...state.entries,
                [vocabId]: {
                  ...entry,
                  masteryPercent: masteryFromCards(
                    CARD_KINDS.map((k) => cards[cardKey(vocabId, k)]).filter(
                      (c): c is StoredCard => Boolean(c),
                    ),
                  ),
                },
              }
            : state.entries;

          const lemma = entry?.lemma;
          const wordStatus = lemma
            ? {
                ...state.wordStatus,
                [lemma]: {
                  status: nextStatus(rating, nextCard),
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
            if (card && new Date(card.due).getTime() <= now.getTime()) {
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

  return useMemo(() => {
    const now = Date.now();
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

function nextStatus(rating: 1 | 2 | 3 | 4, card: StoredCard): WordStatusKind {
  if (rating === Rating.Again) return 'learning';
  if (card.state === State.Review && card.stability > 21) return 'known';
  if (card.state === State.Review) return 'familiar';
  return 'learning';
}
