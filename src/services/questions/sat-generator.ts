import { hashString, mulberry32, shuffle } from './rng';
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
 * Bộ sinh đề SAT chạy offline, không cần API key.
 *
 * Khác bộ IELTS ở hai điểm cấu trúc: mọi câu SAT đều là trắc nghiệm ĐÚNG BỐN
 * lựa chọn, và số câu bám khổ bài (đề số hoá thật cho mỗi đoạn ngắn đúng một
 * câu hỏi, nên đoạn 130 từ không thể gánh 12 câu như một passage IELTS).
 *
 * Chỉ sinh HAI dạng, là hai dạng mà đáp án vừa KIỂM CHỨNG ĐƯỢC từ chính bài
 * vừa không giải được bằng mẹo: từ bị khoét là từ có thật trong câu, câu kết là
 * câu thật sự đứng cuối đoạn.
 *
 * Ba dạng còn lại của SAT để dành cho nhánh Claude, vì lý do khác nhau:
 * - Central Ideas và Text Structure đòi hiểu nghĩa cả đoạn. Đoán bằng thủ thuật
 *   văn bản (kiểu "ý chính là câu đầu tiên") sẽ ra ĐÁP ÁN SAI trên bài văn học,
 *   mà một câu hỏi sai đáp án còn tệ hơn là không có câu hỏi.
 * - Command of Evidence thì ngược lại: dựng được đáp án đúng, nhưng nhận định
 *   phải rút máy móc từ chính câu trả lời nên nó gần như chép lại câu đó —
 *   người học đối chiếu chuỗi là ra, không cần đọc hiểu. Đã kiểm thật trên
 *   Declaration of Independence: nhận định "He has obstructed the Administration
 *   of Justice." và đáp án đúng mở đầu bằng đúng chuỗi ấy.
 *
 * GIỚI HẠN ĐÃ ĐO (kho 833 bài SAT, 08/2026): 15 bài ra 0 câu, đều là đoạn chỉ
 * gồm MỘT câu văn dài. Đoạn một câu thì mọi từ trong bài đều đã nằm trước mắt
 * người đọc, không còn từ nào làm nhiễu mà họ chưa thấy — nên bỏ trống là đúng,
 * bịa thêm câu hỏi ở đó chỉ ra bài tập giải được bằng cách loại trừ.
 */

const TARGET_BY_TIER: Record<string, number> = {
  sat_short: 3,
  sat_long: 10,
};
const DEFAULT_TARGET = 6;

/**
 * Từ đủ dài để việc khoét chỗ trống có ý nghĩa, và không phải từ chức năng.
 *
 * Hạ dần khi vốn từ trong bài quá mỏng: đoạn hội thoại 80 từ có khi không đủ
 * bốn từ từ 6 chữ cái trở lên, mà bỏ trắng cả bài thì người học mở ra không có
 * gì để làm. Đã đo: ở ngưỡng cố định 6, có 16/588 đoạn ngắn ra 0 câu.
 */
const BLANK_WORD_LENGTHS = [6, 5, 4];

export function generateSatQuestionSet(article: Article): QuestionSet {
  const rng = mulberry32(hashString(article.id));
  const target = TARGET_BY_TIER[article.passageTier ?? ''] ?? DEFAULT_TARGET;

  const paragraphs = article.paragraphs.filter((p) => p.trim().length > 0);
  const sentences = paragraphs.flatMap((paragraph, index) =>
    splitSentences(paragraph)
      .map((text) => ({ text: text.trim(), paragraphIndex: index }))
      .filter((s) => wordsOf(s.text).length >= 6),
  );

  // Lấy luân phiên giữa các dạng thay vì trộn chung rồi cắt: mỗi câu trong bài
  // đều đẻ được một câu Words in Context, còn Inference thì chỉ đoạn từ 3 câu
  // trở lên mới có — trộn chung rồi cắt là dạng đông át hẳn dạng ít.
  const picked = interleave(
    [wordsInContext(article, sentences, rng), inferences(article, paragraphs, rng)],
    target,
  );

  return {
    articleId: article.id,
    title: `Bộ đề SAT: ${article.title}`,
    generatedBy: 'offline',
    model: null,
    createdAt: new Date().toISOString(),
    questions: picked.map((q, index) => ({ ...q, orderIndex: index })),
  };
}

type Sentence = { text: string; paragraphIndex: number };

// ── Words in Context ─────────────────────────────────────────────────────────

/**
 * Khoét một từ trong câu rồi hỏi từ nào điền vào là hợp lý nhất — đúng dạng
 * "Which choice completes the text with the most logical and precise word"
 * của đề số hoá. Đáp án là từ có thật trong bài nên luôn đúng.
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

  for (const sentence of sentences) {
    const candidate = contentWords(sentence.text, minLength).find((w) => !used.has(w));
    if (!candidate) continue;

    // Nhiễu cùng "dáng" từ (đuôi -ing, -ed, -tion…) để không loại được đáp án
    // chỉ bằng cách nhìn từ loại mà không đọc câu.
    const distractors = pickDistractors(pool, candidate, sentence.text, minLength, rng);
    if (distractors.length < OPTIONS_PER_QUESTION - 1) continue;

    used.add(candidate);

    out.push({
      id: `${article.id}-sat-wic-${out.length}`,
      orderIndex: 0,
      type: 'sat_words_in_context',
      prompt: blankOut(sentence.text, candidate),
      instruction:
        'Which choice completes the text with the most logical and precise word or phrase?',
      options: shuffle([candidate, ...distractors], rng),
      correctAnswer: candidate,
      evidenceText: sentence.text,
      evidenceParagraphIndex: sentence.paragraphIndex,
      explanation: `Câu gốc trong bài dùng từ "${candidate}". Ba lựa chọn còn lại đều xuất hiện ở chỗ khác trong bài nên nghe quen tai, nhưng đặt vào đây thì sai nghĩa hoặc sai cấu trúc câu.`,
      lessonTip:
        'Đọc trọn câu trước rồi mới nhìn đáp án. SAT luôn chọn nhiễu là từ đúng chủ đề nhưng sai sắc thái — nghĩa của câu quyết định, không phải chủ đề của bài.',
    });
  }

  return out;
}

// ── Inferences ───────────────────────────────────────────────────────────────

/**
 * Bỏ câu cuối của một đoạn rồi hỏi câu nào kết đoạn cho hợp lý — đúng dạng
 * "Which choice most logically completes the text". Câu bị bỏ chính là đáp án.
 */
function inferences(
  article: Article,
  paragraphs: string[],
  rng: () => number,
): GeneratedQuestion[] {
  const out: GeneratedQuestion[] = [];

  // Gom câu của MỌI đoạn để làm nhiễu — nhiễu lấy trong cùng đoạn thì bài ngắn
  // không đủ câu.
  const allSentences = paragraphs.flatMap((p) => splitSentences(p).map((s) => s.trim()));

  for (const [index, paragraph] of paragraphs.entries()) {
    const sentences = splitSentences(paragraph).map((s) => s.trim());
    if (sentences.length < 3) continue;

    const answer = sentences[sentences.length - 1]!;
    const opening = sentences.slice(0, -1).join(' ');

    const others = allSentences.filter((s) => s !== answer && !opening.includes(s));
    if (others.length < OPTIONS_PER_QUESTION - 1) continue;

    const distractors = shuffle(others, rng).slice(0, OPTIONS_PER_QUESTION - 1);

    out.push({
      id: `${article.id}-sat-inf-${index}`,
      orderIndex: 0,
      type: 'sat_inference',
      prompt: `${opening} ______`,
      instruction:
        'Which choice most logically completes the text?',
      options: shuffle([answer, ...distractors], rng),
      correctAnswer: answer,
      evidenceText: answer,
      evidenceParagraphIndex: index,
      explanation:
        'Đây là câu thật sự khép lại đoạn: nó nối tiếp mạch lập luận ngay phía trước. Các lựa chọn khác lấy từ chỗ khác trong bài nên đứt mạch.',
      lessonTip:
        'Câu điền vào chỗ trống phải nối được với câu ngay TRƯỚC nó. Chú ý từ nối và đại từ — chúng chỉ ra câu trước nói về cái gì.',
    });
  }

  return out;
}

