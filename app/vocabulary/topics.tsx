import React from 'react';
import { Text, View } from 'react-native';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { DueToday } from '@/components/vocab/DueToday';
import { Card } from '@/components/ui';
import { DeckLibrary } from '@/components/vocab/DeckLibrary';
import { VOCAB_TOPICS, VOCAB_TOPIC_TOTALS } from '@/data/vocab-topics';
import { useL } from '@/i18n/useL';

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
      <DeckLibrary initialFilter="ielts" />
      <View className="h-10" />
    </Screen>
  );
}
