import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';

import type { WordStatusKind } from '@/types/database';

/**
 * Phần xếp lịch FSRS của sổ từ — THUẦN, không chạm tới React hay thiết bị.
 *
 * VÌ SAO TÁCH RA. Toàn bộ logic này trước nằm trong `useVocabStore`, mà store
 * thì kéo theo `zustand/middleware/persist` → `AsyncStorage` → `react-native`.
 * Bộ chạy test của Node không dịch nổi `react-native/index.js`, nên mọi thứ
 * nằm trong store đều KHÔNG TEST ĐƯỢC — kể cả hàm quyết định ngày ôn lại của
 * từng từ, tức là thứ đắt giá nhất trong cả sổ từ.
 *
 * Chuyện ấy không phải giả định: `gradeCard` từng âm thầm bỏ qua khi từ chưa
 * có thẻ, và lỗi ấy sống được vì không có test nào chạm tới nó. Tách ra đây
 * thì store chỉ còn việc gắn kết quả vào state, còn luật thì có test canh.
 *
 * File này KHÔNG được import bất cứ thứ gì từ `@/store` — đó chính là điều
 * khiến nó test được. Kiểu dữ liệu đặt ở đây, store nhập ngược lại.
 */

export type CardKind = 'word_to_meaning' | 'meaning_to_word' | 'cloze' | 'multiple_choice';

export const CARD_KINDS: CardKind[] = [
  'word_to_meaning',
  'meaning_to_word',
  'cloze',
  'multiple_choice',
];

/** Thẻ FSRS đã serialize sang JSON (Date → ISO string). */
export type StoredCard = Omit<Card, 'due' | 'last_review'> & {
  due: string;
  last_review: string | null;
};

export type WordStatusEntry = {
  status: WordStatusKind;
  timesSeen: number;
  lastSeenAt: string;
};

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, enable_short_term: true }));

export const cardKey = (vocabId: string, kind: CardKind) => `${vocabId}:${kind}`;

export function toStored(card: Card): StoredCard {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

export function fromStored(card: StoredCard): Card {
  return {
    ...card,
    due: new Date(card.due),
    ...(card.last_review ? { last_review: new Date(card.last_review) } : {}),
  } as Card;
}

export function emptyCard(now: Date): StoredCard {
  return toStored(createEmptyCard(now));
}

/** Mastery quy từ trạng thái + độ ổn định của thẻ, để hiện thanh % trong UI. */
export function masteryFromCards(cards: StoredCard[]): number {
  if (cards.length === 0) return 0;

  const score = cards.reduce((sum, card) => {
    const base = card.state === State.Review ? 55 : card.state === State.Learning ? 25 : 5;
    const stabilityBonus = Math.min(45, Math.log2(1 + card.stability) * 12);
    return sum + base + stabilityBonus;
  }, 0);

  return Math.round(Math.min(100, score / cards.length));
}

export function nextStatus(rating: 1 | 2 | 3 | 4, card: StoredCard): WordStatusKind {
  if (rating === Rating.Again) return 'learning';
  if (card.state === State.Review && card.stability > 21) return 'known';
  if (card.state === State.Review) return 'familiar';
  return 'learning';
}

export type GradeOutcome = {
  /** Khoá của thẻ vừa chấm, và thẻ mới. */
  key: string;
  card: StoredCard;
  /** Mastery mới của từ, tính trên CẢ BỐN loại thẻ. */
  masteryPercent: number;
  /** Trạng thái mới của lemma. */
  status: WordStatusKind;
  /** Thẻ này vốn chưa có và vừa được tạo ra trong lượt chấm này. */
  createdCard: boolean;
};

/**
 * Chấm một thẻ và trả về mọi thứ cần ghi lại. KHÔNG tự ghi.
 *
 * THIẾU THẺ THÌ TẠO, KHÔNG IM LẶNG BỎ QUA. Bản cũ `return` ngay khi không tìm
 * thấy thẻ. Nó đúng theo nghĩa "không làm hỏng gì", nhưng hỏng theo nghĩa quan
 * trọng hơn: màn ôn vẫn chạy tiếp, người học vẫn thấy mình vừa ôn xong mười
 * hai từ, mà lịch đứng nguyên — hôm sau mở ra vẫn đúng ngần ấy từ đến hạn, và
 * không có gì trên màn hình nói vì sao.
 *
 * Thiếu thẻ là chuyện có thật: từ đồng bộ từ máy khác hoặc lưu bằng bản app cũ
 * có thể chưa đủ bốn loại, và ngày nào thêm một loại thẻ mới thì MỌI từ cũ đều
 * thiếu nó.
 */
export function applyGrade(
  cards: Record<string, StoredCard>,
  vocabId: string,
  kind: CardKind,
  rating: 1 | 2 | 3 | 4,
  now: Date,
): GradeOutcome {
  const key = cardKey(vocabId, kind);
  const existing = cards[key];
  const base = existing ?? emptyCard(now);

  const result = scheduler.next(fromStored(base), now, rating as Grade);
  const card = toStored(result.card);

  /*
    Mastery tính trên CẢ BỐN loại thẻ, kể cả loại chưa học. Tính riêng loại vừa
    chấm thì một từ mới học đúng một lần ở một kiểu sẽ hiện 60% thuộc — con số
    ấy làm người học bỏ qua từ đó, và nó là con số app tự bịa ra.
  */
  const merged = { ...cards, [key]: card };
  const all = CARD_KINDS.map((k) => merged[cardKey(vocabId, k)]).filter(
    (c): c is StoredCard => Boolean(c),
  );

  return {
    key,
    card,
    masteryPercent: masteryFromCards(all),
    status: nextStatus(rating, card),
    createdCard: existing === undefined,
  };
}

/** Những thẻ đến hạn ôn tính tới `now`. */
export function isDue(card: StoredCard, now: Date): boolean {
  return Date.parse(card.due) <= now.getTime();
}
