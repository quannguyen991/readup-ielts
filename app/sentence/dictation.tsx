import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';

import { TaskShell } from '@/components/layout/TaskShell';
import { Confetti } from '@/components/motion/Confetti';
import { DictationLibrary } from '@/components/sentence/DictationLibrary';
import { LetterGrid } from '@/components/sentence/LetterGrid';
import { VoicePicker, preferredVoice, useEnglishVoices } from '@/components/sentence/VoicePicker';
import { Badge, Button, Icon, type IconName } from '@/components/ui';
import { DICTATION_SENTENCES, type DictationItem } from '@/data/sentence-drills';
import { DICTATION_VI } from '@/data/dictation-vi';
import { getDictationSet, type DictationSet } from '@/data/dictation-sets';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';
import { gradeDictation } from '@/services/sentence/dictation-grade';
import {
  buildLetterBoard,
  gradeLetters,
  revealNextWord,
  sanitizeTyped,
} from '@/services/sentence/letter-cells';
import { useSentenceStore, type DictationAttempt } from '@/store/useSentenceStore';
import { useStudyStore } from '@/store/useStudyStore';
import { color, paper } from '@/theme/tokens';
import { CrossFade, PageTransition } from '@/components/motion/Motion';
import { BattleStrip } from '@/components/game/BattleStrip';
import { useOwlHint } from '@/components/game/useOwlHint';
import { useSentenceStrike } from '@/components/game/useSentenceStrike';

/**
 * Bài luyện chép chính tả — MỖI CHỮ CÁI MỘT Ô.
 *
 * Hai chế độ nhập, cùng một câu:
 *
 *   Ô chữ  — câu chia sẵn thành ô, biết ngay có mấy từ và mỗi từ mấy chữ. Đây
 *            là chế độ mặc định vì nó biến bài từ "nhớ cả câu" thành "bắt đúng
 *            từng âm", và người mới không bị chặn ngay câu đầu tiên.
 *   Tự gõ  — một ô dài, chấm bằng `gradeDictation` (so khớp theo dãy con chung
 *            dài nhất). Khó hơn và giống thi thật hơn, giữ lại cho người đã quen.
 *
 * KHÔNG ĐỒNG HỒ ĐẾM LÙI. Chép chính tả cần nghe kỹ và gõ cẩn thận — hối bằng
 * đồng hồ đi ngược lại chính kỹ năng đang luyện. Vẫn ghi `timeSpentMs` từng câu
 * cho thống kê, chỉ là không hiện áp lực thời gian lên màn hình.
 *
 * TTS dùng `expo-speech` NGAY TRÊN THIẾT BỊ, không gọi proxy AI nào. Đổi lại,
 * `expo-speech` không cho biết độ dài đoạn đọc, nên ở đây KHÔNG có thanh tiến
 * trình và mốc thời gian — vẽ một thanh chạy giả sẽ là con số bịa.
 */

/**
 * Đổi một bộ đề thành danh sách câu mà màn luyện vốn đã hiểu.
 *
 * Gắn thêm `vi` ngay trên từng câu: bộ đề mang sẵn bản dịch của mình, không
 * phải tra bảng `DICTATION_VI` vốn chỉ có cho 100 câu của kho cũ.
 */
function sentencesOfSet(set: DictationSet): (DictationItem & { vi: string })[] {
  return set.sentences.map((sentence, i) => ({
    id: `${set.id}-${String(i + 1).padStart(2, '0')}`,
    topic: 'society',
    difficulty: set.level === 'A2' ? 'easy' : set.level === 'C1' ? 'hard' : 'medium',
    text: sentence.en,
    vi: sentence.vi,
  }));
}

const SESSION_LENGTH = 10;
const RATES = [1, 0.75, 0.5] as const;

type Phase = 'setup' | 'running' | 'summary';
type InputMode = 'cells' | 'free';

export default function DictationScreen() {
  /*
    Vào màn này bằng HAI đường, và đường nào cũng phải chạy đúng:

      /sentence/dictation            — bốc ngẫu nhiên 10 câu từ kho 100 câu rời,
                                       hợp với việc ôn rải.
      /sentence/dictation?set=set-07 — luyện trọn một BỘ ĐỀ 12 câu cùng chủ đề,
                                       nối tiếp nhau như một đoạn nói ngắn.

    Có `set` thì bỏ qua luôn màn chọn độ khó: người dùng đã chọn bài ở thư viện
    rồi, bắt chọn thêm một lần nữa là hỏi lại thứ họ vừa trả lời.
  */
  const { set: setParam } = useLocalSearchParams<{ set?: string }>();
  const chosenSet = typeof setParam === 'string' ? getDictationSet(setParam) : undefined;

  const [phase, setPhase] = useState<Phase>(chosenSet ? 'running' : 'setup');
  const [items, setItems] = useState<DictationItem[]>(() =>
    chosenSet ? sentencesOfSet(chosenSet) : [],
  );
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<DictationAttempt[]>([]);
  const [mode, setMode] = useState<InputMode>('cells');

  const addSession = useSentenceStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  /*
    Mốc bắt đầu phiên đặt trong effect, KHÔNG gọi `Date.now()` lúc render.

    Gọi hàm không thuần trong thân component là thứ React Compiler chặn, và có
    lý: bản render bị bỏ đi rồi render lại sẽ cho hai mốc khác nhau. Vào thẳng
    một bộ đề thì phiên bắt đầu ngay lúc màn gắn vào; vào bằng nút bốc ngẫu
    nhiên thì `start()` đặt lại mốc.
  */
  const sessionStartedAt = useRef(0);
  useEffect(() => {
    sessionStartedAt.current = Date.now();
  }, []);

  const start = () => {
    // Nút bốc ngẫu nhiên lấy từ TOÀN BỘ kho câu rời: người bấm nó đang muốn ôn
    // rải, không muốn trả lời thêm một câu hỏi lọc nào nữa.
    const pool = DICTATION_SENTENCES;
    const rng = mulberry32(hashString(String(Date.now())));
    const picked = shuffle(pool, rng).slice(0, Math.min(SESSION_LENGTH, pool.length));
    setItems(picked);
    setIndex(0);
    setAttempts([]);
    sessionStartedAt.current = Date.now();
    setPhase('running');
  };

  const finishItem = useCallback(
    (attempt: DictationAttempt) => {
      const next = [...attempts, attempt];
      setAttempts(next);
      if (index + 1 < items.length) {
        setIndex(index + 1);
        return;
      }
      const durationMs = Date.now() - sessionStartedAt.current;
      addSession({ mode: 'dictation', attempts: next, total: items.length, durationMs, ...(chosenSet ? { setId: chosenSet.id } : {}) });
      logStudyTime('practice', Math.max(1, Math.round(durationMs / 60_000)));
      logQuestions(items.length);
      setPhase('summary');
    },
    [addSession, attempts, chosenSet, index, items.length, logQuestions, logStudyTime],
  );

  /*
    Chọn bài và tổng kết vào bằng nhịp chuyển trang. Sang câu mới thì chỉ MỜ TẠI
    CHỖ: trượt cả màn mỗi câu thì mười hai câu là mười hai lần tưởng tải lại trang.
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
        <SummaryView attempts={attempts} onRestart={() => setPhase('setup')} />
      </PageTransition>
    );
  }

  return (
    <CrossFade swapKey={`item-${items[index]?.id ?? index}`} style={{ flex: 1 }}>
    <RunningView
      key={items[index]?.id ?? index}
      item={items[index]!}
      index={index}
      total={items.length}
      mode={mode}
      onChangeMode={setMode}
      onSubmit={finishItem}
      onPrev={
        index === 0
          ? undefined
          : () => {
              /*
                Lùi lại thì BỎ luôn lượt vừa ghi của câu trước.

                Giữ nó lại thì một câu có hai lượt trong sổ, và bảng tổng kết
                đếm nhiều hơn số câu thật. Người bấm lùi là người muốn làm lại
                câu đó, không phải người muốn cộng thêm một lượt.
              */
              setAttempts((prev) => prev.slice(0, -1));
              setIndex(index - 1);
            }
      }
    />
    </CrossFade>
  );
}

// ------------------------------------------------------------------ chọn bài

/**
 * Vào màn Chép chính tả là thấy NGAY danh sách bài.
 *
 * Bản trước chặn ở một màn chọn độ khó rồi mới bốc mười câu ngẫu nhiên. Nhưng
 * "dễ / trung bình / khó" không phải câu hỏi người học trả lời được lúc chưa
 * thấy bài nào, và bốc ngẫu nhiên thì không quay lại đúng bài hôm qua được.
 * Danh sách bài trả lời cả hai chuyện đó, còn ai muốn ôn rải thì vẫn có nút bốc
 * ngẫu nhiên ngay trên đầu.
 */
function LibraryView({ onRandom }: { onRandom: () => void }) {
  return (
    <TaskShell
      backHref="/sentence"
      backLabel="Quay lại Luyện câu"
      title="Chép chính tả"
      subtitle="Listening dictation practice"
      icon="volume"
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
      <DictationLibrary />
    </TaskShell>
  );
}

// -------------------------------------------------------------------- luyện

function RunningView({
  item,
  index,
  total,
  mode,
  onChangeMode,
  onSubmit,
  onPrev,
}: {
  /**
   * Câu đang luyện. `vi` chỉ có khi câu đến từ một BỘ ĐỀ — bộ đề mang sẵn bản
   * dịch của mình, còn 100 câu của kho cũ tra bản dịch ở bảng `DICTATION_VI`.
   */
  item: DictationItem & { vi?: string };
  index: number;
  total: number;
  mode: InputMode;
  onChangeMode: (m: InputMode) => void;
  onSubmit: (attempt: DictationAttempt) => void;
  /** `undefined` ở câu đầu — không có gì để lùi về. */
  onPrev?: () => void;
}) {
  const [letters, setLetters] = useState('');
  const [freeText, setFreeText] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [liveResult, setLiveResult] = useState(true);
  const [freeChecked, setFreeChecked] = useState(false);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const voices = useEnglishVoices();

  /*
    Chọn giọng mặc định MỘT LẦN, ngay khi danh sách giọng về tới.

    Không đặt trong `useState` khởi tạo: trên web danh sách giọng tới bất đồng
    bộ sau khi trang đã vẽ, nên lúc khởi tạo nó còn rỗng. Cờ `touched` giữ cho
    lựa chọn của người dùng không bị ghi đè ở lần danh sách cập nhật sau.
  */
  const voiceTouched = useRef(false);
  useEffect(() => {
    if (voiceTouched.current || voices.length === 0) return;
    setVoiceId(preferredVoice(voices));
  }, [voices]);

  const inputRef = useRef<TextInput>(null);
  // Cùng lý do như `sessionStartedAt`: đặt mốc trong effect, không gọi lúc render.
  const enteredAt = useRef(0);

  const board = useMemo(() => buildLetterBoard(item.text), [item.text]);
  const grade = useMemo(() => gradeLetters(board.answer, letters), [board.answer, letters]);
  const freeGrade = useMemo(
    () => (freeChecked ? gradeDictation(item.text, freeText) : null),
    [freeChecked, freeText, item.text],
  );

  const done = (mode === 'cells' ? grade.done : freeGrade !== null) || revealed;

  /*
    ĐÚNG CẢ CÂU — khác hẳn "đã điền kín".

    `done` chỉ nói người học đã điền hết ô; điền kín mà sai bốn chữ vẫn là
    `done`. Trước đây pháo giấy và tiếng chuông bám vào `done`, nên một câu sai
    vẫn được ăn mừng y như câu đúng. Ăn mừng sai chỗ còn tệ hơn không ăn mừng:
    nó dạy người học rằng tín hiệu ấy chẳng có nghĩa gì.
  */
  const allCorrect =
    mode === 'cells'
      ? grade.done && grade.correctCount === grade.total
      : freeGrade !== null && freeGrade.accuracy === 1;

  /*
    Game khi học: chấm câu này ĐÚNG MỘT LẦN, ngay lúc câu được phân xử — gõ đúng
    trọn câu (ô chữ) hay bấm chấm (tự gõ) — chứ không đợi bấm sang câu sau. Nhát
    chém phải rơi đúng lúc tia nạp đòn chạm quái.
  */
  const strike = useSentenceStrike(item.id, 'listen');
  useEffect(() => {
    if (revealed) return;
    if (mode === 'cells' && grade.done) strike(true);
    else if (mode === 'free' && freeGrade) strike(freeGrade.accuracy >= 0.8);
  }, [mode, grade.done, freeGrade, revealed, strike]);

  // Hỏi Cú (ô chữ): mở hộ từ đầu tiên chưa đúng. Tự gõ thì không có gì để mở.
  useOwlHint(
    mode === 'cells' && !done
      ? () => {
          const filled = revealNextWord(board, letters);
          if (filled === null) return false;
          setLetters(filled);
          inputRef.current?.focus();
          return true;
        }
      : null,
  );

  useEffect(() => {
    enteredAt.current = Date.now();
    return () => {
      void Speech.stop();
    };
  }, [item.id]);

  const play = useCallback(
    (text: string, speed: number, voice: string | null = voiceId) => {
      Speech.stop();
      setSpeaking(true);
      Speech.speak(text, {
        language: 'en-US',
        rate: speed,
        // Bỏ hẳn khoá `voice` khi chưa chọn, không truyền `undefined`: một số
        // nền tảng coi khoá có mặt là có yêu cầu và trả về lỗi thay vì dùng
        // giọng mặc định.
        ...(voice ? { voice } : {}),
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    },
    [voiceId],
  );

  /*
    Tab = nghe lại. Cùng phím với màn luyện theo video, nên hai màn không dạy
    hai thói quen khác nhau. `preventDefault` vì Tab mặc định nhảy tiêu điểm ra
    khỏi ô nhập ẩn, mà rời ô đó thì mọi phím sau rơi vào hư không.
  */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      /*
        Ctrl + ← lùi một câu.

        KHÔNG bắt phím Ctrl trần dù ảnh tham chiếu ghi vậy: Ctrl trần cũng là nửa
        đầu của Ctrl+C, Ctrl+V, Ctrl+A — bắt nó là cứ sao chép một chữ lại nhảy
        mất câu. Nút ghi đúng tổ hợp thật, không ghi cái nghe gọn hơn.
      */
      if (event.key === 'ArrowLeft' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onPrev?.();
        return;
      }
      if (event.key !== 'Tab') return;
      event.preventDefault();
      play(item.text, rate);
      inputRef.current?.focus();
    };
    // Pha BẮT (true), không phải pha nổi: ô nhập ẩn của react-native-web chặn
    // Enter lại, không cho nổi lên cửa sổ — xem ghi chú ở `LetterGrid`.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [item.text, onPrev, play, rate]);

  const next = () => {
    setRevealed(false);
    const accuracy =
      mode === 'cells'
        ? grade.total > 0
          ? grade.correctCount / grade.total
          : 0
        : (freeGrade?.accuracy ?? 0);
    // Sang câu mà câu này chưa được phân xử (bỏ qua giữa chừng): chấm theo độ chính xác.
    strike(accuracy >= 0.8);
    onSubmit({
      itemId: item.id,
      topic: item.topic,
      typed: mode === 'cells' ? letters : freeText,
      accuracy,
      timeSpentMs: Date.now() - enteredAt.current,
    });
  };

  /*
    Enter = sang câu sau — nút ghi "Enter" từ lâu mà chưa có dòng nào nghe phím
    ấy, nên người học bấm rồi ngồi chờ và tưởng app đơ.

    CHỈ KHI ĐÃ XONG CÂU. Enter giữa chừng mà nhảy câu là mất câu đang gõ dở. Ở
    chế độ tự gõ, Enter lần đầu là CHẤM, lần sau mới sang câu; Shift+Enter vẫn
    xuống dòng như bình thường.

    Không có mảng phụ thuộc: đăng ký lại mỗi lượt vẽ để luôn cầm `next` và
    `done` mới nhất, thay vì giữ một bản cũ chỉ đúng ở câu đầu tiên.
  */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
      if (mode === 'free' && !freeChecked && freeText.trim().length > 0) {
        event.preventDefault();
        setFreeChecked(true);
        return;
      }
      if (!done) return;
      event.preventDefault();
      next();
    };
    // Pha BẮT (true), không phải pha nổi: ô nhập ẩn của react-native-web chặn
    // Enter lại, không cho nổi lên cửa sổ — xem ghi chú ở `LetterGrid`.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  /** Từ nào đã điền đúng trọn vẹn thì mở ra ở bảng luyện phát âm. */
  const solvedWords = useMemo(
    () =>
      board.words.map((word) =>
        word.units.every((u) => u.kind !== 'letter' || grade.states[u.index] === 'correct'),
      ),
    [board.words, grade.states],
  );

  return (
    <TaskShell
      backHref="/sentence"
      backLabel="Quay lại Luyện câu"
      title="Chép chính tả"
      subtitle="Listening dictation practice"
      icon="volume"
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
        {/* --------------------------------------------------------- vùng làm */}
        <View className="lg:flex-1">
          <View className="overflow-hidden rounded-card border border-brand-soft bg-white p-5">
            {allCorrect && !revealed ? <Confetti seed={item.id} /> : null}

            {/*
              THANH TRẬN ĐẤU đặt TRÊN CÙNG, đúng chỗ đường chạy cũ: mặt đất của
              nó là con đường tới đích (còn bao nhiêu câu), còn tia nạp đòn đầy
              dần theo số từ đã chép đúng — đủ câu là chém.
            */}
            <BattleStrip
              className="mb-4"
              step={{ index, total }}
              charge={mode === 'cells' ? { value: solvedWords.filter(Boolean).length, total: board.words.length, unit: 'từ' } : undefined}
            />

            {/* ------------------------------------------------- trình đọc */}
            <View className="flex-row flex-wrap items-center gap-3 rounded-panel bg-paper-canvas p-3.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={speaking ? 'Dừng đọc' : 'Nghe câu'}
                onPress={() => (speaking ? Speech.stop() : play(item.text, rate))}
                className="h-12 w-12 items-center justify-center rounded-pill"
                style={{ backgroundColor: paper.brandMid }}
              >
                <Icon name={speaking ? 'close' : 'play'} size={20} color="#FFFFFF" strokeWidth={2} />
              </Pressable>

              <View className="flex-1">
                <Text className="font-strong text-body text-paper-ink">
                  {speaking ? 'Đang đọc…' : 'Nghe câu'}
                </Text>
                <Text className="font-sans text-label text-paper-muted">
                  Bấm để nghe lại bao nhiêu lần cũng được.
                </Text>
              </View>

              {/* `max-w-full`: không có nó hàng này dài bằng nội dung và tràn khỏi thẻ trên điện thoại, cắt mất nút tốc độ. */}
              <View className="max-w-full flex-row flex-wrap items-center gap-1.5">
                <VoicePicker
                  voices={voices}
                  voiceId={voiceId}
                  onChange={(id) => {
                    voiceTouched.current = true;
                    setVoiceId(id);
                  }}
                  onPreview={(id) => play(item.text, rate, id)}
                />
                {RATES.map((r) => (
                  <Pressable
                    key={r}
                    accessibilityRole="button"
                    onPress={() => {
                      setRate(r);
                      play(item.text, r);
                    }}
                    className="rounded-pill border px-2.5 py-1.5"
                    style={{
                      backgroundColor: rate === r ? paper.brandMid : '#FFFFFF',
                      borderColor: rate === r ? paper.brandMid : paper.brandSoft,
                    }}
                  >
                    <Text
                      className="font-strong text-label"
                      style={{ color: rate === r ? '#FFFFFF' : paper.body }}
                    >
                      {r}×
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ---------------------------------------------- chọn chế độ */}
            <View className="mt-4 flex-row items-center gap-2">
              <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 10 }}>
                Chế độ
              </Text>
              {(
                [
                  ['cells', 'Ô chữ'],
                  ['free', 'Tự gõ'],
                ] as const
              ).map(([key, label]) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === key }}
                  onPress={() => onChangeMode(key)}
                  className="rounded-pill border px-3.5 py-1.5"
                  style={{
                    backgroundColor: mode === key ? paper.brandMid : '#FFFFFF',
                    borderColor: mode === key ? paper.brandMid : paper.brandSoft,
                  }}
                >
                  <Text
                    className="font-strong text-label"
                    style={{ color: mode === key ? '#FFFFFF' : paper.body }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === 'cells' ? (
              <LetterGrid
                answer={board.answer}
                revealed={revealed}
                words={board.words}
                states={grade.states}
                caretAt={letters.length}
                liveResult={liveResult}
                celebrate={allCorrect && !revealed}
                value={letters}
                onChange={(text) => setLetters(sanitizeTyped(text, board.answer.length))}
                inputRef={inputRef}
                onClear={() => setLetters('')}
                hint="Mỗi ô là một chữ cái — Tab để nghe lại"
              />
            ) : (
              <View className="mt-3">
                <TextInput
                  value={freeText}
                  onChangeText={(text) => {
                    setFreeText(text);
                    setFreeChecked(false);
                  }}
                  placeholder="Gõ lại câu bạn vừa nghe…"
                  placeholderTextColor={paper.muted}
                  multiline
                  className="min-h-[96px] rounded-panel border border-brand-soft bg-white p-3.5 font-sans text-bodyLg text-paper-ink"
                />
                {freeGrade ? (
                  <View className="mt-3 rounded-panel bg-paper-canvas p-3.5">
                    <View className="flex-row flex-wrap" style={{ columnGap: 6, rowGap: 4 }}>
                      {freeGrade.tokens.map((t, i) => (
                        <Text
                          key={i}
                          className={
                            t.status === 'correct'
                              ? 'font-sans text-body text-paper-ink'
                              : t.status === 'missing'
                                ? 'font-strong text-body text-danger'
                                : 'font-sans text-body text-warning-ink'
                          }
                          style={
                            t.status === 'extra' ? { textDecorationLine: 'line-through' } : undefined
                          }
                        >
                          {t.word}
                        </Text>
                      ))}
                    </View>
                    <View className="mt-3 flex-row flex-wrap items-center gap-2">
                      <Badge
                        label={`${Math.round(freeGrade.accuracy * 100)}% chính xác`}
                        tone={
                          freeGrade.accuracy >= 0.8
                            ? 'success'
                            : freeGrade.accuracy >= 0.5
                              ? 'warning'
                              : 'danger'
                        }
                      />
                      <Badge label="Thiếu" tone="danger" />
                      <Badge label="Thừa (gạch ngang)" tone="warning" />
                    </View>
                  </View>
                ) : (
                  <Button
                    className="mt-3 self-start"
                    variant="brand"
                    label="Kiểm tra"
                    iconRight="check"
                    onPress={() => setFreeChecked(true)}
                  />
                )}
              </View>
            )}

            {/* ------------------------------------------------- kết thúc */}
            {done ? (
              <View className="mt-4">
                <View className="flex-row items-center gap-2">
                  <Icon
                    name={revealed ? 'info' : 'check'}
                    size={19}
                    color={revealed ? color.subtle : color.success}
                    strokeWidth={2.4}
                  />
                  <Text
                    className={[
                      'font-strong text-bodyLg',
                      revealed ? 'text-muted' : 'text-success-ink',
                    ].join(' ')}
                  >
                    {revealed
                      ? `Đã mở đáp án — bạn tự điền đúng ${grade.correctCount}/${grade.total} chữ cái.`
                      : mode === 'cells'
                        ? 'Bạn xuất sắc — đúng cả câu!'
                        : `Đã chấm: ${Math.round((freeGrade?.accuracy ?? 0) * 100)}% chính xác`}
                  </Text>
                </View>
                <View className="mt-3 rounded-panel bg-paper-canvas p-3.5">
                  <Text className="font-strong text-bodyLg text-paper-ink">{item.text}</Text>
                </View>
              </View>
            ) : null}

            <View className="mt-4 flex-row flex-wrap items-center gap-2">
              {mode === 'cells' ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: liveResult }}
                  onPress={() => setLiveResult((v) => !v)}
                  className="flex-row items-center gap-2 py-1"
                >
                  <View
                    className="h-4 w-4 items-center justify-center rounded-sm border"
                    style={{
                      backgroundColor: liveResult ? paper.brandMid : '#FFFFFF',
                      borderColor: liveResult ? paper.brandMid : paper.brandSoft,
                    }}
                  >
                    {liveResult ? (
                      <Icon name="check" size={11} color="#FFFFFF" strokeWidth={3} />
                    ) : null}
                  </View>
                  <Text className="font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 10 }}>
                    Hiện kết quả ngay
                  </Text>
                </Pressable>
              ) : null}

              {/*
                Nút xem đáp án chỉ hiện khi CHƯA xong. Bày sẵn ngay lúc mới vào
                câu là mời bỏ cuộc trước khi kịp thử.
              */}
              {!done ? (
                <Button
                  variant="brandOutline"
                  size="sm"
                  label="Xem đáp án"
                  iconLeft="info"
                  onPress={() => {
                    strike(false);
                    setRevealed(true);
                  }}
                />
              ) : null}

              <View className="flex-1" />
            </View>

            {/*
              BA NÚT ĐIỀU HƯỚNG, và cả ba đều ghi phím tắt ngay trên mặt nút.

              Trước đây "nghe lại" chỉ có phím Tab và không có nút nào — ai không
              đọc chú thích thì không biết nó tồn tại. Còn lùi lại thì hoàn toàn
              chưa có: nghe hụt một câu là mất luôn câu ấy.
            */}
            <View className="mt-3 flex-row gap-2">
              <NavKey
                label="Câu trước"
                hint="Ctrl ←"
                icon="chevron-left"
                disabled={!onPrev}
                onPress={() => onPrev?.()}
              />
              <NavKey
                label="Nghe lại"
                hint="Tab"
                icon="volume"
                onPress={() => play(item.text, rate)}
              />
              <NavKey
                label={index + 1 === total ? 'Xem kết quả' : 'Câu sau'}
                hint="Enter"
                icon="arrow-right"
                emphasis={done}
                onPress={next}
              />
            </View>
          </View>
        </View>

        {/* ------------------------------------------------------ cột phụ */}
        <View className="gap-4 lg:w-[32%]">
          <View className="rounded-card border border-brand-soft bg-white p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Icon name="chat" size={16} color={paper.brandMid} strokeWidth={2} />
                <Text className="font-strong uppercase tracking-wide text-paper-ink" style={{ fontSize: 11 }}>
                  Dịch nghĩa
                </Text>
              </View>
              <View className="rounded-pill bg-gold-soft px-2 py-0.5">
                <Text className="font-semi uppercase text-paper-body" style={{ fontSize: 9 }}>
                  Tiếng Việt
                </Text>
              </View>
            </View>

            <View className="mt-3 rounded-panel bg-paper-canvas p-3.5">
              {done ? (
                <Text className="font-mid text-body text-paper-ink">
                  “{item.vi ?? DICTATION_VI[item.id] ?? 'Chưa có bản dịch cho câu này.'}”
                </Text>
              ) : (
                <Text className="font-sans text-label uppercase tracking-wide text-paper-muted">
                  Hoàn thành câu để xem bản dịch…
                </Text>
              )}
            </View>
          </View>

          <View className="rounded-card border border-brand-soft bg-white p-4">
            <View className="flex-row items-center gap-2">
              <Icon name="volume" size={16} color={paper.brandMid} strokeWidth={2} />
              <Text className="font-strong uppercase tracking-wide text-paper-ink" style={{ fontSize: 11 }}>
                Luyện phát âm
              </Text>
            </View>
            <Text className="mt-1 font-sans uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
              Bấm vào từ để nghe đọc
            </Text>

            <View className="mt-3 flex-row flex-wrap gap-x-2 gap-y-1.5">
              {board.words.map((word, i) => {
                const text = word.text;
                const open = mode === 'free' ? Boolean(freeGrade) : solvedWords[i];
                if (!open) {
                  return (
                    <Text key={i} className="font-sans text-body tracking-widest text-paper-muted">
                      {'•'.repeat(Math.max(2, Math.min(6, text.length)))}
                    </Text>
                  );
                }
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={`Nghe đọc từ ${text}`}
                    onPress={() => play(text, 0.85)}
                  >
                    <Text
                      className="font-mid text-body"
                      style={{
                        color: paper.brandMid,
                        textDecorationLine: 'underline',
                        textDecorationStyle: 'dotted',
                      }}
                    >
                      {text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </TaskShell>
  );
}

// ------------------------------------------------------------------- kết quả

function SummaryView({
  attempts,
  onRestart,
}: {
  attempts: DictationAttempt[];
  onRestart: () => void;
}) {
  const avg = useMemo(
    () =>
      attempts.length === 0 ? 0 : attempts.reduce((a, b) => a + b.accuracy, 0) / attempts.length,
    [attempts],
  );

  return (
    <TaskShell
      backHref="/sentence"
      backLabel="Quay lại Luyện câu"
      title="Xong buổi luyện"
      subtitle="Listening dictation practice"
      icon="volume"
      tone="paper"
    >
      <View className="items-center rounded-card border border-brand-soft bg-white py-7">
        <Text className="font-heavy text-hero text-paper-ink">{Math.round(avg * 100)}%</Text>
        <Text className="mt-1 font-sans text-body text-paper-muted">
          chính xác trung bình · {attempts.length} câu
        </Text>
      </View>

      <View className="mt-4 rounded-card border border-brand-soft bg-white p-5">
        <Text className="font-strong text-cardTitle text-paper-ink">Từng câu</Text>
        <View className="mt-3 gap-2">
          {attempts.map((a, i) => (
            <View
              key={i}
              className="flex-row items-center justify-between rounded-panel border border-brand-soft p-2.5"
            >
              <Text className="font-sans text-body text-paper-body">Câu {i + 1}</Text>
              <Badge
                label={`${Math.round(a.accuracy * 100)}%`}
                tone={a.accuracy >= 0.8 ? 'success' : a.accuracy >= 0.5 ? 'warning' : 'danger'}
              />
            </View>
          ))}
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button label="Luyện lại" variant="brand" iconLeft="refresh" onPress={onRestart} />
        <Button
          label="Về Luyện câu"
          variant="brandOutline"
          onPress={() => router.replace('/sentence' as never)}
        />
      </View>
    </TaskShell>
  );
}


/**
 * Nút điều hướng có ghi PHÍM TẮT ngay trên mặt.
 *
 * Phím tắt viết trong một dòng chú thích ở đâu đó thì chỉ người đọc chú thích
 * mới biết. Viết lên chính cái nút thì ai bấm chuột vài lần cũng nhận ra, rồi
 * tự chuyển sang dùng phím — mà chuyển được sang phím thì tốc độ làm bài khác
 * hẳn.
 */
function NavKey({
  label,
  hint,
  icon,
  onPress,
  disabled,
  emphasis,
}: {
  label: string;
  hint: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  emphasis?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} (${hint})`}
      disabled={disabled}
      onPress={onPress}
      className="flex-1 items-center rounded-panel px-3 py-2.5"
      style={{
        borderWidth: 1.5,
        borderColor: disabled ? paper.brandSoft : emphasis ? paper.brandMid : paper.brandSoft,
        backgroundColor: emphasis ? paper.brandMid : '#FFFFFF',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Icon
        name={icon}
        size={16}
        strokeWidth={2}
        color={emphasis ? '#FFFFFF' : paper.brandMid}
      />
      <Text
        className="mt-1 font-semi text-label"
        style={{ color: emphasis ? '#FFFFFF' : paper.ink }}
      >
        {label}
      </Text>
      <View
        className="mt-1 rounded-pill px-2 py-0.5"
        style={{ backgroundColor: emphasis ? 'rgba(255,255,255,0.22)' : paper.brandTint }}
      >
        <Text
          className="font-semi"
          style={{ fontSize: 10, color: emphasis ? '#FFFFFF' : paper.body }}
        >
          {hint}
        </Text>
      </View>
    </Pressable>
  );
}
