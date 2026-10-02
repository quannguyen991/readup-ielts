import React, { useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ChoiceGrid, PrimaryButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { useDeckVisit } from '@/components/vocab/study/useDeckVisit';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { groupByStatus, stageAfterQuiz } from '@/services/vocab/deck-status';
import { buildThptQuiz, THPT_KIND_LABEL, type ThptQuestion } from '@/services/vocab/thpt-quiz';
import { seededRng, shuffled } from '@/services/vocab/topic-study';
import { dueBySlug } from '@/services/vocab/review-schedule';
import { todayKey } from '@/store/persist';
import { useGameStore } from '@/store/useGameStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useL } from '@/i18n/useL';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

/** Nhãn dạng câu bằng tiếng Anh (bản tiếng Việt: `THPT_KIND_LABEL` trong services). */
const KIND_EN: Record<string, string> = {
  complete: 'Fill the gap',
  closest: 'Closest meaning',
  opposite: 'Opposite meaning',
  definition: 'Matches the definition',
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
  const { slug = '', only } = useLocalSearchParams<{ slug: string; only?: string }>();
  const { L, en } = useL();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const stages = useTopicStudyStore((s) => s.stages[slug] ?? EMPTY_STAGES);
  const lapses = useTopicStudyStore((s) => s.lapses[slug]);
  const logQuestions = useStudyStore((s) => s.logQuestions);

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
    return buildThptQuiz(shuffled(pool, rng), topic.words, rng);
  }, [topic, only, seed, frozen]);

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

  const pick = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    const ok = i === q.correctIndex;
    if (ok) setScore((n) => n + 1);
    const st = useTopicStudyStore.getState();
    st.setStage(slug, q.word.word, stageAfterQuiz(st.stages[slug]?.[q.word.word], ok));
    if (!ok) st.addLapse(slug, q.word.word);
    st.review(slug, q.word.word, ok);
    if (!ok) {
      setWrong((w) => (w.includes(q.word.word) ? w : [...w, q.word.word]));
      // Hỏi lại từ sai SAU 3 câu, bằng một dạng câu khác (mỗi từ một lần trong lượt).
      if (topic && !retried.current.has(q.word.word)) {
        retried.current.add(q.word.word);
        const again = buildThptQuiz([q.word], topic.words, seededRng(seed + index + 1))[0];
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
    setQueue(buildThptQuiz(shuffled(words, rng), topic.words, rng));
    setWrong([]);
    retried.current = new Set();
    setIndex(0);
    setPicked(null);
    setScore(0);
  };
  const restart = () => {
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
  if (!topic) return <StudyFrame backHref="/vocabulary/quiz" title={L('Quiz ôn tập', 'Review quiz')}>{null}</StudyFrame>;

  if (list.length === 0) {
    return (
      <StudyFrame backHref={back} title={L('Quiz ôn tập', 'Review quiz')}>
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
      <StudyFrame backHref={back} title={L('Quiz ôn tập', 'Review quiz')}>
        <StudyCard>
          <Text className="font-semi text-label text-muted">{L('Xong lượt Quiz', 'Quiz complete')}</Text>
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
  const blank = cur.kind === 'complete';
  return (
    <StudyFrame
      backHref={back}
      title={L('Quiz ôn tập', 'Review quiz')}
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
            <Text className="font-strong text-label" style={{ color: '#D97706' }}>
              Question {index + 1}
            </Text>
            <View className="rounded-pill bg-white/80 px-2.5 py-0.5">
              <Text className="font-semi text-label text-muted">{en ? (KIND_EN[cur.kind] ?? THPT_KIND_LABEL[cur.kind]) : THPT_KIND_LABEL[cur.kind]}</Text>
            </View>
          </View>

          {cur.kind === 'definition' ? (
            <Text className="mt-4 font-semi text-sectionTitle text-ink">“{cur.focus}”</Text>
          ) : (
            <Text className="mt-4 font-semi text-sectionTitle text-ink" style={{ lineHeight: 36 }}>
              {cur.before}
              {blank ? (
                <Text className="font-heavy" style={{ color: revealed ? '#16A34A' : '#CFA966' }}>
                  {revealed ? cur.focus : '________'}
                </Text>
              ) : (
                <Text className="font-heavy" style={{ textDecorationLine: 'underline', color: '#1E293B' }}>
                  {cur.focus}
                </Text>
              )}
              {cur.after}
            </Text>
          )}

          <View className="mt-5">
            <ChoiceGrid options={cur.options} picked={picked} correctIndex={cur.correctIndex} onPick={pick} labels={LETTERS} />
          </View>

          {revealed ? (
            <View className="mt-4 rounded-2xl bg-white/85 px-4 py-3">
              <Text className="font-sans text-body text-ink">
                <Text className="font-heavy">{cur.word.word}</Text> ({cur.word.pos}) — {cur.word.meaningVi}
              </Text>
            </View>
          ) : null}

          {revealed ? (
            <View className="mt-4">
              <PrimaryButton label={index + 1 < list.length ? L('Câu tiếp', 'Next question') : L('Xem kết quả', 'See results')} onPress={next} />
            </View>
          ) : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
