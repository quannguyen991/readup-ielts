import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { AudioCard } from './AudioPanel';
import { SECTION_COLOR } from './cover';
import { useSectionAudio } from './useSectionAudio';
import { TappableSentence } from '@/components/lookup/TapWord';
import { Button, Icon } from '@/components/ui';
import { formatBand } from '@/lib/band';
import { bandFromScore, type QuestionResult } from '@/services/listening/scoring';
import type { ListeningSection } from '@/services/listening/types';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Kết quả: điểm + band xấp xỉ, đối chiếu từng câu, rồi MỞ bản chữ (chữ chạy theo
 * giọng nếu có mốc thời gian) — chạm vào từ để tra và lưu vào Sổ từ.
 */
export function ListeningResults({
  testTitle, sections, score, total, results, mode, durationSec, onRetry, onLibrary,
}: {
  testTitle: string;
  sections: ListeningSection[];
  score: number;
  total: number;
  results: QuestionResult[];
  mode: 'practice' | 'real';
  durationSec: number;
  onRetry: () => void;
  onLibrary: () => void;
}) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const [onlyWrong, setOnlyWrong] = useState(false);
  const band = bandFromScore(score, total);
  const unanswered = results.filter((r) => !r.userText).length;
  const shown = onlyWrong ? results.filter((r) => !r.correct) : results;

  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
      <View style={{ flex: wide ? 1 : undefined, width: '100%', minWidth: 0 }}>
        <View className="rounded-card border border-border bg-surface p-5">
          <Text className="font-mid text-label text-muted">{testTitle}</Text>
          <View className="mt-2 flex-row flex-wrap items-end gap-x-6 gap-y-2">
            <View>
              <Text className="font-heavy text-ink" style={{ fontSize: 44, lineHeight: 48 }}>
                {score}
                <Text className="font-strong text-muted" style={{ fontSize: 22 }}>/{total}</Text>
              </Text>
              <Text className="font-sans text-label text-muted">{L('câu đúng', 'correct')}</Text>
            </View>
            <View>
              <Text className="font-heavy" style={{ fontSize: 34, lineHeight: 40, color: color.primary }}>~{formatBand(band)}</Text>
              <Text className="font-sans text-label text-muted">
                {total === 40 ? L('Band xấp xỉ', 'Approx. band') : L('Band xấp xỉ (quy ra 40 câu)', 'Approx. band (scaled to 40)')}
              </Text>
            </View>
            <View>
              <Text className="font-strong text-ink" style={{ fontSize: 16 }}>{Math.max(1, Math.round(durationSec / 60))} {L('phút', 'min')}</Text>
              <Text className="font-sans text-label text-muted">{mode === 'real' ? L('Thi thật', 'Real test') : L('Luyện tập', 'Practice')}</Text>
            </View>
          </View>
          {unanswered > 0 ? (
            <Text className="mt-3 font-sans text-label" style={{ color: '#B26A00' }}>
              {L(`${unanswered} câu bỏ trống.`, `${unanswered} unanswered.`)}
            </Text>
          ) : null}
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button label={L('Luyện lại', 'Try again')} iconLeft="refresh" onPress={onRetry} />
            <Button label={L('Thư viện', 'Library')} variant="outline" iconLeft="list" onPress={onLibrary} />
            <Button label={L('Sổ từ', 'Word book')} variant="outline" iconLeft="bookmark" onPress={() => router.push('/vocabulary' as never)} />
          </View>
        </View>

        <View className="mt-4 rounded-card border border-border bg-surface p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-heavy text-ink" style={{ fontSize: 16 }}>{L('Đối chiếu từng câu', 'Answer review')}</Text>
            <Pressable accessibilityRole="button" onPress={() => setOnlyWrong((v) => !v)} className="rounded-pill border px-3 py-1.5" style={{ borderColor: onlyWrong ? color.primary : color.borderStrong, backgroundColor: onlyWrong ? '#FBF7EE' : '#FFFFFF' }}>
              <Text className="font-strong" style={{ fontSize: 12, color: onlyWrong ? color.primary : color.muted }}>{L('Chỉ câu sai', 'Wrong only')}</Text>
            </Pressable>
          </View>
          {shown.length === 0 ? (
            <Text className="py-4 text-center font-sans text-body text-muted">{L('Không có câu sai. Tuyệt!', 'No wrong answers. Great!')}</Text>
          ) : (
            shown.map((r) => <ReviewRow key={r.n} r={r} />)
          )}
        </View>
      </View>

      <View style={{ flex: wide ? 1.15 : undefined, width: '100%', minWidth: 0 }}>
        <TranscriptPanel sections={sections} />
      </View>
    </View>
  );
}

function ReviewRow({ r }: { r: QuestionResult }) {
  const { L } = useL();
  const partial = !r.correct && r.got > 0;
  const tone = r.correct ? '#16A34A' : partial ? '#F59E0B' : '#F04438';
  const label = r.span > 1 ? `${r.n}-${r.n + r.span - 1}` : String(r.n);
  return (
    <View className="flex-row items-start gap-3 border-t border-border py-2.5">
      <View style={{ minWidth: 34, height: 28, paddingHorizontal: 6, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: tone }}>
        <Text className="font-heavy" style={{ fontSize: 12, color: '#FFFFFF' }}>{label}</Text>
      </View>
      <View className="min-w-0 flex-1">
        {r.prompt ? <Text className="font-sans text-label text-muted" numberOfLines={2}>{r.prompt}</Text> : null}
        <Text className="font-strong" style={{ fontSize: 14, color: r.correct ? '#0F7A38' : '#C0362B', textDecorationLine: r.correct || !r.userText ? 'none' : 'line-through' }}>
          {r.userText || L('(bỏ trống)', '(blank)')}
        </Text>
        {!r.correct ? (
          <Text className="font-strong" style={{ fontSize: 14, color: '#0F7A38' }}>
            {L('Đáp án', 'Answer')}: {r.expectedText}
            {r.accepted.length ? <Text className="font-sans text-muted" style={{ fontSize: 12 }}> · {L('cũng nhận', 'also accepted')}: {r.accepted.join(', ')}</Text> : null}
          </Text>
        ) : null}
        {r.span > 1 ? <Text className="font-sans text-muted" style={{ fontSize: 12 }}>{r.got}/{r.span}</Text> : null}
      </View>
      <Icon name={r.correct ? 'check' : 'close'} size={16} color={tone} strokeWidth={2.4} />
    </View>
  );
}

function TranscriptPanel({ sections }: { sections: ListeningSection[] }) {
  const { L } = useL();
  const [idx, setIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const section = (sections[idx] ?? sections[0]) as ListeningSection;
  const audio = useSectionAudio({ src: section.audio, transcript: section.transcript, speed });
  const scroller = useRef<ScrollView>(null);
  const ys = useRef<Record<number, number>>({});

  useEffect(() => {
    if (audio.status !== 'playing' || audio.activeLine < 0) return;
    const y = ys.current[audio.activeLine];
    if (y !== undefined) scroller.current?.scrollTo({ y: Math.max(0, y - 70), animated: true });
  }, [audio.activeLine, audio.status]);

  const lines = useMemo(() => section.transcript, [section]);

  return (
    <View style={{ gap: 12 }}>
      {sections.length > 1 ? (
        <View className="flex-row gap-1.5">
          {sections.map((s, i) => (
            <Pressable
              key={s.n}
              accessibilityRole="tab"
              aria-selected={i === idx}
              onPress={() => setIdx(i)}
              className="rounded-pill px-3.5 py-1.5"
              style={{ backgroundColor: i === idx ? SECTION_COLOR[s.n] : '#F5F1E9' }}
            >
              <Text className="font-strong" style={{ fontSize: 12, color: i === idx ? '#FFFFFF' : color.muted }}>Section {s.n}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <AudioCard audio={audio} real={false} speed={speed} onSpeed={setSpeed} title={`Section ${section.n} — ${section.title}`} />

      <View className="rounded-card border border-border bg-surface p-4">
        <Text className="font-heavy text-ink" style={{ fontSize: 16 }}>Transcript</Text>
        <Text className="mb-2 mt-0.5 font-sans text-label text-muted">
          {L('Chạm vào một từ để tra nghĩa và lưu vào Sổ từ.', 'Tap any word to look it up and save it to your word book.')}
          {audio.synced ? '' : ` ${L('(Bản này chưa có mốc thời gian nên chữ không chạy theo giọng.)', '(No timestamps yet, so the text will not follow the audio.)')}`}
        </Text>
        <ScrollView ref={scroller} style={{ maxHeight: 460 }} nestedScrollEnabled showsVerticalScrollIndicator>
          {lines.map((l, i) => {
            const on = i === audio.activeLine;
            return (
              <View
                key={i}
                onLayout={(e) => {
                  ys.current[i] = e.nativeEvent.layout.y;
                }}
                className="mb-1.5 flex-row items-start gap-2 rounded-panel px-2.5 py-2"
                style={{ backgroundColor: on ? '#F8EBC8' : 'transparent' }}
              >
                <Pressable accessibilityRole="button" accessibilityLabel={L('Nghe câu này', 'Play this line')} onPress={() => audio.seekLine(i)} style={{ paddingTop: 3 }}>
                  <Icon name="play" size={14} color={on ? color.primary : color.subtle} />
                </Pressable>
                <View className="min-w-0 flex-1">
                  {l.speaker ? <Text className="font-strong" style={{ fontSize: 11, color: color.primary, letterSpacing: 0.4 }}>{l.speaker.toUpperCase()}</Text> : null}
                  <TappableSentence text={l.text} source={L('Listening', 'Listening')} className="font-sans text-body text-ink" />
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
