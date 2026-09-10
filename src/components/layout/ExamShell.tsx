import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridBackdrop } from './GridBackdrop';
import { Screen } from './Screen';

/**
 * Nền chung của cả bài thi SAT: giấy kẻ ô xanh tím, tràn viền.
 *
 * VÌ SAO CÓ. `AppShell` ẩn hết thanh điều hướng ở các đường dẫn làm bài và để
 * lại một nền `bg-paper-canvas` phẳng — ghi chú ngay trong nó nói rõ ý đồ: "màn
 * tác vụ TỰ VẼ nền tràn viền (nền lưới xanh tím)". Mọi màn tác vụ khác đều vẽ,
 * qua `TaskShell`. Bốn màn của bài thi SAT thì quên, nên chúng là bốn màn duy
 * nhất trong app nằm trên một mảng xám phẳng.
 *
 * KHÔNG DÙNG THẲNG `TaskShell` mà viết riêng, vì `TaskShell` kèm sẵn ba thứ mà
 * phòng thi không được có: một tiêu đề cố định, một đường về ở góc trái, và một
 * thanh phụ đề. Phòng thi tự vẽ tiêu đề của nó (có đồng hồ đếm ngược), và một
 * đường "quay lại" luôn hiện trong lúc đang tính giờ là lời mời bỏ dở bài.
 *
 * `SafeAreaView` nằm BÊN TRONG nền chứ không bọc ngoài: bọc ngoài thì máy có tai
 * thỏ sẽ có một dải trắng cắt ngang đỉnh, phía trên nền xanh tím.
 */
export function ExamShell({ children }: { children: React.ReactNode }) {
  return (
    <GridBackdrop>
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-1">
          <Screen>{children}</Screen>
        </View>
      </SafeAreaView>
    </GridBackdrop>
  );
}
