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

export default function HeroScreen() {
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
            <BackPill label="ReadUp Quest" onPress={() => router.push('/quest' as never)} />
            <Text accessibilityRole="header" className="font-heavy text-pageTitle" style={{ color: HUB.ink }}>
              Nhân vật & nhiệm vụ
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
                    {titleForLevel(lv.level)}
                  </Text>
                </View>
              </View>
              <View style={{ marginTop: 10 }}>
                <Bar value={lv.need > 0 ? lv.into / lv.need : 0} color={HUB.gold} height={12} label={`XP ${lv.into}/${lv.need} tới cấp ${lv.level + 1}`} />
              </View>
              <Text className="font-semi" style={{ marginTop: 6, fontSize: 13, color: HUB.muted, fontVariant: ['tabular-nums'] }}>
                {lv.into}/{lv.need} XP tới cấp {lv.level + 1} · tổng {g.xp.toLocaleString('vi-VN')} XP
              </Text>
              <Text className="font-semi" style={{ marginTop: 4, fontSize: 13, color: HUB.muted }}>
                {findItem(skinItem)?.name ?? 'Hiệp sĩ xanh'}
                {pet ? ` · đồng hành: ${pet.name} — ${pet.perk}` : ' · chưa có linh vật'}
              </Text>
              <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <StatPill glyph="⭐" value={formatStars(stars)} label="sao" />
                <StatPill glyph="❤️" value={`${g.hearts}/${MAX_HEARTS}`} label="tim" />
              </View>
              <View style={{ marginTop: GAP.md }}>
                <Cols cols={w >= 640 ? 4 : 2} gap={8}>
                  <StatBox value={g.life.correct.toLocaleString('vi-VN')} label="câu đúng" />
                  <StatBox value={accuracy} label="tỉ lệ đúng" />
                  <StatBox value={g.life.bestCombo > 0 ? `×${g.life.bestCombo}` : '—'} label="combo kỷ lục" />
                  <StatBox value={g.life.defeated.toLocaleString('vi-VN')} label="quái đã hạ" />
                </Cols>
              </View>
              <View style={{ marginTop: GAP.md, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <GoButton label="Đổi skin & linh vật" href="/shop?tab=skin" />
                <GoButton label="Hồ sơ của tôi" href="/profile" />
              </View>
            </View>
          </Panel>
        </Appear>

        <View style={{ marginTop: GAP.md, flexDirection: wide ? 'row' : 'column', gap: GAP.md, alignItems: 'stretch' }}>
          {/* Nhiệm vụ ngày */}
          <Appear index={2} style={wide ? { flex: 1.3 } : undefined}>
            <Panel style={{ flex: 1 }}>
              <SectionHeader onDark={false} seal="target" tone={HUB.amber} title="Nhiệm vụ hôm nay" sub="Đổi mỗi ngày. Xong thì bấm nhận thưởng." />
              <View style={{ marginTop: GAP.md }}>
                <DailyQuests />
              </View>
            </Panel>
          </Appear>

          {/* Trận đang đánh */}
          <Appear index={3} style={wide ? { flex: 1 } : undefined}>
            <Panel style={{ flex: 1 }}>
              <SectionHeader onDark={false} seal="flame" tone={HUB.orange} title="Quái đang chặn đường" sub="Trả lời đúng ở bất kỳ bài nào là một nhát chém." />
              <View style={{ marginTop: GAP.md }}>
                <EnemyBlock stage={96} />
              </View>
              <Text className="font-semi" style={{ marginTop: GAP.sm, fontSize: 12, color: HUB.muted }}>
                Tim của bạn {g.hearts}/{MAX_HEARTS}
              </Text>
              <View style={{ marginTop: GAP.md, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <GoButton label="Quiz từ vựng" href="/vocabulary/quiz" />
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
              title="Túi đồ"
              sub="Dùng ngay trong bài: bấm Túi đồ trên thanh trận đấu."
              action={{ label: 'Đổi quà', href: '/shop?tab=battle' }}
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
                        {ITEMS[k].name} <Text style={{ color: HUB.gold }}>×{g.items[k] ?? 0}</Text>
                      </Text>
                      <Text className="font-sans" style={{ marginTop: 1, fontSize: 12, lineHeight: 16, color: HUB.muted }}>
                        {ITEMS[k].detail}
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
            <SectionHeader onDark={false} seal="book" tone={HUB.sky} title="Sổ quái" sub="Quái lần lượt xuất hiện; hết bảy loài thì quay lại, khoẻ hơn." />
            <View style={{ marginTop: GAP.md }}>
              <Cols cols={w >= 1000 ? 7 : w >= 560 ? 4 : 2} gap={GAP.sm}>
                {ENEMIES.map((e, i) => {
                  const seen = g.enemyIndex >= i;
                  const kills = g.enemyIndex > i ? Math.floor((g.enemyIndex - i - 1) / ENEMIES.length) + 1 : 0;
                  const current = g.enemyIndex % ENEMIES.length === i && seen;
                  return (
                    <View
                      key={e.id}
                      accessibilityLabel={seen ? `${e.name}${kills > 0 ? `, đã hạ ${kills} lần` : ''}` : 'Quái chưa gặp'}
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
                      <PixelSprite name={ENEMY_SPRITE[e.id] ?? 'slime'} color={e.color} size={56} silhouette={seen ? undefined : 'rgba(169,185,208,0.18)'} />
                      <Text className="font-strong" numberOfLines={1} style={{ marginTop: 6, fontSize: 13, color: seen ? HUB.ink : HUB.muted }}>
                        {seen ? e.name : '???'}
                      </Text>
                      {isBoss(i) ? (
                        <View style={{ marginTop: 3, borderRadius: 4, paddingHorizontal: 5, backgroundColor: HUB.red }}>
                          <Text className="font-heavy" style={{ fontSize: 10, letterSpacing: 1, color: '#FFFFFF' }}>
                            BOSS
                          </Text>
                        </View>
                      ) : null}
                      <Text className="font-sans" style={{ marginTop: 2, fontSize: 12, color: kills > 0 ? HUB.gold : current ? '#FCA5A5' : HUB.muted }}>
                        {kills > 0 ? `Đã hạ ${kills} lần` : seen ? 'Đang đánh' : `${e.baseHp} máu`}
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
            <SectionHeader onDark={false} seal="trophy" tone={HUB.amber} title="Huy hiệu" sub={`${unlocked}/${ACHIEVEMENTS.length} đã mở`} />
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
                          {a.title}
                        </Text>
                        <Text className="font-sans" style={{ fontSize: 12, color: HUB.muted }}>
                          {at ? `Mở ngày ${new Date(at).toLocaleDateString('vi-VN')}` : a.detail}
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
              <SectionHeader onDark={false} seal="settings" tone={HUB.blue} title="Cài đặt game" />
              <SwitchRow
                title="Chế độ game khi học"
                detail={
                  g.enabled
                    ? 'Đang bật: màn học có thanh trận đấu, mỗi câu đúng cộng XP và chém quái.'
                    : 'Đang tắt: màn học gọn như cũ, không cộng XP game. Tiến độ học vẫn tính đủ.'
                }
                on={g.enabled}
                onToggle={() => g.setEnabled(!g.enabled)}
              />
              <View style={{ height: 1, backgroundColor: HUB.line }} />
              <SwitchRow
                title="Âm thanh hiệu ứng"
                detail={
                  g.sound
                    ? 'Đang bật: tiếng đúng cao dần theo combo, tiếng chém, trúng đòn, hạ quái, lên cấp. Phím M để tắt nhanh.'
                    : 'Đang tắt: học trong im lặng. Phím M trên thanh trận đấu để bật lại.'
                }
                on={g.sound}
                onToggle={() => g.setSound(!g.sound)}
              />
            </Panel>
          </Appear>

          {/* Luật chơi */}
          <Appear index={8} style={wide ? { flex: 1.4 } : undefined}>
            <Panel style={{ flex: 1 }}>
              <SectionHeader onDark={false} seal="info" tone={HUB.sky} title="Luật chơi" />
              <View style={{ marginTop: GAP.sm, gap: 6 }}>
                {[
                  `Đúng một câu: +${XP_CORRECT} XP và chém quái. Từ câu đúng thứ 3 liên tiếp, mỗi câu cộng thêm XP.`,
                  `Cứ ${CRIT_EVERY} câu đúng liên tiếp là một đòn chí mạng: gấp đôi XP và sát thương, khung trận rung lên.`,
                  `Combo từ ${FEVER_AT} là BÙNG CHÁY: mỗi nhát chém mạnh gấp rưỡi, nhân vật bốc lửa.`,
                  'Con thứ bảy mỗi vòng là BOSS: nhiều máu hơn, hạ được thưởng trọn lượng máu thành XP và rơi 2 món.',
                  'Còn một tim thì khung trận viền đỏ và tim đập — cẩn thận câu kế tiếp.',
                  'Sai một câu: mất combo và một tim. Khiên chặn được một câu sai.',
                  'Hết tim: bị đánh lui — tim hồi đầy, quái hồi máu. Bài học không bao giờ bị khoá.',
                  'Hạ quái: thưởng thêm XP, cứ hai con thì rơi một món đồ.',
                  'Bài chỉ chấm lúc nộp (kiểm tra, đề tuần): mỗi câu đúng +10 XP và một nhát, không tính combo, không mất tim.',
                  `Sao thưởng: hạ quái +${STAR_BONUS.defeat} ⭐, hạ boss +${STAR_BONUS.boss} ⭐, lên cấp +${STAR_BONUS.levelUp} ⭐ mỗi cấp, xong nhiệm vụ +${STAR_BONUS.quest} ⭐, mở huy hiệu +${STAR_BONUS.achievement} ⭐. Sao đổi được vé gói, linh vật, skin ở trang Đổi quà.`,
                  'Linh vật đứng sau lưng nhân vật và giúp theo cách riêng: Cú cho lượt Hỏi Cú miễn phí, Cáo đỡ câu sai đầu ngày, Mèo hồi tim, Rồng chém mạnh hơn. Không con nào làm bài hộ.',
                  'Phím tắt trên thanh trận đấu: I mở túi đồ · H hỏi Cú · M bật/tắt âm thanh.',
                ].map((line) => (
                  <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
                    <View aria-hidden style={{ marginTop: 7, width: 5, height: 5, borderRadius: 2, backgroundColor: HUB.gold }} />
                    <Text className="font-sans" style={{ flex: 1, fontSize: 13, lineHeight: 20, color: 'rgba(226,232,240,0.88)' }}>
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
        backgroundColor: hovered ? 'rgba(74,127,232,0.3)' : 'rgba(74,127,232,0.18)',
        ...(WEB ? ({ transition: 'background-color 150ms ease' } as object) : null),
      })}
    >
      <Text className="font-strong" style={{ fontSize: 13, color: '#BFDBFE' }}>
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
        style={{ width: 58, height: 32, borderRadius: 999, padding: 3, backgroundColor: on ? HUB.green : 'rgba(169,185,208,0.3)', justifyContent: 'center' }}
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
