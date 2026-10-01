import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { signUser } from '@/services/report/link-server';
import { errorText, msg } from '@/lib/server-locale';

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
    if (!token) return Response.json({ error: msg(request, 'Cần đăng nhập.', 'Please sign in.') }, { status: 401 });
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) return Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 });
    const signed = signUser(data.user.id);
    return Response.json({ token: signed, path: `/report/${signed}` });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không tạo được đường dẫn.', 'Could not create the link.') }, { status: 500 });
  }
}
