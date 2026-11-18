import React from 'react';
import { Image } from 'react-native';

import { NeonIcon } from '@/components/neon/Neon';
import type { NeonIconId } from '@/components/neon/neon-art';
import type { GroupKey, StageKey } from './catalog-model';

/**
 * Icon pixel neon BỔ SUNG (assets/neon2, vẽ bằng code: `scripts/art/neon_extra_icons.py`) — cùng phong cách bộ icon của
 * trang Hôm nay (assets/neon). `AnyIcon` nhận cả hai bộ, nơi gọi không cần biết icon nằm ở bộ nào.
 */
const EXTRA = {
  cap: { src: require('../../../assets/neon2/cap.png'), w: 304, h: 304 },
  house: { src: require('../../../assets/neon2/house.png'), w: 304, h: 304 },
  briefcase: { src: require('../../../assets/neon2/briefcase.png'), w: 304, h: 304 },
  magnifier: { src: require('../../../assets/neon2/magnifier.png'), w: 304, h: 304 },
  globe: { src: require('../../../assets/neon2/globe.png'), w: 304, h: 304 },
  newspaper: { src: require('../../../assets/neon2/newspaper.png'), w: 304, h: 304 },
  headphones: { src: require('../../../assets/neon2/headphones.png'), w: 304, h: 304 },
  keyboard: { src: require('../../../assets/neon2/keyboard.png'), w: 304, h: 304 },
  pencil: { src: require('../../../assets/neon2/pencil.png'), w: 304, h: 304 },
  podium: { src: require('../../../assets/neon2/podium.png'), w: 304, h: 304 },
  target: { src: require('../../../assets/neon2/target.png'), w: 304, h: 304 },
  stairs: { src: require('../../../assets/neon2/stairs.png'), w: 304, h: 304 },
} as const;

export type ExtraIconId = keyof typeof EXTRA;
export type AnyIconId = NeonIconId | ExtraIconId;

export function AnyIcon({ name, height, style }: { name: AnyIconId; height: number; style?: object }) {
  if (name in EXTRA) {
    const a = EXTRA[name as ExtraIconId];
    return <Image source={a.src} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ height, width: (height * a.w) / a.h }, style]} resizeMode="contain" />;
  }
  return <NeonIcon name={name as NeonIconId} height={height} style={style} />;
}

/** Icon của từng nhóm tình huống. */
export const GROUP_ART: Record<GroupKey, AnyIconId> = { life: 'house', work: 'briefcase', academic: 'cap', ielts: 'target' };

/** Icon + bảng màu thẻ neon của từng mức (dịu → rực dần). */
export const STAGE_ART: Record<StageKey, { icon: NeonIconId; palette: string }> = {
  A1: { icon: 'book', palette: 'lime' },
  A2: { icon: 'cloud', palette: 'ocean' },
  B1: { icon: 'rocket', palette: 'grape' },
  B2: { icon: 'planet', palette: 'berry' },
  C1: { icon: 'crown', palette: 'gold' },
  C2: { icon: 'gem', palette: 'sunset' },
};
