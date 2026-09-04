import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { hashString, mulberry32 } from '@/services/questions/rng';

const COLORS = ['#F0B429', '#4C6122', '#7FB069', '#8FA9E8', '#E9A6C0', '#FBF6D0'];

type Piece = {
  left: number;
  size: number;
  color: string;
  delay: number;
  drift: number;
  spin: number;
};

/**
 * Mưa giấy màu khi làm đúng cả câu.
 *
 * Hiệu ứng chạy bằng MỘT shared value chung rồi mỗi mảnh tự suy ra vị trí của
 * nó, chứ không dùng `entering=` của Reanimated: trên bản web, `entering` làm
 * trắng cả trang. Một shared value cũng rẻ hơn 24 animation độc lập.
 *
 * Vị trí các mảnh sinh từ RNG gieo hạt theo `seed`, nên cùng một câu thì mưa
 * giấy rơi giống hệt nhau — không có gì nhảy loạn khi React render lại.
 */
export function Confetti({ seed, pieces = 26 }: { seed: string; pieces?: number }) {
  const progress = useSharedValue(0);

  const items = useMemo<Piece[]>(() => {
    const rng = mulberry32(hashString(seed));
    return Array.from({ length: pieces }, () => ({
      left: rng() * 100,
      size: 5 + rng() * 6,
      color: COLORS[Math.floor(rng() * COLORS.length)] ?? COLORS[0]!,
      delay: rng() * 0.35,
      drift: (rng() - 0.5) * 80,
      spin: 240 + rng() * 480,
    }));
  }, [seed, pieces]);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) });
  }, [seed, progress]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 340, overflow: 'hidden' }}>
      {items.map((piece, index) => (
        <Flake key={index} piece={piece} progress={progress} />
      ))}
    </View>
  );
}

function Flake({ piece, progress }: { piece: Piece; progress: { value: number } }) {
  const style = useAnimatedStyle(() => {
    // Mỗi mảnh bắt đầu trễ một chút rồi chạy hết quãng còn lại, nên chúng
    // không rơi thành một hàng ngang.
    const local = Math.max(0, Math.min(1, (progress.value - piece.delay) / (1 - piece.delay)));
    return {
      transform: [
        { translateY: -20 + local * 340 },
        { translateX: local * piece.drift },
        { rotate: `${local * piece.spin}deg` },
      ],
      opacity: local === 0 ? 0 : 1 - local * local,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${piece.left}%`,
          width: piece.size,
          height: piece.size * 1.8,
          borderRadius: 1.5,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}
