import React from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { UnitStudy } from '@/components/intl/UnitStudy';
import { Button, Card } from '@/components/ui';
import { bi, useL } from '@/i18n/useL';
import { unitEntries, unitsFor } from '@/data/intl/units';

export default function ToeflUnitScreen() {
  const { L, locale } = useL();
  const { unit: raw } = useLocalSearchParams<{ unit?: string }>();
  const index = Number(Array.isArray(raw) ? raw[0] : raw);
  const unit = unitsFor('toefl').find((u) => u.index === index);

  if (!unit) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-body text-ink">{L('Không tìm thấy unit này.', 'This unit does not exist.')}</Text>
          <Button className="mt-3" label={L('Về danh sách unit', 'Back to units')} onPress={() => router.replace('/toefl/vocab' as never)} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{`Unit ${unit.index} · ${bi(unit.title, locale)}`}</Text>
      <Text className="mt-1 mb-4 font-sans text-body text-muted">{L('Học thẻ để đánh dấu từ đã thuộc, hoặc làm trắc nghiệm để kiểm tra.', 'Use flashcards to mark known words, or take a quiz to check yourself.')}</Text>
      <UnitStudy exam="toefl" entries={unitEntries(unit)} />
    </Screen>
  );
}
