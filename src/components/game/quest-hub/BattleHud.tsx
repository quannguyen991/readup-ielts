/**
 * THẺ TRẬN ĐẤU đầu sảnh game: nhân vật (đúng skin, linh vật đang đi cùng), cấp,
 * XP, tim, sao, chuỗi ngày — đối diện là con quái đang chặn đường (máu thật,
 * còn mấy con tới Boss) — và hai lối vào học: "Vào trận" (mở màn chọn mảng →
 * chọn bài, KHÔNG nhảy thẳng vào bài) và "Học tiếp" (ghi rõ tên bài sẽ mở).
 *
 * Mọi số đọc thẳng từ kho: useGameStore, useStarBalance, useStreak, useRewardStore.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import { anim, MOVE } from '@/components/game/game-anim';
import { PixelSprite } from '@/components/game/PixelSprite';
import { ENEMY_SPRITE } from '@/components/game/sprites';
import { MASCOTS } from '@/services/game/mascots';
import { enemyAt, ENEMIES, levelProgress, MAX_HEARTS, titleForLevel } from '@/services/game/rules';
import { findItem, formatStars } from '@/services/gamification/shop';
import type { Island, Mission } from '@/services/world/islands';
import { useGameStore } from '@/store/useGameStore';
import { mascotOf, skinOf, useRewardStore } from '@/store/useRewardStore';
import { useStarBalance } from '@/store/useStarBalance';
import { useStreak } from '@/store/useStudyStore';
import { Bar, CtaButton, Eyebrow, GAP, HUB, Panel, StatPill, useBoxWidth } from './kit';

/** Sân khấu nhỏ: nhân vật nhún nhẹ trên nền đất, linh vật đứng cạnh. */
export function HeroStage({ size = 128 }: { size?: number }) {
  const skinItem = useRewardStore((s) => s.skin);
  const skin = skinOf(skinItem);
  const petId = mascotOf(useRewardStore((s) => s.mascot));
  const pet = petId ? MASCOTS[petId] : null;
  const skinName = findItem(skinItem)?.name ?? 'Hiệp sĩ xanh';
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Nhân vật: ${skinName}${pet ? `, đi cùng ${pet.name}` : ''}`}
      style={{ width: size, height: size, borderRadius: 18, overflow: 'hidden', backgroundColor: HUB.stage, alignItems: 'center', justifyContent: 'flex-end' }}
    >
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round(size * 0.22), backgroundColor: HUB.ground }} />
      <View style={{ position: 'absolute', left: '18%', top: '16%', width: 3, height: 3, backgroundColor: '#FDE68A', opacity: 0.8 }} />
      <View style={{ position: 'absolute', right: '20%', top: '10%', width: 2, height: 2, backgroundColor: '#FFFFFF', opacity: 0.7 }} />
      <View style={anim('rg-bob', 1500, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
        <PixelSprite name="hero" size={Math.round(size * 0.72)} skin={skin} />
      </View>
      <View style={{ marginBottom: Math.round(size * 0.12), marginTop: -Math.round(size * 0.05), width: Math.round(size * 0.46), height: Math.max(5, Math.round(size * 0.06)), borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      {pet ? (
        <View style={{ position: 'absolute', left: Math.round(size * 0.06), bottom: Math.round(size * 0.14) }}>
          <View style={anim('rg-bob', 1100, { loop: true, timing: 'ease-in-out', delay: 300 })} {...MOVE}>
            <PixelSprite name={pet.look} color={pet.color} size={Math.round(size * 0.3)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function hpTone(ratio: number): string {
  if (ratio > 0.5) return HUB.green;
  if (ratio > 0.25) return HUB.amber;
  return HUB.red;
}

/** Con quái đang chặn đường: hình, tên, câu khích, máu, còn mấy con tới Boss. */
export function EnemyBlock({ stage = 96 }: { stage?: number }) {
  const { enemyIndex, enemyHp } = useGameStore(useShallow((s) => ({ enemyIndex: s.enemyIndex, enemyHp: s.enemyHp })));
  const enemy = enemyAt(enemyIndex);
  const ratio = enemy.hp > 0 ? enemyHp / enemy.hp : 0;
  const toBoss = ENEMIES.length - 1 - (enemyIndex % ENEMIES.length);
  const bossLine = enemy.boss ? 'Boss của vòng — hạ được thưởng lớn' : toBoss === 1 ? 'Boss ngay sau con này' : `Boss sau ${toBoss} con nữa`;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP.md }}>
      <View
        accessibilityRole="image"
        accessibilityLabel={`Quái: ${enemy.name}`}
        style={{ width: stage, height: stage, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.stage }}
      >
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: `${enemy.color}22` }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round(stage * 0.2), backgroundColor: HUB.ground }} />
        <View style={anim('rg-bob', 1200, { loop: true, timing: 'ease-in-out' })} {...MOVE}>
          <PixelSprite name={ENEMY_SPRITE[enemy.id] ?? 'slime'} color={enemy.color} size={Math.round(stage * 0.78)} flip />
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Eyebrow text="ĐANG CHẶN ĐƯỜNG" tone="#FCA5A5" />
          {enemy.boss ? (
            <View style={{ borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: HUB.red }}>
              <Text className="font-heavy" style={{ fontSize: 10, letterSpacing: 1, color: '#FFFFFF' }}>
                BOSS
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="font-heavy" style={{ marginTop: 4, fontSize: 17, lineHeight: 22, color: HUB.ink }} numberOfLines={1}>
          {enemy.name}
        </Text>
        <Text className="font-sans" style={{ marginTop: 1, fontSize: 13, fontStyle: 'italic', color: HUB.muted }} numberOfLines={1}>
          “{enemy.taunt}”
        </Text>
        <View style={{ marginTop: 8 }}>
          <Bar value={ratio} color={hpTone(ratio)} height={8} label={`Máu quái ${enemyHp}/${enemy.hp}`} />
        </View>
        <Text className="font-semi" style={{ marginTop: 5, fontSize: 12, color: HUB.muted, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
          {enemyHp}/{enemy.hp} máu · con thứ {enemyIndex + 1}{enemy.round > 0 ? ` · vòng ${enemy.round + 1}` : ''}
        </Text>
        <Text className="font-strong" style={{ marginTop: 2, fontSize: 12, color: enemy.boss ? '#FCA5A5' : HUB.amber }} numberOfLines={1}>
          👑 {bossLine}
        </Text>
      </View>
    </View>
  );
}

/** Cấp, danh hiệu, XP và các viên số liệu của người chơi. */
function PlayerInfo() {
  const g = useGameStore(useShallow((s) => ({ xp: s.xp, hearts: s.hearts, defeated: s.life.defeated })));
  const stars = useStarBalance();
  const streak = useStreak();
  const skinItem = useRewardStore((s) => s.skin);
  const petId = mascotOf(useRewardStore((s) => s.mascot));
  const pet = petId ? MASCOTS[petId] : null;
  const lv = levelProgress(g.xp);
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Eyebrow text="NHÂN VẬT CỦA BẠN" />
      <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Text className="font-heavy" style={{ fontSize: 28, lineHeight: 33, color: HUB.ink }}>
          Lv {lv.level}
        </Text>
        <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(250,204,21,0.16)' }}>
          <Text className="font-strong" style={{ fontSize: 12, color: HUB.gold }}>
            {titleForLevel(lv.level)}
          </Text>
        </View>
      </View>
      <Text className="font-sans" style={{ marginTop: 1, fontSize: 12, color: HUB.muted }} numberOfLines={1}>
        {findItem(skinItem)?.name ?? 'Hiệp sĩ xanh'}
        {pet ? ` · đi cùng ${pet.name}` : ''}
      </Text>
      <View style={{ marginTop: 10 }}>
        <Bar value={lv.need > 0 ? lv.into / lv.need : 0} color={HUB.gold} height={9} label={`XP ${lv.into}/${lv.need} tới cấp ${lv.level + 1}`} />
      </View>
      <Text className="font-semi" style={{ marginTop: 5, fontSize: 12, color: HUB.muted, fontVariant: ['tabular-nums'] }}>
        {lv.into.toLocaleString('vi-VN')}/{lv.need.toLocaleString('vi-VN')} XP tới cấp {lv.level + 1}
      </Text>
      <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <StatPill glyph="❤️" value={`${g.hearts}/${MAX_HEARTS}`} label="tim" />
        <StatPill glyph="⭐" value={formatStars(stars)} label="sao" />
        <StatPill glyph="🔥" value={String(streak.current)} label="ngày liên tiếp" />
        <StatPill glyph="⚔️" value={g.defeated.toLocaleString('vi-VN')} label="quái đã hạ" />
      </View>
    </View>
  );
}

/** Vạch chia có huy hiệu "VS" ở giữa. */
function Versus({ vertical }: { vertical: boolean }) {
  return (
    <View aria-hidden style={vertical ? { width: 1, alignSelf: 'stretch', backgroundColor: HUB.line, justifyContent: 'center', alignItems: 'center' } : { height: 1, alignSelf: 'stretch', backgroundColor: HUB.line, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.panel, borderWidth: 1, borderColor: HUB.line }}>
        <Text className="font-heavy" style={{ fontSize: 11, letterSpacing: 0.5, color: '#FCA5A5' }}>
          VS
        </Text>
      </View>
    </View>
  );
}

export function BattleHud({ next }: { next: { island: Island; mission: Mission } | null }) {
  const [w, onLayout] = useBoxWidth();
  const mode = w >= 1200 ? 'xl' : w >= 680 ? 'md' : 'sm';
  const go = (
    <CtaButton
      glyph="⚔️"
      label="Vào trận"
      sub="Chọn mảng → chọn bài"
      a11yLabel="Vào trận: chọn mảng và bài học"
      onPress={() => router.push('/quest/pick' as never)}
      full
    />
  );
  const resume = next ? (
    <CtaButton
      variant="ghost"
      label={next.mission.title}
      sub={`HỌC TIẾP · ${next.island.name.replace(/^Đảo /, '').toUpperCase()}`}
      a11yLabel={`Học tiếp: ${next.mission.title}`}
      onPress={() => router.push(next.mission.href as never)}
      full
    />
  ) : (
    <CtaButton variant="ghost" label="Nhân vật & túi đồ" onPress={() => router.push('/quest/hero' as never)} full />
  );

  return (
    <View onLayout={onLayout}>
      <Panel pad={mode === 'sm' ? 16 : 20}>
        {mode === 'xl' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP.lg }}>
            <HeroStage size={128} />
            <View style={{ flex: 1.15, minWidth: 0 }}>
              <PlayerInfo />
            </View>
            <Versus vertical />
            <View style={{ flex: 1, minWidth: 0 }}>
              <EnemyBlock stage={104} />
            </View>
            <View style={{ width: 250, gap: GAP.sm }}>
              {go}
              {resume}
            </View>
          </View>
        ) : mode === 'md' ? (
          <View style={{ gap: GAP.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP.lg }}>
              <HeroStage size={112} />
              <PlayerInfo />
              <Versus vertical />
              <View style={{ flex: 1, minWidth: 0 }}>
                <EnemyBlock stage={88} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: GAP.sm }}>
              <View style={{ flex: 1 }}>{go}</View>
              <View style={{ flex: 1 }}>{resume}</View>
            </View>
          </View>
        ) : (
          <View style={{ gap: GAP.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: GAP.md }}>
              <HeroStage size={88} />
              <PlayerInfo />
            </View>
            <View style={{ marginVertical: 4 }}>
              <Versus vertical={false} />
            </View>
            <EnemyBlock stage={76} />
            <View style={{ gap: GAP.sm, marginTop: 2 }}>
              {go}
              {resume}
            </View>
          </View>
        )}
      </Panel>
    </View>
  );
}
