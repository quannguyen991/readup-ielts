/**
 * Các mảnh HUD đổi theo từng khung / từng cú rê chuột (vị trí người chơi, chú thích địa điểm). Mỗi mảnh tự giữ state và
 * nghe một "bus" nhỏ, nên `ImmersiveCity` KHÔNG dựng lại cả HUD mỗi lần người chơi nhích một điểm hay chuột di chuyển.
 */
import React, { useEffect, useRef, useState } from 'react';

import type { PoiContent } from '@/data/travel/pois';
import type { CityMap } from '@/services/travel/types';
import { Minimap } from './Minimap';
import { PoiTooltip } from './PoiTooltip';

export type Bus<T> = { emit(v: T): void; sub(f: (v: T) => void): () => void };

export function createBus<T>(): Bus<T> {
  const subs = new Set<(v: T) => void>();
  return {
    emit: (v) => subs.forEach((f) => f(v)),
    sub: (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
  };
}

export type Pt = { x: number; y: number };
export type Hover = { id: string; at: Pt } | null;

export function MinimapLive({ bus, ...rest }: { bus: Bus<Pt>; map: CityMap; recommended: string | null; locked: ReadonlySet<string>; done: ReadonlySet<string>; width: number; label: string }) {
  const [player, setPlayer] = useState<Pt | null>(null);
  useEffect(() => bus.sub(setPlayer), [bus]);
  return <Minimap {...rest} player={player} />;
}

export function HoverTip({ bus, pois, locked, stars, hidden }: { bus: Bus<Hover>; pois: PoiContent[]; locked: ReadonlySet<string>; stars: (id: string) => number; hidden: boolean }) {
  const [hover, setHover] = useState<Hover>(null);
  const last = useRef<Hover>(null);
  useEffect(
    () =>
      bus.sub((h) => {
        // bỏ qua cú rê trùng toạ độ (nguyên) để khỏi dựng lại vô ích
        const p = last.current;
        if (p && h && p.id === h.id && Math.round(p.at.x) === Math.round(h.at.x) && Math.round(p.at.y) === Math.round(h.at.y)) return;
        last.current = h;
        setHover(h);
      }),
    [bus],
  );
  const poi = hover ? pois.find((p) => p.id === hover.id) : undefined;
  if (!poi || !hover || hidden) return null;
  const needs = poi.unlock?.after ? pois.find((q) => q.id === poi.unlock!.after) : undefined;
  return <PoiTooltip poi={poi} at={hover.at} locked={locked.has(poi.id)} needs={needs} stars={stars(poi.id)} />;
}
