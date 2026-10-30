/**
 * CHỌN CÂU cho một lượt tham quan (và cho hải quan, ôn từ). Hàm thuần, gieo hạt
 * được: cùng `(poiId, lượt thứ n)` ra cùng bộ câu, "làm lại" ra câu khác.
 *
 * Thứ tự ưu tiên của TỪ: (1) đến hạn ôn, (2) chưa gặp, (3) hay sai (`lapses`),
 * (4) còn lại. Loại các từ / tình huống đã làm trong 24 giờ — nếu không đủ câu
 * thì mới lấy lại, cũ nhất trước. Không có hai câu trùng khoá trong một lượt.
 */
import { hashString, mulberry32 } from '@/services/questions/rng';
import { spreadKinds } from '@/services/vocab/quiz';
import { shuffled } from '@/services/vocab/topic-study';
import { TRAVEL_ECONOMY } from './economy';
import {
  SUPPORTED_TYPES,
  buildReplyQuestion,
  buildTranslateQuestion,
  buildWordQuestion,
  deckWords,
  replyPool,
  supports,
  translatePool,
  wordKey,
  wordPool,
  type VisitQuestion,
  type WordRef,
} from './content';
import { themeOfDeck } from '@/data/travel/replies';
import type { Level, PoiKind, QuestionType } from './types';

export type PoiLike = {
  id: string;
  kind: PoiKind;
  content: { decks: string[]; types: QuestionType[]; level: Level };
  questions?: number;
};

export type StudySnapshot = {
  /** Bộ → các từ đến hạn ôn hôm nay (`dueBySlug`). */
  due?: Record<string, string[]>;
  /** Bộ → từ → số lần sai. */
  lapses?: Record<string, Record<string, number>>;
  /** Bộ → từ → chặng (0 chưa học). */
  stages?: Record<string, Record<string, number>>;
};

export type PickInput = StudySnapshot & {
  poi: PoiLike;
  /** Mức chơi; mặc định theo địa điểm. */
  level?: Level;
  /** Lượt thứ mấy của địa điểm này (1, 2, …) — dùng làm hạt giống. */
  runNo?: number;
  /** Khoá câu / từ → mốc ISO đã làm. */
  seen?: Record<string, string>;
  nowMs?: number;
  rng?: () => number;
  count?: number;
  /**
   * Bộ từ ưu tiên (người học tự chọn, hoặc theo lộ trình — xem `decks.ts`). Từ của các bộ này
   * được hỏi TRƯỚC từ của bộ mặc định của địa điểm; rỗng thì dùng bộ của địa điểm.
   */
  focusDecks?: string[];
};

export function seedFor(poiId: string, runNo: number): () => number {
  return mulberry32(hashString(`${poiId}:${runNo}`));
}

function seenRecently(seen: Record<string, string> | undefined, keys: string[], nowMs: number): boolean {
  if (!seen) return false;
  return keys.some((k) => {
    const at = seen[k];
    return at !== undefined && nowMs - Date.parse(at) < TRAVEL_ECONOMY.seenWindowMs;
  });
}

function seenAt(seen: Record<string, string> | undefined, keys: string[]): number {
  let t = 0;
  for (const k of keys) {
    const at = seen?.[k];
    if (at) t = Math.max(t, Date.parse(at));
  }
  return t;
}

type Tiered = { ref: WordRef; tier: number; recent: boolean; lastSeen: number; lapses: number };

/** Xếp từ theo bậc ưu tiên; trong bậc thì xáo theo hạt giống. Từ vừa làm bị đẩy xuống cuối. */
function rankWords(pool: WordRef[], snap: StudySnapshot, input: PickInput, nowMs: number, rng: () => number, focus: ReadonlySet<string> = new Set()): Tiered[] {
  const dueSet = new Map<string, Set<string>>();
  for (const [deck, words] of Object.entries(snap.due ?? {})) dueSet.set(deck, new Set(words.map((w) => w.trim().toLowerCase())));
  const rows: Tiered[] = shuffled(pool, rng).map((ref) => {
    const { deck, word } = ref;
    const key = wordKey(deck, word.word);
    const lapses = snap.lapses?.[deck]?.[word.word] ?? 0;
    const stage = snap.stages?.[deck]?.[word.word] ?? 0;
    const tier = dueSet.get(deck)?.has(word.word.trim().toLowerCase()) ? 0 : stage === 0 && lapses === 0 ? 1 : lapses > 0 ? 2 : 3;
    return { ref, tier, recent: seenRecently(input.seen, [key], nowMs), lastSeen: seenAt(input.seen, [key]), lapses };
  });
  // Ổn định: sort giữ thứ tự xáo trong cùng bậc.
  const out = (r: Tiered) => (focus.has(r.ref.deck) ? 0 : 1);
  return rows.sort((a, b) => Number(a.recent) - Number(b.recent) || out(a) - out(b) || a.tier - b.tier || (a.recent ? a.lastSeen - b.lastSeen : 0) || (a.tier === 2 ? b.lapses - a.lapses : 0));
}

/** Từ của bộ ưu tiên trước, rồi từ của địa điểm (bỏ từ trùng). */
function mergePools(first: WordRef[], second: WordRef[]): WordRef[] {
  const seen = new Set(first.map((r) => wordKey(r.deck, r.word.word)));
  return [...first, ...second.filter((r) => !seen.has(wordKey(r.deck, r.word.word)))];
}

const FALLBACK_ORDER: QuestionType[] = ['cloze', 'listen-pick', 'order', 'dictation', 'reply', 'translate'];

/**
 * Bộ câu cho MỘT lượt. Số câu: `poi.questions` hoặc `count` hoặc 7. Có thể ít hơn
 * nếu kho của địa điểm không đủ.
 */
export function pickVisitQuestions(input: PickInput): VisitQuestion[] {
  const { poi } = input;
  const level = input.level ?? poi.content.level;
  const nowMs = input.nowMs ?? Date.now();
  const rng = input.rng ?? seedFor(poi.id, input.runNo ?? 1);
  const count = input.count ?? poi.questions ?? TRAVEL_ECONOMY.visit.questions;

  const types = poi.content.types.filter((t) => SUPPORTED_TYPES.includes(t));
  const wanted: QuestionType[] = types.length ? types : ['cloze'];
  const plan = spreadKinds(count, rng, wanted);

  const focus = new Set((input.focusDecks ?? []).filter((d) => !themeOfDeck(d)));
  const base = wordPool(poi.content.decks, level);
  const pool = focus.size ? mergePools(wordPool([...focus], level), base) : base;
  const ranked = rankWords(pool, input, input, nowMs, rng, focus);
  const used = new Set<string>();

  const replies = replyPool(poi.content.decks, poi.kind);
  const replyRank = shuffled(replies, rng)
    .map((item) => ({ item, recent: seenRecently(input.seen, [item.id], nowMs), gap: Math.abs(item.level - level) }))
    .sort((a, b) => Number(a.recent) - Number(b.recent) || a.gap - b.gap);

  const trans = translatePool(poi.kind, level);
  const transRank = shuffled(trans, rng)
    .map((item) => ({ item, recent: seenRecently(input.seen, [item.id], nowMs) }))
    .sort((a, b) => Number(a.recent) - Number(b.recent));

  const take = (type: QuestionType): VisitQuestion | null => {
    if (type === 'reply') {
      const hit = replyRank.find((r) => !used.has(r.item.id));
      if (!hit) return null;
      used.add(hit.item.id);
      return buildReplyQuestion(hit.item, rng);
    }
    if (type === 'translate') {
      const hit = transRank.find((r) => !used.has(r.item.id));
      if (!hit) return null;
      used.add(hit.item.id);
      return buildTranslateQuestion(hit.item, rng);
    }
    if (type === 'cloze' || type === 'dictation' || type === 'order' || type === 'listen-pick') {
      const hit = ranked.find((r) => !used.has(wordKey(r.ref.deck, r.ref.word.word)) && supports(type, r.ref.word));
      if (!hit) return null;
      const q = buildWordQuestion(type, hit.ref, pool, level, rng);
      if (!q) return null;
      used.add(wordKey(hit.ref.deck, hit.ref.word.word));
      return q;
    }
    return null;
  };

  const out: VisitQuestion[] = [];
  for (const kind of plan) {
    let q = take(kind);
    if (!q) for (const alt of FALLBACK_ORDER) if (!q && alt !== kind) q = take(alt);
    if (q) out.push(q);
  }
  return out;
}

/** Mười hai bộ từ "đã học" tạm thời nếu người học chưa học bộ nào: các chủ đề du lịch. */
export const CUSTOMS_DEFAULT_DECKS = ['tourism', 'transport', 'food', 'shopping', 'listening-travel-booking', 'listening-directions-maps', 'listening-accommodation'];

/** Bài kiểm tra hải quan: 5 câu hỗn hợp từ các bộ đã học (hoặc bộ du lịch mặc định). */
export function pickCustomsQuestions(
  input: StudySnapshot & {
    studiedDecks?: string[];
    /** Bộ ưu tiên (tự chọn / theo lộ trình): thay cho các bộ đã học khi có. */
    focusDecks?: string[];
    level?: Level;
    day: string;
    run: number;
    seen?: Record<string, string>;
    nowMs?: number;
    count?: number;
  },
): VisitQuestion[] {
  const decks = input.focusDecks && input.focusDecks.length ? input.focusDecks.slice(0, 12) : input.studiedDecks && input.studiedDecks.length ? input.studiedDecks.slice(0, 12) : CUSTOMS_DEFAULT_DECKS;
  return pickVisitQuestions({
    ...input,
    poi: {
      id: `customs-${input.day}`,
      kind: 'airport',
      content: { decks: [...decks, 'reply-airport'], types: ['cloze', 'listen-pick', 'reply', 'order'], level: input.level ?? 1 },
    },
    runNo: input.run,
    count: input.count ?? TRAVEL_ECONOMY.customs.questions,
  });
}

/** Lượt ôn từ đến hạn: chỉ hỏi các từ đang đến hạn (tối đa `count`). Trả về [] nếu không có từ nào. */
export function pickReviewQuestions(
  input: StudySnapshot & { day: string; run?: number; count?: number; seen?: Record<string, string>; nowMs?: number },
): VisitQuestion[] {
  const rng = seedFor(`review-${input.day}`, input.run ?? 1);
  const count = input.count ?? TRAVEL_ECONOMY.review.wordsPerTicket;
  const refs: WordRef[] = [];
  for (const [deck, words] of Object.entries(input.due ?? {})) {
    const list = deckWords(deck);
    for (const w of words) {
      const hit = list.find((x) => x.word.trim().toLowerCase() === w.trim().toLowerCase());
      if (hit) refs.push({ deck, word: hit });
    }
  }
  const all: WordRef[] = Object.keys(input.due ?? {}).flatMap((deck) => deckWords(deck).map((word) => ({ deck, word })));
  const plan = spreadKinds(Math.min(count, refs.length), rng, ['cloze', 'listen-pick', 'order'] as const);
  const out: VisitQuestion[] = [];
  const queue = shuffled(refs, rng);
  for (const kind of plan) {
    const idx = queue.findIndex((r) => supports(kind, r.word));
    const pick = idx >= 0 ? queue.splice(idx, 1)[0]! : queue.shift();
    if (!pick) break;
    const q = buildWordQuestion(supports(kind, pick.word) ? kind : 'listen-pick', pick, all, 2, rng);
    if (q) out.push(q);
  }
  return out;
}
