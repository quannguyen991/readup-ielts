/**
 * "Bộ học" — mọi nguồn từ vựng của app quy về một khuôn chung để các chế độ học
 * (Lật thẻ, Học, Nghe chép, Điền câu, Phát âm, Kiểm tra, Bóng bay) chạy trên
 * bất kỳ nguồn nào, không chỉ bộ chủ đề IELTS:
 *
 * - `<slug chủ đề>`       — 50 bộ từ theo chủ đề IELTS.
 * - `sat-math-bai-N`, `sat-verbal-bai-N` — bài từ vựng SAT (xem `lessons/vocab-lessons.ts`).
 *   Thuật ngữ SAT Math CHỈ có ở dạng bài (6–8 từ), không còn bộ theo cả mảng
 *   kiến thức — hai cách chia cùng một kho từ từng nằm song song và trùng nhau.
 * - `so-tu`               — sổ từ cá nhân: những từ người học tự lưu lúc đọc.
 *
 * Hàm thuần, không đọc store — sổ từ được dựng từ danh sách mục truyền vào.
 */
import { BAND_ORDER, getVocabTopic } from './vocab-topics';
import type { StudyWord } from '@/services/vocab/topic-study';
import { SAT_VOCAB_LESSONS } from './lessons/vocab-lessons';
import { OXFORD_TOPIC_DECKS } from './oxford-topics-decks';
import { fillStudyDeck } from './study-deck-fill';

export type StudyDeck = {
  slug: string;
  kind: 'topic' | 'oxford' | 'sat' | 'notebook' | 'custom';
  name: string;
  nameVi: string;
  blurb: string;
  words: StudyWord[];
};

export const NOTEBOOK_SLUG = 'so-tu';
/** Bộ không phụ thuộc dữ liệu người dùng: chủ đề IELTS và bài từ vựng SAT. Đã bổ sung câu ví dụ và headword sạch (xem `study-deck-fill.ts`). */
export type LevelSlice = 'all' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

const LEVEL_SUFFIX = /^(.*?)--(all|A1|A2|B1|B2|C1|C2)$/;
const BAND_TO_LEVEL: Record<string, string> = { '5-6': 'B1', '6-7': 'B2', '7-8': 'C1', '8+': 'C2' };

/** Mức của một từ: CEFR nếu có, không thì quy từ band IELTS, không thì giữ nguyên (cấp A1–C1 của Oxford). */
export function levelOf(w: { cefr?: string; band: string }): string {
  return w.cefr ?? BAND_TO_LEVEL[w.band] ?? w.band;
}

/** Tách `bo--B1` thành bộ gốc và mức. Không có hậu tố thì `level` là null. */
export function splitLevelSlug(slug: string): { base: string; level: LevelSlice | null } {
  const m = LEVEL_SUFFIX.exec(slug);
  return m ? { base: m[1]!, level: m[2] as LevelSlice } : { base: slug, level: null };
}

/**
 * Các mức có trong bộ gốc, theo thứ tự A1 → C2. Bộ chỉ có một mức (hoặc không có mức nào)
 * thì trả về mảng rỗng: không cần bước chọn cấp độ.
 */
export function deckLevels(slug: string): string[] {
  if (splitLevelSlug(slug).level) return [];
  const deck = getStaticDeck(slug);
  if (!deck) return [];
  const set = new Set(deck.words.map((w) => levelOf(w)));
  return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].filter((lv) => set.has(lv));
}

export function getStaticDeck(slug: string): StudyDeck | undefined {
  const deck = rawStaticDeck(slug);
  return deck && fillStudyDeck(deck);
}

export function rawStaticDeck(slug: string): StudyDeck | undefined {
  const { base, level } = splitLevelSlug(slug);
  if (level) {
    const deck = rawStaticDeck(base);
    if (!deck) return undefined;
    if (level === 'all') return { ...deck, slug };
    const words = deck.words.filter((w) => levelOf(w) === level);
    return { ...deck, slug, words, name: `${deck.name} · ${level}`, nameVi: `${deck.nameVi} · ${level}`, blurb: `${words.length} từ, cấp ${level}.` };
  }
  const lesson = SAT_VOCAB_LESSONS.find((l) => l.slug === slug);
  if (lesson) {
    return {
      slug: lesson.slug,
      kind: 'sat',
      name: lesson.subject === 'math' ? 'SAT Math vocabulary' : 'SAT Verbal vocabulary',
      nameVi: `${lesson.subject === 'math' ? 'SAT Math' : 'SAT Verbal'} · ${lesson.title}`,
      blurb: lesson.blurb,
      words: lesson.words,
    };
  }
  const t = getVocabTopic(slug);
  if (t) return { slug: t.slug, kind: 'topic', name: t.name, nameVi: t.nameVi, blurb: t.blurb, words: t.words };
  // Bộ Oxford 3000 dùng đúng màn học của bộ IELTS. Từ Oxford không có phiên âm hay
  // định nghĩa tiếng Anh, nên hai trường đó để trống; cấp A1–C1 đi vào trường `band`.
  const o = OXFORD_TOPIC_DECKS.find((d) => d.slug === slug);
  if (o)
    return {
      slug: o.slug,
      kind: 'oxford',
      name: `Oxford 3000 · ${o.titleEn}`,
      nameVi: `Oxford 3000 · ${o.title}`,
      blurb: `${o.words.length} từ cốt lõi, xếp theo cấp độ A1–C1.`,
      words: o.words.map((w) => ({ word: w.word, pos: w.pos, ipa: '', meaningVi: w.meaningVi, definitionEn: '', example: w.example, collocation: '', band: w.level })),
    };
  return undefined;
}

export type NotebookSource = {
  word: string;
  lemma: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definitionVi: string | null;
  definitionGeneral: string | null;
  definitionContext: string | null;
  exampleSentence: string | null;
  sourceSentence: string;
  isCollocation: boolean;
};

/**
 * Sổ từ cá nhân thành một bộ học. Chỉ lấy mục CÓ NGHĨA TIẾNG VIỆT — không có
 * nghĩa thì không hỏi được chiều Việt → Anh, và trắc nghiệm ra lựa chọn rỗng.
 * Trùng lemma thì giữ mục đầu.
 */
export function notebookDeck(entries: readonly NotebookSource[]): StudyDeck {
  const seen = new Set<string>();
  const words: StudyWord[] = [];
  for (const e of entries) {
    const key = (e.lemma || e.word).toLowerCase();
    if (seen.has(key)) continue;
    const meaning = e.definitionVi || e.definitionGeneral || e.definitionContext || 'Từ vựng đã lưu';
    seen.add(key);
    words.push({
      word: e.lemma || e.word,
      pos: e.partOfSpeech ?? '',
      ipa: e.phonetic ?? '',
      meaningVi: meaning,
      definitionEn: e.definitionGeneral ?? e.definitionContext ?? '',
      example: e.exampleSentence || e.sourceSentence || '',
      collocation: e.definitionContext ?? '',
      band: e.isCollocation ? 'Cụm từ' : 'Sổ từ',
    });
  }
  return { slug: NOTEBOOK_SLUG, kind: 'notebook', name: 'My notebook', nameVi: 'Sổ từ của bạn', blurb: 'Những từ bạn tự lưu khi đọc và học.', words };
}

/** Nhóm từ để hiện danh sách: bộ IELTS theo band (dễ → khó), bộ khác một nhóm. */
export function groupDeckWords(deck: StudyDeck): { label: string; words: StudyWord[] }[] {
  if (deck.kind === 'oxford') {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
    return levels.map((level) => ({ label: level, words: deck.words.filter((w) => w.band === level) })).filter((g) => g.words.length > 0);
  }
  if (deck.kind !== 'topic')
    return deck.words.length
      ? [{ label: deck.kind === 'notebook' ? 'Từ đã lưu' : deck.kind === 'custom' ? 'Từ trong bài' : 'Thuật ngữ', words: deck.words }]
      : [];
  return BAND_ORDER.map((band) => {
    const words = deck.words.filter((w) => w.band === band);
    // Nhãn theo mức B1–C2 khi từ có `cefr`; bộ chưa có thì giữ nhãn band cũ.
    const cefr = words.find((w) => w.cefr)?.cefr;
    return { label: cefr ? `${cefr} · Band ${band}` : `Band ${band}`, words };
  }).filter((g) => g.words.length > 0);
}

export { posIpa } from '@/services/vocab/pos-ipa';

/** Nhãn mức của từ: "Band 5-6" với bộ IELTS, tên nhóm với bộ khác. */
export function levelLabel(band: string): string {
  return /^\d/.test(band) ? `Band ${band}` : band;
}
