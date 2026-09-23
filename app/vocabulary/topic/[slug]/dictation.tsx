import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { GhostButton, GREEN, PrimaryButton, RED, StudyCard, StudyFrame, speak, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { Icon } from '@/components/ui/Icon';
import { preferredVoice, useEnglishVoices } from '@/components/sentence/VoicePicker';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { isTypedCorrect, letterDiff } from '@/services/vocab/topic-study';
import { playCorrectChime } from '@/services/audio/chime';
import { useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';

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
  const topic = useStudyDeck(slug);
  const words = topic?.words ?? [];
  const logQuestions = useStudyStore((s) => s.logQuestions);

  const voices = useEnglishVoices();
  const [voiceIdx, setVoiceIdx] = useState(-1);
  const voice = voiceIdx >= 0 ? voices[voiceIdx % voices.length] : undefined;
  const voiceId = voice?.identifier ?? preferredVoice(voices);
  const voiceName = voice?.name ?? voices.find((v) => v.identifier === voiceId)?.name ?? 'Giọng mặc định';

  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(0.9);
  const [sentenceMode, setSentenceMode] = useState(false);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);

  const word = words[index];
  const target = word ? (sentenceMode ? word.example : word.word) : '';

  const play = () => {
    if (target) speak(target, { rate: speed, voice: voiceId });
  };

  // Đọc ngay khi sang câu mới.
  useEffect(() => {
    if (target) speak(target, { rate: speed, voice: voiceId });
    // Chỉ đọc lại khi đổi câu hoặc đổi chế độ — đổi tốc độ không tự đọc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, sentenceMode]);

  const check = () => {
    if (verdict !== null || !typed.trim() || !word) return;
    const ok = isTypedCorrect(typed, target);
    setVerdict(ok);
    if (ok) {
      setCorrect((n) => n + 1);
      playCorrectChime();
    }
    logQuestions(1);
  };

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
      <StudyFrame backHref="/vocabulary/topics" title="Nghe chép">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">Không có bộ từ này.</Text>
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
      title={topic.nameVi}
      segments={segments}
      footer={`Từ ${index + 1} / ${words.length}  •  Đúng ${correct}  •  Phím Ctrl để nghe lại`}
      right={
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: sentenceMode }}
          onPress={() => {
            setSentenceMode((v) => !v);
            setTyped('');
            setVerdict(null);
          }}
          className="flex-row items-center gap-2 rounded-pill bg-white/80 px-3 py-2"
        >
          <View className="h-5 w-9 justify-center rounded-pill px-0.5" style={{ backgroundColor: sentenceMode ? color.primary : '#CBD5E1' }}>
            <View className="h-4 w-4 rounded-pill bg-white" style={{ alignSelf: sentenceMode ? 'flex-end' : 'flex-start' }} />
          </View>
          <Text className="font-semi text-label text-ink">Chép câu ví dụ</Text>
        </Pressable>
      }
    >
      <CrossFade swapKey={`${index}:${sentenceMode}`}>
        <StudyCard>
          <Text className="text-center font-semi text-label uppercase tracking-[1.2px] text-muted">
            {sentenceMode ? 'Nghe và chép cả câu' : 'Nghe và viết từ'}
          </Text>

          <View className="mt-5 items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nghe lại"
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
                style={{ backgroundColor: speed === s ? '#EAF1FF' : '#F1F5F9', borderWidth: 1, borderColor: speed === s ? '#93B4F5' : 'transparent' }}
              >
                <Text className="font-semi text-label" style={{ color: speed === s ? color.primary : '#475569' }}>
                  {s}×
                </Text>
              </Pressable>
            ))}
            {voices.length > 1 ? (
              <Pressable onPress={() => setVoiceIdx((i) => i + 1)} className="flex-row items-center gap-1.5 rounded-pill px-3 py-1.5" style={{ backgroundColor: '#F1F5F9' }}>
                <Icon name="refresh" size={13} color="#475569" />
                <Text className="font-semi text-label" style={{ color: '#475569' }} numberOfLines={1}>
                  {voiceName}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={verdict === null}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={sentenceMode ? 'Gõ lại cả câu bạn nghe được…' : 'Nhập từ bạn nghe được…'}
            placeholderTextColor="#94A3B8"
            onSubmitEditing={check}
            className="mt-6 rounded-2xl px-5 py-4 text-center font-semi text-cardTitle text-ink"
            style={{ borderWidth: 1.5, borderColor: verdict === null ? '#CBD5E1' : verdict ? GREEN : RED, backgroundColor: '#F8FAFC' }}
          />

          {verdict === null ? (
            <>
              <PrimaryButton label="Kiểm tra" hint="Enter" disabled={!typed.trim()} onPress={check} />
              <GhostButton
                label="Tôi không biết"
                onPress={() => {
                  setVerdict(false);
                  logQuestions(1);
                }}
              />
            </>
          ) : (
            <View className="mt-5 rounded-2xl p-5" style={{ backgroundColor: verdict ? '#ECFDF3' : '#FFF1F2' }}>
              <Text className="font-strong text-cardTitle" style={{ color: verdict ? GREEN : RED }}>
                {verdict ? 'Chính xác!' : 'Đáp án đúng'}
              </Text>
              {sentenceMode ? (
                <Text className="mt-2 font-semi text-bodyLg text-ink">{word.example}</Text>
              ) : (
                <View className="mt-2 flex-row flex-wrap">
                  {letterDiff(typed, word.word).map((l, i) => (
                    <Text key={i} className="font-heavy text-pageTitle" style={{ color: verdict || l.ok ? GREEN : RED }}>
                      {l.ch}
                    </Text>
                  ))}
                </View>
              )}
              <Text className="mt-2 font-sans text-body text-muted">
                {word.word} · {word.ipa} · {word.meaningVi}
              </Text>
              <PrimaryButton label="Từ tiếp theo" hint="Enter" onPress={next} />
            </View>
          )}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
