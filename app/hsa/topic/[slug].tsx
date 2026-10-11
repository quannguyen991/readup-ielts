import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import { HSA_TOPICS } from '@/data/hsa';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';

export default function HsaTopicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const topic = HSA_TOPICS.find((item) => item.id === slug);
  const { L, locale } = useL();
  if (!topic) return <Screen><Text className="font-strong text-body text-ink">{L('Không tìm thấy chủ điểm.', 'Topic not found.')}</Text></Screen>;
  const count = HSA_QUESTION_BANK.filter((question) => question.topic === topic.id).length;
  return <Screen>
    <Text className="font-heavy text-pageTitle text-ink">{bi(topic.title, locale)}</Text>
    <Text className="mt-1 font-sans text-body text-muted">{bi(topic.summary, locale)}</Text>
    <SectionHeader className="mt-5" title={L('Trọng tâm ôn tập', 'Review focus')} icon="list" />
    <Card className="mt-3 gap-3">{topic.focus.map((item, index) => <Text key={index} className="font-sans text-body text-ink" style={{ lineHeight: 22 }}>• {bi(item, locale)}</Text>)}</Card>
    <SectionHeader className="mt-6" title={L('Từ vựng trong ngữ cảnh', 'Vocabulary in context')} icon="book" />
    <View className="mt-3 gap-2">{topic.vocabulary.map((item) => <Card key={item.word} className="gap-1">
      <View className="flex-row flex-wrap items-center gap-2"><Text className="font-strong text-body text-ink">{item.word}</Text><Badge label={`${item.level} · ${item.pos}`} tone={item.level === 'C1' ? 'danger' : item.level === 'B2' ? 'warning' : 'neutral'} /></View>
      <Text className="font-sans text-body text-muted">{item.vi}</Text>
      <Text className="font-sans text-label text-ink">{item.example}</Text>
    </Card>)}</View>
    <SectionHeader className="mt-6" title={L('Luyện câu hỏi liên quan', 'Practise related questions')} icon="play" />
    <Card className="mt-3">
      <Text className="font-sans text-body text-ink">{L(`${count} câu trong bộ đề mô phỏng hiện có liên quan đến chủ điểm này.`, `${count} items in the current practice paper are tagged to this topic.`)}</Text>
      <Button className="mt-3" label={L('Bắt đầu luyện', 'Start practice')} disabled={count === 0} onPress={() => router.push(`/hsa/topic/${topic.id}/practice` as never)} />
    </Card>
  </Screen>;
}
