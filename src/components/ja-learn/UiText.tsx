import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

/**
 * Chữ Việt của các màn Nhật dùng phông Nunito của app (nạp ở app/_layout.tsx).
 * RN-web không tự áp phông nên nếu không ghi `fontFamily` thì rơi về phông hệ thống (Segoe UI);
 * `fontWeight` đậm cũng chỉ là in đậm giả. Ở đây đổi độ đậm thành đúng tệp Nunito.
 * Chữ Hán/Nhật vẫn tự ghi `fontFamily` (HANZI_FAMILY) trong `style` và thắng phông mặc định.
 */
export function UiText({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const w = Number(flat.fontWeight ?? 400);
  const family = w >= 800 ? 'Nunito_400Regular' : w >= 600 ? 'Nunito_600SemiBold' : 'Nunito_400Regular';
  const { fontWeight: _drop, ...clean } = flat;
  return <Text {...rest} style={[{ fontFamily: family }, clean]} />;
}
