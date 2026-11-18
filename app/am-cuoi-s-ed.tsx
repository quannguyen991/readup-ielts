import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { useHotkeys } from '@/components/vocab/study/StudyKit';
import { Button, Card, Icon } from '@/components/ui';
import {
  ENDING_WORDS,
  RULES,
  explain,
  pickEndingQuiz,
  type EdSound,
  type EndingRule,
  type EndingWord,
  type SSound,
} from '@/data/ending-sounds';
import { useL } from '@/i18n/useL';
import { pronounce } from '@/services/audio/pronounce';
import { color } from '@/theme/tokens';

type Tab = EndingRule | 'quiz';
const QUIZ_SIZE = 10;

export default function EndingSoundsScreen() {
  const { L } = useL();
  const [tab, setTab] = useState<Tab>('ed');

  return (
    <Screen>
      <LightHero
        scene="vocab"
        badge={L('PHÁT ÂM', 'PRONUNCIATION')}
        line1={L('Đọc đuôi -s và -ed', 'Saying -s and -ed endings')}
        line2={L('Không còn bỏ âm cuối', 'Never drop the last sound')}
        subtitle={L('Ba cách đọc cho mỗi đuôi, chọn theo âm cuối của từ gốc.', 'Three ways to say each ending, chosen by the last sound of the base word.')}
      />

      <View className="mt-4 flex-row flex-wrap" style={{ gap: 8 }} accessibilityRole="tablist">
        {([
          ['ed', L('Đuôi -ed', '-ed ending')],
          ['s', L('Đuôi -s / -es', '-s / -es ending')],
          ['quiz', L('Kiểm tra', 'Test')],
        ] as const).map(([id, label]) => {
          const active = tab === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              aria-selected={active}
              onPress={() => setTab(id)}
              style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: active ? color.primary : '#FFFFFF', borderWidth: 1, borderColor: active ? color.primary : '#F3F0FB' }}
            >
              <Text className="font-semi text-label" style={{ color: active ? '#FFFFFF' : color.ink }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'quiz' ? <Quiz /> : <Rule rule={tab} />}
      <View className="h-8" />
    </Screen>
  );
}

function Rule({ rule }: { rule: EndingRule }) {
  const { L, locale } = useL();
  const info = RULES[rule];
  return (
    <View className="mt-4">
      <Text className="font-heavy text-cardTitle text-ink">{locale === 'en' ? info.titleEn : info.title}</Text>
      <Text className="mt-1 font-sans text-label text-muted">
        {L('Mẹo nhận biết: đặt tay lên cổ khi đọc âm cuối của từ gốc. Rung là âm hữu thanh, không rung là âm vô thanh.', 'Tip: put a hand on your throat when you say the last sound of the base word. If it vibrates, it is voiced.')}
      </Text>
      <View className="mt-3">
        {info.sounds.map((s) => {
          const words = ENDING_WORDS.filter((w) => w.rule === rule && w.sound === s.sound);
          return (
            <Card key={s.sound} className="mb-3">
              <View className="flex-row items-baseline" style={{ gap: 12 }}>
                <Text className="font-heavy" style={{ fontSize: 30, color: color.primary }}>{s.sound}</Text>
                <Text className="font-semi text-body text-ink min-w-0 flex-1">{locale === 'en' ? s.whenEn : s.when}</Text>
              </View>
              <Text className="mt-1 font-sans text-label text-muted">{L('Ví dụ', 'Example')}: {s.hint}</Text>
              <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
                {words.map((w) => (
                  <Pressable
                    key={w.word}
                    accessibilityRole="button"
                    accessibilityLabel={L(`Nghe ${w.word}`, `Listen to ${w.word}`)}
                    onPress={() => void pronounce(w.word)}
                    style={{ minHeight: 40, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, backgroundColor: '#F3F0FB' }}
                  >
                    <Icon name="volume" size={14} color={color.primaryDark} />
                    <Text className="font-semi text-body text-ink">{w.word}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          );
        })}
      </View>
    </View>
  );
}

type Answer = { word: EndingWord; picked: EdSound | SSound };

function Quiz() {
  const { L } = useL();
  const [round, setRound] = useState(0);
  const words = useMemo(() => pickEndingQuiz(QUIZ_SIZE, 'both'), [round]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<EdSound | SSound | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setAnswers([]);
  };

  const current = words[index];
  // Phím 1–3 chọn âm, Enter sang câu tiếp.
  useHotkeys((e) => {
    if (!current) {
      if (e.key === 'Enter') restart();
      return;
    }
    const ch: (EdSound | SSound)[] = current.rule === 'ed' ? ['/t/', '/d/', '/ɪd/'] : ['/s/', '/z/', '/ɪz/'];
    if (picked === null && /^[1-3]$/.test(e.key)) {
      const sound = ch[Number(e.key) - 1]!;
      setPicked(sound);
      setAnswers((all) => [...all, { word: current, picked: sound }]);
    } else if (picked !== null && e.key === 'Enter') {
      e.preventDefault();
      setIndex((i) => i + 1);
      setPicked(null);
    }
  });
  if (!current) {
    const right = answers.filter((a) => a.picked === a.word.sound);
    const wrong = answers.filter((a) => a.picked !== a.word.sound);
    return (
      <View className="mt-4">
        <Card>
          <Text className="font-heavy text-cardTitle text-ink">{L('Kết quả', 'Result')}</Text>
          <Text className="mt-1 font-heavy" style={{ fontSize: 32, color: right.length >= 8 ? '#15803D' : color.primary }}>
            {right.length} / {words.length}
          </Text>
          <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
            <Button label={L('Làm bộ khác', 'New set')} onPress={restart} />
          </View>
        </Card>
        {wrong.length > 0 ? (
          <View className="mt-4">
            <Text className="mb-2 font-semi text-body text-ink">{L('Cần ôn lại', 'To review')}</Text>
            {wrong.map((a) => (
              <Card key={a.word.word} className="mb-2">
                <View className="flex-row items-center justify-between" style={{ gap: 10 }}>
                  <Text className="font-heavy text-cardTitle text-ink">{a.word.word}</Text>
                  <Text className="font-heavy text-body" style={{ color: '#15803D' }}>{a.word.sound}</Text>
                </View>
                <Text className="mt-1 font-sans text-label text-muted">{explain(a.word)}</Text>
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  const choices: (EdSound | SSound)[] = current.rule === 'ed' ? ['/t/', '/d/', '/ɪd/'] : ['/s/', '/z/', '/ɪz/'];
  const answered = picked !== null;
  const choose = (s: EdSound | SSound) => {
    if (answered) return;
    setPicked(s);
    setAnswers((all) => [...all, { word: current, picked: s }]);
  };
  const next = () => {
    setIndex((i) => i + 1);
    setPicked(null);
  };

  return (
    <View className="mt-4">
      <Card key={`${round}-${index}`}>
        <Text className="font-sans text-label text-muted">{L(`Câu ${index + 1} / ${words.length}`, `Question ${index + 1} / ${words.length}`)}</Text>
        <Text className="mt-1 font-sans text-label text-muted">
          {current.rule === 'ed' ? L('Đuôi -ed đọc thế nào?', 'How is the -ed ending said?') : L('Đuôi -s / -es đọc thế nào?', 'How is the -s / -es ending said?')}
        </Text>
        <View className="mt-2 flex-row items-center" style={{ gap: 10 }}>
          <Text className="font-heavy" style={{ fontSize: 30, color: color.ink }}>{current.word}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L(`Nghe ${current.word}`, `Listen to ${current.word}`)}
            onPress={() => void pronounce(current.word)}
            style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F0FB' }}
          >
            <Icon name="volume" size={17} color={color.primaryDark} />
          </Pressable>
        </View>

        <View className="mt-4 flex-row flex-wrap" style={{ gap: 10 }}>
          {choices.map((s) => {
            const isRight = answered && s === current.sound;
            const isWrong = answered && picked === s && s !== current.sound;
            return (
              <Pressable
                key={s}
                accessibilityRole="button"
                disabled={answered}
                onPress={() => choose(s)}
                style={{ minWidth: 88, minHeight: 52, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 2, borderColor: isRight ? '#15803D' : isWrong ? '#B42318' : '#E4DFF5', backgroundColor: isRight ? '#DCFCE7' : isWrong ? '#FEE2E2' : '#FFFFFF' }}
              >
                <Text className="font-heavy" style={{ fontSize: 22, color: color.ink }}>{s}</Text>
              </Pressable>
            );
          })}
        </View>

        {answered ? (
          <>
            <Text className="mt-3 font-semi text-body" style={{ color: picked === current.sound ? '#15803D' : '#B42318' }}>
              {picked === current.sound ? L('Đúng rồi.', 'Correct.') : L('Chưa đúng.', 'Not quite.')}
            </Text>
            <Text className="mt-1 font-sans text-label text-muted">{explain(current)}</Text>
            <View className="mt-3 flex-row">
              <Button label={index + 1 >= words.length ? L('Xem kết quả', 'See result') : L('Câu tiếp', 'Next')} onPress={next} />
            </View>
          </>
        ) : null}
      </Card>
    </View>
  );
}
