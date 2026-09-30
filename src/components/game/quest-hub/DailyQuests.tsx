/**
 * NHIỆM VỤ HÔM NAY dạng danh sách đánh dấu: ô trạng thái (chưa xong / xong chờ
 * nhận / đã nhận), tên, thưởng, thanh tiến độ và nút nhận. Dùng chung cho sảnh
 * game (/quest) và trang Nhân vật (/quest/hero) để hai nơi luôn giống nhau.
 *
 * Kèm `TodayStats`: số liệu thật của hôm nay; chưa làm câu nào thì tỉ lệ đúng
 * hiện "—" chứ không bịa 0%.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Label } from '@/components/illust/Sticker';
import { Motion } from '@/components/illust/CuteMore';
import { Icon } from '@/components/ui/Icon';
import { dailyQuests, EMPTY_DAY, ITEMS } from '@/services/game/rules';
import { dateKey } from '@/services/gamification/points';
import { useGameStore } from '@/store/useGameStore';
import { Bar, GAP, HUB, StatBox, WEB } from './kit';

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
  return (
    <View style={{ gap: GAP.sm }}>
      <Text className="font-semi" style={{ fontSize: 12, color: HUB.muted }}>
        Đã nhận {doneCount}/{quests.length} · đổi nhiệm vụ mỗi ngày
      </Text>
      {quests.map((q) => {
        const value = Math.min(q.goal, today[q.metric]);
        const done = value >= q.goal;
        const got = claimed.includes(q.id);
        const ready = done && !got;
        const reward = `+${q.rewardXp} XP${q.rewardItem ? ` · ${ITEMS[q.rewardItem].glyph} ${ITEMS[q.rewardItem].name}` : ''}`;
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
                borderColor: 'rgba(169,185,208,0.4)',
              }}
            >
              {got ? (
                <Icon name="check" size={18} color="#FFFFFF" strokeWidth={3} />
              ) : ready ? (
                <Icon name="gift" size={17} color={HUB.ctaInk} strokeWidth={2.4} />
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
                  {q.title}
                </Text>
                {ready ? (
                  <View aria-hidden>
                    <Motion kind="pop">
                      <Label text="Xong!" color={HUB.green} ink="#FFFFFF" tilt={-4} size={10} />
                    </Motion>
                  </View>
                ) : null}
              </View>
              <View style={{ marginTop: 7 }}>
                <Bar value={value / q.goal} color={done ? HUB.green : HUB.blue} height={6} label={`${q.title}: ${value}/${q.goal}`} />
              </View>
              <View style={{ marginTop: 5, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 8, rowGap: 2 }}>
                <Text className="font-semi" style={{ fontSize: 12, color: got ? HUB.green : HUB.muted, fontVariant: ['tabular-nums'] }}>
                  {got ? 'Đã nhận thưởng' : `${value}/${q.goal}${done ? ' · xong, bấm Nhận' : ''}`}
                </Text>
                <Text className="font-semi" style={{ fontSize: 12, color: got ? HUB.faint : HUB.amber }}>
                  {reward}
                </Text>
              </View>
            </View>

            {/* Chỉ hiện nút khi có thưởng để nhận; trạng thái khác đã nằm ở ô bên trái và dòng số. */}
            {ready ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Nhận thưởng: ${q.title}`}
                onPress={() => claimQuest(q.id)}
                style={({ hovered }: { hovered?: boolean }) => ({
                  alignItems: 'center',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  backgroundColor: hovered ? HUB.goldHover : HUB.gold,
                  ...(WEB ? ({ transition: 'background-color 150ms ease' } as object) : null),
                })}
              >
                <Text className="font-strong" style={{ fontSize: 13, color: HUB.ctaInk }}>
                  Nhận
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
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatBox value={today.correct.toLocaleString('vi-VN')} label="câu đúng" />
        <StatBox value={accuracy} label="tỉ lệ đúng" />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatBox value={`+${today.xp.toLocaleString('vi-VN')}`} label="XP kiếm được" tone={HUB.gold} />
        <StatBox value={today.bestCombo > 0 ? `×${today.bestCombo}` : '—'} label="combo cao nhất" />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatBox value={String(today.defeated)} label="quái đã hạ" />
        <StatBox value={String(today.vocab)} label="lượt ôn từ" />
      </View>
    </View>
  );
}
