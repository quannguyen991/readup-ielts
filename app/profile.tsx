import React, { useMemo } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { anim, MOVE } from '@/components/game/game-anim';
import { PixelSprite } from '@/components/game/PixelSprite';
import { HeroSprite } from '@/components/game/HeroSprite';
import { AnimatedAvatar, AvatarBadge } from '@/components/profile/AnimatedAvatar';
import { ProfileCover } from '@/components/profile/ProfileCover';
import { ProfileEffect } from '@/components/profile/ProfileEffect';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import { SpacedRepetitionWidget } from '@/components/vocab/SpacedRepetitionWidget';
import { MASCOTS, STAR_BONUS } from '@/services/game/mascots';
import { ACHIEVEMENTS, levelProgress, titleForLevel } from '@/services/game/rules';
import { currentStreak, monthPoints, tierFor } from '@/services/gamification/points';
import { SHOP_ITEMS, findItem, formatStars, type ShopItem } from '@/services/gamification/shop';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { useGameStore } from '@/store/useGameStore';
import { mascotOf, skinOf, useRewardStore, type WearSlot } from '@/store/useRewardStore';
import { useStarLedger } from '@/store/useStarBalance';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge as SealBadge } from '@/components/illust/Cute';
import { CuteStar, Motion } from '@/components/illust/CuteMore';
import type { IconName } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { achievementTitle, itemDetail, itemName, levelTitle, mascotName, mascotPerk, tierName } from '@/services/gamification/labels-en';

/**
 * HỒ SƠ CỦA TÔI — nơi những thứ đổi bằng sao được mặc lên: bìa chuyển động,
 * avatar động, skin nhân vật, linh vật. Kèm cấp, bậc tháng, sổ sao (sao từ đâu
 * ra, đã tiêu bao nhiêu) và huy hiệu.
 *
 * ĐỔI ĐỒ NGAY TẠI ĐÂY: tủ đồ liệt kê mọi món đã có, bấm là đeo / bỏ — không phải
 * quay lại trang Đổi quà chỉ để thay bìa.
 */

const SLOTS: { slot: WearSlot; title: string; titleEn: string; kinds: ShopItem['kind'][]; tab: string; empty: string; emptyEn: string }[] = [
  { slot: 'avatar', title: 'Avatar', titleEn: 'Avatar', kinds: ['avatarAnim', 'avatar'], tab: 'avatarAnim', empty: 'Chữ cái đầu tên', emptyEn: 'Your initial' },
  { slot: 'cover', title: 'Bìa hồ sơ', titleEn: 'Profile cover', kinds: ['cover'], tab: 'cover', empty: 'Bìa mặc định', emptyEn: 'Default cover' },
  { slot: 'effect', title: 'Hiệu ứng hồ sơ', titleEn: 'Profile effect', kinds: ['effect'], tab: 'effect', empty: 'Chưa có hiệu ứng', emptyEn: 'No effect yet' },
  { slot: 'skin', title: 'Skin nhân vật', titleEn: 'Hero skin', kinds: ['skin'], tab: 'skin', empty: 'Hiệp sĩ xanh', emptyEn: 'Blue Knight' },
  { slot: 'mascot', title: 'Linh vật', titleEn: 'Mascot', kinds: ['mascot'], tab: 'mascot', empty: 'Chưa có bạn đồng hành', emptyEn: 'No companion yet' },
];

export default function ProfileScreen() {
  const { L, locale } = useL();
  const wide = useWindowDimensions().width >= 760;
  const name = useDisplayName();
  const signedIn = useAuthStore((s) => s.status === 'signed_in');
  const reward = useRewardStore();
  const daily = useStudyStore((s) => s.daily);
  const xp = useGameStore((s) => s.xp);
  const life = useGameStore((s) => s.life);
  const achievements = useGameStore((s) => s.achievements);
  const ledger = useStarLedger();

  const today = useMemo(() => new Date(), []);
  const lv = levelProgress(xp);
  const streak = currentStreak(daily, today, reward.frozenDays);
  const month = monthPoints(daily, today, reward.frozenDays);
  const tier = tierFor(month);
  const skin = skinOf(reward.skin);
  const petId = mascotOf(reward.mascot);
  const pet = petId ? MASCOTS[petId] : null;
  const coverLook = findItem(reward.cover)?.cover ?? null;
  const effectLook = findItem(reward.effect)?.effect ?? null;
  const opened = ACHIEVEMENTS.filter((a) => achievements[a.id]);

  const wardrobe = SHOP_ITEMS.filter((i) => (reward.owned[i.id] ?? 0) > 0 && SLOTS.some((s) => s.kinds.includes(i.kind)));
  const slotOf = (item: ShopItem) => SLOTS.find((s) => s.kinds.includes(item.kind))!.slot;
  const worn = new Set([reward.avatar, reward.cover, reward.effect, reward.skin, reward.mascot].filter((x): x is string => !!x));

  const avatarSize = wide ? 112 : 88;

  return (
    <Screen>
      {/* Bìa + avatar đè lên mép bìa */}
      <Appear>
        <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
          {/* Hiệu ứng hồ sơ phủ cả thẻ (bìa + tên), như Profile Effects của Discord. */}
          <ProfileEffect effect={effectLook} />
          <ProfileCover cover={coverLook} height={wide ? 210 : 150}>
            {/* Cụm sticker trang trí ở góc dưới bìa (điện thoại: 1 hình nhỏ). */}
            <View aria-hidden style={{ pointerEvents: 'none', position: 'absolute', right: wide ? 28 : 12, bottom: wide ? 14 : 10 }}>
              <PageStickers scene="profile" size={80} />
            </View>
            <View style={{ position: 'absolute', right: 12, top: 12 }}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={L('Đổi bìa hồ sơ', 'Change profile cover')}
                onPress={() => router.push('/shop?tab=cover' as never)}
                style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(15,23,42,0.45)' }}
              >
                <Text className="font-semi" style={{ fontSize: 13, color: '#FFFFFF' }}>
                  {L('Đổi bìa', 'Change cover')}
                </Text>
              </Pressable>
            </View>
          </ProfileCover>
          <View style={{ paddingHorizontal: wide ? 24 : 16, paddingBottom: 18 }}>
            <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'flex-start', gap: wide ? 18 : 10 }}>
              <View style={{ marginTop: -avatarSize / 2, borderRadius: 999, borderWidth: 4, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' }}>
                <AvatarBadge avatarId={reward.avatar} name={name} size={avatarSize} skin={skin} />
              </View>
              <View style={{ flex: wide ? 1 : undefined, minWidth: 0, paddingTop: wide ? 12 : 0 }}>
                <Text className="font-heavy text-pageTitle text-ink" numberOfLines={1}>
                  {name}
                </Text>
                <View className="mt-1 flex-row flex-wrap items-center gap-2">
                  <Badge label={`Lv ${lv.level} · ${levelTitle(titleForLevel(lv.level), locale)}`} tone="primary" shape="tag" />
                  <Badge label={L(`Bậc tháng: ${tier.name} ${'★'.repeat(tier.stars)}`, `Monthly tier: ${tierName(tier, locale)} ${'★'.repeat(tier.stars)}`)} tone="warning" shape="tag" />
                  {pet ? <Badge label={L(`Đồng hành: ${pet.name}`, `Companion: ${mascotName(pet, locale)}`)} tone="success" shape="tag" /> : null}
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2" style={{ paddingTop: wide ? 14 : 0 }}>
                <Button label={L('Đổi quà', 'Rewards')} size="sm" iconLeft="gift" onPress={() => router.push('/shop' as never)} />
                <Button label={L('Nhân vật', 'Hero')} size="sm" variant="outline" iconLeft="shield" onPress={() => router.push('/quest/hero' as never)} />
                <Button label={L('Xếp hạng', 'Leaderboard')} size="sm" variant="outline" iconLeft="trophy" onPress={() => router.push('/leaderboard' as never)} />
              </View>
            </View>
            {!signedIn ? (
              <Text className="mt-3 font-sans text-label text-muted">
                {L('Đăng nhập để giữ đồ và lên bảng xếp hạng.', 'Sign in to keep your items and join the leaderboard.')}
              </Text>
            ) : null}
          </View>
        </View>
      </Appear>

      {/* Lặp lại ngắt quãng (FSRS / Spaced Repetition) */}
      <Appear index={1}>
        <View className="mt-4">
          <SpacedRepetitionWidget />
        </View>
      </Appear>

      {/* Số liệu nhanh */}
      <Appear index={2}>
        <View className="mt-4 flex-row flex-wrap gap-3">
          <Stat seal="star" tone="#F2B632" value={formatStars(ledger.balance)} label={L('sao đang có', 'stars')} />
          <Stat seal="flame" tone="#F0703F" value={String(streak)} label={L('ngày liên tiếp', 'day streak')} />
          <Stat seal="calendar" tone="#A8843F" value={String(month)} label={L('điểm tháng này', 'points this month')} />
          <Stat seal="check" tone="#22A06B" value={life.correct.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} label={L('câu đúng', 'correct answers')} />
        </View>
      </Appear>

      {/* Đang đeo */}
      <Appear index={2}>
        <SectionHeader className="mt-6" title={L('Đang dùng', 'Equipped')} subtitle={L('Bấm Đổi để chọn món khác ở trang Đổi quà.', 'Tap Change to pick something else in Rewards.')} icon="sparkle" />
        <View className="mt-3 flex-row flex-wrap gap-3">
          {SLOTS.map((s) => {
            const item = findItem(reward[s.slot]);
            return (
              <Card key={s.slot} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 220 }}>
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
                    {L(s.title, s.titleEn)}
                  </Text>
                  {item ? (
                    <View aria-hidden>
                      <SealBadge icon="check" color="#22A06B" size={22} />
                    </View>
                  ) : null}
                </View>
                <View className="mt-2 flex-row items-center gap-3">
                  <SlotPreview slot={s.slot} item={item} name={name} skin={skin} />
                  <View className="min-w-0 flex-1">
                    <Text className="font-strong text-body text-ink" numberOfLines={1}>
                      {item ? itemName(item, locale) : L(s.empty, s.emptyEn)}
                    </Text>
                    <Text className="font-sans text-label text-muted" numberOfLines={3}>
                      {s.slot === 'mascot' ? (pet ? mascotPerk(pet, locale) : L('Linh vật giúp câu hỏi: bỏ bớt đáp án sai, đỡ câu sai, hồi tim.', 'Mascots help with questions: remove wrong options, block a miss, restore hearts.')) : item ? itemDetail(item, locale) : L('Chưa đeo gì ở ô này.', 'Nothing equipped here yet.')}
                    </Text>
                  </View>
                </View>
                <View className="mt-3 flex-row">
                  <Button label={L('Đổi', 'Change')} size="sm" variant="outline" onPress={() => router.push(`/shop?tab=${s.tab}` as never)} />
                </View>
              </Card>
            );
          })}
        </View>
      </Appear>

      {/* Tủ đồ */}
      <Appear index={3}>
        <SectionHeader className="mt-6" title={L('Tủ đồ', 'Wardrobe')} subtitle={wardrobe.length ? L('Mọi món bạn đã đổi. Bấm để đeo hoặc bỏ.', "Everything you've collected. Tap to put on or take off.") : undefined} icon="gift" />
        {wardrobe.length === 0 ? (
          <Card className="mt-3">
            <View aria-hidden className="mb-2 flex-row items-end gap-2">
              <Motion kind="float">
                <Sticker tilt={-8}>
                  <CuteStar size={52} />
                </Sticker>
              </Motion>
              <Motion kind="pop" delay={0.2}>
                <Label text={L('Đổi sao lấy đồ 🎁', 'Trade stars for gear 🎁')} color="#F472B6" ink="#FFFFFF" tilt={-4} size={12} />
              </Motion>
            </View>
            <Text className="font-sans text-body text-muted">
              {L(`Tủ đồ còn trống. Bạn đang có ${formatStars(ledger.balance)} sao — avatar động rẻ nhất 150 sao, skin từ 300 sao.`, `Your wardrobe is empty. You have ${formatStars(ledger.balance)} stars — animated avatars start at 150 stars, skins at 300.`)}
            </Text>
            <View className="mt-3 flex-row">
              <Button label={L('Đi đổi sao', 'Spend stars')} size="sm" iconLeft="gift" onPress={() => router.push('/shop' as never)} />
            </View>
          </Card>
        ) : (
          <View className="mt-3 flex-row flex-wrap gap-2.5">
            {wardrobe.map((item) => {
              const on = worn.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={on ? L(`Bỏ ${item.name}`, `Take off ${itemName(item, locale)}`) : L(`Dùng ${item.name}`, `Use ${itemName(item, locale)}`)}
                  aria-selected={on}
                  onPress={() => reward.equip(slotOf(item), on ? null : item.id)}
                  className="flex-row items-center gap-2 rounded-pill py-1.5 pl-1.5 pr-3.5"
                  style={{ backgroundColor: on ? '#FEF3C7' : '#FFFFFF', borderWidth: 2, borderColor: on ? '#F59E0B' : '#F6F3EE' }}
                >
                  <MiniPreview item={item} skin={skin} />
                  <Text className="font-semi text-label text-ink">{itemName(item, locale)}</Text>
                  {on ? <Text style={{ fontSize: 12, color: '#B45309' }}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </Appear>

      {/* Sổ sao */}
      <Appear index={4}>
        <Card className="mt-6">
          <SectionHeader title={L('Sổ sao', 'Star ledger')} subtitle={L('Sao đến từ đâu, đã đổi bao nhiêu', 'Where your stars came from and what you spent')} icon="star" iconTone="warning" />
          <Text className="mt-2 font-sans text-label text-muted">{L('Số dư luôn tính lại từ nhật ký học — không có nút nào cộng sao.', 'Your balance is always recalculated from your study log — there is no button that adds stars.')}</Text>
          <View className="mt-3 gap-2">
            <LedgerRow label={L('Từ việc học (phút học, số câu, nhân theo chuỗi)', 'From studying (minutes, questions, streak multiplier)')} value={`+${formatStars(ledger.study)}`} />
            <LedgerRow label={L('Thưởng trận đấu (hạ quái, boss, lên cấp, nhiệm vụ, huy hiệu)', 'Battle rewards (monsters, bosses, level-ups, quests, badges)')} value={`+${formatStars(ledger.battle)}`} />
            <LedgerRow label={L('Thưởng hạng tháng & quà', 'Monthly rank rewards & gifts')} value={`+${formatStars(ledger.prizes)}`} />
            <LedgerRow label={L('Đã đổi quà', 'Spent on rewards')} value={`−${formatStars(ledger.spent)}`} />
            <View style={{ height: 1, backgroundColor: color.border }} />
            <LedgerRow label={L('Còn lại', 'Balance')} value={`${formatStars(ledger.balance)} ⭐`} strong />
          </View>
        </Card>
      </Appear>

      {/* Huy hiệu */}
      <Appear index={5}>
        <Card className="mt-4">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <View className="min-w-0 flex-1">
              <SectionHeader title={L('Huy hiệu', 'Badges')} subtitle={L(`${opened.length}/${ACHIEVEMENTS.length} đã mở · +${STAR_BONUS.achievement} sao mỗi huy hiệu`, `${opened.length}/${ACHIEVEMENTS.length} unlocked · +${STAR_BONUS.achievement} stars per badge`)} icon="trophy" />
            </View>
            <Button label={L('Xem hết', 'See all')} size="sm" variant="outline" onPress={() => router.push('/quest/hero' as never)} />
          </View>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {ACHIEVEMENTS.map((a) => {
              const at = achievements[a.id];
              return (
                <View
                  key={a.id}
                  accessibilityLabel={L(`${a.title}${at ? ' — đã mở' : ' — chưa mở'}`, `${achievementTitle(a, locale)}${at ? ' — unlocked' : ' — locked'}`)}
                  className="items-center justify-center rounded-panel"
                  style={{ width: 52, height: 52, backgroundColor: at ? '#FEF3C7' : '#F9F6F1' }}
                >
                  {at ? (
                    <Motion kind="hover">
                      <Text style={{ fontSize: 24 }}>{a.glyph}</Text>
                    </Motion>
                  ) : (
                    <Text style={{ fontSize: 24, opacity: 0.28 }}>{a.glyph}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </Card>
      </Appear>

      <View className="h-6" />
    </Screen>
  );
}

function Stat({ seal, tone, value, label }: { seal: IconName; tone: string; value: string; label: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-card bg-surface p-3" style={{ flexGrow: 1, flexShrink: 1, flexBasis: 160, borderWidth: 1, borderColor: '#F6F3EE' }}>
      <View aria-hidden>
        <SealIcon name={seal} color={tone} size={42} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-heavy text-ink" style={{ fontSize: 20 }}>
          {value}
        </Text>
        <Text className="font-sans text-label text-muted" numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function LedgerRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center gap-3">
      <Text className={`min-w-0 flex-1 text-body ${strong ? 'font-strong text-ink' : 'font-sans text-muted'}`}>{label}</Text>
      <Text className={`font-heavy text-body ${strong ? 'text-ink' : 'text-ink'}`}>{value}</Text>
    </View>
  );
}

const NIGHT = '#1B1540';

function SlotPreview({ slot, item, name, skin }: { slot: WearSlot; item: ShopItem | undefined; name: string; skin: ReturnType<typeof skinOf> }) {
  if (slot === 'avatar') return <AvatarBadge avatarId={item?.id ?? null} name={name} size={56} skin={skin} />;
  if (slot === 'cover') {
    return (
      <View style={{ width: 84, height: 56, borderRadius: 12, overflow: 'hidden' }}>
        <ProfileCover cover={item?.cover ?? null} height={56} />
      </View>
    );
  }
  if (slot === 'effect') {
    return (
      <View style={{ width: 84, height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: NIGHT }}>
        <ProfileEffect effect={item?.effect ?? null} intensity={0.6} />
        {item ? null : <Text style={{ fontSize: 20, opacity: 0.4, textAlign: 'center', marginTop: 14 }}>✨</Text>}
      </View>
    );
  }
  if (slot === 'skin') {
    return (
      <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: NIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <View style={anim('rg-bob', 1400, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
          <HeroSprite size={44} skin={skin} />
        </View>
      </View>
    );
  }
  const pet = item?.mascot ? MASCOTS[item.mascot] : null;
  return (
    <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: pet ? NIGHT : '#F9F6F1', alignItems: 'center', justifyContent: 'center' }}>
      {pet ? (
        <View style={anim('rg-bob', 1100, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
          <PixelSprite name={pet.look} color={pet.color} size={42} />
        </View>
      ) : (
        <Text style={{ fontSize: 22, opacity: 0.4 }}>🐾</Text>
      )}
    </View>
  );
}

function MiniPreview({ item, skin }: { item: ShopItem; skin: ReturnType<typeof skinOf> }) {
  if (item.avatarLook) return <AnimatedAvatar look={item.avatarLook} size={30} skin={skin} />;
  if (item.skin || item.mascot) {
    const pet = item.mascot ? MASCOTS[item.mascot] : null;
    return (
      <View style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: NIGHT, alignItems: 'center', justifyContent: 'center' }}>
        {pet ? <PixelSprite name={pet.look} color={pet.color} size={24} /> : <HeroSprite size={24} skin={item.skin} />}
      </View>
    );
  }
  if (item.effect) {
    return (
      <View style={{ width: 30, height: 30, borderRadius: 999, overflow: 'hidden', backgroundColor: NIGHT }}>
        <ProfileEffect effect={item.effect} intensity={0.35} />
      </View>
    );
  }
  if (item.cover) {
    return (
      <View style={{ width: 30, height: 30, borderRadius: 999, overflow: 'hidden' }}>
        <ProfileCover cover={item.cover} height={30} />
      </View>
    );
  }
  return (
    <View style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: '#FBF5EC', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 16 }}>{item.glyph}</Text>
    </View>
  );
}
