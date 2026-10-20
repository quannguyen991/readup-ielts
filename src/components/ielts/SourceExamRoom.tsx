import React, { useEffect, useMemo, useRef, useState } from 'react';

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

import { SECTION_MINUTES, type ExamPart, type SourcePage, type TestSection } from '@/services/ielts/source-catalog';

import type { Grade } from './ComputerDeliveredExamRoom';

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
function SourceAudio({
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
      <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#F59E0B', backgroundColor: '#FFFBEB', padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="volume" size={18} color="#D97706" />
          <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 14, color: '#92400E' }}>IELTS Listening Audio</Text>
        </View>
        <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: '#78350F' }}>
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
        boxShadow: '0 4px 16px rgba(143, 110, 54, 0.08)',
      }}
    >
      {/* Header Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FAF3E7', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="volume" size={16} color="#8F6E36" />
          </View>
          <View>
            <Text style={{ fontFamily: 'BeVietnamPro_800ExtraBold', fontSize: 14, color: '#2A1808', letterSpacing: 0.2 }}>
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
              borderColor: showTranscript ? '#8F6E36' : '#E6DACB',
              backgroundColor: showTranscript ? '#8F6E36' : '#FAF7F2',
            }}
          >
            <Text style={{ fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 12, color: showTranscript ? '#FFFFFF' : '#8F6E36' }}>
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
                  borderColor: active ? '#8F6E36' : '#E6DACB',
                  backgroundColor: active ? '#8F6E36' : '#FAF7F2',
                }}
              >
                {active && <Text style={{ fontSize: 12 }}>🔊</Text>}
                <Text
                  style={{
                    fontFamily: 'BeVietnamPro_700Bold',
                    fontSize: 12.5,
                    color: active ? '#FFFFFF' : '#2A1808',
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
          backgroundColor: '#FAF7F2',
          borderWidth: 1,
          borderColor: '#EFE7DC',
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
              backgroundColor: isPlaying ? '#2A1808' : '#8F6E36',
              shadowColor: '#8F6E36',
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
            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 13.5, color: '#2A1808' }}>
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
              <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: '#2A1808' }}>
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
                    borderColor: active ? '#8F6E36' : '#DDD2C3',
                    backgroundColor: active ? '#8F6E36' : '#FFFFFF',
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
              backgroundColor: '#8F6E36',
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

    // Kiểm tra TRUE / FALSE / NOT GIVEN

    const isTfng =

      /TRUE|FALSE|NOT GIVEN|YES|NO/i.test(text.slice(Math.max(0, (qIndex - 5) * 50), (qIndex + 1) * 50)) ||

      /TRUE|FALSE|NOT GIVEN/i.test(qLine);

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

    else if (firstType === 'tfng') inst = 'Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.';

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

  const { width: winW } = useWindowDimensions();

  const isDesktop = winW >= 1024;

  const section = test.section ?? 'Reading';

  const simulation = requestedSimulation && !test.missingComponents?.includes('audio');

  const parts = test.parts ?? [];

  const [activePartId, setActivePartId] = useState(parts[0]?.id ?? 1);

  const [activeQuestion, setActiveQuestion] = useState<number>(parts[0]?.questionStart ?? 1);

  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // Tùy chỉnh phòng thi: cỡ chữ, màu nền, mặt chữ

  const [fontSizeLevel, setFontSizeLevel] = useState<15 | 17 | 19>(16 as 17);

  const [themeMode, setThemeMode] = useState<'light' | 'warm' | 'dark'>('light');

  const [showTranscript, setShowTranscript] = useState(false);

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

    const nextQ = Math.min(qEnd, activeQuestion + 4);

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

        bg: '#FDFBF7',

        surface: '#FCFAF7',

        card: '#FFFFFF',

        text: '#1F1A14',

        border: '#EFE6D8',

        toolbar: '#F7F3EB',

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

                      backgroundColor: '#FEE2E2',

                      paddingHorizontal: 10,

                      paddingVertical: 3,

                      borderRadius: 6,

                    }}

                  >

                    <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: '#DC2626' }}>

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

                          backgroundColor: isCurrent ? '#FFFDF8' : 'transparent',

                          borderWidth: 1,

                          borderLeftWidth: isCurrent ? 3 : 1,

                          borderColor: isCurrent ? '#2A1808' : themeStyles.border,

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

                              placeholder="Nhập đáp án..."

                              placeholderTextColor="#9CA3AF"

                              onChangeText={(text) => onAnswerChange(q.number, text)}

                              onFocus={() => setActiveQuestion(q.number)}

                              style={{

                                minWidth: 140,

                                height: 38,

                                paddingHorizontal: 12,

                                borderRadius: 8,

                                borderWidth: 1.5,

                                borderColor: isCurrent ? '#8F6E36' : '#D1D5DB',

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

                                      borderColor: selected ? '#2A1808' : themeStyles.border,

                                      backgroundColor: selected ? '#FBF7EE' : themeStyles.surface,

                                    }}

                                  >

                                    <View

                                      style={{

                                        width: 20,

                                        height: 20,

                                        borderRadius: 10,

                                        borderWidth: 1.5,

                                        borderColor: selected ? '#2A1808' : '#9CA3AF',

                                        backgroundColor: selected ? '#2A1808' : 'transparent',

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

                              {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt, idx) => {

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

                                      backgroundColor: selected ? '#2A1808' : themeStyles.surface,

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

                <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 13, color: '#6B7280' }}>

                  Số từ đã viết: {words(answers[String(activePartId)] ?? '')} từ

                </Text>

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

          {/* Logo Band 9 Gold Badge */}

          <View

            style={{

              paddingHorizontal: 8,

              paddingVertical: 3,

              borderRadius: 6,

              backgroundColor: '#8F6E36',

            }}

          >

            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 11, color: '#FFFFFF' }}>

              BAND 9

            </Text>

          </View>

          <View style={{ minWidth: 0, flex: 1 }}>

            <Text

              numberOfLines={1}

              style={{

                fontFamily: 'BeVietnamPro_700Bold',

                fontSize: 15,

                color: themeStyles.text,

              }}

            >

              {passageDisplayData.title}

            </Text>

            <Text

              numberOfLines={1}

              style={{

                fontFamily: 'BeVietnamPro_400Regular',

                fontSize: 12,

                color: '#6B7280',

              }}

            >

              {currentPart?.label || `Passage ${activePartId}`} · Câu {qStart}–{qEnd}

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

            borderColor: timeLeft <= 300 ? '#FCA5A5' : '#8F6E36',

            backgroundColor: timeLeft <= 300 ? '#FEF2F2' : '#FBF7EE',

          }}

        >

          <Icon name="clock" size={16} color={timeLeft <= 300 ? '#DC2626' : '#8F6E36'} />

          <Text

            style={{

              fontFamily: 'BeVietnamPro_700Bold',

              fontSize: 15,

              color: timeLeft <= 300 ? '#DC2626' : '#8F6E36',

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

            <Text style={{ fontSize: 11, color: '#8F6E36' }}>{fontSizeLevel}px</Text>

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

              backgroundColor: flagged.has(activeQuestion) ? '#FEF3C7' : themeStyles.surface,

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

      {/* 2. MAIN WORKSPACE (Single-column CD IELTS for Listening without transcript; 2-column split for Reading or Listening with transcript) */}
      {section === 'Listening' && !showTranscript && !submitted ? (
        <View style={{ flex: 1, backgroundColor: themeStyles.bg }}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingHorizontal: isDesktop ? 40 : 18,
              paddingVertical: 26,
              maxWidth: 1040,
              width: '100%',
              alignSelf: 'center',
              gap: 22,
            }}
          >
            {/* Top IELTS CD Audio Console */}
            <SourceAudio
              files={test.audioFiles.length ? test.audioFiles.map(assetUrl) : test.audioCloudUrl ? [test.audioCloudUrl] : []}
              simulation={simulation}
              activePartId={activePartId}
              onPartChange={(p) => setActivePartId(p)}
              showTranscript={showTranscript}
              onToggleTranscript={() => setShowTranscript(true)}
              hasTranscript={Boolean(passageDisplayData.paragraphs.length)}
            />

            {/* IELTS Part Instruction Card */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 18,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: themeStyles.surface,
                borderWidth: 1,
                borderColor: themeStyles.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FAF3E7', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16 }}>📋</Text>
                </View>
                <View>
                  <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 15, color: themeStyles.text }}>
                    {test.parts?.[activePartId - 1]?.title || `Part ${activePartId}`} · Questions {qStart} – {qEnd}
                  </Text>
                  <Text style={{ fontFamily: 'BeVietnamPro_400Regular', fontSize: 13, color: '#6B7280' }}>
                    Nghe bài nói và trả lời trực tiếp các câu hỏi bên dưới theo chuẩn Computer-Delivered IELTS.
                  </Text>
                </View>
              </View>
            </View>

            {/* Questions Worksheet */}
            {questionWorksheetContent}
          </ScrollView>
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
          {/* CỘT TRÁI: BÀI ĐỌC (HOẶC TRANSCRIPT NGHE) */}
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
              {section === 'Listening' && (
                <SourceAudio
                  files={test.audioFiles.length ? test.audioFiles.map(assetUrl) : test.audioCloudUrl ? [test.audioCloudUrl] : []}
                  simulation={simulation}
                  activePartId={activePartId}
                  onPartChange={(p) => setActivePartId(p)}
                  showTranscript={showTranscript}
                  onToggleTranscript={() => setShowTranscript(false)}
                  hasTranscript={Boolean(passageDisplayData.paragraphs.length)}
                />
              )}

              {/* Tiêu đề bài đọc lớn & phụ đề dẫn dắt */}
              <View className="gap-2 border-b border-border/60 pb-4">
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

              {section === 'Listening' ? (
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
              ) : (
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
              )}
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

      {/* 3. BOTTOM NAVIGATION BAR (Chuẩn thanh số câu Computer-Delivered IELTS Image 1, 5) */}

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

            <Text style={{ fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: themeStyles.text }}>

              Practice

            </Text>

            <Text style={{ fontFamily: 'BeVietnamPro_500Medium', fontSize: 11, color: '#6B7280' }}>

              Đã làm {answeredInPartCount}/{partNumbers.length}

            </Text>

          </View>

          {/* Nút chuyển Passage nếu có nhiều part */}

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

                      backgroundColor: active ? '#8F6E36' : themeStyles.surface,

                      borderWidth: 1,

                      borderColor: active ? '#8F6E36' : themeStyles.border,

                    }}

                  >

                    <Text

                      style={{

                        fontFamily: 'BeVietnamPro_700Bold',

                        fontSize: 11,

                        color: active ? '#FFFFFF' : themeStyles.text,

                      }}

                    >

                      P{p.id}

                    </Text>

                  </Pressable>

                );

              })}

            </View>

          )}

        </View>

        {/* Chính giữa: Dãy số câu hỏi 1 2 3 ... 13 (Ảnh 1, 5) */}

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

              borderColor = '#8F6E36';

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

                // Vàng kim Band 9 với gradient & glow

                backgroundColor: '#8F6E36',

                boxShadow: pressed ? '0 1px 2px rgba(143,110,54,0.3)' : '0 3px 8px rgba(143,110,54,0.4)',

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

                    backgroundColor: '#8F6E36',

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

