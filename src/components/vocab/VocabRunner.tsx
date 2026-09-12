import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';

import { TaskShell } from '@/components/layout/TaskShell';
import { Badge, Button, Icon, PaperCard } from '@/components/ui';
import { getArticleWithBody } from '@/data/articles';
import { gradeDictation } from '@/services/sentence/dictation-grade';
import { buildExercise, type VocabExercise } from '@/services/vocab/exercise';
import { entriesForMode, getVocabMode, type VocabModeId } from '@/services/vocab/modes';
import { useVocabStore, type VocabEntry } from '@/store/useVocabStore';
import { paper } from '@/theme/tokens';

/**
 * Chạy một buổi ôn từ vựng theo chế độ đã chọn.
 *
 * XẾP TỪ THEO LỊCH FSRS TRƯỚC, phần còn lại xáo sau. Sổ từ đã có lịch ôn; bốc
 * ngẫu nhiên đều tay là ném bỏ nó và cho người học gặp lại từ vừa thuộc trong
 * khi từ sắp quên thì nằm im.
 *
 * MỖI LƯỢT MỘT CÁCH CHẤM, và cách chấm quyết định nút bấm hiện ra:
 *
 *   máy chấm  — trắc nghiệm, chép chính tả: chọn/gõ xong là biết đúng sai ngay
 *   tự chấm   — thẻ lật, ngữ cảnh, dịch: lật ra rồi bấm "Nhớ" hay "Quên"
 *
 * CẢ HAI ĐỀU ĐỔ VỀ MỘT CHỖ: `gradeCard` của sổ từ, tức là lịch FSRS. Nếu chế độ
 * máy chấm không ghi vào lịch thì làm trắc nghiệm cả buổi mà lịch ôn đứng yên —
 * người học tưởng mình đã ôn, mà hôm sau vẫn thấy đúng những từ ấy đến hạn.
 */

const SESSION_SIZE = 12;

export function VocabRunner({ mode, onExit }: { mode: VocabModeId; onExit: () => void }) {
  const meta = getVocabMode(mode)!;
  const entriesMap = useVocabStore((s) => s.entries);
  const cards = useVocabStore((s) => s.cards);
  const gradeCard = useVocabStore((s) => s.gradeCard);

  const pool = useMemo(() => Object.values(entriesMap), [entriesMap]);

  /*
    Danh sách CHỐT MỘT LẦN lúc mở màn, bằng `useState` có hàm khởi tạo lười.
    Tính lại theo `cards` thì mỗi lần chấm xong lịch đổi, thứ tự đổi theo, và
    người học nhảy sang một từ khác giữa chừng buổi ôn.

    Không dùng `useRef` rồi gán trong thân hàm: đọc và ghi ref lúc render là
    thứ React nói thẳng là sai, và ở chế độ Strict nó chạy hai lần nên kết quả
    không đoán được.
  */
  const [list] = useState<VocabEntry[]>(() =>
    orderByDue(entriesForMode(pool, mode), cards).slice(0, SESSION_SIZE),
  );

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const entry = list[index];
  const exercise = useMemo(
    () => (entry ? buildExercise(mode, entry, pool, Math.random) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entry?.id, mode],
  );

  const paragraph = useMemo(
    () => (mode === 'translate_paragraph' && entry ? paragraphOf(entry) : null),
    [mode, entry],
  );

  if (!entry || list.length === 0) {
    return (
      <TaskShell backHref="/vocabulary" backLabel="Về sổ từ" title={meta.label} icon="letters">
        <PaperCard className="max-w-[520px]">
          <Text className="font-sans text-body text-paper-body">
            Không còn từ nào dùng được cho cách ôn này.
          </Text>
          <Button className="mt-4" variant="brand" label="Chọn cách khác" onPress={onExit} />
        </PaperCard>
      </TaskShell>
    );
  }

  const advance = (rating: 1 | 2 | 3 | 4, wasCorrect: boolean) => {
    gradeCard(entry.id, cardKindOf(mode), rating);
    if (wasCorrect) setCorrectCount((n) => n + 1);
    if (index + 1 >= list.length) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setRevealed(false);
    setTyped('');
    setPicked(null);
  };

  if (done) {
    return (
      <TaskShell backHref="/vocabulary" backLabel="Về sổ từ" title="Xong buổi ôn" subtitle={meta.label} icon="letters">
        <PaperCard className="items-center py-8">
          <Text className="font-heavy text-hero text-paper-ink">
            {correctCount}/{list.length}
          </Text>
          <Text className="mt-1 font-sans text-body text-paper-muted">
            {meta.grading === 'auto' ? 'câu đúng' : 'từ bạn tự chấm là nhớ'}
          </Text>
        </PaperCard>
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Button variant="onDarkSolid" label="Chọn cách ôn khác" onPress={onExit} />
        </View>
      </TaskShell>
    );
  }

  return (
    <TaskShell
      backHref="/vocabulary"
      backLabel="Về sổ từ"
      title={meta.label}
      subtitle={`${entry.word}${entry.partOfSpeech ? ` · ${entry.partOfSpeech}` : ''}`}
      icon="letters"
      right={
        <View className="rounded-pill bg-white/20 px-3.5 py-1.5">
          <Text className="font-strong text-label text-white">
            {index + 1} / {list.length}
          </Text>
        </View>
      }
    >
      <PaperCard className="max-w-[760px]">
        {exercise ? (
          <Body
            exercise={exercise}
            paragraph={paragraph}
            revealed={revealed}
            typed={typed}
            picked={picked}
            onType={setTyped}
            onPick={(i) => {
              if (picked !== null) return;
              setPicked(i);
              setRevealed(true);
            }}
            onSpeak={() => speak(exerciseSentence(exercise))}
          />
        ) : (
          <Text className="font-sans text-body text-paper-body">
            Từ này thiếu dữ liệu cho cách ôn đang chọn — bỏ qua.
          </Text>
        )}
      </PaperCard>

      <Controls
        exercise={exercise}
        grading={meta.grading}
        revealed={revealed}
        typed={typed}
        picked={picked}
        onReveal={() => setRevealed(true)}
        onAdvance={advance}
      />
    </TaskShell>
  );
}

/* ------------------------------------------------------------------ phần thân */

function Body({
  exercise,
  paragraph,
  revealed,
  typed,
  picked,
  onType,
  onPick,
  onSpeak,
}: {
  exercise: VocabExercise;
  paragraph: string | null;
  revealed: boolean;
  typed: string;
  picked: number | null;
  onType: (t: string) => void;
  onPick: (i: number) => void;
  onSpeak: () => void;
}) {
  switch (exercise.mode) {
    case 'flashcard':
      return (
        <View>
          <Text className="font-heavy text-hero text-paper-ink">{exercise.front}</Text>
          {revealed ? (
            <View className="mt-4">
              <Text className="font-strong text-bodyLg text-brand">{exercise.back}</Text>
              {exercise.context ? (
                <Text className="mt-3 font-sans text-body text-paper-body" style={{ lineHeight: 23 }}>
                  {exercise.context}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text className="mt-3 font-sans text-body text-paper-muted">
              Nhớ nghĩa trong đầu rồi mới lật.
            </Text>
          )}
        </View>
      );

    case 'context':
      return (
        <View>
          <Text className="font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
            {exercise.blanked}
          </Text>
          {revealed ? (
            <View className="mt-4 rounded-panel bg-brand-tint px-4 py-3">
              <Text className="font-strong text-bodyLg text-brand">{exercise.answer}</Text>
              {exercise.meaning ? (
                <Text className="mt-1 font-sans text-body text-paper-body">{exercise.meaning}</Text>
              ) : null}
            </View>
          ) : (
            <Text className="mt-3 font-sans text-body text-paper-muted">
              Đoán nghĩa từ chính câu này trước, rồi mới xem đáp án.
            </Text>
          )}
        </View>
      );

    case 'context_choice':
      return (
        <View>
          <Text className="font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
            {exercise.blanked}
          </Text>
          <Text className="mt-2 font-sans text-label text-paper-muted">
            Chọn từ điền vào chỗ trống.
          </Text>
          <OptionList
            options={exercise.options}
            answerIndex={exercise.answerIndex}
            picked={picked}
            revealed={revealed}
            onPick={onPick}
          />
          {revealed && exercise.meaning ? (
            <View className="mt-3 rounded-panel bg-brand-tint px-4 py-3">
              <Text className="font-strong text-body text-brand">{exercise.answer}</Text>
              <Text className="mt-1 font-sans text-body text-paper-body">{exercise.meaning}</Text>
            </View>
          ) : null}
        </View>
      );

    case 'multiple_choice':
      return (
        <View>
          <Text className="font-heavy text-sectionTitle text-paper-ink">{exercise.prompt}</Text>
          {exercise.context ? (
            <Text className="mt-2 font-sans text-body text-paper-muted" style={{ lineHeight: 22 }}>
              {exercise.context}
            </Text>
          ) : null}
          <OptionList
            options={exercise.options}
            answerIndex={exercise.answerIndex}
            picked={picked}
            revealed={revealed}
            onPick={onPick}
          />
        </View>
      );

    case 'translate_sentence': {
      const text = paragraph ?? exercise.sentence;
      return (
        <View>
          <Text className="font-sans text-bodyLg text-paper-ink" style={{ lineHeight: 28 }}>
            {text}
          </Text>
          <TextInput
            value={typed}
            onChangeText={onType}
            placeholder="Viết bản dịch tiếng Việt của bạn…"
            placeholderTextColor={paper.muted}
            multiline
            className="mt-4 min-h-[110px] rounded-panel border border-brand-soft bg-white px-4 py-3 font-sans text-body text-paper-ink"
            style={{ outlineStyle: 'none' } as never}
          />
          {revealed ? (
            <View className="mt-3 rounded-panel bg-brand-tint px-4 py-3">
              <Text className="font-strong text-label uppercase text-brand">Từ khoá trong câu</Text>
              <Text className="mt-1 font-sans text-body text-paper-body">
                {exercise.entry.word}
                {exercise.wordMeaning ? ` — ${exercise.wordMeaning}` : ''}
              </Text>
              <Text className="mt-2 font-sans text-label text-paper-muted">
                App không chấm bản dịch. Đọc lại bản của bạn, thấy đã sát nghĩa thì bấm Nhớ.
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    case 'dictation': {
      const verdict = revealed ? gradeDictation(exercise.sentence, typed) : null;
      return (
        <View>
          <View className="flex-row flex-wrap items-center gap-3">
            <Button variant="brand" label="Nghe câu" iconLeft="volume" onPress={onSpeak} />
            <Text className="font-sans text-label text-paper-muted">
              Nghe bao nhiêu lần cũng được. Gõ lại đúng câu vừa nghe.
            </Text>
          </View>
          <TextInput
            value={typed}
            onChangeText={onType}
            placeholder="Gõ lại câu bạn nghe được…"
            placeholderTextColor={paper.muted}
            multiline
            className="mt-4 min-h-[90px] rounded-panel border border-brand-soft bg-white px-4 py-3 font-sans text-body text-paper-ink"
            style={{ outlineStyle: 'none' } as never}
          />
          {revealed ? (
            <View className="mt-3 rounded-panel bg-brand-tint px-4 py-3">
              <View className="flex-row items-center gap-2">
                <Icon
                  name={verdict && verdict.accuracy >= 0.95 ? 'check' : 'info'}
                  size={16}
                  color={verdict && verdict.accuracy >= 0.95 ? '#16A34A' : paper.brandMid}
                  strokeWidth={2.2}
                />
                <Text className="font-strong text-body text-paper-ink">
                  Đúng {Math.round((verdict?.accuracy ?? 0) * 100)}%
                </Text>
              </View>
              <Text className="mt-2 font-sans text-body text-paper-body" style={{ lineHeight: 23 }}>
                {exercise.sentence}
              </Text>
            </View>
          ) : null}
        </View>
      );
    }

    default:
      return null;
  }
}

/* ------------------------------------------------------------------- nút bấm */

function Controls({
  exercise,
  grading,
  revealed,
  typed,
  picked,
  onReveal,
  onAdvance,
}: {
  exercise: VocabExercise | null;
  grading: 'auto' | 'self';
  revealed: boolean;
  typed: string;
  picked: number | null;
  onReveal: () => void;
  onAdvance: (rating: 1 | 2 | 3 | 4, wasCorrect: boolean) => void;
}) {
  if (!exercise) {
    return (
      <View className="mt-4">
        <Button variant="onDarkSolid" label="Bỏ qua từ này" onPress={() => onAdvance(1, false)} />
      </View>
    );
  }

  if (exercise.mode === 'multiple_choice' || exercise.mode === 'context_choice') {
    const right = picked === exercise.answerIndex;
    return (
      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        {picked === null ? (
          <Text className="font-sans text-label text-white/80">Chọn một phương án</Text>
        ) : (
          <Button
            variant="onDarkSolid"
            label="Câu tiếp theo"
            iconRight="arrow-right"
            /*
              Chọn đúng = 3 ("good"), chọn sai = 1 ("again"). Không dùng 4
              ("easy") cho trắc nghiệm: bốn phương án thì đoán trúng có xác suất
              25%, mà "easy" giãn lịch ôn xa nhất — thưởng quá tay cho một cú
              đoán may sẽ đẩy từ ấy ra khỏi tầm nhớ.
            */
            onPress={() => onAdvance(right ? 3 : 1, right)}
          />
        )}
      </View>
    );
  }

  if (exercise.mode === 'dictation') {
    return (
      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        {!revealed ? (
          <Button
            variant="onDarkSolid"
            label="Chấm câu này"
            iconRight="check"
            disabled={typed.trim().length === 0}
            onPress={onReveal}
          />
        ) : (
          <DictationNext sentence={exercise.sentence} typed={typed} onAdvance={onAdvance} />
        )}
      </View>
    );
  }

  /* Ba chế độ tự chấm: lật ra, rồi người học tự nói mình nhớ hay quên. */
  return (
    <View className="mt-4 flex-row flex-wrap items-center gap-2">
      {!revealed ? (
        <Button
          variant="onDarkSolid"
          label={exercise.mode === 'flashcard' ? 'Lật thẻ' : 'Xem đáp án'}
          iconRight="chevron-down"
          onPress={onReveal}
        />
      ) : (
        <>
          <Button variant="onDark" label="Quên rồi" onPress={() => onAdvance(1, false)} />
          <Button variant="onDark" label="Hơi khó" onPress={() => onAdvance(2, true)} />
          <Button variant="onDarkSolid" label="Nhớ" onPress={() => onAdvance(3, true)} />
        </>
      )}
      {grading === 'self' && !revealed ? (
        <Text className="font-sans text-label text-white/80">Bạn tự chấm ở bước sau</Text>
      ) : null}
    </View>
  );
}

function DictationNext({
  sentence,
  typed,
  onAdvance,
}: {
  sentence: string;
  typed: string;
  onAdvance: (rating: 1 | 2 | 3 | 4, wasCorrect: boolean) => void;
}) {
  const verdict = gradeDictation(sentence, typed);
  const right = verdict.accuracy >= 0.95;
  return (
    <>
      <Badge label={right ? 'Đúng' : 'Chưa đúng'} tone={right ? 'success' : 'danger'} />
      <Button
        variant="onDarkSolid"
        label="Câu tiếp theo"
        iconRight="arrow-right"
        onPress={() => onAdvance(right ? 3 : 1, right)}
      />
    </>
  );
}

/* -------------------------------------------------------------------- phụ trợ */

/**
 * Chế độ nào ghi vào thẻ FSRS nào.
 *
 * Sáu chế độ nhưng sổ từ chỉ có bốn loại thẻ. Ánh xạ chứ không thêm loại thẻ
 * mới: thêm loại là mọi từ cũ mọc thêm hai thẻ chưa học, và số "đến hạn ôn"
 * nhảy vọt trong một đêm mà người dùng không làm gì cả.
 */
/**
 * Bốn phương án, cả khung bấm được.
 *
 * Dùng chung cho trắc nghiệm nghĩa và điền từ vào chỗ trống: hai chế độ khác
 * nhau ở phần đề bài, còn cách chọn phải giống hệt — người học không nên phải
 * học lại cách bấm ở mỗi chế độ.
 */
function OptionList({
  options,
  answerIndex,
  picked,
  revealed,
  onPick,
}: {
  options: string[];
  answerIndex: number;
  picked: number | null;
  revealed: boolean;
  onPick: (index: number) => void;
}) {
  return (
    <View className="mt-4 gap-2">
      {options.map((option, i) => {
        const isAnswer = i === answerIndex;
        const isPicked = picked === i;
        const tone = !revealed
          ? 'border-brand-soft bg-paper'
          : isAnswer
            ? 'border-success bg-success-soft'
            : isPicked
              ? 'border-danger bg-danger-soft'
              : 'border-brand-soft bg-paper';
        return (
          /*
            CẢ KHUNG bấm được, không chỉ mỗi chữ. Đặt `onPress` lên `Text` thì
            vùng bấm co đúng bằng chữ, và bấm vào phần đệm quanh nó không có gì
            xảy ra — người dùng tưởng app đơ. Dùng `Pressable` với vai `radio`
            cho khớp hai phòng thi SAT.
          */
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: isPicked, disabled: revealed }}
            onPress={() => onPick(i)}
            className={`rounded-panel border px-4 py-3 ${tone}`}
          >
            <Text className="font-sans text-body text-paper-ink">
              {'ABCD'[i]}. {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function cardKindOf(mode: VocabModeId) {
  switch (mode) {
    case 'multiple_choice':
      return 'multiple_choice' as const;
    case 'context':
    case 'context_choice':
      return 'cloze' as const;
    case 'translate_sentence':
    case 'translate_paragraph':
    case 'dictation':
      return 'meaning_to_word' as const;
    default:
      return 'word_to_meaning' as const;
  }
}

/** Xếp từ đến hạn lên trước; từ chưa có thẻ đứng sau, giữ nguyên thứ tự sổ. */
function orderByDue(entries: VocabEntry[], cards: Record<string, { due: string }>): VocabEntry[] {
  const dueAt = (e: VocabEntry) => {
    const mine = Object.entries(cards)
      .filter(([key]) => key.startsWith(`${e.id}:`))
      .map(([, c]) => Date.parse(c.due))
      .filter((n) => Number.isFinite(n));
    return mine.length > 0 ? Math.min(...mine) : Number.POSITIVE_INFINITY;
  };
  return [...entries].sort((a, b) => dueAt(a) - dueAt(b));
}

function exerciseSentence(exercise: VocabExercise): string {
  if (exercise.mode === 'dictation') return exercise.sentence;
  if (exercise.mode === 'translate_sentence') return exercise.sentence;
  return exercise.entry.sourceSentence;
}

function speak(text: string): void {
  Speech.stop();
  Speech.speak(text, { language: 'en-GB', rate: 0.92 });
}

/** Cả đoạn văn chứa từ, lấy từ kho bài đọc. */
function paragraphOf(entry: VocabEntry): string | null {
  if (!entry.articleId || entry.paragraphIndex === null) return null;
  const article = getArticleWithBody(entry.articleId);
  /*
    Dùng `paragraphs` mà kho đã cắt sẵn, không tự tách lại từ `bodyText`: hai
    cách cắt khác nhau thì `paragraphIndex` lưu trong sổ từ trỏ nhầm đoạn, và
    người học được giao một đoạn không chứa từ họ đang ôn.
  */
  return article?.paragraphs?.[entry.paragraphIndex]?.trim() ?? null;
}
