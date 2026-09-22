import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { CrossFade, PressScale } from '@/components/motion/Motion';
import { Badge, Button, PaperCard } from '@/components/ui';
import { ExamShell } from '@/components/layout/ExamShell';
import { ItemBody } from '@/components/sat-rw/ItemBody';
import type { MockItem } from '@/services/sat-rw/mock/item';

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

  const startedAt = useRef(0);
  const finished = useRef(false);

  const submit = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish(answers, Date.now() - startedAt.current);
  }, [answers, onFinish]);

  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

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
    <ExamShell>
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
            <Text className="font-heavy text-pageTitle text-white">{title}</Text>
            <Text className="mt-1 font-sans text-body text-white/70">
              Câu {index + 1} / {items.length}
            </Text>
          </View>
          <View className="items-end">
            {/*
              Hết giờ đếm đỏ, nhưng là đỏ SÁNG (#FCA5A5) chứ không phải `text-danger`
              (#F04438): đỏ đậm trên nền chàm tối gần như không đọc được — đúng lúc
              con số ấy cần đập vào mắt nhất.
            */}
            <Text
              className="font-heavy text-stat"
              style={{ color: lowOnTime ? '#FCA5A5' : '#FFFFFF' }}
            >
              {formatClock(remainingMs)}
            </Text>
            <Text className="font-sans text-label text-white/70">
              {phaseLabel ? `${phaseLabel} · ` : ''}
              đã trả lời {answered}/{items.length}
            </Text>
          </View>
        </View>
      ) : (
        <View>
          <Text className="font-heavy text-sectionTitle text-white">{title}</Text>
          <View className="mt-1 flex-row items-baseline justify-between gap-3">
            <Text className="flex-1 font-sans text-body text-white/70">
              Câu {index + 1} / {items.length} · đã trả lời {answered}
            </Text>
            <Text
              className="font-heavy text-stat"
              style={{ color: lowOnTime ? '#FCA5A5' : '#FFFFFF' }}
            >
              {formatClock(remainingMs)}
            </Text>
          </View>
        </View>
      )}

      <PaperCard className="mt-4">
        {/*
          Hiện dần tại chỗ mỗi khi đổi câu — cùng lý do đã ghi ở `MathRunner`:
          khung đứng im thì rất dễ tưởng chưa bấm được. Không dịch chuyển, vì
          câu hỏi không có trước/sau về không gian.
        */}
        <CrossFade swapKey={item.id}>
          <View className={split ? 'flex-row gap-6' : ''}>
            <View className="flex-1">
              <ItemBody item={item} />
            </View>

            {/* Vạch ngăn chỉ có khi chia đôi; xếp một cột thì nó là một gạch ngang vô nghĩa. */}
            {split ? <View className="w-px self-stretch bg-brand-soft" /> : null}

            <View className={split ? 'flex-1' : 'mt-5'}>
              <Text className="font-strong text-cardTitle text-paper-ink" style={{ lineHeight: 25 }}>
                {item.stem}
              </Text>

              <View className="mt-3 gap-2">
                {item.options.map((option, i) => {
                  const picked = answers[index] === i;
                  return (
                    <PressScale
                      key={option}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: picked }}
                      onPress={() => choose(i)}
                      className={`flex-row items-start gap-3 rounded-panel border px-3.5 py-3 ${
                        picked ? 'border-brand-mid bg-brand-tint' : 'border-brand-soft bg-paper'
                      }`}
                    >
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-pill border ${
                          picked ? 'border-brand-mid bg-brand-mid' : 'border-brand-soft bg-paper'
                        }`}
                      >
                        <Text
                          className={`font-strong text-label ${
                            picked ? 'text-white' : 'text-paper-muted'
                          }`}
                        >
                          {'ABCD'[i]}
                        </Text>
                      </View>
                      <Text
                        className="flex-1 font-sans text-body text-paper-ink"
                        style={{ lineHeight: 23 }}
                      >
                        {option}
                      </Text>
                    </PressScale>
                  );
                })}
              </View>

              {/* Nút đánh dấu ở CUỐI CỘT CÂU HỎI, không phải cuối thẻ: nó đánh dấu câu hỏi. */}
              <View className="mt-4 border-t border-brand-soft pt-3">
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
      </PaperCard>

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

      <PaperCard className="mt-4">
        <Text className="font-strong text-label text-paper-muted">Bảng câu hỏi</Text>
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
                    ? 'border-brand-mid bg-brand-mid'
                    : flag
                      ? 'border-warning bg-warning-soft'
                      : done
                        ? 'border-brand-soft bg-brand-tint'
                        : 'border-brand-soft bg-paper'
                }`}
              >
                <Text
                  className={`font-strong text-label ${
                    active
                      ? 'text-white'
                      : flag
                        ? 'text-warning-ink'
                        : done
                          ? 'text-brand'
                          : 'text-paper-muted'
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
      </PaperCard>
    </ExamShell>
  );
}
