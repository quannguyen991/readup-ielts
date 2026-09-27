import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ChoiceGrid, PrimaryButton, SpeakButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { useDeckVisit } from '@/components/vocab/study/useDeckVisit';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { groupByStatus, stageAfterQuiz } from '@/services/vocab/deck-status';
import { makeChoices, seededRng, shuffled, type StudyWord } from '@/services/vocab/topic-study';
import { useGameStore } from '@/store/useGameStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { color } from '@/theme/tokens';

type Dir = 'viToEn' | 'enToVi';
const EMPTY_STAGES = {};

/**
 * QUIZ ÔN TẬP cả bộ: trắc nghiệm bốn đáp án, chạy lần lượt mọi từ, đổi chiều
 * Việt → Anh / Anh → Việt ngay trên đầu màn. Báo đúng sai từng câu (màn này để
 * ôn, khác màn Kiểm tra chỉ chấm khi nộp). Mỗi câu nâng/hạ mức nhớ của từ nên
 * ba nhóm Đã nhớ / Cần ôn tập / Chưa nhớ ở trang bộ từ chạy theo.
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

  const [dir, setDir] = useState<Dir>('viToEn');
  const [seed, setSeed] = useState(() => Date.now() % 100000);
  // Danh sách câu chốt lúc vào màn (và lúc làm lại) — không co lại giữa chừng khi từ đổi nhóm.
  const [frozen] = useState(() => ({ stages, lapses }));
  const list = useMemo<StudyWord[]>(() => {
    if (!topic) return [];
    const g = groupByStatus(topic.words, frozen.stages, frozen.lapses);
    const pool = only === 'review' ? g.review : only === 'new' ? g.new : topic.words;
    return shuffled(pool, seededRng(seed));
  }, [topic, only, seed, frozen]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const word = list[index];
  const done = list.length > 0 && index >= list.length;

  const q = useMemo(() => {
    if (!word || !topic) return null;
    const show = (w: StudyWord) => (dir === 'viToEn' ? w.word : w.meaningVi);
    return makeChoices(word, topic.words.filter((w) => w.word !== word.word), show, seededRng(seed + index * 31));
  }, [word, topic, dir, seed, index]);

  const pick = (i: number) => {
    if (!word || !q || picked !== null) return;
    setPicked(i);
    const ok = i === q.correctIndex;
    if (ok) setScore((n) => n + 1);
    const st = useTopicStudyStore.getState();
    st.setStage(slug, word.word, stageAfterQuiz(st.stages[slug]?.[word.word], ok));
    if (!ok) st.addLapse(slug, word.word);
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
    const n = Number(e.key);
    if (picked === null && n >= 1 && n <= 4) pick(n - 1);
    else if (picked !== null && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) {
      e.preventDefault();
      next();
    }
  });

  const back = `/vocabulary/topic/${slug}`;
  if (!topic) return <StudyFrame backHref="/vocabulary/quiz" title="Quiz">{null}</StudyFrame>;

  const toggle = (
    <View className="flex-row rounded-pill bg-white/85 p-1">
      {(['viToEn', 'enToVi'] as const).map((d) => (
        <Pressable
          key={d}
          accessibilityRole="button"
          accessibilityState={{ selected: dir === d }}
          onPress={() => setDir(d)}
          className="rounded-pill px-3 py-1.5"
          style={{ backgroundColor: dir === d ? color.primary : 'transparent' }}
        >
          <Text className="font-strong text-label" style={{ color: dir === d ? '#FFFFFF' : color.ink }}>
            {d === 'viToEn' ? 'Vi → En' : 'En → Vi'}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  if (list.length === 0) {
    return (
      <StudyFrame backHref={back} title="Quiz" right={toggle}>
        <StudyCard>
          <Text className="font-heavy text-sectionTitle text-ink">Không còn từ nào trong nhóm này</Text>
          <Text className="mt-1 font-sans text-body text-muted">Chọn ôn cả bộ để làm tiếp.</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  if (done) {
    const pct = Math.round((score / list.length) * 100);
    return (
      <StudyFrame backHref={back} title="Quiz" right={toggle}>
        <StudyCard>
          <Text className="font-semi text-label uppercase tracking-[1.4px] text-muted">Xong lượt Quiz</Text>
          <Text className="mt-2 font-heavy text-hero text-ink">
            {score}/{list.length}
          </Text>
          <Text className="mt-1 font-sans text-bodyLg text-muted">Đúng {pct}%</Text>
          <View className="mt-5 flex-row gap-3">
            <PrimaryButton label="Làm lại" onPress={restart} />
          </View>
        </StudyCard>
      </StudyFrame>
    );
  }

  const prompt = dir === 'viToEn' ? word!.meaningVi : word!.word;
  return (
    <StudyFrame
      backHref={back}
      title="Quiz"
      right={toggle}
      battle
      progress={list.map((_, i) => (i < index ? 1 : i === index && picked !== null ? 1 : 0))}
      footer={`Câu ${index + 1}/${list.length} · đúng ${score} · phím 1–4 chọn, Enter sang câu`}
    >
      <CrossFade swapKey={`${seed}-${index}-${dir}`}>
        <StudyCard>
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-strong text-label uppercase tracking-[1.4px]" style={{ color: '#D97706' }}>
              {dir === 'viToEn' ? 'Chọn từ tiếng Anh đúng' : 'Chọn nghĩa tiếng Việt đúng'}
            </Text>
            {word!.pos ? (
              <View className="rounded-pill bg-white/80 px-2.5 py-0.5">
                <Text className="font-semi text-label text-muted">{word!.pos}</Text>
              </View>
            ) : null}
          </View>
          <View className="mt-3 flex-row items-center gap-3">
            <Text className="flex-1 font-heavy text-pageTitle text-ink">{prompt}</Text>
            {dir === 'enToVi' ? <SpeakButton text={word!.word} /> : null}
          </View>
          <View className="mt-5">
            <ChoiceGrid options={q!.options} picked={picked} correctIndex={q!.correctIndex} onPick={pick} />
          </View>
          {picked !== null ? (
            <View className="mt-5">
              <PrimaryButton label={index + 1 < list.length ? 'Câu tiếp' : 'Xem kết quả'} onPress={next} />
            </View>
          ) : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
