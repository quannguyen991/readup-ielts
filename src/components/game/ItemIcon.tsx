import React from 'react';
import { Image } from 'react-native';

import type { ItemKind } from '@/services/game/rules';

/** Icon 2D của bốn vật phẩm trong trận, đặt ở public/icons. */
const ART: Record<ItemKind, string> = {
  potion: '/icons/item-potion.png',
  shield: '/icons/item-shield.png',
  double: '/icons/item-boost.png',
  hint: '/icons/item-owl.png',
};

export function ItemIcon({ kind, size }: { kind: ItemKind; size: number }) {
  return <Image source={{ uri: ART[kind] }} resizeMode="contain" style={{ width: size, height: size }} accessible={false} />;
}
