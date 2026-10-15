import React, { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';

import { CHIIKAWA_IMG } from './chiikawa';

/** Màn chờ tải của chủ đề Chiikawa: Chiikawa vẫy tay và nhún nhẹ thay cho vòng quay. */
export function ChiikawaLoader({ label }: { label?: string }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -14, duration: 420, useNativeDriver: false }),
        Animated.timing(y, { toValue: 0, duration: 420, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [y]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F8', gap: 12 }}>
      <Animated.View style={{ transform: [{ translateY: y }] }}>
        <Image source={CHIIKAWA_IMG.wave} resizeMode="contain" style={{ width: 150, height: 150 }} />
      </Animated.View>
      {label ? <Text style={{ fontSize: 15, fontWeight: '600', color: '#7A4E62' }}>{label}</Text> : null}
    </View>
  );
}
