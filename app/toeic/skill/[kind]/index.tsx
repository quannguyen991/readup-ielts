import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { IntlDisclaimer } from '@/components/intl/IntlKit';
import { Button, Card } from '@/components/ui';
import { TOEIC_PART1, TOEIC_PART2, TOEIC_PART3, TOEIC_PART4 } from '@/data/intl/listening';
import { TOEIC_SPEAKING, TOEIC_WRITING } from '@/data/intl/writing';
import { bi, useL } from '@/i18n/useL';

export default function ToeicSkillListScreen() {
  const { L, locale } = useL();
  const { kind: raw } = useLocalSearchParams<{ kind?: string }>();
  const kind = Array.isArray(raw) ? raw[0] : raw;

  const items: { id: string; title: string }[] =
    kind === 'listen'
      ? [
          { id: 'part1', title: L(`Part 1 · Mô tả tranh (${TOEIC_PART1.length} câu, mô tả bằng chữ)`, `Part 1 · Photographs (${TOEIC_PART1.length} items, described in text)`) },
          { id: 'part2', title: L(`Part 2 · Hỏi đáp (${TOEIC_PART2.length} câu)`, `Part 2 · Question–response (${TOEIC_PART2.length} questions)`) },
          ...TOEIC_PART3.map((p) => ({ id: p.id, title: `Part 3 · ${bi(p.title, locale)}` })),
          ...TOEIC_PART4.map((p) => ({ id: p.id, title: `Part 4 · ${bi(p.title, locale)}` })),
        ]
      : kind === 'write'
        ? TOEIC_WRITING.map((t) => ({ id: t.id, title: bi(t.title, locale) }))
        : kind === 'speak'
          ? TOEIC_SPEAKING.map((t) => ({ id: t.id, title: bi(t.title, locale) }))
          : [];

  const heading = kind === 'listen' ? L('Luyện Nghe', 'Listening practice') : kind === 'write' ? L('Luyện Viết', 'Writing practice') : L('Luyện Nói', 'Speaking practice');

  if (items.length === 0) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-body text-ink">{L('Không có mục luyện này.', 'Nothing to practise here.')}</Text>
          <Button className="mt-3" label={L('Về TOEIC', 'Back to TOEIC')} onPress={() => router.replace('/toeic' as never)} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">TOEIC · {heading}</Text>
      <View className="mt-4 gap-2">
        {items.map((item) => (
          <Card key={item.id}>
            <Text className="font-strong text-body text-ink">{item.title}</Text>
            <Button className="mt-2 self-start" size="sm" variant="outline" label={L('Luyện', 'Practise')} onPress={() => router.push(`/toeic/skill/${kind}/${item.id}` as never)} />
          </Card>
        ))}
      </View>
      <View className="mt-6">
        <IntlDisclaimer />
      </View>
    </Screen>
  );
}
