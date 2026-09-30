import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { StudyCard, StudyFrame } from '@/components/vocab/study/StudyKit';
import { SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteMic, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { bandTone, fmtBand, fmtDate, MetricTile, MODE_LABEL, Notice, SPK, SPK_CARD } from '@/components/speaking/SpeakingKit';
import type { SpeakingAttempt } from '@/services/speaking/attempts';
import { CRITERIA, type CriterionKey, type SpeakingGrade } from '@/services/speaking/grade';
import { markFillers, MIN_WORDS } from '@/services/speaking/metrics';
import { speakSentence } from '@/services/shadow/speech';
import { useAuthStore } from '@/store/useAuthStore';
import { useGameStore } from '@/store/useGameStore';
import { useSpeakingStore } from '@/store/useSpeakingStore';

const CRIT_COLOR: Record<CriterionKey, string> = { fc: SPK.blue, lr: SPK.teal, gr: SPK.amber, pr: SPK.rose };
const CRIT_ICON: Record<CriterionKey, React.ComponentProps<typeof Icon>['name']> = { fc: 'trending', lr: 'letters', gr: 'pencil', pr: 'mic' };

/** Lỗi máy chủ đôi khi kèm chi tiết từng proxy — người học chỉ cần một câu dễ hiểu. */
function friendly(message: string, code?: string): string {
  if (code === 'server_error' || code === 'timeout' || code === 'network' || code === 'rate_limited')
    return 'AI đang bận hoặc tạm lỗi nên chưa chấm được. Lượt AI của bạn đã được hoàn lại — thử lại sau ít phút.';
  if (code === 'bad_response') return 'AI trả về phiếu chấm không hợp lệ. Lượt AI đã được hoàn lại — thử chấm lại nhé.';
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
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const attempt = useSpeakingStore((s) => s.attempts.find((a) => a.id === id));
  const accessToken = useAuthStore((s) => s.session?.access_token ?? null);
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const [loading, setLoading] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
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
          throw Object.assign(new Error(data.error ?? 'Chấm bài thất bại.'), { code: data.code });
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
      <StudyFrame backHref="/speaking" title="Phiếu điểm">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">Lượt này không còn trong máy.</Text>
          <Button className="mt-4 self-start" label="Về phòng luyện nói" onPress={() => router.replace('/speaking' as never)} />
        </StudyCard>
      </StudyFrame>
    );
  }

  const g = attempt.grade;
  const m = attempt.metrics;
  const overall = attempt.typed ? null : (g?.overall ?? null);
  const tone = bandTone(overall);

  return (
    <StudyFrame backHref="/speaking" title="Phiếu điểm">
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
              <Label text={attempt.typed ? 'Bài gõ phím' : 'Band ước lượng'} color={attempt.typed ? SPK.amberSoft : '#DBEAFE'} ink={attempt.typed ? '#92400E' : '#1E3A8A'} size={13} />
              <Text className="mt-2 font-strong text-body text-ink" numberOfLines={2}>
                {MODE_LABEL[attempt.mode]} · {attempt.titleVi}
              </Text>
              <Text className="font-sans text-label" style={{ color: SPK.muted }}>
                {fmtDate(attempt.finishedAt)} · {attempt.answers.length} câu · {m.words} từ
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
              <Notice tone="warn">Bài này GÕ PHÍM nên không phải điểm Speaking: không có Fluency, Pronunciation và band tổng. AI chỉ chấm từ vựng và ngữ pháp.</Notice>
            ) : null}
            {loading ? (
              <View className="flex-row items-center gap-3 rounded-2xl p-3.5" style={{ backgroundColor: SPK.blueSoft }}>
                <ActivityIndicator color={SPK.blue} />
                <Text className="min-w-0 flex-1 font-sans text-body" style={{ color: '#1E3A8A' }}>
                  AI đang chấm theo 4 tiêu chí… thường mất 10–30 giây. Chỉ số đo tại máy ở bên dưới đã có sẵn.
                </Text>
              </View>
            ) : null}
            {!loading && needLogin && !g ? (
              <View className="gap-2">
                <Notice tone="info">Đăng nhập để AI chấm band theo 4 tiêu chí. Chỉ số đo tại máy bên dưới vẫn xem được khi chưa đăng nhập.</Notice>
                <View className="flex-row flex-wrap gap-2">
                  <Button variant="brand" size="sm" label="Đăng nhập" onPress={() => router.push('/auth/sign-in' as never)} />
                  <Button variant="outline" size="sm" label="Đã đăng nhập, chấm ngay" onPress={() => grade(attempt)} />
                </View>
              </View>
            ) : null}
            {!loading && !needLogin && attempt.gradeError && !g ? (
              <View className="gap-2">
                <Notice tone="error">{attempt.gradeError} Chỉ số đo tại máy bên dưới vẫn đầy đủ.</Notice>
                <Button className="self-start" variant="outline" size="sm" label="Chấm lại bằng AI" iconLeft="refresh" onPress={() => grade(attempt)} />
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
                  <Text className="font-heavy text-cardTitle text-ink">Điểm mạnh</Text>
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
                  <Text className="font-heavy text-cardTitle text-ink">Sửa ngay ở lượt sau</Text>
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
                        {f.questionIndex != null ? ` (câu ${f.questionIndex + 1})` : ''}
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
            <Text className="min-w-0 flex-1 font-heavy text-cardTitle text-ink">Chỉ số đo tại máy</Text>
            <Label text="Không cần AI" color={SPK.greenSoft} ink="#166534" size={12} tilt={3} />
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2.5">
            <MetricTile
              label="Tốc độ nói"
              value={m.wpm != null ? `${m.wpm}` : '—'}
              hint={m.wpm != null ? 'từ/phút · trôi chảy thường 110–160' : attempt.typed ? 'bài gõ phím' : 'chưa đủ dữ liệu'}
              tone={m.wpm == null ? undefined : m.wpm < 90 ? SPK.amber : m.wpm > 190 ? SPK.amber : SPK.green}
            />
            <MetricTile label="Từ đệm" value={`${m.fillers}`} hint={`${m.fillersPer100} trên 100 từ`} tone={m.fillersPer100 > 5 ? SPK.amber : undefined} />
            <MetricTile label="Ngắt ≥ 2 giây" value={attempt.typed ? '—' : `${m.longPauses}`} hint="giữa lúc đang nói" />
            <MetricTile label="Độ dài trung bình" value={`${m.avgWords}`} hint={`từ/câu · ${m.shortAnswers} câu quá ngắn`} tone={m.shortAnswers ? SPK.amber : undefined} />
            <MetricTile label="Độ đa dạng từ" value={m.lexicalVariety != null ? `${Math.round(m.lexicalVariety * 100)}%` : '—'} hint="từ khác nhau / 50 từ liên tiếp" />
            <MetricTile
              label="Độ rõ máy nghe"
              value={m.avgConfidence != null ? `${Math.round(m.avgConfidence * 100)}%` : '—'}
              hint={m.lowConfShare != null ? `${Math.round(m.lowConfShare * 100)}% từ nghe không chắc` : 'trình duyệt không báo'}
            />
          </View>
          {m.repeated.length ? (
            <View className="mt-4">
              <Text className="font-strong text-body text-ink">Từ bạn lặp nhiều</Text>
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
            Mọi chỉ số đọc từ bản chữ của bộ nhận giọng, không từ âm thanh. Bộ nhận giọng hay lược bớt “uh/um”, nên số từ đệm thật có thể cao hơn; khoảng ngắt ước từ nhịp máy nghe thêm chữ.
          </Text>
        </View>

        {/* ------------------------------------------------ từng câu */}
        <View className="gap-3">
          {attempt.answers.map((a, i) => (
            <AnswerCard key={`${a.questionId}-${i}`} attempt={attempt} index={i} />
          ))}
        </View>

        <View className="flex-row flex-wrap gap-3">
          <Button variant="brand" label="Luyện lượt mới" iconRight="arrow-right" onPress={() => router.replace('/speaking' as never)} />
        </View>
      </View>
    </StudyFrame>
  );
}

function CriterionCard({ k, en, vi, grade, attempt }: { k: CriterionKey; en: string; vi: string; grade: SpeakingGrade; attempt: SpeakingAttempt }) {
  const c = grade.criteria[k];
  const tone = bandTone(c.band);
  const m = attempt.metrics;
  const basisNote =
    k !== 'pr'
      ? null
      : grade.pronunciationBasis === 'clarity+ai'
        ? `Ước lượng chủ yếu từ độ rõ máy nghe được (${m.avgConfidence != null ? Math.round(m.avgConfidence * 100) : '?'}% tin cậy, ${m.lowConfShare != null ? Math.round(m.lowConfShare * 100) : '?'}% từ nghe không chắc). AI không nghe giọng bạn — chỉ để tham khảo.`
        : grade.pronunciationBasis === 'text-only'
          ? 'Trình duyệt không báo độ tin cậy, nên chỉ đoán từ bản chữ; điểm này bị giới hạn không vượt các tiêu chí khác.'
          : 'Bài gõ phím — không chấm phát âm.';
  return (
    <View className="rounded-[22px] bg-white p-4" style={[SPK_CARD, { flexGrow: 1, flexShrink: 1, flexBasis: 300 }]}>
      <View className="flex-row items-center gap-2.5">
        <SealIcon name={CRIT_ICON[k]} color={CRIT_COLOR[k]} size={34} />
        <View className="min-w-0 flex-1">
          <Text className="font-heavy text-body text-ink">{en}</Text>
          <Text className="font-sans text-label" style={{ color: SPK.muted }}>
            {vi}
          </Text>
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

function AnswerCard({ attempt, index }: { attempt: SpeakingAttempt; index: number }) {
  const a = attempt.answers[index]!;
  const sample = attempt.grade?.samples.find((s) => s.questionIndex === index) ?? null;
  const fixes = attempt.grade?.fixes.filter((f) => f.questionIndex === index) ?? [];
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);
  const short = a.metrics.words < MIN_WORDS[a.part];

  const play = () => {
    if (!sample) return;
    if (playing) {
      stopRef.current?.();
      stopRef.current = null;
      setPlaying(false);
      return;
    }
    setPlaying(true);
    stopRef.current = speakSentence(sample.improved, { rate: 0.9, onDone: () => setPlaying(false) });
  };

  return (
    <View className="rounded-[22px] bg-white p-4" style={SPK_CARD}>
      <View className="flex-row flex-wrap items-center gap-2">
        <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: SPK.blueSoft }}>
          <Text className="font-strong text-label" style={{ color: SPK.blue }}>
            Câu {index + 1} · Part {a.part}
          </Text>
        </View>
        <Text className="font-sans text-label" style={{ color: short ? SPK.amber : SPK.muted }}>
          {a.metrics.words} từ{a.metrics.wpm != null ? ` · ${a.metrics.wpm} từ/phút` : ''}
          {a.metrics.fillers ? ` · ${a.metrics.fillers} đệm` : ''}
          {short ? ' · hơi ngắn' : ''}
        </Text>
      </View>
      <Text className="mt-2 font-strong text-bodyLg text-ink">{a.question}</Text>
      {a.notes ? (
        <Text className="mt-2 font-sans text-label" style={{ color: '#78350F' }}>
          Ghi chú chuẩn bị: {a.notes}
        </Text>
      ) : null}
      <Text className="mt-3 rounded-2xl p-3 font-sans text-body text-ink" style={{ backgroundColor: SPK.panel, lineHeight: 23 }}>
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
        </Text>
      ))}

      {sample ? (
        <View className="mt-3 rounded-2xl p-3.5" style={{ backgroundColor: SPK.tealSoft }}>
          <View className="flex-row items-center gap-2">
            <Icon name="sparkle" size={16} color={SPK.teal} />
            <Text className="min-w-0 flex-1 font-strong text-body" style={{ color: SPK.teal }}>
              Bản hay hơn
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Dừng đọc' : 'Nghe bản hay hơn'} onPress={play} className="h-9 w-9 items-center justify-center rounded-pill bg-white">
              <Icon name={playing ? 'close' : 'volume'} size={17} color={SPK.teal} />
            </Pressable>
          </View>
          <Text className="mt-2 font-sans text-body text-ink" style={{ lineHeight: 22 }}>
            {sample.improved}
          </Text>
          {sample.whyVi ? (
            <Text className="mt-1.5 font-sans text-label" style={{ color: '#115E59', lineHeight: 18 }}>
              {sample.whyVi}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          label="Luyện lại câu này"
          iconLeft="refresh"
          onPress={() => router.push(`/speaking/room?mode=q&q=${encodeURIComponent(a.questionId)}${attempt.typed ? '&typed=1' : ''}` as never)}
        />
        {sample ? (
          <Button
            variant="brandOutline"
            size="sm"
            label="Nói lại bản hay hơn"
            iconLeft="mic"
            onPress={() => router.push(`/speaking/room?mode=q&q=${encodeURIComponent(a.questionId)}&sample=1` as never)}
          />
        ) : null}
      </View>
    </View>
  );
}
