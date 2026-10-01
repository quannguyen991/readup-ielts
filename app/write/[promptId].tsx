import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { Button, Icon, PaperCard } from '@/components/ui';
import { ChartFigure } from '@/components/writing/ChartFigure';
import { getWritingPromptById } from '@/data/writing-repository';
import { analyseDraft } from '@/services/writing/analyzer';
import { useWritingStore } from '@/store/useWritingStore';
import { color, paper } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Phòng viết.
 *
 * Hai cột trên nền giấy kẻ ô: đề bài bên trái đứng yên, ô soạn thảo bên phải
 * chiếm phần còn lại. Bản trước chia BA cột — đề, ô viết, và một cột phân tích
 * tức thì — nhưng cột thứ ba là thứ nhấp nháy theo từng chữ gõ ngay cạnh chỗ
 * đang viết, tức là nó cạnh tranh sự chú ý với đúng việc mà màn hình này tồn
 * tại để phục vụ. Giờ phân tích nằm dưới ô viết, cuộn tới thì thấy.
 *
 * Bản nháp tự lưu sau mỗi lần gõ, nên đóng tab giữa chừng không mất bài.
 */

/**
 * Ba mặt chữ để chọn.
 *
 * Chỉ dùng font HỆ THỐNG cộng font sẵn có của app, không nạp thêm bộ chữ nào:
 * một bộ chữ web là vài trăm KB tải về chỉ để đổi cảm giác khi gõ. Người quen
 * viết trên giấy hay chọn chữ có chân, nên có sẵn một lựa chọn như vậy là đủ.
 */
const FONTS = [
  { key: 'sans', label: 'Jakarta', labelEn: 'Jakarta', family: 'PlusJakartaSans_400Regular' },
  { key: 'serif', label: 'Có chân', labelEn: 'Serif', family: Platform.select({ web: 'Georgia, serif', default: 'serif' }) },
  { key: 'mono', label: 'Đơn cách', labelEn: 'Mono', family: Platform.select({ web: 'ui-monospace, monospace', default: 'monospace' }) },
] as const;

const SIZES = [15, 16, 18, 20] as const;

export default function WritingRoomScreen() {
  const { promptId } = useLocalSearchParams<{ promptId: string }>();
  const prompt = typeof promptId === 'string' ? getWritingPromptById(promptId) : undefined;

  const saveDraft = useWritingStore((s) => s.saveDraft);
  const getDraft = useWritingStore((s) => s.getDraft);
  const submit = useWritingStore((s) => s.submit);

  const [text, setText] = useState(() => (prompt ? getDraft(prompt.id, null) : ''));
  const [secondsLeft, setSecondsLeft] = useState(prompt?.timeLimitSeconds ?? 1200);
  const [running, setRunning] = useState(false);
  const [fontKey, setFontKey] = useState<(typeof FONTS)[number]['key']>('sans');
  const [fontSize, setFontSize] = useState<number>(16);
  const startedAt = useRef<number | null>(null);
  const { L, en } = useL();

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
      <TaskShell backHref="/write" backLabel={L('Về kho đề', 'Back to prompts')} title={L('Không tìm thấy đề này', "Couldn't find this prompt")} icon="pencil">
        <PaperCard className="max-w-[520px]">
          <Text className="font-sans text-body text-paper-body">
            {L('Đề bạn vừa mở không còn trong kho. Quay lại danh sách để chọn đề khác.', "This prompt is no longer in the bank. Go back to the list and pick another.")}
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
  const isTask1 = prompt.task === 'ielts_task1';
  const wordCount = analysis?.wordCount ?? 0;
  const fontFamily = FONTS.find((f) => f.key === fontKey)?.family;

  return (
    <TaskShell
      backHref="/write"
      backLabel={L('Quay lại kho đề', 'Back to prompts')}
      title={L('Phòng viết', 'Writing room')}
      subtitle={isTask1 ? 'Task 1 · Academic Writing' : 'Task 2 · Essay'}
      icon="pencil"
      right={
        <View className="flex-row items-center gap-2">
          <View
            className="flex-row items-center gap-1.5 rounded-pill px-3 py-1.5"
            style={{ backgroundColor: overtime ? color.danger : 'rgba(255,255,255,0.18)' }}
          >
            <Icon name="clock" size={14} color="#FFFFFF" strokeWidth={2} />
            <Text className="font-strong text-body text-white">{formatClock(secondsLeft)}</Text>
          </View>
          <Button
            variant="onDark"
            size="sm"
            label={running ? L('Tạm dừng', 'Pause') : L('Tính giờ', 'Start timer')}
            onPress={() => setRunning((r) => !r)}
          />
        </View>
      }
    >
      <View className="gap-4 lg:flex-row">
        {/* ---------------------------------------------------------- đề bài */}
        <View className="lg:w-[36%]">
          <PaperCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-heavy text-cardTitle text-paper-ink">{L('Đề bài', 'Prompt')}</Text>
              <Text className="font-semi text-label text-paper-muted">
                {isTask1 ? 'Task 1 · Academic' : 'Task 2 · Essay'}
              </Text>
            </View>

            <Text className="mt-4 font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 10 }}>
              Prompt
            </Text>
            <Text className="mt-1.5 font-mid text-bodyLg text-paper-ink" style={{ lineHeight: 24 }}>
              {prompt.promptText}
            </Text>

            {prompt.chartData ? (
              <View className="mt-4 items-center rounded-panel border border-brand-soft bg-white p-3">
                <ChartFigure data={prompt.chartData} width={360} />
              </View>
            ) : null}

            <View className="mt-4 flex-row flex-wrap items-center justify-between gap-2 border-t border-brand-soft pt-3">
              <Text className="font-strong text-label text-paper-ink">
                {isTask1 ? 'Task 1 · Academic' : 'Task 2'}
              </Text>
              <Text className="font-sans text-label text-paper-muted">
                {L('Tối thiểu', 'Minimum')} <Text className="font-strong text-paper-ink">{L(`${prompt.minWords} từ`, `${prompt.minWords} words`)}</Text>
              </Text>
              <Text className="font-sans text-label text-paper-muted">
                {L('Gợi ý', 'Suggested')}{' '}
                <Text className="font-strong text-paper-ink">
                  {L(`${Math.round(prompt.timeLimitSeconds / 60)} phút`, `${Math.round(prompt.timeLimitSeconds / 60)} min`)}
                </Text>
              </Text>
            </View>
          </PaperCard>

          {analysis ? (
            <PaperCard className="mt-4">
              <Text className="font-heavy text-cardTitle text-paper-ink">{L('Phân tích nhanh', 'Quick analysis')}</Text>
              <Text className="mt-1 font-sans text-label text-paper-muted">
                {L('Chạy ngay trên máy, không dùng AI.', 'Runs on your device, no AI.')}
              </Text>

              <View className="mt-3 rounded-panel bg-brand-tint p-3">
                <Text className="font-sans text-label text-paper-muted">{L('Ước lượng band', 'Estimated band')}</Text>
                {analysis.estimate ? (
                  <>
                    <Text className="font-heavy text-stat" style={{ color: paper.brandMid }}>
                      {analysis.estimate.low.toFixed(1)}–{analysis.estimate.high.toFixed(1)}
                    </Text>
                    <Text className="font-sans text-label text-paper-muted">
                      {L('Chỉ là ước lượng từ cấu trúc bài, không phải band thật.', 'Just an estimate from your structure, not a real band.')}
                    </Text>
                  </>
                ) : (
                  <Text className="font-sans text-label text-paper-muted">
                    {L('Viết thêm đã rồi mới ước lượng được — bài còn quá ngắn để nói gì.', 'Write a bit more first — too short to estimate yet.')}
                  </Text>
                )}
              </View>

              <View className="mt-3 gap-2">
                {analysis.hints.length === 0 ? (
                  <Text className="font-sans text-body text-success-ink">
                    {L('Chưa phát hiện vấn đề nào về cấu trúc.', 'No structural issues found yet.')}
                  </Text>
                ) : (
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
                )}
              </View>
            </PaperCard>
          ) : null}
        </View>

        {/* --------------------------------------------------------- bài làm */}
        <View className="lg:flex-1">
          <PaperCard padded={false}>
            <View className="flex-row flex-wrap items-center justify-between gap-2 px-5 pt-5">
              <Text className="font-heavy text-cardTitle text-paper-ink">{L('Bài làm', 'Your answer')}</Text>
              <View className="flex-row items-center gap-3">
                <Text
                  className="font-strong text-label"
                  style={{ color: wordCount < prompt.minWords ? color.danger : paper.brandMid }}
                >
                  {wordCount} / {prompt.minWords} {L('từ', 'words')}
                </Text>
                <Button
                  variant="brand"
                  size="sm"
                  label={L('Nộp bài', 'Submit')}
                  iconRight="check"
                  disabled={text.trim() === ''}
                  onPress={onSubmit}
                />
              </View>
            </View>

            {/* ----------------------------------------------- thanh chữ */}
            <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2 border-y border-brand-soft bg-brand-tint px-5 py-2.5">
              <View className="flex-row items-center gap-1.5">
                <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
                  Font
                </Text>
                {FONTS.map((f) => (
                  <Pressable
                    key={f.key}
                    accessibilityRole="button"
                    aria-selected={fontKey === f.key}
                    onPress={() => setFontKey(f.key)}
                    className="rounded-md px-2 py-1"
                    style={{ backgroundColor: fontKey === f.key ? paper.brandMid : 'transparent' }}
                  >
                    <Text
                      className="text-label"
                      style={{
                        fontFamily: f.family,
                        color: fontKey === f.key ? '#FFFFFF' : paper.muted,
                      }}
                    >
                      {en ? f.labelEn : f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row items-center gap-1.5">
                <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
                  {L('Cỡ chữ', 'Size')}
                </Text>
                {SIZES.map((s) => (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    aria-selected={fontSize === s}
                    onPress={() => setFontSize(s)}
                    className="rounded-md px-2 py-1"
                    style={{ backgroundColor: fontSize === s ? paper.brandMid : 'transparent' }}
                  >
                    <Text
                      className="font-semi text-label"
                      style={{ color: fontSize === s ? '#FFFFFF' : paper.muted }}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextInput
              value={text}
              onChangeText={onChange}
              multiline
              textAlignVertical="top"
              placeholder={L(
                `Viết bài ${isTask1 ? 'Task 1' : 'Task 2'} của bạn tại đây (tối thiểu ${prompt.minWords} từ)…`,
                `Write your ${isTask1 ? 'Task 1' : 'Task 2'} answer here (at least ${prompt.minWords} words)…`,
              )}
              placeholderTextColor={paper.muted}
              className="min-h-[460px] bg-paper px-5 py-4 text-paper-ink"
              style={{ fontFamily, fontSize, lineHeight: fontSize * 1.75 }}
            />

            <View className="flex-row justify-between border-t border-brand-soft px-5 py-3">
              <Text className="font-sans text-label text-paper-muted">
                {L(
                  `${analysis?.paragraphCount ?? 0} đoạn · ${analysis?.sentenceCount ?? 0} câu`,
                  `${analysis?.paragraphCount ?? 0} paragraphs · ${analysis?.sentenceCount ?? 0} sentences`,
                )}
              </Text>
              <Text className="font-sans text-label text-paper-muted">{L('Bản nháp tự lưu', 'Draft autosaves')}</Text>
            </View>
          </PaperCard>
        </View>
      </View>
    </TaskShell>
  );
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
