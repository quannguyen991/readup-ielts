import React, { useMemo } from 'react';
import { Text, TextInput, View } from 'react-native';

import { MathFigure } from './MathFigure';
import { MathText } from './MathText';
import { flattenMath } from '@/lib/math/flatten';
import { Badge } from '@/components/ui';
import { Appear, PressScale } from '@/components/motion/Motion';
import { LionMascot } from '@/components/mascot/LionMascot';
import { MATH_ERROR_LABEL, MATH_SKILL_LABEL } from '@/lib/math/types';
import type { MathItem } from '@/lib/math/types';
import { gradeMathItem } from '@/services/math/grade';
import { GRID_IN_REASON_LABEL, gridInAcceptedForms } from '@/services/math/grid-in';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { mathErrorLabel } from './math-labels-en';
import { ExamOption } from '@/components/sat-exam/ExamOption';
import { HighlightHost } from '@/components/sat-exam/HighlightPassage';

/**
 * Thẻ đề của bộ luyện: một tấm trắng nổi nhẹ trên nền, để đề là thứ đầu tiên mắt bắt.
 * Phòng thi thật không dùng — ở đó đề nằm trong khung của phòng thi.
 */
const PRACTICE_STEM = {
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  paddingVertical: 20,
  paddingHorizontal: 20,
  boxShadow: '0 10px 28px rgba(150,110,40,0.12)',
} as never;

/** Bản tiếng Anh của `GRID_IN_REASON_LABEL` (dữ liệu gốc ở services/math/grid-in giữ tiếng Việt). */
const GRID_IN_REASON_EN: Record<keyof typeof GRID_IN_REASON_LABEL, string> = {
  empty: 'Nothing entered yet.',
  malformed: 'This box only accepts digits, a decimal point, a fraction bar and a minus sign.',
  mixed_number: "Mixed numbers don't work — \"1 1/2\" is read as 11/2. Enter 3/2 or 1.5.",
  too_long: 'Right value, but too long for the box. The real test marks this wrong too.',
  not_precise_enough: 'The answer is a repeating decimal — fill the box completely for it to count.',
  wrong: 'Not correct.',
};

/**
 * Hai mặt nền, khai MỘT CHỖ.
 *
 * `light` là bộ cũ: thẻ trắng, xám lạnh, xanh dương — dùng ở các màn nền sáng.
 * `paper` là bộ giấy kem trên nền lưới xanh tím: nền phụ ngả hoa oãi hương, viền
 * và màu chọn đổi sang họ chàm cho khớp với nền trang.
 *
 * ĐỨNG CHUNG MỘT BẢNG chứ không rải `surface === 'paper' ? ... : ...` ở tám chỗ:
 * rải ra thì chỉ cần một lần thêm khối mới mà quên nhánh `paper` là có một vết xám
 * lạnh nằm giữa thẻ kem.
 */
const SURFACE = {
  light: {
    /** Khối lõm: đề bài, ghi chú, chip chữ cái. */
    inset: 'bg-canvas',
    /** Mặt đứng riêng có viền: dòng phương án, ô điền số. */
    field: 'border-borderStrong bg-surface',
    /** Phương án đang chọn. */
    picked: 'border-primary-600 bg-primary-50',
    /** Khung lời giải. */
    panel: 'border-border bg-canvas',
    /** Vạch ngang mảnh. */
    hairline: 'border-border',
  },
  paper: {
    inset: 'bg-brand-tint',
    field: 'border-brand-soft bg-paper',
    picked: 'border-brand-mid bg-brand-tint',
    panel: 'border-brand-soft bg-brand-tint',
    hairline: 'border-brand-soft',
  },
  /** Phòng thi SAT (`SatExamShell`): mặt trắng, đề bài không nằm trong khối lõm. */
  exam: {
    inset: 'bg-[#F6F3EC]',
    field: 'border-[#B9BFCB] bg-white',
    picked: 'border-[#0F1D33] bg-white',
    panel: 'border-[#E4DDCF] bg-[#FBF8F2]',
    hairline: 'border-[#E4DDCF]',
  },
} as const;

export type MathSurface = keyof typeof SURFACE;

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
  surface = 'light',
  hidden = [],
  practice = false,
}: {
  item: MathItem;
  answer: string | null;
  onAnswer?: (answer: string) => void;
  revealed?: boolean;
  index?: number;
  /** Phương án Cú đã loại (game khi học) — mờ đi, không bấm được. */
  hidden?: number[];
  /**
   * Nền đang đặt câu hỏi này lên.
   *
   * `light` — thẻ trắng của các màn duyệt (mặc định).
   * `paper` — thẻ giấy kem trên nền lưới xanh tím.
   *
   * CHỮ KHÔNG ĐỔI, CHỈ ĐỔI MẶT NỀN. `ink` và `paper-ink` cách nhau vài độ sáng,
   * đặt trên nền nào cũng đọc được. Cái lộ ra ngay là mấy khối nền: `bg-canvas`
   * (#FCFAF7, xám LẠNH) nằm trong một thẻ kem (#FDFBF3, ẤM) trông như một vết ố.
   */
  surface?: MathSurface;
  /**
   * Tắt khi nơi gọi ĐÃ nói đúng/sai ở chỗ khác — ví dụ màn xem lại bài thi đầy
   * đủ, nơi mỗi câu có sẵn một dải màu trạng thái ở đầu thẻ. Hai cái nhãn "Sai"
   * nằm cách nhau hai centimet không cho biết thêm gì, chỉ làm thẻ rối.
   */
  showGrade?: boolean;
  /**
   * Bộ luyện (có lời giải tức thì) — chỉ đổi phần trình bày: dòng "Câu N · kỹ năng"
   * hiện lại ở đầu đề, phương án chọn đổi sang vàng kim. Phòng thi thật giữ nguyên.
   */
  practice?: boolean;
}) {
  const grade = revealed ? gradeMathItem(item, answer) : null;
  const locked = !onAnswer;
  const sf = SURFACE[surface];
  const { L } = useL();
  const exam = surface === 'exam';
  // Chuỗi thuần của đề, gốc của vị trí tô màu (xem `flattenMath`).
  const stemTexts = useMemo(() => [flattenMath(item.stem)], [item.stem]);

  return (
    <View>
      {/* Phòng thi: số câu đã ở dải đầu câu của khung, không nhắc lại; nhãn kỹ năng chỉ hiện sau khi chấm. */}
      {exam && !grade && !practice ? null : (
        <View className={`flex-row flex-wrap items-center gap-2 ${exam ? 'mb-3' : ''}`}>
          {index !== undefined ? (
            <Text className="font-strong text-cardTitle text-ink">{L('Câu', 'Question')} {index + 1}</Text>
          ) : null}
          <Badge label={MATH_SKILL_LABEL[item.skill]} tone="neutral" shape="tag" />
          {item.format === 'grid_in' ? (
            <Badge label={L('Tự điền đáp án', 'Grid-in')} tone="info" shape="tag" />
          ) : null}
          {grade && showGrade && !practice ? (
            <Badge
              label={grade.isCorrect ? L('Đúng', 'Correct') : answer === null ? L('Bỏ trắng', 'Blank') : L('Sai', 'Wrong')}
              tone={grade.isCorrect ? 'success' : answer === null ? 'neutral' : 'danger'}
            />
          ) : null}
        </View>
      )}

      {exam ? (
        <View style={practice ? PRACTICE_STEM : undefined}>
          <HighlightHost texts={stemTexts}>
            {({ marks, openMark }) => (
              <MathText size={17} weight="semibold" highlight={{ block: 0, marks, onMarkPress: openMark }}>
                {item.stem}
              </MathText>
            )}
          </HighlightHost>
        </View>
      ) : (
        <View className={`mt-3 rounded-card p-3 ${sf.inset}`}>
          <MathText size={15} weight="semibold">
            {item.stem}
          </MathText>
        </View>
      )}

      {item.figure ? (
        <View className="mt-3 items-center">
          <MathFigure spec={item.figure} />
        </View>
      ) : null}

      {item.choices && exam ? (
        <View className="mt-4 gap-2.5">
          {item.choices.map((choice, choiceIndex) => {
            const isOut = !revealed && hidden.includes(choiceIndex) && choiceIndex !== item.correctIndex;
            const selected = answer === String(choiceIndex);
            return (
              <ExamOption
                key={choiceIndex}
                index={choiceIndex}
                selected={selected}
                state={!revealed ? 'idle' : choiceIndex === item.correctIndex ? 'correct' : selected ? 'wrong' : 'idle'}
                disabled={locked}
                out={isOut}
                tone={practice ? 'gold' : 'exam'}
                onPress={() => onAnswer?.(String(choiceIndex))}
              >
                <MathText size={16}>{choice.display}</MathText>
              </ExamOption>
            );
          })}
        </View>
      ) : item.choices ? (
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
              disabled={locked || (!revealed && hidden.includes(choiceIndex))}
              out={!revealed && hidden.includes(choiceIndex) && choiceIndex !== item.correctIndex}
              surface={surface}
            />
          ))}
        </View>
      ) : (
        <GridInBox
          value={answer ?? ''}
          onChange={(text) => onAnswer?.(text)}
          disabled={locked}
          revealed={revealed}
          surface={surface}
        />
      )}

      {grade ? (
        <Explanation item={item} answer={answer} grade={grade} surface={surface} practice={practice} />
      ) : null}
    </View>
  );
}

/**
 * Dải kết quả của bộ luyện: linh vật và một câu ngắn, thay cho nhãn nhỏ ở đầu câu.
 * Chỉ đọc lại kết quả đã chấm, không thêm nhận xét nào khác.
 */
function Verdict({ correct, blank }: { correct: boolean; blank: boolean }) {
  const { L } = useL();
  const title = correct
    ? L('Chính xác', 'Correct')
    : blank
      ? L('Chưa chọn đáp án', 'No answer chosen')
      : L('Chưa đúng', 'Not quite');
  return (
    <Appear>
      <View className="flex-row items-center gap-3 rounded-card p-3" style={{ backgroundColor: correct ? '#E7F5EC' : '#FFF4E0' }}>
        <LionMascot pose={correct ? 'cheer' : 'think'} size={64} />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="font-strong text-cardTitle" style={{ color: correct ? '#1E6B4A' : '#8A5A12' }}>
            {title}
          </Text>
          <Text className="font-sans text-body text-muted">
            {correct
              ? L('Đúng rồi, qua câu tiếp theo.', 'Right, on to the next one.')
              : L('Xem lỗi và lời giải bên dưới.', 'See the mistake and the solution below.')}
          </Text>
        </View>
      </View>
    </Appear>
  );
}

function GridInBox({
  value,
  onChange,
  disabled,
  revealed,
  surface,
}: {
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
  revealed: boolean;
  surface: MathSurface;
}) {
  const sf = SURFACE[surface];
  const { L } = useL();
  return (
    <View className="mt-3">
      <Text className="font-sans text-label text-muted">
        {L('Gõ đáp án: tối đa 5 ký tự, nhận phân số và số thập phân.', 'Type your answer: up to 5 characters, fractions or decimals.')}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={!disabled && !revealed}
        placeholder={L('ví dụ: 3/4', 'e.g. 3/4')}
        placeholderTextColor={color.muted}
        keyboardType="numbers-and-punctuation"
        className={`mt-2 w-44 rounded-card border px-3 py-2 font-sans text-body text-ink ${sf.field}`}
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
  surface,
  practice,
}: {
  item: MathItem;
  answer: string | null;
  grade: NonNullable<ReturnType<typeof gradeMathItem>>;
  surface: MathSurface;
  practice: boolean;
}) {
  const sf = SURFACE[surface];
  const { L, en } = useL();
  return (
    <View className={`mt-3 gap-2 rounded-card border p-3 ${sf.panel}`}>
      {practice ? <Verdict correct={grade.isCorrect} blank={answer === null} /> : null}

      {!grade.isCorrect && grade.gridVerdict && !grade.gridVerdict.ok ? (
        <Text className="font-sans text-body text-ink">
          {en ? GRID_IN_REASON_EN[grade.gridVerdict.reason] : GRID_IN_REASON_LABEL[grade.gridVerdict.reason]}
        </Text>
      ) : null}

      {!grade.isCorrect && grade.errorTag ? (
        <View className="rounded-card bg-warning-soft p-2">
          <Text className="font-strong text-label text-warning-ink">{L('Lỗi vừa mắc', 'The mistake you made')}</Text>
          <Text className="mt-0.5 font-sans text-body text-warning-ink">
            {en ? mathErrorLabel(grade.errorTag, true) : MATH_ERROR_LABEL[grade.errorTag]}
          </Text>
        </View>
      ) : null}

      {!grade.isCorrect && grade.note ? (
        <View className={`rounded-card p-2 ${sf.inset}`}>
          <Text className="font-sans text-body text-ink">{grade.note}</Text>
        </View>
      ) : null}

      {item.answerValue ? (
        <Text className="font-sans text-label text-muted">
          {L('Đáp án đúng — mọi cách viết sau đều được chấp nhận:', 'Correct answer — any of these forms is accepted:')}{' '}
          <Text className="font-strong text-label text-ink">
            {gridInAcceptedForms(item.answerValue).join('   ·   ')}
          </Text>
          {answer !== null && answer.trim() !== '' ? L(`      (bạn gõ: ${answer.trim()})`, `      (you typed: ${answer.trim()})`) : ''}
        </Text>
      ) : null}

      <Text className="mt-1 font-strong text-body text-ink">{L('Lời giải từng bước', 'Step-by-step solution')}</Text>
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

      <WrongChoicesBreakdown item={item} surface={surface} />
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
function WrongChoicesBreakdown({ item, surface }: { item: MathItem; surface: MathSurface }) {
  const sf = SURFACE[surface];
  const { L, en } = useL();
  if (!item.choices || item.correctIndex === null) return null;

  const wrong = item.choices
    .map((choice, index) => ({ choice, index }))
    .filter(({ index }) => index !== item.correctIndex)
    .filter(({ choice }) => choice.errorTag !== null || (choice.note?.length ?? 0) > 0);

  if (wrong.length === 0) return null;

  return (
    <View className={`mt-3 border-t pt-3 ${sf.hairline}`}>
      <Text className="font-strong text-body text-ink">{L('Ba đáp án còn lại sai ở đâu', 'Why the other three are wrong')}</Text>
      <View className="mt-2 gap-2">
        {wrong.map(({ choice, index }) => (
          <View key={index} className="flex-row gap-2">
            <View className={`h-6 w-6 items-center justify-center rounded-pill ${sf.inset}`}>
              <Text className="font-strong text-label text-muted">{'ABCD'[index]}</Text>
            </View>
            <View className="flex-1">
              <MathText size={14}>{choice.display}</MathText>
              <Text className="mt-0.5 font-sans text-label text-muted">
                {choice.errorTag ? (en ? mathErrorLabel(choice.errorTag, true) : MATH_ERROR_LABEL[choice.errorTag]) : choice.note}
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
  surface,
  out = false,
}: {
  index: number;
  display: string;
  selected: boolean;
  revealed: boolean;
  correct: boolean;
  onPress: () => void;
  disabled: boolean;
  surface: MathSurface;
  /** Cú đã loại phương án này. */
  out?: boolean;
}) {
  // Sau khi chấm: đáp án đúng luôn được tô, lựa chọn sai của người học tô đỏ.
  const sf = SURFACE[surface];
  const { L } = useL();
  const tone = revealed
    ? correct
      ? 'border-success bg-success-soft'
      : selected
        ? 'border-danger bg-danger-soft'
        : sf.field
    : selected
      ? sf.picked
      : sf.field;

  /*
    `accessibilityRole="radio"` chứ không để trống, giống hệt phương án bên phòng
    thi R&W. Trình đọc màn hình đọc hai phòng thi của CÙNG một bài thi theo hai
    kiểu khác nhau thì người dùng phải học lại cách nghe giữa lúc đang tính giờ.
  */
  return (
    <PressScale
      accessibilityRole="radio"
      aria-selected={selected} aria-disabled={disabled}
      accessibilityLabel={out ? L(`Phương án ${'ABCD'[index]} — Cú đã loại`, `Option ${'ABCD'[index]} — removed by Owl`) : undefined}
      onPress={disabled ? undefined : onPress}
      className={`flex-row items-center gap-3 rounded-card border p-3 ${tone}`}
      style={out ? { opacity: 0.38 } : undefined}
    >
      <Text className="font-strong text-body text-muted">{'ABCD'[index]}</Text>
      <View className="flex-1">
        <MathText size={15}>{display}</MathText>
      </View>
      {out ? <Text className="font-semi text-label text-muted">{L('Cú đã loại', 'Removed by Owl')}</Text> : null}
    </PressScale>
  );
}
