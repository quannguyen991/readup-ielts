import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { Icon } from '@/components/ui';
import { IELTS_DRILL_QUESTIONS, type DrillQuestion } from '@/data/ielts-drill-bank';
import { IELTS_QUESTION_TYPES, type IeltsQuestionTypeMeta } from '@/data/ielts-question-types';
import { useL } from '@/i18n/useL';
import { track } from '@/services/analytics/track';
import { useEffect } from 'react';

export default function IeltsSkillTypeScreen() {
  const { typeId = '' } = useLocalSearchParams<{ typeId: string }>();
  const { L } = useL();

  const typeMeta = useMemo<IeltsQuestionTypeMeta | undefined>(() => {
    return IELTS_QUESTION_TYPES.find((t) => t.id === typeId);
  }, [typeId]);

  const questions = useMemo<DrillQuestion[]>(() => {
    return IELTS_DRILL_QUESTIONS.filter((q) => q.typeId === typeId);
  }, [typeId]);

  const [activeTab, setActiveTab] = useState<'strategy' | 'drill'>('drill');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInputAnswer, setTextInputAnswer] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (typeId) {
      track({ name: 'start_lesson', lessonId: `ielts_${typeId}`, type: 'drill' });
    }
  }, [typeId]);
  const [userAnswers, setUserAnswers] = useState<Record<number, { answer: string; isCorrect: boolean }>>({});

  const currentQ = questions[currentIndex];
  const isAnswered = submitted || userAnswers[currentIndex] !== undefined;

  const handleSelectOption = (opt: string) => {
    if (submitted) return;
    setSelectedOption(opt);
  };

  const handleCheckAnswer = () => {
    if (!currentQ) return;
    const finalAnswer = currentQ.options ? selectedOption : textInputAnswer.trim();
    if (!finalAnswer) return;

    const isCorrect =
      finalAnswer.trim().toLowerCase() === currentQ.answer.trim().toLowerCase();

    setSubmitted(true);
    if (currentIndex === questions.length - 1) {
      track({ name: 'complete_lesson', lessonId: `ielts_${typeId}` });
    }
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: { answer: finalAnswer, isCorrect },
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setTextInputAnswer('');
      setSubmitted(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setSelectedOption(null);
      setTextInputAnswer('');
      setSubmitted(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setTextInputAnswer('');
    setSubmitted(false);
    setUserAnswers({});
  };

  if (!typeMeta) {
    return (
      <TaskShell
        backHref="/ielts/skills"
        backLabel={L('Dạng bài', 'Question Types')}
        title={L('Không tìm thấy dạng bài', 'Question Type Not Found')}
      >
        <View className="p-6 items-center justify-center">
          <Text className="font-sans text-body text-muted">
            {L('Dạng bài này không tồn tại hoặc đã được cập nhật.', 'This type does not exist.')}
          </Text>
          <Pressable
            onPress={() => router.push('/ielts/skills' as never)}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5"
          >
            <Text className="font-strong text-label text-white">
              {L('Về danh mục dạng bài', 'Back to skill list')}
            </Text>
          </Pressable>
        </View>
      </TaskShell>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.values(userAnswers).filter((a) => a.isCorrect).length;

  return (
    <TaskShell
      backHref="/ielts/skills"
      backLabel={L('Dạng bài', 'Question Types')}
      title={typeMeta.titleVi}
      subtitle={typeMeta.titleEn}
    >
      <View className="w-full self-center px-4 py-4 max-w-4xl">
        {/* Thanh chọn Tab */}
        <View className="mb-6 flex-row rounded-2xl bg-surface border border-border p-1.5">
          <Pressable
            onPress={() => setActiveTab('drill')}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5 ${
              activeTab === 'drill' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Icon
              name="target"
              size={18}
              color={activeTab === 'drill' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              className={`font-strong text-label ${
                activeTab === 'drill' ? 'text-white' : 'text-muted'
              }`}
            >
              {L(`Luyện tập thực chiến (${questions.length} câu)`, `Practice Drills (${questions.length})`)}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('strategy')}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5 ${
              activeTab === 'strategy' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Icon
              name="book"
              size={18}
              color={activeTab === 'strategy' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              className={`font-strong text-label ${
                activeTab === 'strategy' ? 'text-white' : 'text-muted'
              }`}
            >
              {L('Chiến thuật & Bẫy thi', 'Strategy & Traps')}
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: CHIẾN THUẬT & BẪY THI */}
        {activeTab === 'strategy' && (
          <ScrollView showsVerticalScrollIndicator={false} className="gap-6 pb-12">
            {/* Giới thiệu tổng quan */}
            <View className="rounded-2xl border border-border bg-surface p-5">
              <View className="flex-row items-center justify-between">
                <Text className="font-heavy text-cardTitle text-ink">
                  {typeMeta.titleVi}
                </Text>
                <View className="rounded-lg bg-primary/10 px-3 py-1 border border-primary/20">
                  <Text className="font-strong text-label text-primary">
                    Tần suất: {typeMeta.frequency}
                  </Text>
                </View>
              </View>
              <Text className="mt-2.5 font-sans text-body text-ink leading-relaxed">
                {typeMeta.descriptionVi}
              </Text>
            </View>

            {/* Các bước làm bài chuẩn mực */}
            <View className="rounded-2xl border border-border bg-surface p-5">
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="clipboard" size={20} color="#6A4BD9" />
                <Text className="font-heavy text-cardTitle text-ink">
                  {L('Phương pháp làm bài từng bước', 'Step-by-step Strategy')}
                </Text>
              </View>
              <View className="gap-3">
                {typeMeta.steps.map((step, idx) => (
                  <View key={idx} className="flex-row gap-3 items-start">
                    <View className="h-6 w-6 rounded-full bg-primary/10 items-center justify-center shrink-0 mt-0.5">
                      <Text className="font-strong text-label text-primary">{idx + 1}</Text>
                    </View>
                    <Text className="flex-1 font-sans text-body text-body leading-relaxed">
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bẫy thường gặp */}
            <View className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
              <View className="flex-row items-center gap-2 mb-3">
                <Icon name="info" size={20} color="#DC2626" />
                <Text className="font-heavy text-cardTitle text-red-900">
                  {L('Bẫy giám khảo thường gặp & Cách xử lý', 'Common Examiner Traps')}
                </Text>
              </View>
              <View className="gap-2.5">
                {typeMeta.traps.map((trap, idx) => (
                  <View key={idx} className="flex-row gap-2.5 items-start">
                    <Text className="text-red-500 font-strong">•</Text>
                    <Text className="flex-1 font-sans text-body text-red-900 leading-relaxed">
                      {trap}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Mẹo đạt Band điểm cao */}
            <View className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <View className="flex-row items-center gap-2 mb-3">
                <Icon name="sparkle" size={20} color="#6A4BD9" />
                <Text className="font-heavy text-cardTitle text-amber-900">
                  {L('Bí kíp & Lời khuyên vàng', 'Pro Tips & Hacks')}
                </Text>
              </View>
              <View className="gap-2.5">
                {typeMeta.tips.map((tip, idx) => (
                  <View key={idx} className="flex-row gap-2.5 items-start">
                    <Text className="text-amber-600 font-strong">✓</Text>
                    <Text className="flex-1 font-sans text-body text-amber-900 leading-relaxed">
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Nút chuyển sang làm bài */}
            <Pressable
              onPress={() => setActiveTab('drill')}
              className="rounded-2xl bg-primary py-3.5 items-center justify-center flex-row gap-2"
            >
              <Text className="font-strong text-body text-white">
                {L(`Bắt đầu luyện tập ngay (${questions.length} câu) →`, `Start Drilling (${questions.length} questions) →`)}
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {/* TAB 2: LUYỆN TẬP THỰC CHIẾN (DRILL RUNNER) */}
        {activeTab === 'drill' && (
          <View className="gap-4 pb-12">
            {/* Thanh tiến độ câu hỏi */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="font-heavy text-label text-ink">
                  {L(`Câu hỏi ${currentIndex + 1} / ${questions.length}`, `Question ${currentIndex + 1} of ${questions.length}`)}
                </Text>
                {userAnswers[currentIndex] && (
                  <View
                    className={`rounded-full px-2.5 py-0.5 ${
                      userAnswers[currentIndex]?.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    <Text
                      className={`font-strong text-label ${
                        userAnswers[currentIndex]?.isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {userAnswers[currentIndex]?.isCorrect ? '✓ Đúng' : '✗ Sai'}
                    </Text>
                  </View>
                )}
              </View>

              <Text className="font-mid text-label text-muted">
                {L(`Đúng: ${correctCount}/${answeredCount}`, `Score: ${correctCount}/${answeredCount}`)}
              </Text>
            </View>

            {/* Vạch tiến độ */}
            <View className="h-2 w-full rounded-full bg-border overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </View>

            {/* Hộp ngữ cảnh / Đoạn trích dẫn */}
            {currentQ && (
              <View className="rounded-2xl border border-border bg-surface p-5">
                <View className="flex-row items-center justify-between mb-3 border-b border-border pb-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <Icon name="book" size={16} color="#6A4BD9" />
                    <Text className="font-strong text-label text-muted uppercase tracking-wider">
                      {L('Đoạn văn / Ngữ cảnh thực chiến', 'Passage / Real Context')}
                    </Text>
                  </View>
                  <Text className="font-mid text-label text-primary">
                    {currentQ.title}
                  </Text>
                </View>

                <Text className="font-sans text-body text-ink leading-relaxed">
                  {currentQ.contextText}
                </Text>
              </View>
            )}

            {/* Câu hỏi */}
            {currentQ && (
              <View className="rounded-2xl border border-border bg-surface p-5">
                <Text className="font-strong text-body text-ink leading-relaxed">
                  {currentQ.prompt}
                </Text>

                {/* Các phương án lựa chọn */}
                {currentQ.options && currentQ.options.length > 0 ? (
                  <View className="mt-4 gap-2.5">
                    {currentQ.options.map((option, optIdx) => {
                      const isSelected = selectedOption === option;
                      const hasAnswered = isAnswered;
                      const isTargetCorrect = option === currentQ.answer;

                      let btnStyle = 'border-border bg-surface hover:bg-canvas';
                      let textStyle = 'text-ink';

                      if (hasAnswered) {
                        if (isTargetCorrect) {
                          btnStyle = 'border-green-500 bg-green-50';
                          textStyle = 'text-green-800 font-strong';
                        } else if (isSelected && !isTargetCorrect) {
                          btnStyle = 'border-red-500 bg-red-50';
                          textStyle = 'text-red-800';
                        }
                      } else if (isSelected) {
                        btnStyle = 'border-primary bg-primary/10';
                        textStyle = 'text-primary font-strong';
                      }

                      return (
                        <Pressable
                          key={optIdx}
                          disabled={hasAnswered}
                          onPress={() => handleSelectOption(option)}
                          className={`flex-row items-center gap-3 rounded-xl border p-3.5 transition-colors ${btnStyle}`}
                        >
                          <View
                            className={`h-5 w-5 rounded-full border items-center justify-center ${
                              isSelected ? 'border-primary bg-primary' : 'border-border'
                            }`}
                          >
                            {isSelected && <View className="h-2 w-2 rounded-full bg-white" />}
                          </View>
                          <Text className={`flex-1 font-sans text-body ${textStyle}`}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  /* Ô nhập văn bản nếu không có trắc nghiệm */
                  <View className="mt-4">
                    <TextInput
                      value={textInputAnswer}
                      onChangeText={setTextInputAnswer}
                      editable={!isAnswered}
                      placeholder={L('Nhập câu trả lời của bạn...', 'Type your answer...')}
                      placeholderTextColor="#94A3B8"
                      className="rounded-xl border border-border bg-canvas px-4 py-3 font-sans text-body text-ink outline-none"
                    />
                  </View>
                )}

                {/* Nút kiểm tra */}
                {!isAnswered && (
                  <Pressable
                    disabled={!selectedOption && !textInputAnswer.trim()}
                    onPress={handleCheckAnswer}
                    className={`mt-4 rounded-xl py-3 items-center justify-center ${
                      selectedOption || textInputAnswer.trim()
                        ? 'bg-primary'
                        : 'bg-muted/30 opacity-60'
                    }`}
                  >
                    <Text className="font-strong text-label text-white">
                      {L('Kiểm tra đáp án', 'Check Answer')}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Phản hồi giải thích chi tiết khi đã trả lời */}
            {isAnswered && currentQ && (
              <View className="rounded-2xl border border-border bg-surface p-5 gap-3">
                <View className="flex-row items-center gap-2">
                  <View
                    className={`h-7 w-7 rounded-full items-center justify-center ${
                      userAnswers[currentIndex]?.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    <Text className="font-heavy text-body">
                      {userAnswers[currentIndex]?.isCorrect ? '✓' : '✗'}
                    </Text>
                  </View>
                  <Text
                    className={`font-heavy text-cardTitle ${
                      userAnswers[currentIndex]?.isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {userAnswers[currentIndex]?.isCorrect
                      ? L('Chính xác! Làm rất tốt.', 'Correct! Well done.')
                      : L('Chưa chính xác.', 'Incorrect.')}
                  </Text>
                </View>

                <View className="rounded-xl bg-canvas p-3 border border-border">
                  <Text className="font-strong text-label text-muted">
                    {L('ĐÁP ÁN CHUẨN:', 'CORRECT ANSWER:')}
                  </Text>
                  <Text className="mt-0.5 font-heavy text-body text-ink">
                    {currentQ.answer}
                  </Text>
                </View>

                {/* Trích dẫn chứng cứ */}
                {currentQ.evidenceQuote ? (
                  <View className="rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/20">
                    <Text className="font-strong text-label text-amber-800">
                      🎯 {L('Trích dẫn bằng chứng từ bài:', 'Evidence quote:')}
                    </Text>
                    <Text className="mt-1 font-sans text-body italic text-amber-950 leading-relaxed">
                      &ldquo;{currentQ.evidenceQuote}&rdquo;
                    </Text>
                  </View>
                ) : null}

                {/* Giải thích tiếng Việt */}
                <View className="rounded-xl bg-primary/5 p-3.5 border border-primary/20">
                  <Text className="font-strong text-label text-primary">
                    💡 {L('Giải thích chi tiết:', 'Explanation:')}
                  </Text>
                  <Text className="mt-1 font-sans text-body text-ink leading-relaxed">
                    {currentQ.explanationVi}
                  </Text>
                </View>

                {/* Mẹo vàng */}
                {currentQ.tip ? (
                  <View className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-200">
                    <Text className="font-strong text-label text-emerald-800">
                      ⚡ {L('Mẹo làm dạng này:', 'Skill tip:')}
                    </Text>
                    <Text className="mt-0.5 font-sans text-label text-emerald-950 leading-relaxed">
                      {currentQ.tip}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Điều hướng chuyển câu */}
            <View className="flex-row items-center justify-between pt-2">
              <Pressable
                disabled={currentIndex === 0}
                onPress={handlePrev}
                className={`flex-row items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 ${
                  currentIndex === 0 ? 'opacity-40' : 'bg-surface hover:bg-canvas'
                }`}
              >
                <Icon name="chevron-left" size={16} color="#64748B" />
                <Text className="font-mid text-label text-ink">
                  {L('Câu trước', 'Previous')}
                </Text>
              </Pressable>

              {currentIndex < questions.length - 1 ? (
                <Pressable
                  onPress={handleNext}
                  className="flex-row items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5"
                >
                  <Text className="font-strong text-label text-white">
                    {L('Câu tiếp theo', 'Next Question')}
                  </Text>
                  <Icon name="chevron-right" size={16} color="#FFFFFF" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleReset}
                  className="flex-row items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5"
                >
                  <Icon name="refresh" size={16} color="#FFFFFF" />
                  <Text className="font-strong text-label text-white">
                    {L('Làm lại từ đầu', 'Restart Drill')}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </TaskShell>
  );
}
