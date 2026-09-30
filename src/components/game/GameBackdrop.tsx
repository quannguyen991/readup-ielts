import React, { useMemo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';

import { ensureProfileKeyframes, loop, MOVE } from '@/components/profile/profile-anim';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * NỀN CỦA CÁC TRANG GAME (/quest…): trời đêm pixel cùng bảng màu với thanh trận
 * đấu — sao nhấp nháy, hai lớp đồi. Không đặt trăng ở đây: các khung nội dung
 * trong mờ phủ lên thì nó chỉ còn là một đốm xám. Vẽ bằng code, không nạp ảnh:
 * nền tranh vẽ của Quest cũ nặng 1,8 MB và lệch hẳn phong cách pixel của game mới.
 */

ensureProfileKeyframes();

const FILL = { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 } as const;
const CRISP = { shapeRendering: 'crispEdges' } as object;

/** Hai dải đồi bậc thang, toạ độ trên khung 200 × 40 (co giãn theo bề ngang). */
const FAR_HILLS: [number, number, number][] = [
  [0, 14, 30], [28, 8, 26], [52, 18, 30], [80, 4, 24], [102, 12, 34], [134, 6, 22], [154, 16, 26], [178, 9, 22],
];
const NEAR_HILLS: [number, number, number][] = [
  [0, 26, 44], [42, 21, 38], [78, 28, 40], [116, 23, 36], [150, 27, 50],
];

export function GameBackdrop() {
  const stars = useMemo(() => {
    const rng = mulberry32(hashString('readup-quest-sky'));
    return Array.from({ length: 70 }, () => ({
      x: rng() * 100,
      y: rng() * 62,
      s: rng() < 0.18 ? 3 : rng() < 0.5 ? 2 : 1,
      d: Math.round(rng() * 4000),
      t: 1800 + Math.round(rng() * 2600),
    }));
  }, []);

  return (
    <View pointerEvents="none" style={{ ...FILL, overflow: 'hidden' }}>
      <LinearGradient colors={['#07111F', '#0B1A2E', '#12233D']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={FILL} />
      {stars.map((p, i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, backgroundColor: i % 9 === 0 ? '#FDE68A' : '#FFFFFF', ...loop('rp-twinkle', p.t, { delay: p.d }) }}
          {...MOVE}
        />
      ))}
      <Svg width="100%" height="24%" viewBox="0 0 200 40" preserveAspectRatio="none" {...CRISP} style={{ position: 'absolute', left: 0, bottom: 0 }}>
        {FAR_HILLS.map(([x, y, w]) => (
          <Rect key={`f${x}`} x={x} y={y} width={w} height={40 - y} fill="#15263F" />
        ))}
        {NEAR_HILLS.map(([x, y, w]) => (
          <Rect key={`n${x}`} x={x} y={y} width={w} height={40 - y} fill="#0C1829" />
        ))}
      </Svg>
    </View>
  );
}
