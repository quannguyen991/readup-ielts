import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ArticleCard } from '@/components/article/ArticleCard';
import { BarChart } from '@/components/charts';
import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import {
  AssetImage,
  Badge,
  Button,
  Card,
  HeroBanner,
  ProgressBar,
  QuestionTypeIcon,
  SectionHeader,
  StatCard,
} from '@/components/ui';
import { filterArticles, isReadable, libraryStats, topicLabel } from '@/data/articles';
import { bandDelta, formatBand } from '@/lib/band';
import { assetKeys } from '@/services/assets/useAssets';
import { QUESTION_TYPE_LABEL } from '@/services/questions/types';
import { useAccuracyByType, useRecentDays, useStreak, useStudyStore } from '@/store/useStudyStore';
import { useDueCards } from '@/store/useVocabStore';

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
      <HeroBanner
        title="Master IELTS Reading"
        subtitle={`${stats.ielts} passage IELTS và ${stats.sat} passage SAT từ ${stats.sources} nguồn công khai. Đọc, tra từ trong ngữ cảnh, làm đề và xem lại từng câu kèm bằng chứng.`}
        illustration="dashboard-hero"
      >
        <View className="flex-row flex-wrap items-center gap-3">
          <Button
            label="Bắt đầu luyện"
            iconRight="arrow-right"
            size="lg"
            variant="onDarkSolid"
            onPress={() =>
              recommended
                ? router.push(`/read/${recommended.id}` as never)
                : router.push('/library' as never)
            }
          />
          <Button
            label="Mở thư viện"
            iconLeft="book"
            size="lg"
            variant="onDark"
            onPress={() => router.push('/library' as never)}
          />
        </View>
      </HeroBanner>

      <View className="mt-4 lg:mt-6">
        <Grid columns={4} tabletColumns={2} mobileColumns={1}>
          <StatCard
            label="Daily Goal"
            value={String(minutesToday)}
            unit={`/ ${dailyGoal} min`}
            icon="target"
            tone="primary"
            progress={{ value: (minutesToday / dailyGoal) * 100 }}
            caption={minutesToday >= dailyGoal ? 'Xong mục tiêu hôm nay 🎯' : 'Còn tiếp tục nhé'}
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

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}
