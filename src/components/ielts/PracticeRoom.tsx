import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text as RNText, TextInput, View, type TextProps } from 'react-native';
import { Icon, type IconName } from '@/components/ui/Icon';
import { readLS, writeLS, type Page, type Grade } from './ComputerDeliveredExamRoom';

/** Phông Be Vietnam Pro của Band 9, chọn theo độ đậm cũ của từng chữ. */
function fontFor(weight: unknown): string {
  switch (String(weight)) {
    case '900':
    case '800':
      return 'BeVietnamPro_800ExtraBold';
    case '700':
    case 'bold':
      return 'BeVietnamPro_700Bold';
    case '600':
      return 'BeVietnamPro_600SemiBold';
    case '500':
      return 'BeVietnamPro_500Medium';
    default:
      return 'BeVietnamPro_400Regular';
  }
}

function Text(props: TextProps & { style?: unknown }) {
  const flat = (Array.isArray(props.style) ? Object.assign({}, ...props.style) : props.style ?? {}) as { fontWeight?: unknown };
  return <RNText {...props} style={[{ fontFamily: fontFor(flat.fontWeight) }, props.style as never]} />;
}

const INK = '#1F1A14';
const MUTED = '#6B5E50';
const LINE = '#E6DFD2';
const PAPER = '#F5F1EA';
const GOLD = '#B8955A';
const GOLD_DARK = '#8F6E36';
const NAVY = '#0F1D33';
const SERIF = Platform.OS === 'web' ? 'Georgia, serif' : undefined;

interface PracticeRoomProps {
  testId?: string;
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

const CHOICES = ['TRUE', 'FALSE', 'NOT GIVEN'];
const LETTERS = ['A', 'B', 'C', 'D'];

export function PracticeRoom({
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
}: PracticeRoomProps) {
  const [selectedPart, setSelectedPart] = useState<'all' | 1 | 2 | 3>('all');
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [onlyNotes, setOnlyNotes] = useState(false);
  const [activeNav, setActiveNav] = useState<number>(1);

  // Tô sáng đoạn văn và ghi chú theo từng câu, lưu theo đề để mở lại vẫn còn.
  const storeKey = testId ?? testTitle;
  const [highlightedText, setHighlightedText] = useState<Set<string>>(() => new Set(readLS<string[]>(`ielts-hl:${storeKey}`, [])));
  const [notes, setNotes] = useState<Record<string, string>>(() => readLS<Record<string, string>>(`ielts-note:${storeKey}`, {}));
  const [noteOpen, setNoteOpen] = useState<Record<number, boolean>>({});
  useEffect(() => {
    writeLS(`ielts-hl:${storeKey}`, [...highlightedText]);
  }, [highlightedText, storeKey]);
  useEffect(() => {
    writeLS(`ielts-note:${storeKey}`, notes);
  }, [notes, storeKey]);

  const scrollRef = useRef<ScrollView>(null);
  const cardY = useRef<Record<number, number>>({});

  useEffect(() => {
    if (isPaused || submitted) return;
    const timer = setInterval(() => setElapsedSecs((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isPaused, submitted]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const passagePages = useMemo(() => {
    const total = pages.length;
    if (total <= 3) {
      return { part1: pages.slice(0, 1), part2: pages.slice(1, 2), part3: pages.slice(2, 3) };
    }
    const chunk = Math.ceil(total / 3);
    return { part1: pages.slice(0, chunk), part2: pages.slice(chunk, chunk * 2), part3: pages.slice(chunk * 2) };
  }, [pages]);

  const baseQuestions = useMemo(() => {
    if (selectedPart === 1) return Array.from({ length: 13 }, (_, i) => i + 1);
    if (selectedPart === 2) return Array.from({ length: 13 }, (_, i) => i + 14);
    if (selectedPart === 3) return Array.from({ length: 14 }, (_, i) => i + 27);
    return Array.from({ length: questionCount }, (_, i) => i + 1);
  }, [selectedPart, questionCount]);

  const activeQuestions = useMemo(
    () => (onlyNotes ? baseQuestions.filter((n) => notes[String(n)]?.trim()) : baseQuestions),
    [baseQuestions, onlyNotes, notes],
  );

  const displayedPassageText = useMemo(() => {
    if (selectedPart === 1) return passagePages.part1.map((p) => p.text).join('\n\n');
    if (selectedPart === 2) return passagePages.part2.map((p) => p.text).join('\n\n');
    if (selectedPart === 3) return passagePages.part3.map((p) => p.text).join('\n\n');
    return pages.map((p) => p.text).join('\n\n');
  }, [selectedPart, passagePages, pages]);

  const paragraphs = displayedPassageText.split('\n\n');
  const answeredCount = useMemo(() => Object.values(answers).filter((a) => a && a.trim()).length, [answers]);
  const partAnswered = baseQuestions.filter((n) => answers[String(n)]?.trim()).length;

  const toggleHighlight = (key: string) => {
    setHighlightedText((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearHighlights = () => {
    setHighlightedText((prev) => {
      const next = new Set(prev);
      for (const k of [...next]) if (k.startsWith(`${selectedPart}:`)) next.delete(k);
      return next;
    });
  };

  const jumpTo = (num: number) => {
    setActiveNav(num);
    const y = cardY.current[num];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: PAPER }}>
      {/* ===== Thanh trên: thoát, đồng hồ, nộp bài ===== */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingHorizontal: 18,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: LINE,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
          <Pressable onPress={onExit} accessibilityRole="button" accessibilityLabel="Đóng" style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: PAPER }}>
            <Icon name="close" size={18} color={INK} />
          </Pressable>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: GOLD_DARK, letterSpacing: 1 }}>LUYỆN TẬP</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: INK }} numberOfLines={1}>{testTitle}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: PAPER }}>
          <Icon name="clock" size={15} color={GOLD_DARK} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: INK }}>{formatTimer(elapsedSecs)}</Text>
          <Pressable onPress={() => setIsPaused(!isPaused)} accessibilityRole="button" style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: isPaused ? '#166534' : '#FFFFFF', borderWidth: 1, borderColor: LINE }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: isPaused ? '#FFFFFF' : INK }}>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</Text>
          </Pressable>
        </View>

        <Pressable onPress={onSubmit} accessibilityRole="button" style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: GOLD }}>
          <Text style={{ color: NAVY, fontSize: 13, fontWeight: '900' }}>Nộp bài chấm Band</Text>
        </Pressable>
      </View>

      {/* ===== Chọn phần đọc ===== */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: PAPER }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all' as const, label: `Tất cả (${questionCount} câu)` },
            { id: 1 as const, label: 'Passage 1' },
            { id: 2 as const, label: 'Passage 2' },
            { id: 3 as const, label: 'Passage 3' },
          ].map((tab) => {
            const on = selectedPart === tab.id;
            return (
              <Pressable
                key={String(tab.id)}
                onPress={() => {
                  setSelectedPart(tab.id);
                  setActiveNav(tab.id === 'all' ? 1 : tab.id === 1 ? 1 : tab.id === 2 ? 14 : 27);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: on ? NAVY : '#FFFFFF', borderWidth: 1, borderColor: on ? NAVY : LINE }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: on ? '#FFFFFF' : INK }}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontSize: 12, color: MUTED }}>Đã điền {partAnswered}/{baseQuestions.length} câu của phần này · tổng {answeredCount}</Text>
      </View>

      {/* ===== Thân: cột công cụ, đoạn văn, câu hỏi ===== */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: 92, padding: 10, gap: 10, backgroundColor: '#FFFFFF', borderRightWidth: 1, borderRightColor: LINE }}>
          <ToolButton icon="pencil" label="Tô sáng" hint="Chạm đoạn văn" />
          <ToolButton icon="note" label="Ghi chú" hint={onlyNotes ? 'Đang lọc' : 'Chỉ câu có ghi chú'} active={onlyNotes} onPress={() => setOnlyNotes((v) => !v)} />
          <ToolButton icon="close" label="Xóa tô sáng" hint="Phần đang xem" onPress={clearHighlights} />
        </View>

        {/* Đoạn văn */}
        <View style={{ flex: 1.1, padding: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 22 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: GOLD_DARK, letterSpacing: 1 }}>
              {selectedPart === 'all' ? 'TOÀN BỘ BÀI ĐỌC' : `READING PASSAGE ${selectedPart}`}
            </Text>
            <Text style={{ fontSize: 12, color: MUTED, marginTop: 4, marginBottom: 12 }}>Chạm vào đoạn để tô sáng. Bôi đen chữ để tra từ.</Text>
            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
              {paragraphs.map((para, i) => {
                const key = `${selectedPart}:${i}`;
                const on = highlightedText.has(key);
                const letter = String.fromCharCode(65 + (i % 26));
                return (
                  <View key={key} style={{ flexDirection: 'row', gap: 10 }}>
                    <Text style={{ width: 22, fontSize: 14, fontWeight: '800', color: GOLD_DARK, paddingTop: 2 }}>{letter}</Text>
                    <Pressable
                      onPress={() => toggleHighlight(key)}
                      accessibilityRole="button"
                      accessibilityLabel={on ? 'Bỏ tô sáng đoạn này' : 'Tô sáng đoạn này'}
                      style={{ flex: 1, borderRadius: 6, backgroundColor: on ? '#FEF08A' : 'transparent', paddingHorizontal: on ? 8 : 0, paddingVertical: on ? 4 : 0 }}
                    >
                      <Text style={{ fontSize: 15, lineHeight: 24, color: INK, fontFamily: SERIF }} selectable>{para}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Câu hỏi */}
        <View style={{ flex: 0.9, padding: 16, paddingLeft: 0 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 16, gap: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: INK }}>
              {activeQuestions.length ? `Câu ${activeQuestions[0]}–${activeQuestions[activeQuestions.length - 1]}` : 'Không có câu nào'}
            </Text>
            {[
              ['TRUE', 'Thông tin khớp với bài đọc'],
              ['FALSE', 'Thông tin mâu thuẫn với bài đọc'],
              ['NOT GIVEN', 'Bài đọc không đề cập'],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ width: 84, fontSize: 12, fontWeight: '800', color: INK }}>{k}</Text>
                <Text style={{ flex: 1, fontSize: 12, color: MUTED }}>{v}</Text>
              </View>
            ))}
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {activeQuestions.map((num) => {
              const val = answers[String(num)] ?? '';
              const isChecked = checkedQuestions[num];
              const res = grade?.results.find((r) => r.number === num);
              const isShowingExpl = showExplanation[num];
              const isActive = activeNav === num;
              const border = isChecked && res?.correct ? '#16A34A' : isChecked && res && !res.correct ? '#DC2626' : isActive ? GOLD : LINE;

              return (
                <View
                  key={num}
                  onLayout={(e) => {
                    cardY.current[num] = e.nativeEvent.layout.y;
                  }}
                  style={{ padding: 16, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: isActive ? 2 : 1, borderColor: border, gap: 12 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: val.trim() ? NAVY : PAPER, borderWidth: 1, borderColor: val.trim() ? NAVY : LINE }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: val.trim() ? '#FFFFFF' : INK }}>{num}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: INK }}>Câu {num}</Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setCheckedQuestions((prev) => ({ ...prev, [num]: true }));
                        setShowExplanation((prev) => ({ ...prev, [num]: !prev[num] }));
                      }}
                      accessibilityRole="button"
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: PAPER, borderWidth: 1, borderColor: LINE }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: GOLD_DARK }}>{isShowingExpl ? 'Ẩn giải thích' : 'Xem giải thích'}</Text>
                    </Pressable>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {CHOICES.map((opt) => {
                      const on = val.toUpperCase() === opt;
                      return (
                        <Pressable key={opt} onPress={() => onAnswerChange(num, opt)} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: on ? NAVY : PAPER, borderWidth: 1, borderColor: on ? NAVY : LINE }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: on ? '#FFFFFF' : INK }}>{opt}</Text>
                        </Pressable>
                      );
                    })}
                    {LETTERS.map((letter) => {
                      const on = val.toUpperCase() === letter;
                      return (
                        <Pressable key={letter} onPress={() => onAnswerChange(num, letter)} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? NAVY : PAPER, borderWidth: 1, borderColor: on ? NAVY : LINE }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: on ? '#FFFFFF' : INK }}>{letter}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    value={val}
                    onChangeText={(t) => onAnswerChange(num, t)}
                    placeholder="Điền câu trả lời..."
                    placeholderTextColor="#A39686"
                    style={{ height: 40, borderRadius: 8, backgroundColor: PAPER, borderWidth: 1, borderColor: LINE, paddingHorizontal: 12, fontSize: 14, color: INK }}
                  />

                  <Pressable onPress={() => setNoteOpen((p) => ({ ...p, [num]: !p[num] }))} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: GOLD_DARK }}>
                      {notes[String(num)] ? 'Ghi chú của câu này' : noteOpen[num] ? 'Ẩn ghi chú' : '+ Ghi chú'}
                    </Text>
                  </Pressable>
                  {noteOpen[num] || notes[String(num)] ? (
                    <TextInput
                      value={notes[String(num)] ?? ''}
                      onChangeText={(t) => setNotes((prev) => ({ ...prev, [String(num)]: t }))}
                      placeholder="Ghi chú cho câu này..."
                      placeholderTextColor="#A39686"
                      multiline
                      style={{ minHeight: 40, borderRadius: 8, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D', paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: INK }}
                    />
                  ) : null}

                  {isShowingExpl ? (
                    <View style={{ padding: 12, borderRadius: 10, backgroundColor: PAPER, borderWidth: 1, borderColor: LINE, gap: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: GOLD_DARK }}>Đáp án chuẩn: {res ? res.expected : 'Xem đáp án trong bộ đề'}</Text>
                      {res?.quote ? <Text style={{ fontSize: 12, fontStyle: 'italic', color: '#0369A1' }}>Trích dẫn: "{res.quote}"</Text> : null}
                      {res?.paraphrase ? <Text style={{ fontSize: 12, color: '#9D174D' }}>Diễn đạt lại: {res.paraphrase}</Text> : null}
                      <Text style={{ fontSize: 12, color: INK, lineHeight: 17 }}>{res?.explanation || 'Dữ liệu được chuẩn hoá theo bộ đề Cambridge IELTS.'}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ===== Thanh số câu ở đáy ===== */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: LINE }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: MUTED }}>Câu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
          {activeQuestions.map((num) => {
            const answered = Boolean(answers[String(num)]?.trim());
            const active = activeNav === num;
            return (
              <Pressable
                key={num}
                onPress={() => jumpTo(num)}
                accessibilityRole="button"
                accessibilityLabel={`Đi tới câu ${num}`}
                style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? NAVY : answered ? '#EADCC4' : '#FFFFFF', borderWidth: 1, borderColor: active ? NAVY : LINE }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#FFFFFF' : INK }}>{num}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function ToolButton({ icon, label, hint, active, onPress }: { icon: IconName; label: string; hint: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 12, backgroundColor: active ? '#FBF5EA' : 'transparent', borderWidth: 1, borderColor: active ? GOLD : 'transparent' }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: PAPER }}>
        <Icon name={icon} size={16} color={GOLD_DARK} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '800', color: INK, textAlign: 'center' }}>{label}</Text>
      <Text style={{ fontSize: 9.5, color: MUTED, textAlign: 'center' }}>{hint}</Text>
    </Pressable>
  );
}
