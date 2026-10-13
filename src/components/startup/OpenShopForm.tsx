import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { SHOP_COLORS, SHOP_NAMES } from '@/data/startup-menu';
import { bi, useL } from '@/i18n/useL';
import { SHOP_RULES } from '@/services/startup/economy';
import type { OpenOutcome } from '@/store/useStartupStore';
import { Chip } from './Chip';

export function OpenShopForm({ onOpen }: { onOpen: (nameIndex: number, colorIndex: number) => OpenOutcome }) {
  const { L, locale } = useL();
  const [nameIndex, setNameIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const press = () => {
    const outcome = onOpen(nameIndex, colorIndex);
    if (outcome === 'ok') setNotice(L('Quán đã mở. Chúc bạn buôn may bán đắt!', 'The shop is open. Good luck!'));
    else if (outcome === 'poor') setNotice(L(`Chưa đủ ${SHOP_RULES.capital} đồng du học để mở quán.`, `You need ${SHOP_RULES.capital} study funds to open.`));
    else if (outcome === 'already') setNotice(L('Quán này đã mở.', 'This shop is already open.'));
    else setNotice(L('Không mở được quán.', 'The shop could not open.'));
  };

  return (
    <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 10 }}>
      <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Mở quán ở Singapore', 'Open a shop in Singapore')}</Text>
      <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 19 }}>
        {L(`Vốn ${SHOP_RULES.capital} đồng du học. Sau khi mở, quán tự thu chi bằng doanh thu của mình.`, `Capital ${SHOP_RULES.capital} study funds. After that the shop runs on its own sales.`)}
      </Text>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('Tên quán', 'Shop name')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SHOP_NAMES.map((name, i) => (
          <Chip key={`name-${i}`} label={bi(name, locale)} selected={nameIndex === i} onPress={() => setNameIndex(i)} />
        ))}
      </View>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('Màu biển hiệu', 'Sign colour')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SHOP_COLORS.map((color, i) => (
          <Chip key={`color-${i}`} label={`${i + 1}`} selected={colorIndex === i} color={color} onPress={() => setColorIndex(i)} />
        ))}
      </View>
      <GameButton label={L(`Mở quán — ${SHOP_RULES.capital} đồng du học`, `Open shop — ${SHOP_RULES.capital} study funds`)} tone="gold" onPress={press} />
      {notice ? <Text className="font-semi" style={{ color: T.goldDark, fontSize: 13, lineHeight: 19 }}>{notice}</Text> : null}
    </PixelPanel>
  );
}
