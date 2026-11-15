import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

import { ZH_FRAME } from './art';

/**
 * Bốn góc khung (vẽ bằng ChatGPT) gắn vào bốn góc của một khối có kích thước bất kỳ. Mỗi góc có kích thước `c`
 * giữ nguyên tỉ lệ (không kéo giãn); góc phải và góc dưới được lật bằng transform.
 */
export function ZhCornerFrame({ c }: { c: number }) {
  const src = ZH_FRAME.cardCorner;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <Image source={src} contentFit="contain" style={{ position: 'absolute', left: 0, top: 0, width: c, height: c }} />
      <Image source={src} contentFit="contain" style={{ position: 'absolute', right: 0, top: 0, width: c, height: c, transform: [{ scaleX: -1 }] }} />
      <Image source={src} contentFit="contain" style={{ position: 'absolute', left: 0, bottom: 0, width: c, height: c, transform: [{ scaleY: -1 }] }} />
      <Image source={src} contentFit="contain" style={{ position: 'absolute', right: 0, bottom: 0, width: c, height: c, transform: [{ scaleX: -1 }, { scaleY: -1 }] }} />
    </View>
  );
}

/**
 * Bốn góc viền của một cấp HSK (ảnh vẽ bằng ChatGPT, mỗi cấp một màu và một hoa văn). Dùng một ảnh góc và lật
 * để có đủ bốn góc. `c` là cạnh của mỗi góc (px). Đặt đè lên nội dung, không nhận chạm.
 */
export function ZhLevelCorners({ source, c }: { source: number; c: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <Image source={source} contentFit="contain" style={{ position: 'absolute', left: 0, top: 0, width: c, height: c }} />
      <Image source={source} contentFit="contain" style={{ position: 'absolute', right: 0, top: 0, width: c, height: c, transform: [{ scaleX: -1 }] }} />
      <Image source={source} contentFit="contain" style={{ position: 'absolute', left: 0, bottom: 0, width: c, height: c, transform: [{ scaleY: -1 }] }} />
      <Image source={source} contentFit="contain" style={{ position: 'absolute', right: 0, bottom: 0, width: c, height: c, transform: [{ scaleX: -1 }, { scaleY: -1 }] }} />
    </View>
  );
}

/**
 * Khung ngang ghép theo kiểu 9 ô: bốn góc có mây giữ nguyên tỉ lệ, cạnh trên/dưới chỉ kéo dài theo chiều ngang,
 * cạnh trái/phải chỉ kéo dài theo chiều dọc. Nhờ vậy khung không bị méo dù đầu bài cao hay thấp.
 * `c` là cạnh của mỗi góc (px). Mọi lớp `pointerEvents="none"`, đặt đè lên nội dung.
 */
export function ZhNineFrame({ c }: { c: number }) {
  const P = ZH_FRAME.parts;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {/* Bốn góc: lật ngang/dọc để dùng chung một ảnh */}
      <Image source={P.corner} contentFit="fill" style={{ position: 'absolute', left: 0, top: 0, width: c, height: c }} />
      <Image source={P.corner} contentFit="fill" style={{ position: 'absolute', right: 0, top: 0, width: c, height: c, transform: [{ scaleX: -1 }] }} />
      <Image source={P.corner} contentFit="fill" style={{ position: 'absolute', left: 0, bottom: 0, width: c, height: c, transform: [{ scaleY: -1 }] }} />
      <Image source={P.corner} contentFit="fill" style={{ position: 'absolute', right: 0, bottom: 0, width: c, height: c, transform: [{ scaleX: -1 }, { scaleY: -1 }] }} />
      {/* Cạnh trên và dưới */}
      <Image source={P.top} contentFit="fill" style={{ position: 'absolute', left: c, right: c, top: 0, height: c }} />
      <Image source={P.top} contentFit="fill" style={{ position: 'absolute', left: c, right: c, bottom: 0, height: c, transform: [{ scaleY: -1 }] }} />
      {/* Cạnh trái và phải */}
      <Image source={P.left} contentFit="fill" style={{ position: 'absolute', left: 0, top: c, bottom: c, width: c }} />
      <Image source={P.left} contentFit="fill" style={{ position: 'absolute', right: 0, top: c, bottom: c, width: c, transform: [{ scaleX: -1 }] }} />
    </View>
  );
}
