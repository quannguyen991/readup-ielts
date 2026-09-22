import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';


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
      <View
        className="items-center justify-center rounded-panel bg-white"
        style={{ height: 36, width: 36 }}
      >
        <Image
          source={require('../../../assets/brand/readup-logo-mark.png')}
          contentFit="contain"
          style={{ width: 31, height: 31 }}
          accessibilityIgnoresInvertColors
        />
      </View>
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
