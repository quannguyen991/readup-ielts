import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { msg } from '@/lib/server-locale';

/**
 * Cổng vào của mọi route quản trị.
 *
 * TÁCH RIÊNG VÌ NÓ PHẢI GIỐNG HỆT NHAU Ở MỌI ROUTE. Chép đoạn kiểm quyền vào
 * từng file là cách chắc chắn nhất để một hôm nào đó một route mới quên mất vế
 * `role === 'admin'` — và một route admin thiếu kiểm quyền thì mọi route còn
 * lại có kiểm cũng vô nghĩa.
 *
 * BA ĐIỂM, theo thứ tự quan trọng:
 *
 * 1. DANH TÍNH LẤY TỪ ACCESS TOKEN, không lấy từ body. Nhận `userId` từ body
 *    nghĩa là ai cũng thành admin bằng cách đổi một chuỗi.
 * 2. VAI TRÒ ĐỌC TỪ DATABASE bằng service key, không đọc từ token. JWT của
 *    Supabase không mang `role` của bảng `profiles`, và kể cả có thì token do
 *    client giữ — phải hỏi lại nguồn sự thật.
 * 3. Token đọc từ header `Authorization`, không đọc từ query string. Query
 *    string đi vào log máy chủ, lịch sử trình duyệt và header `Referer`.
 */
export type AdminContext = { userId: string; email: string | null };

export type GuardResult =
  | { ok: true; admin: ReturnType<typeof getSupabaseAdmin>; actor: AdminContext }
  | { ok: false; response: Response };

export async function requireAdmin(request: Request): Promise<GuardResult> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    return { ok: false, response: Response.json({ error: msg(request, 'Thiếu access token.', 'Missing access token.') }, { status: 401 }) };
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return {
      ok: false,
      response: Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      response: Response.json({ error: profileError.message }, { status: 500 }),
    };
  }

  if (!profile || (profile as { role?: string }).role !== 'admin') {
    // 403 chứ không phải 404: người này đăng nhập hợp lệ, chỉ là không đủ quyền.
    // Giả vờ route không tồn tại chỉ làm khó việc chẩn đoán, không giấu được gì
    // — địa chỉ route đã nằm sẵn trong bundle client rồi.
    return {
      ok: false,
      response: Response.json({ error: msg(request, 'Tài khoản này không có quyền quản trị.', 'This account does not have admin access.') }, { status: 403 }),
    };
  }

  return { ok: true, admin, actor: { userId: data.user.id, email: data.user.email ?? null } };
}
