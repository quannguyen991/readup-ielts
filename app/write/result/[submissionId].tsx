import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { VerificationReceiptPanel } from '@/components/ai/VerificationReceiptPanel';
import { TaskShell } from '@/components/layout/TaskShell';
import { Badge, Button, Icon, PaperCard } from '@/components/ui';
import { ChartFigure } from '@/components/writing/ChartFigure';
import { getWritingPromptById } from '@/data/writing-repository';
import { formatBand } from '@/lib/band';
import { analyseDraft } from '@/services/writing/analyzer';
import { applyFixes, countApplicableFixes } from '@/services/writing/apply-fixes';
import { useAuthStore } from '@/store/useAuthStore';
import { useWritingStore } from '@/store/useWritingStore';
import { color, paper } from '@/theme/tokens';
import type { AnnotationCategory, WritingAnnotation, WritingEvaluation } from '@/lib/writing/types';

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
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  categories: readonly AnnotationCategory[];
}>;

type CriterionKey = (typeof CRITERIA)[number]['key'];

const CATEGORY_HIGHLIGHT: Record<AnnotationCategory, { fill: string; edge: string }> = {
  grammar: { fill: '#FEF4E6', edge: '#F59E0B' },
  lexis: { fill: '#E8F8EE', edge: '#16A34A' },
  cohesion: { fill: '#E6F6FE', edge: '#0EA5E9' },
  expression: { fill: '#F5F1FE', edge: '#7C3AED' },
  task: { fill: '#EFF5FF', edge: '#2563EB' },
};

type Tab = 'essay' | 'review' | 'errors' | 'fixed' | 'model';

const TABS: ReadonlyArray<{ key: Tab; label: string }> = [
  { key: 'essay', label: 'Bài viết của bạn' },
  { key: 'errors', label: 'Sửa lỗi chi tiết' },
  { key: 'review', label: 'Nhận xét' },
  { key: 'fixed', label: 'Bản đã sửa' },
  { key: 'model', label: 'Bài mẫu' },
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
        if (!res.ok) throw new Error(String(data.error ?? 'Chấm bài thất bại.'));
        return data;
      })
      .then((data) => {
        saveEvaluation({
          ...(data as unknown as WritingEvaluation),
          submissionId: submission.id,
          evaluatedAt: new Date().toISOString(),
        });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Chấm bài thất bại.');
      })
      .finally(() => setLoading(false));
  }, [submission, prompt, saved, saveEvaluation]);

  if (!submission || !prompt) {
    return (
      <TaskShell backHref="/write" backLabel="Về kho đề" title="Không tìm thấy bài này" icon="pencil">
        <PaperCard className="max-w-[520px]">
          <Text className="font-sans text-body text-paper-body">
            Bài làm này không còn trong máy. Quay lại kho đề để chọn đề khác.
          </Text>
          <Button
            className="mt-4"
            variant="brand"
            label="Về kho đề"
            onPress={() => router.replace('/write')}
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
      backLabel="Quay lại kho đề"
      title="Chấm bài"
      subtitle={isTask1 ? 'Task 1 · Academic Writing' : 'Task 2 · Essay'}
      icon="clipboard"
      right={
        <View className="rounded-pill bg-white/20 px-3.5 py-1.5">
          <Text className="font-strong text-label text-white">
            {submission.wordCount} từ · {Math.round(submission.durationSeconds / 60)} phút
          </Text>
        </View>
      }
    >
      <View className="gap-4 lg:flex-row">
        {/* ------------------------------------------------- cột trái: đề + band */}
        <View className="gap-4 lg:w-[34%]">
          <PaperCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-heavy text-cardTitle text-paper-ink">Đề bài</Text>
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
                </View>
                <Text className="font-sans text-label text-paper-muted">
                  Chấm tự động, có thể lệch so với giám khảo thật. Luôn là một khoảng, không phải
                  một con số chốt.
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
                  Đang chấm bài — thường mất 30–60 giây.
                </Text>
              </View>
            ) : (
              <View className="mt-3 flex-row items-start gap-2">
                <Icon name="info" size={17} color={color.warning} />
                <Text className="flex-1 font-sans text-body text-paper-body">
                  {error ?? 'Chưa chấm được bằng AI.'} Phần phân tích cấu trúc vẫn dùng bình thường.
                </Text>
              </View>
            )}
          </PaperCard>

          {analysis ? (
            <PaperCard>
              <Text className="font-heavy text-cardTitle text-paper-ink">Phân tích cấu trúc</Text>
              <Text className="mt-1 font-sans text-label text-paper-muted">Không dùng AI.</Text>
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
                  <Text className="font-sans text-body text-success-ink">
                    Cấu trúc bài không có vấn đề nào đáng kể.
                  </Text>
                )}
              </View>
            </PaperCard>
          ) : null}
        </View>

        {/* --------------------------------------------------- cột phải: nhận xét */}
        <View className="lg:flex-1">
          <PaperCard padded={false}>
            <View className="px-5 pt-5">
              <Text className="font-heavy text-sectionTitle text-paper-ink">Nhận xét chi tiết</Text>
              <View className="mt-3 flex-row flex-wrap gap-1.5">
                {TABS.map((t) => (
                  <Pressable
                    key={t.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: tab === t.key }}
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
                      {t.label}
                      {t.key === 'errors' && annotations.length > 0 ? ` · ${annotations.length}` : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="p-5">
              {tab === 'essay' ? (
                <EssayTab
                  text={submission.bodyText}
                  annotations={annotations}
                  focused={focused}
                  onFocus={setFocused}
                />
              ) : null}

              {tab === 'errors' ? (
                <ErrorsTab annotations={annotations} focused={focused} onFocus={setFocused} />
              ) : null}

              {tab === 'review' ? <ReviewTab evaluation={saved ?? null} /> : null}

              {tab === 'fixed' ? (
                <FixedTab text={submission.bodyText} annotations={annotations} />
              ) : null}

              {tab === 'model' ? <ModelEssayPanel promptId={prompt.id} /> : null}
            </View>
          </PaperCard>

          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button
              variant="onDarkSolid"
              label="Viết lại bài này"
              iconLeft="refresh"
              onPress={() => router.push(`/write/${prompt.id}` as never)}
            />
            <Button variant="onDark" label="Về kho đề" onPress={() => router.push('/write')} />
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
          {errorCount > 0 ? `${errorCount} chỗ được đánh dấu` : 'Không có lỗi được đánh dấu'}
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
}: {
  text: string;
  annotations: WritingAnnotation[];
  focused: number | null;
  onFocus: (index: number | null) => void;
}) {
  if (annotations.length === 0) {
    return (
      <View>
        <Text className="font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 26 }}>
          {text}
        </Text>
        <Text className="mt-4 font-sans text-label text-paper-muted">
          Chưa có chỗ nào được đánh dấu.
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
        Bấm vào chỗ được tô màu để xem vì sao sai và cách sửa.
      </Text>
      <Text className="mt-3 font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
        {parts}
      </Text>

      {active ? (
        <View className="mt-4">
          <AnnotationCard index={focused! + 1} annotation={active} />
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
}: {
  annotations: WritingAnnotation[];
  focused: number | null;
  onFocus: (index: number | null) => void;
}) {
  const [filter, setFilter] = useState<CriterionKey | 'all'>('all');

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
        Chưa có lỗi nào được đánh dấu — hoặc bài chưa được chấm bằng AI, hoặc không có chỗ nào đáng
        đánh dấu.
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
          label={`Tất cả · ${annotations.length}`}
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
            Không có lỗi nào thuộc tiêu chí này.
          </Text>
        ) : (
          shown.map(({ a, index }) => (
            <Pressable key={index} onPress={() => onFocus(focused === index ? null : index)}>
              <AnnotationCard index={index + 1} annotation={a} />
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
      accessibilityState={{ selected: active }}
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

function AnnotationCard({ index, annotation }: { index: number; annotation: WritingAnnotation }) {
  const tone = CATEGORY_HIGHLIGHT[annotation.category];

  return (
    <View
      className="rounded-panel border-l-4 bg-white p-3.5"
      style={{ borderLeftColor: tone.edge }}
    >
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="font-strong text-label text-paper-muted">#{index}</Text>
        <Badge
          tone={annotation.severity === 'major' ? 'danger' : 'warning'}
          label={CATEGORY_LABEL[annotation.category]}
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
    </View>
  );
}

// ------------------------------------------------------------- tab: nhận xét

/** Bốn tiêu chí, theo đúng khoá mà phần chấm chi tiết trả về. */
const DETAIL_CRITERIA = [
  { key: 'task', label: 'Task Achievement', short: 'Bám đề' },
  { key: 'coherence', label: 'Coherence & Cohesion', short: 'Bố cục & liên kết' },
  { key: 'lexical', label: 'Lexical Resource', short: 'Từ vựng' },
  { key: 'grammar', label: 'Grammatical Range', short: 'Ngữ pháp' },
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
          <DetailRow icon="info" title="Vì sao ở mức này" body={detail.evidenceVi} />
        ) : null}

        {detail.quotes.length > 0 ? (
          <View className="rounded-panel bg-paper-canvas p-2.5">
            <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
              Dẫn chứng từ bài của bạn
            </Text>
            {detail.quotes.map((q) => (
              <Text key={q} className="mt-1 font-mid text-label text-paper-ink" style={{ lineHeight: 19 }}>
                “{q}”
              </Text>
            ))}
          </View>
        ) : null}

        {detail.gapVi ? <DetailRow icon="arrow-right" title="Thiếu gì để lên nửa bậc" body={detail.gapVi} /> : null}
        {detail.nextStepVi ? <DetailRow icon="check" title="Làm ngay ở bài sau" body={detail.nextStepVi} /> : null}
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
  if (!evaluation) {
    return (
      <Text className="font-sans text-body text-paper-body">
        Bài chưa được chấm bằng AI nên chưa có nhận xét. Phần phân tích cấu trúc ở cột trái vẫn dùng
        được.
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
              Nếu chỉ sửa được một thứ
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
            label={`${evaluation.wordCount} từ`}
            tone={thieuTu ? 'danger' : 'success'}
          />
          {evaluation.minWords !== undefined ? (
            <Text className="font-sans text-label text-paper-muted">
              {thieuTu
                ? `Thiếu ${evaluation.minWords - evaluation.wordCount} từ so với mức tối thiểu ${evaluation.minWords} — riêng việc này đã bị trừ Task Response.`
                : `Đạt mức tối thiểu ${evaluation.minWords} từ.`}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text className="font-mid text-bodyLg text-paper-ink" style={{ lineHeight: 26 }}>
        {evaluation.summaryVi}
      </Text>

      {detail ? (
        <View className="mt-5">
          <Text className="font-strong text-cardTitle text-paper-ink">Chấm theo từng tiêu chí</Text>
          {DETAIL_CRITERIA.map((c) => (
            <CriterionDetailCard key={c.key} label={c.label} short={c.short} detail={detail[c.key]} />
          ))}
        </View>
      ) : null}

      {evaluation.verification ? (
        <VerificationReceiptPanel receipt={evaluation.verification} />
      ) : null}

      {evaluation.nextBandVi ? (
        <View className="mt-4 rounded-panel border border-primary-200 bg-primary-50 p-3.5">
          <Text className="font-strong text-body text-primary-900">Để lên band kế tiếp</Text>
          <Text className="mt-1 font-sans text-body text-primary-800" style={{ lineHeight: 22 }}>
            {evaluation.nextBandVi}
          </Text>
        </View>
      ) : null}

      {evaluation.strengths.length > 0 ? (
        <View className="mt-4 rounded-panel border border-success bg-success-soft p-3.5">
          <Text className="font-strong text-body text-success-ink">Làm tốt</Text>
          {evaluation.strengths.map((s) => (
            <Text key={s} className="mt-1.5 font-sans text-body text-paper-body">
              • {s}
            </Text>
          ))}
        </View>
      ) : null}

      {evaluation.improvements.length > 0 ? (
        <View className="mt-3 rounded-panel border border-warning bg-warning-soft p-3.5">
          <Text className="font-strong text-body text-warning-ink">Cần sửa</Text>
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

  if (count === 0) {
    return (
      <Text className="font-sans text-body text-paper-body">
        Chưa có chỗ nào vá được — bài chưa chấm bằng AI, hoặc các lỗi được đánh dấu không kèm bản
        sửa cụ thể.
      </Text>
    );
  }

  return (
    <View>
      <View className="flex-row items-start gap-2 rounded-panel bg-brand-tint p-3">
        <Icon name="info" size={16} color={paper.brandMid} strokeWidth={2} />
        <Text className="flex-1 font-sans text-label text-paper-body">
          Đây là <Text className="font-strong">chính bài của bạn</Text> với {count} chỗ đã được thay
          bằng bản sửa — không phải một bài viết lại. Đọc để thấy câu mình thay đổi thế nào sau khi
          vá đúng chỗ sai.
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
  const TARGET = 7;
  const essay = useWritingStore((s) => s.modelEssays[`${promptId}:${TARGET}`]);
  const saveModelEssay = useWritingStore((s) => s.saveModelEssay);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (!res.ok) throw new Error(String(data.error ?? 'Soạn bài mẫu thất bại.'));
        return data;
      })
      .then((data) => saveModelEssay(data as never))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Soạn bài mẫu thất bại.'))
      .finally(() => setLoading(false));
  };

  if (!essay) {
    return (
      <View>
        <Text className="font-sans text-body text-paper-body">
          Bài do AI soạn ở mức band {TARGET}, sau đó được chấm ngược bằng chính đường chấm bạn vừa
          dùng. Mất khoảng 30–60 giây.
        </Text>
        {error ? <Text className="mt-2 font-sans text-label text-danger">{error}</Text> : null}
        <View className="mt-3 flex-row items-center gap-2">
          {loading ? <ActivityIndicator color={paper.brandMid} /> : null}
          <Button
            variant="brand"
            label={loading ? 'Đang soạn…' : `Xem bài mẫu band ${TARGET}`}
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
        <Badge tone="neutral" label={`Nhắm band ${essay.targetBand}`} />
        {essay.verifiedLow != null && essay.verifiedHigh != null ? (
          <Badge
            tone={
              Math.abs((essay.verifiedLow + essay.verifiedHigh) / 2 - essay.targetBand) <= 0.5
                ? 'success'
                : 'warning'
            }
            label={`Chấm lại: ${formatBand(essay.verifiedLow)}–${formatBand(essay.verifiedHigh)}`}
          />
        ) : (
          <Badge tone="warning" label="Chưa kiểm định được" />
        )}
        <Text className="font-sans text-label text-paper-muted">{essay.wordCount} từ</Text>
      </View>

      <Text className="mt-3 font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
        {essay.bodyText}
      </Text>

      <Text className="mt-3 font-sans text-label text-paper-muted">
        Đây là bài tham khảo do AI soạn, không phải bài thi thật đạt band này. Đọc để lấy khung câu
        và cách nhóm ý, đừng học thuộc.
      </Text>
    </View>
  );
}
