/**
 * STICKER & NHÃN DÁN (30/09/2026: "thêm sticker, thêm nhãn dán, cho to hơn").
 *
 * - `Sticker`: bọc một hình minh hoạ thành miếng dán bế viền — viền trắng dày
 *   quanh hình, nghiêng nhẹ, bóng đổ mềm như dán trên giấy. Web dùng chuỗi
 *   `drop-shadow` để bế viền đúng theo hình; app thì trả hình nguyên bản.
 * - `Label`: nhãn dán chữ nghiêng, màu đặc, viền trắng, có mẩu băng dính ở góc.
 */
import React from 'react';
import { Platform, Text, View } from 'react-native';

const OUTLINE = [
  'drop-shadow(3px 0 0 #fff)',
  'drop-shadow(-3px 0 0 #fff)',
  'drop-shadow(0 3px 0 #fff)',
  'drop-shadow(0 -3px 0 #fff)',
  'drop-shadow(0 8px 10px rgba(15,23,42,0.22))',
].join(' ');

export function Sticker({ tilt = -6, children }: { tilt?: number; children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return React.createElement('div', { style: { display: 'inline-flex', transform: `rotate(${tilt}deg)`, filter: OUTLINE } }, children);
}

export function Label({ text, color = '#F2B632', ink = '#2A1B02', tilt = -5, size = 15 }: { text: string; color?: string; ink?: string; tilt?: number; size?: number }) {
  return (
    <View style={{ transform: [{ rotate: `${tilt}deg` }], alignSelf: 'flex-start' }}>
      <View
        style={{
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 7,
          backgroundColor: color,
          borderWidth: 3,
          borderColor: '#FFFFFF',
          boxShadow: '0 6px 14px rgba(15,23,42,0.18)',
        } as object}
      >
        <Text className="font-heavy" style={{ fontSize: size, color: ink }}>
          {text}
        </Text>
      </View>
      {/* mẩu băng dính */}
      <View style={{ position: 'absolute', top: -8, left: '40%', width: 34, height: 14, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.75)', transform: [{ rotate: '8deg' }] }} />
    </View>
  );
}
