import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { UiText } from '@/components/ja-learn/UiText';
import { Screen } from '@/components/layout/Screen';
import { HANZI_FAMILY } from '@/components/vocab/chinese/palette';
import { useChineseFonts } from '@/components/vocab/chinese/useChineseFonts';
import { JA } from '@/components/vocab/japanese/ja-art';
import { speak } from '@/components/vocab/study/StudyKit';
import { JA_LEVELS, type JaLevel } from '@/data/ja-learn';
import { JA_KANJI, jaKanjiOfLevel, makeKanjiQuiz, searchJaKanji, type JaKanji, type KanjiQuestion } from '@/data/ja-learn/kanji';

const PAGE = 120;
const RED = '#A4232F';

/** Kanji JLPT N5–N1: lưới chữ theo cấp, tìm theo chữ / âm Hán Việt / cách đọc, xem chi tiết, luyện đoán âm Hán Việt. */
export default function JaKanjiScreen() {
  useChineseFonts();
  const [level, setLevel] = useState<JaLevel>(5);
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [picked, setPicked] = useState<JaKanji | null>(null);
  const [quiz, setQuiz] = useState(false);
  const searching = query.trim().length > 0;
  const list = useMemo(() => (searching ? searchJaKanji(query) : jaKanjiOfLevel(level)), [searching, query, level]);
  const visible = list.slice(0, shown);

  return (
    <Screen>
      <View style={{ padding: 20, borderRadius: 24, backgroundColor: JA.green, gap: 4 }}>
        <UiText style={{ fontSize: 13, letterSpacing: 1.4, fontWeight: '400', color: JA.heroEyebrow }}>CHỮ HÁN TIẾNG NHẬT · JLPT N5 → N1</UiText>
        <UiText style={{ fontSize: 32, lineHeight: 40, fontWeight: '400', color: JA.heroTitle, fontFamily: HANZI_FAMILY as never }}>漢字 · Kanji</UiText>
        <UiText style={{ fontSize: 15, color: JA.goldSoft }}>{JA_KANJI.length.toLocaleString('vi-VN')} chữ, có âm Hán Việt, âm On/Kun và từ thường gặp.</UiText>
      </View>

      <TextInput
        value={query}
        onChangeText={(t) => {
          setQuery(t);
          setShown(PAGE);
          setPicked(null);
        }}
        accessibilityLabel="Tìm kanji"
        placeholder="Tìm chữ, âm Hán Việt, cách đọc hoặc nghĩa (vd. 食, thực, taberu, water)…"
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
                  setShown(PAGE);
                  setPicked(null);
                  setQuiz(false);
                }}
                style={{ flexGrow: 1, flexBasis: 90, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: active ? JA.green2 : JA.card, borderWidth: 1.5, borderColor: active ? JA.green2 : JA.goldLine }}
              >
                <UiText style={{ fontSize: 20, fontWeight: '400', color: active ? '#FFFFFF' : JA.ink }}>N{lv}</UiText>
                <UiText style={{ fontSize: 13, color: active ? JA.goldSoft : JA.ink2 }}>{jaKanjiOfLevel(lv).length} chữ</UiText>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <UiText style={{ marginTop: 14, fontSize: 14, color: JA.ink2 }}>{list.length ? `${list.length} chữ khớp ở mọi cấp` : 'Không có chữ nào khớp.'}</UiText>
      )}

      {!searching ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setQuiz((q) => !q)}
          style={{ alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 999, backgroundColor: quiz ? JA.card : RED, borderWidth: 1.5, borderColor: RED }}
        >
          <UiText style={{ fontWeight: '400', color: quiz ? RED : '#FFFFFF' }}>{quiz ? 'Xem lưới chữ' : `Luyện đoán âm Hán Việt N${level}`}</UiText>
        </Pressable>
      ) : null}

      <View style={{ marginTop: 14, marginBottom: 30, gap: 14 }}>
        {quiz && !searching ? (
          <KanjiQuiz level={level} onExit={() => setQuiz(false)} />
        ) : (
          <>
            {picked ? <Detail k={picked} onClose={() => setPicked(null)} /> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {visible.map((k) => (
                <Pressable
                  key={k.c}
                  accessibilityRole="button"
                  accessibilityLabel={`${k.c} ${k.hv[0] ?? ''}`}
                  onPress={() => setPicked(picked?.c === k.c ? null : k)}
                  style={{ width: 84, paddingVertical: 10, alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: picked?.c === k.c ? JA.green2 : JA.goldLine, backgroundColor: picked?.c === k.c ? JA.greenSoft : JA.card }}
                >
                  <UiText style={{ fontSize: 34, lineHeight: 44, color: JA.ink, fontFamily: HANZI_FAMILY as never }}>{k.c}</UiText>
                  <UiText numberOfLines={1} style={{ fontSize: 13, color: JA.green2, fontWeight: '700' }}>{k.hv[0]}</UiText>
                  {searching ? <UiText style={{ fontSize: 11, color: JA.ink2 }}>N{k.lv}</UiText> : null}
                </Pressable>
              ))}
            </View>
            {list.length > shown ? (
              <Pressable accessibilityRole="button" onPress={() => setShown((n) => n + PAGE)} style={{ alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 999, borderWidth: 1.5, borderColor: JA.green2 }}>
                <UiText style={{ fontWeight: '400', color: JA.green2 }}>{`Hiện thêm (${list.length - shown} chữ nữa)`}</UiText>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: string }) {
  if (!children) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <UiText style={{ width: 92, fontSize: 13, letterSpacing: 0.8, fontWeight: '400', color: JA.ink2 }}>{label}</UiText>
      <UiText style={{ flex: 1, fontSize: 17, lineHeight: 25, color: JA.ink, fontFamily: HANZI_FAMILY as never }}>{children}</UiText>
    </View>
  );
}

function Detail({ k, onClose }: { k: JaKanji; onClose: () => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: JA.green2, backgroundColor: JA.card }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Nghe ${k.c}`} onPress={() => speak(k.kun[0]?.split('.')[0] ?? k.on[0] ?? k.c, { language: 'ja', rate: 0.8 })} style={{ width: 120, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <UiText style={{ fontSize: 84, lineHeight: 100, color: JA.ink, fontFamily: HANZI_FAMILY as never }}>{k.c}</UiText>
        <UiText style={{ fontSize: 13, color: JA.ink2 }}>{`N${k.lv} · ${k.st ?? '?'} nét · 🔊`}</UiText>
      </Pressable>
      <View style={{ flex: 1, minWidth: 240, gap: 8 }}>
        <Row label="HÁN VIỆT">{k.hv.join(', ').toUpperCase()}</Row>
        <Row label="NGHĨA">{k.en.join(', ')}</Row>
        <Row label="ÂM ON">{k.on.join('、')}</Row>
        <Row label="ÂM KUN">{k.kun.join('、')}</Row>
        <Row label="TỪ THƯỜNG GẶP">{k.w.join('、')}</Row>
      </View>
      <Pressable accessibilityRole="button" onPress={onClose} style={{ position: 'absolute', right: 12, top: 8, padding: 6 }}>
        <UiText style={{ fontSize: 14, color: JA.ink2 }}>Đóng</UiText>
      </Pressable>
    </View>
  );
}

function KanjiQuiz({ level, onExit }: { level: JaLevel; onExit: () => void }) {
  const [round, setRound] = useState(0);
  const qs: KanjiQuestion[] = useMemo(() => makeKanjiQuiz(level, 10), [level, round]);
  const [at, setAt] = useState(0);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const q = qs[at];

  if (!q) {
    return (
      <View style={{ gap: 12, padding: 18, borderRadius: 20, backgroundColor: JA.card, borderWidth: 1.5, borderColor: JA.goldLine }}>
        <UiText style={{ fontSize: 13, letterSpacing: 1.4, fontWeight: '400', color: JA.green2 }}>KẾT QUẢ · N{level}</UiText>
        <UiText style={{ fontSize: 34, fontWeight: '400', color: JA.green }}>
          {score}/{qs.length}
        </UiText>
        {wrong.length ? <UiText style={{ fontSize: 16, lineHeight: 24, color: JA.ink2, fontFamily: HANZI_FAMILY as never }}>Ôn lại: {wrong.join('  ·  ')}</UiText> : <UiText style={{ fontSize: 15, color: JA.ink2 }}>Đúng hết. Thử cấp tiếp theo nhé.</UiText>}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setRound((r) => r + 1);
              setAt(0);
              setPickedIdx(null);
              setScore(0);
              setWrong([]);
            }}
            style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: JA.green2 }}
          >
            <UiText style={{ color: '#FFFFFF', fontWeight: '400' }}>Làm lại</UiText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onExit} style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, borderWidth: 1.5, borderColor: JA.green2 }}>
            <UiText style={{ color: JA.green2, fontWeight: '400' }}>Về lưới chữ</UiText>
          </Pressable>
        </View>
      </View>
    );
  }

  const choose = (i: number) => {
    if (pickedIdx !== null) return;
    setPickedIdx(i);
    if (i === q.answer) setScore((s) => s + 1);
    else setWrong((w) => [...w, `${q.kanji.c} ${q.kanji.hv[0]}`]);
  };

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
      <View style={{ alignItems: 'center', gap: 4 }}>
        <UiText style={{ fontSize: 96, lineHeight: 112, color: JA.ink, fontFamily: HANZI_FAMILY as never }}>{q.kanji.c}</UiText>
        <UiText style={{ fontSize: 14, color: JA.ink2 }}>{q.kanji.en.slice(0, 2).join(', ')}</UiText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {q.options.map((o, i) => {
          const show = pickedIdx !== null;
          const isAns = i === q.answer;
          const bg = !show ? '#FFFFFF' : isAns ? '#DFF1E3' : i === pickedIdx ? '#FBE3E1' : '#FFFFFF';
          const bd = !show ? JA.goldLine : isAns ? '#2E7D4F' : i === pickedIdx ? '#B3261E' : JA.goldLine;
          return (
            <Pressable key={o} accessibilityRole="button" onPress={() => choose(i)} style={{ flexGrow: 1, flexBasis: 120, padding: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: bd, backgroundColor: bg }}>
              <UiText style={{ fontSize: 20, fontWeight: '700', color: JA.ink, textTransform: 'uppercase' }}>{o}</UiText>
            </Pressable>
          );
        })}
      </View>
      {pickedIdx !== null ? (
        <View style={{ gap: 6 }}>
          <UiText style={{ fontSize: 15, color: JA.ink, fontFamily: HANZI_FAMILY as never }}>
            {`${q.kanji.c} · ${q.kanji.hv.join(', ')} · ${[...q.kanji.on, ...q.kanji.kun].slice(0, 4).join('、')}`}
          </UiText>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setAt((n) => n + 1);
              setPickedIdx(null);
            }}
            style={{ alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: JA.green2 }}
          >
            <UiText style={{ color: '#FFFFFF', fontWeight: '400' }}>{at + 1 >= qs.length ? 'Xem kết quả' : 'Câu tiếp'}</UiText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
