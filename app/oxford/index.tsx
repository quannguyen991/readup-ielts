import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Icon } from '@/components/ui';
import { OXFORD_TOPIC_DECKS, type OxfordTopicDeck } from '@/data/oxford-topics-decks';
import { type OxfordEntry, type OxfordLevel } from '@/data/oxford';
import { isLearnedWord, useOxfordStore } from '@/store/useOxfordStore';
import { useL } from '@/i18n/useL';

const LEVEL_COLORS: Record<OxfordLevel, { bg: string; text: string; border: string }> = {
  A1: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  A2: { bg: '#E0F2FE', text: '#0369A1', border: '#7DD3FC' },
  B1: { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' },
  B2: { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74' },
  C1: { bg: '#FCE7F3', text: '#BE185D', border: '#F472B6' },
};

export default function OxfordTopicScreen() {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const isTablet = width >= 640 && width < 900;

  const params = useLocalSearchParams<{ topic?: string }>();
  const learned = useOxfordStore((s) => s.learned);
  const toggleLearned = useOxfordStore((s) => s.toggle);

  // Tìm kiếm và lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'learning' | 'a1-a2' | 'b1-b2' | 'c1'>('all');

  // Chủ đề đang xem chi tiết (nếu có)
  const initialTopic = useMemo(() => {
    if (!params.topic) return null;
    return OXFORD_TOPIC_DECKS.find((d) => d.title === params.topic || d.slug === params.topic) ?? null;
  }, [params.topic]);

  const [selectedTopic, setSelectedTopic] = useState<OxfordTopicDeck | null>(initialTopic);
  const [selectedLevel, setSelectedLevel] = useState<OxfordLevel | 'all'>('all');
  const [studyMode, setStudyMode] = useState<'list' | 'flashcard' | 'quiz'>('list');

  // Flashcard state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  // Phát âm tiếng Anh
  const playPronunciation = (word: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Tính tiến độ của từng chủ đề
  const topicStats = useMemo(() => {
    return OXFORD_TOPIC_DECKS.map((d) => {
      const learnedCount = d.words.filter((w) => isLearnedWord(learned, w.word)).length;
      const total = d.words.length;
      const pct = total > 0 ? Math.round((learnedCount / total) * 100) : 0;
      return { ...d, learnedCount, total, pct };
    });
  }, [learned]);

  // Bộ lọc danh sách chủ đề
  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return topicStats.filter((t) => {
      // Tìm kiếm theo tên chủ đề hoặc từ vựng
      if (q) {
        const matchTitle = t.title.toLowerCase().includes(q) || t.titleEn.toLowerCase().includes(q);
        const matchWords = t.words.some((w) => w.word.toLowerCase().includes(q) || w.meaningVi.toLowerCase().includes(q));
        if (!matchTitle && !matchWords) return false;
      }

      if (activeFilter === 'learning') {
        return t.learnedCount > 0 && t.learnedCount < t.total;
      }
      if (activeFilter === 'a1-a2') {
        return t.words.some((w) => w.level === 'A1' || w.level === 'A2');
      }
      if (activeFilter === 'b1-b2') {
        return t.words.some((w) => w.level === 'B1' || w.level === 'B2');
      }
      if (activeFilter === 'c1') {
        return t.words.some((w) => w.level === 'C1');
      }
      return true;
    });
  }, [topicStats, searchQuery, activeFilter]);

  // Bộ từ của chủ đề đang chọn, lọc theo cấp độ (A1, A2, B1, B2, C1)
  const topicWords = useMemo(() => {
    if (!selectedTopic) return [];
    if (selectedLevel === 'all') return selectedTopic.words;
    return selectedTopic.words.filter((w) => w.level === selectedLevel);
  }, [selectedTopic, selectedLevel]);

  // Đếm từ theo cấp độ trong chủ đề đang chọn
  const levelCounts = useMemo(() => {
    if (!selectedTopic) return { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, all: 0 };
    return {
      all: selectedTopic.words.length,
      A1: selectedTopic.words.filter((w) => w.level === 'A1').length,
      A2: selectedTopic.words.filter((w) => w.level === 'A2').length,
      B1: selectedTopic.words.filter((w) => w.level === 'B1').length,
      B2: selectedTopic.words.filter((w) => w.level === 'B2').length,
      C1: selectedTopic.words.filter((w) => w.level === 'C1').length,
    };
  }, [selectedTopic]);

  // Tạo câu hỏi Quiz ngẫu nhiên
  const quizQuestions = useMemo(() => {
    if (topicWords.length < 4) return [];
    return topicWords.slice(0, 15).map((w, idx) => {
      const distractors = topicWords.filter((other) => other.word !== w.word).slice(0, 3);
      const options = [w.meaningVi, ...distractors.map((d) => d.meaningVi)].sort(() => 0.5 - Math.random());
      return {
        word: w.word,
        pos: w.pos,
        level: w.level,
        example: w.example,
        options,
        answer: options.indexOf(w.meaningVi),
      };
    });
  }, [topicWords]);

  // ========================================================
  // VIEW CHI TIẾT CHỦ ĐỀ & CHỌN CẤP ĐỘ
  // ========================================================
  if (selectedTopic) {
    const currentWord = topicWords[flashcardIndex];
    const currentQuiz = quizQuestions[quizQuestionIndex];

    return (
      <Screen>
        {/* Nút quay lại & Tiêu đề chủ đề */}
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSelectedTopic(null);
              setSelectedLevel('all');
            }}
            className="flex-row items-center gap-2 rounded-full border border-amber-900/10 bg-white/90 px-4 py-2 shadow-sm"
          >
            <Icon name="chevron-left" size={17} color="#292524" />
            <Text className="font-heavy text-[13px] text-stone-900">
              {L('‹ Tất cả chủ đề Oxford', '‹ All Oxford Topics')}
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1">
            <Text className="text-[12px]">📚</Text>
            <Text className="font-strong text-[11px] text-indigo-900">Oxford 3000 & 5000</Text>
          </View>
        </View>

        {/* Hero Banner của Chủ đề */}
        <View
          className="relative mb-5 overflow-hidden rounded-3xl border border-stone-200 p-6 shadow-sm"
          style={{
            backgroundImage: `linear-gradient(135deg, ${selectedTopic.gradient[0]}, ${selectedTopic.gradient[1]})`,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <View className="self-start rounded-full bg-white/20 px-3 py-0.5 backdrop-blur-md">
                <Text className="font-heavy text-[11px] tracking-wider text-white uppercase">
                  {selectedTopic.badge}
                </Text>
              </View>
              <Text className="mt-2 font-heavy text-[26px] text-white tracking-tight">
                {selectedTopic.title}
              </Text>
              <Text className="mt-0.5 font-sans italic text-[14px] text-white/90">
                {selectedTopic.titleEn}
              </Text>
              <Text className="mt-3 font-strong text-[13px] text-amber-200">
                Tổng cộng {selectedTopic.words.length} từ vựng cốt lõi · Đã thuộc {selectedTopic.words.filter((w) => isLearnedWord(learned, w.word)).length} từ
              </Text>
            </View>

            <View className="h-20 w-20 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-md">
              <Text className="text-[38px]">{selectedTopic.icon}</Text>
            </View>
          </View>
        </View>

        {/* ----------------- BỘ CHỌN CẤP ĐỘ (LEVEL SELECTOR) ----------------- */}
        <View className="mb-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-heavy text-[13px] tracking-wide text-stone-900 uppercase">
              🎯 {L('CHỌN CẤP ĐỘ THEO CHỦ ĐỀ', 'SELECT CEFR LEVEL')}
            </Text>
            <Text className="font-sans text-[12px] text-stone-500">
              {L('Bấm vào cấp độ để lọc từ', 'Tap a level to filter')}
            </Text>
          </View>

          {/* Dải nút chọn Cấp độ (Tất cả, A1, A2, B1, B2, C1) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 pt-1">
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSelectedLevel('all');
                setFlashcardIndex(0);
                setQuizQuestionIndex(0);
              }}
              className="mx-1 flex-row items-center gap-1.5 rounded-full px-4 py-2 border shadow-sm"
              style={{
                backgroundColor: selectedLevel === 'all' ? '#1E293B' : '#F8FAFC',
                borderColor: selectedLevel === 'all' ? '#0F172A' : '#CBD5E1',
              }}
            >
              <Text
                className="font-heavy text-[13px]"
                style={{ color: selectedLevel === 'all' ? '#FFFFFF' : '#334155' }}
              >
                {L('Tất cả', 'All')} ({levelCounts.all})
              </Text>
            </Pressable>

            {(['A1', 'A2', 'B1', 'B2', 'C1'] as OxfordLevel[]).map((lv) => {
              const count = levelCounts[lv];
              if (count === 0) return null;
              const isSelected = selectedLevel === lv;
              const col = LEVEL_COLORS[lv];

              return (
                <Pressable
                  key={lv}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedLevel(lv);
                    setFlashcardIndex(0);
                    setQuizQuestionIndex(0);
                  }}
                  className="mx-1 flex-row items-center gap-1.5 rounded-full px-4 py-2 border shadow-sm"
                  style={{
                    backgroundColor: isSelected ? col.bg : '#FFFFFF',
                    borderColor: isSelected ? col.text : '#E2E8F0',
                  }}
                >
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: col.text }}
                  />
                  <Text
                    className="font-heavy text-[13px]"
                    style={{ color: isSelected ? col.text : '#475569' }}
                  >
                    {lv} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ----------------- 3 CHẾ ĐỘ HỌC: DANH SÁCH / FLASHCARD / QUIZ ----------------- */}
        <View className="mb-4 flex-row items-center gap-2">
          {[
            { id: 'list', label: '📋 Danh sách từ', count: topicWords.length },
            { id: 'flashcard', label: '🗂️ Lật thẻ Flashcard', count: topicWords.length },
            { id: 'quiz', label: '✍️ Trắc nghiệm Quiz', count: quizQuestions.length },
          ].map((m) => {
            const on = studyMode === m.id;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                onPress={() => setStudyMode(m.id as never)}
                className="flex-1 items-center justify-center rounded-xl py-2.5 px-2 border shadow-sm"
                style={{
                  backgroundColor: on ? '#4338CA' : '#FFFFFF',
                  borderColor: on ? '#3730A3' : '#E2E8F0',
                }}
              >
                <Text
                  className="font-heavy text-[12.5px]"
                  style={{ color: on ? '#FFFFFF' : '#475569' }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ======================================================== */}
        {/* CHẾ ĐỘ 1: DANH SÁCH TỪ VỰNG                             */}
        {/* ======================================================== */}
        {studyMode === 'list' && (
          <View className="gap-3 pb-12">
            {topicWords.map((item, idx) => {
              const isLearned = isLearnedWord(learned, item.word);
              const col = LEVEL_COLORS[item.level] ?? LEVEL_COLORS.B1;

              return (
                <View
                  key={`${item.level}-${item.word}-${idx}`}
                  className="flex-row items-center justify-between rounded-2xl border bg-white p-4 shadow-sm"
                  style={{
                    borderColor: isLearned ? '#86EFAC' : '#E2E8F0',
                    backgroundColor: isLearned ? '#F0FDF4' : '#FFFFFF',
                  }}
                >
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-heavy text-[17px] text-stone-900">{item.word}</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => playPronunciation(item.word)}
                        className="rounded-full bg-stone-100 p-1 active:bg-stone-200"
                      >
                        <Icon name="volume" size={15} color="#4338CA" />
                      </Pressable>
                      <View className="rounded px-2 py-0.5 border" style={{ backgroundColor: col.bg, borderColor: col.border }}>
                        <Text className="font-heavy text-[10px]" style={{ color: col.text }}>
                          {item.pos} · {item.level}
                        </Text>
                      </View>
                    </View>

                    <Text className="mt-1 font-strong text-[14.5px] text-stone-800">
                      {item.meaningVi}
                    </Text>

                    <Text className="mt-1 font-sans italic text-[12.5px] leading-5 text-stone-500">
                      "{item.example}"
                    </Text>
                  </View>

                  {/* Nút đánh dấu đã thuộc */}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => toggleLearned(item.word)}
                    className="h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      backgroundColor: isLearned ? '#22C55E' : '#F8FAFC',
                      borderColor: isLearned ? '#16A34A' : '#CBD5E1',
                    }}
                  >
                    <Icon name={isLearned ? 'check' : 'star'} size={18} color={isLearned ? '#FFFFFF' : '#94A3B8'} strokeWidth={2.4} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* ======================================================== */}
        {/* CHẾ ĐỘ 2: LẬT THẺ FLASHCARD                             */}
        {/* ======================================================== */}
        {studyMode === 'flashcard' && currentWord && (
          <View className="items-center pb-12">
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsFlipped(!isFlipped)}
              className="w-full max-w-[480px] min-h-[280px] items-center justify-center rounded-3xl border-2 border-stone-200 bg-white p-6 shadow-xl"
              style={{
                boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
              }}
            >
              <View className="self-start rounded-full px-3 py-1 border" style={{ backgroundColor: LEVEL_COLORS[currentWord.level].bg, borderColor: LEVEL_COLORS[currentWord.level].border }}>
                <Text className="font-heavy text-[11px]" style={{ color: LEVEL_COLORS[currentWord.level].text }}>
                  {currentWord.level} · {currentWord.pos}
                </Text>
              </View>

              {!isFlipped ? (
                /* Mặt trước: Từ vựng tiếng Anh + nút nghe */
                <View className="my-auto items-center">
                  <Text className="font-heavy text-[36px] tracking-tight text-stone-900">{currentWord.word}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={(e) => {
                      e.stopPropagation();
                      playPronunciation(currentWord.word);
                    }}
                    className="mt-3 flex-row items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5"
                  >
                    <Icon name="volume" size={16} color="#4338CA" />
                    <Text className="font-strong text-[12px] text-indigo-700">Nghe phát âm</Text>
                  </Pressable>
                  <Text className="mt-6 font-sans text-[12px] text-stone-400">💡 Chạm vào thẻ để xem nghĩa tiếng Việt</Text>
                </View>
              ) : (
                /* Mặt sau: Nghĩa tiếng Việt & Câu ví dụ */
                <View className="my-auto items-center text-center">
                  <Text className="text-center font-heavy text-[24px] text-indigo-900">{currentWord.meaningVi}</Text>
                  <Text className="mt-3 text-center font-sans italic text-[14px] leading-6 text-stone-600">
                    "{currentWord.example}"
                  </Text>
                  <Text className="mt-6 font-sans text-[12px] text-stone-400">💡 Chạm vào thẻ để lật lại mặt trước</Text>
                </View>
              )}
            </Pressable>

            {/* Điều khiển chuyển thẻ */}
            <View className="mt-6 flex-row items-center gap-4 w-full max-w-[480px]">
              <Pressable
                accessibilityRole="button"
                disabled={flashcardIndex === 0}
                onPress={() => {
                  setFlashcardIndex((idx) => Math.max(0, idx - 1));
                  setIsFlipped(false);
                }}
                className="flex-1 items-center justify-center rounded-2xl border border-stone-300 bg-white py-3 shadow-sm disabled:opacity-40"
              >
                <Text className="font-heavy text-[13px] text-stone-700">‹ Thẻ trước</Text>
              </Pressable>

              <Text className="font-heavy text-[13px] text-stone-500">
                {flashcardIndex + 1} / {topicWords.length}
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={flashcardIndex >= topicWords.length - 1}
                onPress={() => {
                  setFlashcardIndex((idx) => Math.min(topicWords.length - 1, idx + 1));
                  setIsFlipped(false);
                }}
                className="flex-1 items-center justify-center rounded-2xl bg-[#4338CA] py-3 shadow-md disabled:opacity-40"
              >
                <Text className="font-heavy text-[13px] text-white">Thẻ tiếp theo ›</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* CHẾ ĐỘ 3: TRẮC NGHIỆM QUIZ                               */}
        {/* ======================================================== */}
        {studyMode === 'quiz' && currentQuiz && (
          <View className="items-center pb-12">
            <View className="w-full max-w-[500px] rounded-3xl border border-stone-200 bg-white p-6 shadow-md">
              <View className="flex-row items-center justify-between border-b border-stone-100 pb-3">
                <Text className="font-strong text-[12px] text-stone-400">
                  CÂU HỎI {quizQuestionIndex + 1} / {quizQuestions.length}
                </Text>
                <Text className="font-heavy text-[12px] text-emerald-700">ĐIỂM: {quizScore}</Text>
              </View>

              <View className="my-5 items-center">
                <Text className="font-sans text-[12px] text-stone-500">Nghĩa tiếng Việt chính xác của từ:</Text>
                <Text className="mt-1 font-heavy text-[28px] text-stone-900">{currentQuiz.word}</Text>
                <Text className="font-sans italic text-[12px] text-indigo-600">{currentQuiz.pos} · Cấp độ {currentQuiz.level}</Text>
              </View>

              <View className="gap-2.5">
                {currentQuiz.options.map((opt, optIdx) => {
                  const isSelected = selectedQuizOption === optIdx;
                  const isAnswer = optIdx === currentQuiz.answer;
                  const showResult = selectedQuizOption !== null;

                  let bg = '#F8FAFC';
                  let border = '#E2E8F0';
                  let text = '#334155';

                  if (showResult) {
                    if (isAnswer) {
                      bg = '#DCFCE7';
                      border = '#22C55E';
                      text = '#15803D';
                    } else if (isSelected) {
                      bg = '#FEE2E2';
                      border = '#EF4444';
                      text = '#B91C1C';
                    }
                  }

                  return (
                    <Pressable
                      key={optIdx}
                      accessibilityRole="button"
                      disabled={selectedQuizOption !== null}
                      onPress={() => {
                        setSelectedQuizOption(optIdx);
                        if (optIdx === currentQuiz.answer) {
                          setQuizScore((s) => s + 10);
                        }
                      }}
                      className="rounded-xl border p-3.5"
                      style={{ backgroundColor: bg, borderColor: border }}
                    >
                      <Text className="font-strong text-[14px]" style={{ color: text }}>
                        {String.fromCharCode(65 + optIdx)}. {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedQuizOption !== null ? (
                <View className="mt-5 border-t border-stone-100 pt-3">
                  <Text className="font-sans italic text-[12px] text-stone-500 mb-3">
                    Ví dụ: "{currentQuiz.example}"
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedQuizOption(null);
                      if (quizQuestionIndex < quizQuestions.length - 1) {
                        setQuizQuestionIndex((i) => i + 1);
                      } else {
                        alert(`Chúc mừng! Bạn đã hoàn thành bài Quiz với ${quizScore} điểm.`);
                        setQuizQuestionIndex(0);
                        setQuizScore(0);
                      }
                    }}
                    className="items-center justify-center rounded-xl bg-indigo-600 py-3 shadow-md"
                  >
                    <Text className="font-heavy text-[13px] text-white">
                      {quizQuestionIndex < quizQuestions.length - 1 ? 'Câu tiếp theo ›' : 'Làm lại từ đầu'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </Screen>
    );
  }

  // ========================================================
  // VIEW DANH SÁCH 18 CHỦ ĐỀ OXFORD 3000 (KHỚP 100% ẢNH CHỤP)
  // ========================================================
  return (
    <Screen>
      {/* -------------------- Search Bar (Khớp ảnh) -------------------- */}
      <View className="mb-4 rounded-full border border-stone-300 bg-white px-4 py-2.5 shadow-sm flex-row items-center gap-2.5">
        <Icon name="search" size={18} color="#78716C" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={L('Tìm bộ từ theo tên… (gõ không dấu cũng được)', 'Search Oxford topics or words…')}
          placeholderTextColor="#A8A29E"
          className="flex-1 font-sans text-[14.5px] text-stone-900"
          style={{ outline: 'none' }}
        />
        {searchQuery ? (
          <Pressable accessibilityRole="button" onPress={() => setSearchQuery('')}>
            <Icon name="close" size={16} color="#78716C" />
          </Pressable>
        ) : null}
      </View>

      {/* -------------------- Filter Pills (Khớp ảnh) -------------------- */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 mb-5">
        <View className="flex-row items-center gap-2 px-2">
          {[
            { id: 'all', label: `Tất cả ${OXFORD_TOPIC_DECKS.length}`, icon: 'grid' as const },
            { id: 'learning', label: `Đang học`, icon: 'flame' as const },
            { id: 'a1-a2', label: 'Cơ bản (A1–A2)', icon: 'book' as const },
            { id: 'b1-b2', label: 'Trung cấp (B1–B2)', icon: 'book' as const },
            { id: 'c1', label: 'Nâng cao (C1)', icon: 'star' as const },
          ].map((pill) => {
            const isActive = activeFilter === pill.id;
            return (
              <Pressable
                key={pill.id}
                accessibilityRole="button"
                onPress={() => setActiveFilter(pill.id as never)}
                className="flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 border shadow-sm"
                style={{
                  backgroundColor: isActive ? '#78350F' : '#FFFFFF',
                  borderColor: isActive ? '#78350F' : '#E7E5E4',
                }}
              >
                <Icon name={pill.icon} size={13} color={isActive ? '#FFFFFF' : '#78716C'} />
                <Text
                  className="font-strong text-[12px]"
                  style={{ color: isActive ? '#FFFFFF' : '#44403C' }}
                >
                  {pill.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* -------------------- Section Header (Khớp ảnh) -------------------- */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-500 shadow-sm">
            <Text className="text-[16px]">🔥</Text>
          </View>
          <View>
            <Text className="font-heavy text-[16px] text-stone-900">
              {L('Chủ đề Oxford 3000', 'Oxford 3000 Topics')}
            </Text>
            <Text className="font-sans text-[11px] text-stone-500">
              {L('Bấm vào một chủ đề để chọn cấp độ A1–C1 và bắt đầu học', 'Select a topic to pick levels and start practice')}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1">
          <Text className="text-[14px]">🔥</Text>
          <Text className="font-strong text-[12px] text-stone-600">
            {filteredTopics.length} {L('chủ đề', 'topics')}
          </Text>
        </View>
      </View>

      {/* -------------------- Grid 4 Cột Các Thẻ Chủ Đề (Khớp 100% Ảnh) -------------------- */}
      <View className="flex-row flex-wrap gap-4 pb-12">
        {filteredTopics.map((topic) => {
          return (
            <View
              key={topic.id}
              style={{
                width: wide ? 'calc(25% - 12px)' : isTablet ? 'calc(50% - 8px)' : '100%',
              } as object}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={topic.title}
                onPress={() => {
                  setSelectedTopic(topic);
                  setSelectedLevel('all');
                  setStudyMode('list');
                }}
                className="group overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-sm transition-all active:scale-[0.98] hover:shadow-md"
                style={{
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* Nửa trên: Ảnh bìa gradient + 3D icon + Badge nổi ở chân ảnh (Khớp ảnh) */}
                <View
                  className="relative h-44 w-full items-center justify-center overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${topic.gradient[0]}, ${topic.gradient[1]})`,
                  }}
                >
                  {/* 3D floating orb / icon */}
                  <View
                    className="h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.22)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Text className="text-[40px]">{topic.icon}</Text>
                  </View>

                  {/* Floating white pill badge ở chân ảnh (khớp ảnh: UNIT 1: GROWING UP, EDUCATION...) */}
                  <View
                    className="absolute bottom-3 rounded-full bg-white/95 px-4 py-1 shadow-md"
                    style={{
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <Text className="font-heavy text-[10px] tracking-widest text-[#1E1B4B] uppercase">
                      {topic.badge}
                    </Text>
                  </View>
                </View>

                {/* Nửa dưới: Tiêu đề in nghiêng, subtitle, thanh tiến độ, footer */}
                <View className="p-4">
                  <Text className="font-heavy italic text-[16px] text-stone-900" numberOfLines={1}>
                    {topic.title}
                  </Text>
                  <Text className="mt-0.5 font-sans italic text-[12px] text-stone-500" numberOfLines={1}>
                    {topic.titleEn}
                  </Text>

                  {/* Thanh tiến độ */}
                  <View className="mt-3 flex-row items-center gap-2">
                    <View className="h-1.5 flex-1 rounded-full bg-stone-100 overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${topic.pct}%`,
                          backgroundColor: topic.pct > 0 ? '#22C55E' : '#CBD5E1',
                        }}
                      />
                    </View>
                    <Text className="font-strong text-[11px] text-stone-500">{topic.pct}%</Text>
                  </View>

                  {/* Footer: Oxford 3000 & số từ */}
                  <View className="mt-3 flex-row items-center justify-between border-t border-stone-100 pt-2">
                    <Text className="font-strong text-[11px] text-indigo-700">Oxford 3000</Text>
                    <Text className="font-sans text-[11px] text-stone-400">{topic.total} từ</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* Floating Mascot AI Assistant ở góc phải dưới (Khớp ảnh tham chiếu) */}
      <View
        style={{
          position: 'fixed' as never,
          bottom: 28,
          right: 28,
          zIndex: 99,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trợ lý từ vựng AI"
          onPress={() => {
            alert('🦁 Trợ lý AI: "Mẹo nhỏ: Bạn hãy chọn một chủ đề yêu thích, sau đó lọc từ cấp độ A1–A2 để làm quen, rồi nâng dần lên B1–C1 nhé!"');
          }}
          className="group relative items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <View
            className="relative h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 p-1 border-2 border-white"
            style={{
              boxShadow: '0 8px 24px rgba(217, 119, 6, 0.35)',
            }}
          >
            <Image
              source={{ uri: '/mascot/lion/lion-wave.png' }}
              style={{ width: 52, height: 52 }}
              resizeMode="contain"
            />
            <View className="absolute -top-1 -right-1 rounded-full bg-indigo-600 px-1.5 py-0.5 shadow-md border-2 border-white">
              <Text className="font-heavy text-[9px] text-white tracking-wider">AI</Text>
            </View>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}
