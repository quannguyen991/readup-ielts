import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { posIpa } from '@/data/study-decks';
import { useLocalSearchParams } from 'expo-router';
import { useDeckVisit } from '@/components/vocab/study/useDeckVisit';

import { GhostButton, PrimaryButton, SpeakButton, StudyCard, StudyFrame, useHotkeys } from '@/components/vocab/study/StudyKit';
import { CrossFade } from '@/components/motion/Motion';
import { Icon } from '@/components/ui/Icon';
import { useStudyDeck } from '@/components/vocab/study/useStudyDeck';
import { normalizeAnswer, type StudyWord } from '@/services/vocab/topic-study';
import { playCorrectChime } from '@/services/audio/chime';
import { useGameStore } from '@/store/useGameStore';
import { CoachBubble, CoachToggle } from '@/components/speaking/CoachKit';
import { playSfx } from '@/services/audio/sfx-ui';
import { useVoiceCoach } from '@/services/audio/useVoiceCoach';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { useStoreTheme } from '@/components/vocab/study/useStudyTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { PronounceTipCard } from '@/components/vocab/PronounceTipCard';
import type { PronounceTip } from '@/services/vocab/pronounce-tip';
import { requestPronounceTip } from '@/services/vocab/pronounce-tip-client';

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
 *
 * Lượt đọc sai còn được AI giải thích (`askTip`): AI chỉ ra âm lệch và cách sửa,
 * không chấm. Huấn luyện viên đọc lời đó bằng giọng Kore, không có Kore thì
 * đọc bằng giọng máy.
 */
export default function SpeakScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  const { L, en } = useL();
  const theme = useStoreTheme();
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
  const coach = useVoiceCoach();
  const [tip, setTip] = useState<PronounceTip | null>(null);
  const [tipNote, setTipNote] = useState<string | null>(null);
  // Tăng mỗi lần đổi lượt: câu trả lời AI đến muộn sau lượt khác sẽ bị bỏ.
  const attemptRef = useRef(0);
  const tipAbortRef = useRef<AbortController | null>(null);

  const word = words[index];

  useEffect(
    () => () => {
      attemptRef.current += 1;
      tipAbortRef.current?.abort();
      recRef.current?.stop();
    },
    [],
  );

  const judge = (ok: boolean) => {
    setVerdict(ok);
    if (ok) {
      setCorrect((n) => n + 1);
      playCorrectChime();
    }
  };

  // Đổi lượt thì bỏ nhận xét AI đang hiện, chú thích của huấn luyện viên (nó trỏ tới thẻ nhận xét), và huỷ lời hỏi còn chạy.
  const dropTip = () => {
    attemptRef.current += 1;
    tipAbortRef.current?.abort();
    tipAbortRef.current = null;
    setTip(null);
    setTipNote(null);
    coach.reset();
  };

  /**
   * Hỏi AI vì sao máy nghe lệch. Chỉ hỏi khi máy đã nghe được gì và lượt đó là lượt sai. AI
   * không chấm, chỉ giải thích: đúng hay sai vẫn do máy nhận giọng quyết.
   */
  const askTip = async (target: StudyWord, transcripts: string[], mine: number) => {
    const controller = new AbortController();
    tipAbortRef.current = controller;
    setTipNote(L('Huấn luyện viên AI đang xem lượt đọc của bạn…', 'The AI coach is reviewing your attempt…'));
    const result = await requestPronounceTip(
      { word: target.word, ipa: target.ipa, pos: target.pos, meaningVi: target.meaningVi, heard: transcripts, correct: false },
      {
        token: useAuthStore.getState().session?.access_token ?? null,
        signal: controller.signal,
        fallbackMessage: L(
          'Chưa có nhận xét AI lúc này. Bạn vẫn có lời huấn luyện viên thường.',
          'No AI tip right now. You still get the regular coach feedback.',
        ),
      },
    );
    if (mine !== attemptRef.current) return;
    tipAbortRef.current = null;
    if (!result.ok) {
      setTipNote(result.message);
      return;
    }
    setTipNote(null);
    setTip(result.tip);
    coach.showTip({
      band: 'ok',
      captionVi: 'Nhận xét chi tiết ở bên dưới. Thử lại nhé.',
      captionEn: 'The detailed tip is below. Try again.',
      say: result.tip.sayEn,
    });
  };

  const listen = () => {
    if (!word || listening) return;
    // Huấn luyện viên phải im hẳn trước khi micro mở.
    coach.stop();
    dropTip();
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
      useGameStore.getState().answer(ok, 'vocab', { key: `speak:${slug}:${word.word}` });
      judge(ok);
      coach.feedback({ score: ok ? 100 : 40, missed: ok ? [] : [word.word], sentence: word.word });
      // Không có chữ nào để so thì không hỏi AI: lời giải thích không có căn cứ.
      const transcripts = alts.map((a) => a.trim()).filter(Boolean);
      if (!ok && transcripts.length > 0) void askTip(word, transcripts, attemptRef.current);
    };
    rec.onerror = (e) => {
      setHeard([e.error === 'no-speech' ? L('(không nghe thấy gì)', '(heard nothing)') : L(`(lỗi micro: ${e.error})`, `(mic error: ${e.error})`)]);
    };
    rec.onend = () => {
      setListening(false);
      playSfx('micStop');
    };
    setHeard(null);
    setVerdict(null);
    setListening(true);
    playSfx('micStart');
    rec.start();
  };

  const next = () => {
    coach.reset();
    dropTip();
    playSfx('next');
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
      <StudyFrame backHref="/vocabulary/quiz" title={L('Phát âm', 'Pronunciation')}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">{L('Không có bộ từ này.', 'Word set not found.')}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  return (
    <StudyFrame backHref={`/vocabulary/topic/${slug}`} title={(en && (topic.kind === 'topic' || topic.kind === 'notebook') ? topic.name : topic.nameVi)} footer={L(`Từ ${index + 1} / ${words.length}  •  Đọc đúng ${correct}`, `Word ${index + 1} / ${words.length}  •  Said right ${correct}`)} battle>
      <CrossFade swapKey={`s-${index}`}>
        <StudyCard>
          <Text className="text-center font-semi text-label text-muted">
            {supported
              ? L('Nghe mẫu, rồi bấm micro và đọc', 'Listen to the model, then tap the mic and say it')
              : L('Nghe mẫu, đọc to, rồi tự đánh giá', 'Listen to the model, say it aloud, then rate yourself')}
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
                accessibilityLabel={L('Bấm để đọc', 'Tap to speak')}
                onPress={listen}
                disabled={listening || verdict !== null}
                className="h-24 w-24 items-center justify-center rounded-pill"
                style={{ backgroundColor: listening ? theme.bad : color.primary, opacity: verdict !== null ? 0.5 : 1 }}
              >
                <Icon name="mic" size={36} color="#FFFFFF" />
              </Pressable>
              <View className="mt-3"><CoachToggle /></View>
              <Text className="mt-2 font-semi text-body text-muted">{listening ? L('Đang nghe… đọc từ trên', 'Listening… say the word above') : L('Bấm để đọc', 'Tap to speak')}</Text>
              {heard ? (
                <Text className="mt-3 text-center font-sans text-body text-ink">
                  {L('Máy nghe được: ', 'The app heard: ')}<Text className="font-strong">{heard[0]}</Text>
                </Text>
              ) : null}
            </View>
          ) : verdict === null ? (
            <View className="mt-6">
              <Text className="text-center font-sans text-body text-muted">
                {L(
                  'Trình duyệt này chưa có bộ nhận giọng nói (chỉ Chrome hoặc Edge trên máy tính có). Bạn tự so với giọng mẫu nhé.',
                  'This browser has no speech recognition (only desktop Chrome or Edge do). Compare yourself with the model voice.',
                )}
              </Text>
              <PrimaryButton label={L('Tôi đọc giống mẫu', 'I matched the model')} onPress={() => judge(true)} />
              <GhostButton label={L('Chưa giống, đọc lại sau', 'Not quite — try again later')} onPress={() => judge(false)} />
            </View>
          ) : null}

          <CoachBubble coach={coach} />

          {tip ? (
            <PronounceTipCard tip={tip} />
          ) : tipNote ? (
            <Text className="mt-3 text-center font-sans text-label text-muted">{tipNote}</Text>
          ) : null}

          {verdict !== null ? (
            <View className="mt-5 rounded-2xl p-5" style={{ backgroundColor: verdict ? theme.goodBg : theme.badBg }}>
              <Text className="font-strong text-cardTitle" style={{ color: verdict ? theme.good : theme.bad }}>
                {verdict ? L('Phát âm rõ!', 'Clear pronunciation!') : L('Chưa khớp — nghe lại mẫu rồi thử lần nữa', 'No match — listen to the model and try again')}
              </Text>
              {!verdict && supported ? <GhostButton label={L('Thử đọc lại', 'Try again')} onPress={() => { coach.stop(); dropTip(); setVerdict(null); setHeard(null); }} /> : null}
              <PrimaryButton label={L('Từ tiếp theo', 'Next word')} hint="Enter" onPress={next} />
            </View>
          ) : null}
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
