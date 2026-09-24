import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
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
import { CrossFade } from '@/components/motion/Motion';

/**
 * Kho đề Writing.
 *
 * Ba tab theo đúng ba thứ người học chọn giữa: Task 1, Task 2, SAT Writing.
 * Tab SAT vẫn hiện dù chưa dựng — nói rõ còn thiếu gì tốt hơn là giấu tab đi
 * rồi người dùng tưởng app không có phần đó.
 */

type Tab = WritingTask | 'sat';

const TABS: readonly { key: Tab; label: string }[] = [
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
  /** Loại biểu đồ (Task 1) hoặc dạng luận (Task 2) — hai tab dùng chung một ô trạng thái. */
  const [kind, setKind] = useState<string | undefined>(undefined);
  const [visible, setVisible] = useState(6);

  const stats = useMemo(() => writingLibraryStats(), []);

  const prompts = useMemo(() => {
    if (tab === 'sat') return [];
    const filters: WritingPromptFilters = {
      task: tab,
      topicSlug: topic,
      maxBand,
      ...(tab === 'ielts_task1'
        ? { chartKind: kind as WritingPromptFilters['chartKind'] }
        : { essayKind: kind as WritingPromptFilters['essayKind'] }),
    };
    return filterWritingPrompts(filters);
  }, [tab, topic, maxBand, kind]);

  /*
    Đếm số đề của từng loại NGAY TRÊN nút lọc.

    Không có con số thì người học phải bấm thử từng loại mới biết loại nào có
    nhiều đề — và loại rỗng thì bấm vào chỉ nhận về một màn trống. Đếm theo tab
    và bỏ qua các bộ lọc khác, để con số không nhảy mỗi lần đổi chủ đề.
  */
  const kindCounts = useMemo(() => {
    if (tab === 'sat') return [] as { key: string; label: string; count: number }[];
    const all = filterWritingPrompts({ task: tab });
    const keys =
      tab === 'ielts_task1'
        ? Object.keys(CHART_LABEL)
        : (Object.keys(ESSAY_LABEL) as string[]);
    return keys
      .map((key) => ({
        key,
        label: (tab === 'ielts_task1' ? CHART_LABEL : (ESSAY_LABEL as Record<string, string>))[key] ?? key,
        count: all.filter((p) => (tab === 'ielts_task1' ? p.chartKind : p.essayKind) === key).length,
      }))
      .filter((k) => k.count > 0);
  }, [tab]);

  /** Đổi tab thì bỏ bộ lọc con: giữ lại dễ rơi vào tổ hợp rỗng khó hiểu. */
  const selectTab = (next: Tab) => {
    setTab(next);
    setTopic(undefined);
    setMaxBand(undefined);
    setKind(undefined);
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

      <CrossFade swapKey={tab}>
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
            <Text className="font-semi text-label text-muted">
              {tab === 'ielts_task1' ? 'Loại biểu đồ' : 'Dạng luận'}
            </Text>
            <Chip label="Tất cả" active={kind === undefined} onPress={() => setKind(undefined)} />
            {kindCounts.map((k) => (
              <Chip
                key={k.key}
                label={`${k.label} · ${k.count}`}
                active={kind === k.key}
                onPress={() => setKind(kind === k.key ? undefined : k.key)}
              />
            ))}
          </View>

          <View className="mt-2 flex-row flex-wrap items-center gap-2">
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
            <Grid columns={2} tabletColumns={1} mobileColumns={1}>
              {prompts.slice(0, visible).map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </Grid>
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
      </CrossFade>
    </Screen>
  );
}

/*
  Thẻ đề dạng LƯỚI: ảnh bên trái, chữ bên phải.

  Bản trước xếp dọc — nhãn, đề bài, rồi biểu đồ rộng 600px, rồi hai nút. Một
  thẻ như vậy cao gần một màn hình, nên duyệt 24 đề là cuộn hai chục lần và
  không lần nào thấy được hai đề cạnh nhau để so.

  Ảnh nằm trái và chữ nằm phải thì một thẻ cao bằng một phần tư, hai thẻ đứng
  cạnh nhau, và cái người ta thật sự dùng để chọn đề — LOẠI BIỂU ĐỒ trông ra
  sao — hiện ngay chứ không phải cuộn xuống mới thấy.
*/
function PromptCard({ prompt }: { prompt: WritingPrompt }) {
  const kindLabel =
    prompt.task === 'ielts_task1'
      ? (CHART_LABEL[prompt.chartKind ?? ''] ?? 'Task 1')
      : prompt.essayKind
        ? ESSAY_LABEL[prompt.essayKind]
        : 'Task 2';

  return (
    <View
      className="h-full overflow-hidden rounded-card bg-surface"
      style={{ borderWidth: 1.5, borderColor: color.border }}
    >
      <View className="flex-row">
        <View
          className="items-center justify-center p-2.5"
          style={{ width: 168, backgroundColor: color.surfaceAlt }}
        >
          {prompt.chartData ? (
            <ChartFigure data={prompt.chartData} width={148} />
          ) : (
            <EssayTile kind={kindLabel} />
          )}
        </View>

        <View className="min-w-0 flex-1 p-4">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Badge tone="primary" label={prompt.task === 'ielts_task1' ? 'Task 1' : 'Task 2'} />
            <Badge tone="neutral" label={kindLabel} />
          </View>

          <Text className="mt-2 font-semi text-body text-ink" numberOfLines={4}>
            {prompt.promptText}
          </Text>

          <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <View className="flex-row items-center gap-1">
              <Icon name="clock" size={13} color={color.muted} />
              <Text className="font-sans text-label text-muted">
                {Math.round(prompt.timeLimitSeconds / 60)} phút
              </Text>
            </View>
            <Text className="font-sans text-label text-muted">≥ {prompt.minWords} từ</Text>
            <Text className="font-sans text-label text-muted">
              Band {prompt.difficultyBand.toFixed(1)}
            </Text>
          </View>

          <View className="flex-1" />

          <View className="mt-3 flex-row flex-wrap gap-2">
            <Button
              size="sm"
              label="Vào phòng viết"
              onPress={() => router.push(`/write/${prompt.id}` as never)}
            />
            <Button
              size="sm"
              variant="outline"
              label="Luyện từng phần"
              onPress={() => router.push(`/write/drill/${prompt.id}` as never)}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Ô hình cho đề Task 2 — dạng luận không có biểu đồ để hiện.
 *
 * Không mượn ảnh minh hoạ từ đâu: đề Task 2 là chữ, và một tấm ảnh stock gắn
 * vào chỉ để lấp chỗ trống sẽ gợi sai chủ đề nhiều hơn là giúp chọn đề. Cái ô
 * này nói đúng thứ có thật — đây là dạng luận gì.
 */
function EssayTile({ kind }: { kind: string }) {
  return (
    <View
      className="h-[92px] w-full items-center justify-center rounded-panel bg-surface px-2"
      style={{ borderWidth: 1, borderColor: color.border }}
    >
      <Icon name="pencil" size={20} color={color.muted} />
      <Text className="mt-1.5 text-center font-semi text-label text-muted" numberOfLines={2}>
        {kind}
      </Text>
    </View>
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
      aria-selected={active}
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
