import React from 'react';
import { Linking, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card, SectionHeader } from '@/components/ui';
import { HSA_DISCLAIMER, HSA_EXTENDED_KIND_ORDER, HSA_KIND_LABEL, HSA_OFFICIAL_KIND_ORDER, HSA_TOPICS } from '@/data/hsa';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';
import { isKnown, useIntlStore } from '@/store/useIntlStore';

export default function HsaHomeScreen() {
  const { L, locale } = useL();
  const known = useIntlStore((s) => s.known);
  const sessions = useIntlStore((s) => s.sessions).filter((session) => session.exam === 'hsa');
  const knownCount = HSA_TOPICS.flatMap((topic) => topic.vocabulary).filter((item) => isKnown(known, 'hsa', item.word)).length;
  const vocabCount = HSA_TOPICS.reduce((sum, topic) => sum + topic.vocabulary.length, 0);
  const recent = sessions[0];

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">HSA · Tiếng Anh</Text>
      <Text className="mt-1 font-sans text-body text-muted">{L('Luyện theo cấu trúc HSA 2026. Độ khó đến từ văn bản học thuật, suy luận nhiều bước và đáp án nhiễu; nhãn CEFR chỉ mô tả gần đúng độ khó ngôn ngữ.', 'Practise the 2026 HSA structure. Difficulty comes from academic texts, multi-step inference and close distractors; CEFR labels only approximate language difficulty.')}</Text>

      <Card className="mt-4">
        <Text className="font-strong text-body text-ink">{L('Ma trận tham khảo HSA-F', 'HSA-F reference blueprint')}</Text>
        <View className="mt-2 gap-1">
          <Text className="font-sans text-body text-ink">{L('50 câu trắc nghiệm · 60 phút', '50 multiple-choice questions · 60 minutes')}</Text>
          <Text className="font-sans text-body text-ink">{L('30 câu ngôn ngữ · 15 câu đọc hiểu theo 3 chùm · 5 câu suy luận', '30 language items · 15 reading items in 3 clusters · 5 reasoning items')}</Text>
          <Text className="font-sans text-body text-muted">{L('Mức độ tham chiếu: A2 25% · B1 35% · B2 35% · C1 5%', 'Reference levels: A2 25% · B1 35% · B2 35% · C1 5%')}</Text>
        </View>
      </Card>

      <Card className="mt-3">
        <Text className="font-strong text-body text-ink">{L('Tiến độ HSA', 'HSA progress')}</Text>
        <Text className="mt-2 font-sans text-body text-ink">{L(`Từ đã đánh dấu thuộc: ${knownCount}/${vocabCount}`, `Words marked known: ${knownCount}/${vocabCount}`)}</Text>
        <Text className="mt-1 font-sans text-body text-ink">{L(`Lượt luyện đã lưu: ${sessions.length}`, `Saved practice sessions: ${sessions.length}`)}</Text>
        <Text className="mt-1 font-sans text-body text-ink">{recent ? L(`Gần nhất: ${recent.correct}/${recent.total} câu`, `Latest: ${recent.correct}/${recent.total} questions`) : L('Chưa có kết quả luyện tập.', 'No practice results yet.')}</Text>
      </Card>

      <SectionHeader className="mt-6" title={L('Làm đề', 'Take a practice paper')} icon="clock" />
      <View className="mt-3 gap-2">
        <Button label={L('Làm đề mô phỏng 01 · 50 câu · 60 phút', 'Practice paper 01 · 50 questions · 60 minutes')} onPress={() => router.push('/hsa/exam' as never)} />
        <Button variant="outline" label={L('Chọn trong 20 đề mô phỏng', 'Choose from all 20 papers')} onPress={() => router.push('/hsa/exams' as never)} />
        <Button variant="outline" label={L('Chẩn đoán nhanh · 20 câu', 'Quick diagnostic · 20 questions')} onPress={() => router.push('/hsa/diagnostic' as never)} />
        <Button variant="outline" label={L('Thử thách suy luận nâng cao · 10 câu', 'Advanced reasoning challenge · 10 questions')} onPress={() => router.push('/hsa/advanced' as never)} />
      </View>

      <SectionHeader className="mt-6" title={L('Dạng theo cấu trúc đề tham khảo', 'Question types in the reference format')} icon="list" />
      <Text className="mt-1 font-sans text-label text-muted">{L(`${HSA_QUESTION_BANK.length} câu độc lập trong ngân hàng luyện tập.`, `${HSA_QUESTION_BANK.length} unique items in the practice bank.`)}</Text>
      <View className="mt-3 gap-2">
        {HSA_OFFICIAL_KIND_ORDER.map((kind) => {
          const count = HSA_QUESTION_BANK.filter((question) => question.kind === kind).length;
          return <Button key={kind} variant="outline" label={`${bi(HSA_KIND_LABEL[kind], locale)} · ${count} ${L('câu', 'items')}`} onPress={() => router.push(`/hsa/practice/${kind}` as never)} />;
        })}
      </View>

      <SectionHeader className="mt-6" title={L('Dạng luyện mở rộng', 'Extended practice formats')} subtitle={L('Bài bổ trợ, không thuộc riêng ma trận 50 câu.', 'Supplementary practice, outside the 50-item blueprint.')} icon="sparkle" />
      <View className="mt-3 gap-2">
        {HSA_EXTENDED_KIND_ORDER.map((kind) => {
          const count = HSA_QUESTION_BANK.filter((question) => question.kind === kind).length;
          return <Button key={kind} variant="outline" label={`${bi(HSA_KIND_LABEL[kind], locale)} · ${count} ${L('câu', 'items')}`} onPress={() => router.push(`/hsa/practice/${kind}` as never)} />;
        })}
      </View>

      <SectionHeader className="mt-6" title={L('Ôn tập theo chủ điểm', 'Review by topic')} icon="book" />
      <View className="mt-3 gap-2">
        <Button variant="outline" label={L('Mở danh sách 10 chủ điểm', 'Browse all 10 topics')} onPress={() => router.push('/hsa/topics' as never)} />
        <Button variant="outline" label={L(`Từ vựng HSA · ${vocabCount} mục`, `HSA vocabulary · ${vocabCount} items`)} onPress={() => router.push('/hsa/vocab' as never)} />
      </View>

      <Text className="mt-6 font-sans text-label text-muted" style={{ lineHeight: 19 }}>{bi(HSA_DISCLAIMER, locale)}</Text>
      <SectionHeader className="mt-5" title={L('Tài liệu tham khảo', 'Reference materials')} icon="external" />
      <View className="mt-3 gap-2">
        <Button variant="outline" label={L('Đề cương dạng thức HSA 2026 · ĐHQGHN', 'HSA 2026 test specification · VNU')} onPress={() => Linking.openURL('https://idt.vnu.edu.vn/api/media/file/%C4%90%E1%BB%81%20c%C6%B0%C6%A1ng%20d%E1%BA%A1ng%20th%E1%BB%A9c%20c%E1%BB%A7a%20b%C3%A0i%20thi%20HSA%202026.pdf')} />
        <Button variant="outline" label={L('Đề tham khảo HSA 2025', 'HSA 2025 sample paper')} onPress={() => Linking.openURL('https://resource.hsa.edu.vn/files/upload/2024-08-09%20De%20thi%20tham%20khao%20HSA%20nam%202025.pdf')} />
      </View>
    </Screen>
  );
}
