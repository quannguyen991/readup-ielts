import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { MeshBackdrop } from './MeshBackdrop';
import { useSidebarTheme } from './SidebarAtmosphere';

/**
 * Nền kiểu trần fresco châu Âu cho theme mặc định (Band 9): ảnh trần phai màu thay cho lớp khối pastel cũ.
 * Các theme khác (Chiikawa, Cyber, Pixel…) vẫn giữ nền riêng của chúng.
 */

const SIDEBAR_FRESCO = '/home/fresco-sidebar.jpg';
const PAGE_FRESCO = '/home/classical-page.jpg';

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
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,26,51,0.58)' }]} />
      <View
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          bottom: 10,
          borderWidth: 1,
          borderColor: 'rgba(230,194,122,0.5)',
          borderRadius: 10,
        }}
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
