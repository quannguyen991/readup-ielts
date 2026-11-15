import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { HsaRunner } from '@/components/hsa/HsaRunner';
import { DarkButton } from '@/components/hsa/stage';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import type { HsaQuestion } from '@/data/hsa';
import { useL } from '@/i18n/useL';
import { restoreItems } from '@/services/hsa/attempts';
import { latestPerQuestion } from '@/services/hsa/plan';
import { useHsaStore } from '@/store/useHsaStore';

const INDEX = new Map(HSA_QUESTION_BANK.map((q) => [q.id, q]));
const MAX = 10;

/** Chữa lại các câu đang sai (lần làm gần nhất của mỗi câu là sai), tối đa 10 câu mỗi lượt. */
export default function HsaReviewScreen() {
  const { L } = useL();
  // Chốt danh sách câu ngay lúc mở: nộp bài sẽ ghi thêm lượt làm và đổi "câu đang sai", không được đổi câu giữa chừng.
  const [questions] = useState<HsaQuestion[]>(() => {
    const latest = latestPerQuestion(useHsaStore.getState().attempts.map((a) => restoreItems(a, INDEX)));
    return latest
      .filter((it) => it.picked !== null && it.picked !== it.answer)
      .slice(0, MAX)
      .map((it) => INDEX.get(it.qid)!)
      .filter(Boolean);
  });

  if (questions.length === 0) {
    return (
      <Screen>
        <View className="w-full self-center" style={{ maxWidth: 640, gap: 12 }}>
          <Text className="font-nun-heavy" style={{ fontSize: 26, color: '#17132E' }}>
            {L('Chưa có câu sai để chữa', 'No missed questions to fix')}
          </Text>
          <Text className="font-nun-strong" style={{ fontSize: 15, lineHeight: 22, color: '#6E6890' }}>
            {L('Làm một bài luyện hoặc bài test đầu vào, những câu sai sẽ hiện ở đây để bạn chữa lại.', 'Do a practice set or the entry test, and the questions you miss will show up here to fix.')}
          </Text>
          <View style={{ alignSelf: 'flex-start' }}>
            <DarkButton label={L('Về trang HSA', 'Back to HSA')} onPress={() => router.replace('/hsa' as never)} />
          </View>
        </View>
      </Screen>
    );
  }
  return <HsaRunner title={L('HSA · Chữa lại câu đã sai', 'HSA · Fix missed questions')} questions={questions} activity="review:wrong" />;
}
