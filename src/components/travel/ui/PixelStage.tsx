/**
 * SÂN KHẤU ẢNH PIXEL: hiện một ảnh pixel-art (lưới nguồn 418×235) với độ phóng là
 * BỘI SỐ NGUYÊN của điểm ảnh thiết bị — không nội suy, không vỡ nét. Điểm nóng đặt
 * theo toạ độ nguồn. Màn hẹp hơn một lần phóng 1× thì cho cuộn ngang, giữ điểm
 * quan tâm ở giữa.
 */
import React, { useEffect, useState } from 'react';
import { Image, Platform, PixelRatio, ScrollView, View, type LayoutChangeEvent, type ImageSourcePropType } from 'react-native';

export const SRC_W = 418;
export const SRC_H = 235;

const KEYFRAMES = `
@keyframes tvPulse{0%{transform:scale(.7);opacity:.95}100%{transform:scale(1.7);opacity:0}}
@keyframes tvBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@media (prefers-reduced-motion: reduce){.tv-anim{animation:none !important}}
`;

/** Gắn keyframes dùng cho nhịp sáng / chim nhảy một lần (chỉ web). */
export function useTravelKeyframes(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('tv-keyframes')) return;
    const el = document.createElement('style');
    el.id = 'tv-keyframes';
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

/** Style CSS animation (web); native trả về rỗng. */
export function cssAnim(name: 'tvPulse' | 'tvBounce', ms: number, still: boolean): object {
  if (Platform.OS !== 'web' || still) return {};
  return { animation: `${name} ${ms}ms ${name === 'tvPulse' ? 'ease-out' : 'ease-in-out'} infinite` };
}

/** Độ phóng nguyên theo điểm ảnh thiết bị: k·dpr là số nguyên, k ≥ 1. */
export function pickScale(width: number, dpr: number): number {
  const device = Math.floor((width * dpr) / SRC_W);
  return Math.max(1, device / dpr);
}

export function PixelStage({
  source,
  focus,
  label,
  children,
}: {
  source: ImageSourcePropType;
  /** Điểm nguồn (px) cần ở giữa khi phải cuộn ngang. */
  focus?: { x: number; y: number };
  label: string;
  children: (k: number) => React.ReactNode;
}) {
  const [width, setWidth] = useState(0);
  useTravelKeyframes();
  const dpr = Platform.OS === 'web' && typeof window !== 'undefined' ? window.devicePixelRatio || 1 : PixelRatio.get();
  const k = width ? pickScale(width, dpr) : 1;
  const w = SRC_W * k;
  const h = SRC_H * k;
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  const scroll = w > width;
  const offset = scroll && focus ? Math.max(0, Math.min(w - width, focus.x * k - width / 2)) : 0;

  const img =
    Platform.OS === 'web'
      ? React.createElement('img', {
          src: typeof source === 'object' && source && 'uri' in source ? (source as { uri: string }).uri : (source as unknown as string),
          alt: label,
          width: w,
          height: h,
          draggable: false,
          style: { display: 'block', width: w, height: h, imageRendering: 'pixelated', userSelect: 'none' },
        })
      : <Image source={source} style={{ width: w, height: h }} resizeMode="stretch" accessibilityLabel={label} />;

  const stage = (
    <View style={{ width: w, height: h, backgroundColor: '#12233F' }}>
      {img}
      {width ? children(k) : null}
    </View>
  );

  return (
    <View onLayout={onLayout} style={{ width: '100%', alignItems: scroll ? undefined : 'center' }}>
      <View style={{ borderWidth: 2, borderColor: '#0F1D33', borderRadius: 6, overflow: 'hidden', maxWidth: '100%' }}>
        {scroll ? (
          <ScrollView horizontal showsHorizontalScrollIndicator contentOffset={{ x: offset, y: 0 }} style={{ width }}>
            {stage}
          </ScrollView>
        ) : (
          stage
        )}
      </View>
    </View>
  );
}
