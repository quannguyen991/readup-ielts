import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDeckVisit } from '@/components/vocab/study/useDeckVisit';

import { GhostButton, PrimaryButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { Icon } from '@/components/ui/Icon';
import { pronounce } from '@/services/audio/pronounce';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { isTypedCorrect, letterDiff } from '@/services/vocab/topic-study';
import { useGameStore } from '@/store/useGameStore';
import { useOwlHint } from '@/components/game/useOwlHint';
import { useStudyStore } from '@/store/useStudyStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { useStoreTheme } from '@/components/vocab/study/useStudyTheme';

const SPEEDS = [0.7, 0.9, 1] as const;

/**
 * Nghe chép từ trong bộ: máy đọc, người học gõ lại đúng chính tả.
 *
 * Bật "Chép câu ví dụ" thì máy đọc cả câu ví dụ của từ — khó hơn hẳn, và là
 * cách luyện nghe gần với phần Listening nhất mà vẫn không cần tệp âm thanh
 * nào: câu nào cũng đọc được bằng giọng tổng hợp trên máy.
 */
export default function DictationScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  const { L, en } = useL();
  const theme = useStoreTheme();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const words = topic?.words ?? [];
  const logQuestions = useStudyStore((s) => s.logQuestions);


  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(0.9);
  const [sentenceMode, setSentenceMode] = useState(false);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);

  const word = words[index];
  const sentenceAvailable = words.some((entry) => Boolean(entry.example));
  const target = word ? (sentenceMode && sentenceAvailable ? word.example : word.word) : '';
  const ttsLanguage = word?.language === 'ja' ? 'ja-JP' : word?.language === 'zh' ? 'zh-CN' : undefined;

  const play = () => {
    if (target) pronounce(target, { rate: speed, language: ttsLanguage });
  };

  // Đọc ngay khi sang câu mới.
  useEffect(() => {
    if (target) pronounce(target, { rate: speed, language: ttsLanguage });
    // Chỉ đọc lại khi đổi câu hoặc đổi chế độ — đổi tốc độ không tự đọc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, sentenceMode, ttsLanguage]);

  const check = () => {
    if (verdict !== null || !typed.trim() || !word) return;
    const ok = isTypedCorrect(typed, target);
    setVerdict(ok);
    if (ok) setCorrect((n) => n + 1);
    logQuestions(1);
    useTopicStudyStore.getState().practice(slug, word.word, ok);
    useGameStore.getState().answer(ok, 'vocab', { key: `dict:${slug}:${word.word}:${sentenceMode ? 's' : 'w'}` });
  };

  // Gợi ý của Cú: lộ một phần ba đầu của đáp án.
  useOwlHint(
    verdict === null && word
      ? () => {
          const lead = target.slice(0, Math.max(1, Math.ceil(target.length / 3)));
          if (typed.toLowerCase().startsWith(lead.toLowerCase())) return false;
          setTyped(lead);
          return true;
        }
      : null,
  );

  const next = () => {
    setTyped('');
    setVerdict(null);
    setIndex((i) => (i + 1) % Math.max(1, words.length));
  };

  useHotkeys((e) => {
    if (e.key === 'Control') {
      e.preventDefault();
      play();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (verdict === null) check();
      else next();
    }
  });

  if (!topic || !word) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title={L('Nghe chép', 'Dictation')}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">{L('Không có bộ từ này.', 'Word set not found.')}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const windowStart = Math.floor(index / 10) * 10;
  const segments = Array.from({ length: Math.min(10, words.length - windowStart) }, (_, i): 0 | 1 | 2 =>
    windowStart + i < index ? 2 : windowStart + i === index ? 1 : 0,
  );

  return (
    <StudyFrame
      backHref={`/vocabulary/topic/${slug}`}
      title={(en && (topic.kind === 'topic' || topic.kind === 'notebook') ? topic.name : topic.nameVi)}
      battle
      segments={segments}
      footer={L(
        `Từ ${index + 1} / ${words.length}  •  Đúng ${correct}  •  Phím Ctrl để nghe lại`,
        `Word ${index + 1} / ${words.length}  •  Correct ${correct}  •  Press Ctrl to replay`,
      )}
      right={sentenceAvailable ? (
        <Pressable
          accessibilityRole="switch"
          aria-checked={sentenceMode}
          onPress={() => {
            setSentenceMode((v) => !v);
            setTyped('');
            setVerdict(null);
          }}
          className="flex-row items-center gap-2 rounded-pill bg-white/80 px-3 py-2"
        >
          <View className="h-5 w-9 justify-center rounded-pill px-0.5" style={{ backgroundColor: sentenceMode ? color.primary : theme.fieldBorder }}>
            <View className="h-4 w-4 rounded-pill bg-white" style={{ alignSelf: sentenceMode ? 'flex-end' : 'flex-start' }} />
          </View>
          <Text className="font-semi text-label text-ink">{L('Chép câu ví dụ', 'Dictate example sentence')}</Text>
        </Pressable>
      ) : null}
    >
      <CrossFade swapKey={`${index}:${sentenceMode}`}>
        <StudyCard>
          <Text className="text-center font-semi text-label text-muted">
            {sentenceMode ? L('Nghe và chép cả câu', 'Listen and write the sentence') : L('Nghe và viết từ', 'Listen and write the word')}
          </Text>

          <View className="mt-5 items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={L('Nghe lại', 'Replay')}
              onPress={play}
              className="h-24 w-24 items-center justify-center rounded-pill"
              style={{ backgroundColor: color.primary }}
            >
              <Icon name="volume" size={40} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className="mt-4 flex-row flex-wrap items-center justify-center gap-2">
            {SPEEDS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSpeed(s)}
                className="rounded-pill px-3 py-1.5"
                style={{ backgroundColor: speed === s ? theme.soft : theme.soft, borderWidth: 1, borderColor: speed === s ? '#E9CE9F' : 'transparent' }}
              >
                <Text className="font-semi text-label" style={{ color: speed === s ? color.primary : '#475569' }}>
                  {s}×
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={verdict === null}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={sentenceMode ? L('Gõ lại cả câu bạn nghe được…', 'Type the sentence you heard…') : L('Nhập từ bạn nghe được…', 'Type the word you heard…')}
            placeholderTextColor={theme.muted}
            onSubmitEditing={check}
            className="mt-6 rounded-2xl px-5 py-4 text-center font-semi text-cardTitle text-ink"
            style={{ borderWidth: 1.5, borderColor: verdict === null ? theme.fieldBorder : verdict ? theme.good : theme.bad, backgroundColor: theme.field }}
          />

          {verdict === null ? (
            <>
              <PrimaryButton label={L('Kiểm tra', 'Check')} hint="Enter" disabled={!typed.trim()} onPress={check} />
              <GhostButton
                label={L('Tôi không biết', "I don't know")}
                onPress={() => {
                  setVerdict(false);
                  logQuestions(1);
                  if (word) useGameStore.getState().answer(false, 'vocab', { key: `dict:${slug}:${word.word}:${sentenceMode ? 's' : 'w'}` });
                }}
              />
            </>
          ) : (
            <View className="mt-5 rounded-2xl p-5" style={{ backgroundColor: verdict ? theme.goodBg : theme.badBg }}>
              <Text className="font-strong text-cardTitle" style={{ color: verdict ? theme.good : theme.bad }}>
                {verdict ? L('Chính xác!', 'Correct!') : L('Đáp án đúng', 'Correct answer')}
              </Text>
              {sentenceMode ? (
                <Text className="mt-2 font-semi text-bodyLg text-ink">{word.example}</Text>
              ) : (
                <View className="mt-2 flex-row flex-wrap">
                  {letterDiff(typed, word.word).map((l, i) => (
                    <Text key={i} className="font-heavy text-pageTitle" style={{ color: verdict || l.ok ? theme.good : theme.bad }}>
                      {l.ch}
                    </Text>
                  ))}
                </View>
              )}
              <Text className="mt-2 font-sans text-body text-muted">
                {word.word} · {word.ipa} · {word.meaningVi}
              </Text>
              <PrimaryButton label={L('Từ tiếp theo', 'Next word')} hint="Enter" onPress={next} />
            </View>
          )}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
