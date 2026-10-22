import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { Aura, Burst, FloatText, JUICE, Pop, Shake, Stamp } from '@/components/game/juice';
import { Confetti } from '@/components/motion/Confetti';
import { GREEN, RED } from '@/components/vocab/study/StudyKit';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { addAnswer, buildDuel, DUEL_LENGTH, emptyTally, pointsFor, QUESTION_MS, type DuelQuestion, type PlayerTally } from '@/services/duel/duel';
import { decodeChallenge, encodeChallenge, newChallengeSeed, verdictOf, type ChallengePayload } from '@/services/duel/challenge';
import type { StudyWord } from '@/services/vocab/topic-study';
import { useGameStore } from '@/store/useGameStore';
import { useL } from '@/i18n/useL';

/**
 * THÁCH ĐẤU BẤT ĐỒNG BỘ. Hai đường vào:
 *   - không có `?c=`: chọn bộ từ, chơi một ván, rồi gửi đường dẫn thách bạn;
 *   - có `?c=`: mở thách đấu của bạn, làm đúng bộ câu đó, rồi xem ai thắng.
 * Không có máy chủ lưu kết quả; xem giới hạn ở `services/duel/challenge.ts`.
 */

type Phase = 'pick' | 'play' | 'result';

export default function ChallengeRoute() {
  const params = useLocalSearchParams<{ c?: string; deck?: string }>();
  const { L, en } = useL();
  const raw = typeof params.c === 'string' ? params.c : '';
  const incoming = useMemo(() => (raw ? decodeChallenge(raw) : null), [raw]);
  const invalid = raw.length > 0 && !incoming;

  const [slug, setSlug] = useState(incoming?.d ?? (typeof params.deck === 'string' ? params.deck : VOCAB_TOPICS[0]?.slug ?? ''));
  const deck = useStudyDeck(incoming?.d ?? slug);
  const [phase, setPhase] = useState<Phase>('pick');
  const [seed, setSeed] = useState('');
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const enough = !!deck && deck.words.length >= 4;

  const start = () => {
    setSeed(incoming ? incoming.s : newChallengeSeed());
    setResult(null);
    setPhase('play');
  };

  if (invalid) {
    return (
      <Screen>
        <View className="w-full self-center" style={{ maxWidth: 640 }}>
          <Text className="font-heavy text-pageTitle text-ink">{L('Đường dẫn thách đấu không hợp lệ', 'This challenge link is not valid')}</Text>
          <Button className="mt-4 self-start" label={L('Tạo thách đấu mới', 'Make a new challenge')} onPress={() => router.replace('/duel/challenge' as never)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 820 }}>
        <Pressable onPress={() => router.replace('/duel' as never)} className="self-start rounded-pill bg-white/85 px-4 py-2">
          <Text className="font-semi text-body text-ink">{L('Sảnh đấu', 'Duel lobby')}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/duel/show' as never)} accessibilityRole="link" className="mt-4 self-start">
          <Text className="font-strong text-label" style={{ color: '#1368CE' }}>{L('Muốn cả lớp cùng chơi lúc này? Đấu chiếu lớp →', 'Want the whole class now? Class showdown →')}</Text>
        </Pressable>
        <Text className="mt-4 font-heavy text-pageTitle text-ink">
          {incoming ? L('Bạn được thách đấu', "You've been challenged") : L('Thách đấu bạn bè', 'Challenge a friend')}
        </Text>

        {phase === 'pick' ? (
          <View className="mt-4 rounded-[22px] bg-white p-5">
            {incoming ? (
              <Text className="font-sans text-bodyLg text-ink">
                {L(`Người thách đạt ${incoming.p} điểm, đúng ${incoming.c}/${incoming.t} câu. Bạn làm đúng bộ câu đó nhé.`, `The challenger scored ${incoming.p} points, ${incoming.c}/${incoming.t} correct. Play the same questions.`)}
              </Text>
            ) : (
              <>
                <Text className="font-heavy text-bodyLg text-ink">{L('Chọn bộ từ', 'Pick a deck')}</Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {VOCAB_TOPICS.map((t) => {
                    const on = slug === t.slug;
                    return (
                      <Pressable key={t.slug} onPress={() => setSlug(t.slug)} accessibilityRole="radio" aria-checked={on} className="rounded-pill px-4 py-2" style={{ backgroundColor: on ? '#0F1D33' : '#F3F0FB' }}>
                        <Text className="font-strong text-label" style={{ color: on ? '#FFFFFF' : '#0F1D33' }}>{en ? t.name : t.nameVi}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
            <Text className="mt-3 font-sans text-label text-muted">
              {L(`${DUEL_LENGTH} câu, mỗi câu 10 giây. Đúng và nhanh thì được nhiều điểm hơn.`, `${DUEL_LENGTH} questions, 10 seconds each. Faster correct answers score more.`)}
            </Text>
            <Button className="mt-5 self-start" label={incoming ? L('Nhận thách đấu', 'Accept') : L('Bắt đầu ván', 'Start')} iconRight="arrow-right" disabled={!enough} onPress={start} />
            {!enough && deck ? <Text className="mt-2 font-sans text-label" style={{ color: '#B42318' }}>{L('Bộ này chưa đủ 4 từ.', 'This deck has fewer than 4 words.')}</Text> : null}
          </View>
        ) : null}

        {phase === 'play' && deck ? (
          <Run
            key={seed}
            words={deck.words}
            seed={seed}
            onDone={(r) => {
              setResult(r);
              setPhase('result');
            }}
          />
        ) : null}

        {phase === 'result' && result ? (
          <Result incoming={incoming} result={result} slug={incoming?.d ?? slug} seed={seed} onAgain={() => setPhase('pick')} />
        ) : null}
      </View>
    </Screen>
  );
}

function Run({ words, seed, onDone }: { words: readonly StudyWord[]; seed: string; onDone: (r: { score: number; correct: number; total: number }) => void }) {
  const { L } = useL();
  const questions = useMemo<DuelQuestion[]>(() => buildDuel(words, seed), [words, seed]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [shownAt, setShownAt] = useState(() => Date.now());
  const [tally, setTally] = useState<PlayerTally>(emptyTally);
  const [clock, setClock] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{ ok: boolean; pts: number; id: number } | null>(null);
  const finished = useRef(false);
  const q = questions[index];

  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const submit = (i: number | null) => {
    if (!q || picked !== null) return;
    const ms = Math.max(0, Date.now() - shownAt);
    const ok = i !== null && i === q.correctIndex;
    setPicked(i ?? -1);
    useGameStore.getState().answer(ok, 'duel');
    setTally((t) => addAnswer(t, ok, ms));
    setFeedback({ ok, pts: pointsFor(ok, ms), id: Date.now() });
    setTimeout(() => {
      setIndex((n) => n + 1);
      setPicked(null);
      setShownAt(Date.now());
    }, 650);
  };

  // Bộ hẹn giờ gọi bản `submit` MỚI NHẤT, để đồng hồ ticking không làm lại hẹn giờ.
  const submitRef = useRef(submit);
  useLayoutEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    if (!q || picked !== null) return;
    const t = setTimeout(() => submitRef.current(null), Math.max(0, shownAt + QUESTION_MS - Date.now()));
    return () => clearTimeout(t);
  }, [q, picked, shownAt]);

  const done = index >= questions.length;
  useEffect(() => {
    if (!done || finished.current) return;
    finished.current = true;
    onDone({ score: tally.score, correct: tally.correct, total: questions.length });
  }, [done, onDone, questions.length, tally.correct, tally.score]);

  if (!q || done) return null;
  const left = Math.max(0, Math.ceil((shownAt + QUESTION_MS - clock) / 1000));
  return (
    <Shake trigger={feedback && !feedback.ok ? feedback.id : 0}>
    <View className="mt-4 overflow-hidden rounded-[22px] bg-white p-6" style={{ boxShadow: '0 12px 30px rgba(94,72,35,0.12)' } as object}>
      <View className="flex-row items-center justify-between">
        <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">
          {L('Câu', 'Question')} {index + 1}/{questions.length} · {tally.score} {L('điểm', 'pts')}
        </Text>
        <Text className="font-strong text-label" style={{ color: '#6A4BD9' }}>{left}s</Text>
      </View>
      <View className="mt-2 h-1.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#F3F0FB' }}>
        <View className="h-1.5 rounded-pill" style={{ width: `${Math.max(0, 1 - (clock - shownAt) / QUESTION_MS) * 100}%`, backgroundColor: '#F59E0B' }} />
      </View>
      <View className="mt-4 items-center">
        {feedback && feedback.ok ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Burst key={feedback.id} seed={`c-${feedback.id}`} colors={[JUICE.good, '#FFFFFF', JUICE.gold]} count={20} radius={130} size={9} />
          </View>
        ) : null}
        {feedback && feedback.ok ? <FloatText key={`f-${feedback.id}`} text={`+${feedback.pts}`} color="#15945A" size={34} style={{ top: -6 }} /> : null}
        <Pop key={`p-${index}`} from={0.6}>
          <Text className="font-heavy text-pageTitle text-ink">{q.enToVi ? q.word.word : q.word.meaningVi}</Text>
        </Pop>
      </View>
      <View className="mt-5 gap-2.5">
        {q.options.map((opt, i) => {
          const reveal = picked !== null;
          const ok = reveal && i === q.correctIndex;
          const bad = reveal && i === picked && i !== q.correctIndex;
          return (
            <Pressable
              key={`${i}-${opt}`}
              disabled={reveal}
              onPress={() => submit(i)}
              className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5"
              style={{ borderWidth: 1.5, borderColor: ok ? GREEN : bad ? RED : '#F3F0FB', backgroundColor: ok ? '#ECFDF3' : bad ? '#FFF1F2' : '#FFFFFF', boxShadow: ok ? '0 0 22px rgba(34,197,94,0.5)' : bad ? '0 0 16px rgba(239,68,68,0.35)' : undefined, transform: [{ scale: ok ? 1.02 : 1 }] } as object}
            >
              <Text className="font-strong text-label text-muted">{i + 1}</Text>
              <Text className="flex-1 font-semi text-bodyLg text-ink">{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
    </Shake>
  );
}

function Result({
  incoming,
  result,
  slug,
  seed,
  onAgain,
}: {
  incoming: ChallengePayload | null;
  result: { score: number; correct: number; total: number };
  slug: string;
  seed: string;
  onAgain: () => void;
}) {
  const { L } = useL();
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => {
    const payload = encodeChallenge({ d: slug, s: seed, p: result.score, c: result.correct, t: result.total });
    const origin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/duel/challenge?c=${payload}`;
  }, [result, seed, slug]);

  const share = () => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    void navigator.clipboard?.writeText(link).then(() => setCopied(true)).catch(() => setCopied(false));
  };

  if (incoming) {
    const verdict = verdictOf(result.score, incoming.p);
    const title = verdict === 'win' ? L('Bạn thắng!', 'You win!') : verdict === 'lose' ? L('Lần này bạn thua', "You lost this time") : L('Hoà!', "It's a draw!");
    return (
      <View className="mt-4 overflow-hidden rounded-[22px] bg-white p-6" style={{ boxShadow: '0 12px 30px rgba(94,72,35,0.12)' } as object}>
        {verdict === 'win' ? <Confetti seed={`win-${slug}-${seed}`} pieces={140} /> : null}
        <Pop from={0.3}>
          <Stamp color={verdict === 'win' ? '#15945A' : verdict === 'lose' ? '#B42318' : '#6A4BD9'}>
            <Text className="font-heavy text-hero" style={{ color: verdict === 'win' ? '#15945A' : verdict === 'lose' ? '#B42318' : '#6A4BD9' }}>{title}</Text>
          </Stamp>
        </Pop>
        <Text className="mt-2 font-sans text-bodyLg text-muted">
          {L(`Bạn: ${result.score} điểm, đúng ${result.correct}/${result.total}`, `You: ${result.score} points, ${result.correct}/${result.total} correct`)}
        </Text>
        <Text className="font-sans text-bodyLg text-muted">
          {L(`Người thách: ${incoming.p} điểm, đúng ${incoming.c}/${incoming.t}`, `Challenger: ${incoming.p} points, ${incoming.c}/${incoming.t} correct`)}
        </Text>
        <Text className="mt-2 font-sans text-label text-muted">{L('Điểm của người thách do họ tự ghi, chưa có máy chủ kiểm chứng.', 'The challenger’s score is self-reported; no server verifies it.')}</Text>
        <Button className="mt-4 self-start" variant="outline" label={L('Thách lại bạn', 'Make a new challenge')} onPress={() => router.replace('/duel/challenge' as never)} />
      </View>
    );
  }

  return (
    <View className="mt-4 overflow-hidden rounded-[22px] bg-white p-6" style={{ boxShadow: '0 12px 30px rgba(94,72,35,0.12)' } as object}>
      <Aura color={JUICE.gold} size={200} strength={0.6} />
      <Pop from={0.2}>
        <Text className="font-heavy text-hero text-ink">{result.score} {L('điểm', 'pts')}</Text>
      </Pop>
      <Text className="mt-1 font-sans text-bodyLg text-muted">{L(`Đúng ${result.correct}/${result.total} câu`, `${result.correct}/${result.total} correct`)}</Text>
      <Text selectable className="mt-4 rounded-xl px-3 py-2 font-sans text-label text-ink" style={{ backgroundColor: '#F3F0FB' }}>{link}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {Platform.OS === 'web' ? <Button label={copied ? L('Đã chép đường dẫn', 'Link copied') : L('Chép đường dẫn thách bạn', 'Copy challenge link')} onPress={share} /> : null}
        <Button variant="outline" label={L('Chơi ván khác', 'Play again')} onPress={onAgain} />
      </View>
    </View>
  );
}
