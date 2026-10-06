import { useEffect } from 'react';
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import {
  displayNameOf,
  fetchProfile,
  getCurrentSession,
  isAuthAvailable,
  onAuthChange,
  signOut as signOutRequest,
  type Profile,
} from '@/services/auth/session';

import { claimPendingInvite } from '@/services/referral/pending';
import { claimWelcomePro, looksNewAccount } from '@/services/auth/welcome';
import { useLocale } from '@/i18n/useL';

import { useBillingStore } from './useBillingStore';

/**
 * Trạng thái đăng nhập.
 *
 * KHÔNG persist gì ở đây. Supabase đã tự lưu phiên (localStorage trên web,
 * AsyncStorage trên native) và tự làm mới token; store này chỉ là bản sao trong
 * bộ nhớ để component đọc. Lưu thêm một bản nữa là tạo ra hai nguồn sự thật có
 * thể lệch nhau — mà bản lệch ấy lại chứa token, tức là một chỗ rò rỉ.
 *
 * `status` tách 'loading' khỏi 'signed_out' là có chủ ý: lúc mới mở app, đọc
 * phiên từ ổ đĩa mất vài chục mili giây, và nếu coi khoảng đó là "chưa đăng
 * nhập" thì màn hình sẽ nháy sang trang đăng nhập rồi lại nhảy về.
 */

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** false khi chưa cấu hình Supabase — app vẫn chạy, chỉ là không có tài khoản. */
  available: boolean;

  initialize: () => Promise<void>;
  applySession: (session: Session | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'loading',
  session: null,
  user: null,
  profile: null,
  available: isAuthAvailable(),

  initialize: async () => {
    if (!isAuthAvailable()) {
      set({ status: 'signed_out', available: false });
      return;
    }
    const session = await getCurrentSession();
    get().applySession(session);
    if (session?.user) void get().refreshProfile();
  },

  applySession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'signed_in' : 'signed_out',
      profile: session ? get().profile : null,
    });
  },

  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;
    let profile = await fetchProfile(user.id);

    /*
      Quà đăng ký: tài khoản MỚI còn Free được máy chủ tặng gói Plus (`/api/welcome-pro`, một lần). Hỏi trước khi áp gói
      để người dùng thấy gói quà ngay lần đăng nhập đầu, không phải đợi lần mở app sau.
    */
    const earlyToken = get().session?.access_token;
    if (profile && profile.plan === 'free' && earlyToken && looksNewAccount(user.created_at)) {
      if (await claimWelcomePro(user.id, earlyToken)) {
        profile = (await fetchProfile(user.id)) ?? profile;
        // Đã nhận gói rồi thì không còn lượt "học thử 5 ngày" nữa.
        useBillingStore.setState({ proTrialUsed: true });
      }
    }
    set({ profile });

    /*
      Gói trên máy chủ ĐÈ gói lưu ở client.

      Bản lưu ở client là để dùng khi chưa đăng nhập, và người mở DevTools sửa
      được nó. Một khi đã có hồ sơ trên máy chủ thì đó mới là sự thật — cột
      `plan` chỉ ghi được bằng service_role, nên nó phản ánh đúng thứ đã trả
      tiền. Không đồng bộ ngược lên: client không có quyền, và cũng không nên có.
    */
    if (profile) {
      useBillingStore.getState().applyServerPlan(profile.plan, profile.planExpiresAt);
    }

    /*
      Nộp mã mời đang chờ trên thiết bị.

      Đặt ở đây vì đây là điểm DUY NHẤT chắc chắn chạy sau mọi đường đăng nhập —
      liên kết email, Google, quay lại từ callback, hay khôi phục phiên cũ. Gắn
      vào riêng màn đăng nhập thì đường nào không đi qua màn đó sẽ mất mã.
    */
    const token = get().session?.access_token;
    if (token) void claimPendingInvite(token);
  },

  signOut: async () => {
    await signOutRequest();
    set({ session: null, user: null, profile: null, status: 'signed_out' });
    // Đăng xuất thì gói của tài khoản vừa thoát không được ở lại trên máy này —
    // máy dùng chung mà người sau vẫn thấy Max là sai.
    useBillingStore.getState().clearServerPlan();
  },
}));

/**
 * Gắn một lần ở layout gốc: đọc phiên có sẵn rồi lắng nghe mọi thay đổi.
 *
 * Lắng nghe là bắt buộc chứ không phải tối ưu: token hết hạn và được làm mới
 * ngầm, đăng xuất ở tab khác, hoặc quay về từ Google — cả ba đều đổi phiên mà
 * không đi qua bất kỳ hành động nào trong app này.
 */
export function useAuthBootstrap() {
  const initialize = useAuthStore((s) => s.initialize);
  const applySession = useAuthStore((s) => s.applySession);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  useEffect(() => {
    void initialize();
    return onAuthChange((session) => {
      applySession(session);
      if (session?.user) void refreshProfile();
    });
  }, [applySession, initialize, refreshProfile]);
}

/**
 * Tên hiện trên sidebar và màn hồ sơ. Tên dự phòng (Khách / Bạn) dịch lúc vẽ
 * theo ngôn ngữ giao diện — tên đã lưu của người dùng thì giữ nguyên.
 */
export function useDisplayName(): string {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const status = useAuthStore((s) => s.status);
  const en = useLocale() === 'en';
  if (status !== 'signed_in') return en ? 'Guest' : 'Khách';
  return displayNameOf(user, profile, en ? 'You' : 'Bạn');
}

export function useIsSignedIn(): boolean {
  return useAuthStore((s) => s.status === 'signed_in');
}
