import React from 'react';
import { Text, View } from 'react-native';

import { Badge, Card, Icon, ProgressBar } from '@/components/ui';
import { nextStreakMilestone, STREAK_MILESTONES, streakPrizeKey } from '@/services/gamification/streak-rewards';
import { formatStars } from '@/services/gamification/shop';
import { useRewardStore } from '@/store/useRewardStore';
import { useL } from '@/i18n/useL';

/**
 * Chuỗi ngày và các mốc thưởng. Chuỗi là số liệu đã lưu (`useStreak`), mốc đã nhận là
 * khoá `streak:<ngày>` trong kho phần thưởng — không có số nào được gõ tay ở đây.
 */
export function StreakRewardsCard({ current, longest }: { current: number; longest: number }) {
  const { L } = useL();
  const prizes = useRewardStore((s) => s.prizes);
  const next = nextStreakMilestone(current);
  const previousDays = [...STREAK_MILESTONES].reverse().find((m) => m.days <= current)?.days ?? 0;
  const progress = next ? ((current - previousDays) / (next.milestone.days - previousDays)) * 100 : 100;

  return (
    <Card className="mt-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon name="flame" size={20} color="#F0703F" />
          <Text className="font-strong text-cardTitle text-ink">{L('Chuỗi ngày & thưởng', 'Streak & rewards')}</Text>
        </View>
        <Text className="font-mid text-label text-muted">
          {L(`Dài nhất: ${longest} ngày`, `Longest: ${longest} days`)}
        </Text>
      </View>

      {next ? (
        <View className="mt-3 gap-2">
          <Text className="font-sans text-body text-body">
            {L(
              `Còn ${next.remaining} ngày nữa là đạt mốc ${next.milestone.days} ngày, thưởng +${formatStars(next.milestone.stars)} sao.`,
              `${next.remaining} more day${next.remaining === 1 ? '' : 's'} to reach ${next.milestone.days} days, +${formatStars(next.milestone.stars)} stars.`,
            )}
          </Text>
          <ProgressBar value={progress} tone="primary" valueLabel={`${current}/${next.milestone.days}`} />
        </View>
      ) : (
        <Text className="mt-3 font-sans text-body text-body">
          {L('Bạn đã qua mốc cuối cùng. Chuỗi càng dài, sao càng nhiều.', 'You have passed the last milestone. Keep the streak going.')}
        </Text>
      )}

      <View className="mt-4 flex-row flex-wrap gap-2">
        {STREAK_MILESTONES.map((m) => {
          const reached = current >= m.days;
          const claimed = prizes?.[streakPrizeKey(m.days)] !== undefined;
          return (
            <View
              key={m.days}
              accessibilityLabel={L(
                `Mốc ${m.days} ngày, ${m.stars} sao${claimed ? ', đã nhận' : reached ? ', đang cộng' : ', chưa đạt'}`,
                `${m.days} days, ${m.stars} stars${claimed ? ', claimed' : reached ? ', being added' : ', not reached'}`,
              )}
              className="rounded-pill border px-3 py-1.5"
              style={{ borderColor: claimed ? '#D9A441' : '#E5E7EB', backgroundColor: claimed ? '#F3F0FB' : '#FFFFFF' }}
            >
              <Badge
                label={`${m.days} ${L('ngày', 'days')} · +${formatStars(m.stars)} ⭐${claimed ? ' ✓' : reached ? '' : ' 🔒'}`}
                tone={claimed ? 'success' : 'neutral'}
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
}
