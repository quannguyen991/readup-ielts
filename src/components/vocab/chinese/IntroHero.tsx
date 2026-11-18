import React from 'react';
import { Platform, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { ZhLevelCorners } from './ZhNineFrame';

/**
 * Khối giới thiệu đầu trang từ vựng: banner vẽ (không chữ) làm nền, lớp phủ màu nhấn bên trái để chữ đọc rõ,
 * tên sách lớn, các nhãn số liệu và một đoạn giới thiệu. Bốn góc viền là hoạ tiết của cấp, khớp đúng mép khối.
 */
export function IntroHero({
  banner,
  corner,
  base = '#2B2F5E',
  decor,
  wash,
  eyebrow,
  title,
  chips,
  blurb,
}: {
  /** Banner vẽ; bỏ trống thì nền là màu `base` với lớp phủ. */
  banner?: number;
  /** Góc khung (kiểu góc trên-trái, sẽ được lật cho bốn góc). */
  corner: number;
  /** Màu nền khi không có banner. */
  base?: string;
  /** Hoạ tiết trang trí góc trên-phải (nhãn dán), tuỳ chọn. */
  decor?: number;
  /** Ba màu của lớp phủ bên trái, từ đậm đến nhạt. */
  wash: [string, string, string];
  eyebrow: string;
  title: string;
  chips: string[];
  blurb: string;
}) {
  return (
    <View style={{ position: 'relative' }}>
      <View
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: '#E9C98A',
          backgroundColor: base,
          paddingLeft: 72,
          paddingRight: 52,
          paddingVertical: 26,
          minHeight: 210,
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {banner ? <Image source={banner} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
        <LinearGradient
          colors={wash}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        {decor ? (
          <Image source={decor} contentFit="contain" pointerEvents="none" style={{ position: 'absolute', right: 10, top: 6, width: 150, height: 110, opacity: 0.95 }} />
        ) : null}
        <Text className="font-sans text-label" style={{ color: '#F5D28A', letterSpacing: 1.4 }}>
          {eyebrow.toUpperCase()}
        </Text>
        <Text className="font-heavy text-pageTitle" style={{ color: '#FFF6E8', fontSize: Platform.OS === 'web' ? 34 : 26 }}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {chips.map((label) => (
            <View key={label} style={{ height: 28, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center' }}>
              <Text className="font-strong text-label" style={{ color: '#4A1A24' }}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <Text className="font-sans text-body" style={{ color: '#FFF1DE', marginTop: 6, maxWidth: 520 }}>
          {blurb}
        </Text>
      </View>
      <ZhLevelCorners source={corner} c={56} />
    </View>
  );
}
