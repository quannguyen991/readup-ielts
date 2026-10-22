import React from 'react';
import { Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { TileArt } from '@/components/ui/TileArt';
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
      <TileArt seed={'listening-' + test.cover.topic} tone={[c1, c2]} height={height} style={{ borderRadius: 0 }} />
      <View style={{ position: 'absolute', right: 16, top: 12, opacity: 0.9 }}>
        <Icon name={topicIcon(test.cover.topic)} size={Math.round(height * 0.52)} color="#FFFFFF" strokeWidth={1.3} />
      </View>
      {section ? (
        <View
          style={{ position: 'absolute', left: 10, bottom: 10, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: SECTION_COLOR[section] ?? '#6A4BD9' }}
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
