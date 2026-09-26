import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';

import { describeAuthError } from './errors';
import { PLAN_ORDER, type PlanId } from '@/lib/billing/plans';
import { hasSupabaseConfig } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

/**
 * Lớp bọc quanh Supabase Auth.
 *
 * MỌI HÀM Ở ĐÂY ĐỀU CHỊU ĐƯỢC VIỆC CHƯA CẤU HÌNH SUPABASE. Đó là ràng buộc gốc
 * của app: học được ngay khi mở lên, không cần tài khoản, không cần mạng. Tài
 * khoản là thứ CỘNG THÊM để đồng bộ nhiều thiết bị — không phải cửa vào.
 *
 * Vì vậy không hàm nào ở đây ném lỗi "chưa cấu hình" ra ngoài dưới dạng thô;
 * chúng trả về `AuthResult` để màn hình hiện một câu tiếng Việt tử tế.
 */

export type AuthProviderId = 'google' | 'facebook' | 'phone' | 'email';

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ReturnType<typeof describeAuthError> };

function fail(error: unknown): { ok: false; error: ReturnType<typeof describeAuthError> } {
  return { ok: false, error: describeAuthError(error) };
}

const NOT_CONFIGURED = new Error('Chưa cấu hình Supabase');

export function isAuthAvailable(): boolean {
  return hasSupabaseConfig();
}

/**
 * Địa chỉ quay về sau khi đăng nhập bằng Google/Facebook.
 *
 * Web dùng chính origin đang chạy, nên bản localhost và bản đã deploy không
 * giẫm chân nhau. Native dùng deep link theo `scheme` khai trong app.json.
 *
 * CẢ HAI ĐỊA CHỈ NÀY PHẢI ĐƯỢC KHAI TRONG SUPABASE (Authentication → URL
 * Configuration → Redirect URLs). Thiếu là Supabase từ chối chuyển hướng và
 * người dùng kẹt ở trang trắng sau khi bấm đồng ý.
 */
export function redirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return Linking.createURL('/auth/callback');
}

// ------------------------------------------------------------- phiên hiện tại

export async function getCurrentSession(): Promise<Session | null> {
  if (!hasSupabaseConfig()) return null;
  const { data } = await getSupabase().auth.getSession();
  return data.session ?? null;
}

/** Trả về hàm huỷ đăng ký. Không cấu hình thì trả về hàm rỗng, không nổ. */
export function onAuthChange(callback: (session: Session | null) => void): () => void {
  if (!hasSupabaseConfig()) return () => {};
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

// --------------------------------------------------------- Google / Facebook

/**
 * Đăng nhập bằng nhà cung cấp ngoài.
 *
 * Trên web thì Supabase tự chuyển hướng cả trang. Trên native phải mở một phiên
 * trình duyệt xác thực rồi tự bắt deep link quay về — `expo-web-browser` lo
 * phần đóng tab đúng lúc, nếu không thì tab OAuth nằm lại đè lên app.
 */
export async function signInWithOAuth(provider: 'google' | 'facebook'): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl(),
        // Web tự chuyển hướng; native cần lấy URL về để tự mở trình duyệt.
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) return fail(error);
    if (Platform.OS === 'web') return { ok: true, data: undefined };

    if (!data?.url) return fail(new Error('Không lấy được địa chỉ đăng nhập.'));

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl());
    if (result.type !== 'success') {
      // Người dùng tự đóng — không phải lỗi, đừng hiện thông báo đỏ.
      return { ok: true, data: undefined };
    }

    const code = new URL(result.url).searchParams.get('code');
    if (code) {
      const exchange = await supabase.auth.exchangeCodeForSession(code);
      if (exchange.error) return fail(exchange.error);
    }
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

/** Đổi `?code=` trên URL lấy phiên — dùng ở màn callback của web. */
export async function exchangeCode(code: string): Promise<AuthResult<Session | null>> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);
  try {
    const { data, error } = await getSupabase().auth.exchangeCodeForSession(code);
    if (error) return fail(error);
    return { ok: true, data: data.session ?? null };
  } catch (error) {
    return fail(error);
  }
}

// -------------------------------------------------------- số điện thoại (OTP)

/** Gửi mã OTP. `e164` phải đã qua `parsePhone` — hàm này không tự chuẩn hoá. */
export async function sendPhoneOtp(e164: string): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);
  try {
    const { error } = await getSupabase().auth.signInWithOtp({
      phone: e164,
      options: { shouldCreateUser: true },
    });
    if (error) return fail(error);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export async function verifyPhoneOtp(e164: string, code: string): Promise<AuthResult<Session | null>> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);
  try {
    const { data, error } = await getSupabase().auth.verifyOtp({
      phone: e164,
      token: code.trim(),
      type: 'sms',
    });
    if (error) return fail(error);
    return { ok: true, data: data.session ?? null };
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------- email + mật khẩu

/**
 * Đăng nhập bằng email + mật khẩu (từ 26/09/2026 là lối chính cho email —
 * người dùng bỏ bước gửi liên kết về Gmail).
 */
export async function signInWithPassword(email: string, password: string): Promise<AuthResult<Session | null>> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);
  try {
    const { data, error } = await getSupabase().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return fail(error);
    return { ok: true, data: data.session ?? null };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Tạo tài khoản qua `/api/auth/sign-up` (máy chủ tạo sẵn ở trạng thái đã xác
 * nhận, không gửi thư) rồi đăng nhập luôn bằng chính mật khẩu vừa đặt.
 */
export async function signUpWithPassword(email: string, password: string, name?: string): Promise<AuthResult<Session | null> & { taken?: boolean }> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);
  try {
    const res = await fetch('/api/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
    if (!res.ok) {
      return { ok: false, error: { ...describeAuthError(body.error ?? 'sign_up_failed'), message: body.error ?? 'Chưa tạo được tài khoản.' }, taken: body.code === 'email_taken' };
    }
    return signInWithPassword(email, password);
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------- email (OTP)

/**
 * Email cũng dùng MÃ SÁU SỐ chứ không dùng liên kết ma thuật.
 *
 * Liên kết ma thuật mở ra ở trình duyệt mặc định, mà trên điện thoại thì đó
 * thường không phải chỗ app đang chạy — người dùng bấm xong thấy một tab lạ báo
 * đăng nhập thành công còn app vẫn đứng im. Mã sáu số thì gõ ở đâu cũng được và
 * dùng chung được luôn màn OTP với số điện thoại.
 */
export async function sendEmailOtp(email: string): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);
  try {
    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true, emailRedirectTo: redirectUrl() },
    });
    if (error) return fail(error);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export async function verifyEmailOtp(email: string, code: string): Promise<AuthResult<Session | null>> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);
  try {
    const { data, error } = await getSupabase().auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    if (error) return fail(error);
    return { ok: true, data: data.session ?? null };
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------------- hồ sơ

export type Profile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  targetBand: number | null;
  dailyGoalMinutes: number;
  /**
   * Gói và vai trò LẤY TỪ MÁY CHỦ — đây mới là nguồn sự thật.
   *
   * `useBillingStore` giữ một bản gói ở client cho lúc chưa đăng nhập, nhưng
   * bản đó người dùng sửa được bằng DevTools. Migration đã thu hồi quyền UPDATE
   * hai cột này của `authenticated`, nên giá trị đọc về đây chỉ có thể do
   * service_role ghi: webhook thanh toán, hoặc trang admin.
   */
  plan: PlanId;
  planExpiresAt: string | null;
  role: 'user' | 'admin';
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, display_name, avatar_url, target_band, daily_goal_minutes, plan, plan_expires_at, role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as typeof data & {
    plan?: string | null;
    plan_expires_at?: string | null;
    role?: string | null;
  };
  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    targetBand: data.target_band,
    dailyGoalMinutes: data.daily_goal_minutes,
    // Giá trị lạ (lược đồ mới hơn code) rơi về mức THẤP NHẤT, không phải cao
    // nhất — đoán rộng tay ở đây là phát không gói trả phí.
    plan: PLAN_ORDER.includes(row.plan as PlanId) ? (row.plan as PlanId) : 'free',
    planExpiresAt: row.plan_expires_at ?? null,
    role: row.role === 'admin' ? 'admin' : 'user',
  };
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'displayName' | 'targetBand' | 'dailyGoalMinutes'>>,
): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);
  try {
    const { error } = await getSupabase()
      .from('profiles')
      .update({
        ...(patch.displayName !== undefined ? { display_name: patch.displayName } : {}),
        ...(patch.targetBand !== undefined ? { target_band: patch.targetBand } : {}),
        ...(patch.dailyGoalMinutes !== undefined
          ? { daily_goal_minutes: patch.dailyGoalMinutes }
          : {}),
      })
      .eq('id', userId);
    if (error) return fail(error);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------------ đăng xuất

export async function signOut(): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return { ok: true, data: undefined };
  try {
    const { error } = await getSupabase().auth.signOut();
    if (error) return fail(error);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Xoá tài khoản.
 *
 * Xoá `auth.users` cần service key, mà service key TUYỆT ĐỐI không được nằm
 * trong bundle client — nên việc này phải đi qua API route chạy phía máy chủ.
 * Route đó tự xác minh người gọi bằng access token của chính phiên hiện tại,
 * không tin `userId` do client gửi lên.
 */
export async function deleteAccount(): Promise<AuthResult> {
  if (!hasSupabaseConfig()) return fail(NOT_CONFIGURED);
  try {
    const session = await getCurrentSession();
    if (!session) return fail(new Error('Chưa đăng nhập.'));

    const response = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      return fail(new Error(body.error ?? 'Không xoá được tài khoản.'));
    }

    await getSupabase().auth.signOut();
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export function displayNameOf(user: User | null, profile: Profile | null): string {
  if (profile?.displayName) return profile.displayName;
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  if (meta?.full_name) return meta.full_name;
  if (meta?.name) return meta.name;
  if (user?.email) return user.email.split('@')[0] ?? 'Bạn';
  if (user?.phone) return user.phone;
  return 'Bạn';
}
