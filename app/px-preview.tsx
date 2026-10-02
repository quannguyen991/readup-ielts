import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { PxSceneCanvas } from '@/components/travel/pxscene/PxSceneCanvas';
import { isPxSceneId } from '@/components/travel/pxscene';
import { SCENE_H, SCENE_W } from '@/components/travel/pxscene/scene';

/** Chỉ bản dev: xem một cảnh pixel ở độ phân giải đầy đủ (?id=tokyo&k=4). Bản chính thức không có gì. */
export default function PxPreview() {
  const p = useLocalSearchParams<{ id?: string; k?: string }>();
  if (!__DEV__) return null;
  const id = isPxSceneId(p.id) ? p.id : 'tokyo';
  const k = Math.max(1, Math.min(6, Number(p.k) || 3));
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: SCENE_W * k, height: SCENE_H * k }}>
        <PxSceneCanvas scene={id} k={k} />
      </View>
    </View>
  );
}
