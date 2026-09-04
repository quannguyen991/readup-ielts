import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { router } from 'expo-router';

import { Logo } from './Logo';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';

/**
 * Thanh đầu trang CHỈ dùng ở khổ hẹp.
 *
 * Ở khổ desktop mọi thứ trong này đã nằm trong sidebar, nên thanh này ẩn hẳn.
 * Giữ lại ở mobile vì bottom tabs không có chỗ cho logo và tài khoản.
 */
export function MobileHeader() {
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  const name = useDisplayName();

  return (
    <View className="flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
      <Logo compact />

      <View className="flex-row items-center gap-2">
        <Pressable accessibilityRole="button" accessibilityLabel="Thông báo" className="p-1.5">
          <View>
            <Icon name="bell" size={20} color={color.muted} />
            <View className="absolute right-0 top-0 h-2 w-2 rounded-pill bg-danger" />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={signedIn ? 'Tài khoản' : 'Đăng nhập'}
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
