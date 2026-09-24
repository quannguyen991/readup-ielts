import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { LessonCard, Waveform } from '@/components/sentence/LessonCard';
import { Card, Icon } from '@/components/ui';
import {
  DICTATION_SET_LEVELS,
  DICTATION_SET_TOPICS,
  dictationSetStats,
  filterDictationSets,
  positionOf,
  type DictationSet,
} from '@/data/dictation-sets';
import { useSentenceStore } from '@/store/useSentenceStore';
import { color } from '@/theme/tokens';

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

  const stats = useMemo(() => dictationSetStats(), []);
  const sets = useMemo(() => filterDictationSets({ level, topic }), [level, topic]);

  return (
    <View>
      {heading ? (
        <>
          <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
            <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 10 }}>
              Listening dictation library
            </Text>
          </View>

          <Text className="mt-3 font-heavy text-pageTitle text-ink">Bộ đề chép chính tả</Text>
          <Text className="mt-1.5 max-w-[640px] font-sans text-bodyLg text-muted">
            {stats.sets} bài, mỗi bài {Math.round(stats.sentences / stats.sets)} câu nối tiếp nhau
            theo một chủ đề — nghe hết một bài là theo được cả mạch, không phải nghe{' '}
            {stats.sentences} câu rời rạc.
          </Text>
        </>
      ) : null}

      <Card className={heading ? 'mt-5' : ''}>
        <FilterRow label="Trình độ">
          <Chip label="Tất cả" active={level === 'all'} onPress={() => setLevel('all')} />
          {DICTATION_SET_LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={level === l}
              onPress={() => setLevel(level === l ? 'all' : l)}
            />
          ))}
        </FilterRow>
        <FilterRow label="Chủ đề">
          <Chip label="Tất cả" active={topic === 'all'} onPress={() => setTopic('all')} />
          {DICTATION_SET_TOPICS.map((t) => (
            <Chip
              key={t}
              label={t}
              active={topic === t}
              onPress={() => setTopic(topic === t ? 'all' : t)}
            />
          ))}
        </FilterRow>
      </Card>

      <Text className="mt-5 font-strong text-cardTitle text-ink">
        {sets.length} bài{level !== 'all' || topic !== 'all' ? ' khớp bộ lọc' : ''}
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
              Không có bài nào khớp. Thử bỏ bớt bộ lọc.
            </Text>
          </Card>
        )}
      </View>
    </View>
  );
}

const LEVEL_NAME: Record<string, string> = { A2: 'A2 · Sơ cấp', B1: 'B1 · Trung cấp', B2: 'B2 · Trên trung cấp', C1: 'C1 · Nâng cao' };

function SetCard({ set }: { set: DictationSet }) {
  const sessions = useSentenceStore((s) => s.sessions);
  // Đã luyện bài này mấy lần — đọc từ lịch sử phiên đã lưu trên máy.
  const doneCount = useMemo(
    () => sessions.filter((s) => s.mode === 'dictation' && s.setId === set.id).length,
    [sessions, set.id],
  );
  const lines = useMemo(() => set.sentences.map((s) => s.en), [set]);

  return (
    <LessonCard
      number={positionOf(set)}
      level={set.level}
      levelLabel={LEVEL_NAME[set.level] ?? set.level}
      icon="volume"
      title={set.title}
      blurb={set.blurb}
      meta={[
        { icon: 'list', label: `${set.sentences.length} câu` },
        { icon: 'volume', label: set.accentHint },
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
      <Text className="mb-1.5 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5 py-0.5">{children}</View>
      </ScrollView>
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
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
