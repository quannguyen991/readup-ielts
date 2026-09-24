import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { anim, MOVE } from '@/components/game/game-anim';
import { PixelSprite } from '@/components/game/PixelSprite';
import { ENEMY_SPRITE } from '@/components/game/sprites';
import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import { useWorldIslands } from '@/components/world/useWorldIslands';
import { MASCOTS } from '@/services/game/mascots';
import {
  CRIT_EVERY,
  dailyQuests,
  EMPTY_DAY,
  ENEMIES,
  enemyAt,
  ITEMS,
  levelProgress,
  MAX_HEARTS,
  titleForLevel,
  XP_CORRECT,
} from '@/services/game/rules';
import { dateKey } from '@/services/gamification/points';
import { formatStars } from '@/services/gamification/shop';
import { nextMission } from '@/services/world/islands';
import { useGameStore } from '@/store/useGameStore';
import { mascotOf, skinOf, useRewardStore } from '@/store/useRewardStore';
import { useStarBalance } from '@/store/useStarBalance';

/**
 * READUP QUEST — trang chính của GAME KHI HỌC.
 *
 * Không có màn chơi riêng: ở mọi màn học, trả lời đúng là một nhát chém vào con
 * quái đang chặn đường, sai thì quái đánh lại (`services/game/rules.ts`). Trang
 * này chỉ cho thấy trận đang tới đâu — nhân vật (đúng skin, linh vật đang đi
 * cùng), con quái hiện tại, cấp, sao, nhiệm vụ hôm nay — và dẫn vào học.
 *
 * Quest cũ (các khu Iron Frontier, Fjord of Runes… với trận đánh riêng bằng câu
 * SAT) đã bỏ hẳn ngày 24/09/2026: hai hệ game song song, hai loại "sao" khác
 * nhau, người học không biết đang chơi cái nào.
 */

const PANEL = { borderRadius: 22, backgroundColor: 'rgba(23,18,58,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 18 } as const;
const GOLD = '#FACC15';
const MUTED = 'rgba(255,255,255,0.7)';
const WEB = Platform.OS === 'web';
const CRISP = { shapeRendering: 'crispEdges' } as object;

type Mode = { title: string; detail: string; href: string; icon: IconName; color: string };

/** Vị trí sao trên nền sân đấu, theo % khung. */
const ARENA_STARS: [number, number][] = [
  [8, 12], [22, 30], [37, 9], [55, 22], [68, 7], [83, 18], [92, 34], [14, 44], [47, 38],
];

/** Những màn có thanh trận đấu — vào đâu cũng đánh cùng một con quái. */
const MODES: Mode[] = [
  { title: 'Quiz từ vựng', detail: 'Học xen kẽ, kiểm tra, điền vào câu', href: '/vocabulary/quiz', icon: 'letters', color: '#10B981' },
  { title: 'SAT Math', detail: 'Luyện từng dạng, đề tính giờ', href: '/math', icon: 'grid', color: '#6366F1' },
  { title: 'SAT Verbal', detail: 'Đọc hiểu, ngữ pháp, từ trong ngữ cảnh', href: '/sat-rw', icon: 'book', color: '#F43F5E' },
  { title: 'Chép chính tả', detail: 'Nghe một câu, gõ lại cho đúng', href: '/sentence/dictation', icon: 'volume', color: '#0EA5E9' },
  { title: 'Dịch câu', detail: 'Việt → Anh theo câu mẫu', href: '/sentence/translate', icon: 'languages', color: '#F59E0B' },
  { title: 'Đọc theo VOA', detail: 'Nói lại từng câu của bài nghe', href: '/shadow', icon: 'mic', color: '#14B8A6' },
  { title: 'Đề của tuần', detail: 'Cả nước cùng làm một đề', href: '/weekly', icon: 'trophy', color: '#EAB308' },
  { title: 'Đấu 1–1', detail: 'Thách bạn 10 câu, điểm chạy trực tiếp', href: '/duel', icon: 'target', color: '#A855F7' },
];

export default function QuestHome() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const g = useGameStore();
  const skin = skinOf(useRewardStore((s) => s.skin));
  const petId = mascotOf(useRewardStore((s) => s.mascot));
  const pet = petId ? MASCOTS[petId] : null;
  const stars = useStarBalance();
  const next = nextMission(useWorldIslands());

  const lv = levelProgress(g.xp);
  const todayKey = dateKey(new Date());
  const today = g.day === todayKey ? g.today : EMPTY_DAY;
  const claimed = g.day === todayKey ? g.claimed : [];
  const quests = dailyQuests(todayKey);
  const fight = next?.mission.href ?? '/vocabulary/quiz';

  return (
    <Screen>
      {/* Sân đấu + thông số nhân vật */}
      <Appear>
        <View style={{ ...PANEL, padding: 0, overflow: 'hidden', flexDirection: wide ? 'row' : 'column' }}>
          <Arena wide={wide} skin={skin} petLook={pet?.look ?? null} petColor={pet?.color ?? null} enemyIndex={g.enemyIndex} enemyHp={g.enemyHp} />

          <View style={{ flex: 1, padding: wide ? 28 : 18 }}>
            <View style={{ alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(250,204,21,0.4)', backgroundColor: 'rgba(250,204,21,0.1)', paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.2, color: '#FDE68A' }}>
                READUP QUEST · GAME KHI HỌC
              </Text>
            </View>
            <Text className="font-heavy" style={{ marginTop: 14, fontSize: wide ? 40 : 30, lineHeight: wide ? 46 : 36, color: '#FFFFFF' }}>
              Mỗi câu đúng
            </Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 4, borderRadius: 8, backgroundColor: '#246BFF', paddingHorizontal: 10, paddingVertical: 2 }}>
              <Text className="font-heavy" style={{ fontSize: wide ? 40 : 30, lineHeight: wide ? 46 : 36, color: '#FFFFFF' }}>
                là một nhát chém.
              </Text>
            </View>
            <Text className="font-sans" style={{ marginTop: 12, fontSize: 15, lineHeight: 22, color: MUTED, maxWidth: 560 }}>
              Không có màn chơi riêng: ở mọi bài học, trả lời đúng là chém con quái đang chặn đường, sai thì quái đánh lại. Hạ quái được XP, sao và đồ rơi.
            </Text>

            {/* Cấp + XP */}
            <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text className="font-heavy" style={{ fontSize: 22, color: '#FFFFFF' }}>
                Lv {lv.level}
              </Text>
              <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(250,204,21,0.18)' }}>
                <Text className="font-strong" style={{ fontSize: 12, color: GOLD }}>
                  {titleForLevel(lv.level)}
                </Text>
              </View>
              <Text className="font-semi" style={{ fontSize: 12, color: MUTED }}>
                {lv.into}/{lv.need} XP tới cấp {lv.level + 1}
              </Text>
            </View>
            <View style={{ marginTop: 8, height: 9, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', maxWidth: 520 }}>
              <View style={{ height: 9, width: '100%', backgroundColor: GOLD, transform: [{ scaleX: Math.max(0.02, lv.into / lv.need) }], transformOrigin: 'left' }} />
            </View>

            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip glyph="⭐" value={formatStars(stars)} label="sao" />
              <Chip glyph="❤️" value={`${g.hearts}/${MAX_HEARTS}`} label="tim" />
              <Chip glyph="⚔️" value={g.life.defeated.toLocaleString('vi-VN')} label="quái đã hạ" />
              <Chip glyph="🔥" value={`×${g.life.bestCombo}`} label="combo kỷ lục" />
            </View>

            <View style={{ marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={next ? `Vào trận: ${next.mission.title}` : 'Vào trận'}
                onPress={() => router.push(fight as never)}
                style={({ hovered }: { hovered?: boolean }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 14,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  backgroundColor: hovered ? '#FDE047' : GOLD,
                  ...(WEB ? ({ transition: 'background-color 160ms ease' } as object) : null),
                })}
              >
                <Text className="font-heavy" style={{ fontSize: 15, color: '#2A1B02' }}>
                  Vào trận
                </Text>
                <Icon name="arrow-right" size={16} color="#2A1B02" strokeWidth={2.4} />
              </Pressable>
              <GhostLink label="Bản đồ ReadUp" icon="grid" href="/quest/world" />
              <GhostLink label="Nhân vật & nhiệm vụ" icon="shield" href="/quest/hero" />
              <GhostLink label="Đổi quà" icon="gift" href="/shop" />
            </View>
            <Text className="font-sans" style={{ marginTop: 10, fontSize: 13, color: MUTED }}>
              {next ? `Gợi ý tiếp theo: ${next.island.name} · ${next.mission.title}` : 'Bạn đã đi hết Bản đồ ReadUp — vào bài nào cũng đánh được.'}
            </Text>
          </View>
        </View>
      </Appear>

      {!g.enabled ? (
        <Appear index={1}>
          <View style={{ ...PANEL, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: 'rgba(250,204,21,0.45)' }}>
            <Text style={{ fontSize: 24 }}>⏸️</Text>
            <Text className="font-sans" style={{ flex: 1, fontSize: 14, color: '#FFFFFF' }}>
              Chế độ game đang tắt: màn học không có thanh trận đấu và không cộng XP game.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => g.setEnabled(true)} style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: GOLD }}>
              <Text className="font-strong" style={{ fontSize: 13, color: '#2A1B02' }}>
                Bật lại
              </Text>
            </Pressable>
          </View>
        </Appear>
      ) : null}

      <View style={{ marginTop: 12, flexDirection: wide ? 'row' : 'column', gap: 12, alignItems: 'stretch' }}>
        {/* Nhiệm vụ hôm nay */}
        <Appear index={2} style={{ flex: 1 }}>
          <View style={{ ...PANEL, flex: 1 }}>
            <PanelTitle title="Nhiệm vụ hôm nay" sub="Đổi mỗi ngày. Xong thì bấm nhận thưởng." />
            <View style={{ marginTop: 12, gap: 10 }}>
              {quests.map((q) => {
                const value = Math.min(q.goal, today[q.metric]);
                const done = value >= q.goal;
                const got = claimed.includes(q.id);
                return (
                  <View key={q.id} style={{ borderRadius: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 22 }}>{got ? '✅' : done ? '🎁' : '📜'}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
                        {q.title}
                      </Text>
                      <View style={{ marginTop: 6, height: 7, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                        <View style={{ height: 7, width: '100%', backgroundColor: done ? '#22C55E' : '#60A5FA', transform: [{ scaleX: Math.max(0.02, value / q.goal) }], transformOrigin: 'left' }} />
                      </View>
                      <Text className="font-semi" style={{ marginTop: 4, fontSize: 12, color: MUTED }}>
                        {value}/{q.goal} · +{q.rewardXp} XP{q.rewardItem ? ` và ${ITEMS[q.rewardItem].glyph} ${ITEMS[q.rewardItem].name}` : ''}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      disabled={!done || got}
                      onPress={() => g.claimQuest(q.id)}
                      style={{ borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: done && !got ? GOLD : 'rgba(255,255,255,0.08)' }}
                    >
                      <Text className="font-strong" style={{ fontSize: 13, color: done && !got ? '#2A1B02' : MUTED }}>
                        {got ? 'Đã nhận' : done ? 'Nhận' : 'Chưa xong'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </Appear>

        {/* Luật nhanh */}
        <Appear index={3} style={{ flex: wide ? 0.8 : undefined }}>
          <View style={{ ...PANEL, flex: 1 }}>
            <PanelTitle title="Luật trong 20 giây" />
            <View style={{ marginTop: 12, gap: 8 }}>
              <Rule glyph="⚔️" text={`Đúng một câu: +${XP_CORRECT} XP và một nhát chém.`} />
              <Rule glyph="💔" text="Sai: quái đánh lại, mất 1 tim và mất combo." />
              <Rule glyph="💥" text={`${CRIT_EVERY} câu đúng liền: đòn chí mạng, gấp đôi XP.`} />
              <Rule glyph="👑" text={`Con thứ ${ENEMIES.length} mỗi vòng là Boss — hạ được thưởng lớn.`} />
            </View>
            <Pressable accessibilityRole="link" onPress={() => router.push('/quest/hero' as never)} style={{ marginTop: 12 }}>
              <Text className="font-strong" style={{ fontSize: 13, color: GOLD }}>
                Luật đầy đủ, túi đồ, sổ quái →
              </Text>
            </Pressable>
          </View>
        </Appear>
      </View>

      {/* Vào trận ở đâu */}
      <Appear index={4}>
        <View style={{ ...PANEL, marginTop: 12, marginBottom: 24 }}>
          <PanelTitle title="Vào trận ở đâu cũng được" sub="Thanh trận đấu hiện ngay trên đầu các màn này, đánh chung một con quái." />
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {MODES.map((m) => (
              <Pressable
                key={m.href}
                accessibilityRole="link"
                accessibilityLabel={m.title}
                onPress={() => router.push(m.href as never)}
                style={({ hovered }: { hovered?: boolean }) => ({
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 220,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 16,
                  padding: 12,
                  backgroundColor: hovered ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.06)',
                  ...(WEB ? ({ transition: 'background-color 160ms ease, transform 160ms ease', transform: hovered ? 'translateY(-2px)' : 'none' } as object) : null),
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: m.color }}>
                  <Icon name={m.icon} size={19} color="#FFFFFF" strokeWidth={2.1} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
                    {m.title}
                  </Text>
                  <Text className="font-sans" numberOfLines={1} style={{ fontSize: 12, color: MUTED }}>
                    {m.detail}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Appear>
    </Screen>
  );
}

/**
 * Sân đấu pixel: nhân vật (và linh vật) bên trái, con quái đang chặn đường bên
 * phải với tên, thanh máu và câu khiêu khích.
 */
function Arena({
  wide,
  skin,
  petLook,
  petColor,
  enemyIndex,
  enemyHp,
}: {
  wide: boolean;
  skin: ReturnType<typeof skinOf>;
  petLook: 'owl' | 'fox' | 'cat' | 'dragon' | null;
  petColor: string | null;
  enemyIndex: number;
  enemyHp: number;
}) {
  const enemy = enemyAt(enemyIndex);
  const hero = wide ? 108 : 88;
  const foe = (wide ? 100 : 82) * (enemy.boss ? 1.15 : 1);
  return (
    <View style={{ width: wide ? 440 : '100%', minHeight: wide ? 320 : 230, overflow: 'hidden' }}>
      <LinearGradient colors={['#2B1F66', '#1B1540']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      {ARENA_STARS.map(([x, y], i) => (
        <View key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3, backgroundColor: '#FFFFFF', ...anim('rg-twinkle', 1600 + i * 230, { loop: true, delay: i * 180, timing: 'ease-in-out' }) }} {...MOVE} />
      ))}
      {/* Trăng pixel. */}
      <View style={{ position: 'absolute', left: '7%', top: '9%', width: 30, height: 30 }}>
        <Svg width={30} height={30} viewBox="0 0 14 14" {...CRISP}>
          <Rect x={4} y={0} width={6} height={14} fill="#FEF3C7" />
          <Rect x={2} y={1} width={10} height={12} fill="#FEF3C7" />
          <Rect x={1} y={2} width={12} height={10} fill="#FEF3C7" />
          <Rect x={0} y={4} width={14} height={6} fill="#FEF3C7" />
          <Rect x={4} y={3} width={2} height={2} fill="#FDE68A" />
          <Rect x={8} y={6} width={3} height={3} fill="#FDE68A" />
          <Rect x={3} y={9} width={2} height={2} fill="#FDE68A" />
        </Svg>
      </View>
      {/* Mặt đất: dải cỏ trên nền đất tối. */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, backgroundColor: '#140F33' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 48, height: 6, backgroundColor: '#3F6212' }} />

      {/* Quái: tên + máu + câu khiêu khích ở trên đầu. */}
      <View style={{ position: 'absolute', right: '6%', bottom: 52, alignItems: 'center', width: Math.max(foe, 150) }}>
        <View style={{ marginBottom: 6, borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 9, paddingVertical: 5, maxWidth: 170 }}>
          <Text className="font-semi" style={{ fontSize: 11, color: '#1B1330' }} numberOfLines={2}>
            “{enemy.taunt}”
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {enemy.boss ? (
            <View style={{ borderRadius: 4, paddingHorizontal: 5, backgroundColor: '#DC2626' }}>
              <Text className="font-heavy" style={{ fontSize: 10, letterSpacing: 1, color: '#FFFFFF' }}>
                BOSS
              </Text>
            </View>
          ) : null}
          <Text className="font-strong" numberOfLines={1} style={{ fontSize: 12, color: '#FFFFFF' }}>
            {enemy.name}
          </Text>
        </View>
        <View style={{ marginTop: 4, width: 110, height: 7, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.45)', overflow: 'hidden' }}>
          <View style={{ height: 7, width: '100%', backgroundColor: '#22C55E', transform: [{ scaleX: Math.max(0, Math.min(1, enemyHp / enemy.hp)) }], transformOrigin: 'left' }} />
        </View>
        <Text className="font-semi" style={{ marginTop: 2, fontSize: 10, color: MUTED }}>
          {enemyHp}/{enemy.hp} máu{enemy.round > 0 ? ` · vòng ${enemy.round + 1}` : ''}
        </Text>
        <View style={{ marginTop: 2, ...anim('rg-bob', 1200, { loop: true, timing: 'ease-in-out' }) }} {...MOVE}>
          <PixelSprite name={ENEMY_SPRITE[enemy.id] ?? 'slime'} color={enemy.color} size={foe} />
        </View>
      </View>

      {/* Nhân vật + linh vật. */}
      <View style={{ position: 'absolute', left: '8%', bottom: 52, flexDirection: 'row', alignItems: 'flex-end' }}>
        {petLook && petColor ? (
          <View style={{ marginRight: -6, marginBottom: 2, ...anim('rg-bob', 1100, { loop: true, timing: 'ease-in-out', delay: 300 }) }} {...MOVE}>
            <PixelSprite name={petLook} color={petColor} size={Math.round(hero * 0.42)} />
          </View>
        ) : null}
        <View style={anim('rg-bob', 1500, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
          <PixelSprite name="hero" size={hero} skin={skin} />
        </View>
      </View>
    </View>
  );
}

function Chip({ glyph, value, label }: { glyph: string; value: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}>
      <Text style={{ fontSize: 13 }}>{glyph}</Text>
      <Text className="font-heavy" style={{ fontSize: 13, color: '#FFFFFF' }}>
        {value}
      </Text>
      <Text className="font-sans" style={{ fontSize: 12, color: MUTED }}>
        {label}
      </Text>
    </View>
  );
}

function GhostLink({ label, icon, href }: { label: string; icon: IconName; href: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(href as never)}
      style={({ hovered }: { hovered?: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
        ...(WEB ? ({ transition: 'background-color 160ms ease' } as object) : null),
      })}
    >
      <Icon name={icon} size={15} color="#FFFFFF" strokeWidth={2} />
      <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function PanelTitle({ title, sub }: { title: string; sub?: string }) {
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

function Rule({ glyph, text }: { glyph: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.05)' }}>
      <Text style={{ fontSize: 17 }}>{glyph}</Text>
      <Text className="font-sans" style={{ flex: 1, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.86)' }}>
        {text}
      </Text>
    </View>
  );
}
