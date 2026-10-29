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
import { StudyEntryChooser } from "@/components/vocab/study/StudyEntryChooser";
import { RoundAnalysis } from "@/components/vocab/study/MistakeViews";
import { useStoreTheme } from "@/components/vocab/study/useStudyTheme";
import { Appear, CrossFade } from "@/components/motion/Motion";
import { Icon } from "@/components/ui/Icon";
import { preloadPronunciation, useAutoPronounce } from "@/services/audio/pronounce";
import { useStudyDeck } from "@/components/vocab/study/useStudyDeck";
import { levelOf } from "@/data/study-decks";
import { dueTopicWords } from "@/services/vocab/topic-fsrs";
import { useVocabStore } from "@/store/useVocabStore";
import { mixByLevel } from "@/services/vocab/topic-study";
import { uid } from "@/store/persist";
import {
  activeKinds,
  clozeOf,
  directionFor,
  optionOf,
  promptOf,
  filterWords,
  isTypedCorrect,
  makeChoices,
  makeWordChoices,
  MIN_ROUND,
  pickRound,
  seededRng,
  synonymMatch,
  topUpRound,
  type LearnSettings,
  type StageKind,
  type StudyWord,
} from "@/services/vocab/topic-study";
import {
  answerLoop,
  finishesWord,
  loopDone,
  loopFraction,
  pickNext,
  slotOf,
  startLoop,
  type LoopOptions,
} from "@/services/vocab/learn-loop";
import { canRecognize, startListening, type Listening } from "@/services/shadow/speech";
import { sfx } from "@/services/audio/sfx";
import { useTopicStudyStore } from "@/store/useTopicStudyStore";
import { footerLine, learnedCount, roundStats } from "@/services/vocab/progress-counters";
import { dueBySlug } from "@/services/vocab/review-schedule";
import { todayKey } from "@/store/persist";
import { autoSpeakWhen } from "@/services/vocab/auto-speak";
import { useStudyStore } from "@/store/useStudyStore";
import { useGameStore } from "@/store/useGameStore";
import { FlameBurst, STREAK_STEP, StreakBadge } from "@/components/vocab/study/StreakFlame";
import { flushPersist } from "@/store/persist";
import {
  diagnosePick,
  diagnoseTyped,
  type Mistake,
} from "@/services/vocab/mistake";
import { color } from "@/theme/tokens";
import { useL } from "@/i18n/useL";

const NO_STARS: string[] = [];
/** Một lượt học tối đa 50 từ; bộ còn ít hơn thì lấy hết. */
const ROUND_SIZE = 50;
const KIND_LABEL: Record<StageKind, { vi: string; en: string }> = {
  flash: { vi: "Lật thẻ", en: "Flashcard" },
  mcq: { vi: "Trắc nghiệm", en: "Multiple choice" },
  fill: { vi: "Điền chỗ trống", en: "Fill the gap" },
  type: { vi: "Gõ từ", en: "Type the word" },
};
const AMBER_ON_NAVY = "#FCD34D";

/**
 * Học một bộ từ theo VÒNG tối đa 50 TỪ, bốn dạng câu (lật thẻ và ABCD luôn bật):
 *
 * - LẬT THẺ — gặp từ lần đầu, lật xem mặt sau, tự nói "đã biết" hay "chưa nhớ".
 * - TRẮC NGHIỆM — nhận ra đúng giữa bốn lựa chọn.
 * - ĐIỀN CHỖ TRỐNG — kiểu đề THPT: chọn từ đúng cho chỗ trống trong câu ví dụ.
 * - GÕ TỪ — chỉ thấy nghĩa (hoặc chỉ nghe), gõ (hoặc nói) ra từ tiếng Anh.
 *
 * Lịch gặp lại do VÒNG PHÂN PHỐI quyết định (`services/vocab/learn-loop.ts`):
 * từ mới mở bằng lật thẻ; sai thì hỏi lại sau 5–6 câu (sai nữa thì lùi xa hơn);
 * đúng cũng được hỏi lại, cách xa dần. Lần gặp lại đổi sang dạng khác nếu còn dạng
 * khác, và thứ tự câu được xáo. Học xen kẽ (mặc định) trộn các từ; tắt đi thì mỗi
 * từ đi tuần tự. Từ chỉ tính "đã nhớ" khi xong vòng mà không sai lần nào.
 */
export default function LearnScreen() {
  // `?only=starred` (nút "Học riêng từ gắn sao" ở trang bộ từ): chỉ lượt này học
  // riêng từ gắn sao, không đổi cài đặt chung của mọi bộ.
  const { slug = "", only } = useLocalSearchParams<{ slug: string; only?: string }>();
  const starredRun = only === "starred";
  const { L, en } = useL();
  const theme = useStoreTheme();
  useDeckVisit(slug);
  const topic = useStudyDeck(slug);
  const stages = useTopicStudyStore((s) => s.stages[slug]);
  const reviewsOfSet = useTopicStudyStore((s) => s.reviews[slug]);
  const starred = useTopicStudyStore((s) => s.starred[slug] ?? NO_STARS);
  const settings = useTopicStudyStore((s) => s.learnSettings);
  const setStage = useTopicStudyStore((s) => s.setStage);
  const toggleStar = useTopicStudyStore((s) => s.toggleStar);
  const setLearnSettings = useTopicStudyStore((s) => s.setLearnSettings);
  const resetTopic = useTopicStudyStore((s) => s.resetTopic);
  const addLapse = useTopicStudyStore((s) => s.addLapse);
  const logQuestions = useStudyStore((s) => s.logQuestions);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const recordVocabRun = useStudyStore((s) => s.recordVocabRun);
  // Phút học của lượt: tính từ lúc vào màn tới lúc rời đi; chỉ ghi khi có ít nhất một câu đã chấm.
  const enteredAt = useRef(Date.now());
  const answered = useRef(0);
  useEffect(() => {
    return () => {
      if (answered.current > 0) logStudyTime("review", Math.max(1, Math.round((Date.now() - enteredAt.current) / 60000)));
    };
    // Chỉ ghi khi rời màn; hàm ghi của store không đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const picked = pickRound(
      mixByLevel(pool, levelOf),
      stageOf,
      ROUND_SIZE,
      s.ordered ? undefined : seededRng(Date.now() % 100000),
      (w) => st.lapses[slug]?.[w] ?? 0,
    );
    // Từ đến hạn ôn hôm nay vào vòng trước, để lịch ôn thật sự chạy (mỗi lần trả lời đẩy hạn xa thêm).
    const dueSet = dueTopicWords(useVocabStore.getState(), slug, new Date());
    const dueFirst = pool.filter((w) => dueSet.has(w.word.trim().toLowerCase())).slice(0, ROUND_SIZE);
    const rest = picked.filter((w) => !dueSet.has(w.word.trim().toLowerCase()));
    return topUpRound([...dueFirst, ...rest].slice(0, ROUND_SIZE), mixByLevel(pool, levelOf));
  };
  // Vòng đang dở của bộ này (nếu có và còn đủ từ trong bộ): tiếp tục đúng chỗ đã dừng.
  const [saved] = useState(() => (topic ? useTopicStudyStore.getState().activeRound[slug] ?? null : null));
  const savedWords = useMemo(() => {
    if (!saved || !topic) return null;
    // Vòng lưu từ bản cũ (ít từ hơn mức tối thiểu hiện tại) thì bỏ, để mở vòng mới đủ 30 từ.
    if (saved.words.length < Math.min(MIN_ROUND, topic.words.length)) return null;
    const byWord = new Map(topic.words.map((w) => [w.word, w] as const));
    const list = saved.words.map((w) => byWord.get(w));
    return list.every((w): w is StudyWord => !!w) ? list : null;
  }, [saved, topic]);
  const [round, setRound] = useState<StudyWord[]>(() => savedWords ?? freshRound(settings));
  // Dạng câu và kiểu xếp của vòng ĐANG CHẠY — chỉ đổi khi bắt đầu vòng mới.
  const [cfg, setCfg] = useState(() => ({ kinds: activeKinds(settings.kinds), interleave: settings.interleave }));
  const [plan, setPlan] = useState(() => (savedWords && saved ? saved.plan : startLoop(round, Date.now() % 100000)));
  const [asked, setAsked] = useState(() => (savedWords && saved ? saved.asked : 0));
  const [wrong, setWrong] = useState(() => (savedWords && saved ? saved.wrong : 0));
  const [picked, setPicked] = useState<number | null>(null);
  // Phương án đang chọn bằng mũi tên: 0–3 là đáp án, 4 là "Tôi không biết".
  const [kbFocus, setKbFocus] = useState<number | null>(null);
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
  // Mỗi lần vào học thì hỏi chọn giao diện một lần.
  // Giao diện học chọn ở trang thư viện từ vựng, không hỏi lại mỗi lần vào màn học.
  const [entryOpen, setEntryOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [seed] = useState(() => Date.now() % 100000);
  // Chuỗi câu đúng liên tiếp của vòng và lần bùng lửa gần nhất.
  const [streak, setStreak] = useState(() => (savedWords && saved ? saved.streak : 0));
  const [burst, setBurst] = useState<{ key: number; n: number } | null>(null);
  // Đếm số câu đã qua — khoá cho hiệu ứng chuyển câu, chỉ đổi khi sang câu mới.
  const [step, setStep] = useState(() => (savedWords && saved ? saved.step : 0));

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
  // Từ chưa có định nghĩa tiếng Anh thì bỏ chiều Anh → Anh, không hỏi một câu trống.
  const dirs = word?.definitionEn ? settings.directions : settings.directions.filter((d) => d !== "enToEn");
  const dir = head
    ? directionFor(head.word, step, dirs, head.kind)
    : "enToVi";
  const mcq = useMemo(() => {
    if (!word || head?.kind !== "mcq") return null;
    return makeChoices(
      word,
      pool,
      (w) => optionOf(w, dir),
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

  // TỰ PHÁT ÂM (quy tắc ở `services/vocab/auto-speak.ts`): đọc từ tiếng Anh đúng một lần mỗi câu,
  // lúc nó xuất hiện — làm đề, lật ra, hoặc lộ ra cùng đáp án (đúng hay sai đều đọc).
  const speakWhen = word && head ? autoSpeakWhen({ kind: head.kind, dir, flipped, revealed: verdict !== null }) : null;
  const shownWord: string | null = word && speakWhen ? word.word : null;
  const speakKey = `${slug}-${seed}-${step}-${speakWhen ?? ""}`;
  useAutoPronounce(shownWord, speakKey);
  useEffect(() => {
    preloadPronunciation(round.map((w) => w.word));
  }, [round]);

  // Micro đang nghe thì tắt khi sang câu khác hoặc rời màn.
  const listenRef = useRef<Listening | null>(null);
  useEffect(() => {
    return () => {
      listenRef.current?.stop();
      listenRef.current = null;
    };
  }, [step]);

  // Rời màn thì ghi ngay mọi thay đổi đang chờ (không đợi hết nhịp ghi 500 ms).
  useEffect(() => () => flushPersist(), []);

  // Mỗi lần trả lời là ghi vòng đang dở; vòng xong thì xoá.
  const setActiveRound = useTopicStudyStore((s) => s.setActiveRound);
  useEffect(() => {
    if (loopDone(plan)) setActiveRound(slug, null);
    else setActiveRound(slug, { words: round.map((w) => w.word), plan, asked, wrong, streak, step });
  }, [slug, round, plan, asked, wrong, streak, step, setActiveRound]);

  const done = !head;
  // Lịch sử từ vựng ghi ngay từ câu đầu tiên đã chấm, không đợi hết vòng: học dở vẫn có dòng.
  // Mỗi lần mở màn là một dòng; số đếm tính từ lúc mở (vòng mới bắt đầu từ 0 thì sang dòng mới).
  const runRef = useRef<{ id: string; asked: number; wrong: number } | null>(null);
  const title = topic?.nameVi || topic?.name || slug;
  useEffect(() => {
    if (!runRef.current || asked < runRef.current.asked) runRef.current = { id: uid(), asked, wrong };
    const run = runRef.current;
    const total = asked - run.asked;
    if (total === 0) return;
    recordVocabRun(run.id, { deck: slug, title, correct: total - (wrong - run.wrong), total });
  }, [asked, wrong, slug, title, recordVocabRun]);
  // Mỗi đoạn một từ, đầy dần theo mức của từ trong vòng.
  const progress = round.map((w) => loopFraction(plan, w.word, opts));
  const stats = roundStats(plan, round);

  const restart = (s: LearnSettings = settings) => {
    const r = freshRound(s);
    setRound(r);
    setCfg({ kinds: activeKinds(s.kinds), interleave: s.interleave });
    setPlan(startLoop(r, Date.now() % 100000));
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
    setStreak(0);
    setBurst(null);
    setStep((n) => n + 1);
  };

  const record = (ok: boolean) => {
    if (!word || !head) return;
    setAsked((n) => n + 1);
    const st = useTopicStudyStore.getState();
    // MỌI câu trả lời đi vào lịch ôn ngay (không đợi hết vòng): thoát giữa chừng vẫn đã xếp lịch.
    st.review(slug, word.word, ok);
    if (!ok) {
      setWrong((n) => n + 1);
      addLapse(slug, word.word);
    }
    if (ok) {
      const current = st.stages[slug]?.[word.word] ?? 0;
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
    const nextStreak = ok ? streak + 1 : 0;
    setStreak(nextStreak);
    if (ok && nextStreak % STREAK_STEP === 0) setBurst({ key: Date.now(), n: nextStreak });
    // Game khi học: đúng thì chém quái, sai thì trúng đòn — kèm tiếng. Lật thẻ tự chấm nên không tính.
    useGameStore.getState().answer(ok, "vocab", { key: `learn:${slug}:${word.word}:${head.kind}` });
  };

  const advance = (ok: boolean) => {
    listenRef.current?.stop();
    listenRef.current = null;
    setListening(false);
    setMicNote(null);
    setPlan((p) => answerLoop(p, ok, opts));
    setPicked(null);
    setKbFocus(null);
    setTyped("");
    setHidden([]);
    setVerdict(null);
    setSynonymUsed(null);
    setMistake(null);
    setFlipped(false);
    setStep((n) => n + 1);
    logQuestions(1);
    if (head) useStudyStore.getState().logWordStudied(slug, head.word);
    answered.current += 1;
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
          m: { kind: "unknown", title: L("Chưa nhớ từ", "Didn't remember"), detail: "" },
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
        if (reason === "denied") setMicNote(
            L(
              "Trình duyệt chưa cho dùng micro — bấm biểu tượng ổ khoá trên thanh địa chỉ để cho phép.",
              "The browser hasn't allowed the microphone — click the lock icon in the address bar to allow it.",
            ),
          );
        else if (reason === "no-speech") setMicNote(L("Chưa nghe thấy gì, bấm micro rồi nói lại.", "Didn't hear anything — tap the mic and try again."));
      },
    });
    if (!handle) {
      setMicNote(L("Trình duyệt này chưa nghe được giọng nói — gõ từ nhé.", "This browser can't do speech input — please type the word."));
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
      title: L("Chưa nhớ từ", "Didn't remember"),
      detail: L(`Đáp án: “${word!.word}” — ${word!.meaningVi}.`, `Answer: “${word!.word}” — ${word!.meaningVi}.`),
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
    const choice = head?.kind === "mcq" || head?.kind === "fill";
    // Gõ từ: Tab đổi qua lại giữa ô gõ và "Tôi không biết" (không chuyển focus trình duyệt),
    // để Enter sau đó bấm đúng nút đang được chọn.
    if (e.key === "Tab" && !choice) {
      e.preventDefault();
      setKbFocus((f) => (f === 4 ? null : 4));
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setKbFocus((f) => (f === null ? (choice ? 0 : 4) : Math.min(4, f + 1)));
      return;
    }
    if (e.key === "ArrowUp" && choice) {
      e.preventDefault();
      setKbFocus((f) => (f === null ? 3 : Math.max(0, f - 1)));
      return;
    }
    if (e.key === "Enter" && kbFocus !== null) {
      e.preventDefault();
      if (kbFocus === 4) dontKnow();
      else if (choice) pick(kbFocus);
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


  if (!topic) {
    return (
      <StudyFrame backHref="/vocabulary/quiz" title={L("Học", "Learn")}>
        <StudyCard>
          <Text className="font-strong text-cardTitle text-ink">
            {L("Không có bộ từ này.", "Word set not found.")}
          </Text>
        </StudyCard>
      </StudyFrame>
    );
  }

  const backHref = `/vocabulary/topic/${slug}`;
  // Một dòng yên lặng: từ đã qua / câu đã làm trong vòng, rồi số từ đã nhớ của cả bộ.
  const footer = footerLine(stats, learnedCount(topic.words, stages, reviewsOfSet), topic.words.length, en);
  const stageOf = (w: string) => stages?.[w] ?? 0;

  const settingsButton = (
    <Pressable
      accessibilityRole="button"
      onPress={() => setShowSettings(true)}
      className="flex-row items-center gap-2 rounded-pill bg-white/80 px-4 py-2"
    >
      <Icon name="settings" size={17} color={theme.dark ? theme.ink : color.ink} />
      <Text className="font-semi text-body text-ink">{L("Cài đặt", "Settings")}</Text>
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
      <StudyFrame backHref={backHref} title={L("Học", "Learn")} right={settingsButton}>
        <StudyCard>
          <Text className="font-heavy text-pageTitle text-ink">
            {L("Không có từ nào để học", "No words to learn")}
          </Text>
          <Text className="mt-2 font-sans text-bodyLg text-muted">
            {L(
              "Bộ lọc trong Cài đặt đang loại hết từ của bộ này — ví dụ chưa gắn sao từ nào, hoặc đã thuộc hết.",
              "Your Settings filters exclude every word in this set — for example, no words are starred, or you already know them all.",
            )}
          </Text>
          <PrimaryButton
            label={L("Mở Cài đặt", "Open settings")}
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
        title={L("Học", "Learn")}
        segments={round.map(() => 2)}
        footer={footer}
        right={settingsButton}
      >
        <CrossFade swapKey="done">
          <StudyCard>
            <Text className="font-strong text-label text-primary-600">
              {L("Xong vòng này", "Round complete")}
            </Text>
            <Text className="mt-2 font-heavy text-pageTitle text-ink">
              {L(`${round.length} từ đã qua đủ các lần gặp lại`, `${round.length} words made it through every repeat`)}
            </Text>
            <Text className="mt-2 font-sans text-bodyLg text-muted">
              {L(`${asked} câu, đúng ${accuracy}%.`, `${asked} questions, ${accuracy}% correct.`)}
            </Text>
            <RoundAnalysis mistakes={mistakes} />
            <View className="mt-4 flex-row flex-wrap gap-2">
              {round.map((w) => (
                <View
                  key={w.word}
                  className="rounded-pill px-3 py-1.5"
                  style={{ backgroundColor: theme.chipBg }}
                >
                  <Text className="font-semi text-body" style={{ color: theme.chipInk }}>
                    {w.word}
                  </Text>
                </View>
              ))}
            </View>
            <PrimaryButton
              label={L("Học vòng tiếp theo", "Next round")}
              onPress={() => restart()}
            />
            <GhostButton
              label={L("Về bộ từ", "Back to word set")}
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
      title={(en && (topic.kind === 'topic' || topic.kind === 'notebook') ? topic.name : topic.nameVi)}
      progress={progress}
      footer={footer}
      right={settingsButton}
    >
      {/* Dạng câu đang làm, và vì sao từ này quay lại. */}
      {burst ? <FlameBurst burstKey={burst.key} n={burst.n} /> : null}
      <View className="mb-4 flex-row flex-wrap items-center justify-center gap-2">
        <StreakBadge n={streak} />
        <View className="rounded-pill px-3.5 py-1.5" style={{ backgroundColor: "#FFFFFF" }}>
          <Text className="font-strong text-label" style={{ color: color.primary }}>
            {en ? KIND_LABEL[head!.kind].en : KIND_LABEL[head!.kind].vi}
          </Text>
        </View>
        {head!.tag ? (
          <Text className="font-semi text-label" style={{ color: head!.tag === "retry" ? (theme.dark || theme.id === "scene" ? AMBER_ON_NAVY : "#6A4BD9") : theme.onBg }}>
            {head!.tag === "retry" ? L("↻ Gặp lại từ vừa sai", "↻ Back after a miss") : L("↻ Gặp lại cho nhớ lâu", "↻ Repeat for long-term memory")}
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
                height={detailHeight(w, dir !== "enToVi", dir === "enToEn")}
                front={
                  dir === "enToVi" || dir === "enToEn" ? (
                    <WordFace word={w} hint={L("Bấm thẻ hoặc Space để lật", "Tap the card or press Space to flip")} />
                  ) : dir === "viToEn" ? (
                    <MeaningFace
                      word={w}
                      hint={L("Nghĩ ra từ, rồi bấm thẻ hoặc Space để lật", "Think of the word, then tap or press Space to flip")}
                    />
                  ) : (
                    <ListenFace
                      word={w}
                      hint={L("Đoán từ, rồi bấm thẻ hoặc Space để lật", "Guess the word, then tap or press Space to flip")}
                    />
                  )
                }
                back={<DetailFace word={w} showWord={dir !== "enToVi"} english={dir === "enToEn"} />}
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
                    label={L("Chưa nhớ", "Not yet")}
                    hint="1"
                    tone={theme.bad}
                    bg={theme.badBg}
                    onPress={() => rateCard(false)}
                  />
                  <RateButton
                    label={L("Đã biết", "I knew it")}
                    hint="2"
                    tone={theme.good}
                    bg={theme.goodBg}
                    onPress={() => rateCard(true)}
                  />
                </View>
              </Appear>
            ) : (
              <PrimaryButton
                label={L("Lật thẻ", "Flip card")}
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
                  <Text className="font-semi text-label text-muted">
                    {L("Chọn từ điền vào chỗ trống", "Choose the word for the blank")}
                  </Text>
                  {star}
                </View>
                <Text className="mt-3 font-semi text-sectionTitle leading-9 text-ink">
                  {fill.before}
                  <Text
                    className="font-strong"
                    style={{ color: revealed ? (verdict ? theme.good : theme.bad) : theme.muted }}
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
                    focused={kbFocus}
                  />
                </View>
                {verdict === null ? (
                  <GhostButton label={L("5 · Tôi không biết", "5 · I don't know")} onPress={dontKnow} focused={kbFocus === 4} />
                ) : null}
              </View>
            ) : head!.kind === "mcq" && mcq ? (
              <View>
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="font-semi text-label text-muted">
                    {dir === "viToEn"
                      ? L("Chọn từ tiếng Anh đúng", "Choose the right English word")
                      : dir === "enToEn"
                        ? L("Chọn định nghĩa tiếng Anh đúng", "Choose the right English definition")
                        : L("Chọn nghĩa đúng", "Choose the right meaning")}
                  </Text>
                  {star}
                </View>
                <View className="mt-1 flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    {dir === "listen" ? (
                      <Text className="font-heavy text-stat text-ink">
                        {L("Nghe và chọn nghĩa", "Listen and choose the meaning")}
                      </Text>
                    ) : (
                      <Text className="font-heavy text-stat text-ink">
                        {promptOf(w, dir)}
                      </Text>
                    )}
                    {dir !== "viToEn" ? (
                      <Text className="mt-0.5 font-sans text-label text-muted">
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
                    focused={kbFocus}
                  />
                </View>
                {verdict === null ? (
                  <GhostButton label={L("5 · Tôi không biết", "5 · I don't know")} onPress={dontKnow} focused={kbFocus === 4} />
                ) : null}
              </View>
            ) : (
              <View>
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="font-semi text-label text-muted">
                    {dir === "listen"
                      ? L("Nghe rồi gõ lại từ", "Listen and type the word")
                      : L("Gõ từ tiếng Anh", "Type the English word")}
                  </Text>
                  {star}
                </View>
                {dir === "listen" ? (
                  <View className="mt-1 flex-row items-center gap-3">
                    <SpeakButton text={w.word} rate={0.85} size={24} />
                    <Text className="font-sans text-bodyLg text-muted">
                      {[w.pos, L(`${w.word.length} chữ cái`, `${w.word.length} letters`)]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text className="mt-1 font-heavy text-stat text-ink">
                      {w.meaningVi}
                    </Text>
                    <Text className="mt-1 font-sans text-body text-muted">
                      {[w.pos, L(`${w.word.length} chữ cái`, `${w.word.length} letters`)]
                        .filter(Boolean)
                        .join(" · ")}{" "}
                      {L(`· bắt đầu bằng “${w.word[0]}”`, `· starts with “${w.word[0]}”`)}
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
                    placeholder={micOk ? L("Gõ hoặc bấm micro để nói…", "Type, or tap the mic to speak…") : L("Gõ từ tiếng Anh…", "Type the English word…")}
                    placeholderTextColor={theme.muted}
                    onSubmitEditing={() => submitTyped()}
                    className="min-w-0 flex-1 rounded-2xl px-5 py-3 text-center font-semi text-cardTitle text-ink"
                    style={{
                      borderWidth: 1,
                      borderColor:
                        verdict === null ? (listening ? color.primary : theme.fieldBorder) : verdict ? theme.good : theme.bad,
                      backgroundColor: theme.field,
                    }}
                  />
                  {micOk && verdict === null ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={listening ? L("Dừng nghe", "Stop listening") : L("Nói từ", "Say the word")}
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
                    {L("Đang nghe… nói từ tiếng Anh", "Listening… say the English word")}
                  </Text>
                ) : micNote ? (
                  <Text className="mt-2 text-center font-sans text-label text-muted">{micNote}</Text>
                ) : null}
                {verdict === null ? (
                  <>
                    <PrimaryButton
                      label={L("Kiểm tra", "Check")}
                      hint="Enter"
                      disabled={!typed.trim()}
                      onPress={() => submitTyped()}
                    />
                    <GhostButton label={L("Tôi không biết", "I don't know")} onPress={dontKnow} focused={kbFocus === 4} />
                  </>
                ) : null}
              </View>
            )}

            {verdict === true && synonymUsed ? (
              <Text className="mt-3 font-semi text-body" style={{ color: theme.good }}>
                {L(
                  `Chấp nhận “${synonymUsed}” — từ đồng nghĩa. Từ của bộ: ${w.word}.`,
                  `Accepted “${synonymUsed}” — a synonym. The set's word: ${w.word}.`,
                )}
              </Text>
            ) : null}
            {verdict !== null ? (
              <FeedbackPanel
                ok={verdict}
                word={w}
                onNext={next}
                mistake={mistake}
                // Chỉ in lại đáp án khi chưa tô sẵn ở chỗ khác (câu gõ, câu nghe); chỉ hiện nghĩa khi đề + phương án chưa có nghĩa.
                answer={head!.kind === "type" || dir === "listen" ? w.word : undefined}
                showMeaning={head!.kind !== "mcq" && !(head!.kind === "type" && dir === "viToEn")}
                english={dir === "enToEn"}
                pron={!(head!.kind === "mcq" && dir === "enToVi")}
              />
            ) : null}
          </StudyCard>
        )}
      </CrossFade>
      {sheet}
      <StudyEntryChooser visible={entryOpen} onDone={() => setEntryOpen(false)} />
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
