import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { MIN_PASSWORD, validateSignUp } from '@/services/auth/password';
import { msg } from '@/lib/server-locale';

/**
 * POST /api/auth/sign-up — tạo tài khoản bằng email + mật khẩu, KHÔNG gửi thư.
 *
 * Người dùng yêu cầu 26/09/2026: bỏ bước gửi liên kết về Gmail, cho tạo tài
 * khoản bằng mật khẩu. Gói free của Supabase bật "Confirm email" mặc định, và
 * đường đăng ký phía client (`auth.signUp`) khi ấy vẫn gửi thư xác nhận. Nên
 * tạo ở MÁY CHỦ bằng service key với `email_confirm: true`: tài khoản dùng được
 * ngay, không thư nào được gửi, không phải đổi cài đặt trên console Supabase.
 *
 * ĐÁNH ĐỔI (đã nói với người dùng): email không được kiểm là của người đăng ký.
 * Chủ thật của email vẫn lấy lại được tài khoản bằng lối "Nhận liên kết qua
 * email" ở màn đăng nhập (thư đi tới hộp thư của họ).
 *
 * Chặn tạo hàng loạt ở mức đơn giản: mỗi địa chỉ mạng tối đa 5 tài khoản / 10
 * phút trên một máy chủ. Không phải hàng rào tuyệt đối — đủ để một vòng lặp
 * spam không tạo được hàng nghìn tài khoản.
 */
/**
 * Bản tiếng Anh cho lỗi của `validateSignUp` — hàm dùng chung với màn đăng nhập
 * nên giữ câu tiếng Việt; khớp đúng câu, câu lạ thì để nguyên.
 */
const SIGNUP_ERROR_EN: Record<string, string> = {
  'Email chưa đúng định dạng.': "That email address doesn't look right.",
  [`Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`]: `Your password needs at least ${MIN_PASSWORD} characters.`,
  'Mật khẩu dài quá 72 ký tự.': 'Your password is longer than 72 characters.',
  'Mật khẩu không nên chỉ toàn số — thêm vài chữ cái.': "Don't use only numbers — add a few letters.",
  'Mật khẩu đừng trùng với email.': "Your password shouldn't match your email.",
};

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function limited(key: string): boolean {
  const now = Date.now();
  const list = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) {
    recent.set(key, list);
    return true;
  }
  list.push(now);
  recent.set(key, list);
  return false;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown; name?: unknown } | null;
    const checked = validateSignUp(body?.email, body?.password, body?.name);
    if (!checked.ok) {
      return Response.json(
        { error: msg(request, checked.error, SIGNUP_ERROR_EN[checked.error] ?? checked.error) },
        { status: 400 },
      );
    }

    const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0]!.trim() || 'unknown';
    if (limited(ip)) {
      return Response.json({
          error: msg(
            request,
            'Tạo quá nhiều tài khoản trong thời gian ngắn. Thử lại sau ít phút.',
            'Too many accounts created in a short time. Please try again in a few minutes.',
          ),
        }, { status: 429 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.createUser({
      email: checked.email,
      password: checked.password,
      email_confirm: true,
      user_metadata: checked.name ? { display_name: checked.name, full_name: checked.name } : {},
    });

    if (error) {
      const taken = /already|registered|exists/i.test(error.message) || error.status === 422;
      if (taken) {
        return Response.json(
          {
            error: msg(
              request,
              'Email này đã có tài khoản. Chuyển sang "Đăng nhập" — nếu tài khoản cũ chưa có mật khẩu, bấm "Nhận liên kết qua email".',
              'This email already has an account. Switch to "Sign in" — if the old account has no password, tap "Get a link by email".',
            ),
            code: 'email_taken',
          },
          { status: 409 },
        );
      }
      return Response.json({ error: notCreated(request) }, { status: 500 });
    }

    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: notCreated(request) }, { status: 500 });
  }
}

function notCreated(request: Request): string {
  return msg(request, 'Chưa tạo được tài khoản. Thử lại sau ít phút.', "Couldn't create the account. Please try again in a few minutes.");
}
