import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioBar, FallbackNote, SpeedChips } from '@/components/listening/AudioPanel';
import { SECTION_COLOR, ListeningCover } from '@/components/listening/cover';
import { Sheet } from '@/components/listening/Sheet';
import { ListeningResults } from '@/components/listening/ListeningResults';
import { GroupBlock, qDomId, type SetAnswer } from '@/components/listening/QuestionGroups';
import { useSectionAudio } from '@/components/listening/useSectionAudio';
import { Button, Icon } from '@/components/ui';
import { getListeningTest } from '@/data/listening-tests';
import { answeredNumbers, bandFromScore, scoreSections, sectionNumbers } from '@/services/listening/scoring';
import type { ListeningAnswers, ListeningAttempt, ListeningGroupType, ListeningSection, ListeningTest } from '@/services/listening/types';
import { stopPronounce } from '@/services/audio/pronounce';
import { playSfx } from '@/services/audio/sfx-ui';
import { useListeningStore } from '@/store/useListeningStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { allowLeave, useExamDraft, useExamWebTweaks, useKeyboardInset, useLeaveGuard, useWakeLock } from '@/lib/mobile/useMobileExam';

/**
 * Phòng thi Listening. Ba pha: `ready` (chọn chế độ) -> `taking` (nghe + làm) ->
 * `done` (điểm, đối chiếu, bản chữ). Mở lại một lượt cũ (`?attempt=`) vào thẳng `done`.
 */

const REVIEW_SECONDS = 30;
/** Thời gian đọc đề bài và hướng dẫn trước khi mỗi section bắt đầu (IELTS: 30 giây). */
const PREVIEW_SECONDS = 30;
const GREEN = '#16A34A';

type Phase = 'ready' | 'taking' | 'done';

export default function ListeningExamScreen() {
  const { L } = useL();
  const { id, s, task, attempt, from } = useLocalSearchParams<{ id: string; s?: string; task?: string; attempt?: string; from?: string }>();
  const test = typeof id === 'string' ? getListeningTest(id) : undefined;
  if (!test) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9F7F3' }}>
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className="font-nun-heavy text-ink" style={{ fontSize: 18 }}>{L('Không tìm thấy đề này.', 'Test not found.')}</Text>
          <Button label={L('Về thư viện Listening', 'Back to Listening')} onPress={() => router.replace('/listening' as never)} />
        </View>
      </SafeAreaView>
    );
  }
  return <Exam key={`${test.id}-${s ?? 'all'}-${task ?? 'all'}-${attempt ?? ''}`} test={test} sectionParam={s} taskParam={task} attemptId={attempt} from={from} />;
}

/**
 * `from`: đường dẫn trang gọi (hub Mock Test). Có nó thì lượt này là một phần của thi thử:
 * đánh dấu `mock`, và mọi nút quay lại đưa người học về đúng hub.
 */
function Exam({ test, sectionParam, taskParam, attemptId, from }: { test: ListeningTest; sectionParam?: string; taskParam?: string; attemptId?: string; from?: string }) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

  const wanted = sectionParam ? Number(sectionParam) : null;
  const taskType = (['gap', 'mcq-one', 'mcq-many', 'matching'] as const).find((type) => type === taskParam) ?? null;
  const sections = useMemo(() => {
    const picked = wanted ? test.sections.filter((x) => x.n === wanted) : [];
    const source = picked.length ? picked : test.sections;
    return taskType
      ? source.map((section) => ({ ...section, groups: section.groups.filter((group) => group.type === taskType) })).filter((section) => section.groups.length > 0)
      : source;
  }, [taskType, test, wanted]);
  const sectionArg = sections.length === test.sections.length && !wanted ? null : (sections.length === 1 ? sections[0]?.n : null);

  const settings = useListeningStore((st) => st.settings);
  const setSettings = useListeningStore((st) => st.setSettings);
  const addAttempt = useListeningStore((st) => st.add);
  const saved = useListeningStore((st) => (attemptId ? st.attempts.find((a) => a.id === attemptId) : undefined));

  const [real, setReal] = useState(saved ? saved.mode === 'real' : settings.realTest);
  const [phase, setPhase] = useState<Phase>(saved ? 'done' : 'ready');
  const [answers, setAnswers] = useState<ListeningAnswers>(() =>
    saved ? Object.fromEntries(Object.entries(saved.answers).map(([k, v]) => [Number(k), v])) : {},
  );
  const [secIdx, setSecIdx] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const elapsedNow = () => (startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0);
  const [review, setReview] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [confirm, setConfirm] = useState<null | 'submit' | 'exit'>(null);
  const [finalMeta, setFinalMeta] = useState<{ mode: 'practice' | 'real'; durationSec: number } | null>(
    saved ? { mode: saved.mode, durationSec: saved.durationSec } : null,
  );

  const section = (sections[secIdx] ?? sections[0]) as ListeningSection;
  const hasPreparedAudio = test.source === 'Band 9 Original';
  const speed = real ? 1 : settings.speed;
  const localAudioFiles = useRef<Record<string, { src: string; name: string }>>({});
  const [localAudioRevision, setLocalAudioRevision] = useState(0);
  const audioKey = `${test.id}:${section.n}`;
  const localAudio = localAudioFiles.current[audioKey];
  const audio = useSectionAudio({ src: localAudio?.src ?? section.audio, transcript: section.transcript, speed, testId: test.id, section: section.n, preferPreparedAudio: hasPreparedAudio });
  useEffect(() => () => {
    for (const item of Object.values(localAudioFiles.current)) URL.revokeObjectURL(item.src);
  }, []);
  const chooseLocalAudio = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const previous = localAudioFiles.current[audioKey];
      if (previous) URL.revokeObjectURL(previous.src);
      localAudioFiles.current[audioKey] = { src: URL.createObjectURL(file), name: file.name };
      setLocalAudioRevision((revision) => revision + 1);
    };
    input.click();
  }, [audioKey]);
  void localAudioRevision;
  const wantAuto = useRef(false);

  // Đồng hồ là `ElapsedPill` tự giữ giây của nó: trước đây mỗi giây cả màn
  // (mọi khối câu hỏi) dựng lại một lượt.

  // ---- điện thoại: chặn kéo-tải-lại, giữ màn hình sáng khi đang nghe, tự lưu nháp
  useExamWebTweaks();
  const keyboardInset = useKeyboardInset();
  useWakeLock(phase === 'taking' && audio.status === 'playing');
  const draftId = `${test.id}-${sectionArg ?? 'all'}-${taskType ?? 'all'}`;
  const draftState = useMemo(() => ({ answers: { j: JSON.stringify(answers) }, marked: {} }), [answers]);
  const [restoredCount, setRestoredCount] = useState(0);
  const onRestoreDraft = useCallback(
    (d: { answers: Record<string, string> }) => {
      try {
        const parsed = JSON.parse(d.answers.j ?? '{}') as ListeningAnswers;
        const n = Object.values(parsed).filter((v) => (Array.isArray(v) ? v.length > 0 : String(v ?? '').trim() !== '')).length;
        if (!n || saved) return;
        setAnswers((prev) => (Object.keys(prev).length ? prev : parsed));
        setRestoredCount(n);
      } catch {
        /* nháp hỏng: bỏ qua */
      }
    },
    [saved],
  );
  const draft = useExamDraft('listening', draftId, draftState, phase !== 'done' && !saved, onRestoreDraft);

  // ---- tự phát khi vào section (cần metadata hoặc đã chuyển sang giọng máy)
  useEffect(() => {
    /* Đồng bộ với phần tử audio bên ngoài React: phát đúng lúc nó sẵn sàng. Chưa hết giờ đọc đề thì chưa phát. */
    if (!wantAuto.current || phase !== 'taking' || audio.status !== 'idle' || preview !== null) return;
    if (audio.mode === 'tts' || audio.duration > 0) {
      wantAuto.current = false;
      audio.play();
    }
  }, [audio, phase, preview]);

  // ---- đọc đề trước section: đếm ngược, hết giờ thì mới phát âm thanh
  useEffect(() => {
    if (preview === null) return;
    if (preview <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hết giờ đọc đề thì cho phép phát
      setPreview(null);
      return;
    }
    const t = setTimeout(() => setPreview((v) => (v === null ? v : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [preview]);

  // ---- hết âm thanh -> 30 giây kiểm tra, rồi sang section kế (cả luyện tập lẫn thi thật)
  useEffect(() => {
    if (phase === 'taking' && audio.status === 'ended' && review === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- phản ứng với sự kiện audio kết thúc
      setReview(REVIEW_SECONDS);
      playSfx('notify');
    }
  }, [audio.status, phase, review]);
  useEffect(() => {
    if (review === null) return;
    if (review <= 0) {
      if (secIdx < sections.length - 1) {
        playSfx('next');
        wantAuto.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- đếm ngược kiểm tra xong thì sang section kế
        setSecIdx((i) => i + 1);
        setReview(null);
        setPreview(PREVIEW_SECONDS);
      }
      return;
    }
    const t = setTimeout(() => setReview((v) => (v === null ? v : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [review, secIdx, sections.length]);

  // ---- phím Space
  const toggleRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    toggleRef.current = () => {
      if (preview !== null) return;
      if (audio.status === 'playing') {
        if (!(real && audio.started)) audio.pause();
      } else if (!(real && audio.started && !audio.blocked)) audio.play();
    };
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || phase !== 'taking') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      e.preventDefault();
      toggleRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase]);

  const setAnswer = useCallback<SetAnswer>((n, v) => setAnswers((a) => ({ ...a, [n]: v })), []);

  const answered = useMemo(() => answeredNumbers(sections, answers), [sections, answers]);
  const allNumbers = useMemo(() => sections.flatMap(sectionNumbers).sort((a, b) => a - b), [sections]);
  const sectionOf = useMemo(() => {
    const m = new Map<number, number>();
    sections.forEach((sec, i) => sectionNumbers(sec).forEach((n) => m.set(n, i)));
    return m;
  }, [sections]);
  const score = useMemo(() => scoreSections(sections, answers), [sections, answers]);

  const start = () => {
    playSfx('success');
    setSettings({ realTest: real });
    wantAuto.current = real || settings.autoPlay;
    setStartedAt(Date.now());
    setPreview(PREVIEW_SECONDS);
    setPhase('taking');
  };

  const goSection = (i: number) => {
    if (i === secIdx) return;
    if (real) return;
    playSfx('tab');
    audio.pause();
    stopPronounce();
    wantAuto.current = settings.autoPlay;
    setReview(null);
    setPreview(null);
    setSecIdx(i);
  };

  const jump = (n: number) => {
    const target = sectionOf.get(n) ?? 0;
    if (real && target !== secIdx) return;
    playSfx('tap');
    if (target !== secIdx) goSection(target);
    if (Platform.OS !== 'web') return;
    setTimeout(() => {
      const el = document.getElementById(qDomId(n)) ?? document.getElementById(qDomId(n - 1)) ?? document.getElementById(qDomId(n - 2));
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el?.querySelector('input') as HTMLInputElement | null)?.focus({ preventScroll: true });
    }, target !== secIdx ? 120 : 0);
  };

  const finish = () => {
    audio.pause();
    stopPronounce();
    setConfirm(null);
    setReview(null);
    setPreview(null);
    const durationSec = elapsedNow();
    draft.clear();
    const band = bandFromScore(score.score, score.total);
    const ratio = score.total ? score.score / score.total : 0;
    playSfx(ratio >= 0.9 ? 'perfect' : ratio >= 0.6 ? 'success' : 'good');
    const a: ListeningAttempt = {
      id: `${test.id}-${sectionArg ?? 'all'}-${Date.now().toString(36)}`,
      testId: test.id,
      title: `${test.title}${sectionArg ? ` · Section ${sectionArg}` : ''}${taskType ? ` · ${taskType}` : ''}`,
      section: sectionArg ?? null,
      task: taskType,
      mode: real ? 'real' : 'practice',
      mock: from || undefined,
      startedAt: new Date(Date.now() - durationSec * 1000).toISOString(),
      finishedAt: new Date().toISOString(),
      durationSec,
      score: score.score,
      total: score.total,
      band,
      answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v])),
    };
    addAttempt(a);
    // Lượt nghe tính vào thời gian học, số câu đã trả lời và chuỗi ngày.
    const study = useStudyStore.getState();
    const minutes = Math.round(durationSec / 60);
    const answered = Object.values(answers).filter((v) => (Array.isArray(v) ? v.length > 0 : v.trim() !== '')).length;
    if (minutes > 0) study.logStudyTime('practice', Math.min(minutes, 60));
    if (answered > 0) study.logQuestions(answered);
    study.logEvent();
    setFinalMeta({ mode: a.mode, durationSec });
    setPhase('done');
  };

  const retry = () => {
    playSfx('retry');
    setAnswers({});
    setSecIdx(0);
    setStartedAt(0);
    setRestoredCount(0);
    setReview(null);
    setPreview(null);
    setFinalMeta(null);
    setPhase('ready');
    if (attemptId) router.setParams({ attempt: '' });
  };

  const askLeave = useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return true;
    return window.confirm(L('Thoát khỏi bài đang làm? Đáp án vẫn được lưu nháp 12 giờ.', 'Leave the test? Your answers stay saved as a draft for 12 hours.'));
  }, [L]);
  useLeaveGuard(phase === 'taking' && answered.size > 0, askLeave);

  const exit = () => {
    if (phase === 'taking' && answered.size > 0) setConfirm('exit');
    else router.replace((from ?? '/listening') as never);
  };

  const unanswered = allNumbers.length - answered.size;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9F7F3' }}>
      {/* Thanh trên */}
      <View className="flex-row items-center gap-2 border-b border-border bg-surface px-3 py-2.5" style={{ minHeight: 52 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={L('Thoát', 'Exit')} onPress={() => { playSfx('back'); exit(); }} className="items-center justify-center rounded-pill bg-canvas" style={{ width: 44, height: 44 }}>
          <Icon name="close" size={17} color={color.ink} strokeWidth={2.2} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="font-nun-strong text-ink" style={{ fontSize: 14 }} numberOfLines={1}>{test.title}</Text>
          <Text className="font-nun text-muted" style={{ fontSize: 12 }} numberOfLines={1}>
            {sections.length === 1 ? `Section ${sections[0]?.n}` : 'Full test'}
          </Text>
        </View>
        {/* Thi thật (màn rộng): đồng hồ nằm giữa thanh trên như bố cục phòng thi tham chiếu */}
        {phase === 'taking' && !(real && wide) ? (
          <ElapsedPill startedAt={startedAt} />
        ) : null}
        {phase === 'taking' && real && wide ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
            <ElapsedPill startedAt={startedAt} />
          </View>
        ) : null}
        {phase !== 'done' ? (
          <>
            <Pressable accessibilityRole="button" onPress={() => { playSfx('modalOpen'); setShowNotes(true); }} className="flex-row items-center justify-center gap-1.5 rounded-pill border border-border px-3" style={{ minHeight: 44, minWidth: 44 }}>
              <Icon name="note" size={15} color={color.muted} />
              {width >= 480 ? <Text className="font-nun-strong text-muted" style={{ fontSize: 12 }}>{L('Xem note', 'Notes')}</Text> : null}
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { playSfx('modalOpen'); setShowSettings(true); }} className="flex-row items-center justify-center gap-1.5 rounded-pill border border-border px-3" style={{ minHeight: 44, minWidth: 44 }}>
              <Icon name="settings" size={15} color={color.muted} />
              {width >= 480 ? <Text className="font-nun-strong text-muted" style={{ fontSize: 12 }}>{L('Cài đặt', 'Settings')}</Text> : null}
            </Pressable>
          </>
        ) : null}
      </View>

      {phase === 'ready' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View className="w-full self-center" style={{ maxWidth: 560 }}>
            <View className="overflow-hidden rounded-card border border-border bg-surface">
              <ListeningCover test={test} section={sections.length === 1 ? sections[0]?.n : null} height={150} />
              <View className="p-5">
                <Text className="font-nun-heavy text-ink" style={{ fontSize: 22 }}>{test.title}</Text>
                {test.titleVi ? <Text className="font-nun text-body text-muted">{test.titleVi}</Text> : null}
                <Text className="mt-2 font-nun-mid text-label text-muted">
                  {L(`${allNumbers.length} câu · ${sections.length} section`, `${allNumbers.length} questions · ${sections.length} section${sections.length > 1 ? 's' : ''}`)}
                </Text>

                <Text className="mb-2 mt-5 font-nun-heavy text-ink" style={{ fontSize: 14 }}>{L('Chọn chế độ', 'Choose a mode')}</Text>
                <View style={{ gap: 8 }}>
                  <ModeOption
                    on={!real}
                    title={L('Luyện tập', 'Practice')}
                    note={L('Tạm dừng, tua, nghe lại, đổi tốc độ.', 'Pause, seek, replay and change speed.')}
                    onPress={() => { playSfx('select'); setReal(false); }}
                  />
                  <ModeOption
                    on={real}
                    title={L('Thi thật', 'Real test')}
                    note={audio.audioFileReady
                      ? hasPreparedAudio
                        ? L('Audio đã có sẵn. Mỗi section có 30 giây đọc đề trước khi nghe và 30 giây kiểm tra cuối section.', 'Audio is ready. Each section gives 30 seconds to read the questions before listening and 30 seconds to check at the end.')
                        : L('Nghe một lần, không tạm dừng, có 30 giây kiểm tra cuối mỗi section.', 'One listen, no pause, 30 seconds to check after each section.')
                      : hasPreparedAudio
                        ? L('Đang kiểm tra audio của đề…', 'Checking the test audio…')
                        : L('Cần audio của đề này. Bạn có thể chọn tệp audio từ thiết bị.', 'This test needs audio. You can choose an audio file from your device.')}
                    disabled={!audio.audioFileReady}
                    onPress={() => { if (audio.audioFileReady) { playSfx('select'); setReal(true); } }}
                  />
                </View>
                {!real ? (
                  <View className="mt-3 flex-row items-center gap-3">
                    <Text className="font-nun-strong text-muted" style={{ fontSize: 13 }}>{L('Tốc độ', 'Speed')}</Text>
                    <SpeedChips speed={settings.speed} onChange={(v) => setSettings({ speed: v })} />
                  </View>
                ) : null}
                {restoredCount > 0 ? (
                  <Text className="mt-3 font-nun-mid text-label" style={{ color: '#0F7A38' }}>
                    {L(`Đã khôi phục ${restoredCount} đáp án từ lần làm dở.`, `Restored ${restoredCount} answers from your unfinished attempt.`)}
                  </Text>
                ) : null}
                <FallbackNote audio={audio} />
                {hasPreparedAudio ? (
                  <Text className="mt-3 font-nun-mid text-label text-muted">{L('Audio của đề được phát trực tiếp từ thư viện.', 'The test audio streams directly from the library.')}</Text>
                ) : (
                  <>
                    <Button
                      className="mt-3"
                      variant="outline"
                      iconLeft="volume"
                      label={localAudio?.name ? L(`Đã nạp: ${localAudio.name}`, `Loaded: ${localAudio.name}`) : L('Chọn audio của section này từ thiết bị', 'Choose this section’s audio from your device')}
                      onPress={chooseLocalAudio}
                    />
                    <Text className="mt-1 font-nun text-label text-muted">{L('Tệp chỉ ở trên thiết bị trong phiên này. Tải audio của đề mới mở được chế độ thi thật.', 'The file stays on this device for this session. Test mode requires audio for this source.')}</Text>
                  </>
                )}
                <Button className="mt-5" size="lg" label={L('Bắt đầu làm bài', 'Start test')} iconRight="arrow-right" disabled={real && !audio.audioFileReady} onPress={start} />
                <Text className="mt-2 text-center font-nun text-label text-subtle">{L('Nên đeo tai nghe. Phím Space = phát / tạm dừng.', 'Headphones recommended. Space = play / pause.')}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : null}

      {phase === 'taking' ? (
        <>
          {sections.length > 1 ? (
            <View className="flex-row gap-1.5 border-b border-border bg-surface px-3 py-2">
              {sections.map((sec, i) => (
                <Pressable
                  key={sec.n}
                  accessibilityRole="tab"
                  aria-selected={i === secIdx}
                  aria-disabled={real && i !== secIdx}
                  onPress={() => goSection(i)}
                  className="items-center justify-center rounded-pill px-4"
                  style={{ minHeight: 44, backgroundColor: i === secIdx ? SECTION_COLOR[sec.n] : '#F5F1E9', opacity: real && i !== secIdx ? 0.5 : 1 }}
                >
                  <Text className="font-nun-strong" style={{ fontSize: 13, color: i === secIdx ? '#FFFFFF' : color.muted }}>Section {sec.n}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {preview !== null ? (
            <View className="flex-row flex-wrap items-center justify-center gap-3 px-3 py-2" style={{ backgroundColor: '#EEF4FF' }}>
              <Text className="font-nun-strong" style={{ fontSize: 13, color: '#1E3A8A' }}>
                {L(`Đọc đề bài và hướng dẫn của Section ${section.n} trước khi nghe: ${preview}s`, `Read the questions and instructions for Section ${section.n} before listening: ${preview}s`)}
              </Text>
              {!real ? (
                <Pressable accessibilityRole="button" onPress={() => setPreview(0)} className="rounded-pill px-3" style={{ minHeight: 36, justifyContent: 'center', backgroundColor: '#1E3A8A' }}>
                  <Text className="font-nun-strong" style={{ fontSize: 13, color: '#FFFFFF' }}>{L('Bắt đầu nghe', 'Start listening')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {review !== null ? (
            <View className="flex-row flex-wrap items-center justify-center gap-3 px-3 py-2" style={{ backgroundColor: '#FEF4E6' }}>
              <Text className="font-nun-strong" style={{ fontSize: 13, color: '#7A4A00' }}>
                {review > 0
                  ? L(`Thời gian kiểm tra đáp án: ${review}s`, `Check your answers: ${review}s`)
                  : secIdx < sections.length - 1
                    ? L('Chuyển sang section tiếp theo…', 'Moving to the next section…')
                    : L('Hết thời gian kiểm tra. Bấm Hoàn thành khi sẵn sàng.', 'Check time is over. Press Finish when ready.')}
              </Text>
              {!real && review > 0 && secIdx < sections.length - 1 ? (
                <Pressable accessibilityRole="button" onPress={() => setReview(0)} className="rounded-pill px-3" style={{ minHeight: 36, justifyContent: 'center', backgroundColor: '#7A4A00' }}>
                  <Text className="font-nun-strong" style={{ fontSize: 13, color: '#FFFFFF' }}>{L('Sang section tiếp', 'Next section')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View className="min-h-0 flex-1 flex-row">
            {/* Cột công cụ bên trái (màn rộng), theo bố cục phòng thi tham chiếu */}
            {wide ? (
              <View className="items-center gap-3 border-r border-border bg-surface px-3 pt-5" style={{ width: 104 }}>
                <Text className="font-nun-heavy text-ink" style={{ fontSize: 14 }}>{L('Công cụ', 'Tools')}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { playSfx('modalOpen'); setShowNotes(true); }}
                  className="w-full items-center justify-center gap-1.5 rounded-xl border-2 py-3"
                  style={{ borderColor: GREEN, backgroundColor: '#F0FBF4' }}
                >
                  <Icon name="note" size={20} color={GREEN} />
                  <Text className="font-nun-strong text-center" style={{ fontSize: 12, color: '#0F7A38' }}>{L('Ghi chú', 'Notes')}</Text>
                </Pressable>
              </View>
            ) : null}
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 + keyboardInset }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              <View className="w-full self-center" style={{ maxWidth: 820 }}>
                <Text className="font-nun-heavy text-ink" style={{ fontSize: 20 }}>{`Section ${section.n} — ${section.title}`}</Text>
                {section.context ? (
                  <Text className="mb-3 mt-1.5 font-nun text-label text-muted">{section.context}</Text>
                ) : null}
                {section.groups.map((g, i) => (
                  <GroupBlock key={`${section.n}-${i}`} group={g} answers={answers} setAnswer={setAnswer} />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Thanh nghe ở đáy, luôn hiện: giống bố cục tham chiếu (tiến độ, lùi/tiến 5s, tốc độ) */}
          <AudioBar
            audio={audio}
            real={real}
            label={real ? `Section ${section.n} · ${L('Thi thật, nghe một lần', 'Real test, one listen')}` : `Section ${section.n}`}
            speed={speed}
            onSpeed={(v) => setSettings({ speed: v })}
          />
          {localAudio || hasPreparedAudio ? null : (
            <Pressable accessibilityRole="button" onPress={chooseLocalAudio} className="items-center bg-surface py-1.5">
              <Text className="font-nun-mid text-label text-primary-700">{L('Chọn file audio của section này', 'Choose audio for this section')}</Text>
            </Pressable>
          )}

          {/* Thanh điều hướng câu — ẩn khi bàn phím đang mở để ô điền không bị đè */}
          {keyboardInset > 0 && !wide ? null : (
          <View
            className="flex-row items-center gap-3 border-t border-border bg-surface px-3 py-2.5"
            style={Platform.OS === 'web' ? ({ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' } as object) : undefined}
          >
            <View className="min-w-0" style={{ marginRight: 4 }}>
              <Text className="font-nun-heavy text-ink" style={{ fontSize: 15 }}>Practice</Text>
              <Text className="font-nun-mid" style={{ fontSize: 12, color: '#6B7280' }}>{L(`Đã làm ${answered.size} / ${allNumbers.length}`, `Done ${answered.size} / ${allNumbers.length}`)}</Text>
            </View>
            <ScrollView horizontal={!wide} showsHorizontalScrollIndicator={false} className="min-w-0 flex-1" snapToInterval={wide ? undefined : 50} decelerationRate="fast" contentContainerStyle={wide ? { flexWrap: 'wrap', flexDirection: 'row', gap: 6, justifyContent: 'center' } : { gap: 6, justifyContent: 'center' }}>
              {allNumbers.map((n) => {
                const done = answered.has(n);
                const inSec = sectionOf.get(n) === secIdx;
                return (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityLabel={L(`Câu ${n}`, `Question ${n}`)}
                    onPress={() => jump(n)}
                    style={{
                      width: wide ? 36 : 40, height: wide ? 36 : 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
                      borderColor: done ? '#1D4ED8' : '#D1D5DB', backgroundColor: done ? '#DBEAFE' : '#FFFFFF', opacity: inSec ? 1 : 0.6,
                    }}
                  >
                    <Text className="font-nun-heavy" style={{ fontSize: 14, color: done ? '#1D4ED8' : '#374151' }}>{n}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => { playSfx('modalOpen'); setConfirm('submit'); }} className="items-center justify-center rounded-lg px-5" style={{ minHeight: 44, backgroundColor: '#E11D48' }}>
              <Text className="font-nun-heavy" style={{ fontSize: 15, color: '#FFFFFF' }}>{L('Nộp bài', 'Submit')}</Text>
            </Pressable>
          </View>
          )}
        </>
      ) : null}

      {phase === 'done' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <View className="w-full self-center" style={{ maxWidth: 1180 }}>
            <ListeningResults
              testTitle={`${test.title} · ${sections.length === 1 ? `Section ${sections[0]?.n}` : 'Full test'}`}
              sections={sections}
              score={score.score}
              total={score.total}
              results={score.results}
              mode={finalMeta?.mode ?? 'practice'}
              durationSec={finalMeta?.durationSec ?? 0}
              onRetry={retry}
              onLibrary={() => router.replace((from ?? '/listening') as never)}
              libraryLabel={from ? L('Về thi thử', 'Back to mock test') : undefined}
            />
          </View>
        </ScrollView>
      ) : null}

      {/* Cài đặt */}
      <Sheet visible={showSettings} onClose={() => setShowSettings(false)}>
        <Text className="font-nun-heavy text-ink" style={{ fontSize: 18 }}>{L('Cài đặt', 'Settings')}</Text>
        <ToggleRow
          label={L('Chế độ thi thật', 'Real test mode')}
          note={L('Nghe một lần, không tạm dừng / tua. Đổi trước khi bắt đầu.', 'One listen, no pause or seek. Change before you start.')}
          on={real}
          disabled={phase !== 'ready'}
          onChange={(v) => setReal(v)}
        />
        <ToggleRow
          label={L('Tự phát khi chuyển section', 'Auto-play on section change')}
          on={settings.autoPlay}
          onChange={(v) => setSettings({ autoPlay: v })}
        />
        <View>
          <Text className="mb-1.5 font-nun-strong text-ink" style={{ fontSize: 14 }}>{L('Tốc độ phát', 'Playback speed')}</Text>
          <SpeedChips speed={real ? 1 : settings.speed} onChange={(v) => setSettings({ speed: v })} disabled={real} />
        </View>
        <Button label={L('Xong', 'Done')} onPress={() => { playSfx('modalClose'); setShowSettings(false); }} />
      </Sheet>

      {/* Ghi chú */}
      <Sheet visible={showNotes} onClose={() => setShowNotes(false)} maxWidth={420} gap={12}>
        <Text className="font-nun-heavy text-ink" style={{ fontSize: 18 }}>{L('Ghi chú nhanh', 'Quick notes')}</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder={L('Ghi tên, số, từ khoá khi nghe…', 'Jot down names, numbers, keywords…')}
          style={{ minHeight: 140, borderWidth: 1, borderColor: color.borderStrong, borderRadius: 12, padding: 10, fontSize: 16, textAlignVertical: 'top' } as never}
        />
        <Button label={L('Xong', 'Done')} onPress={() => { playSfx('modalClose'); setShowNotes(false); }} />
      </Sheet>

      {/* Xác nhận nộp / thoát */}
      <Sheet visible={confirm !== null} onClose={() => setConfirm(null)} maxWidth={360} gap={12}>
        <Text className="font-nun-heavy text-ink" style={{ fontSize: 18 }}>
          {confirm === 'exit' ? L('Thoát khỏi bài?', 'Leave the test?') : L('Nộp bài?', 'Submit?')}
        </Text>
        <Text className="font-nun text-body text-muted">
          {confirm === 'exit'
            ? L('Bài chưa nộp sẽ không có điểm; đáp án vẫn được lưu nháp 12 giờ.', 'An unsubmitted test gets no score; answers stay saved as a draft for 12 hours.')
            : unanswered > 0
              ? L(`Còn ${unanswered} câu chưa trả lời.`, `${unanswered} questions are still unanswered.`)
              : L('Bạn đã trả lời hết các câu.', 'You answered every question.')}
        </Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button label={L('Quay lại', 'Cancel')} variant="outline" onPress={() => { playSfx('modalClose'); setConfirm(null); }} />
          </View>
          <View className="flex-1">
            <Button
              label={confirm === 'exit' ? L('Thoát', 'Leave') : L('Nộp bài', 'Submit')}
              onPress={() => {
                if (confirm === 'exit') {
                  allowLeave();
                  router.replace((from ?? '/listening') as never);
                } else finish();
              }}
            />
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

/** Đồng hồ đã làm bài, tự giữ giây (xem ghi chú ở `Exam`). */
function ElapsedPill({ startedAt }: { startedAt: number }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec(startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const mmss = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  return (
    <View className="flex-row items-center gap-1.5 rounded-pill px-3" style={{ backgroundColor: '#E8F8EE', minHeight: 36 }}>
      <Icon name="clock" size={14} color={GREEN} strokeWidth={2.2} />
      <Text className="font-nun-heavy" style={{ fontSize: 14, color: '#0F7A38', fontVariant: ['tabular-nums'] }}>{mmss}</Text>
    </View>
  );
}

function ModeOption({ on, title, note, onPress, disabled = false }: { on: boolean; title: string; note: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={on}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      className="flex-row items-start gap-3 rounded-panel border p-3"
      style={{ borderColor: on ? color.primary : color.borderStrong, backgroundColor: on ? '#FBF7EE' : '#FFFFFF', opacity: disabled ? 0.6 : 1 }}
    >
      <View style={{ width: 18, height: 18, borderRadius: 9, marginTop: 2, borderWidth: on ? 5 : 1.5, borderColor: on ? color.primary : color.borderStrong }} />
      <View className="min-w-0 flex-1">
        <Text className="font-nun-strong text-ink" style={{ fontSize: 15 }}>{title}</Text>
        <Text className="font-nun text-label text-muted" style={{ lineHeight: 18 }}>{note}</Text>
      </View>
    </Pressable>
  );
}

function ToggleRow({ label, note, on, onChange, disabled }: { label: string; note?: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="switch"
      aria-checked={on}
      disabled={disabled}
      onPress={() => { playSfx('tap'); onChange(!on); }}
      className="flex-row items-center gap-3"
      style={{ opacity: disabled ? 0.5 : 1, minHeight: 48 }}
    >
      <View className="min-w-0 flex-1">
        <Text className="font-nun-strong text-ink" style={{ fontSize: 14 }}>{label}</Text>
        {note ? <Text className="font-nun text-label text-muted">{note}</Text> : null}
      </View>
      <View style={{ width: 42, height: 24, borderRadius: 12, padding: 2, backgroundColor: on ? color.primary : '#E5DFD2', justifyContent: 'center' }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', alignSelf: on ? 'flex-end' : 'flex-start' }} />
      </View>
    </Pressable>
  );
}
