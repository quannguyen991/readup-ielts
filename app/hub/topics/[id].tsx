import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Confetti } from '@/components/motion/Confetti';
import { HubScreen } from '@/components/hub/HubScreen';
import { HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { SpeakingWave } from '@/components/sentence/SpeakingWave';
import { Icon } from '@/components/ui/Icon';
import { AnswerAnalysis } from '@/components/hub/AnswerAnalysis';
import { HUB_UI, HubBar, HubHero, HubPanel, HubTag, hubLift } from '@/components/hub/HubUi';
import { RecordStage } from '@/components/hub/RecordStage';
import { ModelAnswer, PrepTimer, StudyPanel } from '@/components/hub/SpeakingStudy';
import { topicById, topicExtra, type SpeakingExtra, type SpeakingTopic } from '@/data/hub/speaking-topics';
import { speak } from '@/services/hub/speak';
import { buildVoiceReport } from '@/services/hub/voice-report';
import { useHubStore } from '@/store/useHubStore';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { part2Question } from '@/services/hub/hub-questions';
import type { SpeakingAnswer, SpeakingAttempt } from '@/services/speaking/attempts';
import { answerMetrics, attemptMetrics, type AnswerMetrics, type RecognizedSegment } from '@/services/speaking/metrics';

/** Thí sinh được nói tối đa hai phút ở cue card (Part 2). */
const PART2_LIMIT_MS = 120_000;
/** Khoảng tốc độ nói tự nhiên của người học IELTS, dùng để vẽ thang trên thẻ số liệu. */
const WPM_SCALE_MAX = 200;
const WPM_TARGET = { min: 110, max: 160 };

type Part = 'part1' | 'part2' | 'part3';
type Step = { part: Part; index: number; total: number; text: string; bullets?: string[] };

/** Một bài đủ sáu bước theo thứ tự thi: 3 câu Part 1, một cue card Part 2, 2 câu Part 3. */
function stepsOf(topic: SpeakingTopic, only?: 1 | 2 | 3): Step[] {
  const all: Step[] = [
    ...topic.part1.map((text, index) => ({ part: 'part1' as const, index, total: topic.part1.length, text })),
    { part: 'part2' as const, index: 0, total: 1, text: topic.part2.prompt, bullets: topic.part2.bullets },
    ...topic.part3.map((text, index) => ({ part: 'part3' as const, index, total: topic.part3.length, text })),
  ];
  return only ? all.filter((st) => st.part === `part${only}`) : all;
}

/** Kết quả một lượt nói: số liệu lấy từ `buildVoiceReport`, cùng bản ghi lời nói để đọc lại. */
type Report = { transcript: string; wpm: number | null; fillers: number; words: number; silent: boolean; ms: number; segments?: RecognizedSegment[]; metrics?: AnswerMetrics };

/**
 * Luyện đề theo chủ đề, đi lần lượt qua Part 1, cue card Part 2 và Part 3 như bài thi.
 * Mỗi câu nghe được và ghi âm được; sau khi nói có số liệu thật (tốc độ, từ đệm, số từ)
 * và bản ghi để tự đọc lại. Linh vật đổi theo tiến độ để cả trang luôn có điểm nhấn.
 */
export default function TopicPractice() {
  const { id = '', part } = useLocalSearchParams<{ id: string; part?: string }>();
  const topic = topicById(id);
  const only = part === '1' ? 1 : part === '2' ? 2 : part === '3' ? 3 : undefined;
  if (!topic) {
    return (
      <HubScreen title="Không tìm thấy chủ đề" back>
        <Text style={{ color: HUB.body }}>Chủ đề này không còn trong kho đề.</Text>
      </HubScreen>
    );
  }
  return <Practice topic={topic} only={only} />;
}

export function Practice({ topic, only, extra: extraProp, header }: { topic: SpeakingTopic; only?: 1 | 2 | 3; extra?: SpeakingExtra; header?: React.ReactNode }) {
  const listen = useListen();
  const { stop } = listen;
  const steps = useMemo(() => stepsOf(topic, only), [topic, only]);
  const extra = extraProp ?? topicExtra(topic.id);
  const completeTopic = useHubStore((s) => s.completeTopic);
  const doneAt = useHubStore((s) => s.topicsDone[topic.id]);

  const [at, setAt] = useState(0);
  const [reports, setReports] = useState<Record<number, Report>>({});
  const [, setTick] = useState(0);
  const [justDone, setJustDone] = useState(false);
  const startedAt = useRef(new Date().toISOString());
  // Chỉ chấm lượt vừa ghi xong, và ghi vào đúng bước đã bắt đầu ghi (không phải bước đang hiển thị).
  const armed = useRef(false);
  const recordingAt = useRef(0);
  const durationRef = useRef(0);

  // Mảng bước luôn có ít nhất một phần tử; khi đã qua bước cuối thì `finished` là true và `step` không dùng tới.
  const finished = at >= steps.length;
  const step = steps[Math.min(at, steps.length - 1)]!;
  const current = reports[at];
  const answered = Object.values(reports).filter((r) => !r.silent).length;

  // Đồng hồ hiển thị khi đang ghi (mỗi giây vẽ lại một lần).
  useEffect(() => {
    if (!listen.listening) return;
    const handle = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(handle);
  }, [listen.listening]);

  // Part 2: tự dừng khi hết hai phút.
  useEffect(() => {
    if (!listen.listening || step.part !== 'part2') return;
    const handle = setTimeout(() => stop(), PART2_LIMIT_MS);
    return () => clearTimeout(handle);
  }, [listen.listening, step.part, stop]);

  // Khi micro vừa dừng hẳn, dựng số liệu cho lượt vừa nói.
  useEffect(() => {
    if (listen.listening || !armed.current) return;
    armed.current = false;
    const transcript = listen.text.trim();
    const bucket = recordingAt.current;
    const ms = durationRef.current;
    if (!transcript) {
      setReports((r) => ({ ...r, [bucket]: { transcript: '', wpm: null, fillers: 0, words: 0, silent: true, ms } }));
      return;
    }
    const report = buildVoiceReport({
      transcript,
      segments: listen.segments,
      eventTimes: listen.times,
      durationMs: ms,
    });
    const segments: RecognizedSegment[] = listen.segments.map((sg) => ({ text: sg.text, confidence: sg.confidence }));
    const metrics = answerMetrics({ transcript, segments, durationMs: ms, eventTimes: listen.times });
    setReports((r) => ({
      ...r,
      [bucket]: { transcript, wpm: report.wpm, fillers: report.fillers.total, words: report.wordCount, silent: false, ms, segments, metrics },
    }));
    // Chỉ chạy khi micro dừng hoặc có chữ mới; số liệu lấy từ chính các giá trị đó.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen.listening, listen.text]);

  const start = () => {
    recordingAt.current = at;
    armed.current = true;
    listen.start();
  };

  const finishRecording = () => {
    durationRef.current = listen.elapsed();
    stop();
  };

  /** Chuyển bước: nếu đang ghi thì dừng trước để lượt đó được lưu đúng bước. */
  const goTo = (next: number) => {
    if (listen.listening) {
      durationRef.current = listen.elapsed();
      stop();
    }
    setAt(next);
  };

  /** Gói các câu đã nói thành một lượt chấm rồi mở phiếu chấm chi tiết (điểm theo bốn tiêu chí, đáp án, đối chiếu band). */
  const openResult = () => {
    const answers: SpeakingAnswer[] = [];
    steps.forEach((st, i) => {
      const r = reports[i];
      if (!r || r.silent || !r.metrics) return;
      answers.push({
        questionId: `hub:${topic.id}:${st.part}:${st.index}`,
        part: st.part === 'part1' ? 1 : st.part === 'part2' ? 2 : 3,
        question: st.bullets ? part2Question(st.text, st.bullets) : st.text,
        transcript: r.transcript,
        segments: r.segments ?? [],
        metrics: r.metrics,
      });
    });
    if (answers.length === 0) return;
    const attempt: SpeakingAttempt = {
      id: `hub-${Date.now().toString(36)}`,
      mode: only ? (`p${only}` as 'p1' | 'p2' | 'p3') : 'full',
      typed: false,
      titleVi: topic.titleVi,
      startedAt: startedAt.current,
      finishedAt: new Date().toISOString(),
      answers,
      metrics: attemptMetrics(answers.map((a) => ({ part: a.part, transcript: a.transcript, metrics: a.metrics }))),
      grade: null,
    };
    useSpeakingStore.getState().add(attempt);
    router.push(`/hub/result/${attempt.id}` as never);
  };

  const restart = () => {
    setReports({});
    setAt(0);
    setJustDone(false);
  };

  return (
    <HubScreen title={topic.titleVi} subtitle={finished ? 'Tổng kết' : partLabel(step)} back padBottom={140}>
      <HubPanel title={topic.titleVi} icon="planet" badge={doneAt ? 'ĐÃ XONG' : `${answered}/${steps.length}`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Text style={{ color: HUB_UI.navy, fontSize: 22, fontWeight: '900', flex: 1, minWidth: 160 }}>{topic.title}</Text>
          <HubTag label={`${answered}/${steps.length} câu đã nói`} />
        </View>
        <HubBar ratio={answered / Math.max(1, steps.length)} color={HUB_UI.green} />
        <Text style={{ color: HUB_UI.muted, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>{topic.tipVi}</Text>
      </HubPanel>

      <StepRail steps={steps} at={at} reports={reports} onPick={goTo} />

      {header}

      {extra && !finished ? <StudyPanel extra={extra} /> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nói cùng Leo, giám khảo AI"
        onPress={() => router.push(`/hub/live/${topic.id}` as never)}
        style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1.5, backgroundColor: '#FFFFFF', ...hubLift(hovered) }) as never}
      >
        <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0D6' }}>
          <Text style={{ fontSize: 24 }}>🦁</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: HUB_UI.navy, fontSize: 15.5, fontWeight: '900' }}>Nói cùng Leo</Text>
          <Text style={{ color: HUB_UI.muted, fontSize: 13.5, fontWeight: '600' }}>Giám khảo AI hỏi bằng giọng nói</Text>
        </View>
        <Icon name="chevron-right" size={18} color={HUB_UI.muted} />
      </Pressable>

      {finished ? (
        <Summary
          topic={topic}
          steps={steps}
          reports={reports}
          answered={answered}
          doneAt={doneAt}
          justDone={justDone}
          onComplete={() => {
            completeTopic(topic.id);
            setJustDone(true);
          }}
          onRestart={restart}
          onJump={goTo}
          onResult={openResult}
        />
      ) : (
        <>
          <QuestionCard step={step} />

          {step.part === 'part2' ? <PrepTimer key={`prep-${at}`} /> : null}

          <RecordStage
            listening={listen.listening}
            supported={listen.supported}
            elapsedMs={listen.listening ? listen.elapsed() : current?.ms ?? 0}
            hasReport={Boolean(current)}
            part2={step.part === 'part2'}
            onStart={start}
            onStop={finishRecording}
          />

          {current ? <ReportCard report={current} /> : null}

          {current && !current.silent ? (
            <AnswerAnalysis
              input={{
                part: step.part === 'part1' ? 1 : step.part === 'part2' ? 2 : 3,
                question: step.bullets ? `${step.text} (${step.bullets.join('; ')})` : step.text,
                transcript: current.transcript,
                wpm: current.wpm,
                fillers: current.fillers,
                ms: current.ms,
              }}
            />
          ) : null}

          {extra && current ? (
            <ModelAnswer
              text={step.part === 'part2' ? extra.sample : (step.part === 'part1' ? extra.p1 : extra.p3)[step.index]?.a ?? ''}
              label={step.part === 'part2' ? 'Bài mẫu Part 2 · Band 8' : 'Đáp án mẫu'}
            />
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Câu trước"
              disabled={at === 0}
              onPress={() => goTo(at - 1)}
              style={{
                width: 56,
                height: 54,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: HUB.glassStrong,
                opacity: at === 0 ? 0.4 : 1,
              }}
            >
              <Icon name="chevron-left" size={22} color={HUB.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => goTo(at + 1)}
              style={{
                flex: 1,
                height: 54,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                backgroundColor: HUB_UI.purple,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '400', fontSize: 16 }}>
                {at + 1 === steps.length ? 'Xem tổng kết' : 'Câu tiếp theo'}
              </Text>
              <Icon name={at + 1 === steps.length ? 'trophy' : 'arrow-right'} size={18} color="#fff" />
            </Pressable>
          </View>
        </>
      )}
    </HubScreen>
  );
}

/**
 * Sáu ô bước của bài thi: ô đã nói có dấu tick xanh, ô đang làm tô xanh đậm, ô chưa làm mờ.
 * Chạm một ô để nhảy tới câu đó.
 */
function StepRail({
  steps,
  at,
  reports,
  onPick,
}: {
  steps: Step[];
  at: number;
  reports: Record<number, Report>;
  onPick: (i: number) => void;
}) {
  const many = steps.length > 8;
  const pills = steps.map((s, i) => {
    const said = Boolean(reports[i] && !reports[i]!.silent);
    const on = i === at;
    return (
      <Pressable
        key={`${s.part}-${s.index}`}
        accessibilityRole="button"
        accessibilityLabel={`${shortLabel(s)}${said ? ', đã nói' : ''}`}
        accessibilityState={{ selected: on }}
        onPress={() => onPick(i)}
        style={{ flex: many ? undefined : 1, minWidth: many ? 58 : undefined, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, borderWidth: 1.5, borderColor: on ? HUB_UI.purple : said ? '#BFE7CD' : HUB_UI.line, backgroundColor: on ? HUB_UI.purple : said ? '#EAF8EF' : '#FFFFFF' }}
      >
        {said && !on ? <Icon name="check" size={13} color={HUB_UI.green} strokeWidth={2.6} /> : null}
        <Text style={{ color: on ? '#FFFFFF' : said ? HUB_UI.green : HUB_UI.navy, fontSize: 13.5, fontWeight: '900' }}>{shortLabel(s)}</Text>
      </Pressable>
    );
  });
  return many ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>{pills}</ScrollView>
  ) : (
    <View style={{ flexDirection: 'row', gap: 6 }}>{pills}</View>
  );
}

/** Thẻ câu hỏi. Part 2 hiện như một cue card: đề mô tả và bốn gợi ý đánh số. */
function QuestionCard({ step }: { step: Step }) {
  return (
    <HubPanel title={partLabel(step)} icon={step.part === 'part2' ? 'note' : step.part === 'part1' ? 'speaker' : 'planet'}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <Text style={{ color: HUB_UI.navy, fontSize: step.part === 'part2' ? 20 : 24, fontWeight: '900', lineHeight: step.part === 'part2' ? 29 : 33, flex: 1 }}>{step.text}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Nghe câu hỏi" onPress={() => speak(step.text)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 38, borderRadius: 999, backgroundColor: HUB_UI.wash }}>
          <Icon name="volume" size={16} color={HUB_UI.purple} />
          <Text style={{ color: HUB_UI.purple, fontSize: 14, fontWeight: '900' }}>Nghe</Text>
        </Pressable>
      </View>
      {step.bullets && step.bullets.length ? (
        <View style={{ gap: 8, padding: 14, borderRadius: 16, backgroundColor: '#FFFBF0', borderWidth: 1.5, borderColor: '#F2DFA6' }}>
          <Text style={{ color: HUB_UI.muted, fontSize: 13, fontWeight: '400' }}>Bạn nên nói về:</Text>
          {step.bullets.map((b, i) => (
            <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB_UI.purple }}>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: HUB_UI.navy, fontSize: 15, lineHeight: 22, flex: 1 }}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </HubPanel>
  );
}

/**
 * Số liệu sau mỗi lượt nói. Thang tốc độ có vùng mục tiêu tô màu, nên thấy ngay mình
 * đang nhanh, chậm hay vừa. Từ đệm tô xanh, vàng, đỏ theo tỉ lệ trên tổng số từ.
 */
function ReportCard({ report }: { report: Report }) {
  if (report.silent) {
    return (
      <HubPanel title="Chưa nghe rõ" icon="cloud">
        <Text style={{ color: '#B45309', fontSize: 14.5, fontWeight: '700', lineHeight: 21 }}>Thử lại gần micro hơn, nói chậm và rõ.</Text>
      </HubPanel>
    );
  }
  const ratio = report.words > 0 ? report.fillers / report.words : 0;
  const fillerTone = ratio <= 0.04 ? HUB.green : ratio <= 0.08 ? HUB.amber : HUB.red;
  const wpmPos = report.wpm === null ? 0 : Math.min(100, (report.wpm / WPM_SCALE_MAX) * 100);
  const coachTone = coachKind(report);
  return (
    <HubPanel title="Số liệu lượt nói" icon="medal">
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1.4, gap: 8, padding: 12, borderRadius: 14, backgroundColor: HUB.glassStrong }}>
          <Text style={{ color: HUB.muted, fontSize: 13, fontWeight: '700' }}>TỐC ĐỘ</Text>
          <Text style={{ color: HUB.ink, fontSize: 24, fontWeight: '400' }}>{report.wpm ?? '—'}</Text>
          <Text style={{ color: HUB.muted, fontSize: 13, marginTop: -6 }}>từ/phút</Text>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(106, 75, 217,0.14)', overflow: 'hidden' }}>
            <View
              style={{
                position: 'absolute',
                left: `${(WPM_TARGET.min / WPM_SCALE_MAX) * 100}%`,
                width: `${((WPM_TARGET.max - WPM_TARGET.min) / WPM_SCALE_MAX) * 100}%`,
                top: 0,
                bottom: 0,
                backgroundColor: 'rgba(46,125,79,0.35)',
              }}
            />
            <View style={{ position: 'absolute', left: `${wpmPos}%`, top: -2, width: 4, height: 12, borderRadius: 2, backgroundColor: HUB.ink }} />
          </View>
        </View>
        <View style={{ flex: 1, gap: 8, padding: 12, borderRadius: 14, backgroundColor: HUB.glassStrong }}>
          <Text style={{ color: HUB.muted, fontSize: 13, fontWeight: '700' }}>TỪ ĐỆM</Text>
          <Text style={{ color: fillerTone, fontSize: 24, fontWeight: '400' }}>{report.fillers}</Text>
          <Text style={{ color: HUB.muted, fontSize: 13 }}>{Math.round(ratio * 100)}% số từ</Text>
        </View>
        <View style={{ flex: 1, gap: 8, padding: 12, borderRadius: 14, backgroundColor: HUB.glassStrong }}>
          <Text style={{ color: HUB.muted, fontSize: 13, fontWeight: '700' }}>SỐ TỪ</Text>
          <Text style={{ color: HUB.ink, fontSize: 24, fontWeight: '400' }}>{report.words}</Text>
          <Text style={{ color: HUB.muted, fontSize: 13 }}>{formatClock(report.ms)}</Text>
        </View>
      </View>

      <View
        style={{
          padding: 12,
          borderRadius: 14,
          backgroundColor: coachTone === 'good' ? 'rgba(46,125,79,0.12)' : 'rgba(168,116,26,0.12)',
        }}
      >
        <Text style={{ color: coachTone === 'good' ? HUB.green : HUB.amber, fontSize: 14, fontWeight: '700', lineHeight: 21 }}>
          {coach(report)}
        </Text>
      </View>

      <View style={{ padding: 14, borderRadius: 14, backgroundColor: HUB.glassStrong, gap: 6 }}>
        <Text style={{ color: HUB.muted, fontSize: 13, fontWeight: '700' }}>BẢN GHI CỦA BẠN</Text>
        <Text style={{ color: HUB.ink, fontSize: 15, lineHeight: 23, fontStyle: 'italic' }}>“{report.transcript}”</Text>
      </View>
    </HubPanel>
  );
}

/** Tổng kết: linh vật, bốn số liệu gộp, từng câu một dòng, và nút hoàn thành có pháo giấy. */
function Summary({
  topic,
  steps,
  reports,
  answered,
  doneAt,
  justDone,
  onComplete,
  onRestart,
  onJump,
  onResult,
}: {
  topic: SpeakingTopic;
  steps: Step[];
  reports: Record<number, Report>;
  answered: number;
  doneAt: string | undefined;
  justDone: boolean;
  onComplete: () => void;
  onRestart: () => void;
  onJump: (i: number) => void;
  onResult: () => void;
}) {
  const all = Object.values(reports).filter((r) => !r.silent);
  const words = all.reduce((sum, r) => sum + r.words, 0);
  const fillers = all.reduce((sum, r) => sum + r.fillers, 0);
  const paced = all.map((r) => r.wpm).filter((w): w is number => w !== null);
  const avgWpm = paced.length ? Math.round(paced.reduce((a, b) => a + b, 0) / paced.length) : null;
  const complete = answered === steps.length;

  return (
    <View style={{ gap: 14 }}>
      <HubHero
        eyebrow="TỔNG KẾT"
        title={complete ? 'Bạn đã nói hết cả đề!' : `Còn ${steps.length - answered} câu chưa nói`}
        accent={complete ? 'làm lại sau một ngày để so sánh' : 'quay lại những câu còn trống'}
      />

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <StatTile label="câu đã nói" value={`${answered}/${steps.length}`} />
        <StatTile label="từ/phút TB" value={avgWpm === null ? '—' : String(avgWpm)} />
        <StatTile label="tổng số từ" value={String(words)} />
        <StatTile label="từ đệm" value={String(fillers)} />
      </View>

      <HubPanel title="Từng câu" icon="book" badge={`${answered}/${steps.length}`}>
        {steps.map((s, i) => {
          const r = reports[i];
          return (
            <Pressable
              key={`${s.part}-${s.index}`}
              accessibilityRole="button"
              accessibilityLabel={`${shortLabel(s)}, mở câu này`}
              onPress={() => onJump(i)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: HUB.line }}
            >
              <View
                style={{
                  width: 40,
                  height: 30,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: r && !r.silent ? 'rgba(46,125,79,0.16)' : HUB.glassStrong,
                }}
              >
                <Text style={{ color: r && !r.silent ? HUB.green : HUB.muted, fontSize: 13, fontWeight: '400' }}>{shortLabel(s)}</Text>
              </View>
              <Text style={{ color: HUB.body, fontSize: 13, flex: 1 }} numberOfLines={1}>
                {r && !r.silent ? `“${r.transcript}”` : s.text}
              </Text>
              <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>
                {r && !r.silent && r.wpm !== null ? `${r.wpm}` : r?.silent ? '—' : ''}
              </Text>
            </Pressable>
          );
        })}
      </HubPanel>

      <Pressable
        accessibilityRole="button"
        disabled={answered === 0}
        onPress={onResult}
        style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 2, borderColor: HUB_UI.purple, backgroundColor: HUB_UI.wash, opacity: answered === 0 ? 0.5 : 1, ...(hovered ? { transform: [{ translateY: -2 }] } : null) }) as never}
      >
        <Text style={{ fontSize: 30 }}>📝</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: HUB_UI.navy, fontSize: 16.5, fontWeight: '900' }}>Xem phiếu chấm chi tiết</Text>
          <Text style={{ color: HUB_UI.muted, fontSize: 13.5, fontWeight: '600' }}>Band, 4 tiêu chí, đáp án và đối chiếu</Text>
        </View>
        <Icon name="arrow-right" size={18} color={HUB_UI.purple} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={Boolean(doneAt) || answered === 0}
        onPress={onComplete}
        style={{
          height: 54,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          backgroundColor: doneAt ? HUB_UI.green : HUB_UI.purple,
          opacity: answered === 0 && !doneAt ? 0.5 : 1,
        }}
      >
        <Icon name={doneAt ? 'check' : 'trophy'} size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '400', fontSize: 16 }}>
          {doneAt ? `Đã hoàn thành ${topic.titleVi}` : 'Đánh dấu hoàn thành'}
        </Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onRestart} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: HUB.body, fontWeight: '700' }}>Làm lại từ đầu</Text>
      </Pressable>

      {justDone ? <Confetti seed={topic.id} pieces={90} silent /> : null}
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 120, padding: 12, borderRadius: 16, backgroundColor: HUB_UI.wash, borderWidth: 1, borderColor: HUB_UI.line, gap: 2 }}>
      <Text style={{ color: HUB.ink, fontSize: 20, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: HUB.muted, fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function partLabel(step: Step): string {
  if (step.part === 'part2') return 'PART 2 · CUE CARD';
  return `${step.part === 'part1' ? 'PART 1' : 'PART 3'} · CÂU ${step.index + 1}/${step.total}`;
}

function shortLabel(step: Step): string {
  if (step.part === 'part2') return 'P2';
  return `${step.part === 'part1' ? 'P1' : 'P3'}·${step.index + 1}`;
}

type CoachKind = 'good' | 'adjust';

function coachKind(r: Report): CoachKind {
  if (r.wpm !== null && (r.wpm < 100 || r.wpm > 170)) return 'adjust';
  if (r.words > 0 && r.fillers / r.words > 0.08) return 'adjust';
  return 'good';
}

/** Gợi ý ngắn theo số liệu. Ngưỡng là quy tắc kinh nghiệm, không phải chuẩn chấm thi. */
function coach(r: Report): string {
  if (r.wpm !== null && r.wpm < 100) return 'Nói hơi chậm. Thêm một ví dụ để câu trả lời có nhịp hơn.';
  if (r.wpm !== null && r.wpm > 170) return 'Nói khá nhanh. Nghỉ một nhịp giữa các ý để người nghe theo kịp.';
  if (r.words > 0 && r.fillers / r.words > 0.08) return 'Nhiều từ đệm. Dừng im một nhịp thay vì điền “um”, “uh”.';
  return 'Nhịp và từ đệm ổn. Thử thêm một chi tiết cụ thể để câu trả lời sâu hơn.';
}

function formatClock(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
