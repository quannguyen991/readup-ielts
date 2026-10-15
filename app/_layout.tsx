import '../global.css';
import '@/lib/nativewind-interop';

import React, { useEffect, useState } from 'react';
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
// Nunito: font bo tròn cho giao diện trang chủ kiểu nhân vật (xem src/components/cute-home).
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

import { AppShell } from '@/components/layout/AppShell';
import { MemberGate } from '@/components/access/MemberGate';
import { GameFxLayer } from '@/components/game/GameFxLayer';
import { BreakLayer } from '@/components/break/BreakLayer';
import { ChiikawaReact } from '@/components/chiikawa/ChiikawaReact';
import { ChiikawaTapFx } from '@/components/chiikawa/ChiikawaTapFx';
import { PageTransition } from '@/components/motion/Motion';
import { PageViewTracker } from '@/services/analytics/PageViewTracker';
import { VercelAnalytics } from '@/services/analytics/VercelAnalytics';
import { useSfxBindings } from '@/services/audio/useSfxBindings';
import { useAuthBootstrap } from '@/store/useAuthStore';
import { useSyncBootstrap } from '@/store/useSyncStore';
import { installLocaleFetch } from '@/i18n/fetch-locale';
import { useHydrated } from '@/components/layout/useHydrated';
import { useRewardStore } from '@/store/useRewardStore';
import { setPaletteId } from '@/theme/palette-state';

// Mọi lượt gọi `/api/...` mang theo ngôn ngữ đang chọn để máy chủ trả lời đúng
// thứ tiếng. Chạy một lần lúc nạp module; gọi lại (HMR) vẫn chỉ bọc một lớp.
installLocaleFetch();

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
  useSfxBindings();

  // Don't block the entire app on web font downloads. If one font request stalls,
  // keep the interface usable with platform fallbacks and swap to branded fonts
  // as soon as useFonts finishes loading them.
  useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  // Chủ đề Chiikawa: đổi bảng màu cho cả app. Chờ hydrate để lượt đầu khớp HTML máy
  // chủ; đổi bảng thì dựng lại cả cây (key) để mọi màu trong JS được tính lại.
  const hydrated = useHydrated();
  const themeId = useRewardStore((s) => s.theme);
  const paletteKey = hydrated && themeId === 'theme-chiikawa' ? 'chiikawa' : 'classic';
  setPaletteId(paletteKey);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('theme-chiikawa', paletteKey === 'chiikawa');
  }, [paletteKey]);

  return (
    <SafeAreaProvider key={paletteKey}>
      <QueryClientProvider client={queryClient}>
        <AppTitle />
        <StatusBar style="dark" />
        <VercelAnalytics />
        <PageViewTracker />
        <AppShell>
          <PageTransition routeKey={pathname}>
            <MemberGate>
              <Slot />
            </MemberGate>
          </PageTransition>
        </AppShell>
        <GameFxLayer />
        <BreakLayer />
        <ChiikawaReact />
        <ChiikawaTapFx />
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
      {/* Manifest + chế độ standalone: iPhone chỉ nhận thông báo đẩy (nhắc học)
          khi Band 9 được "Thêm vào MH chính" như một web app. */}
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Band 9" />
    </Head>
  );
}
