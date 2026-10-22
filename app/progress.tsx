import { HeroShell } from '@/components/layout/HeroShell';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BarChart, DonutChart, Heatmap, HorizontalBars, LineChart } from '@/components/charts';
import { Grid } from '@/components/layout/Grid';
import { useNow } from '@/lib/clock';
import { Screen } from '@/components/layout/Screen';
import { LinearGradient } from 'expo-linear-gradient';

import { LionMascot, type LionPose } from '@/components/mascot/LionMascot';
import {
  Badge,
  Button,
  Card,
  Icon,
  ProgressBar,
  SectionHeader,
  StatCard,
  TrendBadge,
} from '@/components/ui';
import { filterArticles, getArticleWithBody } from '@/data/articles';
import { ActivityList } from '@/components/progress/ActivityList';
import { StreakRewardsCard } from '@/components/progress/StreakRewardsCard';
import { StreakFlame } from '@/components/gamify/StreakFlame';
import { BadgeShelf } from '@/components/gamify/BadgeShelf';
import { useActivityFeed } from '@/services/activity/use-activity';
import { isActiveDay } from '@/services/gamification/points';
import { bandDelta, formatBand, latestBand } from '@/lib/band';
import { MATH_DOMAIN_LABEL, MATH_ERROR_LABEL, type MathDomain } from '@/lib/math/types';
import { formatAccuracy } from '@/services/math/scoring';
import { QUESTION_TYPE_LABEL } from '@/services/questions/types';
import { useMathDomainStats, useMathErrorTags, useMathTotals } from '@/store/useMathStore';
import { useQuestionStore } from '@/store/useQuestionStore';
import { useAccuracyByType, useRecentDays, useStreak, useStudyStore } from '@/store/useStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { useRoadmapStore } from '@/store/useRoadmapStore';
import { useAuthStore, useDisplayName } from '@/store/useAuthStore';
import { goalProgress } from '@/services/progress/goal';
import { chartPalette, color } from '@/theme/tokens';
import { themedHex } from '@/theme/palette-state';
import { useL } from '@/i18n/useL';

/**
 * Tiến độ SAT Math.
 *
 * Hai bảng, hai câu hỏi khác nhau: theo DOMAIN trả lời "mảng nào yếu", theo
 * NHÃN LỖI trả lời "hỏng kiểu gì". Bảng thứ hai là thứ bảng theo domain không
 * bao giờ cho thấy — sai dấu rải đều bốn domain thì nhìn theo domain sẽ tưởng
 * là không có vấn đề gì nổi bật.
 */
function MathProgressCard() {
  const { L } = useL();
  const domainStats = useMathDomainStats();
  const errorTags = useMathErrorTags();
  const totals = useMathTotals();

  if (totals.questions === 0) return null;

  const domains = (Object.keys(domainStats) as MathDomain[]).filter((d) => domainStats[d].total > 0);

  return (
    <Card className="mt-4">
      <SectionHeader
        title="SAT Math"
        subtitle={L(`${totals.questions} câu đã làm · đúng ${totals.correct}`, `${totals.questions} questions done · ${totals.correct} correct`)}
        icon="grid"
        iconTone="accent"
        action={{ label: L('Mở module', 'Open module'), onPress: () => router.push('/math' as never) }}
      />

      <View className="mt-4 flex-row flex-wrap gap-6">
        <View className="min-w-[260px] flex-1 gap-3">
          <Text className="font-mid text-label text-muted">{L('Theo domain', 'By domain')}</Text>
          {domains.map((domain) => (
            <View key={domain}>
              <View className="flex-row items-center justify-between">
                <Text className="font-sans text-body text-ink">{MATH_DOMAIN_LABEL[domain]}</Text>
                <Text className="font-strong text-label text-muted">
                  {domainStats[domain].correct}/{domainStats[domain].total} ·{' '}
                  {formatAccuracy(domainStats[domain].accuracy)}
                </Text>
              </View>
              <View className="mt-1">
                <ProgressBar
                  value={Math.round((domainStats[domain].accuracy ?? 0) * 100)}
                  tone={(domainStats[domain].accuracy ?? 0) >= 0.8 ? 'success' : 'primary'}
                />
              </View>
            </View>
          ))}
        </View>

        <View className="min-w-[260px] flex-1 gap-2">
          <Text className="font-mid text-label text-muted">{L('Lỗi hay mắc nhất', 'Most common mistakes')}</Text>
          {errorTags.length === 0 ? (
            <Text className="font-sans text-body text-muted">
              {L('Chưa có câu nào chọn nhầm một đáp án mang nhãn lỗi.', 'No wrong answers with a tagged mistake yet.')}
            </Text>
          ) : (
            errorTags.slice(0, 4).map(({ tag, count }) => (
              <View key={tag} className="flex-row items-start gap-2 rounded-panel bg-surfaceAlt p-2">
                <Badge label={`${count}×`} tone="danger" />
                <Text className="flex-1 font-sans text-body text-ink">{MATH_ERROR_LABEL[tag]}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </Card>
  );
}

/** Progress — bám ảnh tham chiếu số 3, số liệu lấy từ chính hoạt động của bạn. */
export default function ProgressScreen() {
  const { L, en } = useL();
  const displayName = useDisplayName();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const sessions = useStudyStore((s) => s.sessions);
  const recentDays = useRecentDays(range);
  const streak = useStreak();
  const activity = useActivityFeed();
  const accuracyByType = useAccuracyByType();
  // Mục tiêu và điểm xuất phát lấy từ chính người dùng khai (xem services/progress/goal.ts).
  const roadmapIelts = useRoadmapStore((s) => s.input?.ielts ?? null);
  const profileTarget = useAuthStore((s) => s.profile?.targetBand ?? null);
  const readingWpm = useStudyStore((s) => s.readingWpm);
  const words = useVocabStore((s) => Object.keys(s.entries).length);
  const focusSet = useQuestionStore((s) => s.focusSet);

  // Mốc "bây giờ" lấy từ đồng hồ ngoài React (xem `src/lib/clock.ts`): gọi thẳng
  // Date.now() ở đây thì render không còn thuần tuý, và khung 30 ngày sẽ đứng im
  // ở thời điểm mở trang.
  const now = useNow();
  const inRange = useMemo(() => {
    const cutoff = now - range * 86_400_000;
    return sessions.filter((s) => Date.parse(s.finishedAt) >= cutoff);
  }, [sessions, range, now]);

  // Biểu đồ band chỉ vẽ lượt IELTS: lượt SAT không có band, nhét vào là gãy trục.
  const bandSeries = useMemo(
    () =>
      [...inRange].reverse().flatMap((s) =>
        s.estimatedBand == null
          ? []
          : [{ label: s.finishedAt.slice(5, 10), value: s.estimatedBand }],
      ),
    [inRange],
  );

  const currentBand = latestBand(inRange.map((s) => s.estimatedBand));
  const initialBand = bandSeries[0]?.value ?? null;
  const bestBand = bandSeries.length > 0 ? Math.max(...bandSeries.map((b) => b.value)) : null;

  const totalMinutes = recentDays.reduce((sum, d) => sum + d.minutes, 0);
  const accuracy =
    inRange.length === 0
      ? 0
      : Math.round(inRange.reduce((sum, s) => sum + s.accuracy, 0) / inRange.length);
  const avgWpm =
    readingWpm.length === 0
      ? 0
      : Math.round(readingWpm.reduce((sum, w) => sum + w, 0) / readingWpm.length);

  const activityTotals = useMemo(() => {
    const totals = { practice: 0, mock_test: 0, review: 0, reading_library: 0 };
    for (const day of recentDays) {
      totals.practice += day.byActivity.practice;
      totals.mock_test += day.byActivity.mock_test;
      totals.review += day.byActivity.review;
      totals.reading_library += day.byActivity.reading_library;
    }
    return totals;
  }, [recentDays]);

  const weakest = accuracyByType[0];
  // Bài chấm band đầu tiên TỪNG làm (không chỉ trong khung ngày đang xem).
  const firstBand = useMemo(() => {
    const scored = sessions.filter((s) => s.estimatedBand != null);
    scored.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
    return scored[0]?.estimatedBand ?? null;
  }, [sessions]);
  const latestEver = latestBand(sessions.map((s) => s.estimatedBand));
  const goal = goalProgress({
    roadmapTarget: roadmapIelts?.target,
    profileTarget,
    roadmapNow: roadmapIelts?.now,
    firstBand,
    current: latestEver,
  });

  const practiceWeakest = async () => {
    if (!weakest) return;
    // Dạng câu hỏi ở đây là dạng của IELTS, nên chỉ chọn trong bài IELTS.
    const candidates = filterArticles({ kind: 'readable', exam: 'ielts', sort: 'easiest' });
    const meta = candidates[0];
    if (!meta) return;

    // focusSet sinh đề từ chính nội dung bài nên cần toàn văn, mà toàn văn nằm
    // trong chunk riêng chứ không có sẵn trong index.
    const article = getArticleWithBody(meta.id);
    if (!article) return;

    await focusSet(article, weakest.type);
    router.push(`/read/${article.id}` as never);
  };

  const rangeLabel = (r: 7 | 30 | 90) => (r === 7 ? L('Tuần', 'Week') : r === 30 ? L('Tháng', 'Month') : L('3 tháng', '3 months'));
  const weekdays = en ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const weekdayOf = (date: string) => weekdays[new Date(`${date}T00:00:00`).getDay()] ?? date.slice(5);
  // Linh vật theo chuỗi thật: chuỗi từ 3 ngày thì mừng, đang có chuỗi thì vẫy, chưa có thì đọc sách mời học.
  const lionPose: LionPose = streak.current >= 3 ? 'cheer' : streak.current > 0 ? 'wave' : 'read';

  return (
    <Screen>
      {/* Đầu trang: lời chào, linh vật, mục tiêu. Số liệu chi tiết nằm ở phần "Chi tiết" bên dưới. */}
      <View className="flex-row items-center justify-between">
        <Text className="font-heavy text-hero text-ink">{L('Tiến độ của bạn', 'Your progress')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L('Mở kế hoạch học', 'Open study plan')}
          onPress={() => router.push('/plan' as never)}
          className="h-11 w-11 items-center justify-center rounded-pill border border-border bg-white"
        >
          <Icon name="calendar" size={20} color={color.ink} />
        </Pressable>
      </View>

      {/*
        Thẻ đầu trang: linh vật đổi theo chuỗi ngày thật (chuỗi dài thì vui, chưa có chuỗi
        thì mời học). Chấm 7 ngày gần nhất cho thấy nhịp học đều hay đứt quãng.
      */}
      <HeroShell radius={24} style={{ marginTop: 16, padding: 20 }}>
        <View className="flex-row items-center gap-4">
          <LionMascot pose={lionPose} size={104} />
          <View className="min-w-0 flex-1 gap-1">
            <Text numberOfLines={1} className="font-strong text-cardTitle text-ink">
              {displayName || L('Bạn', 'You')}
            </Text>
            <View className="flex-row items-end gap-1.5">
              <StreakFlame days={streak.current} size={34} />
              <Text className="font-heavy text-stat text-ink">{streak.current}</Text>
              <Text className="pb-1 font-mid text-label text-body">{L('ngày liên tiếp', 'day streak')}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/plan' as never)}
              className="mt-1 self-start rounded-pill px-3 py-1.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}
            >
              <Text className="font-semi text-label" style={{ color: themedHex('#6A4BD9') }}>
                {goal.state === 'no-goal' ? L('Đặt mục tiêu', 'Set a goal') : L(`Mục tiêu IELTS ${goal.target.toFixed(1)}`, `IELTS goal ${goal.target.toFixed(1)}`)}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2">
          {recentDays.slice(-7).map((d) => (
            <View key={d.date} className="flex-1 items-center gap-1.5">
              <View
                accessibilityLabel={isActiveDay(d) ? L('Có học', 'Studied') : L('Chưa học', 'Not studied')}
                className="h-8 w-8 items-center justify-center rounded-pill"
                style={{ backgroundColor: isActiveDay(d) ? themedHex('#D9A441') : 'rgba(255,255,255,0.75)' }}
              >
                {isActiveDay(d) ? <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.6} /> : null}
              </View>
              <Text className="font-mid text-label text-muted">{weekdayOf(d.date)}</Text>
            </View>
          ))}
        </View>
      </HeroShell>

      <StreakRewardsCard current={streak.current} longest={streak.longest} />
      <BadgeShelf />

      <View
        accessibilityRole="tablist"
        className="mt-5 flex-row rounded-pill border border-border bg-white p-1"
      >
        {([7, 30, 90] as const).map((r) => {
          const on = range === r;
          return (
            <Pressable
              key={r}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => setRange(r)}
              className="flex-1 items-center rounded-pill py-2"
              style={on ? { backgroundColor: themedHex('#F1ECFF'), borderWidth: 1, borderColor: themedHex('#8B6CF0') } : undefined}
            >
              <Text className={on ? 'font-strong text-label' : 'font-mid text-label text-muted'} style={on ? { color: themedHex('#6A4BD9') } : undefined}>
                {rangeLabel(r)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card className="mt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-strong text-cardTitle text-ink">{L('Thời gian học', 'Study time')}</Text>
          <Text className="font-mid text-label text-muted">{rangeLabel(range)}</Text>
        </View>
        <Text className="mt-2 font-heavy text-hero text-ink">{formatStudyTime(totalMinutes, en)}</Text>
        <WeekBars
          days={recentDays.slice(-7).map((d) => ({ label: weekdayOf(d.date), minutes: d.minutes }))}
          emptyLabel={L('Chưa có ngày học trong khoảng này', 'No study days in this range yet')}
        />
      </Card>

      <View className="mt-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/vocabulary' as never)}
          className="flex-1 gap-3 rounded-card border border-border bg-white p-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-pill" style={{ backgroundColor: themedHex('#F1ECFF') }}>
            <Icon name="book" size={18} color={themedHex('#6A4BD9')} />
          </View>
          <View>
            <Text className="font-heavy text-stat text-ink">{words}</Text>
            <Text className="font-mid text-label text-muted">{L('từ đã nhớ', 'words saved')}</Text>
          </View>
        </Pressable>
        <View className="flex-1 gap-3 rounded-card border border-border bg-white p-4">
          <View className="h-10 w-10 items-center justify-center rounded-pill" style={{ backgroundColor: '#F3F0FB' }}>
            <Icon name="flame" size={18} color="#6A4BD9" />
          </View>
          <View>
            <Text className="font-heavy text-stat text-ink">{streak.longest}</Text>
            <Text className="font-mid text-label text-muted">{L('chuỗi dài nhất (ngày)', 'longest streak (days)')}</Text>
          </View>
        </View>
      </View>

      <Card className="mt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-strong text-cardTitle text-ink">{L('Kỹ năng', 'Skills')}</Text>
          <Text className="font-mid text-label text-muted">{L('Theo dạng câu', 'By question type')}</Text>
        </View>
        <View className="mt-3">
          {accuracyByType.length === 0 ? (
            <Text className="py-4 font-sans text-body text-muted">
              {L('Làm thử một bài để thấy điểm mạnh yếu.', 'Do a test to see your strengths and weaknesses.')}
            </Text>
          ) : (
            <HorizontalBars
              data={accuracyByType.slice(0, 4).map((row, i) => ({
                label: QUESTION_TYPE_LABEL[row.type],
                percent: row.percent,
                tone: chartPalette[i % chartPalette.length],
              }))}
            />
          )}
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/plan' as never)}
        className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-pill border bg-white"
        style={{ borderColor: themedHex('#8B6CF0') }}
      >
        <Text className="font-strong text-body" style={{ color: themedHex('#6A4BD9') }}>
          {L('Điều chỉnh mục tiêu', 'Adjust goal')}
        </Text>
        <Icon name="chevron-right" size={16} color={themedHex('#6A4BD9')} />
      </Pressable>

      <Text className="mt-8 font-strong text-cardTitle text-ink">{L('Chi tiết', 'Details')}</Text>

      <Card className="mt-3">
        <SectionHeader
          title={L('Mục tiêu band', 'Band goal')}
          subtitle={
            goal.state === 'no-goal'
              ? L('Chưa đặt band mục tiêu', 'No target band yet')
              : goal.state === 'no-score'
                ? L('Chưa có bài chấm band', 'No band score yet')
                : goal.state === 'reached'
                  ? L(`Đã đạt · band hiện tại ${formatBand(goal.current)}`, `Reached · current band ${formatBand(goal.current)}`)
                  : L(`${formatBand(goal.start)} → ${formatBand(goal.current)} · còn ${goal.left.toFixed(1)} band`, `${formatBand(goal.start)} → ${formatBand(goal.current)} · ${goal.left.toFixed(1)} band to go`)
          }
          icon="target"
          iconTone="accent"
        />
        {goal.state === 'no-goal' ? (
          <Button className="mt-3 self-start" label={L('Đặt mục tiêu', 'Set a goal')} onPress={() => router.push('/plan' as never)} />
        ) : (
          <ProgressBar value={goal.state === 'no-score' ? 0 : goal.pct} className="mt-3" />
        )}
      </Card>

      <View className="mt-4">
        <Grid columns={5} tabletColumns={2} mobileColumns={1}>
          <StatCard
            label="Current Band Estimate"
            value={formatBand(currentBand)}
            icon="trending"
            tone="primary"
            // Chưa có band thì không gắn nhãn "Đang lên": không có gì để lên cả.
            status={
              currentBand == null
                ? undefined
                : currentBand >= 6.5
                  ? { label: 'Good', tone: 'success' }
                  : { label: L('Đang lên', 'Improving'), tone: 'warning' }
            }
          />
          <StatCard
            label="Study Time"
            value={formatMinutes(totalMinutes)}
            icon="clock"
            tone="accent"
            caption={L(`${range} ngày gần nhất`, `Last ${range} days`)}
          />
          <StatCard
            label="Reading Speed"
            value={avgWpm > 0 ? String(avgWpm) : '—'}
            unit="words/min"
            icon="gauge"
            tone="info"
          />
          <StatCard
            label="Accuracy"
            value={inRange.length === 0 ? '—' : `${accuracy}`}
            unit={inRange.length === 0 ? undefined : '%'}
            icon="target"
            tone="success"
            caption={L(`${inRange.length} lượt làm bài`, `${inRange.length} attempts`)}
          />
          <StatCard
            label="Current Streak"
            value={String(streak.current)}
            unit="days"
            icon="flame"
            tone="warning"
            caption={L(`Dài nhất: ${streak.longest} ngày`, `Longest: ${streak.longest} days`)}
          />
        </Grid>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-4">
        <View className="min-w-[320px] flex-[3]">
          <Card>
            <SectionHeader title="Band Score Progress" icon="trending" hint />
            <View className="mt-3">
              <LineChart
                data={bandSeries}
                yMin={4}
                yMax={9}
                formatY={(v) => v.toFixed(1)}
                height={220}
              />
            </View>

            <View className="mt-3 flex-row justify-between rounded-panel bg-surfaceAlt px-4 py-3">
              <View>
                <Text className="font-mid text-label text-muted">Initial Band</Text>
                <Text className="font-strong text-cardTitle text-ink">
                  {formatBand(initialBand)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-mid text-label text-muted">Best Band</Text>
                <Text className="font-strong text-cardTitle text-ink">
                  {formatBand(bestBand)}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View className="min-w-[300px] flex-[2]">
          <Card className="h-full">
            <SectionHeader title="Performance by Question Type" icon="clipboard" hint />

            <View className="mt-4">
              <HorizontalBars
                data={accuracyByType.map((row, i) => ({
                  label: QUESTION_TYPE_LABEL[row.type],
                  percent: row.percent,
                  tone: chartPalette[i % chartPalette.length],
                }))}
              />

              {accuracyByType.length === 0 ? (
                <Text className="py-6 text-center font-sans text-body text-muted">
                  {L('Làm thử một bài để thấy điểm mạnh yếu theo từng dạng câu.', 'Do a test to see your strengths and weaknesses by question type.')}
                </Text>
              ) : null}
            </View>

            {weakest ? (
              <View className="mt-4 rounded-panel bg-danger-soft p-3">
                <Text className="font-semi text-body text-danger-ink">
                  {L('Dạng yếu nhất:', 'Weakest type:')} {QUESTION_TYPE_LABEL[weakest.type]} ({weakest.percent}%)
                </Text>
                <Button
                  label={L('Luyện dạng yếu nhất', 'Practise your weakest type')}
                  size="sm"
                  iconRight="arrow-right"
                  className="mt-2"
                  onPress={() => void practiceWeakest()}
                />
              </View>
            ) : null}
          </Card>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-4">
        <View className="min-w-[280px] flex-1">
          <Card className="h-full">
            <SectionHeader title="Study Time Distribution" icon="clock" iconTone="accent" hint />

            <View className="mt-4 flex-row items-center gap-4">
              <DonutChart
                data={[
                  { label: 'Practice', value: activityTotals.practice },
                  { label: 'Mock Tests', value: activityTotals.mock_test },
                  { label: 'Review', value: activityTotals.review },
                  { label: 'Reading Library', value: activityTotals.reading_library },
                ]}
                centerValue={formatMinutes(totalMinutes)}
                centerLabel={L('Tổng', 'Total')}
              />

              <View className="flex-1 gap-2">
                {[
                  { label: 'Practice', value: activityTotals.practice },
                  { label: 'Mock Tests', value: activityTotals.mock_test },
                  { label: 'Review', value: activityTotals.review },
                  { label: 'Reading Library', value: activityTotals.reading_library },
                ].map((row, i) => (
                  <View key={row.label} className="flex-row items-center gap-2">
                    <View
                      className="h-2.5 w-2.5 rounded-pill"
                      style={{ backgroundColor: chartPalette[i % chartPalette.length] }}
                    />
                    <Text className="flex-1 font-mid text-label text-body">{row.label}</Text>
                    <Text className="font-semi text-label text-ink">
                      {formatMinutes(row.value)}
                    </Text>
                    <Text className="w-10 text-right font-mid text-label text-muted">
                      {totalMinutes === 0 ? '0%' : `${Math.round((row.value / totalMinutes) * 100)}%`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </View>

        <View className="min-w-[280px] flex-1">
          <Card className="h-full">
            <SectionHeader title="Weekly Practice Calendar" icon="calendar" hint />

            <View className="mt-4 flex-row gap-4">
              <Heatmap
                data={recentDays.map((d) => ({ date: d.date, value: d.minutes }))}
                weeks={Math.ceil(range / 7)}
              />

              <View className="flex-1 gap-3">
                <View className="rounded-panel bg-surfaceAlt p-3">
                  <Text className="font-mid text-label text-muted">Best Day</Text>
                  <Text className="font-strong text-body text-ink">{bestDay(recentDays)}</Text>
                </View>
                <View className="rounded-panel bg-surfaceAlt p-3">
                  <Text className="font-mid text-label text-muted">{L('Từ đã lưu', 'Saved words')}</Text>
                  <Text className="font-strong text-body text-ink">{words} {L('từ', 'words')}</Text>
                </View>
              </View>
            </View>

            <View className="mt-4">
              <BarChart
                data={recentDays.slice(-7).map((d) => ({
                  label: d.date.slice(5),
                  value: d.minutes,
                  secondary: d.questions,
                }))}
                showSecondary
                height={160}
              />
            </View>
          </Card>
        </View>
      </View>

      <MathProgressCard />

      <Card className="mt-4">
        <SectionHeader
          title={L('Hoạt động gần đây', 'Recent activity')}
          icon="clock"
          action={{ label: L('Xem tất cả', 'View all'), onPress: () => router.push('/lich-su' as never) }}
        />
        <View className="mt-3">
          <ActivityList items={activity.slice(0, 6)} emptyText={L('Chưa có việc nào. Làm một bài, nghe một đề hoặc viết một bài là sẽ thấy ở đây.', 'Nothing yet. Do a test, a listening or a writing task and it will show up here.')} />
        </View>
      </Card>

      <Card className="mt-4">
        <SectionHeader
          title="Recent Mock Test Performance"
          icon="clipboard"
          action={{ label: 'View all', onPress: () => router.push('/mock-tests' as never) }}
        />

        <View className="mt-3">
          <View className="flex-row border-b border-border pb-2">
            <Text className="flex-[3] font-mid text-label text-muted">Test</Text>
            <Text className="flex-1 font-mid text-label text-muted">Date</Text>
            <Text className="w-20 font-mid text-label text-muted">Band</Text>
            <Text className="w-20 font-mid text-label text-muted">Accuracy</Text>
            <Text className="w-20 font-mid text-label text-muted">Review</Text>
          </View>

          {sessions.slice(0, 6).map((session, index) => {
            const previous = sessions[index + 1];
            // null khi một trong hai lượt là SAT — không có band thì không có gì để so.
            const delta = bandDelta(session.estimatedBand, previous?.estimatedBand);

            return (
              <View key={session.id} className="flex-row items-center border-b border-border py-3">
                <Text className="flex-[3] font-semi text-body text-ink" numberOfLines={1}>
                  {session.articleTitle}
                </Text>
                <Text className="flex-1 font-mid text-label text-muted">
                  {session.finishedAt.slice(0, 10)}
                </Text>
                <View className="w-20 flex-row items-center gap-1.5">
                  <Text className="font-strong text-body text-ink">
                    {formatBand(session.estimatedBand)}
                  </Text>
                  {delta ? <TrendBadge value={delta} /> : null}
                </View>
                <Text className="w-20 font-mid text-body text-body">{session.accuracy}%</Text>
                <Pressable
                  onPress={() => router.push(`/review/${session.id}` as never)}
                  className="w-20"
                >
                  <Badge label="Review" tone="primary" />
                </Pressable>
              </View>
            );
          })}

          {sessions.length === 0 ? (
            <Text className="py-8 text-center font-sans text-body text-muted">
              {L('Chưa có lượt làm bài nào. Vào Library chọn một bài rồi Submit để thấy số liệu ở đây.', 'No attempts yet. Pick a passage in the Library and submit it to see your stats here.')}
            </Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}

/**
 * Cột học theo ngày, vẽ bằng View để cột nào cũng có nhãn giá trị và nhãn ngày.
 * Chiều cao theo phút thật (không chuẩn hoá). Cột cao nhất trong khoảng là ngày học
 * nhiều nhất, tô vàng đậm; các ngày khác vàng nhạt, ngày không học là vạch mờ.
 */
function WeekBars({ days, emptyLabel }: { days: { label: string; minutes: number }[]; emptyLabel: string }) {
  const max = Math.max(0, ...days.map((d) => d.minutes));
  const best = max > 0 ? days.findIndex((d) => d.minutes === max) : -1;
  return (
    <View className="mt-4">
      <View className="h-44 flex-row items-stretch gap-2">
        {days.map((d, i) => {
          const height = d.minutes > 0 ? Math.max(12, Math.round((d.minutes / max) * 112)) : 6;
          const top = i === best;
          return (
            <View key={`${d.label}-${i}`} className="flex-1 items-center justify-end gap-1.5">
              <Text className="font-semi text-label text-muted" numberOfLines={1}>
                {d.minutes > 0 ? shortMinutes(d.minutes) : ' '}
              </Text>
              <View
                style={{
                  width: '100%',
                  height,
                  borderRadius: 10,
                  backgroundColor: top ? themedHex('#D9A441') : d.minutes > 0 ? themedHex('#F1DDA0') : '#F3F0FB',
                }}
              />
              <Text className={top ? 'font-strong text-label text-ink' : 'font-mid text-label text-muted'}>{d.label}</Text>
            </View>
          );
        })}
      </View>
      {max === 0 ? <Text className="mt-3 text-center font-sans text-body text-muted">{emptyLabel}</Text> : null}
    </View>
  );
}

/** Nhãn cột ngắn: "45m", "1.5h" — đủ chỗ cho bảy cột trên điện thoại. */
function shortMinutes(minutes: number): string {
  return minutes < 60 ? `${minutes}m` : `${(minutes / 60).toFixed(1)}h`;
}

/** "18 giờ 40 phút" trên đầu trang; phần chi tiết vẫn dùng `formatMinutes` gọn hơn. */
function formatStudyTime(minutes: number, en: boolean): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (en) return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
  return h > 0 ? `${h} giờ ${String(m).padStart(2, '0')} phút` : `${m} phút`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function bestDay(days: Array<{ date: string; minutes: number }>): string {
  if (days.length === 0) return '—';
  const best = days.reduce((a, b) => (b.minutes > a.minutes ? b : a));
  return best.minutes === 0 ? '—' : `${best.date} · ${formatMinutes(best.minutes)}`;
}
