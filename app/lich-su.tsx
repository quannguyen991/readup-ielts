import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ActivityList } from '@/components/progress/ActivityList';
import { Screen } from '@/components/layout/Screen';
import { Card, HeroBanner, SectionHeader } from '@/components/ui';
import { useNow } from '@/lib/clock';
import { useL } from '@/i18n/useL';
import {
  countFeedByKind,
  FEED_KIND_LABEL,
  groupFeedByDay,
  type FeedKind,
} from '@/services/activity/feed';
import { useActivityFeed } from '@/services/activity/use-activity';
import { themedHex } from '@/theme/palette-state';

const DAY_MS = 86_400_000;
const FILTERS: Array<FeedKind | 'all'> = ['all', 'test', 'listening', 'speaking', 'writing', 'lesson', 'daily'];

/**
 * Lịch sử làm bài: mọi việc đã làm (bài, nghe, nói, viết, ngữ pháp, nhiệm vụ) theo ngày,
 * lấy từ kho đã lưu. Trang này không có dữ liệu mẫu: trống thì nói là trống.
 */
export default function HistoryLogScreen() {
  const { L } = useL();
  const feed = useActivityFeed();
  const now = useNow();
  const [filter, setFilter] = useState<FeedKind | 'all'>('all');

  const shown = useMemo(() => (filter === 'all' ? feed : feed.filter((f) => f.kind === filter)), [feed, filter]);
  const groups = useMemo(() => groupFeedByDay(shown), [shown]);
  const last30 = useMemo(() => countFeedByKind(feed, now, 30 * DAY_MS), [feed, now]);
  const total30 = Object.values(last30).reduce((sum, n) => sum + n, 0);

  return (
    <Screen cat="read">
      <HeroBanner
        title={L('Lịch sử học', 'Study history')}
        subtitle={L('Mọi bài làm, nghe, nói, viết và nhiệm vụ bạn đã hoàn thành.', 'Every test, listening, speaking, writing and daily task you have finished.')}
      />

      <Card className="mt-4">
        <SectionHeader
          title={L('30 ngày gần đây', 'Last 30 days')}
          subtitle={L(`${total30} việc`, `${total30} items`)}
          icon="trending"
        />
        <View className="mt-3 flex-row flex-wrap gap-2">
          {(Object.keys(FEED_KIND_LABEL) as FeedKind[]).map((kind) => (
            <View key={kind} className="rounded-pill border border-border px-3 py-1.5" style={{ backgroundColor: '#FFFFFF' }}>
              <Text className="font-strong text-label text-ink">
                {L(FEED_KIND_LABEL[kind].vi, FEED_KIND_LABEL[kind].en)} · {last30[kind]}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <View accessibilityRole="tablist" className="mt-4 flex-row flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = filter === f;
          const label = f === 'all' ? L('Tất cả', 'All') : L(FEED_KIND_LABEL[f].vi, FEED_KIND_LABEL[f].en);
          return (
            <Pressable
              key={f}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => setFilter(f)}
              className="rounded-pill px-4"
              style={{
                minHeight: 44,
                justifyContent: 'center',
                backgroundColor: on ? themedHex('#FFF4CF') : '#FFFFFF',
                borderWidth: 1,
                borderColor: on ? themedHex('#EBC26A') : '#E5E7EB',
              }}
            >
              <Text className={on ? 'font-strong text-label' : 'font-mid text-label text-muted'} style={on ? { color: themedHex('#8C6A1F') } : undefined}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {groups.length === 0 ? (
        <Card className="mt-4">
          <ActivityList items={[]} emptyText={L('Chưa có việc nào trong bộ lọc này.', 'Nothing in this filter yet.')} />
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.day} className="mt-4">
            <SectionHeader title={dayTitle(group.day, now, L)} subtitle={L(`${group.items.length} việc`, `${group.items.length} items`)} icon="calendar" />
            <View className="mt-2">
              <ActivityList items={group.items} emptyText="" />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

/** Tên ngày cho đầu nhóm: Hôm nay / Hôm qua, còn lại là ngày/tháng. */
function dayTitle(day: string, now: number, L: (vi: string, en: string) => string): string {
  const [y, m, d] = day.split('-').map(Number);
  const dayStart = new Date(y!, m! - 1, d!).getTime();
  const today = new Date(now);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((todayStart - dayStart) / DAY_MS);
  if (diff === 0) return L('Hôm nay', 'Today');
  if (diff === 1) return L('Hôm qua', 'Yesterday');
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}
