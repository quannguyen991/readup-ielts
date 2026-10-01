import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useL } from '@/i18n/useL';

/** Bản iOS/Android: không có cảnh canvas — thẻ gọn dẫn vào Toa Từ Vựng. */
export function QuestJourneyHero() {
  const { L } = useL();
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push('/quest/rail' as never)}>
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: '#0F2238' }}>
        <Text className="font-heavy" style={{ fontSize: 22, color: '#FFFFFF' }}>
          {L('🚆 Hành trình học', '🚆 Learning journey')}
        </Text>
        <Text className="font-sans" style={{ marginTop: 6, fontSize: 14, color: 'rgba(255,255,255,0.74)' }}>
          {L('Mỗi câu đúng là tàu tiến một quãng tới thành phố mới.', 'Every correct answer moves the train closer to a new city.')}
        </Text>
      </View>
    </Pressable>
  );
}
