import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, HeroBanner, SectionHeader, StatCard } from '@/components/ui';
import { filterArticles, type ArticleMeta } from '@/data/articles';
import { formatBand } from '@/lib/band';
import { usePlan } from '@/store/useBillingStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';
import type { PlanId } from '@/lib/billing/plans';

/**
 * Mock test = 3 passage theo đúng cấu trúc IELTS Reading, tăng dần độ khó.
 * Bộ đề sinh cùng cơ chế với Practice, chỉ khác là chấm gộp cả 3 passage.
 */
export default function MockTestsScreen() {
  const sessions = useStudyStore((s) => s.sessions);
  const plan = usePlan();
  const [seed, setSeed] = useState(0);

  const tests = useMemo(() => buildTests(seed), [seed]);
  const mockSessions = sessions.filter((s) => s.mode === 'mock_test');

  // Lượt SAT không có band nên không tham gia so kỷ lục.
  const bands = sessions.map((s) => s.estimatedBand).filter((b): b is number => b != null);
  const bestBand = bands.length === 0 ? null : Math.max(...bands);

  return (
    <Screen>
      <HeroBanner
        title="Mock Tests"
        subtitle={`${tests.length} đề dựng sẵn, mỗi đề 3 passage trong 60 phút, độ khó tăng dần — đúng nhịp bài thi thật. Không đề nào dùng lại passage của đề khác.`}
        illustration="mock-tests-hero"
      >
        <Button label="Đổi bộ đề" variant="outline" iconLeft="refresh" onPress={() => setSeed((s) => s + 1)} />
      </HeroBanner>

      <View className="mt-4">
        <Grid columns={3} tabletColumns={2} mobileColumns={1}>
          <StatCard
            variant="sticker"
            label="Đã thi thử"
            value={String(mockSessions.length)}
            icon="clipboard"
            tone="primary"
          />
          <StatCard
            variant="sticker"
            label="Band cao nhất"
            value={formatBand(bestBand)}
            icon="trophy"
            tone="accent"
          />
          <StatCard
            variant="sticker"
            label="Bài đọc sẵn sàng"
            value={String(filterArticles({ kind: 'readable', exam: 'ielts' }).length)}
            icon="book"
            tone="success"
          />
        </Grid>
      </View>

      <View className="mt-4">
        <Grid columns={3} tabletColumns={2} mobileColumns={1}>
          {tests.map((test, index) => (
            <MockTestCard key={index} test={test} index={index} plan={plan} />
          ))}
        </Grid>
      </View>

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
/** Số đề dựng sẵn. Hai mươi đề là đủ luyện vài tháng mà không gặp lại bài cũ. */
export const MOCK_TEST_COUNT = 20;

/**
 * Dựng 20 đề, mỗi đề 3 passage theo đúng cấu trúc IELTS Reading.
 *
 * BA ĐIỀU KHÁC BẢN TRƯỚC (bản trước chỉ dựng 3 đề):
 *
 * 1. HAI MƯƠI ĐỀ, và không đề nào dùng lại passage của đề khác. Bản trước lấy
 *    `offset % pool.length` nên hai đề liền nhau dễ trùng bài khi một mức độ
 *    khó có ít bài — người thi thử lần hai gặp lại đúng passage vừa đọc.
 * 2. RÚT KHÔNG HOÀN LẠI: mỗi passage dùng đúng một lần trong cả bộ 20 đề.
 * 3. THIẾU BÀI THÌ HẠ CẤP CÓ TRẬT TỰ, không bỏ đề. Kho C2 ít hơn C1 nhiều, nên
 *    nếu đòi đủ ba mức mới dựng đề thì số đề dựng được sẽ ít hơn hẳn 20. Khi hết
 *    bài ở một mức, lấy bài khó nhất còn lại — vẫn giữ được thứ tự dễ → khó
 *    trong một đề, vốn là điều quan trọng nhất của cấu trúc đề thật.
 */
function buildTests(seed: number): ArticleMeta[][] {
  // Chỉ lấy bài IELTS: màn này dựng đúng cấu trúc 3 passage của IELTS Reading,
  // trộn passage SAT (khổ 25–150 từ) vào là hỏng nhịp đề.
  const pool = filterArticles({ kind: 'readable', exam: 'ielts', sort: 'easiest' });

  const rank: Record<string, number> = { A2: 0, B1: 1, B2: 2, C1: 3, C2: 4 };
  const byHardness = [...pool].sort(
    (a, b) => (rank[a.cefrLevel ?? 'B1'] ?? 1) - (rank[b.cefrLevel ?? 'B1'] ?? 1),
  );

  const easy = byHardness.filter((a) => a.cefrLevel === 'B1' || a.cefrLevel === 'B2');
  const medium = byHardness.filter((a) => a.cefrLevel === 'C1');
  const hard = byHardness.filter((a) => a.cefrLevel === 'C2');

  /*
    `seed` xoay điểm bắt đầu của cả ba kho cùng lúc, nên bấm "Đổi bộ đề" cho ra
    hai mươi đề khác hẳn chứ không phải hai mươi đề xê dịch một bài.
  */
  const rotate = <T,>(list: T[], by: number) =>
    list.length === 0 ? list : [...list.slice(by % list.length), ...list.slice(0, by % list.length)];

  const used = new Set<string>();
  const takeFrom = (...lists: ArticleMeta[][]): ArticleMeta | null => {
    for (const list of lists) {
      const found = list.find((a) => !used.has(a.id));
      if (found) {
        used.add(found.id);
        return found;
      }
    }
    return null;
  };

  const e = rotate(easy, seed * 7);
  const m = rotate(medium, seed * 5);
  const h = rotate(hard, seed * 3);

  const tests: ArticleMeta[][] = [];
  for (let i = 0; i < MOCK_TEST_COUNT; i += 1) {
    // Thứ tự dự phòng đi từ mức mong muốn sang mức GẦN NHẤT còn bài, nên một đề
    // thiếu bài C2 vẫn ra ba passage tăng dần độ khó thay vì biến mất.
    const p1 = takeFrom(e, m, h);
    const p2 = takeFrom(m, h, e);
    const p3 = takeFrom(h, m, e);

    const test = [p1, p2, p3].filter((a): a is ArticleMeta => Boolean(a));
    if (test.length < 3) break;
    tests.push(test);
  }

  return tests;
}

/**
 * Thẻ một đề thi thử. Rê chuột vào mới hiện hai nút bắt đầu.
 *
 * Kiểu này mượn từ YouPass, và nó giải quyết một vấn đề thật: hai mươi đề mà
 * thẻ nào cũng bày sẵn nút thì cả trang là một rừng nút xanh, mắt không biết
 * dừng ở đâu. Nút chỉ hiện trên thẻ đang trỏ vào, nên mỗi lúc chỉ có một lời
 * mời hành động.
 *
 * TRÊN CẢM ỨNG KHÔNG CÓ "RÊ CHUỘT", nên ở màn hình hẹp nút hiện sẵn luôn. Ẩn nút
 * sau một thao tác không tồn tại là khoá hẳn tính năng trên điện thoại.
 */
function MockTestCard({
  test,
  index,
  plan,
}: {
  test: ArticleMeta[];
  index: number;
  plan: PlanId;
}) {
  const { width } = useWindowDimensions();
  const touch = width < 1024;
  const [hover, setHover] = useState(false);
  const showActions = hover || touch;

  const minutes = test.reduce((sum, a) => sum + (a.estMinutes ?? 0), 0);
  const paid = plan !== 'free';

  return (
    <Pressable
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onPress={() => router.push(`/read/${test[0]!.id}` as never)}
      className="h-full rounded-card border border-border bg-surface p-4"
      style={hover ? { borderColor: color.primary } : undefined}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Badge label={`Mock ${String(index + 1).padStart(2, '0')}`} tone="primary" shape="tag" />
        <Text className="font-mid text-label text-muted">{minutes} phút</Text>
      </View>

      <View className="mt-2 gap-1">
        {test.map((article, i) => (
          <Text key={article.id} className="font-sans text-label text-ink" numberOfLines={1}>
            <Text className="font-strong text-muted">P{i + 1} · </Text>
            {article.title}
          </Text>
        ))}
      </View>

      <Text className="mt-2 font-sans text-label text-subtle">
        {test.map((a) => a.cefrLevel).join(' → ')} · độ khó tăng dần
      </Text>

      <View className="flex-1" />

      {showActions ? (
        <View className="mt-3 gap-2">
          <Button
            label="Luyện đề"
            variant="outline"
            size="sm"
            fullWidth
            iconRight="arrow-right"
            onPress={() => router.push(`/read/${test[0]!.id}` as never)}
          />
          {/*
            Nút thứ hai nói ĐÚNG thứ khác nhau giữa hai gói: chấm bằng AI sau khi
            nộp. Không phải "đề PRO" — cả hai nút dẫn tới cùng một đề, vì khoá
            nội dung đề thi thử sau tường phí thì gói Free thành bản demo.
          */}
          <Button
            label={paid ? 'Luyện đề + AI chấm' : 'AI chấm — cần gói trả phí'}
            size="sm"
            fullWidth
            variant={paid ? 'primary' : 'ghost'}
            iconRight={paid ? 'sparkle' : 'lock'}
            onPress={() =>
              paid
                ? router.push(`/read/${test[0]!.id}` as never)
                : router.push('/upgrade' as never)
            }
          />
        </View>
      ) : (
        <View className="mt-3 h-[76px] items-center justify-center">
          <Text className="font-sans text-label text-subtle">Rê chuột để bắt đầu</Text>
        </View>
      )}
    </Pressable>
  );
}
