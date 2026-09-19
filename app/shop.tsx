import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon, SectionHeader } from '@/components/ui';
import { currentStreak, lifetimePoints } from '@/services/gamification/points';
import { SHOP_ITEMS, balanceOf, type ShopItem } from '@/services/gamification/shop';
import { useRewardStore } from '@/store/useRewardStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';

/**
 * Cửa hàng đổi điểm.
 *
 * KHÔNG BÁN NỘI DUNG HỌC. Ở đây chỉ có avatar, nền đọc và thẻ giữ chuỗi — xem
 * lý do ở `services/gamification/shop.ts`. Bài đọc, đề thi và lời giải không
 * bao giờ nằm sau đồng xu.
 *
 * GIÁ HIỆN NGAY CẠNH SỐ DƯ, và món không đủ tiền thì mờ đi kèm câu "còn thiếu
 * bao nhiêu" — chứ không phải bấm vào rồi mới báo lỗi.
 */
export default function ShopScreen() {
  const daily = useStudyStore((s) => s.daily);
  const { owned, spent, avatar, frozenDays, buy, equipAvatar, spendFreeze } = useRewardStore();
  const [note, setNote] = useState<string | null>(null);

  const earned = useMemo(() => lifetimePoints(daily, frozenDays), [daily, frozenDays]);
  const coins = balanceOf(earned, spent);
  const streak = currentStreak(daily, new Date(), frozenDays);

  const groups: { key: ShopItem['kind']; title: string; subtitle: string }[] = [
    { key: 'freeze', title: 'Vật phẩm', subtitle: 'Giữ chuỗi những ngày bạn không kịp học' },
    { key: 'avatar', title: 'Bộ sưu tập avatar', subtitle: 'Hiện ở thẻ hạng và bảng xếp hạng' },
    { key: 'theme', title: 'Giao diện', subtitle: 'Thêm tông giấy cho màn đọc' },
  ];

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
          <Text className="font-heavy text-pageTitle text-ink">Cửa hàng</Text>
          <View className="flex-1" />
          <View className="flex-row items-center gap-1.5 rounded-pill border border-warning-soft bg-warning-soft px-3.5 py-2">
            <Text style={{ fontSize: 15 }}>🪙</Text>
            <Text className="font-heavy text-body text-ink">{coins}</Text>
          </View>
        </View>
        <Text className="mt-1 font-sans text-body text-muted">
          Xu kiếm bằng thời gian học: 1 điểm mỗi phút, 0,5 điểm mỗi câu — tổng cộng bạn đã kiếm{' '}
          {Math.round(earned)} xu và tiêu {spent}.
        </Text>
      </Appear>

      {note ? (
        <Appear>
          <View className="mt-4 flex-row items-start gap-2 rounded-card bg-primary-50 p-3">
            <Icon name="info" size={16} color={color.primary} />
            <Text className="flex-1 font-sans text-body text-ink">{note}</Text>
          </View>
        </Appear>
      ) : null}

      {groups.map((group, groupIndex) => {
        const items = SHOP_ITEMS.filter((i) => i.kind === group.key);
        return (
          <View key={group.key}>
            <Appear index={groupIndex + 1}>
              <SectionHeader
                className="mt-6"
                title={group.title}
                subtitle={group.subtitle}
                icon={group.key === 'freeze' ? 'sparkle' : group.key === 'avatar' ? 'heart' : 'book'}
              />
            </Appear>

            <View className="mt-3">
              <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={14}>
                {items.map((item) => {
                  const count = owned[item.id] ?? 0;
                  const isOwned = !item.repeatable && count > 0;
                  const affordable = coins >= item.price;
                  const equipped = avatar === item.id;

                  return (
                    <PressScale
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name} — ${item.price} xu`}
                      style={{ height: '100%' }}
                      onPress={() => {
                        if (isOwned && item.kind === 'avatar') {
                          equipAvatar(equipped ? null : item.id);
                          setNote(equipped ? `Đã bỏ đeo ${item.name}.` : `Đang đeo ${item.name}.`);
                          return;
                        }
                        if (isOwned) {
                          setNote(`Bạn đã có ${item.name}.`);
                          return;
                        }
                        const result = buy(item.id, coins);
                        setNote(
                          result.ok
                            ? `Đã mua ${item.name}. Còn ${coins - item.price} xu.`
                            : result.reason === 'không-đủ-xu'
                              ? `Còn thiếu ${item.price - coins} xu cho ${item.name}.`
                              : `Không mua được ${item.name}.`,
                        );
                      }}
                    >
                      <Card
                        className="h-full items-center"
                        style={!affordable && !isOwned ? { opacity: 0.55 } : undefined}
                      >
                        <Text style={{ fontSize: 40 }}>{item.glyph}</Text>
                        <Text className="mt-2 text-center font-strong text-body text-ink" numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text className="mt-0.5 text-center font-sans text-label text-muted" numberOfLines={2}>
                          {item.detail}
                        </Text>
                        <View className="flex-1" />
                        <View className="mt-3 flex-row items-center gap-1.5">
                          {equipped ? (
                            <Badge label="Đang đeo" tone="success" shape="tag" />
                          ) : isOwned ? (
                            <Badge label={item.kind === 'avatar' ? 'Bấm để đeo' : 'Đã có'} tone="neutral" shape="tag" />
                          ) : (
                            <View className="flex-row items-center gap-1 rounded-pill bg-warning-soft px-2.5 py-1">
                              <Text style={{ fontSize: 12 }}>🪙</Text>
                              <Text className="font-heavy text-label text-ink">{item.price}</Text>
                            </View>
                          )}
                          {item.repeatable && count > 0 ? (
                            <Text className="font-sans text-label text-muted">×{count}</Text>
                          ) : null}
                        </View>
                      </Card>
                    </PressScale>
                  );
                })}
              </Grid>
            </View>
          </View>
        );
      })}

      {/* Dùng thẻ đã mua */}
      {SHOP_ITEMS.filter((i) => i.kind === 'freeze' && (owned[i.id] ?? 0) > 0).length > 0 ? (
        <Card className="mt-6">
          <SectionHeader
            title="Thẻ giữ chuỗi của bạn"
            subtitle={`Chuỗi hiện tại: ${streak} ngày. Thẻ dùng cho những ngày trống gần nhất, không dùng cho hôm nay.`}
            icon="flame"
            iconTone="warning"
          />
          <View className="mt-3 flex-row flex-wrap gap-2">
            {SHOP_ITEMS.filter((i) => i.kind === 'freeze' && (owned[i.id] ?? 0) > 0).map((item) => (
              <Button
                key={item.id}
                label={`Dùng ${item.name} (${owned[item.id]})`}
                variant="outline"
                size="sm"
                onPress={() => {
                  const ok = spendFreeze(item.id);
                  setNote(
                    ok
                      ? 'Đã giữ chuỗi cho ngày trống gần nhất.'
                      : 'Không có ngày trống nào cần giữ — chuỗi của bạn đang liền mạch.',
                  );
                }}
              />
            ))}
          </View>
        </Card>
      ) : null}

      <View className="h-6" />
    </Screen>
  );
}
