import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  ChoiceGrid,
  FeedbackPanel,
  GhostButton,
  PrimaryButton,
  SpeakButton,
  StudyCard,
  StudyFrame,
  useHotkeys,
} from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { getVocabTopic } from '@/data/vocab-topics';
import {
  advanceQueue,
  initialQueue,
  isTypedCorrect,
  makeChoices,
  pickRound,
  seededRng,
  type LearnItem,
  type StudyWord,
} from '@/services/vocab/topic-study';
import { masteredCount, useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useStudyStore } from '@/store/useStudyStore';
import { playCorrectChime } from '@/services/audio/chime';

/**
 * Học một bộ từ theo VÒNG 10 TỪ.
 *
 * Mỗi từ qua hai chặng: NHẬN RA (trắc nghiệm, lúc thì Anh → Việt lúc thì
 * Việt → Anh) rồi NHỚ LẠI (chỉ thấy nghĩa, gõ ra từ tiếng Anh). Nhận ra dễ hơn
 * nhớ lại nhiều — làm được trắc nghiệm chưa có nghĩa là viết được từ đó trong
 * bài Writing — nên từ chỉ tính là "đã nhớ" khi qua được chặng gõ.
 *
 * Sai ở chặng nào thì câu đó quay lại sau vài câu khác (`advanceQueue`); "Tôi
 * không biết" tính như sai nhưng hiện ngay đáp án.
 */
export default function LearnScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  const topic = getVocabTopic(slug);
  const stages = useTopicStudyStore((s) => s.stages[slug]);
  const setStage = useTopicStudyStore((s) => s.setStage);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  // Chốt từ của vòng một lần lúc mở màn — chấm xong câu nào cũng không được
  // làm danh sách vòng nhảy lại.
  const freshRound = () =>
    topic ? pickRound(topic.words, (w) => useTopicStudyStore.getState().stages[slug]?.[w] ?? 0) : [];
  const [round, setRound] = useState<StudyWord[]>(freshRound);
  const [queue, setQueue] = useState<LearnItem[]>(() => initialQueue(round));
  const [asked, setAsked] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [seed] = useState(() => Date.now() % 100000);
  // Đếm số câu đã qua — khoá cho hiệu ứng chuyển câu, chỉ đổi khi sang câu mới.
  const [step, setStep] = useState(0);

  const head = queue[0];
  const word = round.find((w) => w.word === head?.word);
  const pool = useMemo(() => topic?.words ?? [], [topic]);

  // Chiều trắc nghiệm đổi theo từ và theo số câu đã hỏi, để một từ không luôn
  // bị hỏi cùng một chiều.
  // Tính theo `step` (chỉ tăng khi sang câu mới), KHÔNG theo `asked`: `asked`
  // tăng ngay lúc chấm, làm câu hỏi đổi chiều và đổi lựa chọn ngay dưới tay.
  const enToVi = head ? (head.word.length + step) % 2 === 0 : true;
  const mcq = useMemo(() => {
    if (!word || head?.kind !== 'recognize') return null;
    return makeChoices(word, pool, (w) => (enToVi ? w.meaningVi : w.word), seededRng(seed + step));
  }, [word, head?.kind, pool, enToVi, seed, step]);

  const done = !head;
  // Mỗi đoạn một từ của vòng: xong cả hai chặng = đầy, đang chờ chặng gõ = nửa.
  const segments = round.map((w): 0 | 1 | 2 => {
    const pending = queue.filter((q) => q.word === w.word);
    if (pending.length === 0) return 2;
    return pending.some((q) => q.kind === 'recall') ? 1 : 0;
  });

  const restart = () => {
    const r = freshRound();
    setRound(r);
    setQueue(initialQueue(r));
    setAsked(0);
    setWrong(0);
    setPicked(null);
    setTyped('');
    setVerdict(null);
  };

  const judge = (ok: boolean) => {
    if (!word || !head) return;
    setVerdict(ok);
    setAsked((n) => n + 1);
    if (!ok) setWrong((n) => n + 1);
    if (ok) {
      playCorrectChime();
      const current = useTopicStudyStore.getState().stages[slug]?.[word.word] ?? 0;
      const next = head.kind === 'recall' ? 2 : Math.max(current, 1);
      setStage(slug, word.word, next as 1 | 2);
    }
  };

  const pick = (i: number) => {
    if (verdict !== null || !mcq) return;
    setPicked(i);
    judge(i === mcq.correctIndex);
  };

  const submitTyped = () => {
    if (verdict !== null || !word || !typed.trim()) return;
    judge(isTypedCorrect(typed, word.word));
  };

  const dontKnow = () => {
    if (verdict !== null) return;
    if (mcq) setPicked(-1);
    judge(false);
  };

  const next = () => {
    if (verdict === null) return;
    setQueue((q) => advanceQueue(q, verdict));
    setPicked(null);
    setTyped('');
    setVerdict(null);
    setStep((n) => n + 1);
    logQuestions(1);
  };

  useHotkeys((e) => {
    if (done) return;
    if (verdict !== null) {
      if (e.key === 'Enter') {
        e.preventDefault();
        next();
      }
      return;
    }
    if (head?.kind === 'recognize') {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) pick(n - 1);
      if (n === 5) dontKnow();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submitTyped();
    }
  });

  if (!topic) {
    return (
      <StudyFrame backHref="/vocabulary/topics" title="Học">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">Không có bộ từ này.</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const backHref = `/vocabulary/topic/${slug}`;
  const footer = `Đã nhớ: ${masteredCount(stages)} / ${topic.words.length}  •  Câu đã làm: ${asked}`;

  if (done) {
    const accuracy = asked > 0 ? Math.round(((asked - wrong) / asked) * 100) : 0;
    return (
      <StudyFrame backHref={backHref} title="Học" segments={round.map(() => 2)} footer={footer}>
        <StudyCard>
          <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">Xong vòng này</Text>
          <Text className="mt-2 font-heavy text-pageTitle text-ink">{round.length} từ đã qua cả hai chặng</Text>
          <Text className="mt-2 font-sans text-bodyLg text-muted">
            {asked} câu, đúng {accuracy}% ngay lần đầu hoặc sau khi làm lại.
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {round.map((w) => (
              <View key={w.word} className="rounded-pill bg-primary-50 px-3 py-1.5">
                <Text className="font-semi text-body text-primary-700">{w.word}</Text>
              </View>
            ))}
          </View>
          <PrimaryButton label="Học vòng tiếp theo" onPress={restart} />
          <GhostButton label="Về bộ từ" onPress={() => router.replace(backHref as never)} />
        </StudyCard>
      </StudyFrame>
    );
  }

  return (
    <StudyFrame backHref={backHref} title={topic.nameVi} segments={segments} footer={footer}>
      <CrossFade swapKey={`step-${step}`}>
        <StudyCard>
          {head!.kind === 'recognize' && mcq ? (
            <View>
              <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">
                {enToVi ? 'Chọn nghĩa đúng' : 'Chọn từ tiếng Anh đúng'}
              </Text>
              <View className="mt-2 flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-heavy text-pageTitle text-ink">{enToVi ? word!.word : word!.meaningVi}</Text>
                  {enToVi ? (
                    <Text className="mt-1 font-sans text-body text-muted">
                      {word!.pos} · {word!.ipa}
                    </Text>
                  ) : null}
                </View>
                {enToVi ? <SpeakButton text={word!.word} /> : null}
              </View>
              <View className="mt-6">
                <ChoiceGrid options={mcq.options} picked={picked} correctIndex={mcq.correctIndex} onPick={pick} />
              </View>
              {verdict === null ? <GhostButton label="5 · Tôi không biết" onPress={dontKnow} /> : null}
            </View>
          ) : (
            <View>
              <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">Gõ từ tiếng Anh</Text>
              <Text className="mt-2 font-heavy text-pageTitle text-ink">{word!.meaningVi}</Text>
              <Text className="mt-1 font-sans text-body text-muted">
                {word!.pos} · {word!.word.length} chữ cái · bắt đầu bằng “{word!.word[0]}”
              </Text>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                editable={verdict === null}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Nhập câu trả lời của bạn…"
                placeholderTextColor="#94A3B8"
                onSubmitEditing={submitTyped}
                className="mt-6 rounded-2xl px-5 py-4 text-center font-semi text-sectionTitle text-ink"
                style={{ borderWidth: 1.5, borderColor: verdict === null ? '#CBD5E1' : verdict ? '#16A34A' : '#E11D48', backgroundColor: '#F8FAFC' }}
              />
              {verdict === null ? (
                <>
                  <PrimaryButton label="Kiểm tra" hint="Enter" disabled={!typed.trim()} onPress={submitTyped} />
                  <GhostButton label="Tôi không biết" onPress={dontKnow} />
                </>
              ) : null}
            </View>
          )}

          {verdict !== null ? <FeedbackPanel ok={verdict} word={word!} onNext={next} /> : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
