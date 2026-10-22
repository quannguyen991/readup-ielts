import React from 'react';
import { Pressable, Text } from 'react-native';

import { T } from '@/components/travel/ui/kit';

export function Chip({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ minHeight: 44, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1.5, justifyContent: 'center', borderColor: selected ? (color ?? T.goldDark) : T.line, backgroundColor: selected ? '#F3F0FB' : '#FFFFFF' }}
    >
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
