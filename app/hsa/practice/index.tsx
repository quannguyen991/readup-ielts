import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { HSA_EXTENDED_KIND_ORDER, HSA_KIND_LABEL, HSA_OFFICIAL_KIND_ORDER } from '@/data/hsa';
import { bi, useL } from '@/i18n/useL';

export default function HsaPracticeIndex() {
  const { L, locale } = useL();
  return <Screen>
    <Text className="font-heavy text-pageTitle text-ink">{L('Luyện theo dạng', 'Practise by question type')}</Text>
    <Text className="mt-1 font-sans text-body text-muted">{L('Chọn một dạng để làm câu hỏi, xem giải thích sau khi nộp.', 'Choose a question type. Explanations appear after submission.')}</Text>
    <Text className="mt-4 font-strong text-body text-ink">{L('Theo cấu trúc đề tham khảo', 'Reference exam types')}</Text>
    <View className="mt-2 gap-2">{HSA_OFFICIAL_KIND_ORDER.map((kind) => <Button key={kind} variant="outline" label={bi(HSA_KIND_LABEL[kind], locale)} onPress={() => router.push(`/hsa/practice/${kind}` as never)} />)}</View>
    <Text className="mt-5 font-strong text-body text-ink">{L('Dạng luyện mở rộng', 'Extended practice')}</Text>
    <Text className="mt-1 font-sans text-label text-muted">{L('Các dạng này bổ trợ kỹ năng đọc và suy luận, không được tính vào cấu trúc đề 50 câu.', 'These formats extend reading and reasoning practice; they are not counted in the 50-question format.')}</Text>
    <View className="mt-2 gap-2">{HSA_EXTENDED_KIND_ORDER.map((kind) => <Button key={kind} variant="outline" label={bi(HSA_KIND_LABEL[kind], locale)} onPress={() => router.push(`/hsa/practice/${kind}` as never)} />)}</View>
  </Screen>;
}
