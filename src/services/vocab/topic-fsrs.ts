/**
 * Lịch ôn DUY NHẤT: mọi từ học trong các bộ chủ đề đều ghi vào thẻ FSRS chung (`useVocabStore`).
 * Lịch Leitner riêng từng bộ (`reviews`) không còn được ghi thêm; dữ liệu cũ được chuyển sang thẻ FSRS
 * một lần, sau khi sao lưu.
 *
 * Mỗi từ có đúng một mục và bốn thẻ (một cho mỗi dạng); một lần trả lời ở bất kỳ dạng nào đều chấm đủ
 * bốn thẻ, và ngày ôn được phân bổ để không quá DAILY_CAP từ trong một ngày.
 */
import { getStaticDeck, NOTEBOOK_SLUG, rawStaticDeck, splitLevelSlug } from '@/data/study-decks';
import type { VocabEntry } from '@/store/useVocabStore';
import { applyGrade, CARD_KINDS, cardKey, emptyCard, isDue, type StoredCard } from './schedule';
import { DAILY_CAP, type ReviewEntry } from './review-schedule';
import { dueByBaseDeck, dueBySlugBefore, endOfDayMs, type VocabSlice } from './fsrs-due';

export type { VocabSlice };

/** Thông tin một từ trong bộ, lấy từ dữ liệu bộ (không phụ thuộc bộ nào đã nhập sổ). */
type TopicWordInfo = NonNullable<ReturnType<typeof getStaticDeck>>['words'][number];

/** Mã mục FSRS của một từ trong bộ. */
export function topicEntryId(slug: string, word: string): string {
  return `topic_${slug}_${word.trim().toLowerCase().replace(/[^a-z0-9]/gi, '_')}`;
}

/** Slug của bộ không kèm hậu tố cấp (`bo--all`, `bo--B2` → `bo`), để tra dữ liệu bộ. */
export function baseSlugOf(slug: string): string {
  return slug.replace(/--(all|B1|B2|C1|C2)$/, '');
}

export function topicWordInfo(slug: string, word: string): TopicWordInfo | undefined {
  const key = word.trim().toLowerCase();
  return getStaticDeck(baseSlugOf(slug))?.words.find((w) => w.word.trim().toLowerCase() === key);
}

const dayKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Tạo mục và bốn thẻ mới cho một từ của bộ, mọi thẻ đến hạn đúng `due`. */
function seedEntry(state: VocabSlice, slug: string, info: TopicWordInfo, now: Date, due: Date): { id: string; state: VocabSlice } {
  const lemma = info.word.trim().toLowerCase();
  const existing = Object.values(state.entries).find((e) => e.lemma.trim().toLowerCase() === lemma);
  if (existing) return { id: existing.id, state };
  const id = topicEntryId(slug, info.word);
  const entry: VocabEntry = {
    id,
    word: info.word,
    lemma,
    phonetic: info.ipa || null,
    partOfSpeech: info.pos || null,
    definitionVi: info.meaningVi || null,
    definitionContext: info.definitionEn || null,
    definitionGeneral: info.definitionEn || null,
    exampleSentence: info.example || null,
    sourceSentence: info.example || '',
    articleId: slug,
    articleTitle: `Chủ đề: ${baseSlugOf(slug)}`,
    paragraphIndex: null,
    isCollocation: Boolean(info.collocation),
    masteryPercent: 0,
    createdAt: now.toISOString(),
    synonyms: info.synonyms,
    antonyms: info.antonyms,
  };
  const cards = { ...state.cards };
  for (const kind of CARD_KINDS) {
    const card = emptyCard(now);
    cards[cardKey(id, kind)] = { ...card, due: due.toISOString() };
  }
  return { id, state: { entries: { ...state.entries, [id]: entry }, cards } };
}

/**
 * Ghi một lần trả lời của từ vào lịch chung. Từ chưa có mục thì tạo từ dữ liệu bộ; từ không có trong dữ liệu
 * bộ thì trả về nguyên trạng thái. Ngày ôn được phân bổ theo DAILY_CAP.
 */
export function gradeTopicWord(state: VocabSlice, slug: string, word: string, correct: boolean, now: Date): VocabSlice {
  const info = topicWordInfo(slug, word);
  if (!info) return state;
  const seeded = seedEntry(state, slug, info, now, now);
  const id = seeded.id;
  const rating = correct ? 3 : 1;
  let cards = seeded.state.cards;
  let mastery = seeded.state.entries[id]?.masteryPercent ?? 0;
  for (const kind of CARD_KINDS) {
    const outcome = applyGrade(cards, id, kind, rating, now);
    cards = { ...cards, [outcome.key]: outcome.card };
    mastery = outcome.masteryPercent;
  }
  const due = spreadDue(new Date(cards[cardKey(id, 'word_to_meaning')]!.due), dueLoadByDay(cards, id), now);
  for (const kind of CARD_KINDS) {
    const key = cardKey(id, kind);
    cards = { ...cards, [key]: { ...cards[key]!, due: due.toISOString() } };
  }
  const entry = seeded.state.entries[id]!;
  return { entries: { ...seeded.state.entries, [id]: { ...entry, masteryPercent: mastery } }, cards };
}

/** Số từ đến hạn trong từng ngày, mỗi từ một lần (đếm theo thẻ "thấy từ tiếng Anh"), trừ từ đang xếp. */
export function dueLoadByDay(cards: Record<string, StoredCard>, excludeId: string): Record<string, number> {
  const suffix = ':word_to_meaning';
  const load: Record<string, number> = {};
  for (const [key, card] of Object.entries(cards)) {
    if (!key.endsWith(suffix) || key.slice(0, -suffix.length) === excludeId) continue;
    const day = dayKeyOf(new Date(card.due));
    load[day] = (load[day] ?? 0) + 1;
  }
  return load;
}

/**
 * Chọn ngày ôn cho một từ: giữ ngày FSRS chuẩn nếu ngày đó còn chỗ (dưới cap từ); nếu đầy thì lùi sang ngày sau
 * đến ngày còn chỗ (tối đa 14 ngày). Quá hạn thì tính từ hôm nay.
 */
export function spreadDue(ideal: Date, load: Record<string, number>, now: Date, cap = DAILY_CAP): Date {
  const start = ideal.getTime() < now.getTime() ? now : ideal;
  for (let i = 0; i <= 14; i += 1) {
    const d = new Date(start.getTime() + i * 86_400_000);
    if ((load[dayKeyOf(d)] ?? 0) < cap) return d;
  }
  return start;
}

/** Các từ của bộ đã đến hạn ôn (khoá chữ thường). Dựa trên thẻ dạng "thấy từ tiếng Anh". */
export function dueTopicWords(state: VocabSlice, slug: string, now: Date): Set<string> {
  const out = new Set<string>();
  for (const e of Object.values(state.entries)) {
    if (e.articleId !== slug) continue;
    const card = state.cards[cardKey(e.id, 'word_to_meaning')];
    if (card && isDue(card, now)) out.add(e.lemma.trim().toLowerCase());
  }
  return out;
}

/**
 * ĐẾM TỪ ĐẾN HẠN: phần thuần nằm ở `fsrs-due.ts` (máy chủ dùng chung); ở đây là các hàm bọc cần dữ liệu bộ từ để
 * biết một mã có phải bộ học được không.
 */
export {
  dueEntriesBefore,
  dueEntriesToday,
  dueLemmasBefore,
  dueLemmasToday,
  entryInWords,
  forecastFsrs,
  studiedLemmas,
} from './fsrs-due';

const isStudyDeck = (slug: string) => !!rawStaticDeck(slug);

/** Số từ đến hạn hôm nay theo bộ. Từ không thuộc bộ học được nào (lưu lúc đọc bài…) gộp vào sổ từ. */
export function dueBySlugToday(state: VocabSlice, now: Date, isDeck: (slug: string) => boolean = isStudyDeck): Record<string, string[]> {
  const known = new Map<string, boolean>();
  const isKnown = (s: string) => {
    let k = known.get(s);
    if (k === undefined) {
      k = isDeck(s);
      known.set(s, k);
    }
    return k;
  };
  return dueBySlugBefore(state, endOfDayMs(now), (e) => (e.articleId && isKnown(e.articleId) ? e.articleId : NOTEBOOK_SLUG));
}

/**
 * Từ đến hạn hôm nay theo BỘ GỐC (mọi cấp gộp lại, chữ thường) — cho quest và du lịch, nơi chỉ biết bộ gốc.
 * `includeNotebook`: từ không thuộc bộ nào (lưu lúc đọc bài…) gộp vào sổ từ thay vì bị bỏ.
 */
export function dueByBaseDeckToday(state: VocabSlice, now: Date, includeNotebook = false): Record<string, string[]> {
  const known = new Map<string, boolean>();
  const outside = includeNotebook ? NOTEBOOK_SLUG : null;
  return dueByBaseDeck(state, endOfDayMs(now), (e) => {
    if (!e.articleId) return outside;
    const base = splitLevelSlug(e.articleId).base;
    let k = known.get(base);
    if (k === undefined) {
      k = isStudyDeck(base);
      known.set(base, k);
    }
    return k ? base : outside;
  });
}

/**
 * Chuyển lịch Leitner cũ sang thẻ FSRS: từ đã có mục thì giữ nguyên lịch FSRS; từ chưa có thì tạo mục từ dữ liệu
 * bộ và đặt ngày ôn theo ngày đã xếp trong Leitner. Từ không có trong dữ liệu bộ thì bỏ qua (vẫn còn trong bản sao lưu).
 */
export function leitnerToFsrs(
  state: VocabSlice,
  reviews: Record<string, Record<string, ReviewEntry>> | undefined,
  stages: Record<string, Record<string, number>> | undefined,
  now: Date,
): VocabSlice {
  const pairs = new Map<string, { slug: string; word: string }>();
  for (const [slug, words] of Object.entries(stages ?? {})) for (const w of Object.keys(words ?? {})) pairs.set(`${slug}|${w}`, { slug, word: w });
  for (const [slug, words] of Object.entries(reviews ?? {})) for (const w of Object.keys(words ?? {})) pairs.set(`${slug}|${w}`, { slug, word: w });
  let out = state;
  for (const { slug, word } of pairs.values()) {
    const info = topicWordInfo(slug, word);
    if (!info) continue;
    const dueDay = reviews?.[slug]?.[word]?.due;
    const due = dueDay ? new Date(`${dueDay}T08:00:00`) : now;
    out = seedEntry(out, slug, info, now, due).state;
  }
  return out;
}

/**
 * Sao lưu lịch Leitner cũ vào bộ nhớ trình duyệt TRƯỚC khi chuyển. Trả về false nếu không ghi được —
 * khi đó không được chuyển. Đã có bản sao của ngày hôm nay thì giữ bản đầu tiên.
 */
export function backupLeitner(
  reviews: Record<string, Record<string, ReviewEntry>>,
  stages: Record<string, Record<string, number>>,
  today: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof window === 'undefined' ? null : window.localStorage,
): boolean {
  if (!storage) return false;
  const key = `readup:backup:leitner:${today}`;
  try {
    if (storage.getItem(key)) return true;
    storage.setItem(key, JSON.stringify({ savedAt: new Date().toISOString(), reviews, stages }));
    return true;
  } catch {
    return false;
  }
}
