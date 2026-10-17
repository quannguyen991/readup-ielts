import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, View } from 'react-native';

import { useReducedMotion } from '@/components/travel/ui/hooks';
import type { SceneMotionEffect, SceneMotionLayer, SceneMotionProfile } from '@/services/history/types';

import { HistoryPixelEffects } from './HistoryPixelEffects';

const WEB = Platform.OS === 'web';

/** Atmospheric overlays add depth without moving or inventing historical subjects. */
export function HistorySceneMotion({ sceneId, profile, isScreenFocused = true }: { sceneId: string; profile?: SceneMotionProfile; isScreenFocused?: boolean }) {
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [appActive, setAppActive] = useState(true);
  const layers = profile?.layers ?? [];

  useEffect(() => {
    if (!WEB || typeof document === 'undefined') return;
    const host = document.getElementById(`history-motion-${sceneId}`);
    if (!host || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.02 });
    observer.observe(host);
    return () => observer.disconnect();
  }, [sceneId]);

  useEffect(() => {
    if (!WEB || typeof document === 'undefined') return;
    const update = () => setPageVisible(document.visibilityState !== 'hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (WEB) return;
    if (AppState.currentState) setAppActive(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  const active = isScreenFocused && inView && pageVisible && appActive && !reduced;
  const css = useMemo(() => layers.map(makeKeyframes).join('\n'), [layers]);

  if (layers.length === 0 || reduced) return null;
  return (
    <View
      nativeID={`history-motion-${sceneId}`}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      {WEB ? <style>{css}</style> : null}
      {layers.map((layer, index) => (
        <MotionLayerView key={`${sceneId}-${layer.id}`} layer={layer} sceneId={sceneId} active={active} reduced={reduced} index={index} />
      ))}
    </View>
  );
}

function makeKeyframes(layer: SceneMotionLayer): string {
  const name = animationName(layer);
  const depth = clamp(layer.depth, 0, 1);
  const driftX = layer.effect === 'mist' ? 45 + (1 - depth) * 24 : layer.effect === 'water' ? 25 + (1 - depth) * 9 : layer.effect === 'smoke' ? 16 : layer.effect === 'foliage' ? 15 : 9;
  const driftY = layer.effect === 'smoke' ? 17 : layer.effect === 'dust' ? 9 : layer.effect === 'foliage' ? 6 : 3;
  const opacity = strength(layer);
  const tilt = layer.effect === 'water' ? 27 : layer.effect === 'foliage' ? 5 : 0;
  const zNear = Math.round((1 - depth) * 22);
  const zFar = Math.round((1 - depth) * 7);
  return `@keyframes ${name}{0%,100%{opacity:${opacity * 0.64};transform:perspective(1000px) translate3d(-${driftX}px,${driftY}px,${zFar}px) rotateX(${tilt}deg) scale(.985)}50%{opacity:${opacity};transform:perspective(1000px) translate3d(${driftX}px,-${driftY}px,${zNear}px) rotateX(${tilt}deg) scale(1.025)}}`;
}

function animationName(layer: SceneMotionLayer): string {
  return `history-${layer.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function strength(layer: SceneMotionLayer): number {
  const gain: Record<SceneMotionEffect, number> = {
    mist: 3.25, water: 4.8, smoke: 3.4, sunlight: 3.7,
    lamp: 4.3, foliage: 4, dust: 3.7, glow: 4.3,
  };
  return clamp(layer.opacity * gain[layer.effect], 0.24, 0.64);
}

function MotionLayerView({ layer, sceneId, active, reduced, index }: { layer: SceneMotionLayer; sceneId: string; active: boolean; reduced: boolean; index: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const depth = clamp(layer.depth, 0, 1);
  const opacity = strength(layer);
  const duration = clamp(layer.durationMs, 1200, 12000);
  const drift = layer.effect === 'mist' ? 45 + (1 - depth) * 24 : layer.effect === 'water' ? 25 + (1 - depth) * 9 : layer.effect === 'smoke' ? 16 : layer.effect === 'foliage' ? 15 : 9;
  const tilt = layer.effect === 'water' ? '27deg' : layer.effect === 'foliage' ? '5deg' : '0deg';

  useEffect(() => {
    if (WEB || !active) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(Math.min((layer.phaseMs ?? index * 420) % duration, 1600)),
        Animated.timing(progress, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      progress.stopAnimation();
    };
  }, [active, duration, index, layer.phaseMs, progress]);

  const nativeAnimatedStyle = {
    opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [opacity * 0.64, opacity, opacity * 0.64] }),
    transform: [
      { perspective: 1000 },
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-drift, drift] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [1.5, -1.5] }) },
      { rotateX: tilt },
      { scale: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.985, 1.025, 0.985] }) },
    ],
  };
  const webAnimation = active && !reduced
    ? ({ animation: `${animationName(layer)} ${duration}ms ${layer.effect === 'water' || layer.effect === 'foliage' || layer.effect === 'dust' ? 'steps(8,end)' : 'ease-in-out'} ${-((layer.phaseMs ?? index * 420) % duration)}ms infinite alternate`, transformStyle: 'preserve-3d', willChange: 'transform, opacity' } as object)
    : null;

  return (
    <Animated.View
      nativeID={`history-effect-${sceneId}-${layer.id}`}
      style={[
        { position: 'absolute', top: `${clamp(layer.top, -5, 105)}%`, left: `${clamp(layer.left, -5, 105)}%`, width: `${clamp(layer.width, 1, 110)}%`, height: `${clamp(layer.height, 1, 110)}%`, overflow: 'visible', opacity: WEB ? opacity : undefined },
        WEB ? webAnimation : nativeAnimatedStyle,
      ]}
    >
      <HistoryPixelEffects sceneId={sceneId} layer={layer} />
    </Animated.View>
  );
}
