import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

/**
 * Ngọn lửa streak: sáng khi đang có chuỗi học, xám khi chưa có. Ngọn lửa đập nhẹ (scale)
 * bằng native driver, nên mượt cả trên điện thoại. Tắt khi máy đặt "giảm chuyển động" (Animated không chạy khi không cần).
 */
export function StreakFlame({ days, size = 40 }: { days: number; size?: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const lit = days > 0;

  useEffect(() => {
    if (!lit) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 640, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.97, duration: 560, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [lit, pulse]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale: lit ? pulse : 1 }] }}>
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Defs>
            <SvgGradient id="streak-flame" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFD27A" />
              <Stop offset="0.55" stopColor="#FF9C5B" />
              <Stop offset="1" stopColor="#E8708A" />
            </SvgGradient>
          </Defs>
          <Path
            d="M24 4 C30 12 38 16 38 28 C38 37 32 44 24 44 C16 44 10 37 10 28 C10 22 13 18 16 14 C17 20 19 23 22 24 C21 16 22 10 24 4 Z"
            fill={lit ? 'url(#streak-flame)' : '#E5E0F2'}
          />
          <Path
            d="M24 26 C27 30 30 32 30 36 C30 40 27 42 24 42 C21 42 18 40 18 36 C18 33 21 31 24 26 Z"
            fill={lit ? '#FFF3D6' : '#F3F0FB'}
            opacity={0.9}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
