import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

/**
 * Chuyển động lặp của bộ neon (họa tiết trôi, sao nhấp nháy, chữ nhấp nhô).
 *
 * Trên WEB dùng CSS keyframes (`animationKeyframes` của react-native-web): trình duyệt chạy trên luồng vẽ, không tốn
 * luồng JavaScript và tạm dừng khi tab ẩn. Bản `Animated` điều khiển bằng JS từng khung từng là nguyên nhân giật khi
 * chuyển tab, vì một trang tổng quan có hàng chục họa tiết chạy cùng lúc. Trên điện thoại vẫn dùng `Animated` với
 * native driver (chạy trên luồng giao diện, không tốn JS). Giảm chuyển động của hệ điều hành: đứng yên.
 */
const WEB = Platform.OS === 'web';

function reducedMotion(): boolean {
  try {
    return WEB && typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

type Common = { delay?: number; style?: object; children?: React.ReactNode };

// ---------------------------------------------------------------- trôi lên xuống + nghiêng nhẹ

type BobProps = Common & { amp?: number; tilt?: number; ms?: number };

/**
 * `animationKeyframes` chỉ được biên dịch thành CSS khi đi qua `StyleSheet.create` (style nội tuyến bị bỏ qua, không có
 * `animation-name`). Nên mỗi bộ khung (biên độ, góc nghiêng) tạo một lần rồi dùng lại; thời lượng và độ trễ đặt nội tuyến.
 */
const kfCache = new Map<string, object>();
function keyframeStyle(key: string, frames: object): object {
  let st = kfCache.get(key);
  if (!st) {
    st = (StyleSheet.create({ k: { animationKeyframes: frames } as object }) as { k: object }).k;
    kfCache.set(key, st);
  }
  return st;
}

function BobWeb({ amp = 6, tilt = 3, ms = 2600, delay = 0, style, children }: BobProps) {
  if (reducedMotion()) return <View style={style}>{children}</View>;
  const kf = keyframeStyle(`bob:${amp}:${tilt}`, {
    '0%': { transform: [{ translateY: 0 }, { rotate: `${-tilt}deg` }] },
    '50%': { transform: [{ translateY: -amp }, { rotate: `${tilt}deg` }] },
    '100%': { transform: [{ translateY: 0 }, { rotate: `${-tilt}deg` }] },
  });
  return (
    <View style={[style, kf, { animationDuration: `${ms * 2}ms`, animationDelay: `${delay}ms`, animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out', willChange: 'transform' } as object]}>
      {children}
    </View>
  );
}

function useNativeLoop(ms: number, delay: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, ms, delay]);
  return v;
}

function BobNative({ amp = 6, tilt = 3, ms = 2600, delay = 0, style, children }: BobProps) {
  const v = useNativeLoop(ms, delay);
  return (
    <Animated.View style={[style, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -amp] }) }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [`${-tilt}deg`, `${tilt}deg`] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export const NeonBob: React.ComponentType<BobProps> = WEB ? BobWeb : BobNative;

// ---------------------------------------------------------------- nhấp nháy (sáng tối + phồng xẹp)

type TwinkleProps = Common & { ms?: number };

function TwinkleWeb({ ms = 1800, delay = 0, style, children }: TwinkleProps) {
  if (reducedMotion()) return <View style={style}>{children}</View>;
  const kf = keyframeStyle('twinkle', {
    '0%': { opacity: 0.55, transform: [{ scale: 0.85 }] },
    '50%': { opacity: 1, transform: [{ scale: 1.1 }] },
    '100%': { opacity: 0.55, transform: [{ scale: 0.85 }] },
  });
  return (
    <View style={[style, kf, { animationDuration: `${ms * 2}ms`, animationDelay: `${delay}ms`, animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out', willChange: 'transform, opacity' } as object]}>
      {children}
    </View>
  );
}

function TwinkleNative({ ms = 1800, delay = 0, style, children }: TwinkleProps) {
  const v = useNativeLoop(ms, delay);
  return (
    <Animated.View style={[style, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export const NeonTwinkle: React.ComponentType<TwinkleProps> = WEB ? TwinkleWeb : TwinkleNative;

/**
 * Vầng sáng mềm. Trên web dùng gradient tròn (rẻ, vẽ một lần) thay cho `filter: blur()` trên phần tử lớn, vốn buộc
 * trình duyệt làm mờ lại cả vùng mỗi khi lớp bên trên đổi. Trên điện thoại giữ khối màu phẳng như cũ.
 */
export function softBlob(color: string): object {
  return WEB ? ({ backgroundImage: `radial-gradient(closest-side, ${color}, rgba(0,0,0,0))` } as object) : { backgroundColor: color, borderRadius: 999 };
}
