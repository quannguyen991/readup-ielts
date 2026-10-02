import React from 'react';
import { Platform, Pressable, Text, TextInput } from 'react-native';

import { EXAM } from './exam-theme';

/** Ô điền: bo tròn, số câu màu nhấn làm gợi ý, gõ vào thì chữ thay số. */
export function GapInput({
  number,
  value,
  onChange,
  onFocus,
  width = 120,
}: {
  number: number;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  width?: number | '100%';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      onFocus={onFocus}
      placeholder={String(number)}
      placeholderTextColor={EXAM.accent}
      autoCapitalize="none"
      autoCorrect={false}
      accessibilityLabel={`Question ${number}`}
      style={[
        {
          width,
          height: 36,
          paddingHorizontal: 12,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: value ? EXAM.accent : EXAM.accentLine,
          backgroundColor: value ? EXAM.accentSoft : EXAM.white,
          fontSize: 15,
          fontWeight: '600',
          color: EXAM.ink,
          textAlign: value ? 'left' : 'center',
        },
        Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
      ]}
    />
  );
}

/** Ô chọn từ bảng từ: bấm để chọn ô đang điền, hiện từ đã chọn hoặc số câu. */
export function BankGap({
  number,
  value,
  focused,
  onPress,
}: {
  number: number;
  value: string;
  focused: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `Question ${number}: ${value}` : `Question ${number}`}
      style={{
        minWidth: 92,
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 18,
        borderWidth: 1.5,
        borderStyle: value || focused ? 'solid' : 'dashed',
        borderColor: focused || value ? EXAM.accent : EXAM.accentLine,
        backgroundColor: value ? EXAM.accentSoft : EXAM.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: value ? '700' : '800', color: value ? EXAM.ink : EXAM.accent }}>
        {value || number}
      </Text>
    </Pressable>
  );
}
