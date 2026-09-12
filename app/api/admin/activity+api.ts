import { summarizeUserState, type UserStateRow } from '@/services/admin/activity';
import { requireAdmin } from '@/services/admin/guard';

/**
 * GET /api/admin/activity?userId=...
 *
 * Tóm tắt hoạt động học của MỘT tài khoản, cho trang quản trị.
 *
 * VÌ SAO GỌI RIÊNG TỪNG NGƯỜI, không gộp vào danh sách người dùng: payload học
 * của một người đã nặng hơn 150 KB (đo trên tài khoản thật), nên kéo cả trăm
 * người một lượt là hàng chục megabyte cho một bảng mà admin chỉ nhìn vài dòng.
 * Bấm vào ai thì đọc người đó.
 *
 * CHỈ TRẢ VỀ SỐ ĐẾM. Không có bài viết, không có ghi chú, không có từng câu trả
 * lời — xem `services/admin/activity.ts`. Quản trị cần biết tài khoản này có học
 * thật hay không, chứ không cần đọc bài của họ.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;

    const userId = (new URL(request.url).searchParams.get('userId') ?? '').trim();
    if (!UUID.test(userId)) {
      return Response.json({ error: 'Thiếu userId hợp lệ.' }, { status: 400 });
    }

    const { data, error } = await guard.admin
      .from('user_state')
      .select('store_key, payload, updated_at')
      .eq('user_id', userId);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ activity: summarizeUserState((data ?? []) as unknown as UserStateRow[]) });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Không đọc được hoạt động.' },
      { status: 500 },
    );
  }
}
