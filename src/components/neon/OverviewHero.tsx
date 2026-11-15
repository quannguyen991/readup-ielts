import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';

import { NeonIcon, NeonPill } from '@/components/neon/Neon';
import type { NeonIconId } from '@/components/neon/neon-art';
import { OverviewBackdrop, type BackdropVariant } from '@/components/neon/OverviewBackdrop';

/**
 * Đầu trang tổng quan IELTS / SAT: nền minh hoạ rực rỡ vẽ bằng code, chữ lớn nhiều màu có khối nổi và vầng sáng,
 * vài viên số liệu và hai nút. Chỉ là giao diện: số liệu và đích đến do trang truyền vào.
 */
export type HeroPill = { icon: NeonIconId; label: string };

const LETTERS: [string, string][] = [
  ['#FF7AC8', '#A81F78'],
  ['#B98BFF', '#5A2BB5'],
  ['#4DA3FF', '#1A4FB8'],
  ['#2EEBDD', '#0C8F96'],
  ['#6CF59A', '#1E9A47'],
  ['#FFE14A', '#B8860B'],
];

/** Chữ nhiều màu theo từng ký tự, đổ khối bằng nhiều lớp bóng và có vầng sáng. Phông Shrikhand (chỉ Latin: dùng cho IELTS, SAT). */
export function RainbowTitle({ text, size }: { text: string; size: number }) {
  const [loaded] = useFonts({ Shrikhand_400Regular: require('../../../assets/fonts/Shrikhand_400Regular.ttf') });
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(v, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  const chars = Array.from(text);
  return (
    <Animated.View
      accessibilityRole="header"
      accessibilityLabel={text}
      style={{ flexDirection: 'row', justifyContent: 'center', transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }, { rotate: '-3deg' }] }}
    >
      {chars.map((ch, i) => {
        const [c, d] = LETTERS[i % LETTERS.length]!;
        const shadow =
          Platform.OS === 'web'
            ? ({ textShadow: `1px 1px 0 ${d}, 2px 2px 0 ${d}, 3px 3px 0 ${d}, 4px 4px 0 ${d}, 5px 5px 0 ${d}, 6px 6px 0 ${d}, 7px 8px 0 rgba(10,6,60,0.55), 0 0 26px ${c}` } as object)
            : { textShadowColor: d, textShadowOffset: { width: 4, height: 5 }, textShadowRadius: 0 };
        return (
          <Text
            key={`${ch}-${i}`}
            style={[{ fontFamily: loaded ? 'Shrikhand_400Regular' : undefined, fontWeight: loaded ? undefined : '900', fontSize: size, lineHeight: Math.round(size * 1.15), color: c, marginHorizontal: size * 0.015 }, shadow]}
          >
            {ch}
          </Text>
        );
      })}
    </Animated.View>
  );
}

export function OverviewHero({
  variant,
  text,
  pills,
  primary,
  secondary,
}: {
  variant: BackdropVariant;
  text: string;
  pills: HeroPill[];
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
}) {
  const wide = useWindowDimensions().width >= 760;
  const minHeight = wide ? 400 : 360;
  return (
    <View style={{ borderRadius: 30, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.38)', minHeight, ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 0 rgba(42,34,181,0.35), 0 24px 50px rgba(107,63,224,0.35)' } as object) : {}) }}>
      <OverviewBackdrop variant={variant} />
      <LinearGradient colors={['rgba(14,8,60,0)', 'rgba(14,8,60,0.1)', 'rgba(14,8,60,0.55)']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={{ flex: 1, padding: wide ? 28 : 16, gap: wide ? 12 : 8, justifyContent: 'space-between', minHeight }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {pills.map((p) => (
            <NeonPill key={p.label} icon={p.icon} label={p.label} />
          ))}
        </View>

        <RainbowTitle text={text} size={wide ? (text.length <= 3 ? 176 : 128) : (text.length <= 3 ? 112 : 84)} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <Pressable
            accessibilityRole="button"
            onPress={primary.onPress}
            style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) =>
              ({ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, paddingLeft: 22, paddingRight: 8, borderRadius: 27, backgroundColor: hovered ? '#FFE680' : '#FFD84A', borderWidth: 2, borderColor: '#FFF1A8', transform: [{ translateY: pressed ? 4 : 0 }], boxShadow: pressed ? '0 1px 0 #B88A00' : '0 5px 0 #B88A00' }) as object
            }
          >
            <Text className="font-nun-heavy" style={{ fontSize: 17, color: '#2B1D00' }}>
              {primary.label}
            </Text>
            <NeonIcon name="next" height={38} />
          </Pressable>
          {secondary ? (
            <Pressable
              accessibilityRole="button"
              onPress={secondary.onPress}
              style={({ hovered }: { hovered?: boolean }) => ({ minHeight: 54, paddingHorizontal: 20, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)' })}
            >
              <Text className="font-nun-heavy" style={{ fontSize: 16, color: '#FFFFFF' }}>
                {secondary.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
