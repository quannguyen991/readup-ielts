import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { NeonPageHero } from '@/components/neon/NeonPageHero';
import { Icon } from '@/components/ui/Icon';
import { TILE_TONES } from '@/components/vocab/UnitTile';
import { AWL_SUBLISTS, awlOfSublist, type AwlWord } from '@/data/awl';
import { useL } from '@/i18n/useL';
import { pronounce } from '@/services/audio/pronounce';
import { useVocabStore } from '@/store/useVocabStore';

/** Từ học thuật AWL: 2 nhóm × 60 từ, mỗi từ một thẻ màu. Nghe, đọc ví dụ, lưu vào sổ từ để ôn lặp ngắt quãng. */
const F = { reg: 'Nunito_600SemiBold', bold: 'Nunito_700Bold', black: 'Nunito_700Bold' };

/** Tô đậm từ cần học trong câu ví dụ. */
function Highlighted({ text, word }: { text: string; word: string }) {
  const i = text.toLowerCase().indexOf(word.toLowerCase().slice(0, Math.max(4, word.length - 3)));
  if (i < 0) return <>{text}</>;
  const rest = text.slice(i);
  const m = rest.match(/^[A-Za-z']+/);
  const len = m ? m[0].length : word.length;
  return (
    <>
      {text.slice(0, i)}
      <Text style={{ fontFamily: F.bold, color: '#FFFFFF', textDecorationLine: 'underline' }}>{text.slice(i, i + len)}</Text>
      {text.slice(i + len)}
    </>
  );
}

export default function AwlScreen() {
  const { L } = useL();
  const [sub, setSub] = useState<1 | 2>(1);
  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);
  const saved = useMemo(() => new Set(Object.values(entries).map((e) => e.lemma.toLowerCase())), [entries]);
  const countSaved = (n: 1 | 2) => awlOfSublist(n).filter((w) => saved.has(w.word)).length;
  const words = awlOfSublist(sub);
  const total = countSaved(1) + countSaved(2);

  const save = (w: AwlWord) =>
    saveWord({
      word: w.word,
      lemma: w.word,
      phonetic: null,
      partOfSpeech: w.pos,
      definitionContext: w.vi,
      definitionGeneral: w.example,
      definitionVi: w.vi,
      exampleSentence: w.example,
      sourceSentence: w.example,
      articleId: null,
      articleTitle: `AWL · Sublist ${w.sublist}`,
      paragraphIndex: null,
      isCollocation: false,
    });

  return (
    <Screen>
      <NeonPageHero scene="vocab" title="AWL" subtitle={L('120 từ gặp nhiều nhất trong bài đọc đại học và đề IELTS.', 'The 120 words you meet most in university reading and IELTS.')} chips={[{ label: L('Từ học thuật', 'Academic words'), icon: 'book' }, { label: `${total}/120 ${L('đã lưu', 'saved')}`, icon: 'gem' }]} />

      {/* Chọn nhóm */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }} accessibilityRole="tablist">
        {AWL_SUBLISTS.map((n) => {
          const on = n === sub;
          return (
            <Pressable
              key={n}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => setSub(n)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 22, borderRadius: 25, backgroundColor: on ? '#4338CA' : '#FFFFFF', borderWidth: 2, borderColor: on ? '#4338CA' : '#E4DFF7' }}
            >
              <Text style={{ fontFamily: F.black, fontSize: 17, color: on ? '#FFFFFF' : '#2B2350' }}>{L(`Nhóm ${n}`, `Group ${n}`)}</Text>
              <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2, backgroundColor: on ? 'rgba(255,255,255,0.22)' : '#F1ECFF' }}>
                <Text style={{ fontFamily: F.bold, fontSize: 14, color: on ? '#FFFFFF' : '#4338CA' }}>{countSaved(n)}/60</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Lưới thẻ từ */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
        {words.map((w, i) => {
          const [from, to] = TILE_TONES[i % TILE_TONES.length]!;
          const already = saved.has(w.word);
          return (
            <View
              key={w.word}
              style={
                {
                  flexGrow: 1,
                  flexBasis: 280,
                  marginTop: 12,
                  padding: 18,
                  borderRadius: 26,
                  borderTopLeftRadius: 10,
                  backgroundColor: from,
                  backgroundImage: `linear-gradient(150deg, ${from}, ${to})`,
                  boxShadow: `0 10px 24px ${to}44`,
                } as never
              }
            >
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: -11, width: 70, height: 14, borderTopLeftRadius: 10, borderTopRightRadius: 12, backgroundColor: to }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.24)' }}>
                  <Text style={{ fontFamily: F.bold, fontSize: 13, letterSpacing: 1, color: '#FFFFFF' }}>{String(i + 1).padStart(2, '0')} · {w.pos.toUpperCase()}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={L(`Nghe ${w.word}`, `Listen to ${w.word}`)} onPress={() => void pronounce(w.word)} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.28)' }}>
                  <Icon name="volume" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
              <Text style={{ marginTop: 10, fontFamily: F.black, fontSize: 32, lineHeight: 38, color: '#FFFFFF' }}>{w.word}</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 18, color: '#FFFFFF' }}>{w.vi}</Text>
              <Text style={{ marginTop: 8, fontFamily: F.reg, fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.9)' }}>
                <Highlighted text={w.example} word={w.word} />
              </Text>
              <View style={{ flex: 1, minHeight: 12 }} />
              <Pressable
                accessibilityRole="button"
                disabled={already}
                onPress={() => save(w)}
                style={{ alignSelf: 'flex-start', height: 42, paddingHorizontal: 20, borderRadius: 21, justifyContent: 'center', backgroundColor: already ? 'rgba(255,255,255,0.25)' : '#FFFFFF' }}
              >
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: already ? '#FFFFFF' : to }}>{already ? L('✓ Đã lưu', '✓ Saved') : L('+ Lưu để ôn', '+ Save to review')}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={{ height: 32 }} />
    </Screen>
  );
}
