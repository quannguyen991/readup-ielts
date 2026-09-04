import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon } from '@/components/ui';
import { describeAuthError } from '@/services/auth/errors';
import { exchangeCode, getCurrentSession } from '@/services/auth/session';
import { useAuthStore } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';

/**
 * Trang Google/Facebook trả về sau khi người dùng bấm đồng ý.
 *
 * Với PKCE, URL quay về mang một `?code=` dùng một lần, phải đổi lấy phiên bằng
 * `code_verifier` mà chỉ trình duyệt này giữ. Supabase tự làm việc ấy khi
 * `detectSessionInUrl` bật, nhưng KHÔNG PHẢI LÚC NÀO CŨNG KỊP trước lúc màn hình
 * này render — nên ở đây kiểm phiên trước, chưa có thì tự đổi mã.
 *
 * Trang này cũng là nơi duy nhất nhìn thấy lỗi `?error=` do nhà cung cấp trả về
 * (người dùng bấm Huỷ, app chưa được duyệt, sai redirect URL). Không xử ở đây
 * thì họ chỉ thấy một trang trắng.
 */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const applySession = useAuthStore((s) => s.applySession);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const providerError =
        typeof params.error_description === 'string'
          ? params.error_description
          : typeof params.error === 'string'
            ? params.error
            : null;

      if (providerError) {
        if (!cancelled) setMessage(describeAuthError(new Error(providerError)).message);
        return;
      }

      // Supabase có thể đã đổi mã xong trong lúc trang đang tải.
      const existing = await getCurrentSession();
      if (existing) {
        if (cancelled) return;
        applySession(existing);
        void refreshProfile();
        router.replace('/dashboard' as never);
        return;
      }

      const code = typeof params.code === 'string' ? params.code : null;
      if (!code) {
        /*
          Luồng implicit trả token sau dấu `#`, không phải `?code=`.

          Supabase tự đọc phần `#` khi `detectSessionInUrl` bật, nhưng nó chạy
          bất đồng bộ nên lần kiểm phiên ở trên có thể tới trước. Thấy có token
          trong URL thì chờ thêm vài nhịp rồi hỏi lại, đừng vội kết luận là
          thiếu mã — báo "thiếu mã" trong khi mã đang nằm ngay trên thanh địa chỉ
          là kiểu lỗi làm người ta mất lòng tin vào cả app.
        */
        const hash = typeof window === 'undefined' ? '' : window.location.hash;
        if (hash.includes('access_token')) {
          for (let attempt = 0; attempt < 10; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            if (cancelled) return;
            const late = await getCurrentSession();
            if (late) {
              applySession(late);
              void refreshProfile();
              router.replace('/dashboard' as never);
              return;
            }
          }
        }

        if (!cancelled) setMessage('Thiếu mã xác thực trong đường dẫn quay về.');
        return;
      }

      const result = await exchangeCode(code);
      if (cancelled) return;
      if (!result.ok) {
        setMessage(result.error.message);
        return;
      }

      applySession(result.data);
      void refreshProfile();
      router.replace('/dashboard' as never);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [applySession, params.code, params.error, params.error_description, refreshProfile]);

  if (message) {
    return (
      <Screen>
        <View className="w-full self-center" style={{ maxWidth: 420 }}>
          <Card>
            <View className="flex-row items-start gap-2">
              <Icon name="info" size={18} color={color.danger} />
              <View className="flex-1">
                <Text className="font-strong text-cardTitle text-ink">Chưa đăng nhập được</Text>
                <Text className="mt-1 font-sans text-body text-muted">{message}</Text>
              </View>
            </View>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <Button label="Thử lại" onPress={() => router.replace('/auth/sign-in' as never)} />
              <Button
                label="Học tiếp không cần tài khoản"
                variant="outline"
                onPress={() => router.replace('/dashboard' as never)}
              />
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="w-full self-center items-center py-16" style={{ maxWidth: 420 }}>
        <ActivityIndicator color={color.primary} />
        <Text className="mt-3 font-sans text-body text-muted">Đang hoàn tất đăng nhập…</Text>
      </View>
    </Screen>
  );
}
