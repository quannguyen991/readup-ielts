import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabs } from './BottomTabs';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

/**
 * Khung app dùng chung:
 * - Rộng ≥ 1024px: top nav ngang + sidebar trái cố định (như 5 ảnh tham chiếu)
 * - Hẹp hơn: top nav gọn + bottom tabs 5 mục + tab More
 *
 * Việc ẩn/hiện làm bằng breakpoint của NativeWind (media query trên web) chứ
 * không đo width bằng JS: bản render phía server không biết kích thước màn hình
 * thật nên nếu đo bằng JS, điện thoại sẽ thấy layout desktop trong lúc chờ
 * hydrate.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <TopNav />

      <View className="flex-1 flex-row">
        <View className="hidden lg:flex">
          <Sidebar />
        </View>
        <View className="flex-1">{children}</View>
      </View>

      <View className="lg:hidden">
        <BottomTabs />
      </View>
    </SafeAreaView>
  );
}
