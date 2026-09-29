import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CrossFade } from "@/components/motion/Motion";
import { useLocalSearchParams } from "expo-router";
import { useDeckVisit } from "@/components/vocab/study/useDeckVisit";
import { LinearGradient } from "expo-linear-gradient";

import {
  GREEN,
  PrimaryButton,
  RED,
  StudyCard,
  StudyFrame,
  useHotkeys,
} from "@/components/vocab/study/StudyKit";
import { useStudyDeck } from "@/components/vocab/study/useStudyDeck";
import {
  makeChoices,
  seededRng,
  type StudyWord,
} from "@/services/vocab/topic-study";
import { playQuestDamageSound } from "@/services/audio/chime";
import { useGameStore } from "@/store/useGameStore";
import { useTopicStudyStore, type GameScore } from "@/store/useTopicStudyStore";
import { color } from "@/theme/tokens";

/**
 * Bóng Bay Từ Vựng.
 *
 * Nghĩa tiếng Việt hiện ở trên; bốn quả bóng mang bốn từ tiếng Anh bay từ dưới
 * lên với tốc độ khác nhau. Bấm (hoặc phím 1–4) đúng quả trước khi nó bay mất.
 * Sai hoặc để quả đúng thoát thì mất một tim; ba tim là hết lượt.
 *
 * Tốc độ tăng theo điểm, và đúng liên tiếp thì điểm mỗi quả tăng theo chuỗi —
 * phần thưởng cho nhớ NHANH, vì trong bài thi thật không có thời gian lục trí
 * nhớ lâu cho từng từ.
 */

const LANES = [0.12, 0.37, 0.62, 0.87];
const BALLOON_COLORS = ["#60A5FA", "#F472B6", "#FBBF24", "#34D399"];
const ARENA_H = 440;
const NO_SCORES: GameScore[] = [];

type Balloon = {
  text: string;
  lane: number;
  y: number;
  speed: number;
  popped: "ok" | "bad" | null;
};
type Round = { target: StudyWord; correctLane: number; balloons: Balloon[] };

export default function GameScreen() {
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  // Mảng rỗng phải là CÙNG MỘT tham chiếu: `?? []` tạo mảng mới mỗi lần, zustand
  // tưởng dữ liệu đổi liên tục và render vòng vô hạn.
  const scores = useTopicStudyStore((s) => s.scores[slug] ?? NO_SCORES);
  const addScore = useTopicStudyStore((s) => s.addScore);

  const [tab, setTab] = useState<"play" | "board">("play");
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [round, setRound] = useState<Round | null>(null);
  const [, setFrame] = useState(0);

  // Khởi tạo lười: chỉ gọi Date.now() một lần lúc mở màn, không phải mỗi lần render.
  const [rng] = useState(() => seededRng(Date.now() % 100000));
  const rngRef = useRef(rng);
  const roundRef = useRef<Round | null>(null);
  const scoreRef = useRef(0);
  const lockRef = useRef(false);

  const newRound = useCallback(() => {
    if (!topic) return;
    const rng = rngRef.current;
    const target = topic.words[Math.floor(rng() * topic.words.length)]!;
    const { options, correctIndex } = makeChoices(
      target,
      topic.words,
      (w) => w.word,
      rng,
    );
    // Tốc độ tính bằng phần chiều cao khung mỗi giây; nhanh dần theo điểm.
    const base = 0.12 + Math.min(0.2, scoreRef.current / 2500);
    const r: Round = {
      target,
      correctLane: correctIndex,
      balloons: options.map((text, lane) => ({
        text,
        lane,
        y: -0.05 - rng() * 0.25,
        speed: base * (0.8 + rng() * 0.5),
        popped: null,
      })),
    };
    roundRef.current = r;
    lockRef.current = false;
    setRound(r);
  }, [topic]);

  const loseLife = useCallback(() => {
    playQuestDamageSound();
    setCombo(0);
    setLives((l) => {
      const left = l - 1;
      if (left <= 0) setPhase("over");
      return left;
    });
  }, []);

  // Vòng lặp khung hình: đẩy bóng lên, kiểm tra quả đúng có bay mất chưa.
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = roundRef.current;
      if (r && !lockRef.current) {
        for (const b of r.balloons) if (!b.popped) b.y += b.speed * dt;
        const correct = r.balloons[r.correctLane]!;
        if (correct.y > 1.05) {
          lockRef.current = true;
          loseLife();
          setTimeout(newRound, 350);
        }
      }
      setFrame((f) => (f + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, loseLife, newRound]);

  // Hết tim: lưu điểm một lần.
  useEffect(() => {
    if (phase === "over") addScore(slug, scoreRef.current);
  }, [phase, addScore, slug]);

  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setLives(3);
    setCombo(0);
    setPhase("playing");
    setTab("play");
    newRound();
  };

  const pop = (lane: number) => {
    const r = roundRef.current;
    if (phase !== "playing" || !r || lockRef.current) return;
    const b = r.balloons[lane];
    if (!b || b.popped) return;
    lockRef.current = true;
    if (lane === r.correctLane) {
      b.popped = "ok";
      const gain = 10 * (1 + Math.min(combo, 9));
      scoreRef.current += gain;
      setScore(scoreRef.current);
      setCombo((c) => c + 1);
      useGameStore.getState().answer(true, "vocab", { key: `game:${slug}:${r.target.word}` });
    } else {
      b.popped = "bad";
      r.balloons[r.correctLane]!.popped = "ok";
      useGameStore.getState().answer(false, "vocab", { key: `game:${slug}:${r.target.word}` });
      loseLife();
    }
    setTimeout(newRound, 450);
  };

  useHotkeys((e) => {
    if ((e.key === " " || e.code === "Space") && phase !== "playing") {
      e.preventDefault();
      start();
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= 4) pop(n - 1);
  });

  if (!topic) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title="Trò chơi">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">
            Không có bộ từ này.
          </Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const best = scores[0]?.score ?? 0;

  return (
    <StudyFrame backHref={`/vocabulary/topic/${slug}`} title={topic.nameVi}>
      <View className="mb-4 flex-row self-center rounded-2xl bg-white/80 p-1">
        {(["play", "board"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className="rounded-xl px-6 py-2"
            style={{
              backgroundColor: tab === t ? color.primary : "transparent",
            }}
          >
            <Text
              className="font-strong text-body"
              style={{ color: tab === t ? "#FFFFFF" : color.ink }}
            >
              {t === "play" ? "Chơi" : "Bảng điểm"}
            </Text>
          </Pressable>
        ))}
      </View>

      <CrossFade
        swapKey={
          tab === "board"
            ? "board"
            : `play-${phase === "playing" ? "on" : phase}`
        }
      >
        {tab === "board" ? (
          <StudyCard>
            <Text className="font-heavy text-sectionTitle text-ink">
              Điểm cao của bạn · {topic.nameVi}
            </Text>
            {scores.length === 0 ? (
              <Text className="mt-3 font-sans text-body text-muted">
                Chưa có lượt chơi nào.
              </Text>
            ) : (
              <View className="mt-4 gap-2">
                {scores.map((s, i) => (
                  <View
                    key={s.at}
                    className="flex-row items-center justify-between rounded-2xl px-4 py-3"
                    style={{ backgroundColor: i === 0 ? "#FEF9C3" : "#F8FAFC" }}
                  >
                    <Text className="font-strong text-bodyLg text-ink">
                      #{i + 1}
                    </Text>
                    <Text className="font-heavy text-bodyLg text-ink">
                      {s.score} điểm
                    </Text>
                    <Text className="font-sans text-label text-muted">
                      {new Date(s.at).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <PrimaryButton label="Chơi" hint="Space" onPress={start} />
          </StudyCard>
        ) : (
          <View
            className="overflow-hidden rounded-[22px]"
            style={{ height: ARENA_H + 90 }}
          >
            <LinearGradient
              colors={["#BFDBFE", "#E0F2FE", "#F8FAFC"]}
              style={{ flex: 1 }}
            >
              {/* Thanh trên: nghĩa cần tìm, điểm, tim. */}
              <View className="flex-row items-center justify-between px-5 pt-4">
                <View
                  className="rounded-pill px-3 py-1.5"
                  style={{ backgroundColor: color.primary }}
                >
                  <Text className="font-strong text-body text-white">
                    Điểm: {score}
                  </Text>
                </View>
                {combo > 1 ? (
                  <Text className="font-strong text-body text-primary-700">
                    Chuỗi ×{Math.min(combo, 10)}
                  </Text>
                ) : null}
                <Text
                  className="font-strong text-bodyLg"
                  style={{ color: RED }}
                >
                  {"♥".repeat(Math.max(0, lives))}
                  <Text style={{ color: "#CBD5E1" }}>
                    {"♥".repeat(Math.max(0, 3 - lives))}
                  </Text>
                </Text>
              </View>
              <Text className="mt-2 text-center font-heavy text-pageTitle text-ink">
                {phase === "playing" && round ? round.target.meaningVi : " "}
              </Text>

              <View style={{ flex: 1, position: "relative" }}>
                {phase === "playing" && round
                  ? round.balloons.map((b) => {
                      const top = ARENA_H - 70 - b.y * (ARENA_H - 40);
                      const bg =
                        b.popped === "ok"
                          ? GREEN
                          : b.popped === "bad"
                            ? RED
                            : BALLOON_COLORS[b.lane];
                      return (
                        <Pressable
                          key={`${round.target.word}-${b.lane}`}
                          onPress={() => pop(b.lane)}
                          style={{
                            position: "absolute",
                            left: `${LANES[b.lane]! * 100}%`,
                            top,
                            marginLeft: -62,
                            width: 124,
                            alignItems: "center",
                            opacity: b.popped ? 0.85 : 1,
                          }}
                        >
                          <View
                            className="items-center justify-center rounded-pill px-3"
                            style={{
                              backgroundColor: bg,
                              width: 124,
                              height: 88,
                              transform: [{ scale: b.popped ? 1.15 : 1 }],
                            }}
                          >
                            {/* Cỡ chữ theo độ dài: "deforestation" ở cỡ thường bị ngắt giữa chữ. */}
                            <Text
                              className="text-center font-strong text-white"
                              numberOfLines={2}
                              style={{
                                fontSize:
                                  longestWord(b.text) > 11
                                    ? 12.5
                                    : longestWord(b.text) > 8
                                      ? 14.5
                                      : 16,
                                lineHeight: 19,
                              }}
                            >
                              {b.text}
                            </Text>
                            <Text className="font-semi text-label text-white/80">
                              {b.lane + 1}
                            </Text>
                          </View>
                          <View
                            style={{
                              width: 2,
                              height: 34,
                              backgroundColor: "rgba(15,23,42,0.25)",
                            }}
                          />
                        </Pressable>
                      );
                    })
                  : null}

                {phase !== "playing" ? (
                  <View className="absolute inset-0 items-center justify-center px-6">
                    <Text className="text-center font-heavy text-hero text-ink">
                      {phase === "over"
                        ? `Hết lượt · ${score} điểm`
                        : "Bóng Bay Từ Vựng"}
                    </Text>
                    <Text className="mt-2 max-w-[460px] text-center font-sans text-bodyLg text-muted">
                      {phase === "over"
                        ? score >= best && score > 0
                          ? "Điểm cao nhất của bạn ở bộ này!"
                          : `Điểm cao nhất: ${best}`
                        : "Đọc nghĩa tiếng Việt, bấm (hoặc phím 1–4) vào quả bóng mang đúng từ tiếng Anh trước khi nó bay mất. Đúng liên tiếp được nhân điểm."}
                    </Text>
                    <View style={{ width: 260 }}>
                      <PrimaryButton
                        label={phase === "over" ? "Chơi lại" : "Bắt đầu"}
                        hint="Space"
                        onPress={start}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </LinearGradient>
          </View>
        )}
      </CrossFade>
    </StudyFrame>
  );
}

function longestWord(text: string): number {
  return Math.max(...text.split(" ").map((w) => w.length));
}
