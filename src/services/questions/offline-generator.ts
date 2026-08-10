import type { GeneratedQuestion, QuestionSet } from './types';
import type { Article } from '@/data/articles';
import { splitSentences } from '@/services/ingest/readability';

/**
 * Bộ sinh đề chạy hoàn toàn offline, không cần API key.
 *
 * Nó bám vào chính câu chữ trong bài: mỗi câu hỏi đều trích được `evidence_text`
 * có thật, nên màn Test Review vẫn tô sáng đúng chỗ. Chất lượng dĩ nhiên không
 * bằng Claude — khi có ANTHROPIC_API_KEY thì `generateQuestionSet` sẽ ưu tiên AI
 * và chỉ rơi về bộ này khi lỗi.
 *
 * Sinh xác định (deterministic) theo id bài: mở lại vẫn ra đúng bộ đề đó.
 */

const TARGET_QUESTIONS = 12;

export function generateOfflineQuestionSet(article: Article): QuestionSet {
  const paragraphs = article.paragraphs.filter((p) => p.split(/\s+/).length >= 25);
  const rng = mulberry32(hashString(article.id));

  const questions: GeneratedQuestion[] = [];
  const usedSentences = new Set<string>();

  const pick = <T,>(items: T[]): T | undefined =>
    items.length === 0 ? undefined : items[Math.floor(rng() * items.length)];

  // 1. Matching Headings — mỗi đoạn một tiêu đề, đảo thứ tự lựa chọn.
  const headingParagraphs = paragraphs.slice(0, 5);
  if (headingParagraphs.length >= 3) {
    const headings = headingParagraphs.map((p) => summarizeParagraph(p));
    const shuffled = shuffle(headings, rng);

    headingParagraphs.forEach((paragraph, index) => {
      const answer = headings[index];
      if (!answer) return;

      questions.push({
        id: `${article.id}-mh-${index}`,
        orderIndex: questions.length,
        type: 'matching_headings',
        prompt: `Chọn tiêu đề đúng cho đoạn ${index + 1}.`,
        instruction: 'Mỗi tiêu đề chỉ dùng một lần.',
        options: shuffled,
        correctAnswer: answer,
        evidenceText: firstSentence(paragraph),
        evidenceParagraphIndex: index,
        explanation: `Đoạn ${index + 1} tập trung vào ý: ${answer.toLowerCase()}.`,
        lessonTip:
          'Đọc câu đầu và câu cuối đoạn trước — ý chính của đoạn thường nằm ở đó.',
      });
    });
  }

  // 2. True / False / Not Given — hai câu đúng, một câu bị đảo nghĩa, một câu bịa.
  for (let i = 0; i < paragraphs.length && questions.length < TARGET_QUESTIONS - 5; i += 1) {
    const paragraph = paragraphs[i];
    if (!paragraph) continue;

    const sentence = pick(
      splitSentences(paragraph).filter(
        (s) => s.split(/\s+/).length >= 12 && s.split(/\s+/).length <= 34 && !usedSentences.has(s),
      ),
    );
    if (!sentence) continue;
    usedSentences.add(sentence);

    const mode = questions.length % 3;

    if (mode === 0) {
      questions.push({
        id: `${article.id}-tf-${i}-t`,
        orderIndex: questions.length,
        type: 'true_false_not_given',
        prompt: paraphrase(sentence),
        instruction: 'Chọn TRUE, FALSE hoặc NOT GIVEN theo thông tin trong bài.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        evidenceText: sentence,
        evidenceParagraphIndex: i,
        explanation: `Bài viết nêu: "${sentence}" — trùng khớp với nội dung câu hỏi.`,
        lessonTip: 'Khớp ý, không khớp từ. Cùng ý mà khác từ vẫn là TRUE.',
      });
    } else if (mode === 1) {
      questions.push({
        id: `${article.id}-tf-${i}-f`,
        orderIndex: questions.length,
        type: 'true_false_not_given',
        prompt: negate(sentence),
        instruction: 'Chọn TRUE, FALSE hoặc NOT GIVEN theo thông tin trong bài.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        evidenceText: sentence,
        evidenceParagraphIndex: i,
        explanation: `Bài viết nói ngược lại: "${sentence}".`,
        lessonTip:
          'Một từ phủ định (not, never, no longer) đủ để lật câu từ TRUE thành FALSE.',
      });
    } else {
      questions.push({
        id: `${article.id}-tf-${i}-ng`,
        orderIndex: questions.length,
        type: 'true_false_not_given',
        prompt: inventClaim(sentence),
        instruction: 'Chọn TRUE, FALSE hoặc NOT GIVEN theo thông tin trong bài.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'NOT GIVEN',
        evidenceText: sentence,
        evidenceParagraphIndex: i,
        explanation:
          'Bài có nhắc tới chủ đề này nhưng không đưa ra thông tin để khẳng định hay bác bỏ.',
        lessonTip:
          'NOT GIVEN là khi bài im lặng. Đừng suy luận từ kiến thức bên ngoài bài đọc.',
      });
    }
  }

  // 3. Sentence Completion — khoét một danh từ/số liệu quan trọng.
  for (let i = 0; i < paragraphs.length && questions.length < TARGET_QUESTIONS - 2; i += 1) {
    const paragraph = paragraphs[i];
    if (!paragraph) continue;

    const candidate = splitSentences(paragraph).find((s) => findKeyword(s) !== null);
    if (!candidate) continue;

    const keyword = findKeyword(candidate);
    if (!keyword) continue;

    questions.push({
      id: `${article.id}-sc-${i}`,
      orderIndex: questions.length,
      type: 'sentence_completion',
      prompt: candidate.replace(keyword, '________'),
      instruction: 'Điền KHÔNG QUÁ HAI TỪ lấy từ bài đọc.',
      options: null,
      correctAnswer: keyword,
      evidenceText: candidate,
      evidenceParagraphIndex: i,
      explanation: `Chỗ trống lấy đúng từ trong bài: "${keyword}".`,
      lessonTip: 'Chép nguyên dạng từ trong bài — không đổi số ít/số nhiều, không viết lại.',
    });
  }

  // 4. Short Answer — hỏi về con số xuất hiện trong bài.
  const numberSentence = paragraphs
    .map((p, index) => ({ index, sentence: splitSentences(p).find((s) => /\d/.test(s)) }))
    .find((x) => x.sentence);

  if (numberSentence?.sentence) {
    const number = numberSentence.sentence.match(/\d[\d,.]*/)?.[0];
    if (number) {
      questions.push({
        id: `${article.id}-sa`,
        orderIndex: questions.length,
        type: 'short_answer',
        prompt: `Theo bài đọc, con số nào được nêu trong câu: "${numberSentence.sentence.replace(
          number,
          '…',
        )}"?`,
        instruction: 'Trả lời KHÔNG QUÁ BA TỪ hoặc một con số.',
        options: null,
        correctAnswer: number,
        evidenceText: numberSentence.sentence,
        evidenceParagraphIndex: numberSentence.index,
        explanation: `Câu trong bài ghi rõ con số ${number}.`,
        lessonTip: 'Câu hỏi có số liệu thường dễ ăn điểm — quét số trước, đọc câu sau.',
      });
    }
  }

  // 5. Multiple Choice — ý chính toàn bài.
  const mainIdea = summarizeParagraph(paragraphs[0] ?? article.title);
  const distractors = paragraphs.slice(1, 4).map((p) => summarizeParagraph(p));
  if (distractors.length >= 2) {
    questions.push({
      id: `${article.id}-mc`,
      orderIndex: questions.length,
      type: 'multiple_choice',
      prompt: 'Ý chính của toàn bài là gì?',
      instruction: 'Chọn MỘT đáp án đúng.',
      options: shuffle([mainIdea, ...distractors], rng),
      correctAnswer: mainIdea,
      evidenceText: firstSentence(paragraphs[0] ?? article.title),
      evidenceParagraphIndex: 0,
      explanation: 'Đoạn mở đầu nêu chủ đề bao trùm cả bài; các đáp án còn lại chỉ là ý phụ.',
      lessonTip: 'Ý chính phải bao được cả bài, không phải chi tiết của một đoạn.',
    });
  }

  return {
    articleId: article.id,
    title: `Bộ đề: ${article.title}`,
    generatedBy: 'offline',
    model: null,
    createdAt: new Date().toISOString(),
    questions: questions
      .slice(0, TARGET_QUESTIONS)
      .map((q, index) => ({ ...q, orderIndex: index })),
  };
}

// ── Tiện ích ngôn ngữ ─────────────────────────────────────────────────────────

function summarizeParagraph(paragraph: string): string {
  const sentence = firstSentence(paragraph);
  const words = sentence.split(/\s+/).slice(0, 9).join(' ');
  return words.replace(/[,;:]$/, '').replace(/\.$/, '');
}

function firstSentence(text: string): string {
  return splitSentences(text)[0] ?? text.slice(0, 160);
}

function paraphrase(sentence: string): string {
  return sentence
    .replace(/\bis\b/g, 'remains')
    .replace(/\bmany\b/gi, 'a large number of')
    .replace(/\bimportant\b/gi, 'significant')
    .replace(/\bhelps?\b/gi, 'contributes to');
}

function negate(sentence: string): string {
  if (/\bis\b/.test(sentence)) return sentence.replace(/\bis\b/, 'is not');
  if (/\bare\b/.test(sentence)) return sentence.replace(/\bare\b/, 'are not');
  if (/\bcan\b/.test(sentence)) return sentence.replace(/\bcan\b/, 'cannot');
  if (/\bhas\b/.test(sentence)) return sentence.replace(/\bhas\b/, 'does not have');
  return `It is not true that ${lowerFirst(sentence)}`;
}

function inventClaim(sentence: string): string {
  const subject = sentence.split(/\s+/).slice(0, 4).join(' ');
  return `${subject} is considered the most popular topic among researchers worldwide.`;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Từ khoá để khoét: ưu tiên số liệu, sau đó là danh từ dài không phổ biến. */
function findKeyword(sentence: string): string | null {
  const number = sentence.match(/\b\d[\d,.]*\s?(?:%|percent|kilometres|km|years|species)?\b/);
  if (number?.[0] && number[0].trim().length > 1) return number[0].trim();

  const words = sentence.match(/\b[a-z]{7,}\b/g);
  const candidate = words?.find((w) => !STOP_WORDS.has(w));
  return candidate ?? null;
}

const STOP_WORDS = new Set([
  'because',
  'between',
  'however',
  'therefore',
  'although',
  'together',
  'including',
  'especially',
  'generally',
  'different',
  'important',
  'following',
]);

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a !== undefined && b !== undefined) {
      copy[i] = b;
      copy[j] = a;
    }
  }
  return copy;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
