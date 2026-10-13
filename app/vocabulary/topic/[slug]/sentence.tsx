import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useDeckVisit } from "@/components/vocab/study/useDeckVisit";
import { GhostButton, GREEN, PrimaryButton, RED, StudyCard, StudyFrame } from "@/components/vocab/study/StudyKit";
import { useStudyDeck } from "@/components/vocab/study/useStudyDeck";
import { useStudyTheme } from "@/components/vocab/study/useStudyTheme";
import { useL } from "@/i18n/useL";
import { seededRng, type StudyWord } from "@/services/vocab/topic-study";
import { isSentenceOrder, pickWords, scrambleSentence, type SentenceChip } from "@/services/vocab/review-games";
import { useGameStore } from "@/store/useGameStore";
import { useTopicStudyStore } from "@/store/useTopicStudyStore";

/**
 * Xếp câu: câu ví dụ của một từ bị xáo thành các từ rời. Bấm từ ở khay bên dưới để
 * đặt vào câu, bấm từ đã đặt để gỡ ra. Đặt đủ thì máy kiểm thứ tự. Sai thì sắp lại
 * (chỉ được ít điểm hơn, không bị phạt thêm), hoặc xem đáp án. Ôn cách các từ đi
 * cùng nhau trong câu, đúng cái cần khi viết và đọc.
 */

const MIN_TOKENS = 4;
const MAX_TOKENS = 12;
const WIN_POINTS = 10;
const MIN_WIN_POINTS = 4;

const tokenCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

type Theme = ReturnType<typeof useStudyTheme>;

function chipStyle(theme: Theme, placed: boolean) {
  return {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: placed ? theme.accent : theme.dark ? "rgba(255,255,255,0.12)" : "#E8DCC6",
    backgroundColor: placed ? (theme.dark ? "rgba(231,201,138,0.18)" : "#FFF7E6") : theme.dark ? theme.soft : "#FFFFFF",
  };
}

export default function SentenceGame() {
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const { L, en } = useL();
  const theme = useStudyTheme();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const [rng] = useState(() => seededRng(Date.now() % 100000));
  // Xáo danh sách một lần khi mở màn (lý do như hangman.tsx: sổ từ đổi `topic` sau mỗi câu).
  const [queue, setQueue] = useState<StudyWord[] | null>(null);
  useEffect(() => {
    if (queue === null && topic) {
      setQueue(
        pickWords(topic.words, 200, rng, (w) => {
          const n = tokenCount(w.example ?? "");
          return n >= MIN_TOKENS && n <= MAX_TOKENS;
        }),
      );
    }
  }, [topic, queue, rng]);

  const [index, setIndex] = useState(0);
  const current: StudyWord | undefined = queue?.[index];
  const [round, setRound] = useState<{ key: string; target: string[]; chips: SentenceChip[] } | null>(null);
  const [picked, setPicked] = useState<SentenceChip[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState(0);
  const [note, setNote] = useState("");

  // Mỗi câu mới được xáo lại một lần khi đổi từ.
  useEffect(() => {
    if (!current) return;
    setRound({ key: current.example, ...scrambleSentence(current.example, rng) });
    setPicked([]);
    setAttempts(0);
    setPhase("playing");
    setNote("");
  }, [current, rng]);

  const finished = phase !== "playing";
  // Chỉ dùng khay của đúng câu đang hiện: tránh một khung hình mang khay của câu trước.
  const active = round && current && round.key === current.example ? round : null;
  const pool = active ? active.chips.filter((c) => !picked.some((p) => p.id === c.id)) : [];
  const winPoints = Math.max(MIN_WIN_POINTS, WIN_POINTS - attempts * 2);

  const place = (chip: SentenceChip) => {
    if (!active || !current || finished) return;
    const nextPicked = [...picked, chip];
    setPicked(nextPicked);
    setNote("");
    if (nextPicked.length < active.target.length) return;
    if (isSentenceOrder(nextPicked, active.target)) {
      setScore((s) => s + winPoints);
      setPhase("won");
      useTopicStudyStore.getState().practice(slug, current.word, true);
      useGameStore.getState().answer(true, "vocab", { key: `sentence:${slug}:${current.word}` });
    } else {
      setAttempts((a) => a + 1);
      setNote(L("Chưa đúng thứ tự. Gỡ các từ sai ra và sắp lại.", "Not in the right order yet. Remove the wrong words and rearrange."));
    }
  };

  const unplace = (chip: SentenceChip) => {
    if (finished) return;
    setPicked((p) => p.filter((c) => c.id !== chip.id));
    setNote("");
  };

  const giveUp = () => {
    if (!current || finished) return;
    setPhase("lost");
    setNote("");
    useTopicStudyStore.getState().practice(slug, current.word, false);
    useGameStore.getState().answer(false, "vocab", { key: `sentence:${slug}:${current.word}` });
  };

  const next = () => setIndex((i) => i + 1);
  const restart = () => {
    setIndex(0);
    setScore(0);
  };

  if (!topic) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title={L("Xếp câu", "Build sentence")}>
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
          <Text className="font-sans text-body text-muted">{L("Đang xáo câu…", "Shuffling…")}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  if (queue.length === 0) {
    return (
      <StudyFrame backHref={backHref} title={title}>
        <StudyCard>
          <Text className="font-heavy text-sectionTitle text-ink">{L("Chưa có câu để xếp", "No sentences to build yet")}</Text>
          <Text className="mt-2 font-sans text-body text-muted">
            {L(
              "Xếp câu dùng câu ví dụ dài 4–12 từ. Bộ này chưa có câu như vậy.",
              "Build sentence uses example sentences of 4–12 words. This set has none.",
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
            {L(`Hết bộ câu · ${score} điểm`, `Set complete · ${score} pts`)}
          </Text>
          <View className="mt-4">
            <PrimaryButton label={L("Chơi lại", "Play again")} onPress={restart} />
          </View>
        </StudyCard>
      </StudyFrame>
    );
  }

  if (!active) {
    return (
      <StudyFrame backHref={backHref} title={title}>
        <StudyCard>
          <Text className="font-sans text-body text-muted">{L("Đang xáo câu…", "Shuffling…")}</Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  return (
    <StudyFrame backHref={backHref} title={title}>
      <View className="flex-row items-center justify-between px-1 pb-2">
        <Text className="font-strong text-body" style={{ color: theme.ink }}>
          {L("Điểm", "Score")}: {score}
        </Text>
        <Text className="font-strong text-body" style={{ color: theme.ink }}>
          {index + 1}/{queue.length}
        </Text>
      </View>

      <StudyCard>
        <Text className="text-center font-sans text-body" style={{ color: theme.muted }}>
          {L("Từ khoá: ", "Key word: ")}
          <Text className="font-heavy" style={{ color: theme.ink }}>
            {current.word}
          </Text>
          {" · "}
          {current.meaningVi}
        </Text>

        <View className="mt-4 flex-row flex-wrap justify-center" style={{ gap: 8, minHeight: 56 }}>
          {picked.length === 0 && !finished ? (
            <Text className="font-sans text-body" style={{ color: theme.muted }}>
              {L("Bấm các từ bên dưới để xếp câu.", "Tap the words below to build the sentence.")}
            </Text>
          ) : (
            picked.map((chip) => (
              <Pressable
                key={`p${chip.id}`}
                accessibilityRole="button"
                accessibilityLabel={chip.text}
                disabled={finished}
                onPress={() => unplace(chip)}
                style={chipStyle(theme, true)}
              >
                <Text className="font-strong text-body" style={{ color: theme.ink }}>
                  {chip.text}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        {finished ? (
          <View className="mt-4">
            <Text className="text-center font-strong text-body" style={{ color: phase === "won" ? GREEN : RED }}>
              {phase === "won"
                ? L(`Đúng rồi! +${winPoints} điểm`, `Correct! +${winPoints} pts`)
                : L("Câu đúng là:", "The sentence is:")}
            </Text>
            <Text className="mt-2 text-center font-sans text-body" style={{ color: theme.ink }}>
              {active.target.join(" ")}
            </Text>
          </View>
        ) : null}
        {note ? (
          <Text className="mt-3 text-center font-sans text-label" style={{ color: RED }}>
            {note}
          </Text>
        ) : null}
      </StudyCard>

      {!finished ? (
        <View className="mt-4 flex-row flex-wrap justify-center" style={{ gap: 8 }}>
          {pool.map((chip) => (
            <Pressable
              key={`c${chip.id}`}
              accessibilityRole="button"
              accessibilityLabel={chip.text}
              onPress={() => place(chip)}
              style={chipStyle(theme, false)}
            >
              <Text className="font-strong text-body" style={{ color: theme.ink }}>
                {chip.text}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View className="mt-5 gap-3">
        {finished ? (
          <PrimaryButton label={L("Câu tiếp", "Next sentence")} onPress={next} />
        ) : (
          <GhostButton label={L("Xem đáp án", "Show answer")} onPress={giveUp} />
        )}
      </View>
    </StudyFrame>
  );
}
