import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, SectionHeader, StatCard } from '@/components/ui';
import { filterArticles, type ArticleMeta } from '@/data/articles';
import { formatBand } from '@/lib/band';
import { useStudyStore } from '@/store/useStudyStore';

/**
 * Mock test = 3 passage theo đúng cấu trúc IELTS Reading, tăng dần độ khó.
 * Bộ đề sinh cùng cơ chế với Practice, chỉ khác là chấm gộp cả 3 passage.
 */
export default function MockTestsScreen() {
  const sessions = useStudyStore((s) => s.sessions);
  const [seed, setSeed] = useState(0);

  const tests = useMemo(() => buildTests(seed), [seed]);
  const mockSessions = sessions.filter((s) => s.mode === 'mock_test');

  // Lượt SAT không có band nên không tham gia so kỷ lục.
  const bands = sessions.map((s) => s.estimatedBand).filter((b): b is number => b != null);
  const bestBand = bands.length === 0 ? null : Math.max(...bands);

  return (
    <Screen>
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <Text className="font-heavy text-pageTitle text-ink">Mock Tests</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Ba passage, 60 phút, độ khó tăng dần — đúng nhịp bài thi thật.
          </Text>
        </View>
        <Button label="Đổi bộ đề" variant="outline" iconLeft="refresh" onPress={() => setSeed((s) => s + 1)} />
      </View>

      <View className="mt-4">
        <Grid columns={3} tabletColumns={2} mobileColumns={1}>
          <StatCard
            label="Đã thi thử"
            value={String(mockSessions.length)}
            icon="clipboard"
            tone="primary"
          />
          <StatCard
            label="Band cao nhất"
            value={formatBand(bestBand)}
            icon="trophy"
            tone="accent"
          />
          <StatCard
            label="Bài đọc sẵn sàng"
            value={String(filterArticles({ kind: 'readable', exam: 'ielts' }).length)}
            icon="book"
            tone="success"
          />
        </Grid>
      </View>

      {tests.map((test, index) => (
        <Card key={index} className="mt-4">
          <SectionHeader
            title={`IELTS Reading Mock ${String(index + 1).padStart(2, '0')}`}
            subtitle="3 passage · 60 phút"
            icon="clipboard"
            right={<Badge label="Academic" tone="primary" shape="tag" uppercase />}
          />

          <View className="mt-3 gap-2">
            {test.map((article, passageIndex) => (
              <Pressable
                key={article.id}
                onPress={() => router.push(`/read/${article.id}` as never)}
                className="flex-row items-center gap-3 rounded-panel border border-border p-3"
              >
                <View className="h-9 w-9 items-center justify-center rounded-md bg-primary-50">
                  <Text className="font-strong text-body text-primary-700">{passageIndex + 1}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-semi text-body text-ink" numberOfLines={1}>
                    {article.title}
                  </Text>
                  <Text className="font-mid text-label text-muted">
                    {article.cefrLevel} · {article.bandRange} · {article.estMinutes} phút
                  </Text>
                </View>
                <Badge label="Bắt đầu" tone="primary" />
              </Pressable>
            ))}
          </View>
        </Card>
      ))}

      <Card className="mt-4">
        <SectionHeader title="Lịch sử thi thử" icon="clock" />
        <View className="mt-3 gap-2">
          {mockSessions.slice(0, 8).map((session) => (
            <Pressable
              key={session.id}
              onPress={() => router.push(`/review/${session.id}` as never)}
              className="flex-row items-center gap-3 rounded-panel border border-border p-3"
            >
              <Text className="flex-1 font-semi text-body text-ink" numberOfLines={1}>
                {session.articleTitle}
              </Text>
              <Badge
                label={session.estimatedBand == null ? 'SAT' : `Band ${formatBand(session.estimatedBand)}`}
                tone="primary"
              />
            </Pressable>
          ))}

          {mockSessions.length === 0 ? (
            <Text className="py-6 text-center font-sans text-body text-muted">
              Chưa có lượt thi thử nào.
            </Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}

/** Ghép 3 passage tăng dần độ khó, đổi bộ mỗi lần bấm "Đổi bộ đề". */
function buildTests(seed: number): ArticleMeta[][] {
  // Chỉ lấy bài IELTS: màn này dựng đúng cấu trúc 3 passage của IELTS Reading,
  // trộn passage SAT (khổ 25–150 từ) vào là hỏng nhịp đề.
  const pool = filterArticles({ kind: 'readable', exam: 'ielts', sort: 'easiest' });
  const easy = pool.filter((a) => a.cefrLevel === 'B1' || a.cefrLevel === 'B2');
  const medium = pool.filter((a) => a.cefrLevel === 'C1');
  const hard = pool.filter((a) => a.cefrLevel === 'C2');

  const tests: ArticleMeta[][] = [];

  for (let i = 0; i < 3; i += 1) {
    const offset = seed * 3 + i;
    const passage1 = easy[offset % Math.max(1, easy.length)];
    const passage2 = medium[offset % Math.max(1, medium.length)];
    const passage3 = hard[offset % Math.max(1, hard.length)];

    const test = [passage1, passage2, passage3].filter((a): a is ArticleMeta => Boolean(a));
    if (test.length === 3) tests.push(test);
  }

  return tests;
}
