import React, { useEffect, useMemo } from 'react';
import { Platform, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';

import { mulberry32 } from '@/services/questions/rng';

/**
 * BỘ HIỆU ỨNG DÙNG CHUNG CHO CÁC MÀN GAME MỚI (Tháp Band, chiếu lớp, thách đấu, album).
 *
 * Tất cả chạy bằng Reanimated, nên web và native giống nhau. Mỗi hiệu ứng là một
 * component: muốn chạy lại thì đổi `key` (sự kiện mới → phần tử mới → chạy từ đầu),
 * không có bộ đếm giờ nào phải dọn. Người đặt "giảm chuyển động" thì các hiệu ứng
 * rung, bay, nổ được bỏ; số điểm và đáp án vẫn hiện.
 */

export const JUICE = {
  good: '#22C55E',
  bad: '#EF4444',
  gold: '#FACC15',
  ink: '#0F1D33',
  confetti: ['#FF3B6B', '#FFB020', '#FFE14D', '#2EE6A6', '#6EA8FF', '#FF6EE7', '#FFFFFF'],
} as const;

const EASE_OUT = Easing.out(Easing.cubic);

/**
 * Nổ tia: các hạt bắn ra từ tâm rồi mờ dần. `seed` quyết định hướng bay, nên cùng
 * một sự kiện thì nổ giống nhau mỗi lần render.
 */
export function Burst({
  seed,
  colors = JUICE.confetti as readonly string[],
  count = 18,
  radius = 110,
  size = 9,
  duration = 700,
}: {
  seed: string;
  colors?: readonly string[];
  count?: number;
  radius?: number;
  size?: number;
  duration?: number;
}) {
  const parts = useMemo(() => {
    const rng = mulberry32(hashOf(seed));
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + rng() * 0.4;
      const r = radius * (0.55 + rng() * 0.45);
      return {
        dx: Math.cos(a) * r,
        dy: Math.sin(a) * r,
        color: colors[Math.floor(rng() * colors.length)] ?? '#FFFFFF',
        round: rng() > 0.35,
        s: size * (0.6 + rng() * 0.8),
      };
    });
  }, [seed, count, radius, size, colors]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
      {parts.map((p, i) => (
        <Particle key={i} dx={p.dx} dy={p.dy} color={p.color} round={p.round} size={p.s} duration={duration} />
      ))}
    </View>
  );
}

function Particle({ dx, dy, color, round, size, duration }: { dx: number; dy: number; color: string; round: boolean; size: number; duration: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    t.value = withTiming(1, { duration, easing: EASE_OUT });
  }, [duration, reduced, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateX: dx * t.value }, { translateY: dy * t.value + 40 * t.value * t.value }, { rotate: `${t.value * 540}deg` }, { scale: 1 - t.value * 0.5 }],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', width: size, height: round ? size : size * 0.45, borderRadius: round ? size : 2, backgroundColor: color },
        style as AnimatedStyle<ViewStyle>,
      ]}
    />
  );
}

/** Số hoặc chữ bay lên rồi mờ đi, dùng cho "+120", "−1 mạng", "+30 vàng". */
export function FloatText({ text, color = '#FFFFFF', size = 22, duration = 1100, style }: { text: string; color?: string; size?: number; duration?: number; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    t.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
  }, [duration, reduced, t]);
  const anim = useAnimatedStyle(() => {
    const k = t.value;
    return {
      opacity: k < 0.12 ? k / 0.12 : k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1,
      transform: [{ translateY: -46 * k }, { scale: 0.7 + 0.5 * Math.min(1, k * 4) - (k > 0.5 ? (k - 0.5) * 0.4 : 0) }],
    };
  });
  return (
    <Animated.Text
      pointerEvents="none"
      style={[{ position: 'absolute', alignSelf: 'center', fontSize: size, fontWeight: '900', color, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 2 } } as never, style as never, anim as never]}
    >
      {text}
    </Animated.Text>
  );
}

/** Rung ngang khi sai hoặc bị đánh. Đổi `trigger` là rung lại. */
export function Shake({ trigger, children, amount = 9 }: { trigger: number | string; children: React.ReactNode; amount?: number }) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  useEffect(() => {
    if (reduced || trigger === 0 || trigger === '') return;
    x.value = withSequence(
      withTiming(-amount, { duration: 50 }),
      withTiming(amount, { duration: 60 }),
      withTiming(-amount * 0.6, { duration: 60 }),
      withTiming(amount * 0.4, { duration: 60 }),
      withTiming(0, { duration: 70 }),
    );
  }, [trigger, amount, reduced, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={style as AnimatedStyle<ViewStyle>}>{children}</Animated.View>;
}

/** Nảy to rồi về bình thường khi xuất hiện: dùng cho số đếm ngược, ô vừa mở khoá, huy hiệu. */
export function Pop({ children, delay = 0, from = 0.4, style }: { children: React.ReactNode; delay?: number; from?: number; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  const s = useSharedValue(reduced ? 1 : from);
  useEffect(() => {
    if (reduced) return;
    s.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 180 }));
  }, [delay, reduced, s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[style, st as AnimatedStyle<ViewStyle>]}>{children}</Animated.View>;
}

/** Trượt lên và hiện dần, có độ trễ theo `index`: danh sách xếp hạng, thẻ kết quả. */
export function Rise({ index = 0, children, style }: { index?: number; children: React.ReactNode; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(Math.min(index, 12) * 90, withTiming(1, { duration: 380, easing: EASE_OUT }));
  }, [index, reduced, t]);
  const st = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * 18 }] }));
  return <Animated.View style={[style, st as AnimatedStyle<ViewStyle>]}>{children}</Animated.View>;
}

/** Con dấu đập xuống: "LOẠI", "ĐÚNG", "HẾT TIM". */
export function Stamp({ children, color = JUICE.bad, style }: { children: React.ReactNode; color?: string; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  const s = useSharedValue(reduced ? 1 : 2.4);
  const o = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    o.value = withTiming(1, { duration: 120 });
    s.value = withSpring(1, { damping: 9, stiffness: 260 });
  }, [o, reduced, s]);
  const st = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ rotate: '-8deg' }, { scale: s.value }] }));
  return (
    <Animated.View style={[{ borderWidth: 3, borderColor: color, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'center' }, style, st as AnimatedStyle<ViewStyle>]}>
      {children}
    </Animated.View>
  );
}

/** Vòng sáng đập nhẹ mãi mãi phía sau một phần tử: ô đang chọn, tháp đang bắn. */
export function Aura({ color = JUICE.gold, size = 84, strength = 1 }: { color?: string; size?: number; strength?: number }) {
  const reduced = useReducedMotion();
  const k = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    k.value = withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }));
    const id = setInterval(() => {
      k.value = withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }));
    }, 1800);
    return () => clearInterval(id);
  }, [k, reduced]);
  const st = useAnimatedStyle(() => ({ opacity: (0.25 + 0.5 * k.value) * strength, transform: [{ scale: 0.85 + 0.25 * k.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignSelf: 'center' }, st as AnimatedStyle<ViewStyle>]}
    />
  );
}

/* ---- Bổ sung cho Tháp Band (chỉ thêm; các thành phần trên giữ nguyên) ---- */

type Pt = { x: number; y: number };

/** Ánh sáng web (boxShadow) chỉ có trên web; native bỏ qua, không lỗi. */
export function glowWeb(shadow: string): object {
  return Platform.OS === 'web' ? { boxShadow: shadow } : {};
}

/** Trượt tới toạ độ mới (px) trong `duration` ms. Dùng cho quái đi: mỗi nhịp là một bước ngắn mượt. */
export function Glide({ x, y, duration = 100, style, children }: { x: number; y: number; duration?: number; style?: ViewStyle; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const tx = useSharedValue(x);
  const ty = useSharedValue(y);
  useEffect(() => {
    if (reduced) {
      tx.value = x;
      ty.value = y;
      return;
    }
    tx.value = withTiming(x, { duration, easing: Easing.linear });
    ty.value = withTiming(y, { duration, easing: Easing.linear });
  }, [x, y, duration, reduced, tx, ty]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, style, st as AnimatedStyle<ViewStyle>]}>
      {children}
    </Animated.View>
  );
}

/** Nhún lên xuống lặp lại: quái đang đi. `amp` là biên độ px, `period` là ms một chu kỳ. */
export function Bob({ amp = 3, period = 360, style, children }: { amp?: number; period?: number; style?: ViewStyle; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      y.value = 0;
      return;
    }
    y.value = withRepeat(
      withSequence(
        withTiming(-amp, { duration: period / 2, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: period / 2, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [amp, period, reduced, y]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, st as AnimatedStyle<ViewStyle>]}>{children}</Animated.View>;
}

/** Lấy điểm cách đều nhau dọc một đường gấp khúc (toạ độ bất kỳ, cùng hệ với `points`). */
function sampleAlong(points: readonly Pt[], spacing: number): Pt[] {
  const segs: { a: Pt; b: Pt; len: number; start: number }[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len, start: total });
    total += len;
  }
  const out: Pt[] = [];
  for (let s = spacing / 2; s < total; s += spacing) {
    const seg = segs.find((g) => s < g.start + g.len) ?? segs[segs.length - 1]!;
    const f = seg.len === 0 ? 0 : (s - seg.start) / seg.len;
    out.push({ x: seg.a.x + (seg.b.x - seg.a.x) * f, y: seg.a.y + (seg.b.y - seg.a.y) * f });
  }
  return out;
}

/**
 * Dải sáng chạy dọc một đường: các chấm đứng yên, còn ánh sáng trượt qua chúng theo
 * chiều đi (chấm i sáng khi `t - i/n` về 0). Dùng để vẽ đường quái đi.
 */
export function Flow({ points, color = '#FFFFFF', spacing = 12, size = 5, period = 1700 }: { points: readonly Pt[]; color?: string; spacing?: number; size?: number; period?: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false);
  }, [period, reduced, t]);
  const dots = useMemo(() => sampleAlong(points, spacing), [points, spacing]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      {dots.map((d, i) => (
        <FlowDot key={i} x={d.x} y={d.y} f={i / dots.length} t={t} color={color} size={size} />
      ))}
    </View>
  );
}

function FlowDot({ x, y, f, t, color, size }: { x: number; y: number; f: number; t: { value: number }; color: string; size: number }) {
  const st = useAnimatedStyle(() => {
    const w = (((t.value - f) % 1) + 1) % 1; // 0 là đỉnh sáng; phía sau đỉnh tắt dần
    const k = w < 0.22 ? 1 - w / 0.22 : 0;
    return { opacity: 0.2 + 0.8 * k, transform: [{ scale: 0.75 + 0.5 * k }] };
  });
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        glowWeb(`0 0 ${size * 2}px ${color}`) as ViewStyle,
        st as AnimatedStyle<ViewStyle>,
      ]}
    />
  );
}

/**
 * Viên đạn bay từ `from` tới `to` (px, cùng một hệ toạ độ với cha), có đuôi sáng theo hướng bay.
 * Bay xong thì mờ hẳn; cha tự gỡ nó khỏi danh sách sau `duration` ms.
 */
export function Bolt({ from, to, color = JUICE.gold, duration = 240 }: { from: Pt; to: Pt; color?: string; duration?: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    t.value = withTiming(1, { duration, easing: Easing.in(Easing.quad) });
  }, [duration, reduced, t]);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const trail = Math.min(36, len * 0.6);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const head = useAnimatedStyle(() => {
    const k = t.value;
    return {
      opacity: k > 0.9 ? (1 - k) * 10 : 1,
      transform: [{ translateX: from.x + dx * k }, { translateY: from.y + dy * k }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }, head as AnimatedStyle<ViewStyle>]}>
      <View
        style={{
          position: 'absolute',
          left: -(ux * trail) / 2 - trail / 2,
          top: -(uy * trail) / 2 - 2,
          width: trail,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
          opacity: 0.75,
          transform: [{ rotate: `${angle}deg` }],
        }}
      />
      <View style={[{ position: 'absolute', left: -6, top: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }, glowWeb(`0 0 10px 3px ${color}`) as ViewStyle]}>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
      </View>
    </Animated.View>
  );
}

/** Dải chữ lớn giữa bàn ("SÓNG 2/4"): phóng to rồi đập xuống, giữ một lúc, mờ dần. */
export function Banner({ text, top = 0, color = JUICE.gold, duration = 2000 }: { text: string; top?: number; color?: string; duration?: number }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(0);
  const s = useSharedValue(reduced ? 1 : 1.6);
  useEffect(() => {
    o.value = withSequence(withTiming(1, { duration: 140 }), withDelay(duration * 0.5, withTiming(0, { duration: duration * 0.4 })));
    s.value = reduced ? 1 : withSpring(1, { damping: 10, stiffness: 220 });
  }, [duration, reduced, o, s]);
  const st = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top, left: 0, right: 0, alignItems: 'center' }, st as AnimatedStyle<ViewStyle>]}>
      <View style={{ paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(15,29,51,0.9)', borderWidth: 3, borderColor: color }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color, letterSpacing: 1.5 }}>{text}</Text>
      </View>
    </Animated.View>
  );
}

/**
 * Nháy một lần mỗi khi `trigger` đổi (sai câu, quái lọt đích). `edge` thì chỉ viền đỏ,
 * không thì phủ màu. Bị tắt khi giảm chuyển động (đó là nháy, không phải thông tin).
 */
export function Flash({ trigger, color = '#EF4444', edge = false, width = 6, radius = 22, duration = 520 }: { trigger: number | string; color?: string; edge?: boolean; width?: number; radius?: number; duration?: number }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(0);
  useEffect(() => {
    if (reduced || trigger === 0 || trigger === '') return;
    o.value = withSequence(withTiming(1, { duration: 70 }), withTiming(0, { duration }));
  }, [trigger, duration, reduced, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: radius, ...(edge ? { borderWidth: width, borderColor: color } : { backgroundColor: color }) },
        st as AnimatedStyle<ViewStyle>,
      ]}
    />
  );
}

/** Lớp phủ tối dần rồi giữ nguyên (màn thua). Giảm chuyển động thì tối luôn. */
export function Veil({ color = 'rgba(8,12,24,0.72)', duration = 1200 }: { color?: string; duration?: number }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    o.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
  }, [duration, reduced, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: color }, st as AnimatedStyle<ViewStyle>]} />;
}

/* ---- Bổ sung cho Mưa Từ Vựng (chỉ thêm) ---- */

/**
 * Nền sao đêm: các chấm sáng nhấp nháy lệch pha, vị trí cố định theo `seed` nên
 * mỗi lần vẽ lại vẫn y nguyên. Giảm chuyển động thì các sao đứng yên, sáng vừa.
 */
export function Starfield({ seed = 'stars', count = 36, color = '#FFFFFF' }: { seed?: string; count?: number; color?: string }) {
  const stars = useMemo(() => {
    const rng = mulberry32(hashOf(seed));
    return Array.from({ length: count }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      size: 2 + rng() * 3,
      phase: rng(),
      period: 1300 + rng() * 1700,
    }));
  }, [seed, count]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {stars.map((s, i) => (
        <Twinkle key={i} x={s.x} y={s.y} size={s.size} phase={s.phase} period={s.period} color={color} />
      ))}
    </View>
  );
}

function Twinkle({ x, y, size, phase, period, color }: { x: number; y: number; size: number; phase: number; period: number; color: string }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 0.6 : 0);
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(
      phase * period,
      withRepeat(
        withSequence(
          withTiming(1, { duration: period / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.1, { duration: period / 2, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [period, phase, reduced, t]);
  const st = useAnimatedStyle(() => ({ opacity: 0.15 + 0.85 * t.value, transform: [{ scale: 0.6 + 0.6 * t.value }] }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        glowWeb(`0 0 ${size * 3}px ${color}`) as ViewStyle,
        st as AnimatedStyle<ViewStyle>,
      ]}
    />
  );
}

/**
 * Vạch đỏ nhấp nháy ở đáy sân: chỗ bong bóng ĐÚNG không được chạm tới. Nhấp nháy
 * chậm để báo nguy mà không chói mắt; giảm chuyển động thì đứng yên, vẫn đỏ rõ.
 */
export function DangerLine({ height = 6, color = JUICE.bad }: { height?: number; color?: string }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(reduced ? 0.9 : 0.4);
  useEffect(() => {
    if (reduced) return;
    o.value = withRepeat(
      withSequence(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }), withTiming(0.4, { duration: 520, easing: Easing.inOut(Easing.quad) })),
      -1,
      false,
    );
  }, [o, reduced]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height, backgroundColor: color }, glowWeb(`0 -4px 16px ${color}`) as ViewStyle, st as AnimatedStyle<ViewStyle>]}
    />
  );
}

function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ---- Bổ sung cho Quán Cà Phê Band 9 (chỉ thêm) ---- */

/**
 * Rơi từ trên xuống, chạm đáy thì nảy nhẹ rồi đứng yên: cốc coin rơi vào hộp tiền.
 * Đổi `key` là rơi lại. Giảm chuyển động thì hiện ngay ở chỗ cuối.
 */
export function FallIn({ children, distance = 56, duration = 380, style }: { children: React.ReactNode; distance?: number; duration?: number; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(reduced ? 0 : -distance);
  const o = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    o.value = withTiming(1, { duration: 100 });
    y.value = withSequence(
      withTiming(0, { duration, easing: Easing.in(Easing.quad) }),
      withSpring(-8, { damping: 6, stiffness: 320 }),
      withSpring(0, { damping: 9, stiffness: 260 }),
    );
  }, [distance, duration, o, reduced, y]);
  const st = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));
  return <Animated.View pointerEvents="none" style={[style, st as AnimatedStyle<ViewStyle>]}>{children}</Animated.View>;
}
