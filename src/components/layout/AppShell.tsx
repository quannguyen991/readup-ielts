import React from 'react';
import { View } from 'react-native';
import { usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from './AuroraBackground';
import { LightGrid } from './LightGrid';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { isFocusRoute } from '@/navigation/focus-routes';
import { AskBubble } from '@/components/ai/AskBubble';

/**
 * Khung app dùng chung — một cột dọc bên trái, một thanh ngang, hoặc không có gì.
 *
 * Hai chế độ:
 *
 *   Duyệt   — màn rộng: CỘT DỌC BÊN TRÁI, cả danh sách mục mở sẵn nên đi tới
 *             đâu cũng chỉ một cú bấm, không phải mở bảng "Khám phá" trước.
 *             Màn hẹp: vẫn là thanh ngang, vì cột dọc ăn mất nửa bề ngang của
 *             một màn điện thoại.
 *   Tập trung — vào bài thì KHÔNG vẽ thanh nào. Đang bấm giờ làm bài mà cạnh
 *             màn hình vẫn có mười lối rẽ là lời mời bỏ dở; đường về nằm trong
 *             chính màn bài, dưới dạng một liên kết "quay lại" duy nhất.
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
    return <LightGrid>{children}</LightGrid>;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      {/*
        Nền loang nằm ở đây chứ không ở trong `Screen`: `Screen` bị gắn lại mỗi
        lần đổi trang, nên đặt trong đó thì các vệt màu nhảy về vị trí đầu sau
        mỗi cú điều hướng. Ở AppShell nó sống suốt phiên và trôi liên tục.
      */}
      <AuroraBackground />
      {/*
        Ẩn/hiện theo breakpoint của NativeWind chứ không đo width bằng JS: bản
        render phía máy chủ không biết màn thật rộng bao nhiêu.
      */}
      <View className="flex-1 lg:flex-row">
        {/* zIndex ở ĐÂY nữa, không chỉ trong Sidebar: thẻ bung ra nằm trong khung
            này, mà khung nội dung là anh em đứng sau nên vẽ đè lên. */}
        <View className="hidden lg:flex" style={{ zIndex: 40 }}>
          <Sidebar />
        </View>
        <View className="min-w-0 flex-1">
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
