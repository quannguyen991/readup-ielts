import React from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/ui/Icon';

/**
 * Hero trang chủ theo phong cách trần fresco baroque phai màu: ảnh ghép cắt dán trên trần vẽ
 * (public/home/fresco-hero.jpg). Cùng props với BlueHero để đổi một dòng trong trang giới thiệu.
 *
 * Chữ nằm trên dải tối gradient bên trái để đọc rõ trên nền trần sáng; khung vàng chạm khắc là
 * viền trang trí quanh ảnh, không nhận chạm.
 */

const NAVY = '#1B2A4A';
const NAVY_DEEP = '#0F1A33';
const GOLD = '#E6C27A';
const GOLD_DEEP = '#B8893F';
const CREAM = '#FBF4E4';
const HERO_SRC = '/home/fresco-hero.jpg';

export function FrescoHero({
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
  chip?: string;
  title: string;
  subtitle: string;
  primary?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  footer?: React.ReactNode;
  wide: boolean;
}) {
  const titleSize = wide ? 56 : 34;
  const titleLine = wide ? 62 : 40;
  const radius = wide ? 30 : 22;
  const fontSerif = Platform.OS === 'web' ? 'Cambria, Georgia, serif' : 'serif';

  return (
    <View
      style={{
        width: '100%',
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: NAVY_DEEP,
        borderWidth: 2,
        borderColor: GOLD_DEEP,
        ...(Platform.OS === 'web' ? { boxShadow: '0 18px 40px rgba(15,26,51,0.28)' } : { elevation: 8 }),
      } as object}
    >
      <View style={{ minHeight: wide ? 520 : 460, width: '100%' }}>
        <Image
          source={{ uri: HERO_SRC }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        />
        <LinearGradient
          colors={['rgba(15,26,51,0.92)', 'rgba(15,26,51,0.55)', 'rgba(15,26,51,0.0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: wide ? 14 : 10,
            left: wide ? 14 : 10,
            right: wide ? 14 : 10,
            bottom: wide ? 14 : 10,
            borderRadius: radius - 6,
            borderWidth: 1,
            borderColor: 'rgba(230,194,122,0.55)',
          }}
        />

        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            maxWidth: wide ? '62%' : '100%',
            paddingHorizontal: wide ? 56 : 22,
            paddingVertical: wide ? 52 : 30,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD }} />
            <Text style={{ fontSize: 12, letterSpacing: 2.4, fontWeight: '700', color: GOLD, textTransform: 'uppercase' } as object}>
              {eyebrow}
            </Text>
          </View>

          <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' }}>
            {chip ? (
              <View
                style={{
                  backgroundColor: GOLD,
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginRight: 10,
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: NAVY, fontWeight: '800', fontSize: wide ? 22 : 16 }}>{chip}</Text>
              </View>
            ) : null}
            <Text
              style={{
                fontFamily: fontSerif,
                fontSize: titleSize,
                lineHeight: titleLine,
                fontWeight: '700',
                color: CREAM,
                letterSpacing: -0.4,
              } as object}
            >
              {title}
            </Text>
          </View>

          <Text style={{ marginTop: 14, fontSize: wide ? 17 : 15, lineHeight: wide ? 26 : 22, color: 'rgba(251,244,228,0.9)' }}>
            {subtitle}
          </Text>

          {primary || secondary ? (
            <View style={{ marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {primary ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={primary.onPress}
                  style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => ({
                    backgroundColor: hovered || pressed ? '#F3D68E' : GOLD,
                    borderRadius: 999,
                    paddingHorizontal: 22,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  })}
                >
                  <Text style={{ color: NAVY, fontWeight: '800', fontSize: 15 }}>{primary.label}</Text>
                  <Icon name="arrow-right" size={16} color={NAVY} strokeWidth={2.2} />
                </Pressable>
              ) : null}
              {secondary ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={secondary.onPress}
                  style={({ hovered }: { hovered?: boolean }) => ({
                    borderWidth: 1.5,
                    borderColor: 'rgba(230,194,122,0.7)',
                    borderRadius: 999,
                    paddingHorizontal: 20,
                    paddingVertical: 11,
                    backgroundColor: hovered ? 'rgba(230,194,122,0.14)' : 'transparent',
                  })}
                >
                  <Text style={{ color: CREAM, fontWeight: '700', fontSize: 15 }}>{secondary.label}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {footer ? <View style={{ marginTop: 22 }}>{footer}</View> : null}
        </View>
      </View>
    </View>
  );
}
