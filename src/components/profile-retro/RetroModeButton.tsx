import React from 'react';
import { router } from 'expo-router';

import { Button } from '@/components/ui';
import { useL } from '@/i18n/useL';
import { SHOP_ITEMS } from '@/services/gamification/shop';
import { useRewardStore } from '@/store/useRewardStore';

import { RETRO_THEME_ID, setRetroOn, useRetroOn } from './retro-mode-store';

/**
 * Nút ở thẻ "Thử giao diện retro" của trang Cá nhân. Chưa có chủ đề thì dẫn tới Đổi quà
 * để đổi sao; đã có thì bật/tắt ngay, như cách đeo chủ đề Chiikawa.
 */
export function RetroModeButton() {
  const { L } = useL();
  const on = useRetroOn();
  const owned = useRewardStore((s) => (s.owned[RETRO_THEME_ID] ?? 0) > 0);
  const price = SHOP_ITEMS.find((item) => item.id === RETRO_THEME_ID)?.price ?? 0;

  if (!owned) {
    return (
      <Button
        label={L(`Đổi ${price} sao`, `Get it for ${price} stars`)}
        size="sm"
        variant="outline"
        onPress={() => router.push('/shop' as never)}
      />
    );
  }
  return (
    <Button
      label={on ? L('Tắt retro', 'Turn retro off') : L('Bật retro', 'Turn retro on')}
      size="sm"
      variant="outline"
      onPress={() => setRetroOn(!on)}
    />
  );
}
