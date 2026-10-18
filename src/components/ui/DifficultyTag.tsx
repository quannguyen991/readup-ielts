import { themedHex } from '@/theme/palette-state';
import React from 'react';
import { Text, View } from 'react-native';

import { difficultyLabel, type Difficulty } from '@/lib/difficulty';
import { useL } from '@/i18n/useL';

/**
 * Nhãn nhỏ "Dễ / Vừa / Khó" cho câu hỏi và bộ đề SAT.
 *
 * Ba nấc cùng một họ màu Band 9 (giấy kem, viền vàng, mực xanh đêm) — đậm dần
 * theo độ khó chứ không đổi sang xanh/vàng/đỏ: nhãn là để định hướng, không phải
 * để báo động. Dùng: `<DifficultyTag level={item.difficulty} />`.
 */
const TONE: Record<Difficulty, { bg: string; border: string; ink: string }> = {
  easy: { bg: '#FFF5F8', border: '#E2C88F', ink: '#B94A70' },
  medium: { bg: '#F3EDE1', border: themedHex('#E68AAE'), ink: '#0F1D33' },
  hard: { bg: '#0F1D33', border: '#0F1D33', ink: '#E2C88F' },
};

export function DifficultyTag({ level, size = 'sm' }: { level: Difficulty; size?: 'sm' | 'md' }) {
  const { en } = useL();
  const tone = TONE[level];
  const pad = size === 'md' ? { paddingHorizontal: 10, paddingVertical: 3 } : { paddingHorizontal: 8, paddingVertical: 2 };
  return (
    <View
      accessibilityLabel={en ? `Difficulty: ${difficultyLabel(level, true)}` : `Độ khó: ${difficultyLabel(level)}`}
      style={{ alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, backgroundColor: tone.bg, borderColor: tone.border, ...pad }}
    >
      <Text style={{ color: tone.ink, fontSize: size === 'md' ? 13 : 12, lineHeight: size === 'md' ? 18 : 16 }} className="font-strong">
        {difficultyLabel(level, en)}
      </Text>
    </View>
  );
}
