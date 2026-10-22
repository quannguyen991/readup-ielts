import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { HeroShell } from '@/components/layout/HeroShell';
import { Screen } from '@/components/layout/Screen';
import { signInWithOAuth } from '@/services/auth/session';
import { currentUserAgent, isInstagramBrowser } from '@/lib/inapp-browser';
import { isMemberOnlyPath, lockedFeatureName } from '@/lib/access/member-gate';
import { useL } from '@/i18n/useL';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Khách (chưa đăng nhập) vào khu dành cho thành viên → hiện màn mời đăng nhập.
 * Đang tải phiên thì giữ nguyên nội dung (tránh nháy); chưa cấu hình tài khoản thì không chặn.
 *
 * Màn khoá chỉ nói "<tính năng> cần đăng nhập". Nút chính là Google; dưới đó là
 * "Chưa có tài khoản? Đăng ký". Không liệt kê khu nào khoá hay mở.
 *
 * KHÔNG gỡ `children` (tức `<Slot/>` của expo-router) khi khoá — chỉ ẩn đi và đè màn khoá lên. Gỡ bộ định tuyến giữa lúc
 * chuyển trang làm expo-router mất trạng thái và quay về '/' (→ /intro): khách bấm Listening/Speaking… bị đẩy về trang chủ.
 */
export function MemberGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = useAuthStore((s) => s.status);
  const available = useAuthStore((s) => s.available);
  const gated = status === 'signed_out' && available && isMemberOnlyPath(pathname);
  return (
    <>
      <View style={{ flex: 1, display: gated ? 'none' : 'flex' }}>{children}</View>
      {gated ? <GateScreen next={pathname} /> : null}
    </>
  );
}

function GateScreen({ next }: { next: string }) {
  const { L, en } = useL();
  const name = lockedFeatureName(next, en) ?? L('Tính năng này', 'This feature');
  const [busy, setBusy] = useState(false);
  const inApp = isInstagramBrowser(currentUserAgent());
  const [error, setError] = useState<string | null>(null);

  const go = (mode: 'signin' | 'signup') => router.push(`/auth/sign-in?mode=${mode}&next=${encodeURIComponent(next)}` as never);

  const google = async () => {
    setError(null);
    setBusy(true);
    const result = await signInWithOAuth('google');
    setBusy(false);
    if (!result.ok) setError(result.error.message);
  };

  return (
    <Screen>
      <View className="mx-auto mt-6 w-full" style={{ maxWidth: 480 }}>
        {/* Cùng khuôn hero với các trang khác: viền gradient, hoạ tiết pastel, chữ mực tối. */}
        <HeroShell radius={26} style={{ padding: 24, gap: 14 }}>
          <Text className="font-strong text-label" style={{ color: 'rgba(27,17,64,0.75)', letterSpacing: 1.4 }}>
            {L('KHU THÀNH VIÊN', 'MEMBERS ONLY')}
          </Text>
          <Text className="font-heavy text-pageTitle" style={{ color: '#1B1140' }}>
            {L(`${name} cần đăng nhập`, `${name} needs sign-in`)}
          </Text>
          <Text className="font-sans text-body" style={{ color: 'rgba(27,17,64,0.85)' }}>
            {L('Đăng nhập để lưu tiến độ và học tiếp trên mọi thiết bị.', 'Sign in to save your progress and continue on any device.')}
          </Text>

          {inApp ? (
            <Text className="font-sans text-body" style={{ color: 'rgba(27,17,64,0.9)' }}>
              {L('Google không đăng nhập được trong trình duyệt của Instagram. Bấm ⋯ rồi chọn "Mở bằng trình duyệt", hoặc đăng nhập bằng email / số điện thoại.', 'Google sign-in does not work in the Instagram browser. Tap ⋯ and choose "Open in browser", or sign in with email or phone.')}
            </Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={google}
              className="w-full flex-row items-center justify-center gap-3 rounded-pill bg-white"
              style={{ minHeight: 52, opacity: busy ? 0.6 : 1, boxShadow: '0 8px 20px rgba(27,17,64,0.12)' } as object}
            >
              {busy ? <ActivityIndicator color="#6A4BD9" /> : <Text className="font-heavy text-cardTitle" style={{ color: '#4285F4' }}>G</Text>}
              <Text className="font-strong text-body" style={{ color: '#1B1140' }}>
                {L('Tiếp tục với Google', 'Continue with Google')}
              </Text>
            </Pressable>
          )}

          {error ? <Text className="font-sans text-label" style={{ color: '#B42318' }}>{error}</Text> : null}

          <Text className="font-sans text-body" style={{ color: 'rgba(27,17,64,0.85)' }}>
            {L('Chưa có tài khoản? ', "Don't have an account? ")}
            <Text className="font-strong" style={{ color: '#6A4BD9' }} accessibilityRole="link" onPress={() => go('signup')}>
              {L('Đăng ký', 'Sign up')}
            </Text>
          </Text>
          <Pressable accessibilityRole="link" onPress={() => go('signin')}>
            <Text className="font-strong text-label" style={{ color: '#1B1140' }}>
              {L('Đăng nhập bằng email hoặc số điện thoại', 'Sign in with email or phone')}
            </Text>
          </Pressable>
        </HeroShell>
      </View>
    </Screen>
  );
}
