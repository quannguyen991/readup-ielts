import type { ChartData, MapPanel, SimpleChartData, Task1Chart, WritingPrompt } from '@/lib/writing/types';
import { deriveAnalysisKey } from '@/services/writing/analysis-key';
import type { WritingSample, WritingSampleSection, WritingSampleSourceChart } from '@/data/writing-samples';

export type TidTask1Table = NonNullable<WritingSampleSourceChart['dataTables']>[number];

export type TidTask1ChartRecord = WritingSampleSourceChart & {
  isCycle?: boolean;
  panels?: MapPanel[];
};

export type TidTask1Record = {
  source: string;
  sourceUrl: string;
  task: 1;
  topic: string;
  type: string;
  typeSlug: string;
  sampleId: number;
  words: number;
  sentenceCount: number;
  prompt: string;
  charts: TidTask1ChartRecord[];
  paragraphs: Array<{
    section: string;
    en: string;
    vi: string;
    wordCount: number;
    sentencePairs?: Array<{ en: string; vi: string }>;
  }>;
};

const SECTION_FOCUS: Record<WritingSampleSection, string> = {
  introduction: 'Diễn đạt lại đề và xác định phạm vi số liệu.',
  overview: 'Tóm tắt xu hướng và so sánh nổi bật nhất.',
  body1: 'So sánh nhóm số liệu cụ thể thứ nhất bằng số liệu chính xác.',
  body2: 'Phát triển các so sánh còn lại và nêu mức chênh lệch.',
  conclusion: 'Chốt lại lập trường của người viết.',
};

export function adaptTidTask1Record(record: TidTask1Record): WritingSample & {
  sourceCharts: TidTask1ChartRecord[];
  sourceChartData: ChartData | null;
} {
  const id = `tid-t1-${slug(record.typeSlug)}-${record.sampleId}`;
  const chartKind = chartKindOf(record.typeSlug);

  return {
    id,
    task: 'ielts_task1',
    topicSlug: 'task1-charts',
    topicEn: 'Task 1 charts',
    topicVi: 'Biểu đồ Task 1',
    title: record.charts.map((chart) => chart.title).join(' · ') || `${record.type} #${record.sampleId}`,
    promptText: record.prompt,
    promptId: task1PromptId(record),
    chartKind,
    band: 9.0,
    bandLabel: 'Band 9',
    paragraphs: record.paragraphs.map((paragraph, index) => {
      const section = sectionOf(paragraph.section, index);
      const sourceSentences = paragraph.sentencePairs?.length
        ? paragraph.sentencePairs.map(({ en, vi }) => ({ en, vi }))
        : [{ en: paragraph.en, vi: paragraph.vi }];
      return {
        id: `${id}-p${index + 1}`,
        section,
        en: paragraph.en,
        vi: paragraph.vi,
        focusVi: SECTION_FOCUS[section],
        sourceSection: paragraph.section,
        sourceWords: paragraph.wordCount,
        sourceSentences,
      };
    }),
    vocabulary: [],
    sourceName: record.source,
    sourceUrl: record.sourceUrl,
    sourceTopic: record.topic,
    sourceSampleId: record.sampleId,
    sourceChartType: record.type,
    sourceWordCount: record.words,
    sourceSentenceCount: record.sentenceCount,
    sourceCharts: sourceChartsOf(record),
    sourceChartData: tidTask1ChartData(record),
  };
}

export function adaptTidTask1Records(records: TidTask1Record[]) {
  return records.map(adaptTidTask1Record);
}

export function tidTask1Prompt(record: TidTask1Record): WritingPrompt {
  return {
    id: task1PromptId(record),
    task: 'ielts_task1',
    promptText: record.prompt,
    chartKind: chartKindOf(record.typeSlug),
    chartData: tidTask1ChartData(record),
    essayKind: null,
    topicSlug: 'task1-charts',
    difficultyBand: 9.0,
    timeLimitSeconds: 1200,
    minWords: 150,
    source: 'curated',
    sourceUrl: record.sourceUrl,
    sourceCharts: sourceChartsOf(record),
  };
}

export function tidTask1Prompts(records: TidTask1Record[]): WritingPrompt[] {
  return records.map(tidTask1Prompt);
}

export function task1PromptId(record: TidTask1Record): string {
  return `w-tid-t1-${slug(record.typeSlug)}-${record.sampleId}`;
}

export function tidTask1ChartData(record: TidTask1Record): ChartData | null {
  const sourceCharts = sourceChartsOf(record);
  if (sourceCharts.length === 0 || sourceCharts.length > 2) return null;
  const fallbackKind = chartKindOf(record.typeSlug);
  const kinds = sourceCharts.map((chart) =>
    chartKindOf(chart.kind ?? chart.type ?? '')
      ?? (fallbackKind === 'mixed' ? chartKindOf(`${chart.title} ${chart.imageAlt ?? ''}`) : fallbackKind),
  );
  const parts = sourceCharts.map((chart, index) => toSimpleChart(chart, kinds[index]));
  if (parts.some((part) => part === null)) return null;
  if (parts.length === 1) return parts[0] ?? null;
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const firstKey = parts[0].analysisKey;
  const secondKey = parts[1].analysisKey;
  return {
    kind: 'mixed',
    title: sourceCharts.map((chart) => chart.title).join(' · '),
    parts: [parts[0], parts[1]],
    analysisKey: {
      trends: [...firstKey.trends, ...secondKey.trends],
      extremes: [...firstKey.extremes, ...secondKey.extremes],
      crossings: [...firstKey.crossings, ...secondKey.crossings],
      grouping: [
        [...firstKey.grouping[0], ...secondKey.grouping[0]],
        [...firstKey.grouping[1], ...secondKey.grouping[1]],
      ],
    },
  };
}

function sourceChartsOf(record: TidTask1Record): TidTask1ChartRecord[] {
  const recordKind = chartKindOf(record.typeSlug);
  return (record.charts ?? []).map((chart) => ({
    ...chart,
    kind: chart.kind ?? chart.type ?? (recordKind && recordKind !== 'mixed' ? recordKind : undefined),
  }));
}

function toSimpleChart(chart: TidTask1ChartRecord, kind?: Task1Chart): SimpleChartData | null {
  const table = chart.dataTables?.[0];
  if (kind === 'line' || kind === 'bar') {
    // Approximate values stay in the source table so the reader can see their
    // uncertainty; they are not plotted as exact measurements.
    if (chart.dataPrecision === 'approximate' || table?.dataPrecision === 'approximate') return null;
    if (!table?.rows.length) return null;
    const seriesNames = chart.series?.length ? chart.series : table.columns;
    // `deriveAnalysisKey` groups two or more series into the body paragraphs.
    // A single-series source chart remains available through `sourceCharts`,
    // but cannot support that comparison key without inventing a second group.
    if (seriesNames.length < 2) return null;
    const series = seriesNames.map((name, seriesIndex) => {
      const values = table.rows.map((row) => numberValue(row.values[seriesIndex]));
      if (values.some((value) => value === null)) return null;
      return { name, values: values as number[] };
    });
    if (series.some((item) => item === null)) return null;
    const base = {
      kind,
      title: chart.title,
      unit: chart.unit ?? '',
      xLabels: table.rows.map((row) => row.label),
      series: series as { name: string; values: number[] }[],
    };
    return { ...base, analysisKey: deriveAnalysisKey(base) };
  }

  // Pie, table, process, map and image-only source figures remain in their
  // source-faithful representation. The offline trend grader only accepts
  // numeric line/bar evidence, so do not manufacture trends for other types.
  return null;
}

function chartKindOf(value: string): Task1Chart | undefined {
  const normalized = value.toLowerCase();
  if (normalized.includes('mixed')) return 'mixed';
  if (normalized.includes('process') || normalized.includes('diagram')) return 'process';
  if (normalized.includes('map')) return 'map';
  if (normalized.includes('pie')) return 'pie';
  if (normalized.includes('table')) return 'table';
  if (normalized.includes('line')) return 'line';
  if (normalized.includes('bar')) return 'bar';
  return undefined;
}

function sectionOf(sourceSection: string, index: number): WritingSampleSection {
  const normalized = sourceSection.toLowerCase();
  if (normalized.includes('overview')) return 'overview';
  if (normalized.includes('introduction') || normalized.includes('mở bài')) return 'introduction';
  if (normalized.includes('detail 1') || normalized.includes('body 1') || normalized.includes('chi tiết 1')) return 'body1';
  if (normalized.includes('detail 2') || normalized.includes('body 2') || normalized.includes('chi tiết 2')) return 'body2';
  return (['introduction', 'overview', 'body1', 'body2'] as const)[index] ?? 'body2';
}

function numberValue(value: string | number | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value == null) return null;
  const cleaned = String(value).trim().replace(/,/g, '').replace(/%/g, '').replace(/[−–]/g, '-');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

