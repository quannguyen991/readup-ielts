import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { paper, SpeakButton, ZhQuiz, ZhText } from '@/components/zh-learn/parts';
import { ZH } from '@/components/vocab/chinese/palette';
import { speak } from '@/components/vocab/study/StudyKit';
import { zhDialogueById, zhGrammarById } from '@/data/zh-learn';

/** Một bài hội thoại: bối cảnh, các câu (nghe từng câu), từ khoá, điểm ngữ pháp liên quan, rồi 5 câu kiểm tra. */
export default function ZhDialogueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const d = typeof id === 'string' ? zhDialogueById(id) : undefined;
  const [showPy, setShowPy] = useState(true);
  const [showVi, setShowVi] = useState(true);
  const [quiz, setQuiz] = useState(false);

  if (!d) {
    return (
      <Screen>
        <Text style={{ fontSize: 22, fontWeight: '400', color: ZH.ink }}>Không tìm thấy bài này.</Text>
        <Button className="mt-4 self-start" label="Về danh sách hội thoại" onPress={() => router.replace('/hoi-thoai-trung' as never)} />
      </Screen>
    );
  }

  const speakers = Array.from(new Set(d.lines.map((l) => l.who)));
  const grammar = (d.grammarIds ?? []).map((g) => zhGrammarById(g)).filter(Boolean);

  return (
    <Screen>
      <Pressable onPress={() => router.replace('/hoi-thoai-trung' as never)} accessibilityRole="link" style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: ZH.gold, backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontWeight: '700', color: ZH.ink }}>‹ Quay lại</Text>
      </Pressable>

      <View style={{ ...(paper as object), marginTop: 14 } as object}>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: ZH.goldSoftBg }}>
          <Text style={{ fontWeight: '400', color: ZH.seal, fontSize: 12 }}>HSK {d.level} · {d.topic}</Text>
        </View>
        <Text style={{ marginTop: 8, fontSize: 32, lineHeight: 38, fontWeight: '400', color: ZH.seal }}>{d.titleZh}</Text>
        <Text style={{ fontSize: 20, fontWeight: '400', color: ZH.ink }}>{d.title}</Text>
        <Text style={{ marginTop: 6, fontSize: 15, lineHeight: 22, color: ZH.ink2 }}>{d.scene}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14, alignItems: 'center' }}>
          <Toggle label="Pinyin" on={showPy} onPress={() => setShowPy((v) => !v)} />
          <Toggle label="Nghĩa Việt" on={showVi} onPress={() => setShowVi((v) => !v)} />
          <Pressable accessibilityRole="button" onPress={() => speak(d.lines.map((l) => l.zh).join(' '), { language: 'zh', rate: 0.85 })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: ZH.seal }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '400', fontSize: 14 }}>Nghe cả đoạn</Text>
          </Pressable>
        </View>
      </View>

      {!quiz ? (
        <>
          <View style={{ ...(paper as object), marginTop: 14, gap: 12 } as object}>
            {d.lines.map((l, i) => {
              const right = speakers.indexOf(l.who) % 2 === 1;
              return (
                <View key={i} style={{ flexDirection: right ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: right ? ZH.sage : ZH.seal, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '400', fontSize: 13 }}>{l.who.slice(0, 1)}</Text>
                  </View>
                  <View style={{ flexShrink: 1, maxWidth: '84%', backgroundColor: right ? ZH.sageSoft : ZH.cream2, borderRadius: 16, borderWidth: 1.5, borderColor: right ? ZH.sage : ZH.line, padding: 12, gap: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: ZH.ink2 }}>{l.who}</Text>
                    <ZhText zh={l.zh} mark={l.mark} size={22} />
                    {showPy ? <Text style={{ fontSize: 14, color: ZH.seal2 }}>{l.py}</Text> : null}
                    {showVi ? <Text style={{ fontSize: 14, color: ZH.ink2 }}>{l.vi}</Text> : null}
                  </View>
                  <SpeakButton text={l.zh} size={34} />
                </View>
              );
            })}
          </View>

          <View style={{ ...(paper as object), marginTop: 14, gap: 8 } as object}>
            <Text style={{ fontSize: 20, fontWeight: '400', color: ZH.ink }}>Từ khoá</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {d.keyWords.map((w, i) => (
                <Pressable key={i} accessibilityRole="button" onPress={() => speak(w.zh, { language: 'zh' })} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: ZH.goldSoftBg, borderWidth: 1, borderColor: ZH.line }}>
                  <Text style={{ fontSize: 18, fontWeight: '400', color: ZH.seal }}>{w.zh}</Text>
                  <Text style={{ fontSize: 12, color: ZH.seal2 }}>{w.py}</Text>
                  <Text style={{ fontSize: 13, color: ZH.ink }}>{w.vi}</Text>
                </Pressable>
              ))}
            </View>
            {grammar.length > 0 ? (
              <View style={{ marginTop: 8, gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '400', color: ZH.ink }}>Ngữ pháp xuất hiện trong bài</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {grammar.map((g) => (
                    <Pressable key={g!.id} accessibilityRole="link" onPress={() => router.push(`/ngu-phap-trung/${g!.id}` as never)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: ZH.seal }}>
                      <Text style={{ fontWeight: '400', color: ZH.seal }}>{g!.titleZh} · {g!.title}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View style={{ marginTop: 16 }}>
            <Button label="Làm 5 câu kiểm tra" iconRight="arrow-right" onPress={() => setQuiz(true)} />
          </View>
        </>
      ) : (
        <View style={{ marginTop: 14 }}>
          <ZhQuiz id={d.id} quiz={d.quiz} onAgain={() => setQuiz(false)} onBack={() => router.replace('/hoi-thoai-trung' as never)} backLabel="Về danh sách" />
        </View>
      )}
    </Screen>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" aria-checked={on} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 38, height: 22, borderRadius: 11, backgroundColor: on ? ZH.seal : ZH.line, padding: 2 }}>
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', marginLeft: on ? 16 : 0 }} />
      </View>
      <Text style={{ fontSize: 14, color: ZH.ink }}>{label}</Text>
    </Pressable>
  );
}
