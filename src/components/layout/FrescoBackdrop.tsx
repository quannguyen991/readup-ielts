import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { MeshBackdrop } from './MeshBackdrop';
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
      {/* Dây leo quấn theo hai mép thanh bên, dây vòm phủ đầu thanh bên, như ảnh tham chiếu. */}
      <Image
        source={{ uri: '/home/foliage/vine-vertical.png' }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', left: -44, top: 110, width: 96, height: 300, opacity: 0.85 }}
      />
      <Image
        source={{ uri: '/home/foliage/vine-vertical.png' }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', left: -44, bottom: 80, width: 96, height: 300, opacity: 0.8 }}
      />
      <Image
        source={{ uri: '/home/foliage/vine-vertical.png' }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', right: -14, top: 260, width: 96, height: 300, opacity: 0.8, transform: [{ scaleX: -1 }] }}
      />
      <Image
        source={{ uri: '/home/foliage/vine-arch.png' }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', left: 10, top: -10, width: 230, height: 110, opacity: 0.9 }}
      />
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
    </View>
  );
}

/** Nền mặc định của mọi màn: theme Band 9 dùng giấy da fresco, theme khác giữ lưới pastel cũ. */
export function PageBackdrop() {
  const fresco = useSidebarTheme().themeConfig.id === 'default';
  return fresco ? <FrescoPageBackdrop /> : <MeshBackdrop />;
}
