import { MASCOTS_ON } from '@/components/mascot/mascot-switch';
import React from 'react';
import { Image } from 'react-native';

import { CHIIKAWA_IMG, useChiikawaActive } from '@/components/chiikawa/chiikawa';

/** Sáu tư thế của linh vật sư tử, đặt ở public/mascot/lion (cắt từ một ảnh bảng mẫu). */
export type LionPose = 'wave' | 'read' | 'cheer' | 'think' | 'point' | 'sleep';

/**
 * Linh vật sư tử của các màn học.
 *
 * Chủ đề Chiikawa thì thay bằng Chiikawa: hai linh vật là hai giao diện khác nhau,
 * không để lẫn trong một màn. Ảnh lấy theo đường dẫn public nên không đi qua bộ
 * gom của Metro.
 */
export function LionMascot({ pose, size = 120 }: { pose: LionPose; size?: number }) {
  if (!MASCOTS_ON) return null;
  const chiikawa = useChiikawaActive();
  const style = { width: size, height: size };
  if (chiikawa) {
    return <Image source={CHIIKAWA_IMG.wave} resizeMode="contain" style={style} accessibilityIgnoresInvertColors />;
  }
  return (
    <Image
      source={{ uri: `/mascot/lion/lion-${pose}.webp` }}
      resizeMode="contain"
      style={style}
      accessibilityIgnoresInvertColors
    />
  );
}
