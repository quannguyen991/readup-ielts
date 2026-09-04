import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { layout } from '@/theme/tokens';

type ScreenProps = {
  children: React.ReactNode;
  /** Tắt scroll khi màn hình tự quản lý vùng cuộn (ví dụ màn hình đọc 2 cột). */
  scroll?: boolean;
};

/** Vùng nội dung của mọi trang: nền xám nhạt, padding và bề rộng tối đa thống nhất. */
export function Screen({ children, scroll = true }: ScreenProps) {
  const inner = (
    <View
      className="w-full self-center px-4 py-4 lg:px-6 lg:py-6"
      style={{ maxWidth: layout.contentMaxWidth }}
    >
      {children}
    </View>
  );

  /*
    Vùng nội dung KHÔNG tự tô nền nữa.

    Trước đây mỗi màn tô đè một lớp `bg-canvas` đục, và nền loang ở AppShell nằm
    ngay dưới lớp ấy — có cũng như không. Màu nền giờ do AppShell lo; thẻ và
    bảng vẫn dùng `bg-surface` trắng đục nên chữ vẫn nằm trên nền phẳng, dễ đọc.
  */
  if (!scroll) return <View className="flex-1">{inner}</View>;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  );
}

/** Trang chưa dựng ở bước hiện tại — nêu rõ bước nào sẽ hoàn thiện nó. */
export function PlaceholderScreen({ title, note }: { title: string; note: string }) {
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{title}</Text>
      <View className="mt-4 rounded-card border border-dashed border-borderStrong bg-surface p-6">
        <Text className="font-sans text-bodyLg text-muted">{note}</Text>
      </View>
    </Screen>
  );
}
