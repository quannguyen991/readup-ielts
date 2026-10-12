/**
 * Khối dùng chung của các màn retro: khối có viền mực và bóng lệch đặc, đúng kiểu thẻ
 * trong ảnh tham chiếu. Trang hồ sơ và cột điều hướng máy tính cùng dùng để giữ một kiểu khối.
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { RINK } from './retro-art';

export function Boxed({
  children,
  fill,
  radius = 20,
  shadowSize = 6,
  style,
}: {
  children: React.ReactNode;
  fill: string;
  radius?: number;
  shadowSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ position: 'relative' }, style]}>
      <View
        aria-hidden
        pointerEvents="none"
        style={{ position: 'absolute', top: shadowSize, left: shadowSize, right: -shadowSize, bottom: -shadowSize, borderRadius: radius, backgroundColor: RINK }}
      />
      <View style={{ borderRadius: radius, borderWidth: 3, borderColor: RINK, backgroundColor: fill, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}
