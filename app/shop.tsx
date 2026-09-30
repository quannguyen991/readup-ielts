import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { GridBackdrop } from '@/components/layout/GridBackdrop';
import { STUDY_BACKGROUNDS } from '@/components/layout/study-backgrounds';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { PixelSprite } from '@/components/game/PixelSprite';
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
import { SHOP_ITEMS, formatStars, spendIdeas, type ShopItem, type ShopItemKind } from '@/services/gamification/shop';
import { useBillingStore } from '@/store/useBillingStore';
import { useGameStore } from '@/store/useGameStore';
import { skinOf, useRewardStore, type WearSlot } from '@/store/useRewardStore';
import { useStarBalance } from '@/store/useStarBalance';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';

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
type Section = { kind: ShopItemKind; title: string; subtitle: string; icon: IconName; note?: string };

const SECTIONS: Section[] = [
  {
    kind: 'plan',
    title: 'Vé gói học',
    subtitle: 'Vé có hạn, đổi thêm cùng gói là cộng dồn ngày.',
    icon: 'trophy',
    note: 'Vé mở nội dung trên máy này, giống bản dùng thử. Lượt gọi AI (chấm Writing, trợ giảng) vẫn tính theo gói của tài khoản — vé không cộng thêm lượt AI.',
  },
  {
    kind: 'mascot',
    title: 'Linh vật đồng hành',
    subtitle: 'Đi cùng nhân vật trong trận, giúp theo cách riêng.',
    icon: 'heart',
    note: 'Mỗi lúc chỉ đi cùng một con. Linh vật chỉ giúp — bỏ bớt đáp án sai, đỡ câu sai, hồi tim, chém mạnh hơn — không con nào làm bài hộ.',
  },
  { kind: 'skin', title: 'Skin nhân vật', subtitle: 'Bộ đồ cho nhân vật trên thanh trận đấu.', icon: 'shield' },
  { kind: 'avatarAnim', title: 'Avatar động', subtitle: 'Hiện ở hồ sơ, thanh bên và bảng xếp hạng.', icon: 'sparkle' },
  { kind: 'cover', title: 'Bìa hồ sơ chuyển động', subtitle: 'Đầu trang Hồ sơ và thẻ trên bảng xếp hạng.', icon: 'star' },
  {
    kind: 'effect',
    title: 'Hiệu ứng hồ sơ',
    subtitle: 'Lớp hoạt hình phủ cả thẻ hồ sơ — như Profile Effects của Discord.',
    icon: 'sparkle',
    note: 'Hiện ở trang Hồ sơ và ở thẻ top 3 trên bảng xếp hạng. Chỉ để đẹp, không cộng gì vào bài.',
  },
  { kind: 'powerup', title: 'Đồ chiến đấu', subtitle: 'Vào thẳng túi đồ, dùng ngay trong bài.', icon: 'shield' },
  { kind: 'freeze', title: 'Thẻ giữ chuỗi', subtitle: 'Giữ chuỗi cho ngày không kịp học.', icon: 'flame' },
  { kind: 'avatar', title: 'Avatar emoji', subtitle: 'Gọn, nhẹ, hiện ở mọi nơi.', icon: 'heart' },
  {
    kind: 'studyBg',
    title: 'Nền học',
    subtitle: 'Nền phía sau mọi màn học — đọc bài, làm bài, luyện nghe, tra từ.',
    icon: 'book',
    note: 'Đổi rồi bấm "Dùng" để áp dụng; bấm lần nữa là về nền lưới mặc định. Nền được lưu theo tài khoản — lần sau vào (kể cả máy khác) vẫn đang dùng đúng nền đó.',
  },
  {
    kind: 'furniture',
    title: 'Nội thất nhà bạn',
    subtitle: 'Bày trong ngôi nhà của bạn ở Thành phố Tri thức.',
    icon: 'heart',
    note: 'Mua bao nhiêu món thì bày được bấy nhiêu. Vào nhà bằng cách cho nhân vật đi dạo tới cửa một ngôi nhà đã xây xong, hoặc bấm "Nhà của tôi" trong Thành phố Tri thức (trên máy tính).',
  },
  {
    kind: 'theme',
    title: 'Giao diện toàn diện',
    subtitle: 'Đổi phong cách, bảng màu thanh bên và màn hình.',
    icon: 'book',
    note: 'Đổi và bấm áp dụng để thay đổi diện mạo thanh bên cùng bầu không khí học tập.',
  },
];

type TabKey = 'all' | 'furniture' | 'studyBg' | 'theme' | 'effect' | 'cover' | 'plan' | 'avatarAnim' | 'mascot' | 'skin' | 'battle';

const TABS: { key: TabKey; label: string; kinds: ShopItemKind[] }[] = [
  { key: 'all', label: 'Tất cả', kinds: SECTIONS.map((s) => s.kind) },
  { key: 'studyBg', label: 'Nền học 🖼️', kinds: ['studyBg'] },
  { key: 'furniture', label: 'Nội thất 🛋️', kinds: ['furniture'] },
  { key: 'theme', label: 'Giao diện 🎨', kinds: ['theme'] },
  { key: 'effect', label: 'Hiệu ứng ✨', kinds: ['effect'] },
  { key: 'cover', label: 'Bìa hồ sơ', kinds: ['cover'] },
  { key: 'plan', label: 'Vé gói', kinds: ['plan'] },
  { key: 'avatarAnim', label: 'Avatar', kinds: ['avatarAnim', 'avatar'] },
  { key: 'mascot', label: 'Linh vật', kinds: ['mascot'] },
  { key: 'skin', label: 'Skin', kinds: ['skin'] },
  { key: 'battle', label: 'Đồ & thẻ', kinds: ['powerup', 'freeze'] },
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
const GOLD_SOFT = '#FEF3C7';

export default function ShopScreen() {
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
  const planUntil = activePlan !== 'free' && billingExpires ? new Date(billingExpires).toLocaleDateString('vi-VN') : null;

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
      ? 'Bạn đang dùng gói trả phí, vé đổi sao không cộng vào gói đó. Để dành sao cho linh vật hay skin nhé.'
      : 'Bạn đang có gói cao hơn vé này — đổi lúc này thì phí sao.';
  const passNote = (item: ShopItem): string | null => {
    const r = previewPass(item);
    if (!r || !r.ok) return null;
    const until = new Date(r.expiresAt).toLocaleDateString('vi-VN');
    // Đang có gói thấp hơn còn hạn: vé mới THAY gói đó, ngày còn lại không cộng sang.
    const replaces = activePlan !== 'free' && activePlan !== r.plan && planUntil ? ` Gói ${PLANS[activePlan].name} đang dùng (tới ${planUntil}) sẽ được thay bằng ${PLANS[r.plan].name}.` : '';
    return `Mở ${PLANS[r.plan].name} tới hết ngày ${until}.${replaces}`;
  };

  const purchase = (item: ShopItem) => {
    if (stars < item.price) return say(`Còn thiếu ${formatStars(item.price - stars)} sao cho ${item.name}. Học thêm là có.`);

    if (item.plan) {
      const pass = previewPass(item);
      if (!pass) return say(`Không đổi được ${item.name}.`);
      if (!pass.ok) return say(refusal(pass));
      if (!reward.buy(item.id, stars).ok) return say(`Không đổi được ${item.name}.`);
      useBillingStore.getState().setPlanLocally(pass.plan, pass.expiresAt);
      return say(`Đã mở gói ${PLANS[pass.plan].name} tới hết ngày ${new Date(pass.expiresAt).toLocaleDateString('vi-VN')}. Còn ${formatStars(stars - item.price)} sao.`);
    }

    const res = reward.buy(item.id, stars);
    if (!res.ok) return say(res.reason === 'đã-sở-hữu' ? `Bạn đã có ${item.name}.` : `Không đổi được ${item.name}.`);
    if (item.grants) useGameStore.getState().addItem(item.grants, 1);
    const slot = SLOT[item.kind];
    if (slot) useRewardStore.getState().equip(slot, item.id);
    say(`Đã đổi ${item.name}${slot ? ' và đeo luôn' : item.grants ? ' — đã vào túi đồ' : ''}. Còn ${formatStars(stars - item.price)} sao.`);
  };

  const onPress = (item: ShopItem) => {
    const have = !item.repeatable && (reward.owned[item.id] ?? 0) > 0;
    const slot = SLOT[item.kind];
    if (have && slot) {
      const on = worn.has(item.id);
      reward.equip(slot, on ? null : item.id);
      return say(on ? `Đã bỏ ${item.name}.` : `Đang dùng ${item.name}.`);
    }
    if (have) return say(`Bạn đã có ${item.name}.`);
    // Vé không đổi được (đang có gói trả phí / gói cao hơn) thì nói ngay, không mở hộp xác nhận.
    const pass = previewPass(item);
    if (pass && !pass.ok) return say(refusal(pass));
    if (stars < item.price) return say(`Còn thiếu ${formatStars(item.price - stars)} sao cho ${item.name}. Học thêm là có.`);
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
    <Screen>
      <Appear>
        <View className="flex-row flex-wrap items-center gap-3">
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Về trang Xếp hạng"
            onPress={() => router.push('/leaderboard' as never)}
            className="h-9 w-9 items-center justify-center rounded-pill border border-border"
          >
            <Icon name="chevron-left" size={17} color={color.muted} strokeWidth={2.2} />
          </Pressable>
          <Text className="font-heavy text-pageTitle text-ink">Đổi quà</Text>
          <View className="flex-1" />
          <Button label="Hồ sơ của tôi" variant="outline" size="sm" iconLeft="star" onPress={() => router.push('/profile' as never)} />
          <View className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-2" style={{ backgroundColor: GOLD_SOFT }} accessibilityLabel={`Đang có ${stars} sao`}>
            <Text style={{ fontSize: 15 }}>⭐</Text>
            <Text className="font-heavy text-body text-ink">{formatStars(stars)}</Text>
          </View>
        </View>
        <Text className="mt-1 font-sans text-body text-muted">
          Sao chỉ đến từ việc học: 1 sao mỗi phút, 0,5 sao mỗi câu (tối đa {dailyCapFor(dateKey(today))} sao/ngày{inPromo(dateKey(today)) ? ' — đang mùa sao ×2 tới hết 30/10' : ''}, chuỗi dài được nhân thêm), cộng sao thưởng khi hạ quái, lên cấp, xong nhiệm vụ.
          {planUntil ? ` Gói đang dùng: ${PLANS[activePlan].name} tới ${planUntil}.` : ''}
        </Text>
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
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {ideas.now.length > 0 || ideas.next ? (
        <View className="mt-4 rounded-card border border-border bg-white p-3.5" style={{ gap: 8 }}>
          <Text className="font-heavy text-body text-ink">💡 Gợi ý đổi sao</Text>
          {ideas.now.length > 0 ? (
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {ideas.now.map((i) => (
                <Pressable key={i.id} accessibilityRole="button" accessibilityLabel={`Đổi ${i.name}, ${i.price} sao`} onPress={() => openIdea(i)} className="flex-row items-center rounded-pill border border-border px-3 py-2" style={{ gap: 6, ...TAB_MOTION }}>
                  <Text style={{ fontSize: 16 }}>{i.glyph}</Text>
                  <Text className="font-semi text-label text-ink">{i.name}</Text>
                  <Text className="font-sans text-label text-muted">⭐ {formatStars(i.price)}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text className="font-sans text-body text-muted">Chưa đủ sao cho món nào mới — học thêm một buổi là có.</Text>
          )}
          {ideas.next ? (
            <Text className="font-sans text-label text-muted">
              Đích gần nhất: {ideas.next.glyph} {ideas.next.name} — còn thiếu {formatStars(ideas.next.price - stars)} sao.
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
                <SectionHeader className="mt-6" title={section.title} subtitle={section.subtitle} icon={section.icon} />
              </Appear>
              <View className="mt-3">
                <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={14}>
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
              {section.note ? <Text className="mt-2 font-sans text-label text-muted">{section.note}</Text> : null}
            </View>
          ))}
        </View>
      </CrossFade>

      {freezeOwned.length > 0 ? (
        <Card className="mt-6">
          <SectionHeader
            title="Thẻ giữ chuỗi của bạn"
            subtitle={`Chuỗi hiện tại: ${streak} ngày. Thẻ dùng cho những ngày trống gần nhất, không dùng cho hôm nay.`}
            icon="flame"
            iconTone="warning"
          />
          <View className="mt-3 flex-row flex-wrap gap-2">
            {freezeOwned.map((item) => (
              <Button
                key={item.id}
                label={`Dùng ${item.name} (${reward.owned[item.id]})`}
                variant="outline"
                size="sm"
                onPress={() => say(reward.spendFreeze(item.id) ? 'Đã giữ chuỗi cho ngày trống gần nhất.' : 'Không có ngày trống nào cần giữ — chuỗi của bạn đang liền mạch.')}
              />
            ))}
          </View>
        </Card>
      ) : null}

      <View className="h-6" />
    </Screen>
  );
}

const TAB_MOTION = (Platform.OS === 'web' ? { transition: 'background-color 200ms ease, border-color 200ms ease' } : {}) as object;
const CARD_MOTION = (Platform.OS === 'web' ? { transition: 'border-color 180ms ease, box-shadow 180ms ease' } : {}) as object;

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
  const have = owned > 0 && !item.repeatable;
  const wornLabel = item.kind === 'mascot' ? 'Đang đồng hành' : item.kind === 'skin' ? 'Đang mặc' : item.kind === 'theme' ? 'Đang áp dụng' : 'Đang dùng';
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={have ? `${item.name} — ${worn ? wornLabel.toLowerCase() : 'đã có, bấm để dùng'}` : `${item.name} — ${item.price} sao`}
        aria-pressed={worn}
        onPress={onPress}
        style={{ flex: 1, padding: 12 }}
      >
        <Preview item={item} skin={skin} />
        <Text className="mt-2 text-center font-strong text-body text-ink" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="mt-0.5 text-center font-sans text-label text-muted" numberOfLines={3}>
          {item.mascot ? MASCOTS[item.mascot].perk : item.detail}
        </Text>
        <View style={{ flex: 1 }} />
        <View className="mt-3 flex-row flex-wrap items-center justify-center gap-1.5">
          {worn ? (
            <Badge label={wornLabel} tone="warning" shape="tag" />
          ) : have ? (
            <Badge label={item.kind in SLOT ? 'Bấm để dùng' : 'Đã có'} tone="neutral" shape="tag" />
          ) : (
            <View className="flex-row items-center gap-1 rounded-pill px-2.5 py-1" style={{ backgroundColor: GOLD_SOFT }}>
              <Text style={{ fontSize: 12 }}>⭐</Text>
              <Text className="font-heavy text-label text-ink">{formatStars(item.price)}</Text>
            </View>
          )}
          {bagCount !== null ? <Text className="font-sans text-label text-muted">Trong túi: {bagCount}</Text> : null}
          {item.kind === 'freeze' && owned > 0 ? <Text className="font-sans text-label text-muted">Đang có ×{owned}</Text> : null}
        </View>
      </Pressable>
      {confirming ? (
        <Appear>
          {confirmNote ? <Text className="px-3 pb-2 text-center font-sans text-label text-ink">{confirmNote}</Text> : null}
          <View className="flex-row gap-1.5 px-3 pb-3">
            <View style={{ flex: 1 }}>
              <Button label={`Đổi ${formatStars(item.price)} ⭐`} size="sm" onPress={onConfirm} />
            </View>
            <Button label="Thôi" size="sm" variant="outline" onPress={onCancel} />
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
  'theme-sepia': { bg: '#FAF6ED', accent: '#B45309', text: '#451A03' },
  'theme-emerald': { bg: '#06241D', accent: '#10B981', text: '#ECFDF5' },
};

function Preview({ item, skin }: { item: ShopItem; skin: SkinId }) {
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
          <PixelSprite name="hero" size={62} skin={item.skin} />
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
        <Text style={{ fontSize: 11, fontWeight: '700', color: p.text, marginTop: 2 }}>Giao diện</Text>
      </View>
    );
  }
  return (
    <View style={{ height: 84, borderRadius: 14, backgroundColor: item.plan ? GOLD_SOFT : '#F6F7FB', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 40 }}>{item.glyph}</Text>
      {item.plan ? (
        <Text className="font-heavy text-label" style={{ color: '#92400E' }}>
          {PLANS[item.plan.id].name} · {item.plan.days} ngày
        </Text>
      ) : null}
    </View>
  );
}
