import React from 'react';
import { useWindowDimensions, View } from 'react-native';

type GridProps = {
  children: React.ReactNode;
  /** Số cột theo breakpoint. Mobile mặc định 1 cột, tablet 2, desktop theo `columns`. */
  columns?: number;
  tabletColumns?: number;
  mobileColumns?: number;
  gap?: number;
};

/**
 * Lưới đều cột dùng cho hàng stat card và các hàng card bài đọc.
 * RN không có CSS grid nên tự chia hàng để giữ chiều cao đồng đều.
 */
export function Grid({
  children,
  columns = 4,
  tabletColumns = 2,
  mobileColumns = 1,
  gap = 16,
}: GridProps) {
  const { width } = useWindowDimensions();
  const cols = width >= 1024 ? columns : width >= 640 ? tabletColumns : mobileColumns;

  const items = React.Children.toArray(children).filter(Boolean);
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }

  return (
    <View style={{ gap }}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', gap }}>
          {row.map((child, i) => (
            <View key={i} style={{ flex: 1, minWidth: 0 }}>
              {child}
            </View>
          ))}
          {/* Ô trống để hàng cuối không bị kéo giãn */}
          {Array.from({ length: cols - row.length }).map((_, i) => (
            <View key={`spacer-${i}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}
