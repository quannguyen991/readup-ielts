import React from 'react';
import { View } from 'react-native';
import { usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CANVAS_LINE, CANVAS_STOPS, GridBackdrop } from './GridBackdrop';
import { LightGrid } from './LightGrid';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { isFocusRoute } from '@/navigation/focus-routes';
import { useSidebarStore } from '@/store/useSidebarStore';
import { AskBubble } from '@/components/ai/AskBubble';
import { GameBackdrop } from '@/components/game/GameBackdrop';

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
  const focus = isFocusRoute(pathname);
  const isQuestRoute = pathname === '/quest' || pathname.startsWith('/quest/');
  // Vùng nội dung lùi đúng bằng bề rộng thanh bên (SIDEBAR_WIDTH), mở rộng hay thu gọn.
  const collapsed = useSidebarStore((st) => st.collapsed);

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
      <FocusBackdrop quest={isQuestRoute}>
        <View className="flex-1 lg:flex-row">
          <View
            className="hidden lg:flex"
            style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40 }}
          >
            <Sidebar compact />
          </View>
          <View className="min-w-0 flex-1 lg:pl-[76px]">
            <View className="lg:hidden">
              <TopBar />
            </View>
            <View className="flex-1">{children}</View>
          </View>
        </View>
      </FocusBackdrop>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      className="relative flex-1"
      // Màu nền đặt THẬT ở đây chứ không chỉ vẽ trong SVG: các phép đo độ
      // tương phản (và trình duyệt khi in) đọc `backgroundColor` của tổ tiên.
      style={{ backgroundColor: isQuestRoute ? '#15113A' : CANVAS_STOPS[1] }}
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
          <GridBackdrop colors={CANVAS_STOPS} line={CANVAS_LINE} />
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
          <View className="flex-1">{children}</View>
        </View>
      </View>
      {/*
        Bong bóng hỏi nhanh chỉ sống ở nhánh này, tức là ở màn KHÔNG phải làm bài.
        Nhánh `focus` phía trên trả về sớm và không gắn nó — giữa lúc đang tính
        giờ làm đề mà có nút "hỏi AI" cạnh màn hình thì đó không còn là thi thử.
      */}
      <AskBubble />
    </SafeAreaView>
  );
}

/**
 * Nền cho màn tập trung: lưới sáng mặc định, riêng trang game (Bản đồ ReadUp là
 * màn tập trung) thì trời đêm pixel — chữ trắng của bản đồ nằm trên nền lưới
 * sáng là gần như biến mất.
 */
function FocusBackdrop({ quest, children }: { quest: boolean; children: React.ReactNode }) {
  if (!quest) return <LightGrid>{children}</LightGrid>;
  return (
    <View className="flex-1 bg-[#07061A]">
      <GameBackdrop />
      {children}
    </View>
  );
}
