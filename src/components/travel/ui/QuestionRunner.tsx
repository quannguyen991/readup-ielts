/**
 * Một lượt câu hỏi của "Du ngoạn Band 9" (địa điểm, hải quan, ôn từ). Hiện lần
 * lượt từng câu, chấm bằng mã (`services/travel/content.ts`), báo đúng/sai kèm
 * đáp án và từ vựng, rồi trả kết quả về cho nơi gọi. Dùng lại bộ ChoiceGrid /
 * đọc to của màn học từ.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ChoiceGrid, GREEN, RED, speak, useHotkeys } from '@/components/vocab/study/StudyKit';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { gradeDictation } from '@/services/sentence/dictation-grade';
import { answerText, isAnswered, isCorrect, type VisitAnswer, type VisitQuestion } from '@/services/travel/content';
import { GameButton, PixelPanel, T } from './kit';

export type RunResult = {
  correct: number;
  total: number;
  answers: { q: VisitQuestion; ok: boolean }[];
};

const TYPE_LABEL: Record<VisitQuestion['type'], [string, string]> = {
  cloze: ['Điền từ', 'Fill the gap'],
  reply: ['Câu đáp', 'Best reply'],
  dictation: ['Nghe chép', 'Dictation'],
  'listen-pick': ['Nghe & chọn', 'Listen & pick'],
  order: ['Sắp xếp câu', 'Word order'],
  translate: ['Dịch câu', 'Translate'],
};

function SpeakBtn({ text, rate, label }: { text: string; rate?: number; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => speak(text, { rate })}
      style={{ minHeight: 44, minWidth: 44, borderRadius: 6, backgroundColor: T.navy, borderWidth: 1, borderColor: T.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 12 }}
    >
      <Icon name="volume" size={20} color={T.goldLight} />
      <Text className="font-strong" style={{ fontSize: 14, color: T.goldLight }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function QuestionRunner({
  questions,
  onAnswer,
  onFinish,
  finishLabel,
}: {
  questions: VisitQuestion[];
  onAnswer?: (q: VisitQuestion, ok: boolean) => void;
  onFinish: (r: RunResult) => void;
  finishLabel?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [log, setLog] = useState<{ q: VisitQuestion; ok: boolean }[]>([]);
  const finished = useRef(false);
  const q = questions[idx];
  if (!q) return null;
  const total = questions.length;
  return (
    <Card
      key={idx}
      q={q}
      idx={idx}
      total={total}
      log={log}
      finishLabel={finishLabel}
      onChecked={(good) => {
        onAnswer?.(q, good);
        setLog((l) => [...l, { q, ok: good }]);
      }}
      onNext={(finalLog) => {
        if (idx + 1 < total) {
          setIdx(idx + 1);
          return;
        }
        if (finished.current) return;
        finished.current = true;
        onFinish({ correct: finalLog.filter((x) => x.ok).length, total, answers: finalLog });
      }}
      questions={questions}
    />
  );
}

function Card({
  q,
  idx,
  total,
  log,
  questions,
  finishLabel,
  onChecked,
  onNext,
}: {
  q: VisitQuestion;
  idx: number;
  total: number;
  log: { q: VisitQuestion; ok: boolean }[];
  questions: VisitQuestion[];
  finishLabel?: string;
  onChecked: (ok: boolean) => void;
  onNext: (log: { q: VisitQuestion; ok: boolean }[]) => void;
}) {
  const { L, en } = useL();
  const [answer, setAnswer] = useState<VisitAnswer>(null);
  const [checked, setChecked] = useState(false);
  const [placed, setPlaced] = useState<number[]>([]);

  // Câu nghe: đọc luôn khi vừa hiện (thẻ được dựng lại cho mỗi câu nhờ `key`).
  useEffect(() => {
    if (q.type === 'listen-pick' || q.type === 'dictation') {
      const text = q.type === 'dictation' ? q.sentence : q.speak;
      const t = setTimeout(() => speak(text), 250);
      return () => clearTimeout(t);
    }
  }, [q]);

  const ok = checked ? isCorrect(q, answer) : false;

  const check = (a: VisitAnswer) => {
    if (checked) return;
    setAnswer(a);
    setChecked(true);
    onChecked(isCorrect(q, a));
  };

  const next = () => {
    if (!checked) return;
    onNext([...log, { q, ok }]);
  };

  useHotkeys((e) => {
    if (!q) return;
    if (e.key === 'Enter') {
      if (checked) {
        e.preventDefault();
        next();
      } else if (q.type === 'dictation' && isAnswered(q, answer)) {
        e.preventDefault();
        check(answer);
      } else if (q.type === 'order' && placed.length === q.tiles.length) {
        e.preventDefault();
        check(placed.map((i) => q.tiles[i]!));
      }
      return;
    }
    if (!checked && 'options' in q && /^[1-4]$/.test(e.key)) check(Number(e.key) - 1);
  });

  const [lv, le] = TYPE_LABEL[q.type];
  const picked = typeof answer === 'number' ? answer : null;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }} accessible accessibilityLabel={`${idx + 1}/${total}`}>
        {questions.map((_, i) => {
          const done = log[i];
          return (
            <View
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                borderWidth: 1.5,
                borderColor: i === idx ? T.navy : T.line,
                backgroundColor: done ? (done.ok ? GREEN : RED) : i === idx ? T.goldLight : 'transparent',
              }}
            />
          );
        })}
        <Text className="font-strong" style={{ fontSize: 14, color: T.muted, marginLeft: 6 }}>
          {idx + 1}/{total}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 10, minHeight: 28, justifyContent: 'center', borderRadius: 4, backgroundColor: T.paperDeep, borderWidth: 1, borderColor: T.line }}>
        <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark }}>
          {en ? le : lv}
        </Text>
      </View>
    </View>
  );

  let body: React.ReactNode = null;

  if (q.type === 'cloze') {
    body = (
      <>
        <Text className="font-sans" style={{ fontSize: 14, color: T.muted, marginBottom: 6 }}>
          {L('Chọn từ hợp với chỗ trống.', 'Pick the word that fits the gap.')}
        </Text>
        <Text className="font-semi" style={{ fontSize: 20, lineHeight: 30, color: T.ink, marginBottom: 16 }}>
          {q.before}
          <Text style={{ color: T.goldDark, backgroundColor: T.paperDeep }}>{checked ? q.answer : ' ______ '}</Text>
          {q.after}
        </Text>
        <ChoiceGrid options={q.options} picked={picked} correctIndex={q.correctIndex} onPick={(i) => check(i)} />
      </>
    );
  } else if (q.type === 'reply') {
    body = (
      <>
        <Text className="font-sans" style={{ fontSize: 14, color: T.muted, fontStyle: 'italic' }}>
          {q.setup}
        </Text>
        {q.line ? (
          <>
            <Text className="font-strong" style={{ fontSize: 13, color: T.goldDark, marginTop: 8 }}>
              {L('Nhân viên nói', 'Staff member says')}
            </Text>
            <Text className="font-semi" style={{ fontSize: 21, lineHeight: 30, color: T.ink, marginTop: 4 }}>
              {'“'}
              {q.line}
              {'”'}
            </Text>
          </>
        ) : null}
        {checked ? (
          <Text className="font-sans" style={{ fontSize: 14, color: T.muted, marginTop: 6, marginBottom: 12 }}>
            {q.gloss}
          </Text>
        ) : (
          <View style={{ height: 12 }} />
        )}
        <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark, marginBottom: 8 }}>
          {L('Chọn câu đáp tự nhiên nhất.', 'Choose the most natural reply.')}
        </Text>
        <ChoiceGrid options={q.options} picked={picked} correctIndex={q.correctIndex} onPick={(i) => check(i)} labels={['A', 'B', 'C', 'D']} />
      </>
    );
  } else if (q.type === 'listen-pick') {
    body = (
      <>
        <Text className="font-sans" style={{ fontSize: 14, color: T.muted, marginBottom: 10 }}>
          {q.mode === 'meaning' ? L('Nghe từ, chọn nghĩa đúng.', 'Listen, then pick the meaning.') : L('Nghe câu, chọn từ bạn nghe thấy.', 'Listen, then pick the word you hear.')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <SpeakBtn text={q.speak} label={L('Nghe', 'Play')} />
          <SpeakBtn text={q.speak} rate={0.6} label={L('Chậm', 'Slow')} />
        </View>
        <ChoiceGrid options={q.options} picked={picked} correctIndex={q.correctIndex} onPick={(i) => check(i)} />
      </>
    );
  } else if (q.type === 'translate') {
    body = (
      <>
        <Text className="font-sans" style={{ fontSize: 14, color: T.muted, marginBottom: 6 }}>
          {L('Chọn bản dịch tiếng Anh đúng.', 'Choose the correct English translation.')}
        </Text>
        <Text className="font-semi" style={{ fontSize: 20, lineHeight: 30, color: T.ink, marginBottom: 16 }}>
          {q.vi}
        </Text>
        <ChoiceGrid options={q.options} picked={picked} correctIndex={q.correctIndex} onPick={(i) => check(i)} />
      </>
    );
  } else if (q.type === 'dictation') {
    const grade = checked && typeof answer === 'string' ? gradeDictation(q.sentence, answer) : null;
    body = (
      <>
        <Text className="font-sans" style={{ fontSize: 14, color: T.muted, marginBottom: 10 }}>
          {L('Nghe và gõ lại cả câu.', 'Listen and type the whole sentence.')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <SpeakBtn text={q.sentence} label={L('Nghe', 'Play')} />
          <SpeakBtn text={q.sentence} rate={0.6} label={L('Chậm', 'Slow')} />
        </View>
        <TextInput
          value={typeof answer === 'string' ? answer : ''}
          onChangeText={(t) => !checked && setAnswer(t)}
          editable={!checked}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          multiline
          accessibilityLabel={L('Câu bạn nghe được', 'The sentence you heard')}
          placeholder={L('Gõ câu bạn nghe được…', 'Type what you hear…')}
          placeholderTextColor="#9A927E"
          style={{ minHeight: 84, borderWidth: 2, borderColor: T.navy, borderRadius: 6, backgroundColor: '#FFFFFF', padding: 12, fontSize: 18, color: T.ink, textAlignVertical: 'top' }}
        />
        {!checked ? (
          <GameButton label={L('Kiểm tra', 'Check')} onPress={() => check(answer)} disabled={!isAnswered(q, answer)} style={{ marginTop: 12 }} />
        ) : grade ? (
          <Text className="font-semi" style={{ fontSize: 17, lineHeight: 28, marginTop: 12 }}>
            {grade.tokens.map((tk, i) => (
              <Text key={i} style={{ color: tk.status === 'correct' ? GREEN : tk.status === 'missing' ? RED : T.muted, textDecorationLine: tk.status === 'extra' ? 'line-through' : 'none' }}>
                {tk.word}{' '}
              </Text>
            ))}
          </Text>
        ) : null}
      </>
    );
  } else if (q.type === 'order') {
    const bank = q.tiles.map((t, i) => ({ t, i })).filter((x) => !placed.includes(x.i));
    const full = placed.length === q.tiles.length;
    const chip = (t: string, onPress: () => void, key: string, state?: 'ok' | 'bad') => (
      <Pressable
        key={key}
        accessibilityRole="button"
        accessibilityLabel={t}
        disabled={checked}
        onPress={onPress}
        style={{
          minHeight: 44,
          paddingHorizontal: 12,
          justifyContent: 'center',
          borderRadius: 6,
          borderWidth: 2,
          borderColor: state === 'ok' ? GREEN : state === 'bad' ? RED : T.navy,
          backgroundColor: state === 'ok' ? T.goodSoft : state === 'bad' ? T.badSoft : '#FFFFFF',
        }}
      >
        <Text className="font-semi" style={{ fontSize: 17, color: T.ink }}>
          {t}
        </Text>
      </Pressable>
    );
    const want = q.sentence.trim().split(/\s+/);
    body = (
      <>
        <Text className="font-sans" style={{ fontSize: 14, color: T.muted, marginBottom: 10 }}>
          {L('Chạm các từ theo đúng thứ tự để ghép thành câu.', 'Tap the words in order to build the sentence.')}
        </Text>
        <View style={{ minHeight: 64, borderBottomWidth: 2, borderColor: T.line, paddingBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {placed.map((ti, k) => {
            const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
            const state = checked ? (norm(q.tiles[ti]!) === norm(want[k] ?? '') ? 'ok' : 'bad') : undefined;
            return chip(q.tiles[ti]!, () => setPlaced((p) => p.filter((x) => x !== ti)), `p${ti}`, state);
          })}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{bank.map((x) => chip(x.t, () => setPlaced((p) => [...p, x.i]), `b${x.i}`))}</View>
        {!checked ? (
          <GameButton
            label={L('Kiểm tra', 'Check')}
            onPress={() => check(placed.map((i) => q.tiles[i]!))}
            disabled={!full}
            style={{ marginTop: 14 }}
          />
        ) : null}
      </>
    );
  }

  const info = q.info;
  const feedback = checked ? (
    <View
      style={{ marginTop: 16, padding: 14, borderRadius: 6, borderWidth: 2, borderColor: ok ? GREEN : RED, backgroundColor: ok ? T.goodSoft : T.badSoft }}
      accessibilityLiveRegion="polite"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={ok ? 'check' : 'close'} size={20} color={ok ? GREEN : RED} />
        <Text className="font-heavy" style={{ fontSize: 17, color: ok ? GREEN : RED }}>
          {ok ? L('Chính xác!', 'Correct!') : L('Chưa đúng', 'Not quite')}
        </Text>
      </View>
      {!ok ? (
        <Text className="font-semi" style={{ fontSize: 16, color: T.ink, marginTop: 6 }}>
          {L('Đáp án: ', 'Answer: ')}
          {answerText(q)}
        </Text>
      ) : null}
      {q.type === 'reply' ? (
        <Text className="font-sans" style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>
          {q.answerVi}
        </Text>
      ) : null}
      {q.type === 'reply' ? (
        <View style={{ marginTop: 10, padding: 10, borderRadius: 6, backgroundColor: T.paperDeep, gap: 6 }}>
          <Text className="font-strong" style={{ fontSize: 14, color: T.goldDark }}>
            {L('Luyện nói · nghe câu mẫu rồi nói lại', 'Speaking practice · listen, then say it aloud')}
          </Text>
          <Text className="font-semi" style={{ fontSize: 16, lineHeight: 23, color: T.ink }}>
            {answerText(q)}
          </Text>
          <SpeakBtn text={answerText(q)} label={L('Nghe câu mẫu', 'Hear the model reply')} />
        </View>
      ) : null}
      {info ? (
        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: T.line }}>
          <Text className="font-strong" style={{ fontSize: 16, color: T.ink }}>
            {info.word} <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>{info.ipa}</Text>
          </Text>
          <Text className="font-sans" style={{ fontSize: 15, color: T.ink }}>
            {info.meaningVi}
          </Text>
          {info.example ? (
            <Pressable onPress={() => speak(info.example)} accessibilityRole="button" accessibilityLabel={L('Nghe câu ví dụ', 'Play the example')} style={{ marginTop: 4 }}>
              <Text className="font-sans" style={{ fontSize: 14, color: T.muted }}>
                {info.example}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <GameButton
        label={idx + 1 < total ? L('Tiếp tục', 'Continue') : (finishLabel ?? L('Xem kết quả', 'See result'))}
        onPress={next}
        style={{ marginTop: 12 }}
      />
    </View>
  ) : null;

  return (
    <PixelPanel inner={{ padding: 16 }}>
      {header}
      {body}
      {feedback}
    </PixelPanel>
  );
}
