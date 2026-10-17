import { parseAiPlan, type AiPlanAnalysis } from './analysis';

export type AnalyzeOutcome =
  | { ok: true; analysis: AiPlanAnalysis; budget: number }
  | { ok: false; reason: 'signed_out' | 'quota' | 'busy' | 'failed'; message: string };

/** Gửi hồ sơ lịch học lên AI và đọc kết quả đã qua kiểm tra. */
export async function analyzePlan(profile: unknown, token: string | null): Promise<AnalyzeOutcome> {
  if (!token) return { ok: false, reason: 'signed_out', message: 'Đăng nhập để AI phân tích lịch học.' };

  let res: Response;
  try {
    res = await fetch('/api/plan/analyze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });
  } catch {
    return { ok: false, reason: 'failed', message: 'Mất kết nối. Thử lại khi có mạng.' };
  }

  const data = (await res.json().catch(() => ({}))) as { analysis?: unknown; budget?: unknown; error?: string };
  if (res.status === 401) return { ok: false, reason: 'signed_out', message: data.error ?? 'Đăng nhập lại để tiếp tục.' };
  if (res.status === 429) return { ok: false, reason: 'quota', message: data.error ?? 'Đã hết lượt AI của tháng này.' };
  if (res.status === 503) return { ok: false, reason: 'busy', message: data.error ?? 'AI đang bận, thử lại sau ít phút.' };
  if (!res.ok) return { ok: false, reason: 'failed', message: data.error ?? 'Chưa phân tích được, thử lại.' };

  const analysis = parseAiPlan(data.analysis);
  if (!analysis) return { ok: false, reason: 'failed', message: 'Kết quả AI chưa đúng định dạng, thử lại.' };
  const budget = typeof data.budget === 'number' ? data.budget : 0;
  return { ok: true, analysis, budget };
}
