import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { ArticleCard } from '@/components/article/ArticleCard';
import { ChartFigure } from '@/components/writing/ChartFigure';
import { matchesWritingFilter } from '@/lib/writing/prompt-filter';
import { PlanNudge } from '@/components/billing/PlanUi';
import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear, PressScale } from '@/components/motion/Motion';
import {
  CheckGroup,
  FilterRail,
  type RailSelection,
  type RailSkill,
} from '@/components/practice/FilterRail';
import { Badge, Button, Card, Icon, Pagination, type IconName } from '@/components/ui';
import { ARTICLES, filterArticles, isReadable, type ArticleMeta } from '@/data/articles';
import { WRITING_PROMPTS } from '@/data/writing-repository';
import { AVAILABLE_IELTS_TYPES, QUESTION_TYPE_LABEL } from '@/services/questions/types';
import { CURRICULUM_TOTALS } from '@/services/math/curriculum';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';
import type { CefrLevel, PassageTier } from '@/types/database';

/**
 * Trang Luyện tập.
 *
 * Bản trước là một hub với vài thẻ gợi ý — nó không trả lời được câu "tôi muốn
 * làm riêng Passage 2 của IELTS thì vào đâu". Bản này đổi thành THƯ VIỆN BÀI
 * TẬP có thanh lọc phân cấp: chọn kỹ năng → kiểu bài → khổ bài, rồi lọc thêm
 * theo nguồn và trình độ.
 *
 * Listening và Speaking hiện MỜ kèm chữ "Sắp có". Bày chúng ra như thật rồi bấm
 * vào thấy trống là kiểu thất hứa khó chịu nhất; giấu hẳn thì người dùng không
 * biết app định làm tới đâu.
 */

const TIER_BY_CHILD: Record<string, PassageTier> = {
  p1: 'p1',
  p2: 'p2',
  p3: 'p3',
  short: 'short_academic',
};

const SKILLS: RailSkill[] = [
  {
    key: 'reading',
    label: 'Reading',
    icon: 'book',
    tint: '#2563EB',
    options: [
      {
        key: 'single',
        label: 'Bài lẻ',
        children: [
          { key: 'p1', label: 'Passage 1 (~750 từ)' },
          { key: 'p2', label: 'Passage 2 (~900 từ)' },
          { key: 'p3', label: 'Passage 3 (~1050 từ)' },
          { key: 'short', label: 'Bài ngắn' },
        ],
      },
      { key: 'full', label: 'Full đề — 3 passage, 60 phút' },
    ],
  },
  {
    key: 'listening',
    label: 'Listening',
    icon: 'volume',
    tint: '#F59E0B',
    options: [],
    comingSoon: true,
  },
  {
    key: 'writing',
    label: 'Writing',
    icon: 'pencil',
    tint: '#A855F7',
    options: [
      {
        key: 'single',
        label: 'Bài lẻ',
        children: [
          { key: 'task1', label: 'Task 1 — biểu đồ' },
          { key: 'task2', label: 'Task 2 — luận' },
        ],
      },
    ],
  },
  {
    key: 'speaking',
    label: 'Speaking',
    icon: 'chat',
    tint: '#0EA5E9',
    options: [],
    comingSoon: true,
  },
];

const LEVELS: CefrLevel[] = ['A2', 'B1', 'B2', 'C1', 'C2'];

/** Dạng biểu đồ Task 1 — đúng những gì kho đề đang có, không kê thừa. */
/** Dạng đề Task 2 — đúng năm dạng có trong kho, đếm từ dữ liệu chứ không kê. */
const ESSAY_KINDS = [
  { key: 'opinion', label: 'Opinion' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'advantage_disadvantage', label: 'Advantages / Disadvantages' },
  { key: 'two_part', label: 'Two-part Question' },
  { key: 'problem_solution', label: 'Problem / Solution' },
];

const WRITING_BANDS = [
  { key: '6', label: 'Band 6' },
  { key: '6.5', label: 'Band 6.5' },
  { key: '7', label: 'Band 7' },
];

/**
 * Bề ngang hình thu nhỏ trên thẻ đề.
 *
 * Cố định chứ không đo theo thẻ: `ChartFigure` nhận width để tính toạ độ SVG,
 * mà đo bằng onLayout thì lần vẽ đầu chưa có số, hình nhảy một nhịp khi lưới
 * hiện ra. Thẻ hẹp hơn thì hình co lại theo khung, không tràn.
 */
const THUMB_WIDTH = 260;

const CHART_KINDS = [
  { key: 'line', label: 'Line Graph' },
  { key: 'bar', label: 'Bar Chart' },
  { key: 'pie', label: 'Pie Chart' },
  { key: 'table', label: 'Table' },
];

const READABLE_TOTAL = ARTICLES.filter(isReadable).length;

export default function PracticeScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

  const [selection, setSelection] = useState<RailSelection>({
    skill: 'reading',
    option: 'single',
    child: null,
  });
  const [sources, setSources] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  /*
    Lọc theo LOẠI CÂU HỎI và DẠNG BIỂU ĐỒ.

    Khác các bộ lọc trên ở một điểm quan trọng: đề của app SINH RA lúc bắt đầu
    làm bài, chưa tồn tại lúc chọn bài. Nên đây không phải lọc danh sách sẵn có
    mà là ĐẶT HÀNG — chọn xong thì đề sinh ra chỉ gồm những dạng đã chọn. Giao
    diện phải nói đúng điều đó, nếu không người dùng tưởng nó lọc mà số bài
    không đổi rồi nghĩ bộ lọc hỏng.
  */
  const [qTypes, setQTypes] = useState<string[]>([]);
  const [chartKinds, setChartKinds] = useState<string[]>([]);
  const [essayKinds, setEssayKinds] = useState<string[]>([]);
  const [bands, setBands] = useState<string[]>([]);
  const [railOpen, setRailOpen] = useState(false);

  // Đếm số bài theo nguồn để chip lọc nói được nguồn nào có bao nhiêu — danh sách
  // nguồn mà không có số thì người dùng bấm mò.
  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of ARTICLES) {
      const key = a.sourceName ?? 'Khác';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, label: key, count }));
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);

  /**
   * Mỗi trang 8 thẻ.
   *
   * Bản trước vẽ tối đa 60 thẻ một lượt rồi ghi chú "đang hiện 60 bài đầu, lọc
   * thêm để thu hẹp" — tức là bắt người dùng lọc cho tới khi vừa màn, dù thứ họ
   * cần chỉ là lật trang. Số đếm phía trên vẫn là tổng số bài khớp, không phải
   * số thẻ đang vẽ.
   */
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);

  const filterKey = [
    selection.skill,
    selection.option,
    selection.child,
    ...sources,
    ...levels,
    ...qTypes,
    ...chartKinds,
    ...essayKinds,
    ...bands,
  ].join('|');

  /*
    Đổi bộ lọc thì về trang 1 — chỉnh NGAY TRONG LÚC RENDER, không qua effect.

    Không làm vậy thì lọc từ 300 bài xuống 12 bài trong khi đang ở trang 9 sẽ ra
    một màn trống, trông như bộ lọc hỏng. Nhưng gọi `setPage` trong effect lại
    khiến React vẽ một nhịp thừa với trang cũ rồi mới vẽ lại — đây đúng là mẫu
    "chỉnh state khi prop đổi" mà React khuyến nghị làm ngay trong thân hàm.
  */
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(0);
  }

  const readingMatches = useMemo(() => {
    if (selection.skill !== 'reading' || selection.option !== 'single') return [];
    const tier = selection.child ? TIER_BY_CHILD[selection.child] : undefined;
    // Không chọn khổ nào thì lấy tất cả — 'all' là giá trị `filterArticles` hiểu.
    return filterArticles({ kind: 'readable', exam: 'ielts', tier: tier ?? 'all', sort: 'easiest' })
      .filter((a) => (sources.length === 0 ? true : sources.includes(a.sourceName ?? '')))
      .filter((a) => (levels.length === 0 ? true : levels.includes(a.cefrLevel ?? '')));
  }, [levels, selection, sources]);

  const writingMatches = useMemo(() => {
    if (selection.skill !== 'writing') return [];
    const child = selection.child;
    return WRITING_PROMPTS.filter((p) =>
      matchesWritingFilter(p, { child, chartKinds, essayKinds, bands }),
    );
  }, [bands, chartKinds, essayKinds, selection]);

  const filtersOn =
    sources.length + levels.length + qTypes.length + chartKinds.length + essayKinds.length + bands.length >
    0;
  const clearFilters = () => {
    setSources([]);
    setLevels([]);
    setQTypes([]);
    setChartKinds([]);
    setEssayKinds([]);
    setBands([]);
  };

  const rail = (
    <FilterRail
      skills={SKILLS}
      selection={selection}
      /*
        Chọn "Full đề" là ĐI THẲNG sang phòng thi, không dừng ở một thẻ có nút.

        Thẻ trung gian trước đây chỉ nói lại đúng những gì cái nút vừa bấm đã
        nói, rồi bắt bấm thêm một lần nữa. Người chọn "Full đề" đã quyết rồi.
      */
      onSelect={(next) => {
        if (next.skill === 'reading' && next.option === 'full') {
          router.push('/mock-tests' as never);
          return;
        }
        setSelection(next);
      }}
      onNavigate={(href) => router.push(href as never)}
      groups={
        selection.skill === 'reading' ? (
          <View className="mt-2 gap-2">
            <CheckGroup
              title="Loại câu hỏi"
              note={
                AVAILABLE_IELTS_TYPES.length > 1
                  ? 'Chọn rồi thì đề sinh ra chỉ gồm những dạng này.'
                  : 'Bộ sinh đề hiện mới làm được dạng này. Các dạng khác đang dựng.'
              }
              options={AVAILABLE_IELTS_TYPES.map((t) => ({ key: t, label: QUESTION_TYPE_LABEL[t] }))}
              selected={qTypes}
              onToggle={(k) => toggle(qTypes, setQTypes, k)}
            />
            <CheckGroup
              title="Nguồn tài liệu"
              options={sourceOptions}
              selected={sources}
              onToggle={(k) => toggle(sources, setSources, k)}
            />
            <CheckGroup
              title="Trình độ"
              options={LEVELS.map((l) => ({ key: l, label: l }))}
              selected={levels}
              onToggle={(k) => toggle(levels, setLevels, k)}
            />
          </View>
        ) : selection.skill === 'writing' && selection.child !== 'sat' ? (
          <View className="mt-2 gap-2">
            {/*
              Bộ lọc dựng theo ĐÚNG trường có thật trong kho đề. Bản tham chiếu
              còn có các tab nguồn kiểu "Actual Tests" hay "C10-C20"; ở đây cả 60
              đề đều do app sinh ra từ một nguồn, nên bày tab nguồn là bày ra
              những ngăn rỗng chỉ để trông giống.
            */}
            {/*
              Chưa chọn Task nào thì danh sách gồm CẢ HAI, nên phải bày cả hai bộ
              lọc. Bày mỗi "Dạng đề" của Task 2 lên trên một danh sách đầy biểu đồ
              Task 1 thì người dùng chọn Opinion xong thấy biến mất gần hết bài mà
              không hiểu vì sao.
            */}
            {selection.child !== 'task2' ? (
              <CheckGroup
                title="Dạng biểu đồ (Task 1)"
                options={CHART_KINDS}
                selected={chartKinds}
                onToggle={(k) => toggle(chartKinds, setChartKinds, k)}
              />
            ) : null}
            {selection.child !== 'task1' ? (
              <CheckGroup
                title="Dạng đề (Task 2)"
                options={ESSAY_KINDS}
                selected={essayKinds}
                onToggle={(k) => toggle(essayKinds, setEssayKinds, k)}
              />
            ) : null}
            <CheckGroup
              title="Band mục tiêu"
              options={WRITING_BANDS}
              selected={bands}
              onToggle={(k) => toggle(bands, setBands, k)}
            />
          </View>
        ) : null
      }
    />
  );

  return (
    <Screen>
      {/*
        Đầu trang nhẹ, không phải banner gradient choán màn.

        Banner cũ cao gần 200px và bão hoà màu, trong khi thứ người dùng vào đây
        để làm nằm ngay dưới nó. Giữ đúng ba thứ cần: tên trang, một câu nói rõ
        cách dùng, và ba con số cho biết kho có gì.
      */}
      <Appear>
        <View className="flex-row flex-wrap items-start justify-between gap-3">
          <View className="flex-1" style={{ minWidth: 220 }}>
            <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
              <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 10 }}>
                Practice hub
              </Text>
            </View>
            <Text className="mt-3 font-heavy text-pageTitle text-ink">Luyện tập</Text>
            <Text className="mt-1.5 font-sans text-bodyLg text-muted" style={{ maxWidth: 560 }}>
              Chọn kỹ năng và khổ bài ở cột trái, rồi làm bài có bấm giờ và xem lại từng câu kèm
              bằng chứng trong bài.
            </Text>
          </View>

          {!wide ? (
            <Button
              label={railOpen ? 'Đóng bộ lọc' : 'Bộ lọc'}
              variant="outline"
              iconLeft="filter"
              onPress={() => setRailOpen((v) => !v)}
            />
          ) : null}
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <StatPill value={READABLE_TOTAL.toLocaleString('vi-VN')} label="bài đọc" />
          <StatPill value={String(WRITING_PROMPTS.length)} label="đề Writing" />
          <StatPill value={String(CURRICULUM_TOTALS.sets)} label="bộ đề Math" />
        </View>
      </Appear>

      <Appear index={1}>
        <QuickStart onPick={setSelection} />
      </Appear>

      <PlanNudge />

      <View className={wide ? 'mt-4 flex-row gap-5' : 'mt-4'}>
        {wide || railOpen ? (
          <Appear index={2} style={wide ? { width: 268 } : undefined}>
            <View className={wide ? '' : 'mb-4'}>{rail}</View>
          </Appear>
        ) : null}

        {/*
          `key` gồm cả bộ lọc, nên đổi lọc là khối kết quả dựng lại và chạy lại
          hiệu ứng hiện dần. Đây không phải trang trí: lọc xong mà lưới đứng im
          thì không biết bộ lọc đã ăn chưa, nhất là khi số bài không đổi mấy.
        */}
        <View
          className="flex-1"
          key={filterKey}
        >
          {selection.skill === 'reading' ? (
            <ResultGrid
              count={readingMatches.length}
              page={page}
              pageSize={PAGE_SIZE}
              onChangePage={setPage}
              label="bài đọc"
              empty="Không có bài nào khớp. Bỏ bớt một bộ lọc là ra."
              onClear={filtersOn ? clearFilters : undefined}
            >
              {readingMatches
                .slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
                .map((article: ArticleMeta, i: number) => (
                  <Appear key={article.id} index={i}>
                    <ArticleCard
                      article={article}
                      layout="cover"
                      query={qTypes.length > 0 ? `types=${qTypes.join(',')}` : undefined}
                    />
                  </Appear>
                ))}
            </ResultGrid>
          ) : selection.skill === 'writing' ? (
            (
              <ResultGrid
                count={writingMatches.length}
                page={page}
                pageSize={PAGE_SIZE}
                onChangePage={setPage}
                label="đề viết"
                empty="Chưa có đề nào."
              >
                {writingMatches
                  .slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
                  .map((prompt, i) => (
                    <Appear key={prompt.id} index={i} style={{ height: '100%' }}>
                      <WritingPromptCard prompt={prompt} />
                    </Appear>
                  ))}
              </ResultGrid>
            )
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

/** Ô số liệu trên nền SÁNG — đầu trang không còn là banner gradient nữa. */
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5 rounded-pill border border-border bg-surface px-3.5 py-1.5">
      <Text className="font-heavy text-body text-ink">{value}</Text>
      <Text className="font-sans text-label text-muted">{label}</Text>
    </View>
  );
}

/**
 * Hàng lối tắt ngay dưới tiêu đề.
 *
 * Thanh lọc ba tầng mạnh nhưng chậm: muốn làm một bài ngắn phải bấm ba lần mới
 * tới. Bốn lối tắt này là bốn ý định hay gặp nhất, mỗi cái đúng MỘT lần bấm.
 *
 * Ô "Đọc tiếp" chỉ hiện khi thật sự có bài đang đọc dở — thà bỏ trống còn hơn
 * để một nút bấm vào không ra gì.
 */
function QuickStart({ onPick }: { onPick: (next: RailSelection) => void }) {
  const progress = useStudyStore((s) => s.progress);

  const resume = useMemo(() => {
    const open = Object.values(progress)
      .filter((p) => p.percentCompleted > 0 && p.percentCompleted < 100)
      .sort((a, b) => b.lastReadAt.localeCompare(a.lastReadAt))[0];
    if (!open) return null;
    const article = ARTICLES.find((a) => a.id === open.articleId);
    return article ? { article, percent: Math.round(open.percentCompleted) } : null;
  }, [progress]);

  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {resume ? (
        <Shortcut
          icon="play"
          tint="#16A34A"
          title="Đọc tiếp"
          note={`${resume.article.title} · ${resume.percent}%`}
          onPress={() => router.push(`/read/${resume.article.id}` as never)}
        />
      ) : null}
      <Shortcut
        icon="clock"
        tint="#2563EB"
        title="Bài ngắn"
        note="Vừa một lượt 15 phút"
        onPress={() => onPick({ skill: 'reading', option: 'single', child: 'short' })}
      />
      <Shortcut
        icon="clipboard"
        tint="#A855F7"
        title="Full đề Reading"
        note="3 passage · 60 phút"
        onPress={() => router.push('/mock-tests' as never)}
      />
    </View>
  );
}

function Shortcut({
  icon,
  tint,
  title,
  note,
  onPress,
}: {
  icon: IconName;
  tint: string;
  title: string;
  note: string;
  onPress: () => void;
}) {
  return (
    <PressScale onPress={onPress} style={{ flexGrow: 1, flexBasis: 190 }}>
      <View
        className="flex-row items-center gap-2.5 rounded-card border bg-surface px-3 py-2.5"
        style={{ borderColor: `${tint}33` }}
      >
        <View
          className="h-8 w-8 items-center justify-center rounded-panel"
          style={{ backgroundColor: `${tint}18` }}
        >
          <Icon name={icon} size={15} color={tint} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-body text-ink" numberOfLines={1}>
            {title}
          </Text>
          <Text className="font-sans text-label text-muted" numberOfLines={1}>
            {note}
          </Text>
        </View>
      </View>
    </PressScale>
  );
}

function ResultGrid({
  count,
  page,
  pageSize,
  onChangePage,
  label,
  empty,
  onClear,
  children,
}: {
  count: number;
  page: number;
  pageSize: number;
  onChangePage: (next: number) => void;
  label: string;
  empty: string;
  /** Có bộ lọc đang bật thì cho một đường thoát về "tất cả". */
  onClear?: () => void;
  children: React.ReactNode;
}) {
  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  return (
    <View>
      <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
        <Text className="font-mid text-label text-muted">
          <Text className="font-heavy text-ink">{count}</Text> {label} khớp bộ lọc
        </Text>
        {onClear ? (
          <Pressable onPress={onClear} accessibilityRole="button">
            <Text className="font-strong text-label text-primary-700">Xoá bộ lọc</Text>
          </Pressable>
        ) : null}
      </View>

      {count === 0 ? (
        <Card>
          <View className="items-center py-6">
            <View className="h-12 w-12 items-center justify-center rounded-pill bg-canvas">
              <Icon name="search" size={20} color={color.subtle} />
            </View>
            <Text className="mt-3 text-center font-sans text-body text-muted">{empty}</Text>
            {onClear ? (
              <Button className="mt-3" label="Xoá bộ lọc" variant="outline" onPress={onClear} />
            ) : null}
          </View>
        </Card>
      ) : (
        <>
          <Grid columns={2} tabletColumns={2} mobileColumns={1}>
            {children}
          </Grid>
          <Pagination page={Math.min(page, pageCount - 1)} pageCount={pageCount} onChange={onChangePage} />
        </>
      )}
    </View>
  );
}

function WritingPromptCard({ prompt }: { prompt: (typeof WRITING_PROMPTS)[number] }) {
  return (
    <PressScale
      onPress={() => router.push(`/write/${prompt.id}` as never)}
      style={{ height: '100%' }}
    >
      <Card className="h-full">
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge
            label={prompt.task === 'ielts_task1' ? 'Task 1' : 'Task 2'}
            tone={prompt.task === 'ielts_task1' ? 'primary' : 'accent'}
            shape="tag"
          />
          {prompt.chartKind ? <Badge label={prompt.chartKind} tone="neutral" shape="tag" /> : null}
          <Badge label={`Band ${prompt.difficultyBand}`} tone="info" shape="tag" />
        </View>
        {/*
          Task 1 hiện luôn biểu đồ ngay trên thẻ.

          Đề Task 1 là "tả cái biểu đồ này", nên chỉ đọc chữ đề thì chưa biết
          mình sắp làm gì — hai đề line graph khác nhau có phần chữ gần như y
          hệt. Nhìn thấy hình rồi mới chọn được đề muốn luyện.

          Hình dựng từ chính `chartData` của đề, không phải ảnh chụp sẵn, nên nó
          không bao giờ lệch với hình trong màn làm bài.
        */}
        {prompt.chartData ? (
          <View className="mt-2 overflow-hidden">
            <ChartFigure data={prompt.chartData} width={THUMB_WIDTH} />
          </View>
        ) : null}
        <Text className="mt-2 font-sans text-body text-ink" numberOfLines={prompt.chartData ? 2 : 4}>
          {prompt.promptText}
        </Text>
        <View className="flex-1" />
        <View className="mt-2 flex-row items-center gap-3">
          <Meta icon="clock" text={`${Math.round(prompt.timeLimitSeconds / 60)} phút`} />
          <Meta icon="list" text={`≥ ${prompt.minWords} từ`} />
        </View>
      </Card>
    </PressScale>
  );
}

function Meta({ icon, text }: { icon: 'clock' | 'list'; text: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size={13} color={color.subtle} />
      <Text className="font-mid text-label text-muted">{text}</Text>
    </View>
  );
}


