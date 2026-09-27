import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { CrossFade } from "@/components/motion/Motion";
import { DetailFace, detailHeight, FlipCard, WordFace } from "./FlipCard";
import { CARD_SHADOW, SpeakButton, StarButton, useHotkeys } from "./StudyKit";
import { Icon } from "@/components/ui/Icon";
import {
  seededRng,
  shuffled,
  type StudyWord,
  type WordStage,
} from "@/services/vocab/topic-study";
import { color } from "@/theme/tokens";

/**
 * Thẻ ghi nhớ lật được, đặt ngay trên trang bộ từ.
 *
 * Mặt trước: từ, loại từ, phiên âm. Mặt sau: nghĩa tiếng Việt, định nghĩa
 * tiếng Anh, câu ví dụ, cụm hay đi kèm. Lật bằng bấm vào thẻ, Space hoặc Enter;
 * ← → để chuyển thẻ.
 *
 * Ngôi sao ở góc thẻ gắn từ vào nhóm "đánh dấu sao" để màn Học lọc riêng.
 */
export function Flashcards<W extends StudyWord>({
  words,
  savedWords,
  onSave,
  starredWords,
  onStar,
  onRate,
  accent = color.primary,
}: {
  words: W[];
  savedWords: Set<string>;
  onSave: (w: W) => void;
  starredWords: ReadonlySet<string>;
  onStar: (w: W) => void;
  /** Tự chấm sau khi lật (Quên / Mơ hồ / Nhớ rồi) — ghi mức nhớ rồi sang thẻ sau. */
  onRate?: (w: W, stage: WordStage) => void;
  /** Màu của bộ, cho nút Lật thẻ. */
  accent?: string;
}) {
  const [order, setOrder] = useState<"original" | "shuffled">("original");
  const [seed, setSeed] = useState(1);
  const list = useMemo(
    () => (order === "original" ? words : shuffled(words, seededRng(seed))),
    [order, words, seed],
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = list[index];
  const go = (d: number) => {
    setFlipped(false);
    setIndex((i) => (i + d + list.length) % list.length);
  };

  useHotkeys((e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (onRate && flipped && (e.key === "1" || e.key === "2" || e.key === "3")) {
      rate((Number(e.key) - 1) as WordStage);
      return;
    }
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === " " || e.code === "Space" || e.key === "Enter") {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  });

  function rate(stage: WordStage) {
    if (!word || !onRate) return;
    onRate(word, stage);
    go(1);
  }

  if (!word) return null;
  const saved = savedWords.has(word.word.toLowerCase());

  return (
    <View>
      <View>
        <CrossFade swapKey={`${order}-${seed}-${index}`}>
          <FlipCard
            height={detailHeight(word)}
            cardKey={`${order}-${seed}-${index}`}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            front={<WordFace word={word} hint="Bấm thẻ hoặc Space để lật" />}
            back={<DetailFace word={word} />}
          />
        </CrossFade>
        <StarButton
          on={starredWords.has(word.word)}
          onPress={() => onStar(word)}
        />
      </View>

      {/* Kiểu The IELTS Dictionary: một nút Lật thẻ to, lật rồi thì tự chấm. */}
      {onRate ? (
        <View className="mt-4 flex-row gap-2">
          {flipped ? (
            RATINGS.map((r, i) => (
              <Pressable
                key={r.label}
                accessibilityRole="button"
                accessibilityLabel={`${r.label} (phím ${i + 1})`}
                onPress={() => rate(r.stage)}
                className="h-12 flex-1 items-center justify-center rounded-2xl"
                style={{ backgroundColor: r.bg }}
              >
                <Text className="font-heavy text-body" style={{ color: r.ink }}>
                  {r.label}
                </Text>
              </Pressable>
            ))
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setFlipped(true)}
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl"
              style={{ backgroundColor: accent }}
            >
              <Icon name="refresh" size={17} color="#FFFFFF" />
              <Text className="font-heavy text-body text-white">Lật thẻ</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* Hàng điều khiển dưới thẻ. */}
      <View className="mt-4 flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <SpeakButton text={word.word} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? "Đã lưu vào sổ từ" : "Lưu vào sổ từ"}
            onPress={() => !saved && onSave(word)}
            className="h-10 flex-row items-center gap-1.5 rounded-pill px-3"
            style={{ backgroundColor: saved ? "#ECFDF3" : "#F1F5F9" }}
          >
            <Icon
              name={saved ? "check" : "bookmark"}
              size={16}
              color={saved ? "#16A34A" : "#475569"}
            />
            <Text
              className="font-semi text-label"
              style={{ color: saved ? "#16A34A" : "#475569" }}
            >
              {saved ? "Đã lưu" : "Lưu"}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2">
          <NavBtn
            icon="chevron-left"
            onPress={() => go(-1)}
            label="Thẻ trước"
          />
          <Text className="min-w-[72px] text-center font-semi text-body text-ink">
            {index + 1} / {list.length}
          </Text>
          <NavBtn icon="chevron-right" onPress={() => go(1)} label="Thẻ sau" />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trộn thẻ"
          onPress={() => {
            setOrder((o) => (o === "original" ? "shuffled" : "original"));
            setSeed((s) => s + 1);
            setIndex(0);
            setFlipped(false);
          }}
          className="h-10 flex-row items-center gap-1.5 rounded-pill px-3"
          style={{
            backgroundColor: order === "shuffled" ? "#EAF1FF" : "#F1F5F9",
          }}
        >
          <Icon
            name="refresh"
            size={15}
            color={order === "shuffled" ? color.primary : "#475569"}
          />
          <Text
            className="font-semi text-label"
            style={{ color: order === "shuffled" ? color.primary : "#475569" }}
          >
            {order === "shuffled" ? "Đã trộn" : "Trộn"}
          </Text>
        </Pressable>
      </View>
      <Text
        className="mt-3 text-center font-sans text-label"
        style={{ color: "#78716C" }}
      >
        {onRate ? "Space lật · 1 2 3 chấm · ← → chuyển thẻ" : "Space lật · ← → chuyển thẻ"}
      </Text>
    </View>
  );
}

const RATINGS: { label: string; stage: WordStage; bg: string; ink: string }[] = [
  { label: "Quên", stage: 0, bg: "#FDE2DF", ink: "#B42318" },
  { label: "Mơ hồ", stage: 1, bg: "#FDF0C8", ink: "#92400E" },
  { label: "Nhớ rồi", stage: 2, bg: "#D9F2E3", ink: "#166534" },
];

function NavBtn({
  icon,
  onPress,
  label,
}: {
  icon: "chevron-left" | "chevron-right";
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-pill bg-white"
      style={CARD_SHADOW}
    >
      <Icon name={icon} size={18} color={color.ink} />
    </Pressable>
  );
}
