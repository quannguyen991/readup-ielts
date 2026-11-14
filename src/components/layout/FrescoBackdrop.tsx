import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { MeshBackdrop } from './MeshBackdrop';
import { VineBorder, VINE_STRIP } from './VineBorder';
import { useSidebarTheme } from './SidebarAtmosphere';

/**
 * Nền kiểu trần fresco châu Âu cho theme mặc định (Band 9): ảnh trần phai màu thay cho lớp khối pastel cũ.
 * Các theme khác (Chiikawa, Cyber, Pixel…) vẫn giữ nền riêng của chúng.
 */

const SIDEBAR_FRESCO = '/home/sidebar-garden.jpg';
const PAGE_FRESCO = '/home/page-garden.jpg';

/** Nền thanh bên: ảnh trần phủ navy mờ, viền vàng chạm khắc chạy sát mép trong. */
export function FrescoSidebarBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={{ uri: SIDEBAR_FRESCO }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(16,30,22,0.6)' }]} />
      {/* Dây leo bám suốt hai mép thanh bên, như ảnh tham chiếu; vượt ra ngoài mép để không đè chữ nav. */}
      <VineBorder edge="left" src={VINE_STRIP.vIvyA} size={80} inset={-50} opacity={0.9} />
      <VineBorder edge="right" src={VINE_STRIP.vIvyB} size={80} inset={-48} opacity={0.85} flip />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1.5, borderColor: '#C9A45C', borderRadius: 16 }}
      />
    </View>
  );
}

/** Nền trang: tàn tích cổ điển đã làm mờ và phủ kem, để chữ mực tối vẫn đọc rõ. */
export function FrescoPageBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={{ uri: PAGE_FRESCO }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={StyleSheet.absoluteFill}
      />
      {/* Cây cỏ bám theo mép trang, mờ để không tranh chữ. */}
      <VineBorder edge="top" src={VINE_STRIP.hIvy} size={70} inset={-12} opacity={0.35} />
      <VineBorder edge="left" src={VINE_STRIP.vIvyA} size={90} inset={-40} opacity={0.3} />
      <VineBorder edge="right" src={VINE_STRIP.vIvyB} size={90} inset={-40} opacity={0.3} flip />
    </View>
  );
}

/** Nền mặc định của mọi màn: theme Band 9 dùng giấy da fresco, theme khác giữ lưới pastel cũ. */
export function PageBackdrop() {
  const fresco = useSidebarTheme().themeConfig.id === 'default';
  return fresco ? <FrescoPageBackdrop /> : <MeshBackdrop />;
}
