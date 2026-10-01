import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { chartPalette, color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Bộ biểu đồ dựng bằng react-native-svg.
 *
 * Recharts chỉ chạy trên web còn victory-native chỉ chạy trên native; viết một
 * bộ SVG dùng chung giữ cho web và mobile hiển thị giống hệt nhau và không phải
 * bảo trì hai nhánh code.
 */

export function LineChart({
  data,
  width = 520,
  height = 220,
  yMin,
  yMax,
  formatY = (v: number) => String(v),
}: {
  data: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
  yMin?: number;
  yMax?: number;
  formatY?: (value: number) => string;
}) {
  if (data.length === 0) return <EmptyChart height={height} />;

  const padding = { top: 16, right: 16, bottom: 28, left: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const min = yMin ?? Math.min(...values) - 0.5;
  const max = yMax ?? Math.max(...values) + 0.5;
  const span = Math.max(0.1, max - min);

  const x = (index: number) => (data.length === 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value: number) => innerH - ((value - min) / span) * innerH;

  const path = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`)
    .join(' ');

  const ticks = 4;

  return (
    <Svg width={width} height={height}>
      <G x={padding.left} y={padding.top}>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const value = min + (span / ticks) * i;
          const yPos = y(value);
          return (
            <G key={i}>
              <Line x1={0} y1={yPos} x2={innerW} y2={yPos} stroke={color.border} strokeWidth={1} />
              <SvgText x={-8} y={yPos + 4} fontSize={10} fill={color.subtle} textAnchor="end">
                {formatY(value)}
              </SvgText>
            </G>
          );
        })}

        <Path d={path} stroke={color.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />

        {data.map((d, i) => (
          <Circle
            key={i}
            cx={x(i)}
            cy={y(d.value)}
            r={i === data.length - 1 ? 5 : 3.5}
            fill={color.white}
            stroke={color.primary}
            strokeWidth={2}
          />
        ))}

        {data.map((d, i) =>
          i % Math.ceil(data.length / 5) === 0 || i === data.length - 1 ? (
            <SvgText
              key={`l-${i}`}
              x={x(i)}
              y={innerH + 18}
              fontSize={10}
              fill={color.subtle}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          ) : null,
        )}
      </G>
    </Svg>
  );
}

/**
 * Biểu đồ cột, TỰ ĐO bề rộng của khung chứa nó.
 *
 * Bản trước vẽ `<Svg width={520}>` cố định bên trong một thẻ co giãn. Trên màn
 * hình hẹp hơn 520px, cột cuối cùng thò hẳn ra ngoài viền thẻ — và nó không bị
 * cắt, nó nằm chồng lên phần bên cạnh. Lỗi chỉ lộ ra ở đúng vài bề rộng cửa sổ,
 * nên rất dễ lọt khi chỉ xem ở một cỡ màn hình.
 *
 * `onLayout` trả về bề rộng thật; trước khi có số đó thì chưa vẽ gì, vì vẽ bằng
 * một bề rộng đoán rồi nhảy sang bề rộng thật là một cú giật thấy rõ.
 */
export function BarChart({
  data,
  width,
  height = 200,
  showSecondary = false,
}: {
  data: Array<{ label: string; value: number; secondary?: number }>;
  /** Bỏ trống = tự co theo khung chứa. Chỉ truyền khi thật sự cần cỡ cố định. */
  width?: number;
  height?: number;
  showSecondary?: boolean;
}) {
  const [measured, setMeasured] = React.useState<number | null>(null);

  // Bảy ngày toàn số 0 không phải là dữ liệu: vẽ bảy mẩu cột 2px trông như
  // người học có làm chút ít, trong khi họ chưa làm gì. Hiện trạng thái trống.
  if (data.length === 0 || data.every((d) => !d.value && !d.secondary)) return <EmptyChart height={height} />;

  if (width === undefined) {
    return (
      <View
        style={{ width: '100%', height }}
        onLayout={(e) => setMeasured(Math.floor(e.nativeEvent.layout.width))}
      >
        {measured && measured > 0 ? (
          <BarChart data={data} width={measured} height={height} showSecondary={showSecondary} />
        ) : null}
      </View>
    );
  }

  const padding = { top: 12, right: 8, bottom: 24, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...data.flatMap((d) => [d.value, d.secondary ?? 0]));
  const slot = innerW / data.length;
  const barWidth = showSecondary ? Math.min(10, slot / 3) : Math.min(18, slot * 0.5);

  return (
    <Svg width={width} height={height}>
      <G x={padding.left} y={padding.top}>
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const h2 = ((d.secondary ?? 0) / max) * innerH;
          const cx = slot * i + slot / 2;

          return (
            <G key={i}>
              <Rect
                x={cx - (showSecondary ? barWidth + 2 : barWidth / 2)}
                y={innerH - h}
                width={barWidth}
                height={Math.max(2, h)}
                rx={3}
                fill={color.primary}
              />
              {showSecondary ? (
                <Rect
                  x={cx + 2}
                  y={innerH - h2}
                  width={barWidth}
                  height={Math.max(2, h2)}
                  rx={3}
                  fill={color.accent}
                  opacity={0.75}
                />
              ) : null}
              <SvgText
                x={cx}
                y={innerH + 16}
                fontSize={10}
                fill={color.subtle}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

export function DonutChart({
  data,
  size = 180,
  thickness = 26,
  centerLabel,
  centerValue,
}: {
  data: Array<{ label: string; value: number }>;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const center = size / 2;

  let angle = -Math.PI / 2;

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {total === 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color.surfaceAlt}
            strokeWidth={thickness}
            fill="none"
          />
        ) : (
          data.map((d, i) => {
            const sweep = (d.value / total) * Math.PI * 2;
            const start = angle;
            const end = angle + sweep;
            angle = end;

            if (d.value === 0) return null;

            const x1 = center + radius * Math.cos(start);
            const y1 = center + radius * Math.sin(start);
            const x2 = center + radius * Math.cos(end);
            const y2 = center + radius * Math.sin(end);
            const largeArc = sweep > Math.PI ? 1 : 0;

            return (
              <Path
                key={i}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                stroke={chartPalette[i % chartPalette.length]}
                strokeWidth={thickness}
                strokeLinecap="butt"
                fill="none"
              />
            );
          })
        )}
      </Svg>

      {centerValue ? (
        <View className="absolute inset-0 items-center justify-center" style={{ height: size }}>
          <Text className="font-heavy text-cardTitle text-ink">{centerValue}</Text>
          {centerLabel ? (
            <Text className="font-mid text-label text-muted">{centerLabel}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Heatmap kiểu GitHub cho lịch luyện tập theo tuần. */
export function Heatmap({
  data,
  weeks = 5,
}: {
  data: Array<{ date: string; value: number }>;
  weeks?: number;
}) {
  const { L } = useL();
  const cell = 14;
  const gap = 4;
  const max = Math.max(1, ...data.map((d) => d.value));

  const columns: Array<Array<{ date: string; value: number }>> = [];
  for (let i = 0; i < data.length; i += 7) columns.push(data.slice(i, i + 7));

  const shown = columns.slice(-weeks);

  return (
    <View>
      <Svg width={shown.length * (cell + gap)} height={7 * (cell + gap)}>
        {shown.map((week, wi) =>
          week.map((day, di) => {
            const intensity = day.value === 0 ? 0 : 0.25 + (day.value / max) * 0.75;
            return (
              <Rect
                key={`${wi}-${di}`}
                x={wi * (cell + gap)}
                y={di * (cell + gap)}
                width={cell}
                height={cell}
                rx={3}
                fill={day.value === 0 ? '#F9F5ED' : color.primary}
                opacity={day.value === 0 ? 1 : intensity}
              />
            );
          }),
        )}
      </Svg>

      <View className="mt-2 flex-row items-center gap-1.5">
        <Text className="font-mid text-label text-subtle">{L('Ít', 'Less')}</Text>
        {[0.25, 0.5, 0.75, 1].map((o) => (
          <View
            key={o}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: color.primary, opacity: o }}
          />
        ))}
        <Text className="font-mid text-label text-subtle">{L('Nhiều', 'More')}</Text>
      </View>
    </View>
  );
}

/** Thanh ngang cho "Performance by Question Type". */
export function HorizontalBars({
  data,
}: {
  data: Array<{ label: string; percent: number; delta?: number; tone?: string }>;
}) {
  return (
    <View className="gap-3">
      {data.map((row) => (
        <View key={row.label}>
          <View className="flex-row items-center justify-between">
            <Text className="font-mid text-body text-body" numberOfLines={1}>
              {row.label}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="font-strong text-body text-ink">{row.percent}%</Text>
            </View>
          </View>
          <View className="mt-1.5 h-2 overflow-hidden rounded-pill bg-surfaceAlt">
            <View
              className="h-full rounded-pill"
              style={{
                width: `${Math.max(2, row.percent)}%`,
                backgroundColor: row.tone ?? color.primary,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyChart({ height }: { height: number }) {
  const { L } = useL();
  return (
    <View
      className="items-center justify-center rounded-panel bg-surfaceAlt"
      style={{ height }}
    >
      <Text className="font-sans text-label text-muted">{L('Chưa có dữ liệu', 'No data yet')}</Text>
    </View>
  );
}
