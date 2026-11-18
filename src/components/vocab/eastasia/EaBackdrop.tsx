import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { SIDEBAR_WIDTH, useSidebarStore } from '@/store/useSidebarStore';

import { JA_MOTIF, ZH_MOTIF } from './motifs';
import { useEaSidebar } from './useEaSidebar';
import type { EaSkin } from './skins';

/**
 * Skin đang dùng cho NỀN TRANG: màn lộ trình, trang sách, trang bộ và trang bài học của sách Trung/Nhật.
 * Màn làm bài con (`/vocabulary/topic/<bài>/learn|quiz…`) cũng dùng nền này (chủ đề study sinh từ skin). Trang khác `null`.
 */
export function useEaPageSkin(): EaSkin | null {
  const ea = useEaSidebar();
  return ea ? ea.skin : null;
}

type Deco = { m: number; side: 'l' | 'r'; x: number | string; top: string; w: number; h: number; rot?: number; op?: number; flip?: boolean };

/** Họa tiết cố định ở hai lề và khe giữa các khối: cuộn trang thì chúng đứng yên, nội dung trượt qua. */
const DECO: Record<'ja' | 'zh', Deco[]> = {
  ja: [
    { m: JA_MOTIF.sakuraR, side: 'l', x: -30, top: '30%', w: 210, h: 150, rot: 6, op: 0.9 },
    { m: JA_MOTIF.sakuraL, side: 'r', x: -30, top: '44%', w: 230, h: 160, rot: -4, op: 0.9 },
    { m: JA_MOTIF.cloud, side: 'r', x: '3%', top: '20%', w: 190, h: 82, op: 0.7 },
    { m: JA_MOTIF.cloudBand, side: 'l', x: '3%', top: '60%', w: 220, h: 56, op: 0.6 },
    { m: JA_MOTIF.maple, side: 'l', x: -26, top: '78%', w: 150, h: 120, rot: 12, op: 0.85 },
    { m: JA_MOTIF.wisteria, side: 'r', x: -10, top: '72%', w: 120, h: 150, op: 0.85 },
    { m: JA_MOTIF.petals, side: 'l', x: '9%', top: '40%', w: 70, h: 56, rot: 30, op: 0.85 },
    { m: JA_MOTIF.petals, side: 'r', x: '8%', top: '58%', w: 60, h: 48, rot: -20, op: 0.85 },
    { m: JA_MOTIF.petals, side: 'l', x: '4%', top: '88%', w: 64, h: 50, rot: 70, op: 0.8 },
  ],
  zh: [
    { m: ZH_MOTIF.plum, side: 'l', x: -30, top: '30%', w: 210, h: 150, rot: 6, op: 0.95 },
    { m: ZH_MOTIF.peach, side: 'r', x: -30, top: '44%', w: 230, h: 160, rot: -4, op: 0.95 },
    { m: ZH_MOTIF.ruyiCloud, side: 'r', x: '3%', top: '20%', w: 180, h: 88, op: 0.7 },
    { m: ZH_MOTIF.cloudScroll, side: 'l', x: '3%', top: '60%', w: 230, h: 82, op: 0.6 },
    { m: ZH_MOTIF.bamboo, side: 'l', x: -14, top: '76%', w: 120, h: 180, op: 0.9 },
    { m: ZH_MOTIF.peony, side: 'r', x: -16, top: '74%', w: 150, h: 140, op: 0.9 },
    { m: ZH_MOTIF.butterflies, side: 'l', x: '8%', top: '42%', w: 90, h: 64, op: 0.9 },
    { m: ZH_MOTIF.butterflies, side: 'r', x: '9%', top: '62%', w: 80, h: 58, op: 0.9, flip: true },
    { m: ZH_MOTIF.lantern, side: 'l', x: '2%', top: '-1%', w: 54, h: 98, op: 0.95 },
    { m: ZH_MOTIF.lantern, side: 'r', x: '5%', top: '-1%', w: 48, h: 88, op: 0.95 },
  ],
};

/** Nền tràn viền của màn lộ trình: màu skin, tranh hero mờ dần xuống nền, họa tiết ở hai lề. */
export function EaPageBackdrop({ skin }: { skin: EaSkin }) {
  const bg = skin.c.bg;
  const { width } = useWindowDimensions();
  const collapsed = useSidebarStore((s) => s.collapsed);
  // Lề trái chừa chỗ thanh bên (chỉ từ màn rộng, nơi thanh bên cố định).
  const left = width >= 1024 ? (collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded) : 0;
  const items = width >= 700 ? DECO[skin.lang] : DECO[skin.lang].slice(0, 4);
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: bg }, Platform.OS === 'web' ? ({ willChange: 'transform', contain: 'strict' } as object) : null]}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1000 }}>
        <Image source={skin.hero} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: skin.dark ? 0.3 : 0.38 }} />
        <LinearGradient colors={[`${bg}00`, `${bg}cc`, bg]} locations={[0, 0.55, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      </View>
      <View style={{ position: 'absolute', left, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
        {items.map((d, i) => (
          <Image
            key={i}
            source={d.m}
            contentFit="contain"
            style={[
              { position: 'absolute', top: d.top as never, width: d.w, height: d.h, opacity: d.op ?? 1, transform: [{ rotate: `${d.rot ?? 0}deg` }, { scaleX: d.flip ? -1 : 1 }] },
              d.side === 'l' ? { left: d.x as never } : { right: d.x as never },
            ]}
          />
        ))}
      </View>
    </View>
  );
}
