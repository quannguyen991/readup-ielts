import React from 'react';
import { Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon } from '@/components/ui';
import { WELCOME_DAYS } from '@/lib/billing/welcome';
import { isMemberOnlyPath } from '@/lib/access/member-gate';
import { useL } from '@/i18n/useL';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Khách chưa đăng nhập vào khu dành cho thành viên → hiện màn mời đăng nhập / tạo tài khoản (tặng gói Plus `WELCOME_DAYS` ngày)
 * thay cho nội dung. Đang tải phiên thì giữ nguyên nội dung (tránh nháy); chưa cấu hình tài khoản thì không chặn.
 */
export function MemberGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = useAuthStore((s) => s.status);
  const available = useAuthStore((s) => s.available);
  if (status !== 'signed_out' || !available || !isMemberOnlyPath(pathname)) return <>{children}</>;
  return <GateScreen next={pathname} />;
}

function GateScreen({ next }: { next: string }) {
  const { L } = useL();
  const go = (mode: 'signin' | 'signup') => router.push(`/auth/sign-in?mode=${mode}&next=${encodeURIComponent(next)}` as never);
  return (
    <Screen>
      <View className="mx-auto mt-6 w-full" style={{ maxWidth: 560 }}>
        <Card>
          <View className="items-center gap-3 p-6">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-surfaceAlt">
              <Icon name="lock" size={26} color="#A8843F" />
            </View>
            <Text className="text-center font-heavy text-pageTitle text-ink">{L('Đăng nhập để mở tính năng này', 'Sign in to unlock this feature')}</Text>
            <Text className="text-center font-sans text-bodyLg text-muted">
              {L(
                'Du ngoạn, Du học, Speaking, Writing, Listening, Lịch sử, thi thử và cộng đồng dành cho thành viên. Từ vựng, bài đọc và SAT Math bạn vẫn dùng thử được khi chưa có tài khoản.',
                'Travel, Study Abroad, Speaking, Writing, Listening, History, mock tests and the community are for members. Vocabulary, reading and SAT Math stay open to try without an account.',
              )}
            </Text>
            <View className="w-full rounded-card bg-surfaceAlt px-4 py-3">
              <Text className="text-center font-strong text-body text-ink">
                {L(`Tạo tài khoản mới — tặng ${WELCOME_DAYS} ngày gói Plus miễn phí: mở hết nội dung, 20 lượt AI chấm bài mỗi tháng.`, `Create a new account — get ${WELCOME_DAYS} days of Plus free: all content, 20 AI gradings a month.`)}
              </Text>
            </View>
            <View className="mt-1 w-full gap-2">
              <Button label={L(`Tạo tài khoản · nhận Plus ${WELCOME_DAYS} ngày`, `Create account · get ${WELCOME_DAYS} days of Plus`)} fullWidth onPress={() => go('signup')} />
              <Button label={L('Tôi đã có tài khoản — Đăng nhập', 'I already have an account — Sign in')} variant="secondary" fullWidth onPress={() => go('signin')} />
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
