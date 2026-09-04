import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

import { Grid } from '@/components/layout/Grid';
import { Card, Icon } from '@/components/ui';
import { paletteFor } from '@/data/dictation-sets';
import { SENTENCE_DIFFICULTY_LABEL } from '@/data/sentence-drills';
import {
  TRANSLATION_SET_LEVELS,
  filterTranslationSets,
  translationSetStats,
  type TranslationSet,
} from '@/data/translation-sets';
import { useSentenceStore } from '@/store/useSentenceStore';
import { color } from '@/theme/tokens';

/**
 * Thư viện bộ đề Dịch câu — cùng hình dáng với thư viện Chép chính tả.
 *
 * Cố ý giống nhau: hai bài luyện khác nhau về việc phải làm, nhưng bước CHỌN
 * BÀI thì giống hệt, nên trông giống nhau là đúng — học một lần dùng được cả
 * hai chỗ. Chỉ khác ở chỗ bài dịch gom theo CHỦ ĐỀ, vì đó là trục người học
 * nghĩ tới khi muốn ôn từ vựng của một mảng.
 */
export function TranslationLibrary() {
  const [level, setLevel] = useState('all');

  const stats = useMemo(() => translationSetStats(), []);
  const sets = useMemo(() => filterTranslationSets({ level }), [level]);

  return (
    <View>
      <Card className="mb-5">
        <Text className="mb-1.5 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
          Trình độ
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1.5 py-0.5">
            <Chip label="Tất cả" active={level === 'all'} onPress={() => setLevel('all')} />
            {TRANSLATION_SET_LEVELS.map((l) => (
              <Chip
                key={l}
                label={SENTENCE_DIFFICULTY_LABEL[l]}
                active={level === l}
                onPress={() => setLevel(level === l ? 'all' : l)}
              />
            ))}
          </View>
        </ScrollView>
      </Card>

      <Text className="font-strong text-cardTitle text-ink">
        {sets.length} bài · {stats.sentences} câu
      </Text>

      <View className="mt-3">
        <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={16}>
          {sets.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </Grid>
      </View>
    </View>
  );
}

function SetCard({ set }: { set: TranslationSet }) {
  const colors = paletteFor(set.order);
  const sessions = useSentenceStore((s) => s.sessions);

  const doneCount = useMemo(
    () => sessions.filter((s) => s.mode === 'translation' && s.setId === set.id).length,
    [sessions, set.id],
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/sentence/translate?set=${set.id}` as never)}
      className="h-full overflow-hidden rounded-card"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      <LinearGradient colors={[...colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={{ height: 128 }}>
          <CardPattern order={set.order} />
          <View className="absolute inset-0 justify-between p-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-semi uppercase tracking-wide text-white/80" style={{ fontSize: 9 }}>
                Bài {set.order}
              </Text>
              <View className="rounded-pill bg-white/25 px-2 py-0.5">
                <Text className="font-strong text-white" style={{ fontSize: 10 }}>
                  {SENTENCE_DIFFICULTY_LABEL[set.level]}
                </Text>
              </View>
            </View>
            <Text className="font-heavy text-white" style={{ fontSize: 19, lineHeight: 24 }} numberOfLines={2}>
              {set.title}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-1 border-x border-b border-border bg-surface p-3.5">
        <Text className="font-sans text-label text-muted" numberOfLines={3}>
          {set.blurb}
        </Text>
        <View className="mt-2.5 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Meta icon="list" label={`${set.items.length} câu`} />
          {doneCount > 0 ? <Meta icon="check" label={`đã luyện ${doneCount} lần`} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

/** Ba kiểu hoa văn, chọn theo số bài — cùng bộ với thư viện Chép chính tả. */
function CardPattern({ order }: { order: number }) {
  const kind = order % 3;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.18 }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 128" preserveAspectRatio="none">
        {kind === 0
          ? [0, 1, 2, 3].map((i) => (
              <Path
                key={i}
                d={`M -20 ${18 + i * 34} Q 40 ${2 + i * 34}, 100 ${18 + i * 34} T 220 ${18 + i * 34}`}
                stroke="#FFFFFF"
                strokeWidth={9}
                fill="none"
              />
            ))
          : kind === 1
            ? Array.from({ length: 12 }, (_, i) => (
                <Path
                  key={i}
                  d={`M ${-30 + i * 22} 140 L ${10 + i * 22} -12`}
                  stroke="#FFFFFF"
                  strokeWidth={7}
                  fill="none"
                />
              ))
            : Array.from({ length: 24 }, (_, i) => (
                <Circle key={i} cx={14 + (i % 6) * 34} cy={16 + Math.floor(i / 6) * 32} r={6} fill="#FFFFFF" />
              ))}
      </Svg>
    </View>
  );
}

function Meta({ icon, label }: { icon: React.ComponentProps<typeof Icon>['name']; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size={12} color={color.subtle} />
      <Text className="font-mid text-label text-muted">{label}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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
