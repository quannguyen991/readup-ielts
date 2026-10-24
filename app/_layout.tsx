import '../global.css';
import '@/lib/nativewind-interop';

import React, { useEffect, useState } from 'react';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
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
// Be Vietnam Pro: phông chính của app (các class font-sans/mid/semi/strong/heavy, xem tailwind.config.js).
// Thiết kế riêng cho tiếng Việt, dấu rõ và đều ở mọi cỡ chữ.
// Nạp từng trọng lượng theo đường dẫn riêng: gói gom tất cả (index gốc) kéo theo cả biến thể
// Italic có file thiếu trong bản 0.4.1, làm Metro lỗi khi build.
// Inter: phông chính của Band 9 (21/10/2026) — gọn, mỏng hơn, gần cảm giác của phông hệ Apple.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
// Inter Tight: phông tiêu đề (display) — chữ to, khoảng cách hẹp, nét gọn kiểu Apple.
import { InterTight_600SemiBold } from '@expo-google-fonts/inter-tight/600SemiBold';
import { InterTight_500Medium } from '@expo-google-fonts/inter-tight/500Medium';
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { BeVietnamPro_800ExtraBold } from '@expo-google-fonts/be-vietnam-pro/800ExtraBold';
// Nunito: font bo tròn cho giao diện trang chủ kiểu nhân vật (xem src/components/cute-home).
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

import { AppShell } from '@/components/layout/AppShell';
import { RewardOverlay } from '@/components/gamify/RewardOverlay';
import { MemberGate } from '@/components/access/MemberGate';
import { GameFxLayer } from '@/components/game/GameFxLayer';
import { BreakLayer } from '@/components/break/BreakLayer';
import { ChiikawaReact } from '@/components/chiikawa/ChiikawaReact';
import { ChiikawaTapFx } from '@/components/chiikawa/ChiikawaTapFx';
import { PageTransition } from '@/components/motion/Motion';
import { PageViewTracker } from '@/services/analytics/PageViewTracker';
import { VercelAnalytics } from '@/services/analytics/VercelAnalytics';
import { useAnalyticsBootstrap } from '@/services/analytics/useAnalytics';
import { useSfxBindings } from '@/services/audio/useSfxBindings';
import { useAuthBootstrap } from '@/store/useAuthStore';
import { useSyncBootstrap } from '@/store/useSyncStore';
import { installLocaleFetch } from '@/i18n/fetch-locale';
import { useHydrated } from '@/components/layout/useHydrated';
import { useRewardStore } from '@/store/useRewardStore';
import { setPaletteId } from '@/theme/palette-state';
import { startStreakBonus } from '@/services/activity/streak-bonus';

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
  useAnalyticsBootstrap(pathname);

  // Don't block the entire app on web font downloads. If one font request stalls,
  // keep the interface usable with platform fallbacks and swap to branded fonts
  // as soon as useFonts finishes loading them.
  useFonts({
    InterTight_500Medium,
    InterTight_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
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
  // Thưởng mốc chuỗi ngày: theo dõi nhật ký học để cộng sao đúng lúc đạt mốc, kể cả khi người học không mở trang Tiến độ.
  useEffect(() => startStreakBonus(), []);
  const hydrated = useHydrated();
  // Sau khi đọc xong dữ liệu máy: chuyển lịch Leitner cũ sang thẻ FSRS chung (một lần, có sao lưu).
  useEffect(() => {
    if (hydrated) useTopicStudyStore.getState().migrateToSingleSchedule();
  }, [hydrated]);
  const themeId = useRewardStore((s) => s.theme);
  const paletteKey = hydrated && themeId === 'theme-chiikawa' ? 'chiikawa' : hydrated && themeId === 'theme-pixel' ? 'pixel' : hydrated && themeId === 'theme-cyber' ? 'cyber' : 'classic';
  setPaletteId(paletteKey);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('theme-chiikawa', paletteKey === 'chiikawa');
    document.documentElement.classList.toggle('theme-pixel', paletteKey === 'pixel');
    document.documentElement.classList.toggle('theme-cyber', paletteKey === 'cyber');
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
        <RewardOverlay />
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
      {/* Nạp phông Be Vietnam Pro qua Google Fonts để web hiển thị ngay tức thì, đồng bộ mọi thiết bị */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
        rel="stylesheet"
      />
      {/* Manifest + chế độ standalone: iPhone chỉ nhận thông báo đẩy (nhắc học)
          khi Band 9 được "Thêm vào MH chính" như một web app. */}
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Band 9" />
    </Head>
  );
}
