import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ChoiceGrid, FeedbackPanel, PrimaryButton, SpeakButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { useDeckVisit } from '@/components/vocab/study/useDeckVisit';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { buildEaQuestion, speechLang, type EaQuestion } from '@/services/vocab/east-asian-practice';
import { seededRng, shuffled } from '@/services/vocab/topic-study';
import { pronounce } from '@/services/audio/pronounce';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';

/**
 * Trắc nghiệm ABCD và Luyện nghe cho bộ tiếng Trung / tiếng Nhật.
 * `?mode=listen` chỉ ra đề nghe (nghe từ hoặc nghe câu rồi chọn nghĩa); mặc định là đề trộn:
 * chọn nghĩa, chọn từ theo nghĩa, điền từ vào câu ví dụ.
 */
const COUNT = 20;

export default function EastAsianQuizScreen() {
  const { slug = '', mode } = useLocalSearchParams<{ slug: string; mode?: string }>();
  const listenMode = mode === 'listen';
  const { L } = useL();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const logQuestions = useStudyStore((s) => s.logQuestions);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const questions = useMemo<EaQuestion[]>(() => {
    if (!topic) return [];
    const rng = seededRng(seed);
    const kinds: EaQuestion['kind'][] = listenMode ? ['listen', 'listenSentence'] : ['meaning', 'word', 'cloze'];
    const withMeaning = topic.words.filter((w) => w.meaningVi.trim());
    return shuffled(withMeaning, rng).slice(0, COUNT).map((w) => buildEaQuestion(w, withMeaning, rng, kinds));
  }, [topic, seed, listenMode]);

  const q = questions[index];
  const lang = q ? speechLang(q.word) : 'en-US';
  const ttsLanguage = lang === 'ja-JP' ? 'ja-JP' : lang === 'zh-CN' ? 'zh-CN' : undefined;

  // Đề nghe: tự đọc khi sang câu mới.
  useEffect(() => {
    if (q?.audio) pronounce(q.audio, { rate: 0.85, language: ttsLanguage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, seed]);

  const pick = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    const ok = i === q.correct;
    if (ok) setScore((s) => s + 1);
    logQuestions(1);
    useTopicStudyStore.getState().practice(slug, q.word.word, ok);
    useGameStore.getState().answer(ok, 'vocab', { key: `ea:${slug}:${q.word.word}:${q.kind}` });
  };
  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };
  const again = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setIndex(0);
    setScore(0);
    setPicked(null);
  };

  useHotkeys((e) => {
    if (!q) return;
    if (picked === null && /^[1-4]$/.test(e.key)) pick(Number(e.key) - 1);
    else if (picked !== null && e.key === 'Enter') {
      e.preventDefault();
      next();
    }
  });

  const title = listenMode ? L('Luyện nghe', 'Listening') : L('Trắc nghiệm ABCD', 'ABCD quiz');
  if (!topic || questions.length === 0) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title={title}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">{L('Không có bộ từ này.', 'Word set not found.')}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const done = index >= questions.length;
  return (
    <StudyFrame
      backHref={`/vocabulary/topic/${slug}`}
      title={title}
      footer={done ? L(`Xong · ${score}/${questions.length}`, `Done · ${score}/${questions.length}`) : L(`Câu ${index + 1} / ${questions.length}  •  Đúng ${score}`, `Question ${index + 1} / ${questions.length}  •  Right ${score}`)}
      battle
    >
      {done ? (
        <StudyCard>
          <Text className="text-center font-heavy text-pageTitle text-ink">{score} / {questions.length}</Text>
          <Text className="mt-2 text-center font-sans text-bodyLg text-muted">
            {score === questions.length ? L('Tuyệt đối!', 'Perfect!') : score >= questions.length * 0.7 ? L('Khá tốt, thử lượt nữa để chắc hơn.', 'Good — another round to lock it in.') : L('Còn nhiều từ cần ôn, thử lại nhé.', 'Plenty to review — try again.')}
          </Text>
          <PrimaryButton label={L('Làm lượt mới', 'New round')} onPress={again} />
        </StudyCard>
      ) : q ? (
        <CrossFade swapKey={`q-${index}-${seed}`}>
          <StudyCard>
            <Text className="text-center font-semi text-label text-muted">{q.prompt}</Text>
            <View className="mt-4 items-center">
              {q.audio ? (
                <SpeakButton text={q.audio} rate={0.85} size={34} language={q.word.language} />
              ) : (
                <Text className="text-center font-heavy text-pageTitle text-ink" style={q.kind === 'meaning' ? { fontSize: 56, lineHeight: 68 } : q.kind === 'cloze' ? { fontSize: 28, lineHeight: 42 } : undefined}>
                  {q.stem}
                </Text>
              )}
            </View>
            {q.kind === 'cloze' && q.word.exampleVi ? <Text className="mt-2 text-center font-sans text-body text-muted">{q.word.exampleVi}</Text> : null}
            <View className="mt-5">
              <ChoiceGrid options={q.options} picked={picked} correctIndex={q.correct} onPick={pick} labels={['A', 'B', 'C', 'D']} />
            </View>
            {picked !== null ? (
              <FeedbackPanel ok={picked === q.correct} word={q.word} onNext={next} nextLabel={index + 1 >= questions.length ? L('Xem điểm', 'See score') : undefined} />
            ) : null}
          </StudyCard>
        </CrossFade>
      ) : null}
    </StudyFrame>
  );
}
