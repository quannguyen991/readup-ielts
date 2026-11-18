import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { NeonBackdrop, NeonIcon } from '@/components/neon/Neon';
import { softBlob } from '@/components/neon/NeonMotion';
import type { NeonIconId } from '@/components/neon/neon-art';

/**
 * Nền minh hoạ rực rỡ cho đầu trang tổng quan, vẽ bằng code (không ảnh ngoài):
 *  - `sunset`: trời xanh → tím → hồng → cam, mặt trời ở chân trời, mây pixel, sàn lưới tím nhìn xa (IELTS);
 *  - `neon`: nền xanh chàm có lưới, sao và họa tiết pixel trôi nhẹ, cùng nền với khung Đua Top (SAT).
 * Không có chữ. Chỉ là lớp đầu tiên trong khung `overflow: hidden`.
 */
export type BackdropVariant = 'sunset' | 'neon';

const GRID_LINES = Platform.OS === 'web';

function Float({ icon, size, left, top }: { icon: NeonIconId; size: number; left: `${number}%`; top: `${number}%` }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left, top }}>
      <NeonIcon name={icon} height={size} />
    </View>
  );
}

function Sunset() {
  const phone = useWindowDimensions().width < 640;
  const floor =
    GRID_LINES
      ? ({
          backgroundImage:
            'linear-gradient(rgba(255,120,220,0.55) 2px, transparent 2px), linear-gradient(90deg, rgba(255,120,220,0.55) 2px, transparent 2px)',
          backgroundSize: '64px 38px',
          backgroundPosition: 'center top',
          transform: 'perspective(260px) rotateX(58deg)',
          transformOrigin: 'top center',
        } as object)
      : null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#2F7BE0', '#6B3FE0', '#C23FC9', '#FF6A8A', '#FF9A3D']} locations={[0, 0.28, 0.5, 0.72, 0.9]} style={StyleSheet.absoluteFill} />
      {/* ánh cực quang nhẹ */}
      <View style={{ position: 'absolute', left: '-20%', top: '-4%', width: '80%', height: '50%', ...softBlob('rgba(40,230,200,0.55)') }} />
      <View style={{ position: 'absolute', right: '-20%', top: '-8%', width: '75%', height: '56%', ...softBlob('rgba(255,140,60,0.6)') }} />
      {/* mặt trời */}
      <View style={{ position: 'absolute', left: '50%', top: '18%', marginLeft: -130, width: 260, height: 260, borderRadius: 999, backgroundColor: '#FFE08A', opacity: 0.95 }} />
      <View style={{ position: 'absolute', left: '50%', top: '18%', marginLeft: -260, width: 520, height: 520, marginTop: -130, ...softBlob('rgba(255,170,80,0.6)') }} />
      {/* sàn tối + lưới */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', backgroundColor: '#1B0B52', overflow: 'hidden' }}>
        <LinearGradient colors={['#7A2BD8', '#1B0B52']} style={StyleSheet.absoluteFill} />
        {floor ? <View style={[StyleSheet.absoluteFill, { height: '260%' }, floor]} /> : null}
      </View>
      {phone ? null : (
        <>
          <Float icon="cloud" size={70} left="4%" top="16%" />
          <Float icon="cloud" size={54} left="80%" top="10%" />
          <Float icon="cloud" size={44} left="64%" top="34%" />
          <Float icon="note" size={52} left="12%" top="44%" />
          <Float icon="note" size={40} left="86%" top="40%" />
          <Float icon="star4" size={34} left="26%" top="12%" />
          <Float icon="sparkle" size={46} left="72%" top="22%" />
        </>
      )}
      {phone ? <Float icon="cloud" size={40} left="2%" top="52%" /> : null}
      {phone ? <Float icon="note" size={34} left="88%" top="50%" /> : null}
    </View>
  );
}

export function OverviewBackdrop({ variant }: { variant: BackdropVariant }) {
  return variant === 'sunset' ? <Sunset /> : <NeonBackdrop scene="sat" />;
}
