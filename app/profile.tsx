import { themedHex } from '@/theme/palette-state';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Switch, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ChiikawaStickerRow } from '@/components/chiikawa/ChiikawaStickerRow';
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
import { useCuteAppearanceStore } from '@/store/useCuteAppearanceStore';
import type { CutePalette } from '@/store/useCuteAppearanceStore';
import { CUTE_PALETTES } from '@/components/layout/cute-palettes';
import { GOLD, GOLD_BUTTON } from '@/components/layout/phone-theme';
import { CatSticker } from '@/components/mascot/CatSticker';
import { color } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge as SealBadge } from '@/components/illust/Cute';
import { CuteStar, Motion } from '@/components/illust/CuteMore';
import type { IconName } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { RetroModeButton } from '@/components/profile-retro/RetroModeButton';
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

/** Gói giao diện pixel: hai chủ đề cùng họ, mở khóa ở Đổi quà, bật/tắt ở đây. */
const PIXEL_FAMILY = [
  {
    id: 'theme-pixel',
    name: 'Pixel · Y2K tím',
    nameEn: 'Pixel · Y2K lilac',
    detail: 'Nền lưới tím, thẻ viền đậm và nút pixel hồng–tím.',
    detailEn: 'Lilac grid background, bold-outlined cards and pink–purple pixel buttons.',
    swatch: '#9D7BFF',
    fill: '#8A63F0',
  },
  {
    id: 'theme-cyber',
    name: 'Cyber · Neon xanh',
    nameEn: 'Cyber · Neon blue',
    detail: 'Nền navy đêm, viền neon cyan, mặt trời neon và lưới phát sáng.',
    detailEn: 'Night-navy background, neon cyan outlines, a neon sun and a glowing grid.',
    swatch: '#3DD9F5',
    fill: '#1E4FD1',
  },
] as const;

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
  const chiikawaItem = SHOP_ITEMS.find((item) => item.id === 'theme-chiikawa');
  const ownsChiikawaTheme = (reward.owned['theme-chiikawa'] ?? 0) > 0;
  const chiikawaThemeActive = reward.theme === 'theme-chiikawa';
  const pixelRows = PIXEL_FAMILY.map((t) => ({
    ...t,
    price: SHOP_ITEMS.find((i) => i.id === t.id)?.price ?? 500,
    owned: (reward.owned[t.id] ?? 0) > 0,
    active: reward.theme === t.id,
  }));

  const avatarSize = wide ? 112 : 88;

  return (
    <Screen cat="peace">
      {/* Mèo đeo kính ngồi trên đầu hồ sơ (màn hẹp) */}
      {!wide ? (
        <View style={{ alignItems: 'flex-end', marginBottom: 2 }}>
          <CatSticker pose="sunglasses" size={64} />
        </View>
      ) : null}
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
                style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: themedHex('rgba(59,42,16,0.5)') }}
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
                {/* Khối này luôn nền trắng (kể cả theme tối), nên tên cố định màu mực để đọc được. */}
                <Text className="font-heavy text-pageTitle" style={{ color: '#1A1A33' }} numberOfLines={1}>
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

      <Card className="mt-4">
        <View style={{ gap: 12 }}>
          <Text className="font-heavy text-cardTitle text-ink">{L('Gói giao diện pixel', 'Pixel theme pack')}</Text>
          <Text className="font-sans text-label text-muted">
            {L('Hai giao diện pixel dùng chung một cách vẽ. Đã mở khóa thì bật ở đây; tắt đi là về Band 9.', 'Two pixel themes share one style. Once unlocked, turn one on here; turn it off to go back to Band 9.')}
          </Text>
          {pixelRows.map((t) => (
            <View
              key={t.id}
              className="flex-row flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-3.5"
            >
              <View style={{ width: 44, height: 44, borderRadius: 10, borderWidth: 2, borderColor: t.swatch, backgroundColor: t.fill }} />
              <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="font-heavy text-body text-ink">{L(t.name, t.nameEn)}</Text>
                  <Badge label={t.active ? L('Đang dùng', 'Active') : t.owned ? L('Đã mở khóa', 'Unlocked') : L('Đổi bằng sao', 'Star reward')} tone={t.active ? 'success' : 'primary'} shape="tag" />
                </View>
                <Text className="mt-0.5 font-sans text-label text-muted">{L(t.detail, t.detailEn)}</Text>
              </View>
              {t.owned ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.active ? L(`Tắt ${t.name}`, `Turn off ${t.nameEn}`) : L(`Dùng ${t.name}`, `Use ${t.nameEn}`)}
                  onPress={() => reward.equip('theme', t.active ? null : t.id)}
                  style={{ minHeight: 44, paddingHorizontal: 18, borderRadius: 10, borderWidth: 2, borderColor: t.swatch, alignItems: 'center', justifyContent: 'center', backgroundColor: t.active ? '#FFFFFF' : t.fill }}
                >
                  <Text className="font-strong text-label" style={{ color: t.active ? '#2B1B4E' : '#FFFFFF' }}>
                    {t.active ? L('Tắt giao diện', 'Turn off') : L('Dùng giao diện', 'Use theme')}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={L(`Đổi ${formatStars(t.price)} sao lấy ${t.name}`, `Unlock ${t.nameEn} for ${formatStars(t.price)} stars`)}
                  onPress={() => router.push('/shop?tab=theme' as never)}
                  style={{ minHeight: 44, paddingHorizontal: 18, borderRadius: 10, borderWidth: 2, borderColor: t.swatch, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}
                >
                  <Text className="font-strong text-label" style={{ color: '#2B1B4E' }}>{L(`Đổi ${formatStars(t.price)} ⭐`, `Unlock · ${formatStars(t.price)} ⭐`)}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </Card>

      <Card className="mt-4">
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'flex-start', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: themedHex('rgba(233,181,74,0.35)'), backgroundColor: themedHex('rgba(255,250,235,0.85)') }}>
            <View style={{ width: 82, height: 82, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: themedHex('#FBEFCB') }}>
              <Image source={require('../assets/illustrations/cute-home/mascot-wave.png')} contentFit="contain" style={{ width: 82, height: 82 }} />
            </View>
            <View style={{ flex: 1, minWidth: 220 }}>
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="font-heavy text-body text-ink">{L('Giao diện Chiikawa · Góc học hồng', 'Chiikawa · Pink study nook')}</Text>
                <Badge label={chiikawaThemeActive ? L('Đang dùng', 'Active') : ownsChiikawaTheme ? L('Đã mở khóa', 'Unlocked') : L('Đổi bằng sao', 'Star reward')} tone={chiikawaThemeActive ? 'success' : 'primary'} shape="tag" />
              </View>
              <Text className="mt-1 font-sans text-label text-muted">
                {L('Nền caro hồng sữa, mascot trên taskbar và nút hỏi Chiikawa. Mở khóa một lần; bạn tự chọn lúc bật, mặc định vẫn là giao diện Band 9.', 'Milk-pink checked backgrounds, taskbar mascots and a Chiikawa helper. Unlock once and choose when to turn it on; Band 9 remains the default.')}
              </Text>
            </View>
            {ownsChiikawaTheme ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={chiikawaThemeActive ? L('Tắt giao diện Chiikawa', 'Turn off Chiikawa theme') : L('Dùng giao diện Chiikawa', 'Use Chiikawa theme')}
                onPress={() => reward.equip('theme', chiikawaThemeActive ? null : 'theme-chiikawa')}
                style={{ minHeight: 44, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...(chiikawaThemeActive ? { backgroundColor: '#FFF', borderWidth: 1, borderColor: themedHex('#E9CF9A') } : GOLD_BUTTON) }}
              >
                <Text className="font-strong text-label" style={{ color: chiikawaThemeActive ? GOLD.deep : GOLD.ink }}>{chiikawaThemeActive ? L('Tắt giao diện', 'Turn off') : L('Dùng giao diện', 'Use theme')}</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={L(`Đổi ${formatStars(chiikawaItem?.price ?? 500)} sao lấy giao diện Chiikawa`, `Unlock Chiikawa theme for ${formatStars(chiikawaItem?.price ?? 500)} stars`)}
                onPress={() => router.push('/shop?tab=theme' as never)}
                style={{ minHeight: 44, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...GOLD_BUTTON }}
              >
                <Text className="font-strong text-label" style={{ color: GOLD.ink }}>{L(`Đổi ${formatStars(chiikawaItem?.price ?? 500)} ⭐`, `Unlock · ${formatStars(chiikawaItem?.price ?? 500)} ⭐`)}</Text>
              </Pressable>
            )}
          </View>
          {ownsChiikawaTheme ? (
            <View style={{ padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#F5CADB', backgroundColor: '#FFFFFF' }}>
              <ChiikawaStickerRow title={L('Bộ sticker Chiikawa', 'Chiikawa stickers')} />
            </View>
          ) : null}
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: themedHex('#FBEFCB') }}>
              <CuteStar size={34} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-heavy text-cardTitle text-ink">{L('Hiệu ứng cute toàn app', 'Cute effects across the app')}</Text>
              <Text className="mt-0.5 font-sans text-label text-muted">
                {L('Mascot, sao lấp lánh và chuyển động nhẹ ở mọi màn.', 'Mascots, sparkles and gentle motion on every screen.')}
              </Text>
            </View>
            <Switch
              value={cuteEffects}
              onValueChange={setCuteEffects}
              accessibilityLabel={L('Bật hiệu ứng cute toàn app', 'Enable cute effects across the app')}
              trackColor={{ false: '#D9D0DC', true: themedHex('#E2B54E') }}
              thumbColor={cuteEffects ? themedHex('#B8862B') : '#FFFFFF'}
            />
          </View>
          <View className="flex-row flex-wrap items-center gap-2">
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
          <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'flex-start', gap: 14, borderTopWidth: 1, borderTopColor: themedHex('rgba(156,133,82,0.25)'), paddingTop: 14 }}>
            <View style={{ width: 76, height: 76, borderRadius: 24, borderWidth: 2, borderColor: themedHex('#E2B54E'), backgroundColor: themedHex('#FBEFCB'), overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={displayedMascotImage ? { uri: displayedMascotImage } : require('../assets/illustrations/cute-home/mascot-wave.png')}
                contentFit="cover"
                style={{ width: 72, height: 72 }}
              />
            </View>
            <View style={{ flex: 1, minWidth: 200 }}>
              <Text className="font-strong text-body text-ink">{L('Ảnh sticker của bạn', 'Your personal sticker')}</Text>
              <Text className="mt-0.5 font-sans text-label text-muted">
                {L('Chọn ảnh vuông để làm sticker bay nhẹ trên các màn hình. Ảnh chỉ lưu trên thiết bị này.', 'Choose a square image to float as a sticker across the app. It stays on this device.')}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <Button
                label={choosingMascotImage ? L('Đang mở…', 'Opening…') : displayedMascotImage ? L('Đổi ảnh', 'Change image') : L('Tải ảnh lên', 'Upload image')}
                size="sm"
                iconLeft="sparkle"
                loading={choosingMascotImage}
                onPress={() => void chooseMascotImage()}
              />
              {displayedMascotImage ? <Button label={L('Xóa ảnh', 'Remove image')} size="sm" variant="outline" onPress={() => setCustomMascotImage(null)} /> : null}
            </View>
          </View>
        </View>
      </Card>

      {/* Bản mẫu giao diện retro theo ảnh tham chiếu để thử; màn hồ sơ này vẫn là bản chính */}
      <Appear index={1}>
        <Card className="mt-4">
          <View className="flex-row flex-wrap items-center gap-3">
            <View className="min-w-0 flex-1" style={{ minWidth: 220 }}>
              <Text className="font-heavy text-cardTitle text-ink">{L('Thử giao diện retro', 'Try the retro look')}</Text>
              <Text className="mt-0.5 font-sans text-label text-muted">
                {L('Bản mẫu theo ảnh tham chiếu, dùng đúng số liệu của bạn.', 'A sample laid out like the reference, using your own numbers.')}
              </Text>
            </View>
            <RetroModeButton />
            <Button label={L('Xem thử', 'Preview')} size="sm" iconLeft="sparkle" onPress={() => router.push('/profile-so-dan' as never)} />
          </View>
        </Card>
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
          <Stat seal="star" tone={themedHex('#F2B632')} value={formatStars(ledger.balance)} label={L('sao đang có', 'stars')} />
          <Stat seal="flame" tone="#F0703F" value={String(streak)} label={L('ngày liên tiếp', 'day streak')} />
          <Stat seal="calendar" tone={themedHex('#A8843F')} value={String(month)} label={L('điểm tháng này', 'points this month')} />
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
                  <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 12 }}>
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
                  style={{ backgroundColor: on ? themedHex('#FEF3C7') : '#FFFFFF', borderWidth: 2, borderColor: on ? themedHex('#F59E0B') : themedHex('#F6F3EE') }}
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
                  style={{ width: 52, height: 52, backgroundColor: at ? themedHex('#FEF3C7') : themedHex('#F9F6F1') }}
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
    <View className="flex-row items-center gap-3 rounded-card bg-surface p-3" style={{ flexGrow: 1, flexShrink: 1, flexBasis: 160, borderWidth: 1, borderColor: themedHex('#F6F3EE') }}>
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
    <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: pet ? NIGHT : themedHex('#F9F6F1'), alignItems: 'center', justifyContent: 'center' }}>
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
    <View style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: themedHex('#FBF5EC'), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 16 }}>{item.glyph}</Text>
    </View>
  );
}
