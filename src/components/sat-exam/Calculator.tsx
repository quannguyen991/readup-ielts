import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useL } from '@/i18n/useL';
import { CalcError, evaluate, formatNumber, toFraction, type AngleMode } from './calc-eval';
import { EXAM } from './exam-theme';

/**
 * Máy tính khoa học của phòng thi Math: gõ biểu thức (hoặc bấm phím), Enter để
 * tính, lịch sử bấm lại được. Tính bằng `calc-eval` — bộ phân tích tự viết,
 * không `eval`, không thư viện ngoài.
 *
 * Desmos có màn riêng để dùng máy tính đồ thị nhúng khi đã cấu hình API key.
 */

type Entry = { expr: string; value: number };

const KEYS: { label: string; insert?: string; action?: 'clear' | 'back' | 'eq'; tone?: 'fn' | 'num' | 'op' | 'eq'; span?: number }[] = [
  { label: 'sin', insert: 'sin(', tone: 'fn' },
  { label: 'cos', insert: 'cos(', tone: 'fn' },
  { label: 'tan', insert: 'tan(', tone: 'fn' },
  { label: '7', tone: 'num' },
  { label: '8', tone: 'num' },
  { label: '9', tone: 'num' },
  { label: '÷', insert: '÷', tone: 'op' },
  { label: '√', insert: '√(', tone: 'fn' },
  { label: 'xʸ', insert: '^', tone: 'fn' },
  { label: 'x²', insert: '^2', tone: 'fn' },
  { label: '4', tone: 'num' },
  { label: '5', tone: 'num' },
  { label: '6', tone: 'num' },
  { label: '×', insert: '×', tone: 'op' },
  { label: '(', tone: 'fn' },
  { label: ')', tone: 'fn' },
  { label: 'π', tone: 'fn' },
  { label: '1', tone: 'num' },
  { label: '2', tone: 'num' },
  { label: '3', tone: 'num' },
  { label: '−', insert: '-', tone: 'op' },
  { label: 'ln', insert: 'ln(', tone: 'fn' },
  { label: 'log', insert: 'log(', tone: 'fn' },
  { label: 'ans', tone: 'fn' },
  { label: '0', tone: 'num' },
  { label: '.', tone: 'num' },
  { label: '⌫', action: 'back', tone: 'num' },
  { label: '+', insert: '+', tone: 'op' },
  { label: 'AC', action: 'clear', tone: 'fn' },
  { label: 'a/b', insert: '/', tone: 'fn' },
  { label: 'e', tone: 'fn' },
  { label: '=', action: 'eq', tone: 'eq', span: 4 },
];

export default function Calculator() {
  const { L } = useL();
  const [expr, setExpr] = useState('');
  const [sel, setSel] = useState({ start: 0, end: 0 });
  const [angle, setAngle] = useState<AngleMode>('deg');
  const [history, setHistory] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const ans = history.length > 0 ? history[history.length - 1]!.value : 0;

  const message = (e: unknown) => {
    const code = e instanceof CalcError ? e.code : 'syntax';
    return {
      syntax: L('Biểu thức chưa đúng', 'Check the expression'),
      paren: L('Thiếu hoặc thừa ngoặc', 'Unbalanced parentheses'),
      domain: L('Ngoài miền xác định', 'Math error'),
      unknown: L('Có tên hàm lạ', 'Unknown name'),
      empty: '',
    }[code];
  };

  const preview = useMemo(() => {
    if (!expr.trim()) return null;
    try {
      return evaluate(expr, { angle, ans });
    } catch {
      return null;
    }
  }, [expr, angle, ans]);

  const insert = (text: string) => {
    const next = expr.slice(0, sel.start) + text + expr.slice(sel.end);
    const at = sel.start + text.length;
    setExpr(next);
    setSel({ start: at, end: at });
    setError(null);
    inputRef.current?.focus();
  };

  const run = () => {
    if (!expr.trim()) return;
    try {
      const value = evaluate(expr, { angle, ans });
      setHistory((h) => [...h.slice(-49), { expr, value }]);
      setExpr('');
      setSel({ start: 0, end: 0 });
      setError(null);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 0);
    } catch (e) {
      setError(message(e));
    }
  };

  const press = (k: (typeof KEYS)[number]) => {
    if (k.action === 'clear') {
      setExpr('');
      setSel({ start: 0, end: 0 });
      setError(null);
      return;
    }
    if (k.action === 'back') {
      if (sel.start !== sel.end) insert('');
      else if (sel.start > 0) {
        setExpr(expr.slice(0, sel.start - 1) + expr.slice(sel.start));
        setSel({ start: sel.start - 1, end: sel.start - 1 });
      }
      return;
    }
    if (k.action === 'eq') return run();
    insert(k.insert ?? k.label);
  };

  return (
    <View className="flex-1">
      <ScrollView ref={scrollRef} className="flex-1 px-3 pt-2" contentContainerStyle={{ paddingBottom: 6 }}>
        {history.length === 0 ? (
          <Text className="font-sans text-label" style={{ color: EXAM.muted }}>
            {L('Gõ hoặc bấm phím, Enter để tính.', 'Type or tap, Enter to evaluate.')}
          </Text>
        ) : (
          history.map((h, i) => {
            const frac = toFraction(h.value);
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={L('Chèn kết quả', 'Insert result')}
                onPress={() => insert(formatNumber(h.value))}
                className="border-b py-1.5"
                style={{ borderColor: EXAM.line }}
              >
                <Text className="font-sans text-label" style={{ color: EXAM.muted }} numberOfLines={1}>
                  {h.expr}
                </Text>
                <Text className="text-right font-strong text-body" style={{ color: EXAM.ink }}>
                  = {formatNumber(h.value)}
                  {frac ? <Text className="font-sans text-label" style={{ color: EXAM.goldDeep }}>{`   (${frac})`}</Text> : null}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View className="border-t px-3 pb-2 pt-2" style={{ borderColor: EXAM.line }}>
        <TextInput
          ref={inputRef}
          value={expr}
          onChangeText={(t) => {
            setExpr(t);
            setError(null);
          }}
          selection={sel}
          onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
          onSubmitEditing={run}
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
          aria-label={L('Biểu thức', 'Expression')}
          placeholder="2(3+4)^2 ÷ √7"
          placeholderTextColor="#A3A9B5"
          className="rounded-md border px-2.5 py-2 font-semi text-body"
          style={{ borderColor: EXAM.optionLine, color: EXAM.ink }}
        />
        <View className="mt-1 h-5 flex-row items-center justify-between">
          <Text className="font-sans text-label" style={{ color: error ? EXAM.danger : EXAM.muted }} numberOfLines={1}>
            {error ?? (preview !== null ? `= ${formatNumber(preview)}${toFraction(preview) ? `  (${toFraction(preview)})` : ''}` : '')}
          </Text>
          <View className="flex-row overflow-hidden rounded-pill border" style={{ borderColor: EXAM.optionLine }}>
            {(['deg', 'rad'] as const).map((m) => (
              <Pressable
                key={m}
                accessibilityRole="button"
                aria-selected={angle === m}
                onPress={() => setAngle(m)}
                className="px-2 py-0.5"
                style={{ backgroundColor: angle === m ? EXAM.navy : '#FFFFFF' }}
              >
                <Text className="font-strong" style={{ fontSize: 11, color: angle === m ? '#FFFFFF' : EXAM.body }}>
                  {m === 'deg' ? 'DEG' : 'RAD'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-1.5 flex-row flex-wrap" style={{ marginHorizontal: -2 }}>
          {KEYS.map((k) => (
            <View key={k.label} style={{ width: `${(100 / 7) * (k.span ?? 1)}%`, padding: 2 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={k.label}
                onPress={() => press(k)}
                className="h-9 items-center justify-center rounded-md"
                style={{
                  backgroundColor:
                    k.tone === 'eq' ? EXAM.navy : k.tone === 'op' ? '#E9EDF4' : k.tone === 'num' ? '#FFFFFF' : EXAM.bar,
                  borderWidth: k.tone === 'num' ? 1 : 0,
                  borderColor: EXAM.line,
                }}
              >
                <Text
                  className="font-semi"
                  style={{ fontSize: 14, color: k.tone === 'eq' ? '#FFFFFF' : EXAM.ink }}
                >
                  {k.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/sat/desmos' as never)}
          className="mt-1.5 self-end"
        >
          <Text className="font-semi text-label underline" style={{ color: EXAM.navySoft }}>
            {L('Mở Desmos cho câu hình học ↗', 'Open Desmos for geometry ↗')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
