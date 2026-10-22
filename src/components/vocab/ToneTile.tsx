import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { AreaArt } from '@/components/home/AreaArt';
import { GlossOrb } from '@/components/ui/GlossOrb';
import { Icon, type IconName } from '@/components/ui/Icon';
import { LazyMount } from '@/components/ui/LazyMount';

const STAR4 = 'M0 -20 C2 -6 6 -2 20 0 C6 2 2 6 0 20 C-2 6 -6 2 -20 0 C-6 -2 -2 -6 0 -20 Z';

/** Pha màu hex với trắng theo tỉ lệ t, ra một tông nhạt cùng họ. */
function lighten(hex: string, t: number): string {
  const safe = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#6A4BD9';
  const n = parseInt(safe.replace('#', ''), 16);
  const ch = (shift: number) => {
    const c = (n >> shift) & 255;
    return Math.round(c + (255 - c) * t).toString(16).padStart(2, '0');
  };
  return '#' + ch(16) + ch(8) + ch(0);
}

/** Băm chuỗi thành số nguyên (FNV-1a), để seed chọn một bố cục hoạ tiết. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Thẻ luyện kiểu ảnh tham chiếu: nền gradient đậm theo màu, một khung hoạ tiết hình học ở đầu thẻ, quả cầu
 * icon chồng lên khung, tiêu đề trắng, dòng mô tả và nút mũi tên tròn ở góc dưới. `value` là số lớn ở góc
 * khung (ô đếm), `chip` là nhãn pill ngắn ở góc dưới.
 */
export function ToneTile({
  seed,
  tone,
  icon,
  title,
  sub,
  value,
  chip,
  onPress,
  disabled = false,
  minHeight = 220,
  style,
}: {
  seed: string;
  /** Màu gốc của thẻ: gradient từ tông sáng đến màu này. */
  tone: string;
  icon: IconName;
  title: string;
  sub?: string;
  value?: number | string;
  chip?: string;
  onPress: () => void;
  disabled?: boolean;
  minHeight?: number;
  style?: ViewStyle;
}) {
  const deep = /^#[0-9a-fA-F]{6}$/.test(tone) ? tone : '#6A4BD9';
  const light = lighten(deep, 0.18);
  const artHeight = Math.round(minHeight * 0.5);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sub ? `${title}. ${sub}` : title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight,
        borderRadius: 26,
        overflow: 'hidden',
        opacity: disabled ? 0.55 : pressed ? 0.94 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...style,
      })}
    >
      <LinearGradient colors={[light, deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={{ flex: 1, padding: 12, gap: 10 }}>
        <View style={{ height: artHeight, borderRadius: 18, overflow: 'hidden' }}>
          <LazyMount
            style={StyleSheet.absoluteFill}
            placeholder={<LinearGradient colors={[lighten(deep, 0.5), deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
          >
            <AreaArt tone={[lighten(deep, 0.5), deep]} variant={hash(seed) % 8} />
          </LazyMount>

          <View pointerEvents="none" style={{ position: 'absolute', left: 10, top: 10 }}>
            <GlossOrb icon={icon} tone={[lighten(deep, 0.35), deep]} size={40} />
          </View>

          {value !== undefined ? (
            <View style={{ position: 'absolute', right: 10, top: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.94)', paddingHorizontal: 10, paddingVertical: 2 }}>
              <Text className="font-heavy text-sectionTitle" style={{ color: deep, lineHeight: 30 }}>
                {value}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1, justifyContent: 'flex-end', gap: 4 }}>
          <Text numberOfLines={2} className="font-heavy text-cardTitle" style={{ color: '#FFFFFF', lineHeight: 24 }}>
            {title}
          </Text>
          {sub ? (
            <Text numberOfLines={2} className="font-sans text-label" style={{ color: 'rgba(255,255,255,0.92)', lineHeight: 17 }}>
              {sub}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            {chip ? (
              <View style={{ borderRadius: 999, backgroundColor: 'rgba(20,10,40,0.3)', paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text className="font-heavy text-label" style={{ color: '#FFFFFF', letterSpacing: 0.6 }}>
                  {chip.toUpperCase()}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="arrow-right" size={16} color={deep} strokeWidth={2.2} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Thẻ đứng nhỏ cho cách luyện: hoạ tiết ở trên với quả cầu icon, vòng và sao trang trí; tên, mô tả và mũi
 * tên ở dưới. Xếp thành một cột dọc, mỗi thẻ hẹp và cao hơn dòng ngang.
 */
export function ToneCard({
  seed,
  tone,
  icon,
  title,
  sub,
  chip,
  onPress,
  disabled = false,
  style,
}: {
  seed: string;
  tone: string;
  icon: IconName;
  title: string;
  sub?: string;
  chip?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const deep = /^#[0-9a-fA-F]{6}$/.test(tone) ? tone : '#6A4BD9';
  const light = lighten(deep, 0.18);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sub ? `${title}. ${sub}` : title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        borderRadius: 22,
        overflow: 'hidden',
        opacity: disabled ? 0.55 : pressed ? 0.94 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...style,
      })}
    >
      <LinearGradient colors={[light, deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={{ padding: 10, gap: 10 }}>
        <View style={{ height: 96, borderRadius: 16, overflow: 'hidden' }}>
          <LazyMount
            style={StyleSheet.absoluteFill}
            placeholder={<LinearGradient colors={[lighten(deep, 0.5), deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
          >
            <AreaArt tone={[lighten(deep, 0.5), deep]} variant={hash(seed) % 8} />
          </LazyMount>

          {/* Chi tiết trang trí: vòng mảnh ở góc dưới và một sao nhỏ trên đỉnh. */}
          <View pointerEvents="none" style={{ position: 'absolute', right: -10, bottom: -10, width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' }} />
          <View pointerEvents="none" style={{ position: 'absolute', right: 10, top: 8, width: 14, height: 14 }}>
            <Svg width="100%" height="100%" viewBox="-20 -20 40 40">
              <Path d={STAR4} fill="#FFFFFF" opacity={0.92} />
            </Svg>
          </View>

          <View pointerEvents="none" style={{ position: 'absolute', left: 8, top: 8 }}>
            <GlossOrb icon={icon} tone={[lighten(deep, 0.35), deep]} size={36} />
          </View>

          {chip ? (
            <View style={{ position: 'absolute', left: 8, bottom: 8, borderRadius: 999, backgroundColor: 'rgba(20,10,40,0.3)', paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 10, letterSpacing: 0.6 }}>
                {chip.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 3, paddingHorizontal: 2 }}>
          <Text numberOfLines={1} className="font-heavy text-cardTitle" style={{ color: '#FFFFFF' }}>
            {title}
          </Text>
          {sub ? (
            <Text numberOfLines={2} className="font-sans text-label" style={{ color: 'rgba(255,255,255,0.92)', lineHeight: 16, minHeight: 32 }}>
              {sub}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 2 }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow-right" size={14} color={deep} strokeWidth={2.2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
