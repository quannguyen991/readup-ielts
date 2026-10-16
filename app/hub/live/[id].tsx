import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { HubScreen } from '@/components/hub/HubScreen';
import { AnalysisView, type AiNotes } from '@/components/hub/live/AnalysisView';
import { LiveAvatar, type AvatarState } from '@/components/hub/live/LiveAvatar';
import { LiveWave } from '@/components/hub/live/LiveWave';
import { GLASS_CARD, HUB } from '@/components/hub/theme';
import { useListen } from '@/components/hub/useListen';
import { useMicAudio } from '@/components/hub/useMicAudio';
import { Icon } from '@/components/ui/Icon';
import { topicById, type SpeakingTopic } from '@/data/hub/speaking-topics';
import { askExaminer, parseFeedbackJson } from '@/services/hub/live-client';
import {
  analyzeSession,
  examinerMessages,
  questionsOf,
  type LiveQuestion,
  type LiveTurn,
  type SessionAnalysis,
} from '@/services/hub/live-session';
import { speak, stopSpeaking } from '@/services/hub/speak';
import { buildVoiceReport } from '@/services/hub/voice-report';
import { useAuthStore } from '@/store/useAuthStore';
import { themedHex } from '@/theme/palette-state';

/** Giám khảo dùng chung với gia sư IELTS trong khu luyện nói (xem services/hub/tutors.ts). */
const TUTOR_ID = 'ielts-examiner';
/** Số mẫu mức âm lượng giữ lại để vẽ sóng: đủ dài để thấy nhịp, không tốn bộ nhớ. */
const LEVEL_KEEP = 60;
/** Quá thời gian này thì tự kết thúc lượt nói, tránh micro thu mãi khi quên bấm dừng. */
const AUTO_STOP_MS = 150_000;

type Phase = 'ready' | 'ai' | 'user' | 'thinking' | 'done';

export default function LiveSpeaking() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const topic = topicById(id);
  if (!topic) {
    return (
      <HubScreen title="Không tìm thấy chủ đề" back>
        <Text style={{ color: HUB.body }}>Chủ đề này không còn trong kho đề.</Text>
      </HubScreen>
    );
  }
  return <LiveSession topic={topic} />;
}

/**
 * Buổi nói chuyện với giám khảo Leo, theo đúng cấu trúc bài thi.
 *
 * Vòng lặp: Leo đọc câu hỏi → bạn bấm micro và trả lời → máy đo lượt nói (tốc độ, từ đệm,
 * ngập ngừng) → AI đọc bản ghi, phản ứng ngắn và hỏi câu tiếp theo → lặp lại. Hết sáu câu
 * thì sang màn phân tích. Mỗi lượt AI tốn một lượt của hạn mức; nếu AI không trả lời được
 * thì Leo vẫn đi tiếp bằng câu hỏi có sẵn và báo lý do.
 */
function LiveSession({ topic }: { topic: SpeakingTopic }) {
  const questions: LiveQuestion[] = useMemo(() => questionsOf(topic), [topic]);
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const listen = useListen();
  const mic = useMicAudio();

  const [phase, setPhase] = useState<Phase>('ready');
  const [qi, setQi] = useState(0);
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [levels, setLevels] = useState<number[]>([]);
  const [aiLive, setAiLive] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [tick, setTick] = useState(0);
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [aiNotes, setAiNotes] = useState<AiNotes | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Các hàm chạy bất đồng bộ (giọng đọc, luồng AI) đọc trạng thái qua ref để không dùng giá trị cũ.
  const turnsRef = useRef<LiveTurn[]>([]);
  const qiRef = useRef(0);
  const armed = useRef(false);
  const durationRef = useRef(0);
  const counter = useRef(0);

  // Rời màn thì dừng giọng đọc và trả micro lại cho hệ điều hành.
  useEffect(
    () => () => {
      stopSpeaking();
      void mic.stop().catch(() => undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Đồng hồ hiển thị khi đang nghe; quá giờ thì tự dừng.
  useEffect(() => {
    if (!listen.listening) return;
    const handle = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(handle);
  }, [listen.listening]);

  const pushTurn = useCallback((t: Omit<LiveTurn, 'id'>) => {
    counter.current += 1;
    const turn: LiveTurn = { ...t, id: `t${counter.current}` };
    turnsRef.current = [...turnsRef.current, turn];
    setTurns(turnsRef.current);
    return turn;
  }, []);

  /**
   * Leo nói một câu; xong thì gọi `after` đúng một lần. Có một bộ hẹn giờ dự phòng theo độ dài
   * câu: trình duyệt nào không báo kết thúc giọng đọc thì màn hình vẫn đi tiếp, không bị kẹt
   * ở trạng thái "Leo đang nói".
   */
  const speakAI = useCallback((text: string, after: () => void) => {
    setPhase('ai');
    let finished = false;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const once = () => {
      if (finished) return;
      finished = true;
      if (fallback !== undefined) clearTimeout(fallback);
      after();
    };
    // `speak` có thể gọi `onDone` ngay (không có giọng đọc), nên khai báo hẹn giờ trước khi nói.
    fallback = setTimeout(once, Math.max(3000, text.length * 75));
    speak(text, { rate: 0.95, onDone: once });
  }, []);

  const finish = useCallback(() => {
    stopSpeaking();
    setAnalysis(analyzeSession(turnsRef.current));
    setPhase('done');
  }, []);

  /** Hỏi câu có sẵn, không qua AI: dùng khi không gọi được giám khảo hoặc khi bỏ qua câu. */
  const askDirect = useCallback(
    (index: number) => {
      const q = questions[index];
      if (!q) return finish();
      qiRef.current = index;
      setQi(index);
      pushTurn({ role: 'ai', text: q.text });
      speakAI(q.text, () => setPhase('user'));
    },
    [questions, pushTurn, speakAI, finish],
  );

  /** Sau một lượt nói: nhờ giám khảo phản ứng và hỏi câu kế tiếp. */
  const respond = async () => {
    const index = qiRef.current;
    const isLast = index + 1 >= questions.length;
    const nextText = isLast ? null : questions[index + 1]!.text;
    setPhase('thinking');
    setAiLive('');
    setStatus(null);

    const out = await askExaminer({
      tutorId: TUTOR_ID,
      messages: examinerMessages(turnsRef.current, nextText),
      token,
      onChunk: setAiLive,
    });

    if (out.ok) {
      setAiLive('');
      pushTurn({ role: 'ai', text: out.text });
      if (!isLast) {
        qiRef.current = index + 1;
        setQi(index + 1);
      }
      speakAI(out.text, () => (isLast ? finish() : setPhase('user')));
      return;
    }

    // Không gọi được giám khảo: vẫn đi tiếp bằng câu hỏi có sẵn và nói rõ lý do.
    setAiLive('');
    setStatus(out.message);
    if (isLast) {
      const closing = 'Thank you. That is the end of the interview.';
      pushTurn({ role: 'ai', text: closing });
      speakAI(closing, finish);
    } else {
      askDirect(index + 1);
    }
  };

  const start = () => {
    turnsRef.current = [];
    setTurns([]);
    setAnalysis(null);
    setAiNotes(null);
    setAiError(null);
    setStatus(null);
    qiRef.current = 0;
    setQi(0);
    const intro = `Hi, I'm Leo, your IELTS speaking examiner. Let's talk about ${topic.title.toLowerCase()}. ${questions[0]!.text}`;
    pushTurn({ role: 'ai', text: intro });
    speakAI(intro, () => setPhase('user'));
  };

  const beginAnswer = async () => {
    if (!listen.supported) {
      setStatus('Ghi âm cần Chrome trên máy tính hoặc Android.');
      return;
    }
    setStatus(null);
    setLevels([]);
    setPhase('user');
    await mic.start((rms) => setLevels((l) => [...l.slice(-(LEVEL_KEEP - 1)), rms]));
    listen.start();
  };

  const endAnswer = async () => {
    durationRef.current = listen.elapsed();
    armed.current = true;
    listen.stop();
    await mic.stop().catch(() => undefined);
  };

  // Khi micro vừa dừng hẳn, dựng số liệu cho lượt vừa nói rồi nhờ giám khảo phản hồi.
  useEffect(() => {
    if (listen.listening || !armed.current) return;
    armed.current = false;
    const transcript = listen.text.trim();
    if (!transcript) {
      pushTurn({ role: 'user', text: '', silent: true });
      setStatus('Chưa nghe rõ. Nói lại gần micro hơn, rõ và chậm.');
      setPhase('user');
      return;
    }
    const report = buildVoiceReport({
      transcript,
      segments: listen.segments,
      eventTimes: listen.times,
      durationMs: durationRef.current,
    });
    pushTurn({ role: 'user', text: transcript, report });
    void respond();
    // Chỉ chạy khi micro dừng hoặc có chữ mới; các giá trị khác đã nằm trong ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen.listening, listen.text]);

  // Tự dừng khi nói quá lâu.
  useEffect(() => {
    if (listen.listening && listen.elapsed() > AUTO_STOP_MS) void endAnswer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const skip = () => {
    const next = qiRef.current + 1;
    if (next >= questions.length) return finish();
    askDirect(next);
  };

  const requestFeedback = async () => {
    const lines = turnsRef.current
      .filter((t) => t.role === 'user' && !t.silent && t.text)
      .map((t, i) => `Answer ${i + 1}: ${t.text}`)
      .join('\n');
    setAiBusy(true);
    setAiError(null);
    const out = await askExaminer({
      tutorId: TUTOR_ID,
      token,
      messages: [
        {
          role: 'user',
          content: `Here are my spoken answers in an IELTS speaking practice:\n${lines}\n\nGive feedback on grammar, coherence and vocabulary. Reply ONLY with JSON: {"grammar":[...],"coherence":[...],"vocabulary":[...]} with at most 3 short tips per list, written in Vietnamese.`,
        },
      ],
    });
    setAiBusy(false);
    if (!out.ok) return setAiError(out.message);
    const parsed = parseFeedbackJson(out.text);
    if (!parsed) return setAiError('Chưa đọc được nhận xét. Thử lấy lại.');
    setAiNotes(parsed);
  };

  const avatarState: AvatarState =
    phase === 'ai' ? 'ai' : phase === 'user' && listen.listening ? 'listening' : phase === 'thinking' ? 'thinking' : 'idle';

  const lastAi = [...turns].reverse().find((t) => t.role === 'ai')?.text ?? '';
  const subtitle = phase === 'ready' ? 'Bấm “Bắt đầu” để Leo hỏi câu đầu tiên.' : phase === 'thinking' && aiLive ? aiLive : lastAi;

  const statusLine =
    phase === 'ready'
      ? 'Sẵn sàng khi bạn bắt đầu'
      : phase === 'ai'
        ? 'Leo đang nói…'
        : phase === 'user'
          ? listen.listening
            ? 'Đang lắng nghe bạn…'
            : 'Đến lượt bạn: bấm micro để trả lời'
          : phase === 'thinking'
            ? aiLive
              ? 'Leo đang trả lời…'
              : 'Đang chấm lượt nói của bạn…'
            : 'Buổi luyện đã kết thúc';

  const current = questions[Math.min(qi, questions.length - 1)]!;
  const answers = turns.filter((t) => t.role === 'user' && !t.silent).length;
  const micOn = phase === 'user' && listen.listening;

  return (
    <HubScreen
      title={topic.titleVi}
      subtitle={phase === 'done' ? 'Phân tích buổi luyện' : `${current.label} · câu ${Math.min(qi + 1, questions.length)}/${questions.length}`}
      back
      padBottom={140}
    >
      {phase === 'done' && analysis ? (
        <AnalysisView
          analysis={analysis}
          turns={turns}
          seed={topic.id}
          aiNotes={aiNotes}
          aiBusy={aiBusy}
          aiError={aiError}
          onAiFeedback={() => void requestFeedback()}
          onRetry={start}
          onExit={() => {
            stopSpeaking();
            if (router.canGoBack()) router.back();
            else router.replace('/hub/topics' as never);
          }}
        />
      ) : (
        <>
          <LinearGradient
            colors={[themedHex('#FFFBEF'), themedHex('#F6E3AE')]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28, paddingVertical: 22, paddingHorizontal: 16, alignItems: 'center', gap: 10 }}
          >
            <LiveAvatar state={avatarState} size={230} />
            <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>{statusLine}</Text>
            {phase === 'user' && listen.listening ? (
              <Text style={{ color: HUB.ink, fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {formatClock(listen.elapsed())}
              </Text>
            ) : null}
          </LinearGradient>

          <View style={[GLASS_CARD, { padding: 18, gap: 8 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: HUB.glassStrong }}>
                <Text style={{ color: HUB.blue, fontSize: 11, fontWeight: '800' }}>LEO</Text>
              </View>
              <Text style={{ color: HUB.muted, fontSize: 11, fontWeight: '700' }}>giám khảo IELTS</Text>
            </View>
            <Text style={{ color: HUB.ink, fontSize: 19, fontWeight: '700', lineHeight: 28 }}>{subtitle || ' '}</Text>
          </View>

          <LiveWave levels={micOn ? levels : []} active={micOn} color={HUB.blue} />

          {status ? (
            <View style={{ padding: 12, borderRadius: 14, backgroundColor: 'rgba(168,116,26,0.12)' }}>
              <Text style={{ color: HUB.amber, fontSize: 13, fontWeight: '700', lineHeight: 19 }}>{status}</Text>
            </View>
          ) : null}

          {phase === 'ready' ? (
            <View style={[GLASS_CARD, { padding: 18, gap: 12 }]}>
              <Text style={{ color: HUB.ink, fontSize: 16, fontWeight: '800' }}>Cách luyện cùng Leo</Text>
              <Step n={1} text="Leo hỏi bằng giọng nói. Bạn bấm micro và trả lời tự nhiên." />
              <Step n={2} text="Leo phản ứng ngắn rồi hỏi câu tiếp theo, đúng cấu trúc bài thi." />
              <Step n={3} text="Hết sáu câu, bạn xem phân tích: tốc độ, từ đệm, ngập ngừng và điểm từng tiêu chí." />
              <Text style={{ color: HUB.muted, fontSize: 12, lineHeight: 18 }}>
                Cần đăng nhập để Leo trả lời, cùng micro và Chrome để ghi âm.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={start}
                style={{ height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: HUB.blue }}
              >
                <Icon name="play" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Bắt đầu với Leo</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <ControlButton
                  icon="book"
                  label={showTranscript ? 'Ẩn phụ đề' : 'Phụ đề'}
                  onPress={() => setShowTranscript((v) => !v)}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={micOn ? 'Dừng ghi' : 'Ghi âm trả lời'}
                  disabled={phase !== 'user' || !listen.supported}
                  onPress={() => (micOn ? void endAnswer() : void beginAnswer())}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: micOn ? HUB.red : themedHex('#D9A441'),
                    boxShadow: micOn ? '0 14px 30px rgba(179,58,42,0.35)' : '0 14px 30px rgba(170,120,40,0.35)',
                    opacity: phase === 'user' || micOn ? 1 : 0.45,
                  } as never}
                >
                  <Icon name={micOn ? 'close' : 'mic'} size={34} color="#fff" strokeWidth={2.2} />
                </Pressable>
                <ControlButton icon="trophy" label="Kết thúc" disabled={answers === 0 || micOn || phase === 'thinking'} onPress={finish} />
              </View>
              <Text style={{ color: HUB.muted, fontSize: 12, textAlign: 'center' }}>
                {micOn ? 'Bấm lần nữa để dừng và gửi câu trả lời' : phase === 'user' ? 'Bấm micro để trả lời' : ' '}
              </Text>

              {phase === 'user' && !micOn ? (
                <Pressable accessibilityRole="button" onPress={skip} style={{ alignSelf: 'center', paddingVertical: 6 }}>
                  <Text style={{ color: HUB.body, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' }}>Bỏ qua câu này</Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowHint((v) => !v)}
                style={[GLASS_CARD, { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name="sparkle" size={18} color={HUB.blue} />
                  <Text style={{ color: HUB.ink, fontSize: 15, fontWeight: '800' }}>Gợi ý trả lời</Text>
                </View>
                <Icon name={showHint ? 'chevron-left' : 'chevron-right'} size={18} color={HUB.muted} />
              </Pressable>
              {showHint ? (
                <View style={[GLASS_CARD, { padding: 16, gap: 8 }]}>
                  {current.part === 2 ? (
                    topic.part2.bullets.map((b) => (
                      <Text key={b} style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>
                        • {b}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: HUB.body, fontSize: 14, lineHeight: 21 }}>{topic.tipVi}</Text>
                  )}
                </View>
              ) : null}

              {showTranscript ? (
                <View style={{ gap: 8 }}>
                  {turns.map((t) => (
                    <View
                      key={t.id}
                      style={{
                        alignSelf: t.role === 'ai' ? 'flex-start' : 'flex-end',
                        maxWidth: '86%',
                        padding: 12,
                        borderRadius: 16,
                        backgroundColor: t.role === 'ai' ? HUB.glassStrong : 'rgba(143,110,54,0.14)',
                      }}
                    >
                      <Text style={{ color: HUB.muted, fontSize: 10, fontWeight: '800', marginBottom: 2 }}>
                        {t.role === 'ai' ? 'LEO' : 'BẠN'}
                      </Text>
                      <Text style={{ color: HUB.ink, fontSize: 14, lineHeight: 21, fontStyle: t.silent ? 'italic' : 'normal' }}>
                        {t.silent ? '(không nghe rõ)' : t.text}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </>
      )}
    </HubScreen>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.blue }}>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{n}</Text>
      </View>
      <Text style={{ color: HUB.ink, fontSize: 14, lineHeight: 21, flex: 1 }}>{text}</Text>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: 'book' | 'trophy';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={{ width: 84, alignItems: 'center', gap: 6, opacity: disabled ? 0.4 : 1 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: HUB.glassStrong, borderWidth: 1, borderColor: HUB.line }}>
        <Icon name={icon} size={20} color={HUB.ink} />
      </View>
      <Text style={{ color: HUB.body, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

function formatClock(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
