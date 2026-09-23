import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { displayableName } from '@/services/gamification/display-name';
import { buildParentReport, type ReportInput } from '@/services/report/parent-report';
import { verifyToken } from '@/services/report/link-server';
import { weekId } from '@/services/weekly/challenge';

/**
 * GET /api/report?t=<userId>.<chữ ký> — báo cáo tuần cho phụ huynh, chỉ đọc.
 *
 * Đường dẫn sai chữ ký thì trả 404 như không tồn tại. Chỉ đọc năm khoá dữ liệu
 * học cần cho báo cáo, và chỉ trả SỐ ĐẾM (`services/report/parent-report.ts`).
 */
const KEYS = ['study', 'math', 'vocab', 'satrw', 'weekly'] as const;

export async function GET(request: Request): Promise<Response> {
  try {
    const t = new URL(request.url).searchParams.get('t') ?? '';
    const userId = verifyToken(t);
    if (!userId) return Response.json({ error: 'Không tìm thấy báo cáo.' }, { status: 404 });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('user_state')
      .select('store_key, payload')
      .eq('user_id', userId)
      .in('store_key', KEYS as unknown as string[]);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const input: Record<string, unknown> = {};
    for (const row of (data ?? []) as { store_key: string; payload: unknown }[]) input[row.store_key] = row.payload;

    const { data: profile } = await admin.from('profiles').select('display_name').eq('id', userId).maybeSingle();
    const name = displayableName((profile as { display_name: string | null } | null)?.display_name ?? null);

    const now = Date.now();
    return Response.json({
      name,
      generatedAt: new Date(now).toISOString(),
      hasData: (data ?? []).length > 0,
      report: buildParentReport(input as ReportInput, now, weekId(now)),
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Không đọc được báo cáo.' }, { status: 500 });
  }
}
