import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';

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

const H = 64;
const W = 220;

export function ChartPrint({ data, tone, active }: { data: ChartData; tone: LessonTone; active: boolean }) {
  return (
    <View style={{ height: 50, justifyContent: 'center', opacity: active ? 1 : 0.92 }}>
      <Svg width="100%" height={50} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {data.kind === 'mixed' ? (
          <>
            <Rect x={1} y={3} width={W / 2 - 3} height={H - 6} rx={5} fill="#FBFAFD" stroke="#E2DEE9" strokeWidth={1} />
            <Rect x={W / 2 + 2} y={3} width={W / 2 - 3} height={H - 6} rx={5} fill="#FBFAFD" stroke="#E2DEE9" strokeWidth={1} />
            <G transform="translate(3 5) scale(0.47 0.84)">{draw(data.parts[0], tone)}</G>
            <G transform="translate(113 5) scale(0.47 0.84)">{draw(data.parts[1], tone)}</G>
          </>
        ) : draw(data, tone)}
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
    const grid = [12, 27, 42, 57].map((y, i) => <Line key={`grid-${i}`} x1={12} y1={y} x2={W - 6} y2={y} stroke="#E9E6EF" strokeWidth={1} />);
    const axes = <G><Line x1={12} y1={8} x2={12} y2={58} stroke="#AAA5B4" strokeWidth={1.2} /><Line x1={12} y1={58} x2={W - 6} y2={58} stroke="#AAA5B4" strokeWidth={1.2} /></G>;
    if (d.kind === 'line') {
      const min = Math.min(0, ...all);
      const range = Math.max(1, max - min);
      const yAt = (v: number) => 56 - ((v - min) / range) * 45;
      const xAt = (i: number) => 14 + (i / Math.max(1, n - 1)) * (W - 24);
      return <>{grid}{axes}{d.series.slice(0, 4).map((s, si) => (
        <G key={s.name}>
          <Polyline
            points={s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ')}
            fill="none"
            stroke={shades[si % shades.length]}
            strokeWidth={2.7}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {s.values.map((v, i) => <Circle key={`${s.name}-${i}`} cx={xAt(i)} cy={yAt(v)} r={2.3} fill="#FFFFFF" stroke={shades[si % shades.length]} strokeWidth={1.4} />)}
        </G>
      ))}</>;
    }
    const groups = n;
    const per = d.series.length;
    const plotW = W - 22;
    const gw = plotW / groups;
    const bw = Math.max(2, (gw * 0.72) / per);
    return <>{grid}{axes}{d.series.flatMap((s, si) =>
      s.values.map((v, i) => {
        const h = Math.max(2, (v / max) * 46);
        return <Rect key={`${si}-${i}`} x={14 + i * gw + (gw - bw * per) / 2 + si * bw} y={57 - h} width={Math.max(1, bw - 1.5)} height={h} rx={2} fill={shades[si % shades.length]} />;
      }),
    )}</>;
  }
  if (d.kind === 'pie') {
    const pies = d.pies.slice(0, 3);
    const r = H / 2 - 7;
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
        return <Path key={`${pi}-${si}`} d={p} fill={shades[si % shades.length]} stroke="#FFFFFF" strokeWidth={1.5} />;
      });
    });
  }
  if (d.kind === 'table') {
    const rows = d.rows.slice(0, 6);
    const nums = rows.flatMap((r) => r.filter((c): c is number => typeof c === 'number'));
    const max = Math.max(1, ...nums);
    const cols = Math.max(1, ...rows.map((r) => r.length));
    const cw = W / cols;
    const rh = H / rows.length;
    return <>{rows.flatMap((r, ri) =>
      r.map((c, ci) => (
        <G key={`${ri}-${ci}`}>
          <Rect x={ci * cw + 1} y={ri * rh + 1} width={cw - 2} height={rh - 2} rx={2} fill={typeof c === 'number' ? tone.mid : '#D9D3E4'} opacity={typeof c === 'number' ? 0.18 + (c / max) * 0.72 : 0.75} />
          {ri === 0 ? <Line x1={ci * cw + 4} y1={ri * rh + rh - 3} x2={ci * cw + cw - 4} y2={ri * rh + rh - 3} stroke="#FFFFFF" strokeWidth={1} opacity={0.85} /> : null}
        </G>
      )),
    )}</>;
  }
  if (d.kind === 'process') {
    const n = Math.min(8, d.steps.length);
    const gap = (W - 12) / n;
    return d.steps.slice(0, n).map((_, i) => (
      <React.Fragment key={i}>
        {i > 0 ? <G>
          <Line x1={gap * i + 6} y1={H / 2} x2={gap * i + 13} y2={H / 2} stroke="#9B95A6" strokeWidth={1.6} />
          <Path d={`M ${gap * i + 11} ${H / 2 - 3} L ${gap * i + 14} ${H / 2} L ${gap * i + 11} ${H / 2 + 3}`} fill="none" stroke="#9B95A6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </G> : null}
        <Rect x={gap * i + 2} y={H / 2 - 13} width={Math.max(14, gap - 7)} height={26} rx={7} fill={i === 0 ? '#E6F4F5' : i === n - 1 ? '#FFF1DF' : '#F4F1F8'} stroke={i === 0 ? '#0E7490' : i === n - 1 ? '#B45309' : '#D8D3E2'} strokeWidth={1} />
        <Circle cx={gap * i + 11} cy={H / 2} r={5.5} fill={i === 0 ? '#0E7490' : i === n - 1 ? '#B45309' : tone.mid} />
        <SvgText x={gap * i + 11} y={H / 2 + 2} fontSize={6} fontWeight="700" fill="#FFFFFF" textAnchor="middle">{i + 1}</SvgText>
      </React.Fragment>
    ));
  }
  if (d.kind !== 'map') return null;
  const panels = d.panels.slice(0, 2);
  const pw = W / panels.length;
  const fill: Record<string, string> = { building: tone.mid, green: '#86EFAC', water: '#7DD3FC', road: '#8B9099', sand: '#FDE68A', plain: '#F3F0FB' };
  return <>{panels.map((panel, pi) => <G key={`panel-${pi}`}>
    <Rect x={pi * pw + 1} y={3} width={pw - 3} height={H - 6} rx={4} fill="#F9F8F4" stroke="#CFCAD7" strokeWidth={1} />
    {panel.items.map((it, ii) => {
      const x = pi * pw + 3 + it.x * (pw - 6);
      const y = 3 + it.y * (H - 6);
      const w = Math.max(2, it.w * (pw - 6));
      const h = Math.max(2, it.h * (H - 6));
      return <G key={`${pi}-${ii}`}>
        <Rect x={x} y={y} width={w} height={h} rx={it.shape === 'water' ? 0 : 2} fill={fill[it.shape] ?? tone.mid} stroke={it.shape === 'road' ? '#F8F5ED' : '#FFFFFF'} strokeWidth={it.shape === 'road' ? 1 : 0.8} />
        {it.shape === 'road' && w > h ? <Line x1={x + 2} y1={y + h / 2} x2={x + w - 2} y2={y + h / 2} stroke="#F8F5ED" strokeWidth={0.7} strokeDasharray="2 2" /> : null}
        {it.shape === 'road' && h >= w ? <Line x1={x + w / 2} y1={y + 2} x2={x + w / 2} y2={y + h - 2} stroke="#F8F5ED" strokeWidth={0.7} strokeDasharray="2 2" /> : null}
      </G>;
    })}
  </G>)}</>;
}

/** Task 2 thumbnail encodes the prompt's actual essay type and argument flow. */
const ESSAY_BLUEPRINT: Record<Task2Essay, { en: { name: string; stages: string[] }; vi: { name: string; stages: string[] }; accent: string }> = {
  opinion: { en: { name: 'Opinion essay', stages: ['Position', 'Reason', 'Support', 'Verdict'] }, vi: { name: 'Bài nêu quan điểm', stages: ['Lập trường', 'Lý do', 'Dẫn chứng', 'Kết luận'] }, accent: '#315F96' },
  discussion: { en: { name: 'Discussion essay', stages: ['View A', 'View B', 'My view', 'Verdict'] }, vi: { name: 'Bài thảo luận', stages: ['Ý kiến A', 'Ý kiến B', 'Quan điểm', 'Kết luận'] }, accent: '#71579E' },
  advantage_disadvantage: { en: { name: 'Advantages / disadvantages', stages: ['Benefits', 'Drawbacks', 'Balance', 'Verdict'] }, vi: { name: 'Bài lợi ích / bất lợi', stages: ['Lợi ích', 'Bất lợi', 'Cân nhắc', 'Kết luận'] }, accent: '#A65A32' },
  problem_solution: { en: { name: 'Problem / solution', stages: ['Problem', 'Causes', 'Actions', 'Outcome'] }, vi: { name: 'Bài vấn đề / giải pháp', stages: ['Vấn đề', 'Nguyên nhân', 'Giải pháp', 'Kết quả'] }, accent: '#2E7D6B' },
  two_part: { en: { name: 'Two-part essay', stages: ['Answer 1', 'Answer 2', 'Develop', 'Wrap up'] }, vi: { name: 'Bài hai câu hỏi', stages: ['Trả lời 1', 'Trả lời 2', 'Phát triển', 'Chốt ý'] }, accent: '#9A5570' },
};

export function EssayPrint({
  kind,
  tone,
  active,
  promptText,
  topic,
  english,
}: {
  kind: Task2Essay | null;
  tone: LessonTone;
  active: boolean;
  promptText: string;
  topic: string;
  english: boolean;
}) {
  const blueprint = ESSAY_BLUEPRINT[kind ?? 'opinion'];
  const copy = blueprint[english ? 'en' : 'vi'];
  const accent = blueprint.accent || tone.mid;
  return (
    <View className="w-full gap-2.5 rounded-2xl border px-3.5 py-3" style={{ maxWidth: 460, borderColor: active ? `${accent}70` : '#DDE4DE', backgroundColor: '#F4F5F2' }}>
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: accent }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>02</Text>
          </View>
          <View className="min-w-0">
            <Text style={{ color: '#77817B', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>{english ? 'WRITING BLUEPRINT' : 'SƠ ĐỒ BÀI VIẾT'}</Text>
            <Text numberOfLines={1} style={{ color: '#263932', fontSize: 11, fontWeight: '700' }}>{copy.name} · {topic}</Text>
          </View>
        </View>
        <View className="rounded-full border bg-white px-2.5 py-1" style={{ borderColor: '#DFE4DE' }}>
          <Text style={{ color: '#55635A', fontSize: 8, fontWeight: '800' }}>250+ {english ? 'WORDS' : 'TỪ'}</Text>
        </View>
      </View>

      <View className="rounded-xl border border-[#E0E5DF] bg-white px-3 py-2">
        <Text style={{ color: '#87918A', fontSize: 8, fontWeight: '800', letterSpacing: 0.7 }}>{english ? 'THE QUESTION' : 'ĐỀ BÀI'}</Text>
        <Text numberOfLines={2} style={{ color: '#28362F', fontSize: 11, lineHeight: 15, marginTop: 3 }}>{promptText}</Text>
      </View>

      <View className="flex-row gap-1.5">
        {copy.stages.map((stage, index) => (
          <View key={`${kind}-${index}`} className="min-w-0 flex-1 rounded-lg border border-[#E0E5DF] bg-white px-1.5 py-1.5">
            <View className="h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}18` }}>
              <Text style={{ color: accent, fontSize: 8, fontWeight: '800' }}>{index + 1}</Text>
            </View>
            <Text numberOfLines={2} style={{ color: '#45554E', fontSize: 8, lineHeight: 10, fontWeight: '700', marginTop: 4 }}>{stage}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
