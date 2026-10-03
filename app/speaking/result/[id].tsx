import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { StudyCard, StudyFrame } from '@/components/vocab/study/StudyKit';
import { STUDY_THEMES } from '@/components/vocab/study/study-theme';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteMic, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { bandTone, fmtBand, fmtDate, MetricTile, MODE_LABEL, Notice, SPK, SPK_CARD } from '@/components/speaking/SpeakingKit';
import type { SpeakingAttempt } from '@/services/speaking/attempts';
import { CRITERIA, type CriterionKey, type SpeakingGrade } from '@/services/speaking/grade';
import { markFillers, MIN_WORDS } from '@/services/speaking/metrics';
import { speakWithAoede } from '@/services/speaking/voice';
import { useAuthStore } from '@/store/useAuthStore';
import { useGameStore } from '@/store/useGameStore';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import { currentLocale, pick, useL } from '@/i18n/useL';

const CRIT_COLOR: Record<CriterionKey, string> = { fc: SPK.blue, lr: SPK.teal, gr: SPK.amber, pr: SPK.rose };
const CRIT_ICON: Record<CriterionKey, React.ComponentProps<typeof Icon>['name']> = { fc: 'trending', lr: 'letters', gr: 'pencil', pr: 'mic' };

/** Lỗi máy chủ đôi khi kèm chi tiết từng proxy — người học chỉ cần một câu dễ hiểu. */
function friendly(message: string, code?: string): string {
  const lc = currentLocale();
  if (code === 'server_error' || code === 'timeout' || code === 'network' || code === 'rate_limited')
    return pick(
      lc,
      'AI đang bận hoặc tạm lỗi nên chưa chấm được. Lượt AI của bạn đã được hoàn lại — thử lại sau ít phút.',
      "The AI is busy or hit an error, so it couldn't grade yet. Your AI credit has been refunded — try again in a few minutes.",
    );
  if (code === 'bad_response')
    return pick(
      lc,
      'AI trả về phiếu chấm không hợp lệ. Lượt AI đã được hoàn lại — thử chấm lại nhé.',
      'The AI returned an invalid score sheet. Your AI credit has been refunded — please try grading again.',
    );
  return message.split('\n')[0]!.slice(0, 300);
}

/**
 * PHIẾU ĐIỂM MỘT LƯỢT NÓI.
 *
 * Chỉ số đo tại máy LUÔN hiện, kể cả khi AI hỏng hay hết lượt — người học vẫn
 * thấy tốc độ nói, từ đệm, khoảng ngắt của mình. Điểm AI tới sau.
 *
 * Gọi AI đúng MỘT lần khi mở lượt chưa chấm. Lỗi thì lưu lại lý do và dừng —
 * chấm lại là việc người học bấm, không phải vòng lặp tự động tốn lượt.
 */
export default function SpeakingResult() {
  const { L } = useL();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const attempt = useSpeakingStore((s) => s.attempts.find((a) => a.id === id));
  const parent = useSpeakingStore((s) => s.attempts.find((a) => a.id === attempt?.retryOf));
  const accessToken = useAuthStore((s) => s.session?.access_token ?? null);
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const [loading, setLoading] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [details, setDetails] = useState(false);
  const requested = useRef(false);

  const grade = (a: SpeakingAttempt) => {
    if (!tokenRef.current) {
      setNeedLogin(true);
      return;
    }
    setNeedLogin(false);
    setLoading(true);
    useSpeakingStore.getState().setGradeError(a.id, null);
    fetch('/api/speaking/grade', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRef.current}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        typed: a.typed,
        answers: a.answers.map((x) => ({ questionId: x.questionId, transcript: x.transcript, segments: x.segments, metrics: x.metrics })),
      }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { grade?: SpeakingGrade; error?: string; code?: string };
        if (!res.ok || !data.grade) {
          if (res.status === 401) setNeedLogin(true);
          throw Object.assign(new Error(data.error ?? L('Chấm bài thất bại.', 'Grading failed.')), { code: data.code });
        }
        return data.grade;
      })
      .then((g) => {
        const store = useSpeakingStore.getState();
        store.setGrade(a.id, g);
        // Lượt Full test nói thật, AI chấm xong → một lần thưởng cho cả bài (không phải từng câu tự chấm).
        const cur = store.attempts.find((x) => x.id === a.id);
        if (cur && !cur.awarded && !a.typed && a.mode === 'full' && g.overall != null) {
          useGameStore.getState().awardBatch(Math.round(g.overall), 9, 'shadow', `speaking:${a.id}`);
          store.markAwarded(a.id);
        }
      })
      .catch((e: Error & { code?: string }) => {
        useSpeakingStore.getState().setGradeError(a.id, friendly(e.message, e.code));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!attempt || attempt.grade || attempt.gradeError || requested.current) return;
    requested.current = true;
    grade(attempt);
    // Chỉ chạy một lần khi mở lượt; `grade` đọc token qua ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt?.id]);

  if (!attempt) {
    return (
      <StudyFrame themeOverride={STUDY_THEMES.plain} backHref="/speaking" title={L('Phiếu điểm', 'Score sheet')}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">{L('Lượt này không còn trong máy.', 'This session is no longer on this device.')}</Text>
          <Button className="mt-4 self-start" label={L('Về phòng luyện nói', 'Back to the speaking room')} onPress={() => router.replace('/speaking' as never)} />
        </StudyCard>
      </StudyFrame>
    );
  }

  const g = attempt.grade;
  const m = attempt.metrics;
  const overall = attempt.typed ? null : (g?.overall ?? null);
  const tone = bandTone(overall);
  const coaching = !!(attempt.practice || attempt.retryOf || attempt.mode === 'q');
  const lesson = attempt.practice ? attempt : parent?.practice ? parent : null;

  return (
    <StudyFrame themeOverride={STUDY_THEMES.plain} backHref="/speaking" title={L(coaching ? 'Phân tích & nói lại' : 'Phiếu điểm', coaching ? 'Feedback & try again' : 'Score sheet')}>
      <View className="gap-4">
        {/* ------------------------------------------------ band tổng */}
        <StudyCard>
          <View className="flex-row flex-wrap items-center gap-4">
            <View aria-hidden>
              <Motion kind="float">
                <Sticker tilt={-6}>{overall != null ? <CuteTrophy size={72} /> : <CuteMic size={72} />}</Sticker>
              </Motion>
            </View>
            <View className="min-w-0 flex-1" style={{ minWidth: 180 }}>
              <Label text={attempt.typed ? L('Bài gõ phím', 'Typed answers') : L('Band ước lượng', 'Estimated band')} color={attempt.typed ? SPK.amberSoft : '#F3E6C8'} ink={attempt.typed ? '#92400E' : '#5A4318'} size={13} />
              <Text className="mt-2 font-strong text-body text-ink" numberOfLines={2}>
                {MODE_LABEL[attempt.mode]} · {attempt.titleVi}
              </Text>
              <Text className="font-sans text-label" style={{ color: SPK.muted }}>
                {fmtDate(attempt.finishedAt)} ·{' '}
                {L(`${attempt.answers.length} câu · ${m.words} từ`, `${attempt.answers.length} questions · ${m.words} words`)}
              </Text>
            </View>
            <View className="items-center justify-center rounded-3xl px-5 py-3" style={{ backgroundColor: tone.bg, minWidth: 110 }}>
              <Text className="font-semi text-label" style={{ color: tone.fg }}>
                Overall
              </Text>
              <Text className="font-heavy" style={{ fontSize: 48, lineHeight: 56, color: tone.fg }}>
                {fmtBand(overall)}
              </Text>
            </View>
          </View>

          <View className="mt-4 gap-2">
            {attempt.typed ? (
              <Notice tone="warn">
                {L('Bài gõ phím: chỉ chấm từ vựng và ngữ pháp, không có band Speaking.', 'Typed answer: vocabulary and grammar only, no Speaking band.')}
              </Notice>
            ) : null}
            {loading ? (
              <View className="flex-row items-center gap-3 rounded-2xl p-3.5" style={{ backgroundColor: SPK.blueSoft }}>
                <ActivityIndicator color={SPK.blue} />
                <Text className="min-w-0 flex-1 font-sans text-body" style={{ color: '#5A4318' }}>
                  {L('AI đang chấm… (10–30 giây)', 'AI is grading… (10–30 s)')}
                </Text>
              </View>
            ) : null}
            {!loading && needLogin && !g ? (
              <View className="gap-2">
                <Notice tone="info">
                  {L('Đăng nhập để AI chấm band.', 'Sign in for an AI band score.')}
                </Notice>
                <View className="flex-row flex-wrap gap-2">
                  <Button variant="brand" size="sm" label={L('Đăng nhập', 'Sign in')} onPress={() => router.push('/auth/sign-in' as never)} />
                  <Button variant="outline" size="sm" label={L('Đã đăng nhập, chấm ngay', "I'm signed in, grade now")} onPress={() => grade(attempt)} />
                </View>
              </View>
            ) : null}
            {!loading && !needLogin && attempt.gradeError && !g ? (
              <View className="gap-2">
                <Notice tone="error">
                  {attempt.gradeError} {L('Chỉ số đo tại máy bên dưới vẫn đầy đủ.', 'The on-device metrics below are still complete.')}
                </Notice>
                <Button className="self-start" variant="outline" size="sm" label={L('Chấm lại bằng AI', 'Regrade with AI')} iconLeft="refresh" onPress={() => grade(attempt)} />
              </View>
            ) : null}
            {g?.summaryVi ? (
              <Text className="font-sans text-body text-ink" style={{ lineHeight: 22 }}>
                {g.summaryVi}
              </Text>
            ) : null}
            {g?.capsApplied.map((c) => (
              <Notice key={c} tone="warn" icon="target">
                {c}
              </Notice>
            ))}
          </View>
        </StudyCard>

        {coaching ? (
          <View className="gap-3">
            <Text className="font-strong text-body text-ink">{L('1. Trả lời  →  2. Xem góp ý  →  3. Nói lại', '1. Answer  →  2. Review feedback  →  3. Try again')}</Text>
            {attempt.answers.map((a, i) => <AnswerCard key={`${a.questionId}-${i}`} attempt={attempt} index={i} previousAttempt={parent} />)}
            {parent ? <Button variant="outline" size="sm" label={L('Xem góp ý của lượt trước', 'Review the previous feedback')} onPress={() => router.push(`/speaking/result/${parent.id}` as never)} /> : null}
            <Button variant="outline" size="sm" label={details ? L('Ẩn điểm & chỉ số chi tiết', 'Hide detailed scores & metrics') : L('Xem điểm & chỉ số chi tiết', 'Show detailed scores & metrics')} onPress={() => setDetails((v) => !v)} />
          </View>
        ) : null}

        {!coaching || details ? <>
        {/* ------------------------------------------------ 4 tiêu chí */}
        {g ? (
          <View className="flex-row flex-wrap gap-3">
            {CRITERIA.map((c) => (
              <CriterionCard key={c.key} k={c.key} en={c.en} vi={c.vi} grade={g} attempt={attempt} />
            ))}
          </View>
        ) : null}

        {/* ------------------------------------------------ điểm mạnh + sửa */}
        {g && (g.strengths.length || g.fixes.length) ? (
          <View className="rounded-[22px] bg-white p-5" style={SPK_CARD}>
            {g.strengths.length ? (
              <>
                <View className="flex-row items-center gap-2">
                  <SealIcon name="star" color={SPK.green} size={30} />
                  <Text className="font-heavy text-cardTitle text-ink">{L('Điểm mạnh', 'Strengths')}</Text>
                </View>
                <View className="mt-2 gap-1.5">
                  {g.strengths.map((s) => (
                    <Text key={s} className="font-sans text-body text-ink" style={{ lineHeight: 21 }}>
                      •  {s}
                    </Text>
                  ))}
                </View>
              </>
            ) : null}
            {g.fixes.length ? (
              <>
                <View className="mt-5 flex-row items-center gap-2">
                  <SealIcon name="pencil" color={SPK.amber} size={30} />
                  <Text className="font-heavy text-cardTitle text-ink">{L('Sửa ngay ở lượt sau', 'Fix these next time')}</Text>
                </View>
                <View className="mt-3 gap-3">
                  {g.fixes.map((f, i) => (
                    <View key={i} className="rounded-2xl p-3.5" style={{ backgroundColor: SPK.panel }}>
                      <Text className="font-sans text-body" style={{ color: SPK.rose, textDecorationLine: 'line-through' }}>
                        “{f.quote}”
                      </Text>
                      <Text className="mt-1 font-strong text-body" style={{ color: SPK.green }}>
                        → {f.better}
                      </Text>
                      <Text className="mt-1 font-sans text-label" style={{ color: SPK.muted, lineHeight: 18 }}>
                        {f.problemVi}
                        {f.questionIndex != null ? L(` (câu ${f.questionIndex + 1})`, ` (question ${f.questionIndex + 1})`) : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {/* ------------------------------------------------ chỉ số đo tại máy */}
        <View className="rounded-[22px] bg-white p-5" style={SPK_CARD}>
          <View className="flex-row items-center gap-2">
            <SealIcon name="gauge" color={SPK.blue} size={30} />
            <Text className="min-w-0 flex-1 font-heavy text-cardTitle text-ink">{L('Chỉ số đo tại máy', 'On-device metrics')}</Text>
            <Label text={L('Không cần AI', 'No AI needed')} color={SPK.greenSoft} ink="#166534" size={12} tilt={3} />
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2.5">
            <MetricTile
              label={L('Tốc độ nói', 'Speaking rate')}
              value={m.wpm != null ? `${m.wpm}` : '—'}
              hint={
                m.wpm != null
                  ? L('từ/phút · trôi chảy thường 110–160', 'words/min · fluent is usually 110–160')
                  : attempt.typed
                    ? L('bài gõ phím', 'typed answers')
                    : L('chưa đủ dữ liệu', 'not enough data')
              }
              tone={m.wpm == null ? undefined : m.wpm < 90 ? SPK.amber : m.wpm > 190 ? SPK.amber : SPK.green}
            />
            <MetricTile
              label={L('Từ đệm', 'Fillers')}
              value={`${m.fillers}`}
              hint={L(`${m.fillersPer100} trên 100 từ`, `${m.fillersPer100} per 100 words`)}
              tone={m.fillersPer100 > 5 ? SPK.amber : undefined}
            />
            <MetricTile
              label={L('Ngắt ≥ 2 giây', 'Pauses ≥ 2 s')}
              value={attempt.typed ? '—' : `${m.longPauses}`}
              hint={L('giữa lúc đang nói', 'mid-speech')}
            />
            <MetricTile
              label={L('Độ dài trung bình', 'Average length')}
              value={`${m.avgWords}`}
              hint={L(`từ/câu · ${m.shortAnswers} câu quá ngắn`, `words/answer · ${m.shortAnswers} too short`)}
              tone={m.shortAnswers ? SPK.amber : undefined}
            />
            <MetricTile
              label={L('Độ đa dạng từ', 'Word variety')}
              value={m.lexicalVariety != null ? `${Math.round(m.lexicalVariety * 100)}%` : '—'}
              hint={L('từ khác nhau / 50 từ liên tiếp', 'distinct words / 50 in a row')}
            />
            <MetricTile
              label={L('Độ rõ máy nghe', 'Recognition clarity')}
              value={m.avgConfidence != null ? `${Math.round(m.avgConfidence * 100)}%` : '—'}
              hint={
                m.lowConfShare != null
                  ? L(`${Math.round(m.lowConfShare * 100)}% từ nghe không chắc`, `${Math.round(m.lowConfShare * 100)}% of words uncertain`)
                  : L('trình duyệt không báo', 'not reported by browser')
              }
            />
          </View>
          {m.repeated.length ? (
            <View className="mt-4">
              <Text className="font-strong text-body text-ink">{L('Từ bạn lặp nhiều', 'Words you repeat a lot')}</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {m.repeated.map((r) => (
                  <View key={r.word} className="rounded-pill px-3 py-1" style={{ backgroundColor: SPK.amberSoft }}>
                    <Text className="font-semi text-label" style={{ color: '#92400E' }}>
                      {r.word} ×{r.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          <Text className="mt-4 font-sans text-label" style={{ color: SPK.muted, lineHeight: 18 }}>
            {L(
              'Mọi chỉ số đọc từ bản chữ của bộ nhận giọng, không từ âm thanh. Bộ nhận giọng hay lược bớt “uh/um”, nên số từ đệm thật có thể cao hơn; khoảng ngắt ước từ nhịp máy nghe thêm chữ.',
              'All metrics come from the speech recogniser’s text, not the audio. Recognisers often drop “uh/um”, so your real filler count may be higher; pauses are estimated from when new words arrive.',
            )}
          </Text>
        </View>

        </> : null}

        {/* ------------------------------------------------ từng câu */}
        {!coaching ? (
        <View className="gap-3">
          {attempt.answers.map((a, i) => (
            <AnswerCard key={`${a.questionId}-${i}`} attempt={attempt} index={i} />
          ))}
        </View>
        ) : null}

        <View className="flex-row flex-wrap gap-3">
          {lesson?.practice ? <Button variant="brand" label={L(`Luyện ${lesson.practice.questionCount} câu tiếp cùng chủ đề`, `Practise ${lesson.practice.questionCount} more on this topic`)} iconRight="arrow-right" onPress={() => {
            const p = lesson.practice!;
            const query = new URLSearchParams({ mode: 'p1', p1: p.topicId, count: String(p.questionCount), offset: String(p.questionOffset + p.questionCount), coach: '1', typed: attempt.typed ? '1' : '0' });
            router.push(`/speaking/room?${query}` as never);
          }} /> : null}
          <Button variant="outline" label={L('Chọn chủ đề khác', 'Choose another topic')} onPress={() => router.replace('/speaking' as never)} />
        </View>
      </View>
    </StudyFrame>
  );
}

function CriterionCard({ k, en, vi, grade, attempt }: { k: CriterionKey; en: string; vi: string; grade: SpeakingGrade; attempt: SpeakingAttempt }) {
  const { L, en: isEn } = useL();
  const c = grade.criteria[k];
  const tone = bandTone(c.band);
  const m = attempt.metrics;
  const basisNote =
    k !== 'pr'
      ? null
      : grade.pronunciationBasis === 'clarity+ai'
        ? L(
            `Ước lượng chủ yếu từ độ rõ máy nghe được (${m.avgConfidence != null ? Math.round(m.avgConfidence * 100) : '?'}% tin cậy, ${m.lowConfShare != null ? Math.round(m.lowConfShare * 100) : '?'}% từ nghe không chắc). AI không nghe giọng bạn — chỉ để tham khảo.`,
            `Estimated mainly from recognition clarity (${m.avgConfidence != null ? Math.round(m.avgConfidence * 100) : '?'}% confidence, ${m.lowConfShare != null ? Math.round(m.lowConfShare * 100) : '?'}% of words uncertain). The AI doesn't hear your voice — for reference only.`,
          )
        : grade.pronunciationBasis === 'text-only'
          ? L('Chỉ ước từ bản chữ nên điểm này bị giới hạn.', 'Estimated from the transcript only, so this score is capped.')
          : L('Bài gõ phím — không chấm phát âm.', 'Typed answers — pronunciation not graded.');
  return (
    <View className="rounded-[22px] bg-white p-4" style={[SPK_CARD, { flexGrow: 1, flexShrink: 1, flexBasis: 300 }]}>
      <View className="flex-row items-center gap-2.5">
        <SealIcon name={CRIT_ICON[k]} color={CRIT_COLOR[k]} size={34} />
        <View className="min-w-0 flex-1">
          <Text className="font-heavy text-body text-ink">{en}</Text>
          {isEn ? null : (
            <Text className="font-sans text-label" style={{ color: SPK.muted }}>
              {vi}
            </Text>
          )}
        </View>
        <View className="items-center justify-center rounded-2xl px-3 py-1.5" style={{ backgroundColor: tone.bg, minWidth: 58 }}>
          <Text className="font-heavy" style={{ fontSize: 22, lineHeight: 28, color: tone.fg }}>
            {fmtBand(c.band)}
          </Text>
        </View>
      </View>
      {c.explanationVi ? (
        <Text className="mt-3 font-sans text-body text-ink" style={{ lineHeight: 21 }}>
          {c.explanationVi}
        </Text>
      ) : null}
      {basisNote ? (
        <Text className="mt-2 rounded-xl p-2.5 font-sans text-label" style={{ backgroundColor: SPK.roseSoft, color: '#9F1239', lineHeight: 18 }}>
          {basisNote}
        </Text>
      ) : null}
      {c.fixes.length ? (
        <View className="mt-3 gap-1.5">
          {c.fixes.map((f) => (
            <View key={f} className="flex-row gap-2">
              <View style={{ paddingTop: 3 }}>
                <Icon name="arrow-right" size={14} color={CRIT_COLOR[k]} />
              </View>
              <Text className="min-w-0 flex-1 font-sans text-body" style={{ color: '#334155', lineHeight: 20 }}>
                {f}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AnswerCard({ attempt, index, previousAttempt }: { attempt: SpeakingAttempt; index: number; previousAttempt?: SpeakingAttempt }) {
  const a = attempt.answers[index]!;
  const sample = attempt.grade?.samples.find((s) => s.questionIndex === index) ?? null;
  const fixes = attempt.grade?.fixes.filter((f) => f.questionIndex === index) ?? [];
  const [playing, setPlaying] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const oldAnswer = previousAttempt?.answers.find((x) => x.questionId === a.questionId);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);
  const short = a.metrics.words < MIN_WORDS[a.part];
  const { L } = useL();

  const play = () => {
    if (!sample) return;
    if (playing) {
      stopRef.current?.();
      stopRef.current = null;
      setPlaying(false);
      return;
    }
    setPlaying(true);
    setVoiceError(null);
    stopRef.current = speakWithAoede(sample.improved, { rate: 0.95, onDone: () => setPlaying(false), onError: (message) => { setPlaying(false); setVoiceError(message); } });
  };

  return (
    <View className="rounded-[22px] bg-white p-4" style={SPK_CARD}>
      <View className="flex-row flex-wrap items-center gap-2">
        <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: SPK.blueSoft }}>
          <Text className="font-strong text-label" style={{ color: SPK.blue }}>
            {L(`Câu ${index + 1} · Part ${a.part}`, `Question ${index + 1} · Part ${a.part}`)}
          </Text>
        </View>
        <Text className="font-sans text-label" style={{ color: short ? SPK.amber : SPK.muted }}>
          {L(`${a.metrics.words} từ`, `${a.metrics.words} words`)}
          {a.metrics.wpm != null ? L(` · ${a.metrics.wpm} từ/phút`, ` · ${a.metrics.wpm} wpm`) : ''}
          {a.metrics.fillers ? L(` · ${a.metrics.fillers} đệm`, ` · ${a.metrics.fillers} fillers`) : ''}
          {short ? L(' · hơi ngắn', ' · a bit short') : ''}
        </Text>
      </View>
      <Text className="mt-2 font-strong text-bodyLg text-ink">{a.question}</Text>
      {a.notes ? (
        <Text className="mt-2 font-sans text-label" style={{ color: '#78350F' }}>
          {L('Ghi chú chuẩn bị: ', 'Prep notes: ')}
          {a.notes}
        </Text>
      ) : null}
      {oldAnswer ? <View className="mt-3 gap-1"><Text className="font-strong text-label" style={{ color: SPK.muted }}>{L('Lần trước bạn nói', 'Your previous answer')}</Text><Text className="font-sans text-body text-ink" style={{ lineHeight: 22 }}>{oldAnswer.transcript}</Text></View> : null}
      <Text className="mt-3 font-strong text-label" style={{ color: SPK.muted }}>{L(oldAnswer ? 'Lần này bạn nói' : 'Câu trả lời của bạn', oldAnswer ? 'Your new answer' : 'Your answer')}</Text>
      <Text className="mt-2 rounded-2xl p-3 font-sans text-body text-ink" style={{ backgroundColor: SPK.panel, lineHeight: 23 }}>
        {markFillers(a.transcript).map((p, i) =>
          p.filler ? (
            <Text key={i} style={{ backgroundColor: '#FDE68A', color: '#92400E', fontWeight: '700' }}>
              {p.text}
            </Text>
          ) : (
            <Text key={i}>{p.text}</Text>
          ),
        )}
      </Text>

      {fixes.map((f, i) => (
        <Text key={i} className="mt-2 font-sans text-label" style={{ color: '#334155', lineHeight: 18 }}>
          <Text style={{ color: SPK.rose }}>“{f.quote}”</Text> → <Text style={{ color: SPK.green, fontWeight: '700' }}>{f.better}</Text>
          {'\n'}{f.problemVi}
        </Text>
      ))}

      {sample ? (
        <View className="mt-3 rounded-2xl p-3.5" style={{ backgroundColor: SPK.tealSoft }}>
          <View className="flex-row items-center gap-2">
            <Icon name="sparkle" size={16} color={SPK.teal} />
            <Text className="min-w-0 flex-1 font-strong text-body" style={{ color: SPK.teal }}>
              {L('Bài mẫu gợi ý', 'Suggested model answer')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playing ? L('Dừng Aoede', 'Stop Aoede') : L('Nghe bài mẫu bằng Aoede', 'Hear the sample in Aoede')}
              onPress={play} className="h-9 w-9 items-center justify-center rounded-pill bg-white">
              <Icon name={playing ? 'close' : 'volume'} size={17} color={SPK.teal} />
            </Pressable>
          </View>
          <Text className="mt-2 font-sans text-body text-ink" style={{ lineHeight: 22 }}>
            {sample.improved}
          </Text>
          {sample.whyVi ? (
            <Text className="mt-3 font-sans text-body" style={{ color: '#115E59', lineHeight: 22 }}>
              <Text className="font-strong">{L('AI phân tích & gợi ý nói lại: ', 'AI analysis & your next step: ')}</Text>
              {sample.whyVi}
            </Text>
          ) : null}
        </View>
      ) : null}
      {voiceError ? <Text className="mt-2 font-sans text-label" style={{ color: SPK.rose }}>{voiceError}</Text> : null}

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          label={L('Nói lại câu này', 'Try this question again')}
          iconLeft="refresh"
          onPress={() => router.push(`/speaking/room?mode=q&q=${encodeURIComponent(a.questionId)}&retryOf=${encodeURIComponent(attempt.id)}${attempt.typed ? '&typed=1' : ''}` as never)}
        />
        {sample ? (
          <Button
            variant="brandOutline"
            size="sm"
            label={L('Nói lại bản hay hơn', 'Say the better version')}
            iconLeft="mic"
            onPress={() => router.push(`/speaking/room?mode=q&q=${encodeURIComponent(a.questionId)}&sample=1&retryOf=${encodeURIComponent(attempt.id)}${attempt.typed ? '&typed=1' : ''}` as never)}
          />
        ) : null}
      </View>
    </View>
  );
}
