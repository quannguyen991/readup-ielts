import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button, Card } from '@/components/ui';
import type { MockItem } from '@/services/sat-rw/mock/item';
import { color, radius, spacing as space } from '@/theme/tokens';

/**
 * Phòng thi Reading and Writing: một module, đồng hồ đếm ngược, không lời giải.
 *
 * ĐỐI XỨNG VỚI `MathRunner` chứ không dùng lại nó: hai bên nhận hai kiểu câu khác
 * nhau (`MathItem` có hình vẽ và ô điền số; `MockItem` có bảng số, ghi chú, chỗ
 * trống). Nhét cả hai vào một component sẽ ra một component biết quá nhiều thứ,
 * và mỗi lần thêm dạng câu là một lần sửa chỗ dùng chung.
 *
 * KHÔNG CÓ LỜI GIẢI GIỮA CHỪNG. Đây là mô phỏng phòng thi; lời giải hiện ra sau
 * khi nộp cả module. `MathRunner` có cờ `instantSolution` cho các bộ luyện, ở đây
 * không có cờ ấy vì không có chế độ luyện — module thi thì luôn là module thi.
 *
 * HẾT GIỜ LÀ TỰ NỘP, kể cả khi còn câu chưa làm. Đề thật không cho cộng giờ, và
 * một màn hình chờ người bấm khi đã hết giờ sẽ dạy sai thói quen làm bài.
 */

export type RwRunnerProps = {
  title: string;
  /** Ghi chú nhỏ dưới đồng hồ, ví dụ "Module 1 / 2". */
  phaseLabel?: string;
  items: MockItem[];
  minutes: number;
  onFinish: (answers: (number | null)[], elapsedMs: number) => void;
};

function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function RwRunner({ title, phaseLabel, items, minutes, onFinish }: RwRunnerProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => items.map(() => null));
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set());
  const [remainingMs, setRemainingMs] = useState(minutes * 60_000);

  const startedAt = useRef(Date.now());
  const finished = useRef(false);

  const submit = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish(answers, Date.now() - startedAt.current);
  }, [answers, onFinish]);

  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    startedAt.current = Date.now();
    const timer = setInterval(() => {
      const left = minutes * 60_000 - (Date.now() - startedAt.current);
      setRemainingMs(left);
      // Hết giờ là nộp, không hỏi lại: đề thật không cho cộng giờ.
      if (left <= 0) submitRef.current();
    }, 1000);
    return () => clearInterval(timer);
  }, [minutes]);

  const item = items[index];
  if (!item) return null;

  const answered = answers.filter((a) => a !== null).length;
  const lowOnTime = remainingMs <= 5 * 60_000;
  const last = index === items.length - 1;

  const choose = (option: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = option;
      return next;
    });
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <Screen>
      {/* ── thanh trạng thái: đồng hồ, tiến độ ─────────────────────────── */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-strong text-body text-ink">{title}</Text>
          {phaseLabel ? (
            <Text className="mt-0.5 font-sans text-label text-muted">{phaseLabel}</Text>
          ) : null}
        </View>
        <View className="items-end">
          <Text
            className="font-heavy"
            style={{ fontSize: 26, color: lowOnTime ? color.danger : color.ink }}
          >
            {formatClock(remainingMs)}
          </Text>
          <Text className="font-sans text-label text-muted">
            {answered}/{items.length} câu
          </Text>
        </View>
      </View>

      {/* ── dải số câu: xem nhanh câu nào chưa làm, câu nào đã đánh dấu ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
        <View className="flex-row gap-1.5">
          {items.map((_, i) => {
            const isNow = i === index;
            const done = answers[i] !== null;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`Câu ${i + 1}`}
                onPress={() => setIndex(i)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isNow ? 2 : 1,
                  borderColor: isNow ? color.primary : color.border,
                  backgroundColor: done ? color.primarySoft : color.surface,
                }}
              >
                <Text
                  className="font-semi"
                  style={{ fontSize: 12, color: done ? color.primary : color.muted }}
                >
                  {flagged.has(i) ? '★' : i + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* ── bài dẫn ────────────────────────────────────────────────────── */}
      <Card className="mt-4">
        <Text className="font-sans text-body text-ink" style={{ lineHeight: 24 }}>
          {item.passage}
        </Text>

        {item.notes ? (
          <View className="mt-3">
            {item.notes.map((n) => (
              <Text
                key={n}
                className="mt-1 font-sans text-body text-body"
                style={{ lineHeight: 22 }}
              >
                {'•  '}
                {n}
              </Text>
            ))}
          </View>
        ) : null}

        {item.table ? <EvidenceTableView table={item.table} /> : null}
      </Card>

      {/* ── câu hỏi và phương án ───────────────────────────────────────── */}
      <Card className="mt-3">
        <Text className="font-strong text-body text-ink" style={{ lineHeight: 23 }}>
          {item.stem}
        </Text>

        <View className="mt-3">
          {item.options.map((option, i) => {
            const picked = answers[index] === i;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: picked }}
                onPress={() => choose(i)}
                className="mt-2 flex-row items-start gap-3 rounded-panel border p-3"
                style={{
                  borderColor: picked ? color.primary : color.border,
                  backgroundColor: picked ? color.primarySoft : color.surface,
                }}
              >
                <Text
                  className="font-strong"
                  style={{ color: picked ? color.primary : color.muted, width: 18 }}
                >
                  {'ABCD'[i]}
                </Text>
                <Text className="flex-1 font-sans text-body text-ink" style={{ lineHeight: 22 }}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={toggleFlag} className="mt-3 self-start">
          <Text className="font-sans text-label" style={{ color: color.muted }}>
            {flagged.has(index) ? '★ Bỏ đánh dấu' : '☆ Đánh dấu xem lại'}
          </Text>
        </Pressable>
      </Card>

      <View className="mt-4 flex-row items-center gap-2" style={{ marginBottom: space['2xl'] }}>
        <Button
          variant="ghost"
          label="Câu trước"
          disabled={index === 0}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
        />
        {last ? (
          <Button label="Nộp module" onPress={submit} />
        ) : (
          <Button label="Câu sau" onPress={() => setIndex((i) => Math.min(items.length - 1, i + 1))} />
        )}
      </View>
    </Screen>
  );
}

/** Bảng số của câu Command of Evidence. */
function EvidenceTableView({ table }: { table: NonNullable<MockItem['table']> }) {
  return (
    <View className="mt-3">
      <Text className="font-semi text-label text-muted">{table.caption}</Text>
      <View className="mt-2 overflow-hidden rounded-panel border border-border">
        <View className="flex-row" style={{ backgroundColor: color.surfaceAlt }}>
          <Cell text={table.entityHeader} header flex={2} />
          {table.columns.map((c) => (
            <Cell key={c} text={c} header flex={1} />
          ))}
        </View>
        {table.rows.map((row) => (
          <View key={row.entity} className="flex-row border-t border-border">
            <Cell text={row.entity} flex={2} />
            {row.values.map((v, i) => (
              <Cell key={`${row.entity}-${i}`} text={String(v)} flex={1} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function Cell({ text, header, flex }: { text: string; header?: boolean; flex: number }) {
  return (
    <View style={{ flex, paddingVertical: space.sm, paddingHorizontal: space.md }}>
      <Text
        className={header ? 'font-semi text-label' : 'font-sans text-label'}
        style={{ color: header ? color.muted : color.ink }}
      >
        {text}
      </Text>
    </View>
  );
}
