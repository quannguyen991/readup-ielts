import { AiError } from '@/services/ai/errors';
import { gradeSpeaking } from '@/services/ai/speaking-evaluator';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { getSpeakingQuestion } from '@/services/speaking/bank';
import { answerMetrics, attemptMetrics, type AnswerMetrics, type RecognizedSegment } from '@/services/speaking/metrics';
import type { GradeAnswerInput } from '@/services/speaking/prompt';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { errorText, msg } from '@/lib/server-locale';
import { getPoiContent } from '@/data/travel/pois';
import { replyPool } from '@/services/travel/content';
import { contextualJourneyFor, resolveContextualSpeakingPrompt } from '@/services/travel/contextual-speaking';
import { CITIES } from '@/services/travel/world';

/**
 * POST /api/speaking/grade
 *   { typed: boolean, answers: [{ questionId, transcript, segments, metrics }] }
 *
 * Cùng khuôn với `/api/writing/evaluate`: CẦN ĐĂNG NHẬP, TRỪ HẠN MỨC AI Ở MÁY
 * CHỦ trước khi gọi, hoàn lượt khi lỗi thuộc về ta. Hạn mức đọc theo gói ở
 * máy chủ (`consumeAiCall`), nên người đang dùng thử KHÔNG được thêm lượt AI.
 *
 * Một lượt thi = MỘT lượt AI, dù là cả bài Full test.
 *
 * Không tin client:
 *   - Câu IELTS lấy từ ngân hàng; câu du lịch được dựng lại từ nội dung địa điểm
 *     trên máy chủ. Không nhận lời nhắc câu hỏi tuỳ ý từ client.
 *   - Số từ, từ đệm, độ rõ tính lại ở đây từ bản chữ; chỉ số THỜI GIAN (tốc độ
 *     nói, khoảng lặng) chỉ client đo được nên nhận nhưng kẹp vào khoảng hợp lý.
 *
 * Hết lượt hoặc AI hỏng thì màn kết quả vẫn có đủ chỉ số đo tại máy.
 */

const MAX_ANSWERS = 16;
const MAX_CHARS = 3_000;
const MAX_TOTAL_WORDS = 3_500;
const MAX_SEGMENTS = 200;

const num = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null;

type RawAnswer = { questionId?: unknown; transcript?: unknown; segments?: unknown; metrics?: unknown };

function resolvePrompt(questionId: string): { part: 1 | 2 | 3; question: string; context?: 'travel' } | null {
  const bankQuestion = getSpeakingQuestion(questionId);
  if (bankQuestion) {
    return {
      part: bankQuestion.part,
      question: bankQuestion.part === 2
        ? `${bankQuestion.text} (${(bankQuestion.bullets ?? []).join('; ')}; ${bankQuestion.explain ?? ''})`
        : bankQuestion.text,
    };
  }

  if (questionId.startsWith('context:')) {
    const key = questionId.slice('context:'.length);
    const divider = key.indexOf(':');
    if (divider <= 0 || divider === key.length - 1) return null;
    const poi = getPoiContent(key.slice(0, divider));
    if (!poi) return null;
    const prompt = resolveContextualSpeakingPrompt(poi.kind, key.slice(divider + 1));
    const journey = contextualJourneyFor(poi.kind);
    if (!prompt || !journey) return null;
    const body = prompt.part === 2
      ? `${prompt.text} You should say: ${(prompt.bullets ?? []).join('; ')}; ${prompt.explain ?? ''}`
      : prompt.text;
    return { part: prompt.part, question: `[Context: ${poi.name.en}, ${CITIES[poi.city].name.en}, ${CITIES[poi.city].country.en}; speaking with a ${journey.role}. Topic: ${journey.topic}] ${body}` };
  }

  if (questionId.startsWith('context:')) {
    const key = questionId.slice('context:'.length);
    const divider = key.indexOf(':');
    if (divider <= 0 || divider === key.length - 1) return null;
    const poi = getPoiContent(key.slice(0, divider));
    if (!poi) return null;
    const prompt = resolveContextualSpeakingPrompt(poi.kind, key.slice(divider + 1));
    if (!prompt) return null;
    const details = prompt.part === 2 ? ` (${[...(prompt.bullets ?? []), prompt.explain].filter(Boolean).join('; ')})` : '';
    return { part: prompt.part, question: `[IELTS ${prompt.topic}] ${prompt.text}${details}` };
  }

  if (!questionId.startsWith('travel:')) return null;
  const key = questionId.slice('travel:'.length);
  const divider = key.indexOf(':');
  if (divider <= 0 || divider === key.length - 1) return null;
  const poi = getPoiContent(key.slice(0, divider));
  if (!poi) return null;
  const itemId = key.slice(divider + 1);
  const item = replyPool(poi.content.decks, poi.kind).find((reply) => reply.id === itemId && reply.line.trim());
  if (!item) return null;

  return {
    part: 1,
    context: 'travel',
    question: `[TRAVEL ROLE-PLAY] ${item.setup.trim().slice(0, 250)} Staff member says: “${item.line.trim().slice(0, 250)}”`,
  };
}

export async function POST(request: Request): Promise<Response> {
  const admin = getSupabaseAdmin();
  let userId = '';

  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json(
        {
          error: msg(
            request,
            'Đăng nhập để chấm bài nói bằng AI. Chỉ số đo tại máy vẫn xem được khi chưa đăng nhập.',
            'Sign in to get AI grading for your speaking. On-device metrics still work without signing in.',
          ),
        },
        { status: 401 },
      );
    }
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }
    userId = auth.user.id;

    const body = (await request.json()) as { typed?: unknown; answers?: unknown };
    const typed = body.typed === true;
    const rawAnswers = Array.isArray(body.answers) ? (body.answers as RawAnswer[]) : [];
    if (rawAnswers.length === 0) {
      return Response.json({ error: msg(request, 'Chưa có câu trả lời nào.', 'No answers yet.') }, { status: 400 });
    }
    if (rawAnswers.length > MAX_ANSWERS) {
      return Response.json({ error: msg(request, `Tối đa ${MAX_ANSWERS} câu mỗi lượt.`, `Up to ${MAX_ANSWERS} answers per attempt.`) }, { status: 413 });
    }

    const answers: (GradeAnswerInput & { metrics: AnswerMetrics })[] = [];
    for (const a of rawAnswers) {
      const prompt = resolvePrompt(typeof a.questionId === 'string' ? a.questionId : '');
      if (!prompt) return Response.json({ error: msg(request, 'Không tìm thấy câu hỏi hoặc bối cảnh hội thoại hợp lệ.', 'The question or conversation situation could not be found.') }, { status: 400 });
      const transcript = (typeof a.transcript === 'string' ? a.transcript : '').trim().slice(0, MAX_CHARS);
      const segments: RecognizedSegment[] = (Array.isArray(a.segments) ? a.segments : [])
        .slice(0, MAX_SEGMENTS)
        .map((s) => {
          const o = (s ?? {}) as { text?: unknown; confidence?: unknown };
          return { text: typeof o.text === 'string' ? o.text.slice(0, MAX_CHARS) : '', confidence: num(o.confidence, 0, 1) };
        })
        .filter((s) => s.text.trim());
      const m = (a.metrics ?? {}) as Record<string, unknown>;
      const durationSec = num(m.durationSec, 0, 300) ?? 0;
      // Chữ tính lại ở đây; không truyền mốc thời gian nên phần thời gian lấy từ client.
      const base = answerMetrics({ transcript, segments, durationMs: durationSec * 1000, eventTimes: [] });
      const metrics: AnswerMetrics = {
        ...base,
        speakingSec: typed ? null : num(m.speakingSec, 0, 300),
        wpm: typed ? null : num(m.wpm, 0, 400),
        longPauses: typed ? 0 : Math.round(num(m.longPauses, 0, 100) ?? 0),
        longestPauseSec: typed ? 0 : num(m.longestPauseSec, 0, 300) ?? 0,
        startDelaySec: typed ? null : num(m.startDelaySec, 0, 300),
      };
      answers.push({
        part: prompt.part,
        question: prompt.question,
        context: prompt.context,
        transcript,
        segments,
        durationSec,
        wpm: metrics.wpm,
        fillers: metrics.fillers,
        longPauses: metrics.longPauses,
        metrics,
      });
    }

    const metrics = attemptMetrics(answers.map((a) => ({ part: a.part, transcript: a.transcript, metrics: a.metrics })));
    if (metrics.words === 0) {
      return Response.json({ error: msg(request, 'Bài chưa có chữ nào để chấm.', 'There are no words to grade yet.') }, { status: 400 });
    }
    if (metrics.words > MAX_TOTAL_WORDS) {
      return Response.json({
          error: msg(
            request,
            `Bài dài ${metrics.words} từ, vượt giới hạn ${MAX_TOTAL_WORDS} từ.`,
            `Your answer is ${metrics.words} words, over the ${MAX_TOTAL_WORDS}-word limit.`,
          ),
        }, { status: 413 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: msg(
            request,
            'Chưa cấu hình OPENAI_API_KEY nên không chấm bằng AI được. Chỉ số đo tại máy vẫn dùng bình thường.',
            "OPENAI_API_KEY isn't configured, so AI grading is unavailable. On-device metrics still work as usual.",
          ),
          code: 'missing_config',
        },
        { status: 503 },
      );
    }

    // Trừ hạn mức TRƯỚC khi gọi AI (xem ghi chú ở `usage.ts`).
    const verdict = await consumeAiCall(admin, userId, request);
    if (!verdict.allowed) {
      return Response.json(
        { error: verdict.message, code: 'quota_exceeded', used: verdict.used, limit: verdict.limit, plan: verdict.plan },
        { status: 429 },
      );
    }

    try {
      const grade = await gradeSpeaking({ typed, answers, metrics });
      return Response.json({ grade, usage: { used: verdict.used, limit: verdict.limit, plan: verdict.plan } });
    } catch (aiError) {
      await refundAiCall(admin, userId);
      throw aiError;
    }
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: errorText(request, err, err.message, "Couldn't grade your speaking. Please try again in a few minutes."), code: err.code }, { status: 502 });
    }
    return Response.json({ error: msg(request, 'Lỗi không xác định khi chấm bài nói.', 'Unknown error while grading your speaking.') }, { status: 500 });
  }
}
