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
      {/* Cây cỏ leo qua thanh bên: dây thường xuân rủ dưới, cành nguyệt quế ở mép phải. */}
      <Image
        source={{ uri: '/home/foliage/fol-ivy-hang.png' }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', left: -20, bottom: 40, width: 170, height: 170, opacity: 0.75 }}
      />
      <Image
        source={{ uri: '/home/foliage/fol-laurel.png' }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', right: -34, top: 120, width: 120, height: 120, opacity: 0.45 }}
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
