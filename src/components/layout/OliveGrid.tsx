import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

/**
 * Nền lưới xanh rêu PHẲNG — dùng cho màn đọc báo song ngữ và màn luyện Reading.
 *
 * Không dùng `GridBackdrop` cho hai màn này vì hai lẽ. (1) `GridBackdrop` có
 * hai vệt loang xanh–tím hợp với nền chàm của app, lạc tông trên nền rêu. (2)
 * Nó đặt id gradient CỐ ĐỊNH, mà khung app đã vẽ một nền cùng id ở lớp dưới:
 * trình duyệt lấy nhầm gradient của khung và màn đọc hiện ra xanh nhạt. Id ở
 * đây sinh theo từng lần gắn nên không đụng ai.
 */
export const OLIVE = '#697B3E';

export function OliveGrid({
  children,
  cell = 30,
  color = OLIVE,
}: {
  children: React.ReactNode;
  cell?: number;
  /** Màu nền dưới lưới; mặc định xanh rêu. */
  color?: string;
}) {
  const cellId = `olive-cell-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View className="flex-1" style={{ backgroundColor: color }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id={cellId} width={cell} height={cell} patternUnits="userSpaceOnUse">
              <Path d={`M ${cell} 0 L 0 0 L 0 ${cell}`} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${cellId})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}
