import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Appear, CrossFade } from '@/components/motion/Motion';
import { ChoiceGrid, GhostButton, PrimaryButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { seededRng } from '@/services/vocab/topic-study';
import {
  buildChapterPractice,
  buildSatPractice,
  SAT_PRACTICE_MIN,
  SAT_QUIZ_TOPICS,
  satQuizLesson,
  type SatQuizItem,
} from '@/services/vocab/sat-quiz';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Bài luyện đề SAT từ vựng: 20–40 câu trong ngữ cảnh, lấy từ mọi bài của một
 * môn. Giống đề thật: không báo đúng sai từng câu, làm hết mới chấm và xem lại
 * các câu sai.
 */
export default function SatPractice() {
  const { subject: subjectParam, lesson: lessonParam } = useLocalSearchParams<{ subject?: string; lesson?: string }>();
  // `?lesson=<chủ điểm>`: đề luyện của đúng chủ điểm vừa học xong. Không có thì là đề tổng hợp theo môn.
  const chapter = lessonParam ? satQuizLesson(lessonParam) : undefined;
  const subject = subjectParam === 'math' ? 'math' : 'verbal';
  const topic = SAT_QUIZ_TOPICS.find((t) => t.subject === subject);
  const { L, en } = useL();

  const [seed, setSeed] = useState(() => Date.now() % 100000);
  const items = useMemo<SatQuizItem[]>(
    () => (chapter ? buildChapterPractice(chapter, seededRng(seed)) : topic ? buildSatPractice(topic.lessons, seededRng(seed)) : []),
    [chapter, topic, seed],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);

  const item = items[index];
  const finished = items.length > 0 && answers.length === items.length && index >= items.length;
  const score = answers.filter((a, i) => a !== null && a === items[i]?.answerIndex).length;

  const choose = (i: number) => {
    if (!item || chosen !== null) return;
    setChosen(i);
  };

  const next = () => {
    if (chosen === null) return;
    setAnswers((a) => [...a, chosen]);
    setChosen(null);
    setIndex((n) => n + 1);
  };

  const restart = () => {
    setSeed(Date.now() % 100000);
    setIndex(0);
    setAnswers([]);
    setChosen(null);
  };

  useHotkeys((e) => {
    if (finished) return;
    if (chosen === null && /^[1-4]$/.test(e.key)) choose(Number(e.key) - 1);
    else if (chosen !== null && e.key === 'Enter') next();
  });

  const title = chapter
    ? `${chapter.title} · ${L('Luyện đề SAT', 'SAT practice')}`
    : subject === 'math'
      ? L('Luyện đề SAT · Math', 'SAT practice · Math')
      : L('Luyện đề SAT · Verbal', 'SAT practice · Verbal');

  if ((!chapter && !topic) || items.length === 0) {
    return (
      <StudyFrame backHref="/vocabulary/sat-quiz" title={title}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">
            {L('Chưa có từ SAT để làm đề.', 'No SAT words yet to build a practice set.')}
          </Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  if (finished) {
    const missed = items.map((it, i) => ({ it, i, picked: answers[i] ?? null })).filter((m) => m.picked !== m.it.answerIndex);
    return (
      <StudyFrame backHref="/vocabulary/sat-quiz" title={title}>
        <Appear>
          <StudyCard>
            <Text className="font-semi text-label text-muted">{L('KẾT QUẢ', 'RESULT')}</Text>
            <Text className="mt-1 font-heavy text-ink" style={{ fontSize: 44, lineHeight: 50 }}>
              {score}
              <Text className="font-sans text-muted" style={{ fontSize: 22 }}>{' '}/ {items.length}</Text>
            </Text>
            <Text className="mt-1 font-sans text-body text-muted">
              {items.length < SAT_PRACTICE_MIN
                ? L(
                    `Bộ này chỉ có ${items.length} câu (cần ${SAT_PRACTICE_MIN} trở lên). Học thêm các bài SAT để có đủ câu.`,
                    `This set has only ${items.length} questions (${SAT_PRACTICE_MIN}+ needed). Study more SAT lessons for a full set.`,
                  )
                : L(`Đề gồm ${items.length} câu.`, `Set of ${items.length} questions.`)}
            </Text>

            {missed.length > 0 ? (
              <View className="mt-5 gap-2">
                <Text className="font-strong text-label text-muted">{L('CÂU SAI', 'MISSED')}</Text>
                {missed.map((m) => (
                  <View key={m.it.id} className="gap-1 rounded-xl px-3 py-2" style={{ backgroundColor: '#FFF1F2' }}>
                    <Text className="font-semi text-body text-ink">{m.it.context ?? m.it.prompt}</Text>
                    <Text className="font-sans text-label text-muted">
                      {L('Đáp án', 'Answer')}: <Text className="font-heavy text-ink">{m.it.options[m.it.answerIndex]}</Text>
                      {' · '}{m.it.word.word} — {m.it.word.meaningVi}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View className="mt-6 flex-row flex-wrap gap-3">
              <PrimaryButton label={L('Làm đề khác', 'New set')} onPress={restart} />
              <GhostButton label={L('Quay lại', 'Back')} onPress={() => router.replace('/vocabulary/sat-quiz' as never)} />
            </View>
          </StudyCard>
        </Appear>
      </StudyFrame>
    );
  }

  if (!item) return null;

  return (
    <StudyFrame
      backHref="/vocabulary/sat-quiz"
      title={title}
      segments={items.map((_, i) => (i < answers.length ? 2 : i === index ? 1 : 0))}
      footer={L(`${items.length} câu · phím 1–4 chọn · Enter sang câu`, `${items.length} questions · keys 1–4 choose · Enter next`)}
    >
      <CrossFade swapKey={item.id}>
        <StudyCard>
          <View className="flex-row items-center justify-between">
            <Text className="font-semi text-label" style={{ color: color.primary }}>
              {L('TRONG NGỮ CẢNH', 'IN CONTEXT')} · SAT
            </Text>
            <Text className="font-mid text-label text-muted">
              {L('Câu', 'Question')} {index + 1}/{items.length}
            </Text>
          </View>
          <Text className="mt-3 font-sans text-ink" style={{ fontSize: 20, lineHeight: 30 }}>
            {item.context ?? item.prompt}
          </Text>
          <Text className="mt-4 font-semi text-label text-muted">{item.prompt}</Text>
          <View className="mt-6">
            <ChoiceGrid options={item.options} picked={chosen} correctIndex={-1} onPick={choose} />
          </View>
          {chosen !== null ? (
            <View className="mt-5 flex-row justify-end">
              <PrimaryButton label={index + 1 >= items.length ? L('Nộp bài', 'Submit') : L('Câu tiếp', 'Next')} onPress={next} />
            </View>
          ) : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
