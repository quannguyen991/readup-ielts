import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import type { BookCoverSpec } from '@/data/book-covers';
import { fontFamily } from '@/theme/tokens';

/**
 * Bìa sách: tranh nền (không chữ, ChatGPT vẽ) + chữ đè bằng mã. Phía trên tranh để trống cho tên sách,
 * chân bìa có lớp tối nhẹ để thanh tiến độ (`children`) đọc rõ.
 */
const INK = '#FFFFFF';
const DARK = '#0F0F14';
const ON_ACCENT = '#0B1F1D';
const FILL = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

export function BookCover({ spec, children }: { spec: BookCoverSpec; count?: number; children?: React.ReactNode }) {
  const lines = spec.big.split('\n');
  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: DARK }}>
      {spec.image ? <Image source={{ uri: spec.image }} style={FILL} contentFit="cover" contentPosition="bottom" accessibilityIgnoresInvertColors /> : null}
      <LinearGradient pointerEvents="none" colors={['rgba(15,15,20,0.55)', 'rgba(15,15,20,0)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.42 }} style={FILL} />
      <LinearGradient pointerEvents="none" colors={['rgba(15,15,20,0)', 'rgba(15,15,20,0.82)']} start={{ x: 0, y: 0.6 }} end={{ x: 0, y: 1 }} style={FILL} />

      <View style={{ flex: 1, paddingLeft: 30, paddingRight: 16, paddingTop: 22, paddingBottom: 16 }}>
        {lines.map((line, i) => (
          <Text key={i} numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: fontFamily.bold, fontSize: spec.bigSize, lineHeight: spec.bigSize * 1.05, letterSpacing: 0.3, color: INK }}>
            {line}
          </Text>
        ))}

        <View style={{ alignSelf: 'flex-start', marginTop: 12, borderRadius: 6, backgroundColor: spec.accent, paddingHorizontal: 11, paddingVertical: 5 }}>
          <Text style={{ fontFamily: fontFamily.bold, fontSize: 12, letterSpacing: 0.7, color: ON_ACCENT }}>{spec.tag}</Text>
        </View>

        <View style={{ flex: 1 }} />
        {children}
      </View>
    </View>
  );
}
