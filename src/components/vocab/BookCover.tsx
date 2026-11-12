import React from 'react';
import { Text, View } from 'react-native';

import type { BookCoverSpec } from '@/data/book-covers';
import { fontFamily } from '@/theme/tokens';

/**
 * Bìa sách vẽ bằng code: nền tối, tiêu đề lớn, nhãn màu, dải chéo góc trên và vòng số từ góc dưới.
 * Dùng trong thẻ bộ từ của thư viện "Sách từ vựng" (xem `DeckCard`).
 */
const INK = '#FFFFFF';
const BG = '#15151A';
const ON_ACCENT = '#0B1F1D';
const SOFT = 'rgba(255,255,255,0.72)';

export function BookCover({ spec, count }: { spec: BookCoverSpec; count: number }) {
  const lines = spec.big.split('\n');
  return (
    <View style={{ flex: 1, backgroundColor: BG, padding: 22, overflow: 'hidden' }}>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', right: -44, top: -44, width: 150, height: 150, transform: [{ rotate: '45deg' }], flexDirection: 'row' }}
      >
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={{ width: 14, height: 150, marginRight: 8, backgroundColor: spec.accent }} />
        ))}
      </View>

      <Text style={{ fontFamily: fontFamily.semibold, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', color: SOFT }}>{spec.top}</Text>

      <View style={{ marginTop: 16 }}>
        {lines.map((line, i) => (
          <Text
            key={i}
            numberOfLines={1}
            style={{ fontFamily: fontFamily.bold, fontSize: spec.bigSize, lineHeight: spec.bigSize * 1.02, letterSpacing: 0.4, color: INK }}
          >
            {line}
          </Text>
        ))}
      </View>

      <View style={{ alignSelf: 'flex-start', marginTop: 16, borderRadius: 6, backgroundColor: spec.accent, paddingHorizontal: 12, paddingVertical: 6 }}>
        <Text style={{ fontFamily: fontFamily.bold, fontSize: 13, letterSpacing: 0.6, color: ON_ACCENT }}>{spec.tag}</Text>
      </View>

      <Text style={{ marginTop: 12, fontFamily: fontFamily.regular, fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{spec.sub}</Text>

      <View style={{ position: 'absolute', left: 22, right: 22, bottom: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flexShrink: 1, paddingRight: 10 }}>
          <Text style={{ fontFamily: fontFamily.semibold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: SOFT }}>Vocabulary</Text>
          <Text numberOfLines={1} style={{ marginTop: 2, fontFamily: fontFamily.bold, fontSize: 15, color: INK }}>{spec.detail}</Text>
        </View>
        <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: spec.accent, alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 4px ${spec.accent}40` } as object}>
          <Text style={{ fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 22, color: ON_ACCENT }}>{count}</Text>
          <Text style={{ fontFamily: fontFamily.bold, fontSize: 10, letterSpacing: 1, color: ON_ACCENT }}>TỪ</Text>
        </View>
      </View>
    </View>
  );
}
