import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import type { QuestMap } from '@/services/quest/types';

const ART: Record<QuestMap['id'], number> = {
  'iron-frontier': require('../../../assets/quest/iron-frontier.webp'),
  'fjord-runes': require('../../../assets/quest/fjord-runes.webp'),
  'infinite-dungeon': require('../../../assets/quest/infinite-dungeon.webp'),
};
const QUEST_WORLD_BACKGROUND = require('../../../assets/quest/quest-world-bg.webp');
const SPRITES: Record<QuestMap['id'], number> = {
  'iron-frontier': require('../../../assets/quest/iron-sprites.webp'),
  'fjord-runes': require('../../../assets/quest/fjord-sprites.webp'),
  'infinite-dungeon': require('../../../assets/quest/dungeon-sprites.webp'),
};

/** Nền thế giới chung cho Quest home: một panorama game liền mạch. */
export function QuestWorldBackground() {
  return (
    <View className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#091126]">
      <Image source={QUEST_WORLD_BACKGROUND} className="absolute inset-0 h-full w-full" contentFit="cover" />
      <LinearGradient colors={['#081126B8', '#0B163B66', '#1B1038B8']} className="absolute inset-0" />
      <View className="absolute inset-0 bg-black/10" />
    </View>
  );
}

export function QuestBackdrop({ map, children, minHeight = 250 }: { map: QuestMap; children?: React.ReactNode; minHeight?: number }) {
  return (
    <View className="relative overflow-hidden rounded-card border border-white/20" style={{ minHeight }}>
      <Image source={ART[map.id]} className="absolute inset-0 h-full w-full" contentFit="cover" />
      <LinearGradient
        colors={[`${map.deep}E8`, `${map.deep}66`, `${map.deep}DD`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      {children}
    </View>
  );
}

export function BattleCharacters({ map, phase = 'idle' }: { map: QuestMap; phase?: 'idle' | 'attack' | 'counter' }) {
  const reduced = useReducedMotion();
  const motion = useSharedValue(0);
  const travel = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      motion.value = phase === 'idle' ? 0 : phase === 'attack' ? 1 : -1;
      travel.value = phase === 'idle' ? 0 : 1;
      return;
    }
    if (phase === 'attack') {
      motion.value = withSequence(withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }), withSpring(0, { damping: 8, stiffness: 180 }));
      travel.value = withSequence(withTiming(1, { duration: 440, easing: Easing.inOut(Easing.cubic) }), withTiming(0, { duration: 120 }));
    } else if (phase === 'counter') {
      motion.value = withSequence(withTiming(-1, { duration: 220, easing: Easing.out(Easing.cubic) }), withSpring(0, { damping: 8, stiffness: 160 }));
      travel.value = withSequence(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.cubic) }), withTiming(0, { duration: 100 }));
    } else {
      motion.value = withTiming(0, { duration: 160 });
      travel.value = withTiming(0, { duration: 120 });
    }
    // phase is intentionally the only trigger; shared value is a mutable animation target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced]);

  const playerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(motion.value, [-1, 0, 1], [-10, 0, 18]) }, { scale: phase === 'attack' ? 1.04 : 1 }] }));
  const enemyStyle = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(motion.value, [-1, 0, 1], [-18, 0, 10]) }, { scale: phase === 'counter' ? 1.04 : 1 }] }));
  const projectileStyle = useAnimatedStyle(() => ({
    opacity: phase === 'idle' ? 0 : 1,
    transform: [{ translateX: phase === 'counter' ? interpolate(travel.value, [0, 1], [130, -160]) : interpolate(travel.value, [0, 1], [-130, 165]) }, { rotate: phase === 'counter' ? '168deg' : '-12deg' }],
  }));
  const attackImpactStyle = useAnimatedStyle(() => ({ opacity: phase === 'attack' ? interpolate(travel.value, [0, 0.72, 1], [0, 1, 0]) : 0, transform: [{ scale: interpolate(travel.value, [0, 0.72, 1], [0.5, 1.25, 1.6]) }] }));
  const counterImpactStyle = useAnimatedStyle(() => ({ opacity: phase === 'counter' ? interpolate(travel.value, [0, 0.72, 1], [0, 1, 0]) : 0, transform: [{ scale: interpolate(travel.value, [0, 0.72, 1], [0.5, 1.25, 1.6]) }] }));
  const attackLabelStyle = useAnimatedStyle(() => ({ opacity: phase === 'attack' ? interpolate(travel.value, [0, 0.72, 1], [0, 1, 0]) : 0, transform: [{ translateY: interpolate(travel.value, [0, 0.72, 1], [12, -18, -32]) }] }));
  const counterLabelStyle = useAnimatedStyle(() => ({ opacity: phase === 'counter' ? interpolate(travel.value, [0, 0.72, 1], [0, 1, 0]) : 0, transform: [{ translateY: interpolate(travel.value, [0, 0.72, 1], [12, -18, -32]) }] }));
  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, playerStyle]}>
        <Image source={SPRITES[map.id]} className="absolute inset-0 h-full w-full" contentFit="contain" />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', right: '23%', top: '48%', zIndex: 20 }, projectileStyle]}>
        <View className="h-2.5 w-20 rounded-full bg-orange-300 shadow-lg" />
        <View className="absolute -left-2 -top-1 h-4 w-4 rounded-full bg-yellow-100" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, enemyStyle]} />
      <Animated.View style={[{ position: 'absolute', right: '20%', top: '41%', zIndex: 22 }, attackImpactStyle]}>
        <View className="h-20 w-20 rounded-full border-4 border-amber-100 bg-orange-300/45" />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: '19%', top: '45%', zIndex: 22 }, counterImpactStyle]}>
        <View className="h-24 w-24 rounded-full border-4 border-rose-100 bg-rose-400/50" />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', right: '19%', top: '35%', zIndex: 23 }, attackLabelStyle]}>
        <Text className="font-heavy text-3xl text-amber-200">+DAMAGE</Text>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: '18%', top: '39%', zIndex: 23 }, counterLabelStyle]}>
        <Text className="font-heavy text-3xl text-rose-200">-7 HP</Text>
      </Animated.View>
      <View className="absolute bottom-3 left-[16%] rounded-pill bg-black/55 px-3 py-1">
        <Text className="font-strong text-label text-white">READUP UNIT</Text>
      </View>
      <View className="absolute bottom-3 right-[16%] rounded-pill bg-black/55 px-3 py-1">
        <Text className="font-strong text-label text-white">ENEMY</Text>
      </View>
    </View>
  );
}

export function BattleDamageFlash({ phase, disabled = false }: { phase: 'idle' | 'attack' | 'counter'; disabled?: boolean }) {
  const flash = useSharedValue(0);
  useEffect(() => {
    flash.value = !disabled && phase === 'counter' ? withSequence(withTiming(0.45, { duration: 80 }), withTiming(0, { duration: 460 })) : withTiming(0, { duration: 120 });
    // phase is intentionally the only trigger for this one-shot overlay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, phase]);
  const style = useAnimatedStyle(() => ({ opacity: flash.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]} className="bg-rose-600" />;
}
