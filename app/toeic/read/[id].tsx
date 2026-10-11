import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { QuestionList } from '@/components/intl/IntlKit';
import { Button, Card } from '@/components/ui';
import { TOEIC_PART6, TOEIC_PART7 } from '@/data/intl/toeic-reading';
import { bi, useL } from '@/i18n/useL';
import { fromReading, insertionQuestion } from '@/services/intl/practice';
import { useIntlStore } from '@/store/useIntlStore';

export default function ToeicReadingSetScreen() {
  const { L, locale } = useL();
  const { id: raw } = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(raw) ? raw[0] : raw;
  const recordSession = useIntlStore((s) => s.recordSession);

  const part6 = TOEIC_PART6.find((t) => t.id === id);
  const part7 = TOEIC_PART7.find((s) => s.id === id);
  const set = part6 ?? part7;

  if (!set) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-body text-ink">{L('Không tìm thấy bộ luyện này.', 'This practice set does not exist.')}</Text>
          <Button className="mt-3" label={L('Về danh sách', 'Back to the list')} onPress={() => router.replace('/toeic/practice/reading' as never)} />
        </Card>
      </Screen>
    );
  }

  const questions = part6
    ? [
        ...fromReading(part6.blanks),
        ...(part6.insertion
          ? [insertionQuestion(part6.id + ':insert', part6.insertion.sentence, part6.insertion.answer, part6.insertion.explanation)]
          : []),
      ]
    : fromReading(part7?.questions ?? []);

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{bi(set.title, locale)}</Text>
      <View className="mt-4 gap-3">
        {part6 ? (
          <Card>
            <Text className="font-sans text-body text-ink">{part6.body}</Text>
          </Card>
        ) : (
          part7?.texts.map((t, i) => (
            <Card key={i}>
              <Text className="font-sans text-body text-ink">{t}</Text>
            </Card>
          ))
        )}
      </View>

      <View className="mt-6">
        <QuestionList
          key={set.id}
          questions={questions}
          onSubmit={(correct, total) => recordSession({ exam: 'toeic', activity: `read:${set.id}`, correct, total })}
        />
      </View>

      <View className="mt-4">
        <Button variant="outline" label={L('Về danh sách', 'Back to the list')} onPress={() => router.replace('/toeic/practice/reading' as never)} />
      </View>
    </Screen>
  );
}
