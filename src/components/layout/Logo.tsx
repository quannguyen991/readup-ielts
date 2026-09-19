import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/ui/Icon';
import { color, gradient } from '@/theme/tokens';

/**
 * Logo — tách khỏi thanh điều hướng vì giờ có hai chỗ dùng: sidebar ở desktop
 * và thanh đầu trang ở mobile.
 *
 * Tên là "ReadUp", không kèm "IELTS": app giờ dạy cả SAT Math, nên gắn tên một
 * kỳ thi vào thương hiệu là tự bó hẹp lại và nói sai về thứ bên trong.
 */
export function Logo({
  compact = false,
  markOnly = false,
}: {
  compact?: boolean;
  /** Chỉ vẽ biểu tượng, bỏ chữ — cột dọc lúc thu gọn. */
  markOnly?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      <LinearGradient
        colors={[...gradient.primaryButton]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }}
      >
        <Icon name="book" size={20} color={color.white} strokeWidth={1.9} />
      </LinearGradient>
      {markOnly ? null : (
        <Text
          className={`font-heavy text-ink ${compact ? 'text-cardTitle' : 'text-sectionTitle'}`}
        >
          ReadUp
        </Text>
      )}
    </View>
  );
}
