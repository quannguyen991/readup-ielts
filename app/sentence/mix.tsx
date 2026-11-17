import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

import { TaskShell } from '@/components/layout/TaskShell';
import { Confetti } from '@/components/motion/Confetti';
import { PageTransition } from '@/components/motion/Motion';
import { Button, Icon } from '@/components/ui';
import { DICTATION_SETS } from '@/data/dictation-sets';
import { buildCloze, buildScramble, buildSpot, checkCloze, checkScramble, hashText, rng, type DrillKind } from '@/services/sentence/drill-types';
import { useL } from '@/i18n/useL';

/**
 * LUYỆN ĐA DẠNG — ba kiểu bài ngắn dựng từ kho câu chép chính tả: sắp xếp từ, điền từ, tìm lỗi sai.
 * Mỗi lượt 10 câu theo trình độ đã chọn; đáp án tính bằng code, không gọi AI.
 */

type Q = { en: string; vi: string };
const ROUND = 10;
const LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;

const KINDS: { key: DrillKind; vi: string; en: string; hintVi: string; hintEn: string; bg: string; ink: string }[] = [
  { key: 'scramble', vi: 'Sắp xếp từ', en: 'Word order', hintVi: 'Bấm các từ theo đúng thứ tự để ghép lại câu.', hintEn: 'Tap the words in the right order.', bg: '#E0F2FE', ink: '#0369A1' },
  { key: 'cloze', vi: 'Điền từ', en: 'Fill the gap', hintVi: 'Gõ từ còn thiếu trong câu.', hintEn: 'Type the missing word.', bg: '#DCFCE7', ink: '#15803D' },
  { key: 'spot', vi: 'Tìm lỗi sai', en: 'Spot the error', hintVi: 'Bấm vào từ bị dùng sai.', hintEn: 'Tap the misused word.', bg: '#FFE4E6', ink: '#BE123C' },
];

function pickRound(kind: DrillKind, level: string, seed: number): Q[] {
  const pool: Q[] = [];
  for (const s of DICTATION_SETS) {
    if (s.level !== level) continue;
    for (const x of s.sentences) {
      if (kind === 'cloze' && !buildCloze(x.en)) continue;
      if (kind === 'spot' && !buildSpot(x.en)) continue;
      if (kind === 'scramble' && x.en.split(/\s+/).length > 16) continue;
      pool.push({ en: x.en, vi: x.vi });
    }
  }
  const r = rng(seed);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, ROUND);
}

export default function MixScreen() {
  const { L, en } = useL();
  const [kind, setKind] = useState<DrillKind>('scramble');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('B1');
  const [round, setRound] = useState(1);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const qs = useMemo(() => pickRound(kind, level, hashText(`${kind}-${level}-${round}`)), [kind, level, round]);
  const reset = (fn: () => void) => {
    fn();
    setIndex(0);
    setScore(0);
  };
  const info = KINDS.find((k) => k.key === kind)!;
  const done = index >= qs.length;

  return (
    <PageTransition routeKey="sentence-mix">
      <TaskShell backHref="/sentence" backLabel={L('Quay lại Luyện câu', 'Back to Sentence practice')} variant="full" title={L('Luyện đa dạng', 'Mixed drills')} subtitle="Word order · Gap fill · Spot the error" icon="refresh" tone="paper">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          {KINDS.map((k) => {
            const on = k.key === kind;
            return (
              <Pressable key={k.key} accessibilityRole="button" onPress={() => reset(() => setKind(k.key))} style={{ flexGrow: 1, flexBasis: 160, borderRadius: 18, borderWidth: 2, borderColor: on ? k.ink : '#C9C2EE', backgroundColor: on ? k.bg : '#FFFFFF', padding: 12 }}>
                <Text className="font-nun-heavy" style={{ fontSize: 16, color: k.ink }}>{en ? k.en : k.vi}</Text>
                <Text className="font-nun-strong" style={{ fontSize: 13, color: '#6B6590', marginTop: 2 }}>{en ? k.hintEn : k.hintVi}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          {LEVELS.map((lv) => (
            <Pressable key={lv} accessibilityRole="button" onPress={() => reset(() => setLevel(lv))} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: lv === level ? '#2A22B5' : '#C9C2EE', backgroundColor: lv === level ? '#2A22B5' : '#FFFFFF' }}>
              <Text className="font-nun-heavy" style={{ fontSize: 14, color: lv === level ? '#FFFFFF' : '#2B2350' }}>{lv}</Text>
            </Pressable>
          ))}
          <View style={{ flex: 1 }} />
          <Text className="font-nun-strong" style={{ fontSize: 14, color: '#6B6590' }}>{done ? L('Xong', 'Done') : `${index + 1}/${qs.length}`} · {L(`${score} đúng`, `${score} correct`)}</Text>
        </View>

        {done ? (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 2, borderColor: '#C9C2EE', padding: 24, alignItems: 'center', gap: 10 }}>
            {score >= qs.length * 0.8 ? <Confetti /> : null}
            <Text className="font-nun-heavy" style={{ fontSize: 28, color: '#2B2350' }}>{score}/{qs.length}</Text>
            <Text className="font-nun-strong" style={{ fontSize: 15, color: '#6B6590' }}>{score >= qs.length * 0.8 ? L('Rất tốt!', 'Great work!') : L('Làm thêm một lượt để chắc hơn.', 'Do another round to lock it in.')}</Text>
            <Button label={L('Lượt mới', 'New round')} onPress={() => reset(() => setRound((r) => r + 1))} />
          </View>
        ) : (
          <Question key={`${kind}-${level}-${round}-${index}`} kind={kind} q={qs[index]!} onDone={(ok) => { if (ok) setScore((s) => s + 1); setIndex((i) => i + 1); }} />
        )}
      </TaskShell>
    </PageTransition>
  );
}

const card = { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 2, borderColor: '#C9C2EE', padding: 20, gap: 14, ...(Platform.OS === 'web' ? ({ boxShadow: '0 5px 0 rgba(42,34,181,0.14)' } as object) : {}) } as const;

function Prompt({ vi }: { vi: string }) {
  return (
    <View style={{ backgroundColor: '#F4F1FF', borderRadius: 16, padding: 12 }}>
      <Text className="font-nun-strong" style={{ fontSize: 17, lineHeight: 24, color: '#2B2350' }}>{vi}</Text>
    </View>
  );
}

function Question({ kind, q, onDone }: { kind: DrillKind; q: Q; onDone: (ok: boolean) => void }) {
  if (kind === 'scramble') return <ScrambleQ q={q} onDone={onDone} />;
  if (kind === 'cloze') return <ClozeQ q={q} onDone={onDone} />;
  return <SpotQ q={q} onDone={onDone} />;
}

function Verdict({ ok, answer, extra, onNext }: { ok: boolean; answer: string; extra?: string; onNext: () => void }) {
  const { L } = useL();
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ok ? '#DCFCE7' : '#FFE4E6', borderRadius: 14, padding: 12 }}>
        <Icon name={ok ? 'check' : 'close'} size={18} color={ok ? '#15803D' : '#BE123C'} strokeWidth={2.6} />
        <Text className="font-nun-heavy" style={{ fontSize: 15, color: ok ? '#15803D' : '#BE123C', flex: 1 }}>{ok ? L('Đúng rồi!', 'Correct!') : L('Chưa đúng', 'Not quite')}</Text>
      </View>
      <Text className="font-nun-strong" style={{ fontSize: 16, lineHeight: 23, color: '#2B2350' }}>{answer}</Text>
      {extra ? <Text className="font-nun-strong" style={{ fontSize: 14, color: '#6B6590' }}>{extra}</Text> : null}
      <Button label={L('Câu tiếp', 'Next')} onPress={onNext} />
    </View>
  );
}

function ScrambleQ({ q, onDone }: { q: Q; onDone: (ok: boolean) => void }) {
  const { L } = useL();
  const sc = useMemo(() => buildScramble(q.en), [q.en]);
  const [picked, setPicked] = useState<number[]>([]);
  const [shown, setShown] = useState<boolean | null>(null);
  const full = picked.length === sc.tokens.length;
  return (
    <View style={card}>
      <Prompt vi={q.vi} />
      <View style={{ minHeight: 56, flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderBottomWidth: 2, borderColor: '#C9C2EE', paddingBottom: 10 }}>
        {picked.map((v, k) => (
          <Pressable key={k} disabled={shown !== null} onPress={() => setPicked(picked.filter((_, i) => i !== k))} style={{ backgroundColor: '#2A22B5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Text className="font-nun-heavy" style={{ fontSize: 16, color: '#FFFFFF' }}>{sc.tokens[v]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {sc.order.map((v) => {
          const used = picked.includes(v);
          return (
            <Pressable key={v} disabled={used || shown !== null} onPress={() => setPicked([...picked, v])} style={{ opacity: used ? 0.25 : 1, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#C9C2EE', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 }}>
              <Text className="font-nun-heavy" style={{ fontSize: 16, color: '#2B2350' }}>{sc.tokens[v]}</Text>
            </Pressable>
          );
        })}
      </View>
      {shown === null ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button variant="outline" label={L('Xoá', 'Clear')} onPress={() => setPicked([])} disabled={picked.length === 0} />
          <Button label={L('Kiểm tra', 'Check')} disabled={!full} onPress={() => setShown(checkScramble(sc.tokens, picked))} />
        </View>
      ) : (
        <Verdict ok={shown} answer={q.en} onNext={() => onDone(shown)} />
      )}
    </View>
  );
}

function ClozeQ({ q, onDone }: { q: Q; onDone: (ok: boolean) => void }) {
  const { L } = useL();
  const c = useMemo(() => buildCloze(q.en)!, [q.en]);
  const [typed, setTyped] = useState<string[]>(() => c.answers.map(() => ''));
  const [shown, setShown] = useState<boolean | null>(null);
  const check = () => setShown(checkCloze(c.answers, typed).every(Boolean));
  return (
    <View style={card}>
      <Prompt vi={q.vi} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
        {c.parts.map((p, i) =>
          p.blank === undefined ? (
            <Text key={i} className="font-nun-strong" style={{ fontSize: 18, lineHeight: 34, color: '#2B2350' }}>{p.text}</Text>
          ) : (
            <TextInput
              key={i}
              value={typed[p.blank]}
              editable={shown === null}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(t) => setTyped((a) => a.map((x, k) => (k === p.blank ? t : x)))}
              onSubmitEditing={check}
              style={{ minWidth: 110, borderBottomWidth: 3, borderColor: '#2A22B5', fontSize: 18, paddingVertical: 2, paddingHorizontal: 6, color: '#2B2350', textAlign: 'center' } as never}
            />
          ),
        )}
      </View>
      {shown === null ? <Button label={L('Kiểm tra', 'Check')} disabled={typed.every((t) => !t.trim())} onPress={check} /> : <Verdict ok={shown} answer={q.en} onNext={() => onDone(shown)} />}
    </View>
  );
}

function SpotQ({ q, onDone }: { q: Q; onDone: (ok: boolean) => void }) {
  const { L } = useL();
  const sp = useMemo(() => buildSpot(q.en)!, [q.en]);
  const [chosen, setChosen] = useState<number | null>(null);
  const ok = chosen === sp.wrongIndex;
  return (
    <View style={card}>
      <Prompt vi={q.vi} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {sp.words.map((w, i) => {
          const isWrong = chosen !== null && i === sp.wrongIndex;
          const isPick = chosen === i;
          return (
            <Pressable key={i} disabled={chosen !== null} onPress={() => setChosen(i)} style={{ borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 2, borderColor: isWrong ? '#BE123C' : isPick ? '#15803D' : 'transparent', backgroundColor: isWrong ? '#FFE4E6' : '#FFFFFF' }}>
              <Text className="font-nun-strong" style={{ fontSize: 18, color: '#2B2350' }}>{w}</Text>
            </Pressable>
          );
        })}
      </View>
      {chosen !== null ? <Verdict ok={ok} answer={q.en} extra={`${sp.words[sp.wrongIndex]} → ${sp.original}. ${sp.why}`} onNext={() => onDone(ok)} /> : null}
    </View>
  );
}
