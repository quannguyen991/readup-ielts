import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useDeckVisit } from "@/components/vocab/study/useDeckVisit";
import { GREEN, PrimaryButton, RED, StudyCard, StudyFrame, useHotkeys } from "@/components/vocab/study/StudyKit";
import { useStudyDeck } from "@/components/vocab/study/useStudyDeck";
import { useStudyTheme } from "@/components/vocab/study/useStudyTheme";
import { useL } from "@/i18n/useL";
import { seededRng, type StudyWord } from "@/services/vocab/topic-study";
import { isGuessSolved, isLetterWord, pickWords, revealedLetters, wrongGuessCount } from "@/services/vocab/review-games";
import { useGameStore } from "@/store/useGameStore";
import { useTopicStudyStore } from "@/store/useTopicStudyStore";

/**
 * Đoán chữ: gợi ý là nghĩa tiếng Việt, người học đoán từng chữ cái (bấm bàn phím
 * ảo, hoặc gõ trên máy tính). Mỗi chữ sai mất một tim; hết sáu tim là thua và từ
 * được hiện ra. Đoán ít sai thì được nhiều điểm hơn. Chỉ dùng từ viết bằng chữ cái
 * a–z, nên cụm từ và từ có gạch nối không xuất hiện.
 */

const MAX_WRONG = 6;
const WIN_POINTS = 10;
const POINTS_PER_LIFE = 2;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

export default function HangmanGame() {
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const { L, en } = useL();
  const theme = useStudyTheme();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const [rng] = useState(() => seededRng(Date.now() % 100000));
  // Xáo danh sách một lần khi mở màn. Sổ từ đổi tiến độ sau mỗi câu, làm `topic` đổi theo;
  // nếu dựng lại theo `topic` thì từ đang đoán sẽ bị đổi giữa chừng.
  const [queue, setQueue] = useState<StudyWord[] | null>(null);
  useEffect(() => {
    if (queue === null && topic) setQueue(pickWords(topic.words, 200, rng, (w) => isLetterWord(w.word)));
  }, [topic, queue, rng]);

  const [index, setIndex] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");

  const current: StudyWord | undefined = queue?.[index];
  const guessedSet = useMemo(() => new Set(guessed), [guessed]);
  const misses = current ? wrongGuessCount(current.word, guessedSet) : 0;
  const lives = MAX_WRONG - misses;
  const finished = phase !== "playing";

  const guess = (ch: string) => {
    if (!current || phase !== "playing" || guessedSet.has(ch)) return;
    const nextGuessed = [...guessed, ch];
    const nextSet = new Set(nextGuessed);
    setGuessed(nextGuessed);
    const key = `hangman:${slug}:${current.word}`;
    if (isGuessSolved(current.word, nextSet)) {
      const left = MAX_WRONG - wrongGuessCount(current.word, nextSet);
      setScore((s) => s + WIN_POINTS + left * POINTS_PER_LIFE);
      setPhase("won");
      useTopicStudyStore.getState().practice(slug, current.word, true);
      useGameStore.getState().answer(true, "vocab", { key });
    } else if (wrongGuessCount(current.word, nextSet) >= MAX_WRONG) {
      setPhase("lost");
      useTopicStudyStore.getState().practice(slug, current.word, false);
      useGameStore.getState().answer(false, "vocab", { key });
    }
  };

  const next = () => {
    setIndex((i) => i + 1);
    setGuessed([]);
    setPhase("playing");
  };

  const restart = () => {
    setIndex(0);
    setScore(0);
    setGuessed([]);
    setPhase("playing");
  };

  useHotkeys((e) => {
    if ((e.key === " " || e.code === "Space") && finished) {
      e.preventDefault();
      if (current) next();
      else restart();
      return;
    }
    if (/^[a-z]$/i.test(e.key)) guess(e.key.toLowerCase());
  });

  if (!topic) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title={L("Đoán chữ", "Hangman")}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">{L("Không có bộ từ này.", "Word set not found.")}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const title = en && (topic.kind === "topic" || topic.kind === "notebook") ? topic.name : topic.nameVi;
  const backHref = `/vocabulary/topic/${slug}`;

  if (queue === null) {
    return (
      <StudyFrame backHref={backHref} title={title}>
        <StudyCard>
          <Text className="font-sans text-body text-muted">{L("Đang xáo từ…", "Shuffling words…")}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  if (queue.length === 0) {
    return (
      <StudyFrame backHref={backHref} title={title}>
        <StudyCard>
          <Text className="font-heavy text-sectionTitle text-ink">{L("Chưa có từ để đoán", "No words to guess yet")}</Text>
          <Text className="mt-2 font-sans text-body text-muted">
            {L(
              "Đoán chữ chỉ dùng từ viết bằng chữ cái a–z, dài 3–12 chữ. Bộ này chưa có từ như vậy.",
              "Hangman uses plain a–z words of 3–12 letters. This set has none.",
            )}
          </Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  if (!current) {
    return (
      <StudyFrame backHref={backHref} title={title}>
        <StudyCard>
          <Text className="font-heavy text-sectionTitle text-ink">
            {L(`Hết bộ từ · ${score} điểm`, `Set complete · ${score} pts`)}
          </Text>
          <View className="mt-4">
            <PrimaryButton label={L("Chơi lại", "Play again")} onPress={restart} />
          </View>
        </StudyCard>
      </StudyFrame>
    );
  }

  const revealed = revealedLetters(current.word, guessedSet);
  const answer = current.word.toLowerCase();
  const wrongLetters = guessed.filter((ch) => !answer.includes(ch));
  const gained = phase === "won" ? WIN_POINTS + lives * POINTS_PER_LIFE : 0;

  return (
    <StudyFrame backHref={backHref} title={title}>
      <View className="flex-row items-center justify-between px-1 pb-2">
        <Text className="font-strong text-body" style={{ color: theme.ink }}>
          {L("Điểm", "Score")}: {score}
        </Text>
        <Text className="font-strong text-body" style={{ color: theme.ink }}>
          {index + 1}/{queue.length}
        </Text>
        <Text className="font-strong text-bodyLg" style={{ color: RED }}>
          {"♥".repeat(Math.max(0, lives))}
          <Text style={{ color: "#E1D9CB" }}>{"♥".repeat(Math.max(0, MAX_WRONG - lives))}</Text>
        </Text>
      </View>

      <StudyCard>
        <Text className="text-center font-sans text-body" style={{ color: theme.muted }}>
          {L("Gợi ý: ", "Hint: ")}
          {current.meaningVi}
        </Text>
        <Text
          className="mt-4 text-center font-heavy"
          style={{
            fontSize: 30,
            letterSpacing: 4,
            color: finished ? (phase === "won" ? GREEN : RED) : theme.ink,
          }}
        >
          {finished ? current.word : revealed.join(" ")}
        </Text>
        {wrongLetters.length > 0 ? (
          <Text className="mt-3 text-center font-sans text-label" style={{ color: RED }}>
            {L("Chữ sai: ", "Wrong: ")}
            {wrongLetters.join(" ").toUpperCase()}
          </Text>
        ) : null}
        {phase === "won" ? (
          <Text className="mt-3 text-center font-strong text-body" style={{ color: GREEN }}>
            {L(`Đúng rồi! +${gained} điểm`, `Correct! +${gained} pts`)}
          </Text>
        ) : null}
        {phase === "lost" ? (
          <Text className="mt-3 text-center font-strong text-body" style={{ color: RED }}>
            {L("Hết tim. Từ đúng đã hiện ở trên.", "Out of lives. The word is shown above.")}
          </Text>
        ) : null}
      </StudyCard>

      <View className="mt-4 flex-row flex-wrap justify-center" style={{ gap: 6 }}>
        {ALPHABET.map((ch) => {
          const used = guessedSet.has(ch);
          const hit = used && answer.includes(ch);
          const miss = used && !hit;
          return (
            <Pressable
              key={ch}
              accessibilityRole="button"
              accessibilityLabel={ch.toUpperCase()}
              accessibilityState={{ disabled: used || finished }}
              disabled={used || finished}
              onPress={() => guess(ch)}
              style={{
                width: 40,
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.dark ? "rgba(255,255,255,0.12)" : "#E8DCC6",
                backgroundColor: hit ? GREEN : miss ? RED : theme.dark ? theme.soft : "#FFFFFF",
              }}
            >
              <Text className="font-strong text-body" style={{ color: hit || miss ? "#FFFFFF" : theme.ink }}>
                {ch.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {finished ? (
        <View className="mt-5">
          <PrimaryButton label={L("Từ tiếp", "Next word")} hint="Space" onPress={next} />
        </View>
      ) : null}
    </StudyFrame>
  );
}
