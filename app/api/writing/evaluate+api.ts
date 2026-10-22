// Bộ nhớ tạm lưu các lượt dùng thử chấm bài dành cho khách (1 lần / khách)
const guestWritingTrials = new Map<string, number>();

import { getWritingPromptById } from '@/data/writing-repository';
import { countWords } from '@/lib/writing/word-count';
import { AiError } from '@/services/ai/errors';
import { evaluateWriting } from '@/services/ai/writing-evaluator';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/writing/evaluate  { promptId, bodyText }
 *
 * Chạy server-side để khoá không xuống client.
 *
 * Client gọi route này sau khi nộp bài; nếu hỏng (chưa cấu hình khoá, mạng lỗi,
 * model trả rác) thì màn kết quả vẫn hiển thị được nhờ bộ phân tích offline
 * chạy ngay trên máy — cùng khuôn với `app/api/questions+api.ts`.
 *
 * CẦN ĐĂNG NHẬP VÀ TRỪ HẠN MỨC Ở MÁY CHỦ. Bản đầu của route này không kiểm gì
 * cả: ai biết địa chỉ cũng gọi được, không cần tài khoản, không giới hạn — và
 * mỗi lượt chấm là một lời gọi AI tốn tiền thật. Bộ đếm trong `useBillingStore`
 * nằm ở trình duyệt của chính người dùng nên nó không chặn được ai.
 *
 * Bài viết vẫn được chấm bằng bộ phân tích offline khi hết hạn mức, nên người
 * dùng không bị bỏ trắng — họ chỉ mất phần nhận xét của AI.
 */

/** Chặn bài quá dài: 3000 từ là gấp mười lần một bài Task 2 hợp lệ. */
const MAX_WORDS = 3000;

export async function POST(request: Request): Promise<Response> {
  const admin = getSupabaseAdmin();
  let userId = '';

  try {
    let isGuestTrial = false;
    let guestKey = '';
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      const guestTrialId = (request.headers.get('x-guest-trial-id') ?? '').trim();
      const clientIp = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
      guestKey = guestTrialId || clientIp || 'guest_device';
      if (guestWritingTrials.has(guestKey)) {
        return Response.json(
          {
            error: msg(
              request,
              'Bạn đã dùng hết 1 lượt chấm thử Writing AI miễn phí. Hãy đăng ký tài khoản (tặng 7 ngày Plus) để tiếp tục chấm bài và lưu tiến độ!',
              'You have used your 1 free AI writing evaluation trial. Please sign in or create an account to continue.',
            ),
            code: 'guest_trial_used',
          },
          { status: 401 },
        );
      }
      isGuestTrial = true;
    } else {
      const { data: auth, error: authError } = await admin.auth.getUser(token);
      if (authError || !auth.user) {
        return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
      }
      userId = auth.user.id;
    }

    const body = (await request.json()) as { promptId?: string; bodyText?: string };

    if (!body.promptId) {
      return Response.json({ error: msg(request, 'Thiếu promptId.', 'promptId is required.') }, { status: 400 });
    }
    const text = (body.bodyText ?? '').trim();
    if (text === '') {
      return Response.json({ error: msg(request, 'Bài viết đang trống.', 'Your essay is empty.') }, { status: 400 });
    }

    const words = countWords(text);
    if (words > MAX_WORDS) {
      return Response.json(
        { error: msg(request, `Bài dài ${words} từ, vượt giới hạn ${MAX_WORDS} từ.`, `Your essay is ${words} words, over the ${MAX_WORDS}-word limit.`) },
        { status: 413 },
      );
    }

    const prompt = getWritingPromptById(body.promptId);
    if (!prompt) {
      return Response.json({ error: msg(request, 'Không tìm thấy đề.', 'Prompt not found.') }, { status: 404 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: msg(
            request,
            'Chưa cấu hình OPENAI_API_KEY nên không chấm bằng AI được. Phần phân tích nhanh vẫn dùng bình thường.',
            "OPENAI_API_KEY isn't configured, so AI grading is unavailable. Quick analysis still works as usual.",
          ),
          code: 'missing_config',
        },
        { status: 503 },
      );
    }

    let verdict: { used: number; limit: number | null; plan: string } = { used: 0, limit: 1, plan: 'guest' };
    if (!isGuestTrial) {
      const v = await consumeAiCall(admin, userId, request);
      if (!v.allowed) {
        return Response.json(
          {
            error: v.message,
            code: 'quota_exceeded',
            used: v.used,
            limit: v.limit,
            plan: v.plan,
          },
          { status: 429 },
        );
      }
      verdict = v;
    }

    try {
      const result = await evaluateWriting({ prompt, bodyText: text });
      if (isGuestTrial && guestKey) {
        guestWritingTrials.set(guestKey, Date.now());
      }
      return Response.json({
        ...result,
        isGuestTrial,
        usage: { used: verdict.used, limit: verdict.limit, plan: verdict.plan },
      });
    } catch (aiError) {
      if (!isGuestTrial) {
        await refundAiCall(admin, userId);
      }
      throw aiError;
    }
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: errorText(request, err, err.message, "Couldn't grade your essay. Please try again in a few minutes."), code: err.code }, { status: 502 });
    }
    return Response.json({ error: msg(request, 'Lỗi không xác định khi chấm bài.', 'Unknown error while grading your essay.') }, { status: 500 });
  }
}
