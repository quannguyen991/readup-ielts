import React, { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Đường học so le dùng chung cho các lộ trình môn học. Component chỉ lo phần
 * đường nối và vị trí; mỗi màn hình tự vẽ nút để giữ đúng thông tin riêng.
 */
export function WindingTrail<T extends { id: string }>({
  items,
  renderNode,
  rowHeight = 138,
  nodeWidth = 210,
}: {
  items: T[];
  renderNode: (item: T, index: number) => React.ReactNode;
  rowHeight?: number;
  nodeWidth?: number;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const compact = width > 0 && width < 560;
  const widthOfNode = width ? Math.min(nodeWidth, width * (compact ? 0.66 : 0.58)) : nodeWidth;
  const positions = compact ? [0.38, 0.62, 0.5, 0.62, 0.38] : [0.25, 0.75, 0.5, 0.75, 0.25];
  const center = (index: number) => (items.length === 1 ? width / 2 : width * positions[index % positions.length]!);
  const height = Math.max(rowHeight, items.length * rowHeight);

  return (
    <View onLayout={onLayout} style={{ position: 'relative', width: '100%', height }}>
      {width > 0 && items.length > 1 ? (
        <Svg
          pointerEvents="none"
          width={width}
          height={height}
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          {items.slice(1).map((item, index) => {
            const fromX = center(index);
            const toX = center(index + 1);
            const fromY = index * rowHeight + 34;
            const toY = (index + 1) * rowHeight + 34;
            const d = `M ${fromX} ${fromY} C ${fromX} ${fromY + 48}, ${toX} ${toY - 48}, ${toX} ${toY}`;
            return <Path key={item.id} d={d} stroke="#C8A354" strokeWidth={4} strokeDasharray="2 10" strokeLinecap="round" fill="none" />;
          })}
        </Svg>
      ) : null}
      {width > 0 ? items.map((item, index) => (
        <View
          key={item.id}
          style={{
            position: 'absolute',
            top: index * rowHeight,
            left: width ? center(index) - widthOfNode / 2 : 0,
            width: width ? widthOfNode : '100%',
            alignItems: 'center',
          }}
        >
          {renderNode(item, index)}
        </View>
      )) : null}
    </View>
  );
}
