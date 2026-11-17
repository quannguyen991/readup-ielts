import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { WritingPromptSourceChart } from '@/lib/writing/types';
import { arcPath, pieSlices } from '@/services/writing/chart-scale';

/** Source-faithful Task 1 fallback for tables/assets that cannot become numeric charts. */
export function Task1SourceFigure({ charts, compact = false, english = true }: { charts: WritingPromptSourceChart[]; compact?: boolean; english?: boolean }) {
  if (!charts.length) return null;
  return (
    <View className="w-full gap-2.5" style={{ maxWidth: 560 }}>
      {charts.map((chart, chartIndex) => (
        <View key={`${chart.title}-${chartIndex}`} className="overflow-hidden rounded-xl border border-[#DDE4EA] bg-white">
          <View className="flex-row flex-wrap items-start justify-between gap-2 border-b border-[#E8EDF1] px-3 py-2" style={{ backgroundColor: '#F7F9FB' }}>
            <Text className="min-w-0 flex-1 font-nun-heavy text-label text-ink" numberOfLines={compact ? 1 : 2}>{chart.title}</Text>
            {chart.unit ? <Text className="font-nun-mid text-[10px] text-muted">{chart.unit}</Text> : null}
          </View>
          {chart.assetUrl ? (
            <View
              className="w-full items-center justify-center overflow-hidden bg-white"
              style={{ aspectRatio: compact ? 1.45 : 1.7, maxWidth: compact ? 460 : 560, alignSelf: 'center' }}
            >
              <Image
                source={{ uri: chart.assetUrl }}
                resizeMode="contain"
                accessibilityLabel={chart.imageAlt ?? chart.title}
                style={{ width: '100%', height: '100%', backgroundColor: '#FFFFFF' }}
              />
            </View>
          ) : null}
          {!chart.assetUrl && chart.panels?.length ? (
            <View className="flex-row flex-wrap gap-2 p-2.5">
              {chart.panels.map((panel, panelIndex) => (
                <View key={`${chart.title}-panel-${panelIndex}`} className="min-w-0 flex-1" style={{ minWidth: compact ? 190 : 230 }}>
                  <Text className="mb-1 font-nun-strong text-[9px] text-muted">{panel.caption}</Text>
                  <View className="relative w-full overflow-hidden rounded-lg border border-[#CBD5DF] bg-[#F8FAFC]" style={{ aspectRatio: 1.35 }}>
                    {panel.items.map((item, itemIndex) => (
                      <View
                        key={`${panelIndex}-${itemIndex}`}
                        accessibilityLabel={item.label}
                        style={{
                          position: 'absolute',
                          left: `${Math.max(0, Math.min(1, item.x)) * 100}%`,
                          top: `${Math.max(0, Math.min(1, item.y)) * 100}%`,
                          width: `${Math.max(0.03, Math.min(1, item.w)) * 100}%`,
                          height: `${Math.max(0.03, Math.min(1, item.h)) * 100}%`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: MAP_STROKES[item.shape],
                          backgroundColor: MAP_FILLS[item.shape],
                          paddingHorizontal: 2,
                        }}
                      >
                        <Text className="font-nun-mid text-center text-[8px] text-ink" numberOfLines={2}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {chart.chartAnnotations?.length ? (
            <View className="gap-1 px-3 pt-2">
              {chart.chartAnnotations.map((annotation, index) => (
                <Text key={`${chart.title}-note-${index}`} className="font-nun-mid text-[10px]" style={{ color: '#8A6233' }}>{annotation}</Text>
              ))}
            </View>
          ) : null}
          {isPieChart(chart) && chart.dataTables?.length ? <SourcePieFigures chart={chart} compact={compact} /> : null}
          {chart.dataTables?.map((table, tableIndex) => {
            const rows = compact ? table.rows.slice(0, 4) : table.rows;
            const headers = ['', ...table.columns];
            return (
              <View key={`${chart.title}-table-${tableIndex}`} className="px-2.5 py-2">
                {table.title && table.title !== chart.title ? <Text className="mb-1.5 font-nun-strong text-[10px] text-muted">{table.title}</Text> : null}
                <ScrollView horizontal showsHorizontalScrollIndicator={!compact}>
                  <View style={{ minWidth: compact ? 220 : 300 }}>
                    <View className="flex-row border-b border-[#DEE5EB]" style={{ backgroundColor: '#EEF3F7' }}>
                      {headers.map((header, index) => (
                        <View key={`header-${index}`} className="justify-center px-2 py-1.5" style={{ flex: index === 0 ? 1.5 : 1, minWidth: compact ? 48 : 72 }}>
                          <Text className="font-nun-heavy text-[9px] text-ink" numberOfLines={2}>{header}</Text>
                        </View>
                      ))}
                    </View>
                    {rows.map((row, rowIndex) => (
                      <View key={`row-${rowIndex}`} className="flex-row border-b border-[#EDF0F3]">
                        {[row.label, ...row.values].map((cell, cellIndex) => (
                          <View key={`cell-${rowIndex}-${cellIndex}`} className="justify-center px-2 py-1.5" style={{ flex: cellIndex === 0 ? 1.5 : 1, minWidth: compact ? 48 : 72 }}>
                            <Text className="font-nun-mid text-[9px] text-ink" numberOfLines={2}>{String(cell)}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
                {chart.dataPrecision === 'approximate' || table.dataPrecision === 'approximate' ? <Text className="mt-1 font-nun-mid text-[9px]" style={{ color: '#8A6233' }}>{english ? '≈ Approximate values read from source chart' : '≈ Số liệu ước lượng theo biểu đồ nguồn'}</Text> : null}
                {compact && table.rows.length > rows.length ? (
                  <View className="mt-1.5 self-start rounded-md border border-[#DCE4EA] bg-[#F7F9FB] px-2 py-1">
                    <Text className="font-nun-mid text-[9px] leading-4 text-muted">
                      {english
                        ? `Preview: showing ${rows.length} of ${table.rows.length} rows · open for the full table`
                        : `Bản xem nhanh: ${rows.length}/${table.rows.length} dòng · mở chi tiết để xem đủ bảng`}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          {!chart.dataTables?.length && !chart.assetUrl && chart.steps?.length ? (
            <View className="flex-row flex-wrap gap-1.5 px-3 py-2">
              {chart.steps.map((step, index) => (
                <View key={`step-${index}`} className="rounded-md border border-[#E2E8EE] bg-[#F8FAFC] px-2 py-1">
                  <Text className="font-nun-mid text-[9px] text-ink">{index + 1}. {step}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {!chart.dataTables?.length && !chart.assetUrl && !chart.steps?.length && !chart.panels?.length ? (
            <View className="gap-3 px-3 py-3">
              <View className="flex-row flex-wrap items-center justify-between gap-2">
                <Text className="font-nun-heavy text-[9px]" style={{ color: '#536579', letterSpacing: 0.8 }}>
                  {english ? 'SOURCE CHART LABELS' : 'NHÃN TRÊN BIỂU ĐỒ GỐC'}
                </Text>
                {chart.chartVisualLabelsSource ? (
                  <Text className="font-nun-mid text-[9px] text-muted">{chart.chartVisualLabelsSource}</Text>
                ) : null}
              </View>
              {chart.axisTicks?.length ? (
                <View className="gap-1.5">
                  <Text className="font-nun-strong text-[9px] text-muted">{english ? 'Axis scale' : 'Vạch trục'}</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {chart.axisTicks.map((tick, index) => (
                      <View key={`tick-${index}`} className="rounded-md border border-[#DCE4EA] bg-[#F7F9FB] px-2 py-1">
                        <Text className="font-nun-mid text-[9px] text-ink">{tick}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {chart.labels?.length ? (
                <View className="gap-1.5">
                  <Text className="font-nun-strong text-[9px] text-muted">{english ? 'Categories' : 'Hạng mục'}</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {chart.labels.map((label, index) => (
                      <View key={`label-${index}`} className="rounded-md px-2 py-1" style={{ backgroundColor: '#EEF4F8' }}>
                        <Text className="font-nun-mid text-[9px] text-ink">{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {chart.series?.length ? (
                <View className="gap-1.5">
                  <Text className="font-nun-strong text-[9px] text-muted">{english ? 'Legend' : 'Chú giải'}</Text>
                  <View className="flex-row flex-wrap gap-x-3 gap-y-1.5">
                    {chart.series.map((series, index) => (
                      <View key={`series-${index}`} className="flex-row items-center gap-1.5">
                        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: ['#3977A8', '#D58946', '#4D9A7A', '#826CB1'][index % 4] }} />
                        <Text className="font-nun-mid text-[9px] text-ink">{series}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {chart.dataAvailability ? (
                <Text className="border-t border-[#E8EDF1] pt-2 font-nun-mid text-[9px] leading-4 text-muted">
                  {english ? 'The chart image has no captured point values; no numbers have been estimated.' : 'Ảnh biểu đồ không có số tại từng điểm trong dữ liệu đã lưu; không tự ước lượng số.'}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function isPieChart(chart: WritingPromptSourceChart): boolean {
  return [chart.kind, chart.type].some((value) => /\bpie\b/i.test(value ?? ''));
}

function SourcePieFigures({ chart, compact }: { chart: WritingPromptSourceChart; compact: boolean }) {
  const tables = (chart.dataTables ?? []).flatMap((table, index) => {
    const slices = table.rows.map((row) => ({ label: row.label, value: sourceNumber(row.values[0]) }));
    if (slices.length < 2 || slices.some((slice) => slice.value === null || slice.value < 0)) return [];
    return [{ caption: table.title ?? `${chart.title} ${index + 1}`, slices: slices as { label: string; value: number }[] }];
  });
  if (!tables.length) return null;

  const diameter = compact ? 58 : 88;
  const radius = diameter * 0.43;
  const colors = ['#3977A8', '#D58946', '#4D9A7A', '#826CB1', '#C65C68', '#9B7D48', '#4A91A1'];
  return (
    <View className="flex-row flex-wrap gap-2 px-2.5 py-2">
      {tables.map((table, tableIndex) => {
        const arcs = pieSlices(table.slices);
        return (
          <View key={`${chart.title}-pie-${tableIndex}`} className="flex-row items-center gap-2 rounded-lg border border-[#E7ECF0] bg-[#FBFCFD] px-2 py-2">
            <Svg width={diameter} height={diameter} accessibilityLabel={table.caption}>
              {arcs.map((arc, sliceIndex) => (
                <Path
                  key={`${tableIndex}-${sliceIndex}`}
                  d={arcPath(diameter / 2, diameter / 2, radius, arc)}
                  fill={colors[sliceIndex % colors.length]}
                  stroke="#FFFFFF"
                  strokeWidth={1.2}
                />
              ))}
            </Svg>
            <View className="max-w-[190px] gap-1">
              {table.caption !== chart.title ? <Text className="mb-0.5 font-nun-strong text-[9px] text-muted" numberOfLines={1}>{table.caption}</Text> : null}
              {table.slices.map((slice, sliceIndex) => (
                <View key={`${tableIndex}-legend-${sliceIndex}`} className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-sm" style={{ backgroundColor: colors[sliceIndex % colors.length] }} />
                  <Text className="min-w-0 flex-1 font-nun-mid text-[9px] text-ink" numberOfLines={1}>{slice.label}</Text>
                  <Text className="font-nun-heavy text-[9px] text-muted">{slice.value}{chart.unit?.includes('%') ? '%' : ''}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function sourceNumber(value: string | number): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = value.trim().replace(/[,%≈]/g, '').replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

const MAP_FILLS: Record<string, string> = {
  building: '#E9D5FF', green: '#BBF7D0', water: '#BAE6FD', road: '#D6D3D1', sand: '#FDE68A', plain: '#F1F5F9',
};

const MAP_STROKES: Record<string, string> = {
  building: '#8064B8', green: '#4E9872', water: '#4D94B8', road: '#7C818C', sand: '#B78938', plain: '#A2A8B2',
};
