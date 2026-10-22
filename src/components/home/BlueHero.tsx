import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { HeroBackdrop } from '@/components/home/HeroBackdrop';
import { Icon } from '@/components/ui/Icon';

/**
 * Hero trang chủ: nền hoạ tiết lớn (HeroBackdrop), viền gradient hồng–vàng–xanh–tím, một khung chấm bên
 * trong với bốn sao ở góc và kim cương nhỏ giữa hai cạnh ngang. Chữ trắng bên trái, chip tiêu đề giữ dải
 * năm màu. Các trang luyện thi (SAT, IELTS) dùng cùng khuôn này, chỉ đổi chữ và nút bấm.
 */

const INK = '#0B0520';
const ACCENT = '#FF5FA2';
const CHIP = ['#E0413A', '#F28C28', '#F5C518', '#3DBE6B', '#3F8AE0'] as unknown as [string, string, ...string[]];
const FRAME = ['#FF5FA2', '#FFD84A', '#3A8CFF', '#8A3FE0'] as unknown as [string, string, ...string[]];
const STAR4 = 'M0 -20 C2 -6 6 -2 20 0 C6 2 2 6 0 20 C-2 6 -6 2 -20 0 C-6 -2 -2 -6 0 -20 Z';

/** Khung chấm bên trong, bốn sao ở góc và kim cương giữa hai cạnh ngang. Chỉ trang trí, không nhận chạm. */
function FrameOrnaments({ wide }: { wide: boolean }) {
  const inset = wide ? 14 : 10;
  const corners = [
    { top: 2, left: 2 },
    { top: 2, right: 2 },
    { bottom: 2, left: 2 },
    { bottom: 2, right: 2 },
  ];
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          borderRadius: wide ? 22 : 16,
          borderWidth: 1,
          borderStyle: 'dotted',
          borderColor: 'rgba(27,17,64,0.35)',
        }}
      />
      {corners.map((pos, i) => (
        <View key={i} pointerEvents="none" style={{ position: 'absolute', width: 26, height: 26, ...pos }}>
          <Svg width="100%" height="100%" viewBox="-20 -20 40 40">
            <Path d={STAR4} fill={ACCENT} />
          </Svg>
        </View>
      ))}
      {[{ top: inset - 4.5 }, { bottom: inset - 4.5 }].map((pos, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: '50%',
            marginLeft: -4.5,
            width: 9,
            height: 9,
            backgroundColor: ACCENT,
            transform: [{ rotate: '45deg' }],
            ...pos,
          }}
        />
      ))}
    </>
  );
}

export function BlueHero({
  eyebrow,
  chip,
  title,
  subtitle,
  primary,
  secondary,
  footer,
  wide,
}: {
  eyebrow: string;
  /** Từ đầu tiêu đề, đặt trong chip năm màu. */
  chip?: string;
  title: string;
  subtitle: string;
  /** Nút chính; trang không có hành động chính thì bỏ qua. */
  primary?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  /** Dải số liệu hoặc nhãn phụ đặt dưới nút bấm. */
  footer?: React.ReactNode;
  wide: boolean;
}) {
  const titleSize = wide ? 58 : 34;
  const titleLine = wide ? 64 : 42;
  const radius = wide ? 32 : 24;

  return (
    <LinearGradient
      colors={FRAME}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: '100%',
        borderRadius: radius,
        padding: 2,
        ...(Platform.OS === 'web' ? {} : { elevation: 8 }),
      }}
    >
      <View style={{ borderRadius: radius - 2, overflow: 'hidden', backgroundColor: INK }}>
        <HeroBackdrop />
        <FrameOrnaments wide={wide} />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: wide ? 60 : 20,
            paddingVertical: wide ? 56 : 28,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5FA2' }} />
              <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.8, color: 'rgba(27,17,64,0.9)' }}>
                {eyebrow}
              </Text>
            </View>

            <View style={{ marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: wide ? 14 : 10 }}>
              {chip ? (
                <LinearGradient
                  colors={CHIP}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ maxWidth: '100%', borderRadius: wide ? 16 : 12, paddingHorizontal: wide ? 18 : 12, paddingVertical: wide ? 4 : 2, transform: [{ skewX: '-8deg' }] }}
                >
                  <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: titleSize, lineHeight: titleLine, color: '#FFFFFF' }}>{chip}</Text>
                </LinearGradient>
              ) : null}
              <Text
                accessibilityRole="header"
                style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: titleSize, lineHeight: titleLine, color: '#1B1140', letterSpacing: -1.1 }}
              >
                {title}
              </Text>
            </View>

            <Text
              className="font-sans"
              style={{ marginTop: wide ? 22 : 16, fontSize: wide ? 17 : 15, lineHeight: wide ? 27 : 22, color: 'rgba(27,17,64,0.85)', maxWidth: 520 }}
            >
              {subtitle}
            </Text>

            {primary || secondary ? (
              <View style={{ marginTop: wide ? 34 : 24, flexDirection: wide ? 'row' : 'column', flexWrap: 'wrap', gap: 10, alignItems: wide ? 'center' : 'stretch' }}>
                {primary ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={primary.onPress}
                    style={({ pressed }: { pressed: boolean }) => ({
                      height: 52,
                      paddingHorizontal: 26,
                      borderRadius: 999,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 10,
                      backgroundColor: '#1B1140',
                      opacity: pressed ? 0.92 : 1,
                      ...(Platform.OS === 'web' ? ({ boxShadow: '0 12px 30px rgba(0,0,0,0.3)' } as object) : {}),
                    })}
                  >
                    <Text className="font-strong" style={{ fontSize: 16, color: '#FFFFFF' }}>
                      {primary.label}
                    </Text>
                    <Icon name="arrow-right" size={18} color="#E23E8A" strokeWidth={2.2} />
                  </Pressable>
                ) : null}
                {secondary ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={secondary.onPress}
                    style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                      height: 52,
                      paddingHorizontal: 24,
                      borderRadius: 999,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: 'rgba(27,17,64,0.6)',
                      backgroundColor: pressed || hovered ? 'rgba(27,17,64,0.08)' : 'transparent',
                    })}
                  >
                    <Text className="font-strong" style={{ fontSize: 16, color: '#1B1140' }}>
                      {secondary.label}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {footer ? (
              <View style={{ marginTop: wide ? 26 : 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{footer}</View>
            ) : null}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
