import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { LessonCard, Waveform } from '@/components/sentence/LessonCard';
import { Card, HScroll, Icon } from '@/components/ui';
import {
  DICTATION_SET_LEVELS,
  DICTATION_SET_TOPICS,
  dictationSetStats,
  dictationTopicLabel,
  filterDictationSets,
  positionOf,
  type DictationSet,
} from '@/data/dictation-sets';
import { useSentenceStore } from '@/store/useSentenceStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Thư viện bộ đề chép chính tả — phần thân, không kèm khung trang.
 *
 * Tách khỏi route để màn Chép chính tả nhúng thẳng vào được: người dùng vào
 * `/sentence/dictation` là thấy ngay danh sách bài, không phải qua một màn chọn
 * độ khó rồi mới tới chỗ có bài.
 *
 * Vì sao là thẻ chứ không phải danh sách dòng: 50 bài trong một danh sách chữ
 * thì mọi bài trông y hệt nhau và người học chọn bừa bài đầu tiên. Mỗi thẻ có
 * dải sóng âm vẽ từ chính các câu của bài (`LessonCard`) và màu theo trình độ —
 * đủ để nhận ra bài mình muốn quay lại, chứ không chỉ bài kế tiếp.
 *
 * `heading=false` cho chỗ nào đã có tiêu đề trang riêng (trang thư viện hai tab):
 * hai tiêu đề chồng nhau đọc như lỗi bố cục chứ không như hai tầng thông tin.
 */
export function DictationLibrary({ heading = true }: { heading?: boolean }) {
  const [level, setLevel] = useState('all');
  const [topic, setTopic] = useState('all');
  const { L, en } = useL();

  const stats = useMemo(() => dictationSetStats(), []);
  const sets = useMemo(() => filterDictationSets({ level, topic }), [level, topic]);

  return (
    <View>
      {heading ? (
        <>
          <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
            <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 12 }}>
              Listening dictation library
            </Text>
          </View>

          <Text className="mt-3 font-heavy text-pageTitle text-ink">{L('Bộ đề chép chính tả', 'Dictation sets')}</Text>
          <Text className="mt-1.5 max-w-[640px] font-sans text-bodyLg text-muted">
            {L(
              `${stats.sets} bài, mỗi bài ${Math.round(stats.sentences / stats.sets)} câu nối tiếp nhau theo một chủ đề — nghe hết một bài là theo được cả mạch, không phải nghe ${stats.sentences} câu rời rạc.`,
              `${stats.sets} sets, each with ${Math.round(stats.sentences / stats.sets)} connected sentences on one topic — finish a set and you follow a whole thread, not ${stats.sentences} scattered sentences.`,
            )}
          </Text>
        </>
      ) : null}

      <Card className={heading ? 'mt-5' : ''}>
        <FilterRow label={L('Trình độ', 'Level')}>
          <Chip label={L('Tất cả', 'All')} active={level === 'all'} onPress={() => setLevel('all')} />
          {DICTATION_SET_LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={level === l}
              onPress={() => setLevel(level === l ? 'all' : l)}
            />
          ))}
        </FilterRow>
        <FilterRow label={L('Chủ đề', 'Topic')}>
          <Chip label={L('Tất cả', 'All')} active={topic === 'all'} onPress={() => setTopic('all')} />
          {DICTATION_SET_TOPICS.map((t) => (
            <Chip
              key={t}
              label={dictationTopicLabel(t, en)}
              active={topic === t}
              onPress={() => setTopic(topic === t ? 'all' : t)}
            />
          ))}
        </FilterRow>
      </Card>

      <Text className="mt-5 font-strong text-cardTitle text-ink">
        {L(
          `${sets.length} bài${level !== 'all' || topic !== 'all' ? ' khớp bộ lọc' : ''}`,
          `${sets.length} sets${level !== 'all' || topic !== 'all' ? ' match your filters' : ''}`,
        )}
      </Text>

      <View className="mt-3">
        {sets.length > 0 ? (
          <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={16}>
            {sets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </Grid>
        ) : (
          <Card className="items-center py-10">
            <Icon name="search" size={26} color={color.subtle} />
            <Text className="mt-2 text-center font-sans text-body text-muted">
              {L('Không có bài nào khớp. Thử bỏ bớt bộ lọc.', 'No sets match. Try removing some filters.')}
            </Text>
          </Card>
        )}
      </View>
    </View>
  );
}

const LEVEL_NAME: Record<string, { vi: string; en: string }> = {
  A2: { vi: 'A2 · Sơ cấp', en: 'A2 · Elementary' },
  B1: { vi: 'B1 · Trung cấp', en: 'B1 · Intermediate' },
  B2: { vi: 'B2 · Trên trung cấp', en: 'B2 · Upper-intermediate' },
  C1: { vi: 'C1 · Nâng cao', en: 'C1 · Advanced' },
};

const ACCENT_EN: Record<string, string> = { 'Anh – Mỹ': 'US English', 'Anh – Anh': 'UK English' };

function SetCard({ set }: { set: DictationSet }) {
  const sessions = useSentenceStore((s) => s.sessions);
  // Đã luyện bài này mấy lần — đọc từ lịch sử phiên đã lưu trên máy.
  const doneCount = useMemo(
    () => sessions.filter((s) => s.mode === 'dictation' && s.setId === set.id).length,
    [sessions, set.id],
  );
  const lines = useMemo(() => set.sentences.map((s) => s.en), [set]);
  const { L, locale } = useL();
  const levelName = LEVEL_NAME[set.level];

  return (
    <LessonCard
      number={positionOf(set)}
      level={set.level}
      levelLabel={levelName ? (locale === 'en' ? levelName.en : levelName.vi) : set.level}
      icon="volume"
      title={set.title}
      blurb={set.blurb}
      meta={[
        { icon: 'list', label: L(`${set.sentences.length} câu`, `${set.sentences.length} sentences`) },
        { icon: 'volume', label: L(set.accentHint, ACCENT_EN[set.accentHint] ?? set.accentHint) },
      ]}
      done={doneCount}
      visual={(tone, active) => <Waveform sentences={lines} tone={tone} active={active} />}
      onPress={() => router.push(`/sentence/dictation?set=${set.id}` as never)}
    />
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3 last:mb-0">
      <Text className="mb-1.5 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 12 }}>
        {label}
      </Text>
      <HScroll>
        <View className="flex-row gap-1.5 py-0.5">{children}</View>
      </HScroll>
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
        'items-center justify-center rounded-pill border px-3 py-1.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
      ].join(' ')}
      style={{ minHeight: 44 }}
    >
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
