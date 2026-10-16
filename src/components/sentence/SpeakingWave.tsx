import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { themedHex } from '@/theme/palette-state';

/** Năm vạch với chiều cao tương đối khác nhau, để sóng trông như giọng nói chứ không phải thanh đều. */
const SHAPE = [0.5, 0.85, 1, 0.7, 0.42];
const BASE = 8;
const SPAN = 22;

/**
 * Sóng âm khi trình đọc đang phát. Trạng thái hiển thị đúng việc đang xảy ra:
 * sáng lên khi đọc, phẳng khi dừng.
 *
 * Tôn trọng "giảm chuyển động": vạch đứng yên ở mức giữa, vẫn báo là đang đọc.
 * Khung cố định cao 32px để bật/tắt không làm nhảy bố cục bên dưới.
 */
export function SpeakingWave({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const color = themedHex('#D9A441');
  const idle = themedHex('#EADFC6');

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="h-8 flex-row items-center justify-center gap-1.5"
    >
      {SHAPE.map((shape, i) => (
        <Bar key={i} index={i} shape={shape} active={active} reduced={!!reduced} color={active ? color : idle} />
      ))}
    </View>
  );
}

function Bar({
  index,
  shape,
  active,
  reduced,
  color,
}: {
  index: number;
  shape: number;
  active: boolean;
  reduced: boolean;
  color: string;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(t);
    if (!active || reduced) {
      t.value = active && reduced ? 0.5 : 0;
      return;
    }
    // Lệch pha theo từng vạch để sóng chạy đều, không nhấp nháy đồng loạt.
    t.value = withDelay(
      index * 90,
      withRepeat(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
    return () => cancelAnimation(t);
  }, [active, reduced, index, t]);

  const style = useAnimatedStyle(() => ({
    height: BASE + SPAN * shape * (0.35 + 0.65 * t.value),
  }));

  return <Animated.View style={[{ width: 4, borderRadius: 2, backgroundColor: color }, style]} />;
}
