/**
 * TOÀN MÀN HÌNH cho Du ngoạn: một nút biểu tượng nhỏ (góc dưới-phải) bật/tắt Fullscreen API trên cả trang Band 9.
 * Có tiền tố webkit; trình duyệt không hỗ trợ (iOS Safari) thì nút ẩn. Esc thoát là việc của trình duyệt.
 */
import { playSfx } from '@/services/audio/sfx-ui';
import React, { useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Platform, Pressable } from 'react-native';

import { useL } from '@/i18n/useL';

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

function doc(): FsDoc | null {
  return Platform.OS === 'web' && typeof document !== 'undefined' ? (document as FsDoc) : null;
}

export function fullscreenSupported(): boolean {
  const d = doc();
  if (!d) return false;
  return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled);
}

export function isFullscreen(): boolean {
  const d = doc();
  return !!(d && (d.fullscreenElement || d.webkitFullscreenElement));
}

export function toggleFullscreen(): void {
  const d = doc();
  if (!d) return;
  try {
    if (isFullscreen()) {
      playSfx('fullscreenOff');
      const p = d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.();
      void Promise.resolve(p).catch(() => undefined);
    } else {
      playSfx('fullscreen');
      const el = d.documentElement as FsEl;
      const p = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.();
      void Promise.resolve(p).catch(() => undefined);
    }
  } catch {
    /* bị chặn (cần thao tác người dùng): bỏ qua */
  }
}

function subscribeFs(cb: () => void): () => void {
  const d = doc();
  if (!d) return () => undefined;
  d.addEventListener('fullscreenchange', cb);
  d.addEventListener('webkitfullscreenchange', cb);
  return () => {
    d.removeEventListener('fullscreenchange', cb);
    d.removeEventListener('webkitfullscreenchange', cb);
  };
}
const noopSubscribe = () => () => undefined;

/** Trạng thái toàn màn hình hiện tại + hỗ trợ + hàm bật/tắt. */
export function useFullscreen(): { supported: boolean; active: boolean; toggle: () => void } {
  const active = useSyncExternalStore(subscribeFs, isFullscreen, () => false);
  const supported = useSyncExternalStore(noopSubscribe, fullscreenSupported, () => false);
  const toggle = useCallback(() => toggleFullscreen(), []);
  return { supported, active, toggle };
}

/** Nút nhỏ 40 px, đổi biểu tượng theo trạng thái. Không hỗ trợ → không vẽ gì. */
export function FullscreenButton({ bottom = 10, right = 10, top }: { bottom?: number; right?: number; top?: number }) {
  const { L } = useL();
  const { supported, active, toggle } = useFullscreen();
  if (Platform.OS !== 'web' || !supported) return null;
  const path = active ? 'M9 3v4a2 2 0 0 1-2 2H3M15 3v4a2 2 0 0 0 2 2h4M9 21v-4a2 2 0 0 0-2-2H3M15 21v-4a2 2 0 0 1 2-2h4' : 'M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? L('Thoát toàn màn hình', 'Exit full screen') : L('Toàn màn hình', 'Full screen')}
      onPress={toggle}
      style={[{ position: 'absolute', right, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(15,29,51,0.72)', borderWidth: 1, borderColor: 'rgba(184,149,90,0.7)' }, top !== undefined ? { top } : { bottom }]}
    >
      {React.createElement(
        'svg',
        { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: '#F3EDE1', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        React.createElement('path', { d: path }),
      )}
    </Pressable>
  );
}

/**
 * Khi đang toàn màn hình: vẽ con vào một lớp phủ cố định gắn thẳng vào `document.body` (che cả thanh bên / thanh đầu của
 * ứng dụng). Ngoài toàn màn hình thì vẽ tại chỗ. (Chuyển qua lại làm con được dựng lại — chấp nhận được vì người chơi đang đứng yên.)
 */
export function FsPortal({ active, children }: { active: boolean; children: React.ReactNode }) {
  if (!active || Platform.OS !== 'web' || typeof document === 'undefined') return <>{children}</>;
  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483000, background: '#0F1D33', display: 'flex', flexDirection: 'column' }}>{children}</div>,
    document.body,
  );
}
