import React from 'react';
import { Text, View } from 'react-native';

import { NeonWindow } from '@/components/neon/Neon';
import { Badge, ProgressBar } from '@/components/ui';
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
    <NeonWindow title={L('Mốc chuỗi', 'Streak goals')} icon="flame" badge={`${current}/${next ? next.milestone.days : current}`} style={{ marginTop: 16 }}>
      {next ? (
        <View className="gap-2">
          <Text className="font-semi text-body text-ink">
            {L(`Còn ${next.remaining} ngày → mốc ${next.milestone.days} · +${formatStars(next.milestone.stars)} ⭐`, `${next.remaining}d to day ${next.milestone.days} · +${formatStars(next.milestone.stars)} ⭐`)}
          </Text>
          <ProgressBar value={progress} tone="primary" />
        </View>
      ) : (
        <Text className="font-semi text-body text-ink">{L('Đã qua mốc cuối. Giữ nhịp nhé.', 'Last milestone passed. Keep going.')}</Text>
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
              style={{ borderColor: claimed ? '#2A22B5' : '#E5E7EB', backgroundColor: claimed ? '#F3F0FF' : '#FFFFFF' }}
            >
              <Badge
                label={`${m.days} ${L('ngày', 'days')} · +${formatStars(m.stars)} ⭐${claimed ? ' ✓' : reached ? '' : ' 🔒'}`}
                tone={claimed ? 'success' : 'neutral'}
              />
            </View>
          );
        })}
      </View>
    </NeonWindow>
  );
}
