import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { BilingualLines, LessonCard } from '@/components/sentence/LessonCard';
import { Card } from '@/components/ui';
import { SENTENCE_DIFFICULTY_LABEL } from '@/data/sentence-drills';
import {
  TRANSLATION_SET_LEVELS,
  filterTranslationSets,
  translationSetStats,
  type TranslationSet,
} from '@/data/translation-sets';
import { useSentenceStore } from '@/store/useSentenceStore';

/**
 * Thư viện bộ đề Dịch câu — cùng hình dáng với thư viện Chép chính tả.
 *
 * Cố ý giống nhau: hai bài luyện khác nhau về việc phải làm, nhưng bước CHỌN
 * BÀI thì giống hệt, nên dùng chung thẻ `LessonCard` — học một lần dùng được cả
 * hai chỗ. Khác ở dấu vân: bài nghe là sóng âm, bài dịch là cặp vạch Việt–Anh. Chỉ khác ở chỗ bài dịch gom theo CHỦ ĐỀ, vì đó là trục người học
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
  const sessions = useSentenceStore((s) => s.sessions);
  const doneCount = useMemo(
    () => sessions.filter((s) => s.mode === 'translation' && s.setId === set.id).length,
    [sessions, set.id],
  );

  return (
    <LessonCard
      number={set.order}
      level={set.level}
      levelLabel={SENTENCE_DIFFICULTY_LABEL[set.level]}
      icon="languages"
      title={set.title}
      blurb={set.blurb}
      meta={[{ icon: 'list', label: `${set.items.length} câu` }]}
      done={doneCount}
      visual={(tone, active) => <BilingualLines pairs={set.items} tone={tone} active={active} />}
      onPress={() => router.push(`/sentence/translate?set=${set.id}` as never)}
    />
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
