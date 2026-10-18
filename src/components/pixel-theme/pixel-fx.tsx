import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/*
  Hiệu ứng pixel 2D dùng chung: sao và tim lấp lánh, nhân vật nhún nhẹ, đổi khung hình, đếm số.
  Mọi hình là ô vuông vẽ bằng SVG, không dùng ảnh ngoài. Hiệu ứng chỉ để trang trí:
  pointerEvents luôn là none, không chặn bấm.
*/

/** Sao 4 cánh 7×7 ô; `#` là ô được tô. */
export const PIXEL_STAR = ['...#...', '...#...', '.#####.', '#######', '.#####.', '...#...', '...#...'];
/** Tim 7×6 ô. */
export const PIXEL_HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];

/** Vẽ một hình pixel từ mẫu chữ: mỗi `#` là một ô vuông `cell` điểm ảnh. */
export function PixelGlyph({ pattern, cell, color }: { pattern: string[]; cell: number; color: string }) {
  const cols = Math.max(...pattern.map((row) => row.length));
  const rows = pattern.length;
  return (
    <Svg width={cols * cell} height={rows * cell} viewBox={`0 0 ${cols} ${rows}`}>
      {pattern.flatMap((row, y) =>
        row.split('').map((ch, x) => (ch === '#' ? <Rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null)),
      )}
    </Svg>
  );
}

/** Bộ sinh số cố định theo hạt giống: cùng hạt cho cùng bố cục ở mọi lần dựng, không lệch khi tải lại. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Chạy vòng lặp 0 → 1 → 0 của một giá trị hoạt họa; trả về để nơi gọi dừng khi tháo. */
function loopValue(v: Animated.Value, period: number, delay: number) {
  const anim = Animated.loop(
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: period / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(v, { toValue: 0, duration: period / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]),
  );
  anim.start();
  return anim;
}

type Glyph = 'star' | 'heart';

/** Một ngôi sao hoặc trái tim nhấp nháy và trôi nhẹ lên trên. */
function Twinkle({
  left,
  top,
  delay,
  period,
  size,
  color,
  pattern,
  cell,
}: {
  left: number;
  top: number;
  delay: number;
  period: number;
  size: number;
  color: string;
  pattern: string[];
  cell: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = loopValue(v, period, delay);
    return () => anim.stop();
  }, [v, period, delay]);
  // Ô phải là số nguyên, nếu không cạnh SVG bị nhoè.
  const c = Math.max(2, Math.round(cell * size));
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] }) },
        ],
      }}
    >
      <PixelGlyph pattern={pattern} cell={c} color={color} />
    </Animated.View>
  );
}

/** Lớp sao hoặc tim lấp lánh phủ kín khung cha. Vị trí cố định theo `seed`. */
export function PixelSparkles({
  count = 12,
  glyph = 'star',
  colors,
  seed = 7,
  cell = 3,
}: {
  count?: number;
  glyph?: Glyph;
  colors: readonly string[];
  seed?: number;
  cell?: number;
}) {
  const items = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({
      left: 4 + rnd() * 92,
      top: 4 + rnd() * 92,
      delay: Math.round(rnd() * 1500),
      period: 1800 + Math.round(rnd() * 1600),
      size: 0.6 + rnd() * 0.7,
      color: colors[i % colors.length] ?? '#FFFFFF',
    }));
  }, [count, seed, colors]);
  const pattern = glyph === 'star' ? PIXEL_STAR : PIXEL_HEART;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((it, i) => (
        <Twinkle key={i} {...it} pattern={pattern} cell={cell} />
      ))}
    </View>
  );
}

/** Nhân vật nhún lên xuống đều. `delay` để nhiều nhân vật không nhún cùng nhịp. */
export function PixelBob({
  children,
  amplitude = 6,
  period = 1600,
  delay = 0,
}: {
  children: React.ReactNode;
  amplitude?: number;
  period?: number;
  delay?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = loopValue(v, period, delay);
    return () => anim.stop();
  }, [v, period, delay]);
  return (
    <Animated.View style={{ transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -amplitude] }) }] }}>
      {children}
    </Animated.View>
  );
}

/** Chỉ số khung hình hiện tại, đổi mỗi `interval` ms. Dùng để làm hoạt họa 2D bằng cách đổi ảnh. */
export function useFrameIndex(count: number, interval: number): number {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % count), interval);
    return () => clearInterval(t);
  }, [count, interval]);
  return i;
}

/** Đếm từ 0 lên `to` trong khoảng `duration` ms, khi `to` đổi thì đếm lại. */
export function CountUp({
  to,
  duration = 900,
  format = (n: number) => String(n),
  style,
}: {
  to: number;
  duration?: number;
  format?: (n: number) => string;
  style?: StyleProp<TextStyle>;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const steps = Math.max(1, Math.round(duration / 30));
    let k = 0;
    setN(0);
    const t = setInterval(() => {
      k += 1;
      setN(Math.round(to * Math.min(1, k / steps)));
      if (k >= steps) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [to, duration]);
  return <Text style={style}>{format(n)}</Text>;
}
