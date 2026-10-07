import React from 'react';
import { Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon } from '@/components/ui';
import { WELCOME_DAYS } from '@/lib/billing/welcome';
import { FREE_SUMMARY, LOCKED_SUMMARY, isMemberOnlyPath, lockedFeatureName } from '@/lib/access/member-gate';
import { useL } from '@/i18n/useL';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Khách (chưa đăng nhập) vào khu dành cho thành viên → hiện màn mời đăng nhập / tạo tài khoản (tặng gói Plus `WELCOME_DAYS` ngày).
 * Đang tải phiên thì giữ nguyên nội dung (tránh nháy); chưa cấu hình tài khoản thì không chặn.
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

function Chips({ items, tone }: { items: string[]; tone: 'locked' | 'free' }) {
  return (
    <View className="flex-row flex-wrap justify-center gap-1.5">
      {items.map((x) => (
        <View
          key={x}
          className="rounded-pill px-3 py-1"
          style={{ backgroundColor: tone === 'free' ? 'rgba(34,160,107,0.10)' : '#F4EEE2' }}
        >
          <Text className="font-semi text-label" style={{ color: tone === 'free' ? '#17784F' : '#6B5A3A' }}>
            {x}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GateScreen({ next }: { next: string }) {
  const { L, en } = useL();
  const name = lockedFeatureName(next, en) ?? L('Tính năng này', 'This feature');
  const go = (mode: 'signin' | 'signup') => router.push(`/auth/sign-in?mode=${mode}&next=${encodeURIComponent(next)}` as never);
  return (
    <Screen>
      <View className="mx-auto mt-6 w-full" style={{ maxWidth: 520 }}>
        <Card>
          <View className="items-center gap-3 p-6">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-surfaceAlt">
              <Icon name="lock" size={22} color="#A8843F" />
            </View>
            <Text className="text-center font-heavy text-pageTitle text-ink">{L(`${name} cần đăng nhập`, `${name} needs an account`)}</Text>
            <Text className="text-center font-sans text-bodyLg text-muted">
              {L(`Tài khoản miễn phí · tặng ${WELCOME_DAYS} ngày gói Plus`, `Free account · ${WELCOME_DAYS} days of Plus included`)}
            </Text>

            <View className="mt-1 w-full gap-1.5">
              <Text className="text-center font-strong text-label text-muted">{L('Cần đăng nhập', 'Needs an account')}</Text>
              <Chips items={en ? LOCKED_SUMMARY.en : LOCKED_SUMMARY.vi} tone="locked" />
            </View>
            <View className="w-full gap-1.5">
              <Text className="text-center font-strong text-label text-muted">{L('Dùng ngay, không cần tài khoản', 'Open to everyone')}</Text>
              <Chips items={en ? FREE_SUMMARY.en : FREE_SUMMARY.vi} tone="free" />
            </View>

            <View className="mt-2 w-full gap-2">
              <Button label={L('Tạo tài khoản', 'Create account')} fullWidth onPress={() => go('signup')} />
              <Button label={L('Đăng nhập', 'Sign in')} variant="secondary" fullWidth onPress={() => go('signin')} />
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
