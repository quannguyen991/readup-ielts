import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { posIpa } from "@/data/study-decks";
import { router, useLocalSearchParams } from "expo-router";
import { useDeckVisit } from "@/components/vocab/study/useDeckVisit";

import {
  ChoiceGrid,
  FeedbackPanel,
  GhostButton,
  GREEN,
  PrimaryButton,
  RED,
  speak,
  SpeakButton,
  StarButton,
  StudyCard,
  StudyFrame,
  useHotkeys,
} from "@/components/vocab/study/StudyKit";
import {
  DetailFace,
  detailHeight,
  FlipCard,
  ListenFace,
  MeaningFace,
  WordFace,
} from "@/components/vocab/study/FlipCard";
import { LearnSettingsSheet } from "@/components/vocab/study/LearnSettingsSheet";
import { MistakeBox, RoundAnalysis } from "@/components/vocab/study/MistakeViews";
import { Appear, CrossFade } from "@/components/motion/Motion";
import { Icon } from "@/components/ui/Icon";
import { useStudyDeck } from "@/components/vocab/study/useStudyDeck";
import {
  activeKinds,
  clozeOf,
  directionFor,
  filterWords,
  isTypedCorrect,
  makeChoices,
  makeWordChoices,
  pickRound,
  seededRng,
  synonymMatch,
  type LearnSettings,
  type StageKind,
  type StudyWord,
} from "@/services/vocab/topic-study";
import {
  answerLoop,
  finishesWord,
  loopFraction,
  pickNext,
  slotOf,
  startLoop,
  type LoopOptions,
} from "@/services/vocab/learn-loop";
import { canRecognize, startListening, type Listening } from "@/services/shadow/speech";
import { sfx } from "@/services/audio/sfx";
import { masteredCount, useTopicStudyStore } from "@/store/useTopicStudyStore";
import { useStudyStore } from "@/store/useStudyStore";
import { useGameStore } from "@/store/useGameStore";
import { useOwlHint } from "@/components/game/useOwlHint";
import {
  diagnosePick,
  diagnoseTyped,
  type Mistake,
} from "@/services/vocab/mistake";
import { color } from "@/theme/tokens";

const NO_STARS: string[] = [];
const KIND_LABEL: Record<StageKind, string> = {
  flash: "Lật thẻ",
  mcq: "Trắc nghiệm",
  fill: "Điền chỗ trống",
  type: "Gõ từ",
};
/** Chữ trên nền chàm của màn học (ngoài thẻ trắng). */
const ON_NAVY = "rgba(255,255,255,0.86)";
const AMBER_ON_NAVY = "#FCD34D";

/**
 * Học một bộ từ theo VÒNG 10 TỪ, bốn dạng câu:
 *
 * - LẬT THẺ — gặp từ lần đầu, lật xem mặt sau, tự nói "đã biết" hay "chưa nhớ".
 * - TRẮC NGHIỆM — nhận ra đúng giữa bốn lựa chọn.
 * - ĐIỀN CHỖ TRỐNG — kiểu đề THPT: chọn từ đúng cho chỗ trống trong câu ví dụ.
 * - GÕ TỪ — chỉ thấy nghĩa (hoặc chỉ nghe), gõ (hoặc nói) ra từ tiếng Anh.
 *
 * Lịch gặp lại do VÒNG PHÂN PHỐI quyết định (`services/vocab/learn-loop.ts`):
 * sai thì gặp lại sau 2 câu bằng dạng dễ hơn; đúng cũng gặp lại, cách xa dần;
 * lần cuối để xong một từ là dạng khó nhất đang bật. Học xen kẽ (mặc định) trộn
 * các dạng; tắt đi thì mỗi từ đi tuần tự. Từ chỉ tính "đã nhớ" khi xong vòng
 * mà không sai lần nào.
 */
export default function LearnScreen() {
  // `?only=starred` (nút "Học riêng từ gắn sao" ở trang bộ từ): chỉ lượt này học
  // riêng từ gắn sao, không đổi cài đặt chung của mọi bộ.
  const { slug = "", only } = useLocalSearchParams<{ slug: string; only?: string }>();
  const starredRun = only === "starred";
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const stages = useTopicStudyStore((s) => s.stages[slug]);
  const starred = useTopicStudyStore((s) => s.starred[slug] ?? NO_STARS);
  const settings = useTopicStudyStore((s) => s.learnSettings);
  const setStage = useTopicStudyStore((s) => s.setStage);
  const toggleStar = useTopicStudyStore((s) => s.toggleStar);
  const setLearnSettings = useTopicStudyStore((s) => s.setLearnSettings);
  const resetTopic = useTopicStudyStore((s) => s.resetTopic);
  const addLapse = useTopicStudyStore((s) => s.addLapse);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  // Chốt từ của vòng một lần lúc mở màn — chấm xong câu nào cũng không được
  // làm danh sách vòng nhảy lại.
  const freshRound = (s: LearnSettings): StudyWord[] => {
    if (!topic) return [];
    const st = useTopicStudyStore.getState();
    const stageOf = (w: string) => st.stages[slug]?.[w] ?? 0;
    const pool = filterWords(
      topic.words,
      starredRun ? { ...s, starredOnly: true } : s,
      stageOf,
      new Set(st.starred[slug] ?? []),
    );
    return pickRound(
      pool,
      stageOf,
      10,
      s.ordered ? undefined : seededRng(Date.now() % 100000),
      (w) => st.lapses[slug]?.[w] ?? 0,
    );
  };
  const [round, setRound] = useState<StudyWord[]>(() => freshRound(settings));
  // Dạng câu và kiểu xếp của vòng ĐANG CHẠY — chỉ đổi khi bắt đầu vòng mới.
  const [cfg, setCfg] = useState(() => ({ kinds: activeKinds(settings.kinds), interleave: settings.interleave }));
  const [plan, setPlan] = useState(() => startLoop(round));
  const [asked, setAsked] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  // Phương án Cú đã loại ở câu đang mở.
  const [hidden, setHidden] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  // Từ đồng nghĩa được chấp nhận ở câu gõ vừa chấm.
  const [synonymUsed, setSynonymUsed] = useState<string | null>(null);
  // Lỗi của câu vừa chấm (null khi đúng), và mọi lỗi của vòng để phân tích cuối vòng.
  const [mistake, setMistake] = useState<Mistake | null>(null);
  const [mistakes, setMistakes] = useState<{ word: string; m: Mistake }[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [seed] = useState(() => Date.now() % 100000);
  // Đếm số câu đã qua — khoá cho hiệu ứng chuyển câu, chỉ đổi khi sang câu mới.
  const [step, setStep] = useState(0);

  // Từ nào khoét được chỗ trống trong câu ví dụ thì mới có dạng Điền chỗ trống.
  const fillable = useMemo(
    () => new Set(round.filter((w) => clozeOf(w.example, w.word)).map((w) => w.word)),
    [round],
  );
  const opts = useMemo<LoopOptions>(
    () => ({ kinds: cfg.kinds, interleave: cfg.interleave, canFill: (w) => fillable.has(w) }),
    [cfg, fillable],
  );
  const head = useMemo(() => pickNext(plan, opts), [plan, opts]);
  const word = round.find((w) => w.word === head?.word);
  const pool = useMemo(() => topic?.words ?? [], [topic]);
  const starredSet = useMemo(() => new Set(starred), [starred]);

  // Chiều hỏi tính theo `step` (chỉ tăng khi sang câu mới), KHÔNG theo `asked`:
  // `asked` tăng ngay lúc chấm, làm câu hỏi đổi chiều ngay dưới tay người học.
  const dir = head
    ? directionFor(head.word, step, settings.directions, head.kind)
    : "enToVi";
  const mcq = useMemo(() => {
    if (!word || head?.kind !== "mcq") return null;
    return makeChoices(
      word,
      pool,
      (w) => (dir === "viToEn" ? w.word : w.meaningVi),
      seededRng(seed + step),
    );
  }, [word, head?.kind, pool, dir, seed, step]);
  // Điền chỗ trống kiểu THPT: câu ví dụ khoét từ, bốn từ cùng từ loại để chọn.
  const fill = useMemo(() => {
    if (!word || head?.kind !== "fill") return null;
    const blank = clozeOf(word.example, word.word);
    if (!blank) return null;
    return { ...blank, ...makeWordChoices(word, pool, seededRng(seed + step)) };
  }, [word, head?.kind, pool, seed, step]);
  const choice = head?.kind === "fill" ? fill : mcq;

  // Chiều nghe: đọc to ngay khi câu hiện ra.
  useEffect(() => {
    if (dir === "listen" && word && verdict === null && head?.kind !== "fill")
      speak(word.word, { rate: 0.85 });
    // Chỉ khi sang câu mới, không phải mỗi lần chấm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, dir, word?.word]);

  // Micro đang nghe thì tắt khi sang câu khác hoặc rời màn.
  const listenRef = useRef<Listening | null>(null);
  useEffect(() => {
    return () => {
      listenRef.current?.stop();
      listenRef.current = null;
    };
  }, [step]);

  const done = !head;
  // Mỗi đoạn một từ, đầy dần theo mức của từ trong vòng.
  const progress = round.map((w) => loopFraction(plan, w.word, opts));
  const wordsDone = progress.filter((f) => f >= 1).length;

  const restart = (s: LearnSettings = settings) => {
    const r = freshRound(s);
    setRound(r);
    setCfg({ kinds: activeKinds(s.kinds), interleave: s.interleave });
    setPlan(startLoop(r));
    setAsked(0);
    setWrong(0);
    setPicked(null);
    setTyped("");
    setHidden([]);
    setVerdict(null);
    setSynonymUsed(null);
    setMistake(null);
    setMistakes([]);
    setFlipped(false);
    setStep((n) => n + 1);
  };

  const record = (ok: boolean) => {
    if (!word || !head) return;
    setAsked((n) => n + 1);
    if (!ok) {
      setWrong((n) => n + 1);
      addLapse(slug, word.word);
    }
    if (ok) {
      const current =
        useTopicStudyStore.getState().stages[slug]?.[word.word] ?? 0;
      // "Đã nhớ" chỉ khi câu này làm xong từ VÀ cả vòng chưa sai từ đó lần nào —
      // sai rồi thì cần qua sạch ở một vòng sau.
      const slipped =
        slotOf(plan, word.word).lapses > 0 ||
        mistakes.some((x) => x.word === word.word);
      const next =
        finishesWord(plan, head, true, opts) && !slipped
          ? 2
          : Math.max(current, 1);
      setStage(slug, word.word, next as 1 | 2);
    }
  };

  const judge = (ok: boolean, m: Mistake | null = null) => {
    if (!word || !head) return;
    setVerdict(ok);
    setMistake(ok ? null : m);
    if (!ok && m) {
      setMistakes((list) => [...list, { word: word.word, m }]);
      useTopicStudyStore.getState().logMistake(slug, word.word, m.kind);
    }
    record(ok);
    // Game khi học: đúng thì chém quái, sai thì trúng đòn — kèm tiếng. Lật thẻ tự chấm nên không tính.
    useGameStore.getState().answer(ok, "vocab");
  };

  const advance = (ok: boolean) => {
    listenRef.current?.stop();
    listenRef.current = null;
    setListening(false);
    setMicNote(null);
    setPlan((p) => answerLoop(p, ok, opts));
    setPicked(null);
    setTyped("");
    setHidden([]);
    setVerdict(null);
    setSynonymUsed(null);
    setMistake(null);
    setFlipped(false);
    setStep((n) => n + 1);
    logQuestions(1);
  };

  const next = () => {
    if (verdict === null) return;
    advance(verdict);
  };

  // Phần Lật thẻ không có bảng phản hồi — mặt sau của thẻ đã là phản hồi.
  const rateCard = (knew: boolean) => {
    if (!flipped || head?.kind !== "flash") return;
    // Tự chấm nên không chém quái, không cộng XP — nhưng vẫn có tiếng để biết máy đã nhận:
    // "Đã biết" kêu tiếng đúng, "Chưa nhớ" một tiếng tích nhẹ. Tắt tiếng (phím M) thì im cả hai.
    if (knew) sfx.correct(1);
    else sfx.tick(0);
    record(knew);
    if (!knew && word)
      setMistakes((list) => [
        ...list,
        {
          word: word.word,
          m: { kind: "unknown", title: "Chưa nhớ từ", detail: "" },
        },
      ]);
    advance(knew);
  };

  const pick = (i: number) => {
    if (verdict !== null || !choice) return;
    setPicked(i);
    const ok = i === choice.correctIndex;
    judge(ok, ok || !word ? null : diagnosePick(choice.options[i]!, word, pool));
  };

  const submitTyped = (text: string = typed) => {
    if (verdict !== null || !word || !text.trim()) return;
    const exact = isTypedCorrect(text, word.word);
    const syn = !exact && settings.acceptSynonyms ? synonymMatch(text, word) : null;
    const ok = exact || syn !== null;
    setSynonymUsed(syn);
    judge(
      ok,
      ok
        ? null
        : diagnoseTyped(
            text,
            word.word,
            pool.filter((p) => p.word !== word.word),
          ),
    );
  };
  const submitRef = useRef(submitTyped);
  useLayoutEffect(() => {
    submitRef.current = submitTyped;
  });

  // Trả lời bằng giọng nói: nghe xong (kết quả chốt) là chấm luôn.
  const micOk = settings.speakAnswer && canRecognize();
  const toggleMic = () => {
    if (listening) {
      listenRef.current?.stop();
      listenRef.current = null;
      setListening(false);
      return;
    }
    setMicNote(null);
    const handle = startListening({
      onText: (text, final) => {
        setTyped(text);
        if (final && text.trim()) {
          listenRef.current?.stop();
          listenRef.current = null;
          setListening(false);
          submitRef.current(text);
        }
      },
      onEnd: (reason) => {
        setListening(false);
        listenRef.current = null;
        if (reason === "denied") setMicNote("Trình duyệt chưa cho dùng micro — bấm biểu tượng ổ khoá trên thanh địa chỉ để cho phép.");
        else if (reason === "no-speech") setMicNote("Chưa nghe thấy gì, bấm micro rồi nói lại.");
      },
    });
    if (!handle) {
      setMicNote("Trình duyệt này chưa nghe được giọng nói — gõ từ nhé.");
      return;
    }
    listenRef.current = handle;
    setListening(true);
  };

  const dontKnow = () => {
    if (verdict !== null) return;
    if (choice) setPicked(-1);
    judge(false, {
      kind: "unknown",
      title: "Chưa nhớ từ",
      detail: `Đáp án: “${word!.word}” — ${word!.meaningVi}.`,
    });
  };

  // Tự sang câu khi đúng (nếu bật). Sai thì luôn dừng để người học xem đáp án.
  const nextRef = useRef(next);
  useLayoutEffect(() => {
    nextRef.current = next;
  });
  useEffect(() => {
    if (verdict !== true || !settings.autoAdvance) return;
    const t = setTimeout(() => nextRef.current(), 900);
    return () => clearTimeout(t);
  }, [verdict, settings.autoAdvance]);

  useHotkeys((e) => {
    if (done || showSettings) return;
    if (head?.kind === "flash") {
      if (e.key === " " || e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "1") rateCard(false);
      else if (e.key === "2") rateCard(true);
      return;
    }
    if (verdict !== null) {
      if (e.key === "Enter") {
        e.preventDefault();
        next();
      }
      return;
    }
    if (head?.kind === "mcq" || head?.kind === "fill") {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) pick(n - 1);
      if (n === 5) dontKnow();
    } else if (e.key === "Enter") {
      e.preventDefault();
      submitTyped();
    }
  });

  // Gợi ý của Cú: câu chọn thì loại bớt phương án sai; gõ từ thì lộ một phần ba chữ đầu.
  useOwlHint(
    verdict === null && word && head && head.kind !== "flash"
      ? () => {
          if (choice) {
            if (hidden.length > 0) return false;
            const wrongOnes = choice.options
              .map((_, i) => i)
              .filter((i) => i !== choice.correctIndex);
            const drop = Math.min(2, wrongOnes.length - 1);
            if (drop <= 0) return false;
            const from = step % wrongOnes.length;
            setHidden(
              Array.from({ length: drop }, (_, k) => wrongOnes[(from + k) % wrongOnes.length]!),
            );
            return true;
          }
          const lead = word.word.slice(0, Math.max(1, Math.ceil(word.word.length / 3)));
          if (typed.toLowerCase().startsWith(lead.toLowerCase())) return false;
          setTyped(lead);
          return true;
        }
      : null,
  );

  if (!topic) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title="Học">
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">
            Không có bộ từ này.
          </Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const backHref = `/vocabulary/topic/${slug}`;
  // Cùng mốc với thanh tiến độ ở trên (từ của VÒNG NÀY), rồi mới tới số của cả bộ.
  const footer = `Vòng này: ${wordsDone}/${round.length} từ xong  •  ${asked} câu đã làm  •  Cả bộ đã nhớ ${masteredCount(stages)}/${topic.words.length}`;
  const stageOf = (w: string) => stages?.[w] ?? 0;

  const settingsButton = (
    <Pressable
      accessibilityRole="button"
      onPress={() => setShowSettings(true)}
      className="flex-row items-center gap-2 rounded-pill bg-white/80 px-4 py-2"
    >
      <Icon name="settings" size={17} color={color.ink} />
      <Text className="font-semi text-body text-ink">Cài đặt</Text>
    </Pressable>
  );

  const sheet = (
    <LearnSettingsSheet
      visible={showSettings}
      initial={settings}
      starredCount={starred.length}
      unmasteredCount={topic.words.filter((w) => stageOf(w.word) < 2).length}
      matchCount={(d) =>
        filterWords(topic.words, d, stageOf, starredSet).length
      }
      onClose={() => setShowSettings(false)}
      onApply={(s) => {
        setLearnSettings(s);
        setShowSettings(false);
        restart(s);
      }}
      onReset={() => {
        resetTopic(slug);
        setShowSettings(false);
        restart();
      }}
    />
  );

  if (round.length === 0) {
    return (
      <StudyFrame backHref={backHref} title="Học" right={settingsButton}>
        <StudyCard>
          <Text className="font-heavy text-pageTitle text-ink">
            Không có từ nào để học
          </Text>
          <Text className="mt-2 font-sans text-bodyLg text-muted">
            Bộ lọc trong Cài đặt đang loại hết từ của bộ này — ví dụ chưa gắn
            sao từ nào, hoặc đã thuộc hết.
          </Text>
          <PrimaryButton
            label="Mở Cài đặt"
            onPress={() => setShowSettings(true)}
          />
        </StudyCard>
        {sheet}
      </StudyFrame>
    );
  }

  if (done) {
    const accuracy =
      asked > 0 ? Math.round(((asked - wrong) / asked) * 100) : 0;
    return (
      <StudyFrame
        backHref={backHref}
        title="Học"
        segments={round.map(() => 2)}
        footer={footer}
        right={settingsButton}
      >
        <CrossFade swapKey="done">
          <StudyCard>
            <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">
              Xong vòng này
            </Text>
            <Text className="mt-2 font-heavy text-pageTitle text-ink">
              {round.length} từ đã qua đủ các lần gặp lại
            </Text>
            <Text className="mt-2 font-sans text-bodyLg text-muted">
              {asked} câu, đúng {accuracy}%.
            </Text>
            <RoundAnalysis mistakes={mistakes} />
            <View className="mt-4 flex-row flex-wrap gap-2">
              {round.map((w) => (
                <View
                  key={w.word}
                  className="rounded-pill bg-primary-50 px-3 py-1.5"
                >
                  <Text className="font-semi text-body text-primary-700">
                    {w.word}
                  </Text>
                </View>
              ))}
            </View>
            <PrimaryButton
              label="Học vòng tiếp theo"
              onPress={() => restart()}
            />
            <GhostButton
              label="Về bộ từ"
              onPress={() => router.replace(backHref as never)}
            />
          </StudyCard>
        </CrossFade>
        {sheet}
      </StudyFrame>
    );
  }

  const w = word!;
  const star = (
    <StarButton
      on={starredSet.has(w.word)}
      onPress={() => toggleStar(slug, w.word)}
      inline
    />
  );
  const revealed = verdict !== null;

  return (
    <StudyFrame
      backHref={backHref}
      title={topic.nameVi}
      progress={progress}
      footer={footer}
      right={settingsButton}
      battle
    >
      {/* Dạng câu đang làm, và vì sao từ này quay lại. */}
      <View className="mb-4 flex-row flex-wrap items-center justify-center gap-2">
        <View className="rounded-pill px-3.5 py-1.5" style={{ backgroundColor: "#FFFFFF" }}>
          <Text className="font-strong text-label" style={{ color: color.primary }}>
            {KIND_LABEL[head!.kind]}
          </Text>
        </View>
        {head!.tag ? (
          <Text className="font-semi text-label" style={{ color: head!.tag === "retry" ? AMBER_ON_NAVY : ON_NAVY }}>
            {head!.tag === "retry" ? "↻ Gặp lại từ vừa sai" : "↻ Gặp lại cho nhớ lâu"}
          </Text>
        ) : null}
      </View>

      <CrossFade swapKey={`step-${step}`}>
        {head!.kind === "flash" ? (
          <View>
            <View>
              <FlipCard
                flipped={flipped}
                onFlip={() => setFlipped((f) => !f)}
                height={detailHeight(w, dir !== "enToVi")}
                front={
                  dir === "enToVi" ? (
                    <WordFace word={w} hint="Bấm thẻ hoặc Space để lật" />
                  ) : dir === "viToEn" ? (
                    <MeaningFace
                      word={w}
                      hint="Nghĩ ra từ, rồi bấm thẻ hoặc Space để lật"
                    />
                  ) : (
                    <ListenFace
                      word={w}
                      hint="Đoán từ, rồi bấm thẻ hoặc Space để lật"
                    />
                  )
                }
                back={<DetailFace word={w} showWord={dir !== "enToVi"} />}
              />
              <View
                style={{ position: "absolute", top: 14, right: 14, zIndex: 2 }}
              >
                {star}
              </View>
            </View>
            {flipped ? (
              <Appear>
                <View className="mt-4 flex-row gap-3">
                  <RateButton
                    label="Chưa nhớ"
                    hint="1"
                    tone={RED}
                    bg="#FFF1F2"
                    onPress={() => rateCard(false)}
                  />
                  <RateButton
                    label="Đã biết"
                    hint="2"
                    tone={GREEN}
                    bg="#ECFDF3"
                    onPress={() => rateCard(true)}
                  />
                </View>
              </Appear>
            ) : (
              <PrimaryButton
                label="Lật thẻ"
                hint="Space"
                onPress={() => setFlipped(true)}
              />
            )}
          </View>
        ) : (
          <StudyCard>
            {head!.kind === "fill" && fill ? (
              <View>
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">
                    Chọn từ điền vào chỗ trống
                  </Text>
                  {star}
                </View>
                <Text className="mt-3 font-semi text-sectionTitle leading-9 text-ink">
                  {fill.before}
                  <Text
                    className="font-strong"
                    style={{ color: revealed ? (verdict ? "#15803D" : "#1D4ED8") : "#94A3B8" }}
                  >
                    {revealed ? fill.answer : " _______ "}
                  </Text>
                  {fill.after}
                </Text>
                <View className="mt-6">
                  <ChoiceGrid
                    options={fill.options}
                    picked={picked}
                    correctIndex={fill.correctIndex}
                    onPick={pick}
                    hidden={hidden}
                  />
                </View>
                {verdict === null ? (
                  <GhostButton label="5 · Tôi không biết" onPress={dontKnow} />
                ) : null}
              </View>
            ) : head!.kind === "mcq" && mcq ? (
              <View>
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">
                    {dir === "viToEn"
                      ? "Chọn từ tiếng Anh đúng"
                      : "Chọn nghĩa đúng"}
                  </Text>
                  {star}
                </View>
                <View className="mt-1 flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    {dir === "listen" ? (
                      <Text className="font-heavy text-pageTitle text-ink">
                        Nghe và chọn nghĩa
                      </Text>
                    ) : (
                      <Text className="font-heavy text-pageTitle text-ink">
                        {dir === "enToVi" ? w.word : w.meaningVi}
                      </Text>
                    )}
                    {dir !== "viToEn" ? (
                      <Text className="mt-1 font-sans text-body text-muted">
                        {posIpa(w)}
                      </Text>
                    ) : null}
                  </View>
                  {dir !== "viToEn" ? (
                    <SpeakButton text={w.word} rate={0.85} />
                  ) : null}
                </View>
                <View className="mt-6">
                  <ChoiceGrid
                    options={mcq.options}
                    picked={picked}
                    correctIndex={mcq.correctIndex}
                    onPick={pick}
                    hidden={hidden}
                  />
                </View>
                {verdict === null ? (
                  <GhostButton label="5 · Tôi không biết" onPress={dontKnow} />
                ) : null}
              </View>
            ) : (
              <View>
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="font-semi text-label uppercase tracking-[1.2px] text-muted">
                    {dir === "listen"
                      ? "Nghe rồi gõ lại từ"
                      : "Gõ từ tiếng Anh"}
                  </Text>
                  {star}
                </View>
                {dir === "listen" ? (
                  <View className="mt-1 flex-row items-center gap-3">
                    <SpeakButton text={w.word} rate={0.85} size={24} />
                    <Text className="font-sans text-bodyLg text-muted">
                      {[w.pos, `${w.word.length} chữ cái`]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text className="mt-1 font-heavy text-pageTitle text-ink">
                      {w.meaningVi}
                    </Text>
                    <Text className="mt-1 font-sans text-body text-muted">
                      {[w.pos, `${w.word.length} chữ cái`]
                        .filter(Boolean)
                        .join(" · ")}{" "}
                      · bắt đầu bằng “{w.word[0]}”
                    </Text>
                  </>
                )}
                <View className="mt-6 flex-row items-center gap-2">
                  <TextInput
                    value={typed}
                    onChangeText={setTyped}
                    editable={verdict === null}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder={micOk ? "Gõ hoặc bấm micro để nói…" : "Gõ từ tiếng Anh…"}
                    placeholderTextColor="#94A3B8"
                    onSubmitEditing={() => submitTyped()}
                    className="min-w-0 flex-1 rounded-2xl px-5 py-4 text-center font-semi text-sectionTitle text-ink"
                    style={{
                      borderWidth: 1.5,
                      borderColor:
                        verdict === null ? (listening ? color.primary : "#CBD5E1") : verdict ? GREEN : RED,
                      backgroundColor: "#F8FAFC",
                    }}
                  />
                  {micOk && verdict === null ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={listening ? "Dừng nghe" : "Nói từ"}
                      onPress={toggleMic}
                      className="h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: listening ? RED : color.primary }}
                    >
                      <Icon name="mic" size={22} color="#FFFFFF" strokeWidth={2.2} />
                    </Pressable>
                  ) : null}
                </View>
                {listening ? (
                  <Text className="mt-2 text-center font-semi text-label" style={{ color: color.primary }}>
                    Đang nghe… nói từ tiếng Anh
                  </Text>
                ) : micNote ? (
                  <Text className="mt-2 text-center font-sans text-label text-muted">{micNote}</Text>
                ) : null}
                {verdict === null ? (
                  <>
                    <PrimaryButton
                      label="Kiểm tra"
                      hint="Enter"
                      disabled={!typed.trim()}
                      onPress={() => submitTyped()}
                    />
                    <GhostButton label="Tôi không biết" onPress={dontKnow} />
                  </>
                ) : null}
              </View>
            )}

            {verdict === true && synonymUsed ? (
              <Text className="mt-3 font-semi text-body" style={{ color: "#15803D" }}>
                Chấp nhận “{synonymUsed}” — từ đồng nghĩa. Từ của bộ: {w.word}.
              </Text>
            ) : null}
            {verdict === false && mistake ? <MistakeBox m={mistake} /> : null}
            {verdict !== null ? (
              <FeedbackPanel ok={verdict} word={w} onNext={next} />
            ) : null}
          </StudyCard>
        )}
      </CrossFade>
      {sheet}
    </StudyFrame>
  );
}

function RateButton({
  label,
  hint,
  tone,
  bg,
  onPress,
}: {
  label: string;
  hint: string;
  tone: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
      style={{ backgroundColor: bg, borderWidth: 1.5, borderColor: tone }}
    >
      <Text className="font-strong text-bodyLg" style={{ color: tone }}>
        {label}
      </Text>
      <Text
        className="font-sans text-label"
        style={{ color: tone, opacity: 0.7 }}
      >
        {hint}
      </Text>
    </Pressable>
  );
}
