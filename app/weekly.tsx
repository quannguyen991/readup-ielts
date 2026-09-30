import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { MathQuestionView } from '@/components/math/MathQuestionView';
import { Appear, CrossFade } from '@/components/motion/Motion';
import { PassageText } from '@/components/sat-rw/PassageText';
import { EvidenceTable, NotesList } from '@/components/sat-rw/ItemBody';
import { QuestionCard } from '@/components/sat-rw/QuestionCard';
import { Badge, Button, Card } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { gradeMathItem } from '@/services/math/grade';
import {
  buildWeeklyChallenge,
  formatDuration,
  msUntilNextWeek,
  parseWeekId,
  rankOf,
  weekId,
  weekLabel,
  type WeeklyItem,
  type WeeklyResult,
} from '@/services/weekly/challenge';
import { downloadShareCard, shareResult, type ShareCardData } from '@/services/weekly/share-card';
import { useAuthStore } from '@/store/useAuthStore';
import { useSyncStore } from '@/store/useSyncStore';
import { useWeeklyStore } from '@/store/useWeeklyStore';
import { color } from '@/theme/tokens';
import { useGameStore } from '@/store/useGameStore';

type Board = {
  participants: number;
  results: { score: number; ms: number }[];
  top: { name: string; score: number; total: number; ms: number }[];
};

type Answer = string | null;

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(30,41,99,0.08)' } as object;

function isCorrect(it: WeeklyItem, a: Answer): boolean {
  if (it.kind === 'math') return gradeMathItem(it.item, a).isCorrect;
  return a !== null && Number(a) === it.question.answerIndex;
}

/**
 * ĐỀ CỦA TUẦN — cả nước cùng một đề 10 câu SAT, đổi đề mỗi thứ Hai
 * (`services/weekly/challenge.ts`). Không báo đúng sai giữa chừng; nộp bài xong
 * mới chấm, xếp hạng, và cho xem lại. Chỉ lần làm đầu tiên được tính điểm.
 */
export default function WeeklyScreen() {
  const [now] = useState(() => Date.now());
  const week = weekId(now);
  const weekNo = parseWeekId(week)?.week ?? 0;
  const items = useMemo(() => buildWeeklyChallenge(week), [week]);
  const saved = useWeeklyStore((s) => s.results[week]);
  const record = useWeeklyStore((s) => s.record);
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const syncNow = useSyncStore((s) => s.syncNow);

  const [phaseState, setPhase] = useState<'intro' | 'run' | 'done'>(saved ? 'done' : 'intro');
  // Kết quả đã lưu có thể đọc xong SAU lần vẽ đầu: đã làm rồi thì là màn kết quả.
  const phase = phaseState === 'intro' && saved ? 'done' : phaseState;
  const [practice, setPractice] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [attempt, setAttempt] = useState<WeeklyResult | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [boardError, setBoardError] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const loadBoard = () => {
    fetch(`/api/weekly?week=${week}`)
      .then((r) => (r.ok ? (r.json() as Promise<Board>) : Promise.reject(new Error(String(r.status)))))
      .then((b) => {
        setBoard(b);
        setBoardError(false);
      })
      .catch(() => setBoardError(true));
  };
  useEffect(loadBoard, [week]);

  const start = (asPractice: boolean) => {
    setPractice(asPractice);
    setAnswers({});
    setIndex(0);
    setStartedAt(Date.now());
    setAttempt(null);
    setPhase('run');
  };

  const submit = () => {
    const ms = Date.now() - startedAt;
    const wrong = items.filter((it) => !isCorrect(it, answers[it.id] ?? null)).map((it) => it.id);
    const result: WeeklyResult = { score: items.length - wrong.length, total: items.length, ms, at: new Date().toISOString(), wrong };
    setAttempt(result);
    // XP game chỉ cho lượt được tính — làm lại đề đã biết đáp án thì không cộng.
    if (!practice) useGameStore.getState().awardBatch(result.score, result.total, 'weekly', `weekly:${week}`);
    if (!practice && record(week, result) && userId) {
      // Đẩy kết quả lên ngay để bảng cả nước có mình, rồi tải lại bảng.
      void syncNow(userId, 'push').then(loadBoard);
    }
    setPhase('done');
  };

  // Kết quả ĐƯỢC TÍNH (lần đầu) và kết quả vừa làm (có thể là luyện tập).
  const counted = saved ?? null;
  const shown = attempt ?? counted;
  const standing = useMemo(() => {
    if (!counted || !board) return null;
    // Bảng máy chủ có thể đã gồm chính mình — bỏ đúng một dòng trùng trước khi xếp.
    const others = [...board.results];
    const self = others.findIndex((r) => r.score === counted.score && r.ms === counted.ms);
    if (self >= 0) others.splice(self, 1);
    return rankOf(counted, others);
  }, [counted, board]);

  const share: ShareCardData | null = counted
    ? {
        weekNumber: weekNo,
        weekRange: weekLabel(week),
        score: counted.score,
        total: counted.total,
        time: formatDuration(counted.ms),
        topPercent: standing && standing.total > 1 ? standing.topPercent : null,
        participants: standing?.total ?? 1,
      }
    : null;

  const days = Math.floor(msUntilNextWeek(now) / 86_400_000);

  if (phase === 'run') {
    const it = items[index]!;
    const answered = items.filter((x) => (answers[x.id] ?? null) !== null && answers[x.id] !== '').length;
    return (
      <Screen>
        <View className="w-full self-center" style={{ maxWidth: 860 }}>
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text className="font-heavy text-sectionTitle text-ink">
              Đề của tuần {weekNo}
              {practice ? <Text className="font-sans text-body text-muted"> · luyện tập, không tính điểm</Text> : null}
            </Text>
            <Clock startedAt={startedAt} />
          </View>
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            {items.map((x, i) => {
              const done = (answers[x.id] ?? null) !== null && answers[x.id] !== '';
              return (
                <Pressable
                  key={x.id}
                  onPress={() => setIndex(i)}
                  className="h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: i === index ? color.primary : done ? '#DBEAFE' : 'rgba(255,255,255,0.85)' }}
                >
                  <Text className="font-semi text-label" style={{ color: i === index ? '#FFFFFF' : color.ink }}>
                    {i + 1}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <CrossFade swapKey={`w-${index}`}>
            <View className="mt-4 rounded-[22px] bg-white p-5" style={CARD}>
              <Badge label={it.kind === 'math' ? 'SAT Math' : 'SAT Verbal'} tone={it.kind === 'math' ? 'info' : 'accent'} />
              <View className="mt-3">
                {it.kind === 'math' ? (
                  <MathQuestionView
                    item={it.item}
                    answer={answers[it.id] ?? null}
                    onAnswer={(a) => setAnswers((m) => ({ ...m, [it.id]: a }))}
                  />
                ) : (
                  <VerbalItem q={it.question} picked={answers[it.id] ?? null} onPick={(i) => setAnswers((m) => ({ ...m, [it.id]: String(i) }))} />
                )}
              </View>
            </View>
          </CrossFade>
          <View className="mt-4 flex-row flex-wrap items-center gap-2">
            <Button variant="outline" label="Câu trước" iconLeft="chevron-left" disabled={index === 0} onPress={() => setIndex((i) => i - 1)} />
            {index < items.length - 1 ? (
              <Button label="Câu sau" iconRight="chevron-right" onPress={() => setIndex((i) => i + 1)} />
            ) : null}
            <View className="flex-1" />
            <Button
              variant={answered === items.length ? 'primary' : 'secondary'}
              label={answered === items.length ? 'Nộp bài' : `Nộp bài (còn ${items.length - answered} câu trống)`}
              onPress={submit}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="progress"
          badge="ĐỀ CỦA TUẦN" art="test"
          line1={`Tuần ${weekNo} · ${weekLabel(week)}`}
          line2="cả nước cùng một đề"
          subtitle="10 câu SAT (5 Math, 5 Verbal), khoảng 12–15 phút. Không báo đúng sai giữa chừng. Chỉ LẦN LÀM ĐẦU TIÊN được tính điểm; đề mới mỗi thứ Hai."
          footer={
            <>
              <HeroStat value={String(board?.participants ?? 0)} label="người đã làm" />
              <HeroStat value={days > 0 ? `${days} ngày` : 'hôm nay'} label={days > 0 ? 'tới đề mới' : 'đổi đề lúc nửa đêm'} />
            </>
          }
        >
          {counted ? (
            <>
              <Button label="Làm lại (luyện tập)" variant="outline" size="lg" iconLeft="refresh" onPress={() => start(true)} />
            </>
          ) : (
            <Button label="Bắt đầu làm đề" variant="brand" size="lg" iconRight="arrow-right" onPress={() => start(false)} />
          )}
        </LightHero>
      </Appear>

      {shown && phase === 'done' ? (
        <Appear index={1}>
          <View className="mt-5 rounded-[22px] bg-white p-6" style={CARD}>
            <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">
              {attempt && practice ? 'Lần luyện tập vừa rồi' : 'Kết quả được tính của tuần này'}
            </Text>
            <View className="mt-2 flex-row flex-wrap items-end gap-4">
              <Text className="font-heavy text-hero text-ink">
                {shown.score}/{shown.total}
              </Text>
              <Text className="mb-2 font-sans text-bodyLg text-muted">{formatDuration(shown.ms)}</Text>
            </View>
            {counted && !(attempt && practice) ? (
              standing ? (
                <Text className="mt-2 font-semi text-bodyLg text-ink">
                  {standing.total > 1
                    ? `Hạng ${standing.rank}/${standing.total} · top ${standing.topPercent}% cả nước`
                    : 'Bạn là người đầu tiên làm đề tuần này — mời bạn bè vào so điểm!'}
                </Text>
              ) : boardError ? (
                <Text className="mt-2 font-sans text-body text-muted">Chưa tải được bảng xếp hạng (có thể đang ngoại tuyến).</Text>
              ) : null
            ) : null}
            {!userId && counted ? (
              <Text className="mt-2 font-sans text-body" style={{ color: '#B45309' }}>
                Bạn đang ở chế độ Khách: kết quả chỉ lưu trên máy này và chưa vào bảng cả nước. Đăng nhập rồi đồng bộ để có tên trên bảng.
              </Text>
            ) : null}
            {share && Platform.OS === 'web' ? (
              <View className="mt-4 flex-row flex-wrap gap-2">
                <Button
                  label="Chia sẻ kết quả"
                  iconLeft="external"
                  onPress={() =>
                    void shareResult(share).then((how) =>
                      setShareNote(how === 'copied' ? 'Đã chép lời mời + đường dẫn — dán vào Zalo/Messenger.' : how === 'failed' ? 'Máy không mở được bảng chia sẻ.' : null),
                    )
                  }
                />
                <Button variant="outline" label="Tải ảnh kết quả" iconLeft="download" onPress={() => void downloadShareCard(share)} />
              </View>
            ) : null}
            {shareNote ? <Text className="mt-2 font-sans text-label text-muted">{shareNote}</Text> : null}
          </View>
        </Appear>
      ) : null}

      {shown && phase === 'done' && attempt ? <Review items={items} answers={answers} /> : null}

      <Appear index={2}>
        <View className="mt-5 rounded-[22px] bg-white p-6" style={CARD}>
          <View className="flex-row items-center gap-2">
            <Icon name="trophy" size={20} color="#D97706" />
            <Text className="font-heavy text-sectionTitle text-ink">Bảng xếp hạng tuần {weekNo}</Text>
          </View>
          <Text className="mt-1 font-sans text-body text-muted">Nhiều câu đúng hơn đứng trên; bằng câu đúng thì ai nhanh hơn.</Text>
          {!board ? (
            <Text className="mt-3 font-sans text-body text-muted">{boardError ? 'Chưa tải được bảng.' : 'Đang tải…'}</Text>
          ) : board.top.length === 0 ? (
            <Text className="mt-3 font-sans text-body text-muted">Chưa ai làm đề tuần này. Làm đầu tiên để đứng đầu bảng!</Text>
          ) : (
            <View className="mt-3 gap-2">
              {board.top.map((row, i) => (
                <View
                  key={`${row.name}-${i}`}
                  className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ backgroundColor: i === 0 ? '#FEF3C7' : i < 3 ? '#F1F6FF' : '#F8FAFC' }}
                >
                  <Text className="w-8 font-heavy text-bodyLg text-ink">#{i + 1}</Text>
                  <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text className="font-heavy text-bodyLg text-ink">
                    {row.score}/{row.total}
                  </Text>
                  <Text className="w-24 text-right font-sans text-label text-muted">{formatDuration(row.ms)}</Text>
                </View>
              ))}
            </View>
          )}
          <Button className="mt-4 self-start" variant="ghost" label="Về trang Hôm nay" onPress={() => router.push('/dashboard' as never)} />
        </View>
      </Appear>
      <View className="h-8" />
    </Screen>
  );
}

function Clock({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return (
    <View className="flex-row items-center gap-1.5 rounded-pill bg-white px-3 py-1.5">
      <Icon name="clock" size={15} color={color.muted} />
      <Text className="font-semi text-body text-ink">{formatDuration(elapsed)}</Text>
    </View>
  );
}

/** Câu Verbal khi đang làm: chọn được, đổi được, KHÔNG hiện đúng sai. */
function VerbalItem({ q, picked, onPick }: { q: import('@/data/sat-rw-repository').SatRwQuestion; picked: Answer; onPick: (i: number) => void }) {
  return (
    <View>
      <PassageText passage={q.passage} underline={q.underline} />
      {q.notes ? <NotesList notes={q.notes} /> : null}
      {q.table ? <EvidenceTable table={q.table} /> : null}
      <Text className="mt-4 font-strong text-body text-ink">{q.stem}</Text>
      <View className="mt-3 gap-2">
        {q.options.map((opt, i) => {
          const sel = picked !== null && Number(picked) === i;
          return (
            <Pressable
              key={i}
              onPress={() => onPick(i)}
              className="flex-row items-start gap-3 rounded-2xl px-4 py-3"
              style={{ borderWidth: 1.5, borderColor: sel ? color.primary : '#E2E8F0', backgroundColor: sel ? '#EAF1FF' : '#FFFFFF' }}
            >
              <View className="h-6 w-6 items-center justify-center rounded-pill" style={{ backgroundColor: sel ? color.primary : '#EEF2F7' }}>
                <Text className="font-strong text-label" style={{ color: sel ? '#FFFFFF' : color.muted }}>
                  {'ABCD'[i]}
                </Text>
              </View>
              <Text className="min-w-0 flex-1 font-sans text-body text-ink">{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Xem lại sau khi nộp: câu sai trước, kèm lời giải. */
function Review({ items, answers }: { items: WeeklyItem[]; answers: Record<string, Answer> }) {
  const wrong = items.filter((it) => !isCorrect(it, answers[it.id] ?? null));
  if (wrong.length === 0) {
    return (
      <Card className="mt-5">
        <Text className="font-semi text-bodyLg" style={{ color: '#15803D' }}>
          Đúng cả 10 câu. Xuất sắc!
        </Text>
      </Card>
    );
  }
  return (
    <View className="mt-5">
      <Text className="mb-3 font-heavy text-sectionTitle text-ink">Xem lại {wrong.length} câu sai</Text>
      <View className="gap-3">
        {wrong.map((it) =>
          it.kind === 'math' ? (
            <View key={it.id} className="rounded-[22px] bg-white p-5" style={CARD}>
              <MathQuestionView item={it.item} answer={answers[it.id] ?? null} revealed />
            </View>
          ) : (
            <QuestionCard key={it.id} question={it.question} picked={answers[it.id] === undefined || answers[it.id] === null ? -1 : Number(answers[it.id])} onPick={() => {}} />
          ),
        )}
      </View>
    </View>
  );
}
