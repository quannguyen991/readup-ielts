import React, { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Pressable có trạng thái rê chuột, dùng được CÙNG `className`.
 *
 * Pressable của react-native nhận `style` là hàm `({ hovered, pressed }) => …`.
 * Nhưng khi đã gắn `className`, lớp NativeWind bọc Pressable và BỎ QUA style
 * dạng hàm — nút "Kiểm Tra" vàng hiện ra trong suốt, viền đáp án đúng/sai không
 * hiện, và không có lỗi nào báo. Ở đây tự giữ cờ hovered/pressed bằng state rồi
 * truyền xuống một style THƯỜNG, nên kết hợp với className thoải mái.
 */
export function HoverPressable({
  style,
  onHoverIn,
  onHoverOut,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, 'style'> & {
  style?: (state: { hovered: boolean; pressed: boolean }) => StyleProp<ViewStyle>;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      {...rest}
      onHoverIn={(e) => {
        setHovered(true);
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        setHovered(false);
        onHoverOut?.(e);
      }}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={style?.({ hovered, pressed })}
    />
  );
}
