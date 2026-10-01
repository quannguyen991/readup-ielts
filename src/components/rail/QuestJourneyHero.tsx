import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useL } from '@/i18n/useL';

/** Bản iOS/Android: không có cảnh canvas — thẻ gọn dẫn vào Chuyến bay từ vựng. */
export function QuestJourneyHero() {
  const { L } = useL();
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push('/quest/rail' as never)}>
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: '#0F2238' }}>
        <Text className="font-heavy" style={{ fontSize: 22, color: '#FFFFFF' }}>
          {L('✈️ Hành trình học', '✈️ Learning journey')}
        </Text>
        <Text className="font-sans" style={{ marginTop: 6, fontSize: 14, color: 'rgba(255,255,255,0.74)' }}>
          {L('Học tới đâu, bay tới đó.', 'The more you learn, the further you fly.')}
        </Text>
      </View>
    </Pressable>
  );
}
