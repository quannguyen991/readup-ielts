import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui/Icon';
import type { ListeningGroupType, ListeningTest } from '@/services/listening/types';

/** Màu theo section — giống bảng tham chiếu: S1 cam, S2 xanh, S3 tím, S4 xanh ngọc. */
export const SECTION_COLOR: Record<number, string> = {
  1: '#E8892B',
  2: '#3B82F6',
  3: '#8B5CF6',
  4: '#0D9488',
};

export const GROUP_LABEL: Record<ListeningGroupType, string> = {
  gap: 'Gap Filling',
  'mcq-one': 'Multiple Choice (One Answer)',
  'mcq-many': 'Multiple Choice (Many Answers)',
  matching: 'Matching Information',
};

const TOPIC_ICON: [RegExp, IconName][] = [
  [/travel|tour|trip|holiday|flight|hotel|map/i, 'compass'],
  [/educat|universit|school|library|course|lecture|study|class/i, 'book'],
  [/health|medic|doctor|sport|fitness|food|diet/i, 'heart'],
  [/work|job|business|office|career|interview|shop/i, 'briefcase'],
  [/city|house|housing|hous|build|architect|transport|town/i, 'building'],
  [/scien|lab|experiment|physic|chem|tech/i, 'flask'],
  [/nature|environment|animal|plant|garden|farm|climate|ocean/i, 'leaf'],
  [/art|pottery|craft|music|museum|design|film|theat/i, 'sparkle'],
];

export function topicIcon(topic: string): IconName {
  return TOPIC_ICON.find(([re]) => re.test(topic))?.[1] ?? 'volume';
}

/** Dải sóng âm trang trí (không dùng ảnh ngoài). */
function Waves({ width, height, opacity }: { width: number; height: number; opacity: number }) {
  const bars = 28;
  const w = width / bars;
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, bottom: 0, opacity }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = 14 + Math.abs(Math.sin(i * 0.9) * 0.6 + Math.sin(i * 0.31) * 0.4) * (height * 0.5);
        return <Rect key={i} x={i * w + w * 0.2} y={height - h} width={w * 0.6} height={h} rx={w * 0.3} fill="#FFFFFF" />;
      })}
    </Svg>
  );
}

/** Ảnh bìa: gradient theo `cover.hue` + biểu tượng chủ đề lớn + sóng âm. */
export function ListeningCover({
  test,
  section,
  height = 124,
  children,
}: {
  test: Pick<ListeningTest, 'cover'>;
  section?: number | null;
  height?: number;
  children?: React.ReactNode;
}) {
  const hue = test.cover.hue ?? 36;
  const c1 = `hsl(${hue}, 62%, 52%)`;
  const c2 = `hsl(${(hue + 38) % 360}, 58%, 38%)`;
  return (
    <View style={{ height, overflow: 'hidden', borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
      <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 } as never} />
      <Waves width={360} height={height * 0.55} opacity={0.16} />
      <View style={{ position: 'absolute', right: 16, top: 12, opacity: 0.9 }}>
        <Icon name={topicIcon(test.cover.topic)} size={Math.round(height * 0.52)} color="#FFFFFF" strokeWidth={1.3} />
      </View>
      {section ? (
        <View
          style={{ position: 'absolute', left: 10, bottom: 10, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: SECTION_COLOR[section] ?? '#8F6E36' }}
        >
          <Text className="font-nun-heavy" style={{ fontSize: 12, color: '#FFFFFF' }}>
            Section {section}
          </Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}
