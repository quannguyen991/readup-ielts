import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Pattern, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Nền giấy kẻ ô, tông xanh dương loang sang tím.
 *
 * Ba lớp chồng lên nhau, vẽ trong CÙNG MỘT thẻ `<Svg>`:
 *
 *   1. Nền chuyển màu chéo xanh → chàm → tím.
 *   2. Hai vệt loang tròn mờ (một xanh sáng ở trên trái, một hồng tím ở dưới
 *      phải) để mặt nền không phẳng lì như một khối màu đặc.
 *   3. Lưới kẻ ô mảnh phủ đều lên trên.
 *
 * Vẽ bằng `<Pattern>` và `<RadialGradient>` của react-native-svg chứ không lát
 * ảnh nền: pattern là vector nên nét kẻ mảnh đều nhau ở mọi mật độ điểm ảnh, và
 * không phải nạp thêm tệp nào. Cách lát ảnh PNG sẽ mờ trên màn Retina và phải
 * kèm ba kích cỡ.
 *
 * Cả ba lớp nằm dưới cùng, `pointerEvents="none"`, nên không chắn thao tác chạm
 * của nội dung phía trên.
 */

/** Xanh dương đậm → chàm → tím. Đủ tối để chữ trắng và thẻ giấy sáng nổi lên. */
const BASE_STOPS = ['#1E3A9E', '#3B3BBF', '#6D28D9'] as const;

export function GridBackdrop({
  cell = 34,
  colors = BASE_STOPS,
  line = 'rgba(255,255,255,0.12)',
  children,
}: {
  cell?: number;
  colors?: readonly string[];
  line?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors[0] }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="grid-base" x1="0" y1="0" x2="1" y2="1">
              {colors.map((stop, index) => (
                <Stop
                  key={index}
                  offset={colors.length === 1 ? 0 : index / (colors.length - 1)}
                  stopColor={stop}
                />
              ))}
            </LinearGradient>

            <RadialGradient id="grid-blob-a" cx="0.5" cy="0.5" r="0.5">
              <Stop offset={0} stopColor="#60A5FA" stopOpacity={0.45} />
              <Stop offset={1} stopColor="#60A5FA" stopOpacity={0} />
            </RadialGradient>

            <RadialGradient id="grid-blob-b" cx="0.5" cy="0.5" r="0.5">
              <Stop offset={0} stopColor="#C084FC" stopOpacity={0.4} />
              <Stop offset={1} stopColor="#C084FC" stopOpacity={0} />
            </RadialGradient>

            <Pattern id="grid-cell" width={cell} height={cell} patternUnits="userSpaceOnUse">
              <Path d={`M ${cell} 0 L 0 0 L 0 ${cell}`} fill="none" stroke={line} strokeWidth={1} />
            </Pattern>
          </Defs>

          <Rect x={0} y={0} width="100%" height="100%" fill="url(#grid-base)" />

          {/* Vệt loang: bán kính tính theo phần trăm nên chúng co giãn theo khung. */}
          <Ellipse cx="18%" cy="12%" rx="55%" ry="45%" fill="url(#grid-blob-a)" />
          <Ellipse cx="88%" cy="82%" rx="50%" ry="55%" fill="url(#grid-blob-b)" />

          <Rect x={0} y={0} width="100%" height="100%" fill="url(#grid-cell)" />
        </Svg>
      </View>
      {children}
    </View>
  );
}
