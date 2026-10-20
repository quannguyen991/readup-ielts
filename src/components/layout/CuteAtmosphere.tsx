import React from 'react';
import { Image, View, useWindowDimensions } from 'react-native';

import { Motion } from '@/components/illust/CuteMore';
import { SparkleStar } from '@/components/cute-home/Mascots';

/** Subtle, non-interactive Chiikawa-inspired stickers shared by every app screen. */
/** Dưới mốc này (điện thoại, máy bảng) không vẽ lớp trang trí chuyển động. */
const DECOR_MIN_WIDTH = 1024;

export function CuteAtmosphere({ enabled, customImage }: { enabled: boolean; customImage?: string | null }) {
  const { width } = useWindowDimensions();
  // Chờ hydrate để lượt đầu khớp HTML máy chủ (xem CatSticker).
  // Điện thoại và máy bảng: bỏ hẳn lớp trang trí chạy hoạt hình (sao lấp lánh, chấm, mèo nổi) cho mượt.
  if (!enabled || width < DECOR_MIN_WIDTH) return null;

  const compact = width < 760;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', zIndex: 0 }}
    >
      {customImage ? (
        <View
          style={{
            position: 'absolute',
            top: compact ? 176 : 156,
            left: compact ? 12 : 166,
            width: compact ? 54 : 72,
            height: compact ? 54 : 72,
            padding: 3,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: '#F3A8BD',
            backgroundColor: 'rgba(255,255,255,0.92)',
            shadowColor: '#C65A78',
            shadowOpacity: 0.18,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 5 },
          }}
        >
          <Motion kind="float" delay={0.35}>
            <Image
              source={{ uri: customImage }}
              resizeMode="cover"
              style={{ width: compact ? 45 : 63, height: compact ? 45 : 63, borderRadius: 999 }}
            />
          </Motion>
        </View>
      ) : null}
      <View style={{ position: 'absolute', top: compact ? 74 : 96, left: compact ? 28 : 92, opacity: 0.56 }}>
        <Motion kind="twinkle">
          <SparkleStar size={compact ? 15 : 20} color="#F6A9C0" />
        </Motion>
      </View>
      <View style={{ position: 'absolute', bottom: compact ? 104 : 132, right: compact ? 38 : 112, opacity: 0.5 }}>
        <Motion kind="twinkle" delay={0.9}>
          <SparkleStar size={compact ? 12 : 16} color="#EBA8BC" />
        </Motion>
      </View>
      <View style={{ position: 'absolute', top: compact ? 250 : 300, right: compact ? 20 : 84, width: 9, height: 9, borderRadius: 99, backgroundColor: '#F4BDD0', opacity: 0.56 }} />
      <View style={{ position: 'absolute', bottom: compact ? 245 : 300, left: compact ? 22 : 94, width: 7, height: 7, borderRadius: 99, backgroundColor: '#F7CBD8', opacity: 0.7 }} />
    </View>
  );
}
