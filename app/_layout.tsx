import '../global.css';
import '@/lib/nativewind-interop';

import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';

import { AppShell } from '@/components/layout/AppShell';
import { GameFxLayer } from '@/components/game/GameFxLayer';
import { PageTransition } from '@/components/motion/Motion';
import { PageViewTracker } from '@/services/analytics/PageViewTracker';
import { VercelAnalytics } from '@/services/analytics/VercelAnalytics';
import { useAuthBootstrap } from '@/store/useAuthStore';
import { useSyncBootstrap } from '@/store/useSyncStore';
import { color } from '@/theme/tokens';

export default function RootLayout() {
  // Khoá chuyển cảnh là đường dẫn: đổi trang thì nội dung được gắn lại và hiệu
  // ứng vào chạy lại. Đây cũng là lý do KHÔNG bọc cả AppShell — sidebar phải
  // đứng yên, chỉ vùng nội dung mới chuyển.
  const pathname = usePathname();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  // Khôi phục phiên đăng nhập rồi bật đồng bộ. Cả hai đều chịu được việc chưa
  // cấu hình Supabase — lúc ấy app chạy hoàn toàn cục bộ như trước.
  useAuthBootstrap();
  useSyncBootstrap();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <AppTitle />
        <ActivityIndicator color={color.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppTitle />
        <StatusBar style="dark" />
        <VercelAnalytics />
        <PageViewTracker />
        <AppShell>
          <PageTransition routeKey={pathname}>
            <Slot />
          </PageTransition>
        </AppShell>
        <GameFxLayer />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * Tên tab trình duyệt. Không đặt thì thẻ <title> rỗng và tab hiện nguyên đường
 * dẫn "band9-ielts.vercel.app/..." — người dùng muốn thấy "Band 9" (27/09/2026).
 */
function AppTitle() {
  return (
    <Head>
      <title>Band 9</title>
    </Head>
  );
}
