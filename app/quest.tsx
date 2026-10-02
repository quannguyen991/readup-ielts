import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { ensureGameKeyframes } from '@/components/game/game-anim';
import { DailyQuests, TodayStats } from '@/components/game/quest-hub/DailyQuests';
import { ExploreTiles } from '@/components/game/quest-hub/ExploreTiles';
import { TravelHero } from '@/components/game/quest-hub/TravelHero';
import { Cols, Eyebrow, GAP, HUB, Panel, SectionHeader, useBoxWidth, WEB } from '@/components/game/quest-hub/kit';
import { SealIcon } from '@/components/illust/HeroArt';
import { useL } from '@/i18n/useL';
import { CRIT_EVERY, ENEMIES, XP_CORRECT } from '@/services/game/rules';
import { useGameStore } from '@/store/useGameStore';
import { useCityAvailable } from '@/services/city/availability';
import { QuestCityHero } from '@/components/city/QuestCityHero';
import { QuestJourneyHero } from '@/components/rail/QuestJourneyHero';

/**
 * BAND 9 QUEST — SẢNH GAME KHI HỌC.
 *
 * Không có màn chơi riêng: ở mọi màn học, trả lời đúng là một nhát chém vào con
 * quái đang chặn đường, sai thì quái đánh lại (`services/game/rules.ts`).
 *
 * 02/10/2026 người dùng: "chơi cái map du ngoạn thế giới, ghim ở phần quest, bỏ cái
 * vào trận đi". Nên đầu trang là THẺ GHIM Du ngoạn Band 9 (bản đồ thế giới + nút
 * "Du ngoạn"), và thẻ trận đấu + nút "Vào trận" / "Học tiếp" + lưới "Chọn mảng để
 * vào trận" đã gỡ khỏi trang này. Các route `/quest/pick` và `BattleHud` vẫn còn
 * (màn khác dùng lại), chỉ không được đưa lên /quest nữa. Từ trên xuống:
 *   1. DU NGOẠN BAND 9 — thẻ ghim.
 *   2. THÀNH PHỐ TRI THỨC (chỉ máy tính) và CHUYẾN BAY TỪ VỰNG.
 *   3. HÔM NAY — nhiệm vụ ngày + số liệu thật hôm nay.
 *   4. KHÁM PHÁ — các khu chơi khác.
 *   5. LUẬT TRONG 20 GIÂY.
 * Mọi khối dùng chung bộ thẻ `components/game/quest-hub/kit`.
 *
 * Quest cũ (các khu Iron Frontier, Fjord of Runes… với trận đánh riêng bằng câu
 * SAT) đã bỏ hẳn ngày 24/09/2026 — đừng dựng lại bản đồ trận riêng.
 */

const MAX_W = 1280;

export default function QuestHome() {
  useEffect(ensureGameKeyframes, []);
  const { L } = useL();
  const cityAvailable = useCityAvailable();
  const enabled = useGameStore((s) => s.enabled);
  const setEnabled = useGameStore((s) => s.setEnabled);
  const [w, onLayout] = useBoxWidth();
  const wide = w >= 900;

  return (
    <Screen>
      <View onLayout={onLayout} style={{ width: '100%', maxWidth: MAX_W, alignSelf: 'center', paddingBottom: 28 }}>
        {/* 0. Du ngoạn Band 9 — thẻ ghim */}
        <Appear>
          <View style={{ marginBottom: GAP.md }}>
            <TravelHero />
          </View>
        </Appear>

        {/* 1. Thành phố Tri thức (chỉ máy tính) (01/10/2026: "để cái xây thành phố trên đầu"), chỉ máy tính */}
        {cityAvailable ? (
          <Appear>
            <View style={{ marginBottom: GAP.md }}>
              <QuestCityHero />
            </View>
          </Appear>
        ) : null}

        {!enabled ? (
          <Appear>
            <Panel pad={14} style={{ marginBottom: GAP.md, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: GAP.md, borderColor: 'rgba(250,204,21,0.45)' }}>
              <View aria-hidden>
                <SealIcon name="info" color={HUB.amber} size={34} />
              </View>
              <Text className="font-sans" style={{ flex: 1, minWidth: 200, fontSize: 14, lineHeight: 20, color: HUB.ink }}>
                {L(
                  'Chế độ game đang tắt: màn học không có thanh trận đấu và không cộng XP game.',
                  'Game mode is off: lessons show no battle bar and earn no game XP.',
                )}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={L('Bật lại chế độ game', 'Turn game mode back on')}
                onPress={() => setEnabled(true)}
                style={({ hovered }: { hovered?: boolean }) => ({ borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: hovered ? HUB.goldHover : HUB.gold })}
              >
                <Text className="font-strong" style={{ fontSize: 13, color: HUB.ctaInk }}>
                  {L('Bật lại', 'Turn on')}
                </Text>
              </Pressable>
            </Panel>
          </Appear>
        ) : null}

        {/* 2. Chuyến bay từ vựng */}
        <Appear index={1}>
          <View>
            <QuestJourneyHero />
          </View>
        </Appear>

        {/* 3. Hôm nay */}
        <Appear index={3}>
          <View style={{ marginTop: GAP.section }}>
            <SectionHeader seal="target" tone={HUB.amber} title={L('Hôm nay', 'Today')} sub={L('Nhiệm vụ đổi mỗi ngày — làm xong thì bấm nhận thưởng.', 'Quests change daily — finish one, then claim your reward.')} />
            <View style={{ marginTop: GAP.md, flexDirection: wide ? 'row' : 'column', gap: GAP.md, alignItems: 'stretch' }}>
              <Panel style={wide ? { flex: 1.7 } : undefined}>
                <Eyebrow text={L('NHIỆM VỤ HÔM NAY', 'TODAY’S QUESTS')} />
                <View style={{ marginTop: 6 }}>
                  <DailyQuests />
                </View>
              </Panel>
              <Panel style={wide ? { flex: 1 } : undefined}>
                <Eyebrow text={L('SỐ LIỆU HÔM NAY', 'TODAY’S STATS')} tone={HUB.sky} />
                <Text className="font-sans" style={{ marginTop: 6, marginBottom: GAP.sm, fontSize: 12, color: HUB.muted }}>
                  {L('Đếm mọi câu trả lời trong ngày, ở mọi bài.', 'Counts every answer today, across all lessons.')}
                </Text>
                <TodayStats />
              </Panel>
            </View>
          </View>
        </Appear>

        {/* 5. Khám phá */}
        <Appear index={5}>
          <View style={{ marginTop: GAP.section }}>
            <SectionHeader seal="sparkle" tone={HUB.sky} title={L('Khám phá', 'Explore')} sub={L('Những khu chơi khác của Band 9 Quest.', 'More places to play in Band 9 Quest.')} />
            <View style={{ marginTop: GAP.md }}>
              <ExploreTiles width={w} />
            </View>
          </View>
        </Appear>

        {/* 6. Luật nhanh */}
        <Appear index={6}>
          <View style={{ marginTop: GAP.section }}>
            <SectionHeader
              seal="clock"
              tone={HUB.blue}
              title={L('Luật trong 20 giây', 'Rules in 20 seconds')}
              action={{ label: L('Luật đầy đủ, túi đồ, sổ quái', 'Full rules, inventory, bestiary'), href: '/quest/hero' }}
            />
            <View style={{ marginTop: GAP.md }}>
              <Cols cols={w >= 900 ? 4 : 2} gap={w >= 900 ? GAP.md : GAP.sm}>
                <Rule glyph="⚔️" tone={HUB.green} text={L(`Đúng một câu: +${XP_CORRECT} XP và một nhát chém.`, `Correct answer: +${XP_CORRECT} XP and one strike.`)} />
                <Rule glyph="💔" tone={HUB.red} text={L('Sai: quái đánh lại, mất 1 tim và mất combo.', 'Wrong: the monster hits back — you lose 1 heart and your combo.')} />
                <Rule glyph="💥" tone={HUB.orange} text={L(`${CRIT_EVERY} câu đúng liền: đòn chí mạng, gấp đôi XP.`, `${CRIT_EVERY} correct in a row: critical hit, double XP.`)} />
                <Rule glyph="👑" tone={HUB.amber} text={L(
                    `Con thứ ${ENEMIES.length} mỗi vòng là Boss — hạ được thưởng lớn.`,
                    `Monster #${ENEMIES.length} in each round is a Boss — defeat it for a big reward.`,
                  )}
                />
              </Cols>
            </View>
          </View>
        </Appear>
      </View>
    </Screen>
  );
}

function Rule({ glyph, text, tone }: { glyph: string; text: string; tone: string }) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 18,
        padding: 14,
        gap: 8,
        backgroundColor: HUB.panel,
        borderWidth: 1,
        borderColor: HUB.line,
        ...(WEB ? ({ boxShadow: '0 10px 26px rgba(2,8,23,0.3)' } as object) : null),
      }}
    >
      <View aria-hidden style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${tone}26` }}>
        <Text style={{ fontSize: 19 }}>{glyph}</Text>
      </View>
      <Text className="font-sans" style={{ fontSize: 13, lineHeight: 19, color: 'rgba(240, 235, 226,0.9)' }}>
        {text}
      </Text>
    </View>
  );
}
