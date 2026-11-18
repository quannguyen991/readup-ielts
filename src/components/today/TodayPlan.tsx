import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';

import { SKILL_TONE } from '@/components/plan/PlanBlockRow';
import { INK, MUTED } from '@/components/hsa/stage';
import { NEON_COLORS, NeonWindow } from '@/components/neon/Neon';
import { DailyPlanStage, type StageChip, type StageTask } from '@/components/today/DailyPlanStage';
import { Icon } from '@/components/ui/Icon';
import { bi, useL } from '@/i18n/useL';
import { inferredDone } from '@/services/hsa/plan';
import { SKILL_LABEL, blocksOn, planWeekOf, type Skill } from '@/services/plan/custom';
import { todayKey } from '@/store/persist';
import { useHydrated } from '@/components/layout/useHydrated';
import { useMyRank } from '@/services/gamification/useMyRank';
import { placementDone, useHsaStore } from '@/store/useHsaStore';
import { useCustomPlan, useRoadmapStore } from '@/store/useRoadmapStore';

/**
 * LỘ TRÌNH HÔM NAY + TIẾN ĐỘ HÔM NAY trên trang Hôm nay, theo phong cách ảnh mẫu.
 *
 * Bài của hôm nay đến từ số liệu thật: các khối của ngày trong lộ trình cá nhân (`blocksOn`), kế hoạch
 * HSA của hôm nay nếu có, và khi chưa có lộ trình thì hai gợi ý tối thiểu (bài đọc kế tiếp, ôn từ).
 * Không bài nào bị bịa ra: gợi ý nào không có dữ liệu thì không hiện.
 */
const SKILL_LABEL_EN: Record<Skill, string> = {
  reading: 'IELTS Reading',
  listening: 'Listen & dictate',
  writing: 'IELTS Writing',
  vocab: 'Vocabulary',
  math: 'SAT Math',
  verbal: 'SAT Verbal',
};

const HSA_TEAL = '#0E7C86';
type Props = {
  wide: boolean;
  greeting: string;
  displayName: string;
  recommended: { id: string; title: string } | null | undefined;
  due: number;
  minutes: number;
  goal: number;
  streak: number;
};

export function TodayPlanHero({ wide, greeting, displayName, recommended, due, minutes, goal, streak }: Props) {
  const { L, en, locale } = useL();
  const today = todayKey();
  const input = useRoadmapStore((s) => s.input);
  const roadmapDone = useRoadmapStore((s) => s.done);
  const toggleDone = useRoadmapStore((s) => s.toggleDone);
  const plan = useCustomPlan();
  const hydrated = useHydrated();
  const myRank = useMyRank();

  const hsaPlan = useHsaStore((s) => s.plans[today]);
  const hsaDone = useHsaStore((s) => s.done);
  const hsaAttempts = useHsaStore((s) => s.attempts);
  const toggleHsa = useHsaStore((s) => s.toggleTask);
  const hsaToday = useMemo(() => hsaAttempts.filter((a) => todayKey(new Date(a.finishedAt)) === today).map((a) => a.activity), [hsaAttempts, today]);
  const hsaPlaced = placementDone(hsaAttempts);

  const tasks: StageTask[] = [];

  if (plan) {
    for (const b of blocksOn(plan, today)) {
      const tone = SKILL_TONE[b.skill];
      tasks.push({
        id: `plan:${b.id}`,
        tag: b.skill === 'check' ? L('Cửa kiểm tra', 'Checkpoint') : en ? SKILL_LABEL_EN[b.skill] : SKILL_LABEL[b.skill],
        tagColor: tone.tone,
        title: b.title.replace(/^[^·]+· /, ''),
        why: b.detail,
        minutes: b.minutes,
        href: b.href,
        done: !!roadmapDone[b.id],
        onToggle: () => toggleDone(b.id),
      });
    }
  }

  if (hsaPlan) {
    for (const t of hsaPlan.tasks) {
      tasks.push({
        id: `hsa:${t.id}`,
        tag: 'HSA',
        tagColor: HSA_TEAL,
        title: bi(t.title, locale),
        why: bi(t.why, locale),
        minutes: t.minutes,
        href: t.href,
        done: !!hsaDone[`${today}|${t.id}`] || inferredDone(t, hsaToday, hsaPlaced),
        onToggle: () => toggleHsa(today, t.id),
      });
    }
  }

  // Chưa có bài nào của hôm nay (chưa lập lộ trình, hoặc hôm nay là ngày nghỉ): chỉ gợi ý những gì có thật.
  const fallback = tasks.length === 0;
  if (fallback) {
    if (recommended) {
      tasks.push({
        id: 'auto:read',
        tag: L('Bài đọc kế tiếp', 'Next reading'),
        tagColor: SKILL_TONE.reading.tone,
        title: recommended.title,
        why: L('Bài đọc phù hợp nhất để học tiếp từ chỗ bạn đang dừng.', 'The best passage to pick up from where you stopped.'),
        minutes: 20,
        href: `/read/${recommended.id}`,
        done: false,
      });
    }
    tasks.push({
      id: 'auto:vocab',
      tag: L('Từ vựng', 'Vocabulary'),
      tagColor: SKILL_TONE.vocab.tone,
      title: due > 0 ? L(`Ôn ${due} từ đến hạn`, `Review ${due} words due`) : L('Xem lịch ôn từ vựng', 'See the review schedule'),
      why: due > 0 ? L('Ôn đúng hạn thì nhớ lâu hơn học dồn.', 'Reviewing on time sticks longer than cramming.') : L('Chưa có từ nào đến hạn hôm nay.', 'No words are due today.'),
      minutes: 10,
      href: '/vocabulary/spaced-repetition',
      done: false,
    });
  }

  const learning = tasks.filter((t) => !/vocab|spaced-repetition|\/hsa\/vocab/.test(t.href)).length;
  const hasVocab = tasks.some((t) => /vocab|spaced-repetition/.test(t.href));
  const headline = fallback
    ? L('Mình học tiếp nhé?', 'Ready for your next step?')
    : hasVocab
      ? L(`Hôm nay, ${learning} bài + ôn từ.`, `Today: ${learning} ${learning === 1 ? 'lesson' : 'lessons'} + vocabulary.`)
      : L(`Hôm nay, ${tasks.length} bài.`, `Today: ${tasks.length} ${tasks.length === 1 ? 'lesson' : 'lessons'}.`);

  const week = input ? planWeekOf(input, today) : null;
  const dateLabel = `${new Date().toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}${week ? ` · ${L('Tuần', 'Week')} ${week}` : ''}`;

  // Hạng chỉ có khi đang trong top 20 của bảng tháng; ngoài bảng thì nói thẳng, không bịa số.
  const rankLabel = !hydrated || !myRank.signedIn || !myRank.ready
    ? L('Xếp hạng', 'Ranking')
    : myRank.inBoard
      ? L(`Hạng ${myRank.rank}`, `Rank ${myRank.rank}`)
      : myRank.monthPoints > 0
        ? L('Ngoài top 20', 'Outside top 20')
        : L('Chưa có hạng', 'Unranked');

  const chips: StageChip[] = [
    { label: rankLabel, icon: 'crown', onPress: () => router.push('/leaderboard' as never) },
    // Số lấy từ nhật ký học trên máy: trước khi đọc xong dữ liệu lưu thì chưa biết, không hiện "0" giả.
    { label: hydrated ? L(`${streak} ngày`, `${streak}d`) : '…', icon: 'flame' },
    { label: hydrated ? L(`${minutes}/${goal} phút`, `${minutes}/${goal} min`) : '…', icon: 'clock' },
  ];

  return (
    <DailyPlanStage
      wide={wide}
      dateLabel={wide ? `${greeting}, ${displayName} · ${dateLabel}` : dateLabel}
      headline={headline}
      chips={chips}
      tasks={tasks}
      empty={
        <Text className="font-nun-strong" style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>
          {L('Chưa có bài nào cho hôm nay.', 'Nothing planned for today.')}
        </Text>
      }
      footer={
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {!plan ? <FooterLink label={L('Lập lộ trình', 'Plan')} onPress={() => router.push('/plan' as never)} /> : null}
          <FooterLink label={L('Tiến độ', 'Progress')} onPress={() => router.push('/progress' as never)} />
        </View>
      }
    />
  );
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 42, borderRadius: 21, backgroundColor: hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)' })}>
      <Text className="font-nun-heavy" style={{ fontSize: 14, color: '#FFFFFF' }}>
        {label}
      </Text>
      <Icon name="arrow-right" size={14} color="#FFFFFF" strokeWidth={2.4} />
    </Pressable>
  );
}

// ---------------------------------------------------------------- tiến độ hôm nay

function Ring({ size, stroke, pct }: { size: number; stroke: number; pct: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, pct));
  const mid = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={mid} cy={mid} r={r} stroke="#EFEAFB" strokeWidth={stroke} fill="none" />
      {p > 0 ? <Circle cx={mid} cy={mid} r={r} stroke="#2A22B5" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${c * p} ${c}`} transform={`rotate(-90 ${mid} ${mid})`} /> : null}
    </Svg>
  );
}

type ProgressProps = {
  wide: boolean;
  minutes: number;
  goal: number;
  recentDays: { date: string; minutes: number; questions: number }[];
  latest: { title: string; correct: number; total: number; finishedAt: string } | null;
  due: number;
};

/** Thẻ "Hôm nay" kiểu cửa sổ ba chấm: vòng phút học, 7 ngày vừa qua, lượt gần nhất và nút ôn từ. */
export function TodayProgressCard({ wide, minutes, goal, recentDays, latest, due }: ProgressProps) {
  const { L, en } = useL();
  const fmt = (n: number) => n.toLocaleString(en ? 'en-US' : 'vi-VN');
  const pct = goal > 0 ? minutes / goal : 0;
  const goalLine = minutes >= goal ? L('Đủ mục tiêu', 'Goal met') : L(`Còn ${fmt(goal - minutes)} phút`, `${fmt(goal - minutes)} min to go`);
  const labels = en ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const maxDay = Math.max(1, ...recentDays.map((d) => d.minutes));
  const weeklyMinutes = recentDays.reduce((s, d) => s + d.minutes, 0);
  const weeklyQuestions = recentDays.reduce((s, d) => s + d.questions, 0);
  return (
    <View style={{ width: wide ? 330 : '100%' }}>
      <NeonWindow title={L('Hôm nay', 'Today')} icon="clock" badge={`${Math.round(pct * 100)}%`}>
        <View style={{ gap: 14 }}>
          <Text className="font-nun-strong" style={{ fontSize: 13, color: MUTED }}>
            {goalLine}
          </Text>

          <View style={{ alignSelf: 'center', width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
            <Ring size={150} stroke={14} pct={pct} />
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <Text className="font-nun-heavy" style={{ fontSize: 38, lineHeight: 44, color: INK }}>
                {fmt(minutes)}
              </Text>
              <Text className="font-nun-strong" style={{ fontSize: 13, color: MUTED }}>
                {L(`/ ${fmt(goal)} phút`, `/ ${fmt(goal)} min`)}
              </Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: '#EDE7FA', paddingTop: 14 }}>
            <Text className="font-nun-heavy" style={{ fontSize: 13, color: INK }}>
              {L('7 ngày', '7 days')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 76, marginTop: 10, gap: 8 }}>
              {recentDays.map((day, index) => {
                const barHeight = day.minutes > 0 ? Math.max(8, (day.minutes / maxDay) * 56) : 6;
                const weekday = new Date(`${day.date}T12:00:00`).getDay();
                const isToday = index === recentDays.length - 1;
                return (
                  <View key={`${day.date}-${index}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <View style={{ width: '100%', maxWidth: 24, height: barHeight, borderRadius: 999, backgroundColor: isToday ? NEON_COLORS.pink : '#B9A9FF' }} />
                    <Text className="font-nun-heavy" style={{ fontSize: 12, color: MUTED }}>
                      {labels[weekday]}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Text className="font-nun-strong" style={{ fontSize: 13, color: MUTED }}>{`${fmt(weeklyMinutes)} ${L('phút', 'min')}`}</Text>
              <Text className="font-nun-strong" style={{ fontSize: 13, color: MUTED }}>{`${fmt(weeklyQuestions)} ${L('câu', 'questions')}`}</Text>
            </View>
          </View>

          <View style={{ borderRadius: 16, backgroundColor: '#F5F2FF', padding: 12 }}>
            <Text className="font-nun-heavy" numberOfLines={1} style={{ fontSize: 13, color: INK }}>
              {latest ? latest.title : L('Chưa có buổi nào', 'No sessions yet')}
            </Text>
            {latest ? (
              <Text className="font-nun-strong" style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                {`${latest.correct}/${latest.total} ${L('đúng', 'correct')}`}
              </Text>
            ) : null}
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push('/vocabulary/spaced-repetition' as never)} style={({ hovered }) => ({ height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? '#3A31C8' : NEON_COLORS.indigo, borderWidth: 2, borderColor: '#8F84FF' })}>
            <Text className="font-nun-heavy" style={{ fontSize: 15, color: '#FFFFFF' }}>
              {due > 0 ? L(`Ôn ${fmt(due)} từ`, `Review ${fmt(due)}`) : L('Lịch ôn', 'Review')}
            </Text>
          </Pressable>
        </View>
      </NeonWindow>
    </View>
  );
}
