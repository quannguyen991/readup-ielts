import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { ensureGameKeyframes } from '@/components/game/game-anim';
import { PixelSprite } from '@/components/game/PixelSprite';
import { ENEMY_SPRITE } from '@/components/game/sprites';
import { EnemyBlock, HeroStage } from '@/components/game/quest-hub/BattleHud';
import { DailyQuests } from '@/components/game/quest-hub/DailyQuests';
import { BackPill, Bar, Cols, GAP, HUB, Panel, SectionHeader, StatBox, StatPill, useBoxWidth, WEB } from '@/components/game/quest-hub/kit';
import { MASCOTS, STAR_BONUS } from '@/services/game/mascots';
import { findItem, formatStars } from '@/services/gamification/shop';
import {
  ACHIEVEMENTS,
  CRIT_EVERY,
  FEVER_AT,
  isBoss,
  ENEMIES,
  ITEMS,
  levelProgress,
  MAX_HEARTS,
  titleForLevel,
  XP_CORRECT,
  type ItemKind,
} from '@/services/game/rules';
import { useGameStore } from '@/store/useGameStore';
import { mascotOf, useRewardStore } from '@/store/useRewardStore';
import { useStarBalance } from '@/store/useStarBalance';
import { PageStickers } from '@/components/illust/HeroArt';
import { Badge as SealBadge } from '@/components/illust/Cute';
import { useL } from '@/i18n/useL';
import { enemyName } from '@/components/world/island-label';
import { achievementDetail, achievementTitle, itemName, levelTitle, mascotName, mascotPerk } from '@/services/gamification/labels-en';

/**
 * TRANG NHÂN VẬT: cấp và XP, nhiệm vụ ngày (bấm nhận thưởng), trận đang đánh,
 * túi đồ, sổ quái, huy hiệu, công tắc bật/tắt chế độ game khi học, luật chơi.
 *
 * Tắt game thì các màn học không hiện thanh trận đấu và không cộng XP game —
 * việc học, điểm xếp hạng và tiến độ bài vẫn tính y như cũ.
 *
 * Dùng chung bộ thẻ xanh mực với sảnh game (`components/game/quest-hub`) từ
 * 30/09/2026 — thẻ nhiệm vụ và thẻ quái là CÙNG một thành phần với trang /quest.
 */

const ITEM_ORDER: ItemKind[] = ['potion', 'shield', 'double', 'hint'];
const MAX_W = 1280;

/** Tên tiếng Anh cho đồ trong túi (dữ liệu gốc ở `services/game/rules.ts` giữ tiếng Việt). */
const ITEM_KIND_EN: Record<ItemKind, { name: string; detail: string }> = {
  potion: { name: 'Health potion', detail: 'Restores 2 hearts.' },
  shield: { name: 'Shield', detail: 'Blocks one wrong answer: no heart lost, combo kept.' },
  double: { name: 'Double XP', detail: 'Your next 10 correct answers earn double XP.' },
  hint: { name: "Owl's hint", detail: 'Removes 2 wrong options from the current multiple-choice question.' },
};

export default function HeroScreen() {
  const { L, locale, en } = useL();
  const numLocale = en ? 'en-US' : 'vi-VN';
  useEffect(ensureGameKeyframes, []);
  const [w, onLayout] = useBoxWidth();
  const wide = w >= 900;
  const g = useGameStore();
  const lv = levelProgress(g.xp);
  const accuracy = g.life.answers > 0 ? `${Math.round((g.life.correct / g.life.answers) * 100)}%` : '—';
  const skinItem = useRewardStore((s) => s.skin);
  const petId = mascotOf(useRewardStore((s) => s.mascot));
  const pet = petId ? MASCOTS[petId] : null;
  const stars = useStarBalance();
  const unlocked = Object.keys(g.achievements).length;

  return (
    <Screen>
      <View onLayout={onLayout} style={{ width: '100%', maxWidth: MAX_W, alignSelf: 'center', paddingBottom: 28 }}>
        <Appear>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP.sm, flexWrap: 'wrap' }}>
            <BackPill label="Band 9 Quest" onPress={() => router.push('/quest' as never)} />
            <Text accessibilityRole="header" className="font-heavy text-pageTitle" style={{ color: HUB.ink }}>
              {L('Nhân vật & nhiệm vụ', 'Hero & quests')}
            </Text>
            <View style={{ flex: 1 }} />
            <PageStickers scene="duel" />
          </View>
        </Appear>

        {/* Nhân vật + cấp */}
        <Appear index={1}>
          <Panel style={{ marginTop: GAP.lg, flexDirection: wide ? 'row' : 'column', gap: GAP.lg, alignItems: wide ? 'center' : 'stretch' }}>
            <View style={{ alignItems: 'center' }}>
              <HeroStage size={wide ? 184 : 150} />
            </View>
            <View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                <Text className="font-heavy" style={{ fontSize: 44, lineHeight: 48, color: HUB.ink }}>
                  Lv {lv.level}
                </Text>
                <View style={{ marginBottom: 8, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(250,204,21,0.16)' }}>
                  <Text className="font-strong" style={{ fontSize: 13, color: HUB.gold }}>
                    {levelTitle(titleForLevel(lv.level), locale)}
                  </Text>
                </View>
              </View>
              <View style={{ marginTop: 10 }}>
                <Bar value={lv.need > 0 ? lv.into / lv.need : 0} color={HUB.gold} height={12} label={L(`XP ${lv.into}/${lv.need} tới cấp ${lv.level + 1}`, `XP ${lv.into}/${lv.need} to level ${lv.level + 1}`)} />
              </View>
              <Text className="font-semi" style={{ marginTop: 6, fontSize: 13, color: HUB.muted, fontVariant: ['tabular-nums'] }}>
                {L(
                  `${lv.into}/${lv.need} XP tới cấp ${lv.level + 1} · tổng ${g.xp.toLocaleString('vi-VN')} XP`,
                  `${lv.into}/${lv.need} XP to level ${lv.level + 1} · ${g.xp.toLocaleString('en-US')} XP total`,
                )}
              </Text>
              <Text className="font-semi" style={{ marginTop: 4, fontSize: 13, color: HUB.muted }}>
                {(() => {
                  const skin = findItem(skinItem);
                  return skin ? itemName(skin, locale) : L('Hiệp sĩ xanh', 'Blue Knight');
                })()}
                {pet
                  ? L(` · đồng hành: ${pet.name} — ${pet.perk}`, ` · companion: ${mascotName(pet, locale)} — ${mascotPerk(pet, locale)}`)
                  : L(' · chưa có linh vật', ' · no mascot yet')}
              </Text>
              <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <StatPill glyph="⭐" value={formatStars(stars)} label={L('sao', 'stars')} />
                <StatPill glyph="❤️" value={`${g.hearts}/${MAX_HEARTS}`} label={L('tim', 'hearts')} />
              </View>
              <View style={{ marginTop: GAP.md }}>
                <Cols cols={w >= 640 ? 4 : 2} gap={8}>
                  <StatBox value={g.life.correct.toLocaleString(numLocale)} label={L('câu đúng', 'correct answers')} />
                  <StatBox value={accuracy} label={L('tỉ lệ đúng', 'accuracy')} />
                  <StatBox value={g.life.bestCombo > 0 ? `×${g.life.bestCombo}` : '—'} label={L('combo kỷ lục', 'best combo')} />
                  <StatBox value={g.life.defeated.toLocaleString(numLocale)} label={L('quái đã hạ', 'monsters defeated')} />
                </Cols>
              </View>
              <View style={{ marginTop: GAP.md, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <GoButton label={L('Đổi skin & linh vật', 'Change skin & mascot')} href="/shop?tab=skin" />
                <GoButton label={L('Hồ sơ của tôi', 'My profile')} href="/profile" />
              </View>
            </View>
          </Panel>
        </Appear>

        <View style={{ marginTop: GAP.md, flexDirection: wide ? 'row' : 'column', gap: GAP.md, alignItems: 'stretch' }}>
          {/* Nhiệm vụ ngày */}
          <Appear index={2} style={wide ? { flex: 1.3 } : undefined}>
            <Panel style={{ flex: 1 }}>
              <SectionHeader onDark={false} seal="target" tone={HUB.amber} title={L('Nhiệm vụ hôm nay', "Today's quests")} sub={L('Đổi mỗi ngày. Xong thì bấm nhận thưởng.', 'New every day. Tap to claim your reward when done.')} />
              <View style={{ marginTop: GAP.md }}>
                <DailyQuests />
              </View>
            </Panel>
          </Appear>

          {/* Trận đang đánh */}
          <Appear index={3} style={wide ? { flex: 1 } : undefined}>
            <Panel style={{ flex: 1 }}>
              <SectionHeader onDark={false} seal="flame" tone={HUB.orange} title={L('Quái đang chặn đường', 'Monster in your way')} sub={L('Trả lời đúng ở bất kỳ bài nào là một nhát chém.', 'Every correct answer in any lesson is one strike.')} />
              <View style={{ marginTop: GAP.md }}>
                <EnemyBlock stage={96} />
              </View>
              <Text className="font-semi" style={{ marginTop: GAP.sm, fontSize: 12, color: HUB.muted }}>
                {L('Tim của bạn', 'Your hearts')} {g.hearts}/{MAX_HEARTS}
              </Text>
              <View style={{ marginTop: GAP.md, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <GoButton label={L('Quiz từ vựng', 'Vocabulary quiz')} href="/vocabulary/quiz" />
                <GoButton label="SAT Math" href="/math" />
                <GoButton label="SAT Verbal" href="/sat-rw" />
              </View>
            </Panel>
          </Appear>
        </View>

        {/* Túi đồ */}
        <Appear index={4}>
          <Panel style={{ marginTop: GAP.md }}>
            <SectionHeader
              onDark={false}
              seal="gift"
              tone={HUB.pink}
              title={L('Túi đồ', 'Inventory')}
              sub={L('Dùng ngay trong bài: bấm Túi đồ trên thanh trận đấu.', 'Use items mid-lesson: tap Inventory on the battle bar.')}
              action={{ label: L('Đổi quà', 'Rewards shop'), href: '/shop?tab=battle' }}
            />
            <View style={{ marginTop: GAP.md }}>
              <Cols cols={w >= 900 ? 4 : w >= 520 ? 2 : 1} gap={GAP.sm}>
                {ITEM_ORDER.map((k) => (
                  <View key={k} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, backgroundColor: HUB.raised }}>
                    <View aria-hidden style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.stage }}>
                      {k === 'hint' ? <PixelSprite name="owl" size={30} color="#A16207" /> : <Text style={{ fontSize: 24 }}>{ITEMS[k].glyph}</Text>}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text className="font-strong" style={{ fontSize: 14, color: HUB.ink }}>
                        {en ? ITEM_KIND_EN[k].name : ITEMS[k].name} <Text style={{ color: HUB.gold }}>×{g.items[k] ?? 0}</Text>
                      </Text>
                      <Text className="font-sans" style={{ marginTop: 1, fontSize: 12, lineHeight: 16, color: HUB.muted }}>
                        {en ? ITEM_KIND_EN[k].detail : ITEMS[k].detail}
                      </Text>
                    </View>
                  </View>
                ))}
              </Cols>
            </View>
          </Panel>
        </Appear>

        {/* Sổ quái */}
        <Appear index={5}>
          <Panel style={{ marginTop: GAP.md }}>
            <SectionHeader onDark={false} seal="book" tone={HUB.sky} title={L('Sổ quái', 'Bestiary')} sub={L('Quái lần lượt xuất hiện; hết bảy loài thì quay lại, khoẻ hơn.', 'Monsters appear one by one; after all seven, they come back stronger.')} />
            <View style={{ marginTop: GAP.md }}>
              <Cols cols={w >= 1000 ? 7 : w >= 560 ? 4 : 2} gap={GAP.sm}>
                {ENEMIES.map((e, i) => {
                  const seen = g.enemyIndex >= i;
                  const kills = g.enemyIndex > i ? Math.floor((g.enemyIndex - i - 1) / ENEMIES.length) + 1 : 0;
                  const current = g.enemyIndex % ENEMIES.length === i && seen;
                  const eName = enemyName(e, locale);
                  return (
                    <View
                      key={e.id}
                      accessibilityLabel={
                        seen
                          ? `${eName}${kills > 0 ? L(`, đã hạ ${kills} lần`, `, defeated ${kills}×`) : ''}`
                          : L('Quái chưa gặp', 'Monster not met yet')
                      }
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        borderRadius: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        backgroundColor: HUB.raised,
                        borderWidth: 1,
                        borderColor: current ? 'rgba(252,165,165,0.55)' : 'transparent',
                      }}
                    >
                      <PixelSprite name={ENEMY_SPRITE[e.id] ?? 'slime'} color={e.color} size={56} silhouette={seen ? undefined : 'rgba(205, 193, 172,0.18)'} />
                      <Text className="font-strong" numberOfLines={1} style={{ marginTop: 6, fontSize: 13, color: seen ? HUB.ink : HUB.muted }}>
                        {seen ? eName : '???'}
                      </Text>
                      {isBoss(i) ? (
                        <View style={{ marginTop: 3, borderRadius: 4, paddingHorizontal: 5, backgroundColor: HUB.red }}>
                          <Text className="font-heavy" style={{ fontSize: 10, letterSpacing: 1, color: '#FFFFFF' }}>
                            BOSS
                          </Text>
                        </View>
                      ) : null}
                      <Text className="font-sans" style={{ marginTop: 2, fontSize: 12, color: kills > 0 ? HUB.gold : current ? '#FCA5A5' : HUB.muted }}>
                        {kills > 0 ? L(`Đã hạ ${kills} lần`, `Defeated ${kills}×`) : seen ? L('Đang đánh', 'Fighting') : L(`${e.baseHp} máu`, `${e.baseHp} HP`)}
                      </Text>
                    </View>
                  );
                })}
              </Cols>
            </View>
          </Panel>
        </Appear>

        {/* Huy hiệu */}
        <Appear index={6}>
          <Panel style={{ marginTop: GAP.md }}>
            <SectionHeader onDark={false} seal="trophy" tone={HUB.amber} title={L('Huy hiệu', 'Badges')} sub={L(`${unlocked}/${ACHIEVEMENTS.length} đã mở`, `${unlocked}/${ACHIEVEMENTS.length} unlocked`)} />
            <View style={{ marginTop: GAP.md }}>
              <Cols cols={w >= 900 ? 3 : w >= 560 ? 2 : 1} gap={GAP.sm}>
                {ACHIEVEMENTS.map((a) => {
                  const at = g.achievements[a.id];
                  return (
                    <View
                      key={a.id}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        borderRadius: 16,
                        padding: 12,
                        backgroundColor: at ? 'rgba(250,204,21,0.1)' : HUB.raised,
                        borderWidth: 1,
                        borderColor: at ? 'rgba(250,204,21,0.45)' : 'transparent',
                      }}
                    >
                      <Text aria-hidden style={{ fontSize: 24, opacity: at ? 1 : 0.3 }}>
                        {a.glyph}
                      </Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text className="font-strong" style={{ fontSize: 13, color: at ? HUB.ink : HUB.muted }}>
                          {achievementTitle(a, locale)}
                        </Text>
                        <Text className="font-sans" style={{ fontSize: 12, color: HUB.muted }}>
                          {at ? L(`Mở ngày ${new Date(at).toLocaleDateString('vi-VN')}`, `Unlocked ${new Date(at).toLocaleDateString('en-US')}`) : achievementDetail(a, locale)}
                        </Text>
                      </View>
                      {at ? (
                        <View aria-hidden>
                          <SealBadge icon="check" color={HUB.green} size={24} />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </Cols>
            </View>
          </Panel>
        </Appear>

        <View style={{ marginTop: GAP.md, flexDirection: wide ? 'row' : 'column', gap: GAP.md, alignItems: 'stretch' }}>
          {/* Cài đặt game */}
          <Appear index={7} style={wide ? { flex: 1 } : undefined}>
            <Panel style={{ flex: 1, gap: GAP.md }}>
              <SectionHeader onDark={false} seal="settings" tone={HUB.blue} title={L('Cài đặt game', 'Game settings')} />
              <SwitchRow
                title={L('Chế độ game khi học', 'Game mode while studying')}
                detail={
                  g.enabled
                    ? L('Đang bật: có thanh trận đấu, câu đúng cộng XP.', 'On: battle bar shows, correct answers earn XP.')
                    : L('Đang tắt: không có game, tiến độ học vẫn tính.', 'Off: no game, study progress still counts.')
                }
                on={g.enabled}
                onToggle={() => g.setEnabled(!g.enabled)}
              />
              <View style={{ height: 1, backgroundColor: HUB.line }} />
              <SwitchRow
                title={L('Âm thanh hiệu ứng', 'Sound effects')}
                detail={
                  g.sound
                    ? L('Đang bật. Phím M để tắt nhanh.', 'On. Press M to mute.')
                    : L('Đang tắt: học trong im lặng. Phím M trên thanh trận đấu để bật lại.', 'Off: study in silence. Press M on the battle bar to turn it back on.')
                }
                on={g.sound}
                onToggle={() => g.setSound(!g.sound)}
              />
            </Panel>
          </Appear>

          {/* Luật chơi */}
          <Appear index={8} style={wide ? { flex: 1.4 } : undefined}>
            <Panel style={{ flex: 1 }}>
              <SectionHeader onDark={false} seal="info" tone={HUB.sky} title={L('Luật chơi', 'How it works')} />
              <View style={{ marginTop: GAP.sm, gap: 6 }}>
                {[
                  L(
                    `Đúng một câu: +${XP_CORRECT} XP và chém quái. Từ câu đúng thứ 3 liên tiếp, mỗi câu cộng thêm XP.`,
                    `Each correct answer: +${XP_CORRECT} XP and a strike on the monster. From the 3rd correct answer in a row, each one earns bonus XP.`,
                  ),
                  L(
                    `Cứ ${CRIT_EVERY} câu đúng liên tiếp là một đòn chí mạng: gấp đôi XP và sát thương, khung trận rung lên.`,
                    `Every ${CRIT_EVERY} correct answers in a row land a critical hit: double XP and damage, and the battle frame shakes.`,
                  ),
                  L(
                    `Combo từ ${FEVER_AT} là BÙNG CHÁY: mỗi nhát chém mạnh gấp rưỡi, nhân vật bốc lửa.`,
                    `A combo of ${FEVER_AT}+ triggers FEVER: every strike hits 1.5× harder and your hero bursts into flames.`,
                  ),
                  L('Con thứ 7 là BOSS: nhiều máu, thưởng lớn.', 'Every 7th is a BOSS: more HP, bigger reward.'),
                  L('Còn một tim thì khung trận viền đỏ và tim đập — cẩn thận câu kế tiếp.', 'On your last heart, the battle frame turns red and the heart pulses — careful with the next question.'),
                  L('Sai một câu: mất combo và một tim. Khiên chặn được một câu sai.', 'A wrong answer costs your combo and one heart. A shield blocks one wrong answer.'),
                  L('Hết tim thì hồi lại, bài không bị khoá.', 'Out of hearts: you recover, lessons never lock.'),
                  L('Hạ quái: thưởng thêm XP, cứ hai con thì rơi một món đồ.', 'Defeat a monster: bonus XP, and every second one drops an item.'),
                  L('Bài chấm lúc nộp: mỗi câu đúng +10 XP, không mất tim.', 'Graded-on-submit lessons: +10 XP per correct, no heart loss.'),
                  L(
                    `Sao thưởng: hạ quái +${STAR_BONUS.defeat} ⭐, hạ boss +${STAR_BONUS.boss} ⭐, lên cấp +${STAR_BONUS.levelUp} ⭐ mỗi cấp, xong nhiệm vụ +${STAR_BONUS.quest} ⭐, mở huy hiệu +${STAR_BONUS.achievement} ⭐. Sao đổi được vé gói, linh vật, skin ở trang Đổi quà.`,
                    `Star rewards: monster +${STAR_BONUS.defeat} ⭐, boss +${STAR_BONUS.boss} ⭐, +${STAR_BONUS.levelUp} ⭐ per level up, quest done +${STAR_BONUS.quest} ⭐, badge unlocked +${STAR_BONUS.achievement} ⭐. Spend stars on passes, mascots and skins in the Rewards shop.`,
                  ),
                  L('Linh vật trợ giúp: Cú gợi ý, Cáo đỡ câu sai, Mèo hồi tim, Rồng chém mạnh.', 'Pets help: Owl hints, Fox blocks a miss, Cat heals, Dragon hits harder.'),
                  L('Phím tắt trên thanh trận đấu: I mở túi đồ · H hỏi Cú · M bật/tắt âm thanh.', 'Battle bar shortcuts: I opens inventory · H asks Owl · M toggles sound.'),
                ].map((line) => (
                  <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
                    <View aria-hidden style={{ marginTop: 7, width: 5, height: 5, borderRadius: 2, backgroundColor: HUB.gold }} />
                    <Text className="font-sans" style={{ flex: 1, fontSize: 13, lineHeight: 20, color: 'rgba(240, 235, 226,0.88)' }}>
                      {line}
                    </Text>
                  </View>
                ))}
              </View>
            </Panel>
          </Appear>
        </View>
      </View>
    </Screen>
  );
}

function GoButton({ label, href }: { label: string; href: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(href as never)}
      style={({ hovered }: { hovered?: boolean }) => ({
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: hovered ? 'rgba(168,132,63,0.3)' : 'rgba(168,132,63,0.18)',
        ...(WEB ? ({ transition: 'background-color 150ms ease' } as object) : null),
      })}
    >
      <Text className="font-strong" style={{ fontSize: 13, color: '#EAD7AE' }}>
        {label} →
      </Text>
    </Pressable>
  );
}

function SwitchRow({ title, detail, on, onToggle }: { title: string; detail: string; on: boolean; onToggle: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ flex: 1 }}>
        <Text className="font-strong" style={{ fontSize: 15, color: HUB.ink }}>
          {title}
        </Text>
        <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, lineHeight: 19, color: HUB.muted }}>
          {detail}
        </Text>
      </View>
      <Pressable
        accessibilityRole="switch"
        aria-checked={on}
        accessibilityLabel={title}
        onPress={onToggle}
        style={{ width: 58, height: 32, borderRadius: 999, padding: 3, backgroundColor: on ? HUB.green : 'rgba(205, 193, 172,0.3)', justifyContent: 'center' }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            backgroundColor: '#FFFFFF',
            transform: [{ translateX: on ? 26 : 0 }],
            ...(Platform.OS === 'web' ? ({ transition: 'transform 200ms ease' } as object) : null),
          }}
        />
      </Pressable>
    </View>
  );
}
