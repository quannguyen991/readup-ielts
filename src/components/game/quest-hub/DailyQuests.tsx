/**
 * NHIỆM VỤ HÔM NAY dạng danh sách đánh dấu: ô trạng thái (chưa xong / xong chờ
 * nhận / đã nhận), tên, thưởng, thanh tiến độ và nút nhận. Dùng chung cho sảnh
 * game (/quest) và trang Nhân vật (/quest/hero) để hai nơi luôn giống nhau.
 *
 * Kèm `TodayStats`: số liệu thật của hôm nay; chưa làm câu nào thì tỉ lệ đúng
 * hiện "—" chứ không bịa 0%.
 */
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Label } from '@/components/illust/Sticker';
import { Motion } from '@/components/illust/CuteMore';
import { dailyQuests, EMPTY_DAY, ITEMS } from '@/services/game/rules';
import { dateKey } from '@/services/gamification/points';
import { useGameStore } from '@/store/useGameStore';
import { Bar, GAP, HUB, StatBox, WEB } from './kit';
import { useL } from '@/i18n/useL';
import { itemKindName, questTitle } from '@/components/game/game-labels';
import { ItemIcon } from '@/components/game/ItemIcon';

function useToday() {
  const g = useGameStore(useShallow((s) => ({ day: s.day, today: s.today, claimed: s.claimed, claimQuest: s.claimQuest })));
  const todayKey = dateKey(new Date());
  const today = g.day === todayKey ? g.today : EMPTY_DAY;
  const claimed = g.day === todayKey ? g.claimed : [];
  return { todayKey, today, claimed, claimQuest: g.claimQuest };
}

export function DailyQuests() {
  const { todayKey, today, claimed, claimQuest } = useToday();
  const quests = dailyQuests(todayKey);
  const doneCount = quests.filter((q) => claimed.includes(q.id)).length;
  const { L, locale } = useL();
  return (
    <View style={{ gap: GAP.sm }}>
      <Text className="font-semi" style={{ fontSize: 12, color: HUB.muted }}>
        {L(`Đã nhận ${doneCount}/${quests.length} · đổi nhiệm vụ mỗi ngày`, `Claimed ${doneCount}/${quests.length} · new quests every day`)}
      </Text>
      {quests.map((q) => {
        const value = Math.min(q.goal, today[q.metric]);
        const done = value >= q.goal;
        const got = claimed.includes(q.id);
        const ready = done && !got;
        const title = questTitle(q, locale);
        return (
          <View
            key={q.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: 16,
              padding: 12,
              backgroundColor: ready ? 'rgba(250,204,21,0.08)' : HUB.raised,
              borderWidth: 1,
              borderColor: ready ? 'rgba(250,204,21,0.45)' : 'transparent',
            }}
          >
            {/* Ô trạng thái */}
            <View
              aria-hidden
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: got ? HUB.green : ready ? HUB.gold : 'transparent',
                borderWidth: got || ready ? 0 : 2,
                borderColor: 'rgba(205, 193, 172,0.4)',
              }}
            >
              {got || ready ? (
                <Image source={{ uri: got ? '/icons/chest-open.png' : '/icons/chest-closed.png' }} resizeMode="contain" style={{ width: 28, height: 28 }} accessible={false} />
              ) : (
                <Text className="font-heavy" style={{ fontSize: 11, color: HUB.muted }}>
                  {Math.round((value / q.goal) * 100)}%
                </Text>
              )}
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text
                  className="font-strong"
                  style={{ fontSize: 14, color: got ? HUB.muted : HUB.ink, textDecorationLine: got ? 'line-through' : 'none' }}
                >
                  {title}
                </Text>
                {ready ? (
                  <View aria-hidden>
                    <Motion kind="pop">
                      <Label text={L('Xong!', 'Done!')} color={HUB.green} ink="#FFFFFF" tilt={-4} size={10} />
                    </Motion>
                  </View>
                ) : null}
              </View>
              <View style={{ marginTop: 7 }}>
                <Bar value={value / q.goal} color={done ? HUB.green : HUB.blue} height={6} label={`${title}: ${value}/${q.goal}`} />
              </View>
              <View style={{ marginTop: 5, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 8, rowGap: 2 }}>
                <Text className="font-semi" style={{ fontSize: 12, color: got ? HUB.green : HUB.muted, fontVariant: ['tabular-nums'] }}>
                  {got ? L('Đã nhận thưởng', 'Reward claimed') : `${value}/${q.goal}${done ? L(' · xong, bấm Nhận', ' · done, tap Claim') : ''}`}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text className="font-semi" style={{ fontSize: 12, color: got ? HUB.faint : HUB.amber }}>
                    {`+${q.rewardXp} XP`}
                  </Text>
                  {q.rewardItem ? (
                    <>
                      <Text className="font-semi" style={{ fontSize: 12, color: got ? HUB.faint : HUB.amber }}>·</Text>
                      <ItemIcon kind={q.rewardItem} size={16} />
                      <Text className="font-semi" style={{ fontSize: 12, color: got ? HUB.faint : HUB.amber }}>
                        {itemKindName(q.rewardItem, ITEMS[q.rewardItem].name, locale)}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Chỉ hiện nút khi có thưởng để nhận; trạng thái khác đã nằm ở ô bên trái và dòng số. */}
            {ready ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={L(`Nhận thưởng: ${q.title}`, `Claim reward: ${title}`)}
                onPress={() => claimQuest(q.id)}
                style={({ hovered }: { hovered?: boolean }) => ({
                  alignItems: 'center',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  backgroundColor: hovered ? HUB.goldHover : HUB.gold,
                  ...(WEB ? ({ backgroundImage: 'linear-gradient(135deg, #F5B8CA 0%, #D95D83 100%)', boxShadow: '0 3px 0 rgba(174,65,101,0.2), inset 0 1px 0 rgba(255,255,255,0.45)' } as object) : null),
                  ...(WEB ? ({ transition: 'background-color 150ms ease' } as object) : null),
                })}
              >
                <Text className="font-strong" style={{ fontSize: 13, color: HUB.ctaInk }}>
                  {L('Nhận', 'Claim')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** Tổng kết hôm nay — chỉ số đo thật trong ngày. */
export function TodayStats() {
  const { today } = useToday();
  const accuracy = today.answers > 0 ? `${Math.round((today.correct / today.answers) * 100)}%` : '—';
  const { L, en } = useL();
  const num = (n: number) => n.toLocaleString(en ? 'en-US' : 'vi-VN');
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatBox value={num(today.correct)} label={L('câu đúng', 'correct')} />
        <StatBox value={accuracy} label={L('tỉ lệ đúng', 'accuracy')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatBox value={`+${num(today.xp)}`} label={L('XP kiếm được', 'XP earned')} tone={HUB.gold} />
        <StatBox value={today.bestCombo > 0 ? `×${today.bestCombo}` : '—'} label={L('combo cao nhất', 'best combo')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatBox value={String(today.defeated)} label={L('quái đã hạ', 'monsters defeated')} />
        <StatBox value={String(today.vocab)} label={L('lượt ôn từ', 'word reviews')} />
      </View>
    </View>
  );
}
