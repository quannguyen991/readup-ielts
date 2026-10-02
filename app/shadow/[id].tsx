import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Appear, CrossFade } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { GREEN, RED, SpeakButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { AUDIO_NGUON, getLibraryAudio } from '@/data/audio-library';
import { getAudioTranscript } from '@/data/audio-repository';
import {
  alignWords,
  heardWords,
  reachedEnd,
  scoreBand,
  sentenceKey,
  shadowSentences,
  tokenize,
  wordAtChar,
  type Alignment,
  type Token,
  type WordMark,
} from '@/services/shadow/align';
import { canRecognize, speakSentence, startListening, type ListenEnd, type Listening } from '@/services/shadow/speech';
import { useShadowStore } from '@/store/useShadowStore';
import { CoachBubble, CoachToggle } from '@/components/speaking/CoachKit';
import { playSfx } from '@/services/audio/sfx-ui';
import { useVoiceCoach } from '@/services/audio/useVoiceCoach';
import { color } from '@/theme/tokens';
import { useGameStore } from '@/store/useGameStore';
import { Label, Sticker } from '@/components/illust/Sticker';
import { Badge as BadgeSticker, type BadgeIcon } from '@/components/illust/Cute';
import { CuteMic, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { bi, useL, type Bi } from '@/i18n/useL';

const AMBER = '#D97706';
const RATES: readonly { value: number; label: Bi }[] = [
  { value: 0.7, label: { vi: 'Chậm', en: 'Slow' } },
  { value: 0.85, label: { vi: 'Vừa', en: 'Medium' } },
  { value: 1, label: { vi: 'Thường', en: 'Normal' } },
];

/** Nhãn mức điểm khi giao diện ở tiếng Anh (bản tiếng Việt: `scoreBand` trong services/shadow/align). */
const BAND_LABEL_EN: Record<'good' | 'ok' | 'low', string> = {
  good: 'Very clear',
  ok: 'Pretty good',
  low: 'Try that again',
};

const EQ_ID = 'readup-shadow-eq';

/** Cột sóng nhảy khi micro đang nghe — CSS keyframes, trình duyệt tự dừng khi tab ẩn. */
function ensureEqKeyframes() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(EQ_ID)) return;
  const el = document.createElement('style');
  el.id = EQ_ID;
  el.textContent = `@keyframes readup-eq { from { transform: scaleY(0.25); } to { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { [data-eq-bar] { animation: none !important; } }`;
  document.head.appendChild(el);
}

/**
 * ĐỌC THEO một bài VOA: nghe giọng mẫu (chữ chạy theo kiểu karaoke) → bấm micro
 * đọc lại → máy tô từng từ: xanh là nghe rõ, cam là gần đúng, đỏ là hụt.
 * Điểm cao nhất của từng câu được giữ lại (`useShadowStore`).
 */
export default function ShadowLesson() {
  const { L, locale } = useL();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const meta = useMemo(() => getLibraryAudio(id), [id]);
  const sentences = useMemo(() => {
    const t = meta ? getAudioTranscript({ id: meta.id, chunk: meta.chunk }) : null;
    return t ? shadowSentences(t.paragraphs) : [];
  }, [meta]);
  const keys = useMemo(() => sentences.map(sentenceKey), [sentences]);
  const best = useShadowStore((s) => s.best[id]);
  const record = useShadowStore((s) => s.record);

  const [supported] = useState(canRecognize);
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState(0.85);
  const [speaking, setSpeaking] = useState(false);
  const [karaoke, setKaraoke] = useState(-1);
  const [phase, setPhase] = useState<'idle' | 'listening' | 'result'>('idle');
  const [heard, setHeard] = useState('');
  const [live, setLive] = useState<WordMark[] | null>(null);
  const [result, setResult] = useState<Alignment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [session, setSession] = useState<Record<number, number>>({});
  const [sessionMissed, setSessionMissed] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState(false);

  const coach = useVoiceCoach();
  const listenRef = useRef<Listening | null>(null);
  // Mỗi lượt nghe một số hiệu: đổi câu giữa chừng thì kết quả muộn của lượt cũ bị bỏ qua.
  const turnRef = useRef(0);
  const heardRef = useRef('');
  const capRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);

  const sentence = sentences[index] ?? '';
  const tokens = useMemo(() => tokenize(sentence), [sentence]);

  useEffect(ensureEqKeyframes, []);
  useEffect(
    () => () => {
      turnRef.current += 1;
      listenRef.current?.stop();
      stopVoiceRef.current?.();
      if (capRef.current) clearTimeout(capRef.current);
    },
    [],
  );

  const stopVoice = () => {
    stopVoiceRef.current?.();
    stopVoiceRef.current = null;
    setSpeaking(false);
    setKaraoke(-1);
  };

  const playModel = () => {
    if (!sentence || phase === 'listening') return;
    coach.stop();
    stopVoice();
    setSpeaking(true);
    setKaraoke(0);
    stopVoiceRef.current = speakSentence(sentence, {
      rate,
      onChar: (c) => setKaraoke(wordAtChar(tokens, c)),
      onDone: () => {
        setSpeaking(false);
        setKaraoke(-1);
      },
    });
  };

  const finishListening = (reason: ListenEnd) => {
    listenRef.current = null;
    if (capRef.current) clearTimeout(capRef.current);
    const text = heardRef.current;
    playSfx('micStop');
    if (reason === 'denied') {
      setNotice(
        L('Hãy cho phép Micro ở biểu tượng ổ khoá trên thanh địa chỉ rồi thử lại.', 'Allow the microphone via the lock icon in the address bar, then retry.'),
      );
      setPhase('idle');
      setLive(null);
      return;
    }
    if (!text) {
      setNotice(
        reason === 'no-speech'
          ? L(
              'Chưa nghe thấy gì — bấm micro rồi đọc to, rõ hơn một chút nhé.',
              "Didn't hear anything — tap the mic and read a little louder and clearer.",
            )
          : L('Micro gặp trục trặc. Thử lại nhé.', 'The mic ran into a problem. Please try again.'),
      );
      setPhase('idle');
      setLive(null);
      return;
    }
    const a = alignWords(tokens, heardWords(text), true);
    const missed = [...new Set(tokens.filter((_, i) => a.marks[i] === 'miss').map((t) => t.norm))];
    setResult(a);
    setLive(null);
    setPhase('result');
    record(id, keys[index]!, a.score, missed);
    setSession((s) => ({ ...s, [index]: Math.max(s[index] ?? 0, a.score) }));
    setSessionMissed((m) => {
      const out = { ...m };
      for (const w of missed) out[w] = (out[w] ?? 0) + 1;
      return out;
    });
    // Game khi học: đọc theo đạt từ 60 điểm là một đòn trúng — kèm tiếng chém.
    useGameStore.getState().answer(a.score >= 60, 'shadow');
    // Huấn luyện viên giọng nói: nhận xét bằng lời (không tự bật micro lại).
    const near = [...new Set(tokens.filter((_, i) => a.marks[i] === 'near').map((t) => t.norm))];
    coach.feedback({ score: a.score, missed, near, sentence });
  };

  const startMic = () => {
    if (!supported || !sentence || phase === 'listening') return;
    // Huấn luyện viên và giọng mẫu phải IM hẳn trước khi micro mở, kẻo micro nghe lại chính giọng máy.
    coach.stop();
    stopVoice();
    setNotice(null);
    setResult(null);
    setHeard('');
    heardRef.current = '';
    setLive(tokens.map(() => 'pending'));
    turnRef.current += 1;
    const turn = turnRef.current;
    const l = startListening({
      onText: (text, final) => {
        if (turn !== turnRef.current) return;
        heardRef.current = text;
        setHeard(text);
        const a = alignWords(tokens, heardWords(text), false);
        setLive(a.marks);
        // Đọc tới cuối câu và máy đã chốt kết quả: tự dừng, khỏi phải bấm.
        if (final && reachedEnd(a.marks)) listenRef.current?.stop();
      },
      onEnd: (reason) => {
        if (turn === turnRef.current) finishListening(reason);
      },
    });
    if (!l) {
      setNotice(L('Không mở được micro trên trình duyệt này.', "Couldn't open the mic in this browser."));
      setLive(null);
      return;
    }
    listenRef.current = l;
    playSfx('micStart');
    setPhase('listening');
    // Chốt chặn: câu N từ thì nghe tối đa 4 giây + 0,8 giây mỗi từ.
    capRef.current = setTimeout(() => listenRef.current?.stop(), 4000 + tokens.length * 800);
  };

  const stopMic = () => listenRef.current?.stop();

  const go = (i: number) => {
    if (i < 0 || i >= sentences.length) return;
    turnRef.current += 1;
    if (capRef.current) clearTimeout(capRef.current);
    listenRef.current?.stop();
    listenRef.current = null;
    coach.reset();
    stopVoice();
    setIndex(i);
    setPhase('idle');
    setResult(null);
    setLive(null);
    setHeard('');
    setNotice(null);
    setSummary(false);
  };

  const next = () => {
    if (index + 1 < sentences.length) {
      playSfx('next');
      go(index + 1);
    } else {
      playSfx('success');
      stopVoice();
      setSummary(true);
    }
  };

  useHotkeys((e) => {
    if (summary) return;
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      playModel();
    } else if ((e.key === 'm' || e.key === 'M') && supported) {
      e.preventDefault();
      if (phase === 'listening') stopMic();
      else startMic();
    } else if (e.key === 'Enter' && (phase === 'result' || !supported)) {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowRight') go(index + 1);
    else if (e.key === 'ArrowLeft') go(index - 1);
  });

  if (!meta || sentences.length === 0) {
    return (
      <StudyFrame backHref="/shadow" title={L('Đọc theo', 'Shadowing')}>
        <StudyCard>
          <View aria-hidden className="mb-3">
            <Motion kind="wobble">
              <Sticker tilt={-6}>
                <CuteMic size={56} />
              </Sticker>
            </Motion>
          </View>
          <Text className="font-strong text-cardTitle text-ink">{L('Không mở được bài này.', "Couldn't open this lesson.")}</Text>
          <Button className="mt-4 self-start" label={L('Chọn bài khác', 'Pick another lesson')} onPress={() => router.replace('/shadow' as never)} />
        </StudyCard>
      </StudyFrame>
    );
  }

  const marks = phase === 'result' && result ? result.marks : live;
  const done = keys.filter((k) => best?.[k] !== undefined).length;

  return (
    <StudyFrame
      backHref="/shadow"
      title={L('Đọc theo', 'Shadowing')}
      battle
      right={
        <Text className="font-strong text-body" style={{ color: color.primary }}>
          {index + 1}/{sentences.length}
        </Text>
      }
      footer={L(
        `${meta.program} · ${meta.level} · đã đọc ${done}/${sentences.length} câu`,
        `${meta.program} · ${meta.level} · ${done}/${sentences.length} sentences read`,
      )}
    >
      <Dots scores={keys.map((k) => best?.[k])} index={index} onPick={go} />

      <CrossFade swapKey={summary ? 'sum' : `s-${index}`}>
        {summary ? (
          <Summary
            title={meta.title}
            session={session}
            total={sentences.length}
            missed={sessionMissed}
            onRestart={() => {
              setSession({});
              setSessionMissed({});
              go(0);
            }}
          />
        ) : (
          <StudyCard>
            <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted" numberOfLines={1}>
              {meta.title}
            </Text>

            <View className="mt-4">
              <Karaoke sentence={sentence} tokens={tokens} marks={marks} karaoke={speaking ? karaoke : -1} />
            </View>

            <View className="mt-6 flex-row flex-wrap items-center gap-2">
              <Button
                variant={speaking ? 'brand' : 'outline'}
                iconLeft="volume"
                label={speaking ? L('Đang đọc mẫu…', 'Playing model…') : L('Nghe mẫu', 'Hear model')}
                onPress={speaking ? stopVoice : playModel}
              />
              <View className="flex-row rounded-pill p-1" style={{ backgroundColor: '#F9F6F1' }}>
                {RATES.map((r) => {
                  const on = r.value === rate;
                  return (
                    <Pressable
                      key={r.value}
                      onPress={() => setRate(r.value)}
                      className="rounded-pill px-3 py-1.5"
                      style={{ backgroundColor: on ? '#FFFFFF' : 'transparent' }}
                    >
                      <Text className="font-semi text-label" style={{ color: on ? color.primary : '#64748B' }}>
                        {bi(r.label, locale)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {supported ? <View className="mt-3 flex-row"><CoachToggle /></View> : null}

            {supported ? (
              <View className="mt-6 items-center">
                <MicButton listening={phase === 'listening'} onPress={phase === 'listening' ? stopMic : startMic} />
                <Text className="mt-2 font-sans text-label text-muted">
                  {phase === 'listening'
                    ? L('Đang nghe… đọc xong máy tự dừng (hoặc bấm để dừng)', 'Listening… stops automatically when you finish (or tap to stop)')
                    : L('Bấm micro rồi đọc to câu trên · phím M', 'Tap the mic and read the sentence aloud · key M')}
                </Text>
                {phase === 'listening' && heard ? (
                  <Text className="mt-2 text-center font-sans text-body" style={{ color: '#475569' }}>
                    “{heard}”
                  </Text>
                ) : null}
              </View>
            ) : (
              <View className="mt-6 rounded-2xl p-4" style={{ backgroundColor: '#FFF7ED' }}>
                <Text className="font-sans text-body" style={{ color: '#9A3412', lineHeight: 22 }}>
                  {L('Trình duyệt này không chấm giọng được. Mở bằng Chrome/Edge để được chấm.', 'This browser can\'t score speech. Use Chrome or Edge.')}
                </Text>
              </View>
            )}

            <CoachBubble coach={coach} />

            {notice ? (
              <Appear>
                <Text className="mt-4 text-center font-semi text-body" style={{ color: '#B45309' }}>
                  {notice}
                </Text>
              </Appear>
            ) : null}

            {phase === 'result' && result ? (
              <ResultPanel result={result} heard={heard} tokens={tokens} onRetry={startMic} onNext={next} last={index + 1 >= sentences.length} />
            ) : !supported ? (
              <Button className="mt-5 self-end" label={index + 1 >= sentences.length ? L('Xong bài', 'Finish') : L('Câu tiếp', 'Next sentence')} iconRight="arrow-right" onPress={next} />
            ) : null}
          </StudyCard>
        )}
      </CrossFade>

      <Text className="mt-4 text-center font-sans text-label text-muted">
        {L(
          'Space: nghe mẫu · M: đọc · Enter: câu tiếp · ← →: đổi câu',
          'Space: hear model · M: read · Enter: next sentence · ← →: switch sentence',
        )}
      </Text>
      <Text className="mt-2 text-center font-sans text-label text-muted" style={{ lineHeight: 19 }}>
        {L(
          `Lời bài: ${AUDIO_NGUON.ten} (${AUDIO_NGUON.trang}), phạm vi công cộng.`,
          `Transcript: ${AUDIO_NGUON.ten} (${AUDIO_NGUON.trang}), public domain.`,
        )}{' '}
        <Text className="font-semi text-primary-600" onPress={() => router.push(`/sentence/listen?a=${meta.id}` as never)}>
          {L('Nghe cả bài gốc', 'Listen to the full original')}
        </Text>
      </Text>
    </StudyFrame>
  );
}

function markColor(m: WordMark | undefined): string {
  if (m === 'hit') return GREEN;
  if (m === 'near') return AMBER;
  if (m === 'miss') return RED;
  if (m === 'pending' || m === 'skip') return '#94A3B8';
  return color.ink;
}

/** Câu hiển thị từng từ: chạy sáng theo giọng mẫu, hoặc tô màu theo kết quả đọc. */
function Karaoke({ sentence, tokens, marks, karaoke }: { sentence: string; tokens: Token[]; marks: WordMark[] | null; karaoke: number }) {
  const parts: React.ReactNode[] = [];
  let pos = 0;
  tokens.forEach((t, i) => {
    if (t.start > pos) parts.push(sentence.slice(pos, t.start));
    const m = marks?.[i];
    const current = !marks && i === karaoke;
    const ahead = !marks && karaoke >= 0 && i > karaoke;
    parts.push(
      <Text
        key={i}
        style={{
          color: current ? color.primary : ahead ? '#94A3B8' : markColor(m),
          backgroundColor: current ? '#F9F2E6' : m === 'miss' ? '#FFF1F2' : 'transparent',
          borderRadius: 8,
          textDecorationLine: m === 'miss' ? 'underline' : 'none',
          ...(Platform.OS === 'web' ? ({ transition: 'color 180ms ease, background-color 180ms ease' } as object) : null),
        }}
      >
        {sentence.slice(t.start, t.end)}
      </Text>,
    );
    pos = t.end;
  });
  if (pos < sentence.length) parts.push(sentence.slice(pos));
  return (
    // Màn hẹp chữ nhỏ lại để câu dài không đẩy nút micro xuống khỏi màn hình.
    <Text className="font-heavy text-[21px] leading-[33px] text-ink md:text-[27px] md:leading-[42px]">{parts}</Text>
  );
}

function MicButton({ listening, onPress }: { listening: boolean; onPress: () => void }) {
  const { L } = useL();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={listening ? L('Dừng nghe', 'Stop listening') : L('Bấm để đọc', 'Tap to read')}
      onPress={onPress}
      className="h-20 w-20 items-center justify-center rounded-pill"
      style={{
        backgroundColor: listening ? RED : color.primary,
        ...(Platform.OS === 'web'
          ? ({
              boxShadow: listening
                ? '0 0 0 10px rgba(225,29,72,0.14), 0 14px 30px rgba(225,29,72,0.35)'
                : '0 6px 0 #9A7739, 0 16px 30px rgba(205, 164, 94,0.35)',
              transition: 'box-shadow 200ms ease, background-color 200ms ease',
            } as object)
          : null),
      }}
    >
      {listening ? (
        <View className="flex-row items-center gap-1" style={{ height: 30 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              {...({ dataSet: { eqBar: '1' } } as object)}
              style={{
                width: 4,
                height: 28,
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
                ...(Platform.OS === 'web'
                  ? ({
                      animationName: 'readup-eq',
                      animationDuration: `${0.45 + (i % 3) * 0.12}s`,
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite',
                      animationDirection: 'alternate',
                      animationDelay: `${i * 0.09}s`,
                    } as object)
                  : null),
              }}
            />
          ))}
        </View>
      ) : (
        <Icon name="mic" size={32} color="#FFFFFF" />
      )}
    </Pressable>
  );
}

function ResultPanel({
  result,
  heard,
  tokens,
  onRetry,
  onNext,
  last,
}: {
  result: Alignment;
  heard: string;
  tokens: Token[];
  onRetry: () => void;
  onNext: () => void;
  last: boolean;
}) {
  const { L, en } = useL();
  const band = scoreBand(result.score);
  const tone = band.tone === 'good' ? GREEN : band.tone === 'ok' ? AMBER : RED;
  const missed = [...new Map(tokens.filter((_, i) => result.marks[i] === 'miss').map((t) => [t.norm, t.text])).values()];
  return (
    <Appear>
      <View className="mt-6 rounded-2xl p-4" style={{ backgroundColor: '#FCFBF8' }}>
        <View className="flex-row flex-wrap items-center gap-4">
          <View
            className="h-20 w-20 items-center justify-center rounded-pill bg-white"
            style={{ borderWidth: 6, borderColor: tone }}
          >
            <Text className="font-heavy text-sectionTitle" style={{ color: tone }}>
              {result.score}
            </Text>
          </View>
          <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
            <View className="flex-row items-center gap-2">
              <View aria-hidden>
                <BadgeSticker icon={band.tone === 'good' ? 'star' : band.tone === 'ok' ? 'check' : 'refresh'} color={tone} size={24} />
              </View>
              <Text className="min-w-0 flex-1 font-heavy text-cardTitle" style={{ color: tone }}>
                {en ? BAND_LABEL_EN[band.tone] : band.label}
              </Text>
            </View>
            <Text className="mt-1 font-sans text-body text-muted">
              {L(`Máy nghe rõ ${result.hits}/${result.counted} từ`, `Clearly heard ${result.hits}/${result.counted} words`)}
              {result.nears ? L(`, ${result.nears} từ gần đúng`, `, ${result.nears} nearly right`) : ''}
              {result.counted < tokens.length
                ? L(' · tên riêng máy không nghe ra thì không tính', " · names the recogniser can't catch aren't counted")
                : ''}
              .
            </Text>
            <Text className="mt-1 font-sans text-body" style={{ color: '#475569' }}>
              {L(`Máy nghe được: “${heard}”`, `What it heard: “${heard}”`)}
            </Text>
          </View>
        </View>
        {missed.length ? (
          <View className="mt-4">
            <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">
              {L('Từ đọc hụt — nghe lại từng từ', 'Missed words — listen to each one')}
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {missed.map((w) => (
                <View key={w} className="flex-row items-center gap-1 rounded-pill bg-white py-1 pl-3 pr-1" style={{ borderWidth: 1, borderColor: '#FECDD3' }}>
                  <Text className="font-semi text-body" style={{ color: RED }}>
                    {w}
                  </Text>
                  <SpeakButton text={w} rate={0.7} size={16} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <View className="mt-4 flex-row flex-wrap justify-end gap-2">
          <Button variant="outline" iconLeft="refresh" label={L('Đọc lại', 'Read again')} onPress={onRetry} />
          <Button label={last ? L('Xem tổng kết', 'See summary') : L('Câu tiếp', 'Next sentence')} iconRight="arrow-right" onPress={onNext} />
        </View>
      </View>
    </Appear>
  );
}

/** Dải chấm: mỗi chấm một câu, màu theo điểm cao nhất; bấm để nhảy tới câu đó. */
function Dots({ scores, index, onPick }: { scores: (number | undefined)[]; index: number; onPick: (i: number) => void }) {
  const { L } = useL();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row items-center gap-1.5 py-1">
        {scores.map((s, i) => {
          const fill = s === undefined ? 'rgba(255,255,255,0.75)' : s >= 85 ? GREEN : s >= 60 ? '#F59E0B' : '#FB7185';
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={L(
                `Câu ${i + 1}${s !== undefined ? `, ${s} điểm` : ''}`,
                `Sentence ${i + 1}${s !== undefined ? `, ${s} points` : ''}`,
              )}
              onPress={() => onPick(i)}
              hitSlop={4}
              style={{
                width: i === index ? 22 : 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: fill,
                borderWidth: i === index ? 2 : 0,
                borderColor: color.primary,
                ...(Platform.OS === 'web' ? ({ transition: 'width 200ms ease' } as object) : null),
              }}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

function Summary({
  title,
  session,
  total,
  missed,
  onRestart,
}: {
  title: string;
  session: Record<number, number>;
  total: number;
  missed: Record<string, number>;
  onRestart: () => void;
}) {
  const { L } = useL();
  const scores = Object.values(session);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const clear = scores.filter((s) => s >= 85).length;
  const top = Object.entries(missed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  return (
    <StudyCard>
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">{L('Xong bài', 'Lesson done')}</Text>
          <Text className="mt-1 font-heavy text-pageTitle text-ink">{title}</Text>
        </View>
        <View aria-hidden className="flex-row items-end">
          <Motion kind="float">
            <Sticker tilt={-8}>
              <CuteMic size={44} />
            </Sticker>
          </Motion>
          <Motion kind="wobble" delay={0.3}>
            <Sticker tilt={8}>
              <CuteTrophy size={58} />
            </Sticker>
          </Motion>
        </View>
      </View>
      {scores.length ? (
        <View aria-hidden className="mt-3">
          <Label
            text={
              avg >= 85
                ? L('Đọc rất rõ 🏆', 'Very clear reading 🏆')
                : avg >= 60
                  ? L('Khá lắm ⭐', 'Nice work ⭐')
                  : L('Luyện tiếp nhé 💪', 'Keep practising 💪')
            }
            color={avg >= 85 ? '#22A06B' : avg >= 60 ? '#A8843F' : '#F0703F'}
            ink="#FFFFFF"
            tilt={-4}
            size={12}
          />
        </View>
      ) : null}
      <View className="mt-5 flex-row flex-wrap gap-3">
        <Stat value={`${scores.length}/${total}`} label={L('câu đã đọc lượt này', 'sentences read this round')} icon="check" tint="#A8843F" />
        <Stat value={scores.length ? String(avg) : '—'} label={L('điểm trung bình', 'average score')} icon="target" tint="#F2B632" />
        <Stat value={String(clear)} label={L('câu đọc rất rõ (≥ 85)', 'very clear sentences (≥ 85)')} icon="star" tint="#22A06B" />
      </View>
      {top.length ? (
        <View className="mt-5">
          <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">
            {L('Từ hay hụt nhất lượt này', 'Most-missed words this round')}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {top.map(([w, n]) => (
              <View key={w} className="flex-row items-center gap-1 rounded-pill bg-white py-1 pl-3 pr-1" style={{ borderWidth: 1, borderColor: '#F0EBE2' }}>
                <Text className="font-semi text-body text-ink">
                  {w} <Text className="text-muted">×{n}</Text>
                </Text>
                <SpeakButton text={w} rate={0.7} size={16} />
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <View className="mt-6 flex-row flex-wrap gap-2">
        <Button iconLeft="refresh" label={L('Đọc lại từ đầu', 'Start over')} onPress={onRestart} />
        <Button variant="outline" label={L('Chọn bài khác', 'Pick another lesson')} onPress={() => router.replace('/shadow' as never)} />
      </View>
    </StudyCard>
  );
}

function Stat({ value, label, icon, tint }: { value: string; label: string; icon: BadgeIcon; tint: string }) {
  return (
    <View className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#F9F6F1', flexGrow: 1, flexShrink: 1, flexBasis: 150 }}>
      <View className="flex-row items-center gap-2">
        <View aria-hidden>
          <BadgeSticker icon={icon} color={tint} size={26} />
        </View>
        <Text className="font-heavy text-sectionTitle text-ink">{value}</Text>
      </View>
      <Text className="mt-0.5 font-sans text-label text-muted">{label}</Text>
    </View>
  );
}
