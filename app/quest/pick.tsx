import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ensureGameKeyframes } from '@/components/game/game-anim';
import {
  AREA_ICON,
  AREA_TONE,
  AreaCard,
  DarkChip,
  PICK_AREAS,
  QUEST_GOLD,
  QUEST_MUTED,
  QUICK_FIGHTS,
  QuickFight,
  StageTile,
  StepBar,
} from '@/components/game/QuestPicker';
import { Grid } from '@/components/layout/Grid';
import { BackPill, HUB, Panel } from '@/components/game/quest-hub/kit';
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { Icon } from '@/components/ui';
import { useHotkeys } from '@/components/vocab/study/StudyKit';
import { useWorldIslands } from '@/components/world/useWorldIslands';
import type { Island } from '@/services/world/islands';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteMagnifier, Motion } from '@/components/illust/CuteMore';
import { islandShortName, islandTagline, levelLabel, missionTitle } from '@/components/world/island-label';
import { useL } from '@/i18n/useL';

/**
 * CHỌN TRẬN — bấm "Vào trận" ở Band 9 Quest là tới đây.
 *
 *   Bước 1: chọn MẢNG (loại bài học): SAT Math, SAT Verbal, Từ vựng, Nghe & chép, Dịch câu.
 *   Bước 2: chọn BÀI trong mảng đó (tiến độ thật, bài nên học tiếp được đánh dấu).
 *   Bước 3: vào bài — Math/Verbal mở trang lý thuyết trước, rồi mới luyện.
 *
 * Mảng nằm trên URL (`?area=math`) nên nút Quay lại của trình duyệt đưa về bước 1
 * đúng như người dùng nghĩ. Quái trong game khi học đánh ở MỌI bài, nên chọn bài
 * nào cũng là vào trận.
 *
 * Cùng bộ thẻ xanh mực với sảnh game (`components/game/quest-hub/kit`, 30/09/2026).
 */

type Filter = 'all' | 'open' | 'done';

export default function QuestPick() {
  const { L } = useL();
  useEffect(ensureGameKeyframes, []);
  const { area } = useLocalSearchParams<{ area?: string }>();
  const islands = useWorldIslands();
  const areas = useMemo(() => PICK_AREAS.map((id) => islands.find((i) => i.id === id)).filter((i): i is Island => !!i), [islands]);
  const chosen = areas.find((i) => i.id === area);

  useHotkeys((e) => {
    if (e.key === 'Escape') router.replace((chosen ? '/quest/pick' : '/quest') as never);
    if (!chosen && /^[1-5]$/.test(e.key)) {
      const pick = areas[Number(e.key) - 1];
      if (pick) router.push(`/quest/pick?area=${pick.id}` as never);
    }
  });

  return (
    <Screen>
      <View style={{ width: '100%', maxWidth: 1280, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <BackPill label={chosen ? L('Đổi mảng', 'Change area') : 'Band 9 Quest'} onPress={() => router.replace((chosen ? '/quest/pick' : '/quest') as never)} />
          <StepBar step={chosen ? 2 : 1} />
        </View>

        <CrossFade swapKey={chosen?.id ?? 'areas'}>
          {chosen ? <LessonStep island={chosen} /> : <AreaStep areas={areas} />}
        </CrossFade>
      </View>
    </Screen>
  );
}

function AreaStep({ areas }: { areas: Island[] }) {
  const { L } = useL();
  return (
    <View style={{ marginTop: 18, marginBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text accessibilityRole="header" className="font-heavy" style={{ fontSize: 30, lineHeight: 36, color: HUB.ink }}>
            {L('Hôm nay đánh ở mảng nào?', 'Where will you fight today?')}
          </Text>
          <Text className="font-sans" style={{ marginTop: 6, fontSize: 15, lineHeight: 22, color: QUEST_MUTED, maxWidth: 620 }}>
            {L(
              'Chọn loại bài học trước, sau đó chọn bài. Bài nào cũng có quái chặn đường: trả lời đúng là chém.',
              'Pick a type of lesson first, then a lesson. Every lesson has a monster in the way: each correct answer is a strike.',
            )}
          </Text>
        </View>
        <PageStickers scene="duel" />
      </View>

      <View style={{ marginTop: 18 }}>
        <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
          {areas.map((island, i) => (
            <Appear key={island.id} index={i} style={{ height: '100%' }}>
              <AreaCard island={island} onPress={() => router.push(`/quest/pick?area=${island.id}` as never)} />
            </Appear>
          ))}
        </Grid>
      </View>

      <Panel style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <View aria-hidden>
            <SealIcon name="flame" color="#F0703F" size={32} />
          </View>
          <Text className="font-heavy" style={{ fontSize: 16, color: '#2A1808' }}>
            {L('Trận nhanh', 'Quick battle')}
          </Text>
          <View aria-hidden>
            <Label text={L('Vào là đánh ⚡', 'Jump right in ⚡')} color="#F2B632" ink="#2A1B02" tilt={-4} size={10} />
          </View>
        </View>
        <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, color: QUEST_MUTED }}>
          {L('Không cần chọn bài — vào là đánh.', 'No need to pick a lesson — just start fighting.')}
        </Text>
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {QUICK_FIGHTS.map((q) => (
            <QuickFight key={q.href} item={q} />
          ))}
        </View>
      </Panel>
    </View>
  );
}

function LessonStep({ island }: { island: Island }) {
  const { L, locale } = useL();
  const [filter, setFilter] = useState<Filter>('all');
  const [level, setLevel] = useState<string>('all');
  const next = island.missions.find((m) => !m.done) ?? null;

  const levels = useMemo(() => {
    const seen: { label: string; tier: number }[] = [];
    for (const m of island.missions) {
      if (m.level && !seen.some((s) => s.label === m.level)) seen.push({ label: m.level, tier: m.tier ?? 1 });
    }
    return seen.sort((a, b) => a.tier - b.tier).map((s) => s.label);
  }, [island]);

  const shown = island.missions.filter(
    (m) => (filter === 'all' || (filter === 'done') === m.done) && (level === 'all' || m.level === level),
  );
  const open = island.missions.length - island.done;
  const tone = AREA_TONE[island.id] ?? island.color;

  return (
    <View style={{ marginTop: 18, marginBottom: 28 }}>
      <Panel style={{ overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: tone }} />
        <View style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: tone }}>
          <Icon name={AREA_ICON[island.id]} size={26} color="#FFFFFF" strokeWidth={2.1} />
        </View>
        <View style={{ flex: 1, minWidth: 220 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <Text accessibilityRole="header" className="font-heavy" style={{ fontSize: 26, lineHeight: 32, color: HUB.ink }}>
              {islandShortName(island, locale)}
            </Text>
            {island.missions.length > 0 && island.done === island.missions.length ? (
              <View aria-hidden>
                <Motion kind="pop">
                  <Label text={L('Xong hết! 🏆', 'All done! 🏆')} color="#22A06B" ink="#FFFFFF" tilt={-4} size={11} />
                </Motion>
              </View>
            ) : null}
          </View>
          <Text className="font-sans" style={{ marginTop: 2, fontSize: 14, color: QUEST_MUTED }}>
            {islandTagline(island, locale)}
          </Text>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 420 }}>
            <View style={{ flex: 1, height: 7, borderRadius: 3, backgroundColor: HUB.track, overflow: 'hidden' }}>
              <View style={{ height: 7, width: '100%', backgroundColor: tone, transform: [{ scaleX: Math.max(0.02, island.progress) }], transformOrigin: 'left' }} />
            </View>
            <Text className="font-strong" style={{ fontSize: 12, color: '#2A1808' }}>
              {L(`${island.done}/${island.missions.length} bài đã qua`, `${island.done}/${island.missions.length} lessons passed`)}
            </Text>
          </View>
        </View>
        {next ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={L(`Học tiếp: ${missionTitle(next, locale)}`, `Continue: ${missionTitle(next, locale)}`)}
            onPress={() => router.push(next.href as never)}
            style={({ hovered }: { hovered?: boolean }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 11,
              maxWidth: 320,
              backgroundColor: hovered ? '#FDE047' : QUEST_GOLD,
            })}
          >
            <View style={{ flexShrink: 1 }}>
              <Text className="font-semi" style={{ fontSize: 12, color: '#5B4205' }}>
                {L('HỌC TIẾP', 'CONTINUE')}
              </Text>
              <Text className="font-heavy" style={{ fontSize: 14, color: '#2A1B02' }} numberOfLines={1}>
                {missionTitle(next, locale)}
              </Text>
            </View>
            <Icon name="arrow-right" size={16} color="#2A1B02" strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </Panel>

      <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <DarkChip label={L(`Tất cả · ${island.missions.length}`, `All · ${island.missions.length}`)} active={filter === 'all'} onPress={() => setFilter('all')} />
        <DarkChip label={L(`Chưa qua · ${open}`, `Not passed · ${open}`)} active={filter === 'open'} onPress={() => setFilter('open')} />
        <DarkChip label={L(`Đã qua · ${island.done}`, `Passed · ${island.done}`)} active={filter === 'done'} onPress={() => setFilter('done')} />
        {levels.length > 1 ? (
          <>
            <View style={{ width: 1, height: 20, backgroundColor: HUB.line, marginHorizontal: 4 }} />
            <DarkChip label={L('Mọi độ khó', 'All levels')} active={level === 'all'} onPress={() => setLevel('all')} />
            {levels.map((l) => (
              <DarkChip key={l} label={levelLabel(l, locale)} active={level === l} onPress={() => setLevel(l)} />
            ))}
          </>
        ) : null}
      </View>

      <View style={{ marginTop: 14 }}>
        {shown.length === 0 ? (
          <Panel style={{ alignItems: 'center' }}>
            <View aria-hidden style={{ marginBottom: 8 }}>
              <Motion kind="wobble">
                <Sticker tilt={-8}>
                  <CuteMagnifier size={48} />
                </Sticker>
              </Motion>
            </View>
            <Text className="font-strong" style={{ fontSize: 14, color: '#2A1808' }}>
              {filter === 'done' ? L('Chưa qua bài nào ở đây.', 'No lessons passed here yet.') : L('Không còn bài nào khớp bộ lọc.', 'No lessons match this filter.')}
            </Text>
          </Panel>
        ) : (
          <CrossFade swapKey={`${filter}-${level}`}>
            <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={12}>
              {shown.map((m) => (
                <StageTile key={m.id} mission={m} color={tone} isNext={m.id === next?.id} />
              ))}
            </Grid>
          </CrossFade>
        )}
      </View>

      {island.id === 'vocab' ? (
        <Pressable accessibilityRole="link" onPress={() => router.push('/vocabulary/quiz' as never)} style={{ marginTop: 14, alignSelf: 'flex-start' }}>
          <Text className="font-strong" style={{ fontSize: 13, color: QUEST_GOLD }}>
            {L('Tìm bộ từ khác (IELTS 50 chủ đề, sổ từ của bạn) →', 'Find other word sets (50 IELTS topics, your word notebook) →')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
