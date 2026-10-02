import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import {
  BACKDROPS,
  RANDOM,
  availableBackdrops,
  backdropThumb,
  backdropUrl,
  captionOf,
  chooseBackdrop,
  motionActive,
  probeBackdrops,
  scrimAlpha,
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

/** Tranh cho MỘT lần đọc báo. 'random' bốc một lần khi mở bài (không đổi khi chỉnh cỡ chữ). */
export function useActiveBackdrop(): { backdrop: Backdrop | null; available: Backdrop[] } {
  const on = useBackdropStore((s) => s.on);
  const choice = useBackdropStore((s) => s.choice);
  const available = useAvailableBackdrops(on);
  const [seed] = useState(() => Math.random());
  const backdrop = useMemo(() => (on && WEB ? chooseBackdrop(choice, available, seed) : null), [on, choice, available, seed]);
  return { backdrop, available };
}

const SESSION_SEED = Math.random();

/**
 * Tranh làm chủ đề màn học từ vựng (null nếu không dùng tranh). Hạt giống theo PHIÊN trang, không theo
 * thành phần: khung học và nền cùng gọi hook này nên 'ngẫu nhiên' phải ra cùng một bức. Chưa dò xong thì
 * coi mọi bức đều có (đỡ nhấp nháy đổi chủ đề) — ảnh lỗi chỉ làm lộ nền màu phẳng.
 */
export function useStudyBackdrop(fx: boolean): Backdrop | null {
  const studyOn = useBackdropStore((s) => s.studyOn);
  const choice = useBackdropStore((s) => s.choice);
  const want = WEB && fx && studyOn;
  const probed = useAvailableBackdrops(want);
  return useMemo(() => (want ? chooseBackdrop(choice, probed.length ? probed : BACKDROPS, SESSION_SEED) : null), [want, choice, probed]);
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
  return motionActive(true, env);
}

// Chỉ transform: một lớp GPU, thở rất chậm (Ken Burns). Không filter, không blur.
const CSS = `@keyframes artKb{from{transform:translate3d(0,0,0) scale(1.04)}to{transform:translate3d(-1.2%,-0.8%,0) scale(1.1)}}`;
const KB_SECONDS = 75;

/* ---------- Lớp nền cố định ---------- */

/**
 * MỘT ảnh gốc tĩnh (object-fit: cover, làm mịn bình thường) + một lớp phủ màu theo tông tranh và viền tối
 * nhẹ để chữ đọc rõ. Chuyển động nhẹ (tuỳ chọn): chỉ một animation transform trên chính ảnh — tịnh tiến
 * ≤ 1,5% và phóng 1,04 → 1,10 trong 75 giây, qua lại. Tab ẩn thì tạm dừng.
 */
export function ArtBackdrop({ backdrop }: { backdrop: Backdrop }) {
  const { width } = useWindowDimensions();
  const motionPref = useBackdropStore((s) => s.motion);
  const [env] = useState(motionEnv);
  const visible = useTabVisible();
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (!WEB) return null;
  const animate = motionActive(motionPref, env);
  const phone = width < 640;
  const a = scrimAlpha(backdrop, phone);
  const edge = backdrop.tone === 'dark' ? '0,0,0' : backdrop.scrim;
  const loaded = loadedId === backdrop.id;
  const root: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none', background: `rgb(${backdrop.scrim})` };
  return (
    <div aria-hidden style={root}>
      {animate ? <style>{CSS}</style> : null}
      <img
        key={backdrop.id}
        src={backdropUrl(backdrop.id)}
        alt=""
        decoding="async"
        draggable={false}
        onLoad={() => setLoadedId(backdrop.id)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: backdrop.pos,
          opacity: loaded ? 1 : 0,
          transition: 'opacity .5s ease',
          transformOrigin: '50% 50%',
          userSelect: 'none',
          ...(animate
            ? { willChange: 'transform', animation: `artKb ${KB_SECONDS}s ease-in-out infinite alternate`, animationPlayState: visible ? 'running' : 'paused' }
            : null),
        }}
      />
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

export function ArtCaption({ backdrop, phone }: { backdrop: Backdrop; phone: boolean }) {
  const { en } = useL();
  const [hiddenId, setHiddenId] = useState<string | null>(null);
  if (!WEB || hiddenId === backdrop.id) return null;
  const dark = backdrop.tone === 'dark';
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: phone ? 8 : 16, bottom: 6, zIndex: 40, flexDirection: 'row', alignItems: 'center', maxWidth: '88%' }}>
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

/* ---------- Bộ chọn tranh dùng chung (đọc báo + học từ vựng) ---------- */

export type GalleryColors = { ink: string; muted: string; chip: string; accent: string; onAccent: string };
const DEFAULT_COLORS: GalleryColors = { ink: '#1A1A17', muted: '#85837A', chip: '#F3F1EA', accent: '#957846', onAccent: '#FFFFFF' };

function Chip({ on, onPress, children, c }: { on: boolean; onPress: () => void; children: React.ReactNode; c: GalleryColors }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-pressed={on}
      onPress={onPress}
      style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: on ? c.accent : c.chip }}
    >
      <Text style={{ fontSize: 13.5, fontWeight: '700', color: on ? c.onAccent : c.ink }}>{children}</Text>
    </Pressable>
  );
}

/**
 * Lưới ô tranh + "Ngẫu nhiên mỗi lần đọc" + "Tắt nền" + "Chuyển động nhẹ". Chỉ một thành phần cho cả hai
 * nơi dùng; nơi dùng quyết định `active`/`choice` đang nghĩa là gì và `onPick`/`onOff` ghi vào đâu.
 */
export function ArtGallery({
  active,
  choice,
  onPick,
  onOff,
  randomLabel,
  colors = DEFAULT_COLORS,
}: {
  active: boolean;
  choice: string;
  onPick: (id: string) => void;
  onOff: () => void;
  randomLabel?: string;
  colors?: GalleryColors;
}) {
  const { L, en } = useL();
  const motion = useBackdropStore((s) => s.motion);
  const setMotion = useBackdropStore((s) => s.setMotion);
  const available = useAvailableBackdrops(true);
  const motionOk = useMotionAllowed();
  const c = colors;
  if (!WEB) return null;
  return (
    <View style={{ gap: 10 }}>
      {available.length === 0 ? (
        <Text style={{ fontSize: 12.5, color: c.muted }}>{L('Đang tải bộ tranh…', 'Loading paintings…')}</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {available.map((b) => {
            const sel = active && choice === b.id;
            return (
              <Pressable
                key={b.id}
                accessibilityRole="button"
                aria-pressed={sel}
                accessibilityLabel={captionOf(b, en)}
                onPress={() => onPick(b.id)}
                style={{ width: 74, height: 46, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: sel ? c.accent : 'transparent', backgroundColor: `rgb(${b.scrim})` }}
              >
                <img
                  src={backdropThumb(b.id)}
                  alt=""
                  width={70}
                  height={42}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: b.pos }}
                />
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip c={c} on={active && choice === RANDOM} onPress={() => onPick(RANDOM)}>
          {randomLabel ?? L('Ngẫu nhiên mỗi lần đọc', 'Random each read')}
        </Chip>
        <Chip c={c} on={false} onPress={onOff}>
          {L('Tắt nền', 'Turn off')}
        </Chip>
      </View>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.muted }}>{L('Chuyển động nhẹ', 'Gentle motion')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip c={c} on={motionOk && motion} onPress={() => setMotion(true)}>
          {L('Bật', 'On')}
        </Chip>
        <Chip c={c} on={!(motionOk && motion)} onPress={() => setMotion(false)}>
          {L('Tắt', 'Off')}
        </Chip>
      </View>
      {!motionOk ? <Text style={{ fontSize: 12, color: c.muted }}>{L('Máy này tự tắt chuyển động.', 'Motion is off on this device.')}</Text> : null}
    </View>
  );
}
