import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { IntlDisclaimer, LevelPicker, QuestionList, type LevelChoice } from '@/components/intl/IntlKit';
import { Button, Card } from '@/components/ui';
import { TOEFL_PASSAGES } from '@/data/intl/toefl-reading';
import { LEVEL_LABEL } from '@/data/intl/level';
import { bi, useL } from '@/i18n/useL';
import { fromReading } from '@/services/intl/practice';
import { useIntlStore } from '@/store/useIntlStore';

export default function ToeflReadingScreen() {
  const { L, locale } = useL();
  const recordSession = useIntlStore((s) => s.recordSession);
  const [level, setLevel] = useState<LevelChoice>('all');
  const passages = useMemo(() => TOEFL_PASSAGES.filter((p) => level === 'all' || p.level === level), [level]);
  const [index, setIndex] = useState(0);
  const passage = passages[index] ?? passages[0];
  if (!passage) return null;
  const questions = fromReading(passage.questions);

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{L('TOEFL · Bài đọc học thuật', 'TOEFL · Academic reading')}</Text>
      <Text className="mt-1 mb-3 font-sans text-label text-muted">
        {L('Chọn mức độ, chọn bài, đọc, rồi trả lời. Có các dạng: ý chính, chi tiết, từ trong ngữ cảnh, tham chiếu, chèn câu, suy luận, mục đích.', 'Choose a level and a passage, read it, then answer. Types include main idea, detail, vocabulary in context, reference, sentence insertion, inference and purpose.')}
      </Text>

      <LevelPicker
        value={level}
        onChange={(v) => {
          setLevel(v);
          setIndex(0);
        }}
      />

      <View className="mt-3 flex-row flex-wrap gap-2">
        {passages.map((p, i) => {
          const active = i === index;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setIndex(i)}
              style={{ borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderColor: active ? '#B07A3A' : '#E4DCCB', backgroundColor: active ? '#F7EDDA' : '#FFFFFF' }}
            >
              <Text className="font-strong text-label text-ink">{`${bi(p.title, locale)} · ${bi(LEVEL_LABEL[p.level], locale)}`}</Text>
            </Pressable>
          );
        })}
      </View>
      {passages.length === 0 ? <Text className="mt-3 font-sans text-body text-muted">{L('Chưa có bài ở mức này.', 'No passage at this level yet.')}</Text> : null}

      <Card className="mt-4">
        <Text className="font-strong text-body text-ink">{bi(passage.title, locale)}</Text>
        {passage.text.split('\n\n').map((para, i) => (
          <Text key={i} className="mt-3 font-sans text-body text-ink" style={{ lineHeight: 22 }}>
            {para}
          </Text>
        ))}
      </Card>

      <View className="mt-6">
        <QuestionList
          key={passage.id}
          questions={questions}
          onSubmit={(correct, total) => recordSession({ exam: 'toefl', activity: `reading:${passage.id}`, correct, total })}
        />
      </View>

      <View className="mt-4">
        <Button variant="outline" label={L('Về TOEFL', 'Back to TOEFL')} onPress={() => router.replace('/toefl' as never)} />
      </View>
      <View className="mt-6">
        <IntlDisclaimer />
      </View>
    </Screen>
  );
}
