import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Icon } from '@/components/ui';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';

/**
 * Hàng tác vụ tài khoản trên trang Bạn: đang đăng nhập với ai, đăng xuất, hoặc đổi sang tài khoản khác.
 * Đăng xuất ở store đã đẩy nốt thay đổi lên máy chủ và xoá gói của tài khoản cũ khỏi máy, nên
 * đổi tài khoản chỉ cần thoát rồi mở màn đăng nhập.
 */
export function AccountSwitch() {
  const { L } = useL();
  const name = useDisplayName();
  const signOut = useAuthStore((s) => s.signOut);
  const [busy, setBusy] = useState<'out' | 'switch' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'out' | 'switch') => {
    setBusy(kind);
    setError(null);
    try {
      await signOut();
      if (kind === 'switch') router.replace('/auth/sign-in' as never);
    } catch {
      setError(L('Chưa đăng xuất được. Thử lại sau ít phút.', 'Could not sign out. Try again in a moment.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View
      accessibilityLabel={L('Tài khoản đang dùng', 'Current account')}
      style={{ borderRadius: 18, borderWidth: 1, borderColor: '#F3F0FB', backgroundColor: '#FFFFFF', padding: 14, gap: 10 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="home" size={16} color={color.subtle} />
        <Text className="font-sans text-label text-muted" numberOfLines={1} style={{ flex: 1 }}>
          {L(`Đang đăng nhập: ${name}`, `Signed in as ${name}`)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button
          label={L('Đổi tài khoản', 'Switch account')}
          variant="outline"
          size="sm"
          iconLeft="chevron-right"
          loading={busy === 'switch'}
          disabled={busy !== null}
          onPress={() => void run('switch')}
        />
        <Button
          label={L('Đăng xuất', 'Sign out')}
          variant="outline"
          size="sm"
          iconLeft="chevron-left"
          loading={busy === 'out'}
          disabled={busy !== null}
          onPress={() => void run('out')}
        />
      </View>
      {error ? <Text className="font-sans text-label text-danger-ink">{error}</Text> : null}
    </View>
  );
}
