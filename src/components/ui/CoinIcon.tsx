import React from 'react';
import { Image } from 'react-native';

/**
 * Icon đồng xu vẽ riêng (ChatGPT) cho các màn hình. Ảnh nằm ở public/roadmap/icons/<tên>.png,
 * nền trong suốt, viền trắng dày. Thêm icon mới thì thêm tên vào COIN_NAMES và đặt file cùng tên.
 */
export const COIN_NAMES = [
  'home',
  'vocab',
  'path',
  'friends',
  'achievements',
  'missions',
  'listening',
  'speaking',
  'writing',
  'progress',
  'math',
  'more',
] as const;

export type CoinName = (typeof COIN_NAMES)[number];

export function CoinIcon({ name, size = 40 }: { name: CoinName; size?: number }) {
  return (
    <Image
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      source={{ uri: `/roadmap/icons/${name}.png` }}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
}
