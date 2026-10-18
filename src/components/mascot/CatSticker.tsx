import React from 'react';
import { Image, View } from 'react-native';

import { useChiikawaQuiet } from '@/components/chiikawa/chiikawa';
import { useHydrated } from '@/components/layout/useHydrated';
import { useRewardStore } from '@/store/useRewardStore';
import type { LionPose } from './LionMascot';
import { useLionSkin } from './lion-skin';

/**
 * MÈO STICKER CỦA BAND 9 — sáu tư thế do ChatGPT vẽ theo ảnh mẫu, đã tách nền thành trong
 * suốt (assets/illustrations/cats/cat-1..6.png, bảng gốc là cats-sheet-v1.png).
 *
 * Chủ đề Chiikawa: cùng chỗ gọi, nhưng hình là nhân vật Chiikawa (assets/illustrations/chiikawa/),
 * chọn theo tư thế gần nhất. Chỗ gọi không phải đổi gì.
 *
 * Chỉ để trang trí: lớp bọc không nhận chạm, nên mèo đè lên nút cũng không chặn bấm.
 * Vị trí do chỗ gọi đặt bằng `style` (thường `position: 'absolute'` để bám viền hoặc
 * ngồi trên một thẻ).
 */
export type CatPose = 'sunglasses' | 'headphones' | 'hangingPaws' | 'peeking' | 'peace' | 'angry' | 'sleep' | 'wave' | 'think' | 'write' | 'read' | 'cheer' | 'sit' | 'lie' | 'stretch' | 'jump' | 'curl' | 'clingHang' | 'clingPeek' | 'clingWave' | 'clingSit' | 'clingLie' | 'clingClimb';

const SOURCES: Record<CatPose, number> = {
  sunglasses: require('../../../assets/illustrations/cats/cat-1.png'),
  headphones: require('../../../assets/illustrations/cats/cat-2.png'),
  hangingPaws: require('../../../assets/illustrations/cats/cat-3.png'),
  peeking: require('../../../assets/illustrations/cats/cat-4.png'),
  peace: require('../../../assets/illustrations/cats/cat-5.png'),
  angry: require('../../../assets/illustrations/cats/cat-6.png'),
  sleep: require('../../../assets/illustrations/cats/sleep.png'),
  wave: require('../../../assets/illustrations/cats/wave.png'),
  think: require('../../../assets/illustrations/cats/think.png'),
  write: require('../../../assets/illustrations/cats/write.png'),
  read: require('../../../assets/illustrations/cats/read.png'),
  cheer: require('../../../assets/illustrations/cats/cheer.png'),
  sit: require('../../../assets/illustrations/cats/pose-sit.png'),
  lie: require('../../../assets/illustrations/cats/pose-lie.png'),
  stretch: require('../../../assets/illustrations/cats/pose-stretch.png'),
  jump: require('../../../assets/illustrations/cats/pose-jump.png'),
  curl: require('../../../assets/illustrations/cats/pose-curl.png'),
  clingHang: require('../../../assets/illustrations/cats/cling-hang.png'),
  clingPeek: require('../../../assets/illustrations/cats/cling-peek.png'),
  clingWave: require('../../../assets/illustrations/cats/cling-wave.png'),
  clingSit: require('../../../assets/illustrations/cats/cling-sit.png'),
  clingLie: require('../../../assets/illustrations/cats/cling-lie.png'),
  clingClimb: require('../../../assets/illustrations/cats/cling-climb.png'),
};

/** Bộ Chiikawa đã tách nền: năm tư thế, tên khớp với tệp trong assets/illustrations/chiikawa/. */
const CHIIKAWA_SOURCES = {
  wave: require('../../../assets/illustrations/chiikawa/wave.png'),
  lie: require('../../../assets/illustrations/chiikawa/lie.png'),
  peek: require('../../../assets/illustrations/chiikawa/peek.png'),
  sleep: require('../../../assets/illustrations/chiikawa/sleep.png'),
  cheer: require('../../../assets/illustrations/chiikawa/cheer.png'),
} as const;

/** Tư thế mèo → tư thế Chiikawa tương ứng. */
const CHIIKAWA_FOR: Record<CatPose, keyof typeof CHIIKAWA_SOURCES> = {
  sunglasses: 'wave',
  headphones: 'wave',
  hangingPaws: 'peek',
  peeking: 'peek',
  peace: 'cheer',
  angry: 'cheer',
  sleep: 'sleep',
  wave: 'wave',
  think: 'wave',
  write: 'wave',
  read: 'wave',
  cheer: 'cheer',
  sit: 'wave',
  lie: 'lie',
  stretch: 'lie',
  jump: 'cheer',
  curl: 'sleep',
  clingHang: 'peek',
  clingPeek: 'peek',
  clingWave: 'wave',
  clingSit: 'wave',
  clingLie: 'lie',
  clingClimb: 'cheer',
};

/** Giao diện vàng kim: tư thế mèo → tư thế Leo (sư tử) gần nhất; tư thế bám cạnh chưa có hình riêng. */
const LION_FOR: Record<CatPose, LionPose> = {
  sunglasses: 'cheer',
  headphones: 'read',
  hangingPaws: 'point',
  peeking: 'point',
  peace: 'cheer',
  angry: 'think',
  sleep: 'sleep',
  wave: 'wave',
  think: 'think',
  write: 'read',
  read: 'read',
  cheer: 'cheer',
  sit: 'read',
  lie: 'sleep',
  stretch: 'cheer',
  jump: 'cheer',
  curl: 'sleep',
  clingHang: 'point',
  clingPeek: 'point',
  clingWave: 'wave',
  clingSit: 'read',
  clingLie: 'sleep',
  clingClimb: 'point',
};

/** `size` là cạnh của ô vuông chứa mèo; mèo được co vừa ô, giữ đúng tỉ lệ. */
export function CatSticker({ pose, size = 90, style }: { pose: CatPose; size?: number; style?: object }) {
  // Chờ hydrate: lượt đầu phải vẽ y như HTML máy chủ (mèo), nếu không React giữ hình cũ trên trang.
  const hydrated = useHydrated();
  const chiikawa = useRewardStore((s) => s.theme === 'theme-chiikawa');
  const useChiikawa = hydrated && chiikawa;
  const lion = hydrated && !useChiikawa && useLionSkin();
  const quiet = useChiikawaQuiet();
  const source = useChiikawa
    ? CHIIKAWA_SOURCES[CHIIKAWA_FOR[pose]]
    : lion
      ? { uri: `/mascot/lion/lion-${LION_FOR[pose]}.webp` }
      : SOURCES[pose];
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, useChiikawa && quiet ? { opacity: 0.2 } : null, style] as never}>
      <Image source={source} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
