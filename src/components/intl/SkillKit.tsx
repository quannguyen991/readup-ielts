import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { bi, useL } from '@/i18n/useL';
import type { QaItem, ListenPassage } from '@/data/intl/listening';
import type { SpeakingTask, WritingTask } from '@/data/intl/writing';
import { speakLines, stopPronounce, type SpokenLine } from '@/services/audio/pronounce';
import { fromReading } from '@/services/intl/practice';
import type { IntlGrade } from '@/services/intl/grading';
import { useAuthStore } from '@/store/useAuthStore';
import { useIntlStore, type IntlExam } from '@/store/useIntlStore';
import audioManifest from '@/data/intl/audio-manifest.json';
import { QuestionList } from './IntlKit';
import { SceneArt, hasSceneArt } from './SceneArt';

/** Phát các dòng bằng giọng máy có sẵn, có nút dừng và tự dừng khi xong. */
const GENERATED_CLIPS = new Set<string>(audioManifest.clips);

/**
 * Phát một đoạn nghe: ưu tiên tệp giọng AI đã sinh sẵn (web), nếu chưa có thì dùng giọng máy.
 * Native chưa có trình phát tệp nên luôn dùng giọng máy.
 */
export function useSpeech() {
  const [playing, setPlaying] = useState(false);
  const [stop, setStop] = useState<(() => void) | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(
    () => () => {
      stopPronounce();
      audio.current?.pause();
    },
    [],
  );
  const speak = (lines: readonly SpokenLine[]) => {
    const cancel = speakLines(lines, { onEnd: () => setPlaying(false) });
    setStop(() => cancel);
  };
  const play = (lines: readonly SpokenLine[], clipId?: string) => {
    stop?.();
    audio.current?.pause();
    setPlaying(true);
    if (clipId && GENERATED_CLIPS.has(clipId) && Platform.OS === 'web' && typeof Audio !== 'undefined') {
      const el = new Audio(`/audio/intl/${clipId}.wav`);
      audio.current = el;
      el.onended = () => setPlaying(false);
      el.onerror = () => speak(lines);
      void el.play();
      setStop(() => () => el.pause());
      return;
    }
    speak(lines);
  };
  const halt = () => {
    stop?.();
    stopPronounce();
    audio.current?.pause();
    setPlaying(false);
  };
  return { playing, play, halt };
}

const dialogueLines = (lines: readonly string[]): SpokenLine[] =>
  lines.map((l) => ({ text: l.replace(/^[MWSA]: /, ''), rate: 0.92, pauseMs: 600 }));

/** Nghe một đoạn hội thoại hoặc bài nói, xem bản chép lời sau khi nghe. */
export function ListenPassageSet({ passage, exam }: { passage: ListenPassage; exam: IntlExam }) {
  const { L, locale } = useL();
  const { playing, play, halt } = useSpeech();
  const [showScript, setShowScript] = useState(false);
  const recordSession = useIntlStore((s) => s.recordSession);
  return (
    <View className="gap-3">
      <Card>
        <Text className="font-strong text-body text-ink">{bi(passage.title, locale)}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Button label={playing ? L('Dừng', 'Stop') : L('Nghe', 'Listen')} onPress={() => (playing ? halt() : play(dialogueLines(passage.lines), passage.id))} />
          <Button variant="outline" label={showScript ? L('Ẩn bản chép lời', 'Hide transcript') : L('Xem bản chép lời', 'Show transcript')} onPress={() => setShowScript((v) => !v)} />
        </View>
        {showScript ? (
          <View className="mt-3 gap-2">
            {passage.lines.map((line, i) => (
              <Text key={i} className="font-sans text-body text-muted">{line}</Text>
            ))}
          </View>
        ) : null}
      </Card>
      <QuestionList
        questions={fromReading(passage.questions)}
        onSubmit={(correct, total) => recordSession({ exam, activity: `listen:${passage.id}`, correct, total })}
      />
    </View>
  );
}

/** Part 2 và Part 1: mỗi câu nghe câu hỏi và các đáp án trước, rồi mới hiện lựa chọn. */
export function QaSet({ items, exam }: { items: readonly QaItem[]; exam: IntlExam }) {
  const { L, locale } = useL();
  const { playing, play, halt } = useSpeech();
  const recordSession = useIntlStore((s) => s.recordSession);
  const [heard, setHeard] = useState<Record<string, true>>({});
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = items.reduce((n, q) => n + (picked[q.id] === q.answer ? 1 : 0), 0);

  const listen = (item: QaItem) => {
    setHeard((h) => ({ ...h, [item.id]: true }));
    play(
      [
        { text: item.question, rate: 0.92, pauseMs: 800 },
        ...item.responses.map((r) => ({ text: r, rate: 0.92, pauseMs: 700 })),
      ],
      item.id,
    );
  };

  return (
    <View className="gap-3">
      {items.map((item, qi) => {
        const isHeard = heard[item.id] === true;
        const chosen = picked[item.id];
        return (
          <Card key={item.id}>
            <Text className="font-strong text-body text-ink">{L(`Câu ${qi + 1}`, `Question ${qi + 1}`)}</Text>
            {hasSceneArt(item.id) ? (
              <View className="mt-2">
                <SceneArt id={item.id} />
              </View>
            ) : null}
            <View className="mt-2 flex-row flex-wrap gap-2">
              <Button size="sm" variant="outline" label={playing ? L('Dừng', 'Stop') : isHeard ? L('Nghe lại', 'Listen again') : L('Nghe', 'Listen')} onPress={() => (playing ? halt() : listen(item))} />
            </View>
            {isHeard ? (
              <View className="mt-3 gap-2">
                {item.responses.map((r, ci) => {
                  const selected = chosen === ci;
                  const isAnswer = submitted && ci === item.answer;
                  return (
                    <Pressable
                      key={ci}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={submitted}
                      onPress={() => setPicked((p) => ({ ...p, [item.id]: ci }))}
                      style={{ borderWidth: 1.5, borderRadius: 10, padding: 10, borderColor: isAnswer ? '#22A06B' : selected ? '#B07A3A' : '#E4DCCB', backgroundColor: selected ? '#F7EDDA' : '#FFFFFF' }}
                    >
                      <Text className="font-sans text-body text-ink">{`${String.fromCharCode(65 + ci)}. ${r}`}</Text>
                    </Pressable>
                  );
                })}
                {submitted ? <Text className="font-sans text-label text-muted">{bi(item.explanation, locale)}</Text> : null}
              </View>
            ) : null}
          </Card>
        );
      })}
      {!submitted ? (
        <Button
          label={L(`Nộp bài (${Object.keys(picked).length}/${items.length} câu)`, `Submit (${Object.keys(picked).length}/${items.length} answered)`)}
          disabled={Object.keys(picked).length === 0}
          onPress={() => {
            setSubmitted(true);
            recordSession({ exam, activity: 'listen:qa', correct: score, total: items.length });
          }}
        />
      ) : (
        <Card>
          <Text className="font-heavy text-cardTitle text-ink">{L(`Kết quả: ${score}/${items.length} câu đúng`, `Score: ${score}/${items.length} correct`)}</Text>
        </Card>
      )}
    </View>
  );
}

/** Thời gian đếm ngược cho phần luyện. Không gọi đây là thời gian chính thức. */
export function Countdown({ seconds, onDone, running }: { seconds: number; onDone?: () => void; running: boolean }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (!running) return;
    if (left <= 0) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [running, left, onDone]);
  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, '0');
  return <Text className="font-heavy text-pageTitle text-ink">{`${m}:${s}`}</Text>;
}

function toggleKey(map: Record<number, true>, key: number): Record<number, true> {
  const next = { ...map };
  if (next[key]) delete next[key];
  else next[key] = true;
  return next;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Bài viết: đếm từ, kiểm từ bắt buộc, lưu nháp, tự đánh giá, và chấm AI khi máy chủ cho phép. */
export function WritingTaskView({ task, activity, exam }: { task: WritingTask; activity: string; exam: IntlExam }) {
  const { L, locale } = useL();
  const recordSession = useIntlStore((s) => s.recordSession);
  const draft = useIntlStore((s) => s.drafts[task.id] ?? '');
  const setDraft = useIntlStore((s) => s.setDraft);
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const [ticked, setTicked] = useState<Record<number, true>>({});
  const [done, setDone] = useState(false);
  const [grade, setGrade] = useState<IntlGrade | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const words = wordCount(draft);
  const missing = (task.requiredWords ?? []).filter((w) => !new RegExp(`\\b${w}\\b`, 'i').test(draft));
  const tickedCount = Object.keys(ticked).length;

  const askAi = async () => {
    setGrading(true);
    setGradeError(null);
    try {
      const res = await fetch('/api/intl/grade', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam, taskId: task.id, text: draft }),
      });
      const body = (await res.json()) as { grade?: IntlGrade; error?: string };
      if (!res.ok || !body.grade) {
        setGradeError(body.error ?? L('Chưa chấm được bài này.', 'This response could not be graded.'));
        return;
      }
      setGrade(body.grade);
    } catch {
      setGradeError(L('Không kết nối được máy chủ.', 'Could not reach the server.'));
    } finally {
      setGrading(false);
    }
  };

  return (
    <View className="gap-3">
      <Card>
        <Text className="font-strong text-body text-ink">{bi(task.title, locale)}</Text>
        <Text className="mt-2 font-sans text-body text-ink">{task.prompt}</Text>
        <Text className="mt-2 font-sans text-label text-muted">
          {L(`Gợi ý: ${task.minWords}+ từ · khoảng ${task.suggestedMinutes} phút (thời gian luyện)`, `Suggested: ${task.minWords}+ words · about ${task.suggestedMinutes} minutes (practice time)`)}
        </Text>
      </Card>
      <TextInput
        value={draft}
        onChangeText={(t) => setDraft(task.id, t)}
        multiline
        editable={!done}
        textAlignVertical="top"
        placeholder={L('Viết bài của bạn ở đây…', 'Write your response here…')}
        placeholderTextColor="#89928B"
        className="min-h-[160px] rounded-xl border border-border bg-white px-3 py-3 font-sans text-body text-ink"
      />
      <Text className="font-sans text-label text-muted">
        {L(`${words} từ · cần ${task.minWords}+ từ · bản nháp được lưu trên máy`, `${words} words · ${task.minWords}+ needed · draft saved on this device`)}
        {missing.length > 0 ? L(` · còn thiếu: ${missing.join(', ')}`, ` · missing: ${missing.join(', ')}`) : ''}
      </Text>
      <Card>
        <Text className="font-strong text-body text-ink">{L('Tự đánh giá', 'Self-check')}</Text>
        <View className="mt-2 gap-2">
          {task.checklist.map((item, i) => (
            <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: ticked[i] === true }} disabled={done} onPress={() => setTicked((t) => toggleKey(t, i))}>
              <Text className="font-sans text-body text-ink">{`${ticked[i] ? '☑' : '☐'} ${bi(item, locale)}`}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      {!done ? (
        <Button
          label={L('Hoàn thành', 'Finish')}
          disabled={words === 0}
          onPress={() => {
            setDone(true);
            recordSession({ exam, activity, correct: tickedCount, total: task.checklist.length });
          }}
        />
      ) : (
        <Text className="font-sans text-label text-muted">{L('Đã lưu kết quả tự đánh giá.', 'Self-check result saved.')}</Text>
      )}

      <Card>
        <Text className="font-strong text-body text-ink">{L('Chấm bằng AI', 'AI feedback')}</Text>
        <Text className="mt-1 font-sans text-label text-muted">
          {L('Chỉ là ước lượng để luyện tập, không phải điểm chính thức. Mỗi lượt có thể tính vào hạn mức AI.', 'An estimate for practice only, not an official score. Each use may count toward your AI quota.')}
        </Text>
        <Button className="mt-3 self-start" variant="outline" label={grading ? L('Đang chấm…', 'Grading…') : L('Chấm bài', 'Grade my response')} disabled={grading || words < 20} onPress={askAi} />
        {gradeError ? <Text className="mt-2 font-sans text-label" style={{ color: '#C0502E' }}>{gradeError}</Text> : null}
        {grade ? (
          <View className="mt-3 gap-2">
            <Text className="font-heavy text-cardTitle text-ink">{L(`Ước lượng: ${grade.overall}/100`, `Estimate: ${grade.overall}/100`)}</Text>
            {grade.criteria.map((c, i) => (
              <Text key={i} className="font-sans text-body text-ink">{`${c.name}: ${c.score}/5 — ${c.comment}`}</Text>
            ))}
            {grade.strengths.length > 0 ? <Text className="font-sans text-body text-ink">{`+ ${grade.strengths.join('; ')}`}</Text> : null}
            {grade.improvements.length > 0 ? <Text className="font-sans text-body text-ink">{`− ${grade.improvements.join('; ')}`}</Text> : null}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

function canRecord(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

/** Ghi âm trên web để tự nghe lại. Native chưa có ghi âm. */
function useRecorder() {
  const [state, setState] = useState<'idle' | 'recording' | 'ready' | 'unsupported' | 'denied'>(() => (canRecord() ? 'idle' : 'unsupported'));
  const [url, setUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' });
        setUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((t) => t.stop());
        setState('ready');
      };
      rec.start();
      recorder.current = rec;
      setState('recording');
    } catch {
      setState('denied');
    }
  };
  const stop = () => recorder.current?.stop();
  const play = () => {
    if (url) void new Audio(url).play();
  };
  const reset = () => {
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setState(canRecord() ? 'idle' : 'unsupported');
  };
  return { state, url, start, stop, play, reset };
}

/** Nói: đếm thời gian chuẩn bị rồi thời gian trả lời; trên web có thể ghi âm để nghe lại. */
export function SpeakingTaskView({ task, activity, exam }: { task: SpeakingTask; activity: string; exam: IntlExam }) {
  const { L, locale } = useL();
  const recordSession = useIntlStore((s) => s.recordSession);
  const rec = useRecorder();
  const [phase, setPhase] = useState<'ready' | 'prep' | 'respond' | 'finished'>('ready');
  const [ticked, setTicked] = useState<Record<number, true>>({});
  const phaseSeconds = phase === 'prep' ? task.prepSeconds : task.responseSeconds;
  const next = () => {
    if (phase === 'prep') setPhase('respond');
    else setPhase('finished');
  };
  const start = () => setPhase(task.prepSeconds > 0 ? 'prep' : 'respond');
  const tickedCount = Object.keys(ticked).length;

  return (
    <View className="gap-3">
      <Card>
        <Text className="font-strong text-body text-ink">{bi(task.title, locale)}</Text>
        <Text className="mt-2 font-sans text-body text-ink">{task.prompt}</Text>
      </Card>
      {phase === 'ready' ? (
        <Button label={L('Bắt đầu', 'Start')} onPress={start} />
      ) : phase === 'finished' ? (
        <Card>
          <Text className="font-strong text-body text-ink">{L('Tự đánh giá', 'Self-check')}</Text>
          <View className="mt-2 gap-2">
            {task.checklist.map((item, i) => (
              <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: ticked[i] === true }} onPress={() => setTicked((t) => toggleKey(t, i))}>
                <Text className="font-sans text-body text-ink">{`${ticked[i] ? '☑' : '☐'} ${bi(item, locale)}`}</Text>
              </Pressable>
            ))}
          </View>
          <Button
            className="mt-3"
            label={L('Lưu kết quả', 'Save result')}
            onPress={() => recordSession({ exam, activity, correct: tickedCount, total: task.checklist.length })}
          />
        </Card>
      ) : (
        <Card>
          <Text className="font-sans text-label text-muted">{phase === 'prep' ? L('Chuẩn bị', 'Prepare') : L('Trả lời', 'Respond')}</Text>
          <View className="mt-2">
            <Countdown seconds={phaseSeconds} running onDone={next} />
          </View>
          <Button className="mt-3" variant="outline" label={L('Chuyển sang bước tiếp', 'Move on')} onPress={next} />
        </Card>
      )}

      <Card>
        <Text className="font-strong text-body text-ink">{L('Ghi âm để nghe lại', 'Record to listen back')}</Text>
        {rec.state === 'unsupported' ? (
          <Text className="mt-1 font-sans text-label text-muted">{L('Ghi âm chỉ có trên trình duyệt web. Hãy tự nói to và đối chiếu danh sách kiểm.', 'Recording is available in web browsers only. Speak aloud and compare with the checklist.')}</Text>
        ) : rec.state === 'denied' ? (
          <Text className="mt-1 font-sans text-label" style={{ color: '#C0502E' }}>{L('Chưa được cấp quyền micro.', 'Microphone permission was not granted.')}</Text>
        ) : (
          <View className="mt-2 flex-row flex-wrap gap-2">
            {rec.state === 'recording' ? (
              <Button label={L('Dừng ghi', 'Stop recording')} onPress={rec.stop} />
            ) : (
              <Button label={L('Ghi âm', 'Record')} variant="outline" onPress={rec.start} />
            )}
            {rec.url ? <Button variant="outline" label={L('Nghe lại', 'Play back')} onPress={rec.play} /> : null}
            {rec.url ? <Button variant="outline" label={L('Xoá bản ghi', 'Delete recording')} onPress={rec.reset} /> : null}
          </View>
        )}
      </Card>
      <Text className="font-sans text-label text-muted">
        {L('Chưa có chấm điểm bằng AI cho bài nói. Hãy tự đối chiếu danh sách kiểm sau khi nghe lại.', 'No AI scoring for speaking yet. Compare with the checklist after listening back.')}
      </Text>
    </View>
  );
}

export { ChunkOrder } from './ChunkOrder';
