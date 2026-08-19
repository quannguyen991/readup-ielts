import { hashString, mulberry32, shuffle } from './rng';
import { generateSatQuestionSet } from './sat-generator';
import {
  OPTIONS_PER_QUESTION,
  blankOut,
  contentWords,
  interleave,
  pickDistractors,
  wordsOf,
} from './text-utils';
import type { GeneratedQuestion, QuestionSet } from './types';
import type { Article } from '@/data/articles';
import { splitSentences } from '@/services/ingest/readability';

/**
 * Bộ sinh đề chạy hoàn toàn offline, không cần API key.
 *
 * Sinh xác định (deterministic) theo id bài: mở lại vẫn ra đúng bộ đề đó.
 *
 * LUẬT: chỉ sinh dạng nào thoả CẢ HAI điều kiện — đáp án kiểm chứng được từ
 * chính bài, và câu hỏi không giải được bằng đối chiếu chuỗi với bài đọc.
 *
 * Bản trước vi phạm cả hai ở mọi dạng, nên đã bỏ hết:
 * - Matching Headings: "tiêu đề" là 9 từ đầu của chính đoạn đó, lại hỏi theo
 *   đúng thứ tự đoạn 1→5. Ghép chuỗi là xong, không cần đọc.
 * - Sentence Completion: chép nguyên câu trong bài rồi khoét một từ → Ctrl-F.
 * - Short Answer: "con số nào nêu trong câu này?" → chép lại con số.
 * - Multiple Choice ý chính: bốn lựa chọn là 9 từ đầu của đoạn 1–4, đáp án LUÔN
 *   là đoạn 1 — đoán được bằng vị trí.
 * - True/False/Not Given: FALSE luôn là câu gốc chèn "not", NOT GIVEN luôn kết
 *   thúc bằng cùng một mệnh đề template. Làm hai bài là thuộc mẹo.
 *
 * Bốn dạng IELTS còn lại (Matching Headings, Matching Information, Sentence
 * Completion, True/False/Not Given) để dành cho nhánh Claude, vì cả bốn đều đòi
 * PARAPHRASE THẬT: nhận định phải diễn đạt lại ý của bài bằng chữ khác. Diễn đạt
 * lại bằng phép thay chuỗi thì hoặc ra câu sai nghĩa, hoặc giữ nguyên đủ chữ để
 * dò ngược — đằng nào cũng hỏng. Đây là cùng lý do bộ SAT chỉ sinh hai trong
 * năm dạng của nó.
 *
 * ĐÃ ĐO (kho 567 bài IELTS đọc được, 08/2026): trung bình 11,4 câu/bài, trung vị
 * 12, chỉ 2 bài ra 0 câu. Hai bài đó đều là bài một đoạn ngắn — không đủ đoạn để
 * cắt câu kết, cũng không đủ vốn từ để làm nhiễu.
 */

const TARGET_QUESTIONS = 12;

/** Đoạn ngắn hơn thì không đủ chữ để vừa khoét vừa còn ngữ cảnh mà đoán. */
const MIN_PARAGRAPH_WORDS = 25;

/**
 * Từ đủ dài để việc khoét chỗ trống có ý nghĩa. Hạ dần khi vốn từ trong bài quá
 * mỏng, giống bộ SAT.
 */
const BLANK_WORD_LENGTHS = [7, 6, 5];

export function generateOfflineQuestionSet(article: Article): QuestionSet {
  // Bài SAT phải ra dạng câu của SAT. Ra True/False/Not Given trên một trích
  // đoạn Jane Austen là luyện sai kỳ thi.
  if (article.exam === 'sat') return generateSatQuestionSet(article);

  return generateIeltsQuestionSet(article);
}

type Sentence = { text: string; paragraphIndex: number };

function generateIeltsQuestionSet(article: Article): QuestionSet {
  const rng = mulberry32(hashString(article.id));

  const paragraphs = article.paragraphs.filter(
    (p) => wordsOf(p).length >= MIN_PARAGRAPH_WORDS,
  );

  const sentences: Sentence[] = paragraphs.flatMap((paragraph, index) =>
    splitSentences(paragraph)
      .map((text) => ({ text: text.trim(), paragraphIndex: index }))
      .filter((s) => wordsOf(s.text).length >= 8),
  );

  // Rút luân phiên để dạng nhiều nguồn không át dạng ít: mỗi câu trong bài đều
  // đẻ được một câu Words in Context, còn Paragraph Completion thì chỉ đoạn từ
  // 3 câu trở lên mới có.
  const picked = interleave(
    [
      wordsInContext(article, sentences, rng),
      paragraphCompletion(article, paragraphs, rng),
    ],
    TARGET_QUESTIONS,
  );

  // Xếp tăng dần: đoán từ trong một câu trước, nắm mạch cả đoạn sau.
  const ordered = [...picked].sort((a, b) => difficultyRank(a) - difficultyRank(b));

  return {
    articleId: article.id,
    title: `Bộ đề: ${article.title}`,
    generatedBy: 'offline',
    model: null,
    createdAt: new Date().toISOString(),
    questions: ordered.map((q, index) => ({ ...q, orderIndex: index })),
  };
}

/** Words in Context dễ hơn Paragraph Completion: một câu so với cả đoạn. */
function difficultyRank(question: GeneratedQuestion): number {
  return question.id.includes('-wic-') ? 0 : 1;
}

// ── Words in Context ─────────────────────────────────────────────────────────

/**
 * Khoét một từ mang nghĩa trong câu, bốn lựa chọn đều là từ CÓ THẬT ở chỗ khác
 * trong bài.
 *
 * Đáp án luôn đúng vì đó là từ gốc. Không dò ngược được vì từ đã bị che, và
 * không loại nhiễu bằng cảm giác "từ này lạ" được vì nhiễu cũng lấy từ bài ra.
 */
function wordsInContext(
  article: Article,
  sentences: Sentence[],
  rng: () => number,
): GeneratedQuestion[] {
  const body = sentences.map((s) => s.text).join(' ');

  const minLength =
    BLANK_WORD_LENGTHS.find((n) => contentWords(body, n).length >= OPTIONS_PER_QUESTION) ??
    BLANK_WORD_LENGTHS[BLANK_WORD_LENGTHS.length - 1]!;

  const pool = contentWords(body, minLength);
  if (pool.length < OPTIONS_PER_QUESTION) return [];

  const out: GeneratedQuestion[] = [];
  const used = new Set<string>();

  // Đảo thứ tự câu nguồn: câu hỏi không được đi theo đúng thứ tự đoạn trong bài,
  // vì như thế là chỉ cần đọc lần lượt từ trên xuống mà không cần định vị.
  for (const sentence of shuffle(sentences, rng)) {
    const candidate = contentWords(sentence.text, minLength).find((w) => !used.has(w));
    if (!candidate) continue;

    const distractors = pickDistractors(pool, candidate, sentence.text, minLength, rng);
    if (distractors.length < OPTIONS_PER_QUESTION - 1) continue;

    used.add(candidate);

    out.push({
      id: `${article.id}-wic-${out.length}`,
      orderIndex: 0,
      type: 'multiple_choice',
      prompt: blankOut(sentence.text, candidate),
      instruction: 'Choose the word that best completes the gap.',
      options: shuffle([candidate, ...distractors], rng),
      correctAnswer: candidate,
      evidenceText: sentence.text,
      evidenceParagraphIndex: sentence.paragraphIndex,
      explanation: `Câu gốc trong bài dùng từ "${candidate}". Ba lựa chọn còn lại đều lấy từ chỗ khác trong chính bài này nên nghe rất quen, nhưng đặt vào đây thì sai nghĩa hoặc sai cấu trúc câu.`,
      lessonTip:
        'Đọc trọn câu rồi mới nhìn đáp án. Từ đúng phải hợp cả nghĩa lẫn ngữ pháp — hợp chủ đề thôi thì chưa đủ.',
    });
  }

  return out;
}

// ── Paragraph Completion ─────────────────────────────────────────────────────

/**
 * Cắt câu cuối của một đoạn rồi hỏi câu nào khép đoạn cho hợp lý. Nhiễu là câu
 * cuối thật của những đoạn khác trong cùng bài.
 *
 * Đáp án kiểm chứng được vì đó là câu thật của đoạn. Không đối chiếu chuỗi được
 * vì câu đã bị lấy ra khỏi đoạn — muốn chọn đúng phải theo được mạch lập luận
 * và mấy từ nối, đại từ ở câu ngay trước.
 */
function paragraphCompletion(
  article: Article,
  paragraphs: string[],
  rng: () => number,
): GeneratedQuestion[] {
  const out: GeneratedQuestion[] = [];

  // Gom câu cuối của mọi đoạn để làm nhiễu: nhiễu phải là câu KẾT của đoạn khác,
  // không phải câu giữa đoạn — câu giữa đoạn loại được ngay vì nó lửng lơ.
  const closings = paragraphs.map((p) => {
    const sentences = splitSentences(p).map((s) => s.trim());
    return sentences[sentences.length - 1] ?? '';
  });

  for (const [index, paragraph] of paragraphs.entries()) {
    const sentences = splitSentences(paragraph).map((s) => s.trim());
    if (sentences.length < 3) continue;

    const answer = sentences[sentences.length - 1]!;
    const opening = sentences.slice(0, -1).join(' ');

    const others = closings.filter((s) => s && s !== answer && !opening.includes(s));
    if (others.length < OPTIONS_PER_QUESTION - 1) continue;

    const distractors = shuffle(others, rng).slice(0, OPTIONS_PER_QUESTION - 1);

    out.push({
      id: `${article.id}-pc-${index}`,
      orderIndex: 0,
      type: 'multiple_choice',
      prompt: `${opening} ______`,
      instruction: 'Choose the sentence that most logically completes the paragraph.',
      options: shuffle([answer, ...distractors], rng),
      correctAnswer: answer,
      evidenceText: answer,
      evidenceParagraphIndex: index,
      explanation:
        'Đây là câu thật sự khép lại đoạn: nó nối tiếp ý của câu ngay trước đó. Ba lựa chọn kia là câu kết của những đoạn khác trong bài, nên đặt vào đây là đứt mạch.',
      lessonTip:
        'Câu điền vào chỗ trống phải nối được với câu ngay TRƯỚC nó. Bám vào từ nối (however, therefore…) và đại từ — chúng chỉ ngược lại thứ vừa được nhắc.',
    });
  }

  return out;
}
