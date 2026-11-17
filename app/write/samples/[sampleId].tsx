import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ChartFigure } from '@/components/writing/ChartFigure';
import { Task1SourceFigure } from '@/components/writing/Task1SourceFigure';
import { Screen } from '@/components/layout/Screen';
import { Button, Icon } from '@/components/ui';
import { getWritingPromptById } from '@/data/writing-repository';
import { getWritingSampleById, WRITING_SAMPLES, type WritingSample, type WritingSampleParagraph, type WritingSampleSection } from '@/data/writing-samples';
import { useWritingSamplesStore } from '@/store/useWritingSamplesStore';
import { useL } from '@/i18n/useL';

type ReaderMode = 'english' | 'bilingual' | 'analysis' | 'sentence';

const SECTION_META: Record<WritingSampleSection, { vi: string; en: string; color: string; bg: string }> = {
  introduction: { vi: 'Mở bài', en: 'Introduction', color: '#315DA8', bg: '#EAF1FF' },
  overview: { vi: 'Tổng quan', en: 'Overview', color: '#138256', bg: '#E6F6EE' },
  body1: { vi: 'Thân bài 1', en: 'Body paragraph 1', color: '#A94D20', bg: '#FFF0E6' },
  body2: { vi: 'Thân bài 2', en: 'Body paragraph 2', color: '#7554B3', bg: '#F1EDFB' },
  conclusion: { vi: 'Kết luận', en: 'Conclusion', color: '#A13C60', bg: '#FCECF2' },
};

export default function WritingSampleReaderScreen() {
  const { sampleId } = useLocalSearchParams<{ sampleId: string }>();
  const sample = typeof sampleId === 'string' ? getWritingSampleById(sampleId) : undefined;
  const { L, en } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const [mode, setMode] = useState<ReaderMode>('english');
  const [translationId, setTranslationId] = useState<string | null>(null);
  const [fullTranslationOpen, setFullTranslationOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const completed = useWritingSamplesStore((s) => s.completed);
  const fullTranslationDone = useWritingSamplesStore((s) => sample ? Boolean(s.completed[`${sample.id}:full`]) : false);
  const markRead = useWritingSamplesStore((s) => s.markRead);
  const sampleIndex = sample ? WRITING_SAMPLES.findIndex((item) => item.id === sample.id) : -1;

  useEffect(() => {
    if (sample) markRead(sample.id);
  }, [sample?.id, markRead]);

  useEffect(() => {
    setFullTranslationOpen(false);
    setTranslationId(null);
    setMode('english');
  }, [sample?.id]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? '')) return;
      if (event.key === 'ArrowLeft' && sampleIndex > 0) {
        event.preventDefault();
        router.replace(`/write/samples/${WRITING_SAMPLES[sampleIndex - 1]?.id}` as never);
      } else if (event.key === 'ArrowRight' && sampleIndex >= 0 && sampleIndex < WRITING_SAMPLES.length - 1) {
        event.preventDefault();
        router.replace(`/write/samples/${WRITING_SAMPLES[sampleIndex + 1]?.id}` as never);
      } else if (event.key === 'Escape') {
        router.push('/write/samples' as never);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sampleIndex]);

  const progress = useMemo(() => {
    if (!sample) return { done: 0, total: 0 };
    return {
      done: sample.paragraphs.filter((paragraph) => completed[`${sample.id}:${paragraph.id}`]).length,
      total: sample.paragraphs.length,
    };
  }, [sample, completed]);

  if (!sample) {
    return (
      <Screen>
        <Text className="font-heavy text-pageTitle text-ink">{L('Không tìm thấy bài mẫu', 'Sample not found')}</Text>
        <Text className="mt-2 font-nun text-body text-muted">{L('Bài này không còn trong thư viện.', 'This sample is no longer in the library.')}</Text>
        <Button className="mt-4 self-start" variant="outline" label={L('Về thư viện', 'Back to library')} onPress={() => router.replace('/write/samples' as never)} />
      </Screen>
    );
  }

  const prompt = sample.promptId ? getWritingPromptById(sample.promptId) : undefined;
  const sourceChartData = prompt?.chartData ?? sample.sourceChartData;
  const sourceCharts = sample.sourceCharts ?? prompt?.sourceCharts ?? [];
  const figureWidth = wide ? 320 : Math.max(270, Math.min(width - 64, 500));
  const task1 = sample.task === 'ielts_task1';

  return (
    <Screen>
      <Pressable onPress={() => router.push('/write/samples' as never)} className="mb-3 flex-row items-center gap-1.5 self-start">
        <Icon name="chevron-left" size={16} color="#64748B" />
        <Text className="font-semi text-body text-muted">{L('Thư viện bài mẫu', 'Sample library')}</Text>
      </Pressable>

      <View className="mb-5 flex-row flex-wrap items-end justify-between gap-3 border-b border-[#D9E2E7] pb-4">
        <View className="min-w-0 flex-1">
          <View className="mb-1 flex-row flex-wrap items-center gap-2">
            <View className="rounded-md px-2.5 py-1" style={{ backgroundColor: task1 ? '#E7F0FF' : '#FFF0E5' }}>
              <Text className="font-nun-heavy" style={{ color: task1 ? '#2C5D9D' : '#A9541A', fontSize: 10, letterSpacing: 0.5 }}>
                {task1 ? 'TASK 1' : 'TASK 2'} · {sample.bandLabel ?? `BAND ${sample.band.toFixed(1)}`}
              </Text>
            </View>
            <Text className="font-nun-mid text-label text-muted">{en ? sample.topicEn : sample.topicVi}</Text>
            {sample.sourceName ? <SourceBadge /> : null}
          </View>
          <Text className="font-nun-heavy text-pageTitle text-ink">{sample.title}</Text>
          {sample.sourceUrl ? (
            <Pressable onPress={() => void Linking.openURL(sample.sourceUrl!)} accessibilityRole="link" className="mt-1 self-start">
              <Text className="font-nun-mid text-label" style={{ color: '#567347' }}>{L(`Nguồn: ${sample.sourceName} · mở bài gốc ↗`, `Source: ${sample.sourceName} · open original ↗`)}</Text>
            </Pressable>
          ) : null}
        </View>
        <Button variant="outline" label={L('Mở đề luyện này', 'Practise this prompt')} onPress={() => prompt ? router.push(`/write/${prompt.id}` as never) : router.push('/write/tests' as never)} />
      </View>

      <View className={wide ? 'flex-row items-start gap-5' : 'gap-4'}>
        <View className="gap-4" style={wide ? { width: 330 } : undefined}>
          {sample.sourceEssayType ? (
            <View className="rounded-2xl border border-[#D9E2D7] bg-[#F7F9F5] p-4">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="font-nun-heavy text-[10px]" style={{ color: '#587347', letterSpacing: 0.9 }}>TID · {sample.bandLabel?.toUpperCase() ?? `BAND ${sample.band.toFixed(1)}`} SAMPLE</Text>
                <Text className="font-nun-mid text-label text-muted">#{sample.sourceSampleId}</Text>
              </View>
              <Text className="mt-2 font-nun-heavy text-body text-ink">{sample.sourceEssayType}</Text>
              <View className="mt-3 flex-row gap-2">
                <SourceMetric value={String(sample.sourceWordCount ?? '—')} label={L('từ', 'words')} />
                <SourceMetric value={String(sample.sourceSentenceCount ?? '—')} label={L('câu', 'sentences')} />
                <SourceMetric value={String(sample.paragraphs.length)} label={L('đoạn', 'paragraphs')} />
              </View>
            </View>
          ) : null}

          <View className="overflow-hidden rounded-2xl border border-[#D9E2E7] bg-white">
            <View className="flex-row items-center justify-between border-b border-[#E2E8EB] px-4 py-3" style={{ backgroundColor: '#F5F8F8' }}>
              <Text className="font-nun-heavy text-label text-ink">{L('ĐỀ BÀI', 'WRITING PROMPT')}</Text>
              <Text className="font-nun-mid text-label text-muted">{task1 ? sample.chartKind?.toUpperCase() : '250+ WORDS'}</Text>
            </View>
            <View className="p-4">
              <Text className="font-nun-strong text-body text-ink" style={{ lineHeight: 23 }}>{sample.promptText}</Text>
            </View>
            {sourceChartData ? (
              <View className="items-center border-t border-[#E4EAED] py-3" style={{ backgroundColor: '#F8FAFA' }}>
                <ChartFigure data={sourceChartData} width={figureWidth} />
              </View>
            ) : sourceCharts.length ? (
              <View className="items-center border-t border-[#E4EAED] p-3" style={{ backgroundColor: '#F8FAFA' }}>
                <Task1SourceFigure charts={sourceCharts} english={en} />
              </View>
            ) : null}
          </View>

          <View className="rounded-2xl border border-[#D9E2E7] bg-white p-4">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="font-nun-heavy text-body text-ink">{L('Cấu trúc bài', 'Essay structure')}</Text>
              <Text className="font-nun-mid text-label text-muted">{sample.paragraphs.length} {L('đoạn', 'paragraphs')}</Text>
            </View>
            <View className="mt-3 gap-2.5">
              {sample.paragraphs.map((paragraph, index) => {
                const meta = SECTION_META[paragraph.section];
                const done = Boolean(completed[`${sample.id}:${paragraph.id}`]);
                return (
                  <View key={paragraph.id} className="flex-row items-center gap-2.5">
                    <View className="h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: meta.bg }}>
                      <Text className="font-nun-heavy text-label" style={{ color: meta.color }}>{index + 1}</Text>
                    </View>
                    <Text className="min-w-0 flex-1 font-nun-strong text-label" style={{ color: meta.color }}>{sectionLabel(sample, paragraph, en)}</Text>
                    <Text className="font-nun-mid text-label text-muted">{countWords(paragraph.en)}w</Text>
                    {done ? <Icon name="check" size={14} color="#138256" /> : null}
                  </View>
                );
              })}
            </View>
            <View className="mt-4 border-t border-[#E4EAED] pt-3">
              <Text className="font-nun-mid text-label text-muted">{L(`Tiến độ dịch: ${progress.done}/${progress.total} đoạn`, `Translation progress: ${progress.done}/${progress.total} paragraphs`)}</Text>
              <View className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8EEF0]">
                <View className="h-full rounded-full" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, backgroundColor: '#17756F' }} />
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => setFullTranslationOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: fullTranslationOpen }}
            className="flex-row items-center justify-center gap-2 rounded-xl px-4 py-3.5"
            style={{ backgroundColor: fullTranslationOpen ? '#E9B94E' : '#FFD978' }}
          >
            <Icon name={fullTranslationDone ? 'check' : 'pencil'} size={15} color="#49350D" />
            <Text className="font-nun-heavy text-body" style={{ color: '#49350D' }}>
              {fullTranslationOpen
                ? L('Ẩn phần luyện dịch bài này', 'Hide full-sample translation')
                : fullTranslationDone
                  ? L('Luyện lại bài này · đã hoàn thành', 'Practise again · completed')
                  : L('Luyện dịch bài này (Việt → Anh)', 'Translate this full sample (Vietnamese → English)')}
            </Text>
          </Pressable>
        </View>

        <View className="min-w-0 flex-1 gap-3">
          <ReaderToolbar mode={mode} setMode={setMode} sample={sample} onToggleFullscreen={() => setFullScreen(true)} />
          {fullTranslationOpen ? <FullSampleTranslationDrill sample={sample} /> : null}
          <View className="overflow-hidden rounded-2xl border border-[#D9E2E7] bg-white">
            {sample.paragraphs.map((paragraph, index) => (
              <SampleParagraph
                key={paragraph.id}
                sample={sample}
                paragraph={paragraph}
                mode={mode}
                translating={translationId === paragraph.id}
                onToggleTranslation={() => setTranslationId((active) => active === paragraph.id ? null : paragraph.id)}
              />
            ))}
            <VocabularyPanel sample={sample} />
          </View>
          <View className="flex-row flex-wrap items-center justify-between gap-2 pt-2">
            <Button variant="outline" label={L('← Bài trước', '← Previous')} disabled={sampleIndex <= 0} onPress={() => router.replace(`/write/samples/${WRITING_SAMPLES[sampleIndex - 1]?.id}` as never)} />
            <Button variant="outline" label={L('Bài tiếp →', 'Next →')} disabled={sampleIndex >= WRITING_SAMPLES.length - 1} onPress={() => router.replace(`/write/samples/${WRITING_SAMPLES[sampleIndex + 1]?.id}` as never)} />
          </View>
        </View>
      </View>

      <Modal visible={fullScreen} animationType="fade" onRequestClose={() => setFullScreen(false)} presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: '#F3F6F7', paddingTop: Platform.OS === 'ios' ? 42 : 18, paddingHorizontal: 18, paddingBottom: 16 }}>
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="font-nun-mid text-label text-muted" numberOfLines={1}>{en ? sample.topicEn : sample.topicVi}</Text>
              <Text className="font-nun-heavy text-cardTitle text-ink" numberOfLines={1}>{sample.title}</Text>
            </View>
            <Pressable onPress={() => setFullScreen(false)} accessibilityRole="button" accessibilityLabel={L('Đóng toàn màn hình', 'Exit fullscreen')} className="rounded-lg border border-[#D8E2E5] bg-white px-3 py-2">
              <Text className="font-nun-heavy text-label text-ink">{L('Đóng', 'Close')} ×</Text>
            </Pressable>
          </View>
          <ReaderToolbar mode={mode} setMode={setMode} sample={sample} onToggleFullscreen={() => setFullScreen(false)} />
          <ScrollView className="mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#D9E2E7] bg-white" contentContainerStyle={{ maxWidth: 1040, width: '100%', alignSelf: 'center' }}>
            {sample.paragraphs.map((paragraph) => (
              <SampleParagraph
                key={paragraph.id}
                sample={sample}
                paragraph={paragraph}
                mode={mode}
                translating={translationId === paragraph.id}
                onToggleTranslation={() => setTranslationId((active) => active === paragraph.id ? null : paragraph.id)}
              />
            ))}
            <VocabularyPanel sample={sample} />
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

function SourceBadge() {
  return (
    <View className="rounded-md border border-[#D4DFD4] bg-[#F2F7EF] px-2 py-1">
      <Text className="font-nun-heavy" style={{ color: '#587347', fontSize: 9, letterSpacing: 0.45 }}>TID SOURCE</Text>
    </View>
  );
}

function SourceMetric({ value, label }: { value: string; label: string }) {
  return (
    <View className="min-w-0 flex-1 rounded-lg border border-[#E3E9E0] bg-white px-2.5 py-2">
      <Text className="font-nun-heavy text-body text-ink">{value}</Text>
      <Text className="font-nun-mid text-[10px] text-muted">{label}</Text>
    </View>
  );
}

function sectionLabel(sample: WritingSample, paragraph: WritingSampleParagraph, english: boolean): string {
  const fallback = english ? SECTION_META[paragraph.section].en : SECTION_META[paragraph.section].vi;
  const source = paragraph.sourceSection?.trim();
  if (!source || !sample.sourceName) return fallback;

  const normalized = source.toLocaleLowerCase();
  if (/mở bài|introduction/.test(normalized)) return english ? 'Introduction' : 'Mở bài';
  if (/overview|tổng quan/.test(normalized)) return english ? 'Overview' : 'Tổng quan';
  if (/kết bài|conclusion/.test(normalized)) return english ? 'Conclusion' : 'Kết bài';

  const bodyNumber = source.match(/(?:thân bài|body(?:\s+paragraph)?)\s*(\d+)/i)
    ?? source.match(/details?\s*(\d+)/i)
    ?? source.match(/chi tiết\s*(\d+)/i);
  if (bodyNumber?.[1]) return english ? `Body paragraph ${bodyNumber[1]}` : `Thân bài ${bodyNumber[1]}`;

  const mappedByEnglish = [
    { pattern: /introduction/i, vi: 'Mở bài', en: 'Introduction' },
    { pattern: /overview/i, vi: 'Tổng quan', en: 'Overview' },
    { pattern: /conclusion/i, vi: 'Kết bài', en: 'Conclusion' },
  ].find((entry) => entry.pattern.test(source));
  return mappedByEnglish ? (english ? mappedByEnglish.en : mappedByEnglish.vi) : source;
}

function ReaderToolbar({ mode, setMode, sample, onToggleFullscreen }: { mode: ReaderMode; setMode: (mode: ReaderMode) => void; sample: WritingSample; onToggleFullscreen: () => void }) {
  const { L } = useL();
  const wordCount = sample.sourceWordCount ?? sample.paragraphs.reduce((sum, paragraph) => sum + countWords(paragraph.en), 0);
  const sentenceCount = sample.sourceSentenceCount ?? sample.paragraphs.reduce((sum, paragraph) => sum + countSentences(paragraph.en), 0);
  const buttons: { id: ReaderMode; label: string }[] = [
    { id: 'english', label: L('Tiếng Anh', 'English') },
    { id: 'bilingual', label: L('Song ngữ', 'Bilingual') },
    { id: 'analysis', label: L('Phân tích', 'Analysis') },
    ...(sample.paragraphs.some((paragraph) => paragraph.sourceSentences?.length)
      ? [{ id: 'sentence' as const, label: L('Từng câu', 'By sentence') }]
      : []),
  ];
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D9E2E7] bg-white p-2.5">
      <View className="flex-row flex-wrap gap-1.5">
        {buttons.map((button) => (
          <Pressable
            key={button.id}
            onPress={() => setMode(button.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === button.id }}
            className="rounded-lg px-3 py-2"
            style={{ backgroundColor: mode === button.id ? '#18333D' : '#F3F6F7' }}
          >
            <Text className="font-nun-heavy text-label" style={{ color: mode === button.id ? '#FFFFFF' : '#52626C' }}>{button.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onToggleFullscreen} accessibilityRole="button" accessibilityLabel={L('Mở chế độ toàn màn hình', 'Toggle fullscreen reader')} className="rounded-lg border border-[#D8E2E5] bg-white px-2.5 py-2">
        <Text className="font-nun-heavy text-label text-muted">⤢</Text>
      </Pressable>
      <View className="w-full flex-row flex-wrap items-center justify-between gap-2 border-t border-[#E5EAEC] pt-2">
        <Text className="font-nun-mid text-label text-muted">{sample.paragraphs.length} {L('đoạn', 'paragraphs')} · {sentenceCount} {L('câu', 'sentences')} · {wordCount} words</Text>
        <Text className="font-nun-mid text-label text-muted">{L('Bấm đoạn để xem nghĩa · ← → đổi bài · Esc quay lại', 'Tap a paragraph for meaning · ← → next · Esc back')}</Text>
      </View>
    </View>
  );
}

function SampleParagraph({
  sample,
  paragraph,
  mode,
  translating,
  onToggleTranslation,
}: {
  sample: WritingSample;
  paragraph: WritingSampleParagraph;
  mode: ReaderMode;
  translating: boolean;
  onToggleTranslation: () => void;
}) {
  const { L, en } = useL();
  const meta = SECTION_META[paragraph.section];
  const [showMeaning, setShowMeaning] = useState(false);
  const isTranslated = useWritingSamplesStore((s) => Boolean(s.completed[`${sample.id}:${paragraph.id}`]));
  return (
    <View className="border-b border-[#E4EAED] px-4 py-4 md:px-6 md:py-5">
      <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <View className="rounded-md px-2.5 py-1" style={{ backgroundColor: meta.bg }}>
            <Text className="font-nun-heavy" style={{ color: meta.color, fontSize: 10, letterSpacing: 0.4 }}>{sectionLabel(sample, paragraph, en)}</Text>
          </View>
          <Text className="font-nun-mid text-label text-muted">{countWords(paragraph.en)}w</Text>
        </View>
        <Pressable
          onPress={onToggleTranslation}
          className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
          style={{ borderColor: translating ? '#9ABDB8' : '#D8E2E5', backgroundColor: translating ? '#EDF7F5' : '#FFFFFF' }}
        >
          <Icon name="pencil" size={12} color="#13706C" />
          <Text className="font-nun-heavy text-label" style={{ color: '#13706C' }}>{isTranslated ? L('Luyện lại', 'Translate again') : L('Luyện dịch đoạn này', 'Translate this paragraph')}</Text>
        </Pressable>
      </View>

      {mode !== 'sentence' ? (
        <Pressable accessibilityRole="button" accessibilityLabel={L('Bấm để xem nghĩa tiếng Việt', 'Tap to see the Vietnamese meaning')} onPress={() => setShowMeaning((value) => !value)}>
          <Text style={{ fontFamily: Platform.select({ web: 'Georgia, serif', default: 'serif' }), color: '#172A35', fontSize: 18, lineHeight: 31 }}>
            {paragraph.en}
          </Text>
        </Pressable>
      ) : null}

      {showMeaning && mode === 'english' ? (
        <View className="mt-3 rounded-xl px-3.5 py-3" style={{ backgroundColor: '#F7F5EF' }}>
          <Text className="font-nun text-body text-muted" style={{ lineHeight: 22 }}>{paragraph.vi}</Text>
        </View>
      ) : null}

      {mode === 'bilingual' || mode === 'analysis' ? (
        <View className="mt-3 rounded-xl px-3.5 py-3" style={{ backgroundColor: mode === 'analysis' ? '#F5F8F7' : '#F7F5EF' }}>
          {mode === 'analysis' ? (
            <>
              <Text className="font-nun-heavy text-label" style={{ color: '#55706D' }}>{L('VAI TRÒ CỦA ĐOẠN', 'PARAGRAPH PURPOSE')}</Text>
              <Text className="mt-1 font-nun text-body text-ink" style={{ lineHeight: 22 }}>{paragraph.focusVi}</Text>
              <Text className="mt-3 font-nun-heavy text-label" style={{ color: '#55706D' }}>{L('BẢN DỊCH THAM KHẢO', 'VIETNAMESE REFERENCE')}</Text>
              <Text className="mt-1 font-nun text-body text-muted" style={{ lineHeight: 22 }}>{paragraph.vi}</Text>
            </>
          ) : (
            <Text className="font-nun text-body text-muted" style={{ lineHeight: 22 }}>{paragraph.vi}</Text>
          )}
        </View>
      ) : null}

      {mode === 'sentence' && paragraph.sourceSentences?.length ? (
        <View className="mt-3 gap-2">
          {paragraph.sourceSentences.map((sentence, index) => (
            <View key={`${paragraph.id}-sentence-${index}`} className="rounded-xl border border-[#E0E8E2] bg-[#F8FAF6] px-3.5 py-3">
              <Text className="font-nun-heavy text-[10px]" style={{ color: '#718367' }}>{L(`CÂU ${index + 1}`, `SENTENCE ${index + 1}`)}</Text>
              <Text className="mt-1 font-nun text-body text-ink" style={{ lineHeight: 23 }}>{sentence.en}</Text>
              <Text className="mt-1.5 font-nun text-label text-muted" style={{ lineHeight: 21 }}>{sentence.vi}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {translating ? <TranslationDrill sample={sample} paragraph={paragraph} /> : null}
    </View>
  );
}

function TranslationDrill({ sample, paragraph }: { sample: WritingSample; paragraph: WritingSampleParagraph }) {
  const { L } = useL();
  const key = `${sample.id}:${paragraph.id}`;
  const draft = useWritingSamplesStore((s) => s.drafts[key] ?? '');
  const completed = useWritingSamplesStore((s) => Boolean(s.completed[key]));
  const saveDraft = useWritingSamplesStore((s) => s.saveDraft);
  const markComplete = useWritingSamplesStore((s) => s.markComplete);
  const [showAnswer, setShowAnswer] = useState(completed);
  const score = compareWords(paragraph.en, draft);

  return (
    <View className="mt-4 rounded-xl border border-[#C8DCD9] p-4" style={{ backgroundColor: '#F3F8F7' }}>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View>
          <Text className="font-nun-heavy text-body text-ink">{L('Luyện dịch Việt → Anh', 'Translate Vietnamese → English')}</Text>
          <Text className="mt-0.5 font-nun text-label text-muted">{L('Tự viết trước, rồi mới mở bài mẫu để đối chiếu.', 'Write your version first, then reveal the model to compare.')}</Text>
        </View>
        {completed ? <Text className="font-nun-heavy text-label" style={{ color: '#138256' }}>{L('ĐÃ LUYỆN', 'PRACTISED')}</Text> : null}
      </View>

      <View className="mt-3 rounded-lg border border-[#DFE9E7] bg-white px-3.5 py-3">
        <Text className="font-nun-heavy text-label" style={{ color: '#55706D' }}>{L('DỊCH ĐOẠN NÀY SANG TIẾNG ANH', 'TRANSLATE THIS PARAGRAPH INTO ENGLISH')}</Text>
        <Text className="mt-1.5 font-nun text-body text-ink" style={{ lineHeight: 23 }}>{paragraph.vi}</Text>
      </View>

      <TextInput
        value={draft}
        onChangeText={(text) => saveDraft(key, text)}
        multiline
        textAlignVertical="top"
        placeholder={L('Viết bản dịch của bạn ở đây…', 'Write your translation here…')}
        placeholderTextColor="#87958F"
        className="mt-3 rounded-lg border border-[#CFDCD9] bg-white px-3.5 py-3 font-nun text-body text-ink"
        style={{ minHeight: 132, lineHeight: 23, outlineStyle: 'none' } as object}
        accessibilityLabel={L('Bản dịch của bạn', 'Your translation')}
      />

      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <Button variant="brand" label={showAnswer ? L('Đã mở bài mẫu', 'Model revealed') : L('Đối chiếu bài mẫu', 'Compare with model')} disabled={!draft.trim()} onPress={() => { markComplete(key); setShowAnswer(true); }} />
        {showAnswer ? <Text className="font-nun-heavy text-label" style={{ color: '#176A64' }}>{L(`Trùng ${score}% từ trong bài mẫu`, `${score}% of model words matched`)}</Text> : null}
      </View>

      {showAnswer ? (
        <View className="mt-3 rounded-lg border border-[#DDE9E6] bg-white px-3.5 py-3">
          <Text className="font-nun-heavy text-label" style={{ color: '#55706D' }}>{L('BẢN MẪU TIẾNG ANH', 'ENGLISH MODEL')}</Text>
          <Text className="mt-1.5 font-nun text-body text-ink" style={{ lineHeight: 23 }}>{paragraph.en}</Text>
          <Text className="mt-2 font-nun text-label text-muted">{L('Tỷ lệ trên chỉ đếm từ trùng; không phải điểm IELTS. Có thể có nhiều cách dịch đúng.', 'This percentage only counts matching words; it is not an IELTS score. Other translations may also be correct.')}</Text>
        </View>
      ) : null}
    </View>
  );
}

function FullSampleTranslationDrill({ sample }: { sample: WritingSample }) {
  const { L, en } = useL();
  const key = `${sample.id}:full`;
  const draft = useWritingSamplesStore((s) => s.drafts[key] ?? '');
  const completed = useWritingSamplesStore((s) => Boolean(s.completed[key]));
  const saveDraft = useWritingSamplesStore((s) => s.saveDraft);
  const markComplete = useWritingSamplesStore((s) => s.markComplete);
  const [showAnswer, setShowAnswer] = useState(completed);
  const model = sample.paragraphs.map((paragraph) => paragraph.en).join('\n\n');
  const score = compareWords(model, draft);

  return (
    <View className="rounded-2xl border border-[#E6D5A5] p-4 md:p-5" style={{ backgroundColor: '#FFFBF0' }}>
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-nun-heavy text-body text-ink">{L('Luyện dịch toàn bài · Việt → Anh', 'Full-sample translation · Vietnamese → English')}</Text>
          <Text className="mt-1 font-nun text-label text-muted" style={{ lineHeight: 20 }}>{L('Dịch đủ các đoạn theo thứ tự. Bản mẫu chỉ hiện sau khi bạn viết xong.', 'Translate every paragraph in order. The model stays hidden until you finish your draft.')}</Text>
        </View>
        {completed ? <Text className="font-nun-heavy text-label" style={{ color: '#6D5722' }}>{L('ĐÃ LUYỆN', 'PRACTISED')}</Text> : null}
      </View>

      <View className="mt-3 gap-3 rounded-xl border border-[#EEE5D0] bg-white px-3.5 py-3.5">
        {sample.paragraphs.map((paragraph, index) => (
          <View key={paragraph.id}>
            <Text className="font-nun-heavy text-[10px]" style={{ color: '#8A6A20' }}>{sectionLabel(sample, paragraph, en).toUpperCase()} · {index + 1}</Text>
            <Text className="mt-1 font-nun text-body text-ink" style={{ lineHeight: 23 }}>{paragraph.vi}</Text>
          </View>
        ))}
      </View>

      <TextInput
        value={draft}
        onChangeText={(text) => saveDraft(key, text)}
        multiline
        textAlignVertical="top"
        placeholder={L('Viết bản dịch toàn bài ở đây…', 'Write your full translation here…')}
        placeholderTextColor="#87958F"
        className="mt-3 rounded-xl border border-[#E5D8B8] bg-white px-3.5 py-3 font-nun text-body text-ink"
        style={{ minHeight: 260, lineHeight: 24, outlineStyle: 'none' } as object}
        accessibilityLabel={L('Bản dịch toàn bài của bạn', 'Your full-sample translation')}
      />

      <View className="mt-3 flex-row flex-wrap items-center gap-2.5">
        <Pressable
          onPress={() => { markComplete(key); setShowAnswer(true); }}
          disabled={!draft.trim()}
          className="rounded-lg px-4 py-2.5"
          style={{ backgroundColor: draft.trim() ? '#E5B943' : '#E8E4D9', opacity: draft.trim() ? 1 : 0.7 }}
        >
          <Text className="font-nun-heavy text-label" style={{ color: '#49350D' }}>{showAnswer ? L('Đã mở bài mẫu', 'Model revealed') : L('Nộp bản dịch và đối chiếu', 'Reveal model and compare')}</Text>
        </Pressable>
        {showAnswer ? <Text className="font-nun-heavy text-label" style={{ color: '#75602C' }}>{L(`Trùng ${score}% từ trong bài mẫu`, `${score}% of model words matched`)}</Text> : null}
      </View>

      {showAnswer ? (
        <View className="mt-3 gap-3 rounded-xl border border-[#EEE5D0] bg-white px-3.5 py-3.5">
          <Text className="font-nun-heavy text-label" style={{ color: '#8A6A20' }}>{L('TOÀN BÀI MẪU TIẾNG ANH', 'FULL ENGLISH MODEL')}</Text>
          {sample.paragraphs.map((paragraph) => (
            <View key={paragraph.id}>
              <Text className="font-nun-heavy text-[10px]" style={{ color: '#8A6A20' }}>{sectionLabel(sample, paragraph, en).toUpperCase()}</Text>
              <Text className="mt-1 font-nun text-body text-ink" style={{ lineHeight: 24 }}>{paragraph.en}</Text>
            </View>
          ))}
          <Text className="font-nun text-label text-muted">{L('Tỷ lệ chỉ đếm từ trùng; không phải điểm IELTS. Có thể có nhiều cách dịch đúng.', 'The match percentage only counts shared words; it is not an IELTS score. Other translations may also be correct.')}</Text>
        </View>
      ) : null}
    </View>
  );
}

function VocabularyPanel({ sample }: { sample: WritingSample }) {
  const { L } = useL();
  if (!sample.vocabulary.length) return null;
  return (
    <View className="px-4 py-5 md:px-6" style={{ backgroundColor: '#F5F8F7' }}>
      <View className="flex-row items-center gap-2">
        <Icon name="book" size={16} color="#13706C" />
        <Text className="font-nun-heavy text-body text-ink">{L('Cụm từ đáng học', 'Useful language')}</Text>
      </View>
      <View className="mt-3 gap-2.5">
        {sample.vocabulary.map((item) => (
          <View key={item.phrase} className="rounded-xl border border-[#DDE6E8] bg-white px-3.5 py-3">
            <Text className="font-nun-heavy text-body" style={{ color: '#176A64' }}>{item.phrase}</Text>
            <Text className="mt-0.5 font-nun-strong text-label text-ink">{item.meaningVi}</Text>
            <Text className="mt-1 font-nun text-label text-muted">{item.noteVi}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countSentences(text: string): number {
  return text.trim().split(/[.!?]+(?:[”’"')\]]*)\s+/).filter(Boolean).length;
}

function compareWords(target: string, attempt: string): number {
  const normalise = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9']+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const expected = normalise(target);
  const remaining = new Map<string, number>();
  for (const word of normalise(attempt)) remaining.set(word, (remaining.get(word) ?? 0) + 1);
  let matched = 0;
  for (const word of expected) {
    const count = remaining.get(word) ?? 0;
    if (count > 0) {
      matched += 1;
      remaining.set(word, count - 1);
    }
  }
  return expected.length ? Math.round((matched / expected.length) * 100) : 0;
}
