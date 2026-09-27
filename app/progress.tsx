import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BarChart, DonutChart, Heatmap, HorizontalBars, LineChart } from '@/components/charts';
import { Grid } from '@/components/layout/Grid';
import { useNow } from '@/lib/clock';
import { Screen } from '@/components/layout/Screen';
import {
  Badge,
  Button,
  Card,
  HeroBanner,
  ProgressBar,
  SectionHeader,
  StatCard,
  TrendBadge,
} from '@/components/ui';
import { filterArticles, getArticleWithBody } from '@/data/articles';
import { bandDelta, formatBand, latestBand } from '@/lib/band';
import { MATH_DOMAIN_LABEL, MATH_ERROR_LABEL, type MathDomain } from '@/lib/math/types';
import { formatAccuracy } from '@/services/math/scoring';
import { QUESTION_TYPE_LABEL } from '@/services/questions/types';
import { useMathDomainStats, useMathErrorTags, useMathTotals } from '@/store/useMathStore';
import { useQuestionStore } from '@/store/useQuestionStore';
import { useAccuracyByType, useRecentDays, useStreak, useStudyStore } from '@/store/useStudyStore';
import { useVocabStore } from '@/store/useVocabStore';
import { useRoadmapStore } from '@/store/useRoadmapStore';
import { useAuthStore } from '@/store/useAuthStore';
import { goalProgress } from '@/services/progress/goal';
import { chartPalette, color } from '@/theme/tokens';

/**
 * Tiến độ SAT Math.
 *
 * Hai bảng, hai câu hỏi khác nhau: theo DOMAIN trả lời "mảng nào yếu", theo
 * NHÃN LỖI trả lời "hỏng kiểu gì". Bảng thứ hai là thứ bảng theo domain không
 * bao giờ cho thấy — sai dấu rải đều bốn domain thì nhìn theo domain sẽ tưởng
 * là không có vấn đề gì nổi bật.
 */
function MathProgressCard() {
  const domainStats = useMathDomainStats();
  const errorTags = useMathErrorTags();
  const totals = useMathTotals();

  if (totals.questions === 0) return null;

  const domains = (Object.keys(domainStats) as MathDomain[]).filter((d) => domainStats[d].total > 0);

  return (
    <Card className="mt-4">
      <SectionHeader
        title="SAT Math"
        subtitle={`${totals.questions} câu đã làm · đúng ${totals.correct}`}
        icon="grid"
        iconTone="accent"
        action={{ label: 'Mở module', onPress: () => router.push('/math' as never) }}
      />

      <View className="mt-4 flex-row flex-wrap gap-6">
        <View className="min-w-[260px] flex-1 gap-3">
          <Text className="font-mid text-label text-muted">Theo domain</Text>
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
          <Text className="font-mid text-label text-muted">Lỗi hay mắc nhất</Text>
          {errorTags.length === 0 ? (
            <Text className="font-sans text-body text-muted">
              Chưa có câu nào chọn nhầm một đáp án mang nhãn lỗi.
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
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const sessions = useStudyStore((s) => s.sessions);
  const recentDays = useRecentDays(range);
  const streak = useStreak();
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

  return (
    <Screen>
      <HeroBanner
        title="Tiến độ của bạn"
        subtitle="Theo dõi kết quả, giữ nhịp đều, và biết chính xác nên luyện dạng nào tiếp theo."
        illustration="progress-hero"
        right={
          <View className="w-[260px] rounded-card bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-strong text-cardTitle text-ink">Mục tiêu</Text>
              <Text className="font-semi text-label text-primary-600">Band IELTS</Text>
            </View>

            {goal.state === 'no-goal' ? (
              <>
                <Text className="mt-2 font-heavy text-hero text-subtle">—</Text>
                <Text className="mt-1 font-mid text-label text-muted">Bạn chưa đặt band mục tiêu.</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/plan' as never)}
                  className="mt-3 self-start rounded-pill bg-primary-600 px-3.5 py-2"
                >
                  <Text className="font-semi text-label text-white">Đặt mục tiêu</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text className="mt-2 font-heavy text-hero text-ink">{goal.target.toFixed(1)}</Text>
                <ProgressBar value={goal.state === 'no-score' ? 0 : goal.pct} className="mt-2" />
                <Text className="mt-2 font-mid text-label text-muted">
                  {goal.state === 'no-score'
                    ? 'Chưa có bài chấm band — làm một bài đọc để có điểm đầu.'
                    : goal.state === 'reached'
                      ? `Đã đạt mục tiêu · band hiện tại ${formatBand(goal.current)}`
                      : `${formatBand(goal.start)} → ${formatBand(goal.current)} · còn ${goal.left.toFixed(1)} band · ${goal.pct}% quãng đường`}
                </Text>
              </>
            )}
          </View>
        }
      />

      <View className="mt-4 flex-row items-center gap-2">
        {([7, 30, 90] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            className={[
              'rounded-panel px-4 py-2',
              range === r ? 'bg-primary-600' : 'bg-surface border border-border',
            ].join(' ')}
          >
            <Text
              className={['font-semi text-body', range === r ? 'text-white' : 'text-muted'].join(' ')}
            >
              {r} Days
            </Text>
          </Pressable>
        ))}
      </View>

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
                  : { label: 'Đang lên', tone: 'warning' }
            }
          />
          <StatCard
            label="Study Time"
            value={formatMinutes(totalMinutes)}
            icon="clock"
            tone="accent"
            caption={`${range} ngày gần nhất`}
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
            caption={`${inRange.length} lượt làm bài`}
          />
          <StatCard
            label="Current Streak"
            value={String(streak.current)}
            unit="days"
            icon="flame"
            tone="warning"
            caption={`Dài nhất: ${streak.longest} ngày`}
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
                  Làm thử một bài để thấy điểm mạnh yếu theo từng dạng câu.
                </Text>
              ) : null}
            </View>

            {weakest ? (
              <View className="mt-4 rounded-panel bg-danger-soft p-3">
                <Text className="font-semi text-body text-danger-ink">
                  Dạng yếu nhất: {QUESTION_TYPE_LABEL[weakest.type]} ({weakest.percent}%)
                </Text>
                <Button
                  label="Luyện dạng yếu nhất"
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
                centerLabel="Tổng"
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
                  <Text className="font-mid text-label text-muted">Từ đã lưu</Text>
                  <Text className="font-strong text-body text-ink">{words} từ</Text>
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
              Chưa có lượt làm bài nào. Vào Library chọn một bài rồi Submit để thấy số liệu ở đây.
            </Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
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
