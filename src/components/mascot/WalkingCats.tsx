import React, { useEffect, useState } from 'react';
import { Image, type ImageSourcePropType, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CatSticker } from './CatSticker';
import { useLionSkin } from './lion-skin';

/**
 * ĐÀN MÈO ĐI DẠO — tám con mèo sticker đi ngang một dải phía dưới màn, cả đi sang phải lẫn đi ngược
 * lại (con đi ngược được lật mặt), cộng một con đứng yên ở góc (điện thoại: cuộn ngủ trên mép thanh
 * tab; máy tính: ngồi ở góc phải). Mỗi con đi một cỡ, một nhịp và một lúc xuất phát, nên không chạy
 * thành hàng.
 *
 * Khung đi bộ là sáu tấm vẽ bằng ChatGPT (walk-1..6): cùng một con mèo, đi sang phải, theo thứ tự một
 * chu kỳ. Một bộ đếm khung chung cho cả đàn; mỗi con lệch một khung nên không bước đồng bộ. Mỗi con còn
 * nhún nhẹ theo bước chân. Chỉ là trang trí: lớp bọc không nhận chạm. Ai bật "giảm chuyển động" thì không
 * thấy đàn mèo.
 */

/** Sáu khung đi bộ theo thứ tự một chu kỳ (mèo). */
const CAT_WALK: ImageSourcePropType[] = [
  require('../../../assets/illustrations/cats/walk-1.png'),
  require('../../../assets/illustrations/cats/walk-2.png'),
  require('../../../assets/illustrations/cats/walk-3.png'),
  require('../../../assets/illustrations/cats/walk-4.png'),
  require('../../../assets/illustrations/cats/walk-5.png'),
  require('../../../assets/illustrations/cats/walk-6.png'),
];

/** Bốn khung đi bộ của Leo (giao diện vàng kim), public/mascot/lion/lion-walk-1..4.png. */
const LION_WALK: ImageSourcePropType[] = [1, 2, 3, 4].map((n) => ({ uri: `/mascot/lion/lion-walk-${n}.png` }));

const FRAME_MS = 110;
const STEP_MS = 110;

type WalkerSpec = { size: number; duration: number; delay: number; dir: 'right' | 'left' };

/**
 * Tám con đi, mỗi con một cỡ, một nhịp và một chiều. `duration` là thời gian đi hết một đường ngang;
 * `delay` là lúc xuất phát. Con đi ngược thì bước vào từ mép phải.
 */
const WALKERS: WalkerSpec[] = [
  { size: 64, duration: 22000, delay: 0, dir: 'right' },
  { size: 46, duration: 26000, delay: 4000, dir: 'left' },
  { size: 56, duration: 20000, delay: 9000, dir: 'right' },
  { size: 52, duration: 24000, delay: 13000, dir: 'left' },
  { size: 40, duration: 28000, delay: 2000, dir: 'right' },
  { size: 60, duration: 21000, delay: 16000, dir: 'left' },
  { size: 48, duration: 25000, delay: 11000, dir: 'right' },
  { size: 36, duration: 30000, delay: 7000, dir: 'left' },
];

/** Con mèo đứng yên trên dải, theo nơi hiển thị. */
const PERCHED = {
  phone: { pose: 'curl' as const, right: 18, size: 60 },
  desktop: { pose: 'sit' as const, right: 28, size: 64 },
};

/**
 * Dải đi dạo. `left` tránh thanh bên trên máy tính; `bottom` là đáy của mèo. Trên điện thoại đặt
 * cao hơn thanh tab nổi để mèo đứng ngay trên mép thanh.
 */
export function WalkingCats({ bottom, left, variant }: { bottom: number; left: number; variant: 'phone' | 'desktop' }) {
  const reduced = useReducedMotion();
  const frames = useLionSkin() ? LION_WALK : CAT_WALK;
  // Đo bằng cỡ cửa sổ, không dùng onLayout: onLayout có thể đến muộn, hoặc không đến khi trình duyệt
  // đang ẩn, và khi đó đàn mèo không hiện ra.
  const trackWidth = Math.max(0, useWindowDimensions().width - left);
  // Một bộ đếm khung cho cả đàn: mỗi con cộng thêm chỉ số của mình để lệch nhịp.
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setFrame((f) => f + 1), FRAME_MS);
    return () => clearInterval(timer);
  }, [reduced]);
  if (reduced) return null;
  const perched = PERCHED[variant];
  return (
    <View style={{ position: 'absolute', left, right: 0, bottom, height: 72, overflow: 'hidden', zIndex: 30, pointerEvents: 'none' } as never}>
      {WALKERS.map((spec, i) => (
        <Walker key={i} trackWidth={trackWidth} frame={frame + i} frames={frames} {...spec} />
      ))}
      {variant === 'desktop' ? <CatSticker pose={perched.pose} size={perched.size} style={{ position: 'absolute', right: perched.right, bottom: 0 }} /> : null}
    </View>
  );
}

function Walker({ trackWidth, size, duration, delay, dir, frame, frames }: WalkerSpec & { trackWidth: number; frame: number; frames: ImageSourcePropType[] }) {
  const progress = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    // Trễ đúng một lần ở đầu. Sau đó con mèo đi lặp lại không nghỉ; lúc quay lại vòng thì nó đã khuất ở mép.
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
    bob.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: STEP_MS, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: STEP_MS, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(progress);
      cancelAnimation(bob);
    };
  }, [progress, bob, duration, delay]);

  const style = useAnimatedStyle(() => {
    const travel = trackWidth + size;
    // Đi sang phải: từ mép trái ra mép phải. Đi sang trái: từ mép phải ra mép trái, và lật mặt lại.
    const x = dir === 'right' ? -size + progress.value * travel : trackWidth - progress.value * travel;
    return { transform: [{ translateX: x }, { translateY: bob.value }, { scaleX: dir === 'right' ? 1 : -1 }] };
  });

  return (
    <Animated.View style={[{ position: 'absolute', bottom: 0, width: size, height: size, pointerEvents: 'none' } as never, style]}>
      <Image source={frames[frame % frames.length]!} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}
