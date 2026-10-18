import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { CUTE_FONT } from '@/components/cute-home/palette';
import { Appear } from '@/components/motion/Motion';
import { PIXEL_THEMES, pixelCardStyle } from './pixel-art';
import { PixelBob } from './pixel-fx';

/*
  Khối giao diện pixel dùng chung: cửa sổ có thanh tiêu đề, nút, thẻ ô, nhãn và tên hình.
  Dùng cho trang chủ và các nhóm màn hình pixel khác, để mọi chỗ cùng một ngôn ngữ hình.
*/

/** Bảng màu hồng của mọi nhóm pixel, định nghĩa trong pixel-art.ts (cũng là màu mặc định của app). */
export const PT = PIXEL_THEMES['theme-pink'];

/** Chikawa pixel hoá (scripts/pixel/pixelize-chiikawa.mjs). Kích thước là điểm ảnh thật của file. */
export const PIXEL_SPRITE = {
  wave: { src: require('../../../assets/pixel-chiikawa/wave.png') as ImageSourcePropType, w: 192, h: 176 },
  cheer: { src: require('../../../assets/pixel-chiikawa/cheer.png') as ImageSourcePropType, w: 192, h: 172 },
  vocabulary: { src: require('../../../assets/pixel-chiikawa/vocabulary.png') as ImageSourcePropType, w: 144, h: 124 },
  writing: { src: require('../../../assets/pixel-chiikawa/writing.png') as ImageSourcePropType, w: 144, h: 110 },
  sat: { src: require('../../../assets/pixel-chiikawa/sat.png') as ImageSourcePropType, w: 144, h: 92 },
  listening: { src: require('../../../assets/pixel-chiikawa/listening.png') as ImageSourcePropType, w: 144, h: 92 },
  roadmap: { src: require('../../../assets/pixel-chiikawa/roadmap.png') as ImageSourcePropType, w: 144, h: 132 },
  reading: { src: require('../../../assets/pixel-chiikawa/reading.png') as ImageSourcePropType, w: 144, h: 142 },
  tabVocab: { src: require('../../../assets/pixel-chiikawa/tab-vocab.png') as ImageSourcePropType, w: 54, h: 46 },
  tabPlan: { src: require('../../../assets/pixel-chiikawa/tab-plan.png') as ImageSourcePropType, w: 54, h: 50 },
  tabRead: { src: require('../../../assets/pixel-chiikawa/tab-read.png') as ImageSourcePropType, w: 54, h: 54 },
} as const;
export type PixelSpriteKey = keyof typeof PIXEL_SPRITE;

/** Cửa sổ pixel: khung đậm, thanh tiêu đề có ba chấm vuông. `index` để khung xuất hiện lần lượt. */
export function PixelWindow({
  title,
  children,
  style,
  index,
}: {
  title: string;
  children: React.ReactNode;
  style?: object;
  index?: number;
}) {
  const body = (
    <View style={[styles.window, style]}>
      <View style={styles.titleBar}>
        <View style={styles.titleDots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.titleDot} />
          ))}
        </View>
        <Text style={styles.titleText}>{title}</Text>
      </View>
      {children}
    </View>
  );
  return index === undefined ? body : <Appear index={index}>{body}</Appear>;
}

/** Nút pixel: khung đậm, bóng lệch đặc, nhấn xuống khi bấm. */
export function PixelButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ hovered, pressed }) => [styles.btn, primary ? styles.btnPrimary : styles.btnSecondary, hovered && styles.btnHover, pressed && styles.btnPressed]}
    >
      <Text style={[styles.btnText, primary && styles.btnTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

/** Nhãn pixel nhỏ, nền màu chanh để nổi trên khung trắng. */
export function PixelChip({ text, color = PT.secondary }: { text: string; color?: string }) {
  return (
    <Text style={[styles.chip, { backgroundColor: color }]}>{text}</Text>
  );
}

/** Hình Chikawa pixel đúng kích thước điểm ảnh của file. */
export function PixelSprite({ name }: { name: PixelSpriteKey }) {
  const s = PIXEL_SPRITE[name];
  return <Image source={s.src} style={{ width: s.w, height: s.h }} />;
}

/** Thẻ ô chọn: nền màu, Chikawa nhún nhẹ, tên và nhãn số liệu. */
export function PixelTile({
  title,
  chip,
  color,
  sprite,
  onPress,
  index = 0,
}: {
  title: string;
  chip: string;
  color: string;
  sprite: PixelSpriteKey;
  onPress: () => void;
  index?: number;
}) {
  // Chiều rộng do khung cha quyết định; không dùng flex ở đây vì trong cột không có chiều cao sẽ co về 0.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ hovered, pressed }) => [pixelCardStyle(PT), styles.tile, hovered && styles.tileHover, pressed && styles.btnPressed]}
    >
      <View style={[styles.tileArt, { backgroundColor: color }]}>
        <PixelBob amplitude={6} period={1800} delay={index * 260}>
          <PixelSprite name={sprite} />
        </PixelBob>
      </View>
      <View style={styles.tileFoot}>
        <Text style={styles.tileTitle}>{title}</Text>
        <PixelChip text={chip} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  window: { ...(pixelCardStyle(PT) as object), overflow: 'hidden' },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: PT.fillTop,
    borderBottomWidth: PT.bw,
    borderBottomColor: PT.line,
  },
  titleDots: { flexDirection: 'row', gap: 5 },
  titleDot: { width: 8, height: 8, backgroundColor: PT.paper, borderWidth: 2, borderColor: PT.line },
  titleText: { fontFamily: CUTE_FONT.heavy, fontSize: 12, letterSpacing: 1, color: PT.onFill },

  btn: {
    height: 50,
    paddingHorizontal: 22,
    justifyContent: 'center',
    borderWidth: PT.bw,
    borderColor: PT.line,
    borderRadius: PT.radius,
    boxShadow: PT.elevBtn,
  },
  btnPrimary: { backgroundColor: PT.fillTop },
  btnSecondary: { backgroundColor: PT.paper },
  btnHover: { transform: [{ translateY: -2 }] },
  btnPressed: { transform: [{ translateY: 3 }], boxShadow: 'none' } as object,
  btnText: { fontFamily: CUTE_FONT.heavy, fontSize: 16, color: PT.text },
  btnTextPrimary: { color: PT.line },

  chip: {
    alignSelf: 'flex-start',
    fontFamily: CUTE_FONT.semi,
    fontSize: 13,
    color: PT.text,
    borderWidth: 2,
    borderColor: PT.line,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },

  tile: { overflow: 'hidden' },
  tileHover: { transform: [{ translateY: -4 }], boxShadow: '6px 6px 0 #2B1B4E' } as object,
  tileArt: { height: 150, alignItems: 'center', justifyContent: 'center', borderBottomWidth: PT.bw, borderBottomColor: PT.line },
  tileFoot: { padding: 14, gap: 8, alignItems: 'flex-start' },
  tileTitle: { fontFamily: CUTE_FONT.heavy, fontSize: 18, color: PT.text },
});
