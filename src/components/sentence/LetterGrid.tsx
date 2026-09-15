import React, { useEffect } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui';
import type { LetterCellState, LetterWord } from '@/services/sentence/letter-cells';
import { paper } from '@/theme/tokens';

import { LetterCell } from './LetterCell';

/**
 * Lưới ô chữ — dùng chung cho Chép chính tả và Dịch câu.
 *
 * Mọi phím vào MỘT ô nhập ẩn phủ lên lưới, rồi chữ được rải ra từng ô — chứ
 * không phải mỗi ô một `TextInput`. Sáu mươi ô nhập riêng nghĩa là sáu mươi chỗ
 * phải tự chuyển tiêu điểm qua lại, và phím xoá lùi ở đầu ô sẽ không biết quay
 * về ô trước. Với một ô nhập duy nhất thì gõ, xoá lùi, dán, chọn — tất cả hoạt
 * động đúng như bàn phím vốn dĩ, miễn phí.
 *
 * PHÍM ENTER PHẢI NGHE Ở PHA BẮT. Ô nhập ẩn ở đây là `TextInput` một dòng, và
 * react-native-web chặn phím Enter của nó lại, không cho nổi lên cửa sổ. Đo ngày
 * 15/09/2026: bắn Enter vào ô này thì bộ nghe `window` ở pha bắt nhận được, ở
 * pha nổi thì không. Ba màn luyện câu đều nghe Enter ở pha nổi, nên nút ghi
 * "Enter" mà bấm thì không có gì xảy ra — đúng lúc người học đang gõ trong lưới.
 *
 * TÁCH KHỎI MÀN CHÉP CHÍNH TẢ (15/09/2026) khi màn Dịch câu chuyển sang gõ từng
 * ô. Hai màn phải gõ, xoá và ăn mừng giống hệt nhau; hai bản sao của cùng một
 * lưới sẽ lệch nhau ngay lần sửa đầu tiên.
 */
export function LetterGrid({
  answer,
  revealed,
  words,
  states,
  caretAt,
  liveResult,
  celebrate,
  value,
  onChange,
  inputRef,
  onClear,
  hint,
}: {
  answer: string;
  /** Đã bấm "Xem đáp án" — ô hiện chữ đúng, không cho gõ nữa. */
  revealed: boolean;
  words: LetterWord[];
  states: LetterCellState[];
  caretAt: number;
  liveResult: boolean;
  /** Đúng cả câu — cả lưới chuyển xanh thành một đợt sóng. */
  celebrate: boolean;
  value: string;
  onChange: (text: string) => void;
  inputRef: React.RefObject<TextInput | null>;
  onClear: () => void;
  /** Dòng nhắc phím tắt ở chân lưới — mỗi màn một bộ phím riêng. */
  hint: string;
}) {
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [inputRef]);

  return (
    <View className="mt-3 rounded-panel border-2 p-4" style={{ borderColor: paper.brandSoft }}>
      {/*
        Ô nhập trong suốt phủ ĐÚNG vùng ô chữ, không phủ cả thẻ: hàng chân thẻ
        có nút "Xoá hết", mà một nút nằm dưới lớp phủ thì bấm không tới.
      */}
      <View>
        <View className="flex-row flex-wrap gap-x-4 gap-y-2.5">
          {words.map((word, wordIndex) => (
            <View key={wordIndex} className="flex-row items-center gap-1">
              {word.units.map((unit, unitIndex) =>
                unit.kind === 'mark' ? (
                  <Text key={unitIndex} className="font-strong text-bodyLg text-paper-muted">
                    {unit.text}
                  </Text>
                ) : (
                  <LetterCell
                    key={unitIndex}
                    char={revealed ? answer[unit.index] ?? '' : value[unit.index]?.toUpperCase() ?? ''}
                    state={revealed ? 'correct' : states[unit.index] ?? 'empty'}
                    caret={!revealed && caretAt === unit.index}
                    liveResult={liveResult}
                    celebrate={celebrate}
                    delayMs={unit.index * 18}
                  />
                ),
              )}
            </View>
          ))}
        </View>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          editable={!revealed}
          accessibilityLabel="Vùng điền chữ cái"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0,
            color: 'transparent',
          }}
        />
      </View>

      <View className="mt-3 flex-row items-center justify-between gap-3">
        <Text className="flex-1 font-sans uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
          {hint}
        </Text>
        <Pressable accessibilityRole="button" onPress={onClear} className="flex-row items-center gap-1.5 py-1">
          <Icon name="refresh" size={13} color={paper.muted} strokeWidth={2} />
          <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
            Xoá hết
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
