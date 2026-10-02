import React, { useCallback, useState } from 'react';
import { Platform, ScrollView, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Hàng cuộn ngang cho chip / thẻ — dùng thay `ScrollView horizontal` trần.
 *
 * Hai thứ trần thiếu trên điện thoại:
 *  - Không có dấu hiệu "còn nữa": chip cuối bị cắt giữa chừng mà không gì báo
 *    rằng vuốt được. Ở đây mép nào còn nội dung thì mép đó mờ dần (mask), mép
 *    nào đã chạm thì rõ nét.
 *  - Vuốt xong dừng lơ lửng giữa hai chip. Ở đây có `scroll-snap` kiểu
 *    `proximity` (chỉ hút khi dừng gần mép) nên vẫn vuốt tự do.
 *
 * Chỉ web mới có mask/snap; native giữ ScrollView thường. State chỉ đổi khi
 * chạm/rời mép, không phải mỗi pixel cuộn.
 */
export function HScroll({
  children,
  contentContainerStyle,
  style,
  fade = 20,
}: {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Bề rộng vùng mờ, px. */
  fade?: number;
}) {
  const [edge, setEdge] = useState<{ start: boolean; end: boolean }>({ start: true, end: false });

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const start = contentOffset.x <= 2;
    const end = contentOffset.x + layoutMeasurement.width >= contentSize.width - 2;
    setEdge((p) => (p.start === start && p.end === end ? p : { start, end }));
  }, []);

  // Chưa tràn thì không có gì để mờ.
  const [sizes, setSizes] = useState({ content: 0, layout: 0 });
  const onContentSizeChange = useCallback((w: number) => setSizes((p) => (p.content === w ? p : { ...p, content: w })), []);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSizes((p) => (p.layout === w ? p : { ...p, layout: w }));
  }, []);
  const overflowing = sizes.content > sizes.layout + 2;

  const mask =
    Platform.OS === 'web' && overflowing
      ? ({
          maskImage: `linear-gradient(to right, ${edge.start ? '#000' : 'transparent'} 0, #000 ${fade}px, #000 calc(100% - ${fade}px), ${edge.end ? '#000' : 'transparent'} 100%)`,
          WebkitMaskImage: `linear-gradient(to right, ${edge.start ? '#000' : 'transparent'} 0, #000 ${fade}px, #000 calc(100% - ${fade}px), ${edge.end ? '#000' : 'transparent'} 100%)`,
          scrollSnapType: 'x proximity',
          overscrollBehaviorX: 'contain',
        } as object)
      : null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={64}
      onScroll={onScroll}
      onContentSizeChange={onContentSizeChange}
      onLayout={onLayout}
      contentContainerStyle={contentContainerStyle}
      style={[style, mask]}
      {...({ dataSet: { hscroll: '1' } } as object)}
    >
      {children}
    </ScrollView>
  );
}
