import React from 'react';
import { Platform, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { usePathname } from 'expo-router';
import { EaPageBackdrop, useEaPageSkin } from '@/components/vocab/eastasia/EaBackdrop';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackdrop } from './GridBackdrop';
import { MeshBackdrop } from './MeshBackdrop';
import { LightGrid, usePageBackground } from './LightGrid';
import { CUTE_PALETTES } from './cute-palettes';
import { BottomTabs, BottomTabsSpacer } from './BottomTabs';
import { Sidebar } from './Sidebar';
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
import { useSidebarStore } from '@/store/useSidebarStore';
import { useExamImmersive } from '@/store/useExamImmersive';
import { AskBubble } from '@/components/ai/AskBubble';
import { useAssistantDock } from '@/store/useAssistantDock';
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
import { ChineseBackdrop } from '@/components/vocab/chinese/ChineseBackdrop';
import { isChineseVocabRoute } from '@/components/vocab/chinese/route';
import { ZH } from '@/components/vocab/chinese/palette';
import { useHydrated } from './useHydrated';
import { useChiikawaActive } from '@/components/chiikawa/chiikawa';
import { FirstRunTour } from '@/components/onboarding/FirstRunTour';

/** Nội dung lùi chỗ cho thanh bên với chuyển động mượt (chỉ web). */
const SHIFT_TRANSITION = Platform.OS === 'web' ? ({ transition: 'padding-left 240ms cubic-bezier(0.2, 0.8, 0.2, 1)' } as unknown as ViewStyle) : undefined;

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
/** Nền trang mặc định: một màu phẳng, không loang. Nền người học tự chọn bằng sao vẫn đè lên. */
const PLAIN_PAGE_BG = '#F3F0FB';

function AppShellBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Kính của Thành Phố Tri Thức theo mốc chuỗi ngày — chạy ở mọi thiết bị.
  useStreakGlass();
  const focus = isFocusRoute(pathname);
  const examOpen = useExamImmersive((s) => s.on);
  const immersive = isImmersiveRoute(pathname) || examOpen;
  const cyberHackRoute = pathname === '/duel/hack';
  const isQuestRoute = pathname === '/quest' || pathname.startsWith('/quest/');
  // Thành phố 3D chiếm trọn màn: bong bóng trợ lý AI sẽ đè lên bảng điều hành.
  // Thành phố và Chuyến bay từ vựng có giao diện toàn màn hình riêng: không có bong bóng hỏi đáp.
  // Màn học từ đang có nền cảnh bay: thanh bên trong suốt, chỉ còn biểu tượng.
  const travelGlass = useTravelActive();
  // Khu Speaking (/hub) luôn mở rộng thanh bên; các màn thi vẫn là dải biểu tượng.
  const hubRoute = pathname.startsWith('/hub');
  const sentenceThemed = useSentenceThemeId() !== 'plain';
  const isCityRoute = pathname.startsWith('/quest/city') || pathname.startsWith('/quest/rail');
  // Vùng nội dung lùi đúng bằng bề rộng thanh bên (SIDEBAR_WIDTH), mở rộng hay thu gọn.
  const collapsed = useSidebarStore((st) => st.collapsed);
  const pageBg = usePageBackground('browse');
  // Bài từ vựng tiếng Trung: giấy kem Band 9 thay lưới pastel, thanh bên trong suốt.
  const zhRoute = isChineseVocabRoute(pathname);
  // Màn lộ trình HSK/JLPT: nền tràn viền theo skin người học chọn.
  const eaPage = useEaPageSkin();
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
  // Nền vàng kim loang đã tắt theo mẫu be trắng + thanh bên xám; bật lại thì đặt true.
  const goldSkin = false;
  // Khung trợ lý AI: cột bên phải chỉ ở màn rộng và không ở màn thi, thành phố, hub.
  const assistantDock = useAssistantDock((st) => st.mode);
  const { width: shellWidth } = useWindowDimensions();
  const dockable = !(isExamRoute(pathname) || isCityRoute || pathname.startsWith('/hub'));
  const dockChat = dockable && assistantDock === 'full' && shellWidth >= 1280;
  // Theme máy chơi điện tử (mua trong Đổi quà): Chikawa thay Leo ở bong bóng hỏi đáp.
  const arcadeTheme = useRewardStore((s) => s.theme === 'theme-arcade');
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
      <FocusBackdrop quest={isQuestRoute} navy={isVocabStudyRoute(pathname)} light={isTravelLightRoute(pathname) && (travelGlass || sentenceThemed)} gold={goldSkin} zh={zhRoute} ea={eaPage}>
        <View className="flex-1 lg:flex-row">
          <View className={`min-w-0 flex-1 ${hubRoute || (!isExamRoute(pathname) && !collapsed) ? 'lg:pl-[248px]' : 'lg:pl-[76px]'}`} style={SHIFT_TRANSITION}>
            {/* Màn thi / luyện từng bài: điện thoại không có thanh đầu trang của app (màn tự có thanh riêng). */}
            {isPhoneChromelessRoute(pathname) ? null : (
              <View className="lg:hidden" style={eaPage ? { backgroundColor: 'rgba(255,248,236,0.94)' } : undefined}>
                <TopBar />
              </View>
            )}
            <View className="flex-1">{children}</View>
          </View>
        </View>
        <CuteAtmosphere enabled={cuteEffects || chiikawaTheme} customImage={hydrated ? customMascotImage : null} />
        {/* Trợ lý AI ghim cả ở màn làm bài — chỉ ẩn khi đang thi (isExamRoute). */}
        {isExamRoute(pathname) || isCityRoute || pathname.startsWith('/hub') ? null : <AskBubble forceChiikawa={arcadeTheme} allowDock={false} />}
        <SelectionLookup />
        <SearchPalette />
      </FocusBackdrop>
    );
  }

  // Màn rộng: cột chat AI cố định bên phải (kiểu tham chiếu), trừ màn thi, màn thành phố và trang hub.

  return (
    <SafeAreaView
      edges={['top']}
      className="relative flex-1"
      // Màu nền đặt THẬT ở đây chứ không chỉ vẽ trong SVG: các phép đo độ
      // tương phản (và trình duyệt khi in) đọc `backgroundColor` của tổ tiên.
      style={[{ backgroundColor: isQuestRoute ? '#0B1A2E' : retro ? RCREAM : eaPage ? eaPage.c.bg : zhRoute ? ZH.paper : (pageBg?.stops[1] ?? PLAIN_PAGE_BG) }, px && !isQuestRoute ? pixelPageBg(px) : null] as never}
    >
      {/* Trang game (/quest…) nằm trên trời đêm pixel cùng bảng màu với thanh trận đấu. */}
      {isQuestRoute ? <GameBackdrop /> : null}
      {/*
        NỀN cho mọi màn duyệt, theo bảng màu người học chọn (giao diện mặc định là vàng loang).
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
          {eaPage ? (
            <EaPageBackdrop skin={eaPage} />
          ) : zhRoute ? (
            <ChineseBackdrop />
          ) : pageBg ? (
            <GridBackdrop colors={pageBg.stops} line={pageBg.line} pattern={pageBg.pattern} blobs={pageBg.blobs} margin={pageBg.margin} cell={pageBg.cell ?? 34} />
          ) : (
            <MeshBackdrop />
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
        <View className={`min-w-0 flex-1 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[248px]'}`} style={[SHIFT_TRANSITION, dockChat ? { paddingRight: 320 } : null]}>
          {/* Trang Hôm nay trên điện thoại tự vẽ đầu trang riêng (xem PhoneHome), nên không có TopBar. */}
          {phone && pathname === '/dashboard' ? null : (
            <View className="lg:hidden" style={eaPage ? { backgroundColor: 'rgba(255,248,236,0.94)' } : undefined}>
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
      <BottomTabs />
      {isCityRoute ? null : <AskBubble forceChiikawa={arcadeTheme} allowDock={dockable} />}
      <SelectionLookup />
      <ReminderRunner />
      <SearchPalette />
      <FirstRunTour />
    </SafeAreaView>
  );
}

/**
 * Thanh bên được vẽ ở MỘT chỗ cố định, nằm ngoài các nhánh bố cục của AppShellBody.
 * Trước đây thanh bên nằm trong từng nhánh (duyệt / tác vụ), mỗi lần đổi nhánh React
 * dựng lại nó từ đầu nên chuyển trang bị giật. Giờ nó được giữ nguyên qua mọi trang;
 * chỉ các prop (thu gọn, mở rộng, trong suốt) đổi theo trang.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const focus = isFocusRoute(pathname);
  const examOpen = useExamImmersive((s) => s.on);
  const hidden = pathname === '/duel/hack' || isImmersiveRoute(pathname) || examOpen;
  const hubRoute = pathname.startsWith('/hub');
  const travelGlass = useTravelActive();
  const retro = useRetroOn();
  return (
    <View className="flex-1">
      {hidden ? null : (
        <View className="hidden lg:flex" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40 }}>
          {!focus && retro ? (
            <RetroSidebar />
          ) : (
            <Sidebar compact={focus && isExamRoute(pathname)} expanded={focus && hubRoute} glass={focus && travelGlass} />
          )}
        </View>
      )}
      <AppShellBody>{children}</AppShellBody>
    </View>
  );
}

/**
 * Nền cho màn tập trung: lưới sáng mặc định, riêng trang game (Bản đồ ReadUp là
 * màn tập trung) thì trời đêm pixel — chữ trắng của bản đồ nằm trên nền lưới
 * sáng là gần như biến mất.
 */
/** Nền lưới pastel chung của mọi màn tác vụ: một lớp nền, nội dung đặt lên trên. */
function MeshShell({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1">
      <MeshBackdrop />
      {children}
    </View>
  );
}

function FocusBackdrop({ quest, navy, light, gold, zh, ea, children }: { quest: boolean; navy: boolean; light: boolean; gold: boolean; zh: boolean; ea?: import('@/components/vocab/eastasia/skins').EaSkin | null; children: React.ReactNode }) {
  const chiikawa = useChiikawaActive();
  // Trang bài học tiếng Trung / Nhật: nền tràn viền theo skin người học chọn.
  if (ea) return <View className="flex-1" style={{ backgroundColor: ea.c.bg }}><EaPageBackdrop skin={ea} />{children}</View>;
  // Bài từ vựng tiếng Trung: giấy kem Band 9 với núi mực, không lưới pastel.
  if (zh) return <View className="flex-1" style={{ backgroundColor: ZH.paper }}><ChineseBackdrop />{children}</View>;
  // Chép chính tả / viết câu: cảnh bay qua thành phố tông sáng (tắt thì về lưới sáng như cũ).
  if (light) return <TravelBackdrop color="#F3F0FB" tone="light">{children}</TravelBackdrop>;
  // Màn học từ: nền chàm kẻ ô, cùng màu với màn Đọc song ngữ.
  // Màn học từ: cảnh bay qua thành phố qua các thành phố (web, người dùng tắt được) — không thì nền chàm kẻ ô.
  if (navy) return chiikawa ? <LightGrid>{children}</LightGrid> : <TravelBackdrop color={STUDY_NAVY}>{children}</TravelBackdrop>;
  if (!quest) return gold ? <PhoneBackdrop>{children}</PhoneBackdrop> : <MeshShell>{children}</MeshShell>;
  return (
    <View className="flex-1 bg-[#07111F]">
      <GameBackdrop />
      {children}
    </View>
  );
}
