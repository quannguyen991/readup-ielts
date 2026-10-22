import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Modal, Pressable, Text, View } from 'react-native';

import { COSMIC } from './theme';
import { Icon } from '@/components/ui/Icon';
import { playSfx } from '@/services/hub/sfx';
import type { AchievementState } from '@/services/hub/achievements';

const CONFETTI_COLORS = ['#FFB020', '#FF5A1F', '#2E7D4F', '#3B82F6', '#A855F7', '#EC4899', '#22C55E'];
const PIECES = 28;
const BURST_COLORS = ['#FFD166', '#EF476F', '#06D6A0', '#118AB2', '#FFFFFF', '#FF9F1C'];

/** Hạt pháo giấy bay ra từ giữa, xoay và mờ dần. Chạy mỗi khi `run` chuyển sang true. */
function Confetti({ run }: { run: boolean }) {
  const pieces = useRef(
    Array.from({ length: PIECES }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      spin: new Animated.Value(0),
      opacity: new Animated.Value(0),
      dx: ((i * 53) % 260) - 130,
      dy: -120 - ((i * 37) % 200),
      size: 6 + ((i * 7) % 6),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    })),
  ).current;

  useEffect(() => {
    if (!run) return;
    const anims = pieces.map((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.spin.setValue(0);
      p.opacity.setValue(1);
      return Animated.parallel([
        Animated.timing(p.x, { toValue: p.dx, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(p.y, { toValue: p.dy + 320, duration: 1400, easing: Easing.in(Easing.quad), useNativeDriver: false }),
        Animated.timing(p.spin, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.sequence([Animated.delay(900), Animated.timing(p.opacity, { toValue: 0, duration: 500, useNativeDriver: false })]),
      ]);
    });
    Animated.stagger(18, anims).start();
  }, [run, pieces]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * 0.5,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              { rotate: p.spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Pháo hoa: vài đợt nổ ở các vị trí khác nhau, mỗi đợt là một vòng hạt bung ra rồi tắt. */
function Fireworks({ run }: { run: boolean }) {
  const BURSTS = 4;
  const PER = 14;
  const bursts = useRef(
    Array.from({ length: BURSTS }, (_, b) => ({
      left: [-90, 80, -20, 110][b]!,
      top: [-120, -60, 60, -150][b]!,
      delay: b * 320,
      parts: Array.from({ length: PER }, (__, i) => {
        const a = (i / PER) * Math.PI * 2;
        return {
          tx: Math.cos(a) * 70,
          ty: Math.sin(a) * 70,
          x: new Animated.Value(0),
          y: new Animated.Value(0),
          o: new Animated.Value(0),
          color: BURST_COLORS[(b + i) % BURST_COLORS.length]!,
        };
      }),
    })),
  ).current;

  useEffect(() => {
    if (!run) return;
    const anims = bursts.map((b) =>
      Animated.sequence([
        Animated.delay(b.delay),
        Animated.parallel(
          b.parts.flatMap((p) => {
            p.x.setValue(0);
            p.y.setValue(0);
            p.o.setValue(1);
            return [
              Animated.timing(p.x, { toValue: p.tx, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: false }),
              Animated.timing(p.y, { toValue: p.ty, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: false }),
              Animated.sequence([Animated.delay(380), Animated.timing(p.o, { toValue: 0, duration: 320, useNativeDriver: false })]),
            ];
          }),
        ),
      ]),
    );
    Animated.parallel(anims).start();
  }, [run, bursts]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      {bursts.map((b, bi) =>
        b.parts.map((p, i) => (
          <Animated.View
            key={`${bi}-${i}`}
            style={{
              position: 'absolute',
              left: b.left,
              top: b.top,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: p.color,
              opacity: p.o,
              transform: [{ translateX: p.x }, { translateY: p.y }],
            }}
          />
        )),
      )}
    </View>
  );
}

/** Tia sáng xoay chậm và quầng sáng nhịp phía sau huy hiệu. */
export function Glow({ size, active = true, children }: { size: number; active?: boolean; children: React.ReactNode }) {
  const spin = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!active) return undefined;
    const r = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: false }));
    const h = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(halo, { toValue: 0.6, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    r.start();
    h.start();
    return () => {
      r.stop();
      h.stop();
    };
  }, [active, spin, halo]);

  const rays = Array.from({ length: 12 }, (_, i) => i);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size,
            backgroundColor: 'rgba(255, 210, 90, 0.35)',
            opacity: halo,
            transform: [{ scale: halo.interpolate({ inputRange: [0.6, 1], outputRange: [0.9, 1.08] }) }],
          }}
        />
      ) : null}
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', width: size * 1.7, height: size * 1.7, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}
        >
          {rays.map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 4,
                height: size * 0.85,
                marginLeft: -2,
                marginTop: -(size * 0.85) / 2,
                backgroundColor: 'rgba(255, 220, 120, 0.55)',
                borderRadius: 2,
                transform: [{ rotate: `${(i * 360) / rays.length}deg` }],
              }}
            />
          ))}
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}

/** Màn chúc mừng khi mở khoá một huy hiệu: pháo giấy, pháo hoa, huy hiệu phát sáng, âm hiệu, XP thưởng. */
export function BadgeUnlockOverlay({ badge, onClose }: { badge: AchievementState | null; onClose: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: false }).start();
    playSfx('unlock');
  }, [badge, pop]);

  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(42, 24, 8, 0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Confetti run={!!badge} />
        <Fireworks run={!!badge} />
        {badge ? (
          <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COSMIC.line }}>
            <Text style={{ color: COSMIC.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>HUY HIỆU MỚI</Text>
            <Image source={{ uri: '/mascot/lion2d/leo-celebrate.png' }} accessibilityLabel="Leo ăn mừng" resizeMode="contain" style={{ width: 96, height: 96, marginTop: -6 }} />
            <Animated.View style={{ transform: [{ scale: pop }] }}>
              <Glow size={128}>
                <Image source={{ uri: `/badges/${badge.art}.png` }} accessibilityLabel={badge.title} resizeMode="contain" style={{ width: 128, height: 128 }} />
              </Glow>
            </Animated.View>
            <Text style={{ color: COSMIC.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>{badge.title}</Text>
            <Text style={{ color: COSMIC.body, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>{badge.desc}</Text>
            <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F3F0FB' }}>
              <Text style={{ color: COSMIC.primary, fontSize: 14, fontWeight: '800' }}>{`+${badge.bonusXp} XP`}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={{ alignSelf: 'stretch', height: 46, borderRadius: 12, backgroundColor: COSMIC.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Tuyệt vời</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/** Nhịp đập nhẹ liên tục (dùng cho mascot khi đang giữ chuỗi). */
export function Pulse({ active, children }: { active: boolean; children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, scale]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

/** Nảy lên một lần mỗi khi `trigger` đổi (dùng khi một nhiệm vụ vừa hoàn thành). */
export function Pop({ trigger, children }: { trigger: number; children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, friction: 3, tension: 180, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: false }),
    ]).start();
  }, [trigger, scale]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

/** Ngọn lửa chuỗi ngày: nhấp nháy, cao hơn và nóng hơn theo mốc chuỗi. */
export function Flame({ streak }: { streak: number }) {
  const flick = useRef(new Animated.Value(0)).current;
  const tier = streak >= 100 ? 2 : streak >= 30 ? 1 : 0;
  const size = tier === 2 ? 34 : tier === 1 ? 30 : 26;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flick, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(flick, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flick]);

  return (
    <Animated.View
      style={{
        transform: [
          { scale: flick.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          { rotate: flick.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) },
        ],
      }}
    >
      <Icon name="flame" size={size} color={tier === 2 ? '#7DD3FC' : tier === 1 ? '#FFE27A' : '#FFFFFF'} />
    </Animated.View>
  );
}
