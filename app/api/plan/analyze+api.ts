import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { chatWithFallback, extractJson } from '@/services/ai/fallback';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { ALLOWED_SKILLS, parseAiPlan, weeklyBudget } from '@/services/roadmap/analysis';

/**
 * POST /api/plan/analyze  { profile }  → { analysis, model }
 *
 * AI phân tích lịch học của người học và đề xuất cách phân bổ thời gian theo kỹ năng.
 * Hồ sơ chỉ gồm số liệu lộ trình (mục tiêu, ngày còn lại, phút mỗi ngày, kỹ năng yếu) —
 * không có tên hay thông tin cá nhân. Kết quả qua `parseAiPlan` trước khi trả về, nên
 * client chỉ nhận dữ liệu đúng dạng.
 */

type Profile = {
  goals: Array<{ goal: 'ielts' | 'sat'; now: number | null; target: number; daysLeft: number }>;
  minutesPerDay: number;
  studyDaysPerWeek: number;
  weakSkills: string[];
  totalWeeks: number;
  currentWeek: number;
  minutesBySkill: Record<string, number>;
};

function readProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const num = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
  const minutesPerDay = num(p.minutesPerDay, 10, 600);
  const studyDaysPerWeek = num(p.studyDaysPerWeek, 1, 7);
  const totalWeeks = num(p.totalWeeks, 1, 200);
  const currentWeek = num(p.currentWeek, 1, 200);
  if (minutesPerDay === null || studyDaysPerWeek === null || totalWeeks === null || currentWeek === null) return null;
  if (!Array.isArray(p.goals) || p.goals.length === 0 || p.goals.length > 2) return null;

  const goals: Profile['goals'] = [];
  for (const g of p.goals) {
    if (!g || typeof g !== 'object') return null;
    const r = g as Record<string, unknown>;
    if (r.goal !== 'ielts' && r.goal !== 'sat') return null;
    const target = num(r.target, 0, 1600);
    const daysLeft = num(r.daysLeft, 0, 3650);
    const now = r.now === null ? null : num(r.now, 0, 1600);
    if (target === null || daysLeft === null || now === undefined) return null;
    goals.push({ goal: r.goal, now, target, daysLeft });
  }

  const weakSkills = Array.isArray(p.weakSkills)
    ? p.weakSkills.filter((s): s is string => typeof s === 'string' && (ALLOWED_SKILLS as string[]).includes(s)).slice(0, 6)
    : [];

  const minutesBySkill: Record<string, number> = {};
  if (p.minutesBySkill && typeof p.minutesBySkill === 'object') {
    for (const [k, v] of Object.entries(p.minutesBySkill as Record<string, unknown>)) {
      if ((ALLOWED_SKILLS as string[]).includes(k) && typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        minutesBySkill[k] = Math.min(100_000, Math.round(v));
      }
    }
  }

  return { goals, minutesPerDay, studyDaysPerWeek, weakSkills, totalWeeks, currentWeek, minutesBySkill };
}

const SYSTEM = `Bạn là huấn luyện viên lập kế hoạch học IELTS và SAT cho học sinh Việt Nam.
Nhiệm vụ: đọc hồ sơ học (mục tiêu, số ngày còn lại, số phút mỗi ngày, số ngày học mỗi tuần,
kỹ năng yếu, phân bổ hiện tại) và đề xuất cách chia thời gian theo kỹ năng cho MỘT TUẦN.

Quy tắc bắt buộc:
- Chỉ dùng các kỹ năng: ${ALLOWED_SKILLS.join(', ')}.
- Tổng phút mỗi tuần phải xấp xỉ ngân sách = phút mỗi ngày × số ngày học mỗi tuần.
- Kỹ năng yếu được nhiều thời gian hơn, nhưng không bỏ hẳn kỹ năng khác.
- Gần ngày thi thì ưu tiên luyện đề; còn xa thì ưu tiên nền và dạng bài.
- Không hứa điểm số. Không bịa số liệu không có trong hồ sơ.
- Viết tiếng Việt, ngắn gọn.

Trả về DUY NHẤT một JSON, không kèm chữ nào khác, đúng dạng:
{"summary": "...", "risks": ["..."], "allocation": [{"skill": "reading", "minutesPerWeek": 120, "reason": "..."}], "tips": ["..."], "priority": ["writing"]}`;

export async function POST(request: Request): Promise<Response> {
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json({ error: msg(request, 'Đăng nhập để AI phân tích lịch học.', 'Sign in for the AI plan analysis.') }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { profile?: unknown };
    const profile = readProfile(body.profile);
    if (!profile) {
      return Response.json({ error: msg(request, 'Hồ sơ lịch học không hợp lệ.', 'Invalid study profile.') }, { status: 400 });
    }

    const verdict = await consumeAiCall(admin, auth.user.id, request);
    if (!verdict.allowed) {
      return Response.json({ error: verdict.message, code: 'quota_exceeded', used: verdict.used, limit: verdict.limit, plan: verdict.plan }, { status: 429 });
    }

    const budget = weeklyBudget(profile.minutesPerDay, profile.studyDaysPerWeek);
    try {
      const out = await chatWithFallback({
        purpose: 'chat',
        system: SYSTEM,
        user: `Ngân sách một tuần: ${budget} phút.\nHồ sơ (JSON):\n${JSON.stringify(profile)}`,
        temperature: 0.3,
      });
      const analysis = parseAiPlan(extractJson<unknown>(out.text));
      if (!analysis) {
        await refundAiCall(admin, auth.user.id);
        return Response.json({ error: msg(request, 'AI trả về chưa đúng định dạng, thử lại.', 'The AI returned an unexpected format. Try again.') }, { status: 502 });
      }
      return Response.json({ analysis, model: out.model, budget });
    } catch {
      await refundAiCall(admin, auth.user.id);
      return Response.json({ error: msg(request, 'AI đang bận, thử lại sau ít phút.', 'The AI is busy. Try again shortly.') }, { status: 503 });
    }
  } catch {
    return Response.json({ error: msg(request, 'Có lỗi, thử lại sau.', 'Something went wrong. Try again.') }, { status: 500 });
  }
}
