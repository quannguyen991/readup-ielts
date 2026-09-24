import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  ChoiceGrid,
  FeedbackPanel,
  GhostButton,
  PrimaryButton,
  speak,
  StudyCard,
  StudyFrame,
  useHotkeys,
} from '@/components/vocab/study/StudyKit';
import { MistakeBox, RoundAnalysis } from '@/components/vocab/study/MistakeViews';
import { CrossFade } from '@/components/motion/Motion';
import { Icon } from '@/components/ui/Icon';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import {
  advanceCloze,
  buildClozeQuestion,
  CLOZE_KIND_LABEL,
  CLOZE_ROUND,
  clozeable,
  fillPattern,
  isClozeCorrect,
  letterCount,
  planClozeRound,
  type ClozeItem,
  type ClozeQuestion,
} from '@/services/vocab/cloze-drill';
import { diagnosePick, diagnoseTyped, MISTAKE_TITLE, type Mistake } from '@/services/vocab/mistake';
import { seededRng, shuffled, type StudyWord } from '@/services/vocab/topic-study';
import { playCorrectChime } from '@/services/audio/chime';
import { useGameStore } from '@/store/useGameStore';
import { useOwlHint } from '@/components/game/useOwlHint';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { color } from '@/theme/tokens';

/**
 * Điền từ vào câu ví dụ — biết nghĩa một từ chưa phải là biết DÙNG nó.
 *
 * Bốn dạng XEN KẼ trong một vòng 10 câu (`services/vocab/cloze-drill`): chọn từ,
 * xếp chữ, gõ từ, nghe và điền. Chỗ trống khoét đúng DẠNG CHIA trong câu
 * ("habitats", "migrated"): dạng chọn từ hiện bốn phương án ở dạng gốc nên phải
 * hiểu cả câu mới chọn được; dạng gõ và xếp chữ bắt viết đúng dạng trong câu.
 *
 * Sai thì câu đó quay lại sau hai câu bằng một dạng khác; từ sai được ghi vào
 * "từ hay sai" để màn Học hỏi trước, và vòng sau của màn này cũng hỏi lại trước.
 */
export default function ClozeScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  const topic = useStudyDeck(slug);
  const logQuestions = useStudyStore((s) => s.logQuestions);
  const addLapse = useTopicStudyStore((s) => s.addLapse);
  const [seed] = useState(() => Date.now() % 100000);

  // Thứ tự từ cho cả buổi: chỉ câu khoét được, từ hay sai (ở mọi màn) lên trước.
  const order = useMemo(() => {
    if (!topic) return [];
    const lapses = useTopicStudyStore.getState().lapses[slug] ?? {};
    return shuffled(clozeable(topic.words), seededRng(seed)).sort((a, b) => (lapses[b.word] ?? 0) - (lapses[a.word] ?? 0));
  }, [topic, slug, seed]);

  const wordsForRound = (n: number, firstUp: readonly string[] = []): StudyWord[] => {
    if (order.length === 0) return [];
    const size = Math.min(CLOZE_ROUND, order.length);
    const start = (n * size) % order.length;
    const base = Array.from({ length: order.length }, (_, i) => order[(start + i) % order.length]!);
    const weak = order.filter((w) => firstUp.includes(w.word));
    return [...weak, ...base.filter((w) => !firstUp.includes(w.word))].slice(0, size);
  };

  const [roundNo, setRoundNo] = useState(0);
  const [roundWords, setRoundWords] = useState<StudyWord[]>(() => wordsForRound(0));
  const [queue, setQueue] = useState<ClozeItem[]>(() => planClozeRound(roundWords, seededRng(seed)));
  const [plannedFor, setPlannedFor] = useState(order);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  // Phương án Cú đã loại ở câu đang mở.
  const [hidden, setHidden] = useState<number[]>([]);
  const [typed, setTyped] = useState('');
  const [used, setUsed] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [mistake, setMistake] = useState<Mistake | null>(null);
  const [mistakes, setMistakes] = useState<{ word: string; m: Mistake }[]>([]);
  const [asked, setAsked] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  // Khoá chấm ĐỒNG BỘ: phím Enter có thể tới hai đường (phím tắt và ô nhập) trong cùng một lượt.
  const lockRef = useRef(false);

  // Lập một vòng mới (không chạm ref — gọi được cả lúc render).
  const planRound = (n: number, firstUp: readonly string[] = []) => {
    const w = wordsForRound(n, firstUp);
    setRoundNo(n);
    setRoundWords(w);
    setQueue(planClozeRound(w, seededRng(seed + n * 131)));
    setPicked(null);
    setHidden([]);
    setTyped('');
    setUsed([]);
    setVerdict(null);
    setMistake(null);
    setMistakes([]);
    setAsked(0);
    setFirstTry(0);
    setStep((s) => s + 1);
  };
  const startRound = (n: number, firstUp: readonly string[] = []) => {
    lockRef.current = false;
    planRound(n, firstUp);
  };

  // Bộ từ tới muộn (sổ từ đọc từ bộ nhớ máy sau lần render đầu): lập lại vòng
  // theo đúng danh sách mới — điều chỉnh state lúc render, không cần effect.
  if (plannedFor !== order) {
    setPlannedFor(order);
    planRound(0);
  }

  const head = queue[0];
  const q = useMemo<ClozeQuestion | null>(
    () => (head && topic ? buildClozeQuestion(head, topic.words, seededRng(seed + step * 7 + roundNo * 1000)) : null),
    [head, topic, seed, step, roundNo],
  );

  // Dạng nghe: đọc cả câu ngay khi câu hiện ra.
  useEffect(() => {
    if (q?.kind === 'listen') speak(q.word.example, { rate: 0.9 });
    // Chỉ khi sang câu mới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, q?.kind]);

  const judge = (ok: boolean, m: Mistake | null) => {
    if (!q || !head || lockRef.current) return;
    lockRef.current = true;
    setVerdict(ok);
    setAsked((n) => n + 1);
    logQuestions(1);
    useGameStore.getState().answer(ok, 'vocab');
    if (ok) {
      playCorrectChime();
      if (!head.retry) setFirstTry((n) => n + 1);
      return;
    }
    setMistake(m);
    if (m) {
      setMistakes((list) => [...list, { word: q.word.word, m }]);
      useTopicStudyStore.getState().logMistake(slug, q.word.word, m.kind);
    }
    addLapse(slug, q.word.word);
  };

  const others = useMemo(() => (topic && q ? topic.words.filter((w) => w.word !== q.word.word) : []), [topic, q]);

  // Gợi ý của Cú (chỉ câu chọn): loại bớt hai phương án sai.
  useOwlHint(
    q && q.kind === 'pick' && verdict === null
      ? () => {
          if (hidden.length > 0) return false;
          const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correctIndex);
          const drop = Math.min(2, wrong.length - 1);
          if (drop <= 0) return false;
          const from = step % wrong.length;
          setHidden(Array.from({ length: drop }, (_, k) => wrong[(from + k) % wrong.length]!));
          return true;
        }
      : null,
  );

  const pick = (i: number) => {
    if (!q || q.kind !== 'pick' || verdict !== null) return;
    setPicked(i);
    const ok = i === q.correctIndex;
    judge(ok, ok ? null : diagnosePick(q.options[i]!, q.word, topic?.words ?? []));
  };

  const submitText = (value: string) => {
    if (!q || q.kind === 'pick' || verdict !== null || !value.trim()) return;
    const ok = isClozeCorrect(q, value);
    judge(ok, ok ? null : diagnoseTyped(value, q.answer, others));
  };

  const dontKnow = () => {
    if (!q || verdict !== null) return;
    if (q.kind === 'pick') setPicked(-1);
    judge(false, { kind: 'unknown', title: MISTAKE_TITLE.unknown, detail: `Đáp án: “${q.answer}”.` });
  };

  const tapTile = (i: number) => {
    if (!q || q.kind !== 'scramble' || verdict !== null || used.includes(i)) return;
    const nextUsed = [...used, i];
    setUsed(nextUsed);
    // Đủ chữ thì chấm luôn, không bắt bấm thêm nút.
    if (nextUsed.length === letterCount(q.answer)) submitText(fillPattern(q.answer, nextUsed.map((k) => q.tiles[k]!)).join(''));
  };
  const untap = (slot: number) => {
    if (verdict !== null) return;
    setUsed((u) => u.filter((_, k) => k !== slot));
  };

  const next = () => {
    if (verdict === null) return;
    setQueue((list) => advanceCloze(list, verdict));
    setPicked(null);
    setHidden([]);
    setTyped('');
    setUsed([]);
    setVerdict(null);
    setMistake(null);
    setStep((n) => n + 1);
    lockRef.current = false;
  };

  useHotkeys((e) => {
    if (!q) return;
    if (verdict !== null) {
      if (e.key === 'Enter') {
        e.preventDefault();
        next();
      }
      return;
    }
    if (q.kind === 'pick') {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) pick(n - 1);
      if (n === 5) dontKnow();
      return;
    }
    if (q.kind === 'scramble') {
      if (e.key === 'Backspace') {
        e.preventDefault();
        untap(used.length - 1);
        return;
      }
      if (e.key.length === 1 && /\p{L}/u.test(e.key)) {
        const i = q.tiles.findIndex((t, k) => !used.includes(k) && t === e.key.toLowerCase());
        if (i >= 0) tapTile(i);
      }
      return;
    }
    // Gõ từ / nghe và điền: Enter để chấm, Ctrl để nghe lại.
    if (e.key === 'Enter') {
      e.preventDefault();
      submitText(typed);
    } else if (e.key === 'Control' && q.kind === 'listen') {
      speak(q.word.example, { rate: 0.9 });
    }
  });

  if (!topic || order.length === 0) {
    return (
      <StudyFrame backHref="/vocabulary/topics" title="Điền vào câu">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">Không có câu nào để điền trong bộ này.</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const backHref = `/vocabulary/topic/${slug}`;
  const slipped = new Set(mistakes.map((x) => x.word));
  const segments = roundWords.map((w): 0 | 1 | 2 => {
    if (!queue.some((i) => i.word === w.word)) return 2;
    return slipped.has(w.word) ? 1 : 0;
  });
  const footer = `Vòng ${roundNo + 1}  •  Câu đã làm ${asked}  •  Đúng ngay lần đầu ${firstTry}/${roundWords.length}`;

  if (!head || !q) {
    return (
      <StudyFrame backHref={backHref} title="Điền vào câu" segments={segments} footer={footer}>
        <CrossFade swapKey={`done-${roundNo}`}>
          <StudyCard>
            <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">Xong vòng {roundNo + 1}</Text>
            <Text className="mt-2 font-heavy text-pageTitle text-ink">
              {firstTry}/{roundWords.length} câu đúng ngay lần đầu
            </Text>
            <Text className="mt-1 font-sans text-bodyLg text-muted">
              Câu sai đã được hỏi lại bằng dạng khác cho tới khi đúng — tổng cộng {asked} câu.
            </Text>
            <RoundAnalysis mistakes={mistakes} />
            <PrimaryButton label="Vòng tiếp theo" onPress={() => startRound(roundNo + 1, [...slipped])} />
            <GhostButton label="Về bộ từ" onPress={() => router.replace(backHref as never)} />
          </StudyCard>
        </CrossFade>
      </StudyFrame>
    );
  }

  const revealed = verdict !== null;
  return (
    <StudyFrame backHref={backHref} title={topic.nameVi} segments={segments} footer={footer} battle>
      <CrossFade swapKey={`c-${step}`}>
        <StudyCard>
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: '#EEF2FF' }}>
              <Text className="font-strong text-label" style={{ color: color.primary }}>
                {CLOZE_KIND_LABEL[q.kind]}
              </Text>
            </View>
            {head.retry ? (
              <Text className="font-semi text-label" style={{ color: '#B45309' }}>
                ↻ Hỏi lại câu bạn vừa sai
              </Text>
            ) : null}
          </View>

          <Text className="mt-3 font-semi text-sectionTitle leading-9 text-ink">
            {q.before}
            <Text className="font-strong" style={{ color: revealed ? (verdict ? '#15803D' : '#1D4ED8') : '#94A3B8' }}>
              {revealed ? q.answer : ' _______ '}
            </Text>
            {q.after}
          </Text>

          {q.kind === 'pick' ? (
            <View className="mt-6">
              <ChoiceGrid options={q.options} picked={picked} correctIndex={q.correctIndex} onPick={pick} hidden={hidden} />
            </View>
          ) : null}

          {q.kind === 'scramble' ? <ScrambleBoard q={q} used={used} locked={revealed} onTile={tapTile} onSlot={untap} /> : null}

          {q.kind === 'write' || q.kind === 'listen' ? (
            <View className="mt-5">
              {q.kind === 'write' ? (
                <Text className="font-sans text-body text-muted">
                  Nghĩa: <Text className="font-semi text-ink">{q.word.meaningVi}</Text> · {letterCount(q.answer)} chữ cái · bắt đầu bằng “
                  {q.answer[0]}” · gõ đúng dạng trong câu
                </Text>
              ) : (
                <View className="flex-row flex-wrap items-center gap-2">
                  <ListenButton label="Nghe câu" hint="Ctrl" onPress={() => speak(q.word.example, { rate: 0.9 })} />
                  <ListenButton label="Nghe chậm" onPress={() => speak(q.word.example, { rate: 0.65 })} />
                  <Text className="font-sans text-body text-muted">{letterCount(q.answer)} chữ cái</Text>
                </View>
              )}
              <TextInput
                value={typed}
                onChangeText={setTyped}
                editable={!revealed}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Gõ từ còn thiếu…"
                placeholderTextColor="#94A3B8"
                // Trên web phím Enter do phím tắt ở cấp cửa sổ xử lý; gắn thêm ở đây là chấm hai lần.
                onSubmitEditing={Platform.OS === 'web' ? undefined : () => submitText(typed)}
                className="mt-4 rounded-2xl px-5 py-4 text-center font-semi text-sectionTitle text-ink"
                style={{
                  borderWidth: 1.5,
                  borderColor: !revealed ? '#CBD5E1' : verdict ? '#16A34A' : '#E11D48',
                  backgroundColor: '#F8FAFC',
                }}
              />
              {!revealed ? <PrimaryButton label="Kiểm tra" hint="Enter" disabled={!typed.trim()} onPress={() => submitText(typed)} /> : null}
            </View>
          ) : null}

          {!revealed ? <GhostButton label={q.kind === 'pick' ? '5 · Tôi không biết' : 'Tôi không biết'} onPress={dontKnow} /> : null}
          {verdict === false && mistake ? <MistakeBox m={mistake} /> : null}
          {revealed ? <FeedbackPanel ok={verdict} word={q.word} onNext={next} /> : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}

/**
 * Xếp chữ: hàng ô của đáp án (dấu cách, gạch nối giữ nguyên) và các viên chữ
 * đã xáo. Bấm viên chữ để đặt vào ô trống kế tiếp, bấm một ô đã có chữ để trả
 * chữ đó về. Trên máy tính gõ phím chữ cái hoặc Backspace cũng được.
 */
function ScrambleBoard({
  q,
  used,
  locked,
  onTile,
  onSlot,
}: {
  q: Extract<ClozeQuestion, { kind: 'scramble' }>;
  used: number[];
  locked: boolean;
  onTile: (i: number) => void;
  onSlot: (slot: number) => void;
}) {
  const shown = fillPattern(
    q.answer,
    used.map((k) => q.tiles[k]!),
  );
  const chars = [...q.answer];
  // Từ dài thì ô nhỏ lại, để một từ 11–12 chữ vẫn nằm gọn trên màn điện thoại.
  const small = letterCount(q.answer) > 9;
  const size = small ? 28 : 38;
  // Chia theo từ để một từ không bị ngắt dòng giữa chừng khi còn chỗ.
  const words: { start: number; end: number }[] = [];
  chars.forEach((ch, i) => {
    if (ch === ' ') return;
    const last = words[words.length - 1];
    if (last && last.end === i) last.end = i + 1;
    else words.push({ start: i, end: i + 1 });
  });

  return (
    <View className="mt-5">
      <View className="w-full flex-row flex-wrap justify-center" style={{ columnGap: 16, rowGap: 8 }}>
        {words.map((w) => (
          <View key={w.start} className="flex-row flex-wrap justify-center" style={{ gap: small ? 3 : 5, maxWidth: '100%' }}>
            {chars.slice(w.start, w.end).map((ch, j) => {
              const pos = w.start + j;
              if (!/\p{L}/u.test(ch)) {
                return (
                  <Text key={pos} className="self-end font-heavy text-sectionTitle text-ink">
                    {ch}
                  </Text>
                );
              }
              const slot = letterCount(q.answer.slice(0, pos));
              const filled = shown[pos];
              return (
                <Pressable
                  key={pos}
                  accessibilityRole="button"
                  accessibilityLabel={filled ? `Bỏ chữ ${filled}` : 'Ô trống'}
                  disabled={locked || !filled}
                  onPress={() => onSlot(slot)}
                  className="items-center justify-center rounded-lg"
                  style={{
                    width: size,
                    height: size + 8,
                    borderBottomWidth: 3,
                    borderColor: filled ? color.primary : '#CBD5E1',
                    backgroundColor: filled ? '#EEF2FF' : '#F8FAFC',
                  }}
                >
                  <Text className={small ? 'font-heavy text-bodyLg text-ink' : 'font-heavy text-sectionTitle text-ink'}>{filled}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View className="mt-6 flex-row flex-wrap justify-center" style={{ gap: 8 }}>
        {q.tiles.map((t, i) => {
          const isUsed = used.includes(i);
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Chữ ${t}`}
              disabled={locked || isUsed}
              onPress={() => onTile(i)}
              className="items-center justify-center rounded-xl"
              style={{
                width: 46,
                height: 50,
                backgroundColor: isUsed ? '#F1F5F9' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isUsed ? '#F1F5F9' : '#CBD5E1',
                opacity: isUsed ? 0.35 : 1,
              }}
            >
              <Text className="font-heavy text-sectionTitle text-ink">{t}</Text>
            </Pressable>
          );
        })}
      </View>
      {!locked ? (
        <Text className="mt-3 text-center font-sans text-label text-muted">Bấm chữ để xếp · bấm ô đã điền để trả chữ về · gõ phím chữ cái hoặc Backspace</Text>
      ) : null}
    </View>
  );
}

function ListenButton({ label, hint, onPress }: { label: string; hint?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-pill bg-primary-50 px-4 py-2.5"
    >
      <Icon name="volume" size={18} color={color.primary} />
      <Text className="font-semi text-body" style={{ color: color.primary }}>
        {label}
      </Text>
      {hint ? <Text className="font-sans text-label text-muted">{hint}</Text> : null}
    </Pressable>
  );
}
