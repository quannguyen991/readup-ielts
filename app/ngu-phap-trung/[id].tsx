import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button, Icon } from '@/components/ui';
import { paper, ZhExample, ZhQuiz } from '@/components/zh-learn/parts';
import { ZH } from '@/components/vocab/chinese/palette';
import { zhGrammarById, type ZhGrammarStep } from '@/data/zh-learn';

/** Phòng bài ngữ pháp tiếng Trung: mục lục bước bên trái, nội dung bước bên phải, bước cuối là kiểm tra. */
export default function ZhGrammarLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = typeof id === 'string' ? zhGrammarById(id) : undefined;
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [at, setAt] = useState(0);
  const [showPy, setShowPy] = useState(true);

  if (!lesson) {
    return (
      <Screen>
        <Text style={{ fontSize: 22, fontWeight: '400', color: ZH.ink }}>Không tìm thấy bài này.</Text>
        <Button className="mt-4 self-start" label="Về danh sách ngữ pháp" onPress={() => router.replace('/ngu-phap-trung' as never)} />
      </Screen>
    );
  }

  const steps = lesson.steps;
  const isQuiz = at === steps.length;
  const total = steps.length + 1;
  const pct = Math.round((Math.min(at, total) / total) * 100);

  return (
    <Screen>
      <Pressable onPress={() => router.replace('/ngu-phap-trung' as never)} accessibilityRole="link" style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: ZH.gold, backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontWeight: '700', color: ZH.ink }}>‹ Quay lại</Text>
      </Pressable>

      <View style={{ marginTop: 14, flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <View style={{ ...(paper as object), width: wide ? 300 : '100%', padding: 18 } as object}>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: ZH.goldSoftBg }}>
            <Text style={{ fontWeight: '400', color: ZH.seal, fontSize: 12 }}>HSK {lesson.level} · {lesson.minutes} phút</Text>
          </View>
          <Text style={{ marginTop: 10, fontSize: 30, lineHeight: 36, fontWeight: '400', color: ZH.seal }}>{lesson.titleZh}</Text>
          <Text style={{ fontSize: 20, lineHeight: 26, fontWeight: '400', color: ZH.ink }}>{lesson.title}</Text>
          <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: ZH.ink2 }}>{lesson.summary}</Text>
          <Text style={{ marginTop: 12, fontSize: 13, color: ZH.ink2 }}>Đã đi qua {pct}% bài</Text>
          <View style={{ marginTop: 14, gap: 4 }}>
            {steps.map((s, i) => (
              <StepRow key={i} label={s.label} done={i < at} active={i === at} onPress={() => setAt(i)} />
            ))}
            <StepRow label="Kiểm tra cuối" done={false} active={isQuiz} onPress={() => setAt(steps.length)} />
          </View>
          <Pressable onPress={() => setShowPy((v) => !v)} accessibilityRole="switch" aria-checked={showPy} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 38, height: 22, borderRadius: 11, backgroundColor: showPy ? ZH.seal : ZH.line, padding: 2 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', marginLeft: showPy ? 16 : 0 }} />
            </View>
            <Text style={{ fontSize: 14, color: ZH.ink }}>Hiện pinyin</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, minWidth: 0, width: wide ? undefined : '100%' }}>
          <Appear key={at} index={0}>
            {isQuiz ? (
              <ZhQuiz id={lesson.id} quiz={lesson.quiz} onAgain={() => setAt(0)} onBack={() => router.replace('/ngu-phap-trung' as never)} backLabel="Về danh sách" />
            ) : (
              <StepView step={steps[at]!} showPy={showPy} />
            )}
          </Appear>
          {!isQuiz ? (
            <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="outline" label="Bước trước" disabled={at === 0} onPress={() => setAt((v) => Math.max(0, v - 1))} />
              <Button label={at === steps.length - 1 ? 'Sang kiểm tra' : 'Tiếp tục'} iconRight="arrow-right" onPress={() => setAt((v) => Math.min(steps.length, v + 1))} />
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function StepRow({ label, done, active, onPress }: { label: string; done: boolean; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 14, backgroundColor: active ? '#FFFFFF' : 'transparent', borderWidth: active ? 1.5 : 0, borderColor: ZH.seal }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: done || active ? ZH.seal : ZH.mist, backgroundColor: done ? ZH.seal : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {done ? <Icon name="check" size={12} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <Text style={{ color: ZH.ink, fontSize: 14, fontWeight: active ? '800' : '600' }}>{label}</Text>
    </Pressable>
  );
}

function StepView({ step, showPy }: { step: ZhGrammarStep; showPy: boolean }) {
  return (
    <View style={{ ...(paper as object), padding: 24, gap: 14 } as object}>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: ZH.goldSoftBg }}>
        <Text style={{ color: ZH.seal, fontSize: 12, letterSpacing: 0.6, fontWeight: '400' }}>{step.label.toUpperCase()}</Text>
      </View>
      <Text style={{ fontSize: 26, lineHeight: 32, fontWeight: '400', color: ZH.ink }}>{step.title}</Text>
      <Text style={{ fontSize: 16, lineHeight: 25, color: ZH.ink2 }}>{step.body}</Text>
      {step.formula ? (
        <View style={{ backgroundColor: ZH.cream2, borderRadius: 14, borderWidth: 1.5, borderColor: ZH.line, padding: 14 }}>
          <Text style={{ color: ZH.seal, fontSize: 18, fontWeight: '400' }}>{step.formula}</Text>
        </View>
      ) : null}
      {step.bullets ? (
        <View style={{ gap: 8 }}>
          {step.bullets.map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ color: ZH.seal, fontSize: 16, fontWeight: '900' }}>•</Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: ZH.ink }}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {step.examples ? (
        <View style={{ gap: 4 }}>
          <Text style={{ color: ZH.ink2, fontSize: 13, letterSpacing: 0.5, fontWeight: '700' }}>VÍ DỤ</Text>
          {step.examples.map((ex, i) => (
            <ZhExample key={i} ex={ex} showPy={showPy} />
          ))}
        </View>
      ) : null}
      {step.mistakes ? (
        <View style={{ gap: 10 }}>
          {step.mistakes.map((m, i) => (
            <View key={i} style={{ borderRadius: 14, borderWidth: 1.5, borderColor: ZH.line, backgroundColor: ZH.cream2, padding: 14, gap: 6 }}>
              <Text style={{ color: '#B42318', fontSize: 17, textDecorationLine: 'line-through' }}>{m.wrong}</Text>
              <Text style={{ color: ZH.sage, fontSize: 18, fontWeight: '700' }}>{m.right}</Text>
              <Text style={{ color: ZH.ink2, fontSize: 14, lineHeight: 20 }}>{m.why}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
