/**
 * Bản web của khung bản đồ thành phố: một canvas pixel-art lấp đầy khung cha.
 * Engine (`../engine/CityEngine`) tự lo vẽ, nhập liệu, tạm dừng khi tab ẩn / ra khỏi màn hình.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { useLocale } from '@/i18n/useL';
import { CityEngine } from '../engine/CityEngine';
import type { CityCanvasProps } from './CityCanvas';

export type { CityCanvasProps } from './CityCanvas';

export function CityCanvas({ map: mapProp, fallbackMap, state, onEnterPoi, onMove, reducedMotion, hour, weather, debug }: CityCanvasProps) {
  const locale = useLocale();
  // Bản đồ ảnh không tải được tranh → chuyển sang bản đồ ô dự phòng (nếu có).
  const [failedId, setFailedId] = useState<string | null>(null);
  const map = failedId === mapProp.id && fallbackMap ? fallbackMap : mapProp;
  const debugOn = debug ?? (typeof window !== 'undefined' && /[?&]debug=1/.test(window.location.search));
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CityEngine | null>(null);
  const cbs = useRef({ onEnterPoi, onMove });
  const latest = useRef({ state, reducedMotion, locale, hour, weather });

  // Giữ bản mới nhất của callback/props trong ref (cập nhật ở effect, không trong lúc render).
  useEffect(() => {
    cbs.current = { onEnterPoi, onMove };
    latest.current = { state, reducedMotion, locale, hour, weather };
  });

  // Dựng lại engine khi đổi thành phố.
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const L = latest.current;
    const engine = new CityEngine(
      canvas,
      { onEnterPoi: (id) => cbs.current.onEnterPoi(id), onMove: (t) => cbs.current.onMove(t), onImageError: () => setFailedId(mapProp.id) },
      map,
      L.state,
      { reducedMotion: L.reducedMotion || !!mq?.matches, locale: L.locale, hour: L.hour, weather: L.weather, debug: debugOn },
    );
    engineRef.current = engine;
    const fit = () => {
      const r = box.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) engine.resize(r.width, r.height, window.devicePixelRatio || 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    window.addEventListener('resize', fit);
    const onMq = () => engine.setOptions({ reducedMotion: latest.current.reducedMotion || !!mq?.matches });
    mq?.addEventListener?.('change', onMq);
    engine.start();
    if (typeof __DEV__ !== 'undefined' && __DEV__) (window as unknown as { __cityEngine?: CityEngine }).__cityEngine = engine;
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
      mq?.removeEventListener?.('change', onMq);
      engine.dispose();
      if (engineRef.current === engine) engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    engineRef.current?.setState(state);
  }, [state]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    engineRef.current?.setOptions({ reducedMotion: reducedMotion || !!mq?.matches, locale, hour, weather, debug: debugOn });
  }, [reducedMotion, locale, hour, weather, debugOn]);

  return (
    <View style={{ flex: 1, minHeight: 240, overflow: 'hidden', backgroundColor: '#141b2c' }}>
      <div ref={boxRef} style={{ position: 'absolute', inset: 0 }}>
        <canvas
          ref={canvasRef}
          role="application"
          aria-label={locale === 'en' ? `${map.name.en} map. Tap to walk, arrow keys or WASD to move.` : `Bản đồ ${map.name.vi}. Chạm để đi, phím mũi tên hoặc WASD để di chuyển.`}
          style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }}
        />
      </div>
    </View>
  );
}
