import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { IntlDisclaimer } from '@/components/intl/IntlKit';
import { Button, Card, SectionHeader } from '@/components/ui';
import { TOEIC_LR, TOEIC_LR_LEVELS, TOEIC_SW } from '@/data/intl/toeic-structure';
import { bi, useL } from '@/i18n/useL';
import { IntlProgress } from '@/components/intl/IntlProgress';

export default function ToeicHomeScreen() {
  const { L, locale } = useL();
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">TOEIC</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {L('Cấu trúc đề, cách luyện từng phần, và từ vựng công việc hay gặp.', 'Test structure, practice by part, and the business vocabulary that appears most.')}
      </Text>

      <IntlProgress exam="toeic" />

      <SectionHeader className="mt-6" title={L('Cấu trúc bài thi', 'Test structure')} icon="list" />
      {TOEIC_LR.map((section) => (
        <Card key={section.key} className="mt-3">
          <Text className="font-strong text-cardTitle text-ink">{bi(section.title, locale)}</Text>
          <Text className="mt-1 font-sans text-label text-muted">
            {L(`${section.questions} câu · ${section.minutes} phút`, `${section.questions} questions · ${section.minutes} minutes`)}
          </Text>
          <View className="mt-2 gap-1">
            {section.parts.map((p) => (
              <Text key={p.part} className="font-sans text-body text-ink">
                {`Part ${p.part} · ${bi(p.title, locale)} (${p.questions})`}
              </Text>
            ))}
          </View>
        </Card>
      ))}

      <SectionHeader className="mt-6" title={L('Speaking và Writing', 'Speaking and Writing')} subtitle={L('Số liệu cần đối chiếu với ETS trước khi dùng.', 'Figures to be checked against ETS before use.')} icon="info" />
      {TOEIC_SW.map((s) => (
        <Card key={s.key} className="mt-3">
          <Text className="font-strong text-cardTitle text-ink">{bi(s.title, locale)}</Text>
          <Text className="mt-1 font-sans text-label text-muted">
            {L(`${s.questions} câu · ${s.minutes} phút · thang ${s.scale}`, `${s.questions} questions · ${s.minutes} minutes · scale ${s.scale}`)}
          </Text>
          <Text className="mt-2 font-sans text-body text-ink">{bi(s.desc, locale)}</Text>
        </Card>
      ))}

      <SectionHeader className="mt-6" title={L('Điểm Listening và Reading', 'Listening and Reading scores')} subtitle={L('Mỗi kỹ năng 10–990 điểm.', 'Each skill is scored 10–990.')} icon="trophy" />
      <Card className="mt-3 gap-1">
        {TOEIC_LR_LEVELS.map((level) => (
          <Text key={level.min} className="font-sans text-body text-ink">
            {`${level.min}–${level.max} · ${bi(level.name, locale)}`}
          </Text>
        ))}
      </Card>

      <SectionHeader className="mt-6" title={L('Luyện tập', 'Practice')} icon="play" />
      <View className="mt-3 gap-2">
        <Button label={L('Part 5 · Câu chưa hoàn chỉnh', 'Part 5 · Incomplete sentences')} onPress={() => router.push('/toeic/practice/part5' as never)} />
        <Button variant="outline" label={L('Part 6 & 7 · Đọc đoạn văn', 'Part 6 & 7 · Reading texts')} onPress={() => router.push('/toeic/practice/reading' as never)} />
        <Button variant="outline" label={L('Luyện Nghe · Part 2, 3, 4', 'Listening · Parts 2, 3, 4')} onPress={() => router.push('/toeic/skill/listen' as never)} />
        <Button variant="outline" label={L('Luyện Viết', 'Writing practice')} onPress={() => router.push('/toeic/skill/write' as never)} />
        <Button variant="outline" label={L('Luyện Nói', 'Speaking practice')} onPress={() => router.push('/toeic/skill/speak' as never)} />
        <Button variant="outline" label={L('Thi thử Reading (rút gọn)', 'Reading mock test (short)')} onPress={() => router.push('/toeic/mock' as never)} />
        <Button variant="outline" label={L('Từ vựng TOEIC theo unit', 'TOEIC vocabulary by unit')} onPress={() => router.push('/toeic/vocab' as never)} />
      </View>

      <View className="mt-6">
        <IntlDisclaimer />
      </View>
    </Screen>
  );
}
