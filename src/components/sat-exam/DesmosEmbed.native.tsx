import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';

export function DesmosEmbed() {
  const { L } = useL();
  return (
    <View className="items-center justify-center rounded-2xl border border-[#E7DED0] bg-[#FBF8F1] px-5 py-10">
      <Text className="text-center font-strong text-body text-ink">{L('Mở máy tính đồ thị Desmos để giải câu hình học.', 'Open the Desmos graphing calculator for geometry practice.')}</Text>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://www.desmos.com/calculator')} className="mt-4 rounded-xl bg-[#122038] px-5 py-3">
        <Text className="font-semi text-body text-white">{L('Mở Desmos ↗', 'Open Desmos ↗')}</Text>
      </Pressable>
    </View>
  );
}
