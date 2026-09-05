import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon, PaperCard } from '@/components/ui';
import type { SatRwQuestion } from '@/data/sat-rw-repository';
import { color, paper } from '@/theme/tokens';

/**
 * Một câu SAT R&W: đoạn văn, câu hỏi, bốn phương án, và lời giải hiện ngay sau
 * khi chọn.
 *
 * Tách khỏi màn luyện unit để màn "đề trộn" dùng lại nguyên vẹn. Hai màn khác
 * nhau ở chỗ LẤY CÂU TỪ ĐÂU và tiêu đề hiện gì, còn phần trình bày một câu thì
 * phải giống hệt — người học không nên phải học lại cách đọc màn hình chỉ vì đổi
 * kiểu luyện.
 *
 * Chọn xong là KHOÁ, không đổi được nữa: sửa lựa chọn sau khi đã thấy đáp án thì
 * con số đúng/sai không còn nói lên điều gì.
 */
export function QuestionCard({
  question,
  picked,
  onPick,
  showSolution = true,
}: {
  question: SatRwQuestion;
  picked: number | null;
  onPick: (choice: number) => void;
  /**
   * Có được hiện lời giải chưa.
   *
   * Màn đề trộn giữ lại lời giải cho tới khi người học trả lời xong câu "câu này
   * kiểm luật gì". Hiện lời giải trước thì câu hỏi ấy vô nghĩa — đáp án và tên
   * luật đã nằm sẵn trên màn hình. Mặc định `true` để màn luyện unit giữ nguyên
   * hành vi cũ.
   */
  showSolution?: boolean;
}) {
  const answered = picked !== null;

  return (
    <PaperCard>
      <Text className="font-mid text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
        {question.passage}
      </Text>

      <Text className="mt-4 font-strong text-body text-paper-ink">{question.stem}</Text>

      <View className="mt-3 gap-2">
        {question.options.map((option, i) => {
          const isAnswer = i === question.answerIndex;
          const isPicked = picked === i;

          const tone = !answered
            ? { border: paper.brandSoft, bg: '#FFFFFF' }
            : isAnswer
              ? { border: color.success, bg: color.successSoft }
              : isPicked
                ? { border: color.danger, bg: color.dangerSoft }
                : { border: paper.brandSoft, bg: '#FFFFFF' };

          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityState={{ selected: isPicked, disabled: answered }}
              disabled={answered}
              onPress={() => onPick(i)}
              className="flex-row items-start gap-3 rounded-panel border px-3.5 py-3"
              style={{ borderColor: tone.border, backgroundColor: tone.bg }}
            >
              <View
                className="h-6 w-6 items-center justify-center rounded-pill"
                style={{ backgroundColor: answered && isAnswer ? color.success : paper.brandTint }}
              >
                <Text
                  className="font-strong text-label"
                  style={{ color: answered && isAnswer ? '#FFFFFF' : paper.body }}
                >
                  {'ABCD'[i]}
                </Text>
              </View>
              <Text className="min-w-0 flex-1 font-sans text-body text-paper-ink">{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {answered && showSolution ? (
        <View
          className="mt-4 rounded-panel border-l-4 p-3.5"
          style={{
            borderLeftColor: picked === question.answerIndex ? color.success : color.warning,
            backgroundColor: paper.brandTint,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Icon
              name={picked === question.answerIndex ? 'check' : 'info'}
              size={16}
              color={picked === question.answerIndex ? color.success : color.warning}
              strokeWidth={2.2}
            />
            <Text className="font-strong text-body text-paper-ink">
              {picked === question.answerIndex ? 'Đúng rồi' : `Đáp án đúng là ${'ABCD'[question.answerIndex]}`}
            </Text>
          </View>
          <Text className="mt-1.5 font-sans text-body text-paper-body" style={{ lineHeight: 23 }}>
            {question.solutionVi}
          </Text>
        </View>
      ) : null}
    </PaperCard>
  );
}
