import React from 'react';
import { Image, View } from 'react-native';

/**
 * MÈO STICKER CỦA BAND 9 — sáu tư thế do ChatGPT vẽ theo ảnh mẫu, đã tách nền thành trong
 * suốt (assets/illustrations/cats/cat-1..6.png, bảng gốc là cats-sheet-v1.png).
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

/** `size` là cạnh của ô vuông chứa mèo; mèo được co vừa ô, giữ đúng tỉ lệ. */
export function CatSticker({ pose, size = 90, style }: { pose: CatPose; size?: number; style?: object }) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style] as never}>
      <Image source={SOURCES[pose]} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
