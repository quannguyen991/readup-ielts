import React from 'react';
import { Platform, View } from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

import type { LessonTone } from '@/components/sentence/LessonCard';
import type { ChartData, SimpleChartData, Task2Essay } from '@/lib/writing/types';

/**
 * "DẤU VÂN" của một đề Writing trên thẻ chọn đề — cùng ý với sóng âm của bài
 * nghe và cặp vạch của bài dịch (`LessonCard`): vẽ từ CHÍNH dữ liệu của đề chứ
 * không phải hoa văn.
 *
 *   Task 1 — hình thu nhỏ của biểu đồ thật: đường đi đúng số liệu, cột cao
 *            đúng tỷ lệ, lát bánh đúng phần trăm, ô bảng đậm theo giá trị.
 *   Task 2 — dàn bài của dạng luận: số đoạn và màu từng đoạn theo cách dạng đó
 *            phải chia (hai quan điểm, lợi / hại, vấn đề / giải pháp…).
 *
 * Bản cũ nhét nguyên `ChartFigure` (có tiêu đề, trục, chú thích) vào một cột hẹp
 * bên trái, còn nửa phải của thẻ trống trơn — người dùng chê 26/09/2026.
 */

const H = 52;
const W = 220;

export function ChartPrint({ data, tone, active }: { data: ChartData; tone: LessonTone; active: boolean }) {
  const simple: SimpleChartData = data.kind === 'mixed' ? data.parts[0] : data;
  return (
    <View style={{ height: 40, justifyContent: 'center', opacity: active ? 1 : 0.9 }}>
      <Svg width="100%" height={40} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {draw(simple, tone)}
      </Svg>
    </View>
  );
}

function draw(d: SimpleChartData, tone: LessonTone): React.ReactNode {
  const shades = [tone.mid, tone.ink, '#94A3B8', `${tone.mid}88`];
  if (d.kind === 'line' || d.kind === 'bar') {
    const all = d.series.flatMap((s) => s.values);
    const max = Math.max(1, ...all);
    const n = Math.max(1, d.xLabels.length);
    if (d.kind === 'line') {
      return d.series.slice(0, 4).map((s, si) => (
        <Polyline
          key={s.name}
          points={s.values.map((v, i) => `${(i / Math.max(1, n - 1)) * (W - 8) + 4},${H - 4 - (v / max) * (H - 8)}`).join(' ')}
          fill="none"
          stroke={shades[si % shades.length]}
          strokeWidth={2.4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ));
    }
    const groups = n;
    const per = d.series.length;
    const gw = W / groups;
    const bw = Math.max(2, (gw - 6) / per);
    return d.series.flatMap((s, si) =>
      s.values.map((v, i) => {
        const h = Math.max(2, (v / max) * (H - 4));
        return <Rect key={`${si}-${i}`} x={i * gw + 3 + si * bw} y={H - h} width={bw - 1} height={h} rx={1.5} fill={shades[si % shades.length]} />;
      }),
    );
  }
  if (d.kind === 'pie') {
    const pies = d.pies.slice(0, 3);
    const r = H / 2 - 3;
    return pies.map((pie, pi) => {
      const total = pie.slices.reduce((a, s) => a + s.value, 0) || 1;
      const cx = (W / pies.length) * (pi + 0.5);
      let angle = -Math.PI / 2;
      return pie.slices.map((sl, si) => {
        const sweep = (sl.value / total) * Math.PI * 2;
        const a0 = angle;
        const a1 = angle + sweep;
        angle = a1;
        const large = sweep > Math.PI ? 1 : 0;
        const p = `M ${cx} ${H / 2} L ${cx + r * Math.cos(a0)} ${H / 2 + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${H / 2 + r * Math.sin(a1)} Z`;
        return <Path key={`${pi}-${si}`} d={p} fill={shades[si % shades.length]} stroke="#FFFFFF" strokeWidth={1} />;
      });
    });
  }
  if (d.kind === 'table') {
    const rows = d.rows.slice(0, 5);
    const nums = rows.flatMap((r) => r.filter((c): c is number => typeof c === 'number'));
    const max = Math.max(1, ...nums);
    const cols = Math.max(1, ...rows.map((r) => r.length));
    const cw = W / cols;
    const rh = H / rows.length;
    return rows.flatMap((r, ri) =>
      r.map((c, ci) => (
        <Rect
          key={`${ri}-${ci}`}
          x={ci * cw + 1}
          y={ri * rh + 1}
          width={cw - 2}
          height={rh - 2}
          rx={2}
          fill={typeof c === 'number' ? tone.mid : '#CBD5E1'}
          opacity={typeof c === 'number' ? 0.25 + (c / max) * 0.75 : 0.6}
        />
      )),
    );
  }
  if (d.kind === 'process') {
    const n = Math.min(8, d.steps.length);
    const gap = W / n;
    return d.steps.slice(0, n).map((_, i) => (
      <React.Fragment key={i}>
        {i > 0 ? <Rect x={gap * (i - 0.5) + 6} y={H / 2 - 1} width={gap - 12} height={2} fill="#94A3B8" /> : null}
        <Circle cx={gap * (i + 0.5)} cy={H / 2} r={7} fill={i === 0 || i === n - 1 ? tone.ink : tone.mid} />
      </React.Fragment>
    ));
  }
  if (d.kind !== 'map') return null;
  const panels = d.panels.slice(0, 2);
  const pw = W / panels.length;
  const fill: Record<string, string> = { building: tone.mid, green: '#86EFAC', water: '#7DD3FC', road: '#94A3B8', sand: '#FDE68A', plain: '#E2E8F0' };
  return panels.flatMap((panel, pi) =>
    panel.items.map((it, ii) => (
      <Rect key={`${pi}-${ii}`} x={pi * pw + 3 + it.x * (pw - 6)} y={it.y * H} width={Math.max(2, it.w * (pw - 6))} height={Math.max(2, it.h * H)} rx={1.5} fill={fill[it.shape] ?? tone.mid} />
    )),
  );
}

/** Dàn bài của từng dạng luận Task 2: mỗi mảnh là một đoạn, dài theo độ nặng. */
const ESSAY_PLAN: Record<Task2Essay, { w: number; kind: 'frame' | 'a' | 'b' }[]> = {
  opinion: [{ w: 0.5, kind: 'frame' }, { w: 1, kind: 'a' }, { w: 1, kind: 'a' }, { w: 0.45, kind: 'frame' }],
  discussion: [{ w: 0.5, kind: 'frame' }, { w: 1, kind: 'a' }, { w: 1, kind: 'b' }, { w: 0.5, kind: 'frame' }],
  advantage_disadvantage: [{ w: 0.5, kind: 'frame' }, { w: 1, kind: 'a' }, { w: 0.9, kind: 'b' }, { w: 0.45, kind: 'frame' }],
  problem_solution: [{ w: 0.5, kind: 'frame' }, { w: 0.9, kind: 'b' }, { w: 1, kind: 'a' }, { w: 0.45, kind: 'frame' }],
  two_part: [{ w: 0.5, kind: 'frame' }, { w: 1, kind: 'a' }, { w: 1, kind: 'b' }, { w: 0.45, kind: 'frame' }],
};

export function EssayPrint({ kind, tone, active }: { kind: Task2Essay | null; tone: LessonTone; active: boolean }) {
  const plan = ESSAY_PLAN[kind ?? 'opinion'];
  return (
    <View style={{ gap: 5 }}>
      {plan.map((p, i) => (
        <View
          key={i}
          style={{
            height: 5,
            borderRadius: 3,
            width: `${p.w * 100}%`,
            backgroundColor: p.kind === 'frame' ? '#94A3B8' : p.kind === 'a' ? tone.mid : tone.ink,
            opacity: p.kind === 'frame' ? 0.55 : 1,
            transform: [{ scaleX: active ? 1 : 0.9 }],
            transformOrigin: 'left',
            ...(Platform.OS === 'web' ? ({ transition: `transform ${240 + i * 70}ms cubic-bezier(0.2, 0.8, 0.2, 1)` } as object) : null),
          }}
        />
      ))}
    </View>
  );
}
