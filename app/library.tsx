import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ArticleCard } from '@/components/article/ArticleCard';
import { Screen } from '@/components/layout/Screen';
import {
  Badge,
  Button,
  Card,
  HeroBanner,
  Icon,
  ProgressBar,
  SectionHeader,
} from '@/components/ui';
import {
  CEFR_LEVELS,
  TOPICS,
  filterArticles,
  libraryStats,
  type ArticleFilters,
} from '@/data/articles';
import { useDueCards, useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';
import type { CefrLevel } from '@/types/database';

/** Library + panel My Vocabulary — bám ảnh tham chiếu số 5. */
export default function LibraryScreen() {
  const [search, setSearch] = useState('');
  const [track, setTrack] = useState<NonNullable<ArticleFilters['track']>>('all');
  const [level, setLevel] = useState<CefrLevel | 'all'>('all');
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [kind, setKind] = useState<NonNullable<ArticleFilters['kind']>>('all');
  const [sort, setSort] = useState<NonNullable<ArticleFilters['sort']>>('newest');
  const [visible, setVisible] = useState(8);

  const stats = useMemo(() => libraryStats(), []);
  const entries = useVocabStore((s) => s.entries);
  const dueCount = useDueCards().length;

  const articles = useMemo(
    () => filterArticles({ search, track, level, topic, kind, sort }),
    [search, track, level, topic, kind, sort],
  );

  const savedWords = Object.values(entries).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const reset = () => {
    setSearch('');
    setTrack('all');
    setLevel('all');
    setTopic(undefined);
    setKind('all');
    setSort('newest');
  };

  return (
    <Screen>
      <HeroBanner
        title="Build Vocabulary Through Reading"
        subtitle="Đọc bài thật từ nguồn công khai, lưu từ ngay trong câu gặp nó, rồi ôn lại đúng lúc sắp quên."
        illustration="library-hero"
      >
        <View className="flex-row flex-wrap gap-3">
          <HeroStat value={String(stats.readable)} label="Bài đọc đầy đủ" />
          <HeroStat value={String(savedWords.length)} label="Từ đã lưu" />
          <HeroStat value={String(dueCount)} label="Đến hạn ôn hôm nay" />
          <HeroStat value={String(stats.sources)} label="Nguồn" />
        </View>
      </HeroBanner>

      <View className="mt-4 flex-row items-center gap-2 rounded-card border border-border bg-surface px-4">
        <Icon name="search" size={18} color={color.subtle} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm bài đọc, chủ đề hoặc từ vựng…"
          placeholderTextColor={color.subtle}
          className="h-12 flex-1 font-sans text-body text-ink"
          style={{ outlineStyle: 'none' } as never}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} accessibilityLabel="Xoá tìm kiếm">
            <Icon name="close" size={16} color={color.subtle} />
          </Pressable>
        ) : null}
      </View>

      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <Chip label="Tất cả" active={track === 'all' && kind === 'all'} onPress={reset} />
        <Chip label="Academic" active={track === 'academic'} onPress={() => setTrack('academic')} />
        <Chip
          label="General Training"
          active={track === 'general_training'}
          onPress={() => setTrack('general_training')}
        />
        <Chip
          label="Đọc được toàn văn"
          active={kind === 'readable'}
          onPress={() => setKind(kind === 'readable' ? 'all' : 'readable')}
        />
        <Chip
          label="Chỉ tiêu đề"
          active={kind === 'headline'}
          onPress={() => setKind(kind === 'headline' ? 'all' : 'headline')}
        />

        <View className="flex-1" />

        <Pressable onPress={reset} className="flex-row items-center gap-1">
          <Icon name="refresh" size={14} color={color.primary} />
          <Text className="font-semi text-label text-primary-600">Reset</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
        <View className="flex-row gap-2 py-1">
          <Chip label="Mọi độ khó" active={level === 'all'} onPress={() => setLevel('all')} />
          {CEFR_LEVELS.map((l) => (
            <Chip key={l} label={l} active={level === l} onPress={() => setLevel(l)} />
          ))}
          <View className="w-2" />
          <Chip label="Mọi chủ đề" active={!topic} onPress={() => setTopic(undefined)} />
          {TOPICS.map((t) => (
            <Chip
              key={t.slug}
              label={t.nameVi}
              active={topic === t.slug}
              onPress={() => setTopic(topic === t.slug ? undefined : t.slug)}
            />
          ))}
        </View>
      </ScrollView>

      <View className="mt-4 flex-row flex-wrap gap-4">
        <View className="min-w-[320px] flex-[2]">
          <Card>
            <SectionHeader
              title="Reading Library"
              subtitle={`${articles.length} bài khớp bộ lọc`}
              icon="book"
              right={
                <View className="flex-row items-center gap-1">
                  {(['newest', 'shortest', 'easiest', 'hardest'] as const).map((s) => (
                    <Chip
                      key={s}
                      label={SORT_LABEL[s]}
                      active={sort === s}
                      onPress={() => setSort(s)}
                    />
                  ))}
                </View>
              }
            />

            <View className="mt-4 gap-3">
              {articles.slice(0, visible).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}

              {articles.length === 0 ? (
                <Text className="py-8 text-center font-sans text-body text-muted">
                  Không có bài nào khớp. Thử bỏ bớt bộ lọc.
                </Text>
              ) : null}
            </View>

            {visible < articles.length ? (
              <Button
                label={`Xem thêm (${articles.length - visible})`}
                variant="outline"
                iconRight="chevron-down"
                fullWidth
                className="mt-4"
                onPress={() => setVisible((v) => v + 8)}
              />
            ) : null}
          </Card>
        </View>

        <View className="min-w-[300px] flex-1">
          <Card>
            <SectionHeader
              title="My Vocabulary"
              subtitle="Từ bạn đã lưu khi đọc"
              icon="letters"
              iconTone="accent"
              action={{ label: 'Xem tất cả', onPress: () => router.push('/vocabulary' as never) }}
            />

            <View className="mt-4 gap-3">
              {savedWords.slice(0, 5).map((entry) => (
                <View key={entry.id} className="rounded-panel border border-border p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-strong text-cardTitle text-ink">{entry.word}</Text>
                    <Badge label={`${entry.masteryPercent}%`} tone="accent" />
                  </View>

                  <Text className="mt-0.5 font-mid text-label text-muted">
                    {[entry.partOfSpeech, entry.phonetic].filter(Boolean).join(' · ') || '—'}
                  </Text>

                  <Text className="mt-1.5 font-sans text-body text-body" numberOfLines={2}>
                    {entry.definitionContext ?? entry.definitionVi ?? entry.definitionGeneral ?? '—'}
                  </Text>

                  <Text className="mt-1.5 font-sans text-label text-subtle" numberOfLines={2}>
                    “{entry.sourceSentence}”
                  </Text>

                  <ProgressBar value={entry.masteryPercent} tone="accent" className="mt-2" />
                </View>
              ))}

              {savedWords.length === 0 ? (
                <View className="items-center rounded-panel bg-surfaceAlt px-4 py-8">
                  <Icon name="letters" size={28} color={color.subtle} />
                  <Text className="mt-2 text-center font-sans text-body text-muted">
                    Chưa có từ nào. Mở một bài đọc rồi chạm vào từ bất kỳ để lưu kèm câu gốc.
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="mt-4 flex-row items-center justify-between rounded-panel bg-primary-50 px-3 py-3">
              <View className="min-w-0 flex-1">
                <Text className="font-semi text-body text-primary-700">Smart Review</Text>
                <Text className="font-sans text-label text-muted">
                  {dueCount > 0
                    ? `${dueCount} thẻ đến hạn ôn hôm nay`
                    : 'Chưa có thẻ nào đến hạn — quay lại sau'}
                </Text>
              </View>
              <Button
                label="Start Review"
                size="sm"
                disabled={dueCount === 0}
                onPress={() => router.push('/vocabulary?tab=review' as never)}
              />
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const SORT_LABEL: Record<'newest' | 'shortest' | 'easiest' | 'hardest', string> = {
  newest: 'Mới nhất',
  shortest: 'Ngắn nhất',
  easiest: 'Dễ nhất',
  hardest: 'Khó nhất',
};

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="rounded-panel bg-white/15 px-4 py-2.5">
      <Text className="font-heavy text-cardTitle text-white">{value}</Text>
      <Text className="font-mid text-label text-primary-100">{label}</Text>
    </View>
  );
}

export function Chip({
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
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
