import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { MathFigure } from './MathFigure';
import { MathText } from './MathText';
import { Badge } from '@/components/ui';
import { MATH_ERROR_LABEL, MATH_SKILL_LABEL } from '@/lib/math/types';
import type { MathItem } from '@/lib/math/types';
import { gradeMathItem } from '@/services/math/grade';
import { GRID_IN_REASON_LABEL, gridInAcceptedForms } from '@/services/math/grid-in';
import { color } from '@/theme/tokens';

/**
 * Một câu hỏi Math — dùng chung cho lúc LÀM BÀI và lúc XEM LẠI.
 *
 * Một component cho hai việc chứ không phải hai component, vì cái đáng sợ nhất
 * ở đây là hai màn hình hiển thị cùng một câu theo hai kiểu hơi khác nhau: người
 * học xem lại thấy đề trông lạ so với lúc làm và không còn tin kết quả nữa.
 * `revealed` chỉ bật thêm phần chấm và lời giải, không đổi cách vẽ đề.
 */
export function MathQuestionView({
  item,
  answer,
  onAnswer,
  revealed = false,
  index,
  showGrade = true,
}: {
  item: MathItem;
  answer: string | null;
  onAnswer?: (answer: string) => void;
  revealed?: boolean;
  index?: number;
  /**
   * Tắt khi nơi gọi ĐÃ nói đúng/sai ở chỗ khác — ví dụ màn xem lại bài thi đầy
   * đủ, nơi mỗi câu có sẵn một dải màu trạng thái ở đầu thẻ. Hai cái nhãn "Sai"
   * nằm cách nhau hai centimet không cho biết thêm gì, chỉ làm thẻ rối.
   */
  showGrade?: boolean;
}) {
  const grade = revealed ? gradeMathItem(item, answer) : null;
  const locked = !onAnswer;

  return (
    <View>
      <View className="flex-row flex-wrap items-center gap-2">
        {index !== undefined ? (
          <Text className="font-strong text-cardTitle text-ink">Câu {index + 1}</Text>
        ) : null}
        <Badge label={MATH_SKILL_LABEL[item.skill]} tone="neutral" shape="tag" />
        {item.format === 'grid_in' ? (
          <Badge label="Tự điền đáp án" tone="info" shape="tag" />
        ) : null}
        {grade && showGrade ? (
          <Badge
            label={grade.isCorrect ? 'Đúng' : answer === null ? 'Bỏ trắng' : 'Sai'}
            tone={grade.isCorrect ? 'success' : answer === null ? 'neutral' : 'danger'}
          />
        ) : null}
      </View>

      <View className="mt-3 rounded-card bg-canvas p-3">
        <MathText size={15} weight="semibold">
          {item.stem}
        </MathText>
      </View>

      {item.figure ? (
        <View className="mt-3 items-center">
          <MathFigure spec={item.figure} />
        </View>
      ) : null}

      {item.choices ? (
        <View className="mt-3 gap-2">
          {item.choices.map((choice, choiceIndex) => (
            <ChoiceRow
              key={choiceIndex}
              index={choiceIndex}
              display={choice.display}
              selected={answer === String(choiceIndex)}
              revealed={revealed}
              correct={choiceIndex === item.correctIndex}
              onPress={() => onAnswer?.(String(choiceIndex))}
              disabled={locked}
            />
          ))}
        </View>
      ) : (
        <GridInBox
          value={answer ?? ''}
          onChange={(text) => onAnswer?.(text)}
          disabled={locked}
          revealed={revealed}
        />
      )}

      {grade ? <Explanation item={item} answer={answer} grade={grade} /> : null}
    </View>
  );
}

function GridInBox({
  value,
  onChange,
  disabled,
  revealed,
}: {
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
  revealed: boolean;
}) {
  return (
    <View className="mt-3">
      <Text className="font-sans text-label text-muted">
        Tự gõ đáp án — tối đa 5 ký tự (6 nếu âm). Nhận cả phân số lẫn số thập phân, không nhận hỗn số.
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={!disabled && !revealed}
        placeholder="ví dụ: 3/4"
        placeholderTextColor={color.muted}
        keyboardType="numbers-and-punctuation"
        className="mt-2 w-44 rounded-card border border-borderStrong bg-surface px-3 py-2 font-sans text-body text-ink"
      />
    </View>
  );
}

/**
 * Phần dạy của câu hỏi.
 *
 * Thứ tự cố ý: NÓI CÁI SAI TRƯỚC, giải sau. Người vừa làm sai đang muốn biết
 * mình hỏng ở đâu, và nếu phải đọc hết lời giải mới tới chỗ ấy thì phần lớn sẽ
 * bỏ qua.
 */
function Explanation({
  item,
  answer,
  grade,
}: {
  item: MathItem;
  answer: string | null;
  grade: NonNullable<ReturnType<typeof gradeMathItem>>;
}) {
  return (
    <View className="mt-3 gap-2 rounded-card border border-border bg-canvas p-3">
      {!grade.isCorrect && grade.gridVerdict && !grade.gridVerdict.ok ? (
        <Text className="font-sans text-body text-ink">
          {GRID_IN_REASON_LABEL[grade.gridVerdict.reason]}
        </Text>
      ) : null}

      {!grade.isCorrect && grade.errorTag ? (
        <View className="rounded-card bg-warning-soft p-2">
          <Text className="font-strong text-label text-warning-ink">Lỗi vừa mắc</Text>
          <Text className="mt-0.5 font-sans text-body text-warning-ink">
            {MATH_ERROR_LABEL[grade.errorTag]}
          </Text>
        </View>
      ) : null}

      {!grade.isCorrect && grade.note ? (
        <View className="rounded-card bg-surfaceAlt p-2">
          <Text className="font-sans text-body text-ink">{grade.note}</Text>
        </View>
      ) : null}

      {item.answerValue ? (
        <Text className="font-sans text-label text-muted">
          Đáp án đúng — mọi cách viết sau đều được chấp nhận:{' '}
          <Text className="font-strong text-label text-ink">
            {gridInAcceptedForms(item.answerValue).join('   ·   ')}
          </Text>
          {answer !== null && answer.trim() !== '' ? `      (bạn gõ: ${answer.trim()})` : ''}
        </Text>
      ) : null}

      <Text className="mt-1 font-strong text-body text-ink">Lời giải từng bước</Text>
      {item.steps.map((step, stepIndex) => (
        <View key={stepIndex} className="flex-row gap-2">
          <Text className="font-strong text-body text-primary-600">{stepIndex + 1}.</Text>
          <View className="flex-1">
            <Text className="font-sans text-body text-ink">{step.text}</Text>
            {step.expr ? (
              <View className="mt-1">
                <MathText size={15}>{step.expr}</MathText>
              </View>
            ) : null}
          </View>
        </View>
      ))}

      <WrongChoicesBreakdown item={item} />
    </View>
  );
}

/**
 * Vì sao BA ĐÁP ÁN KIA sai — không chỉ cái người học vừa chọn.
 *
 * Bản trước chỉ giải thích lựa chọn đã chọn, nên người làm ĐÚNG không học được
 * gì từ ba nhiễu, mà đó chính là ba cách hỏng phổ biến nhất của dạng bài này.
 * Lần sau gặp lại, họ vẫn có thể rơi vào đúng một trong ba cái ấy.
 *
 * Mỗi nhiễu vốn đã được dựng từ MỘT sai lầm có tên (xem `buildChoices`), nên chỗ
 * này không bịa thêm gì — nó chỉ đem sẵn cái nhãn ấy ra hiển thị.
 */
function WrongChoicesBreakdown({ item }: { item: MathItem }) {
  if (!item.choices || item.correctIndex === null) return null;

  const wrong = item.choices
    .map((choice, index) => ({ choice, index }))
    .filter(({ index }) => index !== item.correctIndex)
    .filter(({ choice }) => choice.errorTag !== null || (choice.note?.length ?? 0) > 0);

  if (wrong.length === 0) return null;

  return (
    <View className="mt-3 border-t border-border pt-3">
      <Text className="font-strong text-body text-ink">Ba đáp án còn lại sai ở đâu</Text>
      <View className="mt-2 gap-2">
        {wrong.map(({ choice, index }) => (
          <View key={index} className="flex-row gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-pill bg-surfaceAlt">
              <Text className="font-strong text-label text-muted">{'ABCD'[index]}</Text>
            </View>
            <View className="flex-1">
              <MathText size={14}>{choice.display}</MathText>
              <Text className="mt-0.5 font-sans text-label text-muted">
                {choice.errorTag ? MATH_ERROR_LABEL[choice.errorTag] : choice.note}
              </Text>
              {choice.errorTag && choice.note ? (
                <Text className="mt-0.5 font-sans text-label text-muted">{choice.note}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ChoiceRow({
  index,
  display,
  selected,
  revealed,
  correct,
  onPress,
  disabled,
}: {
  index: number;
  display: string;
  selected: boolean;
  revealed: boolean;
  correct: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  // Sau khi chấm: đáp án đúng luôn được tô, lựa chọn sai của người học tô đỏ.
  const tone = revealed
    ? correct
      ? 'border-success bg-success-soft'
      : selected
        ? 'border-danger bg-danger-soft'
        : 'border-border bg-surface'
    : selected
      ? 'border-primary-600 bg-primary-50'
      : 'border-border bg-surface';

  /*
    `accessibilityRole="radio"` chứ không để trống, giống hệt phương án bên phòng
    thi R&W. Trình đọc màn hình đọc hai phòng thi của CÙNG một bài thi theo hai
    kiểu khác nhau thì người dùng phải học lại cách nghe giữa lúc đang tính giờ.
  */
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      onPress={disabled ? undefined : onPress}
      className={`flex-row items-center gap-3 rounded-card border p-3 ${tone}`}
    >
      <Text className="font-strong text-body text-muted">{'ABCD'[index]}</Text>
      <View className="flex-1">
        <MathText size={15}>{display}</MathText>
      </View>
    </Pressable>
  );
}
