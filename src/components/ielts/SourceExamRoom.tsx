import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {

  Modal,

  Platform,

  Pressable,

  ScrollView,

  Text as RNText,

  TextInput,

  View,

  useWindowDimensions,

  type TextProps,

} from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { goldLeaf } from '@/theme/tokens';

import { SECTION_MINUTES, type ExamPart, type SourcePage, type TestSection } from '@/services/ielts/source-catalog';

import type { Grade } from './ComputerDeliveredExamRoom';
import { trackAppEvent } from '@/services/analytics/app-events';

function Text(props: TextProps) {

  return <RNText {...props} />;

}

const assetUrl = (name: string) => {

  if (!name) return '';

  if (name.startsWith('http://') || name.startsWith('https://')) return name;

  return `/api/ielts/local-ocr?asset=${encodeURIComponent(name)}`;

};

function clock(seconds: number) {

  const m = Math.floor(seconds / 60).toString().padStart(2, '0');

  const s = (seconds % 60).toString().padStart(2, '0');

  return `${m}:${s}`;

}

function words(text: string) {

  return text.trim().split(/\s+/).filter(Boolean).length;

}

/** Audio player cho phần thi Listening với Web Audio API GainNode khuếch đại âm lượng to rõ */
export function SourceAudio({
  files,
  simulation,
  activePartId = 1,
  onPartChange,
  showTranscript,
  onToggleTranscript,
  hasTranscript = true,
}: {
  files: string[];
  simulation: boolean;
  activePartId?: number;
  onPartChange?: (partId: number) => void;
  showTranscript?: boolean;
  onToggleTranscript?: () => void;
  hasTranscript?: boolean;
}) {
  const player = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [manualTrack, setManualTrack] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Mức khuếch đại âm lượng: 1.0 (100%), 1.4 (140%), 1.8 (180% - To rõ mặc định), 2.2 (220% Siêu to)
  const [volumeBoost, setVolumeBoost] = useState<number>(1.8);

  const track = files.length > 1 && manualTrack === null
    ? Math.max(0, Math.min(activePartId - 1, files.length - 1))
    : (manualTrack ?? 0);

  const src = files[track] || files[0];

  const ensureWebAudioBoost = useCallback(() => {
    if (Platform.OS !== 'web' || !player.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = volumeBoost;
        gainNodeRef.current = gain;
        const srcNode = ctx.createMediaElementSource(player.current);
        sourceNodeRef.current = srcNode;
        srcNode.connect(gain);
        gain.connect(ctx.destination);
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
    } catch {
      // Ignored if already connected
    }
  }, [volumeBoost]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volumeBoost;
    }
    if (player.current) {
      player.current.volume = 1.0;
    }
  }, [volumeBoost]);

  useEffect(() => {
    if (started && !ended && player.current) {
      ensureWebAudioBoost();
      player.current.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
        setError('Bấm phát để tiếp tục audio.');
      });
    }
  }, [track, started, ended, ensureWebAudioBoost]);

  const togglePlay = () => {
    ensureWebAudioBoost();
    if (!player.current) return;
    if (isPlaying) {
      player.current.pause();
      setIsPlaying(false);
    } else {
      player.current.volume = 1.0;
      player.current.play().then(() => {
        setIsPlaying(true);
        setStarted(true);
        setError('');
      }).catch(() => {
        setError('Bấm phát để cho phép phát audio.');
      });
    }
  };

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!src) {
    return (
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#F59E0B', backgroundColor: '#F3F0FB', padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="volume" size={18} color="#6A4BD9" />
          <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: '#6A4BD9' }}>IELTS Listening Audio</Text>
        </View>
        <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: '#2B2350' }}>
          Đang chuẩn bị file audio cho bài này. Bạn có thể mở bản chép lời transcript để luyện nghe đọc song song.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#E6D7C3',
        backgroundColor: '#FFFFFF',
        padding: 18,
        gap: 14,
        boxShadow: '0 4px 16px rgba(106, 75, 217, 0.08)',
      }}
    >
      {/* Header Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F0FB', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="volume" size={16} color="#6A4BD9" />
          </View>
          <View>
            <Text style={{ fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 14, color: '#2B2350', letterSpacing: 0.2 }}>
              {files.length > 1 ? `IELTS LISTENING · PART ${track + 1}/${files.length}` : 'IELTS LISTENING · TOÀN BÀI THI'}
            </Text>
            <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 11.5, color: '#7C6552' }}>
              {simulation ? 'Thi thử như thi thật · Audio chuẩn CD IELTS' : 'Luyện tập tự do · Có thể tạm dừng và tua lại'}
            </Text>
          </View>
        </View>

        {onToggleTranscript && hasTranscript ? (
          <Pressable
            accessibilityRole="button"
            onPress={onToggleTranscript}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: showTranscript ? '#6A4BD9' : '#E6DACB',
              backgroundColor: showTranscript ? '#6A4BD9' : '#F3F0FB',
            }}
          >
            <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 12, color: showTranscript ? '#FFFFFF' : '#6A4BD9' }}>
              {showTranscript ? '✕ Ẩn Transcript' : '👁️ Mở Transcript tham khảo'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Part Switcher Pills */}
      {files.length > 1 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {files.map((_, pIdx) => {
            const active = pIdx === track;
            return (
              <Pressable
                key={pIdx}
                accessibilityRole="button"
                onPress={() => {
                  setManualTrack(pIdx);
                  setError('');
                  if (onPartChange) onPartChange(pIdx + 1);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: active ? '#6A4BD9' : '#E6DACB',
                  backgroundColor: active ? '#6A4BD9' : '#F3F0FB',
                }}
              >
                {active && <Text style={{ fontSize: 12 }}>🔊</Text>}
                <Text
                  style={{
                    fontFamily: 'BeVietnamPro_700Bold',
                    fontSize: 12.5,
                    color: active ? '#FFFFFF' : '#2B2350',
                  }}
                >
                  Part {pIdx + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Player Console: Play/Pause, Progress Bar, Time, and Volume Booster */}
      <View
        style={{
          borderRadius: 14,
          backgroundColor: '#F3F0FB',
          borderWidth: 1,
          borderColor: '#F3F0FB',
          padding: 14,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Play/Pause Button */}
          <Pressable
            accessibilityRole="button"
            onPress={togglePlay}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingHorizontal: 18,
              height: 40,
              borderRadius: 10,
              backgroundColor: isPlaying ? '#2B2350' : '#6A4BD9',
              shadowColor: '#6A4BD9',
              shadowOpacity: 0.18,
              shadowRadius: 5,
            }}
          >
            <Text style={{ fontSize: 14, color: '#FFFFFF' }}>{isPlaying ? '⏸' : '▶'}</Text>
            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#FFFFFF' }}>
              {isPlaying ? 'Tạm dừng' : started ? 'Tiếp tục phát' : 'Bắt đầu nghe'}
            </Text>
          </Pressable>

          {/* Time indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13.5, color: '#2B2350' }}>
              {formatAudioTime(currentTime)}
            </Text>
            <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: '#7C6552' }}>
              / {formatAudioTime(duration)}
            </Text>
          </View>

          {/* Volume Booster Console (Khuếch đại âm lượng to hơn) */}
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 }}>
              <Text style={{ fontSize: 13 }}>🔊</Text>
              <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: '#2B2350' }}>
                Âm lượng:
              </Text>
            </View>

            {[
              { label: '100%', val: 1.0 },
              { label: '140%', val: 1.4 },
              { label: '180% To rõ ★', val: 1.8 },
              { label: '220% Cực đại', val: 2.2 },
            ].map((v) => {
              const active = volumeBoost === v.val;
              return (
                <Pressable
                  key={v.val}
                  accessibilityRole="button"
                  onPress={() => setVolumeBoost(v.val)}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: active ? '#6A4BD9' : '#DDD2C3',
                    backgroundColor: active ? '#6A4BD9' : '#FFFFFF',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: active ? 'BeVietnamPro_700Bold' : 'BeVietnamPro_500Medium',
                      fontSize: 11.5,
                      color: active ? '#FFFFFF' : '#4B5563',
                    }}
                  >
                    {v.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Progress Bar */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: '#E6DACB',
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%`,
              backgroundColor: '#6A4BD9',
              borderRadius: 3,
            }}
          />
        </View>
      </View>

      {/* Hidden audio element for browser playback */}
      {Platform.OS === 'web' ? (
        React.createElement('audio', {
          ref: player,
          src,
          preload: 'metadata',
          onPlay: () => {
            ensureWebAudioBoost();
            setIsPlaying(true);
            setStarted(true);
          },
          onPause: () => setIsPlaying(false),
          onTimeUpdate: () => {
            if (player.current) {
              setCurrentTime(player.current.currentTime);
            }
          },
          onLoadedMetadata: () => {
            if (player.current) {
              setDuration(player.current.duration || 0);
              player.current.volume = 1.0;
            }
          },
          onEnded: () => {
            setIsPlaying(false);
            if (track + 1 < files.length) {
              setManualTrack(track + 1);
              if (onPartChange) onPartChange(track + 2);
            } else {
              setEnded(true);
            }
          },
          onError: () => setError('Không tải được audio nguồn. Vui lòng kiểm tra lại kết nối.'),
          style: { display: 'none' },
        })
      ) : null}

      {error ? (
        <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 12.5, color: '#DC2626' }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Tách văn bản trang thành các khối câu hỏi & chỉ dẫn */

export type ParsedQuestionItem = {

  number: number;

  type: 'blank' | 'choice' | 'tfng' | 'general';

  prefixText?: string;

  suffixText?: string;

  stem: string;

  options?: { letter: string; text: string }[];
  tfngOptions?: string[];

};

export type QuestionGroup = {

  rangeLabel: string;

  instruction: string;

  questions: ParsedQuestionItem[];

};

export function parsePageQuestions(text: string, qStart: number, qEnd: number): QuestionGroup[] {

  const groups: QuestionGroup[] = [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentInstruction = 'Answer the questions according to the passage:';

  let currentRange = `Questions ${qStart}–${qEnd}`;

  let groupQuestions: ParsedQuestionItem[] = [];

  for (let num = qStart; num <= qEnd; num++) {

    // Tìm dòng chứa câu hỏi

    const qRegex = new RegExp(`(?:^|\\s)(?:${num}\\b|Q${num}\\b)[.:\\s)]*\\s*(.*)`, 'i');

    let qLine = '';

    let qIndex = -1;

    for (let i = 0; i < lines.length; i++) {

      const match = lines[i]?.match(qRegex);

      if (match) {

        qLine = match[1] || lines[i] || '';

        qIndex = i;

        break;

      }

    }

    if (!qLine) {

      // Fallback nếu không khớp regex

      groupQuestions.push({

        number: num,

        type: 'blank',

        stem: `Question ${num}`,

        prefixText: `Question ${num}:`,

      });

      continue;

    }

    // Kiểm tra xem có phải trắc nghiệm Multiple Choice A, B, C, D không

    const choiceOptions: { letter: string; text: string }[] = [];

    if (qIndex !== -1) {

      for (let j = qIndex + 1; j < Math.min(lines.length, qIndex + 8); j++) {

        const nextLine = lines[j] || '';

        const optMatch = nextLine.match(/^([A-D])[.:)]\s*(.*)/i);

        if (optMatch && optMatch[1]) {

          choiceOptions.push({

            letter: optMatch[1].toUpperCase(),

            text: optMatch[2] || '',

          });

        } else if (/^\d+\b/.test(nextLine)) {

          // Gặp câu hỏi kế tiếp thì dừng

          break;

        }

      }

    }

    // Kiểm tra TRUE / FALSE / NOT GIVEN hoặc YES / NO / NOT GIVEN
    const surroundingText = text.slice(Math.max(0, (qIndex - 8) * 50), (qIndex + 3) * 50);
    const isYesNo = /YES\s*[/,]|claims|views/i.test(surroundingText) || /YES\s*[/,]|claims|views/i.test(currentInstruction);
    const isTfng =
      /TRUE|FALSE|NOT GIVEN|YES|NO/i.test(surroundingText) ||
      /TRUE|FALSE|NOT GIVEN|YES|NO/i.test(qLine);

    if (choiceOptions.length >= 3) {
      groupQuestions.push({
        number: num,
        type: 'choice',
        stem: qLine,
        options: choiceOptions,
      });
    } else if (isTfng && !qLine.includes('____') && !qLine.includes('.....')) {
      groupQuestions.push({
        number: num,
        type: 'tfng',
        stem: qLine,
        tfngOptions: isYesNo ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN'],
      });

    } else {

      // Dạng điền từ vào chỗ trống (Sentence / Note completion)

      const blankMatch = qLine.split(/(?:_{2,}|\.{3,}|\(\d+\)|\[\s*\])/);

      if (blankMatch.length > 1) {

        groupQuestions.push({

          number: num,

          type: 'blank',

          stem: qLine,

          prefixText: blankMatch[0]?.trim() || '',

          suffixText: blankMatch.slice(1).join(' ').trim(),

        });

      } else {

        groupQuestions.push({

          number: num,

          type: 'blank',

          stem: qLine,

          prefixText: qLine,

        });

      }

    }

  }

  // Nhóm lại thành các phân đoạn 1–3, 4–7, 8–13

  const step = Math.min(5, Math.ceil(groupQuestions.length / 2) || 4);

  for (let i = 0; i < groupQuestions.length; i += step) {

    const chunk = groupQuestions.slice(i, i + step);

    const startNum = chunk[0]?.number ?? qStart;

    const endNum = chunk[chunk.length - 1]?.number ?? qEnd;

    const firstType = chunk[0]?.type;

    let inst = 'Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.';

    if (firstType === 'choice') inst = 'Choose the correct letter, A, B, C or D.';

    else if (firstType === 'tfng') inst = chunk[0]?.tfngOptions?.[0] === 'YES' ? 'Do the following statements agree with the claims/views of the writer? Write YES, NO or NOT GIVEN.' : 'Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.';

    groups.push({

      rangeLabel: `Questions ${startNum}–${endNum}`,

      instruction: inst,

      questions: chunk,

    });

  }

  return groups.length > 0 ? groups : [{ rangeLabel: currentRange, instruction: currentInstruction, questions: groupQuestions }];

}

export function SourceExamRoom({

  test,

  simulation: requestedSimulation,

  answers,

  onAnswerChange,

  onSubmit,

  onExit,

  grade,

  submitted,

  supportPages,

  loading,

}: {

  test: {

    id: string;

    title: string;

    section?: TestSection;

    questionCount: number;

    pages: SourcePage[];

    parts?: ExamPart[];

    audioFiles: string[];

    audioCloudUrl?: string;

    sourceUrl?: string;

    externalOnly: boolean;

    missingComponents?: string[];

  };

  simulation: boolean;

  answers: Record<string, string>;

  onAnswerChange: (number: number, value: string) => void;

  onSubmit: () => void;

  onExit: () => void;

  grade: Grade | null;

  submitted: boolean;

  supportPages: SourcePage[];

  loading?: boolean;

}) {

  useEffect(() => {
    trackAppEvent('start_lesson');
  }, []);

  useEffect(() => {
    if (submitted) trackAppEvent('complete_lesson');
  }, [submitted]);

  const { width: winW } = useWindowDimensions();

  const isDesktop = winW >= 1024;

  const section = test.section ?? 'Reading';

  const simulation = requestedSimulation && !test.missingComponents?.includes('audio');

  const parts = test.parts ?? [];

  const [activePartId, setActivePartId] = useState(parts[0]?.id ?? 1);

  const [activeQuestion, setActiveQuestion] = useState<number>(parts[0]?.questionStart ?? 1);

  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // Tùy chỉnh phòng thi: cỡ chữ, màu nền, mặt chữ

  const [fontSizeLevel, setFontSizeLevel] = useState<15 | 17 | 19>(15);

  const [themeMode, setThemeMode] = useState<'light' | 'warm' | 'dark'>('light');

  // Audio control state for Listening Exam Room (Image 2)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioIsPlaying, setAudioIsPlaying] = useState<boolean>(false);
  const [audioVolumeBoost] = useState<number>(1.8); // 180% default boost

  // Get active audio track URL
  const activeAudioTrackUrl = useMemo(() => {
    if (!test.audioFiles || test.audioFiles.length === 0) {
      return test.audioCloudUrl || '';
    }
    const idx = Math.max(0, Math.min(activePartId - 1, test.audioFiles.length - 1));
    return assetUrl(test.audioFiles[idx] || test.audioFiles[0] || '');
  }, [test.audioFiles, test.audioCloudUrl, activePartId]);

  // Audio volume amplifier setup
  const setupAudioGain = useCallback(() => {
    if (Platform.OS !== 'web' || !audioPlayerRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = audioVolumeBoost;
        audioGainRef.current = gain;
        const src = ctx.createMediaElementSource(audioPlayerRef.current);
        audioSourceNodeRef.current = src;
        src.connect(gain);
        gain.connect(ctx.destination);
      }
      if (audioContextRef.current.state === 'suspended') {
        void audioContextRef.current.resume();
      }
    } catch {
      // Ignore if already connected
    }
  }, [audioVolumeBoost]);

  useEffect(() => {
    if (audioGainRef.current) {
      audioGainRef.current.gain.value = audioVolumeBoost;
    }
  }, [audioVolumeBoost]);

  const toggleAudioPlay = useCallback(() => {
    setupAudioGain();
    if (!audioPlayerRef.current) return;
    if (audioIsPlaying) {
      audioPlayerRef.current.pause();
      setAudioIsPlaying(false);
    } else {
      audioPlayerRef.current.volume = 1.0;
      audioPlayerRef.current.play().then(() => setAudioIsPlaying(true)).catch(() => setAudioIsPlaying(false));
    }
  }, [audioIsPlaying, setupAudioGain]);

  const handleSeekWaveform = useCallback((percent: number) => {
    if (!audioPlayerRef.current || !audioDuration) return;
    const newSec = Math.max(0, Math.min(audioDuration, percent * audioDuration));
    audioPlayerRef.current.currentTime = newSec;
    setAudioCurrentTime(newSec);
  }, [audioDuration]);

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const WAVEFORM_HEIGHTS = useMemo(() => [
    10, 16, 24, 18, 14, 26, 32, 22, 16, 28, 36, 24, 18, 22, 30, 26, 14, 20, 32, 38,
    22, 16, 24, 34, 26, 18, 22, 30, 24, 14, 20, 28, 36, 22, 16, 24, 32, 28, 18, 22,
    30, 24, 14, 20, 32, 36, 22, 16, 24, 34, 26, 18, 20, 28, 22, 16, 24, 30, 26, 18,
    14, 22, 30, 24, 16, 20, 28, 22, 14, 18,
  ], []);


  const [timeLeft, setTimeLeft] = useState(SECTION_MINUTES[section] * 60);

  const [elapsed, setElapsed] = useState(0);

  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Splitter ratio

  const leftWidthPercent = 50;

  // Timer countdown

  useEffect(() => {

    if (submitted) return;

    const timer = setInterval(() => {

      setElapsed((s) => s + 1);

      if (simulation) setTimeLeft((s) => Math.max(0, s - 1));

    }, 1000);

    return () => clearInterval(timer);

  }, [simulation, submitted]);

  const currentPart = parts.find((p) => p.id === activePartId) ?? parts[0];

  const qStart = currentPart?.questionStart ?? 1;

  const qEnd = currentPart?.questionEnd ?? 13;

  const partNumbers = useMemo(() => {

    return Array.from({ length: Math.max(0, qEnd - qStart + 1) }, (_, i) => qStart + i);

  }, [qStart, qEnd]);

  const toggleFlag = (num: number) => {

    setFlagged((prev) => {

      const next = new Set(prev);

      if (next.has(num)) next.delete(num);

      else next.add(num);

      return next;

    });

  };

  const handleNextGroup = () => {
    const currentGroupIndex = questionGroups.findIndex(
      (g) => activeQuestion >= (g.questions[0]?.number ?? 0) && activeQuestion <= (g.questions[g.questions.length - 1]?.number ?? 0)
    );
    if (currentGroupIndex >= 0 && currentGroupIndex < questionGroups.length - 1) {
      const nextGroup = questionGroups[currentGroupIndex + 1];
      if (nextGroup && nextGroup.questions[0]) {
        setActiveQuestion(nextGroup.questions[0].number);
        return;
      }
    }
    if (activePartId < parts.length) {
      const nextPart = parts[activePartId];
      if (nextPart) {
        setActivePartId(activePartId + 1);
        setActiveQuestion(nextPart.questionStart);
        return;
      }
    }
    const nextQ = Math.min(qEnd, activeQuestion + 1);
    setActiveQuestion(nextQ);
  };

  const currentPartPages = currentPart?.pages ?? test.pages;

  const passageFullText = useMemo(() => {

    return currentPartPages.map((p) => p.text).join('\n\n');

  }, [currentPartPages]);

  // Parse questions from page text

  const questionGroups = useMemo(() => {

    return parsePageQuestions(passageFullText, qStart, qEnd);

  }, [passageFullText, qStart, qEnd]);

  // Extract passage title and clean passage text (separate from questions)

  const passageDisplayData = useMemo(() => {

    // Tìm tiêu đề bài đọc

    const lines = passageFullText.split('\n').map((l) => l.trim()).filter(Boolean);

    let title = test.title;

    let subtitle = '';

    const bodyParas: string[] = [];

    let readingBody = true;

    for (let i = 0; i < lines.length; i++) {

      const line = lines[i] || '';

      if (/^Questions?\s*\d+/i.test(line)) {

        readingBody = false;

        break;

      }

      if (i === 0 && (line.includes('READING PASSAGE') || line.includes('Test '))) {

        continue;

      }

      if (!title || title === test.title) {

        if (line.length < 80 && !line.startsWith('You should spend')) {

          title = line;

          continue;

        }

      }

      if (!subtitle && (line.startsWith('In ') || line.startsWith('Between ') || line.length < 150)) {

        subtitle = line;

        continue;

      }

      if (readingBody && line.length > 50) {

        bodyParas.push(line);

      }

    }

    return {

      title: title || test.title,

      subtitle,

      paragraphs: bodyParas.length > 0 ? bodyParas : lines.filter((l) => l.length > 60),

    };

  }, [passageFullText, test.title]);

  // Theme colors

  const themeStyles = useMemo(() => {

    if (themeMode === 'warm') {

      return {

        bg: '#F3F0FB',

        surface: '#F3F0FB',

        card: '#FFFFFF',

        text: '#2B2350',

        border: '#F3F0FB',

        toolbar: '#F3F0FB',

      };

    }

    if (themeMode === 'dark') {

      return {

        bg: '#18181B',

        surface: '#27272A',

        card: '#1F1F23',

        text: '#F4F4F5',

        border: '#3F3F46',

        toolbar: '#121214',

      };

    }

    return {

      bg: '#F8F9FA',

      surface: '#FFFFFF',

      card: '#FFFFFF',

      text: '#0F172A',

      border: '#E5E7EB',

      toolbar: '#FFFFFF',

    };

  }, [themeMode]);

  const answeredInPartCount = partNumbers.filter((n) => answers[String(n)]?.trim()).length;

  const longAnswer = section === 'Writing' || section === 'Speaking';

    const questionWorksheetContent = (
    <View style={{ gap: 24 }}>
      {/* Phân nhóm câu hỏi */}

            {questionGroups.map((group, gIdx) => (

              <View

                key={gIdx}

                style={{

                  backgroundColor: themeStyles.surface,

                  borderWidth: 1,

                  borderColor: themeStyles.border,

                  borderRadius: 16,

                  padding: 20,

                  gap: 16,

                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',

                }}

              >

                {/* Banner chỉ dẫn dạng bài (như Ảnh 1) */}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

                  <View

                    style={{
                      backgroundColor: themeStyles.border,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: themeStyles.text }}>

                      {group.rangeLabel}

                    </Text>

                  </View>

                  <Text

                    style={{

                      fontFamily: 'BeVietnamPro_600SemiBold',

                      fontSize: 13,

                      color: '#4B5563',

                      flex: 1,

                    }}

                  >

                    {group.instruction}

                  </Text>

                </View>

                {/* Danh sách các câu hỏi trong nhóm */}

                <View style={{ gap: 18 }}>

                  {group.questions.map((q) => {

                    const isCurrent = activeQuestion === q.number;

                    const val = answers[String(q.number)] ?? '';

                    return (

                      <View

                        key={q.number}

                        onPointerDown={() => setActiveQuestion(q.number)}

                        style={{

                          padding: 14,

                          borderRadius: 12,

                          backgroundColor: isCurrent ? '#F3F0FB' : 'transparent',

                          borderWidth: 1,

                          borderLeftWidth: isCurrent ? 3 : 1,

                          borderColor: isCurrent ? '#2B2350' : themeStyles.border,

                          gap: 10,

                        }}

                      >

                        {/* 1. Dạng điền vào chỗ trống có câu văn (Sentence / Note completion) */}

                        {q.type === 'blank' && (

                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>

                            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: themeStyles.text }}>

                              {q.number}.

                            </Text>

                            {q.prefixText ? (

                              <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 15, color: themeStyles.text }}>

                                {q.prefixText}

                              </Text>

                            ) : null}

                            {/* Ô nhập trực tiếp chuẩn thi máy (Image 1) */}

                            <TextInput

                              value={val}

                              editable={!submitted}

                              

                              onChangeText={(text) => onAnswerChange(q.number, text)}

                              onFocus={() => setActiveQuestion(q.number)}

                              style={{

                                minWidth: 140,

                                height: 38,

                                paddingHorizontal: 12,

                                borderRadius: 8,

                                borderWidth: 1.5,

                                borderColor: isCurrent ? '#6A4BD9' : '#D1D5DB',

                                backgroundColor: '#FFFFFF',

                                fontFamily: 'BeVietnamPro_600SemiBold',

                                fontSize: 15,

                                color: '#111827',

                              }}

                            />

                            {q.suffixText ? (

                              <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 15, color: themeStyles.text }}>

                                {q.suffixText}

                              </Text>

                            ) : null}

                          </View>

                        )}

                        {/* 2. Dạng trắc nghiệm Multiple Choice A, B, C, D (Image 5) */}

                        {q.type === 'choice' && (

                          <View style={{ gap: 8 }}>

                            <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 15, color: themeStyles.text }}>

                              <Text style={{ fontFamily: 'BeVietnamPro_700Bold' }}>{q.number}. </Text>

                              {q.stem}

                            </Text>

                            <View style={{ gap: 6, marginTop: 4 }}>

                              {q.options?.map((opt) => {

                                const selected = val.trim().toUpperCase() === opt.letter;

                                return (

                                  <Pressable

                                    key={opt.letter}

                                    disabled={submitted}

                                    onPress={() => onAnswerChange(q.number, opt.letter)}

                                    accessibilityRole="radio"

                                    accessibilityState={{ checked: selected }}

                                    style={{

                                      flexDirection: 'row',

                                      alignItems: 'center',

                                      gap: 12,

                                      paddingHorizontal: 12,

                                      paddingVertical: 10,

                                      borderRadius: 10,

                                      borderWidth: 1,

                                      borderColor: selected ? '#2B2350' : themeStyles.border,

                                      backgroundColor: selected ? '#F5F2FF' : themeStyles.surface,

                                    }}

                                  >

                                    <View

                                      style={{

                                        width: 20,

                                        height: 20,

                                        borderRadius: 10,

                                        borderWidth: 1.5,

                                        borderColor: selected ? '#2B2350' : '#9CA3AF',

                                        backgroundColor: selected ? '#2B2350' : 'transparent',

                                        alignItems: 'center',

                                        justifyContent: 'center',

                                      }}

                                    >

                                      {selected ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} /> : null}

                                    </View>

                                    <Text

                                      style={{

                                        fontFamily: selected ? 'BeVietnamPro_600SemiBold' : 'BeVietnamPro_400Regular',

                                        fontSize: 14,

                                        color: themeStyles.text,

                                        flex: 1,

                                      }}

                                    >

                                      <Text style={{ fontWeight: '700' }}>{opt.letter}. </Text>

                                      {opt.text}

                                    </Text>

                                  </Pressable>

                                );

                              })}

                            </View>

                          </View>

                        )}

                        {/* 3. Dạng True / False / Not Given */}

                        {q.type === 'tfng' && (

                          <View style={{ gap: 8 }}>

                            <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 15, color: themeStyles.text }}>

                              <Text style={{ fontFamily: 'BeVietnamPro_700Bold' }}>{q.number}. </Text>

                              {q.stem}

                            </Text>

                            <View style={{ flexDirection: 'row', marginTop: 4, borderRadius: 10, borderWidth: 1, borderColor: themeStyles.border, overflow: 'hidden' }}>

                              {(q.tfngOptions || ['TRUE', 'FALSE', 'NOT GIVEN']).map((opt, idx) => {

                                const selected = val.trim().toUpperCase() === opt;

                                return (

                                  <Pressable

                                    key={opt}

                                    disabled={submitted}

                                    accessibilityRole="radio"

                                    accessibilityState={{ checked: selected }}

                                    onPress={() => onAnswerChange(q.number, opt)}

                                    style={{

                                      flex: 1,

                                      alignItems: 'center',

                                      paddingVertical: 10,

                                      borderLeftWidth: idx === 0 ? 0 : 1,

                                      borderColor: themeStyles.border,

                                      backgroundColor: selected ? '#2B2350' : themeStyles.surface,

                                    }}

                                  >

                                    <Text

                                      style={{

                                        fontFamily: 'BeVietnamPro_700Bold',

                                        fontSize: 13,

                                        letterSpacing: 0.3,

                                        color: selected ? '#FFFFFF' : themeStyles.text,

                                      }}

                                    >

                                      {opt}

                                    </Text>

                                  </Pressable>

                                );

                              })}

                            </View>

                          </View>

                        )}

                      </View>

                    );

                  })}

                </View>

              </View>

            ))}

            {/* Dạng bài tự luận Writing / Speaking */}

            {longAnswer && (

              <View style={{ gap: 10 }}>

                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 16, color: themeStyles.text }}>

                  Bài làm của bạn:

                </Text>

                <TextInput

                  value={answers[String(activePartId)] ?? ''}

                  editable={!submitted}

                  onChangeText={(val) => onAnswerChange(activePartId, val)}

                  multiline={true}

                  placeholder="Nhập bài viết hoặc câu trả lời nói của bạn vào đây..."

                  style={{

                    minHeight: 280,

                    borderRadius: 12,

                    borderWidth: 1,

                    borderColor: themeStyles.border,

                    backgroundColor: themeStyles.surface,

                    padding: 16,

                    fontFamily: 'BeVietnamPro_400Regular',

                    fontSize: 15,

                    color: themeStyles.text,

                    textAlignVertical: 'top',

                  }}

                />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 13, color: '#6B7280' }}>
                    Số từ đã viết: <Text style={{ fontFamily: 'BeVietnamPro_700Bold', color: themeStyles.text }}>{words(answers[String(activePartId)] ?? '')}</Text> từ
                  </Text>
                  {currentPart?.minimumWords ? (
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: words(answers[String(activePartId)] ?? '') >= currentPart.minimumWords ? '#DCFCE7' : '#F3F0FB',
                      borderWidth: 1,
                      borderColor: words(answers[String(activePartId)] ?? '') >= currentPart.minimumWords ? '#86EFAC' : '#FCD34D',
                    }}>
                      <Text style={{
                        fontFamily: 'BeVietnamPro_600SemiBold',
                        fontSize: 12,
                        color: words(answers[String(activePartId)] ?? '') >= currentPart.minimumWords ? '#15803D' : '#6A4BD9',
                      }}>
                        {words(answers[String(activePartId)] ?? '') >= currentPart.minimumWords
                          ? `✓ Đã đạt yêu cầu tối thiểu (${currentPart.minimumWords} từ)`
                          : `⚠️ Chưa đủ số từ tối thiểu (${words(answers[String(activePartId)] ?? '')}/${currentPart.minimumWords} từ)`}
                      </Text>
                    </View>
                  ) : null}
                </View>

              </View>

            )}

            {/* ĐỐI CHIẾU KẾT QUẢ KHI ĐÃ NỘP BÀI */}

            {submitted && grade && (

              <View

                style={{

                  backgroundColor: '#F0FDF4',

                  borderWidth: 1.5,

                  borderColor: '#86EFAC',

                  borderRadius: 16,

                  padding: 20,

                  gap: 14,

                }}

              >

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>

                  <Text style={{ fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 18, color: '#166534' }}>

                    Kết quả chấm thi: {grade.score} / {grade.total} câu đúng

                  </Text>

                  {grade.bandEstimate !== null && (

                    <View style={{ backgroundColor: '#15803D', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>

                      <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#FFFFFF' }}>

                        Band {grade.bandEstimate}

                      </Text>

                    </View>

                  )}

                </View>

                {/* Chi tiết từng câu */}

                <View style={{ gap: 8 }}>

                  {grade.results.map((r) => (

                    <View

                      key={r.number}

                      style={{

                        flexDirection: 'row',

                        alignItems: 'center',

                        justifyContent: 'space-between',

                        padding: 10,

                        borderRadius: 8,

                        backgroundColor: r.correct ? '#DCFCE7' : '#FEE2E2',

                      }}

                    >

                      <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 13, color: r.correct ? '#166534' : '#991B1B' }}>

                        Câu {r.number}: {r.answer || '(chưa làm)'}

                      </Text>

                      <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: r.correct ? '#166534' : '#991B1B' }}>

                        Đáp án chuẩn: {r.expected}

                      </Text>

                    </View>

                  ))}

                </View>

              </View>

            )}
    </View>
  );

  return (

    <View style={{ flex: 1, backgroundColor: themeStyles.bg }}>

      {/* 1. TOP HEADER (Chuẩn phòng thi thật Image 1, 2, 5, 6) */}

      <View

        style={{

          height: 58,

          backgroundColor: themeStyles.toolbar,

          borderBottomWidth: 1,

          borderBottomColor: themeStyles.border,

          flexDirection: 'row',

          alignItems: 'center',

          justifyContent: 'space-between',

          paddingHorizontal: 16,

          zIndex: 10,

        }}

      >

        {/* Nút thoát & Tiêu đề bài đọc */}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>

          <Pressable

            accessibilityRole="button"

            onPress={onExit}

            style={{

              width: 34,

              height: 34,

              borderRadius: 8,

              borderWidth: 1,

              borderColor: themeStyles.border,

              backgroundColor: themeStyles.surface,

              alignItems: 'center',

              justifyContent: 'center',

            }}

          >

            <Icon name="close" size={16} color={themeStyles.text} />

          </Pressable>

          

          <View style={{ minWidth: 0, flex: 1 }}>

            <Text numberOfLines={1} style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 15, color: themeStyles.text }}>{test.title || passageDisplayData.title}</Text>

            <Text

              numberOfLines={1}

              style={{

                fontFamily: 'BeVietnamPro_400Regular',

                fontSize: 12,

                color: '#6B7280',

              }}

            >

              {currentPart?.label || `${section === 'Reading' ? 'Reading Passage' : 'Part'} ${activePartId}`} · Questions {qStart}–{qEnd}

            </Text>

          </View>

        </View>

        {/* Đồng hồ đếm ngược chính giữa (Image 1: 🕒 19:56) */}

        <View

          style={{

            flexDirection: 'row',

            alignItems: 'center',

            gap: 6,

            paddingHorizontal: 14,

            paddingVertical: 6,

            borderRadius: 20,

            borderWidth: 1,

            borderColor: timeLeft <= 300 ? '#FCA5A5' : '#6A4BD9',

            backgroundColor: timeLeft <= 300 ? '#FEF2F2' : '#F5F2FF',

          }}

        >

          <Icon name="clock" size={16} color={timeLeft <= 300 ? '#DC2626' : '#6A4BD9'} />

          <Text

            style={{

              fontFamily: 'BeVietnamPro_700Bold',

              fontSize: 15,

              color: timeLeft <= 300 ? '#DC2626' : '#6A4BD9',

            }}

          >

            {clock(simulation ? timeLeft : elapsed)}

          </Text>

        </View>

        {/* Công cụ góc phải (Aa, Flag, Contrast) */}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>

          {/* Cỡ chữ Aa */}

          <Pressable

            accessibilityRole="button"

            onPress={() => setFontSizeLevel((s) => (s === 15 ? 17 : s === 17 ? 19 : 15))}

            style={{

              flexDirection: 'row',

              alignItems: 'center',

              gap: 4,

              paddingHorizontal: 10,

              paddingVertical: 6,

              borderRadius: 8,

              borderWidth: 1,

              borderColor: themeStyles.border,

              backgroundColor: themeStyles.surface,

            }}

          >

            <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 13, color: themeStyles.text }}>

              Aa

            </Text>

            <Text style={{ fontSize: 11, color: '#6A4BD9' }}>{fontSizeLevel}px</Text>

          </Pressable>

          {/* Đánh dấu cờ (Flag) */}

          <Pressable

            accessibilityRole="button"

            onPress={() => toggleFlag(activeQuestion)}

            style={{

              paddingHorizontal: 10,

              paddingVertical: 6,

              borderRadius: 8,

              borderWidth: 1,

              borderColor: flagged.has(activeQuestion) ? '#F59E0B' : themeStyles.border,

              backgroundColor: flagged.has(activeQuestion) ? '#F3F0FB' : themeStyles.surface,

              flexDirection: 'row',

              alignItems: 'center',

              gap: 4,

            }}

          >

            <Text style={{ fontSize: 13 }}>{flagged.has(activeQuestion) ? '⚑' : '⚐'}</Text>

          </Pressable>

          {/* Độ tương phản / Đổi màu nền (Contrast ☾) */}

          <Pressable

            accessibilityRole="button"

            onPress={() => setThemeMode((m) => (m === 'light' ? 'warm' : m === 'warm' ? 'dark' : 'light'))}

            style={{

              paddingHorizontal: 10,

              paddingVertical: 6,

              borderRadius: 8,

              borderWidth: 1,

              borderColor: themeStyles.border,

              backgroundColor: themeStyles.surface,

            }}

          >

            <Text style={{ fontSize: 13 }}>{themeMode === 'dark' ? '☀️' : themeMode === 'warm' ? '📜' : '☾'}</Text>

          </Pressable>

        </View>

      </View>

      {/* 2. MAIN WORKSPACE (Authentic Computer-Delivered IELTS Image 2 Layout for Listening) */}
      {section === 'Listening' ? (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingHorizontal: isDesktop ? 48 : 20,
              paddingTop: 32,
              paddingBottom: 150,
              maxWidth: 1040,
              width: '100%',
              alignSelf: 'center',
              gap: 20,
            }}
          >
            {/* Top Instruction Bar (Image 2) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: '#FEE2E2',
                  borderWidth: 1,
                  borderColor: '#FECACA',
                }}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#DC2626' }}>
                  Questions {qStart}–{qEnd}
                </Text>
              </View>
            </View>

            {/* Section Title (Image 2) */}
            <Text style={{ fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 20, color: '#0F172A', marginTop: 4 }}>
              {test.parts?.[activePartId - 1]?.label || `Part ${activePartId}`}
            </Text>

            {/* Questions Worksheet */}
            {questionWorksheetContent}

            {/* End of Section Notice (Image 2) */}
            <View style={{ alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40, paddingVertical: 24 }}>
              <Text style={{ fontSize: 24, color: '#94A3B8', letterSpacing: 4 }}>• • •</Text>
              <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 16, color: '#0F172A' }}>
                Hết câu hỏi của Part {activePartId}
              </Text>
              <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: '#64748B' }}>
                Bạn còn {Math.max(0, partNumbers.length - answeredInPartCount)} câu chưa trả lời ở phần này. Hãy hoàn thành bài của mình nhé!
              </Text>
            </View>
          </ScrollView>

          {/* Hidden HTML5 Audio Element for Background Playback */}
          {Platform.OS === 'web' && activeAudioTrackUrl ? (
            React.createElement('audio', {
              ref: audioPlayerRef,
              src: activeAudioTrackUrl,
              preload: 'metadata',
              onPlay: () => {
                setupAudioGain();
                setAudioIsPlaying(true);
              },
              onPause: () => setAudioIsPlaying(false),
              onTimeUpdate: () => {
                if (audioPlayerRef.current) {
                  setAudioCurrentTime(audioPlayerRef.current.currentTime);
                }
              },
              onLoadedMetadata: () => {
                if (audioPlayerRef.current) {
                  setAudioDuration(audioPlayerRef.current.duration || 0);
                  audioPlayerRef.current.volume = 1.0;
                }
              },
              onEnded: () => {
                setAudioIsPlaying(false);
                if (activePartId < parts.length) {
                  setActivePartId(activePartId + 1);
                }
              },
              style: { display: 'none' },
            })
          ) : null}
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
          {/* CỘT TRÁI: BÀI ĐỌC (READING PASSAGE) */}
          <View
            style={{
              flex: isDesktop ? leftWidthPercent / 100 : 1,
              borderRightWidth: isDesktop ? 1 : 0,
              borderRightColor: themeStyles.border,
              backgroundColor: themeStyles.surface,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingHorizontal: isDesktop ? 36 : 20, paddingVertical: 28, gap: 16 }}
            >
              {/* Tiêu đề bài đọc lớn & phụ đề dẫn dắt */}
              <View className="gap-2 border-b border-border/60 pb-4">
                <Text
                  style={{
                    fontFamily: 'BeVietnamPro_700Bold',
                    fontSize: 13,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    color: '#6A4BD9',
                  }}
                >
                  READING PASSAGE {activePartId}
                </Text>
                <Text
                  style={{
                    fontFamily: 'BeVietnamPro_800ExtraBold',
                    fontSize: 24,
                    lineHeight: 32,
                    color: themeStyles.text,
                  }}
                >
                  {passageDisplayData.title}
                </Text>
                {passageDisplayData.subtitle ? (
                  <Text
                    style={{
                      fontFamily: 'BeVietnamPro_500Medium',
                      fontSize: 14,
                      lineHeight: 22,
                      color: '#4B5563',
                    }}
                  >
                    {passageDisplayData.subtitle}
                  </Text>
                ) : null}
              </View>

              <View style={{ gap: 16 }}>
                {passageDisplayData.paragraphs.map((para, pIdx) => (
                  <Text
                    key={pIdx}
                    selectable={true}
                    style={{
                      fontFamily: 'BeVietnamPro_400Regular',
                      fontSize: fontSizeLevel,
                      lineHeight: fontSizeLevel * 1.7,
                      color: themeStyles.text,
                      textAlign: 'justify',
                    }}
                  >
                    {para}
                  </Text>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* CỘT PHẢI: PHIẾU CÂU HỎI (QUESTION WORKSHEET) */}
          <View
            style={{
              flex: isDesktop ? (100 - leftWidthPercent) / 100 : 1,
              backgroundColor: themeStyles.bg,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingHorizontal: isDesktop ? 28 : 16, paddingVertical: 24 }}
            >
              {questionWorksheetContent}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 3. BOTTOM FOOTER BAR (IMAGE 2 MATCHING FOR LISTENING; STANDARD FOR READING) */}
      {section === 'Listening' ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            zIndex: 30,
            boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          }}
        >
          {/* Đề chưa có file audio trên máy: nói rõ thay vì để nút phát chết. */}
          {!activeAudioTrackUrl ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 13, color: '#64748B' }}>
                Đề này chưa có file audio. Hãy thêm file audio của đề rồi tải lại trang.
              </Text>
            </View>
          ) : null}

          {/* TIER 1: AUDIO WAVEFORM SCRUBBER BAR (IMAGE 2) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9',
              gap: 12,
            }}
          >
            {/* Play/Pause Button */}
            <Pressable
              accessibilityRole="button"
              onPress={toggleAudioPlay}
              disabled={!activeAudioTrackUrl}
              style={{
                opacity: activeAudioTrackUrl ? 1 : 0.4,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: audioIsPlaying ? '#0F172A' : goldLeaf.base,
                backgroundImage: audioIsPlaying ? undefined : goldLeaf.fill,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: audioIsPlaying ? '#FFFFFF' : goldLeaf.ink }}>{audioIsPlaying ? '⏸' : '▶'}</Text>
            </Pressable>

            {/* Current Time in Red (Image 2) */}
            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12.5, color: '#B7791F', minWidth: 42 }}>
              {formatAudioTime(audioCurrentTime)}
            </Text>

            {/* Waveform Scrubber Bars (Image 2) */}
            <Pressable
              style={{ flex: 1, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}
              onPress={(e: any) => {
                if (Platform.OS !== 'web') return;
                const rect = e.currentTarget?.getBoundingClientRect?.();
                if (rect) {
                  const clickX = e.clientX - rect.left;
                  handleSeekWaveform(clickX / rect.width);
                }
              }}
            >
              {WAVEFORM_HEIGHTS.map((h, bIdx) => {
                const prog = bIdx / WAVEFORM_HEIGHTS.length;
                const curr = audioDuration > 0 ? audioCurrentTime / audioDuration : 0;
                const isPlayed = prog <= curr;
                return (
                  <View
                    key={bIdx}
                    style={{
                      width: 3,
                      height: h,
                      borderRadius: 1.5,
                      backgroundColor: isPlayed ? goldLeaf.base : '#CBD5E1',
                    }}
                  />
                );
              })}
            </Pressable>

            {/* Total Duration in Gray (Image 2) */}
            <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 12.5, color: '#64748B', minWidth: 42 }}>
              {audioDuration > 0 ? formatAudioTime(audioDuration) : '--:--'}
            </Text>
          </View>

          {/* TIER 2: SECTION STATUS & QUESTION NUMBERS NAVIGATION (IMAGE 2) */}
          <View
            style={{
              height: 56,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
            }}
          >
            {/* Left: Section progress */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 140 }}>
              <Text style={{ fontSize: 18, color: '#64748B' }}>⠿</Text>
              <View>
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#0F172A' }}>
                  Section {activePartId}
                </Text>
                <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 11, color: '#64748B' }}>
                  Đã làm {answeredInPartCount} / {partNumbers.length}
                </Text>
              </View>
            </View>

            {/* Center: Question Pills & Section Tabs */}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center', gap: 6, paddingHorizontal: 12 }}
            >
              {/* Active Section Badge (Red Pill matching Image 2) */}
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: goldLeaf.base,
                  backgroundImage: goldLeaf.fill,
                }}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: goldLeaf.ink }}>
                  Section {activePartId}
                </Text>
              </View>

              {/* Numbered Question Buttons */}
              {partNumbers.map((num) => {
                const hasAnswer = Boolean(answers[String(num)]?.trim());
                const isCurrent = activeQuestion === num;
                const isFlag = flagged.has(num);
                return (
                  <Pressable
                    key={num}
                    onPress={() => setActiveQuestion(num)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      backgroundColor: hasAnswer ? '#0F172A' : '#FFFFFF',
                      borderWidth: isCurrent ? 2 : 1,
                      borderColor: isCurrent ? goldLeaf.base : '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'BeVietnamPro_700Bold',
                        fontSize: 12,
                        color: hasAnswer ? '#FFFFFF' : '#334155',
                      }}
                    >
                      {num}
                    </Text>
                    {isFlag ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: '#EF4444',
                        }}
                      />
                    ) : null}
                  </Pressable>
                );
              })}

              {/* Other Section Pills (S1, S2, S3, S4 matching Image 2) */}
              {parts.map((p) => {
                if (p.id === activePartId) return null;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      setActivePartId(p.id);
                      setActiveQuestion(p.questionStart);
                    }}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: '#F1F5F9',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 12, color: '#64748B' }}>
                      S{p.id}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Right: Red Section Next Button (matching Image 2) */}
            {activePartId < parts.length ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const nextP = activePartId + 1;
                  setActivePartId(nextP);
                  const pObj = parts.find((p) => p.id === nextP);
                  if (pObj) setActiveQuestion(pObj.questionStart);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 8,
                  backgroundColor: goldLeaf.base,
                  backgroundImage: goldLeaf.fill,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: goldLeaf.ink }}>
                  Part {activePartId + 1} →
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => setConfirmSubmit(true)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 9,
                  borderRadius: 8,
                  backgroundColor: goldLeaf.base,
                  backgroundImage: goldLeaf.fill,
                }}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: goldLeaf.ink }}>
                  {submitted ? '✓ Đã nộp' : 'Nộp bài →'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View
          style={{
            height: 60,
            backgroundColor: themeStyles.toolbar,
            borderTopWidth: 1,
            borderTopColor: themeStyles.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}
        >
          {/* Bên trái: Trạng thái tiến độ & chọn Passage */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View>
              <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: themeStyles.text }}>{currentPart?.label || `Reading Passage ${activePartId}`}</Text>
              <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 11, color: '#6B7280' }}>
                Đã làm {answeredInPartCount}/{partNumbers.length}
              </Text>
            </View>

            {parts.length > 1 && (
              <View style={{ flexDirection: 'row', gap: 4, marginLeft: 8 }}>
                {parts.map((p) => {
                  const active = p.id === activePartId;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => setActivePartId(p.id)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: active ? '#6A4BD9' : themeStyles.surface,
                        borderWidth: 1,
                        borderColor: active ? '#6A4BD9' : themeStyles.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'BeVietnamPro_700Bold',
                          fontSize: 11,
                          color: active ? '#FFFFFF' : themeStyles.text,
                        }}
                      >
                        Passage {p.id}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Chính giữa: Dãy số câu hỏi */}
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', gap: 6, paddingHorizontal: 12 }}
          >
            {partNumbers.map((num) => {
              const hasAnswer = Boolean(answers[String(num)]?.trim());
              const isCurrent = activeQuestion === num;
              const isFlag = flagged.has(num);
              let boxBg = themeStyles.surface;
              let textColor = themeStyles.text;
              let borderColor = themeStyles.border;
              if (hasAnswer) {
                boxBg = '#0F172A';
                textColor = '#FFFFFF';
                borderColor = '#0F172A';
              }
              if (isCurrent) {
                borderColor = '#6A4BD9';
              }
              return (
                <Pressable
                  key={num}
                  onPress={() => setActiveQuestion(num)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    backgroundColor: boxBg,
                    borderWidth: isCurrent ? 2 : 1,
                    borderColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: textColor }}>
                    {num}
                  </Text>
                  {isFlag ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#F59E0B',
                      }}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Bên phải: Nút chuyển nhóm & Nút NỘP BÀI VÀNG ÁNH KIM BAND 9 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              onPress={handleNextGroup}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: themeStyles.border,
                backgroundColor: themeStyles.surface,
              }}
            >
              <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 12, color: themeStyles.text }}>
                Tiếp →
              </Text>
            </Pressable>

            {!submitted ? (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => setConfirmSubmit(true)}
                style={({ pressed }) => ({
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: '#6A4BD9',
                  boxShadow: pressed ? '0 1px 2px rgba(106, 75, 217,0.3)' : '0 3px 8px rgba(106, 75, 217,0.4)',
                  transform: [{ translateY: pressed ? 1 : 0 }],
                })}
              >
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#FFFFFF' }}>
                  Nộp bài
                </Text>
              </Pressable>
            ) : (
              <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#DCFCE7' }}>
                <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#166534' }}>
                  ✓ Đã nộp
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* MODAL XÁC NHẬN NỘP BÀI */}

      {confirmSubmit && (

        <Modal transparent animationType="fade" visible={confirmSubmit} onRequestClose={() => setConfirmSubmit(false)}>

          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>

            <View

              style={{

                width: '100%',

                maxWidth: 420,

                backgroundColor: '#FFFFFF',

                borderRadius: 20,

                padding: 24,

                gap: 16,

                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',

              }}

            >

              <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 18, color: '#0F172A' }}>

                Xác nhận nộp bài thi?

              </Text>

              <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 14, color: '#4B5563', lineHeight: 22 }}>

                Bạn đã hoàn thành {Object.values(answers).filter((a) => a.trim()).length} / {test.questionCount} câu.

                Sau khi nộp, hệ thống sẽ tính điểm chi tiết và hiển thị đối chiếu đáp án trực tiếp.

              </Text>

              <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>

                <Pressable

                  onPress={() => setConfirmSubmit(false)}

                  style={{

                    paddingHorizontal: 16,

                    paddingVertical: 10,

                    borderRadius: 10,

                    borderWidth: 1,

                    borderColor: '#E5E7EB',

                  }}

                >

                  <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 13, color: '#374151' }}>

                    Tiếp tục làm bài

                  </Text>

                </Pressable>

                <Pressable

                  onPress={() => {

                    setConfirmSubmit(false);

                    onSubmit();

                  }}

                  style={{

                    paddingHorizontal: 20,

                    paddingVertical: 10,

                    borderRadius: 10,

                    backgroundColor: '#6A4BD9',

                  }}

                >

                  <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: '#FFFFFF' }}>

                    Nộp bài ngay

                  </Text>

                </Pressable>

              </View>

            </View>

          </View>

        </Modal>

      )}

    </View>

  );

}

