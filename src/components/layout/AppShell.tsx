import React from 'react';
import { View } from 'react-native';
import { usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CANVAS_LINE, CANVAS_STOPS, GridBackdrop } from './GridBackdrop';
import { LightGrid, usePageBackground } from './LightGrid';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { OliveGrid } from './OliveGrid';
import { TravelBackdrop, useTravelBackdropOn } from '@/components/rail/TravelBackdrop';
import { isExamRoute, isFocusRoute, isVocabStudyRoute } from '@/navigation/focus-routes';
import { useSidebarStore } from '@/store/useSidebarStore';
import { AskBubble } from '@/components/ai/AskBubble';
import { SelectionLookup } from '@/components/lookup/SelectionLookup';
import { GameBackdrop } from '@/components/game/GameBackdrop';
import { ZaloPromoBanner } from './ZaloPromoBanner';
import { useStreakGlass } from '@/services/city/useStreakGlass';
import { PromoGiftOverlay } from '@/components/promo/PromoGiftOverlay';
import { ReminderRunner } from '@/components/reminder/Reminder';

/** Nền chàm của màn học từ — đúng màu nền màn Đọc song ngữ. */
const STUDY_NAVY = '#2B3668';

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
  const isQuestRoute = pathname === '/quest' || pathname.startsWith('/quest/');
  // Thành phố 3D chiếm trọn màn: bong bóng trợ lý AI sẽ đè lên bảng điều hành.
  // Thành phố và Chuyến tàu từ vựng có giao diện toàn màn hình riêng: không có bong bóng hỏi đáp.
  // Màn học từ đang có nền toa tàu: thanh bên trong suốt, chỉ còn biểu tượng.
  const travelOn = useTravelBackdropOn();
  const travelGlass = travelOn && isVocabStudyRoute(pathname);
  const isCityRoute = pathname.startsWith('/quest/city') || pathname.startsWith('/quest/rail');
  // Vùng nội dung lùi đúng bằng bề rộng thanh bên (SIDEBAR_WIDTH), mở rộng hay thu gọn.
  const collapsed = useSidebarStore((st) => st.collapsed);
  const pageBg = usePageBackground('browse');

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
      <FocusBackdrop quest={isQuestRoute} navy={isVocabStudyRoute(pathname)}>
        <View className="flex-1 lg:flex-row">
          <View
            className="hidden lg:flex"
            style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40 }}
          >
            <Sidebar compact glass={travelGlass} />
          </View>
          <View className="min-w-0 flex-1 lg:pl-[76px]">
            <View className="lg:hidden">
              <TopBar />
            </View>
            <View className="flex-1">{children}</View>
          </View>
        </View>
        {/* Trợ lý AI ghim cả ở màn làm bài — chỉ ẩn khi đang thi (isExamRoute). */}
        {isExamRoute(pathname) || isCityRoute ? null : <AskBubble />}
        <SelectionLookup />
      </FocusBackdrop>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      className="relative flex-1"
      // Màu nền đặt THẬT ở đây chứ không chỉ vẽ trong SVG: các phép đo độ
      // tương phản (và trình duyệt khi in) đọc `backgroundColor` của tổ tiên.
      style={{ backgroundColor: isQuestRoute ? '#15113A' : (pageBg?.stops[1] ?? CANVAS_STOPS[1]) }}
    >
      {/* Trang game (/quest…) nằm trên trời đêm pixel cùng bảng màu với thanh trận đấu. */}
      {isQuestRoute ? <GameBackdrop /> : null}
      {/*
        NỀN XANH KẺ CARO cho mọi màn duyệt (xem `CANVAS_STOPS`). Trước đây là
        mảng xám bạc phẳng: thẻ trắng nằm trên nền gần trắng thì không còn ranh
        giới nào. Nền loang xanh tím cũ thì ngược lại — các vệt màu trôi liên
        tục tranh chú ý với nội dung. Ô kẻ đứng yên, chỉ làm nền có bề mặt.
      */}
      {!isQuestRoute ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Nền học / giao diện đổi bằng sao áp dụng cho MỌI trang; không có thì nền xanh mặc định. */}
          {pageBg ? (
            <GridBackdrop colors={pageBg.stops} line={pageBg.line} pattern={pageBg.pattern} blobs={pageBg.blobs} margin={pageBg.margin} cell={pageBg.cell ?? 34} />
          ) : (
            <GridBackdrop colors={CANVAS_STOPS} line={CANVAS_LINE} />
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
          <Sidebar />
        </View>
        <View className={`min-w-0 flex-1 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[248px]'}`}>
          <View className="lg:hidden">
            <TopBar />
          </View>
          {/* Không chen quảng cáo vào màn đang làm bài. */}
          {focus ? null : <ZaloPromoBanner />}
          <View className="flex-1">{children}</View>
        </View>
      </View>
      {isCityRoute ? null : <AskBubble />}
      <SelectionLookup />
      {/* Quà cuối tháng 9 (+2.000 sao, 7 ngày Pro) — phủ màn hình ở trang duyệt, không chen vào màn làm bài. */}
      <PromoGiftOverlay />
      <ReminderRunner />
    </SafeAreaView>
  );
}

/**
 * Nền cho màn tập trung: lưới sáng mặc định, riêng trang game (Bản đồ ReadUp là
 * màn tập trung) thì trời đêm pixel — chữ trắng của bản đồ nằm trên nền lưới
 * sáng là gần như biến mất.
 */
function FocusBackdrop({ quest, navy, children }: { quest: boolean; navy: boolean; children: React.ReactNode }) {
  // Màn học từ: nền chàm kẻ ô, cùng màu với màn Đọc song ngữ.
  // Màn học từ: cảnh tàu chạy qua các thành phố (web, người dùng tắt được) — không thì nền chàm kẻ ô.
  if (navy) return <TravelBackdrop color={STUDY_NAVY}>{children}</TravelBackdrop>;
  if (!quest) return <LightGrid>{children}</LightGrid>;
  return (
    <View className="flex-1 bg-[#07061A]">
      <GameBackdrop />
      {children}
    </View>
  );
}
