import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Grid } from '@/components/layout/Grid';
import { HeroShell } from '@/components/layout/HeroShell';
import { Button } from '@/components/ui';
import { Icon, type IconName } from '@/components/ui/Icon';
import { TileArt } from '@/components/ui/TileArt';
import { ToneTile } from '@/components/vocab/ToneTile';

import { ChoiceGrid, FeedbackPanel, PrimaryButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { useDeckVisit } from '@/components/vocab/study/useDeckVisit';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { groupByStatus, stageAfterQuiz } from '@/services/vocab/deck-status';
import { buildThptQuiz, THPT_KIND_LABEL, type ThptDifficulty, type ThptMode, type ThptQuestion } from '@/services/vocab/thpt-quiz';
import { levelOf } from '@/data/study-decks';
import { seededRng, shuffled } from '@/services/vocab/topic-study';
import { dueBySlug } from '@/services/vocab/review-schedule';
import { todayKey } from '@/store/persist';
import { useGameStore } from '@/store/useGameStore';
import { useStreak, useStudyStore } from '@/store/useStudyStore';
import { Confetti } from '@/components/motion/Confetti';
import { FlameBurst, STREAK_STEP, StreakBadge } from '@/components/vocab/study/StreakFlame';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useL } from '@/i18n/useL';
import { useStoreTheme } from '@/components/vocab/study/useStudyTheme';
import { useAutoPronounce } from '@/services/audio/pronounce';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

/** Nút chọn kiểu một dòng: viên màu tím khi đang chọn. */
function Pick({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{ minWidth: 72, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, backgroundColor: on ? '#1B1140' : '#FFFFFF', borderWidth: 1, borderColor: on ? '#1B1140' : '#EAE4F8' }}
    >
      <Text className="font-heavy text-body" style={{ color: on ? '#FFFFFF' : '#2B2350' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Khung quảng cáo (dải màu cam, chữ tiêu đề trên hoạ tiết) hoặc tờ rơi (khung chấm xanh, nền nhạt) bọc câu hỏi.
 */
function FrameBlock({ kind, headline }: { kind: 'advert' | 'flyer'; headline: string }) {
  const advert = kind === 'advert';
  return (
    <View
      className="mt-4 overflow-hidden rounded-[22px]"
      style={{
        borderWidth: advert ? 0 : 2,
        borderStyle: advert ? 'solid' : 'dashed',
        borderColor: '#38BDF8',
        backgroundColor: advert ? '#FFF7ED' : '#F0F9FF',
      }}
    >
      <View style={{ height: 70 }}>
        <TileArt
          seed={headline}
          tone={advert ? ['#FDBA74', '#EA580C'] : ['#7DD3FC', '#0369A1']}
          height={70}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', borderRadius: 0 }}
        />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18 }}>
          <View style={{ alignSelf: 'flex-start', borderRadius: 12, backgroundColor: 'rgba(20,10,40,0.35)', paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text className="font-heavy text-sectionTitle" style={{ color: '#FFFFFF' }}>
              {headline}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Nhãn dạng câu bằng tiếng Anh (bản tiếng Việt: `THPT_KIND_LABEL` trong services). */
const KIND_EN: Record<string, string> = {
  complete: 'Fill the gap',
  closest: 'Closest meaning',
  opposite: 'Opposite meaning',
  definition: 'Matches the definition',
  advert: 'Advertisement',
  flyer: 'Flyer',
};
const EMPTY_STAGES = {};

/**
 * QUIZ ÔN TẬP cả bộ: trắc nghiệm A/B/C/D kiểu đề tiếng Anh THPT
 * (`services/vocab/thpt-quiz`): điền vào chỗ trống, từ gần nghĩa nhất và từ
 * trái nghĩa với từ gạch chân, xen kẽ. Báo đúng sai từng câu (màn này để ôn,
 * khác màn Kiểm tra chỉ chấm khi nộp). Mỗi câu nâng/hạ mức nhớ của từ nên ba
 * nhóm Đã nhớ / Chưa nhớ / Cần ôn tập ở trang bộ từ chạy theo.
 *
 * `?only=review` chỉ ôn nhóm Cần ôn tập, `?only=new` chỉ từ chưa nhớ.
 */
export default function QuizScreen() {
  const { slug = '', only, mode: modeParam } = useLocalSearchParams<{ slug: string; only?: string; mode?: string }>();
  // Chọn trước khi làm: số câu và dạng đề. Mở bằng ?mode=advert hoặc ?mode=flyer thì chọn sẵn dạng đó.
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState<ThptMode>(modeParam === 'advert' || modeParam === 'flyer' ? modeParam : 'mix');
  const [started, setStarted] = useState(false);
  // Mức độ và cấp độ: số câu được chia đều cho các cấp đã chọn (B2, C1, C2 mặc định).
  const [difficulty, setDifficulty] = useState<ThptDifficulty>('medium');
  const [levels, setLevels] = useState<string[]>(['B2', 'C1', 'C2']);
  const { L, en } = useL();
  const theme = useStoreTheme();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const stages = useTopicStudyStore((s) => s.stages[slug] ?? EMPTY_STAGES);
  const lapses = useTopicStudyStore((s) => s.lapses[slug]);
  const logQuestions = useStudyStore((s) => s.logQuestions);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logVocabRun = useStudyStore((s) => s.logVocabRun);
  const streak = useStreak().current;
  // Thời gian bắt đầu lượt (để ghi phút học khi xong) và chuỗi câu đúng liên tiếp trong lượt.
  const startedAt = useRef(Date.now());
  const logged = useRef(false);
  const [combo, setCombo] = useState(0);
  const [burst, setBurst] = useState<{ key: number; n: number } | null>(null);

  const [seed, setSeed] = useState(() => Date.now() % 100000);
  // Nhóm từ chốt lúc vào màn — đề không co lại giữa chừng khi từ đổi nhóm.
  const reviews = useTopicStudyStore((s) => s.reviews?.[slug]);
  const [frozen] = useState(() => ({ stages, lapses, reviews }));
  const questions = useMemo<ThptQuestion[]>(() => {
    if (!topic) return [];
    const g = groupByStatus(topic.words, frozen.stages, frozen.lapses);
    const dueNow = new Set(dueBySlug({ [slug]: frozen.reviews ?? {} }, todayKey())[slug] ?? []);
    const pool = only === 'due' ? topic.words.filter((w) => dueNow.has(w.word)) : only === 'review' ? g.review : only === 'new' ? g.new : topic.words;
    const rng = seededRng(seed);
    const deckLvls = ['B1', 'B2', 'C1', 'C2'].filter((lv) => topic.words.some((w) => levelOf(w) === lv));
    const chosen = levels.filter((lv) => deckLvls.includes(lv));
    const useLevels = chosen.length > 0 ? chosen : deckLvls;
    // Không có cấp độ (bộ không phải IELTS): dựng đề một lượt như cũ.
    if (useLevels.length === 0) return buildThptQuiz(shuffled(pool, rng), topic.words, rng, mode, difficulty).slice(0, count);
    const base = Math.floor(count / useLevels.length);
    const extra = count % useLevels.length;
    const out: ThptQuestion[] = [];
    useLevels.forEach((lv, i) => {
      const want = base + (i < extra ? 1 : 0);
      const levelPool = pool.filter((w) => levelOf(w) === lv);
      out.push(...buildThptQuiz(shuffled(levelPool, rng), topic.words, rng, mode, difficulty).slice(0, want));
    });
    return shuffled(out, rng);
  }, [topic, only, seed, frozen, mode, count, levels, difficulty]);

  // Hàng câu hỏi của lượt: bắt đầu bằng đề đã sinh, chen thêm câu hỏi lại khi trả lời sai.
  const [queue, setQueue] = useState<ThptQuestion[] | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const retried = useRef(new Set<string>());
  const list = queue ?? questions;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = list[index];
  const done = list.length > 0 && index >= list.length;

  // Xong lượt: ghi phút học vào Hôm nay và lưu lượt vào lịch sử, đúng một lần cho mỗi lượt.
  useEffect(() => {
    if (!done || logged.current) return;
    logged.current = true;
    logStudyTime('review', Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)));
    if (topic) logVocabRun({ deck: slug, title: topic.nameVi || topic.name, correct: score, total: list.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  // Đáp án lộ ra (đúng hay sai) thì đọc luôn từ tiếng Anh của câu một lần.
  useAutoPronounce(picked !== null && q ? q.word.word : null, `${seed}-${index}`);

  const pick = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    const ok = i === q.correctIndex;
    if (ok) setScore((n) => n + 1);
    // Chuỗi đúng liên tiếp: mỗi mốc STREAK_STEP câu thì bật một đợt tia lửa.
    const next = ok ? combo + 1 : 0;
    setCombo(next);
    if (ok && next % STREAK_STEP === 0) setBurst({ key: Date.now(), n: next });
    const st = useTopicStudyStore.getState();
    st.setStage(slug, q.word.word, stageAfterQuiz(st.stages[slug]?.[q.word.word], ok));
    if (!ok) st.addLapse(slug, q.word.word);
    st.review(slug, q.word.word, ok);
    if (!ok) {
      setWrong((w) => (w.includes(q.word.word) ? w : [...w, q.word.word]));
      // Hỏi lại từ sai SAU 3 câu, bằng một dạng câu khác (mỗi từ một lần trong lượt).
      if (topic && !retried.current.has(q.word.word)) {
        retried.current.add(q.word.word);
        const again = buildThptQuiz([q.word], topic.words, seededRng(seed + index + 1), mode)[0];
        if (again) setQueue((cur) => {
          const list = [...(cur ?? questions)];
          list.splice(Math.min(list.length, index + 4), 0, { ...again, retry: true } as ThptQuestion);
          return list;
        });
      }
    }
    useGameStore.getState().answer(ok, 'vocab', { key: `quiz:${slug}:${q.word.word}:${q.kind}` });
  };
  const next = () => {
    if (picked === null) return;
    logQuestions(1);
    setPicked(null);
    setIndex((n) => n + 1);
  };
  /** Làm lại riêng các từ sai của lượt vừa xong. */
  const redoWrong = () => {
    if (!topic) return;
    const words = topic.words.filter((w) => wrong.includes(w.word));
    const rng = seededRng(seed + 999);
    setQueue(buildThptQuiz(shuffled(words, rng), topic.words, rng, mode).slice(0, count));
    setWrong([]);
    retried.current = new Set();
    setIndex(0);
    setPicked(null);
    setScore(0);
  };
  const restart = () => {
    setStarted(false);
    setQueue(null);
    setWrong([]);
    retried.current = new Set();
    setSeed((s) => s + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  useHotkeys((e) => {
    const n = LETTERS.indexOf(e.key.toUpperCase() as (typeof LETTERS)[number]);
    const d = Number(e.key);
    if (picked === null && (n >= 0 || (d >= 1 && d <= 4))) pick(n >= 0 ? n : d - 1);
    else if (picked !== null && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) {
      e.preventDefault();
      next();
    }
  });

  const back = `/vocabulary/topic/${slug}`;

  if (!started && topic) {
    const deckLvls = ['B1', 'B2', 'C1', 'C2'].filter((lv) => topic.words.some((w) => levelOf(w) === lv));
    const activeLevels = levels.filter((lv) => deckLvls.includes(lv));
    const useLevels = activeLevels.length > 0 ? activeLevels : deckLvls;
    const available =
      useLevels.length > 0
        ? useLevels.reduce(
            (sum, lv) => sum + buildThptQuiz(topic.words.filter((w) => levelOf(w) === lv), topic.words, seededRng(1), mode, difficulty).length,
            0,
          )
        : buildThptQuiz(topic.words, topic.words, seededRng(1), mode, difficulty).length;
    const formats: { key: ThptMode; label: string; labelEn: string; note: string; noteEn: string; icon: IconName; tone: string }[] = [
      { key: 'mix', label: 'Trắc nghiệm THPT', labelEn: 'THPT multiple choice', note: 'Điền từ, gần nghĩa, trái nghĩa', noteEn: 'Fill the gap, closest, opposite', icon: 'clipboard', tone: '#E0533D' },
      { key: 'advert', label: 'Quảng cáo', labelEn: 'Advertisement', note: 'Điền từ vào đoạn quảng cáo', noteEn: 'Fill the word into an advert', icon: 'sparkle', tone: '#EA580C' },
      { key: 'flyer', label: 'Tờ rơi', labelEn: 'Flyer', note: 'Điền từ vào tờ rơi thông báo', noteEn: 'Fill the word into a flyer', icon: 'mail', tone: '#0369A1' },
    ];
    const sizes = [10, 20, 30, 40, 50];
    const shown = Math.min(count, available);
    return (
      <Screen>
        <View style={{ backgroundColor: 'rgba(248,246,253,0.97)', borderRadius: 28, padding: 16, gap: 4 }}>
        <Button className="mb-3 self-start" label={L('Quay lại', 'Back')} variant="ghost" size="sm" iconLeft="chevron-left" onPress={() => router.back()} />

        <HeroShell radius={26} style={{ padding: 22 }}>
          <Text className="font-strong text-label" style={{ color: 'rgba(27,17,64,0.75)', letterSpacing: 1.4 }}>
            {L('TRẮC NGHIỆM ABCD', 'ABCD QUIZ')}
          </Text>
          <Text className="mt-1 font-heavy text-pageTitle" style={{ color: '#1B1140' }}>
            {L('Chọn đề của bạn', 'Set up your quiz')}
          </Text>
          <Text className="font-sans text-body" style={{ color: 'rgba(27,17,64,0.85)' }}>
            {L(`Bộ này làm được ${available} câu.`, `This set can make ${available} questions.`)}
          </Text>
        </HeroShell>

        <Text className="mt-6 font-heavy text-sectionTitle text-ink">{L('Dạng đề', 'Format')}</Text>
        <View className="mt-3">
          <Grid columns={3} tabletColumns={3} mobileColumns={1} gap={12}>
            {formats.map((f) => {
              const on = mode === f.key;
              return (
                <ToneTile
                  key={f.key}
                  seed={'fmt-' + f.key}
                  tone={f.tone}
                  icon={f.icon}
                  title={en ? f.labelEn : f.label}
                  sub={en ? f.noteEn : f.note}
                  chip={on ? (en ? 'Selected' : 'Đang chọn') : undefined}
                  minHeight={180}
                  style={on ? { borderWidth: 3, borderColor: '#FFFFFF' } : { opacity: 0.6 }}
                  onPress={() => setMode(f.key)}
                />
              );
            })}
          </Grid>
        </View>

        <Text className="mt-6 font-heavy text-sectionTitle text-ink">{L('Mức độ', 'Difficulty')}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {(
            [
              { key: 'easy', vi: 'Dễ · nhận biết', en: 'Easy · recognise' },
              { key: 'medium', vi: 'Vừa · thông hiểu', en: 'Medium · understand' },
              { key: 'hard', vi: 'Khó · vận dụng', en: 'Hard · apply' },
            ] as const
          ).map((d) => (
            <Pick key={d.key} label={en ? d.en : d.vi} on={difficulty === d.key} onPress={() => setDifficulty(d.key)} />
          ))}
        </View>

        <Text className="mt-6 font-heavy text-sectionTitle text-ink">{L('Cấp độ (chia đều số câu)', 'Levels (questions split evenly)')}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {deckLvls.length === 0 ? (
            <Text className="font-sans text-label text-muted">{L('Bộ này không chia cấp độ.', 'This set has no levels.')}</Text>
          ) : (
            deckLvls.map((lv) => (
              <Pick
                key={lv}
                label={lv}
                on={useLevels.includes(lv)}
                onPress={() => setLevels((prev) => (prev.includes(lv) ? prev.filter((x) => x !== lv) : [...prev, lv]))}
              />
            ))
          )}
        </View>

        <Text className="mt-6 font-heavy text-sectionTitle text-ink">{L('Số câu', 'Questions')}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {sizes.map((n) => (
            <Pick key={n} label={`${n}`} on={count === n} onPress={() => setCount(n)} />
          ))}
        </View>

        <View className="mt-6 rounded-[20px] p-4" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAE4F8' }}>
          <Text className="font-heavy text-body text-ink">{L('Hiểu đề THPT', 'About the exam')}</Text>
          <Text className="mt-2 font-sans text-label text-muted">
            {L(
              '• Đề THPT gần đây khoảng 40 câu trong 50 phút. Từ vựng thường nằm trong bài đọc quảng cáo, thông báo, thư.',
              '• Recent THPT papers have about 40 questions in 50 minutes. Vocabulary often sits inside ads, notices and letters.',
            )}
          </Text>
          <Text className="mt-1 font-sans text-label text-muted">
            {L(
              '• Theo tổng hợp, khoảng 22,5% câu nhận biết, 37,5% thông hiểu, 40% vận dụng. Đây không phải đề chính thức của Bộ.',
              '• Roughly 22.5% recognise, 37.5% understand, 40% apply, per secondary summaries. Not an official Ministry paper.',
            )}
          </Text>
          <Text className="mt-1 font-sans text-label text-muted">
            {L(
              '• Câu trái nghĩa thường khó hơn câu đồng nghĩa, nên mức Khó đưa trái nghĩa vào.',
              '• Antonym items tend to be harder than synonym items, so Hard mode uses antonyms.',
            )}
          </Text>
        </View>

        {count > available ? (
          <Text className="mt-3 font-sans text-label text-ink">
            {L(`Bộ chỉ có ${available} câu, đề sẽ làm ${available} câu.`, `The set has ${available} questions, so the quiz will have ${available}.`)}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={shown === 0}
          onPress={() => setStarted(true)}
          style={({ pressed }: { pressed: boolean }) => ({
            marginTop: 24,
            height: 54,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: shown === 0 ? '#CBD5E1' : '#1B1140',
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text className="font-strong text-body" style={{ color: '#FFFFFF' }}>
            {L(`Bắt đầu ${shown} câu`, `Start ${shown} questions`)}
          </Text>
          <Icon name="arrow-right" size={18} color="#E23E8A" strokeWidth={2.2} />
        </Pressable>
        </View>
      </Screen>
    );
  }

  if (!topic) return <StudyFrame backHref="/vocabulary/quiz" title={L('Trắc nghiệm THPT', 'THPT multiple choice')}>{null}</StudyFrame>;

  if (list.length === 0) {
    return (
      <StudyFrame backHref={back} title={L('Trắc nghiệm THPT', 'THPT multiple choice')}>
        <StudyCard>
          <Text className="font-heavy text-sectionTitle text-ink">{L('Không còn từ nào trong nhóm này', 'No words left in this group')}</Text>
          <Text className="mt-1 font-sans text-body text-muted">{L('Chọn ôn cả bộ để làm tiếp.', 'Review the whole set to keep going.')}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  if (done) {
    const pct = Math.round((score / list.length) * 100);
    return (
      <StudyFrame backHref={back} title={L('Trắc nghiệm THPT', 'THPT multiple choice')}>
        <StudyCard>
          {pct >= 80 ? <Confetti seed={`quiz-${seed}`} /> : null}
          <Text className="font-semi text-label text-muted">{L('Xong lượt Quiz', 'Quiz complete')}</Text>
          {streak > 0 ? (
            <Text className="mt-1 font-strong text-label" style={{ color: theme.warn }}>
              {L(`🔥 Chuỗi ${streak} ngày`, `🔥 ${streak}-day streak`)}
            </Text>
          ) : null}
          <Text className="mt-2 font-heavy text-hero text-ink">
            {score}/{list.length}
          </Text>
          <Text className="mt-1 font-sans text-bodyLg text-muted">{L(`Đúng ${pct}%`, `${pct}% correct`)}</Text>
          <Text className="mt-3 font-sans text-body text-muted">
            {L(
              '📅 Từ đúng sẽ hẹn ôn lại sau 1 → 2 → 4 → 7 ngày; từ sai hẹn ôn lại ngày mai.',
              '📅 Correct words come back after 1 → 2 → 4 → 7 days; missed words come back tomorrow.',
            )}
          </Text>
          <View className="mt-5 gap-2">
            {wrong.length > 0 ? <PrimaryButton label={L(`🔁 Làm lại ${wrong.length} từ sai`, `🔁 Redo ${wrong.length} missed words`)} onPress={redoWrong} /> : null}
            <PrimaryButton label={L('Làm đề khác', 'New quiz')} onPress={restart} />
          </View>
        </StudyCard>
      </StudyFrame>
    );
  }

  const cur = q!;
  const revealed = picked !== null;
  const blank = cur.kind === 'complete' || cur.kind === 'advert' || cur.kind === 'flyer';
  return (
    <StudyFrame
      backHref={back}
      title={L('Trắc nghiệm THPT', 'THPT multiple choice')}
      battle
      progress={list.map((_, i) => (i < index || (i === index && revealed) ? 1 : 0))}
      footer={L(
        `Câu ${index + 1}/${list.length} · đúng ${score} · phím A–D chọn, Enter sang câu`,
        `Question ${index + 1}/${list.length} · ${score} correct · keys A–D to choose, Enter for next`,
      )}
    >
      <CrossFade swapKey={`${seed}-${index}`}>
        <StudyCard>
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-strong text-label" style={{ color: theme.warn }}>
              Question {index + 1}
            </Text>
            <View className="rounded-pill bg-white/80 px-2.5 py-0.5">
              <Text className="font-semi text-label text-muted">{en ? (KIND_EN[cur.kind] ?? THPT_KIND_LABEL[cur.kind]) : THPT_KIND_LABEL[cur.kind]}</Text>
            </View>
            <StreakBadge n={combo} />
            {burst ? <FlameBurst burstKey={burst.key} n={burst.n} /> : null}
          </View>

          {cur.frame && (cur.kind === 'advert' || cur.kind === 'flyer') ? <FrameBlock kind={cur.kind} headline={cur.frame.headline} /> : null}

          {cur.kind === 'definition' ? (
            <Text className="mt-4 font-semi text-sectionTitle text-ink">“{cur.focus}”</Text>
          ) : (
            <Text className="mt-4 font-semi text-sectionTitle text-ink" style={{ lineHeight: 36 }}>
              {cur.before}
              {blank ? (
                <Text className="font-heavy" style={{ color: revealed ? theme.good : theme.muted }}>
                  {revealed ? cur.focus : '________'}
                </Text>
              ) : (
                <Text className="font-heavy" style={{ textDecorationLine: 'underline', color: theme.ink }}>
                  {cur.focus}
                </Text>
              )}
              {cur.after}
            </Text>
          )}

          {cur.frame ? (
            <Text className="mt-4 font-strong text-body" style={{ color: cur.kind === 'advert' ? '#C2410C' : '#0369A1' }}>
              {cur.frame.footer}
            </Text>
          ) : null}

          <View className="mt-5">
            <ChoiceGrid options={cur.options} picked={picked} correctIndex={cur.correctIndex} onPick={pick} labels={LETTERS} />
          </View>

          {revealed ? (
            <FeedbackPanel
              ok={picked === cur.correctIndex}
              word={cur.word}
              onNext={next}
              nextLabel={index + 1 < list.length ? L('Câu tiếp', 'Next question') : L('Xem kết quả', 'See results')}
            />
          ) : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
