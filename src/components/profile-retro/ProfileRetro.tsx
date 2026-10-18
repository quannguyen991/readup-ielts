/**
 * HỒ SƠ RETRO — bản mẫu theo phong cách ảnh tham chiếu: khối tối có cầu vồng viền
 * mực và chữ sọc 70s, phần kem có ống nước, bình thuỷ tinh, máy chứa và bánh răng.
 *
 * Chỉ đổi lớp hình thức: mọi số liệu lấy từ cùng nguồn với màn Hồ sơ thật, và
 * mục tiêu band theo đúng luật ở services/progress/goal.ts (không mặc định 7).
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { HeroSprite } from '@/components/game/HeroSprite';
import { PixelSprite } from '@/components/game/PixelSprite';
import { AvatarBadge } from '@/components/profile/AnimatedAvatar';
import { ProfileCover } from '@/components/profile/ProfileCover';
import { Appear } from '@/components/motion/Motion';
import { Motion } from '@/components/illust/CuteMore';
import { SealIcon } from '@/components/illust/HeroArt';
import { Boxed } from './retro-parts';
import { EchoWord } from './retro-type';
import type { IconName } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { latestBand } from '@/lib/band';
import { MASCOTS } from '@/services/game/mascots';
import { ACHIEVEMENTS, levelProgress, titleForLevel } from '@/services/game/rules';
import { currentStreak, monthPoints } from '@/services/gamification/points';
import { achievementTitle, itemName, levelTitle, mascotName } from '@/services/gamification/labels-en';
import { findItem, formatStars } from '@/services/gamification/shop';
import { goalProgress, type GoalProgress } from '@/services/progress/goal';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { useGameStore } from '@/store/useGameStore';
import { mascotOf, skinOf, useRewardStore } from '@/store/useRewardStore';
import { useRoadmapStore } from '@/store/useRoadmapStore';
import { useStarLedger } from '@/store/useStarBalance';
import { useStudyStore } from '@/store/useStudyStore';

import {
  ECHO_CREAM,
  ECHO_GOLD,
  Drip,
  FanGauge,
  Flask,
  Flower,
  Gauge,
  Gear,
  Machine,
  Moon,
  PipeRun,
  Rainbow,
  RCHAR,
  RCREAM,
  RFONT,
  RGOLD,
  RINK,
  RLEAF,
  RORANGE,
  RPAPER,
  RPINK,
  RSKY,
  Sparkle,
  StarMascot,
  StripeCloud,
  WaveEdge,
} from './retro-art';

type L = ReturnType<typeof useL>['L'];

/** Cầu vồng lớn chạy xuyên khối tối, theo tỉ lệ màn rộng và màn hẹp. */
const RAIN_WIDE = 'M1080 -60 C 900 80, 760 -10, 700 150 S 560 420, 380 300 S 120 80, -80 430';
const RAIN_NARROW = 'M430 -30 C 300 60, 330 260, 200 230 S 40 90, -40 230';

/** Chữ kem trên khối tối có bóng mực mờ, để đọc được khi cầu vồng chạy ngang sau chữ. */
const TEXT_ON_DARK = {
  textShadowColor: RINK,
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 6,
} as const;

/** Vị trí chớp rải trên khối tối (tỉ lệ phần trăm). */
const SPARKLES = [
  { l: '8%', t: '40%', s: 26 },
  { l: '46%', t: '12%', s: 22 },
  { l: '90%', t: '52%', s: 30 },
  { l: '34%', t: '74%', s: 20 },
  { l: '62%', t: '30%', s: 18 },
] as const;

export function ProfileRetro() {
  const { L, locale } = useL();
  const wide = useWindowDimensions().width >= 760;
  const name = useDisplayName();
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  const profileTarget = useAuthStore((s) => s.profile?.targetBand ?? null);
  const roadmapIelts = useRoadmapStore((s) => s.input?.ielts ?? null);
  const reward = useRewardStore();
  const daily = useStudyStore((s) => s.daily);
  const sessions = useStudyStore((s) => s.sessions);
  const xp = useGameStore((s) => s.xp);
  const life = useGameStore((s) => s.life);
  const achievements = useGameStore((s) => s.achievements);
  const ledger = useStarLedger();

  const today = useMemo(() => new Date(), []);
  const lv = levelProgress(xp);
  const streak = currentStreak(daily, today, reward.frozenDays);
  const month = monthPoints(daily, today, reward.frozenDays);
  const skin = skinOf(reward.skin);
  const petId = mascotOf(reward.mascot);
  const pet = petId ? MASCOTS[petId] : null;
  const coverLook = findItem(reward.cover)?.cover ?? null;
  const opened = ACHIEVEMENTS.filter((a) => achievements[a.id]).length;
  const stars = formatStars(ledger.balance);

  // Cùng luật với màn Tiến độ: mục tiêu từ Lộ trình rồi tới hồ sơ; không đặt thì không bịa.
  const firstBand = useMemo(
    () =>
      [...sessions]
        .filter((s) => s.estimatedBand != null)
        .sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))[0]?.estimatedBand ?? null,
    [sessions],
  );
  const goal = goalProgress({
    roadmapTarget: roadmapIelts?.target,
    profileTarget,
    roadmapNow: roadmapIelts?.now,
    firstBand,
    current: latestBand(sessions.map((s) => s.estimatedBand)),
  });

  const avatarItem = findItem(reward.avatar);
  const skinItem = findItem(reward.skin);
  const coverItem = findItem(reward.cover);

  const stats: { key: string; icon: IconName; tone: string; value: string; label: string }[] = [
    { key: 'stars', icon: 'star', tone: RPINK, value: stars, label: L('sao đang có', 'stars') },
    { key: 'streak', icon: 'flame', tone: RSKY, value: String(streak), label: L('ngày liên tiếp', 'day streak') },
    { key: 'month', icon: 'calendar', tone: RLEAF, value: String(month), label: L('điểm tháng này', 'points this month') },
    { key: 'correct', icon: 'check', tone: RPAPER, value: life.correct.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN'), label: L('câu đúng', 'correct answers') },
  ];

  const targetText = goal.state === 'no-goal' ? '?' : goal.target.toFixed(1);

  // Cầu vồng cần kích thước pixel cụ thể: đo khối tối rồi truyền số vào SVG.
  const [heroBox, setHeroBox] = useState<{ w: number; h: number } | null>(null);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: RCREAM }}
      contentContainerStyle={{ backgroundColor: RCREAM, paddingBottom: 56 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Khối tối: cầu vồng, chữ sọc, nhân vật */}
      <Appear>
        <View
          onLayout={(e) => setHeroBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
          style={{
            backgroundColor: RCHAR,
            borderRadius: wide ? 32 : 24,
            overflow: 'hidden',
            margin: wide ? 24 : 12,
            minHeight: wide ? 700 : 660,
            borderWidth: 3,
            borderColor: RINK,
          }}
        >
          {heroBox ? (
            <View pointerEvents="none" aria-hidden style={{ position: 'absolute', top: 0, left: 0 }}>
              {wide ? (
                <Rainbow d={RAIN_WIDE} viewBox="0 0 1000 440" width={heroBox.w} height={heroBox.h} scale={0.46} preserve="xMidYMid meet" />
              ) : (
                <Rainbow d={RAIN_NARROW} viewBox="0 0 400 440" width={heroBox.w} height={heroBox.h} scale={0.42} preserve="xMidYMid meet" />
              )}
            </View>
          ) : null}

          {SPARKLES.filter((_, i) => wide || i < 2).map((p, i) => (
            <View key={i} pointerEvents="none" aria-hidden style={{ position: 'absolute', left: p.l, top: p.t }}>
              <Sparkle size={p.s} color={i % 2 ? RGOLD : RCREAM} />
            </View>
          ))}

          <HeaderBar wide={wide} L={L} />

          {/* Nhân vật và hoa: góc phải */}
          {wide ? (
            <>
              <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: 56, top: 150 }}>
                <Moon size={100} />
              </View>
              <View pointerEvents="none" aria-hidden style={{ position: 'absolute', right: 56, bottom: 92 }}>
                <Flower size={160} />
              </View>
              <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: 360, bottom: 40 }}>
                <StripeCloud width={150} id="hero" />
              </View>
            </>
          ) : null}
          <View style={wide ? { position: 'absolute', right: 40, bottom: 262 } : { position: 'absolute', right: 0, top: 200 }}>
            <Motion kind="float">
              <StarMascot size={wide ? 190 : 100} />
            </Motion>
          </View>

          {/* Nội dung giữa: cấp, chữ band, mục tiêu, tên */}
          <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: wide ? 24 : 6, paddingBottom: wide ? 250 : 90, gap: 8 }}>
            <Text style={{ fontFamily: RFONT.semi, fontSize: 17, color: RCREAM, textAlign: 'center' }}>
              {L(`Cấp ${lv.level}: ${levelTitle(titleForLevel(lv.level), locale)}`, `Level ${lv.level}: ${levelTitle(titleForLevel(lv.level), locale)}`)}
            </Text>
            <EchoWord text="Band" size={wide ? 150 : 84} color={RCREAM} stripes={ECHO_CREAM} />
            <EchoWord text={targetText} size={wide ? 230 : 150} color={RGOLD} stripes={ECHO_GOLD} />
            <GoalLine goal={goal} wide={wide} L={L} />
            <NameChip name={name} avatarId={reward.avatar} skin={skin} />
            {!wide ? (
              <>
                <CopyBlock wide={false} signedIn={signedIn} stars={stars} L={L} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  <Pill solid label={L('Đổi quà', 'Rewards')} onPress={() => router.push('/shop' as never)} />
                  <Pill onDark label={L('Nhân vật', 'Hero')} onPress={() => router.push('/quest/hero' as never)} />
                </View>
              </>
            ) : null}
          </View>

          {wide ? (
            <View style={{ position: 'absolute', left: 40, bottom: 92, width: 250, gap: 16 }}>
              <CopyBlock wide signedIn={signedIn} stars={stars} L={L} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <Pill solid label={L('Đổi quà', 'Rewards')} onPress={() => router.push('/shop' as never)} />
                <Pill onDark label={L('Nhân vật', 'Hero')} onPress={() => router.push('/quest/hero' as never)} />
              </View>
            </View>
          ) : null}

          {/* Mép sóng nối xuống nửa kem */}
          <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: -1 }}>
            <WaveEdge height={wide ? 80 : 60} />
          </View>
        </View>
      </Appear>

      {/* Ống nước nối khối tối với nửa kem, có đồng hồ áp suất */}
      <View style={{ marginTop: -22, height: 44 }}>
        <PipeRun height={44} />
        {wide ? (
          <View style={{ position: 'absolute', right: 140, top: -12 }}>
            <Gauge size={64} />
          </View>
        ) : null}
      </View>

      <View style={{ position: 'relative', paddingHorizontal: wide ? 56 : 18, marginTop: 28 }}>
        {wide ? (
          <>
            <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: -10, top: 120, opacity: 0.16 }}>
              <Gear size={240} />
            </View>
            <View pointerEvents="none" aria-hidden style={{ position: 'absolute', right: -10, top: 980, opacity: 0.12 }}>
              <Gear size={280} />
            </View>
          </>
        ) : null}

        {/* Số liệu: khối nhiều màu, viền mực */}
        <Appear index={1}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: wide ? 16 : 22, justifyContent: 'center' }}>
            {stats.map((s) => (
              <StatBox key={s.key} icon={s.icon} tone={s.tone} value={s.value} label={s.label} wide={wide} />
            ))}
          </View>
        </Appear>

        {/* Đang dùng: mỗi món là một bình thuỷ tinh có nhãn, như các bình ở chân trang trong ảnh */}
        <Appear index={2}>
          <View style={{ marginTop: 72 }}>
            <SectionHead wide={wide} title={L('Đang dùng', 'Equipped')} sub={L('Mỗi bình là một món đang dùng. Bấm Đổi để thay.', 'Each flask is an item in use. Tap Change to swap.')} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: wide ? 20 : 18, rowGap: 36 }}>
              <Bottle
                id="avatar"
                color={RSKY}
                wide={wide}
                title={L('Avatar', 'Avatar')}
                name={avatarItem ? itemName(avatarItem, locale) : L('Chữ cái đầu tên', 'Your initial')}
                changeLabel={L('Đổi', 'Change')}
                onChange={() => router.push('/shop?tab=avatarAnim' as never)}
              >
                <AvatarBadge avatarId={reward.avatar} name={name} size={30} skin={skin} />
              </Bottle>
              <Bottle
                id="cover"
                color={RPINK}
                wide={wide}
                title={L('Bìa hồ sơ', 'Profile cover')}
                name={coverItem ? itemName(coverItem, locale) : L('Bìa mặc định', 'Default cover')}
                changeLabel={L('Đổi', 'Change')}
                onChange={() => router.push('/shop?tab=cover' as never)}
              >
                <View style={{ width: 40, height: 30, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: RINK }}>
                  <ProfileCover cover={coverLook} height={30} />
                </View>
              </Bottle>
              <Bottle
                id="skin"
                color={RGOLD}
                wide={wide}
                title={L('Skin nhân vật', 'Hero skin')}
                name={skinItem ? itemName(skinItem, locale) : L('Hiệp sĩ xanh', 'Blue Knight')}
                changeLabel={L('Đổi', 'Change')}
                onChange={() => router.push('/shop?tab=skin' as never)}
              >
                <HeroSprite size={30} skin={skin} />
              </Bottle>
              <Bottle
                id="mascot"
                color={RLEAF}
                wide={wide}
                title={L('Linh vật', 'Mascot')}
                name={pet ? mascotName(pet, locale) : L('Chưa có bạn đồng hành', 'No companion yet')}
                changeLabel={L('Đổi', 'Change')}
                onChange={() => router.push('/shop?tab=mascot' as never)}
              >
                {pet ? <PixelSprite name={pet.look} color={pet.color} size={30} /> : <Text style={{ fontSize: 24, opacity: 0.45 }}>🐾</Text>}
              </Bottle>
            </View>
          </View>
        </Appear>

        {/* Huy hiệu: dấu tròn có viền, mở thì màu và nghiêng */}
        <Appear index={3}>
          <View style={{ marginTop: 72 }}>
            <SectionHead wide={wide} title={L('Huy hiệu', 'Badges')} sub={L(`${opened}/${ACHIEVEMENTS.length} đã mở`, `${opened}/${ACHIEVEMENTS.length} unlocked`)} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18, justifyContent: 'center', alignSelf: 'center', maxWidth: 540 }}>
              {ACHIEVEMENTS.map((a, i) => {
                const at = !!achievements[a.id];
                const fills = [RPINK, RSKY, RGOLD, RORANGE];
                const label = `${achievementTitle(a, locale)} — ${at ? L('đã mở', 'unlocked') : L('chưa mở', 'locked')}`;
                if (!at) {
                  return (
                    <View
                      key={a.id}
                      accessibilityLabel={label}
                      style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderStyle: 'dashed', borderColor: RINK, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 30, opacity: 0.3 }}>{a.glyph}</Text>
                    </View>
                  );
                }
                return (
                  <View key={a.id} accessibilityLabel={label} style={{ transform: [{ rotate: `${((i % 3) - 1) * 6}deg` }] }}>
                    <Boxed fill={fills[i % fills.length]!} radius={36} shadowSize={5}>
                      <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 30 }}>{a.glyph}</Text>
                      </View>
                    </Boxed>
                  </View>
                );
              })}
            </View>
            <View style={{ alignItems: 'center', marginTop: 28 }}>
              <Pill solid label={L('Xem tất cả', 'See all')} onPress={() => router.push('/quest/hero' as never)} />
            </View>
          </View>
        </Appear>

        {/* Sổ sao: phiếu có viền bên cạnh máy chứa, không có nút cộng sao */}
        <Appear index={4}>
          <View style={{ marginTop: 72 }}>
            <SectionHead wide={wide} title={L('Sổ sao', 'Star ledger')} sub={L('Số dư tính lại từ nhật ký học, không có nút cộng sao.', 'Balance is recalculated from your study log. No button adds stars.')} />
            <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: wide ? 28 : 26 }}>
              <Boxed fill={RPAPER} radius={22} style={{ width: wide ? 400 : '100%', maxWidth: 480 }}>
                <View style={{ padding: 22, gap: 12 }}>
                  <ReceiptRow label={L('Từ việc học', 'From studying')} value={`+${formatStars(ledger.study)}`} />
                  <ReceiptRow label={L('Thưởng trận đấu', 'Battle rewards')} value={`+${formatStars(ledger.battle)}`} />
                  <ReceiptRow label={L('Thưởng hạng tháng', 'Monthly rank rewards')} value={`+${formatStars(ledger.prizes)}`} />
                  <ReceiptRow label={L('Thưởng chuỗi ngày', 'Streak rewards')} value={`+${formatStars(ledger.streak)}`} />
                  <ReceiptRow label={L('Đã đổi quà', 'Spent on rewards')} value={`−${formatStars(ledger.spent)}`} />
                  <View style={{ marginTop: 4, paddingTop: 14, borderTopWidth: 3, borderTopColor: RINK, borderStyle: 'dashed' }}>
                    <ReceiptRow strong label={L('Còn lại', 'Balance')} value={`${stars} ⭐`} />
                  </View>
                </View>
              </Boxed>
              <View style={{ alignItems: 'center', gap: 14 }}>
                <Machine width={wide ? 150 : 128} />
                <FanGauge width={wide ? 130 : 120} />
              </View>
            </View>
          </View>
        </Appear>
      </View>

      {/* Ống sàn: chạy hết chiều rộng, giọt nước hồng rủ xuống */}
      <View style={{ marginTop: 64, height: 92 }}>
        <PipeRun height={44} />
        <View pointerEvents="none" aria-hidden style={{ position: 'absolute', left: wide ? '24%' : '16%', top: 36 }}>
          <Drip size={24} />
        </View>
        <View pointerEvents="none" aria-hidden style={{ position: 'absolute', right: wide ? '22%' : '14%', top: 36 }}>
          <Drip size={20} />
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------- Thành phần ---------- */

/** Thanh trên: đường dẫn đến các màn chính và tên bản mẫu ở giữa. */
function HeaderBar({ wide, L }: { wide: boolean; L: L }) {
  const link = (label: string, to: string) => (
    <Pressable key={to} accessibilityRole="link" accessibilityLabel={label} onPress={() => router.push(to as never)}>
      <Text style={{ fontFamily: RFONT.bold, fontSize: 15, color: RCREAM }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wide ? 36 : 16, paddingTop: wide ? 26 : 16, gap: 10 }}>
      <View style={{ flex: 1, flexDirection: 'row', gap: 24 }}>
        {wide ? [link(L('Nhân vật', 'Hero'), '/quest/hero'), link(L('Đổi quà', 'Rewards'), '/shop'), link(L('Xếp hạng', 'Leaderboard'), '/leaderboard')] : null}
      </View>
      <EchoWord text="Band 9" size={wide ? 34 : 24} color={RCREAM} stripes={ECHO_GOLD} />
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {wide ? <Pill small onDark label={L('Hồ sơ thường', 'Classic profile')} onPress={() => router.push('/profile' as never)} /> : null}
      </View>
    </View>
  );
}

/** Lời dẫn ngắn dưới chữ: nói về sao, và đăng nhập nếu chưa có. */
function CopyBlock({ wide, signedIn, stars, L }: { wide: boolean; signedIn: boolean; stars: string; L: L }) {
  const style = { ...TEXT_ON_DARK, fontFamily: RFONT.bold, fontSize: 16, lineHeight: 24, color: RCREAM, textAlign: wide ? ('left' as const) : ('center' as const) };
  return (
    <Text style={style}>
      {signedIn
        ? L(`Bạn đang có ${stars} sao. Sao đến từ việc học và thưởng trận đấu.`, `You have ${stars} stars. They come from studying and battles.`)
        : L('Đăng nhập để giữ đồ và lên bảng xếp hạng. Sao đến từ việc học và thưởng trận đấu.', 'Sign in to keep your items and join the leaderboard. Stars come from studying and battles.')}
    </Text>
  );
}

/** Tên người học trong viên thuốc kem, có avatar. */
function NameChip({ name, avatarId, skin }: { name: string; avatarId: string | null; skin: ReturnType<typeof skinOf> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 6, paddingRight: 18, paddingVertical: 6, borderRadius: 999, backgroundColor: RCREAM, borderWidth: 3, borderColor: RINK }}>
      <AvatarBadge avatarId={avatarId} name={name} size={40} skin={skin} />
      <Text numberOfLines={1} style={{ fontFamily: RFONT.heavy, fontSize: 18, color: RINK, maxWidth: 220 }}>
        {name}
      </Text>
    </View>
  );
}


/** Dòng dưới số band: mục tiêu, thanh tiến độ, hoặc lời mời đặt mục tiêu. */
function GoalLine({ goal, wide, L }: { goal: GoalProgress; wide: boolean; L: L }) {
  const caption = {
    ...TEXT_ON_DARK,
    fontFamily: RFONT.bold,
    fontSize: 16,
    lineHeight: 22,
    color: RCREAM,
    textAlign: 'center' as const,
    backgroundColor: RCHAR,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden' as const,
    alignSelf: 'center' as const,
  };
  if (goal.state === 'no-goal') {
    return (
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Text style={caption}>{L('Đặt mục tiêu để xem tiến độ', 'Set a target to see your progress')}</Text>
        <Pill onDark label={L('Đặt mục tiêu', 'Set a target')} onPress={() => router.push('/lo-trinh-hoc' as never)} />
      </View>
    );
  }
  if (goal.state === 'no-score') {
    return <Text style={caption}>{L('Làm một bài chấm band để có điểm xuất phát', 'Finish one scored test to get a starting point')}</Text>;
  }
  const pct = goal.state === 'reached' ? 100 : goal.pct;
  return (
    <View style={{ width: wide ? 340 : 240, gap: 8 }}>
      <View style={{ height: 20, borderRadius: 999, borderWidth: 3, borderColor: RINK, backgroundColor: RCREAM, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: RPINK }} />
      </View>
      <Text style={caption}>
        {goal.state === 'reached'
          ? L('Đã đạt mục tiêu', 'Target reached')
          : L(`Hiện ${goal.current.toFixed(1)}, còn ${goal.left.toFixed(1)}`, `Now ${goal.current.toFixed(1)}, ${goal.left.toFixed(1)} to go`)}
      </Text>
    </View>
  );
}

/**
 * Nút viên thuốc. `solid` là nút kem đổ bóng mực (trên nền tối) hoặc nút chính trên
 * nền kem. `onDark` là nút viền kem trên nền tối; không có `onDark` là nút viền mực trên nền kem.
 */
function Pill({ label, onPress, solid, onDark, small }: { label: string; onPress: () => void; solid?: boolean; onDark?: boolean; small?: boolean }) {
  const fg = solid || !onDark ? RINK : RCREAM;
  const border = onDark && !solid ? RCREAM : RINK;
  const bg = solid ? RCREAM : onDark ? RCHAR : RPAPER;
  const offset = small ? 4 : 5;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {solid ? <View aria-hidden pointerEvents="none" style={{ position: 'absolute', top: offset, left: offset, right: -offset, bottom: -offset, borderRadius: 999, backgroundColor: RINK }} /> : null}
      <View
        style={{
          minHeight: small ? 38 : 50,
          paddingHorizontal: small ? 16 : 26,
          borderRadius: 999,
          borderWidth: 3,
          borderColor: border,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: RFONT.heavy, fontSize: small ? 14 : 17, color: fg }}>{label}</Text>
      </View>
    </Pressable>
  );
}

/** Tiêu đề lớn kiểu "Speakers & Workshops": đậm, căn giữa, có dòng phụ. */
function SectionHead({ title, sub, wide }: { title: string; sub?: string; wide: boolean }) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 28, gap: 10 }}>
      <Text style={{ fontFamily: RFONT.heavy, fontSize: wide ? 72 : 46, lineHeight: wide ? 78 : 52, color: RINK, textAlign: 'center' }}>{title}</Text>
      {sub ? <Text style={{ fontFamily: RFONT.bold, fontSize: 16, lineHeight: 22, color: RINK, textAlign: 'center', maxWidth: 560 }}>{sub}</Text> : null}
    </View>
  );
}

/** Khối số liệu: icon trên, số và nhãn dưới, để bốn khối xếp vừa một hàng trên màn rộng. */
function StatBox({ icon, tone, value, label, wide }: { icon: IconName; tone: string; value: string; label: string; wide: boolean }) {
  const iconSize = wide ? 48 : 44;
  return (
    <Boxed fill={tone} radius={24} style={{ flexGrow: 1, flexBasis: wide ? 136 : 150, maxWidth: wide ? 240 : undefined }}>
      <View style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: 14 }}>
        <View aria-hidden style={{ width: iconSize, height: iconSize, borderRadius: iconSize / 2, borderWidth: 3, borderColor: RINK, backgroundColor: RPAPER, alignItems: 'center', justifyContent: 'center' }}>
          <SealIcon name={icon} color={RINK} size={wide ? 28 : 24} />
        </View>
        <View style={{ alignSelf: 'stretch', minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: RFONT.heavy, fontSize: wide ? 28 : 24, lineHeight: wide ? 32 : 28, color: RINK }}>
            {value}
          </Text>
          <Text numberOfLines={2} style={{ fontFamily: RFONT.semi, fontSize: 15, lineHeight: 20, color: RINK }}>
            {label}
          </Text>
        </View>
      </View>
    </Boxed>
  );
}

/**
 * Một bình thuỷ tinh có nhãn: tên ô trên nhãn treo nghiêng, món đang dùng và nút Đổi
 * dưới bình. `children` là ảnh nhỏ của món.
 */
function Bottle({
  id,
  color,
  wide,
  title,
  name,
  changeLabel,
  onChange,
  children,
}: {
  id: string;
  color: string;
  wide: boolean;
  title: string;
  name: string;
  changeLabel: string;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={{ width: wide ? 136 : 132, alignItems: 'center', gap: 6 }}>
      <View style={{ width: 130, height: 210 }}>
        <Flask id={id} color={color} width={130} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 120, alignItems: 'center' }}>
          <View style={{ transform: [{ rotate: '-5deg' }], backgroundColor: RPAPER, borderWidth: 3, borderColor: RINK, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontFamily: RFONT.heavy, fontSize: 13, color: RINK }}>{title}</Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: wide ? 136 : 132 }}>
        {children}
        <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: RFONT.heavy, fontSize: 15, color: RINK }}>
          {name}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${changeLabel}: ${title}`} onPress={onChange}>
        <View style={{ minHeight: 34, paddingHorizontal: 16, borderRadius: 999, borderWidth: 3, borderColor: RINK, backgroundColor: RPAPER, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: RFONT.heavy, fontSize: 14, color: RINK }}>{changeLabel}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function ReceiptRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ flex: 1, minWidth: 0, fontFamily: strong ? RFONT.heavy : RFONT.semi, fontSize: strong ? 18 : 15, color: RINK }}>{label}</Text>
      <Text style={{ fontFamily: RFONT.heavy, fontSize: strong ? 20 : 16, color: RINK }}>{value}</Text>
    </View>
  );
}
