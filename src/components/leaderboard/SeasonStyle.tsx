import React, { useEffect, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { AvatarBadge } from '@/components/profile/AnimatedAvatar';
import { NeonBackdrop, NeonIcon, NeonPill, NeonText, NeonTitle } from '@/components/neon/Neon';
import type { NeonIconId } from '@/components/neon/neon-art';
import { useL } from '@/i18n/useL';
import { MONTH_PRIZES } from '@/services/gamification/monthly';
import { formatStars } from '@/services/gamification/shop';
import { skinOf } from '@/store/useRewardStore';

/**
 * Phong cách "Đua Top" của trang Xếp hạng (theo ảnh mẫu Portfolio): chữ pixel 3D phát sáng trên nền xanh tím có lưới,
 * đồng hồ đếm ngược mùa, giải thưởng bằng icon và thẻ "Hạng của bạn". Ít chữ. Chỉ là giao diện: giải thưởng lấy từ
 * `MONTH_PRIZES`, trần điểm từ `services/gamification/points.ts`, không có luật riêng ở đây.
 */
const PRIZE_LABEL_EN: Record<string, string> = { 'Hạng nhất': '1st place', 'Hạng nhì': '2nd place', 'Hạng ba': '3rd place', 'Top 10': 'Top 10' };

/** Thời gian còn lại tới hết tháng (giờ máy), cập nhật mỗi giây. */
function useMonthCountdown(): { d: number; h: number; m: number; s: number } {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const left = Math.max(0, Math.floor((end - now.getTime()) / 1000));
  return { d: Math.floor(left / 86400), h: Math.floor((left % 86400) / 3600), m: Math.floor((left % 3600) / 60), s: left % 60 };
}

export function SeasonHero({ stars, today, dailyCap }: { stars: number; today: Date; dailyCap: number }) {
  const { L, en } = useL();
  const wide = useWindowDimensions().width >= 760;
  const left = useMonthCountdown();
  const month = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const prizeIcons: NeonIconId[] = ['crown', 'trophy', 'star5', 'star4'];
  return (
    <View style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(160,150,255,0.35)', marginBottom: 4 }}>
      <NeonBackdrop scene="rank" />
      <View style={{ padding: wide ? 28 : 16, gap: wide ? 20 : 14, alignItems: 'stretch' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <NeonPill icon="trophy" label={month} />
          <NeonPill icon="star5" label={formatStars(stars)} />
        </View>

        <NeonTitle id="dua-top" label={L('Đua Top', 'Top Race')} maxWidth={wide ? 520 : 360} />

        {/* đồng hồ đếm ngược tới hết mùa */}
        <View accessibilityLabel={L(`Mùa này kết thúc sau ${left.d} ngày ${left.h} giờ ${left.m} phút`, `Season ends in ${left.d} days ${left.h} hours ${left.m} minutes`)} style={{ flexDirection: 'row', gap: wide ? 12 : 8, justifyContent: 'center' }}>
          {(
            [
              [left.d, L('NGÀY', 'DAYS')],
              [left.h, L('GIỜ', 'HRS')],
              [left.m, L('PHÚT', 'MIN')],
              [left.s, L('GIÂY', 'SEC')],
            ] as [number, string][]
          ).map(([n, label]) => (
            <View key={label} style={{ width: wide ? 84 : 70, height: wide ? 80 : 70, borderRadius: 16, backgroundColor: 'rgba(10,8,70,0.58)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', ...({ boxShadow: '0 5px 0 rgba(8,6,50,0.55)' } as object) }}>
              <NeonText style={{ fontSize: wide ? 30 : 25, lineHeight: wide ? 34 : 29, color: '#FFFFFF' }}>{String(n).padStart(2, '0')}</NeonText>
              <NeonText style={{ fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.7)' }}>{label}</NeonText>
            </View>
          ))}
        </View>

        {/* giải thưởng: mỗi hạng một icon, chỉ số sao */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {MONTH_PRIZES.map((p, i) => (
            <View key={p.label} accessibilityLabel={`${en ? (PRIZE_LABEL_EN[p.label] ?? p.label) : p.label}: +${p.stars}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 46, borderRadius: 23, backgroundColor: 'rgba(10,8,70,0.58)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)' }}>
              <NeonIcon name={prizeIcons[i] ?? 'star5'} height={28} />
              <NeonText style={{ fontSize: 16, color: '#FFD84A' }}>+{p.stars}</NeonText>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <NeonPill icon="clock" label={L(`1đ/phút · tối đa ${dailyCap}`, `1pt/min · max ${dailyCap}`)} />
          <NeonPill icon="gift" label={L('Đổi quà', 'Rewards')} onPress={() => router.push('/shop' as never)} />
        </View>
      </View>
    </View>
  );
}

type RankProps = {
  name: string;
  avatarId: string | null;
  skin: ReturnType<typeof skinOf>;
  tierTitle: string;
  tierStars: number;
  month: number;
  rank: number;
  upcoming: { remaining: number; name: string; pct: number } | null;
  multiplier: number;
  todayEffort: number;
  todayPoints: number;
  dailyCap: number;
  resetDays: number;
};

/** Thẻ "Hạng của bạn": bậc, điểm tháng, hạng trên bảng, đường tới bậc kế, hệ số và điểm hôm nay. Số là chính, chữ rất ít. */
export function MyRankCard(p: RankProps) {
  const { L } = useL();
  return (
    <View style={{ height: '100%', borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(160,150,255,0.35)' }}>
      <NeonBackdrop dense={false} />
      <View style={{ padding: 18, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ borderRadius: 999, borderWidth: 3, borderColor: '#FFD84A' }}>
            <AvatarBadge avatarId={p.avatarId} name={p.name} size={52} skin={p.skin} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <NeonText style={{ fontSize: 20, color: '#FFFFFF' }}>
              {p.tierTitle} <Text style={{ fontSize: 14, color: '#FFD84A' }}>{'★'.repeat(p.tierStars)}</Text>
            </NeonText>
            <NeonText style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{L(`${p.resetDays} ngày nữa`, `${p.resetDays}d left`)}</NeonText>
          </View>
          {p.rank > 0 ? (
            <View accessibilityLabel={L(`Hạng ${p.rank}`, `Rank ${p.rank}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 40, borderRadius: 20, backgroundColor: '#FFD84A' }}>
              <NeonIcon name="crown" height={22} />
              <NeonText style={{ fontSize: 17, color: '#2B1D00' }}>#{p.rank}</NeonText>
            </View>
          ) : null}
        </View>

        <View accessibilityLabel={L(`${p.month} điểm tháng này`, `${p.month} points this month`)} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <NeonText style={{ fontSize: 52, lineHeight: 56, color: '#FFFFFF' }}>{p.month}</NeonText>
          <NeonText style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', paddingBottom: 8 }}>{L('điểm', 'pts')}</NeonText>
        </View>

        {p.rank === 0 ? (
          <NeonText style={{ fontSize: 13, color: '#FFD84A' }}>{p.month > 0 ? L('Đăng nhập để lên bảng', 'Sign in to join') : L('Học một buổi để lên bảng', 'Study once to join')}</NeonText>
        ) : null}

        {p.upcoming ? (
          <View accessibilityLabel={L(`Còn ${p.upcoming.remaining} điểm nữa lên ${p.upcoming.name}`, `${p.upcoming.remaining} more points to ${p.upcoming.name}`)} style={{ gap: 6 }}>
            <View style={{ height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <View style={{ width: `${p.upcoming.pct}%`, height: 12, borderRadius: 6, backgroundColor: '#FFD84A' }} />
            </View>
            <NeonText style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{`→ ${p.upcoming.name} · ${L(`còn ${p.upcoming.remaining}`, `${p.upcoming.remaining} to go`)}`}</NeonText>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <NeonPill icon="flame" label={`×${p.multiplier}`} />
          <NeonPill icon="clock" label={`${p.todayPoints} / ${p.dailyCap}`} />
        </View>
      </View>
    </View>
  );
}
