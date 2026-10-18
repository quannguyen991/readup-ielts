import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExamToolbar, ExamToolbarButton, EXAM_INK } from '@/components/exam/ExamToolbar';
import { AudioStrip, FallbackNote, SpeedChips } from '@/components/listening/AudioPanel';
import { ListeningCover } from '@/components/listening/cover';
import { Sheet } from '@/components/listening/Sheet';
import { ListeningResults } from '@/components/listening/ListeningResults';
import { ExamTextCtx, GroupBlock, qDomId, type SetAnswer } from '@/components/listening/QuestionGroups';
import { useSectionAudio } from '@/components/listening/useSectionAudio';
import { Button, Icon } from '@/components/ui';
import { getListeningTest } from '@/data/listening-tests';
import { answeredNumbers, bandFromScore, scoreSections, sectionNumbers } from '@/services/listening/scoring';
import type { ListeningAnswers, ListeningAttempt, ListeningSection, ListeningTest } from '@/services/listening/types';
import { stopPronounce } from '@/services/audio/pronounce';
import { playSfx } from '@/services/audio/sfx-ui';
import { useListeningStore } from '@/store/useListeningStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { allowLeave, useExamDraft, useExamWebTweaks, useKeyboardInset, useLeaveGuard, useWakeLock } from '@/lib/mobile/useMobileExam';

/**
 * Phòng thi Listening. Ba pha: `ready` (chọn chế độ) -> `taking` (nghe + làm) ->
 * `done` (điểm, đối chiếu, bản chữ). Mở lại một lượt cũ (`?attempt=`) vào thẳng `done`.
 *
 * Giao diện: nền navy, thanh công cụ dùng chung (`ExamToolbar`) ở trên, dải trình phát
 * ngay dưới, rồi khung kem chứa đề. Chỉ đổi bố cục; logic phát, chấm, nháp, phím tắt
 * giữ nguyên.
 */

const REVIEW_SECONDS = 30;
const NAVY = '#0F1D33';
const INK = EXAM_INK;
/** Các nền khung đề để chọn trên thanh công cụ (chỉ số đầu là kem mặc định). */
const PAPER_TONES = ['#FBF7EE', '#FFFFFF', '#F1F6EE', '#EEF2F8'] as const;
const TEXT_SIZES = [15, 17, 19, 21] as const;
const NARROW_BELOW = 760;

type Phase = 'ready' | 'taking' | 'done';

export default function ListeningExamScreen() {
  const { L } = useL();
  const { id, s, task, attempt } = useLocalSearchParams<{ id: string; s?: string; task?: string; attempt?: string }>();
  const test = typeof id === 'string' ? getListeningTest(id) : undefined;
  if (!test) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: NAVY }}>
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className="font-heavy" style={{ fontSize: 18, color: '#FFFFFF' }}>{L('Không tìm thấy đề này.', 'Test not found.')}</Text>
          <Button label={L('Về thư viện Listening', 'Back to Listening')} onPress={() => router.replace('/listening' as never)} />
        </View>
      </SafeAreaView>
    );
  }
  return <Exam key={`${test.id}-${s ?? 'all'}-${task ?? 'all'}-${attempt ?? ''}`} test={test} sectionParam={s} taskParam={task} attemptId={attempt} />;
}

function Exam({ test, sectionParam, taskParam, attemptId }: { test: ListeningTest; sectionParam?: string; taskParam?: string; attemptId?: string }) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const narrow = width < NARROW_BELOW;

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
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [confirm, setConfirm] = useState<null | 'submit' | 'exit'>(null);
  const [finalMeta, setFinalMeta] = useState<{ mode: 'practice' | 'real'; durationSec: number } | null>(
    saved ? { mode: saved.mode, durationSec: saved.durationSec } : null,
  );
  // Giao diện phòng thi: câu đang làm (viền nổi trên thanh công cụ), cỡ/kiểu chữ, nền khung đề.
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [textSizeIdx, setTextSizeIdx] = useState(0);
  const [boldText, setBoldText] = useState(false);
  const [toneIdx, setToneIdx] = useState(0);
  const textCtx = useMemo(() => ({ size: TEXT_SIZES[textSizeIdx] ?? 15, bold: boldText }), [textSizeIdx, boldText]);

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
    /* Đồng bộ với phần tử audio bên ngoài React: phát đúng lúc nó sẵn sàng. */
    if (!wantAuto.current || phase !== 'taking' || audio.status !== 'idle') return;
    if (audio.mode === 'tts' || audio.duration > 0) {
      wantAuto.current = false;
      audio.play();
    }
  }, [audio, phase]);

  // ---- thi thật: hết âm thanh -> 30 giây kiểm tra, rồi sang section kế
  useEffect(() => {
    if (phase === 'taking' && real && audio.status === 'ended' && review === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- phản ứng với sự kiện audio kết thúc
      setReview(REVIEW_SECONDS);
      playSfx('notify');
    }
  }, [audio.status, phase, real, review]);
  useEffect(() => {
    if (review === null) return;
    if (review <= 0) {
      if (secIdx < sections.length - 1) {
        playSfx('next');
        wantAuto.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- đếm ngược kiểm tra xong thì sang section kế
        setSecIdx((i) => i + 1);
        setReview(null);
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

  // Câu đang làm: câu vừa chạm/điền, không thì câu chưa làm đầu tiên của section.
  const firstOpen = useMemo(
    () => sectionNumbers(section).find((n) => !answered.has(n)) ?? null,
    [section, answered],
  );
  const currentQ = activeQ !== null && sectionOf.get(activeQ) === secIdx ? activeQ : firstOpen;
  const secNums = sectionNumbers(section);
  const partFirst = secNums.length ? Math.min(...secNums) : 1;
  const partLast = secNums.length ? Math.max(...secNums) : 1;

  const sourceNote = hasPreparedAudio
    ? audio.audioFileReady
      ? L('Audio tạo sẵn bằng Aoede · đề luyện tập nguyên bản của Band 9', 'Pre-generated Aoede audio · original Band 9 practice material')
      : audio.mode === 'tts'
        ? L('Audio không tải được; đang dùng giọng đọc trên thiết bị làm dự phòng.', 'Audio could not load; using the device voice as a fallback.')
        : L('Đang tải audio Aoede đã chuẩn bị sẵn…', 'Loading the pre-generated Aoede audio…')
    : undefined;

  const start = () => {
    playSfx('success');
    setSettings({ realTest: real });
    wantAuto.current = real || settings.autoPlay;
    setStartedAt(Date.now());
    setPhase('taking');
  };

  const goSection = (i: number) => {
    if (i === secIdx) return;
    if (real) return;
    playSfx('tab');
    audio.pause();
    stopPronounce();
    wantAuto.current = settings.autoPlay;
    setSecIdx(i);
  };

  const jump = (n: number) => {
    const target = sectionOf.get(n) ?? 0;
    if (real && target !== secIdx) return;
    playSfx('tap');
    setActiveQ(n);
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
      startedAt: new Date(Date.now() - durationSec * 1000).toISOString(),
      finishedAt: new Date().toISOString(),
      durationSec,
      score: score.score,
      total: score.total,
      band,
      answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v])),
    };
    addAttempt(a);
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
    setFinalMeta(null);
    setActiveQ(null);
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
    else router.replace('/listening' as never);
  };

  const unanswered = allNumbers.length - answered.size;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: NAVY }}>
      {/* Thanh trên khi chọn chế độ và khi xem kết quả (lúc làm bài, thanh công cụ thay thế) */}
      {phase !== 'taking' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 56 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L('Thoát', 'Exit')}
            onPress={() => { playSfx('back'); exit(); }}
            style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <Icon name="close" size={17} color="#FFFFFF" strokeWidth={2.2} />
          </Pressable>
          <View style={{ minWidth: 0, flex: 1 }}>
            <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }} numberOfLines={1}>{test.title}</Text>
            <Text className="font-sans" style={{ fontSize: 12, color: '#B8C4D6' }} numberOfLines={1}>
              {sections.length === 1 ? `Section ${sections[0]?.n}` : 'Full test'}
            </Text>
          </View>
          {phase === 'ready' ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => { playSfx('modalOpen'); setShowNotes(true); }}
                style={{ minHeight: 44, minWidth: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Icon name="note" size={15} color="#FFFFFF" />
                {width >= 480 ? <Text className="font-strong" style={{ fontSize: 12, color: '#FFFFFF' }}>{L('Xem note', 'Notes')}</Text> : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => { playSfx('modalOpen'); setShowSettings(true); }}
                style={{ minHeight: 44, minWidth: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Icon name="settings" size={15} color="#FFFFFF" />
                {width >= 480 ? <Text className="font-strong" style={{ fontSize: 12, color: '#FFFFFF' }}>{L('Cài đặt', 'Settings')}</Text> : null}
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      {phase === 'ready' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View className="w-full self-center" style={{ maxWidth: 560 }}>
            <View className="overflow-hidden rounded-card border border-border bg-surface">
              <ListeningCover test={test} section={sections.length === 1 ? sections[0]?.n : null} height={150} />
              <View className="p-5">
                <Text className="font-heavy text-ink" style={{ fontSize: 22 }}>{test.title}</Text>
                {test.titleVi ? <Text className="font-sans text-body text-muted">{test.titleVi}</Text> : null}
                <Text className="mt-2 font-mid text-label text-muted">
                  {L(`${allNumbers.length} câu · ${sections.length} section`, `${allNumbers.length} questions · ${sections.length} section${sections.length > 1 ? 's' : ''}`)}
                </Text>

                <Text className="mb-2 mt-5 font-heavy text-ink" style={{ fontSize: 14 }}>{L('Chọn chế độ', 'Choose a mode')}</Text>
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
                        ? L('Audio luyện tập Aoede đã chuẩn bị sẵn. Nghe một lần, có 30 giây kiểm tra cuối mỗi section.', 'Pre-generated Aoede practice audio is ready. One listen, with 30 seconds to check at the end of each section.')
                        : L('Nghe một lần, không tạm dừng, có 30 giây kiểm tra cuối mỗi section.', 'One listen, no pause, 30 seconds to check after each section.')
                      : hasPreparedAudio
                        ? L('Đang tải audio luyện tập đã chuẩn bị sẵn…', 'Loading the pre-generated practice audio…')
                        : L('Cần audio của đề này. Bạn có thể chọn tệp audio từ thiết bị.', 'This test needs audio. You can choose an audio file from your device.')}
                    disabled={!audio.audioFileReady}
                    onPress={() => { if (audio.audioFileReady) { playSfx('select'); setReal(true); } }}
                  />
                </View>
                {!real ? (
                  <View className="mt-3 flex-row items-center gap-3">
                    <Text className="font-strong text-muted" style={{ fontSize: 13 }}>{L('Tốc độ', 'Speed')}</Text>
                    <SpeedChips speed={settings.speed} onChange={(v) => setSettings({ speed: v })} />
                  </View>
                ) : null}
                {restoredCount > 0 ? (
                  <Text className="mt-3 font-mid text-label" style={{ color: '#0F7A38' }}>
                    {L(`Đã khôi phục ${restoredCount} đáp án từ lần làm dở.`, `Restored ${restoredCount} answers from your unfinished attempt.`)}
                  </Text>
                ) : null}
                <FallbackNote audio={audio} />
                {hasPreparedAudio ? (
                  <Text className="mt-3 font-mid text-label text-muted">{L('Audio luyện tập đã được tạo sẵn bằng giọng Aoede và phát trực tiếp từ thư viện.', 'Aoede practice audio is pre-generated and ready to stream from the library.')}</Text>
                ) : (
                  <>
                    <Button
                      className="mt-3"
                      variant="outline"
                      iconLeft="volume"
                      label={localAudio?.name ? L(`Đã nạp: ${localAudio.name}`, `Loaded: ${localAudio.name}`) : L('Chọn audio của section này từ thiết bị', 'Choose this section’s audio from your device')}
                      onPress={chooseLocalAudio}
                    />
                    <Text className="mt-1 font-sans text-label text-muted">{L('Tệp chỉ ở trên thiết bị trong phiên này. Tải audio của đề mới mở được chế độ thi thật.', 'The file stays on this device for this session. Test mode requires audio for this source.')}</Text>
                  </>
                )}
                <Button className="mt-5" size="lg" label={L('Bắt đầu làm bài', 'Start test')} iconRight="arrow-right" disabled={real && !audio.audioFileReady} onPress={start} />
                <Text className="mt-2 text-center font-sans text-label text-subtle">{L('Nên đeo tai nghe. Phím Space = phát / tạm dừng.', 'Headphones recommended. Space = play / pause.')}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : null}

      {phase === 'taking' ? (
        <View style={{ flex: 1, minHeight: 0, gap: 10, padding: 10 }}>
          <ExamToolbar
            onBack={() => { playSfx('back'); exit(); }}
            parts={sections.map((sec) => ({ key: String(sec.n), label: `Part ${sec.n}` }))}
            activePart={String(section.n)}
            onPickPart={(key) => {
              const i = sections.findIndex((sec) => String(sec.n) === key);
              if (i >= 0) goSection(i);
            }}
            questionNumbers={secNums}
            answered={answered}
            current={currentQ}
            onJump={jump}
            timer=""
            timerSlot={<ElapsedPill startedAt={startedAt} />}
            onSubmit={() => { playSfx('modalOpen'); setConfirm('submit'); }}
            submitLabel={L('Kiểm tra', 'Check')}
            typography={{
              fontLabel: boldText ? L('Chữ đậm', 'Bold text') : L('Chữ thường', 'Regular text'),
              onCycleFont: () => setBoldText((b) => !b),
              sizeLabel: `${textCtx.size}px`,
              onCycleSize: () => setTextSizeIdx((i) => (i + 1) % TEXT_SIZES.length),
            }}
            themes={{ swatches: PAPER_TONES, theme: toneIdx, onPick: setToneIdx }}
            extras={(
              <>
                <ExamToolbarButton label={L('Ghi chú', 'Notes')} icon="note" compact={narrow} onPress={() => { playSfx('modalOpen'); setShowNotes(true); }} />
                <ExamToolbarButton label={L('Cài đặt', 'Settings')} icon="settings" compact={narrow} onPress={() => { playSfx('modalOpen'); setShowSettings(true); }} />
              </>
            )}
          />

          <AudioStrip
            audio={audio}
            real={real}
            speed={speed}
            onSpeed={(v) => setSettings({ speed: v })}
            sourceNote={sourceNote}
            localAudioName={localAudio?.name}
            onPickAudio={real || hasPreparedAudio ? undefined : chooseLocalAudio}
            narrow={narrow}
          />

          {review !== null ? (
            <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: INK, backgroundColor: '#FEF4E6' }}>
              <Text className="text-center font-strong" style={{ fontSize: 13, color: '#7A4A00' }}>
                {review > 0
                  ? L(`Thời gian kiểm tra đáp án: ${review}s`, `Check your answers: ${review}s`)
                  : secIdx < sections.length - 1
                    ? L('Chuyển sang section tiếp theo…', 'Moving to the next section…')
                    : L('Hết thời gian kiểm tra. Bấm Kiểm tra khi sẵn sàng.', 'Check time is over. Press Check when ready.')}
              </Text>
            </View>
          ) : null}

          {/* Khung kem chứa đề: tiêu đề phần + tên đề ở trên, nội dung cuộn bên trong */}
          <View
            style={{
              flex: 1,
              minHeight: 0,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: INK,
              backgroundColor: PAPER_TONES[toneIdx] ?? PAPER_TONES[0],
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 8,
                paddingHorizontal: 18,
                paddingVertical: 12,
                borderBottomWidth: 1.5,
                borderColor: '#D9CFBC',
              }}
            >
              <View style={{ minWidth: 0, flexShrink: 1 }}>
                <Text className="font-heavy" style={{ fontSize: 16, color: INK }}>
                  {L(`Part ${section.n} · Câu ${partFirst}–${partLast}`, `Part ${section.n} · Questions ${partFirst}–${partLast}`)}
                </Text>
                <Text className="font-strong" numberOfLines={1} style={{ marginTop: 2, fontSize: 11, letterSpacing: 0.8, color: '#6B6353', textTransform: 'uppercase' }}>
                  {section.title}
                </Text>
              </View>
              <Text className="font-strong" numberOfLines={1} style={{ fontSize: 11, letterSpacing: 0.8, color: '#6B6353', textTransform: 'uppercase' }}>
                {test.title}
              </Text>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 + keyboardInset }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <ExamTextCtx.Provider value={textCtx}>
                <View style={{ width: '100%', maxWidth: 880, alignSelf: 'center' }}>
                  {section.context ? (
                    <Text className="font-sans" style={{ marginBottom: 14, fontSize: textCtx.size - 1, lineHeight: Math.round((textCtx.size - 1) * 1.5), color: '#4A4438' }}>
                      {section.context}
                    </Text>
                  ) : null}
                  {section.groups.map((g, i) => (
                    <GroupBlock key={`${section.n}-${i}`} group={g} answers={answers} setAnswer={setAnswer} onFocusQ={setActiveQ} />
                  ))}
                </View>
              </ExamTextCtx.Provider>
            </ScrollView>
          </View>
        </View>
      ) : null}

      {phase === 'done' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <View className="w-full self-center" style={{ maxWidth: 1180 }}>
            <View style={{ borderRadius: 18, borderWidth: 2, borderColor: INK, backgroundColor: PAPER_TONES[0], padding: 14 }}>
              <ListeningResults
                testTitle={`${test.title} · ${sections.length === 1 ? `Section ${sections[0]?.n}` : 'Full test'}`}
                sections={sections}
                score={score.score}
                total={score.total}
                results={score.results}
                mode={finalMeta?.mode ?? 'practice'}
                durationSec={finalMeta?.durationSec ?? 0}
                onRetry={retry}
                onLibrary={() => router.replace('/listening' as never)}
              />
            </View>
          </View>
        </ScrollView>
      ) : null}

      {/* Cài đặt */}
      <Sheet visible={showSettings} onClose={() => setShowSettings(false)}>
        <Text className="font-heavy text-ink" style={{ fontSize: 18 }}>{L('Cài đặt', 'Settings')}</Text>
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
          <Text className="mb-1.5 font-strong text-ink" style={{ fontSize: 14 }}>{L('Tốc độ phát', 'Playback speed')}</Text>
          <SpeedChips speed={real ? 1 : settings.speed} onChange={(v) => setSettings({ speed: v })} disabled={real} />
        </View>
        <Button label={L('Xong', 'Done')} onPress={() => { playSfx('modalClose'); setShowSettings(false); }} />
      </Sheet>

      {/* Ghi chú */}
      <Sheet visible={showNotes} onClose={() => setShowNotes(false)} maxWidth={420} gap={12}>
        <Text className="font-heavy text-ink" style={{ fontSize: 18 }}>{L('Ghi chú nhanh', 'Quick notes')}</Text>
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
        <Text className="font-heavy text-ink" style={{ fontSize: 18 }}>
          {confirm === 'exit' ? L('Thoát khỏi bài?', 'Leave the test?') : L('Nộp bài?', 'Submit?')}
        </Text>
        <Text className="font-sans text-body text-muted">
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
                  router.replace('/listening' as never);
                } else finish();
              }}
            />
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

/** Đồng hồ đã làm bài, tự giữ giây (xem ghi chú ở `Exam`). Nằm trong thanh công cụ. */
function ElapsedPill({ startedAt }: { startedAt: number }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec(startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const mmss = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 34, borderRadius: 999, borderWidth: 2, borderColor: INK, backgroundColor: '#FFFFFF' }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2E9E5B' }} />
      <Text className="font-heavy" style={{ fontSize: 13, color: INK, fontVariant: ['tabular-nums'] }}>{mmss}</Text>
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
        <Text className="font-strong text-ink" style={{ fontSize: 15 }}>{title}</Text>
        <Text className="font-sans text-label text-muted" style={{ lineHeight: 18 }}>{note}</Text>
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
        <Text className="font-strong text-ink" style={{ fontSize: 14 }}>{label}</Text>
        {note ? <Text className="font-sans text-label text-muted">{note}</Text> : null}
      </View>
      <View style={{ width: 42, height: 24, borderRadius: 12, padding: 2, backgroundColor: on ? color.primary : '#E5DFD2', justifyContent: 'center' }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', alignSelf: on ? 'flex-end' : 'flex-start' }} />
      </View>
    </Pressable>
  );
}
