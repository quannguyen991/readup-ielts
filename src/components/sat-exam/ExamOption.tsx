import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';
import { Icon } from '@/components/ui';
import { themedHex } from '@/theme/palette-state';
import { EXAM } from './exam-theme';
import { useExamTools } from './exam-context';
import { haptic } from '@/lib/mobile/useMobileExam';

export type OptionState = 'idle' | 'correct' | 'wrong';

/**
 * `exam` — chàm đậm của phòng thi thật (mặc định, bài thi và mock không đổi).
 * `gold` — bộ luyện: chọn thì viền, vòng chữ cái và dấu tick đổi sang vàng kim.
 */
export type OptionTone = 'exam' | 'gold';

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
  tone = 'exam',
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
  tone?: OptionTone;
}) {
  const { L } = useL();
  const tools = useExamTools();
  const [hovered, setHovered] = useState(false);
  const struck = !!tools?.struck.includes(index);
  const letter = 'ABCDEFGH'[index] ?? '?';
  const gold = tone === 'gold';
  const goldLine = themedHex('#E0B04E');
  const goldFill = themedHex('#D9A441');
  const goldSoft = themedHex('#F3F0FB');
  const goldIdle = themedHex('#F3F0FB');

  const border =
    state === 'correct'
      ? EXAM.success
      : state === 'wrong'
        ? EXAM.danger
        : selected
          ? gold ? goldLine : EXAM.navy
          : gold ? '#EADFC6' : EXAM.optionLine;
  const bg =
    state === 'correct' ? EXAM.successSoft : state === 'wrong' ? EXAM.dangerSoft : selected && gold ? goldSoft : '#FFFFFF';
  const filled = selected || state === 'correct';
  const fillColor = gold ? goldFill : EXAM.navy;
  const circleBg =
    state === 'correct'
      ? EXAM.success
      : state === 'wrong' && selected
        ? EXAM.danger
        : filled
          ? fillColor
          : gold
            ? goldIdle
            : '#FFFFFF';

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
          haptic();
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
        {gold && selected && state === 'idle' && !out ? (
          <View className="h-6 w-6 items-center justify-center rounded-pill" style={{ backgroundColor: goldFill }}>
            <Icon name="check" size={13} color="#FFFFFF" strokeWidth={2.6} />
          </View>
        ) : null}
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
            className="w-16 items-center justify-center"
            style={{ minHeight: 48 }}
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
            className="w-16 items-center justify-center"
            style={{ minHeight: 48 }}
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
