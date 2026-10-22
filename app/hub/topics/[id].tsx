import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Confetti } from '@/components/motion/Confetti';
import { LionMascot, type LionPose } from '@/components/mascot/LionMascot';
import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { SpeakingWave } from '@/components/sentence/SpeakingWave';
import { Icon } from '@/components/ui/Icon';
import { topicById, type SpeakingTopic } from '@/data/hub/speaking-topics';
import { speak } from '@/services/hub/speak';
import { buildVoiceReport } from '@/services/hub/voice-report';
import { useHubStore } from '@/store/useHubStore';
import { themedHex } from '@/theme/palette-state';

/** Thí sinh được nói tối đa hai phút ở cue card (Part 2). */
const PART2_LIMIT_MS = 120_000;
/** Khoảng tốc độ nói tự nhiên của người học IELTS, dùng để vẽ thang trên thẻ số liệu. */
const WPM_SCALE_MAX = 200;
const WPM_TARGET = { min: 110, max: 160 };

type Part = 'part1' | 'part2' | 'part3';
type Step = { part: Part; index: number; total: number; text: string; bullets?: string[] };

/** Một bài đủ sáu bước theo thứ tự thi: 3 câu Part 1, một cue card Part 2, 2 câu Part 3. */
function stepsOf(topic: SpeakingTopic): Step[] {
  return [
    ...topic.part1.map((text, index) => ({ part: 'part1' as const, index, total: topic.part1.length, text })),
    { part: 'part2' as const, index: 0, total: 1, text: topic.part2.prompt, bullets: topic.part2.bullets },
    ...topic.part3.map((text, index) => ({ part: 'part3' as const, index, total: topic.part3.length, text })),
  ];
}

/** Kết quả một lượt nói: số liệu lấy từ `buildVoiceReport`, cùng bản ghi lời nói để đọc lại. */
type Report = { transcript: string; wpm: number | null; fillers: number; words: number; silent: boolean; ms: number };

/**
 * Luyện đề theo chủ đề, đi lần lượt qua Part 1, cue card Part 2 và Part 3 như bài thi.
 * Mỗi câu nghe được và ghi âm được; sau khi nói có số liệu thật (tốc độ, từ đệm, số từ)
 * và bản ghi để tự đọc lại. Linh vật đổi theo tiến độ để cả trang luôn có điểm nhấn.
 */
export default function TopicPractice() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const topic = topicById(id);
  if (!topic) {
    return (
      <HubScreen title="Không tìm thấy chủ đề" back>
        <Text style={{ color: HUB.body }}>Chủ đề này không còn trong kho đề.</Text>
      </HubScreen>
    );
  }
  return <Practice topic={topic} />;
}

function Practice({ topic }: { topic: SpeakingTopic }) {
  const listen = useListen();
  const { stop } = listen;
  const steps = useMemo(() => stepsOf(topic), [topic]);
  const completeTopic = useHubStore((s) => s.completeTopic);
  const doneAt = useHubStore((s) => s.topicsDone[topic.id]);

  const [at, setAt] = useState(0);
  const [reports, setReports] = useState<Record<number, Report>>({});
  const [, setTick] = useState(0);
  const [justDone, setJustDone] = useState(false);
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
    setReports((r) => ({
      ...r,
      [bucket]: { transcript, wpm: report.wpm, fillers: report.fillers.total, words: report.wordCount, silent: false, ms },
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

  const restart = () => {
    setReports({});
    setAt(0);
    setJustDone(false);
  };

  const lionPose: LionPose = finished
    ? answered === steps.length
      ? 'cheer'
      : 'think'
    : listen.listening
      ? 'point'
      : current && !current.silent
        ? 'wave'
        : 'read';

  return (
    <HubScreen title={topic.titleVi} subtitle={finished ? 'Tổng kết' : partLabel(step)} back padBottom={140}>
      <LinearGradient
        colors={[themedHex('#F3F0FB'), themedHex('#F6E3AE')]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <LionMascot pose={lionPose} size={92} />
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '800' }}>{topic.title}</Text>
          <Text style={{ color: HUB.body, fontSize: 13, lineHeight: 19 }}>{topic.tipVi}</Text>
          <ProgressBar value={answered / steps.length} />
          <Text style={{ color: HUB.muted, fontSize: 12, fontWeight: '700' }}>
            {answered}/{steps.length} câu đã nói
            {doneAt ? '  ·  đã hoàn thành' : ''}
          </Text>
        </View>
      </LinearGradient>

      <StepRail steps={steps} at={at} reports={reports} onPick={goTo} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nói cùng Leo, giám khảo AI"
        onPress={() => router.push(`/hub/live/${topic.id}` as never)}
        style={[GLASS_CARD, { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
      >
        <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D9A441' }}>
          <Icon name="sparkle" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Nói cùng Leo</Text>
          <Text style={{ color: HUB.body, fontSize: 12, lineHeight: 17 }}>Giám khảo AI hỏi bằng giọng nói và phân tích buổi nói.</Text>
        </View>
        <Icon name="chevron-right" size={18} color={HUB.muted} />
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
        />
      ) : (
        <>
          <QuestionCard step={step} />

          <RecordPanel
            listening={listen.listening}
            supported={listen.supported}
            elapsedMs={listen.listening ? listen.elapsed() : current?.ms ?? 0}
            hasReport={Boolean(current)}
            part={step.part}
            onStart={start}
            onStop={finishRecording}
          />

          {current ? <ReportCard report={current} /> : null}

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
                backgroundColor: HUB.blue,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
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

/** Thanh tiến độ mảnh, tô bằng màu nhấn của chủ đề hiện tại. */
function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(106, 75, 217,0.16)', overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: 8, borderRadius: 4, backgroundColor: HUB.blue }} />
    </View>
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
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {steps.map((s, i) => {
        const said = Boolean(reports[i] && !reports[i]!.silent);
        const on = i === at;
        return (
          <Pressable
            key={`${s.part}-${s.index}`}
            accessibilityRole="button"
            accessibilityLabel={`${shortLabel(s)}${said ? ', đã nói' : ''}`}
            accessibilityState={{ selected: on }}
            onPress={() => onPick(i)}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              backgroundColor: on ? HUB.blue : said ? 'rgba(46,125,79,0.16)' : HUB.glassStrong,
            }}
          >
            {said && !on ? <Icon name="check" size={13} color={HUB.green} strokeWidth={2.6} /> : null}
            <Text style={{ color: on ? '#fff' : said ? HUB.green : HUB.body, fontSize: 12, fontWeight: '800' }}>
              {shortLabel(s)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Thẻ câu hỏi. Part 2 hiện như một cue card: đề mô tả và bốn gợi ý đánh số. */
function QuestionCard({ step }: { step: Step }) {
  return (
    <View style={[GLASS_CARD, { padding: 20, gap: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: HUB.glassStrong }}>
          <Text style={{ color: HUB.blue, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>{partLabel(step)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nghe câu hỏi"
          onPress={() => speak(step.text)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 999, backgroundColor: HUB.glassStrong }}
        >
          <Icon name="volume" size={15} color={HUB.blue} />
          <Text style={{ color: HUB.ink, fontSize: 13, fontWeight: '700' }}>Nghe</Text>
        </Pressable>
      </View>

      <Text style={{ color: HUB.ink, fontSize: step.part === 'part2' ? 19 : 23, fontWeight: '800', lineHeight: step.part === 'part2' ? 28 : 32 }}>
        {step.text}
      </Text>

      {step.bullets ? (
        <View style={{ gap: 10, paddingTop: 4 }}>
          <Text style={{ color: HUB.muted, fontSize: 13, fontWeight: '700' }}>Bạn nên nói về:</Text>
          {step.bullets.map((b, i) => (
            <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: HUB.blue,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: HUB.ink, fontSize: 15, lineHeight: 22, flex: 1 }}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Khu ghi âm: nút micro lớn, đồng hồ, sóng âm khi đang nói. Sóng chỉ chạy khi micro
 * thật sự đang nghe, nên nhìn vào là biết app đang thu hay không.
 */
function RecordPanel({
  listening,
  supported,
  elapsedMs,
  hasReport,
  part,
  onStart,
  onStop,
}: {
  listening: boolean;
  supported: boolean;
  elapsedMs: number;
  hasReport: boolean;
  part: Part;
  onStart: () => void;
  onStop: () => void;
}) {
  const hint = !supported
    ? 'Ghi âm cần Chrome trên máy tính hoặc Android.'
    : listening
      ? 'Đang nghe. Bấm lần nữa để dừng.'
      : hasReport
        ? 'Muốn nói lại thì bấm micro.'
        : part === 'part2'
          ? 'Bấm micro rồi nói, tối đa hai phút.'
          : 'Bấm micro rồi trả lời tự nhiên.';
  return (
    <View style={[GLASS_CARD, { padding: 22, alignItems: 'center', gap: 14 }]}>
      <View
        style={{
          width: 116,
          height: 116,
          borderRadius: 58,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: listening ? 'rgba(179,58,42,0.14)' : 'rgba(106, 75, 217,0.12)',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Dừng ghi' : 'Ghi âm trả lời'}
          disabled={!supported}
          onPress={() => (listening ? onStop() : onStart())}
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: listening ? HUB.red : HUB.blue,
            opacity: supported ? 1 : 0.5,
          }}
        >
          <Icon name={listening ? 'close' : 'mic'} size={32} color="#fff" strokeWidth={2.2} />
        </Pressable>
      </View>

      <Text style={{ color: HUB.ink, fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {formatClock(elapsedMs)}
      </Text>
      <SpeakingWave active={listening} />
      <Text style={{ color: HUB.muted, fontSize: 13, textAlign: 'center' }}>{hint}</Text>
    </View>
  );
}

/**
 * Số liệu sau mỗi lượt nói. Thang tốc độ có vùng mục tiêu tô màu, nên thấy ngay mình
 * đang nhanh, chậm hay vừa. Từ đệm tô xanh, vàng, đỏ theo tỉ lệ trên tổng số từ.
 */
function ReportCard({ report }: { report: Report }) {
  if (report.silent) {
    return (
      <View style={[GLASS_CARD, { padding: 16 }]}>
        <Text style={{ color: HUB.amber, fontSize: 14, fontWeight: '700' }}>
          Chưa nghe rõ. Thử lại gần micro hơn, nói chậm và rõ.
        </Text>
      </View>
    );
  }
  const ratio = report.words > 0 ? report.fillers / report.words : 0;
  const fillerTone = ratio <= 0.04 ? HUB.green : ratio <= 0.08 ? HUB.amber : HUB.red;
  const wpmPos = report.wpm === null ? 0 : Math.min(100, (report.wpm / WPM_SCALE_MAX) * 100);
  const coachTone = coachKind(report);
  return (
    <View style={[GLASS_CARD, { padding: 16, gap: 14 }]}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1.4, gap: 8, padding: 12, borderRadius: 14, backgroundColor: HUB.glassStrong }}>
          <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>TỐC ĐỘ</Text>
          <Text style={{ color: HUB.ink, fontSize: 24, fontWeight: '800' }}>{report.wpm ?? '—'}</Text>
          <Text style={{ color: HUB.muted, fontSize: 11, marginTop: -6 }}>từ/phút</Text>
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
          <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>TỪ ĐỆM</Text>
          <Text style={{ color: fillerTone, fontSize: 24, fontWeight: '800' }}>{report.fillers}</Text>
          <Text style={{ color: HUB.muted, fontSize: 11 }}>{Math.round(ratio * 100)}% số từ</Text>
        </View>
        <View style={{ flex: 1, gap: 8, padding: 12, borderRadius: 14, backgroundColor: HUB.glassStrong }}>
          <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>SỐ TỪ</Text>
          <Text style={{ color: HUB.ink, fontSize: 24, fontWeight: '800' }}>{report.words}</Text>
          <Text style={{ color: HUB.muted, fontSize: 11 }}>{formatClock(report.ms)}</Text>
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
        <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>BẢN GHI CỦA BẠN</Text>
        <Text style={{ color: HUB.ink, fontSize: 15, lineHeight: 23, fontStyle: 'italic' }}>“{report.transcript}”</Text>
      </View>
    </View>
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
}) {
  const all = Object.values(reports).filter((r) => !r.silent);
  const words = all.reduce((sum, r) => sum + r.words, 0);
  const fillers = all.reduce((sum, r) => sum + r.fillers, 0);
  const paced = all.map((r) => r.wpm).filter((w): w is number => w !== null);
  const avgWpm = paced.length ? Math.round(paced.reduce((a, b) => a + b, 0) / paced.length) : null;
  const complete = answered === steps.length;

  return (
    <View style={{ gap: 14 }}>
      <View style={{ alignItems: 'center', gap: 6, paddingTop: 4 }}>
        <LionMascot pose={complete ? 'cheer' : 'think'} size={132} />
        <Text style={{ color: HUB.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
          {complete ? 'Bạn đã nói hết cả đề!' : `Còn ${steps.length - answered} câu chưa nói`}
        </Text>
        <Text style={{ color: HUB.body, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
          {complete
            ? 'Đọc lại bản ghi, rồi làm lại chủ đề này sau một ngày để thấy tốc độ và từ đệm đổi thế nào.'
            : 'Quay lại những câu còn trống để có số liệu đầy đủ.'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <StatTile label="câu đã nói" value={`${answered}/${steps.length}`} />
        <StatTile label="từ/phút TB" value={avgWpm === null ? '—' : String(avgWpm)} />
        <StatTile label="tổng số từ" value={String(words)} />
        <StatTile label="từ đệm" value={String(fillers)} />
      </View>

      <View style={[GLASS_CARD, { padding: 14, gap: 8 }]}>
        <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Từng câu</Text>
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
                <Text style={{ color: r && !r.silent ? HUB.green : HUB.muted, fontSize: 12, fontWeight: '800' }}>{shortLabel(s)}</Text>
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
      </View>

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
          backgroundColor: doneAt ? HUB.green : HUB.blue,
          opacity: answered === 0 && !doneAt ? 0.5 : 1,
        }}
      >
        <Icon name={doneAt ? 'check' : 'trophy'} size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
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
    <View style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: HUB.glassStrong, gap: 2 }}>
      <Text style={{ color: HUB.ink, fontSize: 18, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: HUB.muted, fontSize: 10, fontWeight: '700' }}>{label}</Text>
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
