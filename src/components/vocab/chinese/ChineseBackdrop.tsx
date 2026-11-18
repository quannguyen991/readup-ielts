import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { themeForLevel } from './levels';
import { useZhLevel } from './levelStore';
import { ZH_V4 } from './v4';

/**
 * Nền cho trang bài tiếng Trung: banner của cấp đang mở làm mờ, phủ một lớp trắng ấm, và vài hoạ tiết
 * Trung Hoa (đèn lồng, tre, sen) ở các góc. Mọi lớp đều `pointerEvents="none"` và nằm dưới nội dung.
 */
export function ChineseBackdrop() {
  const level = useZhLevel();
  const theme = themeForLevel(level);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image source={theme.banner} contentFit="cover" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,252,246,0.9)' }]} />
      <Image source={ZH_V4.sticker.lanternPair} contentFit="contain" style={{ position: 'absolute', top: 300, right: 0, width: 130, height: 130, opacity: 0.9 }} />
      <Image source={ZH_V4.sticker.cloudBadge} contentFit="contain" style={{ position: 'absolute', top: 130, left: 8, width: 110, height: 80, opacity: 0.45 }} />
      <Image source={ZH_V4.sticker.bamboo} contentFit="contain" style={{ position: 'absolute', bottom: 28, left: 16, width: 150, height: 150, opacity: 0.55 }} />
      <Image source={ZH_V4.sticker.lotus} contentFit="contain" style={{ position: 'absolute', bottom: 40, right: 24, width: 120, height: 120, opacity: 0.5 }} />
    </View>
  );
}
