import { themedHex } from '@/theme/palette-state';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Switch, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { anim, MOVE } from '@/components/game/game-anim';
import { PixelSprite } from '@/components/game/PixelSprite';
import { HeroSprite } from '@/components/game/HeroSprite';
import { AnimatedAvatar, AvatarBadge } from '@/components/profile/AnimatedAvatar';
import { ProfileCover } from '@/components/profile/ProfileCover';
import { ProfileEffect } from '@/components/profile/ProfileEffect';
import { useHydrated } from '@/components/layout/useHydrated';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
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
import { useCuteAppearanceStore } from '@/store/useCuteAppearanceStore';
import type { CutePalette } from '@/store/useCuteAppearanceStore';
import { CUTE_PALETTES } from '@/components/layout/cute-palettes';
import { GOLD } from '@/components/layout/phone-theme';
import { color } from '@/theme/tokens';
import { SealIcon } from '@/components/illust/HeroArt';
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
  { slot: 'theme', title: 'Giao diện', titleEn: 'Theme', kinds: ['theme'], tab: 'theme', empty: 'Mặc định Band 9', emptyEn: 'Band 9 default' },
];

type ProfileTab = 'overview' | 'closet' | 'look' | 'progress';

/** Bốn tab của hồ sơ: mỗi tab một việc, thay vì xếp hết lên một trang. */
const PROFILE_TABS: { key: ProfileTab; vi: string; en: string }[] = [
  { key: 'overview', vi: 'Tổng quan', en: 'Overview' },
  { key: 'closet', vi: 'Tủ đồ', en: 'Closet' },
  { key: 'look', vi: 'Giao diện', en: 'Look' },
  { key: 'progress', vi: 'Tiến độ', en: 'Progress' },
];

function ProfileSignInGate({ loading }: { loading: boolean }) {
  const { L } = useL();
  return (
    <Screen cat="peace">
      <Card className="mt-4">
        <View style={{ gap: 12 }}>
          <Text className="font-heavy text-cardTitle text-ink">{L('Hồ sơ của bạn', 'Your profile')}</Text>
          {loading ? (
            <Text className="font-sans text-label text-muted">{L('Đang kiểm tra đăng nhập…', 'Checking your sign-in…')}</Text>
          ) : (
            <>
              <Text className="font-sans text-label text-muted">
                {L(
                  'Đăng nhập để lưu hồ sơ, lịch sử học, đồ đã mở và điểm. Dữ liệu sẽ gắn với đúng tài khoản của bạn và đồng bộ giữa các thiết bị.',
                  'Sign in to save your profile, study history, unlocked items and points. Your data is tied to your own account and syncs across your devices.',
                )}
              </Text>
              <Button label={L('Đăng nhập', 'Sign in')} onPress={() => router.push('/auth/sign-in' as never)} />
            </>
          )}
        </View>
      </Card>
    </Screen>
  );
}

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
  const cuteEffects = useCuteAppearanceStore((state) => state.effectsEnabled);
  const setCuteEffects = useCuteAppearanceStore((state) => state.setEffectsEnabled);
  const cutePalette = useCuteAppearanceStore((state) => state.palette);
  const setCutePalette = useCuteAppearanceStore((state) => state.setPalette);
  const customMascotImage = useCuteAppearanceStore((state) => state.customMascotImage);
  const setCustomMascotImage = useCuteAppearanceStore((state) => state.setCustomMascotImage);
  const hydrated = useHydrated();
  const displayedMascotImage = hydrated ? customMascotImage : null;
  const [choosingMascotImage, setChoosingMascotImage] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('overview');

  const chooseMascotImage = async () => {
    setChoosingMascotImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.65,
        base64: true,
      });
      const image = result.assets?.[0];
      if (!result.canceled && image) {
        const uri = image.base64
          ? `data:${image.mimeType ?? 'image/jpeg'};base64,${image.base64}`
          : image.uri;
        setCustomMascotImage(uri);
      }
    } catch {
      Alert.alert(L('Không mở được thư viện ảnh', 'Could not open your photo library'));
    } finally {
      setChoosingMascotImage(false);
    }
  };

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
  const worn = new Set([reward.avatar, reward.cover, reward.effect, reward.skin, reward.mascot, reward.theme].filter((x): x is string => !!x));

  const avatarSize = wide ? 112 : 88;

  // Hồ sơ là dữ liệu của MỘT tài khoản. Chưa đăng nhập thì không hiện số liệu, đồ đạc hay lịch sử nào.
  const authStatus = useAuthStore((s) => s.status);
  if (!signedIn) return <ProfileSignInGate loading={authStatus === 'loading'} />;

  return (
    <Screen cat="peace">
      {/* Đầu hồ sơ: bìa, ảnh đại diện, tên và đúng hai thông tin chính. Phần còn lại nằm trong các tab. */}
      <Appear>
        <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: themedHex('#F3F0FB') }}>
          <ProfileEffect effect={effectLook} />
          <ProfileCover cover={coverLook} height={wide ? 170 : 124}>
            <View style={{ position: 'absolute', right: 12, top: 12 }}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={L('Đổi bìa hồ sơ', 'Change profile cover')}
                onPress={() => router.push('/shop?tab=cover' as never)}
                style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: themedHex('rgba(59,42,16,0.45)') }}
              >
                <Text className="font-semi" style={{ fontSize: 13, color: '#FFFFFF' }}>{L('Đổi bìa', 'Change cover')}</Text>
              </Pressable>
            </View>
          </ProfileCover>
          <View style={{ paddingHorizontal: wide ? 24 : 16, paddingBottom: 18 }}>
            <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-end' : 'flex-start', gap: wide ? 18 : 12 }}>
              <View style={{ marginTop: -avatarSize / 2, borderRadius: 999, borderWidth: 4, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' }}>
                <AvatarBadge avatarId={reward.avatar} name={name} size={avatarSize} skin={skin} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                {/* Khối này luôn nền trắng (kể cả theme tối), nên tên cố định màu mực để đọc được. */}
                <Text className="font-heavy text-pageTitle" style={{ color: '#1A1A33' }} numberOfLines={1}>{name}</Text>
                <Text className="font-sans text-label" style={{ color: '#6B5E4E' }}>
                  {`Lv ${lv.level} · ${levelTitle(titleForLevel(lv.level), locale)}`}
                  {'   ·   '}
                  {L(`Bậc tháng ${tier.name}`, `Monthly tier ${tierName(tier, locale)}`)} {'★'.repeat(tier.stars)}
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                <Button label={L('Đổi quà', 'Rewards')} size="sm" iconLeft="gift" onPress={() => router.push('/shop' as never)} />
                <Button label={L('Xếp hạng', 'Leaderboard')} size="sm" variant="outline" iconLeft="trophy" onPress={() => router.push('/leaderboard' as never)} />
              </View>
            </View>
          </View>
        </View>
      </Appear>

      {/* Thanh tab: mỗi lần chỉ một nhóm nội dung, không xếp chồng. */}
      <View accessibilityRole="tablist" className="mt-4 flex-row flex-wrap gap-2">
        {PROFILE_TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => setTab(t.key)}
              style={{ height: 38, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: on ? '#2B2350' : '#F3F0FB', backgroundColor: on ? '#2B2350' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="font-strong" style={{ fontSize: 14, color: on ? '#FFFFFF' : '#4B4036' }}>{L(t.vi, t.en)}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'overview' ? (
        <View className="mt-4 gap-4">
          <View className="flex-row flex-wrap gap-3">
            <Stat seal="star" tone={themedHex('#F2B632')} value={formatStars(ledger.balance)} label={L('sao đang có', 'stars')} />
            <Stat seal="flame" tone="#F0703F" value={String(streak)} label={L('ngày liên tiếp', 'day streak')} />
            <Stat seal="calendar" tone={themedHex('#B94A70')} value={String(month)} label={L('điểm tháng này', 'points this month')} />
            <Stat seal="check" tone="#22A06B" value={life.correct.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} label={L('câu đúng', 'correct answers')} />
          </View>

          <Card>
            <SectionHeader title={L('Đang dùng', 'Equipped')} subtitle={L('Đổi ở trang Đổi quà.', 'Change them in Rewards.')} icon="sparkle" />
            <View className="mt-2">
              {SLOTS.map((s, i) => {
                const item = findItem(reward[s.slot]);
                return (
                  <View key={s.slot} className="flex-row items-center gap-3 py-3" style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F3F0FB' }}>
                    <SlotPreview slot={s.slot} item={item} name={name} skin={skin} />
                    <View className="min-w-0 flex-1">
                      <Text className="font-sans text-label text-muted">{L(s.title, s.titleEn)}</Text>
                      <Text className="font-strong text-body text-ink" numberOfLines={1}>
                        {item ? itemName(item, locale) : L(s.empty, s.emptyEn)}
                      </Text>
                    </View>
                    <Button label={L('Đổi', 'Change')} size="sm" variant="outline" onPress={() => router.push(`/shop?tab=${s.tab}` as never)} />
                  </View>
                );
              })}
            </View>
          </Card>

          <Card>
            <SpacedRepetitionWidget />
          </Card>
        </View>
      ) : null}

      {tab === 'closet' ? (
        <Card className="mt-4">
          <SectionHeader
            title={L('Tủ đồ', 'Closet')}
            subtitle={wardrobe.length ? L('Bấm món đồ để đeo hoặc bỏ.', 'Tap an item to wear or take it off.') : undefined}
            icon="gift"
          />
          {wardrobe.length === 0 ? (
            <View className="mt-3 gap-3">
              <Text className="font-sans text-body text-muted">
                {L(`Tủ đồ còn trống. Bạn đang có ${formatStars(ledger.balance)} sao — avatar động rẻ nhất 150 sao, skin từ 300 sao.`, `Your closet is empty. You have ${formatStars(ledger.balance)} stars — animated avatars start at 150 stars, skins at 300.`)}
              </Text>
              <View className="flex-row">
                <Button label={L('Đi đổi sao', 'Spend stars')} size="sm" iconLeft="gift" onPress={() => router.push('/shop' as never)} />
              </View>
            </View>
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
                    style={{ backgroundColor: on ? themedHex('#F3F0FB') : '#FFFFFF', borderWidth: 2, borderColor: on ? themedHex('#F59E0B') : themedHex('#F3F0FB') }}
                  >
                    <MiniPreview item={item} skin={skin} />
                    <Text className="font-semi text-label text-ink">{itemName(item, locale)}</Text>
                    {on ? <Text style={{ fontSize: 12, color: '#6A4BD9' }}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>
      ) : null}

      {tab === 'look' ? (
        <View className="mt-4 gap-4">
          <Card>
            <SettingRow
              thumb={
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: themedHex('#F3F0FB'), alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="gift" size={22} color={GOLD.deep} />
                </View>
              }
              title={L('Giao diện & gói học', 'Looks & packs')}
              detail={L('Band 9 mặc định. Mọi giao diện và gói học đổi bằng sao ở Đổi quà.', 'Band 9 is the default. Every look and pack is unlocked with stars in Rewards.')}
              action={<Button label={L('Mở Đổi quà', 'Open Rewards')} size="sm" variant="outline" onPress={() => router.push('/shop?tab=theme' as never)} />}
            />
          </Card>


          <Card>
            <SettingRow
              thumb={
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: themedHex('#F3F0FB'), alignItems: 'center', justifyContent: 'center' }}>
                  <CuteStar size={28} />
                </View>
              }
              title={L('Hiệu ứng cute toàn app', 'Cute effects across the app')}
              detail={L('Mascot, sao lấp lánh và chuyển động nhẹ.', 'Mascots, sparkles and gentle motion.')}
              action={
                <Switch
                  value={cuteEffects}
                  onValueChange={setCuteEffects}
                  accessibilityLabel={L('Bật hiệu ứng cute toàn app', 'Enable cute effects across the app')}
                  trackColor={{ false: '#D9D0DC', true: themedHex('#E2B54E') }}
                  thumbColor={cuteEffects ? themedHex('#6A4BD9') : '#FFFFFF'}
                />
              }
            />
            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <Text className="mr-1 font-semi text-label text-muted">
                {L(`Màu nền · ${CUTE_PALETTES[cutePalette].label}`, `Background · ${CUTE_PALETTES[cutePalette].labelEn}`)}
              </Text>
              {(Object.keys(CUTE_PALETTES) as CutePalette[]).map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: cutePalette === key }}
                  accessibilityLabel={L(`Chọn nền ${CUTE_PALETTES[key].label}`, `Choose ${CUTE_PALETTES[key].labelEn} background`)}
                  onPress={() => setCutePalette(key)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    backgroundColor: CUTE_PALETTES[key].swatch,
                    borderWidth: cutePalette === key ? 3 : 1,
                    borderColor: cutePalette === key ? GOLD.deep : themedHex('rgba(156,133,82,0.3)'),
                  }}
                />
              ))}
            </View>
          </Card>

          <Card>
            <SettingRow
              thumb={
                <View style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: themedHex('#E2B54E'), backgroundColor: themedHex('#F3F0FB') }}>
                  <Image
                    source={displayedMascotImage ? { uri: displayedMascotImage } : require('../assets/illustrations/cute-home/mascot-wave.png')}
                    contentFit="cover"
                    style={{ width: 44, height: 44 }}
                  />
                </View>
              }
              title={L('Ảnh sticker của bạn', 'Your personal sticker')}
              detail={L('Ảnh vuông, chỉ lưu trên thiết bị này.', 'A square image, saved on this device only.')}
              action={
                <View className="flex-row flex-wrap gap-2">
                  <Button
                    label={choosingMascotImage ? L('Đang mở…', 'Opening…') : displayedMascotImage ? L('Đổi ảnh', 'Change') : L('Tải lên', 'Upload')}
                    size="sm"
                    iconLeft="sparkle"
                    loading={choosingMascotImage}
                    onPress={() => void chooseMascotImage()}
                  />
                  {displayedMascotImage ? <Button label={L('Xóa', 'Remove')} size="sm" variant="outline" onPress={() => setCustomMascotImage(null)} /> : null}
                </View>
              }
            />
          </Card>
        </View>
      ) : null}

      {tab === 'progress' ? (
        <View className="mt-4 gap-4">
          <Card>
            <SectionHeader title={L('Sổ sao', 'Star ledger')} subtitle={L('Sao đến từ đâu và đã đổi bao nhiêu.', 'Where your stars came from and what you spent.')} icon="star" iconTone="warning" />
            <View className="mt-3 gap-2">
              <LedgerRow label={L('Từ việc học', 'From studying')} value={`+${formatStars(ledger.study)}`} />
              <LedgerRow label={L('Thưởng trận đấu', 'Battle rewards')} value={`+${formatStars(ledger.battle)}`} />
              <LedgerRow label={L('Thưởng hạng tháng & quà', 'Monthly rank rewards & gifts')} value={`+${formatStars(ledger.prizes)}`} />
              <LedgerRow label={L('Thưởng chuỗi ngày', 'Streak rewards')} value={`+${formatStars(ledger.streak)}`} />
              <LedgerRow label={L('Đã đổi quà', 'Spent on rewards')} value={`−${formatStars(ledger.spent)}`} />
              <View style={{ height: 1, backgroundColor: color.border }} />
              <LedgerRow label={L('Còn lại', 'Balance')} value={`${formatStars(ledger.balance)} ⭐`} strong />
            </View>
            <Text className="mt-3 font-sans text-label text-muted">
              {L('Số dư được tính lại từ nhật ký học.', 'Your balance is recalculated from your study log.')}
            </Text>
          </Card>

          <Card>
            <SectionHeader
              title={L('Huy hiệu', 'Badges')}
              subtitle={L(`${opened.length}/${ACHIEVEMENTS.length} đã mở · +${STAR_BONUS.achievement} sao mỗi huy hiệu`, `${opened.length}/${ACHIEVEMENTS.length} unlocked · +${STAR_BONUS.achievement} stars per badge`)}
              icon="trophy"
            />
            <View className="mt-3 flex-row flex-wrap gap-2">
              {ACHIEVEMENTS.map((a) => {
                const at = achievements[a.id];
                return (
                  <View
                    key={a.id}
                    accessibilityLabel={L(`${a.title}${at ? ' — đã mở' : ' — chưa mở'}`, `${achievementTitle(a, locale)}${at ? ' — unlocked' : ' — locked'}`)}
                    className="items-center justify-center rounded-panel"
                    style={{ width: 52, height: 52, backgroundColor: at ? themedHex('#F3F0FB') : themedHex('#F3F0FB') }}
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
        </View>
      ) : null}

      <View className="h-6" />
    </Screen>
  );
}

/** Một dòng cài đặt: ảnh nhỏ, tên và mô tả một dòng, nút hành động bên phải. */
function SettingRow({ thumb, title, detail, action }: { thumb: React.ReactNode; title: string; detail?: string; action: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 py-3" style={{ borderTopWidth: 1, borderTopColor: '#F3F0FB' }}>
      {thumb}
      <View className="min-w-0 flex-1">
        <Text className="font-strong text-body text-ink">{title}</Text>
        {detail ? <Text className="font-sans text-label text-muted" numberOfLines={2}>{detail}</Text> : null}
      </View>
      {action}
    </View>
  );
}

function Stat({ seal, tone, value, label }: { seal: IconName; tone: string; value: string; label: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-card bg-surface p-3" style={{ flexGrow: 1, flexShrink: 1, flexBasis: 160, borderWidth: 1, borderColor: themedHex('#F3F0FB') }}>
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
  if (slot === 'theme') {
    return (
      <View style={{ width: 84, height: 56, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={require('../assets/illustrations/cute-home/mascot-wave.png')} contentFit="contain" style={{ width: 80, height: 54 }} />
      </View>
    );
  }
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
    <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: pet ? NIGHT : themedHex('#F3F0FB'), alignItems: 'center', justifyContent: 'center' }}>
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
    <View style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: themedHex('#F3F0FB'), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 16 }}>{item.glyph}</Text>
    </View>
  );
}
