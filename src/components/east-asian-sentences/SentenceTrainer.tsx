import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { JA } from '@/components/vocab/japanese/ja-art';
import { HANZI_FAMILY, ZH } from '@/components/vocab/chinese/palette';
import { useChineseFonts } from '@/components/vocab/chinese/useChineseFonts';
import { speak } from '@/components/vocab/study/StudyKit';
import { gradeCjk, isCjkPass, type CjkGrade } from '@/services/east-asian-sentences/grade';
import { distractorsVi, levelsWithSentences, pickRound, sentencesOf, shuffled, type EaLang, type EaSentence } from '@/services/east-asian-sentences/pool';

export type TrainerMode = 'dictation' | 'translate';
type Direction = 'vi2t' | 't2vi';

const THEME = {
  zh: { main: ZH.seal, soft: ZH.goldSoftBg, card: ZH.card, line: ZH.line, ink: ZH.ink, ink2: ZH.ink2, onMain: '#FFFBF3', gold: ZH.gold2, name: 'tiếng Trung', zhTitle: '汉语' },
  ja: { main: JA.green, soft: JA.goldSoft, card: JA.card, line: JA.goldLine, ink: JA.ink, ink2: JA.ink2, onMain: JA.heroTitle, gold: JA.heroEyebrow, name: 'tiếng Nhật', zhTitle: '日本語' },
} as const;
const OK = '#2E7D4F';
const BAD = '#B3261E';
const EXTRA = '#B26A00';
const ROUND = 10;

function Chip({ label, active, onPress, t }: { label: string; active: boolean; onPress: () => void; t: (typeof THEME)[EaLang] }) {
  return (
    <Pressable accessibilityRole="button" aria-pressed={active} onPress={onPress} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: active ? t.main : t.line, backgroundColor: active ? t.main : t.card }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: active ? t.onMain : t.ink }}>{label}</Text>
    </Pressable>
  );
}

function Btn({ label, onPress, t, primary = true, disabled }: { label: string; onPress: () => void; t: (typeof THEME)[EaLang]; primary?: boolean; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: primary ? t.main : t.card, borderWidth: 1.5, borderColor: primary ? t.main : t.line, opacity: disabled ? 0.45 : 1 }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: primary ? t.onMain : t.ink }}>{label}</Text>
    </Pressable>
  );
}

function GradedText({ g, size = 26 }: { g: CjkGrade; size?: number }) {
  return (
    <Text style={{ fontFamily: HANZI_FAMILY, fontSize: size, lineHeight: size * 1.5 }}>
      {g.source.map((c, i) => (
        <Text key={i} style={{ color: c.status === 'missing' ? BAD : c.status === 'correct' ? OK : '#6E6E6E', textDecorationLine: c.status === 'missing' ? 'underline' : 'none' }}>{c.ch}</Text>
      ))}
    </Text>
  );
}

/** Nghe chép chính tả và dịch câu cho tiếng Trung / tiếng Nhật: câu lấy từ ví dụ của kho từ vựng theo cấp HSK / JLPT. */
export function SentenceTrainer({ lang, mode }: { lang: EaLang; mode: TrainerMode }) {
  useChineseFonts();
  const t = THEME[lang];
  const levels = useMemo(() => levelsWithSentences(lang), [lang]);
  const [level, setLevel] = useState<string>(levels[0] ?? '');
  const [dir, setDir] = useState<Direction>('vi2t');
  const [round, setRound] = useState<EaSentence[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [grade, setGrade] = useState<CjkGrade | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [score, setScore] = useState(0);

  const cur = round?.[idx] ?? null;
  const choiceMode = mode === 'translate' && dir === 't2vi';
  const checked = choiceMode ? picked !== null : grade !== null;
  const title = mode === 'dictation' ? 'Nghe chép chính tả' : 'Dịch câu';

  useEffect(() => {
    if (!cur || !choiceMode) return;
    setOptions(shuffled([cur.vi, ...distractorsVi(cur)]));
  }, [cur, choiceMode]);

  useEffect(() => {
    if (cur && mode === 'dictation') speak(cur.text, { language: lang, rate: 0.85 });
  }, [cur, mode, lang]);

  const start = () => {
    setRound(pickRound(lang, level, ROUND));
    setIdx(0);
    setScore(0);
    reset();
  };
  function reset() {
    setTyped('');
    setGrade(null);
    setPicked(null);
    setHint(false);
  }
  const check = () => {
    if (!cur) return;
    if (choiceMode) return;
    const g = gradeCjk(cur.text, typed);
    setGrade(g);
    if (isCjkPass(g)) setScore((s) => s + 1);
  };
  const choose = (i: number) => {
    if (!cur || picked !== null) return;
    setPicked(i);
    if (options[i] === cur.vi) setScore((s) => s + 1);
  };
  const next = () => {
    reset();
    setIdx((i) => i + 1);
  };
  const done = round !== null && idx >= round.length;

  const card = { backgroundColor: t.card, borderRadius: 22, borderWidth: 1.5, borderColor: t.line, padding: 20 } as const;

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: t.line, backgroundColor: t.card }}>
        <Text style={{ fontWeight: '700', color: t.ink }}>‹ Quay lại</Text>
      </Pressable>

      <View style={{ ...card, backgroundColor: t.main, borderColor: t.gold, marginTop: 14 }}>
        <Text style={{ fontSize: 13, letterSpacing: 1.2, color: t.gold, fontWeight: '700' }}>{t.name.toUpperCase()}</Text>
        <Text style={{ fontSize: 30, lineHeight: 38, fontWeight: '800', color: t.onMain, marginTop: 4 }}>{title}</Text>
        <Text style={{ fontSize: 15, color: t.onMain, opacity: 0.9, marginTop: 6 }}>
          {mode === 'dictation' ? 'Nghe câu rồi gõ lại đúng chữ Hán/kana đã nghe. Dấu câu không tính.' : dir === 'vi2t' ? `Đọc câu tiếng Việt rồi gõ câu ${t.name} tương ứng.` : `Đọc câu ${t.name}, chọn nghĩa tiếng Việt đúng.`}
        </Text>
      </View>

      {round === null ? (
        <View style={{ ...card, marginTop: 16, gap: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: t.ink }}>{lang === 'zh' ? 'Chọn cấp HSK' : 'Chọn cấp JLPT'}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {levels.map((l) => <Chip key={l} t={t} label={`${l.replace('JLPT ', '')} · ${sentencesOf(lang, l).length} câu`} active={l === level} onPress={() => setLevel(l)} />)}
          </View>
          {mode === 'translate' ? (
            <>
              <Text style={{ fontSize: 16, fontWeight: '800', color: t.ink }}>Hướng dịch</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <Chip t={t} label={`Việt → ${lang === 'zh' ? 'Trung' : 'Nhật'} (gõ)`} active={dir === 'vi2t'} onPress={() => setDir('vi2t')} />
                <Chip t={t} label={`${lang === 'zh' ? 'Trung' : 'Nhật'} → Việt (chọn)`} active={dir === 't2vi'} onPress={() => setDir('t2vi')} />
              </View>
            </>
          ) : null}
          <View style={{ flexDirection: 'row' }}><Btn t={t} label={`Bắt đầu · ${ROUND} câu`} onPress={start} disabled={!level} /></View>
        </View>
      ) : done ? (
        <View style={{ ...card, marginTop: 16, gap: 12 }}>
          <Text style={{ fontSize: 15, color: t.ink2 }}>Kết quả {level}</Text>
          <Text style={{ fontSize: 44, fontWeight: '800', color: t.main }}>{score}/{round.length}</Text>
          <Text style={{ fontSize: 15, color: t.ink }}>{score >= 9 ? 'Rất chắc. Thử cấp cao hơn nhé.' : score >= 6 ? 'Khá ổn. Làm thêm một lượt để chắc hơn.' : 'Chưa chắc. Làm lại cấp này, nghe kỹ từng câu.'}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Btn t={t} label="Làm lượt mới" onPress={start} />
            <Btn t={t} primary={false} label="Đổi cấp" onPress={() => setRound(null)} />
          </View>
        </View>
      ) : cur ? (
        <View style={{ ...card, marginTop: 16, gap: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: t.ink2 }}>{level} · Câu {idx + 1}/{round.length} · Đúng {score}</Text>

          {mode === 'dictation' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Btn t={t} label="Nghe lại" onPress={() => speak(cur.text, { language: lang, rate: 0.85 })} />
              <Btn t={t} primary={false} label="Nghe chậm" onPress={() => speak(cur.text, { language: lang, rate: 0.55 })} />
              <Btn t={t} primary={false} label={hint ? 'Ẩn gợi ý' : 'Gợi ý nghĩa'} onPress={() => setHint((h) => !h)} />
            </View>
          ) : choiceMode ? (
            <View style={{ gap: 8 }}>
              <Text style={{ fontFamily: HANZI_FAMILY, fontSize: 30, lineHeight: 44, color: t.main, fontWeight: '700' }}>{cur.text}</Text>
              {lang === 'zh' && cur.reading && (hint || checked) ? <Text style={{ fontSize: 15, color: t.ink2 }}>{cur.reading}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <Btn t={t} primary={false} label="Nghe" onPress={() => speak(cur.text, { language: lang, rate: 0.85 })} />
                {lang === 'zh' && cur.reading ? <Btn t={t} primary={false} label={hint ? 'Ẩn pinyin' : 'Hiện pinyin'} onPress={() => setHint((h) => !h)} /> : null}
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 22, lineHeight: 32, fontWeight: '700', color: t.ink }}>{cur.vi}</Text>
          )}

          {mode === 'dictation' && hint ? (
            <Text style={{ fontSize: 15, color: t.ink2 }}>Nghĩa: {cur.vi} · {Array.from(cur.text).filter((c) => /[\p{L}\p{N}]/u.test(c)).length} ký tự</Text>
          ) : null}

          {choiceMode ? (
            <View style={{ gap: 10 }}>
              {options.map((o, i) => {
                const right = o === cur.vi;
                const show = picked !== null;
                const bg = show ? (right ? '#DDEFE3' : i === picked ? '#F7D9D5' : t.card) : t.card;
                const bd = show ? (right ? OK : i === picked ? BAD : t.line) : t.line;
                return (
                  <Pressable key={i} accessibilityRole="button" onPress={() => choose(i)} style={{ padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: bd, backgroundColor: bg }}>
                    <Text style={{ fontSize: 16, lineHeight: 23, color: t.ink }}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <TextInput
              value={typed}
              onChangeText={setTyped}
              editable={grade === null}
              multiline
              autoCorrect={false}
              autoCapitalize="none"
              placeholder={lang === 'zh' ? '请输入汉字…' : '日本語で入力…'}
              placeholderTextColor="#9A9A9A"
              onSubmitEditing={check}
              style={{ minHeight: 72, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: t.line, backgroundColor: '#FFFFFF', fontFamily: HANZI_FAMILY, fontSize: 24, color: t.ink }}
            />
          )}

          {checked ? (
            <View style={{ gap: 6, padding: 14, borderRadius: 16, backgroundColor: t.soft }}>
              {!choiceMode && grade ? (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isCjkPass(grade) ? OK : BAD }}>{isCjkPass(grade) ? 'Đạt' : 'Chưa đạt'} · đúng {grade.correct}/{grade.total} ký tự</Text>
                  <GradedText g={grade} />
                  {grade.extra.length ? <Text style={{ fontSize: 14, color: EXTRA }}>Thừa hoặc sai chỗ: {grade.extra.join(' ')}</Text> : null}
                </>
              ) : (
                <Text style={{ fontSize: 13, fontWeight: '800', color: options[picked ?? -1] === cur.vi ? OK : BAD }}>{options[picked ?? -1] === cur.vi ? 'Đúng' : 'Chưa đúng'}</Text>
              )}
              {choiceMode ? null : <Text style={{ fontSize: 14, color: t.ink2 }}>{mode === 'translate' ? `Câu gốc: ${cur.vi}` : `Nghĩa: ${cur.vi}`}</Text>}
              {lang === 'zh' && cur.reading ? <Text style={{ fontSize: 14, color: t.ink2 }}>{cur.reading}</Text> : null}
              {cur.en ? <Text style={{ fontSize: 13, color: t.ink2 }}>{cur.en}</Text> : null}
              <View style={{ flexDirection: 'row' }}>
                <Btn t={t} primary={false} label="Nghe câu đúng" onPress={() => speak(cur.text, { language: lang, rate: 0.85 })} />
              </View>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {checked ? (
              <Btn t={t} label={idx + 1 >= round.length ? 'Xem kết quả' : 'Câu tiếp'} onPress={next} />
            ) : choiceMode ? null : (
              <Btn t={t} label="Kiểm tra" onPress={check} disabled={typed.trim().length === 0} />
            )}
            {checked ? null : <Btn t={t} primary={false} label="Bỏ qua" onPress={() => { if (!choiceMode) setGrade(gradeCjk(cur.text, '')); else setPicked(-1); }} />}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
