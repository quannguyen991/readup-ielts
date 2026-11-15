import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { INK, LINE, MUTED } from './stage';

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Lịch một tháng, tuần bắt đầu từ thứ Hai; ngày trước `min` bị tắt. Giá trị là YYYY-MM-DD. */
export function MonthCalendar({
  value,
  onChange,
  min,
  accent,
  labels,
}: {
  value: string | null;
  onChange: (day: string) => void;
  min: string;
  accent: string;
  labels: { month: (y: number, m: number) => string; weekdays: string[] };
}) {
  const start = value ?? min;
  const [view, setView] = useState({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 });

  const first = new Date(view.y, view.m, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const minY = Number(min.slice(0, 4));
  const minM = Number(min.slice(5, 7)) - 1;
  const atMin = view.y < minY || (view.y === minY && view.m <= minM);
  const move = (delta: number) => {
    const t = new Date(view.y, view.m + delta, 1);
    setView({ y: t.getFullYear(), m: t.getMonth() });
  };

  return (
    <View style={{ borderRadius: 16, borderWidth: 2, borderColor: LINE, padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="‹" disabled={atMin} onPress={() => move(-1)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#F3F2F7', alignItems: 'center', justifyContent: 'center', opacity: atMin ? 0.4 : 1 }}>
          <Icon name="chevron-left" size={16} color={INK} strokeWidth={2.4} />
        </Pressable>
        <Text className="font-nun-heavy" style={{ fontSize: 15, color: INK }}>
          {labels.month(view.y, view.m)}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="›" onPress={() => move(1)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#F3F2F7', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-right" size={16} color={INK} strokeWidth={2.4} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {labels.weekdays.map((w) => (
          <Text key={w} className="font-nun-heavy" style={{ flex: 1, textAlign: 'center', fontSize: 12, color: MUTED, paddingVertical: 4 }}>
            {w}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {cells.slice(row * 7, row * 7 + 7).map((d, i) => {
            if (d === null) return <View key={i} style={{ flex: 1, height: 38 }} />;
            const key = keyOf(view.y, view.m, d);
            const disabled = key < min;
            const selected = key === value;
            return (
              <View key={i} style={{ flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  onPress={() => onChange(key)}
                  style={({ hovered }: { hovered?: boolean }) => ({ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? accent : hovered && !disabled ? '#EFEAFD' : '#F3F2F7', opacity: disabled ? 0.35 : 1 })}
                >
                  <Text className="font-nun-heavy" style={{ fontSize: 13, color: selected ? '#FFFFFF' : INK }}>
                    {d}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
