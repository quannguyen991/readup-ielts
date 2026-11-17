import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Icon } from '@/components/ui';
import { speak } from '@/components/vocab/study/StudyKit';
import { HANZI_FAMILY, ZH } from '@/components/vocab/chinese/palette';
import { useChineseFonts } from '@/components/vocab/chinese/useChineseFonts';
import type { ZhLine, ZhQuizItem } from '@/data/zh-learn';
import { useGrammarProgressStore } from '@/store/useGrammarProgressStore';

/** Tờ giấy kem viền vàng dùng cho mọi khối nội dung học tiếng Trung. */
export const paper = {
  backgroundColor: ZH.card,
  borderRadius: 22,
  borderWidth: 1.5,
  borderColor: ZH.gold,
  padding: 22,
  boxShadow: '0 6px 22px rgba(74,26,36,0.10)',
} as object;

/** Chữ Hán có đoạn `mark` tô son. */
export function ZhText({ zh, mark, size = 22, color = ZH.ink }: { zh: string; mark?: string; size?: number; color?: string }) {
  useChineseFonts();
  const parts = mark && zh.includes(mark) ? zh.split(mark) : [zh];
  return (
    <Text style={{ fontFamily: HANZI_FAMILY, fontSize: size, lineHeight: size * 1.45, color }}>
      {parts.map((p, i) => (
        <Text key={i}>
          {p}
          {i < parts.length - 1 ? <Text style={{ color: ZH.seal, fontWeight: '800' }}>{mark}</Text> : null}
        </Text>
      ))}
    </Text>
  );
}

export function SpeakButton({ text, size = 40 }: { text: string; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Nghe"
      onPress={() => speak(text, { language: 'zh', rate: 0.85 })}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ZH.seal, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name="volume" size={Math.round(size * 0.42)} color="#FFFFFF" />
    </Pressable>
  );
}

/** Một ví dụ: chữ Hán, pinyin, nghĩa Việt và nút loa. */
export function ZhExample({ ex, showPy = true, showVi = true }: { ex: ZhLine; showPy?: boolean; showVi?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: ZH.line }}>
      <SpeakButton text={ex.zh} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <ZhText zh={ex.zh} mark={ex.mark} />
        {showPy ? <Text style={{ fontSize: 14, color: ZH.seal2, marginTop: 1 }}>{ex.py}</Text> : null}
        {showVi ? <Text style={{ fontSize: 14, color: ZH.ink2, marginTop: 2 }}>{ex.vi}</Text> : null}
      </View>
    </View>
  );
}

/** Kiểm tra cuối: không gợi ý, nộp rồi mới hiện lời giải. Ghi điểm vào kho tiến độ chung. */
export function ZhQuiz({ id, quiz, onAgain, onBack, backLabel }: { id: string; quiz: ZhQuizItem[]; onAgain: () => void; onBack: () => void; backLabel: string }) {
  const [picks, setPicks] = useState<(number | null)[]>(() => quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const record = useGrammarProgressStore((s) => s.record);
  const score = useMemo(() => quiz.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0), [quiz, picks]);
  const all = picks.every((p) => p !== null);
  return (
    <View style={{ ...paper, gap: 16 } as object}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: ZH.ink }}>Kiểm tra cuối</Text>
      <Text style={{ fontSize: 15, color: ZH.ink2 }}>{quiz.length} câu, không có gợi ý. Chọn đáp án rồi nộp bài.</Text>
      {quiz.map((q, qi) => (
        <View key={qi} style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: ZH.ink }}>{qi + 1}. {q.q}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {q.options.map((opt, oi) => {
              const on = picks[qi] === oi;
              const right = submitted && oi === q.answer;
              const wrong = submitted && on && oi !== q.answer;
              return (
                <Pressable
                  key={oi}
                  disabled={submitted}
                  accessibilityRole="radio"
                  onPress={() => setPicks((p) => p.map((v, i) => (i === qi ? oi : v)))}
                  style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: right ? ZH.sage : wrong ? '#B42318' : on ? ZH.seal : ZH.line, backgroundColor: right ? ZH.sageSoft : wrong ? ZH.dangerSoft : on ? ZH.goldSoftBg : '#FFFFFF' }}
                >
                  <Text style={{ fontSize: 16, color: ZH.ink }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
          {submitted ? <Text style={{ fontSize: 14, color: ZH.ink2, lineHeight: 20 }}>{q.explain}</Text> : null}
        </View>
      ))}
      {!submitted ? (
        <Button label="Nộp bài" disabled={!all} onPress={() => { record(id, score); setSubmitted(true); }} />
      ) : (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: score >= 4 ? ZH.sage : ZH.seal }}>{score} / {quiz.length} câu đúng</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="outline" label="Học lại từ đầu" onPress={onAgain} />
            <Button label={backLabel} onPress={onBack} />
          </View>
        </View>
      )}
    </View>
  );
}
