import React from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button, Card } from '@/components/ui';
import { DesmosEmbed } from '@/components/sat-exam/DesmosEmbed';
import { useL } from '@/i18n/useL';

export default function SatDesmosScreen() {
  const { L } = useL();
  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Desmos · SAT Math</Text>
      <Text className="mt-1 font-sans text-body text-muted">{L('Vẽ đường thẳng, parabol và điểm để kiểm tra giao điểm, khoảng cách hoặc nghiệm.', 'Graph lines, parabolas, and points to check intersections, distances, and roots.')}</Text>
      <Card className="mt-4">
        <DesmosEmbed />
      </Card>
      {Platform.OS === 'web' ? (
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://www.desmos.com/calculator')} className="mt-3 self-end">
          <Text className="font-semi text-label text-primary-700">{L('Mở Desmos ngoài app ↗', 'Open Desmos separately ↗')}</Text>
        </Pressable>
      ) : null}
      <View className="mt-4">
        <Button label={L('Về lộ trình SAT', 'Back to SAT')} variant="outline" onPress={() => router.replace('/sat' as never)} />
      </View>
    </Screen>
  );
}
