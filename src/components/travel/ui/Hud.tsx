import React from 'react';
import { View } from 'react-native';

import { useL } from '@/i18n/useL';
import { useTravelStore } from '@/store/useTravelStore';
import { StatChip } from './kit';

/** Vé và xu của hành trình, đọc thẳng từ kho. */
export function TravelHud() {
  const { L } = useL();
  const tickets = useTravelStore((s) => s.tickets);
  const coins = useTravelStore((s) => s.coins);
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <StatChip kind="ticket" value={tickets} label={L('Vé máy bay', 'Plane tickets')} />
      <StatChip kind="coin" value={coins} label={L('Xu', 'Coins')} />
    </View>
  );
}
