import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { IntlDisclaimer } from '@/components/intl/IntlKit';
import { Button, Card } from '@/components/ui';
import { TOEIC_PART6, TOEIC_PART7 } from '@/data/intl/toeic-reading';
import { bi, useL } from '@/i18n/useL';

export default function ToeicReadingListScreen() {
  const { L, locale } = useL();
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{L('TOEIC · Part 6 & 7', 'TOEIC · Part 6 & 7')}</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {L(
          'Bộ mẫu do Band 9 soạn. Đọc đoạn văn trước, rồi trả lời câu hỏi.',
          'Sample sets written by Band 9. Read the text first, then answer the questions.',
        )}
      </Text>

      <Text className="mt-6 font-strong text-cardTitle text-ink">Part 6 · {L('Hoàn thành đoạn văn', 'Text completion')}</Text>
      <View className="mt-2 gap-2">
        {TOEIC_PART6.map((t) => (
          <Card key={t.id}>
            <Text className="font-strong text-body text-ink">{bi(t.title, locale)}</Text>
            <Button className="mt-2 self-start" size="sm" variant="outline" label={L('Luyện bộ này', 'Practice this set')} onPress={() => router.push(`/toeic/read/${t.id}` as never)} />
          </Card>
        ))}
      </View>

      <Text className="mt-6 font-strong text-cardTitle text-ink">Part 7 · {L('Đọc hiểu', 'Reading comprehension')}</Text>
      <View className="mt-2 gap-2">
        {TOEIC_PART7.map((s) => (
          <Card key={s.id}>
            <Text className="font-strong text-body text-ink">{bi(s.title, locale)}</Text>
            <Button className="mt-2 self-start" size="sm" variant="outline" label={L('Luyện bộ này', 'Practice this set')} onPress={() => router.push(`/toeic/read/${s.id}` as never)} />
          </Card>
        ))}
      </View>

      <View className="mt-6">
        <IntlDisclaimer />
      </View>
    </Screen>
  );
}
