import { requireAdmin } from '@/services/admin/guard';
import { errorText } from '@/lib/server-locale';

/**
 * GET /api/admin/users?q=<tìm theo email>&limit=<số>
 *
 * Danh sách người dùng kèm gói, cho trang quản trị.
 *
 * PHẢI CHẠY Ở SERVER: đọc email của người khác cần service key, mà service key
 * lọt vào bundle client là mất sạch — nó bỏ qua RLS.
 *
 * Ghép từ HAI NGUỒN vì không nguồn nào đủ một mình: `auth.users` giữ email và
 * lần đăng nhập cuối nhưng không biết gói; `profiles` giữ gói và vai trò nhưng
 * không có email. Ghép ở đây thay vì bắt trang admin gọi hai lần rồi tự nối.
 */
const MAX_LIMIT = 200;

export async function GET(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;
    const { admin } = guard;

    const url = new URL(request.url);
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 100) || 100, MAX_LIMIT);

    // `listUsers` phân trang riêng của Supabase; perPage tối đa 1000.
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: MAX_LIMIT,
    });
    if (authError) return Response.json({ error: authError.message }, { status: 500 });

    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, display_name, plan, plan_started_at, plan_expires_at, role');
    if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

    type Row = {
      id: string;
      display_name: string | null;
      plan: string;
      plan_started_at: string | null;
      plan_expires_at: string | null;
      role: string;
    };
    const byId = new Map<string, Row>();
    for (const row of (profiles ?? []) as Row[]) byId.set(row.id, row);

    const users = authData.users
      .map((user) => {
        const profile = byId.get(user.id);
        return {
          id: user.id,
          email: user.email ?? null,
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at ?? null,
          displayName: profile?.display_name ?? null,
          // Hồ sơ thiếu là bất thường (trigger tạo hồ sơ hỏng), nhưng đừng làm
          // đổ cả danh sách vì một hàng — hiện 'free' và để admin nhìn thấy.
          plan: profile?.plan ?? 'free',
          planStartedAt: profile?.plan_started_at ?? null,
          planExpiresAt: profile?.plan_expires_at ?? null,
          role: profile?.role ?? 'user',
          missingProfile: !profile,
        };
      })
      .filter((u) => (query ? (u.email ?? '').toLowerCase().includes(query) : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return Response.json({
      users: users.slice(0, limit),
      total: users.length,
      truncated: authData.users.length >= MAX_LIMIT,
    });
  } catch (err) {
    const message = errorText(request, err, 'Lỗi không xác định', 'Unknown error');
    return Response.json({ error: message }, { status: 500 });
  }
}
