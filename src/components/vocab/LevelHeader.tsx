import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

import { readingFont } from '@/lib/readingFonts';

/**
 * TIÊU ĐỀ DÙNG CHUNG cho mọi trang chọn cấp độ (bộ từ theo cấp, từ vựng CEFR, ngữ pháp CEFR).
 * Cùng bảng màu và phông với thẻ cấp độ `LevelCard`, nên đầu trang và các thẻ bên dưới khớp nhau.
 * Phần `children` dùng cho thanh tiến độ hoặc dòng trạng thái của từng trang.
 */

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function LevelHeader({ eyebrow, title, subtitle, children }: Props) {
  // Điện thoại: hình mặt trời nhỏ ở góc, không đè lên chữ.
  const { width } = useWindowDimensions();
  const narrow = width < 600;
  return (
    <View
      style={{
        borderRadius: 28,
        overflow: 'hidden',
        padding: 26,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        minHeight: 150,
        boxShadow: '0 22px 40px -22px rgba(30,16,70,0.55)',
      } as object}
    >
      <LinearGradient colors={['#1B1640', '#3A2590', '#7B5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      <View
        pointerEvents="none"
        style={
          narrow
            ? { position: 'absolute', top: -44, right: -44, width: 190, height: 190, opacity: 0.7 }
            : { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }
        }
      >
        <Svg width="100%" height="100%" viewBox={narrow ? '560 40 240 220' : '0 0 800 300'} preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 14 }, (_, c) =>
            Array.from({ length: 6 }, (_, r) => (
              <Circle key={`h-${c}-${r}`} cx={520 + c * 22} cy={28 + r * 22} r={1.3} fill="#FFFFFF" opacity={0.18} />
            )),
          )}
          <Circle cx={680} cy={150} r={92} fill="none" stroke="#FFE9A8" strokeOpacity={0.35} strokeWidth={1.2} />
          <Circle cx={680} cy={150} r={56} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1} strokeDasharray="3 5" />
          <Circle cx={680} cy={150} r={22} fill="#FFE9A8" opacity={0.9} />
          <Path
            d="M600 70 Q612 60 624 70 Q612 80 600 70 Z M740 230 Q748 222 756 230 Q748 238 740 230 Z M560 226 Q566 218 572 226 Q566 234 560 226 Z"
            fill="#FFFFFF"
            opacity={0.8}
          />
          <Path d="M430 150 C470 120 500 180 540 150" fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.2} strokeDasharray="3 4" />
        </Svg>
      </View>
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
        locations={[0, 0.5]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: 10, right: 10, bottom: 10, left: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 4, left: 4, width: 16, height: 16, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#FFE9A8', opacity: 0.85 }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#FFE9A8', opacity: 0.85 }} />
      {eyebrow ? (
        <Text
          style={{
            color: 'rgba(255,255,255,0.82)',
            fontFamily: readingFont.sansHeavy,
            fontSize: 11.5,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={{
          color: '#FFFFFF',
          fontFamily: readingFont.display,
          fontSize: 34,
          lineHeight: 40,
          marginTop: eyebrow ? 6 : 0,
          textShadowColor: 'rgba(10,8,30,0.3)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontFamily: readingFont.sans, fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 580 }}>
          {subtitle}
        </Text>
      ) : null}
      {children ? <View style={{ marginTop: 16 }}>{children}</View> : null}
    </View>
  );
}
