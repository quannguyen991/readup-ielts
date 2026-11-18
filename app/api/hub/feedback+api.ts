import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { AiError, toAiError } from '@/services/ai/errors';
import { chatWithFallback, extractJson } from '@/services/ai/fallback';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { feedbackSystemPrompt, feedbackUserPrompt, validateFeedback, type FeedbackPart } from '@/services/hub/answer-feedback';

/**
 * POST /api/hub/feedback  { part, question, transcript, durationSec, wpm, fillers }
 *
 * Phân tích MỘT câu trả lời nói bằng AI: điểm band theo nội dung, bốn tiêu chí, lỗi kèm bản sửa,
 * từ nâng cấp, bản viết lại và gợi ý luyện tiếp. Cần đăng nhập và trừ hạn mức AI ở máy chủ như các route chấm khác;
 * lỗi phía ta thì hoàn lượt. Câu hỏi do client gửi chỉ dùng làm ngữ cảnh (không ảnh hưởng quyền hay hạn mức).
 * Hết lượt hoặc AI hỏng thì màn luyện vẫn có phần phân tích tại máy.
 */

const MAX_WORDS = 450;
const MAX_QUESTION = 700;

export async function POST(request: Request): Promise<Response> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return Response.json({ error: msg(request, 'Đăng nhập để AI phân tích chi tiết câu trả lời.', 'Sign in to get a detailed AI analysis of your answer.') }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
  const userId = auth.user.id;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: msg(request, 'Yêu cầu không hợp lệ.', 'Invalid request.') }, { status: 400 });
  }

  const part = (body.part === 1 || body.part === 2 || body.part === 3 ? body.part : 1) as FeedbackPart;
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION) : '';
  const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : '';
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  if (!question || wordCount < 6) return Response.json({ error: msg(request, 'Câu trả lời quá ngắn để phân tích.', 'The answer is too short to analyse.') }, { status: 400 });
  if (wordCount > MAX_WORDS) return Response.json({ error: msg(request, `Câu trả lời dài hơn ${MAX_WORDS} từ.`, `The answer is over ${MAX_WORDS} words.`) }, { status: 413 });
  const num = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(0, v)) : 0);
  const wpm = typeof body.wpm === 'number' && Number.isFinite(body.wpm) ? Math.min(400, Math.max(0, Math.round(body.wpm))) : null;

  const verdict = await consumeAiCall(admin, userId, request);
  if (!verdict.allowed) return Response.json({ error: verdict.message, code: 'quota_exceeded', used: verdict.used, limit: verdict.limit, plan: verdict.plan }, { status: 429 });

  try {
    const system = feedbackSystemPrompt();
    const user = feedbackUserPrompt({ part, question, transcript, wpm, fillers: Math.round(num(body.fillers, 200)), durationSec: num(body.durationSec, 300) });
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const started = Date.now();
      try {
        const result = await chatWithFallback({ purpose: 'writing', system, user, temperature: 0.3 });
        const feedback = validateFeedback(extractJson<unknown>(result.text), transcript, result.model);
        return Response.json({ feedback, usage: { used: verdict.used, limit: verdict.limit, plan: verdict.plan } });
      } catch (err) {
        lastError = err;
        // Chỉ thử lại khi model trả rác và còn dư thời gian; lỗi mạng/proxy đã được đi qua đủ các cửa.
        const garbage = !(err instanceof AiError) || err.code === 'bad_response';
        if (!garbage || Date.now() - started > 25_000) break;
      }
    }
    throw toAiError(lastError, 'Không phân tích được câu trả lời.');
  } catch (err) {
    await refundAiCall(admin, userId);
    console.warn('[hub/feedback] AI lỗi:', err instanceof Error ? err.message : err);
    return Response.json({ error: msg(request, 'AI đang bận, thử lại sau ít phút.', 'The AI is busy. Try again shortly.'), code: err instanceof AiError ? err.code : 'ai_error' }, { status: 503 });
  }
}
