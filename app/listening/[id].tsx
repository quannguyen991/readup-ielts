import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioBar, AudioCard, FallbackNote, SpeedChips } from '@/components/listening/AudioPanel';
import { SECTION_COLOR, ListeningCover } from '@/components/listening/cover';
import { ListeningResults } from '@/components/listening/ListeningResults';
import { GroupBlock, qDomId, type SetAnswer } from '@/components/listening/QuestionGroups';
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

/**
 * Phòng thi Listening. Ba pha: `ready` (chọn chế độ) -> `taking` (nghe + làm) ->
 * `done` (điểm, đối chiếu, bản chữ). Mở lại một lượt cũ (`?attempt=`) vào thẳng `done`.
 */

const REVIEW_SECONDS = 30;
const GREEN = '#16A34A';

type Phase = 'ready' | 'taking' | 'done';

export default function ListeningExamScreen() {
  const { L } = useL();
  const { id, s, attempt } = useLocalSearchParams<{ id: string; s?: string; attempt?: string }>();
  const test = typeof id === 'string' ? getListeningTest(id) : undefined;
  if (!test) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9F7F3' }}>
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className="font-heavy text-ink" style={{ fontSize: 18 }}>{L('Không tìm thấy đề này.', 'Test not found.')}</Text>
          <Button label={L('Về thư viện Listening', 'Back to Listening')} onPress={() => router.replace('/listening' as never)} />
        </View>
      </SafeAreaView>
    );
  }
  return <Exam key={`${test.id}-${s ?? 'all'}-${attempt ?? ''}`} test={test} sectionParam={s} attemptId={attempt} />;
}

function Exam({ test, sectionParam, attemptId }: { test: ListeningTest; sectionParam?: string; attemptId?: string }) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

  const wanted = sectionParam ? Number(sectionParam) : null;
  const sections = useMemo(() => {
    const picked = wanted ? test.sections.filter((x) => x.n === wanted) : [];
    return picked.length ? picked : test.sections;
  }, [test, wanted]);
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
  const [elapsed, setElapsed] = useState(saved?.durationSec ?? 0);
  const [review, setReview] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [confirm, setConfirm] = useState<null | 'submit' | 'exit'>(null);
  const [finalMeta, setFinalMeta] = useState<{ mode: 'practice' | 'real'; durationSec: number } | null>(
    saved ? { mode: saved.mode, durationSec: saved.durationSec } : null,
  );

  const section = (sections[secIdx] ?? sections[0]) as ListeningSection;
  const speed = real ? 1 : settings.speed;
  const audio = useSectionAudio({ src: section.audio, transcript: section.transcript, speed });
  const wantAuto = useRef(false);

  // ---- đồng hồ
  useEffect(() => {
    if (phase !== 'taking') return;
    const t = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

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

  const start = () => {
    playSfx('success');
    setSettings({ realTest: real });
    wantAuto.current = real || settings.autoPlay;
    setElapsed(0);
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
    const durationSec = elapsed;
    const band = bandFromScore(score.score, score.total);
    const ratio = score.total ? score.score / score.total : 0;
    playSfx(ratio >= 0.9 ? 'perfect' : ratio >= 0.6 ? 'success' : 'good');
    const a: ListeningAttempt = {
      id: `${test.id}-${sectionArg ?? 'all'}-${Date.now().toString(36)}`,
      testId: test.id,
      title: test.title,
      section: sectionArg ?? null,
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
    setElapsed(0);
    setReview(null);
    setFinalMeta(null);
    setPhase('ready');
    if (attemptId) router.setParams({ attempt: '' });
  };

  const exit = () => {
    if (phase === 'taking' && answered.size > 0) setConfirm('exit');
    else router.replace('/listening' as never);
  };

  const unanswered = allNumbers.length - answered.size;
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9F7F3' }}>
      {/* Thanh trên */}
      <View className="flex-row items-center gap-2 border-b border-border bg-surface px-3 py-2.5" style={{ minHeight: 52 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={L('Thoát', 'Exit')} onPress={() => { playSfx('back'); exit(); }} className="h-9 w-9 items-center justify-center rounded-pill bg-canvas">
          <Icon name="close" size={17} color={color.ink} strokeWidth={2.2} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-ink" style={{ fontSize: 14 }} numberOfLines={1}>{test.title}</Text>
          <Text className="font-sans text-muted" style={{ fontSize: 11 }} numberOfLines={1}>
            {sections.length === 1 ? `Section ${sections[0]?.n}` : 'Full test'}
          </Text>
        </View>
        {phase === 'taking' ? (
          <View className="flex-row items-center gap-1.5 rounded-pill px-3 py-1.5" style={{ backgroundColor: '#E8F8EE' }}>
            <Icon name="clock" size={14} color={GREEN} strokeWidth={2.2} />
            <Text className="font-heavy" style={{ fontSize: 13, color: '#0F7A38', fontVariant: ['tabular-nums'] }}>{mmss}</Text>
          </View>
        ) : null}
        {phase !== 'done' ? (
          <>
            <Pressable accessibilityRole="button" onPress={() => { playSfx('modalOpen'); setShowNotes(true); }} className="flex-row items-center gap-1.5 rounded-pill border border-border px-3 py-2">
              <Icon name="note" size={15} color={color.muted} />
              {width >= 480 ? <Text className="font-strong text-muted" style={{ fontSize: 12 }}>{L('Xem note', 'Notes')}</Text> : null}
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { playSfx('modalOpen'); setShowSettings(true); }} className="flex-row items-center gap-1.5 rounded-pill border border-border px-3 py-2">
              <Icon name="settings" size={15} color={color.muted} />
              {width >= 480 ? <Text className="font-strong text-muted" style={{ fontSize: 12 }}>{L('Cài đặt', 'Settings')}</Text> : null}
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
                    note={L('Nghe một lần, không tạm dừng, có 30 giây kiểm tra cuối mỗi section.', 'One listen, no pause, 30 seconds to check after each section.')}
                    onPress={() => { playSfx('select'); setReal(true); }}
                  />
                </View>
                {!real ? (
                  <View className="mt-3 flex-row items-center gap-3">
                    <Text className="font-strong text-muted" style={{ fontSize: 12 }}>{L('Tốc độ', 'Speed')}</Text>
                    <SpeedChips speed={settings.speed} onChange={(v) => setSettings({ speed: v })} />
                  </View>
                ) : null}
                <FallbackNote audio={audio} />
                <Button className="mt-5" size="lg" label={L('Bắt đầu làm bài', 'Start test')} iconRight="arrow-right" onPress={start} />
                <Text className="mt-2 text-center font-sans text-label text-subtle">{L('Nên đeo tai nghe. Phím Space = phát / tạm dừng.', 'Headphones recommended. Space = play / pause.')}</Text>
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
                  className="rounded-pill px-3.5 py-1.5"
                  style={{ backgroundColor: i === secIdx ? SECTION_COLOR[sec.n] : '#F5F1E9', opacity: real && i !== secIdx ? 0.5 : 1 }}
                >
                  <Text className="font-strong" style={{ fontSize: 12, color: i === secIdx ? '#FFFFFF' : color.muted }}>Section {sec.n}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {review !== null ? (
            <View className="px-3 py-2" style={{ backgroundColor: '#FEF4E6' }}>
              <Text className="text-center font-strong" style={{ fontSize: 13, color: '#7A4A00' }}>
                {review > 0
                  ? L(`Thời gian kiểm tra đáp án: ${review}s`, `Check your answers: ${review}s`)
                  : secIdx < sections.length - 1
                    ? L('Chuyển sang section tiếp theo…', 'Moving to the next section…')
                    : L('Hết thời gian kiểm tra. Bấm Hoàn thành khi sẵn sàng.', 'Check time is over. Press Finish when ready.')}
              </Text>
            </View>
          ) : null}

          <View className="min-h-0 flex-1" style={{ flexDirection: wide ? 'row' : 'column' }}>
            {wide ? (
              <ScrollView style={{ width: 340, flexGrow: 0 }} contentContainerStyle={{ padding: 16 }}>
                <AudioCard
                  audio={audio}
                  real={real}
                  speed={speed}
                  onSpeed={(v) => setSettings({ speed: v })}
                  title={`Section ${section.n} — ${section.title}`}
                  context={section.context}
                />
              </ScrollView>
            ) : null}
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
              <View className="w-full self-center" style={{ maxWidth: 820 }}>
                {!wide ? (
                  <Text className="mb-3 font-sans text-label text-muted">{section.context}</Text>
                ) : null}
                {section.groups.map((g, i) => (
                  <GroupBlock key={`${section.n}-${i}`} group={g} answers={answers} setAnswer={setAnswer} />
                ))}
              </View>
            </ScrollView>
          </View>

          {!wide ? <AudioBar audio={audio} real={real} label={`Section ${section.n}`} /> : null}

          {/* Thanh điều hướng câu */}
          <View className="flex-row items-center gap-3 border-t border-border bg-surface px-3 py-2.5">
            <ScrollView horizontal={!wide} showsHorizontalScrollIndicator={false} className="min-w-0 flex-1" contentContainerStyle={wide ? { flexWrap: 'wrap', flexDirection: 'row', gap: 6 } : { gap: 6 }}>
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
                      width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
                      borderColor: GREEN, backgroundColor: done ? GREEN : '#FFFFFF', opacity: inSec ? 1 : 0.55,
                    }}
                  >
                    <Text className="font-heavy" style={{ fontSize: 12, color: done ? '#FFFFFF' : '#0F7A38' }}>{n}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button label={L('Hoàn thành', 'Finish')} iconRight="check" onPress={() => { playSfx('modalOpen'); setConfirm('submit'); }} />
          </View>
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
              durationSec={finalMeta?.durationSec ?? elapsed}
              onRetry={retry}
              onLibrary={() => router.replace('/listening' as never)}
            />
          </View>
        </ScrollView>
      ) : null}

      {/* Cài đặt */}
      <Modal transparent animationType="fade" visible={showSettings} onRequestClose={() => setShowSettings(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 }} onPress={() => setShowSettings(false)}>
          <Pressable onPress={() => undefined} style={{ width: '100%', maxWidth: 380, borderRadius: 18, backgroundColor: '#FFFFFF', padding: 18, gap: 14 }}>
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Ghi chú */}
      <Modal transparent animationType="fade" visible={showNotes} onRequestClose={() => setShowNotes(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 }} onPress={() => setShowNotes(false)}>
          <Pressable onPress={() => undefined} style={{ width: '100%', maxWidth: 420, borderRadius: 18, backgroundColor: '#FFFFFF', padding: 18, gap: 12 }}>
            <Text className="font-heavy text-ink" style={{ fontSize: 18 }}>{L('Ghi chú nhanh', 'Quick notes')}</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder={L('Ghi tên, số, từ khoá khi nghe…', 'Jot down names, numbers, keywords…')}
              style={{ minHeight: 160, borderWidth: 1, borderColor: color.borderStrong, borderRadius: 12, padding: 10, fontSize: 15, textAlignVertical: 'top' } as never}
            />
            <Button label={L('Xong', 'Done')} onPress={() => { playSfx('modalClose'); setShowNotes(false); }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Xác nhận nộp / thoát */}
      <Modal transparent animationType="fade" visible={confirm !== null} onRequestClose={() => setConfirm(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 }} onPress={() => setConfirm(null)}>
          <Pressable onPress={() => undefined} style={{ width: '100%', maxWidth: 360, borderRadius: 18, backgroundColor: '#FFFFFF', padding: 18, gap: 12 }}>
            <Text className="font-heavy text-ink" style={{ fontSize: 18 }}>
              {confirm === 'exit' ? L('Thoát khỏi bài?', 'Leave the test?') : L('Nộp bài?', 'Submit?')}
            </Text>
            <Text className="font-sans text-body text-muted">
              {confirm === 'exit'
                ? L('Bài chưa nộp sẽ không được lưu.', 'An unsubmitted test is not saved.')
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
                    if (confirm === 'exit') router.replace('/listening' as never);
                    else finish();
                  }}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function ModeOption({ on, title, note, onPress }: { on: boolean; title: string; note: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={on}
      onPress={onPress}
      className="flex-row items-start gap-3 rounded-panel border p-3"
      style={{ borderColor: on ? color.primary : color.borderStrong, backgroundColor: on ? '#FBF7EE' : '#FFFFFF' }}
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
      style={{ opacity: disabled ? 0.5 : 1 }}
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
