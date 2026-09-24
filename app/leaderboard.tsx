import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { AvatarBadge } from '@/components/profile/AnimatedAvatar';
import { ProfileCover } from '@/components/profile/ProfileCover';
import { Badge, Button, Card, Icon, ProgressBar, SectionHeader } from '@/components/ui';
import { sfx } from '@/services/audio/sfx';
import { goldenOf } from '@/services/gamification/golden';
import { MONTH_PRIZES, prizeForRank } from '@/services/gamification/monthly';
import {
  currentStreak,
  dailyPoints,
  dateKey,
  daysUntilReset,
  monthPoints,
  nextTier,
  rawEffort,
  shiftDays,
  streakMultiplier,
  tierFor,
  DAILY_POINT_CAP,
  MAX_MULTIPLIER,
} from '@/services/gamification/points';
import { findItem, formatStars } from '@/services/gamification/shop';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { useGameStore } from '@/store/useGameStore';
import { useGameFx } from '@/store/useGameFx';
import { skinOf, useRewardStore } from '@/store/useRewardStore';
import { useStarBalance } from '@/store/useStarBalance';
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
 * CÓ GIẢI THƯỞNG: hết tháng, top 10 nhận sao (`services/gamification/monthly.ts`)
 * để đổi vé gói, linh vật, skin. Bảng hiện avatar động và bìa mà mỗi người đang đeo.
 *
 * BẢNG VÀNG HÔM NAY đứng đầu trang: mỗi ngày ai được bao nhiêu sao, đúng bao
 * nhiêu câu, ôn bao nhiêu lượt từ vựng (`services/gamification/golden.ts`), kèm
 * số của chính mình và nút đổi quà bằng sao.
 *
 * BẢNG XẾP HẠNG CẦN MÁY CHỦ. Chưa đăng nhập hoặc chưa nối được thì trang vẫn
 * đủ dùng: thẻ hạng, chuỗi ngày và lưới hoạt động đều tính trên máy.
 */
type BoardRow = { id: string; name: string; points: number; streak: number; avatar?: string | null; cover?: string | null; skin?: string | null };
type PastRow = { id: string; name: string; points: number };
type GoldenRow = { id: string; name: string; stars: number; correct: number; vocab: number; avatar?: string | null; skin?: string | null };
type BoardData = { board: BoardRow[]; previous: { month: string; board: PastRow[] } | null; golden: { day: string; board: GoldenRow[] } | null };

export default function LeaderboardScreen() {
  const daily = useStudyStore((s) => s.daily);
  const frozenDays = useRewardStore((s) => s.frozenDays);
  const avatarId = useRewardStore((s) => s.avatar);
  const coverId = useRewardStore((s) => s.cover);
  const skin = skinOf(useRewardStore((s) => s.skin));
  const name = useDisplayName();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const stars = useStarBalance();
  const { data, error } = useBoard();

  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);

  const streak = currentStreak(daily, today, frozenDays);
  const month = monthPoints(daily, today, frozenDays);
  const tier = tierFor(month);
  const upcoming = nextTier(month);
  const multiplier = streakMultiplier(Math.max(0, streak - 1));
  const todayEffort = Math.round(rawEffort(daily[todayKey]));
  const todayPoints = dailyPoints(daily[todayKey], Math.max(0, streak - 1));
  const me = userId ? userId.slice(0, 8) : null;

  return (
    <Screen>
      <Appear>
        <View className="flex-row flex-wrap items-center gap-3">
          <Text className="font-heavy text-pageTitle text-ink">🏆 Xếp hạng</Text>
          <View className="flex-1" />
          <View className="flex-row items-center gap-1.5 rounded-pill px-3 py-1.5" style={{ backgroundColor: '#FEF3C7' }} accessibilityLabel={`Đang có ${stars} sao`}>
            <Text style={{ fontSize: 14 }}>⭐</Text>
            <Text className="font-heavy text-body text-ink">{formatStars(stars)}</Text>
          </View>
          <Button label="Đổi quà" variant="outline" size="sm" iconLeft="gift" onPress={() => router.push('/shop' as never)} />
          <Button label="Hồ sơ" variant="outline" size="sm" iconLeft="star" onPress={() => router.push('/profile' as never)} />
        </View>
        <Text className="mt-1 font-sans text-body text-muted">
          Điểm tính từ chính thời gian học và số câu đã làm — không có nút nào cộng điểm. Hết tháng, top 10 được thưởng sao.
        </Text>
      </Appear>

      <Appear index={1}>
        <GoldenBoard data={data} error={error} me={me} />
      </Appear>

      <View className="mt-5">
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={16}>
          <Appear index={2} style={{ height: '100%' }}>
            <Card className="h-full overflow-hidden" padded={false}>
              <ProfileCover cover={findItem(coverId)?.cover ?? null} height={84} />
              <View className="px-4 pb-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1 flex-row items-start gap-3">
                    <View style={{ marginTop: -30, borderRadius: 999, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' }}>
                      <AvatarBadge avatarId={avatarId} name={name} size={60} skin={skin} />
                    </View>
                    <View className="min-w-0 flex-1 pt-2">
                      <Text className="font-heavy text-sectionTitle text-ink" numberOfLines={1}>
                        {tier.name}
                      </Text>
                      <Text className="font-sans text-label text-muted">
                        {'★'.repeat(tier.stars)}
                        <Text style={{ color: color.subtle }}>{'★'.repeat(5 - tier.stars)}</Text>
                      </Text>
                    </View>
                  </View>
                  <View className="pt-2">
                    <Badge label={`Reset sau ${daysUntilReset(today)} ngày`} tone="neutral" shape="tag" />
                  </View>
                </View>

                <Text className="mt-4 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
                  Tổng điểm tháng này
                </Text>
                <Text className="font-heavy text-ink" style={{ fontSize: 40, lineHeight: 46 }}>
                  {month}
                </Text>

                {upcoming ? (
                  <>
                    <ProgressBar className="mt-2" value={upcoming.tier.from > 0 ? (month / upcoming.tier.from) * 100 : 100} tone="accent" />
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
                    Hệ số hôm nay: 1 + 🔥 {(multiplier - 1).toFixed(1)} = <Text className="font-heavy text-ink">{multiplier}</Text> (tối đa {MAX_MULTIPLIER})
                  </Text>
                  <Text className="font-sans text-label text-muted">
                    Điểm hôm nay: {multiplier} × {todayEffort} = <Text className="font-heavy text-ink">{todayPoints}</Text> (tối đa {DAILY_POINT_CAP})
                  </Text>
                  <Text className="font-sans text-label text-subtle">Công: 1 điểm mỗi phút học, 0,5 điểm mỗi câu đã làm. Mỗi điểm cũng là một sao để đổi quà.</Text>
                </View>
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
        <PrizeCard data={data} me={me} today={today} />
      </Appear>

      <Appear index={4}>
        <SectionHeader className="mt-6" title="Bảng xếp hạng tháng này" subtitle="Điểm tháng này của những người đã đăng nhập" icon="trophy" />
      </Appear>

      <Board data={data} error={error} me={me} you={{ name, points: month }} />

      <View className="h-6" />
    </Screen>
  );
}

function useBoard(): { data: BoardData | null; error: string | null } {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/leaderboard')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { board?: BoardRow[]; previous?: { month: string; board?: PastRow[] }; golden?: { day: string; board?: GoldenRow[] } }) => {
        if (alive)
          setData({
            board: d.board ?? [],
            previous: d.previous ? { month: d.previous.month, board: d.previous.board ?? [] } : null,
            golden: d.golden ? { day: d.golden.day, board: d.golden.board ?? [] } : null,
          });
      })
      .catch(() => {
        if (alive) setError('Chưa nối được máy chủ — bảng này cần đăng nhập và có mạng.');
      });
    return () => {
      alive = false;
    };
  }, []);

  return { data, error };
}

const MEDAL = ['🥇', '🥈', '🥉'];

const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/** "2026-09-24" → "Thứ Năm, 24/09". */
function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  return `${WEEKDAY[date.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

const GOLD_INK = '#3B2503';
const ROW_TINT = ['#FFFBEB', '#F8FAFC', '#FFF7ED'];

/**
 * BẢNG VÀNG HÔM NAY: sao, câu đúng và lượt ôn từ vựng của mọi người trong ngày,
 * cùng số của chính mình (tính ngay trên máy, không chờ đồng bộ) và lối đổi quà.
 */
function GoldenBoard({ data, error, me }: { data: BoardData | null; error: string | null; me: string | null }) {
  const narrow = useWindowDimensions().width < 640;
  const daily = useStudyStore((s) => s.daily);
  const frozen = useRewardStore((s) => s.frozenDays);
  const gameDay = useGameStore((s) => s.day);
  const gameToday = useGameStore((s) => s.today);
  const stars = useStarBalance();
  const now = useMemo(() => new Date(), []);
  const key = dateKey(now);
  const mine = goldenOf({ userId: 'me', daily, frozen, game: { day: gameDay, today: gameToday } }, key, now);
  const rows = data?.golden?.board ?? [];
  const inBoard = me ? rows.findIndex((r) => r.id === me) : -1;
  // Màn hẹp: cột số hẹp lại, khoảng cách nhỏ đi để tên người học không bị cắt.
  const W = narrow ? { rank: 22, star: 40, correct: 34, vocab: 38 } : { rank: 28, star: 56, correct: 64, vocab: 72 };
  const rowClass = narrow ? 'flex-row items-center gap-2 px-3.5' : 'flex-row items-center gap-3 px-5';

  return (
    <View className="mt-5 overflow-hidden rounded-[24px]" style={{ backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#FCD34D' }}>
      <LinearGradient colors={['#FEF3C7', '#FDE68A', '#FBBF24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: narrow ? 16 : 20 }}>
        <View className="flex-row flex-wrap items-center gap-3">
          <Text style={{ fontSize: 30 }}>🏅</Text>
          <View className="min-w-0 flex-1">
            <Text className="font-heavy" style={{ fontSize: 22, color: GOLD_INK }}>
              Bảng vàng hôm nay
            </Text>
            <Text className="font-semi" style={{ fontSize: 13, color: '#78350F' }}>
              {dayLabel(data?.golden?.day ?? key)} · sao, câu đúng, lượt ôn từ vựng · chốt lúc 0 giờ
            </Text>
          </View>
        </View>

        {/* Số của chính mình — tính trên máy, luôn có kể cả khi chưa đăng nhập. */}
        <View className="mt-4 flex-row flex-wrap items-center gap-2 rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.72)' }}>
          <Text className="font-strong" style={{ fontSize: 13, color: GOLD_INK }}>
            Hôm nay của bạn
          </Text>
          <Stat icon="⭐" value={mine.stars} label="sao" />
          <Stat icon="✅" value={mine.correct} label="câu đúng" />
          <Stat icon="📚" value={mine.vocab} label="lượt ôn từ" />
          <View className="flex-1" />
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/shop' as never)}
            className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2"
            style={{ backgroundColor: GOLD_INK }}
          >
            <Icon name="gift" size={14} color="#FDE68A" strokeWidth={2.2} />
            <Text className="font-strong" style={{ fontSize: 13, color: '#FDE68A' }}>
              Đổi quà · {formatStars(stars)} ⭐
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={{ paddingVertical: 6 }}>
        {error ? (
          <Text className="px-5 py-4 font-sans text-body text-muted">Bảng của mọi người cần mạng và đăng nhập — số của bạn ở trên vẫn tính đủ.</Text>
        ) : !data ? (
          <View className="items-center py-6">
            <ActivityIndicator color="#D97706" />
          </View>
        ) : rows.length === 0 ? (
          <Text className="px-5 py-4 font-sans text-body text-muted">
            Hôm nay chưa ai ghi tên. {me ? 'Làm một câu đúng là lên bảng vàng.' : 'Đăng nhập rồi làm một câu đúng là lên bảng vàng.'}
          </Text>
        ) : (
          <>
            <View className={`${rowClass} py-2`}>
              <Text className="text-center font-strong text-label text-subtle" style={{ width: W.rank }}>#</Text>
              <Text className="min-w-0 flex-1 font-strong text-label text-subtle">Người học</Text>
              <Text className="font-strong text-label text-subtle" style={{ width: W.star, textAlign: 'right' }}>
                {narrow ? '⭐' : '⭐ Sao'}
              </Text>
              <Text className="font-strong text-label text-subtle" style={{ width: W.correct, textAlign: 'right' }}>
                {narrow ? '✅' : '✅ Đúng'}
              </Text>
              <Text className="font-strong text-label text-subtle" style={{ width: W.vocab, textAlign: 'right' }}>
                {narrow ? '📚' : '📚 Ôn từ'}
              </Text>
            </View>
            {rows.slice(0, 10).map((r, i) => {
              const mineRow = r.id === me;
              return (
                <View
                  key={r.id}
                  className={`${rowClass} py-2.5`}
                  style={{ backgroundColor: mineRow ? '#EEF2FF' : (ROW_TINT[i] ?? 'transparent') }}
                >
                  <Text className="text-center font-heavy text-body" style={{ width: W.rank, color: '#92400E' }}>
                    {MEDAL[i] ?? i + 1}
                  </Text>
                  <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
                    <AvatarBadge avatarId={r.avatar ?? null} name={r.name} size={narrow ? 26 : 30} skin={skinOf(r.skin ?? null)} />
                    <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                      {mineRow ? `${r.name} (bạn)` : r.name}
                    </Text>
                  </View>
                  <Text className="font-heavy text-body" style={{ width: W.star, textAlign: 'right', color: '#B45309' }}>
                    {r.stars}
                  </Text>
                  <Text className="font-semi text-body text-ink" style={{ width: W.correct, textAlign: 'right' }}>
                    {r.correct}
                  </Text>
                  <Text className="font-semi text-body text-ink" style={{ width: W.vocab, textAlign: 'right' }}>
                    {r.vocab}
                  </Text>
                </View>
              );
            })}
            {!me ? (
              <Text className="px-5 py-3 font-sans text-label text-muted">Đăng nhập để tên bạn lên bảng vàng cùng mọi người.</Text>
            ) : null}
            {me && inBoard < 0 && (mine.stars > 0 || mine.correct > 0) ? (
              <View className={`${rowClass} py-2.5`} style={{ backgroundColor: '#EEF2FF' }}>
                <Text className="text-center font-heavy text-body text-muted" style={{ width: W.rank }}>—</Text>
                <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                  Bạn — số của bạn lên bảng sau vài giây đồng bộ
                </Text>
                <Text className="font-heavy text-body" style={{ width: W.star, textAlign: 'right', color: '#B45309' }}>
                  {mine.stars}
                </Text>
                <Text className="font-semi text-body text-ink" style={{ width: W.correct, textAlign: 'right' }}>
                  {mine.correct}
                </Text>
                <Text className="font-semi text-body text-ink" style={{ width: W.vocab, textAlign: 'right' }}>
                  {mine.vocab}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-pill px-2.5 py-1" style={{ backgroundColor: '#FFFFFF' }}>
      <Text style={{ fontSize: 12 }}>{icon}</Text>
      <Text className="font-heavy" style={{ fontSize: 14, color: GOLD_INK }}>
        {value.toLocaleString('vi-VN')}
      </Text>
      <Text className="font-sans" style={{ fontSize: 12, color: '#78350F' }}>
        {label}
      </Text>
    </View>
  );
}

/** "2026-08" → "tháng 8/2026". */
function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `tháng ${Number(m)}/${y}`;
}

/**
 * Giải thưởng tháng: bậc thưởng, hạng hiện tại của bạn, và — nếu tháng trước
 * bạn trong top 10 — nút nhận sao (mỗi tháng một lần).
 */
function PrizeCard({ data, me, today }: { data: BoardData | null; me: string | null; today: Date }) {
  const prizes = useRewardStore((s) => s.prizes);
  const claimPrize = useRewardStore((s) => s.claimPrize);
  const [claimedNow, setClaimedNow] = useState<number | null>(null);

  const rankNow = me && data ? data.board.findIndex((r) => r.id === me) + 1 : 0;
  const prev = data?.previous ?? null;
  const prevRank = me && prev ? prev.board.findIndex((r) => r.id === me) + 1 : 0;
  const prize = prizeForRank(prevRank);
  const already = prev ? (prizes?.[prev.month] ?? 0) : 0;

  const claim = () => {
    if (!prev || prize <= 0) return;
    if (claimPrize(prev.month, prize)) {
      setClaimedNow(prize);
      sfx.coins(8);
      useGameFx.getState().push({ kind: 'stars', amount: prize, reason: 'thưởng hạng tháng' });
    }
  };

  return (
    <Card className="mt-6">
      <SectionHeader title="Giải thưởng tháng" subtitle={`Chốt bảng sau ${daysUntilReset(today)} ngày nữa`} icon="gift" iconTone="warning" />
      <Text className="mt-2 font-sans text-label text-muted">Hết tháng, top 10 bảng dưới đây được thưởng sao. Đầu tháng sau quay lại trang này bấm nhận.</Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {MONTH_PRIZES.map((p, i) => (
          <View key={p.label} className="flex-row items-center gap-2 rounded-panel px-3 py-2" style={{ flexGrow: 1, flexShrink: 1, flexBasis: 150, backgroundColor: i === 0 ? '#FEF3C7' : '#F6F7FB' }}>
            <Text style={{ fontSize: 20 }}>{MEDAL[i] ?? '🏅'}</Text>
            <View className="min-w-0 flex-1">
              <Text className="font-strong text-label text-ink">{p.label}</Text>
              <Text className="font-heavy text-body text-ink">+{p.stars} ⭐</Text>
            </View>
          </View>
        ))}
      </View>

      {me && rankNow > 0 ? (
        <Text className="mt-3 font-sans text-body text-ink">
          Bạn đang đứng <Text className="font-heavy">hạng {rankNow}</Text>
          {prizeForRank(rankNow) > 0 ? ` — giữ tới hết tháng là nhận ${prizeForRank(rankNow)} sao.` : ' — lọt vào top 10 để có thưởng.'}
        </Text>
      ) : me && data ? (
        <Text className="mt-3 font-sans text-body text-muted">Bạn chưa có tên trên bảng tháng này. Học một buổi là có điểm.</Text>
      ) : !me ? (
        <Text className="mt-3 font-sans text-body text-muted">Đăng nhập để lên bảng và nhận thưởng tháng.</Text>
      ) : null}

      {prev && prev.board.length > 0 ? (
        <View className="mt-4 rounded-panel bg-surfaceAlt p-3">
          <Text className="font-strong text-label text-muted">Vinh danh {monthLabel(prev.month)}</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-x-4 gap-y-1">
            {prev.board.slice(0, 3).map((r, i) => (
              <Text key={r.id} className="font-semi text-body text-ink" numberOfLines={1}>
                {MEDAL[i]} {r.name} · {r.points}
              </Text>
            ))}
          </View>

          {prize > 0 ? (
            already > 0 || claimedNow ? (
              <Text className="mt-3 font-semi text-body" style={{ color: '#15803D' }}>
                ✓ Đã nhận {already || claimedNow} sao thưởng hạng {prevRank} {monthLabel(prev.month)}.
              </Text>
            ) : (
              <View className="mt-3 flex-row flex-wrap items-center gap-3">
                <Text className="min-w-0 flex-1 font-semi text-body text-ink">
                  {monthLabel(prev.month)} bạn đứng hạng {prevRank}. Phần thưởng: {prize} sao.
                </Text>
                <Button label={`Nhận ${prize} ⭐`} size="sm" iconLeft="gift" onPress={claim} />
              </View>
            )
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/** Lưới ô vuông 12 tuần gần nhất, đậm dần theo số phút học. */
function Heatmap({ daily, frozen, today }: { daily: Record<string, { minutes: number; questions: number }>; frozen: string[]; today: Date }) {
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
      <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
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

const PODIUM_RING = ['#F59E0B', '#94A3B8', '#D97706'];

function Board({ data, error, me, you }: { data: BoardData | null; error: string | null; me: string | null; you: { name: string; points: number } }) {
  const narrow = useWindowDimensions().width < 640;

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

  if (!data) {
    return (
      <Card className="mt-3 items-center py-8">
        <ActivityIndicator color={color.primary} />
      </Card>
    );
  }

  const rows = data.board;
  if (rows.length === 0) {
    return (
      <Card className="mt-3">
        <Text className="font-sans text-body text-muted">Chưa ai có điểm tháng này. Học một buổi là bạn đứng đầu bảng.</Text>
      </Card>
    );
  }

  const podium = rows.slice(0, 3);
  // Bục: hạng nhì bên trái, nhất ở giữa, ba bên phải.
  const order = podium.length === 3 ? [podium[1]!, podium[0]!, podium[2]!] : podium;
  const rest = rows.slice(3);
  const inBoard = me ? rows.some((r) => r.id === me) : false;

  return (
    <View className="mt-3">
      <View className="flex-row items-end gap-3">
        {order.map((row) => {
          const rank = rows.indexOf(row);
          const first = rank === 0;
          const mine = row.id === me;
          return (
            <View
              key={row.id}
              style={{
                flex: 1,
                minWidth: 0,
                marginTop: first ? 0 : 22,
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: mine ? color.primary : PODIUM_RING[rank],
              }}
            >
              <ProfileCover cover={findItem(row.cover)?.cover ?? null} height={first ? 64 : 52} />
              <View style={{ alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, marginTop: first ? -34 : -28 }}>
                <View style={{ borderRadius: 999, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' }}>
                  <AvatarBadge avatarId={row.avatar ?? null} name={row.name} size={narrow ? (first ? 52 : 44) : first ? 64 : 52} skin={skinOf(row.skin ?? null)} />
                </View>
                <Text style={{ marginTop: 4, fontSize: first ? 24 : 20 }}>{MEDAL[rank]}</Text>
                <Text className="text-center font-strong text-body text-ink" numberOfLines={1}>
                  {mine ? 'Bạn' : row.name}
                </Text>
                <Text className="font-heavy text-ink" style={{ fontSize: first ? 22 : 18 }}>
                  {row.points}
                </Text>
                {row.streak > 0 ? <Text className="font-sans text-label text-muted">🔥 {row.streak}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>

      {rest.length > 0 || (!inBoard && me) ? (
        <Card className="mt-3" padded={false}>
          {rest.map((row, i) => {
            const mine = row.id === me;
            return (
              <View key={row.id} className="flex-row items-center gap-3 border-b border-border px-5 py-3" style={mine ? { backgroundColor: '#EEF2FF' } : undefined}>
                <Text className="w-8 text-center font-heavy text-body text-muted">{i + 4}</Text>
                <AvatarBadge avatarId={row.avatar ?? null} name={row.name} size={36} skin={skinOf(row.skin ?? null)} />
                <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                  {mine ? `${row.name} (bạn)` : row.name}
                </Text>
                {i + 4 <= 10 ? <Badge label="Top 10" tone="warning" shape="tag" /> : null}
                {row.streak > 0 ? <Text className="font-sans text-label text-muted">🔥 {row.streak}</Text> : null}
                <Text className="font-heavy text-body text-ink">{row.points}</Text>
              </View>
            );
          })}
          {!inBoard && me ? (
            <View className="flex-row items-center gap-3 px-5 py-3" style={{ backgroundColor: '#EEF2FF' }}>
              <Text className="w-8 text-center font-heavy text-body text-muted">—</Text>
              <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                Bạn — chưa vào top {rows.length}
              </Text>
              <Text className="font-heavy text-body text-ink">{you.points}</Text>
            </View>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}
