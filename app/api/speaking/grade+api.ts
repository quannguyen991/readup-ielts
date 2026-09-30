import { AiError } from '@/services/ai/errors';
import { gradeSpeaking } from '@/services/ai/speaking-evaluator';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { getSpeakingQuestion } from '@/services/speaking/bank';
import { answerMetrics, attemptMetrics, type AnswerMetrics, type RecognizedSegment } from '@/services/speaking/metrics';
import type { GradeAnswerInput } from '@/services/speaking/prompt';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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
 *   - Câu hỏi lấy từ ngân hàng theo `questionId`, không lấy chữ client gửi.
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

export async function POST(request: Request): Promise<Response> {
  const admin = getSupabaseAdmin();
  let userId = '';

  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json(
        { error: 'Đăng nhập để chấm bài nói bằng AI. Chỉ số đo tại máy vẫn xem được khi chưa đăng nhập.' },
        { status: 401 },
      );
    }
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 });
    }
    userId = auth.user.id;

    const body = (await request.json()) as { typed?: unknown; answers?: unknown };
    const typed = body.typed === true;
    const rawAnswers = Array.isArray(body.answers) ? (body.answers as RawAnswer[]) : [];
    if (rawAnswers.length === 0) {
      return Response.json({ error: 'Chưa có câu trả lời nào.' }, { status: 400 });
    }
    if (rawAnswers.length > MAX_ANSWERS) {
      return Response.json({ error: `Tối đa ${MAX_ANSWERS} câu mỗi lượt.` }, { status: 413 });
    }

    const answers: Array<GradeAnswerInput & { metrics: AnswerMetrics }> = [];
    for (const a of rawAnswers) {
      const q = getSpeakingQuestion(typeof a.questionId === 'string' ? a.questionId : '');
      if (!q) return Response.json({ error: 'Có câu hỏi không có trong ngân hàng đề.' }, { status: 400 });
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
        part: q.part,
        question: q.part === 2 ? `${q.text} (${(q.bullets ?? []).join('; ')}; ${q.explain ?? ''})` : q.text,
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
      return Response.json({ error: 'Bài chưa có chữ nào để chấm.' }, { status: 400 });
    }
    if (metrics.words > MAX_TOTAL_WORDS) {
      return Response.json({ error: `Bài dài ${metrics.words} từ, vượt giới hạn ${MAX_TOTAL_WORDS} từ.` }, { status: 413 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: 'Chưa cấu hình OPENAI_API_KEY nên không chấm bằng AI được. Chỉ số đo tại máy vẫn dùng bình thường.',
          code: 'missing_config',
        },
        { status: 503 },
      );
    }

    // Trừ hạn mức TRƯỚC khi gọi AI (xem ghi chú ở `usage.ts`).
    const verdict = await consumeAiCall(admin, userId);
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
      return Response.json({ error: err.message, code: err.code }, { status: 502 });
    }
    return Response.json({ error: 'Lỗi không xác định khi chấm bài nói.' }, { status: 500 });
  }
}
