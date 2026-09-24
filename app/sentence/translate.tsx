import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TaskShell } from '@/components/layout/TaskShell';
import { Confetti } from '@/components/motion/Confetti';
import { LetterGrid } from '@/components/sentence/LetterGrid';
import { Button, Icon, PaperCard } from '@/components/ui';
import {
  SENTENCE_DIFFICULTY_LABEL,
  TRANSLATION_SENTENCES,
  type TranslationItem,
} from '@/data/sentence-drills';
import { SENTENCE_ENRICHMENT } from '@/data/sentence-enrichment';
import { getTranslationSet } from '@/data/translation-sets';
import { TranslationLibrary } from '@/components/sentence/TranslationLibrary';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';
import { buildLetterBoard, gradeLetters, revealNextWord as revealThroughNextWord, sanitizeTyped } from '@/services/sentence/letter-cells';
import { chunkItems, itemsForStructure } from '@/services/writing/translation-path';
import { useSentenceStore, type TranslationAttempt } from '@/store/useSentenceStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color, paper } from '@/theme/tokens';
import { Appear, CrossFade, PageTransition } from '@/components/motion/Motion';
import { BattleStrip } from '@/components/game/BattleStrip';
import { useOwlHint } from '@/components/game/useOwlHint';
import { useSentenceStrike } from '@/components/game/useSentenceStrike';

/**
 * Luyện dịch Việt → Anh bằng cách TÁI TẠO ĐÚNG CÂU MẪU.
 *
 * Câu mẫu thành LƯỚI Ô CHỮ, mỗi chữ cái một ô — cùng lưới, cùng luật chấm với
 * màn Chép chính tả (15/09/2026, trước đó là dãy thẻ từ bị che). Ô gõ sai đỏ
 * ngay tại chỗ, nên chỗ dừng chính là chỗ cần nghĩ; đúng cả câu thì cả lưới
 * xanh theo một đợt sóng và bắn pháo giấy.
 *
 * Bản trước ở đây là "dịch tự do rồi tự chấm": gõ gì cũng được, bấm xem đáp án,
 * rồi tự bấm "Đúng ý" / "Cần xem lại". Cách ấy tôn trọng chuyện một câu tiếng
 * Việt có nhiều bản dịch đúng, nhưng đổi lại thì không có gì buộc người học
 * phải nhớ chính xác cấu trúc, và tự chấm thì lúc mệt ai cũng bấm "Đúng ý".
 *
 * Bản này đổi mục tiêu chứ không chỉ đổi cách chấm: đây là bài rèn PHẢN XẠ với
 * một mẫu câu cụ thể cho tới khi thuộc tay. Đáp án duy nhất là điều kiện của
 * loại bài đó, không phải hạn chế của nó. Chính vì vậy phần "cách diễn đạt
 * khác" vẫn còn nguyên và hiện ra ngay khi gõ xong — để không ai hiểu nhầm
 * rằng câu mẫu là bản dịch duy nhất đúng trên đời.
 */

const SESSION_LENGTH = 10;

type Phase = 'setup' | 'running' | 'summary';

export default function TranslateScreen() {
  /*
    Hai đường vào, giống hệt màn Chép chính tả:
      /sentence/translate                  — thư viện bài, chọn bài rồi vào
      /sentence/translate?set=tset-health  — luyện thẳng một bài theo chủ đề
  */
  const {
    set: setParam,
    structure: structureParam,
    chunk: chunkParam,
  } = useLocalSearchParams<{ set?: string; structure?: string; chunk?: string }>();

  const chosenSet = typeof setParam === 'string' ? getTranslationSet(setParam) : undefined;

  /*
    Ba đường vào, và cả ba đều dựng ra cùng một thứ — một mảng câu để luyện:

      /sentence/translate                       thư viện, chọn bài rồi vào
      ?set=tset-health                          trọn một bộ chủ đề
      ?set=tset-health&chunk=3                  bộ ấy, ba câu một lượt (Bước 3–5)
      ?structure=passive                        gom theo cấu trúc câu (Bước 1)

    Gộp cả ba về một chỗ dựng ngay tại đây thay vì đẻ thêm màn luyện thứ hai:
    phần khó của màn này là bộ mở khoá theo từng từ, và nhân đôi nó ra hai bản
    là nhân đôi luôn mọi lỗi về sau.
  */
  const entryItems = useMemo<TranslationItem[]>(() => {
    const size = Number(chunkParam);
    const chunk = Number.isInteger(size) && size > 1 ? size : 1;

    if (typeof structureParam === 'string') {
      return chunkItems(itemsForStructure(structureParam), chunk);
    }
    if (chosenSet) return chunkItems(chosenSet.items, chunk);
    return [];
  }, [chosenSet, chunkParam, structureParam]);

  const [phase, setPhase] = useState<Phase>(entryItems.length > 0 ? 'running' : 'setup');
  const [items, setItems] = useState<TranslationItem[]>(() => entryItems);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<TranslationAttempt[]>([]);

  const addSession = useSentenceStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  /*
    Mốc thời gian đặt trong effect, không gọi `Date.now()` lúc render: bản render
    bị bỏ rồi render lại sẽ cho hai mốc khác nhau.
  */
  const sessionStartedAt = useRef(0);
  useEffect(() => {
    sessionStartedAt.current = Date.now();
  }, []);

  const start = () => {
    // Nút bốc ngẫu nhiên lấy từ toàn bộ kho: người bấm nó muốn ôn rải, không
    // muốn trả lời thêm một câu hỏi lọc nào nữa.
    const pool = TRANSLATION_SENTENCES;
    const rng = mulberry32(hashString(String(Date.now())));
    const picked = shuffle(pool, rng).slice(0, Math.min(SESSION_LENGTH, pool.length));
    setItems(picked);
    setIndex(0);
    setAttempts([]);
    sessionStartedAt.current = Date.now();
    setPhase('running');
  };

  const finishItem = (attempt: TranslationAttempt) => {
    const next = [...attempts, attempt];
    setAttempts(next);
    if (index + 1 < items.length) {
      setIndex(index + 1);
      return;
    }
    const durationMs = Date.now() - sessionStartedAt.current;
    addSession({
      mode: 'translation',
      attempts: next,
      total: items.length,
      durationMs,
      ...(chosenSet ? { setId: chosenSet.id } : {}),
    });
    logStudyTime('practice', Math.max(1, Math.round(durationMs / 60_000)));
    logQuestions(items.length);
    setPhase('summary');
  };

  /*
    Chọn bài → từng câu → tổng kết: mỗi lần đổi vào bằng đúng nhịp chuyển trang.
    Khoá theo mã câu nên sang câu mới cũng là một lần chuyển cảnh — không có nó,
    câu mới thế chỗ câu cũ trong nháy mắt và người học không kịp thấy đã đổi câu.
  */
  if (phase === 'setup') {
    return (
      <PageTransition routeKey="setup">
        <LibraryView onRandom={start} />
      </PageTransition>
    );
  }

  if (phase === 'summary') {
    return (
      <PageTransition routeKey="summary">
        <SummaryView attempts={attempts} items={items} onRestart={() => setPhase('setup')} />
      </PageTransition>
    );
  }

  return (
    <CrossFade swapKey={`item-${items[index]?.id ?? index}`} style={{ flex: 1 }}>
      <RunningView
        key={items[index]?.id ?? index}
        item={items[index]!}
        items={items}
        index={index}
        total={items.length}
        onSubmit={finishItem}
      />
    </CrossFade>
  );
}

// ------------------------------------------------------------------ chọn bài

/**
 * Vào màn Dịch câu là thấy ngay danh sách bài theo chủ đề.
 *
 * Cùng lý do như màn Chép chính tả: "dễ / trung bình / khó" không phải câu hỏi
 * trả lời được lúc chưa thấy bài nào, còn chủ đề thì có. Ai muốn ôn rải vẫn
 * bốc ngẫu nhiên được bằng nút trên đầu.
 */
function LibraryView({ onRandom }: { onRandom: () => void }) {
  return (
    <TaskShell
      backHref="/sentence"
      backLabel="Quay lại Luyện câu"
      title="Dịch câu"
      subtitle="Vietnamese → English"
      icon="languages"
      tone="paper"
      right={
        <Button
          variant="brandOutline"
          size="sm"
          label="Bốc ngẫu nhiên 10 câu"
          iconLeft="refresh"
          onPress={onRandom}
        />
      }
    >
      <TranslationLibrary />
    </TaskShell>
  );
}

// -------------------------------------------------------------------- luyện

function RunningView({
  item,
  items,
  index,
  total,
  onSubmit,
}: {
  item: TranslationItem;
  items: TranslationItem[];
  index: number;
  total: number;
  onSubmit: (attempt: TranslationAttempt) => void;
}) {
  const [letters, setLetters] = useState('');
  const [showHint, setShowHint] = useState(false);
  /*
    "Xem đáp án" thay cho "Bỏ qua câu này".

    Bỏ qua là mất luôn câu: người học không bao giờ biết câu mẫu viết thế nào,
    nên chỗ tắc hôm nay vẫn tắc lần sau. Xem đáp án thì lưới hiện đủ chữ, câu
    mẫu và cách diễn đạt khác hiện ra — người học đọc xong mới sang câu. Câu đã
    xem đáp án KHÔNG tính là tự làm được.
  */
  const [revealed, setRevealed] = useState(false);
  const enrichment = SENTENCE_ENRICHMENT[item.id];
  const inputRef = useRef<TextInput>(null);

  /*
    Câu mẫu thành lưới ô chữ, chấm bằng đúng bộ luật của màn Chép chính tả.

    `grade.done` chỉ bật khi MỌI ô đều đúng — không phải khi điền kín. Đó là
    điều kiện duy nhất để ăn mừng và để phím Enter được sang câu.
  */
  const board = useMemo(() => buildLetterBoard(item.en), [item.en]);
  const grade = useMemo(() => gradeLetters(board.answer, letters), [board.answer, letters]);
  const done = grade.done;
  /** Đã xong câu: tự gõ đúng hết, hoặc đã bấm xem đáp án. */
  const finished = done || revealed;

  /*
    Game khi học: chấm câu ĐÚNG MỘT LẦN, ngay lúc gõ đúng trọn câu — tia nạp đòn
    chạm quái đúng lúc đó. Xong nhờ gợi ý miễn phí (Ctrl+Space, "Xem gợi ý") thì
    không chém mà cũng không mất tim; "Xem đáp án" là bỏ cuộc, trúng đòn.
  */
  const strike = useSentenceStrike(item.id, 'translate');
  useEffect(() => {
    if (done && !revealed) strike(showHint ? null : true);
  }, [done, revealed, showHint, strike]);

  // Hỏi Cú: mở hộ từ đầu tiên chưa đúng. Trả bằng lượt Cú nên KHÔNG tính là mở gợi ý.
  useOwlHint(
    !finished
      ? () => {
          const filled = revealThroughNextWord(board, letters);
          if (filled === null) return false;
          setLetters(filled);
          inputRef.current?.focus();
          return true;
        }
      : null,
  );

  /** Từ nào đã đúng trọn vẹn — để đếm "x/y từ đúng" và biết từ tiếp theo là từ nào. */
  const solvedWords = useMemo(
    () =>
      board.words.map((word) =>
        word.units.every((u) => u.kind !== 'letter' || grade.states[u.index] === 'correct'),
      ),
    [board.words, grade.states],
  );
  const solvedCount = solvedWords.filter(Boolean).length;
  const nextWord = board.words[solvedWords.indexOf(false)] ?? null;
  const nextWordLength = nextWord ? nextWord.units.filter((u) => u.kind === 'letter').length : 0;

  const enteredAt = useRef(0);
  useEffect(() => {
    enteredAt.current = Date.now();
  }, [item.id]);

  const goNext = () => {
    onSubmit({
      itemId: item.id,
      topic: item.topic,
      typed: letters,
      /*
        "Đúng" nghĩa là TỰ tái tạo được cả câu mẫu mà không mở gợi ý.

        Bản trước ghi `!showHint`, nên bấm "Bỏ qua câu này" khi chưa gõ chữ nào
        vẫn được tính là làm được — sổ tiến độ đếm cả những câu bỏ dở.
      */
      selfCorrect: done && !showHint && !revealed,
      timeSpentMs: Date.now() - enteredAt.current,
    });
  };

  /*
    Ctrl+Space — MỞ HỘ ĐÚNG MỘT TỪ, không phải mở cả câu.

    Chỗ tắc của bài này gần như luôn là một từ: người học biết cấu trúc nhưng
    không nhớ đúng từ mà câu mẫu dùng. Mở một từ trả lại đúng thứ họ thiếu rồi để
    họ đi tiếp. Với lưới ô chữ, "mở một từ" là điền sẵn mọi chữ tới hết từ đầu
    tiên còn sai.

    Câu có mở hộ KHÔNG tính là tự làm được — cùng luật với nút "Xem gợi ý". Một
    lối gỡ không để lại dấu vết thì sổ tiến độ bắt đầu nói dối.
  */
  const revealNextWord = useCallback(() => {
    if (!nextWord) return;
    const lastLetter = [...nextWord.units].reverse().find((u) => u.kind === 'letter');
    if (!lastLetter || lastLetter.kind !== 'letter') return;
    setLetters(board.answer.slice(0, lastLetter.index + 1));
    setShowHint(true);
    inputRef.current?.focus();
  }, [board.answer, nextWord]);

  /*
    Phím tắt bắt ở cấp cửa sổ: react-native-web KHÔNG giao Ctrl+Space qua
    `onKeyPress` của TextInput, nên đặt trên ô nhập thì tổ hợp ấy rơi vào hư
    không.

    Enter chỉ sang câu khi ĐÃ ĐÚNG CẢ CÂU — Enter giữa chừng mà nhảy câu là mất
    câu đang gõ dở. Không có mảng phụ thuộc: đăng ký lại mỗi lượt vẽ để luôn cầm
    `done` và `goNext` mới nhất.
  */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        revealNextWord();
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && finished) {
        event.preventDefault();
        goNext();
      }
    };
    // Pha BẮT (true), không phải pha nổi: ô nhập ẩn của react-native-web chặn
    // Enter lại, không cho nổi lên cửa sổ — xem ghi chú ở `LetterGrid`.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  return (
    <TaskShell
      backHref="/sentence"
      backLabel="Quay lại Luyện câu"
      title="Dịch câu"
      subtitle="Vietnamese → English"
      icon="languages"
      tone="paper"
      right={
        <View className="rounded-pill border border-brand-soft bg-white px-3.5 py-1.5">
          <Text className="font-strong text-label text-paper-body">
            {index + 1} / {total}
          </Text>
        </View>
      }
    >
      <View className="gap-4 lg:flex-row">
        {/* ---------------------------------------------------------- đề bài */}
        <View className="lg:w-[38%]">
          <PaperCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-heavy text-cardTitle text-paper-ink">Đề bài</Text>
              <View className="rounded-pill bg-brand-soft px-2.5 py-1">
                <Text className="font-semi text-paper-body" style={{ fontSize: 10 }}>
                  {SENTENCE_DIFFICULTY_LABEL[item.difficulty]}
                </Text>
              </View>
            </View>

            <Text className="mt-4 font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 10 }}>
              Tiếng Việt
            </Text>
            <Text className="mt-1.5 font-strong text-sectionTitle text-paper-ink">{item.vi}</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setShowHint((v) => !v)}
              className="mt-4 flex-row items-center gap-1.5 self-start"
            >
              <Icon
                name={showHint ? 'chevron-down' : 'chevron-right'}
                size={15}
                color={paper.brandMid}
                strokeWidth={2}
              />
              <Text className="font-strong text-label" style={{ color: paper.brandMid }}>
                {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
              </Text>
            </Pressable>

            {showHint ? (
              <Appear>
              <View className="mt-2.5 rounded-panel border border-brand-soft bg-brand-tint p-3">
                <Text className="font-sans text-body text-paper-body">{item.hint}</Text>
                {nextWord ? (
                  <Text className="mt-2 font-sans text-label text-paper-muted">
                    Từ tiếp theo có <Text className="font-strong">{nextWordLength} chữ cái</Text>, bắt
                    đầu bằng “{nextWord.text.replace(/[^A-Za-z0-9]/g, '').slice(0, 1)}”.
                  </Text>
                ) : null}
              </View>
              </Appear>
            ) : null}
          </PaperCard>

          {/*
            CÁC CÂU CÒN LẠI.

            Không phải để làm trước, mà để biết còn bao xa. Một bài mười câu mà chỉ
            thấy đúng câu đang gõ thì người học không ước lượng được nên ngồi tiếp
            hay dừng — và không ước lượng được thì hay dừng.

            Chỉ hiện tiếng Việt: hiện kèm bản tiếng Anh là phát đáp án của những câu
            chưa tới.
          */}
          {items.length > 1 ? (
            <PaperCard className="mt-3">
              <Text className="font-heavy text-label text-paper-muted" style={{ letterSpacing: 1 }}>
                CÁC CÂU CÒN LẠI
              </Text>
              <View className="mt-2.5 gap-2.5">
                {items.map((other, i) =>
                  i <= index ? null : (
                    <View key={other.id} className="flex-row gap-2.5">
                      <View className="h-6 w-6 items-center justify-center rounded-pill bg-brand-tint">
                        <Text className="font-semi text-label" style={{ color: paper.brandMid, fontSize: 11 }}>
                          {i + 1}
                        </Text>
                      </View>
                      <Text className="flex-1 font-sans text-label text-paper-body">{other.vi}</Text>
                    </View>
                  ),
                )}
                {index === items.length - 1 ? (
                  <Text className="font-sans text-label text-paper-muted">Đây là câu cuối.</Text>
                ) : null}
              </View>
            </PaperCard>
          ) : null}
        </View>

        {/* ------------------------------------------------------- bài dịch */}
        <View className="lg:flex-1">
          <View className="overflow-hidden rounded-card border border-brand-soft bg-white p-5">
            {done && !revealed ? <Confetti seed={item.id} /> : null}

            <Text className="font-heavy text-cardTitle text-paper-ink">Bài dịch của em</Text>

            {/*
              Thanh "chạy tới đích" cũ thành TRẬN ĐẤU: mỗi từ dịch đúng nạp thêm
              một đoạn tia vươn sang quái, đủ câu là chém; mặt đất là con đường
              qua các câu của bài.
            */}
            <BattleStrip
              className="mt-3"
              step={{ index, total }}
              charge={{ value: solvedCount, total: board.words.length, unit: 'từ' }}
            />

            <LetterGrid
              answer={board.answer}
              revealed={revealed}
              words={board.words}
              states={grade.states}
              caretAt={letters.length}
              liveResult
              celebrate={done && !revealed}
              value={letters}
              onChange={(text) => setLetters(sanitizeTyped(text, board.answer.length))}
              inputRef={inputRef}
              onClear={() => setLetters('')}
              hint="Mỗi ô là một chữ cái — Ctrl+Space mở hộ một từ · Enter sang câu sau"
            />

            {finished ? (
              <Appear>
                <View className="mt-4 flex-row items-center gap-2">
                  <Icon
                    name={revealed ? 'info' : 'check'}
                    size={18}
                    color={revealed ? paper.brandMid : color.success}
                    strokeWidth={2.4}
                  />
                  <Text
                    className="font-strong text-bodyLg"
                    style={{ color: revealed ? paper.brandMid : color.success }}
                  >
                    {revealed
                      ? 'Đáp án đây — đọc kỹ câu mẫu rồi sang câu sau nhé.'
                      : showHint
                        ? 'Xong câu — lần sau thử không mở gợi ý nhé!'
                        : 'Bạn xuất sắc — đúng cả câu!'}
                  </Text>
                </View>
                <View className="mt-2 rounded-panel bg-paper-canvas p-3.5">
                  <Text className="font-strong text-bodyLg text-paper-ink">{item.en}</Text>
                </View>
              </Appear>
            ) : null}

            <View className="mt-4 flex-row flex-wrap items-center gap-2">
              <View className="flex-1" />
              {finished ? (
                <Button
                  label={index + 1 < total ? 'Câu tiếp theo' : 'Xem kết quả'}
                  variant="brand"
                  iconRight="arrow-right"
                  onPress={goNext}
                />
              ) : (
                <Button
                  label="Xem đáp án"
                  variant="brandOutline"
                  size="sm"
                  iconLeft="info"
                  onPress={() => {
                    strike(false);
                    setRevealed(true);
                  }}
                />
              )}
            </View>

            {finished && enrichment ? (
              <View className="mt-4 gap-3">
                <View className="rounded-panel border border-brand-soft bg-brand-tint p-3.5">
                  <Text className="font-strong text-label text-paper-muted">
                    Cách diễn đạt khác — câu mẫu không phải bản dịch duy nhất đúng
                  </Text>
                  <View className="mt-2 gap-1.5">
                    {enrichment.paraphrases.map((p, i) => (
                      <Text key={i} className="font-sans text-body text-paper-body">
                        • {p}
                      </Text>
                    ))}
                  </View>
                </View>

                <View className="rounded-panel border border-brand-soft bg-brand-tint p-3.5">
                  <Text className="font-strong text-label text-paper-muted">Từ vựng mới</Text>
                  <View className="mt-2 gap-2.5">
                    {enrichment.vocab.map((v, i) => (
                      <View key={i}>
                        <Text className="font-sans text-body text-paper-ink">
                          <Text className="font-strong">{v.word}</Text>
                          <Text className="text-paper-muted"> — {v.meaningVi}</Text>
                        </Text>
                        <Text className="font-sans text-label text-paper-muted">{v.example}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TaskShell>
  );
}

function SummaryView({
  attempts,
  items,
  onRestart,
}: {
  attempts: TranslationAttempt[];
  items: TranslationItem[];
  onRestart: () => void;
}) {
  const correctCount = useMemo(() => attempts.filter((a) => a.selfCorrect).length, [attempts]);
  const toReview = useMemo(
    () =>
      attempts
        .filter((a) => !a.selfCorrect)
        .map((a) => items.find((i) => i.id === a.itemId))
        .filter((i): i is TranslationItem => !!i),
    [attempts, items],
  );

  return (
    <TaskShell
      backHref="/sentence"
      backLabel="Quay lại Luyện câu"
      title="Xong buổi luyện"
      subtitle="Translation practice"
      icon="languages"
      tone="paper"
    >
      <PaperCard className="items-center py-7">
        <Text className="font-heavy text-hero text-paper-ink">
          {correctCount}/{attempts.length}
        </Text>
        <Text className="mt-1 font-sans text-body text-paper-muted">
          câu tự tái tạo được mà không cần mở gợi ý
        </Text>
      </PaperCard>

      {toReview.length > 0 ? (
        <PaperCard className="mt-4">
          <Text className="font-strong text-cardTitle text-paper-ink">Câu cần xem lại</Text>
          <View className="mt-3 gap-3">
            {toReview.map((it) => (
              <View key={it.id} className="rounded-panel border border-brand-soft p-3">
                <Text className="font-sans text-body text-paper-body">{it.vi}</Text>
                <Text className="mt-1 font-strong text-body" style={{ color: paper.brandMid }}>
                  {it.en}
                </Text>
                <Text className="mt-1 font-mid text-label text-paper-muted">{it.hint}</Text>
              </View>
            ))}
          </View>
        </PaperCard>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button label="Luyện lại" iconLeft="refresh" variant="brand" onPress={onRestart} />
        <Button
          label="Về Luyện câu"
          variant="brandOutline"
          onPress={() => router.replace('/sentence' as never)}
        />
      </View>
    </TaskShell>
  );
}
