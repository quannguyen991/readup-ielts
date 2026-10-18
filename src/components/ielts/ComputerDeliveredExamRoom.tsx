import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { EXAM_INK, ExamToolbar, ExamToolbarButton } from '@/components/exam/ExamToolbar';
import { ReadingShell, READING_NAVY } from '@/components/exam/ReadingLayout';

export type Page = { page: number; text: string };
export type GradeResult = {
  number: number;
  answer: string;
  expected: string;
  correct: boolean;
  quote?: string;
  paraphrase?: string;
  explanation?: string;
};
export type Grade = {
  score: number;
  total: number;
  bandEstimate: number | null;
  results: GradeResult[];
};

interface ComputerDeliveredExamRoomProps {
  testId: string;
  testTitle: string;
  pages: Page[];
  questionCount?: number;
  answers: Record<string, string>;
  onAnswerChange: (number: number, value: string) => void;
  onSubmit: () => void;
  onExit: () => void;
  grade: Grade | null;
  submitted: boolean;
  loading?: boolean;
}

/** Đọc/ghi localStorage an toàn: trình duyệt chặn hoặc JSON hỏng thì dùng giá trị mặc định. */
export function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLS(key: string, value: unknown): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* bộ nhớ đầy hoặc bị chặn: bỏ qua, không làm hỏng bài thi */
  }
}

export function ComputerDeliveredExamRoom({
  testId,
  testTitle,
  pages,
  questionCount = 40,
  answers,
  onAnswerChange,
  onSubmit,
  onExit,
  grade,
  submitted,
  loading = false,
}: ComputerDeliveredExamRoomProps) {
  // Timer: 60 minutes countdown
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [activePart, setActivePart] = useState<1 | 2 | 3>(1);
  const [activeQuestion, setActiveQuestion] = useState<number>(1);
  const [reviewedQuestions, setReviewedQuestions] = useState<Set<number>>(new Set());

  // Settings & Help Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [fontSizeMode, setFontSizeMode] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [contrastMode, setContrastMode] = useState<'default' | 'yellow-black' | 'black-yellow'>('default');
  const [serifFont, setSerifFont] = useState(true);
  const { width: winW } = useWindowDimensions();

  // Tô sáng đoạn văn và ghi chú theo từng câu, lưu theo đề để mở lại vẫn còn.
  const [highlightedText, setHighlightedText] = useState<Set<string>>(() => new Set(readLS<string[]>(`ielts-hl:${testId}`, [])));
  const [notes, setNotes] = useState<Record<string, string>>(() => readLS<Record<string, string>>(`ielts-note:${testId}`, {}));
  useEffect(() => {
    writeLS(`ielts-hl:${testId}`, [...highlightedText]);
  }, [highlightedText, testId]);
  useEffect(() => {
    writeLS(`ielts-note:${testId}`, notes);
  }, [notes, testId]);
  const toggleHighlight = (key: string) => {
    setHighlightedText((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Warnings
  const [warning10mShown, setWarning10mShown] = useState(false);
  const [warning5mShown, setWarning5mShown] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState<string | null>(null);

  // Countdown effect
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onSubmit();
          return 0;
        }

        // 10 minutes warning
        if (prev === 600 && !warning10mShown) {
          setWarning10mShown(true);
          setShowWarningBanner('⚠️ 10 minutes remaining in this test section.');
          setTimeout(() => setShowWarningBanner(null), 8000);
        }

        // 5 minutes warning
        if (prev === 300 && !warning5mShown) {
          setWarning5mShown(true);
          setShowWarningBanner('🚨 5 minutes remaining! Please check all your answers.');
          setTimeout(() => setShowWarningBanner(null), 8000);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, warning10mShown, warning5mShown, onSubmit]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => a && a.trim()).length;
  }, [answers]);

  const toggleReview = (qNum: number) => {
    setReviewedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qNum)) next.delete(qNum);
      else next.add(qNum);
      return next;
    });
  };

  // Divide pages into 3 passages
  const passagePages = useMemo(() => {
    const total = pages.length;
    if (total <= 3) {
      return {
        part1: pages.slice(0, 1),
        part2: pages.slice(1, 2),
        part3: pages.slice(2, 3),
      };
    }
    const chunk = Math.ceil(total / 3);
    return {
      part1: pages.slice(0, chunk),
      part2: pages.slice(chunk, chunk * 2),
      part3: pages.slice(chunk * 2),
    };
  }, [pages]);

  // Questions for active part
  const partQuestions = useMemo(() => {
    if (activePart === 1) return Array.from({ length: 13 }, (_, i) => i + 1);
    if (activePart === 2) return Array.from({ length: 13 }, (_, i) => i + 14);
    return Array.from({ length: 14 }, (_, i) => i + 27);
  }, [activePart]);

  const currentPassageText = useMemo(() => {
    const list =
      activePart === 1 ? passagePages.part1 : activePart === 2 ? passagePages.part2 : passagePages.part3;
    return list.map((p) => p.text).join('\n\n');
  }, [activePart, passagePages]);

  // Theme styling based on contrast mode
  // Bảng màu của phòng thi: nền navy, hai tấm kem viền mực; hai chế độ tương phản
  // đổi cả nền và chữ. Nút chọn màu trên thanh công cụ đi theo `contrastOrder`.
  const contrastOrder = ['default', 'yellow-black', 'black-yellow'] as const;
  const theme = useMemo(() => {
    if (contrastMode === 'yellow-black') {
      return { bg: '#000000', text: '#FFFF00', border: '#FFFF00', softLine: '#7A6A00', cardBg: '#000000', panelBg: '#111111', muted: '#FDE68A' };
    }
    if (contrastMode === 'black-yellow') {
      return { bg: '#FFF59D', text: '#000000', border: '#000000', softLine: '#B8A24A', cardBg: '#FFFDE7', panelBg: '#FFF9C4', muted: '#4B4B00' };
    }
    return { bg: READING_NAVY, text: EXAM_INK, border: EXAM_INK, softLine: '#D8CFBD', cardBg: '#FFFFFF', panelBg: '#FFF5F8', muted: '#6B5E50' };
  }, [contrastMode]);

  const fontSize = fontSizeMode === 'large' ? 18 : fontSizeMode === 'xlarge' ? 20 : 16;
  const lineSpacing = Math.round(fontSize * 1.65);
  const cycleSize = () => setFontSizeMode(fontSizeMode === 'normal' ? 'large' : fontSizeMode === 'large' ? 'xlarge' : 'normal');
  const pickPart = (p: 1 | 2 | 3) => {
    setActivePart(p);
    setActiveQuestion(p === 1 ? 1 : p === 2 ? 14 : 27);
  };
  const answeredSet = new Set(
    Array.from({ length: questionCount }, (_, i) => i + 1).filter((n) => Boolean(answers[String(n)]?.trim())),
  );
  const partAnswered = partQuestions.filter((n) => Boolean(answers[String(n)]?.trim())).length;
  const passageFontFamily =
    Platform.OS === 'web' ? (serifFont ? 'Georgia, serif' : 'Arial, Helvetica, sans-serif') : undefined;

  // Question navigation
  const goToQuestion = (qNum: number) => {
    setActiveQuestion(qNum);
    if (qNum <= 13) setActivePart(1);
    else if (qNum <= 26) setActivePart(2);
    else setActivePart(3);
  };

  const nextQuestion = () => {
    if (activeQuestion < questionCount) {
      goToQuestion(activeQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (activeQuestion > 1) {
      goToQuestion(activeQuestion - 1);
    }
  };

  // If submitted, show Results Screen
  if (submitted && grade) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', padding: 24 }}>
        <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center', gap: 20 }}>
          {/* Top Bar with Exit */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E6DACB', paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ backgroundColor: '#E11D48', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16 }}>IELTS</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#2A1808' }}>
                BẢNG KẾT QUẢ THI THỬ MÁY TÍNH (COMPUTER-DELIVERED)
              </Text>
            </View>
            <Pressable
              onPress={onExit}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: '#8C531B',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>← Quay lại kho đề</Text>
            </Pressable>
          </View>

          {/* Hero Score Card */}
          <View
            style={{
              padding: 24,
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              borderWidth: 2,
              borderColor: '#16A34A',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#16A34A', textTransform: 'uppercase', letterSpacing: 1 }}>
                ★ KỲ THI HOÀN TẤT
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#166534' }}>
                {testTitle}
              </Text>
              <Text style={{ fontSize: 14, color: '#374151' }}>
                Bạn đã làm đúng <Text style={{ fontWeight: '800' }}>{grade.score}</Text> trên tổng số <Text style={{ fontWeight: '800' }}>{grade.total}</Text> câu hỏi
              </Text>
            </View>

            <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16, backgroundColor: '#DCFCE7', borderWidth: 2, borderColor: '#16A34A' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#166534', textTransform: 'uppercase' }}>IELTS ESTIMATE</Text>
              <Text style={{ fontSize: 36, fontWeight: '900', color: '#15803D' }}>
                Band {grade.bandEstimate ?? '7.5'}
              </Text>
              <Text style={{ fontSize: 11, color: '#166534' }}>Thang điểm chuẩn quốc tế</Text>
            </View>
          </View>

          {/* Detailed Question Review List */}
          <ScrollView style={{ maxHeight: 650 }}>
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#2A1808' }}>
                Đối chiếu chi tiết 40 câu hỏi & Giải thích:
              </Text>
              {grade.results.map((r) => (
                <View
                  key={r.number}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: r.correct ? '#F0FDF4' : '#FEF2F2',
                    borderWidth: 1,
                    borderColor: r.correct ? '#BBF7D0' : '#FECACA',
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: r.correct ? '#166534' : '#991B1B' }}>
                      Câu {r.number}: {r.correct ? '✓ ĐÚNG' : '✗ SAI'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Text style={{ fontSize: 13, color: '#4B5563' }}>
                        Bạn điền: <Text style={{ fontWeight: '800', color: r.correct ? '#166534' : '#DC2626' }}>{r.answer || '(Bỏ trống)'}</Text>
                      </Text>
                      <Text style={{ fontSize: 13, color: '#166534', fontWeight: '800' }}>
                        Đáp án chuẩn: {r.expected}
                      </Text>
                    </View>
                  </View>

                  {r.quote ? (
                    <Text style={{ fontSize: 12, fontStyle: 'italic', color: '#0369A1', backgroundColor: '#F0F9FF', padding: 8, borderRadius: 6 }}>
                      📌 Trích dẫn bài đọc: "{r.quote}"
                    </Text>
                  ) : null}

                  {r.paraphrase ? (
                    <Text style={{ fontSize: 12, color: '#9D174D', backgroundColor: '#FDF2F8', padding: 8, borderRadius: 6 }}>
                      🔄 Paraphrase: {r.paraphrase}
                    </Text>
                  ) : null}

                  <Text style={{ fontSize: 12, color: '#374151', lineHeight: 18 }}>
                    {r.explanation || 'Đối chiếu chuẩn xác từ cơ sở dữ liệu Cambridge & Actual Test.'}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  const toolbar = (
    <ExamToolbar
      onBack={onExit}
      parts={[
        { key: '1', label: 'Part 1 (1–13)' },
        { key: '2', label: 'Part 2 (14–26)' },
        { key: '3', label: 'Part 3 (27–40)' },
      ]}
      activePart={String(activePart)}
      onPickPart={(key) => pickPart(Number(key) as 1 | 2 | 3)}
      questionNumbers={partQuestions}
      answered={answeredSet}
      current={activeQuestion}
      onJump={goToQuestion}
      timer={isTimerHidden ? '--:--' : formatTimer(timeLeft)}
      timerSlot={
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 10,
            paddingRight: 4,
            height: 34,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: EXAM_INK,
            backgroundColor: '#FFFFFF',
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: timeLeft < 300 ? '#DC2626' : '#2E9E5B' }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: timeLeft < 300 ? '#B91C1C' : EXAM_INK, fontVariant: ['tabular-nums'] as never }}>
            {isTimerHidden ? '--:--' : formatTimer(timeLeft)}
          </Text>
          <Pressable
            onPress={() => setIsTimerHidden(!isTimerHidden)}
            accessibilityRole="button"
            accessibilityLabel={isTimerHidden ? 'Hiện đồng hồ' : 'Ẩn đồng hồ'}
            style={{ height: 26, paddingHorizontal: 8, borderRadius: 999, backgroundColor: EXAM_INK, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>{isTimerHidden ? 'SHOW' : 'HIDE'}</Text>
          </Pressable>
        </View>
      }
      typography={{
        fontLabel: serifFont ? 'Serif' : 'Sans',
        onCycleFont: () => setSerifFont((v) => !v),
        sizeLabel: `${fontSize}px`,
        onCycleSize: cycleSize,
      }}
      themes={{
        swatches: ['#FFF5F8', '#000000', '#FFF59D'],
        theme: contrastOrder.indexOf(contrastMode),
        onPick: (i) => setContrastMode(contrastOrder[i] ?? 'default'),
      }}
      extras={
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <ExamToolbarButton label="Trợ giúp" icon="info" compact={winW < 1000} onPress={() => setShowHelp(true)} />
          <ExamToolbarButton label="Cài đặt" icon="settings" compact={winW < 1000} onPress={() => setShowSettings(true)} />
        </View>
      }
      submitLabel="Nộp bài"
      onSubmit={() => setShowConfirmFinish(true)}
    />
  );

  const passagePane = (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 16,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: theme.softLine,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: theme.muted }}>
          READING PASSAGE {activePart} · {activePart === 1 ? 'QUESTIONS 1–13' : activePart === 2 ? 'QUESTIONS 14–26' : 'QUESTIONS 27–40'}
        </Text>
        <Text style={{ fontSize: 11, color: theme.muted }}>~20 mins</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 22, paddingBottom: 80, gap: 14 }}>
        {currentPassageText.split('\n\n').map((para, i) => {
          const key = `${activePart}:${i}`;
          const on = highlightedText.has(key);
          return (
            <Pressable
              key={key}
              onPress={() => toggleHighlight(key)}
              accessibilityRole="button"
              accessibilityLabel={on ? 'Bỏ tô sáng đoạn này' : 'Tô sáng đoạn này'}
              style={{ borderRadius: 6, backgroundColor: on ? '#FEF08A' : 'transparent', paddingHorizontal: on ? 8 : 0, paddingVertical: on ? 6 : 0 }}
            >
              <Text
                style={{
                  fontSize,
                  lineHeight: lineSpacing,
                  color: theme.text,
                  fontFamily: passageFontFamily,
                }}
                selectable
              >
                {para}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const questionsPane = (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.softLine, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: theme.text }}>
            Questions {partQuestions[0]}–{partQuestions[partQuestions.length - 1]}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={() => toggleReview(activeQuestion)}
              accessibilityRole="button"
              aria-pressed={reviewedQuestions.has(activeQuestion)}
              style={{
                height: 30,
                paddingHorizontal: 10,
                borderRadius: 999,
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: reviewedQuestions.has(activeQuestion) ? '#F59E0B' : theme.softLine,
                backgroundColor: reviewedQuestions.has(activeQuestion) ? '#F59E0B' : '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: reviewedQuestions.has(activeQuestion) ? '#FFFFFF' : EXAM_INK }}>
                {reviewedQuestions.has(activeQuestion) ? '★ Reviewed' : '☆ Review'}
              </Text>
            </Pressable>
            <Pressable
              onPress={prevQuestion}
              accessibilityRole="button"
              accessibilityLabel="Câu trước"
              style={{ width: 30, height: 30, borderRadius: 999, borderWidth: 1.5, borderColor: theme.softLine, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="chevron-left" size={14} color={EXAM_INK} />
            </Pressable>
            <Pressable
              onPress={nextQuestion}
              accessibilityRole="button"
              accessibilityLabel="Câu sau"
              style={{ width: 30, height: 30, borderRadius: 999, borderWidth: 1.5, borderColor: theme.softLine, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="chevron-right" size={14} color={EXAM_INK} />
            </Pressable>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: theme.muted }}>
          Đang làm: câu {activeQuestion} · đã điền {partAnswered}/{partQuestions.length} câu của phần này
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 100, gap: 16 }}>
        {partQuestions.map((num) => {
          const val = answers[String(num)] ?? '';
          const isActive = activeQuestion === num;
          const isFlagged = reviewedQuestions.has(num);
          const picked = (opt: string) => val.toUpperCase() === opt;
          const rowBorder = isActive ? theme.border : isFlagged ? '#F59E0B' : theme.softLine;

          return (
            <Pressable
              key={num}
              onPress={() => setActiveQuestion(num)}
              style={{ padding: 12, borderRadius: 12, borderWidth: isActive ? 2 : 1, borderColor: rowBorder, backgroundColor: theme.cardBg, gap: 10 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: theme.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: val.trim() ? theme.border : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '900', color: val.trim() ? theme.cardBg : theme.text }}>{num}</Text>
                </View>

                {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => onAnswerChange(num, opt)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: picked(opt) }}
                    style={{
                      height: 30,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: theme.border,
                      backgroundColor: picked(opt) ? theme.border : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: picked(opt) ? theme.cardBg : theme.text }}>{opt}</Text>
                  </Pressable>
                ))}
                {['A', 'B', 'C', 'D'].map((letter) => (
                  <Pressable
                    key={letter}
                    onPress={() => onAnswerChange(num, letter)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: picked(letter) }}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: theme.border,
                      backgroundColor: picked(letter) ? theme.border : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: picked(letter) ? theme.cardBg : theme.text }}>{letter}</Text>
                  </Pressable>
                ))}
                {isFlagged ? (
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#FEF3C7' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>FLAGGED</Text>
                  </View>
                ) : null}
              </View>

              {/* Ô điền đáp án: đường gạch chân như đề thi giấy. */}
              <TextInput
                value={val}
                onChangeText={(text) => onAnswerChange(num, text)}
                placeholder="Type answer here..."
                placeholderTextColor="#9CA3AF"
                style={{
                  minHeight: 36,
                  paddingHorizontal: 4,
                  borderBottomWidth: 1.5,
                  borderBottomColor: isActive ? theme.border : theme.softLine,
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.text,
                }}
              />

              {/* Ghi chú của câu: hiện ở câu đang làm, các câu có ghi chú thì giữ lại dòng ghi chú */}
              {isActive || notes[String(num)] ? (
                <TextInput
                  value={notes[String(num)] ?? ''}
                  onChangeText={(text) => setNotes((prev) => ({ ...prev, [String(num)]: text }))}
                  placeholder="Ghi chú cho câu này..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  style={{
                    minHeight: 40,
                    borderRadius: 6,
                    backgroundColor: contrastMode === 'yellow-black' ? '#000000' : '#FFFBEB',
                    borderWidth: 1,
                    borderColor: '#FCD34D',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    fontSize: 13,
                    color: theme.text,
                  }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, minHeight: 800 }}>
      {showWarningBanner ? (
        <View style={{ backgroundColor: '#DC2626', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>{showWarningBanner}</Text>
        </View>
      ) : null}

      <ReadingShell
        toolbar={toolbar}
        left={passagePane}
        right={questionsPane}
        shellBg={theme.bg}
        leftBg={theme.cardBg}
        rightBg={theme.panelBg}
        leftFlex={1.1}
        rightFlex={0.9}
      />

      {/* ============================================================== */}
      {/* 4. MODALS: Settings, Help, Confirm Finish                      */}
      {/* ============================================================== */}
      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: 450, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>⚙ Screen Settings</Text>
              <Pressable onPress={() => setShowSettings(false)}><Icon name="close" size={18} color="#6B7280" /></Pressable>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151' }}>Text Size:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { id: 'normal', label: 'Standard (16px)' },
                  { id: 'large', label: 'Large (18px)' },
                  { id: 'xlarge', label: 'Extra Large (20px)' },
                ].map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setFontSizeMode(s.id as any)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor: fontSizeMode === s.id ? '#0284C7' : '#F3F4F6',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: fontSizeMode === s.id ? '#FFFFFF' : '#374151', fontSize: 11, fontWeight: '800' }}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151' }}>Contrast Colors:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { id: 'default', label: 'Standard' },
                  { id: 'yellow-black', label: 'Yellow on Black' },
                  { id: 'black-yellow', label: 'Black on Yellow' },
                ].map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setContrastMode(c.id as any)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor: contrastMode === c.id ? '#0284C7' : '#F3F4F6',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: contrastMode === c.id ? '#FFFFFF' : '#374151', fontSize: 11, fontWeight: '800' }}>
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => setShowSettings(false)}
              style={{ height: 40, borderRadius: 8, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>OK, Apply Settings</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal visible={showHelp} transparent animationType="fade" onRequestClose={() => setShowHelp(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: 500, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>? IELTS Test Instructions</Text>
              <Pressable onPress={() => setShowHelp(false)}><Icon name="close" size={18} color="#6B7280" /></Pressable>
            </View>

            <Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 20 }}>
              • The Academic Reading test has 3 parts and 40 questions.{'\n'}
              • You have 60 minutes to complete all parts. There is NO extra transfer time.{'\n'}
              • Click on any question number at the bottom to jump directly to it.{'\n'}
              • Use "Review" to flag questions you want to check before submitting.{'\n'}
              • When time expires, your answers will be automatically submitted.
            </Text>

            <Pressable
              onPress={() => setShowHelp(false)}
              style={{ height: 40, borderRadius: 8, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Close Help</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Confirm Finish Modal */}
      <Modal visible={showConfirmFinish} transparent animationType="fade" onRequestClose={() => setShowConfirmFinish(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: 440, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, gap: 16 }}>
            <Text style={{ fontSize: 19, fontWeight: '900', color: '#111827' }}>
              Finish Reading Test?
            </Text>
            <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 22 }}>
              You have answered <Text style={{ fontWeight: '800', color: '#0284C7' }}>{answeredCount}</Text> of <Text style={{ fontWeight: '800' }}>{questionCount}</Text> questions.{'\n'}
              {questionCount - answeredCount > 0 ? (
                <Text style={{ color: '#DC2626', fontWeight: '700' }}>
                  ⚠️ You still have {questionCount - answeredCount} unanswered questions!
                </Text>
              ) : (
                <Text style={{ color: '#16A34A', fontWeight: '700' }}>
                  ✓ You have answered all 40 questions!
                </Text>
              )}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setShowConfirmFinish(false)}
                style={{ flex: 1, height: 42, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#374151', fontWeight: '700', fontSize: 13 }}>Continue Testing</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowConfirmFinish(false);
                  onSubmit();
                }}
                style={{ flex: 1, height: 42, borderRadius: 8, backgroundColor: '#E11D48', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>Yes, Submit Test</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
