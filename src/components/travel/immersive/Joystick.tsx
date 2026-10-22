import React, { useRef } from 'react';

import { normaliseStick, stickToDirs, type StickDir } from '../mobile';

const BASE = 120;
const KNOB = 52;

/**
 * Cần điều khiển ảo (tắt mặc định, bật ở Cài đặt): kéo núm để đi. Chỉ phát `onDirs` khi tập hướng ĐỔI, và vẽ núm bằng
 * cách ghi thẳng style (không setState mỗi lần di chuyển) nên không kéo React dựng lại.
 */
export function Joystick({ onDirs, label, style }: { onDirs: (dirs: readonly StickDir[]) => void; label: string; style?: React.CSSProperties }) {
  const base = useRef<HTMLDivElement | null>(null);
  const knob = useRef<HTMLDivElement | null>(null);
  const active = useRef<number | null>(null);
  const dirs = useRef<StickDir[]>([]);
  const key = useRef('');

  const apply = (clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rad = r.width / 2;
    const n = normaliseStick(clientX - (r.left + rad), clientY - (r.top + rad), rad - KNOB / 4);
    if (knob.current) knob.current.style.transform = `translate(${n.x * (rad - KNOB / 2)}px, ${n.y * (rad - KNOB / 2)}px)`;
    stickToDirs(n.x, n.y, dirs.current);
    const k = dirs.current.join(',');
    if (k !== key.current) {
      key.current = k;
      onDirs(dirs.current);
    }
  };
  const release = () => {
    active.current = null;
    if (knob.current) knob.current.style.transform = 'translate(0px, 0px)';
    dirs.current.length = 0;
    if (key.current !== '') {
      key.current = '';
      onDirs(dirs.current);
    }
  };

  return (
    <div
      ref={base}
      role="group"
      aria-label={label}
      onPointerDown={(e) => {
        if (active.current !== null) return;
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        apply(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) apply(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (active.current === e.pointerId) release();
      }}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'absolute', width: BASE, height: BASE, borderRadius: '50%', background: 'rgba(15,29,51,0.5)', border: '2px solid rgba(139, 108, 240,0.85)', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', zIndex: 12, ...style }}
    >
      <div ref={knob} style={{ position: 'absolute', left: (BASE - KNOB) / 2 - 2, top: (BASE - KNOB) / 2 - 2, width: KNOB, height: KNOB, borderRadius: '50%', background: 'rgba(226,200,143,0.92)', border: '2px solid #0F1D33', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', pointerEvents: 'none', willChange: 'transform' }} />
    </div>
  );
}
