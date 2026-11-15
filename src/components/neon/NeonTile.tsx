import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { NeonIcon, PixelText } from '@/components/neon/Neon';
import { NeonBob, NeonTwinkle } from '@/components/neon/NeonMotion';
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

/** Nút mũi tên tròn trắng vẽ bằng khung và chữ (nhẹ hơn một ảnh cho mỗi thẻ). */
function ArrowDot({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2A22B5' }}>
      <Text style={{ fontSize: size * 0.55, lineHeight: size * 0.62, fontWeight: '900', color: '#2A22B5' }}>→</Text>
    </View>
  );
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
  const web = Platform.OS === 'web';

  // Web: MỘT lớp nền gồm nhiều gradient chồng nhau (đáy tối, ánh sáng, chấm bi, sọc, ba màu rực) thay cho năm phần tử riêng.
  const webBg = web
    ? ({
        backgroundImage: [
          'linear-gradient(180deg, rgba(20,8,70,0) 35%, rgba(20,8,70,0.62) 100%)',
          'linear-gradient(135deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 60%)',
          'radial-gradient(rgba(255,255,255,0.3) 1.6px, transparent 1.7px)',
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 12px, transparent 12px, transparent 26px)',
          `linear-gradient(135deg, ${c1}, ${c2}, ${c3})`,
        ].join(', '),
        backgroundSize: '100% 100%, 100% 100%, 18px 18px, auto, 100% 100%',
      } as object)
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
          boxShadow: pressed ? `0 2px 0 ${c3}` : `0 7px 0 ${c3}`,
          ...(webBg ?? {}),
        }) as object
      }
    >
      {web ? null : (
        <>
          <LinearGradient colors={[c1, c2, c3]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <LinearGradient pointerEvents="none" colors={['rgba(20,8,70,0)', 'rgba(20,8,70,0.62)']} start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        </>
      )}
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
        style={{ position: 'absolute', right: featured ? 26 : 8, ...(small ? { top: 8 } : { top: '50%', marginTop: -ring / 2 }), width: ring, height: ring, borderRadius: ring, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', }}
      >
        <View style={{ position: 'absolute', width: ring + 22, height: ring + 22, borderRadius: ring + 22, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.45)' }} />
        <NeonBob amp={5} tilt={3} ms={2600}>
          <NeonIcon name={icon} height={iconH} />
        </NeonBob>
      </View>
      {/* hạt sáng bay quanh */}
      {featured ? (
        <>
      <NeonTwinkle ms={1900} delay={400} style={{ position: 'absolute', right: featured ? ring + 6 : ring - 6, top: featured ? 18 : 10, pointerEvents: 'none' }}>
        <NeonIcon name="star4" height={featured ? 34 : 24} />
      </NeonTwinkle>
      <NeonTwinkle ms={2300} delay={900} style={{ position: 'absolute', right: 6, bottom: featured ? 54 : 46, pointerEvents: 'none' }}>
        <NeonIcon name="sparkle" height={featured ? 36 : 26} />
      </NeonTwinkle>
        </>
      ) : null}

      {chip ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 12, left: 14, paddingHorizontal: 9, paddingTop: 1, borderRadius: 8, backgroundColor: 'rgba(20,8,70,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' }}>
          <PixelText size={featured ? 20 : 18}>{chip}</PixelText>
        </View>
      ) : null}

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
            <ArrowDot size={32} />
          </View>
        ) : null}
      </View>

      {!(featured && cta) ? (
        <View pointerEvents="none" style={{ position: 'absolute', right: 12, bottom: 12 }}>
          <ArrowDot size={38} />
        </View>
      ) : null}
    </Pressable>
  );
}
