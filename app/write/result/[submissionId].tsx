import { themedHex } from '@/theme/palette-state';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { VerificationReceiptPanel } from '@/components/ai/VerificationReceiptPanel';
import { TransferCheck } from '@/components/writing/TransferCheck';
import { TaskShell } from '@/components/layout/TaskShell';
import { Badge, Button, Icon, PaperCard } from '@/components/ui';
import { ChartFigure } from '@/components/writing/ChartFigure';
import { getWritingPromptById } from '@/data/writing-repository';
import { formatBand } from '@/lib/band';
import { analyseDraft } from '@/services/writing/analyzer';
import { applyFixes, countApplicableFixes } from '@/services/writing/apply-fixes';
import { useAuthStore } from '@/store/useAuthStore';
import { useWritingStore } from '@/store/useWritingStore';
import { useCityStore } from '@/store/useCityStore';
import { useRoadmapStore } from '@/store/useRoadmapStore';
import { modelEssayBand } from '@/services/progress/goal';
import { color, paper } from '@/theme/tokens';
import type { AnnotationCategory, WritingAnnotation, WritingEvaluation } from '@/lib/writing/types';
import { CrossFade } from '@/components/motion/Motion';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge as BadgeSticker } from '@/components/illust/Cute';
import { CuteNotebook, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { currentLocale, useL } from '@/i18n/useL';

/**
 * Kết quả chấm bài.
 *
 * Chấm AI chạy khi mở trang này, không chạy lúc nộp: người học nộp xong là thấy
 * ngay phần phân tích offline, còn phần AI đến sau vài chục giây. Nếu AI hỏng
 * thì trang vẫn dùng được — đó là lý do phần offline luôn hiện, kể cả khi AI
 * chấm thành công.
 *
 * Nội dung chia THEO TAB chứ không đổ hết thành một cột dài. Bốn thứ ở đây trả
 * lời bốn câu hỏi khác nhau — "bài tôi trông thế nào", "tôi được nhận xét gì",
 * "sai chỗ nào và sửa ra sao", "bản sửa xong đọc thế nào" — và người học đọc
 * chúng ở bốn thời điểm khác nhau, nên xếp cạnh nhau thì lúc nào cũng phải cuộn
 * qua ba phần không cần để tới phần cần.
 */

const CATEGORY_LABEL: Record<AnnotationCategory, string> = {
  grammar: 'Ngữ pháp',
  lexis: 'Từ vựng',
  cohesion: 'Liên kết',
  expression: 'Diễn đạt',
  task: 'Bám đề & số liệu',
};

const CATEGORY_LABEL_EN: Record<AnnotationCategory, string> = {
  grammar: 'Grammar',
  lexis: 'Vocabulary',
  cohesion: 'Cohesion',
  expression: 'Expression',
  task: 'Task & data',
};

/**
 * Bốn tiêu chí IELTS, và loại lỗi nào rơi vào tiêu chí nào.
 *
 * `expression` gộp vào Lexical Resource: lỗi diễn đạt gượng gạo là lỗi chọn từ
 * và chọn cụm, giám khảo trừ ở LR chứ không ở đâu khác.
 */
const CRITERIA = [
  { key: 'TA', label: 'Task Achievement', categories: ['task'] },
  { key: 'CC', label: 'Coherence & Cohesion', categories: ['cohesion'] },
  { key: 'LR', label: 'Lexical Resource', categories: ['lexis', 'expression'] },
  { key: 'GR', label: 'Grammatical Range', categories: ['grammar'] },
] as const satisfies readonly {
  key: string;
  label: string;
  categories: readonly AnnotationCategory[];
}[];

type CriterionKey = (typeof CRITERIA)[number]['key'];

const CATEGORY_HIGHLIGHT: Record<AnnotationCategory, { fill: string; edge: string }> = {
  grammar: { fill: '#FEF4E6', edge: '#F59E0B' },
  lexis: { fill: '#E8F8EE', edge: '#16A34A' },
  cohesion: { fill: '#FAF4EA', edge: '#B07A3A' },
  expression: { fill: '#FCF9F3', edge: themedHex('#CCA35B') },
  task: { fill: '#F7F0E1', edge: themedHex('#B8955A') },
};

type Tab = 'essay' | 'review' | 'errors' | 'fixed' | 'model';

const TABS: readonly { key: Tab; label: string; labelEn: string }[] = [
  { key: 'essay', label: 'Bài viết của bạn', labelEn: 'Your essay' },
  { key: 'errors', label: 'Sửa lỗi chi tiết', labelEn: 'Detailed fixes' },
  { key: 'review', label: 'Nhận xét', labelEn: 'Feedback' },
  { key: 'fixed', label: 'Bản đã sửa', labelEn: 'Corrected version' },
  { key: 'model', label: 'Bài mẫu', labelEn: 'Model essay' },
];

export default function WritingResultScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();

  const submission = useWritingStore((s) => s.submissions.find((x) => x.id === submissionId));
  const saved = useWritingStore((s) => s.evaluations.find((e) => e.submissionId === submissionId));
  const saveEvaluation = useWritingStore((s) => s.saveEvaluation);

  const prompt = submission ? getWritingPromptById(submission.promptId) : undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('essay');
  const [focused, setFocused] = useState<number | null>(null);
  const { L, en } = useL();

  const analysis = useMemo(
    () =>
      submission && prompt
        ? analyseDraft(submission.bodyText, { task: prompt.task, minWords: prompt.minWords })
        : null,
    [submission, prompt],
  );

  /**
   * Gọi chấm AI đúng MỘT lần cho mỗi bài.
   *
   * Không đặt `loading` vào mảng phụ thuộc: nó vừa được set trong chính effect
   * này, nên effect sẽ chạy lại ngay khi loading đổi, cleanup của lần trước
   * huỷ mất request đang bay, và trang kẹt vĩnh viễn ở trạng thái đang chấm.
   * Lỗi thì cũng không gọi lại — gọi lại vô hạn một API tốn tiền là chuyện tệ
   * hơn nhiều so với việc người học phải bấm nút thử lại.
   */
  const requested = useRef(false);

  /*
    Token giữ trong ref, không đưa vào mảng phụ thuộc của effect.

    Supabase làm mới access token ngầm theo chu kỳ. Để nó vào deps thì mỗi lần
    làm mới là một lần chấm lại bài — và mỗi lần chấm là một lượt AI bị trừ.
  */
  const accessToken = useAuthStore((s) => s.session?.access_token ?? null);
  const tokenRef = useRef<string | null>(null);

  // Đồng bộ trong effect, không gán thẳng khi render. Effect này khai TRƯỚC
  // effect chấm bài nên nó luôn chạy trước, và ref đã có giá trị đúng lúc cần.
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (!submission || !prompt || saved || requested.current) return;
    requested.current = true;

    setLoading(true);
    setError(null);
    fetch('/api/writing/evaluate', {
      method: 'POST',
      // Route chấm bài trừ hạn mức AI ở máy chủ, nên nó cần biết đây là ai.
      // Không đăng nhập thì nhận 401 và màn hình rơi về bản phân tích offline —
      // vốn vẫn chạy đủ, chỉ thiếu phần nhận xét của AI.
      headers: {
        ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promptId: prompt.id, bodyText: submission.bodyText }),
    })
      .then(async (res) => {
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) throw new Error(String(data.error ?? (currentLocale() === 'en' ? 'Grading failed.' : 'Chấm bài thất bại.')));
        return data;
      })
      .then((data) => {
        saveEvaluation({
          ...(data as unknown as WritingEvaluation),
          submissionId: submission.id,
          evaluatedAt: new Date().toISOString(),
        });
        // Bài Writing đã được chấm → thép + 1 ca cho Thành Phố Tri Thức (mã = bài nộp, chấm lại không cộng lần hai).
        useCityStore.getState().earn({ type: 'writing_graded', id: submission.id });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : currentLocale() === 'en' ? 'Grading failed.' : 'Chấm bài thất bại.');
      })
      .finally(() => setLoading(false));
  }, [submission, prompt, saved, saveEvaluation]);

  if (!submission || !prompt) {
    return (
      <TaskShell backHref="/write" backLabel={L('Về kho đề', 'Back to prompts')} title={L('Không tìm thấy bài này', "Couldn't find this essay")} icon="pencil">
        <PaperCard className="max-w-[520px]">
          <View aria-hidden className="mb-3">
            <Motion kind="float">
              <Sticker tilt={-6}>
                <CuteNotebook size={64} />
              </Sticker>
            </Motion>
          </View>
          <Text className="font-sans text-body text-paper-body">
            {L('Bài làm này không còn trong máy. Quay lại kho đề để chọn đề khác.', "This essay is no longer on this device. Go back to the prompts and pick another.")}
          </Text>
          <Button
            className="mt-4"
            variant="brand"
            label={L('Về kho đề', 'Back to prompts')}
            onPress={() => router.replace('/write/tests')}
          />
        </PaperCard>
      </TaskShell>
    );
  }

  const annotations = saved?.annotations ?? [];
  const isTask1 = prompt.task === 'ielts_task1';

  return (
    <TaskShell
      backHref="/write"
      backLabel={L('Quay lại kho đề', 'Back to prompts')}
      title={L('Chấm bài', 'Grading')}
      subtitle={isTask1 ? 'Task 1 · Academic Writing' : 'Task 2 · Essay'}
      icon="clipboard"
      right={
        <View className="rounded-pill bg-white/20 px-3.5 py-1.5">
          <Text className="font-strong text-label text-white">
            {L(
              `${submission.wordCount} từ · ${Math.round(submission.durationSeconds / 60)} phút`,
              `${submission.wordCount} words · ${Math.round(submission.durationSeconds / 60)} min`,
            )}
          </Text>
        </View>
      }
    >
      <View className="gap-4 lg:flex-row">
        {/* ------------------------------------------------- cột trái: đề + band */}
        <View className="gap-4 lg:w-[34%]">
          <PaperCard>
            <View className="flex-row items-center justify-between gap-2">
              <View aria-hidden>
                <SealIcon name="clipboard" color="#A8843F" size={34} />
              </View>
              <Text className="min-w-0 flex-1 font-heavy text-cardTitle text-paper-ink">{L('Đề bài', 'Prompt')}</Text>
              <Text className="font-semi text-label text-paper-muted">
                {isTask1 ? 'Task 1 · Academic' : 'Task 2'}
              </Text>
            </View>
            <Text className="mt-3 font-mid text-body text-paper-ink" style={{ lineHeight: 22 }}>
              {prompt.promptText}
            </Text>
            {prompt.chartData ? (
              <View className="mt-3 items-center rounded-panel border border-brand-soft bg-white p-3">
                <ChartFigure data={prompt.chartData} width={340} />
              </View>
            ) : null}
          </PaperCard>

          <PaperCard>
            <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 10 }}>
              Overall band
            </Text>
            {saved ? (
              <>
                <View className="mt-1 flex-row items-end gap-1">
                  <Text className="font-heavy" style={{ fontSize: 52, lineHeight: 58, color: paper.brandMid }}>
                    {formatBand(saved.bandLow)}
                  </Text>
                  <Text className="font-heavy text-pageTitle text-paper-muted">
                    –{formatBand(saved.bandHigh)}
                  </Text>
                  <View aria-hidden className="ml-auto items-end gap-2 self-center">
                    <Motion kind="wobble">
                      <Sticker tilt={8}>
                        <CuteTrophy size={48} />
                      </Sticker>
                    </Motion>
                    <Label text={L('Đã chấm ✓', 'Graded ✓')} color="#22A06B" ink="#FFFFFF" tilt={-4} size={11} />
                  </View>
                </View>
                <Text className="font-sans text-label text-paper-muted">
                  {L('Chấm tự động, chỉ là khoảng ước tính.', 'Auto-graded estimate, shown as a range.')}
                </Text>

                <View className="mt-4 gap-2">
                  {CRITERIA.map((c) => (
                    <CriterionRow
                      key={c.key}
                      code={c.key}
                      label={c.label}
                      value={bandFor(c.key, saved)}
                      errorCount={
                        annotations.filter((a) =>
                          (c.categories as readonly AnnotationCategory[]).includes(a.category),
                        ).length
                      }
                    />
                  ))}
                </View>
              </>
            ) : loading ? (
              <View className="mt-3 flex-row items-center gap-3">
                <ActivityIndicator color={paper.brandMid} />
                <Text className="flex-1 font-sans text-body text-paper-body">
                  {L('Đang chấm bài — thường mất 30–60 giây.', 'Grading — usually takes 30–60 seconds.')}
                </Text>
              </View>
            ) : (
              <View className="mt-3 flex-row items-start gap-2">
                <Icon name="info" size={17} color={color.warning} />
                <Text className="flex-1 font-sans text-body text-paper-body">
                  {error ?? L('Chưa chấm được bằng AI.', "Couldn't grade with AI yet.")}{' '}
                  {L('Phần phân tích cấu trúc vẫn dùng bình thường.', 'The structure analysis still works as normal.')}
                </Text>
              </View>
            )}
          </PaperCard>

          {analysis ? (
            <PaperCard>
              <View className="flex-row items-center gap-2">
                <View aria-hidden>
                  <SealIcon name="search" color="#B07A3A" size={34} />
                </View>
                <Text className="min-w-0 flex-1 font-heavy text-cardTitle text-paper-ink">{L('Phân tích cấu trúc', 'Structure analysis')}</Text>
              </View>
              <Text className="mt-1 font-sans text-label text-paper-muted">{L('Không dùng AI.', 'No AI used.')}</Text>
              <View className="mt-3 gap-2">
                {analysis.hints.length > 0 ? (
                  analysis.hints.map((h) => (
                    <View
                      key={h.code}
                      className={[
                        'rounded-md border-l-4 p-2.5',
                        h.severity === 'warn'
                          ? 'border-danger bg-danger-soft'
                          : 'border-warning bg-warning-soft',
                      ].join(' ')}
                    >
                      <Text className="font-sans text-label text-body">{h.message}</Text>
                    </View>
                  ))
                ) : (
                  <View className="flex-row items-center gap-2">
                    <View aria-hidden>
                      <BadgeSticker icon="check" color="#22A06B" size={26} />
                    </View>
                    <Text className="min-w-0 flex-1 font-sans text-body text-success-ink">
                      {L('Cấu trúc bài không có vấn đề nào đáng kể.', 'No significant structural issues.')}
                    </Text>
                  </View>
                )}
              </View>
            </PaperCard>
          ) : null}
        </View>

        {/* --------------------------------------------------- cột phải: nhận xét */}
        <View className="lg:flex-1">
          <PaperCard padded={false}>
            <View className="px-5 pt-5">
              <View className="flex-row items-center gap-2.5">
                <View aria-hidden>
                  <SealIcon name="chat" color="#F0703F" size={38} />
                </View>
                <Text className="min-w-0 flex-1 font-heavy text-sectionTitle text-paper-ink">{L('Nhận xét chi tiết', 'Detailed feedback')}</Text>
              </View>
              <View className="mt-3 flex-row flex-wrap gap-1.5">
                {TABS.map((t) => (
                  <Pressable
                    key={t.key}
                    accessibilityRole="tab"
                    aria-selected={tab === t.key}
                    onPress={() => setTab(t.key)}
                    className="rounded-pill border px-3.5 py-2"
                    style={{
                      backgroundColor: tab === t.key ? paper.brandMid : '#FFFFFF',
                      borderColor: tab === t.key ? paper.brandMid : paper.brandSoft,
                    }}
                  >
                    <Text
                      className="font-strong text-label"
                      style={{ color: tab === t.key ? '#FFFFFF' : paper.body }}
                    >
                      {en ? t.labelEn : t.label}
                      {t.key === 'errors' && annotations.length > 0 ? ` · ${annotations.length}` : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="p-5">
              {/* Đổi tab Bài viết / Lỗi / Nhận xét / Bản sửa / Bài mẫu: mờ dần sang. */}
              <CrossFade swapKey={tab}>
              {tab === 'essay' ? (
                <EssayTab
                  text={submission.bodyText}
                  annotations={annotations}
                  focused={focused}
                  onFocus={setFocused}
                  submissionId={submission.id}
                />
              ) : null}

              {tab === 'errors' ? (
                <ErrorsTab
                  annotations={annotations}
                  focused={focused}
                  onFocus={setFocused}
                  submissionId={saved?.submissionId ?? submission.id}
                />
              ) : null}

              {tab === 'review' ? <ReviewTab evaluation={saved ?? null} /> : null}

              {tab === 'fixed' ? (
                <FixedTab text={submission.bodyText} annotations={annotations} />
              ) : null}

              {tab === 'model' ? <ModelEssayPanel promptId={prompt.id} /> : null}
              </CrossFade>
            </View>
          </PaperCard>

          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button
              variant="onDarkSolid"
              label={L('Viết lại bài này', 'Rewrite this essay')}
              iconLeft="refresh"
              onPress={() => router.push(`/write/${prompt.id}` as never)}
            />
            <Button variant="onDark" label={L('Về kho đề', 'Back to prompts')} onPress={() => router.push('/write/tests')} />
          </View>
        </View>
      </View>
    </TaskShell>
  );
}

function bandFor(key: CriterionKey, e: WritingEvaluation): number {
  if (key === 'TA') return e.taskBand;
  if (key === 'CC') return e.coherenceBand;
  if (key === 'LR') return e.lexicalBand;
  return e.grammarBand;
}

function CriterionRow({
  code,
  label,
  value,
  errorCount,
}: {
  code: string;
  label: string;
  value: number;
  errorCount: number;
}) {
  const { L } = useL();
  return (
    <View className="flex-row items-center gap-3 rounded-panel bg-brand-tint px-3 py-2.5">
      <View
        className="h-8 w-9 items-center justify-center rounded-md"
        style={{ backgroundColor: paper.brandMid }}
      >
        <Text className="font-heavy text-label text-white">{code}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-semi text-label text-paper-ink">{label}</Text>
        <Text className="font-sans text-paper-muted" style={{ fontSize: 10 }}>
          {errorCount > 0 ? L(`${errorCount} chỗ được đánh dấu`, `${errorCount} marked`) : L('Không có lỗi được đánh dấu', 'No mistakes marked')}
        </Text>
      </View>
      <Text className="font-heavy text-sectionTitle text-paper-ink">{formatBand(value)}</Text>
    </View>
  );
}

// ------------------------------------------------------------ tab: bài viết

/**
 * Bài viết với các đoạn lỗi được tô nền và BẤM ĐƯỢC.
 *
 * Cắt theo offset đã neo ở server. Annotation đã được xếp theo vị trí và không
 * chồng lấn nhau (xem `services/writing/annotate`), nên chỉ cần duyệt một lượt.
 *
 * Bấm vào một đoạn tô màu thì thẻ giải thích của đúng đoạn ấy mở ra ngay dưới —
 * bản trước chỉ tô màu rồi liệt kê rời phía dưới, nên người đọc phải tự dò xem
 * ô nào ứng với chỗ nào trong bài.
 */
function EssayTab({
  text,
  annotations,
  focused,
  onFocus,
  submissionId,
}: {
  text: string;
  annotations: WritingAnnotation[];
  focused: number | null;
  onFocus: (index: number | null) => void;
  submissionId: string;
}) {
  const { L } = useL();
  if (annotations.length === 0) {
    return (
      <View>
        <Text className="font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 26 }}>
          {text}
        </Text>
        <Text className="mt-4 font-sans text-label text-paper-muted">
          {L('Chưa có chỗ nào được đánh dấu.', 'Nothing has been marked yet.')}
        </Text>
      </View>
    );
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  annotations.forEach((a, i) => {
    if (a.start > cursor) parts.push(<Text key={`p${i}`}>{text.slice(cursor, a.start)}</Text>);
    const tone = CATEGORY_HIGHLIGHT[a.category];
    parts.push(
      <Text
        key={`a${i}`}
        onPress={() => onFocus(focused === i ? null : i)}
        style={{
          backgroundColor: tone.fill,
          textDecorationLine: 'underline',
          textDecorationColor: tone.edge,
          fontWeight: focused === i ? '700' : '400',
        }}
      >
        {text.slice(a.start, a.end)}
      </Text>,
    );
    cursor = a.end;
  });
  if (cursor < text.length) parts.push(<Text key="tail">{text.slice(cursor)}</Text>);

  const active = focused !== null ? annotations[focused] : undefined;

  return (
    <View>
      <Text className="font-sans text-label text-paper-muted">
        {L('Bấm vào chỗ được tô màu để xem vì sao sai và cách sửa.', "Tap a highlighted part to see why it's wrong and how to fix it.")}
      </Text>
      <Text className="mt-3 font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
        {parts}
      </Text>

      {active ? (
        <View className="mt-4">
          <AnnotationCard index={focused! + 1} annotation={active} submissionId={submissionId} />
        </View>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------- tab: sửa lỗi

function ErrorsTab({
  annotations,
  focused,
  onFocus,
  submissionId,
}: {
  annotations: WritingAnnotation[];
  focused: number | null;
  onFocus: (index: number | null) => void;
  submissionId: string;
}) {
  const [filter, setFilter] = useState<CriterionKey | 'all'>('all');
  const { L } = useL();

  const counts = useMemo(() => {
    const map = new Map<CriterionKey, number>();
    for (const c of CRITERIA) {
      map.set(
        c.key,
        annotations.filter((a) => (c.categories as readonly AnnotationCategory[]).includes(a.category))
          .length,
      );
    }
    return map;
  }, [annotations]);

  if (annotations.length === 0) {
    return (
      <Text className="font-sans text-body text-paper-body">
        {L('Chưa có lỗi nào được đánh dấu.', 'No mistakes marked yet.')}
      </Text>
    );
  }

  const shown = annotations
    .map((a, index) => ({ a, index }))
    .filter(({ a }) => {
      if (filter === 'all') return true;
      const criterion = CRITERIA.find((c) => c.key === filter);
      return criterion
        ? (criterion.categories as readonly AnnotationCategory[]).includes(a.category)
        : true;
    });

  return (
    <View>
      <View className="flex-row flex-wrap gap-1.5 rounded-panel bg-brand-tint p-2">
        <FilterChip
          label={L(`Tất cả · ${annotations.length}`, `All · ${annotations.length}`)}
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        {CRITERIA.map((c) => (
          <FilterChip
            key={c.key}
            label={`${c.key} · ${counts.get(c.key) ?? 0}`}
            active={filter === c.key}
            onPress={() => setFilter(c.key)}
          />
        ))}
      </View>

      <View className="mt-3 gap-2.5">
        {shown.length === 0 ? (
          <Text className="font-sans text-body text-paper-muted">
            {L('Không có lỗi nào thuộc tiêu chí này.', 'No mistakes for this criterion.')}
          </Text>
        ) : (
          shown.map(({ a, index }) => (
            <Pressable key={index} onPress={() => onFocus(focused === index ? null : index)}>
              <AnnotationCard index={index + 1} annotation={a} submissionId={submissionId} />
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={active}
      onPress={onPress}
      className="rounded-pill px-3 py-1.5"
      style={{ backgroundColor: active ? '#FFFFFF' : 'transparent' }}
    >
      <Text
        className={active ? 'font-strong text-label' : 'font-mid text-label'}
        style={{ color: active ? paper.ink : paper.muted }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AnnotationCard({
  index,
  annotation,
  submissionId,
}: {
  index: number;
  annotation: WritingAnnotation;
  /** Có id bài thì hiện được phép thử chuyển giao cho lỗi này. */
  submissionId?: string;
}) {
  const tone = CATEGORY_HIGHLIGHT[annotation.category];
  const { en } = useL();

  return (
    <View
      className="rounded-panel border-l-4 bg-white p-3.5"
      style={{ borderLeftColor: tone.edge }}
    >
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="font-strong text-label text-paper-muted">#{index}</Text>
        <Badge
          tone={annotation.severity === 'major' ? 'danger' : 'warning'}
          label={en ? CATEGORY_LABEL_EN[annotation.category] : CATEGORY_LABEL[annotation.category]}
        />
      </View>

      <View className="mt-2 flex-row flex-wrap items-center gap-2">
        <Text
          className="font-mid text-body text-danger"
          style={{ textDecorationLine: 'line-through' }}
        >
          {annotation.quote}
        </Text>
        {annotation.fix ? (
          <>
            <Icon name="arrow-right" size={15} color={paper.muted} strokeWidth={2} />
            <Text className="font-strong text-body text-success-ink">{annotation.fix}</Text>
          </>
        ) : null}
      </View>

      {annotation.whyVi ? (
        <Text className="mt-1.5 font-sans text-label text-paper-body">{annotation.whyVi}</Text>
      ) : null}

      {/*
        Lối vào phép thử chuyển giao, đặt ngay dưới lời giải thích.

        Đọc xong lời giải thích rồi gật đầu không phải là biết sửa — chỗ đúng để
        hỏi "sửa được ở câu khác chưa?" là ngay tại đây, lúc lỗi còn trong đầu.
      */}
      {submissionId ? <TransferCheck annotation={annotation} submissionId={submissionId} /> : null}
    </View>
  );
}

// ------------------------------------------------------------- tab: nhận xét

/** Bốn tiêu chí, theo đúng khoá mà phần chấm chi tiết trả về. */
const DETAIL_CRITERIA = [
  { key: 'task', label: 'Task Achievement', short: 'Bám đề', shortEn: 'Answering the task' },
  { key: 'coherence', label: 'Coherence & Cohesion', short: 'Bố cục & liên kết', shortEn: 'Organisation & linking' },
  { key: 'lexical', label: 'Lexical Resource', short: 'Từ vựng', shortEn: 'Vocabulary' },
  { key: 'grammar', label: 'Grammatical Range', short: 'Ngữ pháp', shortEn: 'Grammar' },
] as const;

/**
 * Một tiêu chí, mổ xẻ đủ bốn tầng.
 *
 * Vì sao không gộp thành một đoạn văn: bốn tầng này trả lời bốn câu hỏi khác nhau
 * và người học dùng chúng ở hai thời điểm khác nhau — "vì sao" và "dẫn chứng" đọc
 * ngay lúc nhận điểm, còn "thiếu gì" và "làm gì tiếp" là thứ họ mở lại trước khi
 * viết bài sau. Gộp một đoạn thì lần mở lại nào cũng phải đọc lại từ đầu.
 */
function CriterionDetailCard({
  label,
  short,
  detail,
}: {
  label: string;
  short: string;
  detail: import('@/lib/writing/types').CriterionDetail;
}) {
  const tone =
    detail.band >= 7 ? color.success : detail.band >= 6 ? color.warning : color.danger;
  const { L } = useL();

  return (
    <View className="mt-3 overflow-hidden rounded-panel border border-paper-line bg-white">
      <View className="flex-row items-center justify-between border-b border-paper-line px-3.5 py-2.5">
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-body text-paper-ink">{label}</Text>
          <Text className="mt-0.5 font-sans text-label text-paper-muted">{short}</Text>
        </View>
        <View className="rounded-pill px-3 py-1" style={{ backgroundColor: tone }}>
          <Text className="font-heavy text-body text-white">{formatBand(detail.band)}</Text>
        </View>
      </View>

      <View className="gap-2.5 p-3.5">
        {detail.evidenceVi ? (
          <DetailRow icon="info" title={L('Vì sao ở mức này', 'Why this band')} body={detail.evidenceVi} />
        ) : null}

        {detail.quotes.length > 0 ? (
          <View className="rounded-panel bg-paper-canvas p-2.5">
            <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
              {L('Dẫn chứng từ bài của bạn', 'Evidence from your essay')}
            </Text>
            {detail.quotes.map((q) => (
              <Text key={q} className="mt-1 font-mid text-label text-paper-ink" style={{ lineHeight: 19 }}>
                “{q}”
              </Text>
            ))}
          </View>
        ) : null}

        {detail.gapVi ? <DetailRow icon="arrow-right" title={L('Thiếu gì để lên nửa bậc', "What's missing for the next half band")} body={detail.gapVi} /> : null}
        {detail.nextStepVi ? <DetailRow icon="check" title={L('Làm ngay ở bài sau', 'Do this in your next essay')} body={detail.nextStepVi} /> : null}
      </View>
    </View>
  );
}

function DetailRow({
  icon,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  body: string;
}) {
  return (
    <View className="flex-row gap-2.5">
      <View className="pt-0.5">
        <Icon name={icon} size={14} color={paper.muted} strokeWidth={2} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-semi text-label text-paper-muted">{title}</Text>
        <Text className="mt-0.5 font-sans text-body text-paper-body" style={{ lineHeight: 22 }}>
          {body}
        </Text>
      </View>
    </View>
  );
}

function ReviewTab({ evaluation }: { evaluation: WritingEvaluation | null }) {
  const { L, en } = useL();
  if (!evaluation) {
    return (
      <Text className="font-sans text-body text-paper-body">
        {L('Chưa chấm bằng AI nên chưa có nhận xét.', 'Not AI-graded yet, so no feedback.')}
      </Text>
    );
  }

  const detail = evaluation.criteria;
  const thieuTu =
    evaluation.wordCount !== undefined &&
    evaluation.minWords !== undefined &&
    evaluation.wordCount < evaluation.minWords;

  return (
    <View>
      {/*
        "Nếu chỉ sửa được một thứ" đặt TRÊN CÙNG và trước cả nhận xét chung.
        Một phiếu chấm chi tiết có cái giá của nó: đọc xong mười mục thì không
        biết bắt đầu từ đâu. Dòng này là câu trả lời cho đúng câu hỏi đó.
      */}
      {evaluation.priorityVi ? (
        <View className="mb-4 flex-row gap-2.5 rounded-panel border-l-4 border-primary-600 bg-primary-50 p-3.5">
          <Icon name="target" size={16} color={color.primary} strokeWidth={2.2} />
          <View className="min-w-0 flex-1">
            <Text className="font-semi uppercase tracking-wide text-primary-800" style={{ fontSize: 9 }}>
              {L('Nếu chỉ sửa được một thứ', 'If you fix just one thing')}
            </Text>
            <Text className="mt-1 font-mid text-bodyLg text-primary-900" style={{ lineHeight: 24 }}>
              {evaluation.priorityVi}
            </Text>
          </View>
        </View>
      ) : null}

      {evaluation.wordCount !== undefined ? (
        <View className="mb-3 flex-row flex-wrap items-center gap-2">
          <Badge
            label={L(`${evaluation.wordCount} từ`, `${evaluation.wordCount} words`)}
            tone={thieuTu ? 'danger' : 'success'}
          />
          {evaluation.minWords !== undefined ? (
            <Text className="font-sans text-label text-paper-muted">
              {thieuTu
                ? L(
                    `Thiếu ${evaluation.minWords - evaluation.wordCount} từ so với mức tối thiểu ${evaluation.minWords} — riêng việc này đã bị trừ Task Response.`,
                    `${evaluation.minWords - evaluation.wordCount} words short of the ${evaluation.minWords} minimum — that alone costs Task Response.`,
                  )
                : L(`Đạt mức tối thiểu ${evaluation.minWords} từ.`, `Meets the ${evaluation.minWords}-word minimum.`)}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text className="font-mid text-bodyLg text-paper-ink" style={{ lineHeight: 26 }}>
        {evaluation.summaryVi}
      </Text>

      {detail ? (
        <View className="mt-5">
          <Text className="font-strong text-cardTitle text-paper-ink">{L('Chấm theo từng tiêu chí', 'Grading by criterion')}</Text>
          {DETAIL_CRITERIA.map((c) => (
            <CriterionDetailCard key={c.key} label={c.label} short={en ? c.shortEn : c.short} detail={detail[c.key]} />
          ))}
        </View>
      ) : null}

      {evaluation.verification ? (
        <VerificationReceiptPanel receipt={evaluation.verification} />
      ) : null}

      {evaluation.nextBandVi ? (
        <View className="mt-4 rounded-panel border border-primary-200 bg-primary-50 p-3.5">
          <View className="flex-row items-center gap-2">
            <View aria-hidden>
              <BadgeSticker icon="target" color="#F2B632" size={26} />
            </View>
            <Text className="min-w-0 flex-1 font-strong text-body text-primary-900">{L('Để lên band kế tiếp', 'To reach the next band')}</Text>
          </View>
          <Text className="mt-1 font-sans text-body text-primary-800" style={{ lineHeight: 22 }}>
            {evaluation.nextBandVi}
          </Text>
        </View>
      ) : null}

      {evaluation.strengths.length > 0 ? (
        <View className="mt-4 rounded-panel border border-success bg-success-soft p-3.5">
          <Text className="font-strong text-body text-success-ink">{L('Làm tốt', 'What went well')}</Text>
          {evaluation.strengths.map((s) => (
            <Text key={s} className="mt-1.5 font-sans text-body text-paper-body">
              • {s}
            </Text>
          ))}
        </View>
      ) : null}

      {evaluation.improvements.length > 0 ? (
        <View className="mt-3 rounded-panel border border-warning bg-warning-soft p-3.5">
          <Text className="font-strong text-body text-warning-ink">{L('Cần sửa', 'To improve')}</Text>
          {evaluation.improvements.map((s) => (
            <Text key={s} className="mt-1.5 font-sans text-body text-paper-body">
              • {s}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------- tab: bản đã sửa

function FixedTab({ text, annotations }: { text: string; annotations: WritingAnnotation[] }) {
  const fixed = useMemo(() => applyFixes(text, annotations), [text, annotations]);
  const count = useMemo(() => countApplicableFixes(text, annotations), [text, annotations]);
  const { L } = useL();

  if (count === 0) {
    return (
      <Text className="font-sans text-body text-paper-body">
        {L('Chưa có chỗ nào để sửa.', 'Nothing to fix yet.')}
      </Text>
    );
  }

  return (
    <View>
      <View className="flex-row items-start gap-2 rounded-panel bg-brand-tint p-3">
        <Icon name="info" size={16} color={paper.brandMid} strokeWidth={2} />
        <Text className="flex-1 font-sans text-label text-paper-body">
          {L('Đây là', 'This is')} <Text className="font-strong">{L('chính bài của bạn', 'your own essay')}</Text>{' '}
          {L(
            `với ${count} chỗ đã được thay bằng bản sửa — không phải một bài viết lại. Đọc để thấy câu mình thay đổi thế nào sau khi vá đúng chỗ sai.`,
            `with ${count} spots replaced by their fixes — not a rewrite. Read it to see how your sentences change once the mistakes are patched.`,
          )}
        </Text>
      </View>

      <Text className="mt-3 font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
        {fixed}
      </Text>
    </View>
  );
}

// --------------------------------------------------------------- bài mẫu AI

/**
 * Bài mẫu do AI soạn, sinh theo yêu cầu.
 *
 * Chỉ sinh khi người học bấm xem: mỗi bài tốn ba lượt gọi model, sinh sẵn cho
 * cả kho là tốn tiền cho phần lớn bài chẳng ai mở ra. Sinh xong thì lưu lại nên
 * lần sau mở là có ngay.
 */
function ModelEssayPanel({ promptId }: { promptId: string }) {
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  // Bài mẫu ở đúng mức người học nhắm tới (Lộ trình → hồ sơ), không cố định band 7.
  const goalBand = useRoadmapStore((s) => s.input?.ielts?.target ?? null);
  const profileBand = useAuthStore((s) => s.profile?.targetBand ?? null);
  const TARGET = modelEssayBand(goalBand ?? profileBand);
  const essay = useWritingStore((s) => s.modelEssays[`${promptId}:${TARGET}`]);
  const saveModelEssay = useWritingStore((s) => s.saveModelEssay);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { L } = useL();

  const load = () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    fetch('/api/writing/model-essay', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promptId, targetBand: TARGET }),
    })
      .then(async (res) => {
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) throw new Error(String(data.error ?? (currentLocale() === 'en' ? "Couldn't write the model essay." : 'Soạn bài mẫu thất bại.')));
        return data;
      })
      .then((data) => saveModelEssay(data as never))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : currentLocale() === 'en' ? "Couldn't write the model essay." : 'Soạn bài mẫu thất bại.'))
      .finally(() => setLoading(false));
  };

  if (!essay) {
    return (
      <View>
        <Text className="font-sans text-body text-paper-body">
          {L(
            `Bài do AI soạn ở mức band ${TARGET}, sau đó được chấm ngược bằng chính đường chấm bạn vừa dùng. Mất khoảng 30–60 giây.`,
            `An essay written by AI at band ${TARGET}, then graded back with the same grader you just used. Takes about 30–60 seconds.`,
          )}
        </Text>
        {error ? <Text className="mt-2 font-sans text-label text-danger">{error}</Text> : null}
        <View className="mt-3 flex-row items-center gap-2">
          {loading ? <ActivityIndicator color={paper.brandMid} /> : null}
          <Button
            variant="brand"
            label={loading ? L('Đang soạn…', 'Writing…') : L(`Xem bài mẫu band ${TARGET}`, `See band ${TARGET} model essay`)}
            disabled={loading}
            onPress={load}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge tone="neutral" label={L(`Nhắm band ${essay.targetBand}`, `Targets band ${essay.targetBand}`)} />
        {essay.verifiedLow != null && essay.verifiedHigh != null ? (
          <Badge
            tone={
              Math.abs((essay.verifiedLow + essay.verifiedHigh) / 2 - essay.targetBand) <= 0.5
                ? 'success'
                : 'warning'
            }
            label={L(`Chấm lại: ${formatBand(essay.verifiedLow)}–${formatBand(essay.verifiedHigh)}`, `Re-graded: ${formatBand(essay.verifiedLow)}–${formatBand(essay.verifiedHigh)}`)}
          />
        ) : (
          <Badge tone="warning" label={L('Chưa kiểm định được', "Couldn't verify")} />
        )}
        <Text className="font-sans text-label text-paper-muted">{L(`${essay.wordCount} từ`, `${essay.wordCount} words`)}</Text>
      </View>

      <Text className="mt-3 font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
        {essay.bodyText}
      </Text>

      <Text className="mt-3 font-sans text-label text-paper-muted">
        {L('Bài tham khảo do AI viết. Học cách triển khai ý, đừng học thuộc.', 'AI-written sample. Learn the structure, don\'t memorise it.')}
      </Text>
    </View>
  );
}
