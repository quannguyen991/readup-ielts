import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { StudyCard, StudyFrame } from '@/components/vocab/study/StudyKit';
import { VoiceOrb, useMicLevel, type OrbState } from '@/components/speaking/VoiceOrb';
import { fmtClock, nowMs, useMicSupport } from '@/components/speaking/SpeakingKit';
import {
  buildSession,
  cueCardOf,
  cueCardSpoken,
  getCueCard,
  getPart1Topic,
  getSpeakingQuestion,
  PART1_TOPICS,
  PART_TIMING,
  PREP_MS,
  type SessionMode,
  type SessionPlan,
} from '@/services/speaking/bank';
import { latestSampleFor, type SpeakingAnswer, type SpeakingAttempt } from '@/services/speaking/attempts';
import { answerMetrics, attemptMetrics } from '@/services/speaking/metrics';
import { startRecorder, transcriptOf, type Recorder, type RecorderEnd, type RecorderSnapshot } from '@/services/speaking/recognizer';
import { speakWithAoede } from '@/services/speaking/voice';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useL } from '@/i18n/useL';

type Phase = 'intro' | 'asking' | 'prep' | 'answering' | 'retry' | 'review' | 'saving';

const MODES: SessionMode[] = ['full', 'p1', 'p2', 'p3', 'q'];

/** Tên lượt thi để hiện ở danh sách. */
function titleOf(plan: SessionPlan): string {
  if (plan.mode === 'q') return getSpeakingQuestion(plan.questionId ?? '')?.topicVi ?? 'Một câu';
  if (plan.mode === 'p1') return getPart1Topic(plan.p1Topic ?? '')?.titleVi ?? 'Part 1';
  const cue = getCueCard(plan.cue ?? '')?.titleVi ?? '';
  if (plan.mode === 'full') return `${getPart1Topic(plan.p1Topic ?? '')?.titleVi ?? ''} · ${cue}`;
  return cue;
}

function newId(): string {
  return `spk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * PHÒNG THI NÓI.
 *
 * Nhịp một câu: giám khảo ĐỌC câu hỏi (giọng máy) → (Part 2: 1 phút chuẩn bị
 * có ô ghi chú) → micro mở, chữ hiện dần khi bạn nói → tự dừng khi im lặng đủ
 * lâu hoặc hết giờ, hoặc bấm "Xong câu". Micro chỉ mở SAU khi giám khảo đọc
 * xong, để máy không nghe nhầm giọng giám khảo thành câu trả lời.
 *
 * Vùng làm bài giữ yên tĩnh: không thanh trận đấu, không hiệu ứng thưởng giữa
 * chừng — người đang nói cần tập trung vào câu hỏi.
 */
export default function SpeakingRoom() {
  const { L, en } = useL();
  // Màn thấp (điện thoại nhỏ / nằm ngang): thu nhỏ quả cầu để nút điều khiển còn trong tầm nhìn.
  const { height: winH } = useWindowDimensions();
  const orbSize = winH < 640 ? 120 : winH < 760 ? 160 : ORB;
  const params = useLocalSearchParams<{ mode?: string; p1?: string; cue?: string; q?: string; exam?: string; typed?: string; sample?: string; count?: string; offset?: string; coach?: string; retryOf?: string }>();
  const plan = useMemo<SessionPlan>(() => {
    const mode = (MODES as string[]).includes(params.mode ?? '') ? (params.mode as SessionMode) : 'p1';
    return { mode, p1Topic: params.p1, cue: params.cue, questionId: params.q,
      ...(mode === 'p1' && params.exam !== '1' ? { questionCount: params.count === '1' ? 1 as const : 2 as const, questionOffset: Math.max(0, Number(params.offset) || 0) } : {}) };
  }, [params.mode, params.p1, params.cue, params.q, params.count, params.offset, params.exam]);
  const steps = useMemo(() => buildSession(plan), [plan]);
  const exam = params.exam === '1' && plan.mode !== 'q';
  const coaching = !exam && (plan.mode === 'p1' || plan.mode === 'q');

  const mic = useMicSupport();
  const [forceTyped, setForceTyped] = useState(false);
  const typed = params.typed === '1' || mic === false || forceTyped;

  const attempts = useSpeakingStore((s) => s.attempts);
  const previous = attempts.find((a) => a.id === params.retryOf);
  const sample = useMemo(() => {
    if (plan.mode !== 'q' || !plan.questionId) return null;
    const index = previous?.answers.findIndex((a) => a.questionId === plan.questionId) ?? -1;
    return previous?.grade?.samples.find((s) => s.questionIndex === index)?.improved ?? latestSampleFor(attempts, plan.questionId);
  }, [attempts, plan, previous]);
  const [showSample, setShowSample] = useState(params.sample === '1');
  const [showQ, setShowQ] = useState(true);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<Array<SpeakingAnswer | null>>([]);
  const [live, setLive] = useState('');
  const [typedText, setTypedText] = useState('');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [phaseStart, setPhaseStart] = useState(0);

  const turnRef = useRef(0);
  const recRef = useRef<Recorder | null>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const heardRef = useRef(false);
  const lastEventRef = useRef(0);
  const startedAtRef = useRef('');
  const answersRef = useRef<Array<SpeakingAnswer | null>>([]);
  const notesRef = useRef('');
  // Các bước nối nhau qua hẹn giờ và sự kiện micro — đọc chỉ số câu, mốc bắt đầu
  // và chế độ gõ qua ref, không qua biến của lần render đã cũ.
  const indexRef = useRef(0);
  const phaseStartRef = useRef(0);
  const typedRef = useRef(typed);
  useLayoutEffect(() => {
    typedRef.current = typed;
  });

  const micLevel = useMicLevel(phase === 'answering' && !typed);
  const step = steps[index];
  const q = step?.question;
  const timing = q ? PART_TIMING[q.part] : PART_TIMING[1];

  const later = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(
    () => () => {
      turnRef.current += 1;
      recRef.current?.stop();
      stopVoiceRef.current?.();
      timersRef.current.forEach(clearTimeout);
    },
    [],
  );

  const enter = (p: Phase) => {
    const t = Date.now();
    phaseStartRef.current = t;
    setPhase(p);
    setPhaseStart(t);
    setNow(t);
  };

  // ------------------------------------------------------------- giám khảo hỏi
  const ask = (i: number) => {
    const s = steps[i];
    if (!s) return;
    turnRef.current += 1;
    const turn = turnRef.current;
    clearTimers();
    indexRef.current = i;
    setIndex(i);
    setLive('');
    setTypedText('');
    setNotice(null);
    enter('asking');
    const body = s.question.part === 2 ? cueCardSpoken(s.question) : s.question.text;
    const text = body;
    let moved = false;
    const go = () => {
      if (moved || turn !== turnRef.current) return;
      moved = true;
      stopVoiceRef.current = null;
      afterAsk(i);
    };
    stopVoiceRef.current = speakWithAoede(text, { questionId: s.question.id, rate: 0.95,
      onDone: () => later(350, go),
      onError: (message) => { if (turn === turnRef.current) setNotice(message); } });
  };

  const skipReading = () => {
    stopVoiceRef.current?.();
    stopVoiceRef.current = null;
    turnRef.current += 1;
    clearTimers();
    afterAsk(indexRef.current);
  };

  const afterAsk = (i: number) => {
    const s = steps[i];
    if (!s) return;
    if (s.question.part === 2) enter('prep');
    else beginAnswer();
  };

  // ------------------------------------------------------------- trả lời
  const beginAnswer = () => {
    turnRef.current += 1;
    const turn = turnRef.current;
    clearTimers();
    setLive('');
    setNotice(null);
    heardRef.current = false;
    enter('answering');
    if (typedRef.current) return;
    const rec = startRecorder({
      onUpdate: (snap) => {
        if (turn !== turnRef.current) return;
        const text = transcriptOf(snap);
        if (text) {
          heardRef.current = true;
          lastEventRef.current = Date.now();
        }
        setLive(text);
      },
      onEnd: (reason, snap) => {
        if (turn !== turnRef.current) return;
        finishSpoken(reason, snap);
      },
    });
    if (!rec) {
      setForceTyped(true);
      setNotice(
        L('Không có micro: gõ câu trả lời thay (không tính điểm Speaking).', 'No mic: type instead (not scored as Speaking).'),
      );
      return;
    }
    recRef.current = rec;
  };

  /** Dừng micro; bộ nghe sẽ gọi `onEnd`. Trình duyệt không gọi thì tự chốt sau 2 giây. */
  const stopListening = () => {
    const rec = recRef.current;
    if (!rec) return;
    const turn = turnRef.current;
    rec.stop();
    later(2_000, () => {
      if (turn === turnRef.current && recRef.current === rec) finishSpoken('stopped', rec.snapshot());
    });
  };

  const finishSpoken = (reason: RecorderEnd, snap: RecorderSnapshot) => {
    const rec = recRef.current;
    recRef.current = null;
    turnRef.current += 1;
    clearTimers();
    const transcript = transcriptOf(snap);
    if (reason === 'denied') {
      setNotice(
        L('Hãy cho phép Micro ở biểu tượng ổ khoá trên thanh địa chỉ rồi bấm "Thử lại".', 'Allow the microphone via the lock icon in the address bar, then tap "Try again".'),
      );
      enter('retry');
      return;
    }
    if (!transcript) {
      setNotice(
        reason === 'error'
          ? L('Micro gặp trục trặc (thường do mạng). Thử lại nhé.', 'The mic ran into a problem (usually the network). Please try again.')
          : L('Chưa nghe thấy gì — nói to, rõ hơn một chút rồi thử lại.', "Didn't hear anything — speak a little louder and clearer, then try again."),
      );
      enter('retry');
      return;
    }
    const s = steps[indexRef.current]!;
    const durationMs = nowMs() - (rec?.startedAt ?? phaseStartRef.current);
    const segments = snap.interim ? [...snap.segments, { text: snap.interim, confidence: null }] : snap.segments;
    save({
      questionId: s.question.id,
      part: s.question.part,
      question: s.question.text,
      transcript,
      segments,
      metrics: answerMetrics({ transcript, segments, durationMs, eventTimes: snap.eventTimes }),
      ...(s.question.part === 2 && notesRef.current.trim() ? { notes: notesRef.current.trim().slice(0, 800) } : {}),
    });
  };

  const finishTyped = () => {
    const s = steps[indexRef.current]!;
    const transcript = typedText.trim();
    if (!transcript) {
      setNotice(L('Gõ câu trả lời trước khi bấm "Xong câu".', 'Type your answer before tapping "Done".'));
      return;
    }
    turnRef.current += 1;
    clearTimers();
    save({
      questionId: s.question.id,
      part: s.question.part,
      question: s.question.text,
      transcript: transcript.slice(0, 3_000),
      segments: [],
      metrics: answerMetrics({ transcript, segments: [], durationMs: nowMs() - phaseStartRef.current, eventTimes: [] }),
      ...(s.question.part === 2 && notesRef.current.trim() ? { notes: notesRef.current.trim().slice(0, 800) } : {}),
    });
  };

  const save = (a: SpeakingAnswer) => {
    const next = [...answersRef.current];
    next[indexRef.current] = a;
    answersRef.current = next;
    setAnswers(next);
    if (coaching && indexRef.current + 1 >= steps.length) { finish(); return; }
    if (exam) {
      enter('review');
      const turn = turnRef.current;
      later(1_100, () => {
        if (turn === turnRef.current) goNext();
      });
    } else enter('review');
  };

  const skipQuestion = () => {
    const s = steps[indexRef.current]!;
    const next = [...answersRef.current];
    next[indexRef.current] = {
      questionId: s.question.id,
      part: s.question.part,
      question: s.question.text,
      transcript: '',
      segments: [],
      metrics: answerMetrics({ transcript: '', segments: [], durationMs: 0, eventTimes: [] }),
      skipped: true,
    };
    answersRef.current = next;
    setAnswers(next);
    goNext();
  };

  const goNext = () => {
    const i = indexRef.current;
    if (i + 1 < steps.length) ask(i + 1);
    else finish();
  };

  const redo = () => {
    const next = [...answersRef.current];
    next[indexRef.current] = null;
    answersRef.current = next;
    setAnswers(next);
    beginAnswer();
  };

  // ------------------------------------------------------------- nộp
  const finish = () => {
    turnRef.current += 1;
    clearTimers();
    recRef.current?.stop();
    recRef.current = null;
    stopVoiceRef.current?.();
    const list = answersRef.current.filter((a): a is SpeakingAnswer => !!a && !a.skipped && !!a.transcript);
    if (!list.length) {
      router.replace('/speaking' as never);
      return;
    }
    setPhase('saving');
    const finishedAt = new Date();
    const attempt: SpeakingAttempt = {
      id: newId(),
      mode: plan.mode,
      typed: typedRef.current,
      titleVi: titleOf(plan),
      startedAt: startedAtRef.current || finishedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      answers: list,
      metrics: attemptMetrics(list),
      grade: null,
      gradeError: null,
      ...(plan.mode === 'p1' && coaching ? { practice: { topicId: plan.p1Topic ?? PART1_TOPICS[0]!.id, questionCount: plan.questionCount ?? 2, questionOffset: plan.questionOffset ?? 0 } } : {}),
      ...(params.retryOf ? { retryOf: params.retryOf } : {}),
    };
    useSpeakingStore.getState().add(attempt);
    const minutes = Math.round((finishedAt.getTime() - Date.parse(attempt.startedAt)) / 60_000);
    if (minutes > 0) useStudyStore.getState().logStudyTime('practice', Math.min(minutes, 40));
    // Lượt dưới một phút vẫn là một việc đã làm: không có việc này thì ngày đó không tính vào chuỗi.
    useStudyStore.getState().logEvent();
    router.replace(`/speaking/result/${attempt.id}` as never);
  };

  const start = () => {
    startedAtRef.current = new Date().toISOString();
    ask(0);
  };

  // ------------------------------------------------------------- đồng hồ
  const tick = () => {
    const t = Date.now();
    setNow(t);
    if (phase === 'prep' && t - phaseStart >= PREP_MS) {
      beginAnswer();
      return;
    }
    if (phase === 'answering' && !typed && recRef.current) {
      const elapsed = t - phaseStart;
      if (elapsed >= timing.maxMs) stopListening();
      else if (heardRef.current && t - lastEventRef.current >= timing.silenceMs) stopListening();
      else if (!heardRef.current && elapsed >= timing.noSpeechMs) stopListening();
    }
  };
  const tickRef = useRef(tick);
  useLayoutEffect(() => {
    tickRef.current = tick;
  });
  useEffect(() => {
    if (phase !== 'prep' && phase !== 'answering') return;
    const id = setInterval(() => tickRef.current(), 250);
    return () => clearInterval(id);
  }, [phase]);

  // ------------------------------------------------------------- hiển thị
  if (!steps.length || !q) {
    return (
      <StudyFrame backHref="/speaking" title={L('Phòng luyện nói', 'Speaking room')}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">{L('Không tìm thấy câu hỏi này.', 'Question not found.')}</Text>
          <Button className="mt-4 self-start" label={L('Về sảnh', 'Back to lobby')} onPress={() => router.replace('/speaking' as never)} />
        </StudyCard>
      </StudyFrame>
    );
  }

  const done = answers.filter(Boolean).length;
  const elapsed = Math.max(0, now - phaseStart);
  const progress = steps.map((_, i) => (i < index ? 1 : i === index ? (phase === 'review' ? 1 : phase === 'intro' ? 0 : 0.5) : 0));
  const answer = answers[index] ?? null;
  const cue = q.part !== 1 ? cueCardOf(q.id) : undefined;
  const orbState: OrbState = phase === 'asking' ? 'speaking' : phase === 'answering' && !typed ? 'listening' : phase === 'prep' || phase === 'saving' ? 'thinking' : 'idle';
  const status =
    phase === 'intro'
      ? L('Chạm vào giám khảo để bắt đầu', 'Tap the examiner to start')
      : phase === 'asking'
        ? L('Giám khảo đang hỏi…', 'The examiner is asking…')
        : phase === 'prep'
          ? L(`Chuẩn bị · còn ${fmtClock(Math.max(0, PREP_MS - elapsed))}`, `Prepare · ${fmtClock(Math.max(0, PREP_MS - elapsed))} left`)
          : phase === 'answering'
            ? typed
              ? L('Gõ câu trả lời của bạn', 'Type your answer')
              : L(`Đang nghe bạn · ${fmtClock(elapsed)} / ${fmtClock(timing.maxMs)}`, `Listening · ${fmtClock(elapsed)} / ${fmtClock(timing.maxMs)}`)
            : phase === 'retry'
              ? L('Chưa nghe rõ — thử lại nhé', "Didn't catch that — try again")
              : phase === 'review'
                ? exam
                  ? L('Sang câu tiếp…', 'Moving to the next question…')
                  : L('Xong câu này', 'Question done')
                : L('Đang lưu bài…', 'Saving…');
  const main =
    phase === 'intro'
      ? { label: L('Bắt đầu', 'Start'), icon: 'arrow-right' as const, act: 'start' as const }
      : phase === 'asking'
        ? { label: L('Trả lời luôn', 'Answer now'), icon: 'mic' as const, act: 'skipReading' as const }
        : phase === 'prep'
          ? { label: L('Nói ngay', 'Speak now'), icon: 'mic' as const, act: 'beginAnswer' as const }
          : phase === 'answering'
            ? typed
              ? { label: L('Xong câu', 'Done'), icon: 'check' as const, act: 'finishTyped' as const }
              : { label: L('Xong câu', 'Done'), icon: 'check' as const, act: 'stopListening' as const }
            : phase === 'retry'
              ? { label: L('Thử lại', 'Try again'), icon: 'mic' as const, act: 'beginAnswer' as const }
              : phase === 'review' && !exam
                ? {
                    label: index + 1 < steps.length ? coaching ? L('Luyện câu thứ hai', 'Practise the second question') : L('Câu tiếp', 'Next question') : L('Xem phân tích AI', 'Get AI feedback'),
                    icon: 'arrow-right' as const,
                    act: 'goNext' as const,
                  }
                : null;
  const topicEn = q.part === 1 ? PART1_TOPICS.find((t) => t.questions.some((x) => x.id === q.id))?.titleEn : undefined;
  const runMain = (act: 'start' | 'skipReading' | 'beginAnswer' | 'finishTyped' | 'stopListening' | 'goNext') => {
    // Nút chính đổi nghĩa ngay dưới con trỏ khi sang bước mới: bỏ cú bấm rơi vào 0,4 giây đầu.
    if (act !== 'start' && Date.now() - phaseStartRef.current < 400) return;
    ({ start, skipReading, beginAnswer, finishTyped, stopListening, goNext })[act]();
  };
  const tail = live.split(/\s+/).slice(-28).join(' ');

  return (
    <StudyFrame
      backHref="/speaking"
      title={phase === 'intro' ? L('Phòng luyện nói', 'Speaking room') : `Part ${q.part} · ${index + 1}/${steps.length}`}
      progress={progress}
      right={
        done > 0 && phase !== 'saving' ? (
          <Pressable accessibilityRole="button" onPress={finish} className="items-center justify-center rounded-pill bg-white/80 px-3" style={{ minHeight: 44 }}>
            <Text className="font-semi text-label text-ink">{L(coaching ? 'Phân tích câu vừa nói' : 'Nộp & chấm', coaching ? 'Get feedback now' : 'Submit & grade')}</Text>
          </Pressable>
        ) : null
      }
    >
      <View style={STAGE}>
        {/* ---------------------------------------- nhãn phần thi */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <View style={PILL}>
            <Text className="font-strong" style={{ fontSize: 13, letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)' }}>
              {phase === 'intro'
                ? L(
                    `${q.topicVi.toUpperCase()} · ${steps.length} CÂU · AOEDE`,
                    `${steps.length} QUESTIONS · AOEDE`,
                  )
                : en
                  ? topicEn
                    ? `PART ${q.part} · ${topicEn.toUpperCase()}`
                    : `PART ${q.part}`
                  : `PART ${q.part} · ${q.topicVi.toUpperCase()}`}
            </Text>
          </View>
        </View>

        {/* ---------------------------------------- giám khảo AI */}
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <VoiceOrb state={orbState} size={orbSize} level={micLevel} onPress={phase === 'intro' ? start : undefined} label={status} />
          <Text className="font-strong" style={{ marginTop: 14, fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }} accessibilityLiveRegion="polite">
            {status}
          </Text>
        </View>

        {/* ---------------------------------------- câu hỏi (chữ nhỏ, không lấn giám khảo) */}
        {phase !== 'intro' ? (
          <View style={{ marginTop: 18, alignItems: 'center' }}>
            {q.part === 2 && cue ? (
              <View style={{ width: '100%', maxWidth: 520, borderRadius: 18, padding: 14, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Text className="font-heavy" style={{ fontSize: 17, color: '#FFFFFF' }}>
                  {q.text}
                </Text>
                {(q.bullets ?? []).map((b) => (
                  <Text key={b} className="font-sans" style={{ marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                    • {b}
                  </Text>
                ))}
                <Text className="font-sans" style={{ marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                  {q.explain}
                </Text>
              </View>
            ) : showQ ? (
              <Text className="font-heavy" style={{ maxWidth: 560, fontSize: 20, lineHeight: 28, color: '#FFFFFF', textAlign: 'center' }}>
                {q.text}
              </Text>
            ) : null}
            {q.part !== 2 ? (
              <Pressable onPress={() => setShowQ((v) => !v)} accessibilityRole="button" style={{ marginTop: 2, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}>
                <Text className="font-semi" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                  {showQ ? L('Ẩn chữ câu hỏi', 'Hide question text') : L('Hiện chữ câu hỏi', 'Show question text')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Text className="font-sans" style={{ marginTop: 16, fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
            {L(
              'Giám khảo hỏi bằng giọng nói — bạn trả lời như đang nói chuyện.',
              'The examiner asks out loud — answer as if you were having a conversation.',
            )}
          </Text>
        )}
        {coaching && phase === 'intro' ? <Text className="font-sans" style={{ marginTop: 10, fontSize: 14, color: '#5EEAD4', textAlign: 'center' }}>{L(params.retryOf ? 'Áp dụng gợi ý của AI, trả lời lại bằng lời của bạn.' : 'Trả lời ngắn, có lý do và ví dụ. Sau lượt này, AI phân tích và giúp bạn nói lại.', params.retryOf ? 'Apply the feedback and answer again in your own words.' : 'Give a reason and an example. Then review the AI feedback and try again.')}</Text> : null}

        {/* ---------------------------------------- vùng theo pha */}
        <View style={{ marginTop: 16, alignItems: 'center', width: '100%' }}>
          {phase === 'prep' ? (
            <TextInput
              value={notes}
              onChangeText={(t) => {
                setNotes(t);
                notesRef.current = t;
              }}
              multiline
              placeholder={L('Ghi vài từ khoá…', 'Jot down a few keywords…')}
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="font-sans"
              style={{ width: '100%', maxWidth: 520, minHeight: 80, borderRadius: 16, padding: 12, fontSize: 16, color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', textAlignVertical: 'top' }}
            />
          ) : null}

          {phase === 'answering' && typed ? (
            <TextInput
              value={typedText}
              onChangeText={setTypedText}
              multiline
              autoFocus
              placeholder={L('Gõ như khi bạn nói… (không tính điểm Speaking)', "Type as you'd speak… (not a Speaking score)")}
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="font-sans"
              style={{ width: '100%', maxWidth: 560, minHeight: 110, borderRadius: 16, padding: 12, fontSize: 16, color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', textAlignVertical: 'top' }}
            />
          ) : null}

          {phase === 'answering' && !typed ? (
            <Text className="font-sans" style={{ maxWidth: 560, minHeight: 48, fontSize: 16, lineHeight: 24, color: live ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              {tail || L('Cứ nói tự nhiên — chữ sẽ hiện ở đây.', 'Just speak naturally — your words will appear here.')}
            </Text>
          ) : null}

          {phase === 'review' && answer ? (
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Chip text={L(`✓ ${answer.metrics.words} từ`, `✓ ${answer.metrics.words} words`)} />
                {answer.metrics.wpm != null ? <Chip text={L(`${answer.metrics.wpm} từ/phút`, `${answer.metrics.wpm} wpm`)} /> : null}
              </View>
              <Text className="font-sans" style={{ maxWidth: 560, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }} numberOfLines={3}>
                {answer.transcript}
              </Text>
            </View>
          ) : null}

          {notice ? (
            <Text className="font-semi" style={{ marginTop: 8, maxWidth: 520, fontSize: 14, color: '#FDE68A', textAlign: 'center' }}>
              {notice}
            </Text>
          ) : null}
        </View>

        {/* ---------------------------------------- nút điều khiển */}
        <View style={{ marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          {phase !== 'intro' && phase !== 'saving' ? (
            <RoundBtn
              icon="volume"
              label={L('Nghe lại câu hỏi', 'Replay question')}
              disabled={phase === 'answering' && !typed}
              onPress={() => {
                if (phase === 'asking') { ask(indexRef.current); return; }
                stopVoiceRef.current?.();
                stopVoiceRef.current = speakWithAoede(q.part === 2 ? cueCardSpoken(q) : q.text, { questionId: q.id, rate: 0.9, onError: setNotice });
              }}
            />
          ) : null}
          {main ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => runMain(main.act)}
              style={({ hovered }: { hovered?: boolean }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 26, minHeight: 56, justifyContent: 'center', backgroundColor: hovered ? '#FDE68A' : '#FACC15', transition: 'background-color 150ms ease' }) as object}
            >
              <Icon name={main.icon} size={18} color="#1A1405" />
              <Text className="font-heavy" style={{ fontSize: 16, color: '#1A1405' }}>
                {main.label}
              </Text>
            </Pressable>
          ) : null}
          {phase === 'review' && !exam ? <RoundBtn icon="refresh" label={L('Nói lại câu này', 'Redo this answer')} onPress={redo} /> : null}
          {phase === 'retry' || (phase === 'answering' && !exam) ? <RoundBtn icon="arrow-right" label={L('Bỏ qua câu này', 'Skip this question')} onPress={skipQuestion} /> : null}
        </View>

        {sample && phase !== 'intro' ? (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Pressable onPress={() => setShowSample((v) => !v)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text className="font-semi" style={{ fontSize: 14, color: '#5EEAD4' }}>
                {showSample ? L('Ẩn bản hay hơn lần trước', 'Hide last better version') : L('Xem bản hay hơn lần trước', 'Show last better version')}
              </Text>
            </Pressable>
            {showSample ? (
              <Text className="font-sans" style={{ marginTop: 8, maxWidth: 560, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.8)' }}>
                {sample}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </StudyFrame>
  );
}

const ORB = 200;
const STAGE = { borderRadius: 32, paddingHorizontal: 18, paddingVertical: 26, backgroundColor: '#0B1A2E', alignItems: 'center', minHeight: 440, overflow: 'hidden' } as const;
const PILL = { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.08)' } as const;

function Chip({ text }: { text: string }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(34,160,107,0.25)' }}>
      <Text className="font-strong" style={{ fontSize: 13, color: '#86EFAC' }}>
        {text}
      </Text>
    </View>
  );
}

function RoundBtn({ icon, label, onPress, disabled }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', opacity: disabled ? 0.35 : 1 }) as object}
    >
      <Icon name={icon} size={20} color="#FFFFFF" />
    </Pressable>
  );
}
