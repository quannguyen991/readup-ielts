import React from 'react';
import { LanguageSwitch } from './LanguageSwitch';
import { Pressable, Text, View } from 'react-native';

import { router } from 'expo-router';

import { Logo } from './Logo';
import { SearchIconButton } from '@/components/search/SearchTrigger';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Thanh đầu trang CHỈ dùng ở khổ hẹp.
 *
 * Ở khổ desktop mọi thứ trong này đã nằm trong sidebar, nên thanh này ẩn hẳn.
 * Giữ lại ở mobile vì bottom tabs không có chỗ cho logo và tài khoản.
 */
export function MobileHeader() {
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  const name = useDisplayName();
  const { L } = useL();

  return (
    <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
      <Logo compact />

      <View className="flex-row items-center gap-2">
        <LanguageSwitch compact />
        <SearchIconButton color={color.muted} size={20} />
        <Pressable accessibilityRole="button" accessibilityLabel={L('Thông báo', 'Notifications')} className="p-1.5">
          <View>
            <Icon name="bell" size={20} color={color.muted} />
            <View className="absolute right-0 top-0 h-2 w-2 rounded-pill bg-danger" />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={signedIn ? L('Tài khoản', 'Account') : L('Đăng nhập', 'Sign in')}
          onPress={() => router.push((signedIn ? '/settings' : '/auth/sign-in') as never)}
          className="h-9 w-9 items-center justify-center rounded-pill bg-accent-100"
        >
          <Text className="font-strong text-body text-accent-700">
            {signedIn ? name.slice(0, 1).toUpperCase() : '?'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
