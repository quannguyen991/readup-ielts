import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { CrossFade } from '@/components/motion/Motion';
import { Badge, Button, Card } from '@/components/ui';
import type { MockItem } from '@/services/sat-rw/mock/item';
import { splitPassage } from '@/services/sat-rw/mock/passage';

/**
 * Phòng thi Reading and Writing: một module, đồng hồ đếm ngược, không lời giải.
 *
 * DỰNG THEO ĐÚNG NGÔN NGỮ CỦA `MathRunner`, và đó là yêu cầu chứ không phải sở
 * thích: hai phòng thi nằm cạnh nhau trong một bài thi, người học đi từ phòng
 * này sang phòng kia sau mười phút nghỉ. Hai cái trông khác nhau thì họ phải
 * học lại cách dùng giao diện giữa lúc đang thi.
 *
 * Cụ thể là dùng chung: cỡ chữ `text-stat` cho đồng hồ, `Button` viền có icon
 * cho điều hướng, bảng câu hỏi ở CUỐI trang trong thẻ phẳng với bốn trạng thái
 * màu và chú giải `Badge`, `CrossFade` khi đổi câu.
 *
 * KHÔNG DÙNG LẠI `MathRunner` mà viết riêng: hai bên nhận hai kiểu câu khác nhau
 * — `MathItem` có hình vẽ và ô điền số, `MockItem` có bảng số, ghi chú, chỗ
 * trống. Gộp lại sẽ ra một component biết quá nhiều thứ.
 *
 * KHÔNG CÓ LỜI GIẢI GIỮA CHỪNG, và hết giờ là tự nộp kể cả còn câu chưa làm.
 * Đề thật không cho cộng giờ; một màn hình chờ người bấm khi đã hết giờ dạy sai
 * thói quen làm bài.
 *
 * CHIA ĐÔI MÀN HÌNH KHI ĐỦ RỘNG — bài đọc bên trái, câu hỏi bên phải. Đây là chỗ
 * DUY NHẤT phòng thi này khác `MathRunner`, và nó khác vì nội dung khác chứ không
 * phải vì tôi thích: câu Math dài vài dòng, còn bài đọc R&W dài cả đoạn. Xếp một
 * cột trên màn 1280px thì mỗi dòng văn dài hơn 1.200px — mắt đọc hết dòng rồi
 * không tìm lại được đầu dòng sau. Bluebook của College Board cũng chia đôi đúng
 * như vậy, nên người học quen tay luôn.
 */

/** Dưới ngưỡng này thì xếp một cột: hai cột hẹp còn khó đọc hơn một cột rộng. */
const SPLIT_MIN_WIDTH = 900;

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
  const { width } = useWindowDimensions();
  const split = width >= SPLIT_MIN_WIDTH;

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
  const isFlagged = flagged.has(index);

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
      {/*
        Trên màn hẹp, tiêu đề và đồng hồ XẾP CHỒNG chứ không đứng cạnh nhau. Xếp
        cạnh thì "Reading and Writing" gãy làm ba dòng và đồng hồ bị ép sát mép —
        `MathRunner` không lộ ra lỗi này vì tiêu đề của nó chỉ có bốn chữ cái.
        Đồng hồ tụt xuống hàng dưới, cạnh số câu: trong lúc thi hai con số ấy
        được liếc cùng một lúc.
      */}
      {split ? (
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-heavy text-pageTitle text-ink">{title}</Text>
            <Text className="mt-1 font-sans text-body text-muted">
              Câu {index + 1} / {items.length}
            </Text>
          </View>
          <View className="items-end">
            <Text className={`font-heavy text-stat ${lowOnTime ? 'text-danger' : 'text-ink'}`}>
              {formatClock(remainingMs)}
            </Text>
            <Text className="font-sans text-label text-muted">
              {phaseLabel ? `${phaseLabel} · ` : ''}
              đã trả lời {answered}/{items.length}
            </Text>
          </View>
        </View>
      ) : (
        <View>
          <Text className="font-heavy text-sectionTitle text-ink">{title}</Text>
          <View className="mt-1 flex-row items-baseline justify-between gap-3">
            <Text className="flex-1 font-sans text-body text-muted">
              Câu {index + 1} / {items.length} · đã trả lời {answered}
            </Text>
            <Text className={`font-heavy text-stat ${lowOnTime ? 'text-danger' : 'text-ink'}`}>
              {formatClock(remainingMs)}
            </Text>
          </View>
        </View>
      )}

      <Card className="mt-4">
        {/*
          Hiện dần tại chỗ mỗi khi đổi câu — cùng lý do đã ghi ở `MathRunner`:
          khung đứng im thì rất dễ tưởng chưa bấm được. Không dịch chuyển, vì
          câu hỏi không có trước/sau về không gian.
        */}
        <CrossFade swapKey={item.id}>
          <View className={split ? 'flex-row gap-6' : ''}>
            <View className="flex-1">
              <PassageBlocks passage={item.passage} />
              {item.notes ? <NotesList notes={item.notes} /> : null}
              {item.table ? <EvidenceTable table={item.table} /> : null}
            </View>

            {/* Vạch ngăn chỉ có khi chia đôi; xếp một cột thì nó là một gạch ngang vô nghĩa. */}
            {split ? <View className="w-px self-stretch bg-borderStrong" /> : null}

            <View className={split ? 'flex-1' : 'mt-5'}>
              <Text className="font-strong text-cardTitle text-ink" style={{ lineHeight: 25 }}>
                {item.stem}
              </Text>

              <View className="mt-3 gap-2">
                {item.options.map((option, i) => {
                  const picked = answers[index] === i;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: picked }}
                      onPress={() => choose(i)}
                      className={`flex-row items-start gap-3 rounded-panel border px-3.5 py-3 ${
                        picked ? 'border-primary-600 bg-primary-50' : 'border-border bg-surface'
                      }`}
                    >
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-pill border ${
                          picked
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-borderStrong bg-surface'
                        }`}
                      >
                        <Text
                          className={`font-strong text-label ${picked ? 'text-white' : 'text-muted'}`}
                        >
                          {'ABCD'[i]}
                        </Text>
                      </View>
                      <Text
                        className="flex-1 font-sans text-body text-ink"
                        style={{ lineHeight: 23 }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Nút đánh dấu ở CUỐI CỘT CÂU HỎI, không phải cuối thẻ: nó đánh dấu câu hỏi. */}
              <View className="mt-4 border-t border-border pt-3">
                <Button
                  label={isFlagged ? 'Bỏ đánh dấu câu này' : 'Đánh dấu để xem lại'}
                  variant={isFlagged ? 'secondary' : 'ghost'}
                  iconLeft="bookmark"
                  onPress={toggleFlag}
                />
              </View>
            </View>
          </View>
        </CrossFade>
      </Card>

      <View className="mt-4 flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-row gap-2">
          <Button
            label="Câu trước"
            variant="outline"
            iconLeft="chevron-left"
            disabled={index === 0}
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
          />
          <Button
            label="Câu sau"
            variant="outline"
            iconRight="chevron-right"
            disabled={index === items.length - 1}
            onPress={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
          />
        </View>
        <Button label="Nộp module" iconRight="check" onPress={submit} />
      </View>

      <Card className="mt-4" variant="flat">
        <Text className="font-strong text-label text-muted">Bảng câu hỏi</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {items.map((_, i) => {
            const active = i === index;
            const done = answers[i] !== null;
            const flag = flagged.has(i);
            return (
              <Pressable
                key={items[i]!.id}
                accessibilityRole="button"
                accessibilityLabel={`Câu ${i + 1}${done ? ', đã trả lời' : ''}${flag ? ', đã đánh dấu' : ''}`}
                onPress={() => setIndex(i)}
                className={`h-9 w-9 items-center justify-center rounded-pill border ${
                  active
                    ? 'border-primary-600 bg-primary-600'
                    : flag
                      ? 'border-warning bg-warning-soft'
                      : done
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-border bg-surface'
                }`}
              >
                <Text
                  className={`font-strong text-label ${
                    active ? 'text-white' : flag ? 'text-warning-ink' : done ? 'text-primary-700' : 'text-muted'
                  }`}
                >
                  {i + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          <Badge label="Đang làm" tone="primary" shape="tag" />
          <Badge label="Đã trả lời" tone="info" shape="tag" />
          <Badge label="Đã đánh dấu" tone="warning" shape="tag" />
          <Badge label="Chưa trả lời" tone="neutral" shape="tag" />
        </View>
      </Card>
    </Screen>
  );
}

/**
 * Bài đọc, tách khối khi là câu ghép hai văn bản.
 *
 * Nhãn "Text 1" / "Text 2" nằm ở `splitPassage` cùng với lý do vì sao nó là bản
 * tiếng Anh chứ không phải "Văn bản 1".
 */
function PassageBlocks({ passage }: { passage: string }) {
  const blocks = splitPassage(passage);
  return (
    <View style={{ gap: 14 }}>
      {blocks.map((b, i) => (
        <View key={`${b.label ?? 'x'}-${i}`}>
          {b.label ? (
            <Text className="mb-1 font-strong text-label uppercase text-primary-700">{b.label}</Text>
          ) : null}
          <Text className="font-sans text-body text-body" style={{ lineHeight: 25 }}>
            {b.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Danh sách ghi chú của câu Rhetorical Synthesis. */
function NotesList({ notes }: { notes: readonly string[] }) {
  return (
    <View className="mt-3 rounded-panel border border-border bg-surfaceAlt px-3.5 py-3">
      {notes.map((n) => (
        <View key={n} className="flex-row gap-2.5">
          <Text className="font-sans text-body text-subtle">•</Text>
          <Text className="flex-1 font-sans text-body text-body" style={{ lineHeight: 23 }}>
            {n}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Bảng số của câu Command of Evidence.
 *
 * Cột số căn PHẢI, cột tên căn trái: mắt so hàng số bằng cách đọc dọc, mà số căn
 * trái thì hàng đơn vị không thẳng nhau nên phải đọc từng con một.
 */
function EvidenceTable({ table }: { table: NonNullable<MockItem['table']> }) {
  return (
    <View className="mt-3">
      <Text className="font-semi text-label text-muted">{table.caption}</Text>
      <View className="mt-2 overflow-hidden rounded-panel border border-border">
        <View className="flex-row bg-surfaceAlt">
          <Cell text={table.entityHeader} header flex={2} />
          {table.columns.map((c) => (
            <Cell key={c} text={c} header flex={1} align="right" />
          ))}
        </View>
        {table.rows.map((row) => (
          <View key={row.entity} className="flex-row border-t border-border">
            <Cell text={row.entity} flex={2} />
            {row.values.map((v, i) => (
              <Cell key={`${row.entity}-${i}`} text={String(v)} flex={1} align="right" />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function Cell({
  text,
  header,
  flex,
  align = 'left',
}: {
  text: string;
  header?: boolean;
  flex: number;
  align?: 'left' | 'right';
}) {
  return (
    <View style={{ flex }} className="px-3.5 py-2">
      <Text
        className={`${header ? 'font-semi text-label text-muted' : 'font-sans text-body text-ink'} ${
          align === 'right' ? 'text-right' : ''
        }`}
        style={align === 'right' ? { fontVariant: ['tabular-nums'] } : undefined}
      >
        {text}
      </Text>
    </View>
  );
}
