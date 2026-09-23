import React, { useEffect, useLayoutEffect, useRef } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Appear } from "@/components/motion/Motion";
import { posIpa } from "@/data/study-decks";
import { router } from "expo-router";
import * as Speech from "expo-speech";

import { Icon } from "@/components/ui/Icon";
import type { StudyWord } from "@/services/vocab/topic-study";
import { color } from "@/theme/tokens";

/**
 * Bộ khung dùng chung cho các màn học một bộ từ (Học, Nghe chép, Điền câu,
 * Phát âm, Kiểm tra).
 *
 * Ngôn ngữ thiết kế của ReadUp chứ không phải của app tham khảo: thẻ trắng
 * trên nền lưới sáng, nhấn bằng xanh của app, chữ đậm vừa phải. Không nền tối,
 * không hiệu ứng tuyết, không khung vòm.
 */

export const CARD_SHADOW =
  Platform.OS === "web"
    ? ({
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.05), 0 18px 40px rgba(30,41,99,0.10)",
      } as object)
    : { elevation: 3 };

export const GREEN = "#16A34A";
export const RED = "#E11D48";

/** Đọc to một từ hoặc một câu. `voice` là identifier của expo-speech, null = mặc định. */
export function speak(
  text: string,
  opts: { rate?: number; voice?: string | null } = {},
) {
  Speech.stop();
  Speech.speak(text, {
    language: "en-US",
    rate: opts.rate ?? 0.9,
    voice: opts.voice ?? undefined,
  });
}

/**
 * Phím tắt bắt ở CẤP CỬA SỔ, pha capture: ô nhập liệu của react-native-web
 * nuốt Enter ở pha nổi bọt, nghe ở đó thì Enter không bao giờ tới.
 */
export function useHotkeys(
  handler: (e: KeyboardEvent) => void,
  enabled = true,
) {
  const ref = useRef(handler);
  // Cập nhật ref SAU khi render xong, không phải trong lúc render.
  useLayoutEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!enabled || Platform.OS !== "web" || typeof window === "undefined")
      return;
    const on = (e: KeyboardEvent) => ref.current(e);
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  }, [enabled]);
}

/** Khung một màn học: nút thoát, tên màn, thanh tiến độ, nội dung, dòng số liệu dưới. */
export function StudyFrame({
  backHref,
  title,
  segments,
  children,
  footer,
  right,
}: {
  backHref: string;
  title: string;
  /** 0 chưa, 1 đang (nửa), 2 xong — mỗi đoạn một từ. */
  segments?: (0 | 1 | 2)[];
  children: React.ReactNode;
  footer?: string;
  right?: React.ReactNode;
}) {
  return (
    <View
      className="w-full self-center px-4 pb-10 pt-6"
      style={{ maxWidth: 820 }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(backHref as never)}
          className="flex-row items-center gap-2 rounded-pill bg-white/80 px-4 py-2"
        >
          <Icon name="chevron-left" size={18} color={color.ink} />
          <Text className="font-semi text-body text-ink">Thoát</Text>
        </Pressable>
        <Text className="font-strong text-body text-ink">{title}</Text>
        <View style={{ minWidth: 90, alignItems: "flex-end" }}>{right}</View>
      </View>

      {segments ? <SegmentBar segments={segments} /> : null}

      <View className="mt-5">{children}</View>

      {footer ? (
        <Text
          className="mt-5 text-center font-sans text-body"
          style={{ color: "#1E293B" }}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

function SegmentBar({ segments }: { segments: (0 | 1 | 2)[] }) {
  return (
    <View className="mt-5 flex-row gap-1.5">
      {segments.map((s, i) => (
        <View
          key={i}
          className="h-2.5 flex-1 overflow-hidden rounded-pill"
          style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
        >
          <View
            className="h-2.5 rounded-pill"
            style={{
              width: s === 0 ? "0%" : s === 1 ? "50%" : "100%",
              backgroundColor: s === 2 ? GREEN : color.primary,
            }}
          />
        </View>
      ))}
    </View>
  );
}

/** Thẻ trắng chứa câu hỏi. */
export function StudyCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-[22px] bg-surface p-6 lg:p-8" style={CARD_SHADOW}>
      {children}
    </View>
  );
}

export function SpeakButton({
  text,
  rate,
  size = 20,
}: {
  text: string;
  rate?: number;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Nghe "${text}"`}
      onPress={() => speak(text, { rate })}
      className="h-10 w-10 items-center justify-center rounded-pill bg-primary-50"
    >
      <Icon name="volume" size={size} color={color.primary} />
    </Pressable>
  );
}

/** Ngôi sao gắn từ để học riêng. Đặt nổi ở góc trên phải của thẻ cha (thẻ cha cần relative). */
export function StarButton({
  on,
  onPress,
  inline,
}: {
  on: boolean;
  onPress: () => void;
  inline?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}
      onPress={onPress}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-pill"
      style={[
        inline ? null : { position: "absolute", top: 14, right: 14, zIndex: 2 },
        { backgroundColor: on ? "#FEF3C7" : "#F1F5F9" },
      ]}
    >
      <Icon
        name={on ? "star-fill" : "star"}
        size={19}
        color={on ? "#F59E0B" : "#64748B"}
      />
    </Pressable>
  );
}

/** Bốn lựa chọn đánh số 1–4; phím số chọn được (màn cha bắt phím). */
export function ChoiceGrid({
  options,
  picked,
  correctIndex,
  onPick,
}: {
  options: string[];
  picked: number | null;
  correctIndex: number;
  onPick: (i: number) => void;
}) {
  const revealed = picked !== null;
  return (
    <View className="flex-row flex-wrap gap-3">
      {options.map((opt, i) => {
        const isCorrect = revealed && i === correctIndex;
        const isWrong = revealed && i === picked && i !== correctIndex;
        const border = isCorrect ? GREEN : isWrong ? RED : "#E2E8F0";
        const bg = isCorrect ? "#ECFDF3" : isWrong ? "#FFF1F2" : "#FFFFFF";
        return (
          <Pressable
            key={`${i}-${opt}`}
            accessibilityRole="button"
            disabled={revealed}
            onPress={() => onPick(i)}
            className="flex-row items-center gap-3 rounded-2xl px-4 py-4"
            style={{
              flexBasis: 300,
              flexGrow: 1,
              borderWidth: 1.5,
              borderColor: border,
              backgroundColor: bg,
            }}
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-pill"
              style={{
                backgroundColor: isCorrect ? GREEN : isWrong ? RED : "#EEF2F7",
              }}
            >
              <Text
                className="font-strong text-label"
                style={{
                  color: isCorrect || isWrong ? "#FFFFFF" : color.muted,
                }}
              >
                {i + 1}
              </Text>
            </View>
            <Text className="flex-1 font-semi text-bodyLg text-ink">{opt}</Text>
            {isCorrect ? (
              <Icon name="check" size={18} color={GREEN} />
            ) : isWrong ? (
              <Icon name="close" size={18} color={RED} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Câu ví dụ với từ đang học in đậm. */
export function ExampleLine({
  example,
  word,
}: {
  example: string;
  word: string;
}) {
  const i = example
    .toLowerCase()
    .indexOf(word.toLowerCase().replace(/(e|y)$/, ""));
  if (i < 0)
    return <Text className="font-sans text-body text-ink">{example}</Text>;
  let end = i;
  while (end < example.length && /\p{L}/u.test(example[end]!)) end += 1;
  return (
    <Text className="font-sans text-body text-ink">
      {example.slice(0, i)}
      <Text className="font-strong text-primary-700">
        {example.slice(i, end)}
      </Text>
      {example.slice(end)}
    </Text>
  );
}

/** Bảng phản hồi sau mỗi câu: đúng/sai, phiên âm, nghĩa, ví dụ, cụm đi kèm. */
export function FeedbackPanel({
  ok,
  word,
  onNext,
}: {
  ok: boolean;
  word: StudyWord;
  onNext: () => void;
}) {
  return (
    <Appear>
      <View className="mt-5">
        <View
          className="rounded-2xl p-5"
          style={{
            backgroundColor: ok ? "#ECFDF3" : "#FFF1F2",
            borderWidth: 1,
            borderColor: ok ? "#BBF7D0" : "#FECDD3",
          }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <Text
              className="font-strong text-cardTitle"
              style={{ color: ok ? GREEN : RED }}
            >
              {ok ? "Chính xác!" : "Chưa đúng — xem lại nhé"}
            </Text>
            <SpeakButton text={word.word} />
          </View>
          <View className="mt-3 flex-row flex-wrap items-baseline gap-2">
            <Text className="font-strong text-sectionTitle text-ink">
              {word.word}
            </Text>
            <Text className="font-sans text-body text-muted">
              {posIpa(word)}
            </Text>
          </View>
          <Text className="mt-1 font-semi text-bodyLg text-ink">
            {word.meaningVi}
          </Text>
          {word.example ? (
            <View
              className="mt-3 border-t pt-3"
              style={{ borderColor: ok ? "#BBF7D0" : "#FECDD3" }}
            >
              <Text className="font-strong text-label text-muted">Ví dụ</Text>
              <View className="mt-1 flex-row items-start gap-2">
                <View className="flex-1">
                  <ExampleLine example={word.example} word={word.word} />
                </View>
                <SpeakButton text={word.example} size={16} />
              </View>
            </View>
          ) : null}
          {word.collocation ? (
            <Text className="mt-3 font-sans text-body text-muted">
              Hay đi cùng:{" "}
              <Text className="font-semi text-ink">{word.collocation}</Text>
            </Text>
          ) : null}
          <SynAnt word={word} />
        </View>
        <PrimaryButton label="Tiếp tục" hint="Enter" onPress={onNext} />
      </View>
    </Appear>
  );
}

export function PrimaryButton({
  label,
  onPress,
  hint,
  disabled,
}: {
  label: string;
  onPress: () => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl py-4"
      style={{ backgroundColor: disabled ? "#C7D2FE" : color.primary }}
    >
      <Text className="font-strong text-bodyLg text-white">{label}</Text>
      {hint ? (
        <Text className="font-sans text-label text-white/70">{hint}</Text>
      ) : null}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mt-3 items-center rounded-2xl py-3.5"
      style={{ backgroundColor: "#F1F5F9" }}
    >
      <Text className="font-semi text-bodyLg" style={{ color: "#475569" }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Đồng nghĩa / trái nghĩa — chỉ bộ có dữ liệu viết tay mới có; không có thì không vẽ gì. */
export function SynAnt({ word, center }: { word: StudyWord; center?: boolean }) {
  const rows = [
    { label: 'Đồng nghĩa', words: word.synonyms ?? [], tone: GREEN, bg: '#ECFDF3' },
    { label: 'Trái nghĩa', words: word.antonyms ?? [], tone: RED, bg: '#FFF1F2' },
  ].filter((r) => r.words.length > 0);
  if (rows.length === 0) return null;
  return (
    <View className="mt-3 gap-1.5">
      {rows.map((r) => (
        <View key={r.label} className={`flex-row flex-wrap items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
          <Text className="mr-1 font-strong text-label text-muted">{r.label}</Text>
          {r.words.map((w) => (
            <View key={w} className="rounded-pill px-2.5 py-1" style={{ backgroundColor: r.bg }}>
              <Text className="font-semi text-label" style={{ color: r.tone }}>
                {w}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
