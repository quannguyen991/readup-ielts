import React, { useEffect, useLayoutEffect, useRef } from "react";
import { TappableSentence } from "@/components/lookup/TapWord";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Appear } from "@/components/motion/Motion";
import { posIpa } from "@/data/study-decks";
import { router, usePathname } from "expo-router";
import { isVocabStudyRoute } from "@/navigation/focus-routes";
import * as Speech from "expo-speech";
import { englishVoice } from "@/services/audio/voice";
import { pronounce, stopPronounce } from "@/services/audio/pronounce";
import { isSingleWord } from "@/services/audio/pronounce-core";

import { BattleStrip } from "@/components/game/BattleStrip";
import { useTravelBackdropOn } from "@/components/rail/TravelBackdrop";
import { Icon } from "@/components/ui/Icon";
import type { StudyWord } from "@/services/vocab/topic-study";
import { color } from "@/theme/tokens";
import { SkyEffect } from "@/components/effects/SkyEffect";
import { useL } from "@/i18n/useL";

/**
 * Bộ khung dùng chung cho các màn học một bộ từ (Học, Nghe chép, Điền câu,
 * Phát âm, Kiểm tra).
 *
 * Ngôn ngữ thiết kế của ReadUp chứ không phải của app tham khảo: thẻ trắng
 * trên nền chàm kẻ ô (cùng nền màn Đọc song ngữ — người dùng chọn ngày
 * 24/09/2026), nhấn bằng xanh của app, chữ đậm vừa phải. Không hiệu ứng tuyết,
 * không khung vòm. Chữ nằm ngoài thẻ đổi sang màu sáng theo `isVocabStudyRoute`.
 */

export const CARD_SHADOW =
  Platform.OS === "web"
    ? ({
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.05), 0 18px 40px rgba(94, 72, 35,0.10)",
      } as object)
    : { elevation: 3 };

export const GREEN = "#16A34A";
export const RED = "#E11D48";

/**
 * Đọc to một từ hoặc một câu. Từ đơn: bản ghi âm người thật nếu có, không thì giọng
 * máy (`services/audio/pronounce.ts`). Câu / cụm từ, hoặc khi chỉ định `voice`
 * (expo-speech identifier): giọng máy.
 */
export function speak(
  text: string,
  opts: { rate?: number; voice?: string | null } = {},
) {
  if (!opts.voice && isSingleWord(text)) {
    void pronounce(text, { rate: opts.rate });
    return;
  }
  stopPronounce();
  Speech.speak(text, {
    language: "en-US",
    rate: opts.rate ?? 0.9,
    voice: opts.voice ?? englishVoice(),
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
  progress,
  battle = false,
}: {
  backHref: string;
  title: string;
  /** Hiện thanh trận đấu của game khi học — chỉ bật ở màn gọi `useGameStore.answer()`. */
  battle?: boolean;
  /** 0 chưa, 1 đang (nửa), 2 xong — mỗi đoạn một từ. */
  segments?: (0 | 1 | 2)[];
  /** Như `segments` nhưng là phần đã xong của từng đoạn (0–1) — đầy dần đúng nhịp học. */
  progress?: number[];
  children: React.ReactNode;
  footer?: string;
  right?: React.ReactNode;
}) {
  const { L } = useL();
  const navy = isVocabStudyRoute(usePathname());
  // Đang ngồi toa tàu (cảnh thành phố làm nền): bỏ trận đấu để thẻ học nằm cao, lộ cảnh.
  const travel = useTravelBackdropOn() && navy;
  // Màn học nằm trong chế độ tập trung (không có ScrollView của Screen): không tự cuộn thì trên điện thoại
  // nội dung dài hơn màn hình (lời giải, nút Tiếp) bị cắt mà không kéo được.
  const scrollRef = useRef<ScrollView>(null);
  const scrollTop = React.useCallback(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), []);
  return (
    <TravelCompact.Provider value={travel}>
    <ScrollTop.Provider value={scrollTop}>
    <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View
      className="w-full self-center px-4 pb-24 pt-6"
      style={{ maxWidth: travel ? 620 : 820 }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(backHref as never)}
          className="flex-row items-center gap-2 rounded-pill bg-white/80 px-4 py-2"
        >
          <Icon name="chevron-left" size={18} color={color.ink} />
          <Text className="font-semi text-body text-ink">{L("Thoát", "Exit")}</Text>
        </Pressable>
        <Text className="font-strong text-body" style={{ color: navy ? "#FFFFFF" : color.ink }}>
          {title}
        </Text>
        <View style={{ minWidth: 90, alignItems: "flex-end" }}>{right}</View>
      </View>

      {progress ? (
        <SegmentBar fractions={progress} navy={navy} />
      ) : segments ? (
        <SegmentBar fractions={segments.map((x) => x / 2)} navy={navy} />
      ) : null}

      {battle && !travel ? <BattleStrip className="mt-4" /> : null}

      <View className="mt-5">{children}</View>

      {footer ? (
        <Text
          className="mt-5 text-center font-sans text-body"
          style={{ color: navy ? "rgba(255,255,255,0.86)" : "#1E293B" }}
        >
          {footer}
        </Text>
      ) : null}
    </View>
    </ScrollView>
    </ScrollTop.Provider>
    </TravelCompact.Provider>
  );
}

/** Màn học đang ở nền toa tàu: thẻ học gọn lại (hẹp, đệm nhỏ) để lộ cảnh phía sau. */
const TravelCompact = React.createContext(false);
/** Cuộn khung học về đầu — gọi khi bấm nút chính (Tiếp / Câu tiếp) để câu mới hiện từ trên xuống. */
const ScrollTop = React.createContext<(() => void) | null>(null);

function SegmentBar({ fractions, navy }: { fractions: number[]; navy: boolean }) {
  return (
    <View className="mt-5 flex-row gap-1.5">
      {fractions.map((s, i) => (
        <View
          key={i}
          className="h-1.5 flex-1 overflow-hidden rounded-pill"
          style={{ backgroundColor: navy ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.7)" }}
        >
          {/* Đầy dần bằng transform (không đụng bố cục); xong hẳn thì chuyển xanh lá. */}
          <View
            className="h-1.5 w-full rounded-pill"
            style={{
              backgroundColor: s >= 1 ? GREEN : navy ? "#D9BC7F" : color.primary,
              transform: [{ scaleX: Math.max(0, Math.min(1, s)) }],
              transformOrigin: "left",
              ...(Platform.OS === "web"
                ? ({ transition: "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 320ms ease" } as object)
                : null),
            }}
          />
        </View>
      ))}
    </View>
  );
}

/** Thẻ câu hỏi — nền trời sáng có sao lấp lánh, cùng thẻ lật. */
export function StudyCard({ children }: { children: React.ReactNode }) {
  const compact = React.useContext(TravelCompact);
  return (
    <View className={`overflow-hidden rounded-[22px] bg-surface ${compact ? "p-4 lg:p-5" : "p-6 lg:p-8"}`} style={CARD_SHADOW}>
      <SkyEffect intensity={0.7} radius={22} />
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
      hitSlop={6}
      className="h-10 w-10 items-center justify-center rounded-pill"
      style={{ backgroundColor: "#FBF6EC" }}
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
  const { L } = useL();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? L("Bỏ đánh dấu sao", "Unstar") : L("Đánh dấu sao", "Star")}
      onPress={onPress}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-pill"
      style={[
        inline ? null : { position: "absolute", top: 14, right: 14, zIndex: 2 },
        { backgroundColor: on ? "#FEF3C7" : "#F9F6F1" },
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
  hidden = [],
  labels,
}: {
  /** Nhãn thay cho số 1–4, vd. A B C D của đề THPT. */
  labels?: readonly string[];
  options: string[];
  picked: number | null;
  correctIndex: number;
  onPick: (i: number) => void;
  /** Phương án Cú đã loại — mờ đi, gạch ngang, không bấm được. */
  hidden?: number[];
}) {
  const { L } = useL();
  const revealed = picked !== null;
  // Nền toa tàu: thẻ hẹp hơn nên phương án co lại để vẫn đủ 2 cột, đệm nhỏ hơn.
  const compact = React.useContext(TravelCompact);
  return (
    <View className={`flex-row flex-wrap ${compact ? "gap-2" : "gap-3"}`}>
      {options.map((opt, i) => {
        const isCorrect = revealed && i === correctIndex;
        const isWrong = revealed && i === picked && i !== correctIndex;
        const border = isCorrect ? GREEN : isWrong ? RED : "#EDE6D8";
        const bg = isCorrect ? "#F6FBF7" : isWrong ? "#FEF7F8" : "#FFFFFF";
        const out = hidden.includes(i) && !isCorrect;
        return (
          <Pressable
            key={`${i}-${opt}`}
            accessibilityRole="button"
            accessibilityLabel={out ? L(`${opt} — Cú đã loại`, `${opt} — removed by Owl`) : undefined}
            disabled={revealed || out}
            onPress={() => onPick(i)}
            className={`flex-row items-center gap-3 rounded-2xl ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}
            style={{
              flexShrink: 1, flexBasis: compact ? 220 : 300,
              flexGrow: 1,
              minHeight: 48,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: bg,
              opacity: out ? 0.38 : 1,
              ...(Platform.OS === "web" ? ({ transition: "opacity 260ms ease" } as object) : null),
            }}
          >
            <View
              className="h-7 w-7 items-center justify-center rounded-pill"
              style={{
                backgroundColor: isCorrect ? "#DCF3E3" : isWrong ? "#FBE1E6" : "#F7F4EE",
              }}
            >
              <Text
                className="font-strong text-label"
                style={{
                  color: isCorrect ? "#15803D" : isWrong ? "#BE123C" : color.muted,
                }}
              >
                {labels?.[i] ?? i + 1}
              </Text>
            </View>
            <Text
              className="flex-1 font-mid text-body text-ink"
              style={out ? { textDecorationLine: "line-through" } : undefined}
            >
              {opt}
            </Text>
            {out ? (
              <Text className="font-semi text-label text-muted">{L("Cú đã loại", "Removed by Owl")}</Text>
            ) : isCorrect ? (
              <Icon name="check" size={16} color={GREEN} />
            ) : isWrong ? (
              <Icon name="close" size={16} color={RED} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Câu ví dụ với từ đang học in đậm; chạm vào từ nào cũng ra nghĩa (không cần AI). */
export function ExampleLine({
  example,
  word,
}: {
  example: string;
  word: string;
}) {
  return <TappableSentence text={example} highlight={word} />;
}

/** Bảng phản hồi sau mỗi câu: một dải mảnh đúng/sai, rồi từ, nghĩa, ví dụ một dòng. */
export function FeedbackPanel({
  ok,
  word,
  onNext,
}: {
  ok: boolean;
  word: StudyWord;
  onNext: () => void;
}) {
  const { L } = useL();
  const tone = ok ? GREEN : RED;
  return (
    <Appear>
      <View className="mt-4">
        <View style={{ borderLeftWidth: 3, borderLeftColor: tone, paddingLeft: 12 }}>
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-1.5">
              <Icon name={ok ? "check" : "close"} size={16} color={tone} />
              <Text className="font-semi text-body" style={{ color: tone }}>
                {ok ? L("Chính xác", "Correct") : L("Chưa đúng", "Not quite")}
              </Text>
            </View>
            <SpeakButton text={word.word} size={16} />
          </View>
          <View className="flex-row flex-wrap items-baseline gap-x-2">
            <Text className="font-strong text-bodyLg text-ink">{word.word}</Text>
            <Text className="font-sans text-label text-muted">{posIpa(word)}</Text>
          </View>
          <Text className="font-mid text-body text-ink">{word.meaningVi}</Text>
          {word.example ? (
            <View className="mt-2 flex-row items-center gap-1">
              <View className="flex-1">
                <ExampleLine example={word.example} word={word.word} />
              </View>
              <SpeakButton text={word.example} size={14} />
            </View>
          ) : null}
          {word.collocation ? (
            <Text className="mt-1 font-sans text-label text-muted">
              {L("Hay đi cùng", "Collocations")}: <Text className="font-semi text-ink">{word.collocation}</Text>
            </Text>
          ) : null}
          <SynAnt word={word} />
        </View>
        <PrimaryButton label={L("Tiếp tục", "Continue")} hint="Enter" onPress={onNext} />
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
  const scrollTop = React.useContext(ScrollTop);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        onPress();
        scrollTop?.();
      }}
      className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl py-3"
      style={{ backgroundColor: disabled ? "#F4E7D1" : color.primary }}
    >
      <Text className="font-strong text-body text-white">{label}</Text>
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
      className="mt-2 items-center rounded-2xl py-3"
      style={{ backgroundColor: "#F9F6F1" }}
    >
      <Text className="font-semi text-body" style={{ color: "#475569" }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Đồng nghĩa / trái nghĩa — chỉ bộ có dữ liệu viết tay mới có; không có thì không vẽ gì. */
export function SynAnt({ word, center }: { word: StudyWord; center?: boolean }) {
  const { L } = useL();
  const rows = [
    { label: L('Đồng nghĩa', 'Synonyms'), words: word.synonyms ?? [] },
    { label: L('Trái nghĩa', 'Antonyms'), words: word.antonyms ?? [] },
  ].filter((r) => r.words.length > 0);
  if (rows.length === 0) return null;
  return (
    <View className="mt-1.5 gap-1">
      {rows.map((r) => (
        <View key={r.label} className={`flex-row flex-wrap items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
          <Text className="mr-0.5 font-sans text-label text-muted">{r.label}</Text>
          {r.words.map((w) => (
            <View key={w} className="rounded-pill px-2 py-0.5" style={{ backgroundColor: '#F7F4EE' }}>
              <Text className="font-mid text-label text-ink">{w}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
