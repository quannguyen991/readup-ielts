import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { FillWord, LevelPicker, type LevelChoice } from '@/components/intl/IntlKit';
import { Button, Card } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { buildCompleteWordsSet, isCorrectWord } from '@/services/intl/toefl-complete-words';
import { useIntlStore } from '@/store/useIntlStore';

export default function ToeflCompleteWordsScreen() {
  const { L } = useL();
  const recordSession = useIntlStore((s) => s.recordSession);
  const [seed, setSeed] = useState(() => String(Date.now()));
  const [level, setLevel] = useState<LevelChoice>('all');
  const items = useMemo(() => buildCompleteWordsSet(seed, 10, undefined, level), [seed, level]);
  const [checked, setChecked] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [saved, setSaved] = useState(false);

  const onResult = (ok: boolean) => {
    setChecked((n) => n + 1);
    if (ok) setCorrect((n) => n + 1);
  };

  const newSet = () => {
    setSeed(String(Date.now()));
    setChecked(0);
    setCorrect(0);
    setSaved(false);
  };

  const finish = () => {
    setSaved(true);
    recordSession({ exam: 'toefl', activity: 'complete-words', correct, total: items.length });
  };

  const done = checked === items.length;

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{L('TOEFL · Hoàn thành từ', 'TOEFL · Complete the words')}</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {L(
          'Mỗi câu có một từ bị che hai chữ. Gõ đủ từ rồi kiểm tra. Từ luôn nằm trong ngữ cảnh.',
          'Each sentence hides two letters of one word. Type the full word and check. The word always appears in context.',
        )}
      </Text>

      <View className="mt-4">
        <LevelPicker
          value={level}
          onChange={(v) => {
            setLevel(v);
            newSet();
          }}
        />
      </View>

      <View className="mt-4 gap-3">
        {items.map((item) => (
          <FillWord
            key={`${seed}:${level}:${item.id}`}
            sentence={item.sentence}
            onCheck={(typed) => ({ ok: isCorrectWord(item, typed), answer: item.answer })}
            onResult={onResult}
          />
        ))}
      </View>

      {done ? (
        <Card className="mt-4">
          <Text className="font-heavy text-cardTitle text-ink">{L(`Kết quả: ${correct}/${items.length} từ đúng`, `Score: ${correct}/${items.length} correct`)}</Text>
          <Button className="mt-3" label={saved ? L('Đã lưu', 'Saved') : L('Lưu kết quả', 'Save result')} onPress={finish} disabled={saved} />
        </Card>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button variant="outline" label={L('Bộ khác', 'New set')} onPress={newSet} />
        <Button variant="outline" label={L('Về TOEFL', 'Back to TOEFL')} onPress={() => router.replace('/toefl' as never)} />
      </View>
    </Screen>
  );
}
