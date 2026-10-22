import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { LionMascot } from '@/components/mascot/LionMascot';
import { Icon } from '@/components/ui/Icon';
import { useGameStore } from '@/store/useGameStore';
import { useStreak } from '@/store/useStudyStore';
import { todayKey } from '@/store/persist';
import { useDisplayName } from '@/store/useAuthStore';
import { useRoadmapStore } from '@/store/useRoadmapStore';
import { useL } from '@/i18n/useL';
import type { CustomPlan, PlanInput, Skill } from '@/services/plan/custom';
import { STAGE_TITLE, agendaFrom, buildMapNodes, stageOf, type MapNode } from '@/services/roadmap/map';
import { AgendaCard } from './AgendaCard';
import { AiPlanCard } from './AiPlanCard';
import { PathMap } from './PathMap';
import { rmColors } from './theme';

/** Từ 1200px trở lên hiện hai cột (bản đồ bên trái, lịch và AI bên phải); dưới đó xếp dọc có thanh tab. */
const WIDE = 1200;

type Tab = 'map' | 'agenda' | 'ai';

/**
 * Lộ trình học theo kiểu bản đồ: đầu trang có tên, mục tiêu, chuỗi ngày và XP; banner giai đoạn có
 * tiến độ thật; đường đi các bài học; và lịch hôm nay cùng AI phân tích lịch. Trên điện thoại chuyển
 * giữa ba khung bằng tab; trên máy tính hiện cùng lúc.
 */
export function RoadmapView({ input, plan, onEdit }: { input: PlanInput; plan: CustomPlan; onEdit: () => void }) {
  const c = rmColors();
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  const today = todayKey();
  const done = useRoadmapStore((s) => s.done);
  const toggleDone = useRoadmapStore((s) => s.toggleDone);
  const setInput = useRoadmapStore((s) => s.setInput);
  const name = useDisplayName();
  const streak = useStreak();
  const xp = useGameStore((s) => s.xp);
  const [tab, setTab] = useState<Tab>('map');
  // Chiều rộng thật của khối bản đồ (đo sau khi bố cục đã chia cột), để bản đồ không tràn cột.
  const [columnWidth, setColumnWidth] = useState(0);

  const nodes = useMemo(() => buildMapNodes(plan, done), [plan, done]);
  const stage = useMemo(() => stageOf(plan, input, today, done), [plan, input, today, done]);
  const days = useMemo(() => agendaFrom(plan, today, done, 7), [plan, today, done]);

  const mapWidth = Math.min(columnWidth > 0 ? columnWidth - 8 : width - 32, 620);
  const target = input.ielts?.target ?? input.sat?.target ?? null;
  const goalLabel = input.ielts ? `IELTS ${target}` : `SAT ${target}`;
  const initial = (name.trim()[0] ?? 'B').toUpperCase();

  const open = (node: MapNode) => router.push(node.href as never);
  const applyPriority = (priority: Skill[]) => setInput({ ...input, weak: priority });

  const mapBlock = (
    <View style={{ gap: 16 }} onLayout={(e) => setColumnWidth(e.nativeEvent.layout.width)}>
      {stage ? <StageBanner stageTitle={STAGE_TITLE[stage.phase]} stageNumbers={stage} goalLabel={goalLabel} /> : null}
      <View style={{ backgroundColor: c.card, borderRadius: 28, paddingVertical: 12, boxShadow: '0 10px 24px rgba(120,80,20,0.10)' } as never}>
        <PathMap nodes={nodes} width={mapWidth} onOpen={open} />
      </View>
    </View>
  );

  const agendaBlock = <AgendaCard days={days} onToggle={toggleDone} />;
  const aiBlock = <AiPlanCard input={input} plan={plan} onApply={applyPriority} />;

  return (
    <View style={{ gap: 16, paddingBottom: 32 }}>
      {/* ----------------------------------------------- đầu trang: người học, mục tiêu, chuỗi, XP */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: c.card }}>
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800' }}>{initial}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 160, gap: 4 }}>
          <Text numberOfLines={1} style={{ color: c.ink, fontSize: 18, fontWeight: '800' }}>
            {name || L('Bạn', 'You')}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: c.goldSoft }}>
              <Text style={{ color: c.goldDeep, fontSize: 12, fontWeight: '800' }}>{goalLabel}</Text>
            </View>
          </View>
        </View>
        <Stat icon="flame" value={String(streak.current)} label={L('Chuỗi', 'Streak')} color="#6A4BD9" />
        <Stat icon="sparkle" value={String(xp)} label="XP" color={c.goldDeep} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L('Sửa mục tiêu và lịch', 'Edit goal and schedule')}
          onPress={onEdit}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, boxShadow: '0 4px 12px rgba(120,80,20,0.12)' } as never}
        >
          <Icon name="pencil" size={18} color={c.ink} />
        </Pressable>
      </View>

      {/* ------------------------------------------------- phone: thanh tab chuyển khung */}
      {!wide ? (
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8 }}>
          {(
            [
              ['map', L('Bản đồ', 'Map')],
              ['agenda', L('Lịch hôm nay', "Today's plan")],
              ['ai', L('AI phân tích', 'AI analysis')],
            ] as const
          ).map(([key, label]) => {
            const on = tab === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(key)}
                style={{ flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ink : c.card }}
              >
                <Text style={{ color: on ? '#FFFFFF' : c.body, fontSize: 13, fontWeight: '800' }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {wide ? (
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0 }}>{mapBlock}</View>
          <View style={{ width: 380, gap: 16 }}>
            {agendaBlock}
            {aiBlock}
          </View>
        </View>
      ) : (
        <>
          {tab === 'map' ? mapBlock : null}
          {tab === 'agenda' ? agendaBlock : null}
          {tab === 'ai' ? aiBlock : null}
        </>
      )}
    </View>
  );
}

function Stat({ icon, value, label, color }: { icon: 'flame' | 'sparkle'; value: string; label: string; color: string }) {
  const c = rmColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 44, borderRadius: 22, backgroundColor: c.card, boxShadow: '0 4px 12px rgba(120,80,20,0.12)' } as never}>
      <Icon name={icon} size={18} color={color} />
      <Text style={{ color: c.ink, fontSize: 15, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

/** Banner giai đoạn: tên giai đoạn, khoảng tuần, số ngày còn lại và tiến độ thật trong giai đoạn. */
function StageBanner({
  stageTitle,
  stageNumbers,
  goalLabel,
}: {
  stageTitle: { vi: string; en: string };
  stageNumbers: { weekFrom: number; weekTo: number; blocksDone: number; blocksTotal: number; daysLeft: number };
  goalLabel: string;
}) {
  const c = rmColors();
  const { L } = useL();
  const pct = stageNumbers.blocksTotal === 0 ? 0 : stageNumbers.blocksDone / stageNumbers.blocksTotal;
  return (
    <LinearGradient
      colors={[c.card, c.goldSoft]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 28, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', boxShadow: '0 10px 24px rgba(120,80,20,0.10)' } as never}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: c.card }}>
          <Text style={{ color: c.goldDeep, fontSize: 12, fontWeight: '800' }}>{goalLabel}</Text>
        </View>
        <Text style={{ color: c.ink, fontSize: 22, fontWeight: '800', lineHeight: 28 }}>{L(stageTitle.vi, stageTitle.en)}</Text>
        <Text style={{ color: c.body, fontSize: 13 }}>
          {L(`Tuần ${stageNumbers.weekFrom}–${stageNumbers.weekTo} · còn ${stageNumbers.daysLeft} ngày tới kỳ thi`, `Weeks ${stageNumbers.weekFrom}–${stageNumbers.weekTo} · ${stageNumbers.daysLeft} days to the exam`)}
        </Text>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(106, 75, 217,0.16)', overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(pct * 100)}%`, height: 10, borderRadius: 5, backgroundColor: c.gold }} />
        </View>
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>
          {L(`Hoàn thành ${stageNumbers.blocksDone}/${stageNumbers.blocksTotal} bài học`, `${stageNumbers.blocksDone}/${stageNumbers.blocksTotal} lessons done`)}
        </Text>
      </View>
      <LionMascot pose={pct >= 0.9 ? 'cheer' : 'point'} size={104} />
    </LinearGradient>
  );
}
