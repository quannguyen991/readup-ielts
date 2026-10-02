import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import {
  availableBackdrops,
  backdropUrl,
  DRIFT_SECONDS,
  captionOf,
  chooseBackdrop,
  driftLayout,
  motionActive,
  probeBackdrops,
  twinkles,
  type Backdrop,
  type MotionEnv,
} from '@/data/backdrops';
import { useL } from '@/i18n/useL';
import { useBackdropStore } from '@/store/useBackdropStore';

const WEB = Platform.OS === 'web';

/* ---------- Dò file nào đã có (một lần cho cả phiên, chỉ khi người dùng bật) ---------- */

let cached: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;

function probeImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/** Danh sách tranh CÓ file thật. `enabled=false` thì không đụng mạng. */
export function useAvailableBackdrops(enabled: boolean): Backdrop[] {
  const [ok, setOk] = useState<Set<string> | null>(cached);
  useEffect(() => {
    if (!WEB || !enabled || cached) return;
    let alive = true;
    inflight ??= probeBackdrops(probeImage).then((s) => (cached = s));
    void inflight.then((s) => alive && setOk(s));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return useMemo(() => (ok ? availableBackdrops(ok) : []), [ok]);
}

/**
 * Tranh đang dùng cho lần đọc này. 'random' bốc MỘT lần khi mở bài (không đổi giữa chừng
 * khi người dùng chỉnh cỡ chữ).
 */
export function useActiveBackdrop(): { backdrop: Backdrop | null; available: Backdrop[] } {
  const on = useBackdropStore((s) => s.on);
  const choice = useBackdropStore((s) => s.choice);
  const available = useAvailableBackdrops(on);
  const [seed] = useState(() => Math.random());
  const backdrop = useMemo(() => (on && WEB ? chooseBackdrop(choice, available, seed) : null), [on, choice, available, seed]);
  return { backdrop, available };
}

/* ---------- Chuyển động nhẹ ---------- */

/** Máy yếu / tiết kiệm dữ liệu / xin giảm chuyển động. Đọc một lần: những thứ này không đổi giữa phiên. */
export function motionEnv(): MotionEnv {
  if (!WEB || typeof navigator === 'undefined') return { reducedMotion: true };
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    reducedMotion: !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  };
}

/** Tab đang hiện? Tab ẩn thì tạm dừng animation. */
function useTabVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const on = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return visible;
}

/** Máy này có cho chuyển động không (để bảng cài đặt hiện đúng trạng thái). */
export function useMotionAllowed(): boolean {
  const [env] = useState(motionEnv);
  return motionActive(true, env, true);
}

// Chỉ transform/opacity; trôi theo nấc 1px nguyên nên pixel không bao giờ lấy mẫu lẻ.
const CSS = `@keyframes bdDrift{from{transform:translate3d(calc(var(--d)*-1px),calc(var(--d)*-1px),0)}to{transform:translate3d(calc(var(--d)*1px),calc(var(--d)*1px),0)}}
@keyframes bdTw{0%,100%{opacity:.05}50%{opacity:.95}}`;

/* ---------- Lớp nền cố định ---------- */

/**
 * Ảnh tĩnh từ bản 418×235 phóng NGUYÊN số lần (nearest-neighbour), không blur, không canvas.
 * Chuyển động nhẹ (tuỳ chọn): cả tấm trôi chéo vài chục px trong ~80 giây theo nấc 1px, cộng vài chấm sao
 * nhấp nháy (opacity) ở tranh có sao. Phủ một lớp màu theo tông tranh + viền tối nhẹ để chữ đọc rõ.
 */
export function PixelBackdrop({ backdrop }: { backdrop: Backdrop }) {
  const { width, height } = useWindowDimensions();
  const motionPref = useBackdropStore((s) => s.motion);
  const [env] = useState(motionEnv);
  const visible = useTabVisible();
  if (!WEB) return null;
  const animate = motionPref && motionActive(true, env, true);
  const L = driftLayout(width, height, animate);
  const phone = width < 640;
  const a = backdrop.tone === 'dark' ? (phone ? 0.62 : 0.42) : phone ? 0.66 : 0.5;
  const edge = backdrop.tone === 'dark' ? '0,0,0' : backdrop.scrim;
  const root: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none', background: `rgb(${backdrop.scrim})` };
  const state = visible ? 'running' : 'paused';
  const sprites = animate ? twinkles(backdrop.stars, L.k) : [];
  return (
    <div aria-hidden style={root}>
      {animate ? <style>{CSS}</style> : null}
      <div
        key={backdrop.id}
        style={
          {
            position: 'absolute',
            left: L.left,
            top: L.top,
            width: L.w,
            height: L.h,
            '--d': L.d,
            ...(animate
              ? { willChange: 'transform', animation: `bdDrift ${DRIFT_SECONDS}s steps(${L.steps}, end) infinite alternate`, animationPlayState: state }
              : null),
          } as React.CSSProperties
        }
      >
        <img
          src={backdropUrl(backdrop.id, 'small')}
          alt=""
          width={L.w}
          height={L.h}
          decoding="async"
          draggable={false}
          style={{ display: 'block', width: L.w, height: L.h, maxWidth: 'none', imageRendering: 'pixelated', userSelect: 'none' }}
        />
        {sprites.map((t, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: t.x - Math.floor(t.size / 2),
              top: t.y - Math.floor(t.size / 2),
              width: t.size,
              height: t.size,
              background: '#FFF1B8',
              opacity: 0.05,
              animation: `bdTw ${t.dur}s ease-in-out ${t.delay}s infinite`,
              animationPlayState: state,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 45%, rgba(${edge},0) 55%, rgba(${edge},0.28) 100%), rgba(${backdrop.scrim},${a})`,
        }}
      />
    </div>
  );
}

/* ---------- Chú thích tranh, góc dưới trái ---------- */

export function BackdropCaption({ backdrop, phone }: { backdrop: Backdrop; phone: boolean }) {
  const { en } = useL();
  const [hiddenId, setHiddenId] = useState<string | null>(null);
  if (!WEB || hiddenId === backdrop.id) return null;
  const dark = backdrop.tone === 'dark';
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: phone ? 8 : 16, bottom: 6, zIndex: 40, flexDirection: 'row', alignItems: 'center', maxWidth: '88%' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          paddingLeft: 10,
          paddingRight: 4,
          height: 24,
          backgroundColor: dark ? 'rgba(10,14,32,0.72)' : 'rgba(255,255,255,0.8)',
        }}
      >
        <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 11, color: dark ? '#E9E4D2' : '#3A382F' }}>
          {captionOf(backdrop, en)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={en ? 'Hide caption' : 'Ẩn chú thích'}
          onPress={() => setHiddenId(backdrop.id)}
          hitSlop={8}
          style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 13, lineHeight: 14, color: dark ? '#E9E4D2' : '#3A382F' }}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- Ô xem trước trong bảng cài đặt ---------- */

export function BackdropThumb({ backdrop, selected, onPress }: { backdrop: Backdrop; selected: boolean; onPress: () => void }) {
  const { en } = useL();
  if (!WEB) return null;
  return (
    <Pressable
      accessibilityRole="button"
      aria-pressed={selected}
      accessibilityLabel={captionOf(backdrop, en)}
      onPress={onPress}
      style={{
        width: 74,
        height: 42,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: selected ? '#957846' : 'transparent',
        backgroundColor: `rgb(${backdrop.scrim})`,
      }}
    >
      <img
        src={backdropUrl(backdrop.id, 'small')}
        alt=""
        width={70}
        height={39}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', imageRendering: 'pixelated' }}
      />
    </Pressable>
  );
}
