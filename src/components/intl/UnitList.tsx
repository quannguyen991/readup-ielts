import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Card } from '@/components/ui';
import { bi, useL } from '@/i18n/useL';
import { unitsFor, type IntlExamKey, type VocabUnit } from '@/data/intl/units';
import { isKnown, useIntlStore } from '@/store/useIntlStore';

/** Danh sách unit từ vựng của một kỳ thi, kèm số từ đã đánh dấu thuộc. */
export function UnitList({ exam, compact = false }: { exam: IntlExamKey; compact?: boolean }) {
  const { L, locale } = useL();
  const known = useIntlStore((s) => s.known);
  const units = unitsFor(exam);
  const base = exam === 'toeic' ? '/toeic/vocab' : '/toefl/vocab';

  return (
    <View className="gap-2">
      {units.map((unit: VocabUnit) => {
        const knownCount = unit.words.filter((w) => isKnown(known, exam, w)).length;
        return (
          <Card key={unit.id}>
            <Text className="font-strong text-body text-ink">{`Unit ${unit.index} · ${bi(unit.title, locale)}`}</Text>
            <Text className="mt-1 font-sans text-label text-muted">{L(`Đã thuộc ${knownCount}/${unit.words.length} từ`, `${knownCount}/${unit.words.length} words known`)}</Text>
            {compact ? null : (
              <Text className="mt-1 font-sans text-label text-muted">{unit.words.join(' · ')}</Text>
            )}
            <Button
              className="mt-2 self-start"
              size="sm"
              variant="outline"
              label={L('Học unit này', 'Study this unit')}
              onPress={() => router.push(`${base}/${unit.index}` as never)}
            />
          </Card>
        );
      })}
    </View>
  );
}
