import React, { useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { ensureGameKeyframes } from '@/components/game/game-anim';
import { AreaCard, PICK_AREAS } from '@/components/game/QuestPicker';
import { BattleHud } from '@/components/game/quest-hub/BattleHud';
import { DailyQuests, TodayStats } from '@/components/game/quest-hub/DailyQuests';
import { ExploreTiles } from '@/components/game/quest-hub/ExploreTiles';
import { Cols, Eyebrow, GAP, HUB, lift, Panel, SectionHeader, useBoxWidth, WEB } from '@/components/game/quest-hub/kit';
import { useWorldIslands } from '@/components/world/useWorldIslands';
import { SealIcon } from '@/components/illust/HeroArt';
import { useL } from '@/i18n/useL';
import { CRIT_EVERY, ENEMIES, XP_CORRECT } from '@/services/game/rules';
import { nextMission, type Island } from '@/services/world/islands';
import { useGameStore } from '@/store/useGameStore';
import { useCityAvailable } from '@/services/city/availability';
import { QuestCityHero } from '@/components/city/QuestCityHero';
import { QuestJourneyHero } from '@/components/rail/QuestJourneyHero';

/**
 * BAND 9 QUEST — SẢNH GAME KHI HỌC.
 *
 * Không có màn chơi riêng: ở mọi màn học, trả lời đúng là một nhát chém vào con
 * quái đang chặn đường, sai thì quái đánh lại (`services/game/rules.ts`). Trang
 * này cho thấy trận đang tới đâu và dẫn vào học.
 *
 * Bố cục dựng lại ngày 30/09/2026 ("chỉn chu hơn", bỏ tông tím), từ trên xuống:
 *   1. THẺ TRẬN ĐẤU — nhân vật (skin, linh vật, cấp, XP, tim, sao, chuỗi ngày)
 *      đối đầu con quái hiện tại, cùng nút chính "Vào trận" và "Học tiếp".
 *   2. HAI THẾ GIỚI — Hành trình học bằng cảnh bay qua thành phố, rồi Thành phố Tri thức (chỉ
 *      máy tính). Người dùng yêu cầu 30/09 lấy hai khối này làm phần chính của
 *      Quest, nên chúng vẫn là hai khối lớn ngay dưới thẻ trận đấu.
 *   3. HÔM NAY — nhiệm vụ ngày dạng danh sách đánh dấu + số liệu thật hôm nay.
 *   4. CHỌN MẢNG — năm mảng bài học + ô mở màn chọn trận.
 *   5. KHÁM PHÁ — tám khu chơi khác, cùng một cỡ ô có sticker.
 *   6. LUẬT TRONG 20 GIÂY.
 * Mọi khối dùng chung bộ thẻ `components/game/quest-hub/kit`.
 *
 * "Vào trận" KHÔNG nhảy thẳng vào một bài do máy chọn (người dùng chê ngày
 * 25/09/2026). Nó mở màn chọn `/quest/pick`: chọn mảng → chọn bài → vào lý
 * thuyết. Ai muốn đi nhanh thì có nút "Học tiếp", ghi rõ tên bài sẽ mở.
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
  const islands = useWorldIslands();
  const next = nextMission(islands);
  const areas = useMemo(
    () => PICK_AREAS.map((id) => islands.find((i) => i.id === id)).filter((i): i is Island => !!i),
    [islands],
  );
  const [w, onLayout] = useBoxWidth();
  const wide = w >= 900;
  const areaCols = w >= 900 ? 3 : w >= 600 ? 2 : 1;

  return (
    <Screen>
      <View onLayout={onLayout} style={{ width: '100%', maxWidth: MAX_W, alignSelf: 'center', paddingBottom: 28 }}>
        {/* 0. Thành phố đặt trên đầu (01/10/2026: "để cái xây thành phố trên đầu"), chỉ máy tính */}
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

        {/* 1. Thẻ trận đấu */}
        <Appear>
          <BattleHud next={next} />
        </Appear>

        {/* 2. Chuyến bay từ vựng */}
        <Appear index={1}>
          <View style={{ marginTop: GAP.md }}>
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

        {/* 4. Chọn mảng */}
        <Appear index={4}>
          <View style={{ marginTop: GAP.section }}>
            <SectionHeader
              seal="compass"
              tone={HUB.green}
              title={L('Chọn mảng để vào trận', 'Pick an area to battle')}
              sub={L('Bấm một mảng để xem các bài và chọn bài muốn học.', 'Tap an area to see its lessons and choose one.')}
              action={{ label: L('Mở màn chọn trận', 'Open battle picker'), href: '/quest/pick' }}
            />
            <View style={{ marginTop: GAP.md }}>
              <Cols cols={areaCols}>
                {areas.map((island) => (
                  <AreaCard key={island.id} island={island} onPress={() => router.push(`/quest/pick?area=${island.id}` as never)} />
                ))}
                <PickAllCard />
              </Cols>
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

/** Ô thứ sáu của lưới mảng: mở màn chọn trận đầy đủ. */
function PickAllCard() {
  const { L } = useL();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L('Mở màn chọn trận: xem tất cả mảng và bài', 'Open battle picker: see all areas and lessons')}
      onPress={() => router.push('/quest/pick' as never)}
      style={({ hovered }: { hovered?: boolean }) => ({
        height: '100%',
        minHeight: 150,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: hovered ? 'rgba(250,204,21,0.8)' : 'rgba(250,204,21,0.4)',
        backgroundColor: hovered ? 'rgba(250,204,21,0.08)' : 'rgba(14,27,48,0.6)',
        ...lift(hovered, 2),
      })}
    >
      <View aria-hidden>
        <SealIcon name="grid" color={HUB.amber} size={44} />
      </View>
      <Text className="font-heavy" style={{ fontSize: 16, color: HUB.ink, textAlign: 'center' }}>
        {L('Xem tất cả bài', 'See all lessons')}
      </Text>
      <Text className="font-sans" style={{ fontSize: 13, lineHeight: 18, color: HUB.muted, textAlign: 'center', maxWidth: 240 }}>
        {L('Lọc theo mảng, độ khó và bài đã qua.', 'Filter by area, difficulty and completed lessons.')}
      </Text>
      <Text className="font-strong" style={{ marginTop: 2, fontSize: 13, color: HUB.gold }}>
        {L('Mở màn chọn trận →', 'Open battle picker →')}
      </Text>
    </Pressable>
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
