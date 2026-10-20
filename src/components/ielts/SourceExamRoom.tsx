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

const assetUrl = (name: string) => `/api/ielts/local-ocr?asset=${encodeURIComponent(name)}`;

function clock(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Audio player cho phần thi Listening */
function SourceAudio({ files, simulation }: { files: string[]; simulation: boolean }) {
  const player = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState(0);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');
  const src = files[track];

  useEffect(() => {
    if (started && !ended) {
      player.current?.play().catch(() => setError('Bấm phát để tiếp tục audio.'));
    }
  }, [track, started, ended]);

  if (!src) {
    return (
      <View className="rounded-xl border border-border bg-surface p-3">
        <Text className="font-sans text-label text-muted">
          Chưa có file audio nguồn cho bài này. Bạn có thể xem đề và làm bài theo bản chép lời transcript.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5 gap-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon name="volume" size={16} color="#8F6E36" />
          <Text className="font-strong text-label text-ink">
            Audio Part {track + 1}/{files.length}
          </Text>
        </View>
        <Text className="font-sans text-label text-muted">
          {simulation ? 'Nghe 1 lần (chuẩn thi thật)' : 'Tự do nghe lại và tua'}
        </Text>
      </View>

      {Platform.OS === 'web' ? (
        React.createElement('audio', {
          ref: player,
          src,
          controls: !simulation,
          preload: 'metadata',
          onEnded: () => (track + 1 < files.length ? setTrack(track + 1) : setEnded(true)),
          onError: () => setError('Không tải được audio nguồn. Vui lòng thử lại.'),
          style: { width: '100%', height: 36 },
        })
      ) : null}

      {simulation && !ended && (
        <Pressable
          accessibilityRole="button"
          disabled={started && !error}
          onPress={() => {
            setStarted(true);
            setError('');
            player.current?.play().catch(() => setError('Bấm phát để cho phép phát audio.'));
          }}
          className={`rounded-xl py-2 px-4 items-center justify-center ${
            started && !error ? 'bg-muted/20' : 'bg-primary'
          }`}
        >
          <Text className={`font-strong text-label ${started && !error ? 'text-ink' : 'text-white'}`}>
            {started && !error ? 'Đang phát audio thi...' : '▶ Bắt đầu phát Audio'}
          </Text>
        </Pressable>
      )}

      {error ? <Text className="font-sans text-label text-red-600">{error}</Text> : null}
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

      {/* 2. MAIN 2-COLUMN SPLIT WORKSPACE (Ảnh 1, 2, 5: Bài đọc bên trái, Câu hỏi bên phải) */}
      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
        {/* CỘT TRÁI: BÀI ĐỌC CHI TIẾT (READING PASSAGE) */}
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
            {/* Audio player nếu là Listening */}
            {section === 'Listening' && (
              <SourceAudio
                files={test.audioFiles.length ? test.audioFiles.map(assetUrl) : test.audioCloudUrl ? [test.audioCloudUrl] : []}
                simulation={simulation}
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
                    fontSize: fontSizeLevel,
                    lineHeight: fontSizeLevel * 1.6,
                    color: '#4B5563',
                    fontStyle: 'italic',
                  }}
                >
                  {passageDisplayData.subtitle}
                </Text>
              ) : null}
            </View>

            {/* Các đoạn văn đầy đủ dài 800-1000 từ */}
            <View style={{ gap: 16 }}>
              {passageDisplayData.paragraphs.map((para, pIdx) => (
                <Text
                  key={pIdx}
                  selectable={true}
                  style={{
                    fontFamily: 'BeVietnamPro_400Regular',
                    fontSize: fontSizeLevel,
                    lineHeight: fontSizeLevel * 1.75,
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
            contentContainerStyle={{ paddingHorizontal: isDesktop ? 28 : 16, paddingVertical: 24, gap: 24 }}
          >
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
                          backgroundColor: isCurrent ? 'rgba(143,110,54,0.06)' : 'transparent',
                          borderWidth: isCurrent ? 1.5 : 1,
                          borderColor: isCurrent ? '#8F6E36' : themeStyles.border,
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
                                outlineStyle: 'none',
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
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 10,
                                      padding: 10,
                                      borderRadius: 10,
                                      borderWidth: 1,
                                      borderColor: selected ? '#8F6E36' : themeStyles.border,
                                      backgroundColor: selected ? 'rgba(143,110,54,0.1)' : themeStyles.surface,
                                    }}
                                  >
                                    <View
                                      style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 10,
                                        borderWidth: 1.5,
                                        borderColor: selected ? '#8F6E36' : '#9CA3AF',
                                        backgroundColor: selected ? '#8F6E36' : 'transparent',
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

                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                              {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => {
                                const selected = val.trim().toUpperCase() === opt;
                                return (
                                  <Pressable
                                    key={opt}
                                    disabled={submitted}
                                    onPress={() => onAnswerChange(q.number, opt)}
                                    style={{
                                      paddingHorizontal: 14,
                                      paddingVertical: 7,
                                      borderRadius: 8,
                                      borderWidth: 1,
                                      borderColor: selected ? '#8F6E36' : themeStyles.border,
                                      backgroundColor: selected ? '#8F6E36' : themeStyles.surface,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontFamily: 'BeVietnamPro_700Bold',
                                        fontSize: 12,
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
          </ScrollView>
        </View>
      </View>

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
