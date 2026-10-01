import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FeatureShelf } from '@/components/dashboard/FeatureShelf';
import { ParentReportCard } from '@/components/dashboard/ParentReportCard';
import { ScorePredictionCard } from '@/components/prediction/ScorePrediction';
import { router } from 'expo-router';

import { ArticleCard } from '@/components/article/ArticleCard';
import { TrialCard } from '@/components/billing/PlanUi';
import { PlanBlockRow } from '@/components/plan/PlanBlockRow';
import { blocksOn, nextStudyDayIso, planWeekOf } from '@/services/plan/custom';
import { todayKey } from '@/store/persist';
import { useCustomPlan, useRoadmapStore } from '@/store/useRoadmapStore';
import { color } from '@/theme/tokens';
import { BarChart } from '@/components/charts';
import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { AssetImage, Badge, Button, Card, Icon, ProgressBar, QuestionTypeIcon, SectionHeader, StatCard } from '@/components/ui';
import { filterArticles, isReadable, libraryStats, topicLabel } from '@/data/articles';
import { bandDelta, formatBand } from '@/lib/band';
import { MATH_SKILL_LABEL } from '@/lib/math/types';
import { assetKeys } from '@/services/assets/useAssets';
import { formatAccuracy } from '@/services/math/scoring';
import { QUESTION_TYPE_LABEL } from '@/services/questions/types';
import { useLatestDiagnostic, useMathPriority, useMathTotals } from '@/store/useMathStore';
import { useAccuracyByType, useRecentDays, useStreak, useStudyStore } from '@/store/useStudyStore';
import { useDueCards } from '@/store/useVocabStore';

/**
 * "Hôm nay học gì" — các khối của LỘ TRÌNH TỰ LẬP, ngay trên Tổng quan.
 *
 * Chưa lập lộ trình thì mời lập (6 câu hỏi) chứ không hiện lộ trình mẫu: bản cũ
 * lấy lộ trình 60 tuần của người làm app và hiện cho mọi người, nên người vừa
 * mở app đã thấy "Tuần 3/60 · Từ vựng Unit 3" — số liệu giả (sửa 26/09/2026).
 */
function TodayPlan() {
  const input = useRoadmapStore((s) => s.input);
  const plan = useCustomPlan();
  const today = todayKey();

  if (!input || !plan) {
    return (
      <Card className="mt-4 lg:mt-6">
        <View className="flex-row flex-wrap items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: '#FCF8F1' }}>
            <Icon name="calendar" size={22} color={color.primary} />
          </View>
          <View className="min-w-0 flex-1" style={{ minWidth: 220 }}>
            <Text className="font-heavy text-cardTitle text-ink">Chưa có lộ trình của bạn</Text>
            <Text className="mt-0.5 font-sans text-body text-muted">
              Khai mục tiêu, ngày thi và số phút mỗi ngày — app xếp từng buổi học vào đúng bài trong app.
            </Text>
          </View>
          <Button label="Lập lộ trình" iconRight="arrow-right" onPress={() => router.push('/plan' as never)} />
        </View>
      </Card>
    );
  }

  const blocks = blocksOn(plan, today);
  const week = Math.min(Math.max(planWeekOf(input, today), 1), plan.totalWeeks);
  const next = blocks.length === 0 ? nextStudyDayIso(plan, today) : null;

  return (
    <Card className="mt-4 lg:mt-6">
      <SectionHeader
        title="Hôm nay học gì"
        subtitle={`Tuần ${week}/${plan.totalWeeks} của lộ trình bạn lập`}
        icon="calendar"
        action={{ label: 'Xem lộ trình', onPress: () => router.push('/plan' as never) }}
      />
      <View className="mt-3 gap-2">
        {blocks.length > 0 ? (
          blocks.map((b) => <PlanBlockRow key={b.id} block={b} compact />)
        ) : (
          <Text className="font-sans text-body text-muted">
            {next ? `Hôm nay nghỉ theo lộ trình. Buổi học tiếp: ${next.iso.split('-').reverse().join('/')}.` : 'Lộ trình đã đi hết — vào Lộ trình để đặt mục tiêu mới.'}
          </Text>
        )}
      </View>
    </Card>
  );
}

export default function DashboardScreen() {
  const dailyGoal = useStudyStore((s) => s.dailyGoalMinutes);
  const recentDays = useRecentDays(7);
  const sessions = useStudyStore((s) => s.sessions);
  const streak = useStreak();
  const accuracyByType = useAccuracyByType();
  const progress = useStudyStore((s) => s.progress);
  const dueCards = useDueCards().length;

  const stats = useMemo(() => libraryStats(), []);

  const today = recentDays[recentDays.length - 1];
  const minutesToday = today?.minutes ?? 0;
  const weekMinutes = recentDays.reduce((sum, d) => sum + d.minutes, 0);
  const weekQuestions = recentDays.reduce((sum, d) => sum + d.questions, 0);

  // Chỉ lượt IELTS có band. Lấy hai lượt *có band* gần nhất, bỏ qua lượt SAT
  // chen giữa — trước đây lượt SAT làm band tụt về 0.
  const bands = sessions.map((s) => s.estimatedBand).filter((b): b is number => b != null);
  const currentBand = bands[0] ?? null;
  const previousBand = bands[1] ?? null;

  // Gợi ý bài: ưu tiên bài đang đọc dở, không thì bài dễ nhất chưa động tới.
  // Giới hạn trong bài IELTS vì màn này là trang chủ IELTS — passage SAT chỉ
  // 60–150 từ nên xếp "dễ nhất" là chúng chiếm sạch chỗ. Vào Library hoặc
  // Practice để chọn kỳ thi.
  const recommended = useMemo(() => {
    const readable = filterArticles({ kind: 'readable', exam: 'ielts', sort: 'easiest' });
    const unread = readable.find((a) => !progress[a.id]);
    const inProgress = readable.find(
      (a) => progress[a.id] && (progress[a.id]?.percentCompleted ?? 0) < 100,
    );
    return inProgress ?? unread ?? readable[0];
  }, [progress]);

  const featured = useMemo(
    () => filterArticles({ kind: 'readable', exam: 'ielts', sort: 'newest' }).slice(0, 3),
    [],
  );

  return (
    <Screen>
      {/*
        Hero DÙNG CHUNG với trang chủ (`LightHero`).

        Trước đây chỗ này là khối gradient xanh đặc, chữ trắng, kèm hình 3D —
        trông như một app khác so với trang chủ mà người dùng vừa bấm "Bắt đầu
        học" để vào. Giờ hai trang cùng một nền lưới sáng, cùng cách đặt tiêu
        đề hai dòng, nên đi từ trang này sang trang kia không thấy hẫng.

        Bốn viên số liệu ở đây là SỐ CỦA NGƯỜI DÙNG (phút hôm nay, chuỗi, band,
        thẻ tới hạn), khác trang chủ vốn là số của kho. Trang chủ giới thiệu app,
        trang này nói về buổi học hôm nay.
      */}
      <LightHero
        scene="progress"
        badge="Tổng quan"
        line1="Hôm nay học tiếp,"
        line2="đúng chỗ đang dở"
        subtitle={`${stats.ielts} passage IELTS và ${stats.sat} passage SAT từ ${stats.sources} nguồn công khai. Đọc, tra từ trong ngữ cảnh, làm đề và xem lại từng câu kèm bằng chứng.`}
        footer={
          <>
            <HeroStat value={`${minutesToday}`} label={`/ ${dailyGoal} phút hôm nay`} />
            <HeroStat value={String(streak.current)} label="ngày liên tiếp" />
            <HeroStat value={currentBand != null ? currentBand.toFixed(1) : '—'} label="band gần nhất" />
            <HeroStat value={`${dueCards}`} label="thẻ từ tới hạn" />
          </>
        }
      >
        <Button
          label="Bắt đầu luyện"
          iconRight="arrow-right"
          size="lg"
          variant="brand"
          onPress={() =>
            recommended ? router.push(`/read/${recommended.id}` as never) : router.push('/library' as never)
          }
        />
        <Button
          label="Mở thư viện"
          iconLeft="book"
          size="lg"
          variant="outline"
          onPress={() => router.push('/library' as never)}
        />
        <Button
          label="Xếp hạng"
          iconLeft="trophy"
          size="lg"
          variant="outline"
          onPress={() => router.push('/leaderboard' as never)}
        />
      </LightHero>

      <TrialCard />

      <TodayPlan />

      <View className="mt-4 flex-row flex-wrap gap-4">
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 320 }}>
          <ScorePredictionCard section="total" />
        </View>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 320 }}>
          <ParentReportCard />
        </View>
      </View>

      <FeatureShelf />

      <View className="mt-4 lg:mt-6">
        <Grid columns={4} tabletColumns={2} mobileColumns={1}>
          <StatCard
            label="Daily Goal"
            value={String(minutesToday)}
            unit={`/ ${dailyGoal} min`}
            icon="target"
            tone="primary"
            progress={{ value: (minutesToday / dailyGoal) * 100 }}
            caption={minutesToday >= dailyGoal ? 'Xong mục tiêu hôm nay 🎯' : minutesToday === 0 ? 'Hôm nay chưa học phút nào' : `Còn ${dailyGoal - minutesToday} phút nữa`}
            onPress={() => router.push('/progress' as never)}
          />
          <StatCard
            label="Estimated Band Score"
            value={formatBand(currentBand)}
            icon="trending"
            tone="success"
            trend={(() => {
              const delta = bandDelta(currentBand, previousBand);
              return delta == null ? undefined : { value: delta };
            })()}
            caption={currentBand == null ? 'Làm một bài IELTS để có số liệu' : 'Từ lượt làm gần nhất'}
            onPress={() => router.push('/progress' as never)}
          />
          <StatCard
            label="Practice Streak"
            value={String(streak.current)}
            unit="days"
            icon="flame"
            tone="warning"
            caption={`Dài nhất ${streak.longest} ngày`}
            onPress={() => router.push('/progress' as never)}
          />
          <StatCard
            label="Total Practice Time"
            value={formatMinutes(weekMinutes)}
            icon="trophy"
            tone="accent"
            caption="7 ngày gần nhất"
            onPress={() => router.push('/progress' as never)}
          />
        </Grid>
      </View>

      <View className="mt-4 lg:mt-6">
        <Grid columns={3} tabletColumns={1} mobileColumns={1}>
          <Card className="h-full">
            <SectionHeader
              title="Recommended Passage"
              icon="sparkle"
              iconTone="accent"
              action={{ label: 'View all', onPress: () => router.push('/library' as never) }}
            />

            {recommended ? (
              <>
                <AssetImage
                  assetKey={assetKeys.topicThumbnail(recommended.topic)}
                  height={112}
                  className="mt-4"
                  fallback={
                    <View className="h-full items-center justify-center bg-primary-50">
                      <Text className="font-mid text-label text-primary-600">
                        {topicLabel(recommended.topic)}
                      </Text>
                    </View>
                  }
                />

                <Badge
                  label={recommended.track === 'academic' ? 'Academic' : 'General Training'}
                  tone="primary"
                  shape="tag"
                  uppercase
                  className="mt-3"
                />

                <Text className="mt-2 font-strong text-cardTitle text-ink" numberOfLines={2}>
                  {recommended.title}
                </Text>

                <Text className="mt-1 font-sans text-body text-muted" numberOfLines={2}>
                  {recommended.summary}
                </Text>

                <View className="mt-3 flex-row items-center gap-4">
                  <Text className="font-mid text-label text-muted">
                    ⏱ {recommended.estMinutes} min
                  </Text>
                  <Text className="font-mid text-label text-muted">
                    📊 {recommended.bandRange}
                  </Text>
                </View>

                <Button
                  label="Start Reading"
                  iconRight="arrow-right"
                  fullWidth
                  className="mt-4"
                  onPress={() => router.push(`/read/${recommended.id}` as never)}
                />
              </>
            ) : (
              <Text className="mt-4 font-sans text-body text-muted">
                Chưa có bài nào. Chạy `npm run ingest` để cào thêm.
              </Text>
            )}
          </Card>

          <Card className="h-full">
            <SectionHeader
              title="Question Types"
              icon="clipboard"
              action={{ label: 'View all', onPress: () => router.push('/progress' as never) }}
            />

            <View className="mt-4 gap-3">
              {accuracyByType.slice(0, 4).map((row) => (
                <View key={row.type} className="flex-row items-center gap-3">
                  <QuestionTypeIcon type={row.type} />
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-semi text-body text-ink" numberOfLines={1}>
                        {QUESTION_TYPE_LABEL[row.type]}
                      </Text>
                      <Text className="font-strong text-body text-primary-600">
                        {row.percent}%
                      </Text>
                    </View>
                    <Text className="mt-0.5 font-sans text-label text-muted">
                      {row.total} câu đã làm
                    </Text>
                    <ProgressBar value={row.percent} className="mt-2" height={5} />
                  </View>
                </View>
              ))}

              {accuracyByType.length === 0 ? (
                <Text className="py-6 text-center font-sans text-body text-muted">
                  Làm một bài để thấy tỉ lệ đúng theo từng dạng câu.
                </Text>
              ) : null}
            </View>
          </Card>

          <Card className="h-full">
            <SectionHeader title="Weekly Progress" icon="trending" iconTone="info" hint />

            <View className="mt-4">
              <BarChart
                data={recentDays.map((d) => ({
                  label: WEEKDAYS[new Date(d.date).getDay()] ?? '',
                  value: d.minutes,
                  secondary: d.questions,
                }))}
                showSecondary
                height={180}
              />
            </View>

            <View className="mt-3 flex-row gap-4">
              <View className="flex-1 rounded-panel bg-surfaceAlt px-3 py-2">
                <Text className="font-mid text-label text-muted">Total Time</Text>
                <Text className="font-strong text-body text-ink">
                  {formatMinutes(weekMinutes)}
                </Text>
              </View>
              <View className="flex-1 rounded-panel bg-surfaceAlt px-3 py-2">
                <Text className="font-mid text-label text-muted">Total Questions</Text>
                <Text className="font-strong text-body text-ink">{weekQuestions}</Text>
              </View>
            </View>

            {dueCards > 0 ? (
              <Pressable
                onPress={() => router.push('/vocabulary' as never)}
                className="mt-3 flex-row items-center justify-between rounded-panel bg-accent-50 px-3 py-2.5"
              >
                <Text className="font-semi text-body text-accent-700">
                  {dueCards} thẻ từ vựng đến hạn ôn
                </Text>
                <Text className="font-semi text-label text-accent-700">Ôn ngay →</Text>
              </Pressable>
            ) : null}
          </Card>
        </Grid>
      </View>

      <MathCard />

      <Card className="mt-4 lg:mt-6">
        <SectionHeader
          title="Featured Practice"
          subtitle="Bài mới cào về gần đây"
          icon="book"
          action={{ label: 'View all passages', onPress: () => router.push('/library' as never) }}
        />

        <View className="mt-3 gap-2">
          {featured.filter(isReadable).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

/**
 * Thẻ SAT Math trên Dashboard.
 *
 * Nội dung đổi hẳn theo việc đã chẩn đoán hay chưa: chưa chẩn đoán thì thẻ chỉ
 * có một việc để bấm, vì mọi con số khác lúc ấy đều chưa nói lên điều gì. Đã
 * chẩn đoán rồi thì thẻ trả lời đúng một câu hỏi — hôm nay nên luyện kỹ năng nào.
 */
function MathCard() {
  const diagnostic = useLatestDiagnostic();
  const priority = useMathPriority();
  const totals = useMathTotals();
  const next = priority[0];

  return (
    <Card className="mt-4 lg:mt-6">
      <SectionHeader
        title="SAT Math"
        subtitle={
          diagnostic
            ? `Đã làm ${totals.questions} câu · đúng ${totals.correct}`
            : 'Nửa số điểm SAT nằm ở phần này'
        }
        icon="grid"
        iconTone="accent"
        action={{ label: 'Mở module', onPress: () => router.push('/math' as never) }}
      />

      {diagnostic && next ? (
        <View className="mt-3 flex-row flex-wrap items-center justify-between gap-3">
          <View className="flex-1" style={{ minWidth: 200 }}>
            <Text className="font-sans text-label text-muted">Nên luyện tiếp</Text>
            <Text className="mt-0.5 font-strong text-body text-ink">
              {MATH_SKILL_LABEL[next.skill]}
            </Text>
            <Text className="mt-0.5 font-sans text-label text-muted">
              {next.total === 0
                ? 'chưa làm câu nào'
                : `đúng ${next.correct}/${next.total} · ${formatAccuracy(next.accuracy)}`}
            </Text>
          </View>
          <Button
            label="Drill ngay"
            variant="outline"
            size="sm"
            onPress={() => router.push(`/math/drill/${next.skill}` as never)}
          />
        </View>
      ) : (
        <View className="mt-3 flex-row flex-wrap items-center justify-between gap-3">
          <Text className="flex-1 font-sans text-body text-muted" style={{ minWidth: 200 }}>
            Chưa có bản đồ điểm yếu. Bài chẩn đoán 19 câu sẽ chỉ ra nên luyện gì trước.
          </Text>
          <Button
            label="Làm bài chẩn đoán"
            size="sm"
            onPress={() => router.push('/math/diagnostic' as never)}
          />
        </View>
      )}
    </Card>
  );
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}
