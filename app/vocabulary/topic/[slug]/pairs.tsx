import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useDeckVisit } from "@/components/vocab/study/useDeckVisit";
import { GREEN, PrimaryButton, RED, StudyCard, StudyFrame } from "@/components/vocab/study/StudyKit";
import { useStudyDeck } from "@/components/vocab/study/useStudyDeck";
import { useStudyTheme } from "@/components/vocab/study/useStudyTheme";
import { useL } from "@/i18n/useL";
import { seededRng, type StudyWord } from "@/services/vocab/topic-study";
import { buildPairTiles, isPairMatch, pickWords, type PairTile } from "@/services/vocab/review-games";
import { useGameStore } from "@/store/useGameStore";
import { useTopicStudyStore } from "@/store/useTopicStudyStore";

/**
 * Ghép cặp: sáu từ tiếng Anh và sáu nghĩa tiếng Việt xáo lẫn trên lưới.
 * Bấm một ô, rồi bấm ô thứ hai. Đúng cặp thì hai ô chuyển sang màu xanh và khoá lại;
 * sai thì cả hai đỏ lên rồi úp lại. Mỗi lần ghép đều ghi vào lịch ôn của đúng từ đó,
 * nên game này ôn từ chứ không chỉ để chơi cho vui.
 */

const PAIRS_PER_ROUND = 6;
const MATCH_POINTS = 10;
const MISTAKE_PENALTY = 2;
const WRONG_MS = 650;
const SPEED_BONUS_SECONDS = 60;

export default function PairsGame() {
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const { L, en } = useL();
  const theme = useStudyTheme();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const [rng] = useState(() => seededRng(Date.now() % 100000));

  const [words, setWords] = useState<StudyWord[]>([]);
  const [tiles, setTiles] = useState<PairTile[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lockRef = useRef(false);
  const startedRef = useRef(false);

  const newRound = useCallback(() => {
    if (!topic) return;
    const chosen = pickWords(topic.words, PAIRS_PER_ROUND, rng);
    setWords(chosen);
    setTiles(buildPairTiles(chosen, rng));
    setPicked(null);
    setMatched([]);
    setWrong([]);
    setMistakes(0);
    setScore(0);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setNow(Date.now());
    lockRef.current = false;
  }, [topic, rng]);

  // Chỉ xáo ván đầu một lần; đổi kho tiến độ không được làm mất ván đang chơi.
  useEffect(() => {
    if (!startedRef.current && topic) {
      startedRef.current = true;
      newRound();
    }
  }, [topic, newRound]);

  // Đồng hồ chạy khi đang ghép; dừng khi đã ghép hết.
  useEffect(() => {
    if (finishedAt !== null) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [finishedAt]);

  const tap = (tile: PairTile) => {
    if (lockRef.current || finishedAt !== null || matched.includes(tile.pairId)) return;
    if (picked === null) {
      setPicked(tile.id);
      return;
    }
    if (picked === tile.id) {
      setPicked(null);
      return;
    }
    const first = tiles.find((t) => t.id === picked);
    if (!first) return;
    const firstWord = words[first.pairId]?.word ?? "";
    const secondWord = words[tile.pairId]?.word ?? "";

    if (isPairMatch(first, tile)) {
      const nextMatched = [...matched, tile.pairId];
      setMatched(nextMatched);
      setPicked(null);
      setScore((s) => s + MATCH_POINTS);
      useTopicStudyStore.getState().practice(slug, firstWord, true);
      useGameStore.getState().answer(true, "vocab", { key: `pairs:${slug}:${firstWord}` });
      if (nextMatched.length === words.length) {
        // Cùng một con số giây cho cả thưởng tốc độ lẫn dòng hiển thị "Mất N giây".
        const endedAt = Date.now();
        const secs = Math.floor((endedAt - startedAt) / 1000);
        setScore((s) => s + Math.max(0, SPEED_BONUS_SECONDS - secs));
        setFinishedAt(endedAt);
      }
      return;
    }

    // Sai cặp: hai từ đều bị tính là chưa nhớ, để lượt sau ôn lại. Nhưng cả cặp chỉ là MỘT
    // câu sai, nên chỉ mất một tim (mỗi answer(false) là một lần trừ tim).
    lockRef.current = true;
    setMistakes((m) => m + 1);
    setScore((s) => Math.max(0, s - MISTAKE_PENALTY));
    setWrong([first.id, tile.id]);
    setPicked(null);
    for (const word of Array.from(new Set([firstWord, secondWord]))) {
      useTopicStudyStore.getState().practice(slug, word, false);
    }
    useGameStore.getState().answer(false, "vocab", { key: `pairs:${slug}:${firstWord}` });
    setTimeout(() => {
      setWrong([]);
      lockRef.current = false;
    }, WRONG_MS);
  };

  if (!topic) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title={L("Ghép cặp", "Match pairs")}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">{L("Không có bộ từ này.", "Word set not found.")}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const title = en && (topic.kind === "topic" || topic.kind === "notebook") ? topic.name : topic.nameVi;

  if (topic.words.length === 0) {
    return (
      <StudyFrame backHref={`/vocabulary/topic/${slug}`} title={title}>
        <StudyCard>
          <Text className="font-heavy text-sectionTitle text-ink">{L("Chưa có từ để ghép", "No words to match yet")}</Text>
          <Text className="mt-2 font-sans text-body text-muted">
            {L("Bộ này chưa có từ nào. Thêm từ rồi quay lại.", "This set has no words yet. Add some and come back.")}
          </Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const done = finishedAt !== null;
  const seconds = Math.floor(((finishedAt ?? now) - startedAt) / 1000);

  return (
    <StudyFrame backHref={`/vocabulary/topic/${slug}`} title={title}>
      <View className="flex-row items-center justify-between px-1 pb-3">
        <Text className="font-strong text-body" style={{ color: theme.ink }}>
          {L("Điểm", "Score")}: {score}
        </Text>
        <Text className="font-strong text-body" style={{ color: theme.ink }}>
          {seconds}s
        </Text>
        <Text className="font-strong text-body" style={{ color: RED }}>
          {L("Sai", "Misses")}: {mistakes}
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 }}>
        {tiles.map((tile) => {
          const isMatched = matched.includes(tile.pairId);
          const isPicked = picked === tile.id;
          const isWrong = wrong.includes(tile.id);
          const bg = isMatched ? "#DCFCE7" : isWrong ? "#FFE4E6" : theme.dark ? theme.soft : "#FFFFFF";
          const border = isWrong ? RED : isPicked ? theme.accent : theme.dark ? "rgba(255,255,255,0.12)" : "#E8DCC6";
          return (
            <Pressable
              key={tile.id}
              accessibilityRole="button"
              accessibilityLabel={isMatched ? `${tile.text} — ${L("đã ghép", "matched")}` : tile.text}
              accessibilityState={{ disabled: isMatched, selected: isPicked }}
              disabled={isMatched || done}
              onPress={() => tap(tile)}
              style={{
                width: "31%",
                minHeight: 78,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: border,
                backgroundColor: bg,
                paddingHorizontal: 8,
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: "center",
                opacity: isMatched ? 0.55 : 1,
                transform: [{ scale: isPicked ? 1.03 : 1 }],
              }}
            >
              <Text
                numberOfLines={3}
                className={tile.kind === "word" ? "text-center font-strong" : "text-center font-sans"}
                style={{ fontSize: tile.kind === "word" ? 15 : 13, lineHeight: 18, color: isMatched ? GREEN : theme.ink }}
              >
                {tile.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {done ? (
        <View className="mt-5">
          <StudyCard>
            <Text className="font-heavy text-sectionTitle text-ink">{L("Ghép xong!", "All matched!")}</Text>
            <Text className="mt-2 font-sans text-body text-muted">
              {L(
                `Mất ${seconds} giây, sai ${mistakes} lần, được ${score} điểm (đã gồm thưởng tốc độ).`,
                `Took ${seconds}s, ${mistakes} misses, ${score} points (speed bonus included).`,
              )}
            </Text>
            <View className="mt-4">
              <PrimaryButton label={L("Vòng mới", "New round")} onPress={newRound} />
            </View>
          </StudyCard>
        </View>
      ) : null}
    </StudyFrame>
  );
}
