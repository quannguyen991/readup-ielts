import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, ProgressBar, SectionHeader } from '@/components/ui';
import {
  currentStreak,
  dailyPoints,
  dateKey,
  daysUntilReset,
  lifetimePoints,
  monthPoints,
  nextTier,
  rawEffort,
  shiftDays,
  streakMultiplier,
  tierFor,
  DAILY_POINT_CAP,
  MAX_MULTIPLIER,
} from '@/services/gamification/points';
import { balanceOf, findItem } from '@/services/gamification/shop';
import { useDisplayName } from '@/store/useAuthStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';

/**
 * Trang Xếp hạng.
 *
 * ĐIỂM LÀ HỆ QUẢ CỦA VIỆC HỌC, KHÔNG PHẢI MỘT TRÒ RIÊNG. Mọi con số ở đây tính
 * lại từ nhật ký học có sẵn, nên không có cách nào cày điểm mà không thật sự
 * học — và cũng không có nút nào cộng điểm.
 *
 * NÓI RÕ CÁCH TÍNH ngay trên thẻ: hệ số hôm nay bằng bao nhiêu, vì sao, và trần
 * mỗi ngày là bao nhiêu. Bảng điểm không giải thích được thì người học chỉ đoán,
 * và khi đoán sai họ sẽ học theo cách sai.
 *
 * BẢNG XẾP HẠNG CẦN MÁY CHỦ. Chưa đăng nhập hoặc chưa nối được thì trang vẫn
 * đủ dùng: thẻ hạng, chuỗi ngày và lưới hoạt động đều tính trên máy.
 */
type BoardRow = { id: string; name: string; points: number; streak: number };

export default function LeaderboardScreen() {
  const daily = useStudyStore((s) => s.daily);
  const frozenDays = useRewardStore((s) => s.frozenDays);
  const spent = useRewardStore((s) => s.spent);
  const avatarId = useRewardStore((s) => s.avatar);
  const name = useDisplayName();

  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);

  const streak = currentStreak(daily, today, frozenDays);
  const month = monthPoints(daily, today, frozenDays);
  const tier = tierFor(month);
  const upcoming = nextTier(month);
  const multiplier = streakMultiplier(Math.max(0, streak - 1));
  const todayEffort = Math.round(rawEffort(daily[todayKey]));
  const todayPoints = dailyPoints(daily[todayKey], Math.max(0, streak - 1));
  const coins = balanceOf(lifetimePoints(daily, frozenDays), spent);
  const avatarGlyph = avatarId ? (findItem(avatarId)?.glyph ?? null) : null;

  return (
    <Screen>
      <Appear>
        <View className="flex-row flex-wrap items-center gap-3">
          <Text className="font-heavy text-pageTitle text-ink">🏆 Xếp hạng</Text>
          <View className="flex-1" />
          <View className="flex-row items-center gap-1.5 rounded-pill border border-warning-soft bg-warning-soft px-3 py-1.5">
            <Text style={{ fontSize: 14 }}>🪙</Text>
            <Text className="font-heavy text-body text-ink">{coins}</Text>
          </View>
          <Button
            label="Cửa hàng"
            variant="outline"
            size="sm"
            iconLeft="gift"
            onPress={() => router.push('/shop' as never)}
          />
        </View>
        <Text className="mt-1 font-sans text-body text-muted">
          Điểm tính từ chính thời gian học và số câu đã làm — không có nút nào cộng điểm.
        </Text>
      </Appear>

      <View className="mt-5">
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={16}>
          <Appear index={1} style={{ height: '100%' }}>
            <Card className="h-full">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1 flex-row items-center gap-3">
                  <View className="h-14 w-14 items-center justify-center rounded-pill bg-accent-100">
                    <Text style={{ fontSize: avatarGlyph ? 26 : 20 }}>
                      {avatarGlyph ?? name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-heavy text-sectionTitle text-ink" numberOfLines={1}>
                      {tier.name}
                    </Text>
                    <Text className="mt-0.5 font-sans text-label text-muted">
                      {'★'.repeat(tier.stars)}
                      <Text style={{ color: color.subtle }}>{'★'.repeat(5 - tier.stars)}</Text>
                    </Text>
                  </View>
                </View>
                <Badge label={`Reset sau ${daysUntilReset(today)} ngày`} tone="neutral" shape="tag" />
              </View>

              <Text className="mt-4 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
                Tổng điểm tháng này
              </Text>
              <Text className="font-heavy text-ink" style={{ fontSize: 40, lineHeight: 46 }}>
                {month}
              </Text>

              {upcoming ? (
                <>
                  <ProgressBar
                    className="mt-2"
                    value={upcoming.tier.from > 0 ? (month / upcoming.tier.from) * 100 : 100}
                    tone="accent"
                  />
                  <Text className="mt-1.5 font-sans text-label text-muted">
                    Còn {upcoming.remaining} điểm nữa lên {upcoming.tier.name}.
                  </Text>
                </>
              ) : (
                <Text className="mt-2 font-sans text-label text-muted">Bậc cao nhất — giữ nhịp thôi.</Text>
              )}

              {/* Nói thẳng cách tính, để không ai phải đoán */}
              <View className="mt-4 gap-1 rounded-panel bg-surfaceAlt p-3">
                <Text className="font-sans text-label text-muted">
                  Hệ số hôm nay: 1 + 🔥 {(multiplier - 1).toFixed(1)} ={' '}
                  <Text className="font-heavy text-ink">{multiplier}</Text> (tối đa {MAX_MULTIPLIER})
                </Text>
                <Text className="font-sans text-label text-muted">
                  Điểm hôm nay: {multiplier} × {todayEffort} ={' '}
                  <Text className="font-heavy text-ink">{todayPoints}</Text> (tối đa {DAILY_POINT_CAP})
                </Text>
                <Text className="font-sans text-label text-subtle">
                  Công: 1 điểm mỗi phút học, 0,5 điểm mỗi câu đã làm.
                </Text>
              </View>
            </Card>
          </Appear>

          <Appear index={2} style={{ height: '100%' }}>
            <Card className="h-full">
              <SectionHeader title="Hoạt động học tập" icon="flame" iconTone="warning" />
              <View className="mt-3 flex-row gap-6">
                <View className="items-center">
                  <Text className="font-heavy text-ink" style={{ fontSize: 30 }}>
                    🔥 {streak}
                  </Text>
                  <Text className="mt-0.5 font-sans text-label text-muted">Chuỗi hiện tại</Text>
                </View>
                <View className="items-center">
                  <Text className="font-heavy text-ink" style={{ fontSize: 30 }}>
                    {Math.round(daily[todayKey]?.minutes ?? 0)}
                  </Text>
                  <Text className="mt-0.5 font-sans text-label text-muted">Phút hôm nay</Text>
                </View>
              </View>

              <Heatmap daily={daily} frozen={frozenDays} today={today} />
            </Card>
          </Appear>
        </Grid>
      </View>

      <Appear index={3}>
        <SectionHeader
          className="mt-6"
          title="Bảng xếp hạng"
          subtitle="Điểm tháng này của những người đã đăng nhập"
          icon="trophy"
        />
      </Appear>

      <Board you={{ name, points: month, streak }} />

      <View className="h-6" />
    </Screen>
  );
}

/** Lưới ô vuông 12 tuần gần nhất, đậm dần theo số phút học. */
function Heatmap({
  daily,
  frozen,
  today,
}: {
  daily: Record<string, { minutes: number; questions: number }>;
  frozen: string[];
  today: Date;
}) {
  const weeks = 12;
  const columns: { key: string; minutes: number; frozen: boolean }[][] = [];
  // Bắt đầu từ thứ Hai của tuần cách đây 11 tuần, để mỗi cột là một tuần đủ.
  const start = shiftDays(today, -((weeks - 1) * 7 + ((today.getDay() + 6) % 7)));

  for (let w = 0; w < weeks; w += 1) {
    const col: { key: string; minutes: number; frozen: boolean }[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = shiftDays(start, w * 7 + d);
      const key = dateKey(date);
      col.push({ key, minutes: daily[key]?.minutes ?? 0, frozen: frozen.includes(key) });
    }
    columns.push(col);
  }

  const shade = (minutes: number, isFrozen: boolean) => {
    if (isFrozen) return '#BFDBFE';
    if (minutes <= 0) return '#EEF1F7';
    if (minutes < 15) return '#BBF7D0';
    if (minutes < 30) return '#6EE7A8';
    if (minutes < 60) return '#34D399';
    return '#16A34A';
  };

  return (
    <View className="mt-4">
      <View className="flex-row gap-1">
        {columns.map((col, i) => (
          <View key={i} className="gap-1">
            {col.map((cell) => (
              <View key={cell.key} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: shade(cell.minutes, cell.frozen) }} />
            ))}
          </View>
        ))}
      </View>
      <View className="mt-2 flex-row items-center gap-1.5">
        <Text className="font-sans text-label text-subtle">Ít</Text>
        {['#EEF1F7', '#BBF7D0', '#6EE7A8', '#34D399', '#16A34A'].map((c) => (
          <View key={c} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
        ))}
        <Text className="font-sans text-label text-subtle">Nhiều</Text>
        <View className="ml-2 flex-row items-center gap-1">
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#BFDBFE' }} />
          <Text className="font-sans text-label text-subtle">ngày dùng thẻ giữ chuỗi</Text>
        </View>
      </View>
    </View>
  );
}

function Board({ you }: { you: { name: string; points: number; streak: number } }) {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/leaderboard')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { board?: BoardRow[] }) => {
        if (alive) setRows(data.board ?? []);
      })
      .catch(() => {
        if (alive) setError('Chưa nối được máy chủ — bảng này cần đăng nhập và có mạng.');
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <Card className="mt-3">
        <Text className="font-sans text-body text-muted">{error}</Text>
        <Text className="mt-2 font-sans text-label text-subtle">
          Điểm tháng này của bạn: <Text className="font-heavy text-ink">{you.points}</Text>
        </Text>
      </Card>
    );
  }

  if (!rows) {
    return (
      <Card className="mt-3 items-center py-8">
        <ActivityIndicator color={color.primary} />
      </Card>
    );
  }

  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`);

  return (
    <Card className="mt-3" padded={false}>
      <ScrollView style={{ maxHeight: 520 }}>
        {rows.length === 0 ? (
          <Text className="p-5 font-sans text-body text-muted">
            Chưa ai có điểm tháng này. Học một buổi là bạn đứng đầu bảng.
          </Text>
        ) : (
          rows.map((row, i) => (
            <View
              key={row.id}
              className="flex-row items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
            >
              <Text className="w-8 text-center font-heavy text-body text-muted">{medal(i)}</Text>
              <View className="h-9 w-9 items-center justify-center rounded-pill bg-surfaceAlt">
                <Text className="font-strong text-body text-muted">{row.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                {row.name}
              </Text>
              {row.streak > 0 ? (
                <Text className="font-sans text-label text-muted">🔥 {row.streak}</Text>
              ) : null}
              <Text className="font-heavy text-body text-ink">{row.points}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </Card>
  );
}
