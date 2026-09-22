import { AiError } from '@/services/ai/errors';

/**
 * SERVER-ONLY. Hỏi đáp trên CẢ KHO bài đọc, dựa vào LightRAG chạy ở HoaiDuc.
 *
 * VÌ SAO TÁCH KHỎI `/api/chat` VÀ `/api/ask`.
 *   - `/api/chat` nhét NGUYÊN VĂN một bài vào ngữ cảnh rồi trả lời — chỉ đúng khi
 *     câu hỏi nằm gọn trong một bài, và mỗi bài đủ ngắn để nằm vừa ngữ cảnh.
 *   - `/api/ask` hỏi đáp chung, KHÔNG bám tài liệu nào — nên hay đoán trôi chảy.
 * Chỗ này trả lời câu thứ ba: "cả kho có gì về X", "app đã dạy Y ở bài nào" —
 * thứ không nhét hết vào ngữ cảnh được (kho ~1.400 bài), phải TRUY HỒI rồi mới
 * trả lời. Đó là việc của LightRAG: index thực thể + đồ thị cả kho một lần, mỗi
 * lượt hỏi chỉ kéo về đúng mấy đoạn liên quan.
 *
 * RÀNG BUỘC KIỂM ĐƯỢC ở đây là "chỉ dựa vào tài liệu trong kho, không có thì nói
 * không có" — cùng tinh thần với `/api/ask`. LightRAG tự kéo bằng chứng, ta ép nó
 * bằng `user_prompt` phải nói thẳng khi kho không đỡ được câu hỏi.
 *
 * Dịch vụ này ở NGOÀI Vercel (máy HoaiDuc, qua tunnel) vì hai lẽ: index phải tồn
 * tại lâu dài (Vercel serverless không giữ nổi), và một lượt truy hồi + sinh đáp
 * có thể vượt trần 60s của Vercel. Cấu hình qua env, hỏng thì gọi biết là hỏng.
 */

const KB_URL = process.env.KB_RAG_URL;
const KB_KEY = process.env.KB_RAG_API_KEY;
const KB_TIMEOUT_MS = Number(process.env.KB_RAG_TIMEOUT_MS ?? 55_000);

export type KbSource = { title: string; snippet?: string };
export type KbAnswer = { text: string; sources: KbSource[] };

/**
 * Chỉ dẫn nhét vào MỖI lượt hỏi. Đặt ở `user_prompt` chứ không tin vào mặc định
 * của LightRAG: ta cần đúng tiếng Việt, đúng kiểu chữ không-markdown mà bong bóng
 * chat của app dựng được, và cái ràng buộc chống bịa.
 */
const USER_PROMPT = [
  'Trả lời bằng TIẾNG VIỆT, ngắn gọn, đi thẳng vào việc. Không mở đầu bằng lời chào.',
  'KHÔNG dùng markdown: không **đậm**, không # tiêu đề, không bảng. Cần liệt kê thì mỗi',
  'dòng bắt đầu bằng một dấu gạch ngang.',
  'CHỈ dựa vào tài liệu trong kho. Nếu kho không có thông tin để trả lời, nói thẳng là',
  'chưa có bài nào trong kho nói về việc này — TUYỆT ĐỐI không bịa và không lấy kiến thức',
  'ngoài kho. Khi dẫn một thông tin, nêu tên bài đọc nguồn trong ngoặc.',
].join('\n');

/**
 * Bóc danh sách nguồn từ phần `references` LightRAG trả về.
 *
 * Tách riêng và viết phòng thủ vì shape của `references` đổi theo phiên bản
 * LightRAG: có bản để `file_path`, có bản `reference_id`/`doc_id`. Ta nạp kho với
 * `file_sources` = tên bài, nên tên bài NẰM ở `file_path`; các khoá khác chỉ là
 * dự phòng. Đầu vào lạ thì trả mảng rỗng, không để một shape lạ làm hỏng cả lượt.
 */
export function parseReferences(refs: unknown): KbSource[] {
  if (!Array.isArray(refs)) return [];
  const seen = new Set<string>();
  const out: KbSource[] = [];
  for (const r of refs) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const title =
      (typeof o.file_path === 'string' && o.file_path) ||
      (typeof o.title === 'string' && o.title) ||
      (typeof o.reference_id === 'string' && o.reference_id) ||
      '';
    if (!title || seen.has(title)) continue;
    seen.add(title);
    out.push({ title });
  }
  return out;
}

export async function askKnowledgeBase(input: {
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<KbAnswer> {
  if (!KB_URL || !KB_KEY) {
    throw new AiError('missing_config', 'Chưa cấu hình KB_RAG_URL/KB_RAG_API_KEY cho hỏi đáp cả kho.');
  }

  const res = await fetch(`${KB_URL.replace(/\/$/, '')}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': KB_KEY },
    body: JSON.stringify({
      query: input.question,
      // 'mix' = trộn truy hồi theo đồ thị và theo vector; cân bằng tốt nhất cho
      // câu hỏi vừa cần chỉ đúng bài, vừa cần gom ý rải rác nhiều bài.
      mode: 'mix',
      user_prompt: USER_PROMPT,
      include_references: true,
      // Sáu lượt gần nhất là đủ mạch; gửi cả lịch sử dài chỉ làm loãng truy hồi.
      conversation_history: (input.history ?? []).slice(-6),
    }),
    signal: AbortSignal.timeout(KB_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new AiError('server_error', `Kho tri thức trả HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  }

  const body = (await res.json()) as { response?: string; references?: unknown };
  const text = (body.response ?? '').trim();
  if (!text) {
    throw new AiError('bad_response', 'Kho tri thức trả về rỗng.');
  }

  return { text, sources: parseReferences(body.references) };
}
