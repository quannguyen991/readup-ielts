import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon } from '@/components/ui';
import { ChartPrint, EssayPrint } from '@/components/writing/PromptPrint';
import {
  filterWritingPrompts,
  type WritingPromptFilters,
} from '@/data/writing-repository';
import { TOPICS } from '@/data/articles';
import { useWritingStore } from '@/store/useWritingStore';
import type { Task2Essay, WritingPrompt, WritingTask } from '@/lib/writing/types';
import { CrossFade } from '@/components/motion/Motion';
import { SealIcon } from '@/components/illust/HeroArt';
import { CutePencil } from '@/components/illust/Cute';
import { useL } from '@/i18n/useL';

/**
 * Kho đề Writing, bố cục theo tham chiếu Youpass:
 *
 *   - trái: chọn kỹ năng/Task (radio) và các bộ lọc (dạng đề, chủ đề, band);
 *   - phải: thanh tìm kiếm, hai tab "Bài chưa làm / Bài đã làm", lưới thẻ gọn
 *     có hình minh hoạ, nhãn dạng đề, tên đề và đoạn mô tả.
 *
 * Tab SAT vẫn hiện dù chưa dựng — nói rõ còn thiếu gì tốt hơn là giấu tab đi.
 */

type Tab = WritingTask | 'sat';
type Status = 'todo' | 'done';

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
  { label: 'Tất cả', labelEn: 'All', value: undefined },
  { label: 'Đến 6.0', labelEn: 'Up to 6.0', value: 6.0 },
  { label: 'Đến 6.5', labelEn: 'Up to 6.5', value: 6.5 },
] as const;

const PAGE = 8;
const GREEN = '#16A34A';
const CARD_TONE = { ink: '#0F1D33', mid: '#B8955A', soft: '#FFFFFF' };

export default function WritingLibraryScreen() {
  const [tab, setTab] = useState<Tab>('ielts_task1');
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [maxBand, setMaxBand] = useState<number | undefined>(undefined);
  /** Loại biểu đồ (Task 1) hoặc dạng luận (Task 2) — hai tab dùng chung một ô trạng thái. */
  const [kind, setKind] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<Status>('todo');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE);
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

  const submissions = useWritingStore((s) => s.submissions);
  const doneIds = useMemo(() => new Set(submissions.map((x) => x.promptId)), [submissions]);

  const prompts = useMemo(() => {
    if (tab === 'sat') return [];
    const filters: WritingPromptFilters = {
      task: tab,
      topicSlug: topic,
      maxBand,
      search: query,
      ...(tab === 'ielts_task1'
        ? { chartKind: kind as WritingPromptFilters['chartKind'] }
        : { essayKind: kind as WritingPromptFilters['essayKind'] }),
    };
    return filterWritingPrompts(filters).filter((p) => (status === 'done' ? doneIds.has(p.id) : !doneIds.has(p.id)));
  }, [tab, topic, maxBand, kind, query, status, doneIds]);

  /*
    Đếm số đề của từng loại NGAY TRÊN nút lọc. Đếm theo tab và bỏ qua các bộ lọc
    khác, để con số không nhảy mỗi lần đổi chủ đề.
  */
  const kindCounts = useMemo(() => {
    if (tab === 'sat') return [] as { key: string; label: string; count: number }[];
    const all = filterWritingPrompts({ task: tab });
    const keys = tab === 'ielts_task1' ? Object.keys(CHART_LABEL) : (Object.keys(ESSAY_LABEL) as string[]);
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
    setVisible(PAGE);
  };

  const filters = (
    <View className="gap-4">
      <FilterGroup title={L('Kỹ năng', 'Skill')}>
        {TABS.map((t) => (
          <Radio key={t.key} label={t.label} on={tab === t.key} onPress={() => selectTab(t.key)} />
        ))}
      </FilterGroup>

      {tab !== 'sat' ? (
        <FilterGroup title={tab === 'ielts_task1' ? L('Loại biểu đồ', 'Chart type') : L('Dạng luận', 'Essay type')}>
          <Radio label={L('Tất cả', 'All')} on={kind === undefined} onPress={() => setKind(undefined)} />
          {kindCounts.map((k) => (
            <Radio
              key={k.key}
              label={`${k.label}`}
              count={k.count}
              on={kind === k.key}
              onPress={() => { setKind(kind === k.key ? undefined : k.key); setVisible(PAGE); }}
            />
          ))}
        </FilterGroup>
      ) : null}

      {tab !== 'sat' ? (
        <FilterGroup title={L('Chủ đề', 'Topic')}>
          <Radio label={L('Tất cả', 'All')} on={topic === undefined} onPress={() => setTopic(undefined)} />
          {TOPICS.map((t) => (
            <Radio
              key={t.slug}
              label={t.name}
              on={topic === t.slug}
              onPress={() => { setTopic(topic === t.slug ? undefined : t.slug); setVisible(PAGE); }}
            />
          ))}
        </FilterGroup>
      ) : null}

      {tab !== 'sat' ? (
        <FilterGroup title={L('Band mục tiêu', 'Target band')}>
          {BAND_FILTERS.map((b) => (
            <Radio key={b.label} label={en ? b.labelEn : b.label} on={maxBand === b.value} onPress={() => setMaxBand(b.value)} />
          ))}
        </FilterGroup>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-nun-heavy text-pageTitle text-ink">{L('Luyện viết', 'Writing practice')}</Text>
          <Text className="mt-1 font-nun text-bodyLg text-muted">
            {L('Chọn đề, đọc hướng dẫn viết, rồi làm bài theo từng phần.', 'Pick a prompt, read the writing guide, then write part by part.')}
          </Text>
        </View>
      </View>

      <CrossFade swapKey={tab}>
      {tab === 'sat' ? (
        <View className={wide ? 'mt-5 flex-row gap-5' : 'mt-5 gap-4'}>
          {wide ? <View style={{ width: 268 }}>{filters}</View> : null}
          <Card className="flex-1">
            <View className="flex-row items-center gap-3">
              <View aria-hidden>
                <SealIcon name="pencil" color="#F0703F" size={40} />
              </View>
              <Text className="min-w-0 flex-1 font-nun-heavy text-cardTitle text-ink">SAT Writing</Text>
            </View>
            <Text className="mt-2 font-nun text-body text-muted">
              {L(
                'Hai nhóm kỹ năng viết của SAT Reading and Writing: Expression of Ideas (Transitions, Rhetorical Synthesis) và Standard English Conventions (Boundaries, Form / Structure / Sense). Toàn bộ là câu hỏi trắc nghiệm — bài thi số hoá hiện nay không còn phần viết luận.',
                'The two writing skill groups in SAT Reading and Writing: Expression of Ideas (Transitions, Rhetorical Synthesis) and Standard English Conventions (Boundaries, Form / Structure / Sense). All multiple choice — the digital SAT no longer has an essay.',
              )}
            </Text>
            <Text className="mt-2 font-nun text-label text-muted">
              {L('Câu hỏi dựng tại chỗ từ kho passage SAT đã có trong app.', "Questions are built on the spot from the app's SAT passage bank.")}
            </Text>
            <View className="mt-4 flex-row items-center gap-4">
              <Button label={L('Bắt đầu luyện', 'Start practising')} onPress={() => router.push('/write/sat' as never)} />
              <View aria-hidden>
                <CutePencil size={48} />
              </View>
            </View>
          </Card>
        </View>
      ) : (
        <View className={wide ? 'mt-5 flex-row gap-5' : 'mt-5 gap-4'}>
          {wide ? <View style={{ width: 268 }}>{filters}</View> : null}

          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center justify-between gap-3 border-b border-border">
              <View className="flex-row gap-5">
                <StatusTab label={L('Bài chưa làm', 'Not attempted')} on={status === 'todo'} onPress={() => { setStatus('todo'); setVisible(PAGE); }} />
                <StatusTab label={L('Bài đã làm', 'Attempted')} on={status === 'done'} onPress={() => { setStatus('done'); setVisible(PAGE); }} />
              </View>
              <View className="mb-2 flex-row items-center gap-2 rounded-pill border border-border bg-surface px-3" style={{ minHeight: 40, minWidth: 240 }}>
                <Icon name="search" size={15} color="#8A8F98" />
                <TextInput
                  value={query}
                  onChangeText={(v) => { setQuery(v); setVisible(PAGE); }}
                  placeholder={L('Tìm theo đề bài', 'Search prompts')}
                  placeholderTextColor="#8A8F98"
                  className="min-w-0 flex-1 font-nun text-body text-ink"
                  style={{ paddingVertical: 8, outlineStyle: 'none' } as object}
                />
              </View>
            </View>

            <Text className="mt-3 font-nun-mid text-label text-muted">
              {L(`${prompts.length} đề phù hợp`, `${prompts.length} matching prompts`)}
            </Text>

            {prompts.length === 0 ? (
              <Card className="mt-3">
                <Text className="font-nun text-body text-muted">
                  {status === 'done'
                    ? L('Bạn chưa nộp bài nào. Làm một đề rồi quay lại đây.', 'No submissions yet. Finish a prompt and come back.')
                    : L('Không có đề nào khớp bộ lọc. Bỏ bớt một điều kiện để xem thêm.', 'No prompts match these filters. Remove one to see more.')}
                </Text>
              </Card>
            ) : (
              <View className="mt-3"><Grid columns={2} tabletColumns={2} mobileColumns={1} gap={14}>
                {prompts.slice(0, visible).map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </Grid></View>
            )}

            {visible < prompts.length ? (
              <View className="mt-4 items-center">
                <Button
                  variant="outline"
                  label={L(`Xem thêm ${Math.min(PAGE, prompts.length - visible)} đề`, `Show ${Math.min(PAGE, prompts.length - visible)} more`)}
                  onPress={() => setVisible((v) => v + PAGE)}
                />
              </View>
            ) : null}
          </View>
        </View>
      )}
      </CrossFade>
    </Screen>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-card border border-border bg-surface">
      <View className="border-b border-border bg-canvas px-4 py-3">
        <Text className="font-nun-heavy text-ink" style={{ fontSize: 15 }}>{title}</Text>
      </View>
      <View className="gap-1 p-2">{children}</View>
    </View>
  );
}

function Radio({ label, on, onPress, count }: { label: string; on: boolean; onPress: () => void; count?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      aria-checked={on}
      className="flex-row items-center gap-2.5 rounded-lg px-2.5 py-2"
      style={{ minHeight: 40, backgroundColor: on ? '#EAF7EF' : 'transparent' }}
    >
      <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: on ? 5 : 1.5, borderColor: on ? GREEN : '#B9BEC6', backgroundColor: '#FFFFFF' }} />
      <Text className="min-w-0 flex-1 font-nun-mid text-body" style={{ color: on ? '#0F7A38' : '#1F2937' }}>{label}</Text>
      {count !== undefined ? <Text className="font-nun-mid text-label text-muted">{count}</Text> : null}
    </Pressable>
  );
}

function StatusTab({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      aria-selected={on}
      className="pb-2.5"
      style={{ borderBottomWidth: 2.5, borderBottomColor: on ? '#EA580C' : 'transparent' }}
    >
      <Text className="font-nun-strong" style={{ fontSize: 15, color: on ? '#EA580C' : '#6B7280' }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Thẻ đề gọn: hình minh hoạ bên trái, nhãn dạng đề, tên đề (màu xanh như liên
 * kết) và đoạn mô tả. Một thẻ là một đề; bấm vào là vào phòng viết.
 */
function PromptCard({ prompt }: { prompt: WritingPrompt }) {
  const { L } = useL();
  const task1 = prompt.task === 'ielts_task1';
  const kindLabel = task1
    ? (CHART_LABEL[prompt.chartKind ?? ''] ?? 'Task 1')
    : prompt.essayKind
      ? ESSAY_LABEL[prompt.essayKind]
      : 'Task 2';
  const title = task1 && prompt.chartData ? prompt.chartData.title : prompt.promptText;
  const blurb = task1 ? prompt.promptText : L(`Dạng ${kindLabel}. Viết ít nhất ${prompt.minWords} từ.`, `${kindLabel} essay. Write at least ${prompt.minWords} words.`);

  return (
    <Pressable
      onPress={() => router.push(`/write/${prompt.id}` as never)}
      accessibilityRole="link"
      className="flex-row gap-3 overflow-hidden rounded-card border border-border bg-surface p-3"
    >
      <View className="items-center justify-center overflow-hidden rounded-lg bg-white" style={{ width: 128, minHeight: 112 }}>
        {prompt.chartData ? (
          <ChartPrint data={prompt.chartData} tone={CARD_TONE} active={false} />
        ) : (
          <EssayPrint kind={prompt.essayKind} tone={CARD_TONE} active={false} />
        )}
      </View>
      <View className="min-w-0 flex-1 gap-1.5">
        <View className="self-start rounded-md px-2 py-0.5" style={{ backgroundColor: '#0F1D33' }}>
          <Text className="font-nun-strong text-white" style={{ fontSize: 11 }}>{kindLabel}</Text>
        </View>
        <Text className="font-nun-strong" numberOfLines={2} style={{ fontSize: 14, lineHeight: 19, color: '#1D4ED8' }}>
          {title}
        </Text>
        <Text className="font-nun text-label text-muted" numberOfLines={2} style={{ lineHeight: 18 }}>{blurb}</Text>
        <Text className="font-nun-mid text-label text-muted">
          Band {prompt.difficultyBand.toFixed(1)} · {Math.round(prompt.timeLimitSeconds / 60)} {L('phút', 'min')}
        </Text>
      </View>
    </Pressable>
  );
}
