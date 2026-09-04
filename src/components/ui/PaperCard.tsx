import React from 'react';
import { Platform, View } from 'react-native';

import { shadow } from '@/theme/tokens';

/**
 * Thẻ giấy kem nổi trên nền xanh tím.
 *
 * Khác `Card` ở chỗ nào và vì sao không gộp: `Card` là thẻ trắng viền xám của
 * các màn duyệt, nơi nền trang đã sáng nên thẻ chỉ cần một đường viền mảnh để
 * tách ra. `PaperCard` sống trên nền TỐI, nên nó cần màu giấy ấm và bóng đổ sâu
 * hơn để trông như một tờ giấy đặt lên mặt bàn. Nhồi hai vai này vào một
 * component qua cờ `variant` thì mọi chỗ gọi đều phải nhớ chọn đúng cờ, mà
 * chọn sai thì thẻ chìm nghỉm vào nền.
 */
export function PaperCard({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <View
      className={['rounded-card bg-paper', padded ? 'p-5' : '', className].join(' ')}
      style={Platform.OS === 'web' ? webShadow : shadow.card}
    >
      {children}
    </View>
  );
}

const webShadow = { boxShadow: '0 10px 30px rgba(20, 30, 10, 0.18)' } as const;
