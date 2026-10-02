import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { useL } from '@/i18n/useL';
import { sheetMaxHeight, shouldDismissSheet, viewportKind } from '../mobile';
import { useReducedMotion } from '../ui/hooks';
import { T } from '../ui/kit';

const env = (side: 'top' | 'right' | 'bottom' | 'left', px = 0) => `calc(${px}px + env(safe-area-inset-${side}, 0px))`;

/**
 * Ngăn trượt của chế độ toàn màn hình.
 *  - Điện thoại DỌC (< 600px): "bottom sheet" trượt từ đáy, cao ~80dvh, có thanh kéo — vuốt xuống (hoặc bấm nền / ✕ / Esc) để đóng,
 *    nội dung cuộn riêng, chừa vùng an toàn phía dưới (thanh cử chỉ iPhone).
 *  - Điện thoại NGANG / máy tính: ngăn cạnh phải như cũ, chừa tai thỏ hai bên.
 * Chuyển cảnh ≤ 180ms, tắt hẳn khi bật "giảm chuyển động".
 */
export function Drawer({ title, onClose, children, header }: { title: string; onClose: () => void; children: React.ReactNode; header?: React.ReactNode }) {
  const { L } = useL();
  const win = useWindowDimensions();
  const reduced = useReducedMotion();
  const kind = viewportKind(win.width, win.height);
  const [shown, setShown] = useState(false);
  const panel = useRef<HTMLElement | null>(null);
  const drag = useRef<{ id: number; y0: number; t0: number; dy: number } | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 16);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [onClose]);

  const ms = reduced ? 0 : 180;
  const sheetH = sheetMaxHeight(win.height);
  const w = Math.min(400, win.width - 24);

  // Kéo thanh tiêu đề để đóng (chỉ tờ trượt đáy). Ghi thẳng vào DOM, không setState mỗi lần di chuyển.
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!kind.sheet || (e.target as HTMLElement).closest('[data-nodrag]')) return;
    drag.current = { id: e.pointerId, y0: e.clientY, t0: performance.now(), dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (panel.current) panel.current.style.transition = 'none';
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    d.dy = Math.max(0, e.clientY - d.y0);
    if (panel.current) panel.current.style.transform = `translateY(${d.dy}px)`;
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const vy = d.dy / Math.max(1, performance.now() - d.t0);
    const el = panel.current;
    if (shouldDismissSheet(d.dy, vy, sheetH)) {
      if (el) {
        el.style.transition = `transform ${ms}ms ease-in`;
        el.style.transform = 'translateY(100%)';
      }
      window.setTimeout(onClose, ms);
    } else if (el) {
      el.style.transition = `transform ${ms}ms ease-out`;
      el.style.transform = 'translateY(0)';
    }
  };

  const base = { position: 'absolute', backgroundColor: T.paper, borderColor: T.navy, overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,0.35)', transitionProperty: 'transform', transitionDuration: `${ms}ms`, transitionTimingFunction: 'ease-out', willChange: 'transform' };
  const place = kind.sheet
    ? { left: 0, right: 0, bottom: 0, height: sheetH, maxHeight: '80dvh', borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderTopLeftRadius: 16, borderTopRightRadius: 16, transform: [{ translateY: shown ? 0 : sheetH }] }
    : { top: env('top', 8), bottom: env('bottom', 8), right: env('right', 8), width: w, borderWidth: 2, borderRadius: 10, transform: [{ translateX: shown ? 0 : w + 24 }] };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30 }} pointerEvents="box-none">
      <Pressable accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: shown ? 'rgba(15,29,51,0.4)' : 'rgba(15,29,51,0)', transitionProperty: 'background-color', transitionDuration: `${ms}ms` } as object} />
      <View
        ref={(n) => {
          panel.current = n as unknown as HTMLElement | null;
        }}
        accessibilityViewIsModal
        style={{ ...base, ...place } as object}
      >
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: kind.sheet ? 'none' : 'auto', cursor: kind.sheet ? 'grab' : 'default', backgroundColor: T.navy, flexShrink: 0 }}>
          {kind.sheet ? (
            <div aria-hidden style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
              <div style={{ width: 44, height: 5, borderRadius: 3, background: 'rgba(243,237,225,0.55)' }} />
            </div>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: kind.sheet ? 2 : 10, gap: 10 }}>
            <Text className="font-heavy" style={{ flex: 1, fontSize: 16, color: T.goldLight, letterSpacing: 0.4 }}>
              {title}
            </Text>
            <div data-nodrag="1" style={{ marginRight: -8 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22, color: T.goldLight }}>✕</Text>
              </Pressable>
            </div>
          </View>
        </div>
        {header}
        {children}
        {kind.sheet ? <View style={{ height: env('bottom') as unknown as number, flexShrink: 0 }} /> : null}
      </View>
    </View>
  );
}
