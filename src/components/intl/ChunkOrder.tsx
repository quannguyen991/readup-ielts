import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { useL } from '@/i18n/useL';
import type { ChunkTask } from '@/data/intl/writing';
import type { IntlExam } from '@/store/useIntlStore';
import { useIntlStore } from '@/store/useIntlStore';

/** Build a sentence: chạm các cụm theo thứ tự để ghép thành câu. */
export function ChunkOrder({ task, exam }: { task: ChunkTask; exam: IntlExam }) {
  const { L } = useL();
  const recordSession = useIntlStore((s) => s.recordSession);
  const shuffled = useMemo(() => [...task.chunks].reverse(), [task]);
  const [order, setOrder] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const built = order.map((i) => shuffled[i]).join(' ');

  return (
    <View className="gap-3">
      <Card>
        <Text className="font-strong text-body text-ink">{L('Ghép câu', 'Build a sentence')}</Text>
        <Text className="mt-2 font-sans text-body text-ink">{built || L('(chưa chọn cụm nào)', '(no chunks chosen yet)')}</Text>
      </Card>
      <View className="flex-row flex-wrap gap-2">
        {shuffled.map((chunk, i) => {
          const used = order.includes(i);
          return (
            <Pressable
              key={`${chunk}:${i}`}
              accessibilityRole="button"
              disabled={used || result !== null}
              onPress={() => setOrder((o) => [...o, i])}
              style={{ borderWidth: 1.5, borderRadius: 10, padding: 10, borderColor: '#E4DCCB', backgroundColor: used ? '#F3F0FB' : '#FFFFFF', opacity: used ? 0.5 : 1 }}
            >
              <Text className="font-sans text-body text-ink">{chunk}</Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {result === null ? (
          <>
            <Button
              label={L('Kiểm tra', 'Check')}
              disabled={order.length === 0}
              onPress={() => {
                const ok = built.replace(/[.]/g, '').trim() === task.answer.replace(/[.]/g, '').trim();
                setResult(ok);
                recordSession({ exam, activity: `build:${task.id}`, correct: ok ? 1 : 0, total: 1 });
              }}
            />
            <Button variant="outline" label={L('Làm lại', 'Reset')} onPress={() => setOrder([])} />
          </>
        ) : (
          <Text className="font-strong text-label" style={{ color: result ? '#22A06B' : '#C0502E' }}>
            {result ? L('Đúng', 'Correct') : L(`Chưa đúng. Đáp án: ${task.answer}`, `Not quite. Answer: ${task.answer}`)}
          </Text>
        )}
      </View>
    </View>
  );
}
