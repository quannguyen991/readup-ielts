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
import { color } from '@/theme/tokens';
import { useGameStore } from '@/store/useGameStore';

const AMBER = '#D97706';
const RATES = [
  { value: 0.7, label: 'Chậm' },
  { value: 0.85, label: 'Vừa' },
  { value: 1, label: 'Thường' },
] as const;

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
    if (reason === 'denied') {
      setNotice('Trình duyệt chưa cho dùng micro. Bấm biểu tượng ổ khoá cạnh thanh địa chỉ, cho phép Micro rồi thử lại.');
      setPhase('idle');
      setLive(null);
      return;
    }
    if (!text) {
      setNotice(reason === 'no-speech' ? 'Chưa nghe thấy gì — bấm micro rồi đọc to, rõ hơn một chút nhé.' : 'Micro gặp trục trặc. Thử lại nhé.');
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
  };

  const startMic = () => {
    if (!supported || !sentence || phase === 'listening') return;
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
      setNotice('Không mở được micro trên trình duyệt này.');
      setLive(null);
      return;
    }
    listenRef.current = l;
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
    if (index + 1 < sentences.length) go(index + 1);
    else {
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
      <StudyFrame backHref="/shadow" title="Đọc theo">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">Không mở được bài này.</Text>
          <Button className="mt-4 self-start" label="Chọn bài khác" onPress={() => router.replace('/shadow' as never)} />
        </StudyCard>
      </StudyFrame>
    );
  }

  const marks = phase === 'result' && result ? result.marks : live;
  const done = keys.filter((k) => best?.[k] !== undefined).length;

  return (
    <StudyFrame
      backHref="/shadow"
      title="Đọc theo"
      battle
      right={
        <Text className="font-strong text-body" style={{ color: color.primary }}>
          {index + 1}/{sentences.length}
        </Text>
      }
      footer={`${meta.program} · ${meta.level} · đã đọc ${done}/${sentences.length} câu`}
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
                label={speaking ? 'Đang đọc mẫu…' : 'Nghe mẫu'}
                onPress={speaking ? stopVoice : playModel}
              />
              <View className="flex-row rounded-pill p-1" style={{ backgroundColor: '#F1F5F9' }}>
                {RATES.map((r) => {
                  const on = r.value === rate;
                  return (
                    <Pressable
                      key={r.label}
                      onPress={() => setRate(r.value)}
                      className="rounded-pill px-3 py-1.5"
                      style={{ backgroundColor: on ? '#FFFFFF' : 'transparent' }}
                    >
                      <Text className="font-semi text-label" style={{ color: on ? color.primary : '#64748B' }}>
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {supported ? (
              <View className="mt-6 items-center">
                <MicButton listening={phase === 'listening'} onPress={phase === 'listening' ? stopMic : startMic} />
                <Text className="mt-2 font-sans text-label text-muted">
                  {phase === 'listening' ? 'Đang nghe… đọc xong máy tự dừng (hoặc bấm để dừng)' : 'Bấm micro rồi đọc to câu trên · phím M'}
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
                  Trình duyệt này chưa có bộ nhận giọng nên máy không chấm được. Bạn vẫn nghe mẫu và đọc theo như bình thường; muốn máy tô từng từ thì mở bằng Chrome hoặc Edge trên máy tính.
                </Text>
              </View>
            )}

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
              <Button className="mt-5 self-end" label={index + 1 >= sentences.length ? 'Xong bài' : 'Câu tiếp'} iconRight="arrow-right" onPress={next} />
            ) : null}
          </StudyCard>
        )}
      </CrossFade>

      <Text className="mt-4 text-center font-sans text-label text-muted">
        Space: nghe mẫu · M: đọc · Enter: câu tiếp · ← →: đổi câu
      </Text>
      <Text className="mt-2 text-center font-sans text-label text-muted" style={{ lineHeight: 19 }}>
        Lời bài: {AUDIO_NGUON.ten} ({AUDIO_NGUON.trang}), phạm vi công cộng.{' '}
        <Text className="font-semi text-primary-600" onPress={() => router.push(`/sentence/listen?a=${meta.id}` as never)}>
          Nghe cả bài gốc
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
          backgroundColor: current ? '#E0E7FF' : m === 'miss' ? '#FFF1F2' : 'transparent',
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={listening ? 'Dừng nghe' : 'Bấm để đọc'}
      onPress={onPress}
      className="h-20 w-20 items-center justify-center rounded-pill"
      style={{
        backgroundColor: listening ? RED : color.primary,
        ...(Platform.OS === 'web'
          ? ({
              boxShadow: listening
                ? '0 0 0 10px rgba(225,29,72,0.14), 0 14px 30px rgba(225,29,72,0.35)'
                : '0 6px 0 #3730A3, 0 16px 30px rgba(79,70,229,0.35)',
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
  const band = scoreBand(result.score);
  const tone = band.tone === 'good' ? GREEN : band.tone === 'ok' ? AMBER : RED;
  const missed = [...new Map(tokens.filter((_, i) => result.marks[i] === 'miss').map((t) => [t.norm, t.text])).values()];
  return (
    <Appear>
      <View className="mt-6 rounded-2xl p-4" style={{ backgroundColor: '#F8FAFC' }}>
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
            <Text className="font-heavy text-cardTitle" style={{ color: tone }}>
              {band.label}
            </Text>
            <Text className="mt-1 font-sans text-body text-muted">
              Máy nghe rõ {result.hits}/{result.counted} từ{result.nears ? `, ${result.nears} từ gần đúng` : ''}
              {result.counted < tokens.length ? ' · tên riêng máy không nghe ra thì không tính' : ''}.
            </Text>
            <Text className="mt-1 font-sans text-body" style={{ color: '#475569' }}>
              Máy nghe được: “{heard}”
            </Text>
          </View>
        </View>
        {missed.length ? (
          <View className="mt-4">
            <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">Từ đọc hụt — nghe lại từng từ</Text>
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
          <Button variant="outline" iconLeft="refresh" label="Đọc lại" onPress={onRetry} />
          <Button label={last ? 'Xem tổng kết' : 'Câu tiếp'} iconRight="arrow-right" onPress={onNext} />
        </View>
      </View>
    </Appear>
  );
}

/** Dải chấm: mỗi chấm một câu, màu theo điểm cao nhất; bấm để nhảy tới câu đó. */
function Dots({ scores, index, onPick }: { scores: (number | undefined)[]; index: number; onPick: (i: number) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row items-center gap-1.5 py-1">
        {scores.map((s, i) => {
          const fill = s === undefined ? 'rgba(255,255,255,0.75)' : s >= 85 ? GREEN : s >= 60 ? '#F59E0B' : '#FB7185';
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Câu ${i + 1}${s !== undefined ? `, ${s} điểm` : ''}`}
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
  const scores = Object.values(session);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const clear = scores.filter((s) => s >= 85).length;
  const top = Object.entries(missed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  return (
    <StudyCard>
      <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">Xong bài</Text>
      <Text className="mt-1 font-heavy text-pageTitle text-ink">{title}</Text>
      <View className="mt-5 flex-row flex-wrap gap-3">
        <Stat value={`${scores.length}/${total}`} label="câu đã đọc lượt này" />
        <Stat value={scores.length ? String(avg) : '—'} label="điểm trung bình" />
        <Stat value={String(clear)} label="câu đọc rất rõ (≥ 85)" />
      </View>
      {top.length ? (
        <View className="mt-5">
          <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">Từ hay hụt nhất lượt này</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {top.map(([w, n]) => (
              <View key={w} className="flex-row items-center gap-1 rounded-pill bg-white py-1 pl-3 pr-1" style={{ borderWidth: 1, borderColor: '#E2E8F0' }}>
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
        <Button iconLeft="refresh" label="Đọc lại từ đầu" onPress={onRestart} />
        <Button variant="outline" label="Chọn bài khác" onPress={() => router.replace('/shadow' as never)} />
      </View>
    </StudyCard>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#F1F5F9', flexGrow: 1, flexBasis: 150 }}>
      <Text className="font-heavy text-sectionTitle text-ink">{value}</Text>
      <Text className="mt-0.5 font-sans text-label text-muted">{label}</Text>
    </View>
  );
}
