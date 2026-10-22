import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { ToneTile } from '@/components/vocab/ToneTile';
import { THPT_QUESTIONS_PER_BAI } from '@/services/vocab/thpt-quiz';
import { useL } from '@/i18n/useL';

/**
 * Trắc nghiệm THPT — tính năng riêng, tách khỏi phiên học.
 *
 * Mỗi bài (chủ đề) có {THPT_QUESTIONS_PER_BAI} câu A/B/C/D kiểu đề thi THPT: điền từ vào câu, chọn từ gần
 * nghĩa nhất, chọn từ trái nghĩa. Phiên học của từng bài chỉ còn lật thẻ, chọn nghĩa ABCD và gõ từ.
 */
/** Màu luân phiên cho các bài THPT, cùng bảng với các thẻ khác trong app. */
const THPT_TONES = ['#E0533D', '#6A4BD9', '#0891B2', '#16A34A', '#EA580C', '#DB2777', '#2563EB', '#7C3AED'] as const;

export default function VocabThptListScreen() {
  const { L, en } = useL();

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="vocab"
          badge={L('TRẮC NGHIỆM THPT', 'THPT MULTIPLE CHOICE')}
          line1={L('Trắc nghiệm theo bài', 'Multiple choice by set')}
          line2={L(`${THPT_QUESTIONS_PER_BAI} câu mỗi bài, đáp án A/B/C/D`, `${THPT_QUESTIONS_PER_BAI} questions per set, A/B/C/D answers`)}
          subtitle={L(
            'Chọn một bài để làm. Câu hỏi theo kiểu đề THPT: điền từ vào câu, chọn từ gần nghĩa nhất, chọn từ trái nghĩa.',
            'Pick a set. Questions follow the high-school exam style: fill the gap, closest meaning, opposite meaning.',
          )}
        />
      </Appear>
      <View className="mt-4">
        <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={12}>
          {VOCAB_TOPICS.map((topic, i) => (
            <ToneTile
              key={topic.slug}
              seed={'thpt-' + topic.slug}
              tone={THPT_TONES[i % THPT_TONES.length]!}
              icon="clipboard"
              title={en ? topic.name : topic.nameVi || topic.name}
              sub={L(`${topic.words.length} từ · ${THPT_QUESTIONS_PER_BAI} câu`, `${topic.words.length} words · ${THPT_QUESTIONS_PER_BAI} questions`)}
              chip={L('Làm bài', 'Start')}
              minHeight={200}
              onPress={() => router.push(`/vocabulary/topic/${topic.slug}/quiz` as never)}
            />
          ))}
        </Grid>
      </View>
      <View className="h-10" />
    </Screen>
  );
}
