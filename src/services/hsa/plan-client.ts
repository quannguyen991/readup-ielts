import type { DayPlan, PlanContext } from './plan';

export type AiPlanOutcome =
  | { ok: true; plan: DayPlan }
  | { ok: false; reason: 'signed_out' | 'quota' | 'busy' | 'failed'; message: string };

/** Gửi số liệu học lên AI và nhận kế hoạch một ngày; chỉ nhận kế hoạch mà mọi đường dẫn đều nằm trong /hsa/. */
export async function fetchAiPlan(context: PlanContext, token: string | null): Promise<AiPlanOutcome> {
  if (!token) return { ok: false, reason: 'signed_out', message: 'Đăng nhập để AI lập kế hoạch theo điểm yếu của bạn.' };

  let res: Response;
  try {
    res = await fetch('/api/hsa/plan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });
  } catch {
    return { ok: false, reason: 'failed', message: 'Mất kết nối. Thử lại khi có mạng.' };
  }

  const data = (await res.json().catch(() => ({}))) as { plan?: DayPlan; error?: string };
  if (res.status === 401) return { ok: false, reason: 'signed_out', message: data.error ?? 'Đăng nhập lại để tiếp tục.' };
  if (res.status === 429) return { ok: false, reason: 'quota', message: data.error ?? 'Đã hết lượt AI của tháng này.' };
  if (res.status === 503) return { ok: false, reason: 'busy', message: data.error ?? 'AI đang bận, thử lại sau ít phút.' };
  if (!res.ok) return { ok: false, reason: 'failed', message: data.error ?? 'Chưa lập được kế hoạch, thử lại.' };

  const plan = data.plan;
  const safe =
    !!plan &&
    plan.source === 'ai' &&
    plan.day === context.day &&
    Array.isArray(plan.tasks) &&
    plan.tasks.length > 0 &&
    plan.tasks.every((t) => typeof t.href === 'string' && t.href.startsWith('/hsa/') && typeof t.minutes === 'number');
  if (!safe) return { ok: false, reason: 'failed', message: 'Kết quả AI chưa đúng định dạng, thử lại.' };
  return { ok: true, plan };
}
