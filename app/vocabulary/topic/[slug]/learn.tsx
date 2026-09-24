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
  answerLearn,
  directionFor,
  filterWords,
  isFinalKind,
  isTypedCorrect,
  makeChoices,
  passesStage,
  learnFraction,
  pickNext,
  pickRound,
  startLearn,
  seededRng,
  type LearnSettings,
  type StudyWord,
} from "@/services/vocab/topic-study";
import { masteredCount, useTopicStudyStore } from "@/store/useTopicStudyStore";
import { useStudyStore } from "@/store/useStudyStore";
import { playCorrectChime } from "@/services/audio/chime";
import { useGameStore } from "@/store/useGameStore";
import { useOwlHint } from "@/components/game/useOwlHint";
import {
  diagnosePick,
  diagnoseTyped,
  type Mistake,
} from "@/services/vocab/mistake";
import { color } from "@/theme/tokens";

const NO_STARS: string[] = [];
const KIND_LABEL = {
  flash: "Lật thẻ",
  mcq: "Trắc nghiệm",
  type: "Điền từ",
} as const;

/**
 * Học một bộ từ theo VÒNG 10 TỪ, qua ba phần:
 *
 * 1. LẬT THẺ — gặp từ, lật xem mặt sau, tự nói "đã biết" hay "chưa nhớ".
 * 2. TRẮC NGHIỆM — nhận ra đúng giữa bốn lựa chọn.
 * 3. ĐIỀN TỪ — chỉ thấy nghĩa (hoặc chỉ nghe), gõ ra từ tiếng Anh.
 *
 * Dễ trước khó: nhận ra dễ hơn nhớ lại nhiều — làm được trắc nghiệm chưa có
 * nghĩa là viết được từ đó trong bài Writing — nên từ chỉ tính là "đã nhớ" khi
 * qua phần cuối đang bật. Người học tắt bớt phần, đổi chiều hỏi, lọc từ gắn
 * sao… trong bảng Cài đặt.
 *
 * Các dạng câu XEN KẼ nhau (`pickNext`): từ mới được đưa vào dần, câu kế tiếp
 * ưu tiên dạng khác câu vừa làm — không phải mười thẻ lật liền nhau rồi mới
 * tới trắc nghiệm. Mỗi từ vẫn đi đúng thứ tự của riêng nó. Sai thì câu đó quay
 * lại sau hai câu; sửa đúng phải xác nhận thêm một lần.
 */
export default function LearnScreen() {
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
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
      s,
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
  // Các phần của vòng ĐANG CHẠY — chỉ đổi khi bắt đầu vòng mới.
  const [kinds, setKinds] = useState(() => activeKinds(settings.kinds));
  const [plan, setPlan] = useState(() => startLearn(round));
  const [asked, setAsked] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  // Phương án Cú đã loại ở câu đang mở.
  const [hidden, setHidden] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  // Lỗi của câu vừa chấm (null khi đúng), và mọi lỗi của vòng để phân tích cuối vòng.
  const [mistake, setMistake] = useState<Mistake | null>(null);
  const [mistakes, setMistakes] = useState<{ word: string; m: Mistake }[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [seed] = useState(() => Date.now() % 100000);
  // Đếm số câu đã qua — khoá cho hiệu ứng chuyển câu, chỉ đổi khi sang câu mới.
  const [step, setStep] = useState(0);

  const head = useMemo(() => pickNext(plan, kinds), [plan, kinds]);
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

  // Chiều nghe: đọc to ngay khi câu hiện ra.
  useEffect(() => {
    if (dir === "listen" && word && verdict === null)
      speak(word.word, { rate: 0.85 });
    // Chỉ khi sang câu mới, không phải mỗi lần chấm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, dir, word?.word]);

  const done = !head;
  // Mỗi đoạn một từ, đầy dần theo phần đã qua (vòng ba phần → mỗi phần một phần ba).
  const progress = round.map((w) => learnFraction(plan, w.word, kinds));
  const wordsDone = progress.filter((f) => f >= 1).length;

  const restart = (s: LearnSettings = settings) => {
    const r = freshRound(s);
    const k = activeKinds(s.kinds);
    setRound(r);
    setKinds(k);
    setPlan(startLearn(r));
    setAsked(0);
    setWrong(0);
    setPicked(null);
    setTyped("");
    setHidden([]);
    setVerdict(null);
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
      // Câu hỏi lại ngay sau khi sai chưa tính là qua phần — còn lần xác nhận.
      // Từ đã sai trong vòng này chưa tính "đã nhớ" — cần qua sạch ở một vòng sau.
      const slipped = mistakes.some((x) => x.word === word.word);
      const next =
        isFinalKind(head.kind, kinds) && passesStage(head) && !slipped
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
    if (ok) playCorrectChime();
    record(ok);
    // Game khi học: đúng thì chém quái, sai thì trúng đòn. Lật thẻ tự chấm nên không tính.
    useGameStore.getState().answer(ok, "vocab");
  };

  const advance = (ok: boolean) => {
    setPlan((p) => answerLearn(p, ok, kinds));
    setPicked(null);
    setTyped("");
    setHidden([]);
    setVerdict(null);
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
    if (verdict !== null || !mcq) return;
    setPicked(i);
    const ok = i === mcq.correctIndex;
    judge(ok, ok || !word ? null : diagnosePick(mcq.options[i]!, word, pool));
  };

  const submitTyped = () => {
    if (verdict !== null || !word || !typed.trim()) return;
    const ok = isTypedCorrect(typed, word.word);
    judge(
      ok,
      ok
        ? null
        : diagnoseTyped(
            typed,
            word.word,
            pool.filter((p) => p.word !== word.word),
          ),
    );
  };

  const dontKnow = () => {
    if (verdict !== null) return;
    if (mcq) setPicked(-1);
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
    if (head?.kind === "mcq") {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) pick(n - 1);
      if (n === 5) dontKnow();
    } else if (e.key === "Enter") {
      e.preventDefault();
      submitTyped();
    }
  });

  // Gợi ý của Cú: trắc nghiệm thì loại bớt phương án sai; gõ từ thì lộ một phần ba chữ đầu.
  useOwlHint(
    verdict === null && word && head && head.kind !== "flash"
      ? () => {
          if (mcq) {
            if (hidden.length > 0) return false;
            const wrong = mcq.options
              .map((_, i) => i)
              .filter((i) => i !== mcq.correctIndex);
            const drop = Math.min(2, wrong.length - 1);
            if (drop <= 0) return false;
            const from = step % wrong.length;
            setHidden(
              Array.from({ length: drop }, (_, k) => wrong[(from + k) % wrong.length]!),
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
      <StudyFrame backHref="/vocabulary/topics" title="Học">
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
              {round.length} từ đã qua{" "}
              {kinds.length === 1 ? "phần" : `cả ${kinds.length} phần`}:{" "}
              {kinds.map((k) => KIND_LABEL[k]).join(" → ")}
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

  return (
    <StudyFrame
      backHref={backHref}
      title={topic.nameVi}
      progress={progress}
      footer={footer}
      right={settingsButton}
      battle
    >
      {/* Ba phần của vòng — phần đang làm được tô. */}
      <View className="mb-4 flex-row flex-wrap justify-center gap-2">
        {kinds.map((k, i) => {
          const on = head!.kind === k;
          return (
            <View
              key={k}
              className="flex-row items-center gap-1.5 rounded-pill px-3.5 py-1.5"
              style={{
                backgroundColor: on ? color.primary : "rgba(255,255,255,0.8)",
              }}
            >
              <Text
                className="font-strong text-label"
                style={{ color: on ? "#FFFFFF" : "#475569" }}
              >
                {i + 1}. {KIND_LABEL[k]}
              </Text>
            </View>
          );
        })}
      </View>

      {head!.lapse ? (
        <Text
          className="mb-3 text-center font-semi text-label"
          style={{ color: "#B45309" }}
        >
          {head!.lapse === "retry"
            ? "↻ Hỏi lại từ bạn vừa sai"
            : "✓ Xác nhận lần cuối — đúng lần này là qua"}
        </Text>
      ) : null}
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
            {head!.kind === "mcq" && mcq ? (
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
                      : "Điền từ tiếng Anh"}
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
                <TextInput
                  value={typed}
                  onChangeText={setTyped}
                  editable={verdict === null}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Gõ từ tiếng Anh…"
                  placeholderTextColor="#94A3B8"
                  onSubmitEditing={submitTyped}
                  className="mt-6 rounded-2xl px-5 py-4 text-center font-semi text-sectionTitle text-ink"
                  style={{
                    borderWidth: 1.5,
                    borderColor:
                      verdict === null ? "#CBD5E1" : verdict ? GREEN : RED,
                    backgroundColor: "#F8FAFC",
                  }}
                />
                {verdict === null ? (
                  <>
                    <PrimaryButton
                      label="Kiểm tra"
                      hint="Enter"
                      disabled={!typed.trim()}
                      onPress={submitTyped}
                    />
                    <GhostButton label="Tôi không biết" onPress={dontKnow} />
                  </>
                ) : null}
              </View>
            )}

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
