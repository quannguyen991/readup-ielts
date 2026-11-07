import { themedHex } from '@/theme/palette-state';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { GridBackdrop } from '@/components/layout/GridBackdrop';
import { STUDY_BACKGROUNDS } from '@/components/layout/study-backgrounds';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { PixelSprite } from '@/components/game/PixelSprite';
import { HeroSprite } from '@/components/game/HeroSprite';
import type { SkinId } from '@/components/game/sprites';
import { anim, MOVE } from '@/components/game/game-anim';
import { AnimatedAvatar } from '@/components/profile/AnimatedAvatar';
import { ProfileCover } from '@/components/profile/ProfileCover';
import { ProfileEffect } from '@/components/profile/ProfileEffect';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { effectivePlan } from '@/lib/billing/entitlements';
import { PLANS } from '@/lib/billing/plans';
import { applyStarPass, type PassResult } from '@/lib/billing/star-pass';
import { MASCOTS } from '@/services/game/mascots';
import { currentStreak, dailyCapFor, dateKey } from '@/services/gamification/points';
import { inPromo } from '@/services/gamification/promo';
import { DEFAULT_LOOK, SHOP_ITEMS, formatStars, spendIdeas, type ShopItem, type ShopItemKind } from '@/services/gamification/shop';
import { useBillingStore } from '@/store/useBillingStore';
import { useGameStore } from '@/store/useGameStore';
import { skinOf, useRewardStore, type WearSlot } from '@/store/useRewardStore';
import { useStarBalance } from '@/store/useStarBalance';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { BrandMark } from '@/components/layout/Logo';
import { Label } from '@/components/illust/Sticker';
import { Badge as SealBadge } from '@/components/illust/Cute';
import { Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';
import { itemDetail, itemName, mascotPerk } from '@/services/gamification/labels-en';

/**
 * ĐỔI QUÀ — nơi tiêu sao kiếm được từ việc học (trước tên "Đổi sao"; người dùng
 * gọi là đổi quà, đổi điểm — đổi tên cho khớp, 24/09/2026).
 *
 * Sao chỉ đến từ việc học (thời gian, số câu, trận đấu khi học) — luật ở
 * `services/gamification/shop.ts`. Đổi được vé gói có hạn, linh vật giúp câu hỏi,
 * skin nhân vật, avatar động, bìa hồ sơ chuyển động, đồ chiến đấu, thẻ giữ chuỗi.
 *
 * ĐỔI LÀ HỎI LẠI MỘT LẦN: vé Pro tới 1.400 sao, bấm nhầm là mất cả tuần học.
 * Món đã có thì bấm để đeo / bỏ đeo — không hỏi.
 *
 * GIÁ HIỆN NGAY TRÊN THẺ, món chưa đủ sao thì mờ đi và báo "còn thiếu bao nhiêu"
 * chứ không để bấm vào rồi mới báo lỗi.
 */

/** `subtitle` hiện một dòng nên phải ngắn; `note` là phần giải thích dài, hiện dưới lưới. */
type Section = { kind: ShopItemKind; title: string; titleEn: string; subtitle: string; subtitleEn: string; icon: IconName; note?: string; noteEn?: string };

const SECTIONS: Section[] = [
  {
    kind: 'plan',
    title: 'Vé gói học',
    titleEn: 'Plan passes',
    subtitle: 'Vé có hạn, đổi thêm cùng gói là cộng dồn ngày.',
    subtitleEn: 'Time-limited; buying the same plan again adds days.',
    icon: 'trophy',
    note: 'Vé mở nội dung trên máy này, giống bản dùng thử. Lượt gọi AI (chấm Writing, trợ giảng) vẫn tính theo gói của tài khoản — vé không cộng thêm lượt AI.',
    noteEn: "Passes unlock content on this device, like a trial. AI calls (Writing grading, tutor) still follow your account's plan — passes don't add AI calls.",
  },
  {
    kind: 'mascot',
    title: 'Linh vật đồng hành',
    titleEn: 'Companion mascots',
    subtitle: 'Đi cùng nhân vật trong trận, giúp theo cách riêng.',
    subtitleEn: 'They join your hero in battle and help in their own way.',
    icon: 'heart',
    note: 'Mỗi lúc chỉ đi cùng một con. Linh vật chỉ giúp — bỏ bớt đáp án sai, đỡ câu sai, hồi tim, chém mạnh hơn — không con nào làm bài hộ.',
    noteEn: 'Only one at a time. Mascots just help — removing wrong options, blocking a miss, restoring hearts, hitting harder — none of them answers for you.',
  },
  { kind: 'skin', title: 'Skin nhân vật', titleEn: 'Hero skins', subtitle: 'Bộ đồ cho nhân vật trên thanh trận đấu.', subtitleEn: 'Outfits for your hero on the battle bar.', icon: 'shield' },
  { kind: 'avatarAnim', title: 'Avatar động', titleEn: 'Animated avatars', subtitle: 'Hiện ở hồ sơ, thanh bên và bảng xếp hạng.', subtitleEn: 'Shown on your profile, the sidebar and leaderboards.', icon: 'sparkle' },
  { kind: 'cover', title: 'Bìa hồ sơ chuyển động', titleEn: 'Animated profile covers', subtitle: 'Đầu trang Hồ sơ và thẻ trên bảng xếp hạng.', subtitleEn: 'At the top of your profile and on your leaderboard card.', icon: 'star' },
  {
    kind: 'effect',
    title: 'Hiệu ứng hồ sơ',
    titleEn: 'Profile effects',
    subtitle: 'Lớp hoạt hình phủ cả thẻ hồ sơ — như Profile Effects của Discord.',
    subtitleEn: "An animated layer over your whole profile card — like Discord's Profile Effects.",
    icon: 'sparkle',
    note: 'Hiện ở trang Hồ sơ và ở thẻ top 3 trên bảng xếp hạng. Chỉ để đẹp, không cộng gì vào bài.',
    noteEn: "Shown on your profile and on top-3 leaderboard cards. Purely cosmetic — it doesn't affect your score.",
  },
  { kind: 'powerup', title: 'Đồ chiến đấu', titleEn: 'Battle items', subtitle: 'Vào thẳng túi đồ, dùng ngay trong bài.', subtitleEn: 'Go straight into your bag, ready to use in a session.', icon: 'shield' },
  { kind: 'freeze', title: 'Thẻ giữ chuỗi', titleEn: 'Streak freezes', subtitle: 'Giữ chuỗi cho ngày không kịp học.', subtitleEn: "Keep your streak on days you can't study.", icon: 'flame' },
  { kind: 'avatar', title: 'Avatar emoji', titleEn: 'Emoji avatars', subtitle: 'Gọn, nhẹ, hiện ở mọi nơi.', subtitleEn: 'Simple, light, shown everywhere.', icon: 'heart' },
  {
    kind: 'studyBg',
    title: 'Nền học',
    titleEn: 'Study backgrounds',
    subtitle: 'Nền phía sau mọi màn học — đọc bài, làm bài, luyện nghe, tra từ.',
    subtitleEn: 'The background behind every study screen — reading, tests, listening, lookups.',
    icon: 'book',
    note: 'Đổi rồi bấm "Dùng" để áp dụng; bấm lần nữa là về nền lưới mặc định. Nền được lưu theo tài khoản — lần sau vào (kể cả máy khác) vẫn đang dùng đúng nền đó.',
    noteEn: 'After buying, tap "Use" to apply; tap again to go back to the default grid. Your background is saved to your account — it stays the same next time, even on another device.',
  },
  {
    kind: 'furniture',
    title: 'Nội thất nhà bạn',
    titleEn: 'Home furniture',
    subtitle: 'Bày trong ngôi nhà của bạn ở Thành phố Tri thức.',
    subtitleEn: 'Decorate your home in the Knowledge City.',
    icon: 'heart',
    note: 'Mua bao nhiêu món thì bày được bấy nhiêu. Vào nhà bằng cách cho nhân vật đi dạo tới cửa một ngôi nhà đã xây xong, hoặc bấm "Nhà của tôi" trong Thành phố Tri thức (trên máy tính).',
    noteEn: 'You can place as many items as you buy. Enter by walking your hero to the door of a finished house, or tap "My home" in the Knowledge City (on desktop).',
  },
  {
    kind: 'theme',
    title: 'Giao diện toàn diện',
    titleEn: 'Full themes',
    subtitle: 'Đổi phong cách, bảng màu thanh bên và màn hình.',
    subtitleEn: 'Change the style and colours of the sidebar and screens.',
    icon: 'book',
    note: 'Đổi và bấm áp dụng để thay đổi diện mạo thanh bên cùng bầu không khí học tập.',
    noteEn: 'Buy and apply to change the look of the sidebar and your study mood.',
  },
];

type TabKey = 'all' | 'furniture' | 'studyBg' | 'theme' | 'effect' | 'cover' | 'plan' | 'avatarAnim' | 'mascot' | 'skin' | 'battle';

const TABS: { key: TabKey; label: string; labelEn: string; kinds: ShopItemKind[] }[] = [
  { key: 'all', label: 'Tất cả', labelEn: 'All', kinds: SECTIONS.map((s) => s.kind) },
  { key: 'studyBg', label: 'Nền học 🖼️', labelEn: 'Backgrounds 🖼️', kinds: ['studyBg'] },
  { key: 'furniture', label: 'Nội thất 🛋️', labelEn: 'Furniture 🛋️', kinds: ['furniture'] },
  { key: 'theme', label: 'Giao diện 🎨', labelEn: 'Themes 🎨', kinds: ['theme'] },
  { key: 'effect', label: 'Hiệu ứng ✨', labelEn: 'Effects ✨', kinds: ['effect'] },
  { key: 'cover', label: 'Bìa hồ sơ', labelEn: 'Covers', kinds: ['cover'] },
  { key: 'plan', label: 'Vé gói', labelEn: 'Passes', kinds: ['plan'] },
  { key: 'avatarAnim', label: 'Avatar', labelEn: 'Avatars', kinds: ['avatarAnim', 'avatar'] },
  { key: 'mascot', label: 'Linh vật', labelEn: 'Mascots', kinds: ['mascot'] },
  { key: 'skin', label: 'Skin', labelEn: 'Skins', kinds: ['skin'] },
  { key: 'battle', label: 'Đồ & thẻ', labelEn: 'Items & freezes', kinds: ['powerup', 'freeze'] },
];

/** Món nào đeo ở ô nào. */
const SLOT: Partial<Record<ShopItemKind, WearSlot>> = {
  mascot: 'mascot',
  skin: 'skin',
  avatarAnim: 'avatar',
  avatar: 'avatar',
  cover: 'cover',
  effect: 'effect',
  theme: 'theme',
  studyBg: 'studyBg',
};

const NIGHT = '#1B1540';
const GOLD_SOFT = '#F3F0FB';

export default function ShopScreen() {
  const { L, locale, en } = useL();
  const dateLoc = en ? 'en-US' : 'vi-VN';
  const nm = (item: ShopItem) => itemName(item, locale);
  const daily = useStudyStore((s) => s.daily);
  const reward = useRewardStore();
  const bag = useGameStore((s) => s.items);
  const stars = useStarBalance();
  const billingPlan = useBillingStore((s) => s.plan);
  const billingExpires = useBillingStore((s) => s.expiresAt);
  // Mở thẳng một nhóm từ trang Hồ sơ: /shop?tab=cover
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<TabKey>(TABS.find((t) => t.key === params.tab)?.key ?? 'all');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const streak = currentStreak(daily, today, reward.frozenDays);
  const skin = skinOf(reward.skin);
  const worn = new Set([reward.avatar, reward.cover, reward.effect, reward.theme, reward.studyBg, reward.skin, reward.mascot].filter((x): x is string => !!x));
  const activePlan = effectivePlan(billingPlan, billingExpires, today);
  const planUntil = activePlan !== 'free' && billingExpires ? new Date(billingExpires).toLocaleDateString(dateLoc) : null;

  const say = (text: string) => {
    setNote(text);
    setConfirm(null);
  };

  /** Thử trước vé gói: đổi xong gói nào, tới ngày nào — hoặc vì sao không đổi được. */
  const previewPass = (item: ShopItem): PassResult | null => {
    if (!item.plan) return null;
    const billing = useBillingStore.getState();
    return applyStarPass({ plan: billing.plan, expiresAt: billing.expiresAt, source: billing.source }, item.plan);
  };
  const refusal = (r: PassResult) =>
    !r.ok && r.reason === 'đang-có-gói-trả-phí'
      ? L('Bạn đang dùng gói trả phí, vé đổi sao không cộng vào gói đó. Để dành sao cho linh vật hay skin nhé.', "You're on a paid plan, so star passes don't add to it. Save your stars for a mascot or skin instead.")
      : L('Bạn đang có gói cao hơn vé này — đổi lúc này thì phí sao.', 'You already have a higher plan than this pass — buying it now would waste stars.');
  const passNote = (item: ShopItem): string | null => {
    const r = previewPass(item);
    if (!r || !r.ok) return null;
    const until = new Date(r.expiresAt).toLocaleDateString(dateLoc);
    // Đang có gói thấp hơn còn hạn: vé mới THAY gói đó, ngày còn lại không cộng sang.
    const replaces = activePlan !== 'free' && activePlan !== r.plan && planUntil ? L(` Gói ${PLANS[activePlan].name} đang dùng (tới ${planUntil}) sẽ được thay bằng ${PLANS[r.plan].name}.`, ` Your current ${PLANS[activePlan].name} plan (until ${planUntil}) will be replaced by ${PLANS[r.plan].name}.`) : '';
    return L(`Mở ${PLANS[r.plan].name} tới hết ngày ${until}.${replaces}`, `Unlocks ${PLANS[r.plan].name} until the end of ${until}.${replaces}`);
  };

  const purchase = (item: ShopItem) => {
    if (stars < item.price) return say(L(`Còn thiếu ${formatStars(item.price - stars)} sao cho ${item.name}. Học thêm là có.`, `You need ${formatStars(item.price - stars)} more stars for ${nm(item)}. Keep studying to earn them.`));

    if (item.plan) {
      const pass = previewPass(item);
      if (!pass) return say(L(`Không đổi được ${item.name}.`, `Couldn't get ${nm(item)}.`));
      if (!pass.ok) return say(refusal(pass));
      if (!reward.buy(item.id, stars).ok) return say(L(`Không đổi được ${item.name}.`, `Couldn't get ${nm(item)}.`));
      useBillingStore.getState().setPlanLocally(pass.plan, pass.expiresAt);
      return say(L(`Đã mở gói ${PLANS[pass.plan].name} tới hết ngày ${new Date(pass.expiresAt).toLocaleDateString('vi-VN')}. Còn ${formatStars(stars - item.price)} sao.`, `${PLANS[pass.plan].name} unlocked until the end of ${new Date(pass.expiresAt).toLocaleDateString('en-US')}. ${formatStars(stars - item.price)} stars left.`));
    }

    const res = reward.buy(item.id, stars);
    if (!res.ok) return say(res.reason === 'đã-sở-hữu' ? L(`Bạn đã có ${item.name}.`, `You already have ${nm(item)}.`) : L(`Không đổi được ${item.name}.`, `Couldn't get ${nm(item)}.`));
    if (item.grants) useGameStore.getState().addItem(item.grants, 1);
    const slot = SLOT[item.kind];
    const unlockOnly = item.id === 'theme-chiikawa' || item.id === 'theme-retro' || item.id === 'theme-pixel' || item.id === 'theme-cyber';
    if (slot && !unlockOnly) useRewardStore.getState().equip(slot, item.id);
    say(unlockOnly
      ? L(`Đã mở khóa ${item.name}. Mặc định vẫn là giao diện Band 9; bấm món đó trong danh sách này để bật. Còn ${formatStars(stars - item.price)} sao.`, `Unlocked ${nm(item)}. Band 9 remains the default; turn on the new theme from Personal. ${formatStars(stars - item.price)} stars left.`)
      : L(`Đã đổi ${item.name}${slot ? ' và đeo luôn' : item.grants ? ' — đã vào túi đồ' : ''}. Còn ${formatStars(stars - item.price)} sao.`, `Got ${nm(item)}${slot ? ' and put it on' : item.grants ? ' — it’s in your bag' : ''}. ${formatStars(stars - item.price)} stars left.`));
  };

  const onPress = (item: ShopItem) => {
    const have = !item.repeatable && (reward.owned[item.id] ?? 0) > 0;
    const slot = SLOT[item.kind];
    if (have && slot) {
      const on = worn.has(item.id);
      reward.equip(slot, on ? null : item.id);
      return say(on ? L(`Đã bỏ ${item.name}.`, `Took off ${nm(item)}.`) : L(`Đang dùng ${item.name}.`, `Now using ${nm(item)}.`));
    }
    if (have) return say(L(`Bạn đã có ${item.name}.`, `You already have ${nm(item)}.`));
    // Vé không đổi được (đang có gói trả phí / gói cao hơn) thì nói ngay, không mở hộp xác nhận.
    const pass = previewPass(item);
    if (pass && !pass.ok) return say(refusal(pass));
    if (stars < item.price) return say(L(`Còn thiếu ${formatStars(item.price - stars)} sao cho ${item.name}. Học thêm là có.`, `You need ${formatStars(item.price - stars)} more stars for ${nm(item)}. Keep studying to earn them.`));
    setNote(null);
    setConfirm(confirm === item.id ? null : item.id);
  };

  const ideas = useMemo(() => spendIdeas(stars, reward.owned), [stars, reward.owned]);
  const openIdea = (item: ShopItem) => {
    const t = TABS.find((x) => x.key !== 'all' && x.kinds.includes(item.kind));
    if (t) setTab(t.key);
    setNote(null);
    setConfirm(item.id);
  };

  const kinds = TABS.find((t) => t.key === tab)?.kinds ?? [];
  const shown = SECTIONS.filter((s) => kinds.includes(s.kind));
  const freezeOwned = SHOP_ITEMS.filter((i) => i.kind === 'freeze' && (reward.owned[i.id] ?? 0) > 0);

  return (
    <Screen cat="wave">
      {/* Khung hẹp lại trên màn rộng: quà không bị kéo giãn ngang. */}
      <View className="w-full self-center" style={{ maxWidth: 960 }}>
      <Appear>
        <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-3">
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={L('Về trang Xếp hạng', 'Back to Leaderboard')}
            onPress={() => router.push('/leaderboard' as never)}
            className="h-9 w-9 items-center justify-center rounded-pill border border-border"
          >
            <Icon name="chevron-left" size={17} color={color.muted} strokeWidth={2.2} />
          </Pressable>
          <Text className="font-heavy text-pageTitle text-ink">{L('Đổi quà', 'Rewards')}</Text>
          <View className="flex-1" />
          <Button label={L('Hồ sơ của tôi', 'My profile')} variant="outline" size="sm" iconLeft="star" onPress={() => router.push('/profile' as never)} />
          <View className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2" style={{ backgroundColor: GOLD_SOFT }} accessibilityLabel={L(`Đang có ${stars} sao`, `You have ${stars} stars`)}>
            <Text style={{ fontSize: 15 }}>⭐</Text>
            <Text className="font-heavy text-body text-ink">{formatStars(stars)}</Text>
          </View>
        </View>
        <Text className="mt-1 font-sans text-body text-muted">
          {L(
            `Sao chỉ đến từ việc học: 1 sao mỗi phút, 0,5 sao mỗi câu (tối đa ${dailyCapFor(dateKey(today))} sao/ngày${inPromo(dateKey(today)) ? ' — đang mùa sao ×2 tới hết 30/10' : ''}, chuỗi dài được nhân thêm), cộng sao thưởng khi hạ quái, lên cấp, xong nhiệm vụ.`,
            `Stars only come from studying: 1 star per minute, 0.5 per question (up to ${dailyCapFor(dateKey(today))} stars/day${inPromo(dateKey(today)) ? ' — double stars until 30 Oct' : ''}, with a bonus for long streaks), plus bonus stars for defeating monsters, levelling up and finishing quests.`,
          )}
          {planUntil ? L(` Gói đang dùng: ${PLANS[activePlan].name} tới ${planUntil}.`, ` Current plan: ${PLANS[activePlan].name} until ${planUntil}.`) : ''}
        </Text>
        </View>
        <PageStickers scene="shop" />
        </View>
      </Appear>

      <View className="mt-4 flex-row flex-wrap gap-2" accessibilityRole="tablist">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => {
                setTab(t.key);
                setConfirm(null);
              }}
              className="rounded-pill px-3.5 py-2"
              style={{ backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: on ? color.primary : '#E2E8F0', ...TAB_MOTION }}
            >
              <Text className="font-semi text-label" style={{ color: on ? '#FFFFFF' : color.ink }}>
                {L(t.label, t.labelEn)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {reward.theme || (reward.studyBg && reward.studyBg !== DEFAULT_LOOK) ? (
        <View className="mt-4 flex-row flex-wrap items-center gap-3 rounded-card p-3.5" style={{ backgroundColor: '#F3F0FB', borderWidth: 1, borderColor: '#E9D7AE' }}>
          <BrandMark size={34} />
          <Text className="min-w-0 flex-1 font-semi text-body text-ink">
            {L(
              `Bạn đang dùng ${reward.theme && reward.studyBg && reward.studyBg !== DEFAULT_LOOK ? 'giao diện và nền học riêng' : reward.theme ? 'giao diện riêng' : 'nền học riêng'}. Món đã đổi vẫn giữ trong túi, dùng lại lúc nào cũng được.`,
              `You're using a ${reward.theme && reward.studyBg && reward.studyBg !== DEFAULT_LOOK ? 'custom theme and study background' : reward.theme ? 'custom theme' : 'custom study background'}. Items you've bought stay in your bag — use them again any time.`,
            )}
          </Text>
          <Button
            label={L('Về nền vàng kim mặc định', 'Back to the default gold look')}
            variant="brand"
            size="sm"
            onPress={() => {
              reward.equip('theme', null);
              reward.equip('studyBg', null);
              say(L('Đã về giao diện mặc định Band 9 — nền kem vàng kim.', 'Back to the default Band 9 look — cream and gold.'));
            }}
          />
        </View>
      ) : null}

      {ideas.now.length > 0 || ideas.next ? (
        <View className="mt-4 rounded-card border border-border bg-white p-3.5" style={{ gap: 8 }}>
          <View className="flex-row flex-wrap items-center gap-2">
            <View aria-hidden>
              <SealIcon name="sparkle" color="#F2B632" size={34} />
            </View>
            <Text className="font-heavy text-body text-ink">{L('Gợi ý đổi sao', 'Ideas for your stars')}</Text>
            {ideas.now.length > 0 ? (
              <View aria-hidden>
                <Motion kind="pop">
                  <Label text={L('Đủ sao rồi! ✨', 'You can afford it! ✨')} color="#22A06B" ink="#FFFFFF" tilt={-4} size={11} />
                </Motion>
              </View>
            ) : null}
          </View>
          {ideas.now.length > 0 ? (
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {ideas.now.map((i) => (
                <Pressable key={i.id} accessibilityRole="button" accessibilityLabel={L(`Đổi ${i.name}, ${i.price} sao`, `Get ${nm(i)}, ${i.price} stars`)} onPress={() => openIdea(i)} className="flex-row items-center rounded-pill border border-border px-3 py-2" style={{ gap: 6, ...TAB_MOTION }}>
                  <Text style={{ fontSize: 16 }}>{i.glyph}</Text>
                  <Text className="font-semi text-label text-ink">{nm(i)}</Text>
                  <Text className="font-sans text-label text-muted">⭐ {formatStars(i.price)}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text className="font-sans text-body text-muted">{L('Chưa đủ sao cho món nào mới — học thêm một buổi là có.', 'Not enough stars for anything new yet — one more study session will do it.')}</Text>
          )}
          {ideas.next ? (
            <Text className="font-sans text-label text-muted">
              {L(`Đích gần nhất: ${ideas.next.glyph} ${ideas.next.name} — còn thiếu ${formatStars(ideas.next.price - stars)} sao.`, `Next goal: ${ideas.next.glyph} ${nm(ideas.next)} — ${formatStars(ideas.next.price - stars)} more stars.`)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {note ? (
        <Appear key={note}>
          <View className="mt-4 flex-row items-start gap-2 rounded-card bg-primary-50 p-3" aria-live="polite">
            <Icon name="info" size={16} color={color.primary} />
            <Text className="flex-1 font-sans text-body text-ink">{note}</Text>
          </View>
        </Appear>
      ) : null}

      <CrossFade swapKey={tab}>
        <View>
          {shown.map((section, sectionIndex) => (
            <View key={section.kind}>
              <Appear index={sectionIndex + 1}>
                <SectionHeader className="mt-6" title={L(section.title, section.titleEn)} subtitle={L(section.subtitle, section.subtitleEn)} icon={section.icon} />
              </Appear>
              <View className="mt-3">
                <Grid columns={3} tabletColumns={3} mobileColumns={2} gap={14}>
                  {section.kind === 'theme' || section.kind === 'studyBg' ? (
                    <DefaultLookCard
                      what={section.kind === 'theme' ? 'Giao diện' : 'Nền học'}
                      active={section.kind === 'theme' ? !reward.theme : reward.studyBg === DEFAULT_LOOK || (!reward.studyBg && !reward.theme)}
                      onPress={() => {
                        // Nền học: ghi rõ 'mặc định' để Giao diện đang dùng không kéo nền theo màu của nó.
                        if (section.kind === 'theme') reward.equip('theme', null);
                        else reward.equip('studyBg', DEFAULT_LOOK);
                        say(section.kind === 'theme' ? L('Đã về giao diện mặc định Band 9.', 'Back to the default Band 9 theme.') : L('Đã về nền học mặc định Band 9 — kem vàng kim.', 'Back to the default Band 9 study background — cream and gold.'));
                      }}
                    />
                  ) : null}
                  {SHOP_ITEMS.filter((i) => i.kind === section.kind).map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      owned={reward.owned[item.id] ?? 0}
                      worn={worn.has(item.id)}
                      affordable={stars >= item.price}
                      confirming={confirm === item.id}
                      confirmNote={confirm === item.id ? passNote(item) : null}
                      bagCount={item.grants ? (bag[item.grants] ?? 0) : null}
                      skin={skin}
                      onPress={() => onPress(item)}
                      onConfirm={() => purchase(item)}
                      onCancel={() => setConfirm(null)}
                    />
                  ))}
                </Grid>
              </View>
              {section.note ? <Text className="mt-2 font-sans text-label text-muted">{L(section.note, section.noteEn ?? section.note)}</Text> : null}
            </View>
          ))}
        </View>
      </CrossFade>

      {freezeOwned.length > 0 ? (
        <Card className="mt-6">
          <SectionHeader
            title={L('Thẻ giữ chuỗi của bạn', 'Your streak freezes')}
            subtitle={L(`Chuỗi hiện tại: ${streak} ngày. Thẻ dùng cho những ngày trống gần nhất, không dùng cho hôm nay.`, `Current streak: ${streak} days. Freezes cover the most recent missed days, not today.`)}
            icon="flame"
            iconTone="warning"
          />
          <View className="mt-3 flex-row flex-wrap gap-2">
            {freezeOwned.map((item) => (
              <Button
                key={item.id}
                label={L(`Dùng ${item.name} (${reward.owned[item.id]})`, `Use ${nm(item)} (${reward.owned[item.id]})`)}
                variant="outline"
                size="sm"
                onPress={() => say(reward.spendFreeze(item.id) ? L('Đã giữ chuỗi cho ngày trống gần nhất.', 'Streak saved for your most recent missed day.') : L('Không có ngày trống nào cần giữ — chuỗi của bạn đang liền mạch.', 'No missed days to cover — your streak is unbroken.'))}
              />
            ))}
          </View>
        </Card>
      ) : null}

      <View className="h-6" />
      </View>
    </Screen>
  );
}

const TAB_MOTION = (Platform.OS === 'web' ? { transition: 'background-color 200ms ease, border-color 200ms ease' } : {}) as object;
const CARD_MOTION = (Platform.OS === 'web' ? { transition: 'border-color 180ms ease, box-shadow 180ms ease' } : {}) as object;

/**
 * Lựa chọn MẶC ĐỊNH (miễn phí) đứng đầu nhóm Nền học / Giao diện: bấm là bỏ
 * món đang dùng, về nền kem vàng kim của Band 9 (người dùng 01/10/2026: "thêm
 * cái nền mặc định có thể trở về như cũ").
 */
function DefaultLookCard({ what, active, onPress }: { what: 'Giao diện' | 'Nền học'; active: boolean; onPress: () => void }) {
  const { L } = useL();
  const sidebar = what === 'Giao diện';
  const whatEn = sidebar ? 'theme' : 'study background';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? L(`${what} mặc định Band 9, đang dùng`, `Default Band 9 ${whatEn}, in use`) : L(`Về ${what.toLowerCase()} mặc định Band 9`, `Back to the default Band 9 ${whatEn}`)}
      disabled={active}
      onPress={onPress}
      className="rounded-card bg-white p-3"
      style={{ borderWidth: active ? 2 : 1, borderColor: active ? themedHex('#8B6CF0') : '#E9DFC8', gap: 10, height: '100%' }}
    >
      {sidebar ? (
        // Xem trước THANH BÊN mặc định: nền kem, logo, một mục đang mở dải vàng kim.
        <View style={{ height: 96, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', backgroundColor: '#F3F0FB' }}>
          <View style={{ width: '46%', padding: 8, gap: 6, backgroundColor: '#F3F0FB', borderRightWidth: 1, borderRightColor: '#E9DFC8' }}>
            <BrandMark size={18} />
            <View style={{ height: 14, borderRadius: 7, ...(Platform.OS === 'web' ? ({ backgroundImage: 'linear-gradient(100deg, #C4B5FD 0%, #8B6CF0 45%, #6A4BD9 100%)' } as object) : { backgroundColor: themedHex('#8B6CF0') }) }} />
            <View style={{ height: 6, width: '70%', borderRadius: 3, backgroundColor: '#E2D6BD' }} />
            <View style={{ height: 6, width: '55%', borderRadius: 3, backgroundColor: '#E2D6BD' }} />
          </View>
        </View>
      ) : (
        <View style={{ height: 96, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F0FB' }}>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, ...(Platform.OS === 'web' ? ({ backgroundImage: 'linear-gradient(100deg, #C4B5FD 0%, #8B6CF0 45%, #6A4BD9 100%)' } as object) : { backgroundColor: themedHex('#8B6CF0') }) }} />
          <BrandMark size={44} />
        </View>
      )}
      <View>
        <Text className="font-heavy text-body text-ink">{L('Mặc định · Band 9', 'Default · Band 9')}</Text>
        <Text className="font-sans text-label text-muted">{sidebar ? L('Thanh bên vàng kim · miễn phí', 'Gold sidebar · free') : L('Nền kem vàng kim · miễn phí', 'Cream and gold · free')}</Text>
      </View>
      <View className="items-center rounded-pill py-1.5" style={{ backgroundColor: active ? '#F3F0FB' : themedHex('#8B6CF0') }}>
        <Text className="font-strong text-label" style={{ color: active ? '#2B2350' : '#0F1D33' }}>
          {active ? L('✓ Đang dùng', '✓ In use') : L('Dùng mặc định', 'Use default')}
        </Text>
      </View>
    </Pressable>
  );
}

function ItemCard({
  item,
  owned,
  worn,
  affordable,
  confirming,
  confirmNote,
  bagCount,
  skin,
  onPress,
  onConfirm,
  onCancel,
}: {
  item: ShopItem;
  owned: number;
  worn: boolean;
  affordable: boolean;
  confirming: boolean;
  confirmNote: string | null;
  bagCount: number | null;
  skin: SkinId;
  onPress: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { L, locale } = useL();
  const name = itemName(item, locale);
  const have = owned > 0 && !item.repeatable;
  const wornLabel = item.kind === 'mascot' ? L('Đang đồng hành', 'With you') : item.kind === 'skin' ? L('Đang mặc', 'Wearing') : item.kind === 'theme' ? L('Đang áp dụng', 'Applied') : L('Đang dùng', 'In use');
  return (
    <View
      style={{
        height: '100%',
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: worn ? '#F59E0B' : confirming ? color.primary : '#EEF0F6',
        opacity: !affordable && !have ? 0.6 : 1,
        ...CARD_MOTION,
      }}
    >
      {/* Nhãn dán góc thẻ: món đang đeo có dấu tích, món đủ sao có nhãn nhỏ. */}
      {worn ? (
        <View aria-hidden style={{ position: 'absolute', top: -8, right: 6, zIndex: 3, pointerEvents: 'none' }}>
          <SealBadge icon="check" color="#22A06B" size={28} />
        </View>
      ) : !have && affordable ? (
        <View aria-hidden style={{ position: 'absolute', top: -10, left: 8, zIndex: 3, pointerEvents: 'none' }}>
          <Label text={L('Đủ sao', 'Affordable')} color="#F2B632" ink="#2B2350" tilt={-6} size={10} />
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={have ? `${name} — ${worn ? wornLabel.toLowerCase() : L('đã có, bấm để dùng', 'owned, tap to use')}` : L(`${item.name} — ${item.price} sao`, `${name} — ${item.price} stars`)}
        aria-pressed={worn}
        onPress={onPress}
        style={{ flex: 1, padding: 12 }}
      >
        <Preview item={item} skin={skin} />
        <Text className="mt-2 text-center font-strong text-body text-ink" numberOfLines={2}>
          {name}
        </Text>
        <Text className="mt-0.5 text-center font-sans text-label text-muted" numberOfLines={3}>
          {item.mascot ? mascotPerk(MASCOTS[item.mascot], locale) : itemDetail(item, locale)}
        </Text>
        <View style={{ flex: 1 }} />
        <View className="mt-3 flex-row flex-wrap items-center justify-center gap-1.5">
          {worn ? (
            <Badge label={wornLabel} tone="warning" shape="tag" />
          ) : have ? (
            <Badge label={item.kind in SLOT ? L('Bấm để dùng', 'Tap to use') : L('Đã có', 'Owned')} tone="neutral" shape="tag" />
          ) : (
            <View className="flex-row items-center gap-1 rounded-pill px-2.5 py-1" style={{ backgroundColor: GOLD_SOFT }}>
              <Text style={{ fontSize: 12 }}>⭐</Text>
              <Text className="font-heavy text-label text-ink">{item.price === 0 ? L('Miễn phí', 'Free') : formatStars(item.price)}</Text>
            </View>
          )}
          {bagCount !== null ? <Text className="font-sans text-label text-muted">{L('Trong túi:', 'In bag:')} {bagCount}</Text> : null}
          {item.kind === 'freeze' && owned > 0 ? <Text className="font-sans text-label text-muted">{L('Đang có', 'Owned')} ×{owned}</Text> : null}
        </View>
      </Pressable>
      {confirming ? (
        <Appear>
          {confirmNote ? <Text className="px-3 pb-2 text-center font-sans text-label text-ink">{confirmNote}</Text> : null}
          <View className="flex-row gap-1.5 px-3 pb-3">
            <View style={{ flex: 1 }}>
              <Button label={L(`Đổi ${formatStars(item.price)} ⭐`, `Get for ${formatStars(item.price)} ⭐`)} size="sm" onPress={onConfirm} />
            </View>
            <Button label={L('Thôi', 'Cancel')} size="sm" variant="outline" onPress={onCancel} />
          </View>
        </Appear>
      ) : null}
    </View>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <View style={{ height: 84, borderRadius: 14, backgroundColor: NIGHT, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{children}</View>;
}

const THEME_PREVIEWS: Record<string, { bg: string; accent: string; text: string }> = {
  'theme-midnight': { bg: '#0A0F1D', accent: '#38BDF8', text: '#FFFFFF' },
  'theme-sakura': { bg: '#FFF0F5', accent: '#EC4899', text: '#831843' },
  'theme-cyberpunk': { bg: '#090D16', accent: '#00F2FE', text: '#FF007A' },
  'theme-ocean': { bg: '#061528', accent: '#06B6D4', text: '#E0F2FE' },
  'theme-sunset': { bg: '#1C102A', accent: '#F97316', text: '#FDE047' },
  'theme-lavender': { bg: '#FAF5FF', accent: '#A855F7', text: '#581C87' },
  'theme-nord': { bg: '#2E3440', accent: '#88C0D0', text: '#ECEFF4' },
  'theme-matcha': { bg: '#F2F7F2', accent: '#16A34A', text: '#14532D' },
  'theme-sepia': { bg: '#F3F0FB', accent: '#6A4BD9', text: '#2B2350' },
  'theme-emerald': { bg: '#06241D', accent: '#10B981', text: '#ECFDF5' },
};

function Preview({ item, skin }: { item: ShopItem; skin: SkinId }) {
  const { L } = useL();
  if (item.mascot) {
    const m = MASCOTS[item.mascot];
    return (
      <Stage>
        <View style={anim('rg-bob', 1200, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
          <PixelSprite name={m.look} color={m.color} size={60} />
        </View>
      </Stage>
    );
  }
  if (item.skin) {
    return (
      <Stage>
        <View style={anim('rg-bob', 1400, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
          <HeroSprite size={62} skin={item.skin} />
        </View>
      </Stage>
    );
  }
  if (item.avatarLook) {
    return (
      <View style={{ height: 84, alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedAvatar look={item.avatarLook} size={76} skin={skin} />
      </View>
    );
  }
  if (item.cover) {
    return (
      <View style={{ height: 84, borderRadius: 14, overflow: 'hidden' }}>
        <ProfileCover cover={item.cover} height={84} />
      </View>
    );
  }
  if (item.effect) {
    // Xem trước trên nền tối như thẻ hồ sơ thật, để hạt sáng nổi lên.
    return (
      <View style={{ height: 84, borderRadius: 14, overflow: 'hidden', backgroundColor: NIGHT }}>
        <ProfileEffect effect={item.effect} intensity={0.8} />
      </View>
    );
  }
  if (item.studyBg) {
    // Xem trước bằng chính nền đó, kèm một "thẻ bài học" trắng như màn học thật.
    const bg = STUDY_BACKGROUNDS[item.studyBg];
    return (
      <View style={{ height: 84, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(15,23,42,0.08)' }}>
        <GridBackdrop colors={bg.stops} line={bg.line} pattern={bg.pattern} blobs={bg.blobs} margin={bg.margin} cell={Math.round((bg.cell ?? 34) * 0.6)}>
          <View style={{ position: 'absolute', left: '22%', right: '22%', top: 16, bottom: 16, borderRadius: 8, backgroundColor: '#FFFFFF', padding: 7, gap: 4, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 6 }}>
            <View style={{ height: 5, width: '70%', borderRadius: 3, backgroundColor: '#CBD5E1' }} />
            <View style={{ height: 4, width: '92%', borderRadius: 3, backgroundColor: '#E2E8F0' }} />
            <View style={{ height: 4, width: '84%', borderRadius: 3, backgroundColor: '#E2E8F0' }} />
          </View>
        </GridBackdrop>
      </View>
    );
  }
  if (item.kind === 'theme') {
    const p = THEME_PREVIEWS[item.id] ?? { bg: '#F6F7FB', accent: color.primary, text: color.ink };
    return (
      <View
        style={{
          height: 84,
          borderRadius: 14,
          backgroundColor: p.bg,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
        }}
      >
        <View style={{ position: 'absolute', top: 8, left: 8, width: 12, height: 12, borderRadius: 6, backgroundColor: p.accent }} />
        <Text style={{ fontSize: 32 }}>{item.glyph}</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: p.text, marginTop: 2 }}>{L('Giao diện', 'Theme')}</Text>
      </View>
    );
  }
  return (
    <View style={{ height: 84, borderRadius: 14, backgroundColor: item.plan ? GOLD_SOFT : '#F6F7FB', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 40 }}>{item.glyph}</Text>
      {item.plan ? (
        <Text className="font-heavy text-label" style={{ color: '#6A4BD9' }}>
          {PLANS[item.plan.id].name} · {item.plan.days} {L('ngày', item.plan.days === 1 ? 'day' : 'days')}
        </Text>
      ) : null}
    </View>
  );
}
