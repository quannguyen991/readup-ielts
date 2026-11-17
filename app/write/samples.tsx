import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { ChartFigure } from '@/components/writing/ChartFigure';
import { Task1SourceFigure } from '@/components/writing/Task1SourceFigure';
import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Button, Icon } from '@/components/ui';
import { getWritingPromptById } from '@/data/writing-repository';
import { WRITING_SAMPLES, type WritingSample } from '@/data/writing-samples';
import { WRITING_TOPICS } from '@/data/writing-topics';
import { useWritingSamplesStore } from '@/store/useWritingSamplesStore';
import { useL } from '@/i18n/useL';

type TaskFilter = 'all' | 'ielts_task1' | 'ielts_task2';

const TASK_CARDS = [
  { id: 'ielts_task1' as const, vi: 'Báo cáo biểu đồ', en: 'Academic report', noteVi: 'Biểu đồ · bản đồ · quy trình', noteEn: 'Charts · maps · processes' },
  { id: 'ielts_task2' as const, vi: 'Bài luận', en: 'Essay writing', noteVi: 'Lập luận · thảo luận · giải pháp', noteEn: 'Arguments · discussion · solutions' },
];

const CHART_LABELS: Record<string, string> = {
  line: 'Line graph', bar: 'Bar chart', pie: 'Pie chart', table: 'Table', mixed: 'Mixed charts', process: 'Process', map: 'Map',
};
const ESSAY_LABELS: Record<string, string> = {
  opinion: 'Opinion', discussion: 'Discussion', advantage_disadvantage: 'Advantage / disadvantage', problem_solution: 'Problem / solution', two_part: 'Two-part question',
};

export default function WritingSamplesScreen() {
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const [task, setTask] = useState<TaskFilter>('all');
  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const completed = useWritingSamplesStore((s) => s.completed);
  const drafts = useWritingSamplesStore((s) => s.drafts);
  const read = useWritingSamplesStore((s) => s.read);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    return WRITING_SAMPLES.filter((sample) => {
      if (task !== 'all' && sample.task !== task) return false;
      if (topic && sample.topicSlug !== topic) return false;
      if (q && !normalizeSearch([
        sample.title,
        sample.promptText,
        sample.topicEn,
        sample.topicVi,
        sample.sourceTopic,
        ...sample.paragraphs.flatMap((paragraph) => [paragraph.en, paragraph.vi, paragraph.focusVi]),
        ...sample.vocabulary.flatMap((item) => [item.phrase, item.meaningVi, item.noteVi]),
      ].filter(Boolean).join(' ')).includes(q)) return false;
      return true;
    });
  }, [task, topic, query]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sample of WRITING_SAMPLES) {
      if (task !== 'all' && sample.task !== task) continue;
      counts[sample.topicSlug] = (counts[sample.topicSlug] ?? 0) + 1;
    }
    return counts;
  }, [task]);

  const availableTopics = useMemo(() => WRITING_TOPICS.filter((item) => (topicCounts[item.slug] ?? 0) > 0), [topicCounts]);
  const summarySamples = useMemo(
    () => WRITING_SAMPLES.filter((sample) => (task === 'all' || sample.task === task) && (!topic || sample.topicSlug === topic)),
    [task, topic],
  );
  const summaryParagraphs = summarySamples.flatMap((sample) => sample.paragraphs.map((paragraph) => `${sample.id}:${paragraph.id}`));
  const summaryComplete = summaryParagraphs.filter((key) => Boolean(completed[key])).length;
  const summaryProgress = summaryParagraphs.length ? Math.round((summaryComplete / summaryParagraphs.length) * 100) : 0;
  const started = WRITING_SAMPLES.reduce((count, sample) => count + sample.paragraphs.filter((paragraph) => {
    const key = `${sample.id}:${paragraph.id}`;
    return Boolean(drafts[key]?.trim()) && !completed[key];
  }).length, 0);
  const translated = WRITING_SAMPLES.reduce((count, sample) => count + sample.paragraphs.filter((paragraph) => Boolean(completed[`${sample.id}:${paragraph.id}`])).length, 0);
  const translationTotal = WRITING_SAMPLES.reduce((count, sample) => count + sample.paragraphs.length, 0);
  const readCount = WRITING_SAMPLES.filter((sample) => Boolean(read[sample.id])).length;
  const task1Count = WRITING_SAMPLES.filter((sample) => sample.task === 'ielts_task1').length;
  const task2Count = WRITING_SAMPLES.filter((sample) => sample.task === 'ielts_task2').length;
  const tidCount = WRITING_SAMPLES.filter((sample) => sample.sourceName === 'The IELTS Dictionary').length;
  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sample of summarySamples) {
      const key = sample.task === 'ielts_task1' ? sample.chartKind : sample.essayKind;
      if (key) counts[`${sample.task}:${key}`] = (counts[`${sample.task}:${key}`] ?? 0) + 1;
    }
    return Object.entries(counts).map(([key, count]) => {
      const [sampleTask, kind] = key.split(':');
      const label = sampleTask === 'ielts_task1' ? CHART_LABELS[kind ?? ''] : ESSAY_LABELS[kind ?? ''];
      return { key, label: label ?? kind ?? key, count, task1: sampleTask === 'ielts_task1' };
    }).sort((a, b) => Number(b.task1) - Number(a.task1) || a.label.localeCompare(b.label));
  }, [summarySamples]);
  const selectedTopic = topic ? WRITING_TOPICS.find((item) => item.slug === topic) : null;

  return (
    <Screen>
      <Pressable onPress={() => router.push('/write' as never)} className="mb-3 flex-row items-center gap-1.5 self-start">
        <Icon name="chevron-left" size={16} color="#64748B" />
        <Text className="font-semi text-body text-muted">{L('Writing', 'Writing')}</Text>
      </Pressable>

      <View className="overflow-hidden rounded-[24px] border border-[#D9E5F2] bg-white">
        <View className="flex-row flex-wrap items-end justify-between gap-5 px-5 py-6 md:px-8 md:py-8" style={{ backgroundColor: '#F0F5FC' }}>
          <View className="min-w-0 flex-1" style={{ maxWidth: 720 }}>
            <Text className="font-heavy" style={{ color: '#426A9F', fontSize: 11, letterSpacing: 1.7 }}>IELTS WRITING · STUDY LIBRARY</Text>
            <Text className="mt-2 font-nun-heavy text-pageTitle text-ink">{L('Bài mẫu IELTS Writing', 'IELTS Writing samples')}</Text>
            <Text className="mt-2 font-nun text-bodyLg text-muted" style={{ lineHeight: 25 }}>
              {L('Đọc bài mẫu song ngữ, xem vai trò từng đoạn, học theo từng câu và luyện dịch Việt → Anh.', 'Read bilingual model answers, study each paragraph and sentence, then practise translating Vietnamese → English.')}
            </Text>
          </View>
          <Button variant="brand" label={L('Đến kho đề luyện', 'Go to writing prompts')} onPress={() => router.push('/write/tests' as never)} />
        </View>
        <View className="flex-row flex-wrap gap-2 border-t border-[#DDE7F1] px-5 py-4 md:px-8">
          <Stat value={String(WRITING_SAMPLES.length)} label={L('bài mẫu', 'model answers')} />
          <Stat value={String(availableTopicCount())} label={L('chủ đề', 'topics')} />
          {tidCount ? <Stat value={String(tidCount)} label={L('mẫu TID đã lưu', 'TID source samples')} /> : null}
          <Stat value={`${readCount}/${WRITING_SAMPLES.length}`} label={L('bài đã đọc', 'samples read')} />
          <Stat value={`${translated}/${translationTotal}`} label={L('đoạn đã dịch', 'paragraphs translated')} />
          {started > 0 ? <Stat value={String(started)} label={L('bản nháp đang viết', 'translation drafts')} /> : null}
        </View>
      </View>

      <View className="mt-6 gap-4">
        <View style={{ flexDirection: width >= 740 ? 'row' : 'column', gap: 12 }}>
          {TASK_CARDS.map((card) => {
            const selected = task === card.id;
            const count = card.id === 'ielts_task1' ? task1Count : task2Count;
            return (
              <TaskSelectorCard
                key={card.id}
                title={card.id === 'ielts_task1' ? 'TASK 1' : 'TASK 2'}
                subtitle={en ? card.en : card.vi}
                note={en ? card.noteEn : card.noteVi}
                count={count}
                active={selected}
                onPress={() => { setTask(selected ? 'all' : card.id); setTopic(null); }}
                width={width >= 740 ? '50%' : '100%'}
              />
            );
          })}
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          <FilterPill label={L(`Tất cả · ${WRITING_SAMPLES.length}`, `All tasks · ${WRITING_SAMPLES.length}`)} active={task === 'all'} onPress={() => { setTask('all'); setTopic(null); }} />
          <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-[#D6E1EF] bg-white px-3" style={{ minHeight: 44, minWidth: Math.min(340, Math.max(220, width - 64)) }}>
            <Icon name="search" size={15} color="#718096" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={L('Tìm bài, đề, chủ đề hoặc cụm từ…', 'Search samples, prompts, topics or phrases…')}
              placeholderTextColor="#8794A0"
              className="min-w-0 flex-1 font-nun text-body text-ink"
              style={{ paddingVertical: 8, outlineStyle: 'none' } as object}
              accessibilityLabel={L('Tìm bài mẫu', 'Search model answers')}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
          <TopicChip label={L('Mọi chủ đề', 'All topics')} count={WRITING_SAMPLES.filter((sample) => task === 'all' || sample.task === task).length} active={topic === null} onPress={() => setTopic(null)} />
          {availableTopics.map((item) => (
            <TopicChip key={item.slug} label={en ? item.en : item.vi} count={topicCounts[item.slug] ?? 0} active={topic === item.slug} onPress={() => setTopic(topic === item.slug ? null : item.slug)} />
          ))}
        </ScrollView>

        <View className="overflow-hidden rounded-2xl border border-[#D8E3F1] bg-white">
          <View className="flex-row flex-wrap items-start justify-between gap-3 px-4 py-4 md:px-5" style={{ backgroundColor: '#F5F8FD' }}>
            <View className="min-w-0 flex-1">
              <Text className="font-heavy" style={{ color: '#5578A7', fontSize: 10, letterSpacing: 1.2 }}>{L('TÓM TẮT BỘ LỌC', 'CURRENT SELECTION')}</Text>
              <Text className="mt-1 font-nun-heavy text-cardTitle text-ink">{selectedTopic ? (en ? selectedTopic.en : selectedTopic.vi) : L('Tất cả chủ đề', 'All topics')}</Text>
              <Text className="mt-1 font-nun text-label text-muted">
                {L(`${summarySamples.length} bài mẫu · ${summarySamples.filter((sample) => sample.task === 'ielts_task1').length} Task 1 · ${summarySamples.filter((sample) => sample.task === 'ielts_task2').length} Task 2`, `${summarySamples.length} samples · ${summarySamples.filter((sample) => sample.task === 'ielts_task1').length} Task 1 · ${summarySamples.filter((sample) => sample.task === 'ielts_task2').length} Task 2`)}
              </Text>
            </View>
            <View className="rounded-xl border border-[#DCE6F2] bg-white px-3 py-2">
              <Text className="font-nun-heavy text-body" style={{ color: '#3767A4' }}>{summaryComplete}/{summaryParagraphs.length}</Text>
              <Text className="font-nun text-[10px] text-muted">{L('đoạn đã dịch', 'paragraphs translated')}</Text>
            </View>
          </View>
          <View className="gap-2 px-4 pb-4 md:px-5">
            <View className="flex-row flex-wrap items-center gap-1.5">
              {formatCounts.length ? formatCounts.map((item) => (
                <FormatChip key={item.key} label={item.label} count={item.count} task1={item.task1} />
              )) : <Text className="font-nun text-label text-muted">{L('Chưa có dạng bài trong bộ lọc này.', 'No formats in this selection yet.')}</Text>}
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-[#E6EDF6]">
              <View className="h-full rounded-full" style={{ width: `${summaryProgress}%`, backgroundColor: '#4778B7' }} />
            </View>
            <Text className="font-nun text-[10px] text-muted">{L(`${summaryProgress}% tiến độ luyện dịch trong nhóm đang xem`, `${summaryProgress}% translation progress in this selection`)}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap items-center justify-between gap-2 border-b border-[#DCE4EE] pb-3">
          <Text className="font-nun-strong text-body text-ink">{L('Bài mẫu', 'Model answers')}</Text>
          <Text className="font-nun-mid text-label text-muted">{L(`${filtered.length} / ${summarySamples.length} bài`, `${filtered.length} / ${summarySamples.length} samples`)}</Text>
        </View>

        {filtered.length ? (
          topic ? (
            <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={16}>
              {filtered.map((sample) => (
                <SampleCard key={sample.id} sample={sample} completed={completed} read={read} width={width} />
              ))}
            </Grid>
          ) : (
            <View className="gap-5">
              {availableTopics.map((topicItem) => {
                const topicSamples = filtered.filter((sample) => sample.topicSlug === topicItem.slug);
                return topicSamples.length ? (
                  <TopicSection
                    key={topicItem.slug}
                    topic={topicItem}
                    samples={topicSamples}
                    completed={completed}
                    read={read}
                    width={width}
                  />
                ) : null;
              })}
            </View>
          )
        ) : (
          <View className="rounded-2xl border border-dashed border-[#C8D5DB] bg-white px-5 py-8">
            <Text className="font-nun-strong text-body text-ink">{L('Chưa có bài nào khớp', 'No matching samples')}</Text>
            <Text className="mt-1 font-nun text-label text-muted">{L('Thử bỏ một bộ lọc hoặc tìm bằng từ khác.', 'Remove a filter or try a different search.')}</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

function availableTopicCount(): number {
  return new Set(WRITING_SAMPLES.map((sample) => sample.topicSlug)).size;
}

/** Search the actual model text and vocabulary too; Vietnamese queries ignore tone marks. */
function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

function TaskSelectorCard({
  title,
  subtitle,
  note,
  count,
  active,
  onPress,
  width,
}: {
  title: string;
  subtitle: string;
  note: string;
  count: number;
  active: boolean;
  onPress: () => void;
  width: '50%' | '100%';
}) {
  const { L } = useL();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        width,
        flex: width === '50%' ? 1 : undefined,
        minHeight: 102,
        justifyContent: 'space-between',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: active ? '#244F85' : '#D5E0EE',
        backgroundColor: active ? '#244F85' : '#FFFFFF',
        paddingHorizontal: 18,
        paddingVertical: 15,
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="self-start rounded-md px-2 py-1" style={{ backgroundColor: active ? 'rgba(255,255,255,0.15)' : '#EAF1FA' }}>
            <Text className="font-nun-heavy" style={{ color: active ? '#FFFFFF' : '#39679F', fontSize: 10, letterSpacing: 0.7 }}>{title}</Text>
          </View>
          <Text className="mt-2 font-nun-heavy" style={{ color: active ? '#FFFFFF' : '#1F3147', fontSize: 19 }}>{subtitle}</Text>
          <Text className="mt-1 font-nun text-label" style={{ color: active ? '#D6E3F3' : '#718197' }}>{note}</Text>
        </View>
        <View className="items-end">
          <Text className="font-nun-heavy" style={{ color: active ? '#FFFFFF' : '#244F85', fontSize: 24, lineHeight: 29 }}>{count}</Text>
          <Text className="font-nun text-[10px]" style={{ color: active ? '#D6E3F3' : '#718197' }}>{L('bài mẫu', 'samples')}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="mr-1 flex-row items-baseline gap-2 rounded-lg border border-[#DCE6F2] bg-white px-3 py-2">
      <Text className="font-nun-heavy text-body" style={{ color: '#315F96' }}>{value}</Text>
      <Text className="font-nun text-label text-muted">{label}</Text>
    </View>
  );
}

function FilterPill({ label, active, onPress, compact = false }: { label: string; active: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="rounded-full border px-3.5"
      style={{ minHeight: compact ? 34 : 40, justifyContent: 'center', backgroundColor: active ? '#244F85' : '#FFFFFF', borderColor: active ? '#244F85' : '#D6E1EF' }}
    >
      <Text className="font-nun-strong text-label" style={{ color: active ? '#FFFFFF' : '#425563' }}>{label}</Text>
    </Pressable>
  );
}

function TopicChip({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-row items-center gap-2 rounded-full border px-3.5"
      style={{ minHeight: 36, backgroundColor: active ? '#244F85' : '#FFFFFF', borderColor: active ? '#244F85' : '#D6E1EF' }}
    >
      <Text className="font-nun-strong text-label" style={{ color: active ? '#FFFFFF' : '#465A72' }}>{label}</Text>
      <Text className="rounded-full px-1.5 py-0.5 font-nun-heavy" style={{ color: active ? '#244F85' : '#55708D', backgroundColor: active ? '#FFFFFF' : '#EDF3FA', fontSize: 10, lineHeight: 14 }}>{count}</Text>
    </Pressable>
  );
}

function FormatChip({ label, count, task1 }: { label: string; count: number; task1: boolean }) {
  const tone = task1 ? { fg: '#355F91', bg: '#EAF1FB', dot: '#5B83B7' } : { fg: '#5A4D83', bg: '#F0EDFA', dot: '#8979B7' };
  return (
    <View className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5" style={{ backgroundColor: tone.bg }}>
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.dot }} />
      <Text className="font-nun-mid" style={{ color: tone.fg, fontSize: 10 }}>{label}</Text>
      <Text className="font-nun-heavy" style={{ color: tone.fg, fontSize: 10 }}>{count}</Text>
    </View>
  );
}

function TopicSection({
  topic,
  samples,
  completed,
  read,
  width,
}: {
  topic: (typeof WRITING_TOPICS)[number];
  samples: WritingSample[];
  completed: Record<string, string>;
  read: Record<string, string>;
  width: number;
}) {
  const { L, en } = useL();
  const counts: Record<string, number> = {};
  for (const sample of samples) {
    const kind = sample.task === 'ielts_task1' ? sample.chartKind : sample.essayKind;
    if (kind) counts[`${sample.task}:${kind}`] = (counts[`${sample.task}:${kind}`] ?? 0) + 1;
  }
  const formats = Object.entries(counts).map(([key, count]) => {
    const [sampleTask, kind] = key.split(':');
    const task1 = sampleTask === 'ielts_task1';
    const labels = task1 ? CHART_LABELS : ESSAY_LABELS;
    return { key, count, task1, label: labels[kind ?? ''] ?? kind ?? key };
  });

  return (
    <View className="gap-3 rounded-2xl border border-[#D8E3F1] bg-white p-3.5 md:p-4">
      <View className="flex-row flex-wrap items-center justify-between gap-3 rounded-xl px-3.5 py-3" style={{ backgroundColor: '#EAF1FB' }}>
        <View className="min-w-0 flex-1">
          <Text className="font-nun-heavy text-body" style={{ color: '#315F96' }}>{en ? topic.en : topic.vi}</Text>
          <Text className="mt-0.5 font-nun text-label text-muted">{L(`${samples.length} bài trong kết quả`, `${samples.length} samples in results`)}</Text>
        </View>
        <View className="flex-row flex-wrap gap-1.5">
          {formats.map((format) => <FormatChip key={format.key} label={format.label} count={format.count} task1={format.task1} />)}
        </View>
      </View>
      <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
        {samples.map((sample) => <SampleCard key={sample.id} sample={sample} completed={completed} read={read} width={width} />)}
      </Grid>
    </View>
  );
}

function SampleCard({ sample, completed, read, width }: { sample: WritingSample; completed: Record<string, string>; read: Record<string, string>; width: number }) {
  const { L, en } = useL();
  const task1 = sample.task === 'ielts_task1';
  const prompt = sample.promptId ? getWritingPromptById(sample.promptId) : undefined;
  const completeCount = sample.paragraphs.filter((paragraph) => completed[`${sample.id}:${paragraph.id}`]).length;
  const wasRead = Boolean(read[sample.id]);
  const figureWidth = Math.min(440, Math.max(220, width >= 1024 ? (width - 200) / 3 : width >= 640 ? (width - 120) / 2 : width - 80));
  const excerpt = sample.paragraphs[0]?.en ?? sample.promptText;
  const sourceChartData = prompt?.chartData ?? sample.sourceChartData;

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/write/samples/${sample.id}` as never)}
      className="overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: '#D8E2EF', shadowColor: '#1B3657', shadowOpacity: 0.045, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
    >
      <View className="items-center justify-center overflow-hidden border-b border-[#E1E8F0]" style={{ minHeight: 174, backgroundColor: '#F5F8FC' }}>
        {task1 && sourceChartData ? <ChartFigure data={sourceChartData} width={figureWidth} />
          : task1 && sample.sourceCharts?.length ? <Task1SourceFigure charts={sample.sourceCharts} compact english={en} />
            : task1 ? <Task1SourceFigure charts={prompt?.sourceCharts ?? []} compact english={en} />
              : <EssayShape sample={sample} english={en} />}
      </View>
      <View className="gap-2.5 p-4">
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="rounded-md px-2.5 py-1" style={{ backgroundColor: task1 ? '#E7F0FB' : '#EFEDFA' }}>
            <Text className="font-nun-heavy" style={{ color: task1 ? '#315F96' : '#5A4D83', fontSize: 10, letterSpacing: 0.4 }}>
              {task1 ? 'TASK 1' : 'TASK 2'} · {sample.bandLabel ?? `BAND ${sample.band.toFixed(1)}`}
            </Text>
          </View>
          {sample.sourceName ? <SourceBadge /> : null}
          <Text className="font-nun-mid text-label text-muted">{en ? sample.topicEn : sample.topicVi}</Text>
          <View className="rounded-full px-2 py-1" style={{ backgroundColor: task1 ? '#F1F5FA' : '#F4F1FA' }}>
            <Text className="font-nun-heavy" style={{ color: task1 ? '#506C8F' : '#675A8E', fontSize: 9 }}>
              {task1 ? sample.chartKind?.toUpperCase() : ESSAY_LABELS[sample.essayKind ?? ''] ?? 'Essay'}
            </Text>
          </View>
          {wasRead ? <Icon name="check" size={13} color="#138256" /> : null}
        </View>
        <Text className="font-nun-heavy text-ink" numberOfLines={2} style={{ fontSize: 17, lineHeight: 23 }}>{sample.title}</Text>
        <Text className="font-nun text-label text-muted" numberOfLines={2} style={{ lineHeight: 19 }}>{excerpt}</Text>
        <View className="flex-row items-center justify-between border-t border-[#E1E8F0] pt-2.5">
          <Text className="font-nun-mid text-label text-muted">{L(`${completeCount}/${sample.paragraphs.length} đoạn đã dịch`, `${completeCount}/${sample.paragraphs.length} paragraphs translated`)}</Text>
          <View className="flex-row items-center gap-1">
            <Text className="font-nun-heavy text-label" style={{ color: '#315F96' }}>{L('Đọc bài', 'Read sample')}</Text>
            <Icon name="arrow-right" size={13} color="#315F96" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function SourceBadge() {
  return (
    <View className="rounded-md border border-[#D4DFD4] bg-[#F2F7EF] px-2 py-1">
      <Text className="font-nun-heavy" style={{ color: '#587347', fontSize: 9, letterSpacing: 0.45 }}>TID SOURCE</Text>
    </View>
  );
}

const ESSAY_FLOW: Record<string, { en: string[]; vi: string[]; accent: string }> = {
  opinion: { en: ['Position', 'Reason', 'Support', 'Verdict'], vi: ['Lập trường', 'Lý do', 'Dẫn chứng', 'Kết luận'], accent: '#315F96' },
  discussion: { en: ['View A', 'View B', 'My view', 'Verdict'], vi: ['Ý kiến A', 'Ý kiến B', 'Quan điểm', 'Kết luận'], accent: '#71579E' },
  advantage_disadvantage: { en: ['Benefits', 'Drawbacks', 'Balance', 'Verdict'], vi: ['Lợi ích', 'Bất lợi', 'Cân nhắc', 'Kết luận'], accent: '#A65A32' },
  problem_solution: { en: ['Problem', 'Causes', 'Actions', 'Outcome'], vi: ['Vấn đề', 'Nguyên nhân', 'Giải pháp', 'Kết quả'], accent: '#2E7D6B' },
  two_part: { en: ['Answer 1', 'Answer 2', 'Develop', 'Wrap up'], vi: ['Trả lời 1', 'Trả lời 2', 'Phát triển', 'Chốt ý'], accent: '#9A5570' },
};

function EssayShape({ sample, english }: { sample: WritingSample; english: boolean }) {
  const kind = sample.essayKind ?? 'opinion';
  const flow = ESSAY_FLOW[kind] ?? ESSAY_FLOW.opinion!;
  const kindLabel = ESSAY_LABELS[kind] ?? 'Essay';
  return (
    <View className="w-full justify-between px-4 py-3.5" style={{ maxWidth: 440, minHeight: 174, backgroundColor: '#F4F5F2' }}>
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: flow.accent }}>
            <Text className="font-nun-heavy" style={{ color: '#FFFFFF', fontSize: 11 }}>02</Text>
          </View>
          <View>
            <Text className="font-nun-heavy" style={{ color: '#748079', fontSize: 8, letterSpacing: 1.1 }}>{english ? 'MODEL ESSAY' : 'BÀI LUẬN MẪU'}</Text>
            <Text className="font-nun-mid" style={{ color: '#263932', fontSize: 10 }}>{english ? 'Argument map' : 'Sơ đồ lập luận'}</Text>
          </View>
        </View>
        <View className="rounded-full border px-2 py-1" style={{ borderColor: `${flow.accent}55`, backgroundColor: '#FFFFFF' }}>
          <Text className="font-nun-heavy" numberOfLines={1} style={{ color: flow.accent, fontSize: 8 }}>{kindLabel.toUpperCase()}</Text>
        </View>
      </View>

      <View className="mt-2 min-w-0">
        <Text className="font-nun-heavy" numberOfLines={1} style={{ color: flow.accent, fontSize: 9, letterSpacing: 0.8 }}>{(english ? sample.topicEn : sample.topicVi).toUpperCase()}</Text>
        <Text className="mt-1 font-nun-heavy" numberOfLines={2} style={{ color: '#1F3029', fontSize: 14, lineHeight: 18 }}>{sample.title}</Text>
      </View>

      <View className="mt-2 flex-row gap-1.5">
        {flow[english ? 'en' : 'vi'].map((step, index) => (
          <View key={`${kind}-${index}`} className="min-w-0 flex-1 rounded-lg border px-1.5 py-1.5" style={{ borderColor: '#DFE4DE', backgroundColor: '#FFFFFF' }}>
            <Text className="font-nun-heavy" style={{ color: flow.accent, fontSize: 8 }}>{String(index + 1).padStart(2, '0')}</Text>
            <Text className="mt-0.5 font-nun-mid" numberOfLines={2} style={{ color: '#45554E', fontSize: 8, lineHeight: 10 }}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
