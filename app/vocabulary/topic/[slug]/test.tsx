import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useDeckVisit } from '@/components/vocab/study/useDeckVisit';

import { GhostButton, PrimaryButton, SpeakButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { buildQuiz, isAnswered, isQuizCorrect, QUIZ_KIND_LABEL, type QuizAnswer, type QuizQuestion } from '@/services/vocab/quiz';
import { diagnoseTyped } from '@/services/vocab/mistake';
import { seededRng } from '@/services/vocab/topic-study';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { color } from '@/theme/tokens';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';
import { useStoreTheme, useStudyTheme } from '@/components/vocab/study/useStudyTheme';

const LENGTH = 20;

/** Nhãn dạng câu bằng tiếng Anh (bản tiếng Việt: `QUIZ_KIND_LABEL` trong services). */
const KIND_EN: Record<QuizQuestion['kind'], string> = {
  mcq: 'Multiple choice',
  type: 'Type the word',
  cloze: 'Fill the gap',
  tf: 'True or false',
};

/**
 * Kiểm tra cả bộ: 20 câu TRỘN bốn dạng — trắc nghiệm, điền từ, điền vào câu,
 * thẻ Đúng/Sai — xen kẽ, không hai câu cùng dạng liền nhau (`services/vocab/quiz`).
 *
 * KHÔNG báo đúng sai từng câu. Màn Học báo ngay để dạy; màn này thì đo. Báo
 * đúng sai giữa chừng thì từ câu thứ ba người làm bắt đầu đoán theo phản hồi
 * thay vì theo trí nhớ, và điểm cuối không còn nói lên mình nhớ được bao nhiêu.
 */
export default function TestScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  const { L, en } = useL();
  const theme = useStoreTheme();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const logQuestions = useStudyStore((s) => s.logQuestions);
  const logVocabRun = useStudyStore((s) => s.logVocabRun);
  const [seed, setSeed] = useState(() => Date.now() % 100000);

  const questions = useMemo<QuizQuestion[]>(() => (topic ? buildQuiz(topic.words, seededRng(seed), LENGTH) : []), [topic, seed]);
  const [answers, setAnswers] = useState<QuizAnswer[]>(() => Array(LENGTH).fill(null));
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const q = questions[index];
  const setAnswer = (a: QuizAnswer) => setAnswers((list) => list.map((v, k) => (k === index ? a : v)));
  const goNext = () => setIndex((n) => Math.min(questions.length - 1, n + 1));
  // Chọn xong một phương án thì tự sang câu sau; câu gõ thì sang khi bấm Enter.
  const choose = (a: QuizAnswer) => {
    if (submitted || !q) return;
    setAnswer(a);
    if (index < questions.length - 1) setTimeout(goNext, 180);
  };
  const submit = () => {
    setSubmitted(true);
    logQuestions(questions.length);
    logVocabRun({
      deck: slug,
      title: topic?.nameVi ?? topic?.name ?? slug,
      correct: questions.filter((qq, i) => isQuizCorrect(qq, answers[i] ?? null)).length,
      total: questions.length,
    });
    useGameStore
      .getState()
      .awardBatch(questions.filter((qq, i) => isQuizCorrect(qq, answers[i] ?? null)).length, questions.length, 'vocab');
    // Ghi kiểu lỗi của câu gõ sai vào Hồ sơ lỗi (câu chọn sai không gọi được tên lỗi chính tả).
    const log = useTopicStudyStore.getState().logMistake;
    questions.forEach((qq, i) => {
      const a = answers[i] ?? null;
      // Mỗi câu ĐÃ trả lời vào lịch ôn theo ngày (câu bỏ trống không phải bằng chứng).
      if (isAnswered(a)) useTopicStudyStore.getState().practice(slug, qq.word.word, isQuizCorrect(qq, a));
      if (qq.kind === 'type' && typeof a === 'string' && isAnswered(a) && !isQuizCorrect(qq, a)) {
        const why = diagnoseTyped(a, qq.word.word);
        if (why) log(slug, qq.word.word, why.kind);
      }
    });
  };
  const retry = () => {
    setSeed((s) => s + 1);
    setAnswers(Array(LENGTH).fill(null));
    setIndex(0);
    setSubmitted(false);
  };

  useHotkeys((e) => {
    if (submitted || !q) return;
    // Đang gõ trong ô điền từ: Enter do chính ô nhập xử lý (onSubmitEditing),
    // bắt thêm ở đây là nhảy hai câu một lúc; phím số là chữ người học đang gõ.
    if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
    const n = Number(e.key);
    if ((q.kind === 'mcq' || q.kind === 'cloze') && n >= 1 && n <= 4) choose(n - 1);
    if (q.kind === 'tf' && (n === 1 || n === 2)) choose(n === 1);
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
  });

  if (!topic || !q) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title={L('Kiểm tra', 'Test')}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">{L('Không có bộ từ này.', 'Word set not found.')}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const answered = questions.filter((_, i) => isAnswered(answers[i] ?? null)).length;
  const score = questions.filter((qq, i) => isQuizCorrect(qq, answers[i] ?? null)).length;
  const backHref = `/vocabulary/topic/${slug}`;

  if (submitted) {
    const pct = Math.round((score / questions.length) * 100);
    // Điểm theo từng dạng: thấy ngay mình yếu ở nhận ra nghĩa hay ở viết ra từ.
    const byKind = (['mcq', 'type', 'cloze', 'tf'] as const)
      .map((k) => {
        const idx = questions.map((qq, i) => (qq.kind === k ? i : -1)).filter((i) => i >= 0);
        return { k, total: idx.length, ok: idx.filter((i) => isQuizCorrect(questions[i]!, answers[i] ?? null)).length };
      })
      .filter((r) => r.total > 0);
    return (
      <StudyFrame backHref={backHref} title={L('Kết quả kiểm tra', 'Test results')}>
        <CrossFade swapKey={`result-${seed}`}>
          <StudyCard>
            <Text className="font-strong text-label text-primary-600">{(en && (topic.kind === 'topic' || topic.kind === 'notebook') ? topic.name : topic.nameVi)}</Text>
            <Text className="mt-2 font-heavy text-hero text-ink">
              {score}/{questions.length}
            </Text>
            <Text className="font-sans text-bodyLg text-muted">{L(`${pct}% câu đúng`, `${pct}% correct`)}</Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              {byKind.map((r) => (
                <View key={r.k} className="rounded-pill px-3 py-1.5" style={{ backgroundColor: r.ok === r.total ? theme.goodBg : theme.soft }}>
                  <Text className="font-semi text-label text-ink">
                    {en ? KIND_EN[r.k] : QUIZ_KIND_LABEL[r.k]}: {r.ok}/{r.total}
                  </Text>
                </View>
              ))}
            </View>
            <View className="mt-5 gap-2">
              {questions.map((qq, i) =>
                isQuizCorrect(qq, answers[i] ?? null) ? null : <WrongRow key={qq.word.word} q={qq} a={answers[i] ?? null} />,
              )}
              {score === questions.length ? (
                <Text className="font-semi text-bodyLg" style={{ color: theme.good }}>
                  {L('Không sai câu nào.', 'No mistakes at all.')}
                </Text>
              ) : null}
            </View>
            <PrimaryButton label={L('Làm bài khác', 'New test')} onPress={retry} />
            <GhostButton label={L('Về bộ từ', 'Back to word set')} onPress={() => router.replace(backHref as never)} />
          </StudyCard>
        </CrossFade>
      </StudyFrame>
    );
  }

  const a = answers[index] ?? null;
  return (
    <StudyFrame
      backHref={backHref}
      title={L('Kiểm tra', 'Test')}
      footer={L(`Đã trả lời ${answered} / ${questions.length}  •  ← → để chuyển câu`, `Answered ${answered} / ${questions.length}  •  ← → to switch questions`)}
    >
      <View className="mb-4 flex-row flex-wrap justify-center gap-1.5">
        {questions.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setIndex(i)}
            className="h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: i === index ? color.primary : isAnswered(answers[i] ?? null) ? '#F3E6C8' : 'rgba(255,255,255,0.8)' }}
          >
            <Text className="font-semi text-label" style={{ color: i === index ? '#FFFFFF' : color.ink }}>
              {i + 1}
            </Text>
          </Pressable>
        ))}
      </View>
      <CrossFade swapKey={`t-${index}`}>
        <StudyCard>
          <View className="flex-row items-center gap-2">
            <Text className="font-semi text-label text-muted">{L('Câu', 'Question')} {index + 1}</Text>
            <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: theme.soft }}>
              <Text className="font-strong text-label" style={{ color: color.primary }}>
                {en ? KIND_EN[q.kind] : QUIZ_KIND_LABEL[q.kind]}
              </Text>
            </View>
          </View>
          <QuestionBody q={q} a={a} onChoose={choose} onType={setAnswer} onEnter={goNext} />
          <PrimaryButton
            label={
              answered < questions.length
                ? L(`Nộp bài (còn ${questions.length - answered} câu trống)`, `Submit (${questions.length - answered} unanswered)`)
                : L('Nộp bài', 'Submit')
            }
            onPress={submit}
          />
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}

function QuestionBody({
  q,
  a,
  onChoose,
  onType,
  onEnter,
}: {
  q: QuizQuestion;
  a: QuizAnswer;
  onChoose: (a: QuizAnswer) => void;
  onType: (a: string) => void;
  onEnter: () => void;
}) {
  const { L } = useL();
  const theme = useStudyTheme();
  if (q.kind === 'type') {
    return (
      <View>
        <Text className="mt-2 font-heavy text-pageTitle text-ink">{q.word.meaningVi}</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          {[q.word.pos, L(`${q.word.word.length} chữ cái`, `${q.word.word.length} letters`), L(`bắt đầu bằng “${q.word.word[0]}”`, `starts with “${q.word.word[0]}”`)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <TextInput
          value={typeof a === 'string' ? a : ''}
          onChangeText={onType}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={L('Gõ từ tiếng Anh, Enter để sang câu sau…', 'Type the English word, Enter for the next one…')}
          placeholderTextColor={theme.muted}
          onSubmitEditing={onEnter}
          className="mt-6 rounded-2xl px-5 py-4 text-center font-semi text-sectionTitle text-ink"
          style={{ borderWidth: 1.5, borderColor: theme.fieldBorder, backgroundColor: theme.field }}
        />
      </View>
    );
  }
  if (q.kind === 'tf') {
    return (
      <View>
        <Text className="mt-2 font-sans text-body text-muted">{L('Cặp từ – nghĩa này đúng hay sai?', 'Is this word–meaning pair right or wrong?')}</Text>
        <View className="mt-4 items-center rounded-2xl px-5 py-6" style={{ backgroundColor: theme.field, borderWidth: 1, borderColor: theme.optBorder }}>
          <View className="flex-row items-center gap-2">
            <Text className="font-heavy text-pageTitle text-ink">{q.word.word}</Text>
            <SpeakButton text={q.word.word} />
          </View>
          <Text className="mt-2 font-sans text-body text-muted">{L('nghĩa là', 'means')}</Text>
          <Text className="mt-1 text-center font-heavy text-sectionTitle" style={{ color: color.primary }}>
            {q.shownMeaning}
          </Text>
        </View>
        <View className="mt-5 flex-row gap-3">
          {([true, false] as const).map((v, i) => {
            const sel = a === v;
            const tone = v ? theme.good : theme.bad;
            return (
              <Pressable
                key={String(v)}
                onPress={() => onChoose(v)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
                style={{ borderWidth: 1.5, borderColor: sel ? tone : theme.optBorder, backgroundColor: sel ? (v ? theme.goodBg : theme.badBg) : theme.optBg }}
              >
                <Text className="font-strong text-bodyLg" style={{ color: sel ? tone : color.ink }}>
                  {v ? L('Đúng', 'True') : L('Sai', 'False')}
                </Text>
                <Text className="font-sans text-label text-muted">{i + 1}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }
  const options = q.options;
  return (
    <View>
      {q.kind === 'cloze' ? (
        <>
          <Text className="mt-2 font-sans text-body text-muted">{L('Chọn từ điền vào chỗ trống', 'Choose the word for the blank')}</Text>
          <Text className="mt-2 font-semi text-sectionTitle leading-9 text-ink">
            {q.before}
            <Text className="font-strong" style={{ color: theme.muted }}>
              {' _______ '}
            </Text>
            {q.after}
          </Text>
        </>
      ) : (
        <>
          <Text className="mt-2 font-sans text-body text-muted">{q.enToVi ? L('Chọn nghĩa đúng', 'Choose the right meaning') : L('Chọn từ tiếng Anh đúng', 'Choose the right English word')}</Text>
          <Text className="mt-1 font-heavy text-pageTitle text-ink">{q.enToVi ? q.word.word : q.word.meaningVi}</Text>
        </>
      )}
      <View className="mt-6 gap-3">
        {options.map((opt, i) => {
          const sel = a === i;
          return (
            <Pressable
              key={`${i}-${opt}`}
              onPress={() => onChoose(i)}
              className="flex-row items-center gap-3 rounded-2xl px-4 py-4"
              style={{ borderWidth: 1.5, borderColor: sel ? color.primary : theme.optBorder, backgroundColor: sel ? theme.soft : theme.optBg }}
            >
              <View className="h-8 w-8 items-center justify-center rounded-pill" style={{ backgroundColor: sel ? color.primary : theme.optNum }}>
                <Text className="font-strong text-label" style={{ color: sel ? '#FFFFFF' : theme.muted }}>
                  {i + 1}
                </Text>
              </View>
              <Text className="flex-1 font-semi text-bodyLg text-ink">{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Một câu sai trong bảng kết quả: từ, nghĩa, bạn đã trả lời gì, và vì sao sai (câu gõ). */
function WrongRow({ q, a }: { q: QuizQuestion; a: QuizAnswer }) {
  const { L, en } = useL();
  const theme = useStudyTheme();
  let yours: string;
  if (!isAnswered(a)) yours = L('(bỏ trống)', '(left blank)');
  else if (q.kind === 'tf')
    yours = en
      ? `${a ? 'True' : 'False'} — the pair “${q.word.word} = ${q.shownMeaning}” ${q.isTrue ? 'is right' : 'is wrong'}`
      : `${a ? 'Đúng' : 'Sai'} — cặp “${q.word.word} = ${q.shownMeaning}” ${q.isTrue ? 'là đúng' : 'là sai'}`;
  else if (q.kind === 'type') yours = String(a);
  else yours = q.options[a as number] ?? '';
  const why = q.kind === 'type' && typeof a === 'string' && isAnswered(a) ? diagnoseTyped(a, q.word.word) : null;
  return (
    <View className="rounded-2xl px-4 py-3" style={{ backgroundColor: theme.badBg }}>
      <Text className="font-strong text-body text-ink">
        {q.word.word} <Text className="font-sans text-muted">· {q.word.meaningVi}</Text>
      </Text>
      <Text className="mt-0.5 font-sans text-label" style={{ color: theme.bad }}>
        {en ? KIND_EN[q.kind] : QUIZ_KIND_LABEL[q.kind]} · {L('Bạn trả lời:', 'Your answer:')} {yours}
      </Text>
      {why ? (
        <Text className="mt-0.5 font-sans text-label" style={{ color: theme.warn }}>
          {why.title}: {why.detail}
        </Text>
      ) : null}
    </View>
  );
}
