import React, { useEffect, useRef } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Plant } from '@/services/vocab/garden';
import type { GardenHandle } from './garden-scene';

/**
 * Khung chứa hòn đảo 3D của Vườn từ (`garden-scene.ts`). Tải three.js lúc cần,
 * chỉ trên web. `selected` đổi thì chỉ dời vòng sáng, không dựng lại cả đảo.
 */
export function Garden3D({
  plants,
  selected,
  onPick,
  style,
}: {
  plants: readonly Plant[];
  selected: string | null;
  onPick: (id: string | null) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const host = useRef<View>(null);
  const handle = useRef<GardenHandle | null>(null);
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const el = host.current as unknown as HTMLElement | null;
    if (!el) return;
    let cancelled = false;
    void import('./garden-scene')
      .then(({ mountGarden }) => {
        if (!cancelled) handle.current = mountGarden(el, plants, (id) => pick.current(id));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
  }, [plants]);

  useEffect(() => {
    handle.current?.select(selected);
  }, [selected]);

  return <View ref={host} style={style} />;
}
