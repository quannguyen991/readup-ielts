import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';
import { ITEMS } from '@/services/game/rules';
import { streakTierItem, streakTierStars } from '@/services/gamification/streak-tiers';
import { useGameStore } from '@/store/useGameStore';
import { ItemIcon } from '@/components/game/ItemIcon';

/** Mỗi mốc chỉ được thưởng một lần, kể cả khi React dựng lại (chế độ dev chạy effect hai lần). */
const granted = new Set<number>();

/**
 * Chuỗi câu đúng liên tiếp trong vòng học: cứ mỗi 5 câu đúng liên tiếp thì ngọn lửa bùng lên
 * giữa màn, màu đổi theo mốc. Sai một câu thì chuỗi về 0. Ngọn lửa dùng chung cho chip đầu vòng
 * và lần bùng. Hiệu ứng
 * chỉ dùng transform và opacity (chạy trên native driver khi có thể) và chỉ dựng khi có lần
 * bùng — không làm chậm các câu hỏi.
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

/**
 * Ngọn lửa theo mốc: ảnh sticker do ChatGPT vẽ, đã tách nền. Mốc 5–10 dùng bản đỏ cam,
 * từ 15 trở lên dùng bản tím.
 */
export function FlameIcon({ n, size }: { n: number; size: number }) {
  const art = n >= 15 ? '/icons/streak-flame-purple.png' : '/icons/streak-flame-red.png';
  return <Image source={{ uri: art }} resizeMode="contain" style={{ width: size, height: size }} accessible={false} />;
}

/** Chip nhỏ trên đầu vòng: ngọn lửa + "7 đúng liên tiếp" khi đang có chuỗi. */
export function StreakBadge({ n }: { n: number }) {
  const { L } = useL();
  if (n < STREAK_STEP) return null;
  const tier = tierOf(n);
  return (
    <View
      accessibilityLabel={L(`Chuỗi ${n} câu đúng liên tiếp`, `${n} correct in a row`)}
      className="flex-row items-center gap-1.5 rounded-pill px-3 py-1"
      style={{ backgroundColor: tier.to, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' }}
    >
      <FlameIcon n={n} size={16} />
      <Text className="font-heavy text-label" style={{ color: '#FFFFFF' }}>
        {n} {L('đúng liên tiếp', 'in a row')}
      </Text>
    </View>
  );
}

/** Hộp quà theo mốc, xoay vòng: 5 đỏ, 10 xanh dương, 15 tím, 20 vàng, 25 hồng, 30 xanh lá. */
const GIFT_ART = ['/icons/gift-red.png', '/icons/gift-blue.png', '/icons/gift-purple.png', '/icons/gift-gold.png', '/icons/gift-pink.png', '/icons/gift-green.png'];

function giftArt(n: number): string {
  const k = Math.max(0, n / STREAK_STEP - 1);
  return GIFT_ART[k % GIFT_ART.length]!;
}

/** Ổ cảm xúc: vòng 136px quanh ngọn lửa, tàn lửa bay từ gốc lên. Mọi số đều cố định để không đổi giữa các lần bùng. */
const FLAME_BOX = 136;
const EMBERS = Array.from({ length: 12 }, (_, i) => ({
  x: ((i * 29) % 100) - 50,
  drift: ((i * 17) % 40) - 20,
  rise: 90 + ((i * 23) % 80),
  size: 4 + (i % 3) * 2,
  delay: i * 45,
  gold: i % 2 === 0,
}));
const RING_DELAYS = [0, 180];

/**
 * Ngọn lửa bùng lên một lần rồi tắt. Các hiệu ứng chạy cùng lúc:
 * - lửa hiện từ dưới lên, lắc nhẹ (flicker) vài nhịp rồi lắng lại;
 * - hai vòng sóng nở ra từ gốc lửa;
 * - tàn lửa bay lên, lệch ngang và mờ dần;
 * - dòng chữ nảy lên sau khi lửa chạm đỉnh, rồi cả cụm rung nhẹ một cái.
 * Đổi `burstKey` là bùng lại. `n` là mốc (5, 10, 15…) để chọn màu và chữ.
 */
export function FlameBurst({ burstKey, n }: { burstKey: number; n: number }) {
  const { L } = useL();
  const native = Platform.OS !== 'web';
  const t = useRef(new Animated.Value(0)).current;
  const flick = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const jolt = useRef(new Animated.Value(0)).current;
  const rings = useRef(RING_DELAYS.map(() => new Animated.Value(0))).current;
  const embers = useRef(EMBERS.map(() => new Animated.Value(0))).current;
  const tier = tierOf(n);

  useEffect(() => {
    if (!granted.has(burstKey)) {
      granted.add(burstKey);
      useGameStore.getState().streakReward(n);
    }
    t.setValue(0);
    flick.setValue(0);
    pop.setValue(0);
    jolt.setValue(0);
    rings.forEach((v) => v.setValue(0));
    embers.forEach((v) => v.setValue(0));

    const rise = Animated.timing(t, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    });
    // Nhấp nháy vài nhịp rồi dừng, không chạy mãi.
    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(flick, { toValue: 1, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.timing(flick, { toValue: 0, duration: 240, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      ]),
      { iterations: 4 },
    );
    const shock = Animated.parallel(
      rings.map((v, i) =>
        Animated.timing(v, { toValue: 1, duration: 900, delay: RING_DELAYS[i], easing: Easing.out(Easing.quad), useNativeDriver: native }),
      ),
    );
    const sparks = Animated.parallel(
      embers.map((v, i) =>
        Animated.timing(v, { toValue: 1, duration: 1100, delay: EMBERS[i]!.delay, easing: Easing.out(Easing.quad), useNativeDriver: native }),
      ),
    );
    const label = Animated.sequence([
      Animated.delay(220),
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 140, useNativeDriver: native }),
    ]);
    const bump = Animated.sequence([
      Animated.delay(300),
      Animated.timing(jolt, { toValue: 1, duration: 60, useNativeDriver: native }),
      Animated.timing(jolt, { toValue: -1, duration: 80, useNativeDriver: native }),
      Animated.timing(jolt, { toValue: 0.5, duration: 80, useNativeDriver: native }),
      Animated.timing(jolt, { toValue: 0, duration: 80, useNativeDriver: native }),
    ]);

    const running = [rise, flicker, shock, sparks, label, bump];
    running.forEach((a) => a.start());
    return () => running.forEach((a) => a.stop());
  }, [burstKey, n, native, t, flick, pop, jolt, rings, embers]);

  const stars = streakTierStars(n);
  const item = streakTierItem(n);

  const scale = t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.4, 1.12, 1] });
  const opacity = t.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] });
  const lift = t.interpolate({ inputRange: [0, 1], outputRange: [24, -18] });
  const flameStretch = flick.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const flameSway = flick.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const shake = jolt.interpolate({ inputRange: [-1, 0, 1], outputRange: [-6, 0, 6] });

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '14%', alignItems: 'center', zIndex: 50 }}>
      <Animated.View style={{ opacity, transform: [{ scale }, { translateY: lift }, { translateX: shake }], alignItems: 'center' }}>
        <View style={{ width: FLAME_BOX, height: FLAME_BOX }}>
          {rings.map((v, i) => (
            <Animated.View
              key={`ring-${i}`}
              style={{
                position: 'absolute',
                left: FLAME_BOX / 2 - 60,
                top: FLAME_BOX / 2 - 60,
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 3,
                borderColor: tier.from,
                opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
                transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.4] }) }],
              }}
            />
          ))}
          <Animated.View style={{ transform: [{ scaleY: flameStretch }, { rotate: flameSway }] }}>
            <FlameIcon n={n} size={FLAME_BOX} />
          </Animated.View>
          {embers.map((v, i) => {
            const e = EMBERS[i]!;
            return (
              <Animated.View
                key={`ember-${i}`}
                style={{
                  position: 'absolute',
                  left: FLAME_BOX / 2 + e.x - e.size / 2,
                  top: FLAME_BOX - 18,
                  width: e.size,
                  height: e.size,
                  borderRadius: e.size / 2,
                  backgroundColor: e.gold ? '#FFE08A' : tier.from,
                  opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
                  transform: [
                    { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -e.rise] }) },
                    { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, e.drift] }) },
                    { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
                  ],
                }}
              />
            );
          })}
        </View>
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: pop.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }}
        >
          <View className="mt-2 rounded-pill px-4 py-1.5" style={{ backgroundColor: tier.to, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
            <Text className="font-heavy text-body" style={{ color: '#FFFFFF' }}>
              {L(`${n} câu đúng liên tiếp!`, `${n} in a row!`)}
            </Text>
          </View>
          {stars > 0 ? (
            <View className="mt-1.5 flex-row items-center gap-2 rounded-pill py-1 pl-1 pr-3" style={{ backgroundColor: 'rgba(27,24,64,0.62)' }}>
              <Image source={{ uri: giftArt(n) }} resizeMode="contain" style={{ width: 30, height: 30 }} accessible={false} />
              <Text className="font-strong text-label" style={{ color: '#FFFFFF' }}>
                {`+${stars} ⭐`}
              </Text>
              {item ? <ItemIcon kind={item} size={18} /> : null}
              {item ? (
                <Text className="font-strong text-label" style={{ color: '#FFFFFF' }}>
                  {ITEMS[item].name}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </View>
  );
}
