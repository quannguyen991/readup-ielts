import React from 'react';
import { View } from 'react-native';
import { usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from './AuroraBackground';
import { TopBar } from './TopBar';
import { isFocusRoute } from '@/navigation/focus-routes';
import { AskBubble } from '@/components/ai/AskBubble';

/**
 * Khung app dùng chung — MỘT thanh ngang, hoặc không có gì cả.
 *
 * Hai chế độ:
 *
 *   Duyệt   — `TopBar` trên đỉnh, mọi khổ màn như nhau. Trước đây chỗ này có
 *             sidebar 244px ở desktop và header + bottom tabs ở mobile: ba bộ
 *             khung cho cùng một việc, và ở desktop thì cột trái ăn mất chiều
 *             ngang của chính nội dung.
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
    // Không SafeAreaView `edges={['top']}` ở đây: màn tác vụ tự vẽ nền tràn
    // viền (nền lưới xanh tím), nên phần chèn an toàn phải nằm BÊN TRONG nền
    // đó, không phải một dải trắng cắt ngang phía trên.
    return <View className="flex-1 bg-paper-canvas">{children}</View>;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      {/*
        Nền loang nằm ở đây chứ không ở trong `Screen`: `Screen` bị gắn lại mỗi
        lần đổi trang, nên đặt trong đó thì các vệt màu nhảy về vị trí đầu sau
        mỗi cú điều hướng. Ở AppShell nó sống suốt phiên và trôi liên tục.
      */}
      <AuroraBackground />
      <TopBar />
      <View className="flex-1">{children}</View>
      {/*
        Bong bóng hỏi nhanh chỉ sống ở nhánh này, tức là ở màn KHÔNG phải làm bài.
        Nhánh `focus` phía trên trả về sớm và không gắn nó — giữa lúc đang tính
        giờ làm đề mà có nút "hỏi AI" cạnh màn hình thì đó không còn là thi thử.
      */}
      <AskBubble />
    </SafeAreaView>
  );
}
