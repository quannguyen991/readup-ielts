/**
 * Bản web của khung bản đồ thành phố: một canvas pixel-art lấp đầy khung cha.
 * Engine (`../engine/CityEngine`) tự lo vẽ, nhập liệu, tạm dừng khi tab ẩn / ra khỏi màn hình.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { useLocale } from '@/i18n/useL';
import { CityEngine } from '../engine/CityEngine';
import { capDpr } from '../mobile';
import { FullscreenButton, toggleFullscreen } from './fullscreen';
import type { CityCanvasProps } from './CityCanvas';

export type { CityCanvasProps } from './CityCanvas';

export function CityCanvas({ map: mapProp, fallbackMap, state, onEnterPoi, onTalkNpc, onMove, reducedMotion, hour, weather, debug, highlights, onHoverPoi, onPlayer, handleRef, hideFullscreenButton, missionNpcs, missionGoal, missionTalk, onMissionArrive, onMissionNear, onMissionLayout }: CityCanvasProps) {
  const locale = useLocale();
  // Bản đồ ảnh không tải được tranh → chuyển sang bản đồ ô dự phòng (nếu có).
  const [failedId, setFailedId] = useState<string | null>(null);
  const map = failedId === mapProp.id && fallbackMap ? fallbackMap : mapProp;
  const debugOn = debug ?? (typeof window !== 'undefined' && /[?&]debug=1/.test(window.location.search));
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CityEngine | null>(null);
  const cbs = useRef({ onEnterPoi, onTalkNpc, onMove, onHoverPoi, onPlayer, onMissionArrive, onMissionNear, onMissionLayout });
  const missionRef = useRef({ npcs: missionNpcs, goal: missionGoal, talk: missionTalk });
  const latest = useRef({ state, reducedMotion, locale, hour, weather });

  // Giữ bản mới nhất của callback/props trong ref (cập nhật ở effect, không trong lúc render).
  useEffect(() => {
    cbs.current = { onEnterPoi, onTalkNpc, onMove, onHoverPoi, onPlayer, onMissionArrive, onMissionNear, onMissionLayout };
    missionRef.current = { npcs: missionNpcs, goal: missionGoal, talk: missionTalk };
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
      { onEnterPoi: (id) => cbs.current.onEnterPoi(id), onTalkNpc: (context) => cbs.current.onTalkNpc?.(context), onMove: (t) => cbs.current.onMove(t), onImageError: () => setFailedId(mapProp.id), onToggleFullscreen: () => toggleFullscreen(), onHoverPoi: (id, at) => cbs.current.onHoverPoi?.(id, at), onPlayer: (p) => cbs.current.onPlayer?.(p), onMissionArrive: (id) => cbs.current.onMissionArrive?.(id), onMissionNear: (id) => cbs.current.onMissionNear?.(id), onMissionLayout: (l) => cbs.current.onMissionLayout?.(l) },
      map,
      L.state,
      { reducedMotion: L.reducedMotion || !!mq?.matches, locale: L.locale, hour: L.hour, weather: L.weather, debug: debugOn },
    );
    engineRef.current = engine;
    if (missionRef.current.npcs) {
      engine.setMissionNpcs(missionRef.current.npcs);
      engine.setMissionGoal(missionRef.current.goal ?? null);
    }
    if (handleRef) handleRef.current = { walkToPoi: (id) => engine.walkToPoi(id), setStick: (d) => engine.setStick(d), setInputEnabled: (enabled) => engine.setInputEnabled(enabled), interact: () => engine.interactNow(), missionWalkTo: (id) => engine.missionWalkTo(id) };
    // Đo lại khung: gộp mọi nguồn (đổi cỡ, xoay màn hình, thanh địa chỉ co/giãn, bàn phím) thành MỘT lần/khung hình.
    // Engine giữ nguyên trạng thái (vị trí, hội thoại, zoom) — chỉ đổi bộ đệm vẽ + máy quay.
    let pending = 0;
    let lastW = 0;
    let lastH = 0;
    let lastDpr = 0;
    const measure = () => {
      pending = 0;
      // clientWidth/Height (không bị ảnh hưởng bởi CSS transform phóng to của lớp ngoài) thay vì getBoundingClientRect.
      const r = { width: box.clientWidth, height: box.clientHeight };
      if (r.width <= 0 || r.height <= 0) return;
      const dpr = capDpr(window.devicePixelRatio || 1);
      if (r.width === lastW && r.height === lastH && dpr === lastDpr) return;
      lastW = r.width;
      lastH = r.height;
      lastDpr = dpr;
      engine.resize(r.width, r.height, dpr);
    };
    const fit = () => {
      if (!pending) pending = window.requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    const vv = window.visualViewport;
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    vv?.addEventListener('resize', fit);
    const onMq = () => engine.setOptions({ reducedMotion: latest.current.reducedMotion || !!mq?.matches });
    mq?.addEventListener?.('change', onMq);
    engine.start();
    if (typeof __DEV__ !== 'undefined' && __DEV__) (window as unknown as { __cityEngine?: CityEngine }).__cityEngine = engine;
    return () => {
      ro.disconnect();
      if (pending) window.cancelAnimationFrame(pending);
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
      vv?.removeEventListener('resize', fit);
      mq?.removeEventListener?.('change', onMq);
      engine.dispose();
      if (engineRef.current === engine) engineRef.current = null;
      if (handleRef?.current) handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    engineRef.current?.setState(state);
  }, [state]);

  useEffect(() => {
    engineRef.current?.setMissionNpcs(missionNpcs ?? []);
  }, [missionNpcs]);

  useEffect(() => {
    engineRef.current?.setMissionGoal(missionGoal ?? null);
  }, [missionGoal]);

  useEffect(() => {
    engineRef.current?.missionTalk(missionTalk ?? null);
  }, [missionTalk]);

  useEffect(() => {
    engineRef.current?.setHighlights(highlights ?? {});
  }, [highlights, map]);

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
          style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        />
      </div>
      {hideFullscreenButton ? null : <FullscreenButton />}
    </View>
  );
}
