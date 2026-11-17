import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { GrammarPractice } from '@/components/ja-learn/GrammarPractice';
import { UiText } from '@/components/ja-learn/UiText';
import { Screen } from '@/components/layout/Screen';
import { HANZI_FAMILY } from '@/components/vocab/chinese/palette';
import { useChineseFonts } from '@/components/vocab/chinese/useChineseFonts';
import { JA } from '@/components/vocab/japanese/ja-art';
import { speak } from '@/components/vocab/study/StudyKit';
import { JA_GRAMMAR, JA_LEVELS, jaGrammarOfLevel, searchJaGrammar, type JaGrammarPoint, type JaLevel } from '@/data/ja-learn';

/** Ngữ pháp tiếng Nhật JLPT N5–N1: chọn cấp, tìm mẫu câu, mở từng điểm xem ví dụ, rồi luyện điền chỗ trống. */
export default function JaGrammarIndex() {
  useChineseFonts();
  const [level, setLevel] = useState<JaLevel>(5);
  const [query, setQuery] = useState('');
  const [practice, setPractice] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const searching = query.trim().length > 0;
  const list = useMemo(() => (searching ? searchJaGrammar(query) : jaGrammarOfLevel(level)), [searching, query, level]);

  return (
    <Screen>
      <View style={{ padding: 20, borderRadius: 24, backgroundColor: JA.green, gap: 4 }}>
        <UiText style={{ fontSize: 13, letterSpacing: 1.4, fontWeight: '400', color: JA.heroEyebrow }}>NGỮ PHÁP TIẾNG NHẬT · JLPT N5 → N1</UiText>
        <UiText style={{ fontSize: 32, lineHeight: 40, fontWeight: '400', color: JA.heroTitle, fontFamily: HANZI_FAMILY as never }}>文法 · Ngữ pháp</UiText>
        <UiText style={{ fontSize: 15, color: JA.goldSoft }}>{JA_GRAMMAR.length} mẫu câu, mỗi mẫu có ví dụ, nghe và luyện điền chỗ trống.</UiText>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        accessibilityLabel="Tìm mẫu ngữ pháp"
        placeholder="Tìm mẫu câu, nghĩa hoặc ví dụ (vd. にもかかわらず, nghe nói, nếu)…"
        placeholderTextColor={JA.ink2}
        style={{ marginTop: 14, borderRadius: 16, borderWidth: 1.5, borderColor: JA.goldLine, backgroundColor: JA.card, color: JA.ink, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: 'Nunito_400Regular' } as never}
      />

      {!searching ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }} accessibilityRole="tablist">
          {JA_LEVELS.map((lv) => {
            const active = lv === level;
            return (
              <Pressable
                key={lv}
                accessibilityRole="tab"
                aria-selected={active}
                onPress={() => {
                  setLevel(lv);
                  setOpen(null);
                  setPractice(false);
                }}
                style={{ flexGrow: 1, flexBasis: 90, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: active ? JA.green2 : JA.card, borderWidth: 1.5, borderColor: active ? JA.green2 : JA.goldLine }}
              >
                <UiText style={{ fontSize: 20, fontWeight: '400', color: active ? '#FFFFFF' : JA.ink }}>N{lv}</UiText>
                <UiText style={{ fontSize: 13, color: active ? JA.goldSoft : JA.ink2 }}>{jaGrammarOfLevel(lv).length} mẫu</UiText>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <UiText style={{ marginTop: 14, fontSize: 14, color: JA.ink2 }}>{list.length ? `${list.length} mẫu khớp ở mọi cấp` : 'Không có mẫu nào khớp.'}</UiText>
      )}

      {!searching ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setPractice((p) => !p)}
          style={{ alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 999, backgroundColor: practice ? JA.card : '#A4232F', borderWidth: 1.5, borderColor: '#A4232F' }}
        >
          <UiText style={{ fontWeight: '400', color: practice ? '#A4232F' : '#FFFFFF' }}>{practice ? 'Xem danh sách mẫu' : `Luyện điền chỗ trống N${level}`}</UiText>
        </Pressable>
      ) : null}

      <View style={{ gap: 10, marginTop: 14, marginBottom: 30 }}>
        {practice && !searching ? (
          <GrammarPractice level={level} onExit={() => setPractice(false)} />
        ) : (
          list.map((g) => <PointCard key={g.id} g={g} showLevel={searching} open={open === g.id} onToggle={() => setOpen((cur) => (cur === g.id ? null : g.id))} />)
        )}
      </View>
    </Screen>
  );
}

function Marked({ text, mark }: { text: string; mark: string }) {
  const at = text.indexOf(mark);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <UiText style={{ color: '#A4232F', fontWeight: '400', fontFamily: HANZI_FAMILY as never }}>{mark}</UiText>
      {text.slice(at + mark.length)}
    </>
  );
}

function PointCard({ g, open, onToggle, showLevel }: { g: JaGrammarPoint; open: boolean; onToggle: () => void; showLevel: boolean }) {
  return (
    <View style={{ borderRadius: 16, borderWidth: 1.5, borderColor: open ? JA.green2 : JA.goldLine, backgroundColor: JA.card, overflow: 'hidden' }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: JA.greenSoft }}>
          <UiText style={{ fontSize: 13, fontWeight: '400', color: JA.green2 }}>{showLevel ? `N${g.level}` : String(g.order).padStart(2, '0')}</UiText>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <UiText style={{ fontSize: 19, fontWeight: '400', color: JA.green, fontFamily: HANZI_FAMILY as never }}>{g.pattern}</UiText>
          <UiText style={{ fontSize: 14.5, color: JA.ink2 }}>{g.meaning}</UiText>
        </View>
        <UiText style={{ fontSize: 18, color: JA.ink2 }}>{open ? '⌃' : '⌄'}</UiText>
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
          <View style={{ padding: 10, borderRadius: 12, backgroundColor: JA.greenSoft }}>
            <UiText style={{ fontSize: 15, color: JA.ink, fontFamily: HANZI_FAMILY as never }}>{g.form}</UiText>
          </View>
          <UiText style={{ fontSize: 14.5, lineHeight: 21, color: JA.ink2 }}>{g.tip}</UiText>
          {g.examples.map((e) => (
            <Pressable key={e.ja} accessibilityRole="button" accessibilityLabel={`Nghe: ${e.ja}`} onPress={() => speak(e.ja, { language: 'ja', rate: 0.9 })} style={{ gap: 2, paddingVertical: 4 }}>
              <UiText style={{ fontSize: 20, lineHeight: 30, color: JA.ink, fontFamily: HANZI_FAMILY as never }}>
                🔊 <Marked text={e.ja} mark={e.mark} />
              </UiText>
              <UiText style={{ fontSize: 14.5, color: JA.ink2 }}>{e.vi}</UiText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
