import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';
import { HSA_KIND_LABEL, HSA_KIND_ORDER, HSA_TOPICS } from '@/data/hsa';
import { chatWithFallback, extractJson } from '@/services/ai/fallback';
import { consumeAiCall, refundAiCall } from '@/services/ai/usage';
import { CRITERIA } from '@/services/hsa/criteria';
import { PAPER_COUNT, parseAiPlan, readContext } from '@/services/hsa/plan';

/**
 * POST /api/hsa/plan  { context }  → { plan, model }
 *
 * AI lên kế hoạch học HSA cho MỘT NGÀY từ số liệu của người học (điểm theo tiêu chí, dạng câu yếu, số
 * ngày còn lại tới ngày thi, thời gian mỗi ngày). Không gửi tên hay thông tin cá nhân. Kết quả đi qua
 * `parseAiPlan`: AI chỉ chọn trong danh mục dạng câu và chủ điểm có thật, đường dẫn do code dựng.
 */
const SYSTEM = `Bạn là huấn luyện viên lập kế hoạch học phần Tiếng Anh của kỳ thi HSA (ĐHQGHN) cho học sinh Việt Nam.
Nhiệm vụ: đọc số liệu của một người học và lập kế hoạch cho ĐÚNG MỘT NGÀY.

Danh mục bài được phép dùng (type):
- "kind": luyện một dạng câu, kèm "kind" lấy trong: ${HSA_KIND_ORDER.map((k) => `${k} (${HSA_KIND_LABEL[k].vi})`).join('; ')}
- "topic": ôn một chủ điểm, kèm "topicId" lấy trong: ${HSA_TOPICS.map((t) => t.id).join(', ')}
- "mock": làm một đề mô phỏng 50 câu, 60 phút, kèm "paper" từ 1 đến ${PAPER_COUNT}
- "challenge": 10 câu suy luận khó
- "review": chữa lại các câu đã sai (chỉ dùng khi wrongCount >= 3)
- "vocab": ôn từ vựng

Quy tắc bắt buộc:
- Tổng số phút xấp xỉ minutesPerDay. Tối đa 4 bài học cộng một bài vocab 10 phút ở cuối.
- Ưu tiên dạng câu trong weakKinds (yếu nhất trước) và kỹ năng "focus" nếu khác "all". Tránh dạng trong recentKinds nếu còn dạng khác.
- Nếu daysToExam là số từ 0 đến 21 thì có một bài "mock" (paper = mocksDone + 1). Nếu còn xa thì ưu tiên nền tảng, không xếp mock.
- Không hứa điểm số. Không bịa số liệu không có trong dữ liệu.
- "why" là một câu tiếng Việt ngắn (tối đa 140 ký tự) nói vì sao hôm nay làm bài này; "whyEn" là bản tiếng Anh của câu đó.

Trả về DUY NHẤT một JSON, không kèm chữ nào khác, đúng dạng:
{"tasks": [{"type": "kind", "kind": "cloze", "minutes": 20, "why": "...", "whyEn": "..."}]}`;

export async function POST(request: Request): Promise<Response> {
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return Response.json({ error: msg(request, 'Đăng nhập để AI lập kế hoạch cho hôm nay.', 'Sign in to let the AI plan your day.') }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) {
      return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { context?: unknown };
    const context = readContext(body.context);
    if (!context) {
      return Response.json({ error: msg(request, 'Số liệu học không hợp lệ.', 'Invalid study data.') }, { status: 400 });
    }

    const verdict = await consumeAiCall(admin, auth.user.id, request);
    if (!verdict.allowed) {
      return Response.json({ error: verdict.message, code: 'quota_exceeded', used: verdict.used, limit: verdict.limit, plan: verdict.plan }, { status: 429 });
    }

    try {
      const out = await chatWithFallback({
        purpose: 'chat',
        system: SYSTEM,
        user: `Số liệu của người học (JSON):\n${JSON.stringify({ ...context, criteria: context.criteria.map((c) => ({ ...c, name: CRITERIA.find((x) => x.id === c.id)?.title.vi })) })}`,
        temperature: 0.4,
      });
      const plan = parseAiPlan(extractJson<unknown>(out.text), context, out.model);
      if (!plan) {
        await refundAiCall(admin, auth.user.id);
        return Response.json({ error: msg(request, 'AI trả về chưa đúng định dạng, thử lại.', 'The AI returned an unexpected format. Try again.') }, { status: 502 });
      }
      return Response.json({ plan, model: out.model });
    } catch {
      await refundAiCall(admin, auth.user.id);
      return Response.json({ error: msg(request, 'AI đang bận, thử lại sau ít phút.', 'The AI is busy. Try again shortly.') }, { status: 503 });
    }
  } catch {
    return Response.json({ error: msg(request, 'Có lỗi, thử lại sau.', 'Something went wrong. Try again.') }, { status: 500 });
  }
}
