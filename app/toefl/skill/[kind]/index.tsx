import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { IntlDisclaimer } from '@/components/intl/IntlKit';
import { Button, Card } from '@/components/ui';
import { TOEFL_LISTENING } from '@/data/intl/listening';
import { TOEFL_BUILD, TOEFL_SPEAKING, TOEFL_WRITING } from '@/data/intl/writing';
import { bi, useL } from '@/i18n/useL';
import { LEVEL_LABEL, levelOfChunks } from '@/data/intl/level';

export default function ToeflSkillListScreen() {
  const { L, locale } = useL();
  const { kind: raw } = useLocalSearchParams<{ kind?: string }>();
  const kind = Array.isArray(raw) ? raw[0] : raw;

  const items: { id: string; title: string }[] =
    kind === 'listen'
      ? TOEFL_LISTENING.map((p) => ({ id: p.id, title: bi(p.title, locale) }))
      : kind === 'write'
        ? [
            ...TOEFL_BUILD.map((b, i) => ({ id: b.id, title: `${L(`Ghép câu ${i + 1}`, `Build a sentence ${i + 1}`)} · ${bi(LEVEL_LABEL[levelOfChunks(b.chunks.length)], locale)}` })),
            ...TOEFL_WRITING.map((t) => ({ id: t.id, title: bi(t.title, locale) })),
          ]
        : kind === 'speak'
          ? TOEFL_SPEAKING.map((t) => ({ id: t.id, title: bi(t.title, locale) }))
          : [];

  const heading = kind === 'listen' ? L('Luyện Nghe', 'Listening practice') : kind === 'write' ? L('Luyện Viết', 'Writing practice') : L('Luyện Nói', 'Speaking practice');

  if (items.length === 0) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-body text-ink">{L('Không có mục luyện này.', 'Nothing to practise here.')}</Text>
          <Button className="mt-3" label={L('Về TOEFL', 'Back to TOEFL')} onPress={() => router.replace('/toefl' as never)} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">TOEFL · {heading}</Text>
      <View className="mt-4 gap-2">
        {items.map((item) => (
          <Card key={item.id}>
            <Text className="font-strong text-body text-ink">{item.title}</Text>
            <Button className="mt-2 self-start" size="sm" variant="outline" label={L('Luyện', 'Practise')} onPress={() => router.push(`/toefl/skill/${kind}/${item.id}` as never)} />
          </Card>
        ))}
      </View>
      <View className="mt-6">
        <IntlDisclaimer />
      </View>
    </Screen>
  );
}
