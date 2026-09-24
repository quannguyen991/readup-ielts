import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { anim, MOVE } from '@/components/game/game-anim';
import { PixelSprite } from '@/components/game/PixelSprite';
import { ENEMY_SPRITE } from '@/components/game/sprites';
import { dateKey } from '@/services/gamification/points';
import {
  ACHIEVEMENTS,
  CRIT_EVERY,
  dailyQuests,
  FEVER_AT,
  isBoss,
  EMPTY_DAY,
  enemyAt,
  ENEMIES,
  ITEMS,
  levelProgress,
  MAX_HEARTS,
  titleForLevel,
  XP_CORRECT,
  type ItemKind,
} from '@/services/game/rules';
import { useGameStore } from '@/store/useGameStore';

/**
 * TRANG NHÂN VẬT: cấp và XP, nhiệm vụ ngày (bấm nhận thưởng), trận đang đánh,
 * túi đồ, sổ quái, huy hiệu, và công tắc bật/tắt chế độ game khi học.
 *
 * Tắt game thì các màn học không hiện thanh trận đấu và không cộng XP game —
 * việc học, điểm xếp hạng và tiến độ bài vẫn tính y như cũ.
 */

const PANEL = { borderRadius: 22, backgroundColor: 'rgba(23,18,58,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 18 } as const;
const GOLD = '#FACC15';
const MUTED = 'rgba(255,255,255,0.68)';
const ITEM_ORDER: ItemKind[] = ['potion', 'shield', 'double', 'hint'];

export default function HeroScreen() {
  const wide = useWindowDimensions().width >= 900;
  const g = useGameStore();
  const lv = levelProgress(g.xp);
  const today = g.day === dateKey(new Date()) ? g.today : EMPTY_DAY;
  const claimed = g.day === dateKey(new Date()) ? g.claimed : [];
  const quests = dailyQuests(dateKey(new Date()));
  const enemy = enemyAt(g.enemyIndex);
  const accuracy = g.life.answers > 0 ? Math.round((g.life.correct / g.life.answers) * 100) : 0;

  return (
    <Screen>
      <Appear>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Pressable accessibilityRole="link" onPress={() => router.push('/quest' as never)} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <Text className="font-semi" style={{ fontSize: 13, color: '#FFFFFF' }}>
              ‹ ReadUp Quest
            </Text>
          </Pressable>
          <Text className="font-heavy text-pageTitle" style={{ color: '#FFFFFF' }}>
            Nhân vật
          </Text>
        </View>
      </Appear>

      {/* Nhân vật + cấp */}
      <Appear index={1}>
        <View style={{ ...PANEL, marginTop: 16, flexDirection: wide ? 'row' : 'column', gap: 20, alignItems: wide ? 'center' : 'stretch' }}>
          <View style={{ alignItems: 'center', justifyContent: 'flex-end', width: wide ? 200 : undefined, height: 170, borderRadius: 18, backgroundColor: '#2B1F66', overflow: 'hidden' }}>
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 34, backgroundColor: '#140F33' }} />
            <View style={anim('rg-bob', 1500, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
              <PixelSprite name="hero" size={124} />
            </View>
            <View style={{ marginBottom: 20, marginTop: -6, width: 80, height: 10, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.4)' }} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
              <Text className="font-heavy" style={{ fontSize: 46, lineHeight: 50, color: '#FFFFFF' }}>
                Lv {lv.level}
              </Text>
              <View style={{ marginBottom: 8, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(250,204,21,0.18)' }}>
                <Text className="font-strong" style={{ fontSize: 13, color: GOLD }}>
                  {titleForLevel(lv.level)}
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 10, height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
              <View style={{ height: 12, width: '100%', backgroundColor: GOLD, transform: [{ scaleX: Math.max(0.02, lv.into / lv.need) }], transformOrigin: 'left' }} />
            </View>
            <Text className="font-semi" style={{ marginTop: 6, fontSize: 13, color: MUTED }}>
              {lv.into}/{lv.need} XP tới cấp {lv.level + 1} · tổng {g.xp.toLocaleString('vi-VN')} XP
            </Text>
            <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Stat value={g.life.correct.toLocaleString('vi-VN')} label="câu đúng" />
              <Stat value={`${accuracy}%`} label="tỉ lệ đúng" />
              <Stat value={`×${g.life.bestCombo}`} label="combo kỷ lục" />
              <Stat value={String(g.life.defeated)} label="quái đã hạ" />
            </View>
          </View>
        </View>
      </Appear>

      {/* Công tắc */}
      <Appear index={2}>
        <View style={{ ...PANEL, marginTop: 12, gap: 14 }}>
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
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
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
        </View>
      </Appear>

      <View style={{ marginTop: 12, flexDirection: wide ? 'row' : 'column', gap: 12, alignItems: 'stretch' }}>
        {/* Nhiệm vụ ngày */}
        <Appear index={3} style={{ flex: 1.3 }}>
          <View style={{ ...PANEL, flex: 1 }}>
            <SectionTitle title="Nhiệm vụ hôm nay" sub="Đổi mỗi ngày. Xong thì bấm nhận thưởng." />
            <View style={{ marginTop: 12, gap: 10 }}>
              {quests.map((q) => {
                const value = Math.min(q.goal, today[q.metric]);
                const done = value >= q.goal;
                const got = claimed.includes(q.id);
                return (
                  <View key={q.id} style={{ borderRadius: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 22 }}>{got ? '✅' : done ? '🎁' : '📜'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
                        {q.title}
                      </Text>
                      <View style={{ marginTop: 6, height: 7, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                        <View style={{ height: 7, width: '100%', backgroundColor: done ? '#22C55E' : '#60A5FA', transform: [{ scaleX: Math.max(0.02, value / q.goal) }], transformOrigin: 'left' }} />
                      </View>
                      <Text className="font-semi" style={{ marginTop: 4, fontSize: 12, color: MUTED }}>
                        {value}/{q.goal} · thưởng +{q.rewardXp} XP{q.rewardItem ? ` và ${ITEMS[q.rewardItem].glyph} ${ITEMS[q.rewardItem].name}` : ''}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      disabled={!done || got}
                      onPress={() => g.claimQuest(q.id)}
                      style={{ borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: got ? 'rgba(255,255,255,0.08)' : done ? GOLD : 'rgba(255,255,255,0.08)' }}
                    >
                      <Text className="font-strong" style={{ fontSize: 13, color: done && !got ? '#3B2503' : MUTED }}>
                        {got ? 'Đã nhận' : done ? 'Nhận' : 'Chưa xong'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </Appear>

        {/* Trận đang đánh */}
        <Appear index={4} style={{ flex: 1 }}>
          <View style={{ ...PANEL, flex: 1 }}>
            <SectionTitle title="Quái đang chặn đường" sub={`Con thứ ${g.enemyIndex + 1}${enemy.round > 0 ? ` · vòng ${enemy.round + 1}, khoẻ hơn` : ''}`} />
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 96, height: 96, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2B1F66' }}>
                <View style={anim('rg-bob', 1200, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
                  <PixelSprite name={ENEMY_SPRITE[enemy.id] ?? 'slime'} color={enemy.color} size={80} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text className="font-heavy" style={{ fontSize: 16, color: '#FFFFFF' }}>
                  {enemy.name}
                </Text>
                <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, fontStyle: 'italic', color: MUTED }}>
                  “{enemy.taunt}”
                </Text>
                <View style={{ marginTop: 8, height: 9, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                  <View style={{ height: 9, width: '100%', backgroundColor: '#22C55E', transform: [{ scaleX: Math.max(0, g.enemyHp / enemy.hp) }], transformOrigin: 'left' }} />
                </View>
                <Text className="font-semi" style={{ marginTop: 4, fontSize: 12, color: MUTED }}>
                  {g.enemyHp}/{enemy.hp} máu · tim của bạn {g.hearts}/{MAX_HEARTS}
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <GoButton label="Quiz từ vựng" href="/vocabulary/quiz" />
              <GoButton label="SAT Math" href="/math" />
              <GoButton label="SAT Verbal" href="/sat-rw" />
            </View>
          </View>
        </Appear>
      </View>

      {/* Túi đồ */}
      <Appear index={5}>
        <View style={{ ...PANEL, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <SectionTitle title="Túi đồ" sub="Dùng ngay trong bài: bấm Túi đồ trên thanh trận đấu." />
            <Pressable accessibilityRole="link" onPress={() => router.push('/shop' as never)}>
              <Text className="font-strong" style={{ fontSize: 13, color: GOLD }}>
                Cửa hàng →
              </Text>
            </Pressable>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ITEM_ORDER.map((k) => (
              <View key={k} style={{ flexBasis: 220, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                {k === 'hint' ? <PixelSprite name="owl" size={30} color="#A16207" /> : <Text style={{ fontSize: 26 }}>{ITEMS[k].glyph}</Text>}
                <View style={{ flex: 1 }}>
                  <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
                    {ITEMS[k].name} <Text style={{ color: GOLD }}>×{g.items[k] ?? 0}</Text>
                  </Text>
                  <Text className="font-sans" style={{ fontSize: 12, color: MUTED }}>
                    {ITEMS[k].detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Appear>

      {/* Sổ quái */}
      <Appear index={6}>
        <View style={{ ...PANEL, marginTop: 12 }}>
          <SectionTitle title="Sổ quái" sub="Quái lần lượt xuất hiện; hết bảy loài thì quay lại, khoẻ hơn." />
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ENEMIES.map((e, i) => {
              const seen = g.enemyIndex >= i;
              const kills = g.enemyIndex > i ? Math.floor((g.enemyIndex - i - 1) / ENEMIES.length) + 1 : 0;
              return (
                <View key={e.id} style={{ flexBasis: 140, flexGrow: 1, alignItems: 'center', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <PixelSprite name={ENEMY_SPRITE[e.id] ?? 'slime'} color={e.color} size={56} silhouette={seen ? undefined : 'rgba(255,255,255,0.14)'} />
                  <Text className="font-strong" numberOfLines={1} style={{ marginTop: 6, fontSize: 13, color: seen ? '#FFFFFF' : MUTED }}>
                    {seen ? e.name : '???'}
                  </Text>
                  {isBoss(i) ? (
                    <View style={{ marginTop: 3, borderRadius: 4, paddingHorizontal: 5, backgroundColor: '#DC2626' }}>
                      <Text className="font-heavy" style={{ fontSize: 10, letterSpacing: 1, color: '#FFFFFF' }}>
                        BOSS
                      </Text>
                    </View>
                  ) : null}
                  <Text className="font-sans" style={{ fontSize: 12, color: kills > 0 ? GOLD : MUTED }}>
                    {kills > 0 ? `Đã hạ ${kills} lần` : seen ? 'Đang đánh' : `${e.baseHp} máu`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Appear>

      {/* Huy hiệu */}
      <Appear index={7}>
        <View style={{ ...PANEL, marginTop: 12 }}>
          <SectionTitle title="Huy hiệu" sub={`${Object.keys(g.achievements).length}/${ACHIEVEMENTS.length} đã mở`} />
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ACHIEVEMENTS.map((a) => {
              const at = g.achievements[a.id];
              return (
                <View key={a.id} style={{ flexBasis: 200, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 12, backgroundColor: at ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: at ? 'rgba(250,204,21,0.45)' : 'transparent' }}>
                  <Text style={{ fontSize: 24, opacity: at ? 1 : 0.3 }}>{a.glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <Text className="font-strong" style={{ fontSize: 13, color: at ? '#FFFFFF' : MUTED }}>
                      {a.title}
                    </Text>
                    <Text className="font-sans" style={{ fontSize: 12, color: MUTED }}>
                      {at ? `Mở ngày ${new Date(at).toLocaleDateString('vi-VN')}` : a.detail}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Appear>

      {/* Luật chơi */}
      <Appear index={8}>
        <View style={{ ...PANEL, marginTop: 12, marginBottom: 24 }}>
          <SectionTitle title="Luật chơi" />
          <View style={{ marginTop: 10, gap: 6 }}>
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
              'Phím tắt trên thanh trận đấu: I mở túi đồ · H hỏi Cú · M bật/tắt âm thanh.',
            ].map((line) => (
              <Text key={line} className="font-sans" style={{ fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.82)' }}>
                •  {line}
              </Text>
            ))}
          </View>
        </View>
      </Appear>
    </Screen>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ flexShrink: 1 }}>
      <Text className="font-heavy" style={{ fontSize: 17, color: '#FFFFFF' }}>
        {title}
      </Text>
      {sub ? (
        <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, color: MUTED }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.07)' }}>
      <Text className="font-heavy" style={{ fontSize: 17, color: '#FFFFFF' }}>
        {value}
      </Text>
      <Text className="font-sans" style={{ fontSize: 12, color: MUTED }}>
        {label}
      </Text>
    </View>
  );
}

function GoButton({ label, href }: { label: string; href: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href as never)} style={{ borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(96,165,250,0.18)' }}>
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
        <Text className="font-strong" style={{ fontSize: 15, color: '#FFFFFF' }}>
          {title}
        </Text>
        <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, color: MUTED }}>
          {detail}
        </Text>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        accessibilityLabel={title}
        onPress={onToggle}
        style={{ width: 58, height: 32, borderRadius: 999, padding: 3, backgroundColor: on ? '#22C55E' : 'rgba(255,255,255,0.2)', justifyContent: 'center' }}
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
