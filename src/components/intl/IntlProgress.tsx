import React from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { ALL_TOEFL_VOCAB, ALL_TOEIC_VOCAB } from '@/data/intl/units';
import { isKnown, useIntlStore, type IntlExam } from '@/store/useIntlStore';

/** Tóm tắt tiến độ của một kỳ thi, tính từ lịch sử đã lưu trên máy. */
export function IntlProgress({ exam }: { exam: IntlExam }) {
  const { L } = useL();
  const known = useIntlStore((s) => s.known);
  const sessions = useIntlStore((s) => s.sessions);
  const vocab = exam === 'toeic' ? ALL_TOEIC_VOCAB : ALL_TOEFL_VOCAB;
  const knownCount = vocab.filter((e) => isKnown(known, exam, e.word)).length;
  const mine = sessions.filter((s) => s.exam === exam);
  const lastMock = mine.find((s) => s.activity.startsWith('mock:'));
  const selfChecks = mine.filter((s) => s.activity.startsWith('write:') || s.activity.startsWith('speak:')).length;

  return (
    <Card className="mt-4">
      <Text className="font-strong text-body text-ink">{L('Tiến độ của bạn', 'Your progress')}</Text>
      <View className="mt-2 gap-1">
        <Text className="font-sans text-body text-ink">{L(`Từ đã thuộc: ${knownCount}/${vocab.length}`, `Words known: ${knownCount}/${vocab.length}`)}</Text>
        <Text className="font-sans text-body text-ink">{L(`Lượt luyện đã lưu: ${mine.length}`, `Saved practice sessions: ${mine.length}`)}</Text>
        <Text className="font-sans text-body text-ink">
          {lastMock
            ? L(`Thi thử gần nhất: ${lastMock.correct}/${lastMock.total} câu đúng`, `Latest mock: ${lastMock.correct}/${lastMock.total} correct`)
            : L('Chưa có lượt thi thử nào.', 'No mock test yet.')}
        </Text>
        <Text className="font-sans text-body text-ink">{L(`Bài viết và bài nói đã tự đánh giá: ${selfChecks}`, `Writing and speaking self-checks: ${selfChecks}`)}</Text>
      </View>
    </Card>
  );
}
