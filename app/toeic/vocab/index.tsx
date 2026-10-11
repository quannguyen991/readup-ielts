import React from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { IntlDisclaimer } from '@/components/intl/IntlKit';
import { UnitList } from '@/components/intl/UnitList';
import { useL } from '@/i18n/useL';

export default function ToeicVocabUnitsScreen() {
  const { L } = useL();
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">{L('Từ vựng TOEIC', 'TOEIC vocabulary')}</Text>
      <Text className="mt-1 mb-4 font-sans text-body text-muted">
        {L('Hai mươi unit theo chủ đề công việc, mỗi unit 10 từ. Bấm "Hiện nghĩa" để xem nghĩa và ví dụ.', 'Twenty units by work topic, ten words each. Tap "Show meaning" to see the meaning and an example.')}
      </Text>
      <UnitList exam="toeic" />
      <View className="mt-6">
        <IntlDisclaimer />
      </View>
    </Screen>
  );
}
