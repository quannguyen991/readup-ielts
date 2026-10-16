import React from 'react';
import { View } from 'react-native';

const BARS = 42;

/**
 * Sóng âm vẽ từ mức micro thật (RMS mỗi khung). Khi không nghe thì các vạch nằm phẳng
 * và mờ đi, nên sóng chỉ chuyển động khi đang có tiếng vào.
 *
 * Mức RMS của giọng nói thường nhỏ (khoảng 0.02–0.3), nên đưa qua căn bậc hai để các
 * tiếng nhỏ vẫn hiện rõ mà tiếng to không chạm trần quá sớm.
 */
export function LiveWave({ levels, active, color }: { levels: number[]; active: boolean; color: string }) {
  const bars = Array.from({ length: BARS }, (_, i) => levels[levels.length - BARS + i] ?? 0);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}
    >
      {bars.map((v, i) => {
        const level = Math.min(1, Math.sqrt(Math.max(0, v)) * 2.2);
        const h = active ? 6 + level * 60 : 4;
        return (
          <View
            key={i}
            style={{
              width: 4,
              height: h,
              borderRadius: 2,
              backgroundColor: active ? color : 'rgba(143,110,54,0.22)',
            }}
          />
        );
      })}
    </View>
  );
}
