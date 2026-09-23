import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { signUser } from '@/services/report/link-server';

/**
 * POST /api/report/link — học sinh tạo đường dẫn báo cáo tuần cho phụ huynh.
 *
 * Danh tính lấy từ access token (header Authorization), KHÔNG lấy từ body: ai
 * cũng chỉ tạo được đường dẫn cho chính mình.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) return Response.json({ error: 'Cần đăng nhập.' }, { status: 401 });
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) return Response.json({ error: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 });
    const signed = signUser(data.user.id);
    return Response.json({ token: signed, path: `/report/${signed}` });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Không tạo được đường dẫn.' }, { status: 500 });
  }
}
