import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Appear, CrossFade } from '@/components/motion/Motion';
import { ChoiceGrid, FeedbackPanel, GhostButton, GREEN, PrimaryButton, RED, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { seededRng } from '@/services/vocab/topic-study';
import {
  buildSatQuiz,
  passed,
  SAT_QUIZ_KIND_LABEL,
  SAT_QUIZ_LEVELS,
  satQuizLesson,
  type SatQuizItem,
  type SatQuizLevel,
} from '@/services/vocab/sat-quiz';
import { useGameStore } from '@/store/useGameStore';
import { useSatQuizStore } from '@/store/useSatQuizStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';

/**
 * Một lượt quiz ôn từ vựng SAT: một chủ đề, một mức (Dễ / Vừa / Khó).
 *
 * Đây là ÔN TẬP nên báo đúng sai ngay từng câu (khác màn Kiểm tra của bộ từ,
 * vốn chỉ chấm lúc nộp): người học cần thấy nghĩa đúng ngay lúc vừa nhầm. Mỗi
 * câu gọi `answer()` của game đúng một lần — câu đúng là một nhát chém.
 */
export default function SatQuizRun() {
  const { slug = '', level: levelParam } = useLocalSearchParams<{ slug: string; level?: string }>();
  const lesson = satQuizLesson(slug);
  const level = (Math.min(3, Math.max(1, Number(levelParam) || 1)) as SatQuizLevel);
  const info = SAT_QUIZ_LEVELS[level - 1]!;
  const [seed, setSeed] = useState(() => Date.now() % 100000);
  const items = useMemo<SatQuizItem[]>(() => (lesson ? buildSatQuiz(lesson, level, seededRng(seed)) : []), [lesson, level, seed]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const record = useSatQuizStore((s) => s.record);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  const item = items[index];
  const finished = items.length > 0 && results.length === items.length && picked === null;

  const pick = (i: number) => {
    if (!item || picked !== null) return;
    const ok = i === item.answerIndex;
    setPicked(i);
    useGameStore.getState().answer(ok, 'vocab');
    setResults((r) => [...r, ok]);
  };

  const next = () => {
    if (picked === null) return;
    if (index + 1 >= items.length) {
      const score = results.filter(Boolean).length;
      record(slug, level, score, items.length);
      logQuestions(items.length);
    } else {
      setIndex((n) => n + 1);
    }
    setPicked(null);
  };

  const restart = (nextLevel: SatQuizLevel = level) => {
    setSeed(Date.now() % 100000);
    setIndex(0);
    setPicked(null);
    setResults([]);
    if (nextLevel !== level) router.setParams({ level: String(nextLevel) });
  };

  useHotkeys((e) => {
    if (finished) return;
    if (picked === null && /^[1-4]$/.test(e.key)) pick(Number(e.key) - 1);
    else if (picked !== null && e.key === 'Enter') next();
  });

  if (!lesson) {
    return (
      <StudyFrame backHref="/vocabulary/sat-quiz" title="Ôn từ vựng SAT">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">Không có chủ đề này.</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  if (finished) {
    const score = results.filter(Boolean).length;
    const ok = passed(score, items.length);
    const missed = items.filter((_, i) => !results[i]);
    return (
      <StudyFrame backHref="/vocabulary/sat-quiz" title={`${lesson.title} · ${info.name}`}>
        <Appear>
          <StudyCard>
            <Text className="font-semi text-label text-muted">KẾT QUẢ · MỨC {info.name.toUpperCase()}</Text>
            <Text className="mt-1 font-heavy text-ink" style={{ fontSize: 44, lineHeight: 50 }}>
              {score}
              <Text className="font-sans text-muted" style={{ fontSize: 22 }}>
                {' '}
                / {items.length}
              </Text>
            </Text>
            <Text className="mt-1 font-semi text-bodyLg" style={{ color: ok ? GREEN : RED }}>
              {ok
                ? level < 3
                  ? `Qua mức ${info.name}. Lên mức ${SAT_QUIZ_LEVELS[level]!.name} được rồi.`
                  : 'Qua cả mức Khó — chủ đề này bạn nắm chắc.'
                : `Cần đúng từ ${Math.ceil(items.length * 0.8)} câu để qua mức này. Ôn lại mấy từ dưới đây rồi làm lại.`}
            </Text>

            {missed.length > 0 ? (
              <View className="mt-5 gap-2">
                <Text className="font-strong text-label text-muted">TỪ CẦN ÔN</Text>
                {missed.map((m) => (
                  <View key={m.id} className="flex-row flex-wrap items-baseline gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: '#FFF1F2' }}>
                    <Text className="font-heavy text-body text-ink">{m.word.word}</Text>
                    <Text className="flex-1 font-sans text-body text-ink">{m.word.meaningVi}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View className="mt-6 flex-row flex-wrap gap-3">
              {ok && level < 3 ? (
                <PrimaryButton label={`Lên mức ${SAT_QUIZ_LEVELS[level]!.name}`} onPress={() => restart((level + 1) as SatQuizLevel)} />
              ) : (
                <PrimaryButton label="Làm lại" onPress={() => restart()} />
              )}
              {ok && level < 3 ? <GhostButton label="Làm lại mức này" onPress={() => restart()} /> : null}
              <GhostButton label="Chủ đề khác" onPress={() => router.replace('/vocabulary/sat-quiz' as never)} />
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
      title={`${lesson.title} · ${info.name}`}
      battle
      segments={items.map((_, i) => (i < results.length ? 2 : i === index ? 1 : 0))}
      footer="Phím 1–4 để chọn · Enter để sang câu"
    >
      <CrossFade swapKey={item.id}>
        <StudyCard>
          <View className="flex-row items-center justify-between">
            <Text className="font-semi text-label" style={{ color: color.primary }}>
              {SAT_QUIZ_KIND_LABEL[item.kind].toUpperCase()}
            </Text>
            <Text className="font-mid text-label text-muted">
              Câu {index + 1}/{items.length}
            </Text>
          </View>

          {item.kind === 'meaning' ? (
            <Text className="mt-3 font-heavy text-ink" style={{ fontSize: 36, lineHeight: 42 }}>
              {item.prompt}
            </Text>
          ) : item.kind === 'cloze' ? (
            <>
              <Text className="mt-2 font-sans text-body text-muted">{item.prompt}</Text>
              <Text className="mt-2 font-semi text-ink" style={{ fontSize: 22, lineHeight: 32 }}>
                {item.context}
              </Text>
            </>
          ) : (
            <Text className="mt-3 font-semi text-ink" style={{ fontSize: 22, lineHeight: 31 }}>
              {item.prompt}
            </Text>
          )}

          <View className="mt-6">
            <ChoiceGrid options={item.options} picked={picked} correctIndex={item.answerIndex} onPick={pick} />
          </View>
        </StudyCard>
      </CrossFade>
      {picked !== null ? <FeedbackPanel ok={picked === item.answerIndex} word={item.word} onNext={next} /> : null}
    </StudyFrame>
  );
}
