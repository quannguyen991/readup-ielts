import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import type {
  AngleCorner,
  DataTableFigure,
  MathFigureSpec,
  ParallelLinesFigure,
  RightTriangleFigure,
  ScatterplotFigure,
} from '@/lib/math/types';
import { color, fontFamily } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Hình minh hoạ của đề Math.
 *
 * Dựng bằng `react-native-svg` như `ChartFigure.tsx`, cùng lý do: recharts chỉ
 * chạy web, victory-native chỉ chạy native, mà hình của ĐỀ THI thì phải hiện
 * giống hệt nhau ở hai nơi.
 *
 * Ngoại lệ là bảng số liệu — bảng dựng bằng View/Text thì chữ chọn được, tự
 * xuống dòng và tự co theo cỡ chữ hệ thống, ba thứ mà SVG không cho.
 */
export function MathFigure({ spec, width = 320 }: { spec: MathFigureSpec; width?: number }) {
  switch (spec.kind) {
    case 'right_triangle':
      return <RightTriangleFigureView spec={spec} width={width} />;
    case 'data_table':
      return <DataTableFigureView spec={spec} />;
    case 'scatterplot':
      return <ScatterplotFigureView spec={spec} width={width} />;
    case 'parallel_lines':
      return <ParallelLinesFigureView spec={spec} width={width} />;
  }
}

function FigureFrame({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <View className="items-center rounded-card border border-border bg-surface p-3">
      {caption ? (
        <Text
          className="mb-2 text-center"
          style={{ fontSize: 12, color: color.muted, fontFamily: fontFamily.semibold }}
        >
          {caption}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

// ------------------------------------------------------------ tam giác vuông

const PAD = { top: 22, right: 26, bottom: 26, left: 34 };
const MAX_HEIGHT = 190;
/**
 * Tỉ lệ hai cạnh góc vuông được phép lệch tới đâu trước khi phải bóp lại.
 *
 * Bộ ba (11, 60, 61) vẽ đúng tỉ lệ sẽ ra một vệt mỏng cao 5 pixel, không đọc
 * được cạnh nào là cạnh nào. Bóp lại thì hình dễ đọc nhưng KHÔNG còn đúng tỉ
 * lệ, nên phải ghi rõ điều đó dưới hình — đúng như đề thi thật vẫn ghi.
 */
const MAX_ASPECT = 2.6;

function RightTriangleFigureView({ spec, width }: { spec: RightTriangleFigure; width: number }) {
  const [vertexA, vertexB, vertexC] = spec.vertices;
  const [legAB, legBC] = spec.legs;

  const trueAspect = legAB / legBC;
  const aspect = Math.min(MAX_ASPECT, Math.max(1 / MAX_ASPECT, trueAspect));
  const notToScale = aspect !== trueAspect;

  const boxW = width - PAD.left - PAD.right;
  const w = Math.min(boxW, MAX_HEIGHT / aspect);
  const h = w * aspect;

  // B ở góc dưới bên trái, A thẳng trên B, C bên phải B — nhờ vậy góc vuông ở B
  // nằm đúng chỗ mắt quen nhìn và hai cạnh góc vuông song song với trục.
  const bx = PAD.left;
  const by = PAD.top + h;
  const ax = bx;
  const ay = PAD.top;
  const cx = bx + w;
  const cy = by;

  const marker = Math.min(12, w * 0.16, h * 0.16);

  const labelFor = (side: 'leg0' | 'leg1' | 'hypotenuse', value: number) =>
    spec.unknown === side ? null : `${value}${spec.unit ? ` ${spec.unit}` : ''}`;

  return (
    <View className="items-center rounded-card border border-border bg-surface p-3">
      <Svg width={w + PAD.left + PAD.right} height={h + PAD.top + PAD.bottom}>
        <Polyline
          points={`${ax},${ay} ${bx},${by} ${cx},${cy} ${ax},${ay}`}
          fill="none"
          stroke={color.ink}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {/* Ký hiệu góc vuông ở B. */}
        <Polyline
          points={`${bx + marker},${by} ${bx + marker},${by - marker} ${bx},${by - marker}`}
          fill="none"
          stroke={color.muted}
          strokeWidth={1.2}
        />
        <VertexLabel x={ax} y={ay} dx={-6} dy={-8} label={vertexA} />
        <VertexLabel x={bx} y={by} dx={-6} dy={16} label={vertexB} />
        <VertexLabel x={cx} y={cy} dx={8} dy={16} label={vertexC} />
        <SideLabel x={ax - 8} y={(ay + by) / 2} anchor="end" label={labelFor('leg0', legAB)} />
        <SideLabel x={(bx + cx) / 2} y={by + 16} anchor="middle" label={labelFor('leg1', legBC)} />
        <SideLabel
          x={(ax + cx) / 2 + 12}
          y={(ay + cy) / 2 - 6}
          anchor="start"
          label={labelFor('hypotenuse', spec.hypotenuse)}
        />
      </Svg>

      {notToScale ? <NotToScaleNote /> : null}
    </View>
  );
}

// ------------------------------------------------------------ bảng số liệu

function DataTableFigureView({ spec }: { spec: DataTableFigure }) {
  const columnCount = spec.columns.length;

  return (
    <FigureFrame caption={spec.caption}>
      <View className="w-full overflow-hidden rounded-panel border border-border">
        <View className="flex-row bg-surfaceAlt">
          {spec.columns.map((label, index) => (
            <Cell key={index} first={index === 0} width={columnCount} strong>
              {label}
            </Cell>
          ))}
        </View>

        {spec.rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row border-t border-border">
            <Cell first width={columnCount} strong>
              {row.label}
            </Cell>
            {row.cells.map((cell, cellIndex) => (
              <Cell key={cellIndex} width={columnCount}>
                {String(cell)}
              </Cell>
            ))}
          </View>
        ))}

        {spec.totalRow ? (
          <View className="flex-row border-t-2 border-borderStrong bg-surfaceAlt">
            <Cell first width={columnCount} strong>
              {spec.totalRow.label}
            </Cell>
            {spec.totalRow.cells.map((cell, index) => (
              <Cell key={index} width={columnCount} strong>
                {String(cell)}
              </Cell>
            ))}
          </View>
        ) : null}
      </View>
    </FigureFrame>
  );
}

function Cell({
  children,
  first = false,
  strong = false,
  width,
}: {
  children: React.ReactNode;
  first?: boolean;
  strong?: boolean;
  width: number;
}) {
  return (
    <View
      className={`px-2 py-2 ${first ? '' : 'border-l border-border'}`}
      style={{ flex: first ? 1.4 : 1, minWidth: width > 3 ? 56 : 70 }}
    >
      <Text
        className={first ? 'text-left' : 'text-center'}
        style={{
          fontSize: 12,
          color: strong ? color.ink : color.ink,
          fontFamily: strong ? fontFamily.semibold : fontFamily.regular,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

// -------------------------------------------------------------- scatterplot

function ScatterplotFigureView({ spec, width }: { spec: ScatterplotFigure; width: number }) {
  const pad = { top: 14, right: 14, bottom: 34, left: 40 };
  const w = Math.max(200, width) - pad.left - pad.right;
  const h = 170;

  const [xMin, xMax] = spec.xRange;
  const [yMin, yMax] = spec.yRange;
  const sx = (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * w;
  const sy = (y: number) => pad.top + h - ((y - yMin) / (yMax - yMin)) * h;

  const xTicks = niceTicks(xMin, xMax, 5);
  const yTicks = niceTicks(yMin, yMax, 4);

  return (
    <FigureFrame caption={spec.caption}>
      <Svg width={w + pad.left + pad.right} height={h + pad.top + pad.bottom}>
        {yTicks.map((value) => (
          <React.Fragment key={`y${value}`}>
            <Line
              x1={pad.left}
              y1={sy(value)}
              x2={pad.left + w}
              y2={sy(value)}
              stroke={color.border}
              strokeWidth={1}
            />
            <SvgText
              x={pad.left - 6}
              y={sy(value) + 4}
              fontSize={10}
              fontFamily={fontFamily.regular}
              fill={color.muted}
              textAnchor="end"
            >
              {String(value)}
            </SvgText>
          </React.Fragment>
        ))}

        {xTicks.map((value) => (
          <SvgText
            key={`x${value}`}
            x={sx(value)}
            y={pad.top + h + 16}
            fontSize={10}
            fontFamily={fontFamily.regular}
            fill={color.muted}
            textAnchor="middle"
          >
            {String(value)}
          </SvgText>
        ))}

        {/* Trục vẽ đè lên lưới để hai trục nổi rõ hơn các đường lưới. */}
        <Line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + h} stroke={color.muted} strokeWidth={1.2} />
        <Line
          x1={pad.left}
          y1={pad.top + h}
          x2={pad.left + w}
          y2={pad.top + h}
          stroke={color.muted}
          strokeWidth={1.2}
        />

        {spec.line ? (
          <Line
            x1={sx(xMin)}
            y1={sy(spec.line.slope * xMin + spec.line.intercept)}
            x2={sx(xMax)}
            y2={sy(spec.line.slope * xMax + spec.line.intercept)}
            stroke={color.primary}
            strokeWidth={1.6}
          />
        ) : null}

        {spec.points.map((point, index) => (
          <Circle key={index} cx={sx(point.x)} cy={sy(point.y)} r={3.4} fill={color.ink} />
        ))}

        <SvgText
          x={pad.left + w / 2}
          y={pad.top + h + 30}
          fontSize={10}
          fontFamily={fontFamily.regular}
          fill={color.muted}
          textAnchor="middle"
        >
          {spec.xLabel}
        </SvgText>
      </Svg>
      <FigureNote text={spec.yLabel} />
    </FigureFrame>
  );
}

/** Mốc trục "đẹp", đủ thưa để không chồng chữ lên nhau. */
function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min;
  if (span <= 0) return [min];
  const rawStep = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? magnitude * 10;

  const ticks: number[] = [];
  for (let value = Math.ceil(min / step) * step; value <= max; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }
  return ticks;
}

// --------------------------------------------------------- hai đường song song

function ParallelLinesFigureView({ spec, width }: { spec: ParallelLinesFigure; width: number }) {
  const w = Math.min(width, 320);
  const h = 190;
  const topLineY = 58;
  const bottomLineY = 132;
  const lineY: [number, number] = [topLineY, bottomLineY];
  const marginX = 26;

  // Cát tuyến đi từ trên-trái xuống dưới-phải, cắt cả hai đường trong khung.
  // Viết dưới dạng x = midX + (y - centerY) * tilt để mọi giao điểm và hai đầu
  // đoạn thẳng cùng dùng một công thức — lệch nhau một chút là hai nhãn góc rơi
  // sang nhầm phía của cát tuyến.
  const centerY = (topLineY + bottomLineY) / 2;
  const tilt = 46 / 74;
  const midX = w / 2;
  const atY = (y: number) => midX + (y - centerY) * tilt;
  const crossX: [number, number] = [atY(topLineY), atY(bottomLineY)];
  const topX = atY(0);
  const bottomX = atY(h);

  const cornerOffset: Record<AngleCorner, { dx: number; dy: number }> = {
    upper_left: { dx: -22, dy: -12 },
    upper_right: { dx: 20, dy: -12 },
    lower_left: { dx: -22, dy: 20 },
    lower_right: { dx: 20, dy: 20 },
  };

  const marker = (line: 0 | 1, corner: AngleCorner) => {
    const offset = cornerOffset[corner];
    return { x: crossX[line] + offset.dx, y: lineY[line] + offset.dy };
  };

  const known = marker(spec.known.line, spec.known.corner);
  const asked = marker(spec.asked.line, spec.asked.corner);

  return (
    <FigureFrame>
      <Svg width={w} height={h}>
        {lineY.map((y, index) => (
          <React.Fragment key={y}>
            <Line x1={marginX} y1={y} x2={w - marginX} y2={y} stroke={color.ink} strokeWidth={1.6} />
            <SvgText
              x={marginX - 6}
              y={y + 4}
              fontSize={12}
              fontFamily={fontFamily.semibold}
              fill={color.muted}
              textAnchor="end"
            >
              {spec.lineLabels[index] ?? ''}
            </SvgText>
          </React.Fragment>
        ))}

        <Line
          x1={topX}
          y1={0}
          x2={bottomX}
          y2={h}
          stroke={color.ink}
          strokeWidth={1.6}
        />
        <SvgText
          x={bottomX + 4}
          y={h - 4}
          fontSize={12}
          fontFamily={fontFamily.semibold}
          fill={color.muted}
        >
          {spec.transversalLabel}
        </SvgText>

        {/* Góc đã cho ghi kèm số đo; góc đang hỏi chỉ ghi tên. */}
        <SvgText
          x={known.x}
          y={known.y}
          fontSize={11}
          fontFamily={fontFamily.semibold}
          fill={color.primary}
          textAnchor="middle"
        >
          {`∠${spec.known.label} = ${spec.known.degrees}°`}
        </SvgText>
        <SvgText
          x={asked.x}
          y={asked.y}
          fontSize={12}
          fontFamily={fontFamily.semibold}
          fill={color.accent}
          textAnchor="middle"
        >
          {`∠${spec.asked.label}`}
        </SvgText>
      </Svg>
      <NotToScaleNote />
    </FigureFrame>
  );
}

// ------------------------------------------------------------------ dùng chung

/** Ghi chú "không đúng tỉ lệ" theo ngôn ngữ giao diện. */
function NotToScaleNote() {
  const { L } = useL();
  return <FigureNote text={L('Hình không vẽ đúng tỉ lệ.', 'Note: Figure not drawn to scale.')} />;
}

function FigureNote({ text }: { text: string }) {
  return (
    <Text
      className="mt-1 text-center"
      style={{ fontSize: 11, color: color.muted, fontFamily: fontFamily.regular }}
    >
      {text}
    </Text>
  );
}

function VertexLabel({
  x,
  y,
  dx,
  dy,
  label,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  label: string;
}) {
  return (
    <SvgText
      x={x + dx}
      y={y + dy}
      fontSize={12}
      fontFamily={fontFamily.semibold}
      fill={color.ink}
      textAnchor="middle"
    >
      {label}
    </SvgText>
  );
}

function SideLabel({
  x,
  y,
  anchor,
  label,
}: {
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  label: string | null;
}) {
  // Cạnh đang hỏi không ghi số — ghi vào là đề tự lộ đáp án.
  if (!label) return null;

  return (
    <SvgText
      x={x}
      y={y}
      fontSize={12}
      fontFamily={fontFamily.regular}
      fill={color.muted}
      textAnchor={anchor}
    >
      {label}
    </SvgText>
  );
}
