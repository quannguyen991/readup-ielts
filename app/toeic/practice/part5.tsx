import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { LevelPicker, QuestionList, type LevelChoice } from '@/components/intl/IntlKit';
import { Button } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { buildPart5Set, part5PoolSize } from '@/services/intl/toeic-part5';
import { fromPart5 } from '@/services/intl/practice';
import { useIntlStore } from '@/store/useIntlStore';

export default function ToeicPart5Screen() {
  const { L } = useL();
  const recordSession = useIntlStore((s) => s.recordSession);
  const [seed, setSeed] = useState(() => String(Date.now()));
  const [level, setLevel] = useState<LevelChoice>('all');
  const questions = useMemo(() => fromPart5(buildPart5Set(seed, 10, level)), [seed, level]);

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{L('TOEIC · Part 5', 'TOEIC · Part 5')}</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {L(
          `Câu chưa hoàn chỉnh: từ loại, thì, hoà hợp chủ–vị, bị động, lượng từ, danh động từ, liên từ, so sánh. Có ${part5PoolSize(level === 'all' ? 'all' : level)} câu trong mức đã chọn. Mỗi lựa chọn sai đều có lý do.`,
          `Incomplete sentences: parts of speech, tenses, agreement, passive voice, quantifiers, gerunds, conjunctions and comparatives. ${part5PoolSize(level === 'all' ? 'all' : level)} questions at this level. Every wrong choice has a reason.`,
        )}
      </Text>

      <View className="mt-4">
        <LevelPicker
          value={level}
          onChange={(v) => {
            setLevel(v);
            setSeed(String(Date.now()));
          }}
        />
      </View>

      <View className="mt-4">
        <QuestionList
          key={`${seed}:${level}`}
          questions={questions}
          onSubmit={(correct, total) => recordSession({ exam: 'toeic', activity: 'part5', correct, total })}
        />
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button variant="outline" label={L('Bộ câu khác', 'New set')} onPress={() => setSeed(String(Date.now()))} />
        <Button variant="outline" label={L('Về TOEIC', 'Back to TOEIC')} onPress={() => router.replace('/toeic' as never)} />
      </View>
    </Screen>
  );
}
