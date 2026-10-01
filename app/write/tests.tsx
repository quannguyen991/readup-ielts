import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Button, Card, SectionHeader } from '@/components/ui';
import { LessonCard } from '@/components/sentence/LessonCard';
import { ChartPrint, EssayPrint } from '@/components/writing/PromptPrint';
import {
  filterWritingPrompts,
  writingLibraryStats,
  type WritingPromptFilters,
} from '@/data/writing-repository';
import { TOPICS } from '@/data/articles';
import { useWritingStore } from '@/store/useWritingStore';
import type { Task2Essay, WritingPrompt, WritingTask } from '@/lib/writing/types';
import { CrossFade } from '@/components/motion/Motion';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CutePencil } from '@/components/illust/Cute';
import { CuteMagnifier, Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

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
  { label: 'Tất cả', labelEn: 'All', value: undefined },
  { label: 'Đến 6.0', labelEn: 'Up to 6.0', value: 6.0 },
  { label: 'Đến 6.5', labelEn: 'Up to 6.5', value: 6.5 },
] as const;

export default function WritingLibraryScreen() {
  const [tab, setTab] = useState<Tab>('ielts_task1');
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [maxBand, setMaxBand] = useState<number | undefined>(undefined);
  /** Loại biểu đồ (Task 1) hoặc dạng luận (Task 2) — hai tab dùng chung một ô trạng thái. */
  const [kind, setKind] = useState<string | undefined>(undefined);
  const [visible, setVisible] = useState(8);
  const { L, en } = useL();

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
    setVisible(8);
  };

  return (
    <Screen>
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-heavy text-pageTitle text-ink">{L('Luyện viết', 'Writing practice')}</Text>
          <Text className="mt-1 font-sans text-bodyLg text-muted">
            {L(
              `${stats.total} đề — ${stats.byTask.ielts_task1} đề Task 1 và ${stats.byTask.ielts_task2} đề Task 2.`,
              `${stats.total} prompts — ${stats.byTask.ielts_task1} Task 1 and ${stats.byTask.ielts_task2} Task 2.`,
            )}
          </Text>
        </View>
        <View aria-hidden>
          <PageStickers scene="writing" />
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {TABS.map((t) => (
          <Chip key={t.key} label={t.label} active={tab === t.key} onPress={() => selectTab(t.key)} />
        ))}
      </View>

      <CrossFade swapKey={tab}>
      {tab === 'sat' ? (
        <Card className="mt-5">
          <View className="flex-row items-center gap-3">
            <View aria-hidden>
              <SealIcon name="pencil" color="#F0703F" size={40} />
            </View>
            <Text className="min-w-0 flex-1 font-heavy text-cardTitle text-ink">SAT Writing</Text>
            <View aria-hidden>
              <Label text={L('Trắc nghiệm ✓', 'Multiple choice ✓')} color="#22A06B" ink="#FFFFFF" tilt={4} size={12} />
            </View>
          </View>
          <Text className="mt-2 font-sans text-body text-muted">
            {L(
              'Hai nhóm kỹ năng viết của SAT Reading and Writing: Expression of Ideas (Transitions, Rhetorical Synthesis) và Standard English Conventions (Boundaries, Form / Structure / Sense). Toàn bộ là câu hỏi trắc nghiệm — bài thi số hoá hiện nay không còn phần viết luận.',
              'The two writing skill groups in SAT Reading and Writing: Expression of Ideas (Transitions, Rhetorical Synthesis) and Standard English Conventions (Boundaries, Form / Structure / Sense). All multiple choice — the digital SAT no longer has an essay.',
            )}
          </Text>
          <Text className="mt-2 font-sans text-label text-muted">
            {L('Câu hỏi dựng tại chỗ từ kho passage SAT đã có trong app.', "Questions are built on the spot from the app's SAT passage bank.")}
          </Text>
          <View className="mt-4 flex-row items-center gap-4">
            <Button label={L('Bắt đầu luyện', 'Start practising')} onPress={() => router.push('/write/sat' as never)} />
            <View aria-hidden>
              <Motion kind="float">
                <Sticker tilt={8}>
                  <CutePencil size={48} />
                </Sticker>
              </Motion>
            </View>
          </View>
        </Card>
      ) : (
        <>
          <View className="mt-4 flex-row flex-wrap items-center gap-2">
            <Text className="font-semi text-label text-muted">
              {tab === 'ielts_task1' ? L('Loại biểu đồ', 'Chart type') : L('Dạng luận', 'Essay type')}
            </Text>
            <Chip label={L('Tất cả', 'All')} active={kind === undefined} onPress={() => setKind(undefined)} />
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
            <Text className="font-semi text-label text-muted">{L('Chủ đề', 'Topic')}</Text>
            <Chip label={L('Tất cả', 'All')} active={topic === undefined} onPress={() => setTopic(undefined)} />
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
            <Text className="font-semi text-label text-muted">{L('Band mục tiêu', 'Target band')}</Text>
            {BAND_FILTERS.map((b) => (
              <Chip
                key={b.label}
                label={en ? b.labelEn : b.label}
                active={maxBand === b.value}
                onPress={() => setMaxBand(b.value)}
              />
            ))}
          </View>

          <SectionHeader title={L(`${prompts.length} đề phù hợp`, `${prompts.length} matching prompts`)} icon="clipboard" iconTone="accent" />

          {prompts.length === 0 ? (
            <Card>
              <View className="flex-row items-center gap-3">
                <View aria-hidden>
                  <Motion kind="wobble">
                    <Sticker tilt={-6}>
                      <CuteMagnifier size={52} />
                    </Sticker>
                  </Motion>
                </View>
                <Text className="min-w-0 flex-1 font-sans text-body text-muted">
                  {L('Không có đề nào khớp bộ lọc. Bỏ bớt một điều kiện để xem thêm.', 'No prompts match these filters. Remove one to see more.')}
                </Text>
              </View>
            </Card>
          ) : (
            <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={16}>
              {prompts.slice(0, visible).map((prompt, i) => (
                <PromptCard key={prompt.id} prompt={prompt} index={i} />
              ))}
            </Grid>
          )}

          {visible < prompts.length ? (
            <View className="mt-4 items-center">
              <Button
                variant="outline"
                label={L(`Xem thêm ${Math.min(8, prompts.length - visible)} đề`, `Show ${Math.min(8, prompts.length - visible)} more`)}
                onPress={() => setVisible((v) => v + 8)}
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
  Thẻ đề = THẺ BÀI chung của ReadUp (`LessonCard`), cùng dáng với lộ trình dịch.

  Bản trước là thẻ ngang: nguyên cái biểu đồ có tiêu đề + trục + chú thích nhét
  vào cột trái 168px, nửa phải chỉ có hai dòng chữ rồi trống tới đáy — người
  dùng chê ngày 26/09/2026 và đưa trang Dịch câu làm mẫu. Giờ dấu vân là hình thu
  nhỏ vẽ từ chính số liệu của đề (Task 1) hoặc dàn bài của dạng luận (Task 2).
*/
function bandLevel(band: number): string {
  return band <= 6 ? 'easy' : band <= 6.5 ? 'medium' : 'hard';
}

function PromptCard({ prompt, index }: { prompt: WritingPrompt; index: number }) {
  const submissions = useWritingStore((s) => s.submissions);
  const done = useMemo(() => submissions.filter((x) => x.promptId === prompt.id).length, [submissions, prompt.id]);
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
    <LessonCard
      number={index + 1}
      eyebrow={`${task1 ? 'TASK 1' : 'TASK 2'} · ${kindLabel.toUpperCase()}`}
      level={bandLevel(prompt.difficultyBand)}
      levelLabel={`Band ${prompt.difficultyBand.toFixed(1)}`}
      icon={task1 ? 'trending' : 'pencil'}
      title={title}
      blurb={blurb}
      meta={[
        { icon: 'clock', label: L(`${Math.round(prompt.timeLimitSeconds / 60)} phút`, `${Math.round(prompt.timeLimitSeconds / 60)} min`) },
        { icon: 'note', label: L(`≥ ${prompt.minWords} từ`, `≥ ${prompt.minWords} words`) },
      ]}
      done={done}
      visual={(tone, active) =>
        prompt.chartData ? (
          <ChartPrint data={prompt.chartData} tone={tone} active={active} />
        ) : (
          <EssayPrint kind={prompt.essayKind} tone={tone} active={active} />
        )
      }
      onPress={() => router.push(`/write/${prompt.id}` as never)}
      secondary={{ label: L('Luyện từng phần', 'Practise by part'), onPress: () => router.push(`/write/drill/${prompt.id}` as never) }}
    />
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
