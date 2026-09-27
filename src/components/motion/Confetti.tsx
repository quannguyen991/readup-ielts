import React, { useEffect, useMemo } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { playCorrectChime } from '@/services/audio/chime';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * PHÁO GIẤY khi làm đúng cả câu.
 *
 * Bản cũ rơi lất phất 26 mảnh màu nhạt trong dải 340px đầu thẻ — người dùng
 * thấy "cần hiện mạnh hơn, rõ hơn" (27/09/2026). Bản này phủ CẢ MÀN HÌNH:
 *
 *   - hai ống pháo bắn chéo lên từ hai góc dưới,
 *   - một chùm nổ tỏa tròn ở giữa màn,
 *   - mảnh giấy rơi theo trọng lực thật (x = x0 + vx·t, y = y0 + vy·t + ½g·t²),
 *     lật như giấy (co giãn chiều dọc) nên lấp lánh chứ không trôi phẳng.
 *
 * Vẫn một shared value chung cho mọi mảnh, không dùng `entering=` (trên web làm
 * trắng trang). Vị trí sinh từ RNG gieo hạt theo `seed` nên cùng một câu thì
 * pháo bắn giống hệt nhau, React render lại không làm nó nhảy.
 *
 * Tắt chuyển động (prefers-reduced-motion) thì không bắn — chỉ còn tiếng chuông.
 */
const COLORS = ['#FF3B6B', '#FFB020', '#FFE14D', '#2EE6A6', '#28C3FF', '#7B61FF', '#FF6EE7', '#FFFFFF'];
const DURATION = 3200;
/** Giây mô phỏng ứng với toàn bộ thời gian chạy. */
const T = 2.6;

type Piece = {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  round: boolean;
  color: string;
  delay: number;
  spin: number;
  flutter: number;
};

function reducedMotion(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function Confetti({
  seed,
  pieces = 120,
  silent = false,
}: {
  seed: string;
  pieces?: number;
  silent?: boolean;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const progress = useSharedValue(0);
  const still = useMemo(() => reducedMotion(), []);

  useEffect(() => {
    if (silent) return;
    playCorrectChime();
  }, [seed, silent]);

  const items = useMemo<Piece[]>(() => {
    const rng = mulberry32(hashString(seed));
    const out: Piece[] = [];
    for (let i = 0; i < pieces; i++) {
      const group = i % 3; // 0: ống trái, 1: ống phải, 2: chùm giữa
      const size = 7 + rng() * 9;
      const round = rng() < 0.28;
      let x0: number, y0: number, vx: number, vy: number;
      if (group === 2) {
        const a = rng() * Math.PI * 2;
        const sp = H * (0.35 + rng() * 0.55);
        x0 = W * 0.5;
        y0 = H * 0.32;
        vx = Math.cos(a) * sp;
        vy = Math.sin(a) * sp - H * 0.25;
      } else {
        const left = group === 0;
        const a = ((left ? -1 : 1) * (8 + rng() * 32) - 90) * (Math.PI / 180); // 58–82° so với phương ngang
        const sp = H * (0.8 + rng() * 0.35);
        x0 = left ? W * 0.02 : W * 0.98;
        y0 = H * 1.02;
        vx = Math.cos(a) * sp;
        vy = Math.sin(a) * sp;
      }
      out.push({
        x0,
        y0,
        vx,
        vy,
        w: round ? size * 0.9 : size,
        h: round ? size * 0.9 : size * 1.7,
        round,
        color: COLORS[Math.floor(rng() * COLORS.length)]!,
        delay: group === 2 ? 0.08 + rng() * 0.08 : rng() * 0.1,
        spin: (rng() < 0.5 ? -1 : 1) * (360 + rng() * 900),
        flutter: 6 + rng() * 10,
      });
    }
    return out;
  }, [seed, pieces, W, H]);

  useEffect(() => {
    if (still) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: DURATION, easing: Easing.linear });
  }, [seed, progress, still]);

  if (still || W === 0) return null;
  const g = H * 1.15;

  return (
    <View
      pointerEvents="none"
      style={{
        position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as 'absolute',
        top: 0,
        left: 0,
        width: W,
        height: H,
        zIndex: 80,
        overflow: 'hidden',
      }}
    >
      <Flash progress={progress} W={W} H={H} />
      {items.map((piece, index) => (
        <Flake key={index} piece={piece} g={g} H={H} progress={progress} />
      ))}
    </View>
  );
}

/** Chớp sáng tròn ở tâm chùm nổ — cho mắt bắt được khoảnh khắc "bùm". */
function Flash({ progress, W, H }: { progress: { value: number }; W: number; H: number }) {
  const style = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, (progress.value - 0.06) / 0.14));
    return { opacity: p === 0 ? 0 : 0.55 * (1 - p), transform: [{ scale: 0.2 + p * 2.2 }] };
  });
  const size = Math.min(W, H) * 0.35;
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: W * 0.5 - size / 2, top: H * 0.32 - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFF4B8' },
        style,
      ]}
    />
  );
}

function Flake({ piece, g, H, progress }: { piece: Piece; g: number; H: number; progress: { value: number } }) {
  const style = useAnimatedStyle(() => {
    const local = Math.max(0, (progress.value - piece.delay) / (1 - piece.delay));
    const t = local * T;
    // Lực cản không khí: vận tốc ngang tắt dần, rơi chậm lại như giấy.
    const drag = 1 - Math.min(0.55, t * 0.22);
    const x = piece.x0 + piece.vx * t * drag;
    const y = piece.y0 + piece.vy * t + 0.5 * g * t * t * 0.62;
    const fade = local > 0.78 ? 1 - (local - 0.78) / 0.22 : 1;
    return {
      opacity: local === 0 || y > H + 40 ? 0 : Math.max(0, fade),
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${local * piece.spin}deg` },
        { scaleY: Math.cos(t * piece.flutter) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: -piece.w / 2,
          top: -piece.h / 2,
          width: piece.w,
          height: piece.h,
          borderRadius: piece.round ? piece.w : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}
