import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { UiText } from '@/components/ja-learn/UiText';
import { HANZI_FAMILY } from '@/components/vocab/chinese/palette';
import { JA } from '@/components/vocab/japanese/ja-art';
import { makeCloze, type JaLevel } from '@/data/ja-learn';

/** Luyện điền chỗ trống: 10 câu, chọn mẫu ngữ pháp đúng; kết thúc có điểm và chỗ sai. */
export function GrammarPractice({ level, onExit }: { level: JaLevel; onExit: () => void }) {
  const [round, setRound] = useState(0);
  const qs = useMemo(() => makeCloze(level, 10), [level, round]);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const q = qs[at];
  const done = at >= qs.length;

  const restart = () => {
    setRound((r) => r + 1);
    setAt(0);
    setPicked(null);
    setScore(0);
    setWrong([]);
  };
  const choose = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
    else setWrong((w) => [...w, `${q.point.pattern} — ${q.full}`]);
  };

  if (done) {
    return (
      <View style={{ gap: 12, padding: 18, borderRadius: 20, backgroundColor: JA.card, borderWidth: 1.5, borderColor: JA.goldLine }}>
        <UiText style={{ fontSize: 13, letterSpacing: 1.4, fontWeight: '400', color: JA.green2 }}>KẾT QUẢ · N{level}</UiText>
        <UiText style={{ fontSize: 34, fontWeight: '400', color: JA.green }}>
          {score}/{qs.length}
        </UiText>
        {wrong.length ? (
          <View style={{ gap: 6 }}>
            <UiText style={{ fontSize: 15, fontWeight: '700', color: JA.ink }}>Ôn lại:</UiText>
            {wrong.map((w) => (
              <UiText key={w} style={{ fontSize: 15, lineHeight: 22, color: JA.ink2, fontFamily: HANZI_FAMILY as never }}>
                • {w}
              </UiText>
            ))}
          </View>
        ) : (
          <UiText style={{ fontSize: 15, color: JA.ink2 }}>Đúng hết. Thử cấp tiếp theo nhé.</UiText>
        )}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Pressable accessibilityRole="button" onPress={restart} style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: JA.green2 }}>
            <UiText style={{ color: '#FFFFFF', fontWeight: '400' }}>Làm lại</UiText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onExit} style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, borderWidth: 1.5, borderColor: JA.green2 }}>
            <UiText style={{ color: JA.green2, fontWeight: '400' }}>Về danh sách</UiText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 14, padding: 18, borderRadius: 20, backgroundColor: JA.card, borderWidth: 1.5, borderColor: JA.goldLine }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <UiText style={{ fontSize: 13, letterSpacing: 1.4, fontWeight: '400', color: JA.green2 }}>
          N{level} · CÂU {at + 1}/{qs.length}
        </UiText>
        <Pressable accessibilityRole="button" onPress={onExit}>
          <UiText style={{ fontSize: 14, color: JA.ink2 }}>Thoát</UiText>
        </Pressable>
      </View>
      <UiText style={{ fontSize: 24, lineHeight: 38, color: JA.ink, fontFamily: HANZI_FAMILY as never }}>
        {q!.before}
        <UiText style={{ color: JA.green2, fontWeight: '400', fontFamily: HANZI_FAMILY as never }}>{picked === null ? '＿＿＿' : q!.options[q!.answer]}</UiText>
        {q!.after}
      </UiText>
      <View style={{ gap: 8 }}>
        {q!.options.map((o, i) => {
          const isAns = i === q!.answer;
          const show = picked !== null;
          const bg = !show ? '#FFFFFF' : isAns ? '#DFF1E3' : i === picked ? '#FBE3E1' : '#FFFFFF';
          const bd = !show ? JA.goldLine : isAns ? '#2E7D4F' : i === picked ? '#B3261E' : JA.goldLine;
          return (
            <Pressable key={o} accessibilityRole="button" onPress={() => choose(i)} style={{ padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: bd, backgroundColor: bg }}>
              <UiText style={{ fontSize: 19, color: JA.ink, fontFamily: HANZI_FAMILY as never }}>{o}</UiText>
            </Pressable>
          );
        })}
      </View>
      {picked !== null ? (
        <View style={{ gap: 6 }}>
          <UiText style={{ fontSize: 15, lineHeight: 22, color: JA.ink }}>
            <UiText style={{ fontWeight: '400' }}>{q!.point.pattern}</UiText> · {q!.point.meaning}
          </UiText>
          <UiText style={{ fontSize: 15, color: JA.ink2 }}>{q!.vi}</UiText>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setAt((n) => n + 1);
              setPicked(null);
            }}
            style={{ alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: JA.green2 }}
          >
            <UiText style={{ color: '#FFFFFF', fontWeight: '400' }}>{at + 1 >= qs.length ? 'Xem kết quả' : 'Câu tiếp'}</UiText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
