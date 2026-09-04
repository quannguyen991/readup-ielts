import { hasSupabaseConfig, publicEnv } from '@/lib/env';

/**
 * Hỏi máy chủ xem cách đăng nhập nào đang thật sự bật.
 *
 * VÌ SAO PHẢI HỎI: bật Google hay SMS là việc bấm trong console Supabase, không
 * phải việc đổi code. Nếu màn đăng nhập cứ bày đủ bốn nút thì ba trong số đó
 * dẫn tới một trang lỗi tiếng Anh — đúng kiểu thất hứa khó chịu nhất, vì người
 * dùng đã bỏ công bấm rồi mới biết. Hỏi máy chủ thì nút tự sáng lên đúng lúc
 * bạn bật provider, không phải sửa và deploy lại lần nữa.
 *
 * `/auth/v1/settings` là endpoint công khai, chỉ cần anon key, và trả về đúng
 * bảng cờ này. Không rò rỉ gì: nó chỉ nói "provider nào đang bật".
 */
export type AuthCapabilities = {
  google: boolean;
  facebook: boolean;
  phone: boolean;
  email: boolean;
};

/** Chưa biết thì cứ coi như chỉ có email — cách duy nhất chạy được khi mới dựng. */
export const UNKNOWN_CAPABILITIES: AuthCapabilities = {
  google: false,
  facebook: false,
  phone: false,
  email: true,
};

type SettingsResponse = {
  external?: Record<string, boolean>;
};

export async function fetchAuthCapabilities(): Promise<AuthCapabilities> {
  if (!hasSupabaseConfig()) return UNKNOWN_CAPABILITIES;

  try {
    const res = await fetch(`${publicEnv.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: publicEnv.supabaseAnonKey },
    });
    if (!res.ok) return UNKNOWN_CAPABILITIES;

    const body = (await res.json()) as SettingsResponse;
    const ext = body.external ?? {};
    return {
      google: ext.google === true,
      facebook: ext.facebook === true,
      phone: ext.phone === true,
      // `email` tắt hẳn là trường hợp hiếm, nhưng nếu tắt thật thì đừng bày ô nhập.
      email: ext.email !== false,
    };
  } catch {
    // Mất mạng thì im lặng lùi về mặc định. Màn đăng nhập không phải chỗ để
    // hiện lỗi mạng cho một lời gọi phụ trợ.
    return UNKNOWN_CAPABILITIES;
  }
}
