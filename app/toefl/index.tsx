import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { IntlDisclaimer } from '@/components/intl/IntlKit';
import { Button, Card, SectionHeader } from '@/components/ui';
import { TOEFL_SCALE_NOTE, TOEFL_SECTIONS } from '@/data/intl/toefl-structure';
import { bi, useL } from '@/i18n/useL';
import { IntlProgress } from '@/components/intl/IntlProgress';

export default function ToeflHomeScreen() {
  const { L, locale } = useL();
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">TOEFL iBT</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        {L('Bốn kỹ năng học thuật: Reading, Listening, Writing, Speaking. Bài viết và bài nói chưa có chấm điểm bằng AI.', 'Four academic skills: Reading, Listening, Writing, Speaking. Writing and speaking are not yet scored by AI.')}
      </Text>

      <IntlProgress exam="toefl" />

      <SectionHeader className="mt-6" title={L('Cấu trúc bài thi', 'Test structure')} subtitle={L('Theo định dạng từ 21/01/2026. Thời lượng và số câu cần đối chiếu với ETS.', 'Format effective 21 Jan 2026. Timing and item counts to be checked against ETS.')} icon="list" />
      {TOEFL_SECTIONS.map((section) => (
        <Card key={section.key} className="mt-3">
          <Text className="font-strong text-cardTitle text-ink">{bi(section.title, locale)}</Text>
          <Text className="mt-1 font-sans text-label text-muted">{`${section.minutes} · ${section.items}`}</Text>
          <View className="mt-2 gap-1">
            {section.tasks.map((task) => (
              <Text key={task.title.en} className="font-sans text-body text-ink">
                {`${bi(task.title, locale)}: ${bi(task.desc, locale)}`}
              </Text>
            ))}
          </View>
        </Card>
      ))}

      <Card className="mt-3">
        <Text className="font-sans text-body text-ink">{bi(TOEFL_SCALE_NOTE, locale)}</Text>
      </Card>

      <SectionHeader className="mt-6" title={L('Luyện tập', 'Practice')} icon="play" />
      <View className="mt-3 gap-2">
        <Button label={L('Hoàn thành từ', 'Complete the words')} onPress={() => router.push('/toefl/complete' as never)} />
        <Button variant="outline" label={L('Bài đọc học thuật', 'Academic reading passage')} onPress={() => router.push('/toefl/reading' as never)} />
        <Button variant="outline" label={L('Luyện Nghe · bài giảng và hội thoại', 'Listening · lectures and conversations')} onPress={() => router.push('/toefl/skill/listen' as never)} />
        <Button variant="outline" label={L('Luyện Viết · ghép câu và email', 'Writing · sentence building and email')} onPress={() => router.push('/toefl/skill/write' as never)} />
        <Button variant="outline" label={L('Luyện Nói', 'Speaking practice')} onPress={() => router.push('/toefl/skill/speak' as never)} />
        <Button variant="outline" label={L('Thi thử rút gọn', 'Short mock test')} onPress={() => router.push('/toefl/mock' as never)} />
        <Button variant="outline" label={L('Từ vựng học thuật theo unit', 'Academic vocabulary by unit')} onPress={() => router.push('/toefl/vocab' as never)} />
      </View>

      <View className="mt-6">
        <IntlDisclaimer />
      </View>
    </Screen>
  );
}
