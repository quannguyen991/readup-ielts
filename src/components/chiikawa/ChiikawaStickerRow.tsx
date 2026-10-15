import React from 'react';
import { Image, Text, View } from 'react-native';

import { CHIIKAWA_IMG } from './chiikawa';

/** Bộ sticker Chiikawa hiện trong hồ sơ khi đã mở khoá chủ đề. Chỉ trang trí, không nhận chạm. */
export function ChiikawaStickerRow({ title }: { title: string }) {
  const items = [CHIIKAWA_IMG.wave, CHIIKAWA_IMG.cheer, CHIIKAWA_IMG.peek, CHIIKAWA_IMG.lie, CHIIKAWA_IMG.sleep];
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#7A4E62' }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }} pointerEvents="none">
        {items.map((src, i) => (
          <View key={i} style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#FFF0F5', borderWidth: 1, borderColor: '#F5CADB', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={src} resizeMode="contain" style={{ width: 56, height: 56 }} />
          </View>
        ))}
      </View>
    </View>
  );
}
