import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
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

export function ChartFigure({ data, width }: { data: ChartData; width?: number }) {
  const locale = useLocale();
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = React.useState(0);
  const chartWidth = width ?? (measuredWidth > 0
    ? Math.max(180, measuredWidth - 26)
    : Math.max(180, Math.min(640, windowWidth - 48)));
  const measureCard = width === undefined
    ? (event: { nativeEvent: { layout: { width: number } } }) => setMeasuredWidth(event.nativeEvent.layout.width)
    : undefined;

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
    <View onLayout={measureCard} className="rounded-card border border-border bg-surface p-3">
      <Text className="mb-1 text-center font-heavy text-body text-ink">{data.title}</Text>
      {'unit' in data ? (
        <Text className="mb-2 text-center font-sans text-label text-muted">{data.unit}</Text>
      ) : null}
      {renderBody(data, chartWidth, locale)}
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
      return <ProcessFigure data={data} width={width} locale={locale} />;
    case 'map':
      return <MapFigure data={data} width={width} locale={locale} />;
    default:
      return null;
  }
}

const MAP_FILL: Record<string, string> = {
  building: '#E9D5FF', green: '#BBF7D0', water: '#BAE6FD', road: '#D6D3D1', sand: '#FDE68A', plain: '#F1F5F9',
};

const MAP_STROKE: Record<string, string> = {
  building: '#8064B8', green: '#4E9872', water: '#4D94B8', road: '#7C818C', sand: '#B78938', plain: '#A2A8B2',
};

const MAP_LABEL: Record<string, { vi: string; en: string }> = {
  building: { vi: 'Khu xây dựng', en: 'Built area' },
  green: { vi: 'Cây xanh', en: 'Green space' },
  water: { vi: 'Mặt nước', en: 'Water' },
  road: { vi: 'Đường', en: 'Road' },
  sand: { vi: 'Khu bờ biển', en: 'Coastal area' },
  plain: { vi: 'Khu đất', en: 'Open land' },
};

/** Dòng tiến trình có hướng, điểm đầu/cuối rõ và bước đọc được ở mọi cỡ màn hình. */
function ProcessFigure({ data, width, locale }: { data: ProcessChart; width: number; locale: Locale }) {
  const compact = width < 500;
  const columns = compact ? 1 : width < 760 ? 3 : 4;
  const rows: number[][] = [];
  for (let i = 0; i < data.steps.length; i += columns) {
    const row = Array.from({ length: Math.min(columns, data.steps.length - i) }, (_, j) => i + j);
    // Đường đi zíc-zắc giữ đúng thứ tự của quy trình mà không phải bẻ sơ đồ xuống thành danh sách.
    if (rows.length % 2 === 1) row.reverse();
    rows.push(row);
  }

  return (
    <View className="p-2" style={{ gap: compact ? 4 : 10 }}>
      {rows.map((row, rowIndex) => {
        const reverse = rowIndex % 2 === 1;
        return (
          <React.Fragment key={`row-${rowIndex}`}>
            <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
              {row.map((stepIndex, cellIndex) => {
                const first = stepIndex === 0;
                const last = stepIndex === data.steps.length - 1;
                const accent = first ? '#0E7490' : last ? '#B45309' : PALETTE[stepIndex % PALETTE.length];
                const flowingRight = !reverse;
                const hasNextInRow = cellIndex < row.length - 1;
                return (
                  <View key={stepIndex} style={{ flex: 1, paddingHorizontal: compact ? 0 : 7, paddingVertical: compact ? 2 : 0 }}>
                    <View
                      style={{
                        minHeight: compact ? 58 : 102,
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 8,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: first || last ? `${accent}75` : '#E4E1EB',
                        backgroundColor: first || last ? `${accent}0D` : '#FBFAFD',
                        paddingHorizontal: compact ? 11 : 9,
                        paddingVertical: compact ? 10 : 11,
                      }}
                    >
                      <View style={{ width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: accent }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 11, lineHeight: 15, fontWeight: '800' }}>{stepIndex + 1}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        {first || last ? (
                          <Text style={{ color: accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' }}>
                            {first ? pick(locale, 'BẮT ĐẦU', 'START') : pick(locale, 'KẾT THÚC', 'FINISH')}
                          </Text>
                        ) : null}
                        <Text className="font-sans text-body text-ink" style={{ fontSize: compact ? 14 : 12, lineHeight: compact ? 20 : 17 }}>
                          {stepIndex === 0 ? pick(locale, 'Nguyên liệu đầu vào: ', 'Input: ') + data.steps[stepIndex] : data.steps[stepIndex]}
                        </Text>
                      </View>
                    </View>
                    {!compact && hasNextInRow ? (
                      <Text style={{ position: 'absolute', top: '42%', right: -4, zIndex: 2, color: '#827C93', fontSize: 17, fontWeight: '700' }}>
                        {flowingRight ? '›' : '‹'}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
            {rowIndex < rows.length - 1 ? (
              <View style={{ alignItems: compact ? 'center' : reverse ? 'flex-start' : 'flex-end', paddingHorizontal: compact ? 12 : 28, height: compact ? 15 : 12 }}>
                <Text style={{ color: '#827C93', fontSize: 15, lineHeight: 15, fontWeight: '700' }}>↓</Text>
              </View>
            ) : null}
          </React.Fragment>
        );
      })}
      <View className="mt-1 flex-row items-center justify-center gap-2 self-center rounded-pill px-3 py-1.5" style={{ backgroundColor: '#F3F0FB' }}>
        <Text style={{ color: '#6A4BD9', fontSize: 11, fontWeight: '700' }}>
          {data.isCycle ? '↻' : '●'}
        </Text>
        <Text className="font-mid text-label text-muted">
          {data.isCycle ? pick(locale, 'Giai đoạn cuối quay lại bước đầu', 'The final stage returns to the first') : pick(locale, `${data.steps.length} bước · theo chiều mũi tên`, `${data.steps.length} stages · follow the arrows`)}
        </Text>
      </View>
    </View>
  );
}

/** Bản đồ so sánh: nền phân khu, chú giải và ký hiệu đường rõ ràng. */
function MapFigure({ data, width, locale }: { data: MapChart; width: number; locale: Locale }) {
  const horizontal = width >= 760 && data.panels.length > 1;
  const shapes = ['water', 'sand', 'green', 'plain', 'road', 'building'].filter((shape) => data.panels.some((panel) => panel.items.some((item) => item.shape === shape)));

  return (
    <View className="p-1" style={{ gap: 12 }}>
      <View style={{ flexDirection: horizontal ? 'row' : 'column', gap: 12 }}>
        {data.panels.map((panel, pi) => (
          <View key={pi} style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <View className="self-start rounded-pill px-2.5 py-1" style={{ backgroundColor: '#F3F0FB' }}>
              <Text className="font-heavy text-label text-ink">{panel.caption}</Text>
            </View>
            <View style={{ width: '100%', aspectRatio: horizontal ? 1.8 : 1.95, borderRadius: 12, borderWidth: 1, borderColor: '#C8C4D2', backgroundColor: '#F7F6F1', overflow: 'hidden' }}>
              {/* Subtle block grid helps the learner compare relative positions without implying extra data. */}
              <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row' }}>
                {[0, 1, 2, 3, 4].map((i) => <View key={i} style={{ flex: 1, borderRightWidth: i < 4 ? 1 : 0, borderColor: 'rgba(128,120,140,0.08)' }} />)}
              </View>
              {panel.items.map((item, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${item.x * 100}%`,
                    top: `${item.y * 100}%`,
                    width: `${item.w * 100}%`,
                    height: `${item.h * 100}%`,
                    backgroundColor: MAP_FILL[item.shape] ?? '#F1F5F9',
                    borderWidth: item.shape === 'road' ? 0 : 1,
                    borderColor: MAP_STROKE[item.shape] ?? '#94A3B8',
                    borderRadius: item.shape === 'road' ? 2 : item.shape === 'water' ? 0 : 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2,
                    overflow: 'hidden',
                  }}
                >
                  {item.shape === 'road' ? (
                    <View pointerEvents="none" style={{ position: 'absolute', left: item.w >= item.h ? '3%' : '49%', top: item.w >= item.h ? '47%' : '3%', width: item.w >= item.h ? '94%' : '2%', height: item.w >= item.h ? '6%' : '94%', borderColor: '#F8F5ED', borderStyle: 'dashed', borderWidth: 1 }} />
                  ) : null}
                  {item.shape === 'water' ? (
                    <Text numberOfLines={1} style={{ position: 'absolute', right: 4, top: 2, color: '#4386A8', fontSize: 9, opacity: 0.65 }}>≈ ≈</Text>
                  ) : null}
                  <Text
                    className="text-center font-mid text-ink"
                    numberOfLines={horizontal ? 3 : 2}
                    style={{ fontSize: width < 500 ? 9 : 10, lineHeight: width < 500 ? 11 : 12, fontWeight: '600', textShadowColor: 'rgba(255,255,255,0.55)', textShadowRadius: 2 }}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap justify-center" style={{ columnGap: 14, rowGap: 7 }}>
        {shapes.map((shape) => (
          <View key={shape} className="flex-row items-center gap-1.5">
            <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: MAP_FILL[shape], borderWidth: 1, borderColor: MAP_STROKE[shape] }} />
            <Text className="font-sans text-label text-body">{pick(locale, MAP_LABEL[shape]?.vi ?? shape, MAP_LABEL[shape]?.en ?? shape)}</Text>
          </View>
        ))}
      </View>
      <Text className="text-center font-sans text-[10px] text-muted">
        {pick(locale, 'Sơ đồ minh hoạ · không theo tỷ lệ', 'Illustrative map · not to scale')}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Line và Bar
// ---------------------------------------------------------------------------

function LineOrBarFigure({ data, width }: { data: LineOrBarChart; width: number }) {
  const left = 48;
  const right = 16;
  const innerW = Math.max(80, width - left - right);
  const labelFontSize = width < 500 ? 9 : 11;
  const labelMaxChars = Math.max(6, Math.floor((innerW / Math.max(1, data.xLabels.length)) / (labelFontSize * 0.55)));
  const wrappedLabels = data.xLabels.map((label) => wrapLabel(label, labelMaxChars));
  const labelRows = Math.max(1, ...wrappedLabels.map((lines) => lines.length));
  const height = 300 + Math.max(0, labelRows - 2) * 12;
  const pad = { top: 12, right, bottom: Math.max(54, 30 + labelRows * 12), left };
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

          {wrappedLabels.map((lines, i) => lines.map((line, lineIndex) => (
            <SvgText
              key={`x${i}-${lineIndex}`}
              x={xAt(i)}
              y={innerH + (lines.length > 1 ? 13 : 18) + lineIndex * 12}
              fontSize={labelFontSize}
              fill={color.subtle}
              textAnchor="middle"
            >
              {line}
            </SvgText>
          )))}
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

/** Keep full category names while wrapping them to avoid collisions on narrow charts. */
function wrapLabel(label: string, maxChars: number): string[] {
  const lines: string[] = [];
  let current = '';

  for (const word of label.split(/\s+/)) {
    if (word.length > maxChars) {
      if (current) lines.push(current);
      current = '';
      for (let i = 0; i < word.length; i += maxChars) lines.push(word.slice(i, i + maxChars));
      continue;
    }

    if (current && current.length + word.length + 1 > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [label];
}
