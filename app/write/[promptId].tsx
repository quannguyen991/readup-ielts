import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { Button, Icon, PaperCard } from '@/components/ui';
import { ChartFigure } from '@/components/writing/ChartFigure';
import { getWritingPromptById } from '@/data/writing-repository';
import { writingGuide, type GuideSection } from '@/services/writing/guide';
import { analyseDraft } from '@/services/writing/analyzer';
import { useWritingStore } from '@/store/useWritingStore';
import { color, paper } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Phòng viết, bố cục ba cột theo tham chiếu Youpass:
 *
 *   - trái: đề bài, rồi HƯỚNG DẪN VIẾT (giải thích đề, định hướng từng phần,
 *     phân chia thân bài, hướng dẫn triển khai) — sinh từ chính đề, không gọi AI;
 *   - giữa: các ô viết theo khung bài (Task 1: Introduction / Overview / Body 1 /
 *     Body 2; Task 2: Introduction / Body 1 / Body 2 / Conclusion);
 *   - phải: phân tích nhanh chạy trên máy (không AI), đếm từ theo từng phần.
 *
 * Bản nháp lưu dưới dạng JSON theo từng phần, tự lưu sau mỗi lần gõ. Bản nháp
 * cũ (một khối chữ) được đưa vào phần đầu tiên, không mất.
 */

const SECTION_LABELS: Record<string, string> = {
  intro: 'Introduction',
  overview: 'Overview',
  body1: 'Body 1',
  body2: 'Body 2',
  conclusion: 'Conclusion',
};

const TASK1_KEYS = ['intro', 'overview', 'body1', 'body2'];
const TASK2_KEYS = ['intro', 'body1', 'body2', 'conclusion'];

const ORANGE = '#E8590C';
const GREEN = '#16A34A';

const FONTS = [
  { key: 'nunito', label: 'Nunito', family: 'Nunito_400Regular' },
  { key: 'sans', label: 'Jakarta', family: 'PlusJakartaSans_400Regular' },
  { key: 'serif', label: 'Có chân', family: Platform.select({ web: 'Georgia, serif', default: 'serif' }) },
] as const;

const SIZES = [15, 16, 18] as const;

type DraftPayload = { __ws: 1; sections: Record<string, string> };

export default function WritingRoomScreen() {
  const { promptId } = useLocalSearchParams<{ promptId: string }>();
  const prompt = typeof promptId === 'string' ? getWritingPromptById(promptId) : undefined;

  const saveDraft = useWritingStore((s) => s.saveDraft);
  const getDraft = useWritingStore((s) => s.getDraft);
  const submit = useWritingStore((s) => s.submit);
  const { L } = useL();

  const isTask1 = prompt?.task === 'ielts_task1';
  const keys = isTask1 ? TASK1_KEYS : TASK2_KEYS;

  const [sections, setSections] = useState<Record<string, string>>(() =>
    prompt ? parseDraft(getDraft(prompt.id, null), keys) : {},
  );
  const [secondsLeft, setSecondsLeft] = useState(prompt?.timeLimitSeconds ?? 1200);
  const [running, setRunning] = useState(false);
  const [fontKey, setFontKey] = useState<(typeof FONTS)[number]['key']>('nunito');
  const [fontSize, setFontSize] = useState<number>(16);
  const startedAt = useRef<number | null>(null);

  // Đồng hồ chỉ chạy khi người học bấm bắt đầu: mở trang ra để đọc đề mà đã bị
  // tính giờ thì lần luyện nào cũng bị hụt mất một hai phút.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const text = useMemo(() => joinSections(keys, sections), [keys, sections]);

  const onChange = useCallback(
    (key: string, value: string) => {
      if (!prompt) return;
      const next = { ...sections, [key]: value };
      setSections(next);
      const payload: DraftPayload = { __ws: 1, sections: next };
      saveDraft(prompt.id, null, JSON.stringify(payload));
      if (!startedAt.current) startedAt.current = Date.now();
    },
    [prompt, saveDraft, sections],
  );

  const analysis = useMemo(
    () => (prompt ? analyseDraft(text, { task: prompt.task, minWords: prompt.minWords }) : null),
    [text, prompt],
  );

  const guide = useMemo(() => (prompt ? writingGuide(prompt) : null), [prompt]);

  if (!prompt || !guide) {
    return (
      <TaskShell backHref="/write" backLabel={L('Về kho đề', 'Back to prompts')} title={L('Không tìm thấy đề này', "Couldn't find this prompt")} icon="pencil">
        <PaperCard className="max-w-[520px]">
          <Text className="font-nun text-body text-paper-body">
            {L('Đề bạn vừa mở không còn trong kho. Quay lại danh sách để chọn đề khác.', 'This prompt is no longer in the bank. Go back to the list and pick another.')}
          </Text>
          <Button className="mt-4" variant="brand" label={L('Về kho đề', 'Back to prompts')} onPress={() => router.replace('/write/tests')} />
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
  const wordCount = analysis?.wordCount ?? 0;
  const fontFamily = FONTS.find((f) => f.key === fontKey)?.family;
  const enough = wordCount >= prompt.minWords;

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
            <Text className="font-nun-strong text-white">{formatClock(secondsLeft)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setRunning((r) => !r)}
            className="rounded-pill px-3.5 py-2"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <Text className="font-nun-strong" style={{ fontSize: 13, color: '#0F1D33' }}>
              {running ? L('Tạm dừng', 'Pause') : L('Tính giờ', 'Start timer')}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View className="gap-4 lg:flex-row">
        {/* ------------------------------------------------ đề + hướng dẫn */}
        <View className="lg:w-[34%]">
          <PaperCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-nun-heavy text-paper-ink" style={{ fontSize: 17 }}>{L('Đề bài', 'Prompt')}</Text>
              <Text className="font-nun-mid text-paper-muted" style={{ fontSize: 13 }}>
                {isTask1 ? 'Task 1 · Academic' : 'Task 2 · Essay'}
              </Text>
            </View>
            <Text className="mt-3 font-nun-mid text-paper-ink" style={{ fontSize: 15, lineHeight: 23 }}>
              {prompt.promptText}
            </Text>

            {prompt.chartData ? (
              <View className="mt-4 items-center rounded-panel border border-brand-soft bg-white p-3">
                <ChartFigure data={prompt.chartData} width={360} />
              </View>
            ) : null}
          </PaperCard>

          <PaperCard className="mt-4">
            <Text className="font-nun-heavy text-paper-ink" style={{ fontSize: 17 }}>{L('Hướng dẫn viết', 'Writing guide')}</Text>
            <View className="mt-3 gap-4">
              {guide.sections.map((s) => (
                <GuideBlock key={s.heading} section={s} />
              ))}
            </View>
          </PaperCard>
        </View>

        {/* --------------------------------------------------- bài làm */}
        <View className="lg:flex-1">
          <PaperCard padded={false}>
            <View className="flex-row flex-wrap items-center justify-between gap-2 px-5 pt-5">
              <Text className="font-nun-heavy text-paper-ink" style={{ fontSize: 17 }}>{L('Bài viết của bạn', 'Your answer')}</Text>
              <View className="flex-row items-center gap-3">
                <Text className="font-nun-strong" style={{ fontSize: 14, color: enough ? GREEN : color.danger }}>
                  {wordCount} / {prompt.minWords} {L('từ', 'words')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={onSubmit}
                  disabled={text.trim() === ''}
                  className="flex-row items-center gap-1.5 rounded-pill px-4 py-2"
                  style={{ backgroundColor: text.trim() === '' ? '#B7E3C4' : GREEN, minHeight: 40 }}
                >
                  <Text className="font-nun-strong text-white" style={{ fontSize: 14 }}>{L('Nộp bài', 'Submit')}</Text>
                  <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.4} />
                </Pressable>
              </View>
            </View>

            {/* ----------------------------------------------- chọn chữ */}
            <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2 border-y border-brand-soft bg-brand-tint px-5 py-2.5">
              <View className="flex-row items-center gap-1.5">
                <Text className="font-nun-strong text-paper-muted" style={{ fontSize: 12 }}>{L('Phông', 'Font')}</Text>
                {FONTS.map((f) => (
                  <Pressable
                    key={f.key}
                    accessibilityRole="button"
                    aria-selected={fontKey === f.key}
                    onPress={() => setFontKey(f.key)}
                    className="rounded-md px-2.5 py-1"
                    style={{ backgroundColor: fontKey === f.key ? GREEN : '#FFFFFF', borderWidth: 1, borderColor: fontKey === f.key ? GREEN : '#E5DFD2' }}
                  >
                    <Text style={{ fontFamily: f.family, fontSize: 13, color: fontKey === f.key ? '#FFFFFF' : paper.muted }}>
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row items-center gap-1.5">
                <Text className="font-nun-strong text-paper-muted" style={{ fontSize: 12 }}>{L('Cỡ chữ', 'Size')}</Text>
                {SIZES.map((s) => (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    aria-selected={fontSize === s}
                    onPress={() => setFontSize(s)}
                    className="rounded-md px-2.5 py-1"
                    style={{ backgroundColor: fontSize === s ? GREEN : '#FFFFFF', borderWidth: 1, borderColor: fontSize === s ? GREEN : '#E5DFD2' }}
                  >
                    <Text className="font-nun-strong" style={{ fontSize: 13, color: fontSize === s ? '#FFFFFF' : paper.muted }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ----------------------------------------------- các phần */}
            <View className="gap-4 px-5 py-5">
              {keys.map((key) => {
                const value = sections[key] ?? '';
                const count = countWords(value);
                return (
                  <View key={key} className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-nun-heavy text-paper-ink" style={{ fontSize: 16 }}>{SECTION_LABELS[key]}</Text>
                      <Text className="font-nun-mid text-paper-muted" style={{ fontSize: 13 }}>{count} {L('từ', 'words')}</Text>
                    </View>
                    <TextInput
                      value={value}
                      onChangeText={(v) => onChange(key, v)}
                      multiline
                      textAlignVertical="top"
                      placeholder={L(`Nhập phần ${SECTION_LABELS[key]} của bạn ở đây`, `Write your ${SECTION_LABELS[key]} here`)}
                      placeholderTextColor={paper.muted}
                      className="rounded-xl border bg-white px-4 py-3 text-paper-ink"
                      style={{
                        borderColor: '#E5DFD2',
                        fontFamily,
                        fontSize,
                        lineHeight: fontSize * 1.7,
                        minHeight: key === 'intro' || key === 'conclusion' ? 96 : 150,
                      }}
                    />
                  </View>
                );
              })}
            </View>

            <View className="flex-row justify-between border-t border-brand-soft px-5 py-3">
              <Text className="font-nun-mid text-paper-muted" style={{ fontSize: 13 }}>
                {L(
                  `${analysis?.paragraphCount ?? 0} đoạn · ${analysis?.sentenceCount ?? 0} câu`,
                  `${analysis?.paragraphCount ?? 0} paragraphs · ${analysis?.sentenceCount ?? 0} sentences`,
                )}
              </Text>
              <Text className="font-nun-mid text-paper-muted" style={{ fontSize: 13 }}>{L('Bản nháp tự lưu', 'Draft autosaves')}</Text>
            </View>
          </PaperCard>

          {analysis ? (
            <PaperCard className="mt-4">
              <Text className="font-nun-heavy text-paper-ink" style={{ fontSize: 17 }}>{L('Phân tích nhanh', 'Quick analysis')}</Text>
              <Text className="mt-1 font-nun text-label text-paper-muted">
                {L('Chạy ngay trên máy, không dùng AI.', 'Runs on your device, no AI.')}
              </Text>

              <View className="mt-3 rounded-panel bg-brand-tint p-3">
                <Text className="font-nun-mid text-label text-paper-muted">{L('Ước lượng band', 'Estimated band')}</Text>
                {analysis.estimate ? (
                  <>
                    <Text className="font-nun-heavy" style={{ fontSize: 30, color: GREEN }}>
                      {analysis.estimate.low.toFixed(1)}–{analysis.estimate.high.toFixed(1)}
                    </Text>
                    <Text className="font-nun text-label text-paper-muted">
                      {L('Chỉ là ước lượng từ cấu trúc bài, không phải band thật.', 'Just an estimate from your structure, not a real band.')}
                    </Text>
                  </>
                ) : (
                  <Text className="font-nun text-label text-paper-muted">
                    {L('Viết thêm đã rồi mới ước lượng được — bài còn quá ngắn để nói gì.', 'Write a bit more first — too short to estimate yet.')}
                  </Text>
                )}
              </View>

              <View className="mt-3 gap-2">
                {analysis.hints.length === 0 ? (
                  <Text className="font-nun-mid text-body text-success-ink">
                    {L('Chưa phát hiện vấn đề nào về cấu trúc.', 'No structural issues found yet.')}
                  </Text>
                ) : (
                  analysis.hints.map((h) => (
                    <View
                      key={h.code}
                      className={['rounded-md border-l-4 p-2.5', h.severity === 'warn' ? 'border-danger bg-danger-soft' : 'border-warning bg-warning-soft'].join(' ')}
                    >
                      <Text className="font-nun text-label text-body">{h.message}</Text>
                    </View>
                  ))
                )}
              </View>
            </PaperCard>
          ) : null}
        </View>
      </View>
    </TaskShell>
  );
}

function GuideBlock({ section }: { section: GuideSection }) {
  const headingColor = section.tone === 'orange' ? ORANGE : GREEN;
  return (
    <View className="gap-1.5">
      <Text className="font-nun-heavy" style={{ fontSize: 16, color: headingColor }}>{section.heading}</Text>
      {section.paragraphs.map((p, i) => (
        <Text key={i} className="font-nun text-paper-ink" style={{ fontSize: 15, lineHeight: 23 }}>{p}</Text>
      ))}
      {section.bullets?.map((b, i) => (
        <View key={i} className="flex-row gap-2 pl-1">
          <Text className="font-nun-strong" style={{ fontSize: 15, lineHeight: 23, color: headingColor }}>•</Text>
          <Text className="flex-1 font-nun text-paper-ink" style={{ fontSize: 15, lineHeight: 23 }}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

/** Đọc bản nháp: JSON theo phần, hoặc chữ cũ (một khối) thì đưa vào phần đầu. */
function parseDraft(raw: string, keys: string[]): Record<string, string> {
  const blank = Object.fromEntries(keys.map((k) => [k, ''])) as Record<string, string>;
  if (!raw) return blank;
  try {
    const parsed = JSON.parse(raw) as Partial<DraftPayload>;
    if (parsed && parsed.__ws === 1 && parsed.sections) return { ...blank, ...parsed.sections };
  } catch {
    /* không phải JSON: bản nháp cũ */
  }
  return { ...blank, [keys[0] ?? 'intro']: raw };
}

function joinSections(keys: string[], sections: Record<string, string>): string {
  return keys.map((k) => (sections[k] ?? '').trim()).filter(Boolean).join('\n\n');
}

function countWords(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
