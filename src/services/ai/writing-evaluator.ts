import { getOpenAI } from './client';
import { AiError, toAiError } from './errors';
import { chatWithFallback } from './fallback';
import { countQuoteMatches, writingReceipt, type VerificationReceipt } from './verification';
import { withRetry } from './retry';
import { anchorAnnotations, type RawAnnotation } from '@/services/writing/annotate';
import { ieltsRound } from '@/services/speaking/grade';
import { countWords } from '@/lib/writing/word-count';
import { findVerbatim } from '@/lib/writing/quote-match';
import type {
  CriterionDetail,
  CriterionKey,
  WritingAnnotation,
  WritingPrompt,
} from '@/lib/writing/types';

/**
 * SERVER-ONLY. Chấm bài Writing bằng AI.
 *
 * Chấm HAI LƯỢT, không gộp. Gộp một lượt thì model gần như luôn bỏ sót
 * annotation ở nửa sau bài — nó đã tiêu phần chú ý vào việc cho điểm. Tách ra
 * tốn thêm một lần gọi, đổi lại annotation phủ đều cả bài.
 *
 * Model trả **chuỗi trích** chứ không trả vị trí; việc neo vào bài do
 * `anchorAnnotations` làm ở đây, trên server.
 */

export type WritingEvaluationResult = {
  bandLow: number;
  bandHigh: number;
  taskBand: number;
  coherenceBand: number;
  lexicalBand: number;
  grammarBand: number;
  summaryVi: string;
  strengths: string[];
  improvements: string[];
  annotations: WritingAnnotation[];
  model: string;
  criteria: Record<CriterionKey, CriterionDetail>;
  wordCount: number;
  /** Chép từ đề: màn kết quả cần mốc này để nói bài có đủ số từ hay không. */
  minWords: number;
  priorityVi: string;
  nextBandVi: string;
  /** Biên nhận kiểm chứng — app đã đối chiếu những gì AI nói, xem `verification.ts`. */
  verification: VerificationReceipt;
};

/** Model dùng để chấm. Đây là lời gọi AI quan trọng nhất của app. */
function evaluationModel(): string {
  return process.env.WRITING_MODEL ?? process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini';
}

/**
 * Nhắc lại band descriptor để model chấm theo chuẩn thay vì theo cảm tính.
 *
 * Không có phần này thì model chấm rộng tay một cách hệ thống — nó phản ứng với
 * việc bài "đọc trôi" chứ không với việc bài có overview hay không.
 */
const RUBRIC = `TIÊU CHUẨN CHẤM — IELTS Writing, theo mô tả band công khai của IELTS (band 5–9 cho từng tiêu chí).
Chấm từng tiêu chí riêng, mỗi tiêu chí là một số nguyên hoặc x,5. Không tự cộng tổng: app tính band tổng từ bốn tiêu chí.

TASK ACHIEVEMENT (Task 1) / TASK RESPONSE (Task 2)
- 9: trả lời đầy đủ mọi phần của đề; lập trường rõ và nhất quán; ý được phát triển đầy đủ, liên quan, có ví dụ.
- 8: trả lời đầy đủ mọi phần; ý được phát triển tốt; lập trường rõ, có thể còn chỗ chưa nhất quán nhỏ.
- 7: trả lời đủ mọi phần; có lập trường rõ; ý được mở rộng và hỗ trợ, một số ý còn chưa sâu.
- 6: trả lời mọi phần nhưng có phần chưa đầy đủ; lập trường rõ nhưng có lúc không nhất quán; ý chính liên quan nhưng có ý chưa phát triển hoặc thiếu minh hoạ.
- 5: chỉ trả lời một phần đề; lập trường chưa rõ; ý ít và chưa phát triển, thiếu hỗ trợ. Task 1: thiếu overview hoặc chỉ mô tả từng số liệu rời.
- 4: trả lời lạc đề một phần; ý không rõ, lặp hoặc không liên quan.

COHERENCE AND COHESION
- 9: sắp xếp ý tự nhiên, từ nối không gây chú ý; chia đoạn khéo.
- 8: sắp xếp thông tin và ý logic; quản lý tốt mọi khía cạnh của liên kết; chia đoạn đầy đủ, đúng chỗ.
- 7: tổ chức thông tin logic, mạch rõ; dùng nhiều phương tiện liên kết đúng, có thể còn dùng thừa hoặc thiếu; mỗi đoạn có một ý trung tâm rõ.
- 6: sắp xếp thông tin khá mạch lạc; từ nối có hiệu quả nhưng đôi khi máy móc hoặc sai; chia đoạn có thể chưa hợp lý.
- 5: có tổ chức nhưng chưa logic; từ nối dùng sai, thiếu hoặc lặp quá nhiều; không chia đoạn hoặc chia đoạn không hợp lý.
- 4: ý rời rạc, khó theo dõi; hầu như không có liên kết.

LEXICAL RESOURCE
- 9: vốn từ rộng, dùng tự nhiên và tinh tế; lỗi nhỏ rất hiếm.
- 8: vốn từ rộng, linh hoạt; kiểm soát tốt từ ít gặp và collocation; sai sót hiếm.
- 7: vốn từ đủ rộng; có ý thức về văn phong và collocation; dùng được từ ít gặp nhưng đôi khi sai; có lỗi chính tả hoặc cấu tạo từ nhỏ.
- 6: vốn từ đủ dùng; thử dùng từ ít gặp nhưng còn sai; có lỗi chọn từ, collocation, hoặc chính tả.
- 5: vốn từ hạn chế; paraphrase ít; lỗi chính tả hoặc cấu tạo từ đáng kể.
- 4: vốn từ rất hạn chế; lỗi thường xuyên làm lệch nghĩa.

GRAMMATICAL RANGE AND ACCURACY
- 9: dùng đa dạng cấu trúc, linh hoạt; hầu hết câu không lỗi; lỗi nhỏ rất hiếm.
- 8: nhiều cấu trúc, linh hoạt; đa số câu không lỗi; thỉnh thoảng có lỗi nhỏ không hệ thống.
- 7: nhiều cấu trúc câu phức; ĐA SỐ câu không lỗi; kiểm soát tốt; lỗi ít, không làm khó hiểu.
- 6: trộn câu đơn và câu phức; có lỗi nhưng hiếm khi làm khó hiểu.
- 5: cấu trúc hạn chế, chủ yếu câu đơn; lỗi thường xuyên; có thể làm khó hiểu một phần.
- 4: cấu trúc rất hạn chế; lỗi dày làm việc hiểu bị ảnh hưởng.

QUY ƯỚC CHẤM CHẶT
- Nếu phân vân giữa hai mức, chọn mức thấp hơn.
- Bài thiếu từ so với yêu cầu: Task Response không được vượt 6 (app sẽ kẹp lại, bạn vẫn cần chấm đúng nội dung).
- Đề biểu đồ: số liệu sai so với dữ liệu đề là lỗi Task Achievement nặng.`;

const SCORE_SYSTEM = `Bạn là giám khảo IELTS Writing giàu kinh nghiệm, đang viết phiếu chấm chi tiết cho học viên người Việt.

${RUBRIC}

Trả về JSON THUẦN, không markdown fence, không lời dẫn:
{
  "criteria": {
    "task":      { "band": number, "evidenceVi": string, "gapVi": string, "nextStepVi": string, "quotes": string[] },
    "coherence": { "band": number, "evidenceVi": string, "gapVi": string, "nextStepVi": string, "quotes": string[] },
    "lexical":   { "band": number, "evidenceVi": string, "gapVi": string, "nextStepVi": string, "quotes": string[] },
    "grammar":   { "band": number, "evidenceVi": string, "gapVi": string, "nextStepVi": string, "quotes": string[] }
  },
  "summaryVi": string,      // 3-4 câu TIẾNG VIỆT, nói thẳng điểm yếu lớn nhất
  "priorityVi": string,     // NẾU CHỈ SỬA ĐƯỢC MỘT THỨ thì sửa gì, TIẾNG VIỆT, một câu
  "nextBandVi": string,     // cần làm gì để lên band kế tiếp, TIẾNG VIỆT, 1-2 câu cụ thể
  "strengths": string[],    // 2-4 mục, TIẾNG VIỆT
  "improvements": string[]  // 3-5 mục, TIẾNG VIỆT, mỗi mục là một việc làm được ngay
}

QUY TẮC CHO PHẦN CHI TIẾT — đây là phần người học đọc kỹ nhất:
1. "evidenceVi" là câu NHẬN XÉT DO BẠN VIẾT, bằng TIẾNG VIỆT CÓ DẤU — KHÔNG phải
   chỗ để chép lại câu tiếng Anh trong bài (chỗ đó là "quotes"). Nó phải nói VÌ SAO
   ở mức band đó, dựa vào chính bài này. Cấm nhận xét chung chung kiểu "cần cải
   thiện ngữ pháp"; phải là "câu phức chỉ xuất hiện 2 lần, còn lại là câu đơn nối
   bằng and". Ba trường evidenceVi/gapVi/nextStepVi đều PHẢI viết bằng tiếng Việt.
2. "gapVi" nói THIẾU ĐÚNG CÁI GÌ để lên nửa bậc, không phải mô tả lại lỗi.
3. "nextStepVi" là một việc làm được ngay ở bài sau, cụ thể tới mức bắt tay vào làm
   được. "Đọc thêm sách" không phải một việc; "mỗi đoạn thân bài viết một câu chủ đề
   đứng đầu" mới là.
4. "quotes" chép NGUYÊN VĂN 1-3 đoạn ngắn từ bài (mỗi đoạn 2-10 từ) làm dẫn chứng.
   Chép sai một ký tự là dẫn chứng vô giá trị. Nếu không tìm được thì để mảng rỗng.
5. Viết như đang nói với một người cụ thể, xưng "bài của bạn". Không viết như báo cáo.

Mỗi tiêu chí là MỘT số band. KHÔNG ghi band tổng: app tính band tổng từ bốn tiêu chí.`;

const ANNOTATE_SYSTEM = `Bạn là giám khảo IELTS đang đánh dấu lỗi trong bài viết của học viên.

Trả về JSON THUẦN, không markdown fence:
{
  "annotations": [
    {
      "quote": string,     // TRÍCH NGUYÊN VĂN từ bài, chép chính xác từng ký tự, 1-8 từ
      "category": "grammar" | "lexis" | "cohesion" | "expression" | "task",
      "severity": "minor" | "major",
      "whyVi": string,     // TIẾNG VIỆT, một câu, giải thích vì sao sai
      "fix": string        // bản sửa cho ĐÚNG đoạn đã trích
    }
  ]
}

QUY TẮC:
1. "quote" phải là chuỗi CÓ THẬT trong bài, chép y nguyên. Không diễn giải lại, không thêm bớt dấu.
2. Rải đều khắp bài, kể cả đoạn cuối. Không dồn hết vào đoạn đầu.
3. Tối đa 12 lỗi. Ưu tiên lỗi ăn điểm, bỏ qua lỗi vụn vặt.
4. Không đánh dấu chỗ đúng.`;

/**
 * Chỉ chạy lượt chấm điểm, bỏ lượt annotation.
 *
 * Dùng cho vòng kiểm định bài mẫu: ở đó chỉ cần biết bài rơi vào band nào, mà
 * chạy thêm lượt annotation thì tốn gấp rưỡi thời gian cho một thông tin không
 * ai đọc tới.
 */
export async function scoreWriting(input: {
  prompt: WritingPrompt;
  bodyText: string;
}): Promise<{ bandLow: number; bandHigh: number; summaryVi: string; model: string }> {
  const model = evaluationModel();
  try {
    const score = await withRetry(() =>
      callJson(
        model,
        SCORE_SYSTEM,
        `${describePrompt(input.prompt)}\n\nBÀI LÀM:\n${input.bodyText}`,
      ),
    );
    const built = finalizeBands(buildResult(score, { annotations: [] }, input.bodyText, model), input.prompt.minWords);
    return {
      bandLow: built.bandLow,
      bandHigh: built.bandHigh,
      summaryVi: built.summaryVi,
      model,
    };
  } catch (err) {
    throw toAiError(err, 'Không chấm được bài.');
  }
}

export async function evaluateWriting(input: {
  prompt: WritingPrompt;
  bodyText: string;
}): Promise<WritingEvaluationResult> {
  const model = evaluationModel();
  const promptBlock = describePrompt(input.prompt);

  try {
    const score = await withRetry(() =>
      callJson(model, SCORE_SYSTEM, `${promptBlock}\n\nBÀI LÀM:\n${input.bodyText}`),
    );

    const annotated = await withRetry(() =>
      callJson(
        model,
        ANNOTATE_SYSTEM,
        `${promptBlock}\n\nBÀI LÀM:\n${input.bodyText}\n\nNhận xét chung đã có: ${String(
          (score as Record<string, unknown>).summaryVi ?? '',
        )}`,
      ),
    );

    return finalizeBands(buildResult(score, annotated, input.bodyText, model), input.prompt.minWords);
  } catch (err) {
    throw toAiError(err, 'Không chấm được bài. Thử lại sau ít phút.');
  }
}

/**
 * Band tổng theo đúng cách IELTS: trung bình bốn tiêu chí rồi làm tròn (xem ieltsRound).
 * Model chỉ chấm từng tiêu chí; con số tổng không để model tự chốt.
 *
 * Bài thiếu từ thì Task Response bị kẹp ở 6, rồi tính lại band tổng.
 */
export function finalizeBands(result: WritingEvaluationResult, minWords: number): WritingEvaluationResult {
  const underLength = minWords > 0 && result.wordCount < minWords;
  const task = underLength ? Math.min(result.taskBand, 6) : result.taskBand;
  const overall = overallOf({ ...result, taskBand: task });
  return {
    ...result,
    taskBand: task,
    criteria: { ...result.criteria, task: { ...result.criteria.task, band: task } },
    bandLow: overall,
    bandHigh: overall,
    minWords,
  };
}

/** Band tổng: trung bình bốn tiêu chí, làm tròn theo IELTS. Một số duy nhất. */
function overallOf(c: Pick<WritingEvaluationResult, 'taskBand' | 'coherenceBand' | 'lexicalBand' | 'grammarBand'>): number {
  return ieltsRound((c.taskBand + c.coherenceBand + c.lexicalBand + c.grammarBand) / 4);
}

/** Mô tả đề cho model, kèm dữ liệu biểu đồ để nó kiểm được số liệu trong bài. */
function describePrompt(prompt: WritingPrompt): string {
  const lines = [
    `ĐỀ BÀI (${prompt.task === 'ielts_task1' ? 'IELTS Writing Task 1' : 'IELTS Writing Task 2'}):`,
    prompt.promptText,
    `Yêu cầu tối thiểu: ${prompt.minWords} từ.`,
  ];
  if (prompt.chartData) {
    // Đưa cả dữ liệu thật vào: không có nó thì model không kiểm được người học
    // có chép sai số liệu hay không, mà đó là lỗi Task Achievement nặng nhất.
    lines.push(`DỮ LIỆU BIỂU ĐỒ (JSON):\n${JSON.stringify(prompt.chartData)}`);
  }
  return lines.join('\n');
}

/**
 * Gọi model, tự chuyển sang proxy dự phòng khi proxy chính hỏng.
 *
 * `model` giữ lại trong chữ ký cho tương thích với chỗ gọi, nhưng KHÔNG còn
 * được dùng: model giờ gắn với từng proxy (xem `fallback.ts`), vì danh mục model
 * của hai nhà cung cấp không giao nhau — tên model của bên này không tồn tại ở
 * bên kia.
 */
async function callJson(_model: string, system: string, user: string): Promise<unknown> {
  const result = await chatWithFallback({ purpose: 'writing', system, user });
  return parseJson(result.text);
}

/**
 * Đọc JSON từ câu trả lời của model.
 *
 * Model đôi khi bọc trong ```json dù đã bảo đừng, nên cắt fence trước khi parse
 * thay vì để cả lượt gọi hỏng vì ba dấu backtick.
 */
function parseJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    // Vớt vát: lấy khối {...} dài nhất trong câu trả lời.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* rơi xuống dưới */
      }
    }
    throw new AiError('bad_response', 'Model trả về không phải JSON hợp lệ.');
  }
}

export function buildResult(
  score: unknown,
  annotated: unknown,
  bodyText: string,
  model: string,
): WritingEvaluationResult {
  const s = asRecord(score);
  const read = readCriteria(s, bodyText);
  const detail = read.criteria;
  const criteria = {
    taskBand: detail.task.band,
    coherenceBand: detail.coherence.band,
    lexicalBand: detail.lexical.band,
    grammarBand: detail.grammar.band,
  };

  // Band tổng không đọc từ model: nó là số tính từ bốn tiêu chí.
  const overall = overallOf(criteria);

  const rawAnnotations = readAnnotations(annotated);
  const anchored = anchorAnnotations(bodyText, rawAnnotations);

  return {
    ...criteria,
    bandLow: overall,
    bandHigh: overall,
    summaryVi: typeof s.summaryVi === 'string' ? s.summaryVi : '',
    strengths: stringList(s.strengths),
    improvements: stringList(s.improvements),
    annotations: anchored,
    model,
    criteria: detail,
    wordCount: countWords(bodyText),
    priorityVi: typeof s.priorityVi === 'string' ? s.priorityVi : '',
    nextBandVi: typeof s.nextBandVi === 'string' ? s.nextBandVi : '',
    // Chỗ gọi nào biết đề thì ghi đè bằng số thật của đề.
    minWords: 0,
    verification: writingReceipt({
      model,
      quotesChecked: read.quotesChecked,
      quotesRejected: read.quotesRejected,
      annotationsChecked: rawAnnotations.length,
      // Chú thích nào không neo được vào chữ thật trong bài thì đã bị bỏ ở
      // `anchorAnnotations` — hiệu số chính là số bị bỏ.
      annotationsRejected: Math.max(0, rawAnnotations.length - anchored.length),
      wordCount: countWords(bodyText),
    }),
  };
}

const CRITERION_KEYS: CriterionKey[] = ['task', 'coherence', 'lexical', 'grammar'];

/** Tên biến band kiểu cũ, giữ để bản chấm cũ của model vẫn đọc được. */
const LEGACY_BAND_FIELD: Record<CriterionKey, string> = {
  task: 'taskBand',
  coherence: 'coherenceBand',
  lexical: 'lexicalBand',
  grammar: 'grammarBand',
};

/**
 * Đọc phần nhận xét chi tiết của bốn tiêu chí.
 *
 * Chấp nhận CẢ HAI hình dạng: `criteria.task.band` (mới) và `taskBand` (cũ). Model
 * thỉnh thoảng vẫn trả về hình dạng cũ, và khi ấy thà mất phần chi tiết còn hơn
 * mất luôn điểm số.
 */
function readCriteria(
  s: Record<string, unknown>,
  bodyText: string,
): { criteria: Record<CriterionKey, CriterionDetail>; quotesChecked: number; quotesRejected: number } {
  const raw = asRecord(s.criteria);
  const out = {} as Record<CriterionKey, CriterionDetail>;
  let quotesChecked = 0;
  let quotesRejected = 0;

  for (const key of CRITERION_KEYS) {
    const c = asRecord(raw[key]);
    const legacy = s[LEGACY_BAND_FIELD[key]];

    // Đếm TRƯỚC khi lọc: sau khi lọc thì phần bị loại đã biến mất, mà chính phần
    // ấy mới là thứ đáng nói với người học.
    if (Array.isArray(c.quotes)) {
      const tally = countQuoteMatches(
        c.quotes.filter((q): q is string => typeof q === 'string'),
        bodyText,
      );
      quotesChecked += tally.checked;
      quotesRejected += tally.rejected;
    }

    out[key] = {
      band: band(c.band ?? legacy),
      evidenceVi: typeof c.evidenceVi === 'string' ? c.evidenceVi : '',
      gapVi: typeof c.gapVi === 'string' ? c.gapVi : '',
      nextStepVi: typeof c.nextStepVi === 'string' ? c.nextStepVi : '',
      quotes: verifiedQuotes(c.quotes, bodyText),
    };
  }
  return { criteria: out, quotesChecked, quotesRejected };
}

/**
 * Chỉ giữ lại trích dẫn CÓ THẬT trong bài.
 *
 * Model được dặn chép nguyên văn, nhưng nó vẫn bịa — và một dẫn chứng bịa còn tệ
 * hơn không có dẫn chứng nào: người học đi tìm câu đó trong bài mình, không thấy,
 * rồi mất tin vào toàn bộ phần còn lại. Chỗ này kiểm được bằng code nên phải kiểm.
 */
function verifiedQuotes(v: unknown, bodyText: string): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== 'string') continue;
    const q = item.trim();
    if (q.length < 2) continue;
    // Trả về đúng đoạn trong bài, không phải bản model chép lại — để người học tìm được nó.
    const verbatim = findVerbatim(q, bodyText);
    if (verbatim == null || out.includes(verbatim)) continue;
    out.push(verbatim);
    if (out.length === 3) break;
  }
  return out;
}

const CATEGORIES = new Set(['grammar', 'lexis', 'cohesion', 'expression', 'task']);

function readAnnotations(annotated: unknown): RawAnnotation[] {
  const list = asRecord(annotated).annotations;
  if (!Array.isArray(list)) return [];

  const out: RawAnnotation[] = [];
  for (const item of list) {
    const a = asRecord(item);
    if (typeof a.quote !== 'string' || a.quote.trim() === '') continue;
    out.push({
      quote: a.quote,
      category: (CATEGORIES.has(String(a.category)) ? a.category : 'expression') as RawAnnotation['category'],
      severity: a.severity === 'major' ? 'major' : 'minor',
      whyVi: typeof a.whyVi === 'string' ? a.whyVi : '',
      fix: typeof a.fix === 'string' ? a.fix : '',
    });
  }
  return out;
}

/** Kẹp về thang 1–9 và làm tròn tới 0.5 — model đôi khi trả 6.3 hoặc 12. */
function band(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 5;
  return Math.min(9, Math.max(1, Math.round(n * 2) / 2));
}

function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];
}

function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
}
