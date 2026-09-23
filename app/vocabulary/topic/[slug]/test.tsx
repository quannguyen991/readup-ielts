import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import {
  GhostButton,
  GREEN,
  PrimaryButton,
  RED,
  StudyCard,
  StudyFrame,
  useHotkeys,
} from "@/components/vocab/study/StudyKit";
import { CrossFade } from "@/components/motion/Motion";
import { useStudyDeck } from "@/components/vocab/study/useStudyDeck";
import {
  makeChoices,
  seededRng,
  shuffled,
  type StudyWord,
} from "@/services/vocab/topic-study";
import { useStudyStore } from "@/store/useStudyStore";
import { color } from "@/theme/tokens";

const LENGTH = 20;

type Question = {
  word: StudyWord;
  enToVi: boolean;
  options: string[];
  correctIndex: number;
};

/**
 * Kiểm tra cả bộ: 20 câu trắc nghiệm hai chiều, KHÔNG báo đúng sai từng câu.
 *
 * Màn Học báo ngay để dạy; màn này thì đo. Báo đúng sai giữa chừng thì từ câu
 * thứ ba người làm bắt đầu đoán theo phản hồi thay vì theo trí nhớ, và điểm
 * cuối không còn nói lên mình nhớ được bao nhiêu.
 */
export default function TestScreen() {
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const topic = useStudyDeck(slug);
  const logQuestions = useStudyStore((s) => s.logQuestions);
  const [seed, setSeed] = useState(() => Date.now() % 100000);

  const questions = useMemo<Question[]>(() => {
    if (!topic) return [];
    const rng = seededRng(seed);
    return shuffled(topic.words, rng)
      .slice(0, LENGTH)
      .map((word, i) => {
        const enToVi = i % 2 === 0;
        const { options, correctIndex } = makeChoices(
          word,
          topic.words,
          (w) => (enToVi ? w.meaningVi : w.word),
          rng,
        );
        return { word, enToVi, options, correctIndex };
      });
  }, [topic, seed]);

  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(LENGTH).fill(null),
  );
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const q = questions[index];
  const choose = (i: number) => {
    if (submitted || !q) return;
    setAnswers((a) => a.map((v, k) => (k === index ? i : v)));
    if (index < questions.length - 1)
      setTimeout(() => setIndex((n) => n + 1), 180);
  };
  const submit = () => {
    setSubmitted(true);
    logQuestions(questions.length);
  };
  const retry = () => {
    setSeed((s) => s + 1);
    setAnswers(Array(LENGTH).fill(null));
    setIndex(0);
    setSubmitted(false);
  };

  useHotkeys((e) => {
    if (submitted) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) choose(n - 1);
    if (e.key === "ArrowRight")
      setIndex((i) => Math.min(questions.length - 1, i + 1));
    if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
  });

  if (!topic || !q) {
    return (
      <StudyFrame backHref="/vocabulary/topics" title="Kiểm tra">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">
            Không có bộ từ này.
          </Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const answered = answers.filter((a) => a !== null).length;
  const score = questions.filter(
    (qq, i) => answers[i] === qq.correctIndex,
  ).length;
  const backHref = `/vocabulary/topic/${slug}`;

  if (submitted) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <StudyFrame backHref={backHref} title="Kết quả kiểm tra">
        <CrossFade swapKey={`result-${seed}`}>
          <StudyCard>
            <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">
              {topic.nameVi}
            </Text>
            <Text className="mt-2 font-heavy text-hero text-ink">
              {score}/{questions.length}
            </Text>
            <Text className="font-sans text-bodyLg text-muted">
              {pct}% câu đúng
            </Text>
            <View className="mt-5 gap-2">
              {questions.map((qq, i) => {
                const ok = answers[i] === qq.correctIndex;
                if (ok) return null;
                return (
                  <View
                    key={qq.word.word}
                    className="rounded-2xl px-4 py-3"
                    style={{ backgroundColor: "#FFF1F2" }}
                  >
                    <Text className="font-strong text-body text-ink">
                      {qq.word.word}{" "}
                      <Text className="font-sans text-muted">
                        · {qq.word.meaningVi}
                      </Text>
                    </Text>
                    <Text
                      className="mt-0.5 font-sans text-label"
                      style={{ color: RED }}
                    >
                      Bạn chọn:{" "}
                      {answers[i] === null
                        ? "(bỏ trống)"
                        : qq.options[answers[i]!]}
                    </Text>
                  </View>
                );
              })}
              {score === questions.length ? (
                <Text
                  className="font-semi text-bodyLg"
                  style={{ color: GREEN }}
                >
                  Không sai câu nào.
                </Text>
              ) : null}
            </View>
            <PrimaryButton label="Làm bài khác" onPress={retry} />
            <GhostButton
              label="Về bộ từ"
              onPress={() => router.replace(backHref as never)}
            />
          </StudyCard>
        </CrossFade>
      </StudyFrame>
    );
  }

  return (
    <StudyFrame
      backHref={backHref}
      title="Kiểm tra"
      footer={`Đã trả lời ${answered} / ${questions.length}  •  ← → để chuyển câu`}
    >
      <View className="mb-4 flex-row flex-wrap justify-center gap-1.5">
        {questions.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setIndex(i)}
            className="h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor:
                i === index
                  ? color.primary
                  : answers[i] !== null
                    ? "#DBEAFE"
                    : "rgba(255,255,255,0.8)",
            }}
          >
            <Text
              className="font-semi text-label"
              style={{ color: i === index ? "#FFFFFF" : color.ink }}
            >
              {i + 1}
            </Text>
          </Pressable>
        ))}
      </View>
      <CrossFade swapKey={`t-${index}`}>
        <StudyCard>
          <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">
            Câu {index + 1} ·{" "}
            {q.enToVi ? "Chọn nghĩa đúng" : "Chọn từ tiếng Anh đúng"}
          </Text>
          <Text className="mt-2 font-heavy text-pageTitle text-ink">
            {q.enToVi ? q.word.word : q.word.meaningVi}
          </Text>
          <View className="mt-6 gap-3">
            {q.options.map((opt, i) => {
              const sel = answers[index] === i;
              return (
                <Pressable
                  key={`${i}-${opt}`}
                  onPress={() => choose(i)}
                  className="flex-row items-center gap-3 rounded-2xl px-4 py-4"
                  style={{
                    borderWidth: 1.5,
                    borderColor: sel ? color.primary : "#E2E8F0",
                    backgroundColor: sel ? "#EAF1FF" : "#FFFFFF",
                  }}
                >
                  <View
                    className="h-8 w-8 items-center justify-center rounded-pill"
                    style={{ backgroundColor: sel ? color.primary : "#EEF2F7" }}
                  >
                    <Text
                      className="font-strong text-label"
                      style={{ color: sel ? "#FFFFFF" : color.muted }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <Text className="flex-1 font-semi text-bodyLg text-ink">
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <PrimaryButton
            label={
              answered < questions.length
                ? `Nộp bài (còn ${questions.length - answered} câu trống)`
                : "Nộp bài"
            }
            onPress={submit}
          />
        </StudyCard>
      </CrossFade>
    </StudyFrame>
  );
}
