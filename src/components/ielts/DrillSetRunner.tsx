import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import { isDrillCorrect, optionsOf, type DrillMap, type DrillSet } from '@/data/drill-sets';
import { useL } from '@/i18n/useL';
import { parseScript, playScript } from '@/services/listening/script-player';
import { useDrillSetStore } from '@/store/useDrillSetStore';

type Props = {
  typeId: string;
  set: DrillSet;
  listening: boolean;
  nextSetId?: string;
  onExit: () => void;
  onNext: (setId: string) => void;
};

type Given = { answer: string; correct: boolean };

/** Bản đồ lưới 3×2: hàng sau A B C, hàng gần cổng D E F, cổng ở dưới. */
function MapFigure({ map }: { map: DrillMap }) {
  const rows = [map.cells.slice(0, 3), map.cells.slice(3, 6)];
  return (
    <View className="items-center rounded-2xl border border-border bg-canvas p-4">
      <Text className="mb-3 font-strong text-label text-ink">{map.title}</Text>
      <View style={{ width: '100%', maxWidth: 360, gap: 8 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map((c) => (
              <View key={c} style={{ flex: 1, height: 64, borderRadius: 12, borderWidth: 2, borderColor: '#6A4BD9', backgroundColor: '#F1ECFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text className="font-heavy text-cardTitle" style={{ color: '#6A4BD9' }}>{c}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: '#2B2350' }}>
            <Text className="font-strong text-label" style={{ color: '#FFFFFF' }}>▲ {map.entrance}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function DrillSetRunner({ typeId, set, listening, nextSetId, onExit, onNext }: Props) {
  const { L } = useL();
  const record = useDrillSetStore((s) => s.record);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [given, setGiven] = useState<Record<number, Given>>({});
  const [finished, setFinished] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<() => void>(() => undefined);
  const lines = useMemo(() => (listening && set.context ? parseScript(set.context) : []), [listening, set.context]);

  useEffect(() => () => stopRef.current(), []);
  useEffect(() => {
    stopRef.current();
    setPlaying(false); setIdx(0); setPicked(null); setTyped(''); setGiven({}); setFinished(false); setShowScript(false);
  }, [set.id]);

  const q = set.questions[idx];
  if (!q) return null;
  const options = optionsOf(typeId, set, q);
  const done = given[idx];
  const score = Object.values(given).filter((g) => g.correct).length;
  const mapIdx = q.mapIndex;

  const togglePlay = () => {
    if (playing) { stopRef.current(); setPlaying(false); return; }
    setPlaying(true);
    stopRef.current = playScript(lines, { onDone: () => setPlaying(false) });
  };

  const goto = (i: number) => { setIdx(i); setPicked(null); setTyped(''); };

  const check = () => {
    const a = options ? picked : typed.trim();
    if (!a) return;
    const correct = options ? a === q.answer : isDrillCorrect(q.answer, a);
    setGiven((p) => ({ ...p, [idx]: { answer: a, correct } }));
  };

  const finish = () => {
    stopRef.current(); setPlaying(false);
    record(set.id, score, set.questions.length);
    setFinished(true);
  };

  if (finished) {
    const total = set.questions.length;
    return (
      <View className="gap-4 pb-12">
        <View className="items-center rounded-2xl border border-border bg-surface p-6">
          <Text className="font-heavy text-cardTitle text-ink">{L('Kết quả', 'Result')}</Text>
          <Text className="mt-1 font-heavy text-[44px]" style={{ color: '#6A4BD9' }}>{score}/{total}</Text>
          <Text className="font-sans text-body text-muted">{L(`Chưa làm: ${total - Object.keys(given).length} câu`, `Unanswered: ${total - Object.keys(given).length}`)}</Text>
        </View>
        <View className="rounded-2xl border border-border bg-surface p-4 gap-2">
          <Text className="font-strong text-label text-muted">{L('XEM LẠI TỪNG CÂU', 'REVIEW')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {set.questions.map((_, i) => (
              <Pressable key={i} onPress={() => { setFinished(false); goto(i); }} className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: given[i] ? (given[i].correct ? '#DCFCE7' : '#FEE2E2') : '#F1F5F9' }}>
                <Text className="font-strong text-label" style={{ color: given[i] ? (given[i].correct ? '#15803D' : '#B91C1C') : '#64748B' }}>{i + 1}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View className="flex-row gap-3">
          <Pressable onPress={() => { setGiven({}); setFinished(false); goto(0); }} className="flex-1 items-center rounded-xl border border-border bg-surface py-3">
            <Text className="font-strong text-label text-ink">{L('Làm lại set này', 'Retry this set')}</Text>
          </Pressable>
          {nextSetId ? (
            <Pressable onPress={() => onNext(nextSetId)} className="flex-1 items-center rounded-xl bg-primary py-3">
              <Text className="font-strong text-label text-white">{L('Set tiếp theo →', 'Next set →')}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onExit} className="flex-1 items-center rounded-xl bg-primary py-3">
              <Text className="font-strong text-label text-white">{L('Về danh sách set', 'Back to sets')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const ctx = q.context ?? (listening ? undefined : set.context);

  return (
    <View className="gap-4 pb-12">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onExit} className="flex-row items-center gap-1">
          <Icon name="chevron-left" size={16} color="#64748B" />
          <Text className="font-mid text-label text-muted">{L('Danh sách set', 'All sets')}</Text>
        </Pressable>
        <Text className="font-strong text-label text-ink">{L(`Đúng ${score}/${Object.keys(given).length}`, `Score ${score}/${Object.keys(given).length}`)}</Text>
      </View>

      <View className="flex-row flex-wrap gap-1.5">
        {set.questions.map((_, i) => {
          const g = given[i];
          const active = i === idx;
          return (
            <Pressable key={i} onPress={() => goto(i)} className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: g ? (g.correct ? '#DCFCE7' : '#FEE2E2') : active ? '#6A4BD9' : '#F1F5F9', borderWidth: active ? 2 : 0, borderColor: '#6A4BD9' }}>
              <Text className="font-strong text-[12px]" style={{ color: g ? (g.correct ? '#15803D' : '#B91C1C') : active ? '#FFFFFF' : '#64748B' }}>{i + 1}</Text>
            </Pressable>
          );
        })}
      </View>

      {listening ? (
        <View className="rounded-2xl border border-border bg-surface p-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-strong text-label text-muted">{L('BÀI NGHE', 'AUDIO')} · {set.topic}</Text>
            <Pressable onPress={togglePlay} className="flex-row items-center gap-2 rounded-xl bg-primary px-4 py-2">
              <Icon name="play" size={16} color="#FFFFFF" />
              <Text className="font-strong text-label text-white">{playing ? L('Dừng', 'Stop') : L('Nghe', 'Play')}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setShowScript((v) => !v)}>
            <Text className="font-mid text-label" style={{ color: '#6A4BD9' }}>{showScript ? L('Ẩn bản ghi', 'Hide transcript') : L('Xem bản ghi (chỉ nên xem sau khi làm xong)', 'Show transcript')}</Text>
          </Pressable>
          {showScript ? (
            <ScrollView style={{ maxHeight: 260 }}>
              {lines.map((l, i) => (
                <Text key={i} className="mb-1 font-sans text-label text-ink leading-relaxed"><Text className="font-strong">{l.speaker}: </Text>{l.text}</Text>
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      {mapIdx !== undefined && set.maps?.[mapIdx] ? <MapFigure map={set.maps[mapIdx]} /> : null}

      {ctx ? (
        <View className="rounded-2xl border border-border bg-surface p-5">
          <Text className="mb-2 font-strong text-label text-muted uppercase tracking-wider">{q.context ? L('Đoạn văn', 'Paragraph') : L('Bài đọc', 'Passage')} · {set.title}</Text>
          <ScrollView style={{ maxHeight: q.context ? undefined : 340 }} nestedScrollEnabled>
            <Text className="font-sans text-body text-ink leading-relaxed">{ctx}</Text>
          </ScrollView>
        </View>
      ) : null}

      <View className="rounded-2xl border border-border bg-surface p-5">
        <Text className="font-strong text-label text-muted">{L(`Câu ${idx + 1} / ${set.questions.length}`, `Question ${idx + 1} of ${set.questions.length}`)}</Text>
        <Text className="mt-1 font-strong text-body text-ink leading-relaxed">{q.prompt}</Text>

        {options ? (
          <View className="mt-4 gap-2.5">
            {options.map((opt) => {
              const sel = (done?.answer ?? picked) === opt;
              const isAns = opt === q.answer;
              let box = 'border-border bg-surface';
              if (done) { if (isAns) box = 'border-green-500 bg-green-50'; else if (sel) box = 'border-red-500 bg-red-50'; }
              else if (sel) box = 'border-primary bg-primary/10';
              return (
                <Pressable key={opt} disabled={!!done} onPress={() => setPicked(opt)} className={`flex-row items-center gap-3 rounded-xl border p-3.5 ${box}`}>
                  <View className={`h-5 w-5 items-center justify-center rounded-full border ${sel ? 'border-primary bg-primary' : 'border-border'}`}>
                    {sel ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
                  </View>
                  <Text className="flex-1 font-sans text-body text-ink">{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <TextInput
            value={done ? done.answer : typed}
            onChangeText={setTyped}
            editable={!done}
            autoCapitalize="none"
            placeholder={L('Gõ đáp án (tối đa 3 từ hoặc số)…', 'Type your answer…')}
            placeholderTextColor="#94A3B8"
            className="mt-4 rounded-xl border border-border bg-canvas px-4 py-3 font-sans text-body text-ink outline-none"
          />
        )}

        {!done ? (
          <Pressable disabled={!(options ? picked : typed.trim())} onPress={check} className={`mt-4 items-center rounded-xl py-3 ${(options ? picked : typed.trim()) ? 'bg-primary' : 'bg-muted/30 opacity-60'}`}>
            <Text className="font-strong text-label text-white">{L('Kiểm tra', 'Check')}</Text>
          </Pressable>
        ) : null}
      </View>

      {done ? (
        <View className="gap-3 rounded-2xl border border-border bg-surface p-5">
          <Text className={`font-heavy text-cardTitle ${done.correct ? 'text-green-700' : 'text-red-700'}`}>{done.correct ? L('Chính xác!', 'Correct!') : L('Chưa đúng', 'Incorrect')}</Text>
          <View className="rounded-xl border border-border bg-canvas p-3">
            <Text className="font-strong text-label text-muted">{L('ĐÁP ÁN', 'ANSWER')}</Text>
            <Text className="mt-0.5 font-heavy text-body text-ink">{(q.answer.split('|')[0] ?? '').trim()}</Text>
          </View>
          {q.quote ? (
            <View className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <Text className="font-strong text-label text-amber-800">{L('Bằng chứng', 'Evidence')}</Text>
              <Text className="mt-1 font-sans text-body italic text-amber-950">“{q.quote}”</Text>
            </View>
          ) : null}
          <View className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <Text className="font-sans text-body text-ink leading-relaxed">{q.why}</Text>
          </View>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between pt-1">
        <Pressable disabled={idx === 0} onPress={() => goto(idx - 1)} className={`rounded-xl border border-border px-4 py-2.5 ${idx === 0 ? 'opacity-40' : 'bg-surface'}`}>
          <Text className="font-mid text-label text-ink">{L('Câu trước', 'Previous')}</Text>
        </Pressable>
        {idx < set.questions.length - 1 ? (
          <Pressable onPress={() => goto(idx + 1)} className="rounded-xl bg-primary px-5 py-2.5">
            <Text className="font-strong text-label text-white">{L('Câu tiếp', 'Next')}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={finish} className="rounded-xl bg-emerald-600 px-5 py-2.5">
            <Text className="font-strong text-label text-white">{L('Nộp bài & xem điểm', 'Finish')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
