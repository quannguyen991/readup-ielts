import { welcomeEligibility } from '@/lib/billing/welcome';

/**
 * Xin quà đăng ký (gói Plus miễn phí cho tài khoản mới) sau khi đăng nhập. Máy chủ mới là nơi quyết định và ghi gói;
 * client chỉ hỏi một lần mỗi tài khoản mỗi phiên, và chỉ khi tài khoản còn "mới" (đỡ gọi thừa với tài khoản cũ).
 */
const asked = new Set<string>();

export function looksNewAccount(userCreatedAt: string | null | undefined): boolean {
  return welcomeEligibility({ userCreatedAt, plan: 'free', planStartedAt: null }) === 'ok';
}

export async function claimWelcomePro(userId: string, accessToken: string): Promise<boolean> {
  if (asked.has(userId)) return false;
  asked.add(userId);
  try {
    const res = await fetch('/api/welcome-pro', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      asked.delete(userId); // lỗi mạng/máy chủ: cho thử lại lần sau
      return false;
    }
    const data = (await res.json()) as { granted?: boolean };
    return data.granted === true;
  } catch {
    asked.delete(userId);
    return false;
  }
}
