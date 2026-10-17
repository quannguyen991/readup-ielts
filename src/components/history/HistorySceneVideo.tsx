import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { useReducedMotion } from '@/components/travel/ui/hooks';

type Layer = { id: number; base: string; visible: boolean };

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/** Muted cinematic clips used as a single, crossfading background sequence on web. */
export function HistorySceneVideo({ base, sequence, nextBase, sceneId, active }: { base: string; sequence?: string[]; nextBase?: string; sceneId?: string; active: boolean }) {
  const reduced = useReducedMotion();
  const nextId = useRef(0);
  const fadeTimer = useRef<number | null>(null);
  const [inView, setInView] = useState(true);
  const [clipIndex, setClipIndex] = useState(0);
  const playlist = sequence?.length ? sequence : [base];
  const playlistKey = playlist.join('|');
  const activeBase = playlist[clipIndex % playlist.length] ?? base;
  const upcomingBase = playlist.length > 1 ? playlist[(clipIndex + 1) % playlist.length] : nextBase;
  const shouldPlay = active && inView;
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, base, visible: true }]);

  useEffect(() => setClipIndex(0), [playlistKey]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const host = document.getElementById(`history-video-${sceneId ?? 'stage'}`);
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.02 });
    observer.observe(host);
    return () => observer.disconnect();
  }, [sceneId]);

  useEffect(() => {
    setLayers((current) => {
      const top = current[current.length - 1];
      if (top?.base === activeBase) return current;
      return [...current.slice(-1), { id: ++nextId.current, base: activeBase, visible: false }];
    });
  }, [activeBase]);

  const advance = useCallback(() => {
    if (playlist.length > 1) setClipIndex((index) => (index + 1) % playlist.length);
  }, [playlist.length]);

  const reveal = useCallback((id: number) => {
    setLayers((current) => current.map((layer) => ({ ...layer, visible: layer.id === id })));
    if (fadeTimer.current != null) window.clearTimeout(fadeTimer.current);
    if (reduced) {
      setLayers((current) => current.filter((layer) => layer.id === id));
      fadeTimer.current = null;
      return;
    }
    fadeTimer.current = window.setTimeout(() => {
      setLayers((current) => current.filter((layer) => layer.id === id));
      fadeTimer.current = null;
    }, 900);
  }, [reduced]);

  useEffect(() => () => {
    if (fadeTimer.current != null) window.clearTimeout(fadeTimer.current);
  }, []);

  // Prefetch one compatible next-scene file only after the browser reaches idle.
  useEffect(() => {
    if (!shouldPlay || reduced || !upcomingBase || upcomingBase === activeBase || typeof document === 'undefined') return;
    const idleWindow = window as IdleWindow;
    let link: HTMLLinkElement | null = null;
    const schedule = () => {
      const probe = document.createElement('video');
      const extension = probe.canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4';
      link = document.createElement('link');
      link.rel = 'prefetch';
      link.setAttribute('as', 'video');
      link.setAttribute('fetchpriority', 'low');
      link.href = `${upcomingBase}.${extension}`;
      document.head.appendChild(link);
    };
    const idleId = idleWindow.requestIdleCallback?.(schedule, { timeout: 5000 });
    const fallbackId = idleId == null ? window.setTimeout(schedule, 1200) : null;
    return () => {
      if (idleId != null) idleWindow.cancelIdleCallback?.(idleId);
      if (fallbackId != null) window.clearTimeout(fallbackId);
      link?.remove();
    };
  }, [shouldPlay, activeBase, upcomingBase, reduced]);

  return (
    <View nativeID={`history-video-${sceneId ?? 'stage'}`} pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: '#0B130C' }}>
      {layers.map((layer, index) => (
        <VideoLayer
          key={layer.id}
          base={layer.base}
          active={shouldPlay && !reduced && index === layers.length - 1}
          reduced={reduced}
          visible={layer.visible}
          onPosterReady={() => reveal(layer.id)}
          loop={playlist.length === 1}
          onEnded={advance}
        />
      ))}
    </View>
  );
}

function VideoLayer({ base, active, reduced, visible, onPosterReady, loop, onEnded }: { base: string; active: boolean; reduced: boolean; visible: boolean; onPosterReady: () => void; loop: boolean; onEnded: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const poster = `${base}-poster.jpg`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;

    const syncPlayback = () => {
      if (!active || document.visibilityState === 'hidden') {
        video.pause();
        return;
      }
      void video.play().catch(() => {
        // Keep the poster visible if autoplay is unavailable on this browser.
      });
    };

    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      document.removeEventListener('visibilitychange', syncPlayback);
      video.pause();
    };
  }, [active, base, reduced]);

  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0B130C', opacity: visible ? 1 : 0 },
        reduced ? null : ({ transition: 'opacity 900ms ease' } as object),
      ]}
    >
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        draggable={false}
        onLoad={onPosterReady}
        onError={onPosterReady}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {!reduced ? (
        <video
          ref={videoRef}
          autoPlay={active}
          muted
          loop={loop}
          playsInline
          controls={false}
          preload={active ? 'metadata' : 'none'}
          poster={poster}
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={onEnded}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: playing ? 1 : 0, transition: 'opacity 800ms ease', display: 'block' }}
        >
          <source src={`${base}.webm`} type="video/webm" />
          <source src={`${base}.mp4`} type="video/mp4" />
        </video>
      ) : null}
    </View>
  );
}
