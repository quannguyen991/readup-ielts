import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ensureGameKeyframes } from '@/components/game/game-anim';
import {
  AREA_ICON,
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
import { Screen } from '@/components/layout/Screen';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { Icon } from '@/components/ui';
import { useHotkeys } from '@/components/vocab/study/StudyKit';
import { useWorldIslands } from '@/components/world/useWorldIslands';
import type { Island } from '@/services/world/islands';

/**
 * CHỌN TRẬN — bấm "Vào trận" ở ReadUp Quest là tới đây.
 *
 *   Bước 1: chọn MẢNG (loại bài học): SAT Math, SAT Verbal, Từ vựng, Nghe & chép, Dịch câu.
 *   Bước 2: chọn BÀI trong mảng đó (tiến độ thật, bài nên học tiếp được đánh dấu).
 *   Bước 3: vào bài — Math/Verbal mở trang lý thuyết trước, rồi mới luyện.
 *
 * Mảng nằm trên URL (`?area=math`) nên nút Quay lại của trình duyệt đưa về bước 1
 * đúng như người dùng nghĩ. Quái trong game khi học đánh ở MỌI bài, nên chọn bài
 * nào cũng là vào trận.
 */

const PAD = { borderRadius: 22, backgroundColor: 'rgba(23,18,58,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 18 } as const;

type Filter = 'all' | 'open' | 'done';

export default function QuestPick() {
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace((chosen ? '/quest/pick' : '/quest') as never)}
          style={({ hovered }: { hovered?: boolean }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          })}
        >
          <Icon name="chevron-left" size={15} color="#FFFFFF" />
          <Text className="font-strong" style={{ fontSize: 13, color: '#FFFFFF' }}>
            {chosen ? 'Đổi mảng' : 'ReadUp Quest'}
          </Text>
        </Pressable>
        <StepBar step={chosen ? 2 : 1} />
      </View>

      <CrossFade swapKey={chosen?.id ?? 'areas'}>
        {chosen ? <LessonStep island={chosen} /> : <AreaStep areas={areas} />}
      </CrossFade>
    </Screen>
  );
}

function AreaStep({ areas }: { areas: Island[] }) {
  return (
    <View style={{ marginTop: 18, marginBottom: 28 }}>
      <Text className="font-heavy" style={{ fontSize: 30, lineHeight: 36, color: '#FFFFFF' }}>
        Hôm nay đánh ở mảng nào?
      </Text>
      <Text className="font-sans" style={{ marginTop: 6, fontSize: 15, lineHeight: 22, color: QUEST_MUTED, maxWidth: 620 }}>
        Chọn loại bài học trước, sau đó chọn bài. Bài nào cũng có quái chặn đường: trả lời đúng là chém.
      </Text>

      <View style={{ marginTop: 18 }}>
        <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
          {areas.map((island, i) => (
            <Appear key={island.id} index={i} style={{ height: '100%' }}>
              <AreaCard island={island} onPress={() => router.push(`/quest/pick?area=${island.id}` as never)} />
            </Appear>
          ))}
        </Grid>
      </View>

      <View style={{ ...PAD, marginTop: 16 }}>
        <Text className="font-heavy" style={{ fontSize: 16, color: '#FFFFFF' }}>
          Trận nhanh
        </Text>
        <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, color: QUEST_MUTED }}>
          Không cần chọn bài — vào là đánh.
        </Text>
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {QUICK_FIGHTS.map((q) => (
            <QuickFight key={q.href} item={q} />
          ))}
        </View>
      </View>
    </View>
  );
}

function LessonStep({ island }: { island: Island }) {
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

  return (
    <View style={{ marginTop: 18, marginBottom: 28 }}>
      <View style={{ ...PAD, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: island.color }}>
          <Icon name={AREA_ICON[island.id]} size={26} color="#FFFFFF" strokeWidth={2.1} />
        </View>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text className="font-heavy" style={{ fontSize: 26, lineHeight: 32, color: '#FFFFFF' }}>
            {island.name.replace(/^Đảo /, '')}
          </Text>
          <Text className="font-sans" style={{ marginTop: 2, fontSize: 14, color: QUEST_MUTED }}>
            {island.tagline}
          </Text>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 420 }}>
            <View style={{ flex: 1, height: 7, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <View style={{ height: 7, width: '100%', backgroundColor: island.color, transform: [{ scaleX: Math.max(0.02, island.progress) }], transformOrigin: 'left' }} />
            </View>
            <Text className="font-strong" style={{ fontSize: 12, color: '#FFFFFF' }}>
              {island.done}/{island.missions.length} bài đã qua
            </Text>
          </View>
        </View>
        {next ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Học tiếp: ${next.title}`}
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
              <Text className="font-semi" style={{ fontSize: 11, color: '#5B4205' }}>
                HỌC TIẾP
              </Text>
              <Text className="font-heavy" style={{ fontSize: 14, color: '#2A1B02' }} numberOfLines={1}>
                {next.title}
              </Text>
            </View>
            <Icon name="arrow-right" size={16} color="#2A1B02" strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <DarkChip label={`Tất cả · ${island.missions.length}`} active={filter === 'all'} onPress={() => setFilter('all')} />
        <DarkChip label={`Chưa qua · ${open}`} active={filter === 'open'} onPress={() => setFilter('open')} />
        <DarkChip label={`Đã qua · ${island.done}`} active={filter === 'done'} onPress={() => setFilter('done')} />
        {levels.length > 1 ? (
          <>
            <View style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 }} />
            <DarkChip label="Mọi độ khó" active={level === 'all'} onPress={() => setLevel('all')} />
            {levels.map((l) => (
              <DarkChip key={l} label={l} active={level === l} onPress={() => setLevel(l)} />
            ))}
          </>
        ) : null}
      </View>

      <View style={{ marginTop: 14 }}>
        {shown.length === 0 ? (
          <View style={{ ...PAD, alignItems: 'center' }}>
            <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
              {filter === 'done' ? 'Chưa qua bài nào ở đây.' : 'Không còn bài nào khớp bộ lọc.'}
            </Text>
          </View>
        ) : (
          <CrossFade swapKey={`${filter}-${level}`}>
            <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={12}>
              {shown.map((m) => (
                <StageTile key={m.id} mission={m} color={island.color} isNext={m.id === next?.id} />
              ))}
            </Grid>
          </CrossFade>
        )}
      </View>

      {island.id === 'vocab' ? (
        <Pressable accessibilityRole="link" onPress={() => router.push('/vocabulary/quiz' as never)} style={{ marginTop: 14, alignSelf: 'flex-start' }}>
          <Text className="font-strong" style={{ fontSize: 13, color: QUEST_GOLD }}>
            Tìm bộ từ khác (IELTS 50 chủ đề, sổ từ của bạn) →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
