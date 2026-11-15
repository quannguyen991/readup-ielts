import React from 'react';
import { Pressable, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { CatSticker, type CatPose } from '@/components/mascot/CatSticker';
import { Icon } from '@/components/ui/Icon';

/**
 * Linh kiện chung của luồng HSA (khảo sát, bài test đầu vào, kế hoạch, Đua Top). Bố cục theo ảnh mẫu:
 * một khung màu choán cả trang, thanh ba bước ở trên, tiêu đề lớn kèm linh vật, rồi thẻ "cửa sổ" ba
 * chấm chứa nội dung. Màu và phông theo Band 9 (tím, xanh, vàng; phông Nunito bo tròn).
 */

export const INK = '#17132E';
export const MUTED = '#6E6890';
export const LINE = '#E6E1F5';

export type StageTone = { bg: string; frame: string; accent: string; circle: string };

export const STAGE_TONES: Record<'about' | 'test' | 'plan' | 'board', StageTone> = {
  about: { bg: '#6A4BD9', frame: '#4B33B5', accent: '#6A4BD9', circle: 'rgba(255,255,255,0.13)' },
  test: { bg: '#2F6FD6', frame: '#1F4FA3', accent: '#2F6FD6', circle: 'rgba(255,255,255,0.13)' },
  plan: { bg: '#1B1140', frame: '#0F0A26', accent: '#8B6CF0', circle: 'rgba(255,255,255,0.07)' },
  board: { bg: '#FFC233', frame: '#C98F00', accent: '#B87D00', circle: 'rgba(255,255,255,0.28)' },
};

export function useWide(breakpoint = 900): boolean {
  return useWindowDimensions().width >= breakpoint;
}

// ---------------------------------------------------------------- thanh ba bước

/** `step` là bước đang làm (1–3); `progress` là phần đã đi (0–1) trong bước đó. */
export function Stepper({ step, progress = 0, labels, dark = false }: { step: 1 | 2 | 3; progress?: number; labels: [string, string, string]; dark?: boolean }) {
  const wide = useWide();
  const fill = step === 1 ? progress * 0.5 : step === 2 ? 0.5 + progress * 0.5 : 1;
  const ink = dark ? INK : '#FFFFFF';
  return (
    <View style={{ width: '100%', marginBottom: 18 }}>
      <View style={{ position: 'relative' }}>
        <View style={{ position: 'absolute', left: 16, right: 16, top: 15, height: 3, borderRadius: 3, backgroundColor: dark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.3)' }}>
          <View style={{ width: `${Math.min(1, fill) * 100}%`, height: 3, borderRadius: 3, backgroundColor: ink }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {labels.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <View key={label} style={{ width: wide ? 130 : 84, alignItems: i === 0 ? 'flex-start' : i === 2 ? 'flex-end' : 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done || current ? ink : 'transparent',
                    borderWidth: 3,
                    borderColor: ink,
                    ...(current ? ({ boxShadow: '0 0 0 5px rgba(255,255,255,0.28)' } as ViewStyle) : null),
                  }}
                >
                  {done ? <Icon name="check" size={16} color={dark ? '#FFFFFF' : '#4B33B5'} strokeWidth={3} /> : <Text className="font-nun-heavy" style={{ fontSize: 13, color: current ? (dark ? '#FFFFFF' : '#4B33B5') : ink }}>{n}</Text>}
                </View>
                <Text className="font-nun-heavy" numberOfLines={1} style={{ marginTop: 6, fontSize: wide ? 13 : 12, color: ink, textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center' }}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- khung màu choán trang

export function StageShell({
  tone,
  step,
  progress,
  labels,
  eyebrow,
  title,
  line,
  pose,
  children,
}: {
  tone: StageTone;
  step: 1 | 2 | 3;
  progress?: number;
  labels: [string, string, string];
  eyebrow?: string;
  title: string;
  line?: string;
  pose?: CatPose;
  children: React.ReactNode;
}) {
  const wide = useWide();
  return (
    <View style={{ borderRadius: 28, backgroundColor: tone.bg, overflow: 'hidden', paddingHorizontal: wide ? 36 : 10, paddingTop: wide ? 22 : 16, paddingBottom: wide ? 28 : 12 }}>
      <View pointerEvents="none" style={{ position: 'absolute', right: -70, top: -90, width: 300, height: 300, borderRadius: 999, backgroundColor: tone.circle }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: '38%', top: 60, width: 190, height: 190, borderRadius: 999, backgroundColor: tone.circle }} />
      <Stepper step={step} progress={progress} labels={labels} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: wide ? 16 : 12, paddingHorizontal: wide ? 0 : 6 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? (
            <Text className="font-nun-heavy" style={{ fontSize: 13, color: '#FFFFFF' }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text className="font-nun-heavy" style={{ fontSize: wide ? 44 : 28, lineHeight: wide ? 50 : 33, color: '#FFFFFF', marginTop: 2 }}>
            {title}
          </Text>
          {line ? (
            <Text className="font-nun-strong" style={{ fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.92)', marginTop: 6, maxWidth: 640 }}>
              {line}
            </Text>
          ) : null}
        </View>
        {pose ? <CatSticker pose={pose} size={wide ? 92 : 56} /> : null}
      </View>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------- thẻ cửa sổ ba chấm

export function WindowCard({ frame, children, padded = true }: { frame: string; children: React.ReactNode; padded?: boolean }) {
  const wide = useWide();
  return (
    <View style={{ backgroundColor: frame, borderRadius: wide ? 24 : 20, padding: wide ? 8 : 5, paddingTop: 0, ...({ boxShadow: '0 14px 30px rgba(0,0,0,0.18)' } as ViewStyle) }}>
      <View style={{ height: wide ? 26 : 22, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 12 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.85)' }} />
        ))}
      </View>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: wide ? 18 : 16, padding: padded ? (wide ? 18 : 12) : 0, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

// ---------------------------------------------------------------- ô chọn, chip, nút

/** Ô chọn có chữ A/B/C… bên trái; chọn rồi thì tô màu và hiện dấu tích. */
export function OptionTile({
  letter,
  title,
  line,
  selected,
  accent,
  onPress,
}: {
  letter: string;
  title: string;
  line?: string;
  selected: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 2,
        borderBottomWidth: selected ? 2 : 4,
        borderColor: selected ? accent : LINE,
        backgroundColor: selected ? accent : hovered ? '#F8F6FF' : '#FFFFFF',
        transform: [{ translateY: pressed ? 2 : 0 }],
      })}
    >
      <View style={{ width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? '#FFFFFF' : '#F3F0FB' }}>
        {selected ? <Icon name="check" size={16} color={accent} strokeWidth={3} /> : <Text className="font-nun-heavy" style={{ fontSize: 13, color: INK }}>{letter}</Text>}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-nun-heavy" style={{ fontSize: 16, lineHeight: 21, color: selected ? '#FFFFFF' : INK }}>
          {title}
        </Text>
        {line ? (
          <Text className="font-nun-strong" style={{ fontSize: 13, lineHeight: 18, color: selected ? 'rgba(255,255,255,0.88)' : MUTED }}>
            {line}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function Chip({ label, selected, accent, onPress }: { label: string; selected: boolean; accent: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 2,
        borderBottomWidth: selected ? 2 : 4,
        borderColor: selected ? accent : LINE,
        backgroundColor: selected ? accent : hovered ? '#F8F6FF' : '#FFFFFF',
      })}
    >
      <Text className="font-nun-heavy" style={{ fontSize: 14, color: selected ? '#FFFFFF' : INK }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function DarkButton({ label, onPress, disabled, icon = 'arrow-right' }: { label: string; onPress: () => void; disabled?: boolean; icon?: 'arrow-right' | 'play' | null }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 46,
        paddingHorizontal: 22,
        borderRadius: 14,
        backgroundColor: disabled ? '#CBC8D6' : hovered ? '#2A2350' : INK,
      })}
    >
      <Text className="font-nun-heavy" style={{ fontSize: 15, color: '#FFFFFF' }}>
        {label}
      </Text>
      {icon ? <Icon name={icon} size={16} color="#FFFFFF" strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

export function SoftButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: 'chevron-left' | null }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 46,
        paddingHorizontal: 18,
        borderRadius: 14,
        backgroundColor: hovered ? '#E9E6F3' : '#F3F2F7',
      })}
    >
      {icon ? <Icon name={icon} size={16} color={INK} strokeWidth={2.4} /> : null}
      <Text className="font-nun-heavy" style={{ fontSize: 15, color: INK }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------- biểu đồ vòng đúng / sai / bỏ qua

export function Donut({ correct, wrong, skipped, size = 150, thickness = 16 }: { correct: number; wrong: number; skipped: number; size?: number; thickness?: number }) {
  const total = Math.max(1, correct + wrong + skipped);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const segs = [
    { n: correct, color: '#16A34A' },
    { n: wrong, color: '#E5484D' },
    { n: skipped, color: '#F5B93B' },
  ];
  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#EFEAFD" strokeWidth={thickness} fill="none" />
        {segs.map((s, i) => {
          const len = (s.n / total) * c;
          const node = s.n > 0 ? <Circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={s.color} strokeWidth={thickness} fill="none" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} /> : null;
          offset += len;
          return node;
        })}
      </Svg>
      <Text className="font-nun-heavy" style={{ fontSize: size * 0.24, lineHeight: size * 0.28, color: INK }}>
        {correct}
        <Text style={{ fontSize: size * 0.13, color: MUTED }}>/{correct + wrong + skipped}</Text>
      </Text>
    </View>
  );
}

/** Màu nhận diện của từng tiêu chí chấm (ô chữ cái ở danh sách phần test và thẻ điểm). */
export const CRITERION_COLOR: Record<'grammar' | 'vocab' | 'dialogue' | 'reading' | 'reasoning', string> = {
  grammar: '#F59E0B',
  vocab: '#22A06B',
  dialogue: '#E5527B',
  reading: '#3A8CFF',
  reasoning: '#7C5CF0',
};

/** Nhãn thanh ba bước: bản ngắn trên điện thoại để không bị cắt chữ. */
export function stageLabels(L: (vi: string, en: string) => string, wide: boolean): [string, string, string] {
  return wide ? ['About you', L('Làm test', 'Entry test'), L('Lộ trình cá nhân hoá', 'Your plan')] : ['About you', L('Làm test', 'Test'), L('Lộ trình', 'Plan')];
}
