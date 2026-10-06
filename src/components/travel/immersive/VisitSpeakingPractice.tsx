import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { speak } from '@/components/vocab/study/StudyKit';
import { useL } from '@/i18n/useL';
import { answerMetrics, type RecognizedSegment } from '@/services/speaking/metrics';
import type { SpeakingGrade } from '@/services/speaking/grade';
import { startRecorder, transcriptOf, type Recorder, type RecorderSnapshot } from '@/services/speaking/recognizer';
import type { VisitQuestion } from '@/services/travel/content';
import type { ContextualSpeakingPrompt, SpeakingTargetBand } from '@/services/travel/contextual-speaking';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';

type ReplyScenario = Extract<VisitQuestion, { type: 'reply' }>;

type Props = {
  poiId: string;
  scenario?: ReplyScenario;
  prompt?: ContextualSpeakingPrompt;
  targetBand?: SpeakingTargetBand;
  partStart?: boolean;
  staffRole: string;
  index: number;
  total: number;
  accessToken: string | null;
  onContinue: (transcript: string) => void | Promise<void>;
};

type GradeResponse = { grade?: SpeakingGrade; error?: string };

const wordsIn = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

export function VisitSpeakingPractice({ poiId, scenario, prompt, targetBand, partStart, staffRole, index, total, accessToken, onContinue }: Props) {
  const { L } = useL();
  const [recording, setRecording] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [manualTranscript, setManualTranscript] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [grade, setGrade] = useState<SpeakingGrade | null>(null);
  const [grading, setGrading] = useState(false);
  const [message, setMessage] = useState('');
  const [gradeError, setGradeError] = useState('');
  const [prepReady, setPrepReady] = useState(prompt?.part !== 2);
  const [prepRunning, setPrepRunning] = useState(false);
  const [prepRemaining, setPrepRemaining] = useState(60);
  const [prepNotes, setPrepNotes] = useState('');
  const [advancing, setAdvancing] = useState(false);

  const promptText = prompt?.text ?? scenario?.line ?? '';
  const transition = partStart && prompt?.part === 2
    ? 'Now I am going to give you a topic. You will have one minute to prepare, and then you will speak for up to two minutes.'
    : partStart && prompt?.part === 3
      ? `Thank you. Now let's discuss the broader topic of ${prompt.topic}.`
      : partStart && prompt?.part === 1
        ? 'Hello. In this first part, I would like to ask you a few questions about yourself.'
        : '';
  const cueCard = prompt?.part === 2
    ? `${prompt.text} You should say: ${(prompt.bullets ?? []).join('; ')}; ${prompt.explain ?? ''}`
    : promptText;
  const speakerScript = scenario ? scenario.line : `${transition} ${cueCard}`.trim();
  const questionId = prompt ? `context:${poiId}:${prompt.id}` : `travel:${poiId}:${scenario?.key ?? ''}`;

  const mounted = useRef(false);
  const speechRecorder = useRef<Recorder | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const transcriptRef = useRef('');
  const segmentsRef = useRef<RecognizedSegment[]>([]);
  const eventTimesRef = useRef<number[]>([]);
  const startedAt = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => speak(speakerScript, { rate: 0.9 }), 240);
    return () => clearTimeout(timer);
  }, [speakerScript]);

  useEffect(() => {
    if (!prepRunning) return;
    const timer = setInterval(() => {
      setPrepRemaining((remaining) => {
        if (remaining <= 1) {
          setPrepRunning(false);
          setPrepReady(true);
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [prepRunning]);

  const releaseClip = useCallback(() => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    if (mounted.current) setAudioUrl(null);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      speechRecorder.current?.stop();
      speechRecorder.current = null;
      const media = mediaRecorder.current;
      if (media && media.state !== 'inactive') {
        media.onstop = null;
        try { media.stop(); } catch { /* The browser may already have stopped it. */ }
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (!recording) return;
    const elapsed = Math.max(0, Date.now() - startedAt.current);
    setElapsedMs(elapsed);
    setRecording(false);
    const recognition = speechRecorder.current;
    speechRecorder.current = null;
    if (recognition) {
      setFinalizing(true);
      recognition.stop();
      setTimeout(() => { if (mounted.current) setFinalizing(false); }, 1800);
    } else {
      setFinalizing(false);
    }
    const media = mediaRecorder.current;
    if (media && media.state !== 'inactive') {
      try { media.stop(); } catch { /* The onstop handler owns stream cleanup. */ }
    }
  }, [recording]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const current = Math.max(0, Date.now() - startedAt.current);
      setElapsedMs(current);
      const maxMs = prompt?.part === 2 ? 120_000 : prompt?.part === 3 ? 80_000 : 60_000;
      if (current >= maxMs) stopRecording();
    }, 250);
    return () => clearInterval(timer);
  }, [prompt?.part, recording, stopRecording]);

  const beginRecording = useCallback(async () => {
    setGrade(null);
    setGradeError('');
    setMessage('');
    setTranscript('');
    transcriptRef.current = '';
    segmentsRef.current = [];
    eventTimesRef.current = [];
    setElapsedMs(0);
    setManualTranscript(false);
    releaseClip();

    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMessage(L('Trình duyệt này chưa hỗ trợ ghi âm. Hãy dùng Chrome hoặc Edge.', 'This browser cannot record audio. Please use Chrome or Edge.'));
      return;
    }

    let captured: MediaStream | null = null;
    try {
      captured = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        captured.getTracks().forEach((track) => track.stop());
        return;
      }
      const media = new MediaRecorder(captured);
      stream.current = captured;
      chunks.current = [];
      media.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      media.onerror = () => {
        if (mounted.current) setMessage(L('Không thể lưu bản ghi âm. Hãy thử lại.', 'The recording could not be saved. Please try again.'));
      };
      media.onstop = () => {
        const clip = new Blob(chunks.current, { type: media.mimeType || 'audio/webm' });
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        mediaRecorder.current = null;
        if (!mounted.current) return;
        if (clip.size > 0) {
          const url = URL.createObjectURL(clip);
          audioUrlRef.current = url;
          setAudioUrl(url);
        }
      };
      media.start();
      mediaRecorder.current = media;
      startedAt.current = Date.now();

      const recognition = startRecorder({
        onUpdate: (snapshot: RecorderSnapshot) => {
          const nextTranscript = transcriptOf(snapshot);
          transcriptRef.current = nextTranscript;
          segmentsRef.current = snapshot.segments;
          eventTimesRef.current = snapshot.eventTimes;
          if (mounted.current) {
            setTranscript(nextTranscript);
          }
        },
        onEnd: (reason, snapshot) => {
          const nextTranscript = transcriptOf(snapshot);
          transcriptRef.current = nextTranscript;
          segmentsRef.current = snapshot.segments;
          eventTimesRef.current = snapshot.eventTimes;
          if (!mounted.current) return;
          setTranscript(nextTranscript);
          setFinalizing(false);
          if (reason === 'denied') {
            setManualTranscript(true);
            setMessage(L('Đã thu âm, nhưng chưa được cấp quyền nhận lời nói. Bạn có thể nhập lại câu mình vừa nói.', 'Audio was recorded, but speech recognition permission was denied. You can type what you said.'));
          } else if (reason === 'error') {
            setManualTranscript(true);
            setMessage(L('Bộ nhận giọng nói bị ngắt. Bạn có thể sửa bản chữ trước khi gửi AI.', 'Speech recognition stopped. You can edit the transcript before asking for feedback.'));
          }
        },
      });

      speechRecorder.current = recognition;
      if (!recognition) {
        setManualTranscript(true);
        setMessage(L('Đã thu âm trên thiết bị này. Hãy nhập lời mình vừa nói để AI góp ý.', 'Your audio is recorded locally. Type what you said so AI can give feedback.'));
      }
      setRecording(true);
    } catch (error) {
      captured?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      mediaRecorder.current = null;
      const denied = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
      setManualTranscript(true);
      setMessage(denied
        ? L('Bạn chưa cấp quyền dùng micro. Hãy cho phép micro rồi thử lại.', 'Microphone access was denied. Allow microphone access, then try again.')
        : L('Không mở được micro. Kiểm tra kết nối và quyền truy cập rồi thử lại.', 'Could not open the microphone. Check access and try again.'));
    }
  }, [L, releaseClip]);

  const requestGrade = useCallback(async () => {
    if (!accessToken) {
      setGradeError(L('Hãy đăng nhập để dùng lượt chấm Speaking bằng AI.', 'Sign in to use an AI speaking feedback credit.'));
      router.push('/auth/sign-in' as never);
      return;
    }
    const responseText = transcriptRef.current.trim() || transcript.trim();
    if (!responseText) {
      setGradeError(L('Chưa có bản lời nói để phân tích. Hãy thu âm hoặc nhập câu trả lời.', 'There is no transcript to analyse yet. Record or type your reply first.'));
      return;
    }

    setGrading(true);
    setGradeError('');
    try {
      const recognized = segmentsRef.current;
      const typed = recognized.length === 0;
      const duration = typed ? 0 : elapsedMs;
      const metrics = answerMetrics({
        transcript: responseText,
        segments: recognized,
        durationMs: duration,
        eventTimes: typed ? [] : eventTimesRef.current,
      });
      const response = await fetch('/api/speaking/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          typed,
          answers: [{
            questionId,
            transcript: responseText,
            segments: recognized,
            metrics,
          }],
        }),
      });
      const data = (await response.json()) as GradeResponse;
      if (!response.ok || !data.grade) throw new Error(data.error || L('Chưa thể phân tích câu trả lời lúc này.', 'Feedback is unavailable right now.'));
      setGrade(data.grade);
    } catch (error) {
      setGradeError(error instanceof Error ? error.message : L('Có lỗi khi phân tích. Hãy thử lại.', 'Something went wrong. Please try again.'));
    } finally {
      setGrading(false);
    }
  }, [accessToken, elapsedMs, L, poiId, questionId, transcript]);

  const playClip = () => {
    if (!audioUrl || typeof Audio === 'undefined') return;
    const player = new Audio(audioUrl);
    void player.play().catch(() => setMessage(L('Không phát được bản ghi âm này.', 'This recording could not be played.')));
  };

  const minimumWords = prompt?.part === 2 ? 35 : prompt?.part === 3 ? 15 : 3;
  const hasEnoughWords = wordsIn(transcript) >= minimumWords;
  const timeLabel = `${Math.floor(elapsedMs / 1000 / 60)}:${String(Math.floor(elapsedMs / 1000) % 60).padStart(2, '0')}`;

  return (
    <PixelPanel inner={{ padding: 16, gap: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <Text className="font-strong" style={{ color: T.goldDark, fontSize: 13, letterSpacing: 0.5 }}>
          {prompt ? `PART ${prompt.part} · ${index}/${total}${targetBand ? ` · BAND ${targetBand}` : ''}` : `${L('BỐI CẢNH', 'SITUATION')} ${index}/${total}`}
        </Text>
        <Text className="font-sans" style={{ color: T.muted, fontSize: 13 }}>{staffRole}</Text>
      </View>
      {prompt && partStart ? (
        <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 18, fontStyle: 'italic' }}>
          {prompt.part === 1
            ? L('Hãy bắt đầu bằng vài câu hỏi ngắn về bản thân và trải nghiệm của bạn.', 'Let’s begin with a few short questions about you and your experience.')
            : prompt.part === 2
              ? L('Bây giờ là cue card. Bạn có một phút chuẩn bị, sau đó nói liên tục tối đa hai phút.', 'Now for the cue card. You have one minute to prepare, then speak for up to two minutes.')
              : L(`Cảm ơn bạn. Mình sẽ cùng bàn rộng hơn về ${prompt.topic}.`, `Thank you. Let’s discuss the broader topic of ${prompt.topic}.`)}
        </Text>
      ) : null}
      <View style={{ padding: 12, borderRadius: 9, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.line, gap: 5 }}>
        {scenario ? <Text className="font-sans" style={{ color: T.muted, fontSize: 14, fontStyle: 'italic' }}>{scenario.setup}</Text> : (
          <Text className="font-sans" style={{ color: T.muted, fontSize: 13, fontStyle: 'italic' }}>{L(`Chủ đề: ${prompt?.topic ?? ''} · ${staffRole} đang trò chuyện với bạn`, `Topic: ${prompt?.topic ?? ''} · ${staffRole} is speaking with you`)}</Text>
        )}
        <Text className="font-semi" style={{ color: T.ink, fontSize: 20, lineHeight: 28 }}>{scenario ? `“${scenario.line}”` : promptText}</Text>
        {prompt?.part === 2 ? (
          <View style={{ gap: 5, paddingTop: 3 }}>
            {(prompt.bullets ?? []).map((bullet) => <Text key={bullet} className="font-sans" style={{ color: T.ink, fontSize: 14, lineHeight: 19 }}>• {bullet}</Text>)}
            {prompt.explain ? <Text className="font-semi" style={{ color: T.goldDark, fontSize: 14, lineHeight: 20 }}>{prompt.explain}</Text> : null}
          </View>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => speak(speakerScript, { rate: 0.9 })} style={{ alignSelf: 'flex-start', minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 7, backgroundColor: T.navy }}>
          <Icon name="volume" size={17} color={T.goldLight} />
          <Text className="font-strong" style={{ color: T.goldLight, fontSize: 13 }}>{L('Nghe câu hỏi', 'Hear the question')}</Text>
        </Pressable>
      </View>

      {prompt?.part === 2 ? (
        <View style={{ padding: 12, borderRadius: 9, backgroundColor: 'rgba(183,139,57,0.09)', borderWidth: 1, borderColor: T.line, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text className="font-heavy" style={{ color: T.ink, fontSize: 15 }}>{L('Chuẩn bị Part 2', 'Part 2 preparation')}</Text>
            <Text className="font-heavy" style={{ color: T.goldDark, fontVariant: ['tabular-nums'], fontSize: 17 }}>{`0:${String(prepRemaining).padStart(2, '0')}`}</Text>
          </View>
          <TextInput
            value={prepNotes}
            onChangeText={setPrepNotes}
            editable={!prepRunning && !prepReady}
            multiline
            placeholder={L('Ghi vài từ khóa, không cần viết thành câu…', 'Jot down keywords; you do not need to write full sentences…')}
            placeholderTextColor="#8B867D"
            accessibilityLabel={L('Ghi chú chuẩn bị Part 2', 'Part 2 preparation notes')}
            style={{ minHeight: 58, maxHeight: 90, borderWidth: 1, borderColor: T.line, borderRadius: 7, backgroundColor: '#FFFFFF', padding: 9, fontSize: 14, lineHeight: 19, color: T.ink, textAlignVertical: 'top' }}
          />
          {!prepReady ? <GameButton
            tone="paper"
            label={prepRunning ? L('Đang chuẩn bị…', 'Preparing…') : L('Bắt đầu 1 phút chuẩn bị', 'Start 1-minute preparation')}
            onPress={() => setPrepRunning(true)}
            disabled={prepRunning}
          /> : <Text className="font-semi" style={{ color: T.goldDark, fontSize: 13 }}>{L('Hết giờ chuẩn bị · bắt đầu nói tối đa 2 phút.', 'Preparation complete · speak for up to two minutes.')}</Text>}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ checked: recording }}
          onPress={recording ? stopRecording : beginRecording}
          disabled={finalizing || grading || advancing || !prepReady}
          style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 15, borderRadius: 9, backgroundColor: recording ? '#A53C35' : T.navy, borderWidth: 1.5, borderColor: recording ? '#A53C35' : T.gold, opacity: finalizing || grading || advancing || !prepReady ? 0.55 : 1 }}
        >
          <View style={{ width: 11, height: 11, borderRadius: recording ? 3 : 6, backgroundColor: recording ? '#FFFFFF' : '#F06C5E' }} />
          <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 14 }}>{recording ? L('Dừng ghi âm', 'Stop recording') : prompt?.part === 2 ? L('Bắt đầu nói · tối đa 2 phút', 'Start speaking · up to 2 minutes') : L('Bấm để trả lời', 'Record your reply')}</Text>
        </Pressable>
        <Text className="font-heavy" style={{ fontVariant: ['tabular-nums'], color: T.ink, fontSize: 15 }}>{timeLabel}{recording ? ' · REC' : ''}</Text>
        {audioUrl ? <GameButton tone="paper" label={L('Nghe lại', 'Play recording')} onPress={playClip} /> : null}
      </View>

      <View style={{ gap: 5 }}>
        <Text className="font-strong" style={{ fontSize: 13, color: T.goldDark }}>{L('Bản lời nói nhận được', 'Recognized speech')}</Text>
        <TextInput
          value={transcript}
          onChangeText={(value) => { transcriptRef.current = value; setTranscript(value); }}
          editable={!recording && !finalizing && !grading}
          multiline
          autoCapitalize="sentences"
          placeholder={L('Bản chữ sẽ hiện ở đây sau khi bạn nói…', 'Your words will appear here as you speak…')}
          placeholderTextColor="#8B867D"
          accessibilityLabel={L('Bản chữ câu trả lời', 'Reply transcript')}
          style={{ minHeight: 76, maxHeight: 150, borderWidth: 1.5, borderColor: T.line, borderRadius: 8, backgroundColor: '#FFFFFF', padding: 11, fontSize: 15, lineHeight: 22, color: T.ink, textAlignVertical: 'top' }}
        />
      </View>

      <Text className="font-sans" style={{ fontSize: 12, lineHeight: 17, color: T.muted }}>
        {L('Bản ghi để nghe lại chỉ lưu trên thiết bị. Chrome/Edge dùng dịch vụ nhận giọng riêng để đổi lời nói thành chữ; AI ReadUp nhận bối cảnh, bản chữ và chỉ số, không nghe file ghi âm.', 'The replay clip stays on this device. Chrome/Edge uses its speech-recognition service to transcribe your words; ReadUp AI receives the situation, transcript, and metrics, not the audio clip.')}
      </Text>
      {manualTranscript ? <Text className="font-sans" style={{ color: T.goldDark, fontSize: 13 }}>{L('Bạn có thể sửa bản chữ nếu trình duyệt nhận sai.', 'Edit the transcript if the browser misheard you.')}</Text> : null}
      {message ? <Text accessibilityLiveRegion="polite" className="font-sans" style={{ color: T.goldDark, fontSize: 13, lineHeight: 18 }}>{message}</Text> : null}

      {gradeError ? <Text accessibilityLiveRegion="polite" className="font-semi" style={{ color: '#A53C35', fontSize: 13, lineHeight: 18 }}>{gradeError}</Text> : null}
      {grade ? <Feedback grade={grade} /> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <GameButton
          tone="navy"
          label={grading ? L('Đang phân tích…', 'Analysing…') : accessToken ? L('AI phân tích câu trả lời', 'Get AI feedback') : L('Đăng nhập để AI góp ý', 'Sign in for AI feedback')}
          onPress={requestGrade}
          disabled={recording || finalizing || grading || !!grade || !transcript.trim()}
        />
        {grade ? <GameButton tone="paper" label={L('Thử nói lại', 'Try speaking again')} onPress={beginRecording} disabled={recording || grading} /> : null}
      </View>

      <GameButton
        label={advancing ? L('Đang chuẩn bị câu tiếp theo…', 'Preparing the next question…') : prompt?.part === 2 && accessToken ? L('AI chọn câu Part 3 theo câu chuyện của bạn', 'Let AI choose a Part 3 question from your story') : index < total ? L('Sang câu tiếp theo', 'Next question') : L('Hoàn thành hành trình', 'Finish journey')}
        onPress={async () => {
          setAdvancing(true);
          try { await onContinue(transcript.trim()); } finally { setAdvancing(false); }
        }}
        disabled={!hasEnoughWords || recording || finalizing || grading || advancing}
      />
      {prompt?.part === 2 && accessToken ? <Text className="font-sans" style={{ color: T.muted, fontSize: 12, lineHeight: 17, textAlign: 'center' }}>{L('Khi tiếp tục, AI sẽ dùng bản chữ câu trả lời để chọn một câu hỏi thảo luận liên quan.', 'Continuing sends your transcript to AI so it can select a related discussion question.')}</Text> : null}
      {!hasEnoughWords ? <Text className="font-sans" style={{ color: T.muted, fontSize: 12, textAlign: 'center' }}>{L(`Hãy nói ít nhất ${minimumWords} từ để ghi nhận lượt luyện.`, `Say at least ${minimumWords} words to complete this response.`)}</Text> : null}
    </PixelPanel>
  );
}

function Feedback({ grade }: { grade: SpeakingGrade }) {
  const { L } = useL();
  return (
    <View style={{ padding: 13, borderRadius: 9, backgroundColor: 'rgba(183,139,57,0.11)', borderWidth: 1, borderColor: T.line, gap: 8 }}>
      <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Gợi ý cho lượt sau', 'Feedback for your next try')}</Text>
      <Text className="font-sans" style={{ color: T.ink, fontSize: 14, lineHeight: 20 }}>{grade.summaryVi}</Text>
      {grade.fixes.slice(0, 2).map((fix, index) => (
        <View key={`${fix.quote}-${index}`} style={{ gap: 2 }}>
          <Text className="font-semi" style={{ color: T.goldDark, fontSize: 13 }}>{fix.problemVi}</Text>
          <Text className="font-sans" style={{ color: T.ink, fontSize: 14, lineHeight: 19 }}>{'→ '}{fix.better}</Text>
        </View>
      ))}
      {grade.samples[0] ? (
        <View style={{ paddingTop: 7, borderTopWidth: 1, borderColor: T.line, gap: 3 }}>
          <Text className="font-strong" style={{ color: T.goldDark, fontSize: 13 }}>{L('Thử cách nói này', 'Try saying it this way')}</Text>
          <Text className="font-semi" style={{ color: T.ink, fontSize: 15, lineHeight: 22 }}>{grade.samples[0].improved}</Text>
          <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 18 }}>{grade.samples[0].whyVi}</Text>
        </View>
      ) : null}
    </View>
  );
}
