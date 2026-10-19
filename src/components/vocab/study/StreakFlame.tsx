import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useL } from '@/i18n/useL';

/**
 * Chuỗi câu đúng liên tiếp trong vòng học: cứ mỗi 5 câu đúng liên tiếp thì ngọn lửa bùng lên
 * giữa màn, màu đổi theo mốc. Sai một câu thì chuỗi về 0. Hiệu ứng chỉ dùng transform và
 * opacity (chạy trên native driver khi có thể) và chỉ dựng khi có lần bùng — không làm
 * chậm các câu hỏi.
 */

export const STREAK_STEP = 5;

type Tier = { from: string; to: string; glow: string };

/** Màu theo mốc: 5 đỏ, 10 đỏ cam, 15 tím, từ 20 trở đi tím đậm. */
export function tierOf(n: number): Tier {
  if (n >= 20) return { from: '#A78BFA', to: '#4C1D95', glow: 'rgba(124,58,237,0.55)' };
  if (n >= 15) return { from: '#C084FC', to: '#7C3AED', glow: 'rgba(168,85,247,0.5)' };
  if (n >= 10) return { from: '#FB923C', to: '#DC2626', glow: 'rgba(249,115,22,0.5)' };
  return { from: '#F87171', to: '#B91C1C', glow: 'rgba(239,68,68,0.5)' };
}

/** Chip nhỏ trên đầu vòng: "🔥 7" khi đang có chuỗi. */
export function StreakBadge({ n }: { n: number }) {
  const { L } = useL();
  if (n < STREAK_STEP) return null;
  const tier = tierOf(n);
  return (
    <View
      accessibilityLabel={L(`Chuỗi ${n} câu đúng liên tiếp`, `${n} correct in a row`)}
      className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-1.5"
      style={{ backgroundColor: tier.from }}
    >
      <Text style={{ fontSize: 14 }}>🔥</Text>
      <Text className="font-heavy text-label" style={{ color: '#FFFFFF' }}>
        {n} {L('đúng liên tiếp', 'in a row')}
      </Text>
    </View>
  );
}

/**
 * Ngọn lửa bùng lên một lần rồi tắt. Đổi `burstKey` là bùng lại. `n` là mốc (5, 10, 15…)
 * để chọn màu và chữ.
 */
export function FlameBurst({ burstKey, n }: { burstKey: number; n: number }) {
  const { L } = useL();
  const native = Platform.OS !== 'web';
  const t = useRef(new Animated.Value(0)).current;
  const tier = tierOf(n);

  useEffect(() => {
    t.setValue(0);
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    });
    anim.start();
    return () => anim.stop();
  }, [burstKey, native, t]);

  const scale = t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.4, 1.12, 1] });
  const opacity = t.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] });
  const rise = t.interpolate({ inputRange: [0, 1], outputRange: [24, -18] });

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '14%', alignItems: 'center', zIndex: 50 }}>
      <Animated.View style={{ opacity, transform: [{ scale }, { translateY: rise }], alignItems: 'center' }}>
        <View style={{ width: 150, height: 150, borderRadius: 75, overflow: 'hidden', shadowColor: tier.glow, shadowOpacity: 1, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } }}>
          <LinearGradient colors={[tier.from, tier.to]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 68 }}>🔥</Text>
          </LinearGradient>
        </View>
        <Text className="mt-3 font-heavy text-body" style={{ color: tier.to, textShadowColor: 'rgba(255,255,255,0.9)', textShadowRadius: 6 }}>
          {L(`${n} câu đúng liên tiếp!`, `${n} in a row!`)}
        </Text>
      </Animated.View>
    </View>
  );
}
