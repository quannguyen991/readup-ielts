import React from 'react';
import { Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
import { FEED_KIND_LABEL, type FeedItem, type FeedKind } from '@/services/activity/feed';
import { useL } from '@/i18n/useL';

const KIND_ICON: Record<FeedKind, IconName> = {
  test: 'clipboard',
  listening: 'volume',
  speaking: 'mic',
  writing: 'pencil',
  vocab: 'letters',
  lesson: 'book',
  daily: 'target',
};

/** Ngày và giờ theo máy người học. Nhiệm vụ hằng ngày chỉ có ngày nên không hiện giờ. */
function whenOf(item: FeedItem): string {
  const d = new Date(item.at);
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (item.kind === 'daily') return date;
  return `${date} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Danh sách việc đã làm, đã có sẵn thứ tự mới trước. Không có việc nào thì nói rõ, không để trống. */
export function ActivityList({ items, emptyText }: { items: FeedItem[]; emptyText: string }) {
  const { L } = useL();
  if (items.length === 0) {
    return <Text className="py-6 text-center font-sans text-body text-muted">{emptyText}</Text>;
  }
  return (
    <View>
      {items.map((item) => (
        <View key={item.id} className="flex-row items-center gap-3 border-b border-border py-3">
          <View className="h-9 w-9 items-center justify-center rounded-pill" style={{ backgroundColor: '#F1ECFF' }}>
            <Icon name={KIND_ICON[item.kind]} size={18} color="#6A4BD9" />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text numberOfLines={1} className="font-strong text-body text-ink">
              {item.title}
            </Text>
            <Text numberOfLines={1} className="font-mid text-label text-muted">
              {[L(FEED_KIND_LABEL[item.kind].vi, FEED_KIND_LABEL[item.kind].en), item.detail].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Text className="font-mid text-label text-muted">{whenOf(item)}</Text>
        </View>
      ))}
    </View>
  );
}
