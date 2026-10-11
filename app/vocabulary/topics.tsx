import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { DueToday } from '@/components/vocab/DueToday';
import { Card } from '@/components/ui';
import { DeckLibrary } from '@/components/vocab/DeckLibrary';
import { UnitList } from '@/components/intl/UnitList';
import { VOCAB_TOPICS, VOCAB_TOPIC_TOTALS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { color } from '@/theme/tokens';

/**
 * Từ vựng theo chủ đề — cùng thư viện bộ từ với trang Quiz từ vựng, lọc sẵn
 * nhóm Chủ đề IELTS. Một kiểu thẻ, một cách vào bộ, dù đi từ mục nào của menu.
 *
 * VÌ SAO MÀN NÀY TỒN TẠI: sổ từ của app chỉ đầy lên khi người học chạm vào từ
 * trong lúc đọc, nên ngày đầu tiên nó TRỐNG TRƠN. Năm mươi bộ này cho người mới
 * thứ để bắt đầu ngay, và cho người sắp thi một danh sách rà theo chủ đề.
 */
export default function VocabTopicsScreen() {
  const { L, locale } = useL();
  if (VOCAB_TOPICS.length === 0) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Chưa có bộ từ nào', 'No word sets yet')}</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            {L('Bộ từ theo chủ đề chưa được sinh vào bản dựng này. Chạy', 'Topic word sets weren’t generated in this build. Run')}{' '}
            <Text className="font-strong text-ink">npm run vocab:topics</Text> {L('rồi build lại.', 'and rebuild.')}
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="vocab"
          badge={L('TỪ VỰNG', 'VOCABULARY')}
          line1={L('Từ vựng theo chủ đề', 'Vocabulary by topic')}
          line2={L('học trong câu, nhớ bằng ôn lặp', 'learn in context, remember with review')}
          subtitle={L(
            `${VOCAB_TOPIC_TOTALS.topics} chủ đề hay ra trong đề IELTS, ${VOCAB_TOPIC_TOTALS.words.toLocaleString('vi-VN')} từ. Mỗi từ có phiên âm, nghĩa tiếng Việt, một câu ví dụ và một collocation đi kèm.`,
            `${VOCAB_TOPIC_TOTALS.topics} common IELTS topics, ${VOCAB_TOPIC_TOTALS.words.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} words. Each word has its pronunciation, Vietnamese meaning, an example sentence and a collocation.`,
          )}
        />
      </Appear>
      <DueToday />
      <View className="mt-4">
        <Text className="font-heavy text-cardTitle text-ink">{L('Học theo chủ đề', 'Study by topic')}</Text>
        <Text className="mt-1 font-sans text-label text-muted">{L('Chọn riêng từ vựng, collocations, phrasal verbs hoặc trộn cả ba.', 'Choose vocabulary, collocations, phrasal verbs, or mix all three.')}</Text>
        <View className="mt-3 flex-row flex-wrap" style={{ gap: 9 }}>
          {[
            { mode: 'vocabulary', vi: 'Từ vựng', en: 'Vocabulary', detail: '50 từ mỗi chủ đề' },
            { mode: 'collocations', vi: 'Collocations', en: 'Collocations', detail: 'Cụm từ tự nhiên' },
            { mode: 'phrasal-verbs', vi: 'Phrasal verbs', en: 'Phrasal verbs', detail: 'Cụm động từ' },
            { mode: 'mixed', vi: 'Học trộn', en: 'Mixed practice', detail: 'Kết hợp theo chủ đề' },
          ].map((item) => (
            <Pressable
              key={item.mode}
              accessibilityRole="link"
              onPress={() => router.push({ pathname: '/vocabulary/phrasebook', params: { mode: item.mode } } as never)}
              style={({ hovered }: { hovered?: boolean }) => ({ flexGrow: 1, flexBasis: 170, padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9E2D8', opacity: hovered ? 0.88 : 1 })}
            >
              <Text className="font-heavy text-body" style={{ color: color.ink }}>{L(item.vi, item.en)}</Text>
              <Text className="mt-1 font-sans text-label text-muted">{L(item.detail, item.mode === 'vocabulary' ? '50 words per topic' : item.mode === 'collocations' ? 'Natural word pairs' : item.mode === 'phrasal-verbs' ? 'Phrasal verbs' : 'Combined by topic')}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="mt-6">
        <Text className="font-heavy text-cardTitle text-ink">{L('TOEIC và TOEFL theo unit', 'TOEIC and TOEFL by unit')}</Text>
        <Text className="mt-1 font-sans text-label text-muted">
          {L('Mỗi unit 10 từ. Đánh dấu từ đã thuộc để theo dõi tiến độ.', 'Each unit has 10 words. Mark the words you know to track progress.')}
        </Text>
        <Text className="mt-4 font-strong text-body text-ink">TOEIC</Text>
        <View className="mt-2">
          <UnitList exam="toeic" compact />
        </View>
        <Text className="mt-4 font-strong text-body text-ink">TOEFL</Text>
        <View className="mt-2">
          <UnitList exam="toefl" compact />
        </View>
      </View>
      <DeckLibrary initialFilter="ielts" />
      <View className="h-10" />
    </Screen>
  );
}
