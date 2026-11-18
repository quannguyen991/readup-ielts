import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { NeonBackdrop, NeonIcon, NeonPill, usePixelFont, type NeonScene } from '@/components/neon/Neon';
import type { NeonIconId } from '@/components/neon/neon-art';

/**
 * ĐẦU TRANG KIỂU "HÔM NAY": nền đêm xanh tím có lưới, sao pixel và họa tiết trôi nhẹ (NeonBackdrop), vài viên số liệu có icon,
 * tiêu đề pixel nhiều màu nổi khối (phông VT323 — có đủ dấu tiếng Việt, khác Shrikhand của chữ IELTS/SAT), một dòng mô tả
 * và nút vàng bấm lún. Chỉ là giao diện; nội dung và đích đến do trang truyền vào.
 */
export type HeroPillSpec = { icon: NeonIconId; label: string };
export type HeroButton = { label: string; onPress: () => void };

const LETTERS: [string, string][] = [
  ['#FF7AC8', '#A81F78'],
  ['#B98BFF', '#5A2BB5'],
  ['#4DA3FF', '#1A4FB8'],
  ['#2EEBDD', '#0C8F96'],
  ['#6CF59A', '#1E9A47'],
  ['#FFE14A', '#B8860B'],
];

/** Chữ pixel nhiều màu theo từng ký tự (bỏ qua khoảng trắng khi đếm màu), đổ khối bằng nhiều lớp bóng + vầng sáng. */
export function PixelRainbowTitle({ text, size, align = 'center' }: { text: string; size: number; align?: 'center' | 'left' }) {
  const ok = usePixelFont();
  let k = 0;
  return (
    <Text
      accessibilityRole="header"
      accessibilityLabel={text}
      style={{ textAlign: align, fontFamily: ok ? 'VT323_400Regular' : undefined, fontWeight: ok ? undefined : '900', fontSize: size, lineHeight: Math.round(size * 1.02), letterSpacing: 1 }}
    >
      {Array.from(text).map((ch, i) => {
        if (ch === ' ') return <Text key={i}>{' '}</Text>;
        const [c, d] = LETTERS[k++ % LETTERS.length]!;
        const e = Math.max(3, Math.round(size / 14));
        const shadow =
          Platform.OS === 'web'
            ? ({ textShadow: `${Array.from({ length: e }, (_, n) => `${n + 1}px ${n + 1}px 0 ${d}`).join(', ')}, ${e + 2}px ${e + 3}px 0 rgba(10,6,60,0.55), 0 0 22px ${c}` } as object)
            : { textShadowColor: d, textShadowOffset: { width: e, height: e }, textShadowRadius: 0 };
        return (
          <Text key={i} style={[{ color: c }, shadow]}>
            {ch}
          </Text>
        );
      })}
    </Text>
  );
}

export function GoldButton({ label, onPress }: HeroButton) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) =>
        ({ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingLeft: 22, paddingRight: 8, borderRadius: 26, backgroundColor: hovered ? '#FFE680' : '#FFD84A', borderWidth: 2, borderColor: '#FFF1A8', transform: [{ translateY: pressed ? 4 : 0 }], boxShadow: pressed ? '0 1px 0 #B88A00' : '0 5px 0 #B88A00' }) as object
      }
    >
      <Text className="font-nun-heavy" style={{ fontSize: 16, color: '#2B1D00' }}>
        {label}
      </Text>
      <NeonIcon name="next" height={36} />
    </Pressable>
  );
}

export function GlassButton({ label, onPress }: HeroButton) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered }) => ({ minHeight: 52, paddingHorizontal: 20, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)' })}
    >
      <Text className="font-nun-heavy" style={{ fontSize: 15, color: '#FFFFFF' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function NightHero({
  title,
  sub,
  pills = [],
  scene = 'path',
  primary,
  secondary,
  compact = false,
}: {
  title: string;
  sub?: string;
  pills?: HeroPillSpec[];
  scene?: NeonScene;
  primary?: HeroButton;
  secondary?: HeroButton;
  /** Bản thấp hơn cho trang phụ (từ điển, danh sách bài). */
  compact?: boolean;
}) {
  const wide = useWindowDimensions().width >= 760;
  const minHeight = compact ? (wide ? 230 : 200) : wide ? 300 : 260;
  return (
    <View style={{ borderRadius: 30, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.38)', minHeight, ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 0 rgba(42,34,181,0.35), 0 24px 50px rgba(107,63,224,0.3)' } as object) : {}) }}>
      <NeonBackdrop scene={scene} dense={false} />
      <LinearGradient colors={['rgba(14,8,60,0)', 'rgba(14,8,60,0.12)', 'rgba(14,8,60,0.5)']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={{ flex: 1, minHeight, padding: wide ? 24 : 14, paddingHorizontal: wide ? 90 : 14, gap: wide ? 10 : 8, justifyContent: 'center', alignItems: 'center' }}>
        {pills.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {pills.map((p) => (
              <NeonPill key={p.label} icon={p.icon} label={p.label} />
            ))}
          </View>
        ) : null}
        <PixelRainbowTitle text={title} size={wide ? (compact ? 64 : 84) : compact ? 44 : 54} />
        {sub ? (
          <Text className="font-nun-strong" style={{ fontSize: wide ? 17 : 15, lineHeight: wide ? 25 : 22, color: 'rgba(255,255,255,0.9)', textAlign: 'center', maxWidth: 640, ...(Platform.OS === 'web' ? ({ textShadow: '0 2px 10px rgba(10,6,60,0.7)' } as object) : {}) }}>
            {sub}
          </Text>
        ) : null}
        {primary || secondary ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
            {primary ? <GoldButton {...primary} /> : null}
            {secondary ? <GlassButton {...secondary} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
