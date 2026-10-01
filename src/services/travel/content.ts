/**
 * NỘI DUNG CÂU HỎI của "Du ngoạn Band 9": biến từ vựng thật, câu đáp tình huống và
 * câu dịch thành câu hỏi có đáp án do MÃ tính. Không gọi AI lúc chạy.
 *
 * Sáu loại câu:
 *   cloze       điền từ vào câu ví dụ (chọn 1 trong 4)
 *   reply       chọn câu đáp tự nhiên trong một tình huống ngắn
 *   dictation   nghe câu (TTS) rồi gõ lại
 *   listen-pick nghe rồi chọn: mức 1 nghe TỪ chọn nghĩa; mức 2–3 nghe CÂU chọn từ
 *   order       sắp xếp các từ thành câu ví dụ
 *   translate   chọn bản dịch tiếng Anh đúng cho một câu tiếng Việt
 * (`speak` chưa hỗ trợ — bị bỏ qua khi chọn câu.)
 */
import { getVocabTopic } from '@/data/vocab-topics';
import { TRANSLATION_SENTENCES, type SentenceTopic, type TranslationItem } from '@/data/sentence-drills';
import {
  REPLY_ITEMS,
  REPLY_THEME_BY_KIND,
  themeOfDeck,
  type ReplyItem,
  type ReplyTheme,
} from '@/data/travel/replies';
import { gradeDictation } from '@/services/sentence/dictation-grade';
import { clozeOf, makeChoices, normalizeAnswer, shuffled, type StudyWord } from '@/services/vocab/topic-study';
import type { Level, PoiKind, QuestionType } from './types';

/** Loại câu mà bộ chọn câu dựng được. */
export const SUPPORTED_TYPES: readonly QuestionType[] = ['cloze', 'reply', 'dictation', 'listen-pick', 'order', 'translate'];

export type WordInfo = { word: string; meaningVi: string; ipa: string; pos: string; example: string };

type Base = {
  /** Duy nhất trong cả game: `<loại>|<khoá>`. */
  id: string;
  /** Khoá nội dung (từ hoặc tình huống) — để biết câu nào đã làm, không phụ thuộc loại câu. */
  key: string;
  type: QuestionType;
  /** Mã bộ từ / bộ câu đáp / `translate`. */
  deck: string;
  info?: WordInfo;
};

export type ClozeQuestion = Base & {
  type: 'cloze';
  before: string;
  after: string;
  answer: string;
  options: string[];
  correctIndex: number;
};
export type ReplyQuestion = Base & {
  type: 'reply';
  theme: ReplyTheme;
  setup: string;
  line: string;
  gloss: string;
  options: string[];
  correctIndex: number;
  answerVi: string;
};
export type DictationQuestion = Base & { type: 'dictation'; sentence: string };
export type ListenPickQuestion = Base & {
  type: 'listen-pick';
  /** 'meaning': nghe từ, chọn nghĩa tiếng Việt. 'word': nghe câu, chọn từ đã nghe. */
  mode: 'meaning' | 'word';
  speak: string;
  options: string[];
  correctIndex: number;
};
export type OrderQuestion = Base & {
  type: 'order';
  sentence: string;
  /** Các từ đã xáo (giữ dấu câu dính vào từ). */
  tiles: string[];
};
export type TranslateQuestion = Base & {
  type: 'translate';
  vi: string;
  options: string[];
  correctIndex: number;
  hint: string;
};

export type VisitQuestion =
  | ClozeQuestion
  | ReplyQuestion
  | DictationQuestion
  | ListenPickQuestion
  | OrderQuestion
  | TranslateQuestion;

/** number: chỉ số lựa chọn; string: chữ đã gõ; string[]: các từ đã xếp; null: bỏ trống. */
export type VisitAnswer = number | string | string[] | null;

/** Ngưỡng chấm chép chính tả: đúng ≥ 80% số từ, theo thứ tự. */
export const DICTATION_PASS = 0.8;

export function tokensOf(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

function normToken(t: string): string {
  return t.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
}

export function isCorrect(q: VisitQuestion, a: VisitAnswer): boolean {
  if (a === null) return false;
  switch (q.type) {
    case 'cloze':
    case 'reply':
    case 'listen-pick':
    case 'translate':
      return a === q.correctIndex;
    case 'dictation':
      return typeof a === 'string' && gradeDictation(q.sentence, a).accuracy >= DICTATION_PASS;
    case 'order': {
      if (!Array.isArray(a)) return false;
      const want = tokensOf(q.sentence).map(normToken);
      return a.length === want.length && a.every((t, i) => normToken(t) === want[i]);
    }
  }
}

/** Câu trả lời đã đủ để chấm chưa (ô gõ trống, chưa xếp hết từ thì chưa). */
export function isAnswered(q: VisitQuestion, a: VisitAnswer): boolean {
  if (a === null) return false;
  if (q.type === 'dictation') return typeof a === 'string' && a.trim() !== '';
  if (q.type === 'order') return Array.isArray(a) && a.length === q.tiles.length;
  return typeof a === 'number';
}

/** Đáp án đúng ở dạng chữ, để hiện khi trả lời sai. */
export function answerText(q: VisitQuestion): string {
  switch (q.type) {
    case 'cloze':
    case 'reply':
    case 'listen-pick':
    case 'translate':
      return q.options[q.correctIndex]!;
    case 'dictation':
    case 'order':
      return q.sentence;
  }
}

// ---------------------------------------------------------------------------
// Từ và bộ từ
// ---------------------------------------------------------------------------

export type WordRef = { deck: string; word: StudyWord };

const BANDS_BY_LEVEL: Record<Level, readonly string[]> = {
  1: ['5-6', '6-7'],
  2: ['6-7', '7-8'],
  3: ['7-8', '8+', '6-7'],
};

export function bandsForLevel(level: Level): readonly string[] {
  return BANDS_BY_LEVEL[level];
}

export function deckWords(deck: string): StudyWord[] {
  return getVocabTopic(deck)?.words ?? [];
}

export function deckExists(deck: string): boolean {
  return themeOfDeck(deck) !== null || getVocabTopic(deck) !== undefined;
}

/** Mọi từ của các bộ từ thật trong `decks` (bỏ bộ `reply-*`), có lọc theo mức nếu đủ từ. */
export function wordPool(decks: readonly string[], level: Level, minWords = 18): WordRef[] {
  const all: WordRef[] = [];
  for (const deck of decks) {
    if (themeOfDeck(deck)) continue;
    for (const word of deckWords(deck)) all.push({ deck, word });
  }
  const bands = BANDS_BY_LEVEL[level];
  const filtered = all.filter((w) => bands.includes(w.word.band));
  return filtered.length >= minWords ? filtered : all;
}

const infoOf = (w: StudyWord): WordInfo => ({ word: w.word, meaningVi: w.meaningVi, ipa: w.ipa, pos: w.pos, example: w.example });

export function wordKey(deck: string, word: string): string {
  return `${deck}|${word}`;
}

/** Số từ của câu ví dụ — loại câu quá ngắn / quá dài cho câu sắp xếp và chép. */
function exampleLength(w: StudyWord): number {
  return tokensOf(w.example ?? '').length;
}

export function supports(type: QuestionType, w: StudyWord): boolean {
  switch (type) {
    case 'cloze':
      return !!w.example && clozeOf(w.example, w.word) !== null;
    case 'dictation': {
      const n = exampleLength(w);
      return n >= 4 && n <= 16;
    }
    case 'order': {
      const n = exampleLength(w);
      return n >= 4 && n <= 12;
    }
    case 'listen-pick':
      return !!w.word;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Dựng từng loại câu
// ---------------------------------------------------------------------------

export function buildWordQuestion(
  type: 'cloze' | 'dictation' | 'listen-pick' | 'order',
  ref: WordRef,
  pool: readonly WordRef[],
  level: Level,
  rng: () => number,
): VisitQuestion | null {
  const { deck, word } = ref;
  const key = wordKey(deck, word.word);
  const base = { key, deck, info: infoOf(word) };
  const sameDeck = pool.filter((p) => p.deck === deck).map((p) => p.word);
  const choicePool = sameDeck.length >= 8 ? sameDeck : pool.map((p) => p.word);

  if (type === 'cloze') {
    const blank = clozeOf(word.example, word.word);
    if (!blank) return null;
    const { options, correctIndex } = makeChoices(word, choicePool, (w) => w.word, rng);
    // Đáp án hiển thị là DẠNG TRONG CÂU (đã chia), các phương án sai là từ gốc —
    // đồng nhất bằng cách hiện dạng gốc cho mọi phương án, đáp án gõ lại là `blank.answer`.
    return { id: `cloze|${key}`, type: 'cloze', ...base, before: blank.before, after: blank.after, answer: blank.answer, options, correctIndex };
  }
  if (type === 'dictation') {
    if (!supports('dictation', word)) return null;
    return { id: `dictation|${key}`, type: 'dictation', ...base, sentence: word.example.trim() };
  }
  if (type === 'order') {
    if (!supports('order', word)) return null;
    const sentence = word.example.trim();
    const toks = tokensOf(sentence);
    let tiles = shuffled(toks, rng);
    // Không để thứ tự xáo trùng đúng câu gốc.
    for (let i = 0; i < 5 && tiles.every((t, k) => t === toks[k]); i += 1) tiles = shuffled(toks, rng);
    return { id: `order|${key}`, type: 'order', ...base, sentence, tiles };
  }
  // listen-pick
  if (level === 1 || !word.example) {
    const { options, correctIndex } = makeChoices(word, choicePool, (w) => w.meaningVi, rng);
    return { id: `listen-pick|${key}`, type: 'listen-pick', ...base, mode: 'meaning', speak: word.word, options, correctIndex };
  }
  const { options, correctIndex } = makeChoices(word, choicePool, (w) => w.word, rng);
  return { id: `listen-pick|${key}`, type: 'listen-pick', ...base, mode: 'word', speak: word.example, options, correctIndex };
}

export function buildReplyQuestion(item: ReplyItem, rng: () => number): ReplyQuestion {
  const options = shuffled([item.answer, ...item.wrong], rng);
  return {
    id: `reply|${item.id}`,
    key: item.id,
    type: 'reply',
    deck: `reply-${item.theme}`,
    theme: item.theme,
    setup: item.setup,
    line: item.line,
    gloss: item.gloss,
    options,
    correctIndex: options.indexOf(item.answer),
    answerVi: item.answerVi,
  };
}

/** Chủ đề câu dịch theo loại địa điểm. */
const TRANSLATE_TOPICS: Partial<Record<PoiKind, SentenceTopic[]>> = {
  airport: ['travel'],
  counter: ['travel'],
  station: ['travel'],
  hotel: ['travel', 'economy'],
  cafe: ['family', 'society'],
  restaurant: ['health', 'family'],
  market: ['economy', 'society'],
  museum: ['education', 'society'],
  garden: ['environment'],
  landmark: ['travel', 'society'],
  secret: ['travel', 'society', 'environment'],
};

const DIFF_BY_LEVEL: Record<Level, TranslationItem['difficulty'][]> = {
  1: ['easy', 'medium'],
  2: ['easy', 'medium', 'hard'],
  3: ['medium', 'hard'],
};

export function translatePool(kind: PoiKind, level: Level): TranslationItem[] {
  const topics = TRANSLATE_TOPICS[kind] ?? ['travel'];
  const strict = TRANSLATION_SENTENCES.filter((t) => topics.includes(t.topic) && DIFF_BY_LEVEL[level].includes(t.difficulty));
  if (strict.length >= 3) return strict;
  const byTopic = TRANSLATION_SENTENCES.filter((t) => topics.includes(t.topic));
  return byTopic.length >= 3 ? byTopic : TRANSLATION_SENTENCES.filter((t) => DIFF_BY_LEVEL[level].includes(t.difficulty));
}

export function buildTranslateQuestion(item: TranslationItem, rng: () => number): TranslateQuestion {
  const others = TRANSLATION_SENTENCES.filter((t) => t.id !== item.id && normalizeAnswer(t.en) !== normalizeAnswer(item.en));
  const sameTopic = others.filter((t) => t.topic === item.topic);
  const rest = others.filter((t) => t.topic !== item.topic);
  const distractors = [...shuffled(sameTopic, rng), ...shuffled(rest, rng)].slice(0, 3).map((t) => t.en);
  const options = shuffled([item.en, ...distractors], rng);
  return {
    id: `translate|${item.id}`,
    key: item.id,
    type: 'translate',
    deck: 'translate',
    vi: item.vi,
    options,
    correctIndex: options.indexOf(item.en),
    hint: item.hint,
  };
}

/** Các bộ câu đáp dùng cho một địa điểm: bộ `reply-*` ghi rõ, hoặc theo loại địa điểm. */
export function replyThemesFor(decks: readonly string[], kind: PoiKind): ReplyTheme[] {
  const explicit = decks.map(themeOfDeck).filter((t): t is ReplyTheme => t !== null);
  if (explicit.length) return [...new Set(explicit)];
  const t = REPLY_THEME_BY_KIND[kind];
  return t ? [t] : [];
}

export function replyPool(decks: readonly string[], kind: PoiKind): ReplyItem[] {
  return replyThemesFor(decks, kind).flatMap((t) => REPLY_ITEMS[t]);
}
