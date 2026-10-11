import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Countdown, ListenPassageSet } from '@/components/intl/SkillKit';
import { IntlDisclaimer, QuestionList } from '@/components/intl/IntlKit';
import { Button, Card, SectionHeader } from '@/components/ui';
import { TOEFL_LISTENING } from '@/data/intl/listening';
import { TOEFL_ACADEMIC_PASSAGE } from '@/data/intl/toefl-reading';
import { bi, useL } from '@/i18n/useL';
import { fromReading } from '@/services/intl/practice';
import { useIntlStore } from '@/store/useIntlStore';

/**
 * Thi thử rút gọn TOEFL: một bài đọc học thuật và một bài giảng nghe. Không phải đề thi thật,
 * không quy đổi điểm. Mỗi phần lưu kết quả riêng.
 */
export default function ToeflMockScreen() {
  const { L, locale } = useL();
  const recordSession = useIntlStore((s) => s.recordSession);
  const lecture = TOEFL_LISTENING.find((p) => p.kind === 'lecture');
  const passage = TOEFL_ACADEMIC_PASSAGE;

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{L('TOEFL · Thi thử rút gọn', 'TOEFL · Short mock test')}</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {L('Một bài đọc và một bài giảng nghe. Thời gian gợi ý 30 phút (tự đặt, không phải thời gian chính thức).', 'One reading passage and one listening lecture. Suggested time 30 minutes (self-timed, not the official time).')}
      </Text>
      <Card className="mt-3">
        <Countdown seconds={30 * 60} running />
      </Card>

      <SectionHeader className="mt-6" title={L('Đọc', 'Reading')} icon="book" />
      <View className="mt-3 gap-3">
        <Card>
          <Text className="font-strong text-body text-ink">{bi(passage.title, locale)}</Text>
          {passage.text.split('\n\n').map((p, i) => (
            <Text key={i} className="mt-2 font-sans text-body text-ink">{p}</Text>
          ))}
        </Card>
        <QuestionList
          questions={fromReading(passage.questions)}
          onSubmit={(correct, total) => recordSession({ exam: 'toefl', activity: 'mock:reading', correct, total })}
        />
      </View>

      <SectionHeader className="mt-6" title={L('Nghe', 'Listening')} icon="volume" />
      <View className="mt-3">{lecture ? <ListenPassageSet passage={lecture} exam="toefl" /> : null}</View>

      <View className="mt-6 flex-row flex-wrap gap-2">
        <Button variant="outline" label={L('Về TOEFL', 'Back to TOEFL')} onPress={() => router.replace('/toefl' as never)} />
      </View>
      <View className="mt-6">
        <IntlDisclaimer />
      </View>
    </Screen>
  );
}
