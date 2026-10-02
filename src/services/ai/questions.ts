
import { AiError } from './errors';
import { BLOCK_RUBRIC, type PassageBlueprint } from '@/services/questions/blueprint';
import { buildBlock, type RawBlock } from '@/services/questions/block-build';
import { BLOCK_SYSTEM_PROMPT, blockUserPrompt } from '@/services/questions/block-prompts';
import { countWords } from '@/services/questions/grade';
import { verifyQuestion } from '@/services/questions/verify';
import { COMPLETION_TYPES, STRUCTURED_TYPES, specOf } from '@/services/questions/ielts-types';
import { chatWithFallback, extractJson } from './fallback';
import type { GeneratedQuestion, QuestionSet } from '@/services/questions/types';
import type { ExamKind, QuestionType } from '@/types/database';

/** SERVER-ONLY. Sinh bộ đề IELTS hoặc SAT từ toàn văn bài đọc, qua bộ hai proxy. */

const IELTS_TYPES = new Set<QuestionType>([
  'true_false_not_given',
  'yes_no_not_given',
  'matching_headings',
  'matching_information',
  'matching_features',
  'matching_sentence_endings',
  'multiple_choice',
  'sentence_completion',
  'summary_completion',
  'short_answer',
  'multiple_choice_multi',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label_completion',
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
  /**
   * Bản thiết kế đề: mấy khối, mỗi khối dạng gì và mấy câu.
   *
   * Khi có nó thì nó THẮNG cả `count` lẫn `types` — vì nó nói cả hai thứ ấy, và
   * nói chặt hơn: không chỉ "dùng những dạng này" mà "dạng này đúng bấy nhiêu
   * câu, đứng liền một khối".
   */
  blueprint?: PassageBlueprint;
  /**
   * Bộ trộn dạng tự chọn: danh sách khối {dạng, số câu}. Khác `blueprint` ở chỗ nó do
   * người học đặt (hộp "Tạo đề"), nhưng được xử lý y hệt — mỗi khối một lô riêng.
   */
  blocks?: { type: QuestionType; count: number }[];
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
  const { focusType } = options;
  const plannedBlocks = options.blocks ?? options.blueprint?.blocks;
  const count = plannedBlocks
    ? plannedBlocks.reduce((sum, b) => sum + b.count, 0)
    : (options.count ?? defaultCount);

  if (article.paragraphs.length === 0) {
    throw new AiError('invalid_request', 'Bài này không có toàn văn nên không sinh đề được.');
  }

  const passage = article.paragraphs
    .map((p, index) => `[Đoạn ${index}]\n${p}`)
    .join('\n\n')
    .slice(0, 24_000);

  /*
    CHIA LÔ CHẠY SONG SONG.

    Đo được: xin 8 câu trong một lần gọi mất 47,5s — Vercel cắt request ở 60s,
    nên bản một-lần-gọi hỏng ngay khi lên production dù chạy tốt ở máy. Thời gian
    tăng nhanh hơn số câu, vì model phải giữ cả bộ đề trong đầu để tránh trùng.

    Chia thành lô nhỏ rồi gọi song song thì tổng thời gian bằng LÔ CHẬM NHẤT chứ
    không phải tổng các lô. Đổi lại, các lô không nhìn thấy nhau nên có thể ra
    câu trùng ý — khử trùng ở bước gộp bên dưới.

    CÓ BẢN THIẾT KẾ / BỘ TRỘN THÌ MỖI KHỐI LÀ MỘT LÔ. Cấu trúc đề là thứ phải giữ,
    và cách duy nhất giữ được là mỗi lô xin ĐÚNG một dạng với ĐÚNG số câu của khối
    ấy. `Promise.allSettled` giữ nguyên thứ tự, nên câu về cũng đã xếp sẵn.
  */
  const jobs = planJobs(plannedBlocks, count, focusType, options.types, exam);

  const settled = await Promise.allSettled(
    jobs.map((job) =>
      job.kind === 'block'
        ? runBlock(job, article, passage)
        : runFlat(job, article, passage, exam),
    ),
  );

  // Một lô hỏng KHÔNG làm hỏng cả bộ đề: 9 câu vẫn luyện được, còn ném lỗi thì
  // người học không có gì để làm. Chỉ hỏng hết mới báo lỗi.
  const ok = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failedTypes: QuestionType[] = [];
  jobs.forEach((job, i) => {
    const r = settled[i];
    if (job.kind === 'block' && (r?.status !== 'fulfilled' || r.value.questions.length === 0)) {
      failedTypes.push(job.type);
    }
  });

  if (ok.length === 0) {
    // Chi tiết nhà cung cấp chỉ vào log máy chủ, KHÔNG đi ra phản hồi.
    for (const r of settled) {
      if (r.status === 'rejected') console.error('[questions] lô hỏng:', String((r.reason as Error)?.message ?? r.reason).slice(0, 300));
    }
    throw new AiError('server_error', 'Chưa sinh được đề lúc này.');
  }

  const flat = dedupe(ok.filter((r) => r.kind === 'flat').flatMap((r) => r.questions)).slice(0, count);
  // Ghép lại theo đúng thứ tự khối đã đặt.
  const ordered: GeneratedQuestion[] = [];
  let flatCursor = 0;
  settled.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    if (jobs[i]?.kind === 'block') ordered.push(...r.value.questions);
    else {
      const n = r.value.questions.length;
      ordered.push(...flat.slice(flatCursor, flatCursor + n));
      flatCursor += n;
    }
  });
  const questions = ordered.map((q, i) => ({ ...q, orderIndex: i }));
  const usedModel = ok[0]?.model ?? '?';

  if (questions.length === 0) {
    throw new AiError('bad_response', 'Chưa dựng được câu hỏi hợp lệ nào.');
  }

  return {
    articleId: article.id,
    title: `Bộ đề: ${article.title}`,
    generatedBy: 'ai',
    model: usedModel,
    createdAt: new Date().toISOString(),
    questions,
    ...(failedTypes.length > 0 ? { failedTypes } : {}),
  };
}

type Job =
  | { kind: 'flat'; count: number; types: QuestionType[] }
  | { kind: 'block'; type: QuestionType; count: number; key: string };

type JobOut = { kind: 'flat' | 'block'; questions: GeneratedQuestion[]; model: string };

/**
 * Đổi đơn hàng thành danh sách lô. Dạng có cấu trúc (nối tiêu đề, bảng, Choose TWO…)
 * luôn đi lô KHỐI; dạng phẳng giữ cách chia lô cũ.
 */
export function planJobs(
  blocks: { type: QuestionType; count: number }[] | undefined,
  count: number,
  focusType: QuestionType | undefined,
  types: QuestionType[] | undefined,
  exam: ExamKind,
): Job[] {
  if (blocks) {
    return blocks.map((b, i) =>
      exam === 'ielts' && STRUCTURED_TYPES.has(b.type)
        ? ({ kind: 'block', type: b.type, count: b.count, key: String(i + 1) } as const)
        : ({ kind: 'flat', count: b.count, types: [b.type] } as const),
    );
  }
  const asked = focusType ? [focusType] : pickTypes(types, exam);
  if (exam !== 'ielts') return planBatches(count, asked).map((b) => ({ kind: 'flat', ...b }) as const);

  const jobs: Job[] = [];
  const structured = asked.filter((t) => STRUCTURED_TYPES.has(t));
  let used = 0;
  structured.forEach((t, i) => {
    const n = specOf(t)?.defaultCount ?? 4;
    used += n;
    jobs.push({ kind: 'block', type: t, count: n, key: String(i + 1) });
  });
  const flatTypes = asked.filter((t) => !STRUCTURED_TYPES.has(t));
  if (flatTypes.length > 0) {
    const left = Math.max(flatTypes.length, count - used);
    for (const b of planBatches(left, flatTypes)) jobs.unshift({ kind: 'flat', ...b });
  }
  return jobs;
}

async function runFlat(
  job: Extract<Job, { kind: 'flat' }>,
  article: { id: string; title: string; paragraphs: string[]; cefrLevel?: string | null },
  passage: string,
  exam: ExamKind,
): Promise<JobOut> {
  const raw = await chatWithFallback({
    purpose: 'questions',
    system: exam === 'sat' ? SAT_SYSTEM_PROMPT : IELTS_SYSTEM_PROMPT,
    user: buildUserPrompt(article, passage, job),
    temperature: 0.4,
  });
  return { kind: 'flat', questions: parseQuestions(raw.text, article, exam), model: raw.model };
}

/**
 * Một khối có cấu trúc: gọi model, dựng + kiểm; hỏng thì gọi lại MỘT lần kèm danh
 * sách lỗi của bộ kiểm. Vẫn hỏng thì trả khối rỗng — khối khác không bị ảnh hưởng.
 */
async function runBlock(
  job: Extract<Job, { kind: 'block' }>,
  article: { id: string; title: string; paragraphs: string[]; cefrLevel?: string | null },
  passage: string,
): Promise<JobOut> {
  let problems: string[] = [];
  let model = '?';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await chatWithFallback({
      purpose: 'questions',
      system: BLOCK_SYSTEM_PROMPT,
      user: blockUserPrompt(job.type, job.count, article, passage, article.paragraphs.length, problems),
      temperature: attempt === 0 ? 0.4 : 0.2,
    });
    model = raw.model;
    let parsed: RawBlock;
    try {
      parsed = extractJson<RawBlock>(raw.text);
    } catch {
      problems = ['phản hồi không phải JSON hợp lệ'];
      continue;
    }
    const built = buildBlock(job.type, parsed, {
      articleId: article.id,
      paragraphs: article.paragraphs,
      startIndex: 0,
      blockKey: job.key,
    });
    if (built.questions.length > 0) return { kind: 'block', questions: built.questions, model };
    problems = built.problems;
  }
  console.error(`[questions] khối ${job.type} không đạt bộ kiểm:`, problems.slice(0, 4).join(' | '));
  return { kind: 'block', questions: [], model };
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

    /*
      Loại câu có trích dẫn KHÔNG tìm thấy trong bài.

      Thà 6 câu tô sáng đúng còn hơn 8 câu mà 2 câu bấm vào không thấy gì. Chỉ
      số đoạn lấy từ chỗ TÌM ĐƯỢC THẬT, không tin số model tự khai — nó hay đếm
      lệch một đoạn.
    */
    const paragraphIndex = locateEvidence(q.evidence_text, article.paragraphs);
    if (paragraphIndex === -1) continue;

    const built: GeneratedQuestion = {
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
      // Giới hạn số từ: đúng theo lời dẫn của dạng, nhưng không thấp hơn đáp án mẫu.
      ...(COMPLETION_TYPES.has(type)
        ? {
            maxWords: Math.min(
              3,
              Math.max(type === 'short_answer' ? 3 : type === 'sentence_completion' ? 1 : 2, countWords(q.correct_answer)),
            ),
          }
        : {}),
    };
    // Bộ kiểm chung của IELTS (đáp án điền phải có thật trong bài, không chép câu bài…).
    if (exam === 'ielts' && !verifyQuestion(built, article.paragraphs).ok) continue;
    out.push(built);
  }

  return out;
}


/*
  Số câu mỗi lô — BỐN, và con số này đo ra chứ không chọn cho tròn.

  Ngân sách một cửa là 45s, Vercel cắt cả request ở 60s. Model đang dùng
  (claude-haiku-4-5) sinh 4 câu trong 13-16s trên ba bài đo thử, nên lô 4 câu
  còn nguyên hơn nửa ngân sách làm biên an toàn.

  Đã đo riêng là proxy KHÔNG chặn gọi song song, nên chia lô rồi gọi song song
  thì tổng thời gian bằng lô chậm nhất chứ không phải tổng các lô. Đổi lại mỗi
  lô phải gửi lại toàn văn bài đọc, nên lô càng nhỏ càng tốn token — bốn là chỗ
  cân bằng. Hạ xuống được bằng biến môi trường nếu đổi sang model chậm hơn.
*/
const BATCH_SIZE = Number(process.env.QUESTIONS_BATCH_SIZE ?? 4);

/**
 * Bộ dạng câu sẽ đặt hàng.
 *
 * `requested` đến từ bộ lọc "Loại câu hỏi" ở màn Luyện tập. Lọc rỗng nghĩa là
 * "gì cũng được", không phải "không dạng nào" — nên rỗng thì trả về bộ mặc định
 * chứ không trả về mảng rỗng, vốn sẽ sinh ra đề không có câu nào.
 */
export function pickTypes(requested: QuestionType[] | undefined, exam: ExamKind): QuestionType[] {
  const valid = validTypesFor(exam);
  const asked = (requested ?? []).filter((t) => valid.has(t));
  if (asked.length > 0) return asked;
  return exam === 'sat'
    ? ['sat_words_in_context', 'sat_central_idea', 'sat_inference', 'sat_text_structure']
    : ['true_false_not_given', 'matching_headings', 'sentence_completion', 'multiple_choice'];
}

/**
 * Chia số câu thành các lô, mỗi lô gánh một phần bộ dạng.
 *
 * Chia dạng theo lô chứ không để mỗi lô tự trộn tất cả: mỗi lô chỉ thấy phần
 * của mình nên KHÔNG lô nào bỏ sót dạng khó. Bản trước dặn "trộn ít nhất 4 dạng"
 * trong một lần gọi, và model hay dồn về Multiple Choice cho nhanh.
 */
export function planBatches(count: number, types: QuestionType[]): { count: number; types: QuestionType[] }[] {
  const batchCount = Math.max(1, Math.ceil(count / BATCH_SIZE));
  const batches: { count: number; types: QuestionType[] }[] = [];

  for (let i = 0; i < batchCount; i += 1) {
    // Chia dư cho các lô đầu, nên tổng luôn đúng bằng `count`.
    const size = Math.floor(count / batchCount) + (i < count % batchCount ? 1 : 0);
    if (size <= 0) continue;
    // Chia vòng: lô 0 lấy dạng 0, 2, 4…; lô 1 lấy dạng 1, 3, 5…
    const mine = types.filter((_, ti) => ti % batchCount === i);
    batches.push({ count: size, types: mine.length > 0 ? mine : types });
  }

  return batches;
}

function buildUserPrompt(
  article: { title: string; cefrLevel?: string | null },
  passage: string,
  batch: { count: number; types: QuestionType[] },
): string {
  const list = batch.types.map((t) => `"${t}"`).join(', ');
  const instruction =
    batch.types.length === 1
      ? `Cả ${batch.count} câu đều thuộc dạng ${list}.`
      : `Chia ${batch.count} câu cho các dạng sau, mỗi dạng ít nhất một câu: ${list}. Không dùng dạng nào ngoài danh sách này.`;

  /*
    Lô một dạng thì gửi kèm LỜI DẪN THẬT của dạng đó.

    Lời dẫn không phải chữ trang trí: nó nói rõ luật chơi của khối, và luật ấy
    ràng buộc chính nội dung câu hỏi. "Choose ONE WORD ONLY from the passage"
    buộc đáp án phải là một từ có thật trong bài; bỏ câu đó đi thì model rất hay
    sinh đáp án hai ba từ hoặc từ nó tự nghĩ ra.
  */
  const rubric = batch.types.length === 1 ? BLOCK_RUBRIC[batch.types[0] as QuestionType] : '';

  return [
    `Tiêu đề bài: ${article.title}`,
    `Trình độ bài (CEFR): ${article.cefrLevel ?? 'không rõ'}`,
    '',
    'BÀI ĐỌC:',
    passage,
    '',
    `Yêu cầu: tạo đúng ${batch.count} câu hỏi. ${instruction}`,
    ...(rubric ? ['', 'Khối này mang đúng lời dẫn sau, và câu hỏi phải tuân thủ nó:', rubric] : []),
  ].join('\n');
}

/**
 * Khử câu trùng giữa các lô.
 *
 * Các lô gọi song song nên không biết lô kia hỏi gì; hai lô cùng bám một đoạn
 * hay lấy chung một ý. So theo đề bài đã chuẩn hoá, không so nguyên văn — khác
 * nhau một dấu chấm vẫn là cùng một câu với người học.
 */
export function dedupe(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  const seen = new Set<string>();
  const out: GeneratedQuestion[] = [];

  for (const q of questions) {
    const key = q.prompt.toLowerCase().replace(/[^a-z0-9À-ỹ]+/g, ' ').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    // Đánh lại số thứ tự sau khi gộp, nếu không id sẽ trùng giữa các lô.
    out.push({ ...q, id: `${q.id}-${out.length}`, orderIndex: out.length });
  }

  return out;
}

/**
 * Tìm trích dẫn trong bài và trả về chỉ số đoạn CHỨA NÓ THẬT.
 *
 * Trích dẫn dùng để tô sáng đúng chỗ trong bài. Model thỉnh thoảng diễn đạt lại
 * thay vì chép nguyên văn — đo trên một bài mẫu thì 2/8 câu như vậy. Câu đó vẫn
 * hiện được nhưng bấm vào không tô sáng gì cả, và người học tưởng app hỏng.
 *
 * So khớp sau khi chuẩn hoá khoảng trắng và các loại nháy/gạch ngang, vì model
 * hay đổi " thành “ hoặc - thành – khi chép lại. Không tìm thấy thì trả -1 để
 * bên gọi loại câu đó đi.
 */
export function locateEvidence(evidence: string, paragraphs: string[]): number {
  const norm = (t: string) =>
    t
      .toLowerCase()
      .replace(/[‘’“”]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

  const needle = norm(evidence);
  if (needle.length < 10) return -1;

  return paragraphs.findIndex((p) => norm(p).includes(needle));
}
