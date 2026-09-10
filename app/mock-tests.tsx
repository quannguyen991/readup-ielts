import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon, PaperCard, SectionHeader, StatCard } from '@/components/ui';
import { filterArticles, type ArticleMeta, topicLabel } from '@/data/articles';
import { FULL_SET_ARTICLE_IDS } from '@/data/full-question-sets';
import { formatBand } from '@/lib/band';
import { usePlan } from '@/store/useBillingStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color, stickerGradient } from '@/theme/tokens';
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
    <MockBackdrop>
      {/*
        KHÔNG còn `HeroBanner` ở đây. Nền trang đã là gradient xanh rồi; đặt thêm
        một banner gradient lên trên là hai lớp cùng họ màu chồng nhau và mép banner
        biến mất — đúng cái đã gặp ở màn mở đầu bài thi SAT. Tiêu đề viết thẳng
        lên nền.
      */}
      <View className="flex-row flex-wrap items-start justify-between gap-4">
        <View className="min-w-0 flex-1" style={{ minWidth: 260 }}>
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-panel bg-white/20">
              <Icon name="clipboard" size={22} color="#FFFFFF" strokeWidth={1.9} />
            </View>
            <Text className="font-heavy text-hero text-white">Mock Tests</Text>
          </View>
          <Text
            className="mt-3 max-w-[620px] font-sans text-bodyLg text-white/80"
            style={{ lineHeight: 24 }}
          >
            {tests.length} đề dựng sẵn, mỗi đề 3 passage trong 60 phút, độ khó tăng dần —
            đúng nhịp bài thi thật. Không đề nào dùng lại passage của đề khác.
          </Text>
          <View className="mt-5">
            <Button
              label="Đổi bộ đề"
              variant="onDark"
              iconLeft="refresh"
              onPress={() => setSeed((s) => s + 1)}
            />
          </View>
        </View>
      </View>

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
            label="Bài vào được đề thi"
            value={String(FULL_SET_ARTICLE_IDS.size)}
            icon="book"
            tone="success"
          />
        </Grid>
      </View>

      <View className="mt-4">
        <Grid columns={2} tabletColumns={1} mobileColumns={1}>
          {tests.map((test, index) => (
            <MockTestCard key={index} test={test} index={index} plan={plan} />
          ))}
        </Grid>
      </View>

      <PaperCard className="mt-4">
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
      </PaperCard>
    </MockBackdrop>
  );
}

/**
 * Nền gradient xanh của trang Thi thử.
 *
 * Lấy ĐÚNG `stickerGradient.primary` — gradient của thẻ "Reading" ở trang giới
 * thiệu — chứ không pha một bộ màu mới gần giống. Thẻ ấy là cửa vào mảng
 * Reading, và thi thử là phần cuối của chính mảng đó; dùng chung một gradient thì
 * hai chỗ nói được rằng chúng là một đường. Pha riêng thì sau vài lần sửa là hai
 * bên trôi khỏi nhau mà không ai thấy.
 *
 * `SafeAreaView` nằm TRONG gradient: bọc ngoài thì máy có tai thỏ có một dải
 * trắng cắt ngang đỉnh.
 */
function MockBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[...stickerGradient.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <Screen>{children}</Screen>
    </LinearGradient>
  );
}

/** Ghép 3 passage tăng dần độ khó, đổi bộ mỗi lần bấm "Đổi bộ đề". */
/**
 * Số đề dựng sẵn.
 *
 * Nâng từ 20 lên 50 (07/09/2026). Kho có 567 bài IELTS đọc được, mà mỗi đề chỉ
 * tiêu 3 bài và không đề nào dùng lại bài của đề khác — 20 đề mới dùng hết 60
 * bài, tức là 90% kho nằm không. Người luyện đều mỗi tuần một đề thì 20 đề hết
 * trong năm tháng.
 */
export const MOCK_TEST_COUNT = 50;

/**
 * Dựng 50 đề, mỗi đề 3 passage theo đúng cấu trúc IELTS Reading.
 *
 * BA ĐIỀU KHÁC BẢN TRƯỚC (bản trước chỉ dựng 3 đề):
 *
 * 1. HAI MƯƠI ĐỀ, và không đề nào dùng lại passage của đề khác. Bản trước lấy
 *    `offset % pool.length` nên hai đề liền nhau dễ trùng bài khi một mức độ
 *    khó có ít bài — người thi thử lần hai gặp lại đúng passage vừa đọc.
 * 2. RÚT KHÔNG HOÀN LẠI: mỗi passage dùng đúng một lần trong cả bộ 20 đề.
 * 3. THIẾU BÀI THÌ HẠ CẤP CÓ TRẬT TỰ, không bỏ đề. Kho C2 ít hơn C1 nhiều, nên
 *    nếu đòi đủ ba mức mới dựng đề thì số đề dựng được sẽ ít hơn hẳn con số trên. Khi hết
 *    bài ở một mức, lấy bài khó nhất còn lại — vẫn giữ được thứ tự dễ → khó
 *    trong một đề, vốn là điều quan trọng nhất của cấu trúc đề thật.
 */
function buildTests(seed: number): ArticleMeta[][] {
  /*
    Chỉ lấy bài IELTS: màn này dựng đúng cấu trúc 3 passage của IELTS Reading,
    trộn passage SAT (khổ 25–150 từ) vào là hỏng nhịp đề.

    VÀ chỉ lấy bài dựng ĐỦ 13 CÂU. Đề thi thử phải đủ 40 câu; một passage ra mười
    một câu thì bài thi ấy không còn là đề IELTS, và điểm quy ra band cũng sai
    theo. Bài không đủ vẫn dùng bình thường ở nhánh luyện tập — chỉ là không được
    đứng trong đề thi thử.
  */
  const pool = filterArticles({ kind: 'readable', exam: 'ielts', sort: 'easiest' }).filter((a) =>
    FULL_SET_ARTICLE_IDS.has(a.id),
  );

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
  const minutes = test.reduce((sum, a) => sum + (a.estMinutes ?? 0), 0);
  const paid = plan !== 'free';

  return (
    <View
      className="h-full overflow-hidden rounded-card bg-surface"
      style={{ borderWidth: 1.5, borderColor: '#0F172A' }}
    >
      <View className="flex-row gap-3.5 p-4">
        <TestCover index={index} />

        <View className="min-w-0 flex-1">
          <Text className="font-heavy text-cardTitle text-ink">
            Mock Test {String(index + 1).padStart(2, '0')}
          </Text>
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            <Chip label={`${test.map((a) => a.cefrLevel).join(' → ')}`} tone="warning" />
            {/*
              Ghi rõ đây là thời gian ĐỌC, không phải thời gian làm bài.

              Banner phía trên nói "3 passage trong 60 phút" — đó là khổ bài thi
              thật. Thẻ ghi trơn "8 phút" ngay dưới thì hai con số cãi nhau, và
              người đọc tin con số nhỏ hơn rồi tưởng đề này ngắn bất thường.
            */}
            <Chip label={`~${minutes} phút đọc`} tone="neutral" />
          </View>
          <Text className="mt-2 font-sans text-label text-muted">
            Ba passage, độ khó tăng dần — đúng nhịp bài thi thật.
          </Text>
        </View>
      </View>

      {/*
        Ba passage hiện THÀNH DÒNG RIÊNG, mỗi dòng có số và nhãn chủ đề.

        Bản trước gộp chúng vào ba dòng chữ cụt đuôi ở giữa thẻ, nên nhìn vào chỉ
        biết "có ba bài" chứ không biết ba bài ấy về cái gì — mà chủ đề mới là
        thứ người ta dùng để chọn đề.
      */}
      <View className="gap-1.5 px-4">
        {test.map((article, i) => (
          <View
            key={article.id}
            className="flex-row items-center gap-2.5 rounded-panel px-3 py-2.5"
            style={{ backgroundColor: color.surfaceAlt }}
          >
            <View
              className="h-6 w-6 items-center justify-center rounded-pill"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: color.border }}
            >
              <Text className="font-heavy text-muted" style={{ fontSize: 11 }}>
                {i + 1}
              </Text>
            </View>
            <Text className="min-w-0 flex-1 font-semi text-label text-ink" numberOfLines={1}>
              {article.title}
            </Text>
            <Chip label={topicLabel(article.topic)} tone="neutral" />
          </View>
        ))}
      </View>

      <View className="flex-1" />

      <View className="flex-row gap-2 p-4">
        <Button
          className="flex-1"
          label="Luyện tập"
          variant="outline"
          size="sm"
          iconLeft="book"
          onPress={() => router.push(`/read/${test[0]!.id}` as never)}
        />
        {/*
          Nút thứ hai nói ĐÚNG thứ khác nhau giữa hai gói: chấm bằng AI sau khi
          nộp. Không phải "đề PRO" — cả hai nút dẫn tới cùng một đề, vì khoá nội
          dung đề thi thử sau tường phí thì gói Free thành bản demo.
        */}
        <Button
          className="flex-1"
          label={paid ? 'Đi thi' : 'Đi thi'}
          size="sm"
          iconLeft={paid ? 'clock' : 'clock'}
          onPress={() => router.push(`/read/${test[0]!.id}` as never)}
        />
      </View>

      {!paid ? (
        <Pressable onPress={() => router.push('/upgrade' as never)} className="px-4 pb-4">
          <Text className="font-sans text-label text-muted">
            Nộp xong muốn AI chấm theo từng tiêu chí thì cần gói trả phí.
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Bìa đề — chữ số lớn trên nền gradient, đổi màu theo số đề.
 *
 * Ảnh tham chiếu dùng ảnh bìa sách Cambridge. App này không có sách nào để chụp,
 * mà mượn bìa của họ thì vừa sai bản quyền vừa hứa một thứ không có. Một tấm bìa
 * tự dựng làm đúng phần việc thật của nó: cho mắt một mốc để phân biệt đề này
 * với đề kia khi lướt qua hai chục thẻ.
 */
function TestCover({ index }: { index: number }) {
  const tones = [
    ['#93B4FD', '#2563EB'],
    ['#C4ADF8', '#7C3AED'],
    ['#6EE7A8', '#16A34A'],
    ['#FCD34D', '#D97706'],
    ['#FCA5A5', '#DC2626'],
    ['#67E8F9', '#0891B2'],
  ] as const;
  const tone = tones[index % tones.length] as readonly [string, string];

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-panel"
      style={{ width: 62, height: 82, borderWidth: 1.5, borderColor: '#0F172A' }}
    >
      <LinearGradient
        colors={[...tone] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', inset: 0 } as never}
      />
      <View style={{ zIndex: 1, alignItems: 'center' }}>
        <Text className="font-heavy text-white" style={{ fontSize: 11, letterSpacing: 1 }}>
          MOCK
        </Text>
        <Text className="font-heavy text-white" style={{ fontSize: 26, lineHeight: 30 }}>
          {String(index + 1).padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
}

/** Viên nhãn nhỏ — dùng cho cấp độ, thời lượng và chủ đề. */
function Chip({ label, tone }: { label: string; tone: 'neutral' | 'warning' }) {
  const bg = tone === 'warning' ? '#FEF3C7' : color.surfaceAlt;
  const fg = tone === 'warning' ? '#92400E' : color.muted;
  return (
    <View className="rounded-pill px-2 py-0.5" style={{ backgroundColor: bg }}>
      <Text className="font-semi" style={{ fontSize: 10.5, color: fg }}>
        {label}
      </Text>
    </View>
  );
}
