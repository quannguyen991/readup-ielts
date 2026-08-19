import Anthropic from '@anthropic-ai/sdk';

import { AI_MODELS } from './client';
import { AiError, toAiError } from './errors';
import { withRetry } from './retry';
import { serverEnv } from '@/lib/env';
import type { GeneratedQuestion, QuestionSet } from '@/services/questions/types';
import type { ExamKind, QuestionType } from '@/types/database';

/** SERVER-ONLY. Sinh bộ đề IELTS hoặc SAT bằng Claude từ toàn văn bài đọc. */

let client: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: serverEnv('ANTHROPIC_API_KEY'), maxRetries: 0 });
  }
  return client;
}

const IELTS_TYPES = new Set<QuestionType>([
  'true_false_not_given',
  'yes_no_not_given',
  'matching_headings',
  'matching_information',
  'multiple_choice',
  'sentence_completion',
  'summary_completion',
  'short_answer',
]);

const SAT_TYPES = new Set<QuestionType>([
  'sat_words_in_context',
  'sat_central_idea',
  'sat_command_of_evidence',
  'sat_inference',
  'sat_text_structure',
]);

/**
 * Lọc theo ĐÚNG bộ dạng của kỳ thi, không gộp chung.
 *
 * Gộp lại thì model trả về dạng IELTS cho bài SAT vẫn lọt qua — mà đó chính là
 * lỗi cần chặn.
 */
function validTypesFor(exam: ExamKind): ReadonlySet<QuestionType> {
  return exam === 'sat' ? SAT_TYPES : IELTS_TYPES;
}

const SAT_SYSTEM_PROMPT = `Bạn là chuyên gia ra đề SAT Reading and Writing, bám đúng đặc tả của College Board cho SAT số hoá.

Nhiệm vụ: từ đoạn văn được cung cấp, tạo bộ câu hỏi đúng chuẩn SAT.

QUY TẮC BẮT BUỘC:
1. Trả về JSON THUẦN. Không markdown fence, không lời dẫn, không giải thích ngoài JSON.
2. MỌI câu đều là trắc nghiệm ĐÚNG BỐN lựa chọn. Không có câu điền từ, không có True/False/Not Given — đó là IELTS, không phải SAT.
3. Mỗi câu PHẢI có evidence_text là đoạn trích NGUYÊN VĂN từ bài (copy chính xác, không sửa một chữ), và evidence_paragraph_index là số thứ tự đoạn chứa đoạn trích đó (đếm từ 0).
4. Ba đáp án nhiễu phải sai vì một lý do NÊU RA ĐƯỢC: đúng chi tiết nhưng không phải ý chính, đảo quan hệ nhân quả, vượt quá điều bài nói, hoặc dùng thông tin không có trong bài. Không bịa nhiễu vô nghĩa.
5. explanation viết bằng tiếng Việt: vì sao đáp án đúng, và từng đáp án nhiễu sai ở đâu.
6. lesson_tip viết bằng tiếng Việt: một chiến thuật áp dụng được cho bài khác.
7. Câu hỏi và đáp án viết bằng tiếng Anh, đúng giọng đề thật.
8. Đáp án phải suy ra được TỪ BÀI, không dùng kiến thức bên ngoài.

Năm dạng, dùng đúng tên này ở trường "type":
- "sat_words_in_context": hỏi nghĩa một từ trong ngữ cảnh, hoặc chọn từ điền vào chỗ trống. prompt nêu rõ từ đang xét.
- "sat_central_idea": ý chính hoặc chi tiết chính của đoạn.
- "sat_command_of_evidence": câu/dữ kiện nào chống lưng cho một nhận định.
- "sat_inference": suy luận hợp lý nhất, hoặc câu kết đoạn hợp lý nhất.
- "sat_text_structure": cấu trúc tổng thể của đoạn, hoặc chức năng của một câu trong đoạn.

Định dạng JSON:
{
  "questions": [
    {
      "type": "sat_words_in_context" | "sat_central_idea" | "sat_command_of_evidence" | "sat_inference" | "sat_text_structure",
      "prompt": "nội dung câu hỏi bằng tiếng Anh",
      "instruction": "câu lệnh của đề, tiếng Anh",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "một chuỗi TRÙNG KHỚP TUYỆT ĐỐI với một phần tử trong options",
      "evidence_text": "trích nguyên văn từ bài",
      "evidence_paragraph_index": 0,
      "explanation": "giải thích tiếng Việt",
      "lesson_tip": "chiến thuật rút ra, tiếng Việt"
    }
  ]
}`;

const IELTS_SYSTEM_PROMPT = `Bạn là chuyên gia ra đề IELTS Academic Reading, có 15 năm kinh nghiệm chấm thi.

Nhiệm vụ: từ bài đọc được cung cấp, tạo bộ câu hỏi đúng chuẩn IELTS.

QUY TẮC BẮT BUỘC:
1. Trả về JSON THUẦN. Không markdown fence, không lời dẫn, không giải thích ngoài JSON.
2. Mỗi câu hỏi PHẢI có evidence_text là đoạn trích NGUYÊN VĂN từ bài (copy chính xác, không sửa một chữ), và evidence_paragraph_index là số thứ tự đoạn chứa đoạn trích đó (đếm từ 0).
3. explanation viết bằng tiếng Việt, chỉ rõ vì sao đáp án đúng và vì sao đáp án gây nhiễu sai.
4. lesson_tip viết bằng tiếng Việt: một bài học chung rút ra được, áp dụng cho cả những bài khác — ví dụ "'Can be seen' nghĩa là nhìn thấy được, không phải không nhìn thấy".
5. Câu hỏi viết bằng tiếng Anh (đúng như đề thi thật). Chỉ explanation và lesson_tip dùng tiếng Việt.
6. Đáp án phải suy ra được TỪ BÀI, không dùng kiến thức bên ngoài.
7. Với NOT GIVEN: bài phải im lặng về thông tin đó, không phải nói ngược lại.

CẤM — đây là những cách ra đề khiến người học giải được mà KHÔNG cần đọc hiểu.
Câu nào rơi vào một trong số này thì bỏ, ra câu khác:
8. Cấm chép lại nguyên văn câu trong bài rồi chỉ đổi vài từ đồng nghĩa. Nhận
   định phải diễn đạt lại: KHÔNG được lặp quá BA từ liên tiếp của câu gốc.
9. Cấm dựng FALSE bằng cách chèn "not"/"never" vào câu gốc. FALSE phải mâu thuẫn
   về NỘI DUNG — sai số liệu, sai quan hệ nhân quả, sai đối tượng, đảo chiều so
   sánh.
10. Cấm dùng chung một khuôn câu cho mọi NOT GIVEN. Mỗi câu NOT GIVEN phải nói
    về một khía cạnh khác nhau mà bài thật sự im lặng.
11. Cấm ra câu hỏi theo đúng thứ tự đoạn (câu 1 hỏi đoạn 1, câu 2 hỏi đoạn 2…).
    Trộn thứ tự để người học phải tự định vị thông tin.
12. Với Matching Headings: tiêu đề phải là cụm TÓM Ý cả đoạn, KHÔNG được lấy
    nguyên cụm chữ mở đầu đoạn đó.
13. Với Multiple Choice: đáp án đúng không được luôn rơi vào đoạn đầu bài, và ba
    nhiễu phải cùng độ dài, cùng mức cụ thể với đáp án đúng — nhiễu ngắn hơn hẳn
    hoặc chung chung hơn hẳn là tự lộ.

ĐỘ KHÓ:
14. Neo theo trình độ của bài (CEFR ghi ở đầu phần BÀI ĐỌC). Xếp câu dễ trước,
    khó sau: câu định vị được trong một câu văn đứng trước, câu đòi tổng hợp
    nhiều câu hoặc cả đoạn đứng sau.

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
  article: {
    id: string;
    title: string;
    paragraphs: string[];
    exam?: ExamKind;
    /** Neo độ khó cho model — bài B1 và bài C2 không thể ra cùng một mức đề. */
    cefrLevel?: string | null;
  },
  options: GenerateOptions = {},
): Promise<QuestionSet> {
  const exam: ExamKind = article.exam ?? 'ielts';
  // Đoạn SAT chỉ 25–150 từ thì không gánh nổi 12 câu; đề thật cho mỗi đoạn
  // ngắn đúng một câu.
  const defaultCount = exam === 'sat' ? Math.min(8, Math.max(3, article.paragraphs.length * 2)) : 12;
  const { count = defaultCount, focusType } = options;

  if (article.paragraphs.length === 0) {
    throw new AiError('invalid_request', 'Bài này không có toàn văn nên không sinh đề được.');
  }

  const passage = article.paragraphs
    .map((p, index) => `[Đoạn ${index}]\n${p}`)
    .join('\n\n')
    .slice(0, 24_000);

  const mixInstruction =
    exam === 'sat'
      ? `Trộn ${count} câu qua ít nhất 3 dạng khác nhau, ưu tiên Words in Context, Central Ideas và Inferences.`
      : `Trộn ${count} câu qua ít nhất 4 dạng khác nhau, ưu tiên True/False/Not Given, Matching Headings, Sentence Completion và Multiple Choice.`;

  const typeInstruction = focusType
    ? `Tất cả ${count} câu đều thuộc dạng "${focusType}" để luyện tập trung dạng này.`
    : mixInstruction;

  const userPrompt = [
    `Tiêu đề bài: ${article.title}`,
    `Trình độ bài (CEFR): ${article.cefrLevel ?? 'không rõ'}`,
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
          system: exam === 'sat' ? SAT_SYSTEM_PROMPT : IELTS_SYSTEM_PROMPT,
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

  const questions = parseQuestions(raw, article, exam);

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
  exam: ExamKind,
): GeneratedQuestion[] {
  const validTypes = validTypesFor(exam);

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

    if (!validTypes.has(type)) continue;
    if (typeof q.prompt !== 'string' || typeof q.correct_answer !== 'string') continue;
    if (typeof q.evidence_text !== 'string' || !q.evidence_text.trim()) continue;

    const opts = Array.isArray(q.options) ? q.options.map(String) : null;

    // Mọi câu SAT đều là trắc nghiệm, và đáp án phải TRÙNG một lựa chọn — lệch
    // một dấu câu là người học chọn đúng vẫn bị chấm sai.
    if (exam === 'sat' && (!opts || !opts.includes(q.correct_answer))) continue;

    const paragraphIndex = clampIndex(q.evidence_paragraph_index, article.paragraphs.length);

    out.push({
      id: `${article.id}-ai-${out.length}`,
      orderIndex: out.length,
      type,
      prompt: q.prompt,
      instruction: typeof q.instruction === 'string' ? q.instruction : null,
      options: opts,
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
