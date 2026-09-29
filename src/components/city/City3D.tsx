import React, { useEffect, useRef } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Plots } from '@/services/city/blueprints';
import type { CityHandle, TimeOfDay } from './city-scene';

export type { TimeOfDay };

/**
 * Khung chứa cảnh 3D Thành phố Tri thức (`city-scene.ts`). three.js chỉ tải khi
 * khung xuất hiện, chỉ trên web. Đổi `plots`/`time`/`selected` thì báo cho
 * cảnh đang chạy — không dựng lại cả thành phố.
 */
export function City3D({
  plots,
  time,
  editable,
  selected,
  focusLot,
  onPick,
  onReady,
  style,
}: {
  plots: Plots;
  time: TimeOfDay;
  editable: boolean;
  selected: string | null;
  /** Đổi giá trị (vd. `${lotId}:${n}`) để bay camera tới khu đất vừa xây. */
  focusLot?: string | null;
  onPick: (lotId: string | null) => void;
  onReady?: (ok: boolean) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const host = useRef<View>(null);
  const handle = useRef<CityHandle | null>(null);
  /** Bộ nhà cảnh đang vẽ + chế độ lúc vẽ — để biết nhà nào là MỚI xây. */
  const shown = useRef<{ plots: Plots; editable: boolean } | null>(null);
  const latest = useRef({ plots, time, editable, selected, onPick, onReady });
  useEffect(() => {
    latest.current = { plots, time, editable, selected, onPick, onReady };
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const el = host.current as unknown as HTMLElement | null;
    if (!el) return;
    let cancelled = false;
    void import('./city-scene')
      .then(({ mountCity }) => {
        if (cancelled) return;
        const l = latest.current;
        handle.current = mountCity(el, { plots: l.plots, time: l.time, editable: l.editable, onPick: (id) => latest.current.onPick(id) });
        handle.current.select(l.selected);
        shown.current = { plots: l.plots, editable: l.editable };
        l.onReady?.(true);
      })
      .catch(() => latest.current.onReady?.(false));
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
  }, []);

  // Nhà mới xây thì mọc lên có bụi; lần nạp đầu / đổi giữa thành phố mẫu và
  // thành phố của bạn thì hiện ngay, không cho cả thành phố "mọc" lại.
  useEffect(() => {
    const h = handle.current;
    if (!h) return;
    const prev = shown.current;
    const sameMode = prev !== null && prev.editable === editable;
    h.setPlots(plots, sameMode && editable);
    shown.current = { plots, editable };
  }, [plots, editable]);

  useEffect(() => {
    handle.current?.setTime(time);
  }, [time]);
  useEffect(() => {
    handle.current?.setEditable(editable);
  }, [editable]);
  useEffect(() => {
    handle.current?.select(selected);
  }, [selected]);
  useEffect(() => {
    if (focusLot) handle.current?.focus(focusLot.split(':')[0]!);
  }, [focusLot]);

  return <View ref={host} style={style} />;
}
