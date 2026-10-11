import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button, Card } from '@/components/ui';
import { HSA_PAPERS } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';

export default function HsaPapersScreen() {
  const { L, locale } = useL();
  return <Screen>
    <Text className="font-heavy text-pageTitle text-ink">{L('20 đề mô phỏng HSA', '20 HSA practice papers')}</Text>
    <Text className="mt-1 font-sans text-body text-muted">{L('Mỗi mã đề có 50 câu và 60 phút. Các đề được phối hợp từ ngân hàng 180 câu; câu hỏi có thể lặp lại giữa những mã đề khác nhau.', 'Each form has 50 questions and 60 minutes. Forms are assembled from a 180-item bank, so some questions recur across forms.')}</Text>
    <View className="mt-4 gap-2">{HSA_PAPERS.map((paper, index) => <Card key={paper.id} className="flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1">
        <Text className="font-strong text-body text-ink">{bi(paper.title, locale)}</Text>
        <Text className="mt-1 font-sans text-label text-muted">{L('50 câu · 60 phút · đáp án sau khi nộp', '50 questions · 60 minutes · answers after submission')}</Text>
      </View>
      <Button size="sm" label={index === 0 ? L('Bắt đầu', 'Start') : L('Làm đề', 'Open')} onPress={() => router.push(index === 0 ? '/hsa/exam' as never : `/hsa/exam/${paper.id}` as never)} />
    </Card>)}</View>
  </Screen>;
}
