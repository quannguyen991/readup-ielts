import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
import { ChartFigure } from '@/components/writing/ChartFigure';
import {
  filterWritingPrompts,
  writingLibraryStats,
  type WritingPromptFilters,
} from '@/data/writing-repository';
import { TOPICS } from '@/data/articles';
import { color } from '@/theme/tokens';
import type { Task2Essay, WritingPrompt, WritingTask } from '@/lib/writing/types';

/**
 * Kho đề Writing.
 *
 * Ba tab theo đúng ba thứ người học chọn giữa: Task 1, Task 2, SAT Writing.
 * Tab SAT vẫn hiện dù chưa dựng — nói rõ còn thiếu gì tốt hơn là giấu tab đi
 * rồi người dùng tưởng app không có phần đó.
 */

type Tab = WritingTask | 'sat';

const TABS: ReadonlyArray<{ key: Tab; label: string }> = [
  { key: 'ielts_task1', label: 'Task 1' },
  { key: 'ielts_task2', label: 'Task 2' },
  { key: 'sat', label: 'SAT Writing' },
];

const ESSAY_LABEL: Record<Task2Essay, string> = {
  opinion: 'Opinion',
  discussion: 'Discussion',
  advantage_disadvantage: 'Advantages / Disadvantages',
  problem_solution: 'Problem / Solution',
  two_part: 'Two-part question',
};

const CHART_LABEL: Record<string, string> = {
  line: 'Line graph',
  bar: 'Bar chart',
  pie: 'Pie chart',
  table: 'Table',
  mixed: 'Mixed charts',
  process: 'Process',
  map: 'Map',
};

const BAND_FILTERS = [
  { label: 'Tất cả', value: undefined },
  { label: 'Đến 6.0', value: 6.0 },
  { label: 'Đến 6.5', value: 6.5 },
] as const;

export default function WritingLibraryScreen() {
  const [tab, setTab] = useState<Tab>('ielts_task1');
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [maxBand, setMaxBand] = useState<number | undefined>(undefined);
  const [visible, setVisible] = useState(6);

  const stats = useMemo(() => writingLibraryStats(), []);

  const prompts = useMemo(() => {
    if (tab === 'sat') return [];
    const filters: WritingPromptFilters = { task: tab, topicSlug: topic, maxBand };
    return filterWritingPrompts(filters);
  }, [tab, topic, maxBand]);

  /** Đổi tab thì bỏ bộ lọc con: giữ lại dễ rơi vào tổ hợp rỗng khó hiểu. */
  const selectTab = (next: Tab) => {
    setTab(next);
    setTopic(undefined);
    setMaxBand(undefined);
    setVisible(6);
  };

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Luyện viết</Text>
      <Text className="mt-1 font-sans text-bodyLg text-muted">
        {stats.total} đề — {stats.byTask.ielts_task1} đề Task 1 và {stats.byTask.ielts_task2} đề
        Task 2.
      </Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {TABS.map((t) => (
          <Chip key={t.key} label={t.label} active={tab === t.key} onPress={() => selectTab(t.key)} />
        ))}
      </View>

      {tab === 'sat' ? (
        <Card className="mt-5">
          <Text className="font-heavy text-cardTitle text-ink">SAT Writing</Text>
          <Text className="mt-2 font-sans text-body text-muted">
            Hai nhóm kỹ năng viết của SAT Reading and Writing: Expression of Ideas (Transitions,
            Rhetorical Synthesis) và Standard English Conventions (Boundaries, Form / Structure /
            Sense). Toàn bộ là câu hỏi trắc nghiệm — bài thi số hoá hiện nay không còn phần viết luận.
          </Text>
          <Text className="mt-2 font-sans text-label text-muted">
            Câu hỏi dựng tại chỗ từ kho passage SAT đã có trong app.
          </Text>
          <View className="mt-4 flex-row">
            <Button label="Bắt đầu luyện" onPress={() => router.push('/write/sat' as never)} />
          </View>
        </Card>
      ) : (
        <>
          <View className="mt-4 flex-row flex-wrap items-center gap-2">
            <Text className="font-semi text-label text-muted">Chủ đề</Text>
            <Chip label="Tất cả" active={topic === undefined} onPress={() => setTopic(undefined)} />
            {TOPICS.map((t) => (
              <Chip
                key={t.slug}
                label={t.name}
                active={topic === t.slug}
                onPress={() => setTopic(topic === t.slug ? undefined : t.slug)}
              />
            ))}
          </View>

          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <Text className="font-semi text-label text-muted">Band mục tiêu</Text>
            {BAND_FILTERS.map((b) => (
              <Chip
                key={b.label}
                label={b.label}
                active={maxBand === b.value}
                onPress={() => setMaxBand(b.value)}
              />
            ))}
          </View>

          <SectionHeader title={`${prompts.length} đề phù hợp`} />

          {prompts.length === 0 ? (
            <Card>
              <Text className="font-sans text-body text-muted">
                Không có đề nào khớp bộ lọc. Bỏ bớt một điều kiện để xem thêm.
              </Text>
            </Card>
          ) : (
            <View className="gap-3">
              {prompts.slice(0, visible).map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </View>
          )}

          {visible < prompts.length ? (
            <View className="mt-4 items-center">
              <Button
                variant="outline"
                label={`Xem thêm ${Math.min(6, prompts.length - visible)} đề`}
                onPress={() => setVisible((v) => v + 6)}
              />
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function PromptCard({ prompt }: { prompt: WritingPrompt }) {
  const kindLabel =
    prompt.task === 'ielts_task1'
      ? (CHART_LABEL[prompt.chartKind ?? ''] ?? 'Task 1')
      : prompt.essayKind
        ? ESSAY_LABEL[prompt.essayKind]
        : 'Task 2';

  return (
    <Card>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge tone="primary" label={prompt.task === 'ielts_task1' ? 'Task 1' : 'Task 2'} />
        <Badge tone="neutral" label={kindLabel} />
        <View className="flex-row items-center gap-1">
          <Icon name="clock" size={14} color={color.muted} />
          <Text className="font-sans text-label text-muted">
            {Math.round(prompt.timeLimitSeconds / 60)} phút
          </Text>
        </View>
        <Text className="font-sans text-label text-muted">≥ {prompt.minWords} từ</Text>
        <Text className="font-sans text-label text-muted">Band {prompt.difficultyBand.toFixed(1)}</Text>
      </View>

      <Text className="mt-3 font-sans text-body text-ink">{prompt.promptText}</Text>

      {prompt.chartData ? (
        <View className="mt-3">
          <ChartFigure data={prompt.chartData} width={600} />
        </View>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button label="Vào phòng viết" onPress={() => router.push(`/write/${prompt.id}` as never)} />
        <Button
          variant="outline"
          label="Luyện từng phần"
          onPress={() => router.push(`/write/drill/${prompt.id}` as never)}
        />
      </View>
    </Card>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={[
        'rounded-pill border px-3 py-1.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
      ].join(' ')}
    >
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-body'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
