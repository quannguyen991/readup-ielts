import React from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/ui/Icon';

/**
 * Hero trang chủ: khu vườn tàn tích châu Âu – La Mã, cây cỏ leo lên kiến trúc (public/home/hero-garden.jpg).
 * Cùng props với BlueHero để đổi một dòng trong trang giới thiệu.
 *
 * Tiêu đề phông Cormorant Garamond (serif mảnh, sang), phần "bằng đề thật." nghiêng vàng. Dây thường xuân
 * rủ ở hai góc, dải tối bên trái giữ chữ dễ đọc trên nền ảnh.
 */

const MOSS = '#16241C';
const INK = '#F4EEDF';
const GOLD = '#E3C27D';
const HERO_SRC = '/home/hero-garden.jpg';
const SERIF = 'CormorantGaramond_600SemiBold';
const SERIF_IT = 'CormorantGaramond_600SemiBold_Italic';

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
  const titleSize = wide ? 84 : 52;
  const titleLine = wide ? 86 : 56;
  const radius = wide ? 28 : 20;

  return (
    <View
      style={{
        width: '100%',
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: MOSS,
        ...(Platform.OS === 'web' ? { boxShadow: '0 18px 40px rgba(22,36,28,0.3)' } : { elevation: 8 }),
      } as object}
    >
      <View style={{ minHeight: wide ? 540 : 480, width: '100%' }}>
        <Image
          source={{ uri: HERO_SRC }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        />
        <LinearGradient
          colors={['rgba(16,30,22,0.94)', 'rgba(16,30,22,0.62)', 'rgba(16,30,22,0.08)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={['rgba(16,30,22,0)', 'rgba(16,30,22,0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {/* Dây thường xuân rủ góc dưới-trái, dây cuốn góc trên-phải: cây cỏ leo lên khung hình. */}
        <Image
          source={{ uri: '/home/foliage/fol-ivy-hang.png' }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', left: -34, bottom: -40, width: wide ? 150 : 110, height: wide ? 150 : 110, opacity: 0.7 }}
        />
        <Image
          source={{ uri: '/home/foliage/fol-ivy-long.png' }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', right: -24, top: -24, width: wide ? 260 : 170, height: wide ? 260 : 170, opacity: 0.8 }}
        />

        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            maxWidth: wide ? '60%' : '100%',
            paddingHorizontal: wide ? 64 : 24,
            paddingVertical: wide ? 60 : 36,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 12,
              letterSpacing: 3,
              color: GOLD,
              textTransform: 'uppercase',
            } as object}
          >
            {eyebrow}
          </Text>

          <Text
            style={{
              marginTop: 16,
              fontFamily: SERIF,
              fontSize: titleSize,
              lineHeight: titleLine,
              color: INK,
              letterSpacing: -0.5,
            } as object}
          >
            {chip ? `${chip} ` : ''}
            <Text style={{ fontFamily: SERIF_IT, color: GOLD } as object}>{title}</Text>
          </Text>

          <View style={{ width: 56, height: 1, backgroundColor: GOLD, marginTop: 24, marginBottom: 20, opacity: 0.8 }} />

          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: wide ? 17 : 15,
              lineHeight: wide ? 27 : 23,
              color: 'rgba(244,238,223,0.88)',
              maxWidth: 480,
            } as object}
          >
            {subtitle}
          </Text>

          {primary || secondary ? (
            <View style={{ marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {primary ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={primary.onPress}
                  style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => ({
                    backgroundColor: hovered || pressed ? '#EFD393' : GOLD,
                    borderRadius: 999,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  })}
                >
                  <Text style={{ color: MOSS, fontFamily: 'Inter_600SemiBold', fontSize: 15 } as object}>{primary.label}</Text>
                  <Icon name="arrow-right" size={16} color={MOSS} strokeWidth={2.2} />
                </Pressable>
              ) : null}
              {secondary ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={secondary.onPress}
                  style={({ hovered }: { hovered?: boolean }) => ({
                    borderWidth: 1,
                    borderColor: 'rgba(227,194,125,0.6)',
                    borderRadius: 999,
                    paddingHorizontal: 22,
                    paddingVertical: 11,
                    backgroundColor: hovered ? 'rgba(227,194,125,0.12)' : 'transparent',
                  })}
                >
                  <Text style={{ color: INK, fontFamily: 'Inter_600SemiBold', fontSize: 15 } as object}>{secondary.label}</Text>
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
