import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BarChart, DonutChart, Heatmap, HorizontalBars, LineChart } from '@/components/charts';
import { Grid } from '@/components/layout/Grid';
import { useNow } from '@/lib/clock';
import { Screen } from '@/components/layout/Screen';

import { NeonWindow, PixelText } from '@/components/neon/Neon';
import { ProgressHero } from '@/components/progress/ProgressHero';
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
import { filterArticles, getArticleWithBody, loadArticleWithBody } from '@/data/articles';
import { ActivityList } from '@/components/progress/ActivityList';
import { StreakRewardsCard } from '@/components/progress/StreakRewardsCard';
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
    <NeonWindow title="SAT Math" icon="gamepad" badge={`${totals.correct}/${totals.questions}`} style={{ marginTop: 16 }}>
      <Pressable accessibilityRole="link" onPress={() => router.push('/math' as never)} className="self-start">
        <Text className="font-strong text-label" style={{ color: '#2A22B5' }}>
          {L('Mở module →', 'Open module →')}
        </Text>
      </Pressable>

      <View className="mt-4 flex-row flex-wrap gap-6">
        <View className="w-full flex-1 gap-3 lg:min-w-[260px]">
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

        <View className="w-full flex-1 gap-2 lg:min-w-[260px]">
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
    </NeonWindow>
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
    const article = await loadArticleWithBody(meta.id);
    if (!article) return;

    await focusSet(article, weakest.type);
    router.push(`/read/${article.id}` as never);
  };

  const rangeLabel = (r: 7 | 30 | 90) => (r === 7 ? L('Tuần', 'Week') : r === 30 ? L('Tháng', 'Month') : L('3 tháng', '3 months'));
  const weekdays = en ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const weekdayOf = (date: string) => weekdays[new Date(`${date}T00:00:00`).getDay()] ?? date.slice(5);

  const indigo = '#2A22B5';
  const goalLabel = goal.state === 'no-goal' ? L('Đặt mục tiêu', 'Set goal') : `IELTS ${goal.target.toFixed(1)}`;
  const goalSubtitle =
    goal.state === 'no-goal'
      ? L('Chưa đặt band mục tiêu', 'No target band yet')
      : goal.state === 'no-score'
        ? L('Chưa có bài chấm band', 'No band score yet')
        : goal.state === 'reached'
          ? L(`Đã đạt · hiện tại ${formatBand(goal.current)}`, `Reached · now ${formatBand(goal.current)}`)
          : L(`${formatBand(goal.start)} → ${formatBand(goal.current)} · còn ${goal.left.toFixed(1)}`, `${formatBand(goal.start)} → ${formatBand(goal.current)} · ${goal.left.toFixed(1)} to go`);

  return (
    <Screen>
      <ProgressHero
        current={streak.current}
        longest={streak.longest}
        goalLabel={goalLabel}
        days={recentDays.slice(-7).map((d) => ({ date: d.date, label: weekdayOf(d.date), studied: isActiveDay(d) }))}
      />

      <StreakRewardsCard current={streak.current} longest={streak.longest} />
      <BadgeShelf />

      <View accessibilityRole="tablist" style={{ marginTop: 20, flexDirection: 'row', gap: 8 }}>
        {([7, 30, 90] as const).map((r) => {
          const on = range === r;
          return (
            <Pressable
              key={r}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => setRange(r)}
              style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 2, borderColor: indigo, backgroundColor: on ? indigo : '#FFFFFF', ...(on ? {} : ({ boxShadow: '0 3px 0 rgba(42,34,181,0.3)' } as object)) }}
            >
              <PixelText size={21} color={on ? '#FFFFFF' : indigo}>
                {rangeLabel(r)}
              </PixelText>
            </Pressable>
          );
        })}
      </View>

      <NeonWindow title={L('Thời gian học', 'Study time')} icon="clock" badge={rangeLabel(range)} style={{ marginTop: 16 }}>
        <Text className="font-heavy text-hero text-ink">{formatStudyTime(totalMinutes, en)}</Text>
        <WeekBars
          days={recentDays.slice(-7).map((d) => ({ label: weekdayOf(d.date), minutes: d.minutes }))}
          emptyLabel={L('Chưa có ngày học', 'No study days yet')}
        />
      </NeonWindow>

      <View style={{ marginTop: 16 }}>
        <Grid columns={4} tabletColumns={2} mobileColumns={2}>
          <StatCard
            label={L('Band ước tính', 'Band estimate')}
            value={formatBand(currentBand)}
            icon="trending"
            tone="primary"
            // Chưa có band thì không gắn nhãn "Đang lên": không có gì để lên cả.
            status={
              currentBand == null
                ? undefined
                : currentBand >= 6.5
                  ? { label: L('Tốt', 'Good'), tone: 'success' }
                  : { label: L('Đang lên', 'Improving'), tone: 'warning' }
            }
          />
          <StatCard
            label={L('Chính xác', 'Accuracy')}
            value={inRange.length === 0 ? '—' : `${accuracy}`}
            unit={inRange.length === 0 ? undefined : '%'}
            icon="target"
            tone="success"
            caption={L(`${inRange.length} lượt`, `${inRange.length} attempts`)}
          />
          <StatCard label={L('Tốc độ đọc', 'Reading speed')} value={avgWpm > 0 ? String(avgWpm) : '—'} unit={L('từ/phút', 'wpm')} icon="gauge" tone="info" />
          <StatCard label={L('Từ đã lưu', 'Words saved')} value={String(words)} icon="book" tone="accent" />
        </Grid>
      </View>

      <NeonWindow title={L('Kỹ năng', 'Skills')} icon="gem" style={{ marginTop: 16 }}>
        {accuracyByType.length === 0 ? (
          <Text className="py-2 font-sans text-body text-muted">{L('Làm một bài để thấy điểm mạnh yếu.', 'Do a test to see your strengths.')}</Text>
        ) : (
          <HorizontalBars
            data={accuracyByType.map((row, i) => ({
              label: QUESTION_TYPE_LABEL[row.type],
              percent: row.percent,
              tone: chartPalette[i % chartPalette.length],
            }))}
          />
        )}
        {weakest ? (
          <View className="mt-4 flex-row flex-wrap items-center gap-3 rounded-panel bg-danger-soft p-3">
            <Text className="min-w-0 flex-1 font-semi text-body text-danger-ink">
              {L('Yếu nhất', 'Weakest')}: {QUESTION_TYPE_LABEL[weakest.type]} ({weakest.percent}%)
            </Text>
            <Button label={L('Luyện ngay', 'Practise')} size="sm" iconRight="arrow-right" onPress={() => void practiceWeakest()} />
          </View>
        ) : null}
      </NeonWindow>

      <NeonWindow title={L('Mục tiêu band', 'Band goal')} icon="medal" badge={goal.state === 'no-goal' ? undefined : goal.target.toFixed(1)} style={{ marginTop: 16 }}>
        <Text className="font-sans text-label text-muted">{goalSubtitle}</Text>
        {goal.state === 'no-goal' ? (
          <Button className="mt-3 self-start" label={L('Đặt mục tiêu', 'Set a goal')} onPress={() => router.push('/plan' as never)} />
        ) : (
          <ProgressBar value={goal.state === 'no-score' ? 0 : goal.pct} className="mt-3" />
        )}
        <View className="mt-4">
          <LineChart data={bandSeries} yMin={4} yMax={9} formatY={(v) => v.toFixed(1)} height={200} />
        </View>
        <View className="mt-3 flex-row justify-between rounded-panel bg-surfaceAlt px-4 py-3">
          <View>
            <Text className="font-mid text-label text-muted">{L('Đầu tiên', 'First')}</Text>
            <Text className="font-strong text-cardTitle text-ink">{formatBand(initialBand)}</Text>
          </View>
          <View className="items-end">
            <Text className="font-mid text-label text-muted">{L('Cao nhất', 'Best')}</Text>
            <Text className="font-strong text-cardTitle text-ink">{formatBand(bestBand)}</Text>
          </View>
        </View>
      </NeonWindow>

      <View className="mt-4 flex-row flex-wrap gap-4">
        <View className="w-full flex-1 lg:min-w-[280px]">
          <NeonWindow title={L('Phân bổ thời gian', 'Time split')} icon="clock" style={{ height: '100%' }}>
            <View className="flex-row items-center gap-4">
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
                  { label: L('Luyện tập', 'Practice'), value: activityTotals.practice },
                  { label: L('Thi thử', 'Mock tests'), value: activityTotals.mock_test },
                  { label: L('Ôn tập', 'Review'), value: activityTotals.review },
                  { label: L('Thư viện', 'Library'), value: activityTotals.reading_library },
                ].map((row, i) => (
                  <View key={row.label} className="flex-row items-center gap-2">
                    <View className="h-2.5 w-2.5 rounded-pill" style={{ backgroundColor: chartPalette[i % chartPalette.length] }} />
                    <Text className="flex-1 font-mid text-label text-body">{row.label}</Text>
                    <Text className="font-semi text-label text-ink">{formatMinutes(row.value)}</Text>
                    <Text className="w-10 text-right font-mid text-label text-muted">{totalMinutes === 0 ? '0%' : `${Math.round((row.value / totalMinutes) * 100)}%`}</Text>
                  </View>
                ))}
              </View>
            </View>
          </NeonWindow>
        </View>

        <View className="w-full flex-1 lg:min-w-[280px]">
          <NeonWindow title={L('Lịch học', 'Calendar')} icon="star5" badge={bestDay(recentDays)} style={{ height: '100%' }}>
            <Heatmap data={recentDays.map((d) => ({ date: d.date, value: d.minutes }))} weeks={Math.ceil(range / 7)} />
            <View className="mt-4">
              <BarChart
                data={recentDays.slice(-7).map((d) => ({ label: d.date.slice(5), value: d.minutes, secondary: d.questions }))}
                showSecondary
                height={150}
              />
            </View>
          </NeonWindow>
        </View>
      </View>

      <MathProgressCard />

      <NeonWindow title={L('Hoạt động', 'Activity')} icon="note" style={{ marginTop: 16 }}>
        <ActivityList items={activity.slice(0, 6)} emptyText={L('Chưa có hoạt động.', 'No activity yet.')} />
        <Pressable accessibilityRole="link" onPress={() => router.push('/lich-su' as never)} className="mt-3 self-start">
          <Text className="font-strong text-label" style={{ color: indigo }}>
            {L('Xem tất cả →', 'View all →')}
          </Text>
        </Pressable>
      </NeonWindow>

      <NeonWindow title={L('Lượt làm gần đây', 'Recent attempts')} icon="book" style={{ marginTop: 16 }}>
        <View className="flex-row border-b border-border pb-2">
          <Text className="flex-[3] font-mid text-label text-muted">{L('Bài', 'Test')}</Text>
          <Text className="flex-1 font-mid text-label text-muted">{L('Ngày', 'Date')}</Text>
          <Text className="w-20 font-mid text-label text-muted">Band</Text>
          <Text className="w-16 font-mid text-label text-muted">{L('Đúng', 'Acc.')}</Text>
          <View className="w-14" />
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
              <Text className="flex-1 font-mid text-label text-muted">{session.finishedAt.slice(5, 10)}</Text>
              <View className="w-20 flex-row items-center gap-1.5">
                <Text className="font-strong text-body text-ink">{formatBand(session.estimatedBand)}</Text>
                {delta ? <TrendBadge value={delta} /> : null}
              </View>
              <Text className="w-16 font-mid text-body text-body">{session.accuracy}%</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push(`/review/${session.id}` as never)} className="w-14">
                <Badge label={L('Xem', 'View')} tone="primary" />
              </Pressable>
            </View>
          );
        })}

        {sessions.length === 0 ? <Text className="py-6 text-center font-sans text-body text-muted">{L('Chưa có lượt nào.', 'No attempts yet.')}</Text> : null}
      </NeonWindow>
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
                  backgroundColor: top ? '#6A3FE0' : d.minutes > 0 ? '#CFC4FF' : '#F3F0FB',
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
  return best.minutes === 0 ? '—' : `${best.date.slice(5)} · ${formatMinutes(best.minutes)}`;
}
