import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/account/delete
 *
 * Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu học của nó.
 *
 * PHẢI CHẠY Ở SERVER vì xoá `auth.users` cần service role key, mà service key
 * nằm trong bundle client là mất sạch: ai cũng đọc được, và nó bỏ qua RLS nên
 * đọc/ghi được dữ liệu của MỌI người dùng.
 *
 * BA ĐIỂM BẢO MẬT của route này, theo thứ tự quan trọng:
 *
 * 1. KHÔNG TIN `userId` DO CLIENT GỬI LÊN. Danh tính lấy từ access token, xác
 *    minh với Supabase. Nhận userId từ body nghĩa là ai cũng xoá được tài khoản
 *    của người khác chỉ bằng cách đổi một chuỗi.
 * 2. Token đọc từ header `Authorization`, không đọc từ query string — query
 *    string đi vào log máy chủ và lịch sử trình duyệt.
 * 3. Xoá là KHÔNG HOÀN TÁC ĐƯỢC. Mọi bảng dữ liệu cá nhân đều
 *    `references auth.users on delete cascade`, nên xoá user là dọn sạch theo.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const header = request.headers.get('authorization') ?? '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';

    if (!token) {
      return Response.json({ error: 'Thiếu access token.' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Đây là bước xác minh: token hỏng, hết hạn hoặc bịa thì `getUser` trả lỗi.
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      return Response.json({ error: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 });
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ ok: true, deletedUserId: data.user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    // Thiếu SUPABASE_SERVICE_KEY rơi vào đây — nói rõ để người vận hành biết
    // đây là lỗi cấu hình chứ không phải lỗi của người dùng.
    return Response.json({ error: message }, { status: 500 });
  }
}
