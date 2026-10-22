import React, { type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * THANH CÔNG CỤ CHUNG CHO PHÒNG THI READING VÀ LISTENING.
 *
 * Một khung trắng kem bo tròn, viền mực đậm: nút thoát, chip PART, dãy số câu (đã
 * làm tô đặc), các nút giao diện (cỡ chữ, kiểu chữ, màu nền trang), đồng hồ và nút
 * "Kiểm tra" màu vàng. Reading và Listening dùng chung để cùng một bố cục.
 *
 * Thanh không tự giữ trạng thái: nơi gọi truyền vào số câu, câu hiện tại, câu đã làm,
 * và các hàm bấm. Phần đồng hồ, giao diện chữ và màu nền do nơi gọi quyết định.
 * Màn hẹp (dưới 760px) thì dãy số câu xuống hàng riêng để các nút không bị ép.
 */

export const EXAM_INK = '#2B2350';
export const EXAM_GOLD = '#F2B84B';
const CREAM = '#FFF5F8';
const NARROW_BELOW = 760;

export type ExamPart = { key: string; label: string };

export type ExamToolbarProps = {
  onBack: () => void;
  /** Các phần (ví dụ Part 1, Part 2…). Phần đang mở là `activePart`. */
  parts: ExamPart[];
  activePart: string;
  onPickPart: (key: string) => void;
  /** Số câu trong phần đang mở, ví dụ [1, 2, …, 13]. */
  questionNumbers: number[];
  /** Các câu đã có đáp án, để tô đặc. */
  answered: ReadonlySet<number>;
  /** Câu đang làm, được viền nổi. */
  current: number | null;
  onJump: (n: number) => void;
  /** Đồng hồ hiển thị, ví dụ "0:03" hoặc "59:48". Bỏ qua khi có `timerSlot`. */
  timer: string;
  onSubmit: () => void;
  submitLabel: string;
  /** Nút cỡ chữ và kiểu chữ tuỳ chọn (không truyền thì ẩn). */
  typography?: {
    fontLabel: string;
    onCycleFont: () => void;
    sizeLabel: string;
    onCycleSize: () => void;
  };
  /** Các màu nền trang để chọn; `theme` là chỉ số đang chọn. */
  themes?: { swatches: readonly string[]; theme: number; onPick: (i: number) => void };
  /** Thay đồng hồ mặc định (ví dụ đồng hồ tự chạy có nút tạm dừng). */
  timerSlot?: ReactNode;
  /** Nút phụ đặt trước nút nộp bài (trợ giúp, cài đặt, ghi chú…). */
  extras?: ReactNode;
  /** Vô hiệu hoá nút nộp bài (đang chấm). */
  submitDisabled?: boolean;
};

export function ExamToolbar({
  onBack,
  parts,
  activePart,
  onPickPart,
  questionNumbers,
  answered,
  current,
  onJump,
  timer,
  onSubmit,
  submitLabel,
  typography,
  themes,
  timerSlot,
  extras,
  submitDisabled = false,
}: ExamToolbarProps) {
  const { width: winW } = useWindowDimensions();
  const narrow = winW < NARROW_BELOW;
  return (
    <View
      style={
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: EXAM_INK,
          backgroundColor: CREAM,
          ...(Platform.OS === 'web' ? { boxShadow: '0 3px 0 rgba(31,26,20,0.9)' } : {}),
        } as object
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        onPress={onBack}
        style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: EXAM_INK, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}
      >
        <Icon name="chevron-left" size={18} color={EXAM_INK} strokeWidth={2.2} />
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 1, flexShrink: 1, flexBasis: narrow ? '100%' : 0, minWidth: 0 }}
        contentContainerStyle={{ alignItems: 'center', gap: 6 }}
      >
        {parts.map((p) => {
          const on = p.key === activePart;
          return (
            <Pressable
              key={p.key}
              accessibilityRole="button"
              aria-selected={on}
              onPress={() => onPickPart(p.key)}
              style={{ paddingHorizontal: 12, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? EXAM_INK : 'transparent' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: on ? '#FFFFFF' : EXAM_INK }}>{p.label.toUpperCase()}</Text>
            </Pressable>
          );
        })}
        <View style={{ width: 1, height: 22, backgroundColor: '#D9CFBC', marginHorizontal: 4 }} />
        {questionNumbers.map((n) => {
          const done = answered.has(n);
          const on = current === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`Câu ${n}${done ? ', đã làm' : ''}`}
              onPress={() => onJump(n)}
              style={{
                minWidth: 28,
                height: 28,
                paddingHorizontal: 4,
                borderRadius: 8,
                borderWidth: on ? 2.5 : 1.5,
                borderColor: on ? EXAM_INK : '#BDB29C',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: done ? EXAM_GOLD : '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: EXAM_INK }}>{n}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {themes ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {themes.swatches.map((c, i) => (
            <Pressable
              key={c + i}
              accessibilityRole="button"
              accessibilityLabel={`Màu nền ${i + 1}`}
              onPress={() => themes.onPick(i)}
              style={{ width: 18, height: 18, borderRadius: 4, borderWidth: themes.theme === i ? 2.5 : 1.5, borderColor: EXAM_INK, backgroundColor: c }}
            />
          ))}
        </View>
      ) : null}

      {typography ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable accessibilityRole="button" onPress={typography.onCycleFont} style={chipStyle}>
            <Text style={chipText}>{typography.fontLabel}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={typography.onCycleSize} style={chipStyle}>
            <Text style={chipText}>{typography.sizeLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      {timerSlot ?? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 34, borderRadius: 999, borderWidth: 2, borderColor: EXAM_INK, backgroundColor: '#FFFFFF' }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2E9E5B' }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: EXAM_INK, fontVariant: ['tabular-nums'] as never }}>{timer}</Text>
        </View>
      )}

      {extras}

      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        disabled={submitDisabled}
        style={{ height: 36, paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: EXAM_INK, backgroundColor: EXAM_GOLD, alignItems: 'center', justifyContent: 'center', opacity: submitDisabled ? 0.6 : 1 }}
      >
        <Text style={{ fontSize: 14, fontWeight: '800', color: EXAM_INK }}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

/** Nút viên thuốc viền mực, dùng cho nút phụ trên thanh công cụ (trợ giúp, cài đặt, tạm dừng…). */
export function ExamToolbarButton({
  label,
  onPress,
  active = false,
  icon,
  compact = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: IconName;
  /** Chỉ hiện biểu tượng (màn hẹp). Không có biểu tượng thì vẫn hiện chữ. */
  compact?: boolean;
  accessibilityLabel?: string;
}) {
  const fg = active ? '#FFFFFF' : EXAM_INK;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      aria-pressed={active}
      onPress={onPress}
      style={{
        height: 34,
        minWidth: 34,
        paddingHorizontal: compact && icon ? 8 : 12,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: EXAM_INK,
        backgroundColor: active ? EXAM_INK : '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {icon ? <Icon name={icon} size={14} color={fg} strokeWidth={2.2} /> : null}
      {compact && icon ? null : <Text style={{ fontSize: 12, fontWeight: '800', color: fg }}>{label}</Text>}
    </Pressable>
  );
}

const chipStyle = {
  height: 30,
  paddingHorizontal: 10,
  borderRadius: 999,
  borderWidth: 1.5,
  borderColor: '#BDB29C',
  backgroundColor: '#FFFFFF',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const chipText = { fontSize: 12, fontWeight: '700' as const, color: EXAM_INK };
