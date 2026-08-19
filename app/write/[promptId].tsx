import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Badge, Button, Card, Icon } from '@/components/ui';
import { ChartFigure } from '@/components/writing/ChartFigure';
import { getWritingPromptById } from '@/data/writing-repository';
import { analyseDraft } from '@/services/writing/analyzer';
import { useWritingStore } from '@/store/useWritingStore';
import { color, layout } from '@/theme/tokens';

/**
 * Phòng viết.
 *
 * Ba cột: đề bên trái, ô soạn thảo ở giữa, phân tích tức thì bên phải. Phân
 * tích chạy hoàn toàn trên máy nên cập nhật theo từng chữ gõ mà không tốn gì —
 * xem `services/writing/analyzer`.
 *
 * Bản nháp tự lưu sau mỗi lần gõ ngừng, nên đóng tab giữa chừng không mất bài.
 */
export default function WritingRoomScreen() {
  const { promptId } = useLocalSearchParams<{ promptId: string }>();
  const prompt = typeof promptId === 'string' ? getWritingPromptById(promptId) : undefined;

  const saveDraft = useWritingStore((s) => s.saveDraft);
  const getDraft = useWritingStore((s) => s.getDraft);
  const submit = useWritingStore((s) => s.submit);

  const [text, setText] = useState(() => (prompt ? getDraft(prompt.id, null) : ''));
  const [secondsLeft, setSecondsLeft] = useState(prompt?.timeLimitSeconds ?? 1200);
  const [running, setRunning] = useState(false);
  const startedAt = useRef<number | null>(null);

  // Đồng hồ chỉ chạy khi người học bấm bắt đầu: mở trang ra để đọc đề mà đã bị
  // tính giờ thì lần luyện nào cũng bị hụt mất một hai phút.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const onChange = useCallback(
    (next: string) => {
      setText(next);
      if (prompt) saveDraft(prompt.id, null, next);
      if (!startedAt.current) startedAt.current = Date.now();
    },
    [prompt, saveDraft],
  );

  const analysis = useMemo(
    () => (prompt ? analyseDraft(text, { task: prompt.task, minWords: prompt.minWords }) : null),
    [text, prompt],
  );

  if (!prompt) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="font-heavy text-cardTitle text-ink">Không tìm thấy đề này</Text>
        <View className="mt-4">
          <Button label="Về kho đề" onPress={() => router.replace('/write')} />
        </View>
      </View>
    );
  }

  const onSubmit = () => {
    const elapsed = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
    const submission = submit({
      promptId: prompt.id,
      mode: 'full',
      drillPart: null,
      bodyText: text,
      durationSeconds: elapsed,
    });
    router.push(`/write/result/${submission.id}` as never);
  };

  const overtime = secondsLeft === 0;

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerStyle={{ paddingBottom: 40 }}>
      <View
        className="w-full self-center px-4 py-4 lg:px-6 lg:py-6"
        style={{ maxWidth: layout.contentMaxWidth }}
      >
        <View className="mb-4 flex-row flex-wrap items-center justify-between gap-3">
          <Pressable onPress={() => router.push('/write')} className="flex-row items-center gap-1">
            <Icon name="chevron-left" size={18} color={color.muted} />
            <Text className="font-semi text-body text-muted">Kho đề</Text>
          </Pressable>

          <View className="flex-row items-center gap-3">
            <View
              className={[
                'flex-row items-center gap-1.5 rounded-pill border px-3 py-1.5',
                overtime ? 'border-danger bg-danger-soft' : 'border-border bg-surface',
              ].join(' ')}
            >
              <Icon name="clock" size={15} color={overtime ? color.danger : color.muted} />
              <Text
                className={['font-strong text-body', overtime ? 'text-danger-ink' : 'text-ink'].join(' ')}
              >
                {formatClock(secondsLeft)}
              </Text>
            </View>
            <Button
              variant={running ? 'outline' : 'primary'}
              label={running ? 'Tạm dừng' : 'Bắt đầu tính giờ'}
              onPress={() => setRunning((r) => !r)}
            />
            <Button label="Nộp bài" onPress={onSubmit} disabled={text.trim() === ''} />
          </View>
        </View>

        <View className="flex-col gap-4 lg:flex-row">
          {/* Đề bài */}
          <View className="lg:w-[34%]">
            <Card>
              <View className="flex-row flex-wrap items-center gap-2">
                <Badge tone="primary" label={prompt.task === 'ielts_task1' ? 'Task 1' : 'Task 2'} />
                <Text className="font-sans text-label text-muted">
                  {Math.round(prompt.timeLimitSeconds / 60)} phút · ≥ {prompt.minWords} từ
                </Text>
              </View>
              <Text className="mt-3 font-sans text-body text-ink">{prompt.promptText}</Text>
              <Text className="mt-3 font-sans text-label text-muted">
                Summarise the information by selecting and reporting the main features, and make
                comparisons where relevant.
              </Text>
            </Card>

            {prompt.chartData ? (
              <View className="mt-3">
                <ChartFigure data={prompt.chartData} width={380} />
              </View>
            ) : null}
          </View>

          {/* Ô soạn thảo */}
          <View className="lg:flex-1">
            <Card>
              <Text className="mb-2 font-heavy text-cardTitle text-ink">Bài viết của bạn</Text>
              <TextInput
                value={text}
                onChangeText={onChange}
                multiline
                textAlignVertical="top"
                placeholder="Bắt đầu viết ở đây. Nhớ dành 3 phút đầu để phân tích đề trước khi đặt bút."
                placeholderTextColor={color.subtle}
                className="min-h-[420px] rounded-md border border-border bg-surface p-3 font-sans text-body text-ink"
                style={{ lineHeight: 22 }}
              />
              <View className="mt-2 flex-row justify-between">
                <Text
                  className={[
                    'font-semi text-label',
                    analysis && analysis.wordCount < prompt.minWords ? 'text-danger-ink' : 'text-muted',
                  ].join(' ')}
                >
                  {analysis?.wordCount ?? 0} / {prompt.minWords} từ
                </Text>
                <Text className="font-sans text-label text-muted">
                  {analysis?.paragraphCount ?? 0} đoạn · {analysis?.sentenceCount ?? 0} câu
                </Text>
              </View>
            </Card>
          </View>

          {/* Phân tích tức thì */}
          <View className="lg:w-[26%]">
            <Card>
              <Text className="font-heavy text-cardTitle text-ink">Phân tích nhanh</Text>
              <Text className="mt-1 font-sans text-label text-muted">
                Chạy ngay trên máy, không dùng AI.
              </Text>

              {analysis ? (
                <>
                  <View className="mt-3 rounded-md bg-surfaceAlt p-3">
                    <Text className="font-sans text-label text-muted">Ước lượng band</Text>
                    {analysis.estimate ? (
                      <>
                        <Text className="font-heavy text-stat text-primary-700">
                          {analysis.estimate.low.toFixed(1)}–{analysis.estimate.high.toFixed(1)}
                        </Text>
                        <Text className="font-sans text-label text-subtle">
                          Chỉ là ước lượng từ cấu trúc bài, không phải band thật.
                        </Text>
                      </>
                    ) : (
                      <Text className="font-sans text-label text-subtle">
                        Viết thêm đã rồi mới ước lượng được — bài còn quá ngắn để nói gì.
                      </Text>
                    )}
                  </View>

                  <View className="mt-3 gap-2">
                    {analysis.hints.length === 0 ? (
                      <Text className="font-sans text-body text-success-ink">
                        Chưa phát hiện vấn đề nào về cấu trúc.
                      </Text>
                    ) : (
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
                    )}
                  </View>
                </>
              ) : null}
            </Card>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
