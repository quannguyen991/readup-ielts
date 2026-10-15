import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { DueToday } from '@/components/vocab/DueToday';
import { Card, Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { DeckLibrary } from '@/components/vocab/DeckLibrary';
import { VOCAB_TOPICS, VOCAB_TOPIC_TOTALS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';
import { color } from '@/theme/tokens';

/**
 * Từ vựng — màn đầu của tab Từ vựng. Thư viện bộ từ (tìm kiếm, lọc, TOEIC/TOEFL
 * gộp chung trong "Tất cả") nằm NGAY dưới tiêu đề, vì đó là thứ người học cần
 * chạm vào trước. Các kiểu học theo chủ đề và sổ đến hạn nằm sau.
 *
 * VÌ SAO: sổ từ của app chỉ đầy lên khi người học chạm vào từ trong lúc đọc, nên
 * ngày đầu tiên nó trống trơn. Thư viện này cho người mới thứ để bắt đầu ngay.
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

  const modes: { mode: string; vi: string; en: string; detail: string; detailEn: string; icon: IconName; tint: readonly [string, string] }[] = [
    { mode: 'vocabulary', vi: 'Từ vựng', en: 'Vocabulary', detail: '50 từ mỗi chủ đề', detailEn: '50 words per topic', icon: 'letters', tint: ['#FDF0F5', '#C64E79'] },
    { mode: 'collocations', vi: 'Collocations', en: 'Collocations', detail: 'Cụm từ tự nhiên', detailEn: 'Natural word pairs', icon: 'book', tint: ['#EEF6FF', '#2563EB'] },
    { mode: 'phrasal-verbs', vi: 'Phrasal verbs', en: 'Phrasal verbs', detail: 'Cụm động từ', detailEn: 'Phrasal verbs', icon: 'note', tint: ['#F0FDF4', '#15803D'] },
    { mode: 'mixed', vi: 'Học trộn', en: 'Mixed practice', detail: 'Kết hợp theo chủ đề', detailEn: 'Combined by topic', icon: 'flame', tint: ['#FFF7ED', '#C2410C'] },
  ];

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

      {/* Tìm kiếm + lọc + "Tất cả" (có TOEIC/TOEFL với nhãn riêng) ở ngay đầu trang. */}
      <DeckLibrary initialFilter="all" />

      <DueToday />

      <View className="mt-8">
        <Text className="font-heavy text-cardTitle text-ink">{L('Chọn cách học', 'Pick a way to study')}</Text>
        <Text className="mt-1 font-sans text-label text-muted">
          {L('Từ vựng, collocations, phrasal verbs hoặc trộn cả ba.', 'Vocabulary, collocations, phrasal verbs, or all three mixed.')}
        </Text>
        <View className="mt-3 flex-row flex-wrap" style={{ gap: 10 }}>
          {modes.map((item) => (
            <Pressable
              key={item.mode}
              accessibilityRole="link"
              onPress={() => router.push({ pathname: '/vocabulary/phrasebook', params: { mode: item.mode } } as never)}
              style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({
                flexGrow: 1,
                flexBasis: 160,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 18,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: hovered ? item.tint[1] : '#EFE8DD',
                transform: [{ scale: pressed ? 0.98 : hovered ? 1.01 : 1 }],
                transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                boxShadow: hovered ? `0 8px 22px ${item.tint[1]}22` : '0 1px 2px rgba(15,23,42,0.04)',
              })}
            >
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: item.tint[0], alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={item.icon} size={20} color={item.tint[1]} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="font-heavy text-body" style={{ color: color.ink }}>{L(item.vi, item.en)}</Text>
                <Text className="mt-0.5 font-sans text-label text-muted">{L(item.detail, item.detailEn)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="h-10" />
    </Screen>
  );
}
