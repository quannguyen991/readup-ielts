import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ChoiceGrid, FeedbackPanel, GhostButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { clozeOf, makeChoices, seededRng, shuffled } from '@/services/vocab/topic-study';
import { playCorrectChime } from '@/services/audio/chime';
import { useStudyStore } from '@/store/useStudyStore';

/**
 * Điền từ vào câu ví dụ — biết nghĩa một từ chưa phải là biết DÙNG nó.
 *
 * Câu lấy đúng từ câu ví dụ của bộ từ, khoét đúng dạng chia xuất hiện trong
 * câu ("habitats", "migrated"). Bốn lựa chọn hiện ở DẠNG GỐC của từ, nên người
 * học phải hiểu cả câu để chọn, không so được đuôi từ với chỗ trống.
 */
export default function ClozeScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  const topic = useStudyDeck(slug);
  const logQuestions = useStudyStore((s) => s.logQuestions);
  const [seed] = useState(() => Date.now() % 100000);

  const items = useMemo(() => {
    if (!topic) return [];
    const ok = topic.words.filter((w) => clozeOf(w.example, w.word));
    return shuffled(ok, seededRng(seed));
  }, [topic, seed]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);

  const word = items[index];
  const blank = word ? clozeOf(word.example, word.word) : null;
  const mcq = useMemo(
    () => (word && topic ? makeChoices(word, topic.words, (w) => w.word, seededRng(seed + index * 7)) : null),
    [word, topic, seed, index],
  );

  const pick = (i: number) => {
    if (picked !== null || !mcq) return;
    setPicked(i);
    if (i === mcq.correctIndex) {
      setCorrect((n) => n + 1);
      playCorrectChime();
    }
    logQuestions(1);
  };
  const next = () => {
    setPicked(null);
    setIndex((i) => (i + 1) % Math.max(1, items.length));
  };

  useHotkeys((e) => {
    if (picked !== null) {
      if (e.key === 'Enter') {
        e.preventDefault();
        next();
      }
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= 4) pick(n - 1);
    if (n === 5) pick(-1);
  });

  if (!topic || !word || !blank || !mcq) {
    return (
      <StudyFrame backHref="/vocabulary/topics" title="Điền vào câu">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">Không có câu nào để điền trong bộ này.</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const windowStart = Math.floor(index / 10) * 10;
  const segments = Array.from({ length: Math.min(10, items.length - windowStart) }, (_, i): 0 | 1 | 2 =>
    windowStart + i < index ? 2 : windowStart + i === index ? 1 : 0,
  );
  const revealed = picked !== null;

  return (
    <StudyFrame
      backHref={`/vocabulary/topic/${slug}`}
      title={topic.nameVi}
      segments={segments}
      footer={`Câu ${index + 1} / ${items.length}  •  Đúng ${correct}`}
    >
      <CrossFade swapKey={`c-${index}`}>
        <StudyCard>
          <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">Chọn từ điền vào chỗ trống</Text>
          <Text className="mt-3 font-semi text-sectionTitle leading-9 text-ink">
            {blank.before}
            <Text className="font-strong" style={{ color: revealed ? '#1D4ED8' : '#94A3B8' }}>
              {revealed ? blank.answer : ' _______ '}
            </Text>
            {blank.after}
          </Text>
          <View className="mt-6">
            <ChoiceGrid options={mcq.options} picked={picked} correctIndex={mcq.correctIndex} onPick={pick} />
          </View>
          {!revealed ? <GhostButton label="5 · Tôi không biết" onPress={() => pick(-1)} /> : null}
          {revealed ? <FeedbackPanel ok={picked === mcq.correctIndex} word={word} onNext={next} /> : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
