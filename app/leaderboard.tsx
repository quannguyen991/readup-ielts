import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Grid } from '@/components/layout/Grid';
import { NeonHeading, NeonIcon, NeonWindow } from '@/components/neon/Neon';
import type { NeonIconId } from '@/components/neon/neon-art';
import { MyRankCard, SeasonHero } from '@/components/leaderboard/SeasonStyle';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { AvatarBadge } from '@/components/profile/AnimatedAvatar';
import { ProfileCover } from '@/components/profile/ProfileCover';
import { ProfileEffect } from '@/components/profile/ProfileEffect';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { sfx } from '@/services/audio/sfx';
import { demoLeaderboard } from '@/services/gamification/demo-board';
import { goldenOf, vnToday } from '@/services/gamification/golden';
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
  dailyCapFor,
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
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteRocket, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { currentLocale, pick, useL } from '@/i18n/useL';
import { tierName } from '@/services/gamification/labels-en';

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
type BoardRow = { id: string; name: string; points: number; streak: number; avatar?: string | null; cover?: string | null; effect?: string | null; skin?: string | null };
type PastRow = { id: string; name: string; points: number };
type GoldenRow = { id: string; name: string; stars: number; correct: number; vocab: number; avatar?: string | null; skin?: string | null };
type BoardData = { board: BoardRow[]; previous: { month: string; board: PastRow[] } | null; golden: { day: string; board: GoldenRow[] } | null };

export default function LeaderboardScreen() {
  const { L, locale } = useL();
  const daily = useStudyStore((s) => s.daily);
  const frozenDays = useRewardStore((s) => s.frozenDays);
  const avatarId = useRewardStore((s) => s.avatar);
  const coverId = useRewardStore((s) => s.cover);
  const skin = skinOf(useRewardStore((s) => s.skin));
  const name = useDisplayName();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const stars = useStarBalance();
  const { demo: demoParam } = useLocalSearchParams<{ demo?: string }>();
  const demo = demoParam === '1';
  const { data, error } = useBoard(demo);

  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);

  const streak = currentStreak(daily, today, frozenDays);
  const month = monthPoints(daily, today, frozenDays);
  const tier = tierFor(month);
  const upcoming = nextTier(month);
  const multiplier = streakMultiplier(Math.max(0, streak - 1));
  const todayEffort = Math.round(rawEffort(daily[todayKey]));
  const todayPoints = dailyPoints(daily[todayKey], Math.max(0, streak - 1), todayKey);
  const me = userId ? userId.slice(0, 8) : null;

  return (
    <Screen cat="cheer">
      {/* Khung hẹp lại trên màn rộng: bảng xếp hạng và thẻ điểm không bị kéo giãn ngang. */}
      <View className="w-full self-center" style={{ maxWidth: 960 }}>
      {demo ? (
        <View className="mb-4 flex-row flex-wrap items-center gap-3 rounded-card px-4 py-3" style={{ backgroundColor: '#F3F0FB' }}>
          <Text style={{ fontSize: 16 }}>🧪</Text>
          <Text className="flex-1 font-semi text-body text-ink" style={{ minWidth: 220 }}>
            {L('Dữ liệu minh hoạ, không phải học viên thật.', 'Sample data, not real learners.')}
          </Text>
          <Button label={L('Xem bảng thật', 'See the real board')} variant="outline" size="sm" onPress={() => router.replace('/leaderboard' as never)} />
        </View>
      ) : null}
      <Appear>
        <SeasonHero stars={stars} today={today} dailyCap={dailyCapFor(todayKey)} />
      </Appear>

      <Appear index={1}>
        <GoldenBoard data={data} error={error} me={me} />
      </Appear>

      <View className="mt-5">
        <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={16}>
          <Appear index={2} style={{ height: '100%' }}>
            <MyRankCard
              name={name}
              avatarId={avatarId}
              skin={skin}
              tierTitle={tierName(tier, locale)}
              tierStars={tier.stars}
              month={month}
              rank={me && data ? data.board.findIndex((r) => r.id === me) + 1 : 0}
              upcoming={upcoming ? { remaining: upcoming.remaining, name: tierName(upcoming.tier, locale), pct: upcoming.tier.from > 0 ? Math.min(100, (month / upcoming.tier.from) * 100) : 100 } : null}
              multiplier={multiplier}
              todayEffort={todayEffort}
              todayPoints={todayPoints}
              dailyCap={dailyCapFor(todayKey)}
              resetDays={daysUntilReset(today)}
            />
          </Appear>

          <Appear index={2} style={{ height: '100%' }}>
            <NeonWindow title={L('Hoạt động', 'Activity')} icon="flame" style={{ height: '100%' }}>
              <View className="flex-row gap-6">
                <View className="items-center">
                  <View className="flex-row items-center gap-1.5">
                    <NeonIcon name="flame" height={30} />
                    <Text className="font-heavy text-ink" style={{ fontSize: 30 }}>
                      {streak}
                    </Text>
                  </View>
                  <Text className="mt-0.5 font-sans text-label text-muted">{L('Chuỗi', 'Streak')}</Text>
                </View>
                <View className="items-center">
                  <View className="flex-row items-center gap-1.5">
                    <NeonIcon name="clock" height={28} />
                    <Text className="font-heavy text-ink" style={{ fontSize: 30 }}>
                      {Math.round(daily[todayKey]?.minutes ?? 0)}
                    </Text>
                  </View>
                  <Text className="mt-0.5 font-sans text-label text-muted">{L('Phút', 'Minutes')}</Text>
                </View>
              </View>

              <Heatmap daily={daily} frozen={frozenDays} today={today} />
            </NeonWindow>
          </Appear>
        </Grid>
      </View>

      <Appear index={3}>
        <PrizeCard data={data} me={me} today={today} />
      </Appear>

      <Appear index={4}>
        <View className="mt-7">
          <NeonHeading title={L('Xếp hạng tháng', 'Monthly board')} icon="crown" />
        </View>
      </Appear>

      <Board data={data} error={error} me={me} you={{ name, points: month }} />

      <View className="h-6" />
      </View>
    </Screen>
  );
}

function useBoard(demo: boolean): { data: BoardData | null; error: string | null } {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Chế độ minh hoạ không gọi máy chủ — dữ liệu sinh tại chỗ ở `demoData` bên dưới.
    if (demo) return;
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
        if (alive) setError('offline');
      });
    return () => {
      alive = false;
    };
  }, [demo]);

  const demoData = useMemo<BoardData | null>(() => {
    if (!demo) return null;
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    return demoLeaderboard(vnToday(now).key, prevKey);
  }, [demo]);

  return demo ? { data: demoData, error: null } : { data, error };
}

const MEDAL = ['🥇', '🥈', '🥉'];
const MEDAL_ICON: NeonIconId[] = ['crown', 'trophy', 'star5', 'star4'];

const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "2026-09-24" → "Thứ Năm, 24/09". */
function dayLabel(key: string, en = false): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  return `${(en ? WEEKDAY_EN : WEEKDAY)[date.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

const GOLD_INK = '#2B2350';
const ROW_TINT = ['#F3F0FB', '#F3F0FB', '#F3F0FB'];

/**
 * BẢNG VÀNG HÔM NAY: sao, câu đúng và lượt ôn từ vựng của mọi người trong ngày,
 * cùng số của chính mình (tính ngay trên máy, không chờ đồng bộ) và lối đổi quà.
 */
function GoldenBoard({ data, error, me }: { data: BoardData | null; error: string | null; me: string | null }) {
  const { L, en } = useL();
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
    <NeonWindow title={L('Bảng vàng', 'Honour board')} icon="trophy" padded={false} style={{ marginTop: 20 }}>
      <LinearGradient colors={['#F9F7FF', '#ECE6FF', '#DCD2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: narrow ? 14 : 18 }}>
        <Text className="font-nun-strong" style={{ fontSize: 13, color: '#4A4380' }}>
          {dayLabel(data?.golden?.day ?? key, en)}
        </Text>

        {/* Số của chính mình — tính trên máy, luôn có kể cả khi chưa đăng nhập. */}
        <View className="mt-3 flex-row flex-wrap items-center gap-2 rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 2, borderColor: 'rgba(42,34,181,0.18)' }}>
          <Stat icon="⭐" value={mine.stars} label={L('sao', 'stars')} />
          <Stat icon="✅" value={mine.correct} label={L('câu đúng', 'correct')} />
          <Stat icon="📚" value={mine.vocab} label={L('lượt ôn từ', 'vocab reviews')} />
          <View className="flex-1" />
          {/*
            Số dư tách hẳn khỏi số HÔM NAY và ghi rõ là tích luỹ. Bản cũ in
            "Đổi quà · 369 ⭐" ngay cạnh "5 sao" của hôm nay — hai con số khác
            nghĩa đặt sát nhau, người dùng đọc thành số liệu sai (26/09/2026).
          */}
          <Text className="font-semi" style={{ fontSize: 13, color: '#2B2350' }}>
            <Text className="font-heavy" style={{ color: GOLD_INK }}>{formatStars(stars)} ⭐</Text>
          </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={L(`Đổi quà — đang có ${formatStars(stars)} sao tích luỹ`, `Rewards — you have ${formatStars(stars)} stars saved up`)}
            onPress={() => router.push('/shop' as never)}
            className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2"
            style={{ backgroundColor: '#2A22B5' }}
          >
            <Icon name="gift" size={14} color="#FFD84A" strokeWidth={2.2} />
            <Text className="font-strong" style={{ fontSize: 13, color: '#FFD84A' }}>
              {L('Đổi quà', 'Rewards')}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={{ paddingVertical: 6 }}>
        {error ? (
          <Text className="px-5 py-4 font-sans text-body text-muted">{L('Cần mạng và đăng nhập.', 'Needs sign-in and a connection.')}</Text>
        ) : !data ? (
          <View className="items-center py-6">
            <ActivityIndicator color="#6A4BD9" />
          </View>
        ) : rows.length === 0 ? (
          <Text className="px-5 py-4 font-sans text-body text-muted">
            {L('Chưa ai ghi tên. Làm một câu đúng để lên bảng.', 'Empty so far. Get one answer right to join.')}
          </Text>
        ) : (
          <>
            <View className={`${rowClass} py-2`}>
              <Text className="text-center font-strong text-label text-subtle" style={{ width: W.rank }}>#</Text>
              <Text className="min-w-0 flex-1 font-strong text-label text-subtle">{L('Người học', 'Learner')}</Text>
              <Text className="font-strong text-label text-subtle" style={{ width: W.star, textAlign: 'right' }}>
                {narrow ? '⭐' : L('⭐ Sao', '⭐ Stars')}
              </Text>
              <Text className="font-strong text-label text-subtle" style={{ width: W.correct, textAlign: 'right' }}>
                {narrow ? '✅' : L('✅ Đúng', '✅ Correct')}
              </Text>
              <Text className="font-strong text-label text-subtle" style={{ width: W.vocab, textAlign: 'right' }}>
                {narrow ? '📚' : L('📚 Ôn từ', '📚 Vocab')}
              </Text>
            </View>
            {rows.slice(0, 10).map((r, i) => {
              const mineRow = r.id === me;
              return (
                <View
                  key={r.id}
                  className={`${rowClass} py-2.5`}
                  style={{ backgroundColor: mineRow ? '#F3F0FB' : (ROW_TINT[i] ?? 'transparent') }}
                >
                  <View style={{ width: W.rank, alignItems: 'center' }}>
                    {i < 3 ? (
                      <NeonIcon name={MEDAL_ICON[i]!} height={22} />
                    ) : (
                      <Text className="text-center font-heavy text-body" style={{ color: '#6A4BD9' }}>
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
                    <AvatarBadge avatarId={r.avatar ?? null} name={r.name} size={narrow ? 26 : 30} skin={skinOf(r.skin ?? null)} />
                    <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                      {mineRow ? L(`${r.name} (bạn)`, `${r.name} (you)`) : r.name}
                    </Text>
                  </View>
                  <Text className="font-heavy text-body" style={{ width: W.star, textAlign: 'right', color: '#6A4BD9' }}>
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
              <Text className="px-5 py-3 font-sans text-label text-muted">{L('Đăng nhập để lên bảng.', 'Sign in to join.')}</Text>
            ) : null}
            {me && inBoard < 0 && (mine.stars > 0 || mine.correct > 0) ? (
              <View className={`${rowClass} py-2.5`} style={{ backgroundColor: '#F3F0FB' }}>
                <Text className="text-center font-heavy text-body text-muted" style={{ width: W.rank }}>—</Text>
                <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                  {L('Bạn', 'You')}
                </Text>
                <Text className="font-heavy text-body" style={{ width: W.star, textAlign: 'right', color: '#6A4BD9' }}>
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
    </NeonWindow>
  );
}

function Stat({ icon, value, label }: { icon: string; value: number; label: string }) {
  const { locale } = useL();
  return (
    <View accessibilityLabel={`${value} ${label}`} className="flex-row items-center gap-1 rounded-pill px-2.5 py-1" style={{ backgroundColor: '#FFFFFF' }}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text className="font-heavy" style={{ fontSize: 15, color: GOLD_INK }}>
        {value.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')}
      </Text>
    </View>
  );
}

/** "2026-08" → "tháng 8/2026". */
function monthLabel(key: string, en = false): string {
  const [y, m] = key.split('-');
  return en ? `${Number(m)}/${y}` : `tháng ${Number(m)}/${y}`;
}

const PRIZE_LABEL_EN: Record<string, string> = { 'Hạng nhất': '1st place', 'Hạng nhì': '2nd place', 'Hạng ba': '3rd place', 'Top 10': 'Top 10' };

/**
 * Giải thưởng tháng: bậc thưởng, hạng hiện tại của bạn, và — nếu tháng trước
 * bạn trong top 10 — nút nhận sao (mỗi tháng một lần).
 */
function PrizeCard({ data, me, today }: { data: BoardData | null; me: string | null; today: Date }) {
  const { L, en } = useL();
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
      useGameFx.getState().push({ kind: 'stars', amount: prize, reason: pick(currentLocale(), 'thưởng hạng tháng', 'monthly rank reward') });
    }
  };

  return (
    <NeonWindow title={L('Giải tháng', 'Prizes')} icon="gift" badge={L(`${daysUntilReset(today)} ngày`, `${daysUntilReset(today)}d`)} style={{ marginTop: 24 }}>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {MONTH_PRIZES.map((p, i) => (
          <View key={p.label} className="flex-row items-center gap-2 rounded-panel px-3 py-2" style={{ flexGrow: 1, flexShrink: 1, flexBasis: 150, backgroundColor: i === 0 ? '#F3F0FB' : '#F3F0FB' }}>
            <NeonIcon name={MEDAL_ICON[i] ?? 'star5'} height={30} />
            <View className="min-w-0 flex-1">
              <Text className="font-strong text-label text-ink">{en ? (PRIZE_LABEL_EN[p.label] ?? p.label) : p.label}</Text>
              <Text className="font-heavy text-body text-ink">+{p.stars} ⭐</Text>
            </View>
          </View>
        ))}
      </View>

      {me && rankNow > 0 ? (
        <Text className="mt-3 font-heavy text-body text-ink">
          {L(`Hạng ${rankNow}`, `#${rankNow}`)}
          {prizeForRank(rankNow) > 0 ? ` · +${prizeForRank(rankNow)} ⭐` : ''}
        </Text>
      ) : !me ? (
        <Text className="mt-3 font-sans text-body text-muted">{L('Đăng nhập để nhận thưởng.', 'Sign in to win prizes.')}</Text>
      ) : null}

      {prev && prev.board.length > 0 ? (
        <View className="mt-4 rounded-panel bg-surfaceAlt p-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-strong text-label text-muted">{L(`Vinh danh ${monthLabel(prev.month)}`, `Hall of fame ${monthLabel(prev.month, true)}`)}</Text>
            <View aria-hidden>
              <Label text="Top 3 🏆" color="#F2B632" ink="#2B2350" tilt={-4} size={13} />
            </View>
          </View>
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
                {L(`✓ Đã nhận ${already || claimedNow} ⭐`, `✓ Claimed ${already || claimedNow} ⭐`)}
              </Text>
            ) : (
              <View className="mt-3 flex-row flex-wrap items-center gap-3">
                <Text className="min-w-0 flex-1 font-semi text-body text-ink">
                  {L(`Hạng ${prevRank} · +${prize} ⭐`, `#${prevRank} · +${prize} ⭐`)}
                </Text>
                <Button label={L(`Nhận ${prize} ⭐`, `Claim ${prize} ⭐`)} size="sm" iconLeft="gift" onPress={claim} />
              </View>
            )
          ) : null}
        </View>
      ) : null}
    </NeonWindow>
  );
}

/** Lưới ô vuông 12 tuần gần nhất, đậm dần theo số phút học. */
function Heatmap({ daily, frozen, today }: { daily: Record<string, { minutes: number; questions: number }>; frozen: string[]; today: Date }) {
  const { L } = useL();
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
    if (isFrozen) return '#9FE8F0';
    if (minutes <= 0) return '#EEEAFB';
    if (minutes < 15) return '#D3C8FF';
    if (minutes < 30) return '#A794FF';
    if (minutes < 60) return '#6A4BE8';
    return '#2A22B5';
  };

  return (
    <View className="mt-4">
      <View className="flex-row gap-1">
        {columns.map((col, i) => (
          <View key={i} className="gap-1">
            {col.map((cell) => (
              <View key={cell.key} style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: shade(cell.minutes, cell.frozen) }} />
            ))}
          </View>
        ))}
      </View>
      <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
        <Text className="font-sans text-label text-subtle">{L('Ít', 'Less')}</Text>
        {['#EEEAFB', '#D3C8FF', '#A794FF', '#6A4BE8', '#2A22B5'].map((c) => (
          <View key={c} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
        ))}
        <Text className="font-sans text-label text-subtle">{L('Nhiều', 'More')}</Text>
        <View className="ml-2 flex-row items-center gap-1">
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#9FE8F0' }} />
          <Text className="font-sans text-label text-subtle">{L('thẻ giữ chuỗi', 'freeze')}</Text>
        </View>
      </View>
    </View>
  );
}

const PODIUM_RING = ['#F59E0B', '#94A3B8', '#6A4BD9'];

function Board({ data, error, me, you }: { data: BoardData | null; error: string | null; me: string | null; you: { name: string; points: number } }) {
  const narrow = useWindowDimensions().width < 640;
  const { L } = useL();

  if (error) {
    return (
      <Card className="mt-3">
        <Text className="font-sans text-body text-muted">{error === 'offline' ? L('Chưa nối được máy chủ.', "Couldn't reach the server.") : error}</Text>
        <Text className="mt-2 font-sans text-label text-subtle">
          {L('Điểm tháng của bạn:', 'Your points:')} <Text className="font-heavy text-ink">{you.points}</Text>
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
        <View className="flex-row items-center gap-3">
          <View aria-hidden>
            <Motion kind="float">
              <Sticker tilt={-8}>
                <CuteRocket size={52} />
              </Sticker>
            </Motion>
          </View>
          <Text className="min-w-0 flex-1 font-sans text-body text-muted">{L('Chưa ai có điểm. Học một buổi là đứng đầu.', 'No points yet. One session puts you on top.')}</Text>
        </View>
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
              {/* Hiệu ứng hồ sơ (kiểu Discord) của người trên bục phủ cả thẻ. */}
              <ProfileEffect effect={findItem(row.effect)?.effect ?? null} intensity={0.7} />
              <ProfileCover cover={findItem(row.cover)?.cover ?? null} height={first ? 64 : 52} />
              {first ? (
                <View aria-hidden style={{ position: 'absolute', top: 8, left: 8, zIndex: 3, pointerEvents: 'none' }}>
                  <Motion kind="pop">
                    <Label text="Top 1 👑" color="#F2B632" ink="#2B2350" tilt={-6} size={narrow ? 9 : 11} />
                  </Motion>
                </View>
              ) : null}
              <View style={{ alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, marginTop: first ? -34 : -28 }}>
                <View style={{ borderRadius: 999, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' }}>
                  <AvatarBadge avatarId={row.avatar ?? null} name={row.name} size={narrow ? (first ? 52 : 44) : first ? 64 : 52} skin={skinOf(row.skin ?? null)} />
                </View>
                <View style={{ marginTop: 4 }}>
                  <NeonIcon name={MEDAL_ICON[rank] ?? 'star5'} height={first ? 30 : 24} />
                </View>
                <Text className="text-center font-strong text-body text-ink" numberOfLines={1}>
                  {mine ? L('Bạn', 'You') : row.name}
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
              <View key={row.id} className="flex-row items-center gap-3 border-b border-border px-5 py-3" style={mine ? { backgroundColor: '#F3F0FB' } : undefined}>
                <Text className="w-8 text-center font-heavy text-body text-muted">{i + 4}</Text>
                <AvatarBadge avatarId={row.avatar ?? null} name={row.name} size={36} skin={skinOf(row.skin ?? null)} />
                <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                  {mine ? L(`${row.name} (bạn)`, `${row.name} (you)`) : row.name}
                </Text>
                {i + 4 <= 10 ? <Badge label="Top 10" tone="warning" shape="tag" /> : null}
                {row.streak > 0 ? <Text className="font-sans text-label text-muted">🔥 {row.streak}</Text> : null}
                <Text className="font-heavy text-body text-ink">{row.points}</Text>
              </View>
            );
          })}
          {!inBoard && me ? (
            <View className="flex-row items-center gap-3 px-5 py-3" style={{ backgroundColor: '#F3F0FB' }}>
              <Text className="w-8 text-center font-heavy text-body text-muted">—</Text>
              <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                {L('Bạn', 'You')}
              </Text>
              <Text className="font-heavy text-body text-ink">{you.points}</Text>
            </View>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}
