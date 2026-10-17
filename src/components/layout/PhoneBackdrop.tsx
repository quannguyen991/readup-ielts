import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * NỀN ĐIỆN THOẠI — vàng kim dịu: kem ngà ở trên, champagne ở giữa, vàng nhạt ở đáy;
 * vài mảng hổ phách mờ và dải sáng chéo rất nhẹ như kim loại lướt qua. Chỉ dùng trên
 * màn hẹp (dưới 640px); máy tính giữ nền caro cũ.
 *
 * Nội dung đặt trong `children` nằm trên nền; không có `children` thì nền phủ đầy vùng
 * cha (dùng như lớp nền phía sau).
 */

/** Dưới mốc này là điện thoại — khớp breakpoint `sm` của Tailwind. */
export const PHONE_MAX_WIDTH = 640;

export function useIsPhone(): boolean {
  return useWindowDimensions().width < PHONE_MAX_WIDTH;
}

/**
 * Mảng mờ vẽ bằng gradient tròn thay vì `filter: blur`. Blur trên mảng lớn bắt trình duyệt
 * vẽ lại mỗi khung hình và làm giật khi cuộn; gradient tròn cho cùng cảm giác mềm với chi phí gần bằng 0.
 * Đầu ngoài của gradient trong suốt, màu giữ nguyên alpha đầu.
 */
const softFade = (color: string) => `radial-gradient(closest-side, ${color} 0%, ${color.replace(/[\d.]+\)$/, '0)')} 100%)`;

/** Mảng màu mờ; vị trí tính theo % của khung nên vừa mọi chiều cao máy. */
function Blob({ color, w, h, top, left, rotate = 0 }: { color: string; w: number; h: number; top: string; left: string; rotate?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: w, height: h, top, left, backgroundImage: softFade(color), transform: [{ rotate: `${rotate}deg` }] } as never}
    />
  );
}

/** Dải sáng chéo rất nhẹ: một vệt ngà mờ ở giữa, nhạt dần về hai đầu. */
function Sheen({ top, left, w, h, rotate, opacity = 1 }: { top: string; left: string; w: number; h: number; rotate: number; opacity?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top, left, width: w, height: h, borderRadius: 999, overflow: 'hidden', opacity, transform: [{ rotate: `${rotate}deg` }] } as never}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,250,0.55)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export function PhoneBackdrop({ children }: { children?: React.ReactNode }) {
  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      {/* Nền vàng dịu: kem ngà ở trên, champagne, vàng nhạt ở đáy */}
      <LinearGradient
        colors={['#FFFCF3', '#FAF0D6', '#F5E4B6', '#EED59C', '#F7EBCB']}
        locations={[0, 0.3, 0.6, 0.85, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Mảng hổ phách rất mờ: chỉ tạo chút chiều sâu */}
      <Blob color="rgba(190,132,44,0.18)" w={300} h={220} top="-6%" left="-34%" rotate={-18} />
      <Blob color="rgba(200,144,50,0.16)" w={320} h={200} top="34%" left="58%" rotate={22} />
      <Blob color="rgba(180,124,40,0.16)" w={300} h={240} top="66%" left="-30%" rotate={14} />
      <Blob color="rgba(212,160,70,0.16)" w={260} h={200} top="86%" left="48%" rotate={-12} />
      {/* Mảng ngà sáng: điểm nhấn dịu */}
      <Blob color="rgba(255,253,244,0.8)" w={300} h={240} top="6%" left="44%" />
      <Blob color="rgba(255,248,226,0.7)" w={280} h={210} top="48%" left="-22%" />
      <Blob color="rgba(255,255,250,0.7)" w={320} h={200} top="74%" left="28%" />
      {/* Dải sáng chéo rất nhẹ */}
      <Sheen top="10%" left="-30%" w={640} h={34} rotate={-26} />
      <Sheen top="40%" left="-10%" w={560} h={18} rotate={-30} opacity={0.6} />
      <Sheen top="62%" left="-25%" w={620} h={28} rotate={-22} />
      <Sheen top="88%" left="-15%" w={600} h={22} rotate={-28} opacity={0.6} />
      {children}
    </View>
  );
}
