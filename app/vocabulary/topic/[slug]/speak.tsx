import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { posIpa } from '@/data/study-decks';
import { useLocalSearchParams } from 'expo-router';
import { useDeckVisit } from '@/components/vocab/study/useDeckVisit';

import { GhostButton, GREEN, PrimaryButton, RED, SpeakButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { Icon } from '@/components/ui/Icon';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { normalizeAnswer } from '@/services/vocab/topic-study';
import { playCorrectChime } from '@/services/audio/chime';
import { useGameStore } from '@/store/useGameStore';
import { color } from '@/theme/tokens';

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

/** Bộ nhận giọng nói của trình duyệt (Chrome, Edge). Không có thì trả null. */
function makeRecognition(): Recognition | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/**
 * Phát âm: nghe mẫu, rồi tự đọc để máy nghe.
 *
 * MÁY CHẤM KHI CÓ THỂ, TỰ CHẤM KHI KHÔNG — và nói rõ đang ở chế độ nào. Chỉ
 * Chrome/Edge trên máy tính có bộ nhận giọng; trên Safari hay app di động thì
 * người học nghe mẫu rồi tự đánh giá. Giả vờ "máy chấm" khi thật ra không có
 * gì nghe cả là nói dối người học về chính kết quả của họ.
 *
 * Máy nhận giọng trả về vài phương án nghe được; chỉ cần một phương án khớp
 * từ là tính đúng — bộ nhận giọng hay nghe nhầm từ hiếm thành từ phổ biến
 * đồng âm, và đó không phải lỗi phát âm của người học.
 */
export default function SpeakScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const words = topic?.words ?? [];

  const [supported] = useState(() => makeRecognition() !== null);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string[] | null>(null);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const recRef = useRef<Recognition | null>(null);

  const word = words[index];

  useEffect(() => () => recRef.current?.stop(), []);

  const judge = (ok: boolean) => {
    setVerdict(ok);
    if (ok) {
      setCorrect((n) => n + 1);
      playCorrectChime();
    }
  };

  const listen = () => {
    if (!word || listening) return;
    const rec = makeRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.onresult = (e) => {
      const alts = Array.from(e.results[0] ?? []).map((a) => a.transcript);
      setHeard(alts);
      const target = normalizeAnswer(word.word);
      const ok = alts.some((a) => normalizeAnswer(a) === target || normalizeAnswer(a).split(' ').includes(target));
      // Game khi học chỉ tính lần MÁY nghe chấm; tự bấm "giống mẫu" thì không.
      useGameStore.getState().answer(ok, 'vocab');
      judge(ok);
    };
    rec.onerror = (e) => {
      setHeard([e.error === 'no-speech' ? '(không nghe thấy gì)' : `(lỗi micro: ${e.error})`]);
    };
    rec.onend = () => setListening(false);
    setHeard(null);
    setVerdict(null);
    setListening(true);
    rec.start();
  };

  const next = () => {
    setHeard(null);
    setVerdict(null);
    setIndex((i) => (i + 1) % Math.max(1, words.length));
  };

  useHotkeys((e) => {
    if (e.key === 'Enter' && verdict !== null) {
      e.preventDefault();
      next();
    }
  });

  if (!topic || !word) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title="Phát âm">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">Không có bộ từ này.</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  return (
    <StudyFrame backHref={`/vocabulary/topic/${slug}`} title={topic.nameVi} footer={`Từ ${index + 1} / ${words.length}  •  Đọc đúng ${correct}`} battle>
      <CrossFade swapKey={`s-${index}`}>
        <StudyCard>
          <Text className="text-center font-semi text-label uppercase tracking-[1.2px] text-muted">
            {supported ? 'Nghe mẫu, rồi bấm micro và đọc' : 'Nghe mẫu, đọc to, rồi tự đánh giá'}
          </Text>
          <View className="mt-4 items-center">
            <Text className="font-heavy text-hero text-ink">{word.word}</Text>
            <Text className="mt-1 font-sans text-bodyLg text-muted">
              {[posIpa(word), word.meaningVi].filter(Boolean).join(' · ')}
            </Text>
            <View className="mt-3">
              <SpeakButton text={word.word} rate={0.8} />
            </View>
          </View>

          {supported ? (
            <View className="mt-6 items-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bấm để đọc"
                onPress={listen}
                disabled={listening || verdict !== null}
                className="h-24 w-24 items-center justify-center rounded-pill"
                style={{ backgroundColor: listening ? RED : color.primary, opacity: verdict !== null ? 0.5 : 1 }}
              >
                <Icon name="mic" size={36} color="#FFFFFF" />
              </Pressable>
              <Text className="mt-2 font-semi text-body text-muted">{listening ? 'Đang nghe… đọc từ trên' : 'Bấm để đọc'}</Text>
              {heard ? (
                <Text className="mt-3 text-center font-sans text-body text-ink">
                  Máy nghe được: <Text className="font-strong">{heard[0]}</Text>
                </Text>
              ) : null}
            </View>
          ) : verdict === null ? (
            <View className="mt-6">
              <Text className="text-center font-sans text-body text-muted">
                Trình duyệt này chưa có bộ nhận giọng nói (chỉ Chrome hoặc Edge trên máy tính có). Bạn tự so với giọng mẫu nhé.
              </Text>
              <PrimaryButton label="Tôi đọc giống mẫu" onPress={() => judge(true)} />
              <GhostButton label="Chưa giống, đọc lại sau" onPress={() => judge(false)} />
            </View>
          ) : null}

          {verdict !== null ? (
            <View className="mt-5 rounded-2xl p-5" style={{ backgroundColor: verdict ? '#ECFDF3' : '#FFF1F2' }}>
              <Text className="font-strong text-cardTitle" style={{ color: verdict ? GREEN : RED }}>
                {verdict ? 'Phát âm rõ!' : 'Chưa khớp — nghe lại mẫu rồi thử lần nữa'}
              </Text>
              {!verdict && supported ? <GhostButton label="Thử đọc lại" onPress={() => { setVerdict(null); setHeard(null); }} /> : null}
              <PrimaryButton label="Từ tiếp theo" hint="Enter" onPress={next} />
            </View>
          ) : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
