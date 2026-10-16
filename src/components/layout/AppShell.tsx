import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackdrop } from './GridBackdrop';
import { LightGrid, usePageBackground } from './LightGrid';
import { CUTE_PALETTES } from './cute-palettes';
import { BottomTabs, BottomTabsSpacer } from './BottomTabs';
import { Sidebar } from './Sidebar';
import { SidebarCats } from './SidebarCats';
import { RCREAM } from '@/components/profile-retro/retro-art';
import { pixelPageBg, usePixelTheme } from '@/components/pixel-theme/pixel-art';
import { useRetroOn } from '@/components/profile-retro/retro-mode-store';
import { RetroScope } from '@/components/profile-retro/retro-scope';
import { RetroSidebar } from '@/components/profile-retro/RetroSidebar';
import { RetroTopBar } from '@/components/profile-retro/RetroTopBar';
import { TopBar } from './TopBar';
import { OliveGrid } from './OliveGrid';
import { TravelBackdrop, useSentenceThemeId, useTravelActive } from '@/components/rail/TravelBackdrop';
import { isExamRoute, isFocusRoute, isImmersiveRoute, isPhoneChromelessRoute, isTravelLightRoute, isVocabStudyRoute } from '@/navigation/focus-routes';
import { SIDEBAR_WIDTH, useSidebarStore } from '@/store/useSidebarStore';
import { AskBubble } from '@/components/ai/AskBubble';
import { SelectionLookup } from '@/components/lookup/SelectionLookup';
import { GameBackdrop } from '@/components/game/GameBackdrop';
import { DomainMoveBanner } from './DomainMoveBanner';
import { useStreakGlass } from '@/services/city/useStreakGlass';
import { ReminderRunner } from '@/components/reminder/Reminder';
import { SearchPalette } from '@/components/search/SearchPalette';
import { useCuteAppearanceStore } from '@/store/useCuteAppearanceStore';
import { useRewardStore } from '@/store/useRewardStore';
import { CuteAtmosphere } from './CuteAtmosphere';
import { PhoneBackdrop, useIsPhone } from './PhoneBackdrop';
import { useHydrated } from './useHydrated';
import { WalkingCats } from '@/components/mascot/WalkingCats';
import { useChiikawaActive } from '@/components/chiikawa/chiikawa';

/** Nền chàm của màn học từ — đúng màu nền màn Đọc song ngữ. */
const STUDY_NAVY = '#0F1D33';

/**
 * Khung app dùng chung — cột điều hướng cố định bên trái trên desktop, thanh
 * ngang trên mobile.
 *
 * Hai chế độ:
 *
 *   Duyệt   — màn rộng: CỘT DỌC BÊN TRÁI, cả danh sách mục mở sẵn nên đi tới
 *             đâu cũng chỉ một cú bấm, không phải mở bảng "Khám phá" trước.
 *             Màn hẹp: vẫn là thanh ngang, vì cột dọc ăn mất nửa bề ngang của
 *             một màn điện thoại.
 *   Tập trung — vào bài vẫn giữ cột điều hướng cố định bên trái trên desktop,
 *             để người học luôn có đường về trang chủ; màn hẹp dùng TopBar.
 *
 * Việc chọn chế độ tra bằng đường dẫn (`isFocusRoute`) ngay tại đây, trước khi
 * màn con render, nên không có nhịp nào thanh nav kịp hiện rồi biến mất.
 *
 * Ẩn/hiện theo khổ màn vẫn làm bằng breakpoint của NativeWind (media query trên
 * web) chứ không đo width bằng JS: bản render phía máy chủ không biết kích
 * thước màn thật, đo bằng JS thì điện thoại sẽ thấy layout desktop trong lúc
 * chờ hydrate.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Kính của Thành Phố Tri Thức theo mốc chuỗi ngày — chạy ở mọi thiết bị.
  useStreakGlass();
  const focus = isFocusRoute(pathname);
  const immersive = isImmersiveRoute(pathname);
  const cyberHackRoute = pathname === '/duel/hack';
  const isQuestRoute = pathname === '/quest' || pathname.startsWith('/quest/');
  // Thành phố 3D chiếm trọn màn: bong bóng trợ lý AI sẽ đè lên bảng điều hành.
  // Thành phố và Chuyến bay từ vựng có giao diện toàn màn hình riêng: không có bong bóng hỏi đáp.
  // Màn học từ đang có nền cảnh bay: thanh bên trong suốt, chỉ còn biểu tượng.
  const travelGlass = useTravelActive();
  const sentenceThemed = useSentenceThemeId() !== 'plain';
  const isCityRoute = pathname.startsWith('/quest/city') || pathname.startsWith('/quest/rail');
  // Vùng nội dung lùi đúng bằng bề rộng thanh bên (SIDEBAR_WIDTH), mở rộng hay thu gọn.
  const collapsed = useSidebarStore((st) => st.collapsed);
  const pageBg = usePageBackground('browse');
  const cuteEffects = useCuteAppearanceStore((state) => state.effectsEnabled);
  const chiikawaTheme = useRewardStore((state) => state.theme === 'theme-chiikawa');
  const customMascotImage = useCuteAppearanceStore((state) => state.customMascotImage);
  const hydrated = useHydrated();
  const paletteKey = useCuteAppearanceStore((state) => state.palette);
  const selectedPalette = CUTE_PALETTES[paletteKey];
  const px = usePixelTheme();
  const palette = chiikawaTheme ? CUTE_PALETTES.strawberry : px ? px.palette : selectedPalette;
  // Điện thoại dùng nền gradient xanh–tím riêng khi chưa chọn nền học mua bằng sao.
  const phone = useIsPhone();
  // Nền vàng kim như điện thoại: luôn bật trên điện thoại; trên máy tính chỉ khi giữ bảng màu
  // mặc định và không bật theme Chiikawa (bảng màu khác vẫn giữ lưới caro).
  // Giao diện pixel tự vẽ nền và thẻ riêng nên tắt nền vàng kim (và các mèo đi kèm).
  const pixel = px !== null;
  const goldSkin = !pixel && (phone || (!chiikawaTheme && paletteKey === 'original'));
  const viewportWidth = useWindowDimensions().width;
  // Giao diện retro áp cho mọi khung duyệt; khung tác vụ và khung toàn màn giữ nguyên.
  const retro = useRetroOn();

  // Cyber Hack is a full-screen arcade match. The game draws its own HUD and
  // background, so the study navigation and page chrome must not surround it.
  if (cyberHackRoute) {
    return <View className="flex-1" style={{ backgroundColor: '#170D2B' }}>{children}</View>;
  }

  if (immersive) {
    // Phòng thi Reading tự vẽ thanh trên và phủ trọn màn: chỉ cần nền, không khung điều hướng.
    return (
      <View className="flex-1" style={{ position: 'relative', backgroundColor: palette.study[0] }}>
        {children}
        <CuteAtmosphere enabled={cuteEffects || chiikawaTheme} customImage={hydrated ? customMascotImage : null} />
      </View>
    );
  }

  if (focus) {
    /*
      NỀN LƯỚI SÁNG LÀ MẶC ĐỊNH của mọi màn tác vụ, vẽ ngay ở đây.

      Trước đây chỗ này là `bg-paper-canvas` — một mảng xám phẳng — với giao hẹn
      ngầm rằng màn con "tự vẽ nền tràn viền". Giao hẹn ngầm thì có màn nhớ có
      màn quên: chín màn vẽ qua `TaskShell`, còn màn đọc, màn xem lại, màn tra
      từ và màn thi SAT thì nằm trần trên mảng xám ấy hàng tháng trời.

      Đặt mặc định ở đây thì quên là không quên được nữa. Màn nào muốn nền khác
      (`TaskShell` tông tối, `ExamShell` lưới xanh tím) vẫn vẽ đè lên bình
      thường — nền của chúng tràn viền nên phủ kín cái này.

      Vẫn KHÔNG có `SafeAreaView edges={['top']}`: phần chèn an toàn phải nằm
      BÊN TRONG nền, không phải một dải trắng cắt ngang phía trên.
    */
    return (
      <FocusBackdrop quest={isQuestRoute} navy={isVocabStudyRoute(pathname)} light={isTravelLightRoute(pathname) && (travelGlass || sentenceThemed)} gold={goldSkin}>
        <View className="flex-1 lg:flex-row">
          <View
            className="hidden lg:flex"
            style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40 }}
          >
            <Sidebar compact glass={travelGlass} />
          </View>
          <View className="min-w-0 flex-1 lg:pl-[76px]">
            {/* Màn thi / luyện từng bài: điện thoại không có thanh đầu trang của app (màn tự có thanh riêng). */}
            {isPhoneChromelessRoute(pathname) ? null : (
              <View className="lg:hidden">
                <TopBar />
              </View>
            )}
            <View className="flex-1">{children}</View>
          </View>
        </View>
        <CuteAtmosphere enabled={cuteEffects || chiikawaTheme} customImage={hydrated ? customMascotImage : null} />
        {/* Trợ lý AI ghim cả ở màn làm bài — chỉ ẩn khi đang thi (isExamRoute). */}
        {isExamRoute(pathname) || isCityRoute || pathname.startsWith('/hub') ? null : <AskBubble />}
        <SelectionLookup />
        <SearchPalette />
      </FocusBackdrop>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      className="relative flex-1"
      // Màu nền đặt THẬT ở đây chứ không chỉ vẽ trong SVG: các phép đo độ
      // tương phản (và trình duyệt khi in) đọc `backgroundColor` của tổ tiên.
      style={[{ backgroundColor: isQuestRoute ? '#0B1A2E' : retro ? RCREAM : (pageBg?.stops[1] ?? palette.browse[1]) }, px && !isQuestRoute ? pixelPageBg(px) : null] as never}
    >
      {/* Trang game (/quest…) nằm trên trời đêm pixel cùng bảng màu với thanh trận đấu. */}
      {isQuestRoute ? <GameBackdrop /> : null}
      {/*
        NỀN PASTEL KẺ CARO cho mọi màn duyệt, theo bảng màu người học chọn.
        Thẻ trắng vẫn có ranh giới rõ, còn hoạ tiết đứng yên để làm nền mà
        không tranh chú ý với nội dung.
      */}
      {!isQuestRoute && !retro && goldSkin && !pageBg ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <PhoneBackdrop />
        </View>
      ) : null}
      {!isQuestRoute && !retro && !pixel && !(goldSkin && !pageBg) ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Nền học / giao diện đổi bằng sao áp dụng cho MỌI trang; không có thì nền xanh mặc định. */}
          {pageBg ? (
            <GridBackdrop colors={pageBg.stops} line={pageBg.line} pattern={pageBg.pattern} blobs={pageBg.blobs} margin={pageBg.margin} cell={pageBg.cell ?? 34} />
          ) : (
            <GridBackdrop colors={palette.browse} line={palette.browseLine} blobs={[palette.browse[0], palette.browse[2]]} />
          )}
        </View>
      ) : null}
      {/*
        Ẩn/hiện theo breakpoint của NativeWind chứ không đo width bằng JS: bản
        render phía máy chủ không biết màn thật rộng bao nhiêu.
      */}
      <View className="flex-1 lg:flex-row">
        {/* zIndex ở ĐÂY nữa, không chỉ trong Sidebar: thẻ bung ra nằm trong khung
            này, mà khung nội dung là anh em đứng sau nên vẽ đè lên. */}
        <View
          className="hidden lg:flex"
          style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40 }}
        >
          {retro ? <RetroSidebar /> : <Sidebar />}
          {/* Mèo leo mép phải thanh bên trên máy tính, khi đang dùng nền vàng kim. */}
          {goldSkin && !retro ? <SidebarCats /> : null}
        </View>
        <View className={`min-w-0 flex-1 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[248px]'}`}>
          {/* Trang Hôm nay trên điện thoại tự vẽ đầu trang riêng (xem PhoneHome), nên không có TopBar. */}
          {phone && pathname === '/dashboard' ? null : (
            <View className="lg:hidden">
              {retro ? <RetroTopBar /> : <TopBar />}
            </View>
          )}
          {/* Không chen quảng cáo vào màn đang làm bài. */}
          <DomainMoveBanner />
          <RetroScope value={retro}>
            <View className="flex-1">{children}</View>
          </RetroScope>
          <BottomTabsSpacer />
        </View>
      </View>
      <CuteAtmosphere enabled={cuteEffects || chiikawaTheme} customImage={hydrated ? customMascotImage : null} />
      {/* Đàn mèo đi dạo trên nền vàng kim (chỉ máy tính): trên điện thoại mèo đã bám ở thanh tab, thêm đàn đi dạo thì rối. */}
      {goldSkin && !retro && !pageBg && !isQuestRoute && !phone ? (
        <WalkingCats bottom={phone ? 74 : 14} left={viewportWidth >= 1024 ? SIDEBAR_WIDTH[collapsed ? 'collapsed' : 'expanded'] : 0} variant={phone ? 'phone' : 'desktop'} />
      ) : null}
      <BottomTabs />
      {isCityRoute ? null : <AskBubble />}
      <SelectionLookup />
      <ReminderRunner />
      <SearchPalette />
    </SafeAreaView>
  );
}

/**
 * Nền cho màn tập trung: lưới sáng mặc định, riêng trang game (Bản đồ ReadUp là
 * màn tập trung) thì trời đêm pixel — chữ trắng của bản đồ nằm trên nền lưới
 * sáng là gần như biến mất.
 */
function FocusBackdrop({ quest, navy, light, gold, children }: { quest: boolean; navy: boolean; light: boolean; gold: boolean; children: React.ReactNode }) {
  const chiikawa = useChiikawaActive();
  // Chép chính tả / viết câu: cảnh bay qua thành phố tông sáng (tắt thì về lưới sáng như cũ).
  if (light) return <TravelBackdrop color="#FBF6EE" tone="light">{children}</TravelBackdrop>;
  // Màn học từ: nền chàm kẻ ô, cùng màu với màn Đọc song ngữ.
  // Màn học từ: cảnh bay qua thành phố qua các thành phố (web, người dùng tắt được) — không thì nền chàm kẻ ô.
  if (navy) return chiikawa ? <LightGrid>{children}</LightGrid> : <TravelBackdrop color={STUDY_NAVY}>{children}</TravelBackdrop>;
  if (!quest) return gold ? <PhoneBackdrop>{children}</PhoneBackdrop> : <LightGrid>{children}</LightGrid>;
  return (
    <View className="flex-1 bg-[#07111F]">
      <GameBackdrop />
      {children}
    </View>
  );
}
