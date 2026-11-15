import React from 'react';
import { Text, View } from 'react-native';

import { MeaningLangControl } from '@/components/vocab/study/MeaningLangControl';
import { useL } from '@/i18n/useL';

/**
 * Cài đặt học từ vựng: nghĩa hiển thị bằng tiếng Việt hay tiếng Anh. Chọn tiếng Anh để học
 * Nhật/Trung ↔ Anh, hoặc học từ tiếng Anh với định nghĩa tiếng Anh (Anh–Anh). Áp cho mọi bộ từ.
 */
export function StudyMeaningCard() {
  const { L } = useL();
  return (
    <View className="mt-4 rounded-2xl bg-white p-4" style={{ borderWidth: 1, borderColor: '#F3F0FB', gap: 10 }}>
      <Text className="font-heavy text-cardTitle text-ink">{L('Học từ vựng', 'Vocabulary study')}</Text>
      <Text className="font-semi text-body text-ink">{L('Nghĩa hiển thị', 'Meaning shown')}</Text>
      <MeaningLangControl />
      <Text className="font-sans text-label text-muted">
        {L('Tiếng Anh: học Nhật/Trung ↔ Anh, hoặc từ tiếng Anh với định nghĩa tiếng Anh.', 'English: study Japanese/Chinese ↔ English, or English words with English definitions.')}
      </Text>
    </View>
  );
}
