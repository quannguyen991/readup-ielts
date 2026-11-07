import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { arcPath, niceTicks, pieSlices, seriesExtent } from '@/services/writing/chart-scale';
import { chartPalette, color } from '@/theme/tokens';
import { pick, useLocale } from '@/i18n/useL';
import type { Locale } from '@/i18n/keys';
import type { ChartData, LineOrBarChart, MapChart, PieChart, ProcessChart, TableChart } from '@/lib/writing/types';

/**
 * Vẽ hình minh hoạ của một đề Task 1.
 *
 * Dựng bằng react-native-svg, không dùng victory-native hay recharts — cùng lý
 * do đã ghi ở `src/components/charts/index.tsx`: recharts chỉ chạy web còn
 * victory-native chỉ chạy native, mà đề thi thì phải hiện giống hệt nhau ở cả
 * hai chỗ.
 *
 * Khác bộ biểu đồ thống kê ở `components/charts`: ở đây hình là **đề bài**, nên
 * bắt buộc phải có tiêu đề, đơn vị, nhãn trục và chú giải. Thiếu đơn vị thì
 * người học viết sai dữ liệu và mất điểm Task Achievement — lỗi do app gây ra.
 */

const PALETTE = chartPalette;

export function ChartFigure({ data, width = 640 }: { data: ChartData; width?: number }) {
  const locale = useLocale();
  if (data.kind === 'mixed') {
    return (
      <View className="gap-3">
        {data.parts.map((part, i) => (
          <ChartFigure key={i} data={part} width={width} />
        ))}
      </View>
    );
  }

  return (
    <View className="rounded-card border border-border bg-surface p-3">
      <Text className="mb-1 text-center font-heavy text-body text-ink">{data.title}</Text>
      {'unit' in data ? (
        <Text className="mb-2 text-center font-sans text-label text-muted">{data.unit}</Text>
      ) : null}
      {renderBody(data, width, locale)}
    </View>
  );
}

function renderBody(data: Exclude<ChartData, { kind: 'mixed' }>, width: number, locale: Locale) {
  switch (data.kind) {
    case 'line':
    case 'bar':
      return <LineOrBarFigure data={data} width={width} />;
    case 'pie':
      return <PieFigure data={data} width={width} />;
    case 'table':
      return <TableFigure data={data} />;
    case 'process':
      return <ProcessFigure data={data} />;
    case 'map':
      return <MapFigure data={data} />;
    default:
      return null;
  }
}

const MAP_FILL: Record<string, string> = {
  building: '#E9D5FF', green: '#BBF7D0', water: '#BAE6FD', road: '#D6D3D1', sand: '#FDE68A', plain: '#F1F5F9',
};

/** Quy trình: các bước đánh số nối bằng mũi tên; vòng đời thì có dòng quay lại bước 1. */
function ProcessFigure({ data }: { data: ProcessChart }) {
  return (
    <View className="gap-1 p-2">
      {data.steps.map((step, i) => (
        <View key={i} className="items-center">
          <View className="w-full flex-row items-center gap-3 rounded-xl border border-border bg-canvas px-3 py-2.5">
            <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: PALETTE[0] }}>
              <Text className="font-strong text-label" style={{ color: '#FFFFFF' }}>{i + 1}</Text>
            </View>
            <Text className="flex-1 font-sans text-body text-ink">{step}</Text>
          </View>
          {i < data.steps.length - 1 ? <Text className="font-heavy text-body text-muted">↓</Text> : null}
        </View>
      ))}
      {data.isCycle ? <Text className="mt-1 text-center font-mid text-label text-muted">↻ Quay lại bước 1</Text> : null}
    </View>
  );
}

/** Bản đồ: mỗi khung là một hình chữ nhật, ô đặt theo toạ độ tương đối 0–1. */
function MapFigure({ data }: { data: MapChart }) {
  return (
    <View className="gap-3 p-2">
      {data.panels.map((panel, pi) => (
        <View key={pi}>
          <Text className="mb-1 font-strong text-label text-ink">{panel.caption}</Text>
          <View style={{ width: '100%', aspectRatio: 1.5, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
            {panel.items.map((item, i) => (
              <View
                key={i}
                style={{ position: 'absolute', left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: `${item.w * 100}%`, height: `${item.h * 100}%`, backgroundColor: MAP_FILL[item.shape] ?? '#F1F5F9', borderWidth: 1, borderColor: '#94A3B8', borderRadius: 6, alignItems: 'center', justifyContent: 'center', padding: 2 }}
              >
                <Text className="text-center font-mid text-[11px] text-ink" numberOfLines={3}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Line và Bar
// ---------------------------------------------------------------------------

function LineOrBarFigure({ data, width }: { data: LineOrBarChart; width: number }) {
  const height = 300;
  const pad = { top: 12, right: 16, bottom: 54, left: 48 };
  const innerW = Math.max(80, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;

  const { min, max } = seriesExtent(data.series);
  const ticks = niceTicks(min, max);
  const lo = ticks[0] ?? 0;
  const hi = ticks[ticks.length - 1] ?? 1;
  const y = (v: number) => innerH - ((v - lo) / (hi - lo)) * innerH;

  const n = data.xLabels.length;
  const isBar = data.kind === 'bar';
  // Cột phải nằm giữa ô của nó, còn điểm của đường nằm đúng trên vạch trục.
  const slot = innerW / Math.max(1, n);
  const xAt = (i: number) => (isBar ? slot * i + slot / 2 : (innerW * i) / Math.max(1, n - 1));

  const groupW = slot * 0.66;
  const barW = groupW / Math.max(1, data.series.length);

  return (
    <View>
      <Svg width={width} height={height}>
        <G x={pad.left} y={pad.top}>
          {ticks.map((t, i) => (
            <G key={`t${i}`}>
              <Line x1={0} y1={y(t)} x2={innerW} y2={y(t)} stroke={color.border} strokeWidth={1} />
              <SvgText x={-8} y={y(t) + 4} fontSize={11} fill={color.subtle} textAnchor="end">
                {formatTick(t)}
              </SvgText>
            </G>
          ))}

          <Line x1={0} y1={0} x2={0} y2={innerH} stroke={color.borderStrong} strokeWidth={1.5} />
          <Line
            x1={0}
            y1={y(Math.max(lo, 0))}
            x2={innerW}
            y2={y(Math.max(lo, 0))}
            stroke={color.borderStrong}
            strokeWidth={1.5}
          />

          {isBar
            ? data.series.map((s, si) =>
                s.values.map((v, i) => {
                  const top = y(v);
                  const base = y(Math.max(lo, 0));
                  return (
                    <Rect
                      key={`b${si}-${i}`}
                      x={xAt(i) - groupW / 2 + si * barW}
                      y={Math.min(top, base)}
                      width={Math.max(1, barW - 2)}
                      height={Math.max(1, Math.abs(base - top))}
                      rx={2}
                      fill={PALETTE[si % PALETTE.length]}
                    />
                  );
                }),
              )
            : data.series.map((s, si) => (
                <G key={`l${si}`}>
                  <Path
                    d={s.values
                      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${y(v).toFixed(1)}`)
                      .join(' ')}
                    stroke={PALETTE[si % PALETTE.length]}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinejoin="round"
                  />
                  {s.values.map((v, i) => (
                    <Circle
                      key={`p${si}-${i}`}
                      cx={xAt(i)}
                      cy={y(v)}
                      r={3.5}
                      fill={color.white}
                      stroke={PALETTE[si % PALETTE.length]}
                      strokeWidth={2}
                    />
                  ))}
                </G>
              ))}

          {data.xLabels.map((label, i) => (
            <SvgText
              key={`x${i}`}
              x={xAt(i)}
              y={innerH + 18}
              fontSize={11}
              fill={color.subtle}
              textAnchor="middle"
            >
              {shorten(label, Math.max(6, Math.floor(slot / 6.5)))}
            </SvgText>
          ))}
        </G>
      </Svg>
      <Legend names={data.series.map((s) => s.name)} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pie
// ---------------------------------------------------------------------------

function PieFigure({ data, width }: { data: PieChart; width: number }) {
  const perPie = width / Math.max(1, data.pies.length);
  const radius = Math.min(perPie * 0.36, 92);
  const cy = radius + 16;
  const height = cy + radius + 34;
  const labels = data.pies[0]?.slices.map((s) => s.label) ?? [];

  return (
    <View>
      <Svg width={width} height={height}>
        {data.pies.map((pie, pi) => {
          const cx = perPie * pi + perPie / 2;
          const arcs = pieSlices(pie.slices);
          return (
            <G key={pi}>
              {arcs.map((arc, i) => (
                <Path
                  key={i}
                  d={arcPath(cx, cy, radius, arc)}
                  fill={PALETTE[i % PALETTE.length]}
                  stroke={color.white}
                  strokeWidth={1.5}
                />
              ))}
              {arcs.map((arc, i) => {
                // Lát nhỏ hơn 7% thì chữ không lọt, để trống — chú giải đã đủ.
                if (arc.endAngle - arc.startAngle < 25) return null;
                const mid = (arc.startAngle + arc.endAngle) / 2;
                const rad = ((mid - 90) * Math.PI) / 180;
                return (
                  <SvgText
                    key={`v${i}`}
                    x={cx + radius * 0.64 * Math.cos(rad)}
                    y={cy + radius * 0.64 * Math.sin(rad) + 4}
                    fontSize={11}
                    fontWeight="600"
                    fill={color.white}
                    textAnchor="middle"
                  >
                    {`${Math.round(arc.value)}%`}
                  </SvgText>
                );
              })}
              <SvgText
                x={cx}
                y={cy + radius + 22}
                fontSize={12}
                fontWeight="600"
                fill={color.body}
                textAnchor="middle"
              >
                {pie.caption}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <Legend names={labels} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

function TableFigure({ data }: { data: TableChart }) {
  return (
    <View className="overflow-hidden rounded-md border border-border">
      <View className="flex-row bg-primary-600">
        {data.headers.map((h, i) => (
          <Text
            key={i}
            className={[
              'flex-1 px-2 py-2 font-heavy text-label text-white',
              i === 0 ? 'text-left' : 'text-center',
            ].join(' ')}
          >
            {h}
          </Text>
        ))}
      </View>
      {data.rows.map((row, ri) => (
        <View key={ri} className={['flex-row', ri % 2 === 1 ? 'bg-surfaceAlt' : 'bg-surface'].join(' ')}>
          {row.map((cell, ci) => (
            <Text
              key={ci}
              className={[
                'flex-1 px-2 py-2 font-sans text-label text-body',
                ci === 0 ? 'text-left font-heavy text-ink' : 'text-center',
              ].join(' ')}
            >
              {String(cell)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------

function Legend({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <View className="mt-1 flex-row flex-wrap justify-center gap-x-4 gap-y-1">
      {names.map((name, i) => (
        <View key={name} className="flex-row items-center gap-1.5">
          <View
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
          />
          <Text className="font-sans text-label text-body">{name}</Text>
        </View>
      ))}
    </View>
  );
}

/** Bỏ số 0 thừa: 2.5 giữ nguyên, còn 40.0 thì hiện là 40. */
function formatTick(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

/** Cắt nhãn trục X quá dài để các nhãn không đè lên nhau. */
function shorten(label: string, maxChars: number): string {
  return label.length <= maxChars ? label : `${label.slice(0, Math.max(1, maxChars - 1))}…`;
}
