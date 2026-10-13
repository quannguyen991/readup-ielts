import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { THPT_QUESTIONS_PER_BAI } from '@/services/vocab/thpt-quiz';
import { useL } from '@/i18n/useL';
import { color } from '@/theme/tokens';

/**
 * Trắc nghiệm THPT — tính năng riêng, tách khỏi phiên học.
 *
 * Mỗi bài (chủ đề) có {THPT_QUESTIONS_PER_BAI} câu A/B/C/D kiểu đề thi THPT: điền từ vào câu, chọn từ gần
 * nghĩa nhất, chọn từ trái nghĩa. Phiên học của từng bài chỉ còn lật thẻ, chọn nghĩa ABCD và gõ từ.
 */
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
      <View className="mt-4" style={{ gap: 10 }}>
        {VOCAB_TOPICS.map((topic) => (
          <Pressable
            key={topic.slug}
            accessibilityRole="link"
            onPress={() => router.push(`/vocabulary/topic/${topic.slug}/quiz` as never)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E9E2D8',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text className="font-strong text-body" style={{ color: color.ink }}>
                {en ? topic.name : topic.nameVi || topic.name}
              </Text>
              <Text className="mt-1 font-sans text-label text-muted">
                {L(`${topic.words.length} từ · ${THPT_QUESTIONS_PER_BAI} câu`, `${topic.words.length} words · ${THPT_QUESTIONS_PER_BAI} questions`)}
              </Text>
            </View>
            <Text className="font-strong text-label" style={{ color: color.primary }}>
              {L('Làm bài →', 'Start →')}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="h-10" />
    </Screen>
  );
}
