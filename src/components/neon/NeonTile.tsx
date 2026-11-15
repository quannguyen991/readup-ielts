import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { NeonIcon, PixelText } from '@/components/neon/Neon';
import type { NeonIconId } from '@/components/neon/neon-art';

/**
 * Thẻ lối vào kiểu thẻ game cho trang tổng quan IELTS / SAT. Nền gradient ba màu rực (không có vùng tối bẩn ở giữa),
 * phủ lớp chấm bi, sọc chéo và vòng sáng; icon pixel 3D lớn đặt trong vòng quay quanh có hai hạt sáng bay cạnh;
 * số thứ tự pixel khổng lồ mờ ở góc; tên thẻ chữ trắng đậm có bóng; nút mũi tên và nhãn "Bắt đầu" ở thẻ nổi bật.
 * Chỉ là giao diện: tên, icon, tông màu và đích đến do nơi gọi đưa vào.
 */
export type NeonPalette = readonly [string, string, string]; // ba màu gradient rực, từ góc trên trái xuống góc dưới phải

export const NEON_PALETTES: Record<string, NeonPalette> = {
  sunset: ['#FFB13D', '#FF4D8D', '#8B3FE8'],
  ocean: ['#19E0C8', '#3D7BFF', '#6A3FE0'],
  grape: ['#C58BFF', '#7B3FE8', '#FF5DB1'],
  lime: ['#7DF58A', '#19D3C5', '#3D7BFF'],
  gold: ['#FFE04A', '#FF8A3D', '#E8408A'],
  berry: ['#FF7AC8', '#B03FE8', '#4D5BFF'],
};

function useBob(ms: number, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    } catch {
      /* không có matchMedia */
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, ms, delay]);
  return v;
}

type Props = {
  title: string;
  sub?: string;
  chip?: string;
  /** Số thứ tự hiện khổng lồ, mờ, ở góc dưới trái (ví dụ "01"). */
  index?: string;
  icon: NeonIconId;
  palette: NeonPalette;
  onPress: () => void;
  minHeight?: number;
  /** Thẻ nổi bật: icon, chữ lớn hơn và có nhãn "Bắt đầu". */
  featured?: boolean;
  cta?: string;
};

export function NeonTile({ title, sub, chip, index, icon, palette, onPress, minHeight = 168, featured = false, cta }: Props) {
  const [c1, c2, c3] = palette;
  const phone = useWindowDimensions().width < 640;
  const small = !featured && phone;
  const bob = useBob(2600);
  const bob2 = useBob(1900, 400);
  const web = Platform.OS === 'web';

  const dots = web
    ? ({ backgroundImage: 'radial-gradient(rgba(255,255,255,0.45) 1.6px, transparent 1.7px)', backgroundSize: '18px 18px' } as object)
    : null;
  const stripes = web
    ? ({ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 12px, transparent 12px, transparent 26px)' } as object)
    : null;

  const iconH = featured ? (phone ? 112 : 150) : small ? 70 : 96;
  const ring = iconH + (featured ? 56 : 40);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sub ? `${title}. ${sub}` : title}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) =>
        ({
          minHeight,
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: 3,
          borderColor: 'rgba(255,255,255,0.7)',
          transform: [{ translateY: pressed ? 4 : hovered ? -4 : 0 }],
          boxShadow: pressed ? `0 2px 0 ${c3}` : `0 7px 0 ${c3}, 0 20px 36px ${c2}55`,
        }) as object
      }
    >
      <LinearGradient colors={[c1, c2, c3]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {stripes ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, stripes]} /> : null}
      {dots ? <View pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, width: '60%', height: '75%', opacity: 0.55, ...dots }} /> : null}
      {/* chữ lót dưới: số thứ tự khổng lồ */}
      {index ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 10, bottom: featured ? -34 : -22 }}>
          <PixelText size={featured ? 170 : 110} color="rgba(255,255,255,0.16)">
            {index}
          </PixelText>
        </View>
      ) : null}
      {/* vòng sáng quanh icon */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', right: featured ? 26 : 8, ...(small ? { top: 8 } : { top: '50%', marginTop: -ring / 2 }), width: ring, height: ring, borderRadius: ring, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', ...(web ? ({ boxShadow: '0 0 50px 10px rgba(255,255,255,0.35), inset 0 0 30px rgba(255,255,255,0.35)' } as object) : {}) }}
      >
        <View style={{ position: 'absolute', width: ring + 22, height: ring + 22, borderRadius: ring + 22, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.45)' }} />
        <Animated.View style={{ transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [3, -5] }) }, { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) }] }}>
          <NeonIcon name={icon} height={iconH} />
        </Animated.View>
      </View>
      {/* hạt sáng bay quanh */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', right: featured ? ring + 6 : ring - 6, top: featured ? 18 : 10, transform: [{ translateY: bob2.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }, { scale: bob2.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }] }}>
        <NeonIcon name="star4" height={featured ? 34 : 24} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', right: 6, bottom: featured ? 54 : 46, transform: [{ translateY: bob2.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) }, { scale: bob2.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.85] }) }] }}>
        <NeonIcon name="sparkle" height={featured ? 36 : 26} />
      </Animated.View>

      {chip ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 12, left: 14, paddingHorizontal: 9, paddingTop: 1, borderRadius: 8, backgroundColor: 'rgba(20,8,70,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' }}>
          <PixelText size={featured ? 20 : 18}>{chip}</PixelText>
        </View>
      ) : null}

      {/* lớp tối nhẹ ở đáy để chữ luôn đọc được */}
      <LinearGradient pointerEvents="none" colors={['rgba(20,8,70,0)', 'rgba(20,8,70,0.62)']} start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={{ flex: 1, justifyContent: 'flex-end', padding: featured ? 20 : 14, paddingTop: 48, gap: 4 }}>
        <Text
          className="font-nun-heavy"
          numberOfLines={3}
          style={{
            fontSize: featured ? (phone ? 28 : 38) : small ? 18 : 22,
            lineHeight: featured ? (phone ? 32 : 42) : small ? 22 : 27,
            color: '#FFFFFF',
            maxWidth: featured ? '58%' : small ? '100%' : '68%',
            ...(web ? ({ textShadow: '0 2px 0 rgba(20,8,70,0.45), 0 4px 16px rgba(20,8,70,0.5)' } as object) : {}),
          }}
        >
          {title}
        </Text>
        {sub ? (
          <Text className="font-nun-strong" numberOfLines={2} style={{ fontSize: featured ? 15 : 13, lineHeight: featured ? 21 : 18, color: 'rgba(255,255,255,0.92)', maxWidth: featured ? '58%' : small ? '64%' : '70%' }}>
            {sub}
          </Text>
        ) : null}
        {featured && cta ? (
          <View pointerEvents="none" style={{ alignSelf: 'flex-start', marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 6, minHeight: 42, borderRadius: 21, backgroundColor: '#FFFFFF', ...(web ? ({ boxShadow: '0 4px 0 rgba(20,8,70,0.35)' } as object) : {}) }}>
            <Text className="font-nun-heavy" style={{ fontSize: 15, color: '#2A22B5' }}>
              {cta}
            </Text>
            <NeonIcon name="next" height={32} />
          </View>
        ) : null}
      </View>

      {!(featured && cta) ? (
        <View pointerEvents="none" style={{ position: 'absolute', right: 12, bottom: 12 }}>
          <NeonIcon name="next" height={40} />
        </View>
      ) : null}
    </Pressable>
  );
}
