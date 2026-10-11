import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button, Card, SectionHeader } from '@/components/ui';
import { HSA_TOPICS } from '@/data/hsa';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';

export default function HsaTopicsScreen() {
  const { L, locale } = useL();
  return <Screen>
    <Text className="font-heavy text-pageTitle text-ink">{L('Chủ điểm HSA', 'HSA review topics')}</Text>
    <Text className="mt-1 font-sans text-body text-muted">{L('Ôn từ vựng trong ngữ cảnh, lập luận và cách đọc văn bản học thuật.', 'Review vocabulary in context, reasoning and academic reading strategies.')}</Text>
    <View className="mt-4 gap-3">{HSA_TOPICS.map((topic) => <Card key={topic.id}>
      <Text className="font-strong text-cardTitle text-ink">{bi(topic.title, locale)}</Text>
      <Text className="mt-1 font-sans text-body text-muted">{bi(topic.summary, locale)}</Text>
      <Text className="mt-2 font-sans text-label text-muted">{L(`${topic.vocabulary.length} từ · ${HSA_QUESTION_BANK.filter((question) => question.topic === topic.id).length} câu · ${topic.focus.length} trọng tâm`, `${topic.vocabulary.length} words · ${HSA_QUESTION_BANK.filter((question) => question.topic === topic.id).length} questions · ${topic.focus.length} review points`)}</Text>
      <Button className="mt-3" variant="outline" label={L('Ôn chủ điểm', 'Review topic')} onPress={() => router.push(`/hsa/topic/${topic.id}` as never)} />
    </Card>)}</View>
    <SectionHeader className="mt-6" title={L('Cách làm bài khó', 'How to approach harder items')} icon="target" />
    <Card className="mt-3 gap-2">
      <Text className="font-sans text-body text-ink">{L('• Tách luận điểm, bằng chứng và suy luận; không chọn đáp án chỉ vì lặp lại đúng từ trong bài.', '• Separate claims, evidence and inference; do not choose an answer just because it repeats the passage wording.')}</Text>
      <Text className="font-sans text-body text-ink">{L('• Với câu nhiều mệnh đề, kiểm tra từng phần; một chi tiết sai làm cả lựa chọn sai.', '• For multi-part options, check every clause; one false detail makes the whole option wrong.')}</Text>
      <Text className="font-sans text-body text-ink">{L('• Câu luyện có độ dài và suy luận tăng dần; mức CEFR chỉ mô tả gần đúng độ khó ngôn ngữ.', '• Practice items increase in length and reasoning demand; CEFR labels are only approximate language-difficulty guides.')}</Text>
    </Card>
  </Screen>;
}
