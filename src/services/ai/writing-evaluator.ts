import { getOpenAI } from './client';
import { AiError, toAiError } from './errors';
import { chatWithFallback } from './fallback';
import { countQuoteMatches, writingReceipt, type VerificationReceipt } from './verification';
import { withRetry } from './retry';
import { anchorAnnotations, type RawAnnotation } from '@/services/writing/annotate';
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
const RUBRIC = `TIÊU CHUẨN CHẤM (IELTS Writing, rút gọn):

Task Achievement / Task Response
- 5: không có overview (Task 1) hoặc không trả lời đúng câu hỏi (Task 2); kể lể máy móc; có thể dưới số từ tối thiểu.
- 6: có overview nhưng mờ; chọn được ý chính nhưng chi tiết lộn xộn hoặc thiếu số liệu.
- 7: overview rõ ràng, nêu đúng xu hướng/khác biệt chính; mọi ý chính đều có dữ liệu minh hoạ; không bịa thông tin ngoài đề.
- 8: chọn lọc rất khéo, làm nổi bật đúng điều quan trọng nhất.

Coherence and Cohesion
- 5: sắp xếp lộn xộn, từ nối lặp hoặc sai; không chia đoạn.
- 6: theo dõi được nhưng từ nối máy móc; đoạn có chỗ chưa cân.
- 7: ý được NHÓM hợp lý theo đoạn; từ nối linh hoạt, đúng chỗ.
- 8: mạch chảy tự nhiên, liên kết chủ yếu nhờ cách sắp xếp ý.

Lexical Resource
- 5: vốn từ hạn chế, lặp một chữ nhiều lần; lỗi chính tả gây khó hiểu.
- 6: đủ dùng nhưng lặp; có lỗi chọn từ.
- 7: đủ linh hoạt, có từ ít thông dụng dùng đúng; paraphrase được đề.
- 8: tự nhiên, collocation chuẩn.

Grammatical Range and Accuracy
- 5: chủ yếu câu đơn một khuôn; lỗi thường xuyên.
- 6: có trộn câu phức; lỗi xuất hiện đều đặn nhưng hiếm khi gây hiểu sai.
- 7: nhiều dạng câu phức; ĐA SỐ câu không có lỗi.
- 8: rất hiếm lỗi.

Chấm CHẶT. Nếu phân vân giữa hai mức, chọn mức thấp hơn.`;

const SCORE_SYSTEM = `Bạn là giám khảo IELTS Writing giàu kinh nghiệm, đang viết phiếu chấm chi tiết cho học viên người Việt.

${RUBRIC}

Trả về JSON THUẦN, không markdown fence, không lời dẫn:
{
  "bandLow": number,        // cận dưới, bội số của 0.5
  "bandHigh": number,       // cận trên, bội số của 0.5, cách bandLow tối đa 1.0
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

BẮT BUỘC trả KHOẢNG band chứ không phải một số cứng: chấm tự động không đủ tin cậy để chốt một con số.`;

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
    const built = buildResult(score, { annotations: [] }, input.bodyText, model);
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

    return { ...buildResult(score, annotated, input.bodyText, model), minWords: input.prompt.minWords };
  } catch (err) {
    throw toAiError(err, 'Không chấm được bài. Thử lại sau ít phút.');
  }
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

  let low = band(s.bandLow);
  let high = band(s.bandHigh);
  if (high < low) [low, high] = [high, low];
  // Model hay trả một số cứng dù đã bảo trả khoảng. Chấm tự động không đủ tin
  // cậy để chốt một con số, nên tự nới ra nửa bậc.
  if (high === low) high = Math.min(9, low + 0.5);

  const rawAnnotations = readAnnotations(annotated);
  const anchored = anchorAnnotations(bodyText, rawAnnotations);

  return {
    ...criteria,
    bandLow: low,
    bandHigh: high,
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
  const hay = bodyText.toLowerCase();
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== 'string') continue;
    const q = item.trim();
    if (q.length < 2) continue;
    if (!hay.includes(q.toLowerCase())) continue;
    out.push(q);
    if (out.length === 3) break;
  }
  return out;
}

/**
 * Đếm từ bằng code chứ không hỏi model.
 *
 * Số từ là thứ kiểm được tuyệt đối, mà nó lại quyết định trực tiếp Task Response
 * (thiếu số từ tối thiểu là trừ thẳng). Hỏi model một con số đếm được là tự chuốc
 * lấy rủi ro không có lợi ích gì.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
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
