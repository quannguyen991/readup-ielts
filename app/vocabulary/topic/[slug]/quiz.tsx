import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ChoiceGrid, PrimaryButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { useDeckVisit } from '@/components/vocab/study/useDeckVisit';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { groupByStatus, stageAfterQuiz } from '@/services/vocab/deck-status';
import { buildThptQuiz, THPT_KIND_LABEL, type ThptQuestion } from '@/services/vocab/thpt-quiz';
import { seededRng, shuffled } from '@/services/vocab/topic-study';
import { useGameStore } from '@/store/useGameStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';

const LETTERS = ['A', 'B', 'C', 'D'] as const;
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
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const stages = useTopicStudyStore((s) => s.stages[slug] ?? EMPTY_STAGES);
  const lapses = useTopicStudyStore((s) => s.lapses[slug]);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  const [seed, setSeed] = useState(() => Date.now() % 100000);
  // Nhóm từ chốt lúc vào màn — đề không co lại giữa chừng khi từ đổi nhóm.
  const [frozen] = useState(() => ({ stages, lapses }));
  const questions = useMemo<ThptQuestion[]>(() => {
    if (!topic) return [];
    const g = groupByStatus(topic.words, frozen.stages, frozen.lapses);
    const pool = only === 'review' ? g.review : only === 'new' ? g.new : topic.words;
    const rng = seededRng(seed);
    return buildThptQuiz(shuffled(pool, rng), topic.words, rng);
  }, [topic, only, seed, frozen]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = questions[index];
  const done = questions.length > 0 && index >= questions.length;

  const pick = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    const ok = i === q.correctIndex;
    if (ok) setScore((n) => n + 1);
    const st = useTopicStudyStore.getState();
    st.setStage(slug, q.word.word, stageAfterQuiz(st.stages[slug]?.[q.word.word], ok));
    if (!ok) st.addLapse(slug, q.word.word);
    useGameStore.getState().answer(ok, 'vocab');
  };
  const next = () => {
    if (picked === null) return;
    logQuestions(1);
    setPicked(null);
    setIndex((n) => n + 1);
  };
  const restart = () => {
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
  if (!topic) return <StudyFrame backHref="/vocabulary/quiz" title="Quiz ôn tập">{null}</StudyFrame>;

  if (questions.length === 0) {
    return (
      <StudyFrame backHref={back} title="Quiz ôn tập">
        <StudyCard>
          <Text className="font-heavy text-sectionTitle text-ink">Không còn từ nào trong nhóm này</Text>
          <Text className="mt-1 font-sans text-body text-muted">Chọn ôn cả bộ để làm tiếp.</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <StudyFrame backHref={back} title="Quiz ôn tập">
        <StudyCard>
          <Text className="font-semi text-label uppercase tracking-[1.4px] text-muted">Xong lượt Quiz</Text>
          <Text className="mt-2 font-heavy text-hero text-ink">
            {score}/{questions.length}
          </Text>
          <Text className="mt-1 font-sans text-bodyLg text-muted">Đúng {pct}%</Text>
          <View className="mt-5">
            <PrimaryButton label="Làm đề khác" onPress={restart} />
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
      title="Quiz ôn tập"
      battle
      progress={questions.map((_, i) => (i < index || (i === index && revealed) ? 1 : 0))}
      footer={`Câu ${index + 1}/${questions.length} · đúng ${score} · phím A–D chọn, Enter sang câu`}
    >
      <CrossFade swapKey={`${seed}-${index}`}>
        <StudyCard>
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-strong text-label uppercase tracking-[1.4px]" style={{ color: '#D97706' }}>
              Question {index + 1}
            </Text>
            <View className="rounded-pill bg-white/80 px-2.5 py-0.5">
              <Text className="font-semi text-label text-muted">{THPT_KIND_LABEL[cur.kind]}</Text>
            </View>
          </View>
          <Text className="mt-2 font-sans text-body italic text-muted">{cur.instruction}</Text>

          {cur.kind === 'definition' ? (
            <Text className="mt-4 font-semi text-sectionTitle text-ink">“{cur.focus}”</Text>
          ) : (
            <Text className="mt-4 font-semi text-sectionTitle text-ink" style={{ lineHeight: 36 }}>
              {cur.before}
              {blank ? (
                <Text className="font-heavy" style={{ color: revealed ? '#16A34A' : '#4F7FE6' }}>
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
              <PrimaryButton label={index + 1 < questions.length ? 'Câu tiếp' : 'Xem kết quả'} onPress={next} />
            </View>
          ) : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
