import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';
import { EXAM } from './exam-theme';
import { useExamTools } from './exam-context';

export type OptionState = 'idle' | 'correct' | 'wrong';

/**
 * Một dòng phương án kiểu phòng thi số: khung viền trọn bề ngang, chữ cái trong
 * vòng tròn, chọn thì viền và vòng tròn đổi sang chàm đậm.
 *
 * Chế độ loại trừ (nút ABC ở đầu câu) đọc từ context của khung: bật lên thì mỗi
 * dòng có thêm nút gạch ở mép phải; dòng đã gạch mờ đi, có vạch ngang, và nút
 * đổi thành "Hoàn tác". Ngoài khung thì không có nút gạch.
 */
export function ExamOption({
  index,
  selected,
  state = 'idle',
  disabled,
  out,
  onPress,
  children,
}: {
  index: number;
  selected: boolean;
  /** Sau khi chấm: đúng / sai; `idle` khi chưa chấm hoặc dòng không liên quan. */
  state?: OptionState;
  disabled?: boolean;
  /** Cú (game khi học) đã loại phương án này. */
  out?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const { L } = useL();
  const tools = useExamTools();
  const [hovered, setHovered] = useState(false);
  const struck = !!tools?.struck.includes(index);
  const letter = 'ABCDEFGH'[index] ?? '?';

  const border =
    state === 'correct' ? EXAM.success : state === 'wrong' ? EXAM.danger : selected ? EXAM.navy : EXAM.optionLine;
  const bg = state === 'correct' ? EXAM.successSoft : state === 'wrong' ? EXAM.dangerSoft : '#FFFFFF';
  const filled = selected || state === 'correct';
  const circleBg = state === 'correct' ? EXAM.success : state === 'wrong' && selected ? EXAM.danger : filled ? EXAM.navy : '#FFFFFF';

  return (
    <View className="flex-row items-center gap-2.5">
      <Pressable
        accessibilityRole="radio"
        aria-checked={selected}
        aria-disabled={disabled || out}
        aria-description={struck ? L('Đã gạch', 'Crossed out') : out ? L('Cú đã loại', 'Removed by Owl') : undefined}
        disabled={disabled || out}
        onPress={() => {
          // Bấm vào dòng đã gạch: bỏ gạch rồi chọn luôn — như phòng thi thật.
          if (struck) tools?.toggleStrike(index);
          onPress();
        }}
        className="min-w-0 flex-1 flex-row items-center gap-3 rounded-[10px] px-3.5 py-3"
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        // Kiểu là ĐỐI TƯỢNG, không phải hàm: NativeWind bỏ qua style dạng hàm khi có className.
        style={{
          borderWidth: selected || state !== 'idle' ? 2 : 1,
          // Viền 1px thì lùi đệm 1px để chữ không nhảy khi chọn.
          margin: selected || state !== 'idle' ? 0 : 1,
          borderColor: hovered && !disabled && !selected && state === 'idle' ? EXAM.navySoft : border,
          backgroundColor: bg,
          opacity: out ? 0.38 : struck ? 0.5 : 1,
        }}
      >
        <View
          className="h-7 w-7 items-center justify-center rounded-pill"
          style={{ borderWidth: 1.5, borderColor: filled || (state === 'wrong' && selected) ? circleBg : EXAM.ink, backgroundColor: circleBg }}
        >
          <Text className="font-strong text-label" style={{ color: filled || (state === 'wrong' && selected) ? '#FFFFFF' : EXAM.ink }}>
            {letter}
          </Text>
        </View>
        <View className="min-w-0 flex-1">{children}</View>
        {out ? <Text className="font-semi text-label" style={{ color: EXAM.muted }}>{L('Cú đã loại', 'Removed by Owl')}</Text> : null}
        {/* Vạch gạch ngang cả dòng: phương án toán là chữ + công thức lồng nhau, gạch chữ thôi thì sót. */}
        {struck ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 8, right: 8, top: '50%', height: 2, backgroundColor: EXAM.ink }} />
        ) : null}
      </Pressable>

      {tools?.eliminate && !out ? (
        struck ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L(`Bỏ gạch ${letter}`, `Undo cross-out ${letter}`)}
            onPress={() => tools.toggleStrike(index)}
            className="w-16 items-center py-2"
          >
            <Text className="font-strong underline" style={{ color: EXAM.ink, fontSize: 12.5 }} numberOfLines={1}>
              {L('Hoàn tác', 'Undo')}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={L(`Gạch phương án ${letter}`, `Cross out ${letter}`)}
            onPress={() => tools.toggleStrike(index)}
            className="w-16 items-center py-2"
          >
            <View className="h-6 w-6 items-center justify-center rounded-pill" style={{ borderWidth: 1.2, borderColor: EXAM.ink }}>
              <Text className="font-strong" style={{ fontSize: 11, color: EXAM.ink }}>
                {letter}
              </Text>
              <View
                pointerEvents="none"
                style={{ position: 'absolute', width: 30, height: 1.5, backgroundColor: EXAM.ink, transform: [{ rotate: '0deg' }] }}
              />
            </View>
          </Pressable>
        )
      ) : null}
    </View>
  );
}
