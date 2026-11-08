import React, { useEffect, useLayoutEffect, useRef } from "react";

import { ExampleSentence } from "@/components/vocab/ExampleSentence";
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Appear } from "@/components/motion/Motion";
import { posIpa } from "@/services/vocab/pos-ipa";
import { router, usePathname } from "expo-router";
import { isVocabStudyRoute } from "@/navigation/focus-routes";
import { pronounce } from "@/services/audio/pronounce";
import { flushPersist } from "@/store/persist";
import { StudyThemeProvider, useStoreTheme, useStudyTheme } from "./useStudyTheme";
import { useTopicStudyStore } from "@/store/useTopicStudyStore";
import { STUDY_THEMES, type StudyTheme } from "./study-theme";

import { BattleStrip } from "@/components/game/BattleStrip";
import { Icon } from "@/components/ui/Icon";
import type { StudyWord } from "@/services/vocab/topic-study";
import type { Mistake } from "@/services/vocab/mistake";
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
  // MỘT giọng cho cả app: mọi tiếng đi qua một cửa (clip Gemini Aoede; giọng máy chỉ tạm khi chưa có clip).
  // `voice` (chọn giọng máy ở màn Chính tả) không còn tác dụng.
  void pronounce(text, { rate: opts.rate });
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

/**
 * Màu chữ / nền theo class của NativeWind (`text-ink`, `text-muted`, `bg-white/80`…) nằm rải khắp
 * các màn học. Ở chủ đề nền TỐI, một bộ luật CSS duy nhất (sinh từ `study-theme.ts`) đổi chúng
 * trong vùng `[data-st="<chủ đề>"]` — không màn nào phải tự xử lý.
 */
const THEME_CSS_ID = "readup-study-theme-css";
function themeCss(): string {
  let css = "";
  for (const t of Object.values(STUDY_THEMES)) {
    const id = t.id;
    if (!t.dark) continue;
    const r = `[data-st="${id}"]`;
    css +=
      `${r} .text-body{color:${t.muted}!important}` +
      `${r} .text-muted,${r} .text-subtle{color:${t.muted}!important}` +
      `${r} .text-ink{color:${t.ink}!important}` +
      `${r} .text-primary-600,${r} .text-primary-700{color:#E7C98A!important}` +
      `${r} .bg-surface,${r} .bg-surfaceAlt{background-color:${t.card}!important}` +
      `${r} .bg-white\\/80,${r} .bg-white\\/85,${r} .bg-white\\/70,${r} .bg-primary-50,${r} .bg-primary-100{background-color:${t.soft}!important}` +
      `${r} .border-border{border-color:${t.optBorder}!important}`;
  }
  return css;
}
function useThemeCss() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined" || document.getElementById(THEME_CSS_ID)) return;
    const tag = document.createElement("style");
    tag.id = THEME_CSS_ID;
    tag.textContent = themeCss();
    document.head.appendChild(tag);
  }, []);
}
/** Gắn `data-st` để bộ luật CSS ở trên nhận ra chủ đề. */
export function themeAttrs(t: StudyTheme): object {
  return Platform.OS === "web" ? { dataSet: { st: t.id } } : {};
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
  themeOverride,
}: {
  backHref: string;
  title: string;
  /** Fixed card palettes can opt out of dark vocabulary text overrides. */
  themeOverride?: StudyTheme;
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
  const storedTheme = useStoreTheme();
  const theme = themeOverride ?? storedTheme;
  useThemeCss();
  // Rời màn học (Thoát, đổi trang; đóng tab đã có `pagehide`): ghi ngay tiến độ đang chờ ghi trễ.
  useEffect(() => () => flushPersist(), []);
  const navy = isVocabStudyRoute(usePathname());
  const { width: winW, height: winH } = useWindowDimensions();
  const portrait = winH > winW;
  // Đang ngồi toa tàu (cảnh thành phố làm nền): bỏ trận đấu để thẻ học nằm cao, lộ cảnh.
  const travel = navy && theme.id === "scene";
  // Màn học nằm trong chế độ tập trung (không có ScrollView của Screen): không tự cuộn thì trên điện thoại
  // nội dung dài hơn màn hình (lời giải, nút Tiếp) bị cắt mà không kéo được.
  const scrollRef = useRef<ScrollView>(null);
  const scrollTop = React.useCallback(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), []);
  const textOn = navy ? theme.onBg : color.ink;
  const pill = navy ? theme.pill : "rgba(255,255,255,0.8)";
  return (
    <TravelCompact.Provider value={travel}>
    <ScrollTop.Provider value={scrollTop}>
    <StudyThemeProvider value={theme}>
    <View className="flex-1" {...themeAttrs(theme)}>
    <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View
      className="w-full self-center px-4 pb-24 pt-6"
      style={{ maxWidth: travel ? 620 : 820 }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(backHref as never)}
          className="flex-row items-center gap-2 rounded-pill px-4 py-2"
          style={{ backgroundColor: pill }}
        >
          <Icon name="chevron-left" size={18} color={navy ? theme.pillInk : color.ink} />
          <Text className="font-semi text-body" style={{ color: navy ? theme.pillInk : color.ink }}>{L("Thoát", "Exit")}</Text>
        </Pressable>
        <Text className="font-strong text-body" style={{ color: textOn }}>
          {title}
        </Text>
        <View style={{ minWidth: 90, alignItems: "flex-end" }}>{right}</View>
      </View>

      {progress ? (
        <SegmentBar fractions={progress} theme={theme} navy={navy} />
      ) : segments ? (
        <SegmentBar fractions={segments.map((x) => x / 2)} theme={theme} navy={navy} />
      ) : null}

      {/* Trận đấu chỉ khi bật "Nền & hiệu ứng" — mặc định phẳng không dựng gì trang trí. */}
      {battle && !travel && theme.fx ? <BattleStrip className="mt-4" /> : null}

      {/* Màn dọc: khối câu hỏi cao gần hết màn hình, nội dung trải xuống thay vì co cụm trên cùng. */}
      <View className="mt-5" style={portrait && !travel ? { minHeight: winH * 0.72 } : undefined}>{children}</View>

      {footer ? (
        <Text
          className="mt-4 text-center font-sans text-label"
          style={{ color: navy ? theme.onBg : "#1E293B", opacity: 0.82 }}
        >
          {footer}
        </Text>
      ) : null}
      {/* Tắt nền một chạm (chủ đề Cảnh bay pixel có nút ✕ riêng ở góc dưới trái). */}
      {theme.fx && theme.id !== "scene" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={L("Tắt nền và hiệu ứng", "Turn off background and effects")}
          onPress={() => useTopicStudyStore.getState().setStudyFx(false)}
          className="mt-3 flex-row items-center gap-1.5 self-center rounded-pill px-3 py-1.5"
          style={{ backgroundColor: theme.pill }}
        >
          <Icon name="close" size={13} color={theme.pillInk} />
          <Text className="font-semi text-label" style={{ color: theme.pillInk }}>{L("Tắt nền", "Background off")}</Text>
        </Pressable>
      ) : null}
    </View>
    </ScrollView>
    </View>
    </StudyThemeProvider>
    </ScrollTop.Provider>
    </TravelCompact.Provider>
  );
}

/** Màn học đang ở nền toa tàu: thẻ học gọn lại (hẹp, đệm nhỏ) để lộ cảnh phía sau. */
const TravelCompact = React.createContext(false);
/** Cuộn khung học về đầu — gọi khi bấm nút chính (Tiếp / Câu tiếp) để câu mới hiện từ trên xuống. */
const ScrollTop = React.createContext<(() => void) | null>(null);

function SegmentBar({ fractions, theme, navy }: { fractions: number[]; theme: StudyTheme; navy: boolean }) {
  const lightSky = navy && !theme.dark && theme.id !== "scene";
  const track = lightSky ? "rgba(15,23,42,0.14)" : navy ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.7)";
  const fill = lightSky ? theme.accent : navy ? "#D9BC7F" : color.primary;
  return (
    <View className="mt-5 flex-row gap-1.5">
      {fractions.map((s, i) => (
        <View
          key={i}
          className="h-1.5 flex-1 overflow-hidden rounded-pill"
          style={{ backgroundColor: track }}
        >
          {/* Đầy dần bằng transform (không đụng bố cục); xong hẳn thì chuyển xanh lá. */}
          <View
            className="h-1.5 w-full rounded-pill"
            style={{
              backgroundColor: s >= 1 ? GREEN : fill,
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

/** Thẻ câu hỏi — màu thẻ theo chủ đề; chủ đề Mặc định giữ nền trời sáng có sao lấp lánh. */
export function StudyCard({ children }: { children: React.ReactNode }) {
  const compact = React.useContext(TravelCompact);
  const theme = useStudyTheme();
  return (
    <View
      className={`overflow-hidden rounded-[22px] ${compact ? "p-4 lg:p-5" : "p-6 lg:p-8"}`}
      style={[
        { backgroundColor: theme.card, borderWidth: theme.cardBorder === "transparent" ? 0 : 1, borderColor: theme.cardBorder },
        theme.dark && Platform.OS === "web"
          ? ({ boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 18px 40px rgba(0,0,0,0.35)" } as object)
          : CARD_SHADOW,
      ]}
    >
      {theme.id === "scene" ? <SkyEffect intensity={0.7} radius={22} /> : null}
      {children}
    </View>
  );
}

export function SpeakButton({
  text,
  rate,
  size = 20,
  small = false,
}: {
  text: string;
  rate?: number;
  size?: number;
  /** Nút nhỏ (hàng từ / câu ví dụ trong bảng phản hồi). */
  small?: boolean;
}) {
  const theme = useStudyTheme();
  const box = small ? 32 : 40;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Nghe "${text}"`}
      onPress={() => speak(text, { rate })}
      hitSlop={small ? 8 : 6}
      className="items-center justify-center rounded-pill"
      style={{ width: box, height: box, backgroundColor: theme.dark ? theme.soft : "#F3F0FB" }}
    >
      <Icon name="volume" size={small ? 16 : size} color={theme.dark ? "#E7C98A" : theme.accent} />
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
  const theme = useStudyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? L("Bỏ đánh dấu sao", "Unstar") : L("Đánh dấu sao", "Star")}
      onPress={onPress}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-pill"
      style={[
        inline ? null : { position: "absolute", top: 14, right: 14, zIndex: 2 },
        { backgroundColor: on ? (theme.dark ? "rgba(245,158,11,0.22)" : "#F3F0FB") : theme.dark ? theme.soft : "#F3F0FB" },
      ]}
    >
      <Icon
        name={on ? "star-fill" : "star"}
        size={19}
        color={on ? "#F59E0B" : theme.dark ? theme.muted : "#64748B"}
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
  focused = null,
}: {
  /** Nhãn thay cho số 1–4, vd. A B C D của đề THPT. */
  labels?: readonly string[];
  options: string[];
  picked: number | null;
  correctIndex: number;
  onPick: (i: number) => void;
  /** Phương án Cú đã loại — mờ đi, gạch ngang, không bấm được. */
  hidden?: number[];
  /** Phương án đang được chọn bằng phím mũi tên (chưa chấm). */
  focused?: number | null;
}) {
  const { L } = useL();
  const theme = useStudyTheme();
  const revealed = picked !== null;
  // Nền toa tàu: thẻ hẹp hơn nên phương án co lại để vẫn đủ 2 cột, đệm nhỏ hơn.
  const compact = React.useContext(TravelCompact);
  // Màn dọc (điện thoại, máy tính bảng để đứng): mỗi phương án một hàng, chữ và ô số to hơn.
  const { width, height } = useWindowDimensions();
  const portrait = height > width && !compact;
  return (
    <View className={`flex-row flex-wrap ${compact ? "gap-2" : portrait ? "gap-3.5" : "gap-3"}`}>
      {options.map((opt, i) => {
        const isCorrect = revealed && i === correctIndex;
        const isWrong = revealed && i === picked && i !== correctIndex;
        const border = isCorrect ? theme.good : isWrong ? theme.bad : theme.optBorder;
        const bg = isCorrect ? theme.goodBg : isWrong ? theme.badBg : theme.optBg;
        const out = hidden.includes(i) && !isCorrect;
        const isFocus = focused === i && !revealed;
        return (
          <Pressable
            key={`${i}-${opt}`}
            accessibilityRole="button"
            accessibilityLabel={out ? L(`${opt} — Cú đã loại`, `${opt} — removed by Owl`) : undefined}
            disabled={revealed || out}
            onPress={() => onPick(i)}
            className={`flex-row items-center gap-3 rounded-2xl ${compact ? "px-3 py-2.5" : portrait ? "px-5 py-4" : "px-4 py-3"}`}
            style={{
              flexShrink: 1, flexBasis: portrait ? "100%" : compact ? 220 : 300,
              flexGrow: 1,
              minHeight: portrait ? 68 : 48,
              // Không viền: phương án là hàng chữ có số tròn, chỉ đổi màu khi đã chấm.
              borderWidth: 0,
              borderColor: border,
              backgroundColor: isCorrect || isWrong ? bg : isFocus ? theme.optNum : "transparent",
              opacity: out ? 0.38 : 1,
              ...(Platform.OS === "web" ? ({ transition: "opacity 260ms ease" } as object) : null),
            }}
          >
            <View
              className={`${portrait ? "h-10 w-10" : "h-7 w-7"} items-center justify-center rounded-pill`}
              style={{
                backgroundColor: isCorrect ? theme.goodBg : isWrong ? theme.badBg : theme.optNum,
              }}
            >
              <Text
                className={`font-strong ${portrait ? "text-body" : "text-label"}`}
                style={{
                  color: isCorrect ? theme.good : isWrong ? theme.bad : theme.muted,
                }}
              >
                {labels?.[i] ?? i + 1}
              </Text>
            </View>
            <Text
              className={`flex-1 font-mid ${portrait ? "text-bodyLg" : "text-body"} text-ink`}
              style={out ? { textDecorationLine: "line-through" } : undefined}
            >
              {opt}
            </Text>
            {out ? (
              <Text className="font-semi text-label text-muted">{L("Cú đã loại", "Removed by Owl")}</Text>
            ) : isCorrect ? (
              <Icon name="check" size={16} color={theme.good} />
            ) : isWrong ? (
              <Icon name="close" size={16} color={theme.bad} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Tách chuỗi "cụm 1, cụm 2; cụm 3" thành các chip. */
function splitList(s: string | undefined): string[] {
  return (s ?? "")
    .split(/[,;•·]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 5);
}

/**
 * Bảng phản hồi sau mỗi câu — chỉ cho điều CHƯA hiện trên màn, không nhắc lại gì đã thấy:
 *
 *   ✓ Chính xác  |  ✗ Chưa đúng · Đáp án: …          loại từ · /phiên âm/ 🔊
 *   Nghĩa     (chỉ khi đề + phương án chưa hiện nghĩa tiếng Việt)
 *   Ví dụ     MỘT câu, từ đang học in đậm           🔊
 *   Đồng nghĩa / Trái nghĩa / Hay đi cùng   chip nhỏ (chỉ khi có)
 *   Dễ nhầm   chỉ khi chọn nhầm sang một từ khác
 *
 * - "Đáp án: …" chỉ in khi đáp án CHƯA lộ ở chỗ khác (câu gõ / nghe); câu chọn đã tô sẵn phương án đúng.
 * - Không có hàng "Từ": phiên âm + loại từ + nút nghe nằm cùng dòng với kết quả (tắt bằng `pron={false}`
 *   khi đề đã có sẵn phiên âm + nút nghe, ví dụ trắc nghiệm Anh → Việt).
 * - Nền trung tính, không khối tô đậm xanh / đỏ: chỉ vạch 3px bên trái + biểu tượng nhỏ báo đúng / sai.
 * - Hàng trống thì bỏ; thường chỉ còn 2–3 dòng. Khoảng cách 8 / 12 / 16.
 */
export function FeedbackPanel({
  ok,
  word,
  onNext,
  mistake,
  nextLabel,
  answer,
  showMeaning = true,
  pron = true,
  english = false,
}: {
  ok: boolean;
  word: StudyWord;
  onNext: () => void;
  /** Lỗi đã gọi tên của câu sai — chỉ lỗi nhầm sang từ khác mới hiện (một dòng). */
  mistake?: Mistake | null;
  /** Nhãn nút sang câu sau (mặc định "Tiếp tục"). */
  nextLabel?: string;
  /** Đáp án đúng, in cạnh "Chưa đúng" — chỉ truyền khi câu hỏi chưa tô / hiện đáp án ở chỗ khác. */
  answer?: string;
  /** Hiện hàng "Nghĩa" — chỉ khi đề và các phương án chưa hiện nghĩa tiếng Việt. */
  showMeaning?: boolean;
  /** Hiện loại từ + phiên âm + nút nghe ở dòng kết quả. */
  pron?: boolean;
  /** Chiều Anh → Anh: hiện định nghĩa tiếng Anh của từ. */
  english?: boolean;
}) {
  const { L } = useL();
  const t = useStudyTheme();
  const tone = ok ? t.good : t.bad;
  const confused = !ok && mistake?.kind === "other_word" ? mistake.confused : undefined;
  const colloc = splitList(word.collocation);
  return (
    <Appear>
      <View style={{ marginTop: 16 }}>
        <View
          style={{
            borderRadius: 12,
            // Đúng thì tô xanh, sai thì tô đỏ (cả khối), theo màu nền sáng/tối của chủ đề.
            backgroundColor: ok
              ? t.dark ? "rgba(22,163,74,0.30)" : "#DCFCE7"
              : t.dark ? "rgba(225,29,72,0.30)" : "#FFE4E9",
            paddingVertical: 12,
            paddingHorizontal: 16,
            gap: 8,
          }}
        >
          <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
              <Icon name={ok ? "check" : "close"} size={16} color={tone} />
              <Text className="font-strong text-body" style={{ color: tone }}>
                {ok ? L("Chính xác", "Correct") : L("Chưa đúng", "Not quite")}
              </Text>
              {!ok && answer ? (
                <Text className="font-sans text-body text-muted">
                  · {L("Đáp án", "Answer")}: <Text className="font-semi text-ink">{answer}</Text>
                </Text>
              ) : null}
            </View>
            {pron ? (
              <View className="flex-row items-center gap-1.5">
                <Text className="font-sans text-label text-muted">{posIpa(word)}</Text>
                <SpeakButton text={word.word} small />
              </View>
            ) : null}
          </View>

          {english && word.definitionEn ? (
            <FbRow label={L("Định nghĩa", "Definition")}>
              <Text className="font-sans text-body text-ink">{word.definitionEn}</Text>
            </FbRow>
          ) : null}
          {showMeaning ? (
            <FbRow label={L("Nghĩa", "Meaning")}>
              <Text className="font-sans text-body text-ink">{word.meaningVi}</Text>
            </FbRow>
          ) : null}
          {word.example ? (
            <FbRow label={L("Ví dụ", "Example")}>
              <ExampleSentence example={word.example} word={word.word} />
            </FbRow>
          ) : null}
          <ChipRow label={L("Đồng nghĩa", "Synonyms")} items={(word.synonyms ?? []).slice(0, 5)} />
          <ChipRow label={L("Trái nghĩa", "Antonyms")} items={(word.antonyms ?? []).slice(0, 5)} />
          <ChipRow label={L("Hay đi cùng", "Collocations")} items={colloc} />
          {confused ? (
            <FbRow label={L("Dễ nhầm", "Confused")}>
              <Text className="font-sans text-body text-ink">
                <Text className="font-semi">{word.word}</Text> ({word.meaningVi}) ≠{" "}
                <Text className="font-semi">{confused.word}</Text> ({confused.meaningVi})
              </Text>
            </FbRow>
          ) : null}
        </View>
        <PrimaryButton label={nextLabel ?? L("Tiếp tục", "Continue")} hint="Enter" onPress={onNext} color="#2B3A55" />
      </View>
    </Appear>
  );
}

const FB_LABEL_W = 84;

/** Một hàng của bảng phản hồi: nhãn nhỏ mờ (13px) cố định bên trái, giá trị bình thường bên phải, nút nghe nhỏ ở mép phải. */
function FbRow({ label, children, right }: { label: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-start gap-2">
      <Text className="font-sans text-label text-muted" style={{ width: FB_LABEL_W, paddingTop: 3 }}>{label}</Text>
      <View className="min-w-0 flex-1">{children}</View>
      {right ?? null}
    </View>
  );
}

/** Một hàng chip nhỏ có nhãn mờ; không có gì thì không vẽ. */
function ChipRow({ label, items }: { label: string; items: readonly string[] }) {
  const t = useStudyTheme();
  if (items.length === 0) return null;
  return (
    <FbRow label={label}>
      <View className="flex-row flex-wrap gap-1.5">
        {items.map((w) => (
          <View key={w} className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: t.chipBg }}>
            <Text className="font-sans text-label" style={{ color: t.chipInk }}>{w}</Text>
          </View>
        ))}
      </View>
    </FbRow>
  );
}

export function PrimaryButton({
  label,
  onPress,
  hint,
  disabled,
  color,
}: {
  label: string;
  onPress: () => void;
  hint?: string;
  disabled?: boolean;
  /** Màu nền thay cho màu chủ đề (ví dụ nút Tiếp tục sau khi chấm câu). */
  color?: string;
}) {
  const scrollTop = React.useContext(ScrollTop);
  const theme = useStudyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        onPress();
        scrollTop?.();
      }}
      className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl py-3"
      style={{ backgroundColor: disabled ? theme.accentDisabled : color ?? theme.accent }}
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
  focused = false,
}: {
  label: string;
  onPress: () => void;
  /** Đang được chọn bằng phím mũi tên: viền sáng, Enter bấm được. */
  focused?: boolean;
}) {
  const theme = useStudyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mt-3 items-center rounded-2xl py-4"
      style={{ backgroundColor: theme.soft, borderWidth: focused ? 1.5 : 0, borderColor: theme.dark ? "#FFFFFF" : "#475569" }}
    >
      <Text className="font-semi text-bodyLg" style={{ color: theme.dark ? theme.muted : "#475569" }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Đồng nghĩa / trái nghĩa — chỉ bộ có dữ liệu viết tay mới có; không có thì không vẽ gì. */
export function SynAnt({ word, center }: { word: StudyWord; center?: boolean }) {
  const { L } = useL();
  const theme = useStudyTheme();
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
            <View key={w} className="rounded-pill px-2 py-0.5" style={{ backgroundColor: theme.chipBg }}>
              <Text className="font-mid text-label" style={{ color: theme.chipInk }}>{w}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
