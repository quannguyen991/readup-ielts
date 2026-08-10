import Anthropic from '@anthropic-ai/sdk';

import { AI_MODELS } from './client';
import { AiError, toAiError } from './errors';
import { withRetry } from './retry';
import { serverEnv } from '@/lib/env';
import type { GeneratedQuestion, QuestionSet } from '@/services/questions/types';
import type { QuestionType } from '@/types/database';

/** SERVER-ONLY. Sinh bộ đề IELTS bằng Claude từ toàn văn bài đọc. */

let client: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: serverEnv('ANTHROPIC_API_KEY'), maxRetries: 0 });
  }
  return client;
}

const VALID_TYPES = new Set<QuestionType>([
  'true_false_not_given',
  'yes_no_not_given',
  'matching_headings',
  'matching_information',
  'multiple_choice',
  'sentence_completion',
  'summary_completion',
  'short_answer',
]);

const SYSTEM_PROMPT = `Bạn là chuyên gia ra đề IELTS Academic Reading, có 15 năm kinh nghiệm chấm thi.

Nhiệm vụ: từ bài đọc được cung cấp, tạo bộ câu hỏi đúng chuẩn IELTS.

QUY TẮC BẮT BUỘC:
1. Trả về JSON THUẦN. Không markdown fence, không lời dẫn, không giải thích ngoài JSON.
2. Mỗi câu hỏi PHẢI có evidence_text là đoạn trích NGUYÊN VĂN từ bài (copy chính xác, không sửa một chữ), và evidence_paragraph_index là số thứ tự đoạn chứa đoạn trích đó (đếm từ 0).
3. explanation viết bằng tiếng Việt, chỉ rõ vì sao đáp án đúng và vì sao đáp án gây nhiễu sai.
4. lesson_tip viết bằng tiếng Việt: một bài học chung rút ra được, áp dụng cho cả những bài khác — ví dụ "'Can be seen' nghĩa là nhìn thấy được, không phải không nhìn thấy".
5. Câu hỏi viết bằng tiếng Anh (đúng như đề thi thật). Chỉ explanation và lesson_tip dùng tiếng Việt.
6. Đáp án phải suy ra được TỪ BÀI, không dùng kiến thức bên ngoài.
7. Với NOT GIVEN: bài phải im lặng về thông tin đó, không phải nói ngược lại.

Định dạng JSON:
{
  "questions": [
    {
      "type": "true_false_not_given" | "yes_no_not_given" | "matching_headings" | "matching_information" | "multiple_choice" | "sentence_completion" | "summary_completion" | "short_answer",
      "prompt": "nội dung câu hỏi bằng tiếng Anh",
      "instruction": "hướng dẫn ngắn, ví dụ 'Write NO MORE THAN TWO WORDS'",
      "options": ["A", "B"] hoặc null nếu không phải câu chọn,
      "correct_answer": "đáp án đúng",
      "evidence_text": "trích nguyên văn từ bài",
      "evidence_paragraph_index": 0,
      "explanation": "giải thích tiếng Việt",
      "lesson_tip": "bài học rút ra, tiếng Việt"
    }
  ]
}`;

export type GenerateOptions = {
  count?: number;
  types?: QuestionType[];
  /** Sinh riêng cho một dạng câu đang yếu (nút "Luyện dạng yếu nhất"). */
  focusType?: QuestionType;
};

export async function generateQuestionsWithClaude(
  article: { id: string; title: string; paragraphs: string[] },
  options: GenerateOptions = {},
): Promise<QuestionSet> {
  const { count = 12, focusType } = options;

  if (article.paragraphs.length === 0) {
    throw new AiError('invalid_request', 'Bài này không có toàn văn nên không sinh đề được.');
  }

  const passage = article.paragraphs
    .map((p, index) => `[Đoạn ${index}]\n${p}`)
    .join('\n\n')
    .slice(0, 24_000);

  const typeInstruction = focusType
    ? `Tất cả ${count} câu đều thuộc dạng "${focusType}" để luyện tập trung dạng này.`
    : `Trộn ${count} câu qua ít nhất 4 dạng khác nhau, ưu tiên True/False/Not Given, Matching Headings, Sentence Completion và Multiple Choice.`;

  const userPrompt = [
    `Tiêu đề bài: ${article.title}`,
    '',
    'BÀI ĐỌC:',
    passage,
    '',
    `Yêu cầu: tạo đúng ${count} câu hỏi. ${typeInstruction}`,
  ].join('\n');

  const raw = await withRetry(
    async () => {
      try {
        const response = await getAnthropic().messages.create({
          model: AI_MODELS.claude,
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');

        if (!text.trim()) throw new AiError('bad_response', 'Claude trả về nội dung rỗng.');
        return text;
      } catch (err) {
        throw toAiError(err, 'Gọi Claude sinh đề thất bại');
      }
    },
    { label: 'generateQuestions', attempts: 3 },
  );

  const questions = parseQuestions(raw, article);

  if (questions.length === 0) {
    throw new AiError('bad_response', 'Không đọc được câu hỏi hợp lệ nào từ phản hồi của Claude.');
  }

  return {
    articleId: article.id,
    title: `Bộ đề: ${article.title}`,
    generatedBy: 'ai',
    model: AI_MODELS.claude,
    createdAt: new Date().toISOString(),
    questions,
  };
}

/** Model đôi khi vẫn bọc JSON trong fence dù đã dặn — gỡ trước khi parse. */
function parseQuestions(
  raw: string,
  article: { id: string; paragraphs: string[] },
): GeneratedQuestion[] {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return [];

  let parsed: { questions?: unknown[] };
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as { questions?: unknown[] };
  } catch {
    return [];
  }

  const out: GeneratedQuestion[] = [];

  for (const item of parsed.questions ?? []) {
    const q = item as Record<string, unknown>;
    const type = String(q.type ?? '') as QuestionType;

    if (!VALID_TYPES.has(type)) continue;
    if (typeof q.prompt !== 'string' || typeof q.correct_answer !== 'string') continue;
    if (typeof q.evidence_text !== 'string' || !q.evidence_text.trim()) continue;

    const paragraphIndex = clampIndex(q.evidence_paragraph_index, article.paragraphs.length);

    out.push({
      id: `${article.id}-ai-${out.length}`,
      orderIndex: out.length,
      type,
      prompt: q.prompt,
      instruction: typeof q.instruction === 'string' ? q.instruction : null,
      options: Array.isArray(q.options) ? q.options.map(String) : null,
      correctAnswer: q.correct_answer,
      evidenceText: q.evidence_text,
      evidenceParagraphIndex: paragraphIndex,
      explanation: typeof q.explanation === 'string' ? q.explanation : '',
      lessonTip: typeof q.lesson_tip === 'string' ? q.lesson_tip : null,
    });
  }

  return out;
}

function clampIndex(value: unknown, length: number): number {
  const index = Number(value);
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.trunc(index)), Math.max(0, length - 1));
}
