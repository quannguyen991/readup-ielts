import { SAT_MATH_VOCAB_LESSONS, SAT_VERBAL_VOCAB_LESSONS, type VocabLesson } from '@/data/lessons/vocab-lessons';
import { shuffled, type StudyWord } from '@/services/vocab/topic-study';

/**
 * QUIZ ÔN TỪ VỰNG SAT — theo chủ đề, mỗi chủ đề ba mức từ dễ đến khó.
 *
 * Người dùng yêu cầu 26/09/2026: "bổ sung quiz ôn tập từ vựng SAT, từ dễ đến
 * khó, chia theo chủ đề". Chủ đề là 23 bài từ SAT sẵn có (Math theo mảng kiến
 * thức, Verbal theo chủ đề nghĩa). Ba mức khác nhau ở VIỆC PHẢI LÀM, không chỉ
 * ở số câu:
 *
 *   Dễ  — nhìn từ tiếng Anh, chọn nghĩa tiếng Việt. Chỉ cần nhận ra.
 *   Vừa — đọc định nghĩa tiếng Anh, chọn đúng từ. Phải nhớ từ từ nghĩa.
 *   Khó — điền từ vào chính câu ví dụ, hoặc chọn từ đồng / trái nghĩa. Phải
 *         hiểu từ trong ngữ cảnh — đúng kiểu Words in Context của đề thật.
 *
 * ĐÁP ÁN TÍNH BẰNG CODE từ dữ liệu từ điển của app, không gọi AI. Phương án
 * nhiễu lấy trong cùng chủ đề trước (khó phân biệt hơn, và các cặp trái nghĩa
 * nằm chung một bài), rồi mới tới cùng môn. Nhiễu nào là đồng nghĩa ghi sẵn của
 * đáp án thì bị loại — nếu không, câu có hai đáp án đúng.
 */

export type SatQuizLevel = 1 | 2 | 3;

export const SAT_QUIZ_LEVELS: { level: SatQuizLevel; name: string; task: string }[] = [
  { level: 1, name: 'Dễ', task: 'Nhìn từ, chọn nghĩa tiếng Việt' },
  { level: 2, name: 'Vừa', task: 'Đọc định nghĩa tiếng Anh, chọn đúng từ' },
  { level: 3, name: 'Khó', task: 'Điền từ vào câu, tìm từ đồng / trái nghĩa' },
];

export type SatQuizKind = 'meaning' | 'definition' | 'cloze' | 'synonym' | 'antonym';

export type SatQuizItem = {
  id: string;
  kind: SatQuizKind;
  word: StudyWord;
  /** Câu hỏi hiện to. */
  prompt: string;
  /** Câu có chỗ trống (dạng điền vào câu). */
  context?: string;
  options: string[];
  answerIndex: number;
};

export const SAT_QUIZ_KIND_LABEL: Record<SatQuizKind, string> = {
  meaning: 'Chọn nghĩa',
  definition: 'Từ nào khớp định nghĩa',
  cloze: 'Điền vào câu',
  synonym: 'Gần nghĩa nhất',
  antonym: 'Trái nghĩa',
};

export const SAT_QUIZ_TOPICS: { subject: 'math' | 'verbal'; label: string; lessons: VocabLesson[] }[] = [
  { subject: 'verbal', label: 'SAT Verbal · theo chủ đề nghĩa', lessons: SAT_VERBAL_VOCAB_LESSONS },
  { subject: 'math', label: 'SAT Math · thuật ngữ đề bài', lessons: SAT_MATH_VOCAB_LESSONS },
];

export function satQuizLesson(slug: string): VocabLesson | undefined {
  return [...SAT_MATH_VOCAB_LESSONS, ...SAT_VERBAL_VOCAB_LESSONS].find((l) => l.slug === slug);
}

const norm = (s: string) => s.trim().toLowerCase();

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Câu ví dụ có chứa đúng từ (cả cụm) không — `\b` của JS không hiểu chữ có dấu nên dùng \p{L}. */
export function clozeOf(word: string, example: string): string | null {
  const re = new RegExp(`(?<![\\p{L}])${escapeRe(word)}(?![\\p{L}])`, 'iu');
  if (!re.test(example)) return null;
  // "an ______" lộ đáp án bắt đầu bằng nguyên âm — viết "a(n)" như đề thật.
  return example.replace(re, '______').replace(/(?<!\p{L})([Aa])n? ______/u, '$1(n) ______');
}

/** Hai từ có bị ghi là đồng nghĩa của nhau không (theo dữ liệu viết tay). */
function related(a: StudyWord, b: StudyWord): boolean {
  const sa = (a.synonyms ?? []).map(norm);
  const sb = (b.synonyms ?? []).map(norm);
  // Hai từ nối cùng quan hệ logic ("that is" / "in other words") thay được cho nhau:
  // đặt cạnh nhau là câu có hai đáp án đúng.
  const sameLogic = a.pos.startsWith('từ nối') && a.pos === b.pos;
  return sameLogic || sa.includes(norm(b.word)) || sb.includes(norm(a.word)) || norm(a.meaningVi) === norm(b.meaningVi);
}

/** Ba nhiễu: cùng bài trước, rồi cùng môn; không trùng chữ, không là đồng nghĩa của đáp án. */
function distractors(
  answer: StudyWord,
  lesson: VocabLesson,
  pool: readonly StudyWord[],
  rng: () => number,
  text: (w: StudyWord) => string,
  extraBan: (w: StudyWord) => boolean = () => false,
): string[] {
  const seen = new Set([norm(text(answer))]);
  const out: string[] = [];
  const take = (list: readonly StudyWord[]) => {
    for (const w of shuffled(list, rng)) {
      if (out.length === 3) return;
      const t = text(w);
      if (!t || seen.has(norm(t)) || w.word === answer.word || related(answer, w) || extraBan(w)) continue;
      seen.add(norm(t));
      out.push(t);
    }
  };
  take(lesson.words);
  take(pool);
  return out;
}

function mcq(rng: () => number, correct: string, wrongs: string[]): { options: string[]; answerIndex: number } | null {
  if (wrongs.length < 3) return null;
  const options = shuffled([correct, ...wrongs.slice(0, 3)], rng);
  return { options, answerIndex: options.indexOf(correct) };
}

function subjectPool(lesson: VocabLesson): StudyWord[] {
  const lessons = lesson.subject === 'math' ? SAT_MATH_VOCAB_LESSONS : SAT_VERBAL_VOCAB_LESSONS;
  return lessons.flatMap((l) => l.words);
}

/** Một câu cho một từ ở một mức. `null` nếu dữ liệu không đủ dựng câu ở mức đó. */
function itemFor(word: StudyWord, level: SatQuizLevel, lesson: VocabLesson, pool: StudyWord[], rng: () => number): SatQuizItem | null {
  const id = `${lesson.slug}:${level}:${word.word}`;
  if (level === 1) {
    const m = mcq(rng, word.meaningVi, distractors(word, lesson, pool, rng, (w) => w.meaningVi));
    return m ? { id, kind: 'meaning', word, prompt: word.word, ...m } : null;
  }
  if (level === 2) {
    if (!word.definitionEn) return null;
    const m = mcq(rng, word.word, distractors(word, lesson, pool, rng, (w) => w.word));
    return m ? { id, kind: 'definition', word, prompt: word.definitionEn, ...m } : null;
  }
  // Mức khó: ưu tiên điền vào câu; không được thì đồng / trái nghĩa; cuối cùng mới lùi về định nghĩa.
  const context = word.example ? clozeOf(word.word, word.example) : null;
  if (context) {
    // Từ nào cũng xuất hiện nguyên văn trong câu ví dụ của đáp án thì loại (điền vào thành câu lặp từ).
    const m = mcq(rng, word.word, distractors(word, lesson, pool, rng, (w) => w.word, (w) => clozeOf(w.word, word.example) !== null));
    if (m) return { id, kind: 'cloze', word, prompt: 'Chọn từ điền vào chỗ trống', context, ...m };
  }
  const syn = word.synonyms?.[0];
  if (syn) {
    const synWords = new Set((word.synonyms ?? []).map(norm));
    const m = mcq(rng, syn, distractors(word, lesson, pool, rng, (w) => w.word, (w) => synWords.has(norm(w.word)) || (w.synonyms ?? []).map(norm).includes(norm(word.word))));
    if (m) return { id, kind: 'synonym', word, prompt: `Từ nào gần nghĩa nhất với “${word.word}”?`, ...m };
  }
  const ant = word.antonyms?.[0];
  if (ant) {
    const antWords = new Set((word.antonyms ?? []).map(norm));
    const m = mcq(rng, ant, distractors(word, lesson, pool, rng, (w) => w.word, (w) => antWords.has(norm(w.word))));
    if (m) return { id, kind: 'antonym', word, prompt: `Từ nào TRÁI nghĩa với “${word.word}”?`, ...m };
  }
  return itemFor(word, 2, lesson, pool, rng);
}

/** Cả bài quiz của một chủ đề ở một mức: mỗi từ một câu, thứ tự xáo theo hạt giống. */
export function buildSatQuiz(lesson: VocabLesson, level: SatQuizLevel, rng: () => number): SatQuizItem[] {
  const pool = subjectPool(lesson);
  const items: SatQuizItem[] = [];
  for (const w of shuffled(lesson.words, rng)) {
    const item = itemFor(w, level, lesson, pool, rng);
    if (item) items.push(item);
  }
  return items;
}

/** Đạt mức này chưa: đúng từ 80% trở lên. */
export function passed(score: number, total: number): boolean {
  return total > 0 && score / total >= 0.8;
}
