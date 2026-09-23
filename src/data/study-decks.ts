/**
 * "Bộ học" — mọi nguồn từ vựng của app quy về một khuôn chung để các chế độ học
 * (Lật thẻ, Học, Nghe chép, Điền câu, Phát âm, Kiểm tra, Bóng bay) chạy trên
 * bất kỳ nguồn nào, không chỉ bộ chủ đề IELTS:
 *
 * - `<slug chủ đề>`       — 50 bộ từ theo chủ đề IELTS.
 * - `sat-math-<nhóm>`     — thuật ngữ SAT Math theo nhóm (Đại số, Hình học…).
 * - `sat-math-bai-N`, `sat-verbal-bai-N` — bài từ vựng SAT (xem `lessons/vocab-lessons.ts`).
 * - `so-tu`               — sổ từ cá nhân: những từ người học tự lưu lúc đọc.
 *
 * Hàm thuần, không đọc store — sổ từ được dựng từ danh sách mục truyền vào.
 */
import { SAT_VOCAB_CATEGORY_BLURB, SAT_VOCAB_CATEGORY_LABEL, SAT_VOCAB_CATEGORY_ORDER, SAT_VOCAB_TERMS } from './sat-math-vocab';
import { BAND_ORDER, getVocabTopic } from './vocab-topics';
import type { StudyWord } from '@/services/vocab/topic-study';
import { SAT_VOCAB_LESSONS } from './lessons/vocab-lessons';

export type StudyDeck = {
  slug: string;
  kind: 'topic' | 'sat-math' | 'notebook';
  name: string;
  nameVi: string;
  blurb: string;
  words: StudyWord[];
};

export const NOTEBOOK_SLUG = 'so-tu';
const SAT_PREFIX = 'sat-math-';

export function satMathDeckSlug(category: string): string {
  return `${SAT_PREFIX}${category.replace(/_/g, '-')}`;
}

export const SAT_MATH_DECKS: StudyDeck[] = SAT_VOCAB_CATEGORY_ORDER.map((cat) => ({
  slug: satMathDeckSlug(cat),
  kind: 'sat-math' as const,
  name: 'SAT Math vocabulary',
  nameVi: `SAT Math · ${SAT_VOCAB_CATEGORY_LABEL[cat]}`,
  blurb: SAT_VOCAB_CATEGORY_BLURB[cat],
  words: SAT_VOCAB_TERMS.filter((t) => t.category === cat).map((t) => ({
    word: t.term,
    pos: '',
    ipa: '',
    meaningVi: t.meaningVi,
    definitionEn: t.definitionEn,
    example: t.example,
    collocation: '',
    band: SAT_VOCAB_CATEGORY_LABEL[cat],
  })),
})).filter((d) => d.words.length > 0);

/** Bộ không phụ thuộc dữ liệu người dùng: chủ đề IELTS và thuật ngữ SAT Math. */
export function getStaticDeck(slug: string): StudyDeck | undefined {
  const lesson = SAT_VOCAB_LESSONS.find((l) => l.slug === slug);
  if (lesson) {
    return {
      slug: lesson.slug,
      kind: 'sat-math',
      name: lesson.subject === 'math' ? 'SAT Math vocabulary' : 'SAT Verbal vocabulary',
      nameVi: `${lesson.subject === 'math' ? 'SAT Math' : 'SAT Verbal'} · ${lesson.title}`,
      blurb: lesson.blurb,
      words: lesson.words,
    };
  }
  const sat = SAT_MATH_DECKS.find((d) => d.slug === slug);
  if (sat) return sat;
  const t = getVocabTopic(slug);
  return t ? { slug: t.slug, kind: 'topic', name: t.name, nameVi: t.nameVi, blurb: t.blurb, words: t.words } : undefined;
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
    if (!e.definitionVi || seen.has(key)) continue;
    seen.add(key);
    words.push({
      word: e.lemma || e.word,
      pos: e.partOfSpeech ?? '',
      ipa: e.phonetic ?? '',
      meaningVi: e.definitionVi,
      definitionEn: e.definitionGeneral ?? e.definitionContext ?? '',
      example: e.exampleSentence || e.sourceSentence || '',
      collocation: '',
      band: e.isCollocation ? 'Cụm từ' : 'Sổ từ',
    });
  }
  return { slug: NOTEBOOK_SLUG, kind: 'notebook', name: 'My notebook', nameVi: 'Sổ từ của bạn', blurb: 'Những từ bạn tự lưu khi đọc.', words };
}

/** Nhóm từ để hiện danh sách: bộ IELTS theo band (dễ → khó), bộ khác một nhóm. */
export function groupDeckWords(deck: StudyDeck): { label: string; words: StudyWord[] }[] {
  if (deck.kind !== 'topic') return deck.words.length ? [{ label: deck.kind === 'notebook' ? 'Từ đã lưu' : 'Thuật ngữ', words: deck.words }] : [];
  return BAND_ORDER.map((band) => ({ label: `Band ${band}`, words: deck.words.filter((w) => w.band === band) })).filter((g) => g.words.length > 0);
}

/** "noun · /ˈhæbɪtæt/" — bỏ phần trống, bộ SAT không có loại từ và phiên âm. */
export function posIpa(w: Pick<StudyWord, 'pos' | 'ipa'>): string {
  return [w.pos, w.ipa].filter(Boolean).join(' · ');
}

/** Nhãn mức của từ: "Band 5-6" với bộ IELTS, tên nhóm với bộ khác. */
export function levelLabel(band: string): string {
  return /^\d/.test(band) ? `Band ${band}` : band;
}
