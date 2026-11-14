import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GlossOrb } from '@/components/ui/GlossOrb';
import { Icon, type IconName } from '@/components/ui/Icon';
import { lighten } from '@/components/vocab/ToneTile';

/**
 * Thẻ chọn task kiểu poster: nền là một ảnh vẽ sẵn (không có chữ, public/picker/) và tiêu đề lớn, đậm, có bóng
 * nổi như logo trong ảnh tham chiếu. Chữ luôn đặt trên ảnh nên ảnh không cần chừa chữ.
 */

/** Sáu nền, mỗi nền một tông. Thứ tự khớp PICKER_ART_ORDER bên dưới. */
export const PICKER_ART = {
  pink: '/picker/art-pink.webp',
  violet: '/picker/art-violet.webp',
  green: '/picker/art-green.webp',
  amber: '/picker/art-amber.webp',
  blue: '/picker/art-blue.webp',
  coral: '/picker/art-coral.webp',
} as const;

export type PickerArt = keyof typeof PICKER_ART;

/** Thứ tự nền khớp TONES của trang IELTS: hồng, tím, xanh lá, cam, xanh dương, đỏ san hô. */
export const PICKER_ART_ORDER: readonly PickerArt[] = ['pink', 'violet', 'green', 'amber', 'blue', 'coral'];

export function PosterTile({
  art,
  accent,
  icon,
  title,
  sub,
  desc,
  chip,
  onPress,
  featured = false,
  wide = false,
}: {
  art: PickerArt;
  /** Màu đậm của tông: quả cầu icon, bóng chữ, nút mũi tên và bóng thẻ đều lấy từ đây. */
  accent: string;
  icon: IconName;
  title: string;
  /** Nhãn nhỏ viết hoa phía trên tiêu đề. */
  sub?: string;
  /** Dòng mô tả ngắn dưới tiêu đề. */
  desc?: string;
  chip?: string;
  onPress: () => void;
  /** Thẻ nổi bật rộng cả hàng: chữ và khung lớn hơn. */
  featured?: boolean;
  /** Màn hình rộng (từ 768px) dùng cỡ chữ lớn hơn. */
  wide?: boolean;
}) {
  const light = lighten(accent, 0.35);
  const minHeight = featured ? (wide ? 300 : 250) : wide ? 260 : 230;
  const titleSize = featured ? (wide ? 48 : 34) : wide ? 30 : 21;
  const radius = featured ? 30 : 26;
  const web = Platform.OS === 'web';

  const titleShadow = web
    ? ({ textShadow: `0 3px 0 ${accent}, 0 12px 24px rgba(10,6,28,0.4)` } as object)
    : { textShadowColor: 'rgba(10,6,28,0.4)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 10 };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={desc ? `${title}. ${desc}` : title}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: accent,
        opacity: pressed ? 0.94 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...(web ? ({ boxShadow: `0 18px 34px -16px ${accent}` } as object) : { elevation: 6 }),
      })}
    >
      <Image
        source={{ uri: PICKER_ART[art] }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(10,6,28,0)', 'rgba(10,6,28,0.22)', 'rgba(10,6,28,0.88)']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ flex: 1, padding: featured ? 22 : 16, justifyContent: 'space-between', minHeight }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <GlossOrb icon={icon} tone={[light, accent]} size={featured ? 58 : 48} />
          {chip ? (
            <View
              style={{
                borderRadius: 999,
                backgroundColor: 'rgba(10,6,28,0.42)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
                paddingHorizontal: 11,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 12, letterSpacing: 1, color: '#FFFFFF', textTransform: 'uppercase' } as object}>
                {chip}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 6 }}>
          {sub ? (
            <Text
              style={{
                fontFamily: 'Nunito_800ExtraBold',
                fontSize: 13,
                letterSpacing: 1.4,
                color: 'rgba(255,255,255,0.92)',
                textTransform: 'uppercase',
              } as object}
            >
              {sub}
            </Text>
          ) : null}
          <Text
            numberOfLines={2}
            style={{
              fontFamily: 'Nunito_900Black',
              fontSize: titleSize,
              lineHeight: Math.round(titleSize * 1.08),
              letterSpacing: -0.2,
              color: '#FFFFFF',
              ...titleShadow,
            } as object}
          >
            {title}
          </Text>
          {desc ? (
            <Text numberOfLines={2} style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.92)' } as object}>
              {desc}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow-right" size={18} color={accent} strokeWidth={2.2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
