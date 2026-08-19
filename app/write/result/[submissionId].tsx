import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Badge, Button, Card, Icon } from '@/components/ui';
import { getWritingPromptById } from '@/data/writing-repository';
import { formatBand } from '@/lib/band';
import { analyseDraft } from '@/services/writing/analyzer';
import { useWritingStore } from '@/store/useWritingStore';
import { color, layout } from '@/theme/tokens';
import type { AnnotationCategory, WritingAnnotation, WritingEvaluation } from '@/lib/writing/types';

/**
 * Kết quả chấm bài.
 *
 * Chấm AI chạy khi mở trang này, không chạy lúc nộp: người học nộp xong là thấy
 * ngay phần phân tích offline, còn phần AI đến sau vài chục giây. Nếu AI hỏng
 * thì trang vẫn dùng được — đó là lý do phần offline luôn hiện, kể cả khi AI
 * chấm thành công.
 */

const CATEGORY_LABEL: Record<AnnotationCategory, string> = {
  grammar: 'Ngữ pháp',
  lexis: 'Từ vựng',
  cohesion: 'Liên kết',
  expression: 'Diễn đạt',
  task: 'Bám đề & số liệu',
};

const CATEGORY_TONE: Record<AnnotationCategory, string> = {
  grammar: 'bg-danger-soft',
  lexis: 'bg-warning-soft',
  cohesion: 'bg-info-soft',
  expression: 'bg-accent-50',
  task: 'bg-primary-50',
};

export default function WritingResultScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();

  const submission = useWritingStore((s) =>
    s.submissions.find((x) => x.id === submissionId),
  );
  const saved = useWritingStore((s) => s.evaluations.find((e) => e.submissionId === submissionId));
  const saveEvaluation = useWritingStore((s) => s.saveEvaluation);

  const prompt = submission ? getWritingPromptById(submission.promptId) : undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!submission || !prompt || saved || requested.current) return;
    requested.current = true;

    setLoading(true);
    setError(null);
    fetch('/api/writing/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="font-heavy text-cardTitle text-ink">Không tìm thấy bài này</Text>
        <View className="mt-4">
          <Button label="Về kho đề" onPress={() => router.replace('/write')} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ paddingBottom: 40 }}>
      <View
        className="w-full self-center px-4 py-4 lg:px-6 lg:py-6"
        style={{ maxWidth: layout.contentMaxWidth }}
      >
        <Text className="font-heavy text-pageTitle text-ink">Kết quả bài viết</Text>
        <Text className="mt-1 font-sans text-bodyLg text-muted">{prompt.promptText}</Text>

        {/* Band */}
        <Card className="mt-4">
          {saved ? (
            <View className="flex-row flex-wrap items-center gap-6">
              <View>
                <Text className="font-sans text-label text-muted">Band ước tính</Text>
                <Text className="font-heavy text-hero text-primary-700">
                  {formatBand(saved.bandLow)}–{formatBand(saved.bandHigh)}
                </Text>
                <Text className="font-sans text-label text-subtle">
                  Chấm tự động, có thể lệch so với giám khảo thật.
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-4">
                <CriterionBox code="TA" label="Task Achievement" value={saved.taskBand} />
                <CriterionBox code="CC" label="Coherence & Cohesion" value={saved.coherenceBand} />
                <CriterionBox code="LR" label="Lexical Resource" value={saved.lexicalBand} />
                <CriterionBox code="GRA" label="Grammar" value={saved.grammarBand} />
              </View>
            </View>
          ) : loading ? (
            <View className="flex-row items-center gap-3">
              <ActivityIndicator color={color.primary} />
              <Text className="font-sans text-body text-muted">
                AI đang chấm bài — thường mất 30–60 giây. Phần phân tích bên dưới dùng được ngay.
              </Text>
            </View>
          ) : (
            <View className="flex-row items-start gap-2">
              <Icon name="info" size={18} color={color.warning} />
              <Text className="flex-1 font-sans text-body text-body">
                {error ?? 'Chưa chấm được bằng AI.'} Phần phân tích bên dưới vẫn dùng bình thường.
              </Text>
            </View>
          )}
        </Card>

        <View className="mt-4 flex-col gap-4 lg:flex-row">
          {/* Bài viết + annotation */}
          <View className="lg:flex-1">
            <Card>
              <Text className="font-heavy text-cardTitle text-ink">Bài viết & lỗi được đánh dấu</Text>
              <Text className="mt-1 font-sans text-label text-muted">
                {submission.wordCount} từ · {Math.round(submission.durationSeconds / 60)} phút
              </Text>
              <View className="mt-3">
                <AnnotatedText text={submission.bodyText} annotations={saved?.annotations ?? []} />
              </View>
            </Card>
          </View>

          {/* Nhận xét */}
          <View className="lg:w-[38%]">
            {saved ? (
              <Card>
                <Text className="font-heavy text-cardTitle text-ink">Nhận xét</Text>
                <Text className="mt-2 font-sans text-body text-body">{saved.summaryVi}</Text>

                {saved.strengths.length > 0 ? (
                  <>
                    <Text className="mt-4 font-strong text-body text-success-ink">Làm tốt</Text>
                    {saved.strengths.map((s) => (
                      <Text key={s} className="mt-1 font-sans text-label text-body">
                        • {s}
                      </Text>
                    ))}
                  </>
                ) : null}

                {saved.improvements.length > 0 ? (
                  <>
                    <Text className="mt-4 font-strong text-body text-danger-ink">Cần sửa</Text>
                    {saved.improvements.map((s) => (
                      <Text key={s} className="mt-1 font-sans text-label text-body">
                        • {s}
                      </Text>
                    ))}
                  </>
                ) : null}
              </Card>
            ) : null}

            <Card className={saved ? 'mt-3' : ''}>
              <Text className="font-heavy text-cardTitle text-ink">Phân tích cấu trúc</Text>
              <Text className="mt-1 font-sans text-label text-muted">Không dùng AI.</Text>
              <View className="mt-3 gap-2">
                {analysis && analysis.hints.length > 0 ? (
                  analysis.hints.map((h) => (
                    <View
                      key={h.code}
                      className={[
                        'rounded-md border-l-4 p-2',
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
            </Card>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <Button label="Viết lại bài này" onPress={() => router.push(`/write/${prompt.id}` as never)} />
              <Button variant="outline" label="Về kho đề" onPress={() => router.push('/write')} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function CriterionBox({ code, label, value }: { code: string; label: string; value: number }) {
  return (
    <View className="min-w-[120px]">
      <Text className="font-sans text-label text-muted">
        {code} · {label}
      </Text>
      <Text className="font-heavy text-stat text-ink">{formatBand(value)}</Text>
    </View>
  );
}

/**
 * Bài viết với các đoạn lỗi được tô nền.
 *
 * Cắt theo offset đã neo ở server. Annotation đã được xếp theo vị trí và không
 * chồng lấn nhau (xem `services/writing/annotate`), nên chỉ cần duyệt một lượt.
 */
function AnnotatedText({
  text,
  annotations,
}: {
  text: string;
  annotations: WritingAnnotation[];
}) {
  if (annotations.length === 0) {
    return <Text className="font-sans text-body text-ink" style={{ lineHeight: 24 }}>{text}</Text>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  annotations.forEach((a, i) => {
    if (a.start > cursor) parts.push(<Text key={`p${i}`}>{text.slice(cursor, a.start)}</Text>);
    parts.push(
      <Text key={`a${i}`} className={CATEGORY_TONE[a.category]}>
        {text.slice(a.start, a.end)}
      </Text>,
    );
    cursor = a.end;
  });
  if (cursor < text.length) parts.push(<Text key="tail">{text.slice(cursor)}</Text>);

  return (
    <View>
      <Text className="font-sans text-body text-ink" style={{ lineHeight: 24 }}>
        {parts}
      </Text>

      <View className="mt-4 gap-2">
        {annotations.map((a, i) => (
          <View key={`${a.start}-${i}`} className="rounded-md border border-border p-2">
            <View className="flex-row flex-wrap items-center gap-2">
              <Badge
                tone={a.severity === 'major' ? 'danger' : 'warning'}
                label={CATEGORY_LABEL[a.category]}
              />
              <Text className="font-strong text-label text-ink">“{a.quote}”</Text>
            </View>
            <Text className="mt-1 font-sans text-label text-body">{a.whyVi}</Text>
            {a.fix ? (
              <Text className="mt-1 font-sans text-label text-success-ink">Sửa: {a.fix}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
