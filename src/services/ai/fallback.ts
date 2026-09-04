import { AiError } from './errors';

/**
 * Gọi AI qua BA proxy độc lập, tự chuyển cửa khi cửa trước hỏng.
 *
 * SERVER-ONLY.
 *
 * VÌ SAO CẦN: chấm bài bằng AI giờ là tính năng NGƯỜI DÙNG ĐÃ TRẢ TIỀN. Một
 * proxy sập là cả tính năng chết, và người vừa mua gói Pro sáng nay không quan
 * tâm rằng lỗi nằm ở nhà cung cấp. Ba proxy chạy trên ba máy khác nhau nên
 * chúng hỏng độc lập với nhau.
 *
 * ĐÂY KHÔNG PHẢI CƠ CHẾ THỬ LẠI. `withRetry` đã lo việc gọi lại cùng một nơi
 * khi mạng chập chờn. File này lo việc khác: khi CẢ MỘT NHÀ CUNG CẤP không dùng
 * được — hết hạn mức, model bị gỡ, tên miền chết — thì thử lại bao nhiêu lần
 * cũng vô ích, phải đi cửa khác.
 *
 * Model dự phòng KHÁC model chính, và đó là chủ ý: các model do các hãng khác
 * nhau làm hỏng theo những kiểu khác nhau. Dùng cùng một model ở hai proxy chỉ
 * chống được sự cố hạ tầng, không chống được chuyện model đó trả về rác.
 *
 * MỘT CỬA DỰ PHÒNG CHƯA CHẮC ĐÃ LÀ CỬA DỰ PHÒNG. Xem `foldSystemIntoUser` bên
 * dưới: suốt một thời gian dài cửa hai âm thầm nuốt mất vai `system`, tức là
 * mọi chỉ dẫn của app biến mất đúng vào lúc cửa một sập. Bài học ghi lại ở đây
 * để lần sau thêm cửa mới thì ĐO trước, đừng tin là nó tương thích.
 */

export type Purpose = 'writing' | 'coach' | 'translate' | 'questions' | 'chat' | 'define';

/** Liệt kê tường minh để lấp `defaultModel` — union TS không duyệt được lúc chạy. */
const PURPOSES: Purpose[] = ['writing', 'coach', 'translate', 'questions', 'chat', 'define'];

export type Endpoint = {
  /** Định danh ổn định để xếp thứ tự; `label` chỉ để hiện cho người đọc log. */
  key: 'primary' | 'secondary' | 'tertiary';
  label: string;
  baseUrl: string;
  apiKey: string;
  /** Model KHÁC NHAU theo từng proxy: ba nhà cung cấp có danh mục không giao nhau. */
  models: Partial<Record<Purpose, string>>;
  /** Dùng khi việc nào đó không được chỉ định model riêng ở proxy này. */
  defaultModel?: string;
  /**
   * Proxy này NUỐT MẤT vai `system` — phải gộp chỉ dẫn vào tin nhắn của người dùng.
   *
   * ĐO ĐƯỢC, KHÔNG PHẢI PHÒNG XA. Gửi system "chỉ được trả lời đúng một từ
   * BANANA" kèm user "thủ đô nước Pháp là gì", ngày 04/09/2026:
   *
   *   groq  / gpt-oss-120b   -> "BANANA"   (tôn trọng)
   *   ai-box/ deepseek-v4-flash -> "BANANA" (tôn trọng)
   *   codex / claude-haiku-4-5  -> "Paris." (nuốt mất)
   *   codex / claude-sonnet-5   -> "Paris." (nuốt mất)
   *   codex / gpt-5.5           -> ""       (nuốt mất)
   *
   * Cả ba model trên codex đều hỏng như nhau, nên lỗi nằm ở proxy chứ không ở
   * model — vì thế cờ này gắn vào CỬA, không gắn vào model.
   *
   * Vì sao đáng bận tâm: app đặt TOÀN BỘ chỉ dẫn vào `call.system` và chỉ để dữ
   * liệu ở `call.user`. Một cửa nuốt system không "kém hơn một chút" — nó nhận
   * bài luận rồi tán gẫu về nội dung bài luận, thay vì chấm. Kiểm lại bằng
   * `node scripts/bench-ai-routing.mjs`.
   */
  foldSystemIntoUser: boolean;
};

/**
 * Ghép hai phần chỉ dẫn/dữ liệu thành mảng `messages` gửi đi.
 *
 * Tách riêng ra vì có HAI chỗ gọi (một lượt thường và một lượt stream) và chúng
 * đã từng trôi lệch nhau.
 */
export function buildMessages(
  endpoint: Pick<Endpoint, 'foldSystemIntoUser'>,
  call: { system: string; user: string },
): Array<{ role: 'system' | 'user'; content: string }> {
  if (!endpoint.foldSystemIntoUser) {
    return [
      { role: 'system', content: call.system },
      { role: 'user', content: call.user },
    ];
  }

  // Vẫn GỬI KÈM vai system: cửa nào đọc được thì đọc, cửa nào bỏ qua thì phần
  // gộp ở dưới vẫn tới nơi. Gửi thừa một lần chỉ dẫn rẻ hơn nhiều so với việc
  // mất trắng chỉ dẫn.
  return [
    { role: 'system', content: call.system },
    { role: 'user', content: `${call.system}\n\n---\n\n${call.user}` },
  ];
}

/**
 * Tên cửa để ghi log, lấy từ chính tên miền.
 *
 * Không đặt tay: nhãn viết tay đã từng nói dối một thời gian dài — cửa `primary`
 * mang nhãn "ai-box" trong khi nó đã được trỏ sang Groq từ lâu, nên log truy vết
 * sự cố chỉ sai người.
 */
function labelFor(baseUrl: string, fallbackLabel: string): string {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return fallbackLabel;
  }
}

/*
  Ngân sách cho MỘT cửa — và đây là chỗ một con số 45s chung cho mọi việc đã
  chứng minh SAI trên production.

  Bắt được thật: `sinh đề` xếp cửa CODEX/haiku lên trước (xem `ORDER` dưới),
  vì haiku trích dẫn chuẩn hơn hẳn (12/12 so với 8/12 của deepseek, đo hồi
  03/09/2026). Nhưng codex vốn đã biết là THẤT THƯỜNG (11–92 giây). Với ngân
  sách 45s chung: cửa một (codex) có thể ngốn HẾT 45 giây rồi mới rơi xuống cửa
  hai (ai-box), và cửa hai lại cần thêm 10–20 giây nữa — tổng vượt quá trần 60
  giây của Vercel, hàm bị giết giữa chừng, KHÔNG CÒN GÌ ĐƯỢC TRẢ VỀ (504 trắng,
  không phải một lỗi có nội dung). Đã gặp thật: hai lần liên tiếp trên production,
  cả hai đều đúng 60,6–60,8 giây.

  Sinh đề cần ngân sách RIÊNG, ngắn hơn hẳn: cửa một chỉ được 20 giây (đủ cho
  phần lớn lượt haiku thành công — đo thật 13–16s), hỏng thì còn nguyên 40 giây
  cho cửa hai xoay sở, thay vì chỉ còn 15.
*/
const DEFAULT_CALL_TIMEOUT_MS = Number(process.env.AI_CALL_TIMEOUT_MS ?? 45_000);

/**
 * Trần cho CẢ LƯỢT GỌI, cộng dồn mọi cửa đã thử.
 *
 * Hạn chờ theo từng cửa một mình là KHÔNG ĐỦ, và càng thêm cửa thì càng sai: ba
 * cửa × 45 giây là 135 giây, trong khi hàm serverless của Vercel bị giết ở 60.
 * Vượt trần thì người dùng không nhận được một lỗi có nội dung — họ nhận 504
 * trắng, mất luôn cả thông tin cửa nào hỏng vì sao. Chuyện này đã xảy ra thật
 * hai lần liên tiếp trên production, cả hai đúng 60,6-60,8 giây.
 *
 * Đặt 50 giây, chừa 10 giây cho phần dựng phản hồi và độ trễ mạng ở hai đầu.
 */
const TOTAL_BUDGET_MS = Number(process.env.AI_TOTAL_BUDGET_MS ?? 50_000);

/**
 * Thời gian còn được phép tiêu ở cửa tiếp theo.
 *
 * Trả về 0 nghĩa là hết giờ — lúc ấy mở thêm một request nữa chỉ chắc chắn bị
 * cắt giữa chừng, thà dừng và báo lỗi tử tế còn hơn.
 */
function remainingBudget(deadline: number, perDoor: number): number {
  const left = deadline - Date.now();
  // Dưới 2 giây thì không cửa nào kịp trả lời; coi như hết.
  return left < 2_000 ? 0 : Math.min(perDoor, left);
}

const CALL_TIMEOUT_MS: Record<Purpose, number> = {
  writing: DEFAULT_CALL_TIMEOUT_MS,
  coach: DEFAULT_CALL_TIMEOUT_MS,
  translate: DEFAULT_CALL_TIMEOUT_MS,
  questions: Number(process.env.AI_CALL_TIMEOUT_MS_QUESTIONS ?? 20_000),
  chat: DEFAULT_CALL_TIMEOUT_MS,
  define: DEFAULT_CALL_TIMEOUT_MS,
};

/**
 * Danh sách cửa, theo thứ tự ưu tiên.
 *
 * THỨ TỰ NÀY ĐƯỢC ĐO, KHÔNG PHẢI ĐOÁN — `node scripts/bench-ai-routing.mjs`,
 * đo ngày 04/09/2026 trên bài luận thật và bài đọc thật:
 *
 *   việc        cửa 1 groq/gpt-oss-120b   cửa 2 ai-box/deepseek-v4-flash
 *   chấm bài    2,1-2,4s  4/4 trích dẫn   6,8-7,9s  4/4 trích dẫn
 *   sinh đề     2,4s      5/5 dẫn chứng   7,0-7,8s  5/5 dẫn chứng
 *   tra từ      0,5s      đủ 5 trường     2,8s      đủ 5 trường
 *   dịch        1,1s      tiếng Việt      2,9s      tiếng Việt
 *   chatbox     1,3s      tiếng Việt      3,2s      tiếng Việt
 *
 * Groq thắng mọi việc về tốc độ mà không thua về chất lượng, nên nó đứng cửa
 * một cho TẤT CẢ — không còn việc nào cần đảo thứ tự nữa.
 *
 * Hai ứng viên đã LOẠI, ghi lại để khỏi thử lại:
 *   glm-5.2-fast-preview : trả về RỖNG 3/3 lượt ở bài chấm dài (~14s rồi câm).
 *   codex/claude-haiku   : nuốt vai `system` (xem `foldSystemIntoUser`), và
 *                          chậm thất thường — riêng lượt tra từ mất 20 giây.
 * Codex vẫn giữ ở cửa BA: đã gộp chỉ dẫn vào tin nhắn người dùng nên dùng được,
 * và nó sập độc lập với hai cửa kia. Chỉ là không được đứng trước.
 *
 * `OPENAI_BASE_URL` cũ GIỮ NGUYÊN trỏ vào codex: vài đường gọi thẳng SDK
 * (`layout-advisor`, `model-essay`) đang dùng nó, đổi là làm hỏng chúng.
 *
 * Thứ tự mặc định là primary → secondary → tertiary; `AI_ORDER_<VIỆC>` vẫn còn
 * đó để đảo lại khi số liệu đổi chiều, chỉ là hiện không việc nào cần.
 */
/*
  Thứ tự cửa cho từng việc. Phải viết TỪNG BIẾN MỘT, không tra động được:
  Expo thay `process.env.TÊN` bằng giá trị ngay lúc đóng gói, nên
  `process.env[biến]` sẽ ra undefined mà không báo gì cả.
*/
function orderFor(purpose: Purpose): string | undefined {
  /*
    ĐỌC LÚC GỌI, không phải lúc nạp module — để đồng bộ với `readEndpoints`, vốn
    cũng đọc `process.env` mỗi lượt. Trước đây bảng này là một hằng mức module,
    tức là nửa cấu hình sống theo từng lượt gọi còn nửa kia đông cứng từ lúc nạp.
    Trên Vercel thì hai cách cho kết quả như nhau (biến môi trường có sẵn trước
    khi nạp), nhưng hai lối đọc khác nhau cho cùng một loại cấu hình là cái bẫy
    chờ người sau — và nó đã làm một ca kiểm thất bại đúng theo kiểu ấy.
  */
  switch (purpose) {
    case 'writing':
      return process.env.AI_ORDER_WRITING;
    case 'coach':
      return process.env.AI_ORDER_COACH;
    case 'translate':
      return process.env.AI_ORDER_TRANSLATE;
    case 'questions':
      return process.env.AI_ORDER_QUESTIONS;
    case 'chat':
      return process.env.AI_ORDER_CHAT;
    case 'define':
      return process.env.AI_ORDER_DEFINE;
  }
}

function readEndpoints(purpose: Purpose): Endpoint[] {
  const all: Endpoint[] = [
    {
      key: 'primary',
      label: labelFor(process.env.AI_PRIMARY_BASE_URL ?? process.env.OPENAI_BASE_URL ?? '', 'cửa 1'),
      baseUrl: process.env.AI_PRIMARY_BASE_URL ?? process.env.OPENAI_BASE_URL ?? '',
      apiKey: process.env.AI_PRIMARY_API_KEY ?? process.env.OPENAI_API_KEY ?? '',
      defaultModel: process.env.AI_PRIMARY_MODEL,
      foldSystemIntoUser: process.env.AI_PRIMARY_FOLD_SYSTEM === 'true',
      models: {
        writing: process.env.WRITING_MODEL,
        coach: process.env.COACH_MODEL ?? process.env.WRITING_MODEL,
        translate: process.env.TRANSLATE_MODEL,
        questions: process.env.QUESTIONS_MODEL,
        chat: process.env.CHAT_MODEL,
        define: process.env.DEFINE_MODEL,
      },
    },
    {
      key: 'secondary',
      label: labelFor(process.env.AI_SECONDARY_BASE_URL ?? '', 'cửa 2'),
      baseUrl: process.env.AI_SECONDARY_BASE_URL ?? '',
      apiKey: process.env.AI_SECONDARY_API_KEY ?? '',
      defaultModel: process.env.AI_SECONDARY_MODEL,
      foldSystemIntoUser: process.env.AI_SECONDARY_FOLD_SYSTEM === 'true',
      models: {
        writing: process.env.WRITING_FALLBACK_MODEL,
        coach: process.env.COACH_FALLBACK_MODEL ?? process.env.WRITING_FALLBACK_MODEL,
        translate: process.env.TRANSLATE_FALLBACK_MODEL,
        questions: process.env.QUESTIONS_FALLBACK_MODEL,
        chat: process.env.CHAT_FALLBACK_MODEL,
        define: process.env.DEFINE_FALLBACK_MODEL,
      },
    },
    {
      key: 'tertiary',
      label: labelFor(process.env.AI_TERTIARY_BASE_URL ?? '', 'cửa 3'),
      baseUrl: process.env.AI_TERTIARY_BASE_URL ?? '',
      apiKey: process.env.AI_TERTIARY_API_KEY ?? '',
      defaultModel: process.env.AI_TERTIARY_MODEL,
      foldSystemIntoUser: process.env.AI_TERTIARY_FOLD_SYSTEM === 'true',
      // Cửa ba cố ý KHÔNG có bảng model theo từng việc: nó là lưới an toàn cuối,
      // một model chung cho mọi việc là đủ, và thêm sáu biến môi trường nữa chỉ
      // tạo thêm chỗ để cấu hình sai.
      models: {},
    },
  ];

  // `defaultModel` lấp chỗ trống cho việc nào không được chỉ định riêng — nhờ nó
  // mà một cửa dự phòng chỉ cần MỘT biến model thay vì sáu.
  for (const e of all) {
    if (!e.defaultModel) continue;
    for (const p of PURPOSES) e.models[p] ??= e.defaultModel;
  }

  const usable = all.filter((e) => e.baseUrl && e.apiKey && e.models[purpose]);
  if (usable.length === 0) {
    throw new AiError('missing_config', 'Chưa cấu hình proxy AI nào dùng được cho việc này.');
  }

  /*
    Thứ tự cửa ĐẢO ĐƯỢC THEO TỪNG VIỆC, qua biến `AI_ORDER_<VIỆC>`.

    Cần thế vì "proxy nào tốt hơn" không có câu trả lời chung — nó phụ thuộc việc
    đang làm, do hai proxy có danh mục model không giao nhau. Chấm bài thì ai-box
    nhanh hơn hẳn; nhưng sinh đề thì model tốt nhất lại chỉ có ở codex (đo trên 3
    bài: claude-haiku-4-5 13-16s và 12/12 trích dẫn nguyên văn, so với
    deepseek-v4-flash 33-62s và 8/12). Cố định thứ tự cho mọi việc thì một trong
    hai việc luôn phải dùng cửa dở hơn.
  */
  const wanted = orderFor(purpose);
  if (wanted) {
    const rank = wanted.split(',').map((k) => k.trim());
    // Cửa không có tên trong danh sách xuống cuối, không bị loại — cấu hình
    // thiếu sót không được phép làm mất đường dự phòng.
    const at = (e: Endpoint) => (rank.indexOf(e.key) === -1 ? rank.length : rank.indexOf(e.key));
    usable.sort((a, b) => at(a) - at(b));
  }

  return usable;
}

/**
 * Gọi bằng `fetch` trần, KHÔNG dùng SDK OpenAI.
 *
 * Không phải để bớt phụ thuộc — mà vì một trong hai proxy TRẢ VỀ 403 "Your
 * request was blocked" cho request của SDK, trong khi cùng nội dung đó gửi bằng
 * `fetch` thì đi lọt. Nhiều khả năng lớp chống bot ở trước nó soi header của
 * SDK. Đo được bằng bộ benchmark: cùng model, cùng payload, khác cách gửi, khác
 * kết quả.
 */
async function callEndpoint(
  endpoint: Endpoint,
  purpose: Purpose,
  call: { system: string; user: string; temperature?: number },
  timeoutMs: number,
): Promise<string> {
  const res = await fetch(`${endpoint.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${endpoint.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: endpoint.models[purpose],
      temperature: call.temperature ?? 0.3,
      messages: buildMessages(endpoint, call),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 140)}`);
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = body.choices?.[0]?.message?.content ?? '';
  // Chuỗi rỗng cũng là hỏng. Không kiểm thì nó đi tiếp xuống chỗ bóc JSON và
  // báo một lỗi khác hẳn, che mất nguyên nhân thật.
  if (!text.trim()) throw new Error('trả về rỗng');
  return text;
}

export type ChatCall = {
  system: string;
  user: string;
  temperature?: number;
  purpose?: Purpose;
};

export type ChatResult = { text: string; model: string; endpoint: string; ms: number };

/**
 * Gọi lần lượt từng cửa cho tới khi một cửa trả về nội dung dùng được.
 *
 * Trả về CẢ tên model đã dùng, không chỉ nội dung: khi người dùng báo "nhận xét
 * kỳ quá", câu hỏi đầu tiên luôn là model nào đã chấm — và không lưu lại thì
 * không ai trả lời được.
 */
export async function chatWithFallback(call: ChatCall): Promise<ChatResult> {
  const purpose = call.purpose ?? 'writing';
  const endpoints = readEndpoints(purpose);
  const failures: string[] = [];
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const endpoint of endpoints) {
    const budget = remainingBudget(deadline, CALL_TIMEOUT_MS[purpose]);
    if (budget === 0) {
      failures.push(`${endpoint.label}: bỏ qua, đã hết ngân sách ${TOTAL_BUDGET_MS}ms cho cả lượt`);
      continue;
    }

    const started = Date.now();
    try {
      const text = await callEndpoint(endpoint, purpose, call, budget);
      return {
        text,
        model: endpoint.models[purpose] ?? '?',
        endpoint: endpoint.label,
        ms: Date.now() - started,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'lỗi lạ';
      failures.push(`${endpoint.label} (${endpoint.models[purpose]}): ${reason.slice(0, 140)}`);
    }
  }

  throw new AiError(
    'server_error',
    `Cả ${endpoints.length} proxy AI đều không gọi được.\n  ${failures.join('\n  ')}`,
  );
}

/**
 * Bóc JSON từ nội dung model trả về.
 *
 * Không dùng `response_format: json_object`: proxy phục vụ model của nhiều hãng
 * qua giao diện tương thích OpenAI, và tham số đó không phải chỗ nào cũng đi
 * qua được. Model hay bọc JSON trong ```json … ``` hoặc thêm một câu dẫn, nên
 * cắt từ dấu { đầu tới dấu } cuối là cách bền nhất.
 */
export function extractJson<T>(text: string): T {
  const from = text.indexOf('{');
  const to = text.lastIndexOf('}');
  if (from < 0 || to <= from) {
    throw new AiError('bad_response', 'Model không trả về JSON.');
  }
  try {
    return JSON.parse(text.slice(from, to + 1)) as T;
  } catch {
    throw new AiError('bad_response', 'JSON model trả về không đọc được.');
  }
}

/** Hạn chờ mẩu chữ ĐẦU TIÊN. Sau mốc này coi như cửa đó câm, chuyển cửa khác. */
const FIRST_TOKEN_TIMEOUT_MS = Number(process.env.AI_FIRST_TOKEN_TIMEOUT_MS ?? 20_000);

/** Trần cho cả lượt stream. Dưới mức 60s Vercel cắt, để còn kịp đóng tử tế. */
const STREAM_TIMEOUT_MS = Number(process.env.AI_STREAM_TIMEOUT_MS ?? 55_000);

export type StreamResult = {
  stream: AsyncIterable<string>;
  model: string;
  endpoint: string;
};

/**
 * Bóc dòng SSE của giao thức tương thích OpenAI thành từng mẩu chữ.
 *
 * Mẩu dữ liệu về KHÔNG cắt theo dòng — một dòng `data: {...}` có thể bị chẻ làm
 * đôi giữa hai lần đọc. Vì thế phải giữ `buffer` và chỉ xử lý phần đã thấy ký tự
 * xuống dòng; bóc ngay từng mẩu nhận được sẽ ra JSON hỏng ở những câu dài.
 */
export async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // Dòng cuối có thể còn dang dở, giữ lại cho vòng sau.
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;

      try {
        const parsed = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const piece = parsed.choices?.[0]?.delta?.content;
        if (piece) yield piece;
      } catch {
        // Một mẩu hỏng không đáng để giết cả câu trả lời đang chạy dở.
      }
    }
  }
}

/**
 * Gọi có stream, vẫn giữ được đường dự phòng — nhưng chỉ tới một thời điểm.
 *
 * CHỖ KHÓ: đã đẩy chữ cho người dùng rồi thì KHÔNG được đổi cửa nữa. Đổi giữa
 * chừng thì câu trả lời bị ghép từ hai model khác nhau, và người đọc nhận một
 * đoạn văn tự mâu thuẫn mà không biết vì sao. Nên ranh giới là mẩu chữ đầu tiên:
 *
 *   - Chưa ra chữ nào (kết nối hỏng, HTTP lỗi, cửa câm quá `FIRST_TOKEN_TIMEOUT_MS`)
 *     → thử cửa tiếp theo, người dùng không thấy gì bất thường.
 *   - Đã ra chữ rồi mà đứt giữa chừng → dừng hẳn, KHÔNG thử lại. Câu trả lời cụt
 *     kèm ghi chú vẫn thành thật hơn một câu trả lời chắp vá.
 */
export async function streamWithFallback(call: ChatCall): Promise<StreamResult> {
  const purpose = call.purpose ?? 'chat';
  const endpoints = readEndpoints(purpose);
  const failures: string[] = [];

  const streamDeadline = Date.now() + TOTAL_BUDGET_MS;

  for (const endpoint of endpoints) {
    const budget = remainingBudget(streamDeadline, STREAM_TIMEOUT_MS);
    if (budget === 0) {
      failures.push(`${endpoint.label}: bỏ qua, đã hết ngân sách ${TOTAL_BUDGET_MS}ms cho cả lượt`);
      continue;
    }

    const controller = new AbortController();
    const cap = setTimeout(() => controller.abort(), budget);

    try {
      const res = await fetch(`${endpoint.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${endpoint.apiKey}`,
        },
        body: JSON.stringify({
          model: endpoint.models[purpose],
          temperature: call.temperature ?? 0.3,
          stream: true,
          messages: buildMessages(endpoint, call),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const iterator = parseSse(res.body)[Symbol.asyncIterator]();

      /*
        Chờ mẩu đầu NGAY TẠI ĐÂY, trước khi trả stream về cho bên gọi.

        Phải chờ ở đây thì mới còn quyền đổi cửa: trả stream về rồi mới phát hiện
        cửa câm thì bên gọi đã mở Response và gửi header đi mất.
      */
      const first = await Promise.race([
        iterator.next(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('không ra chữ nào')), FIRST_TOKEN_TIMEOUT_MS),
        ),
      ]);

      if (first.done) throw new Error('stream rỗng');

      const stream = (async function* () {
        try {
          yield first.value;
          for await (const piece of iterator) yield piece;
        } finally {
          clearTimeout(cap);
        }
      })();

      return { stream, model: endpoint.models[purpose] ?? '?', endpoint: endpoint.label };
    } catch (err) {
      clearTimeout(cap);
      controller.abort();
      const reason = err instanceof Error ? err.message : 'lỗi lạ';
      failures.push(`${endpoint.label} (${endpoint.models[purpose]}): ${reason.slice(0, 140)}`);
    }
  }

  throw new AiError('server_error', `Cả ${endpoints.length} proxy AI đều không gọi được.\n  ${failures.join('\n  ')}`);
}

/**
 * Lối vào cho test — không dùng trong mã chạy thật.
 *
 * `readEndpoints` đọc `process.env` mỗi lần gọi (cố ý: hàm serverless có thể
 * được nạp lại với cấu hình khác), nên test đặt biến rồi gọi là đủ.
 */
export const __fallbackInternals = { readEndpoints, remainingBudget, TOTAL_BUDGET_MS };
