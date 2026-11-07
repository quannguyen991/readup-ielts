import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { FormBlock } from '@/components/reader/exam/FormBlock';
import { GapInput } from '@/components/reader/exam/GapInput';
import { LIST_MATCH_TYPES } from '@/services/questions/ielts-types';
import type { GeneratedQuestion } from '@/services/questions/types';
import { groupIntoBlocks, optionsFor, type QuestionBlockView } from './QuestionBlocks';
import { IeltsLinearExplanation } from '@/components/reader/ielts/IeltsLinearExplanation';

export type QuestionPanelHandle = {
  positionOf: (number: number) => number | null;
};

type Props = {
  questions: GeneratedQuestion[];
  answers: Record<string, string>;
  marked: Record<string, boolean>;
  onAnswer: (questionId: string, answer: string) => void;
  onToggleMark: (questionId: string) => void;
  activeNumber?: number;
  onActivate?: (number: number) => void;
  layout?: 'blocks' | 'mixed';
  isReviewMode?: boolean;
  gradedResults?: Record<string, boolean>;
  paragraphs?: string[];
  locateEvidence?: boolean;
  onToggleLocateEvidence?: (val: boolean) => void;
};

export const QuestionPanel = forwardRef<QuestionPanelHandle, Props>(function QuestionPanel(
  {
    questions,
    answers,
    marked,
    onAnswer,
    onToggleMark,
    activeNumber,
    onActivate,
    layout = 'blocks',
    isReviewMode = false,
    gradedResults = {},
    paragraphs = [],
    locateEvidence = true,
    onToggleLocateEvidence = () => {},
  },
  ref,
) {
  const blocks = useMemo(() => groupIntoBlocks(questions), [questions]);

  const cb = useRef({ onAnswer, onToggleMark, onActivate });
  useEffect(() => {
    cb.current = { onAnswer, onToggleMark, onActivate };
  });

  const answerOne = useCallback((id: string, number: number, a: string) => {
    cb.current.onActivate?.(number);
    cb.current.onAnswer(id, a);
  }, []);

  const blockY = useRef<Record<string, number>>({});
  const listY = useRef<Record<string, number>>({});
  const itemY = useRef<Record<number, { key: string; y: number }>>({});

  useImperativeHandle(ref, () => ({
    positionOf: (number) => {
      const it = itemY.current[number];
      if (!it) return null;
      return (blockY.current[it.key] ?? 0) + (listY.current[it.key] ?? 0) + it.y;
    },
  }));

  if (questions.length === 0) {
    return (
      <View className="items-center py-12">
        <Text className="text-sm text-gray-400">Chưa có câu hỏi nào cho bài này.</Text>
      </View>
    );
  }

  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <View className="gap-6 pb-12">
      {blocks.map((block) => {
        const key = `${block.type}-${block.from}`;
        const isForm = block.groupId !== undefined && block.questions[0]?.form !== undefined;
        const isMulti = block.groupId !== undefined && block.type === 'multiple_choice_multi';

        if (isForm || isMulti) {
          return (
            <View
              key={key}
              onLayout={(e) => {
                blockY.current[key] = e.nativeEvent.layout.y;
                for (let n = block.from; n <= block.to; n += 1) itemY.current[n] = { key, y: 0 };
                listY.current[key] = 0;
              }}
            >
              <BlockHeader block={block} />
              <View className="mt-3">
                {isForm ? (
                  <FormBlock
                    questions={block.questions}
                    from={block.from}
                    answers={answers}
                    onAnswer={onAnswer}
                    activeNumber={activeNumber}
                    onActivate={onActivate}
                  />
                ) : (
                  <MultiChoiceBlock
                    block={block}
                    answers={answers}
                    activeNumber={activeNumber}
                    onActivate={onActivate}
                    onAnswer={onAnswer}
                  />
                )}
              </View>
            </View>
          );
        }

        const list = block.questions.map((question, i) => (
          <View
            key={question.id}
            onLayout={(e) => {
              itemY.current[block.from + i] = { key, y: e.nativeEvent.layout.y };
            }}
          >
            <QuestionItem
              question={question}
              number={block.from + i}
              block={block}
              answer={answers[question.id] ?? ''}
              active={activeNumber === block.from + i}
              onAnswer={answerOne}
              isReviewMode={isReviewMode}
              isCorrect={gradedResults[question.id] ?? false}
              paragraphs={paragraphs}
              locateEvidence={locateEvidence}
              onToggleLocateEvidence={onToggleLocateEvidence}
            />
          </View>
        ));

        return (
          <View key={key} onLayout={(e) => (blockY.current[key] = e.nativeEvent.layout.y)}>
            <BlockHeader block={block} />
            <View
              onLayout={(e) => (listY.current[key] = e.nativeEvent.layout.y)}
              className="gap-3.5 mt-3"
            >
              {list}
            </View>
          </View>
        );
      })}

      {/* End of Passage indicator */}
      <View className="items-center py-6 border-t border-gray-100 mt-4">
        <Text className="text-gray-300 font-bold text-lg mb-1.5">···</Text>
        <Text className="text-sm font-bold text-gray-800">
          Hết câu hỏi của Passage 1
        </Text>
        {!isReviewMode && unansweredCount > 0 ? (
          <Text className="text-xs text-gray-500 mt-1">
            Bạn còn {unansweredCount} câu chưa trả lời ở phần này. Hãy hoàn thành bài của mình nhé!
          </Text>
        ) : (
          <Text className="text-xs text-emerald-600 font-medium mt-1">
            {isReviewMode
              ? 'Đã xem hết các câu hỏi của phần này.'
              : 'Bạn đã hoàn thành các câu hỏi của phần này!'}
          </Text>
        )}
      </View>
    </View>
  );
});

/* -------------------------------- Block Header (Question 1 - 6  Choose TRUE/FALSE/NOT GIVEN) */

function BlockHeader({ block }: { block: QuestionBlockView }) {
  const rangeText = block.from === block.to ? `Question ${block.from}` : `Question ${block.from} - ${block.to}`;

  // Format instruction: bold keywords like TRUE/FALSE/NOT GIVEN, ONE WORD ONLY, etc.
  let instruction = block.rubric || 'Choose TRUE/FALSE/NOT GIVEN';
  if (block.type === 'true_false_not_given') {
    instruction = 'Choose TRUE/FALSE/NOT GIVEN';
  } else if (block.type === 'yes_no_not_given') {
    instruction = 'Choose YES/NO/NOT GIVEN';
  }

  return (
    <View className="flex-row items-center gap-3 mb-1">
      {/* Gold capsule pill */}
      <View className="rounded-full bg-gold-soft border border-gold px-3 py-1 items-center justify-center">
        <Text className="text-[12px] font-bold text-[#8A6100] leading-none">
          {rangeText}
        </Text>
      </View>

      {/* Instruction text on the same line */}
      <Text className="text-[13px] text-gray-800 font-normal">
        {instruction.includes('TRUE/FALSE/NOT GIVEN') ? (
          <>
            Choose <Text className="font-bold text-gray-900">TRUE/FALSE/NOT GIVEN</Text>
          </>
        ) : instruction.includes('YES/NO/NOT GIVEN') ? (
          <>
            Choose <Text className="font-bold text-gray-900">YES/NO/NOT GIVEN</Text>
          </>
        ) : (
          <Text className="font-semibold text-gray-900">{instruction}</Text>
        )}
      </Text>
    </View>
  );
}

/* -------------------------------- Single Question Card -------------------------------- */

const BLANK = /_{3,}/;

const QuestionItem = memo(function QuestionItem({
  question,
  number,
  block,
  answer,
  active,
  onAnswer,
  isReviewMode = false,
  isCorrect = false,
  paragraphs = [],
  locateEvidence = true,
  onToggleLocateEvidence = () => {},
}: {
  question: GeneratedQuestion;
  number: number;
  block: QuestionBlockView;
  answer: string;
  active: boolean;
  onAnswer: (questionId: string, number: number, answer: string) => void;
  isReviewMode?: boolean;
  isCorrect?: boolean;
  paragraphs?: string[];
  locateEvidence?: boolean;
  onToggleLocateEvidence?: (val: boolean) => void;
}) {
  const qid = question.id;
  const setAnswer = useCallback((a: string) => onAnswer(qid, number, a), [onAnswer, qid, number]);
  const pick = useCallback(
    (a: string) => {
      if (isReviewMode) return;
      onAnswer(qid, number, a);
    },
    [onAnswer, qid, number, isReviewMode],
  );

  const choices = optionsFor(question);
  const prompt = question.prompt.replace(/^[–-]\s*/, '').replace(/^\d+\.\s*/, '');
  const inline = choices === null && BLANK.test(prompt);

  // In the user's screenshot: Clean white card, border-gray-200, rounded-2xl
  const cardBorder = isReviewMode
    ? isCorrect
      ? 'border-[#86EFAC] bg-white'
      : 'border-[#FCA5A5] bg-white'
    : active
      ? 'border-blue-400 bg-white ring-1 ring-blue-100'
      : 'border-[#E5E7EB] bg-white';

  return (
    <View
      className={`rounded-2xl border p-5 bg-white transition-all ${cardBorder}`}
      style={{
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      {/* Question Prompt: Number in BLUE + bold text */}
      <View className="flex-row items-start mb-3.5">
        <Text className="text-[14px] leading-relaxed">
          <Text className="font-bold text-[#2563EB]">{number}. </Text>
          {inline && !isReviewMode ? (
            <InlineGap text={prompt} number={number} value={answer} onChange={setAnswer} />
          ) : (
            <Text className="font-bold text-[#111827]">{prompt}</Text>
          )}
        </Text>
      </View>

      {/* Choices Area */}
      {isReviewMode ? (
        // REVIEW MODE: Red strip for wrong user pick, Green strip for correct answer
        <View className="gap-2">
          {choices ? (
            choices.map((o) => {
              const isUserChoice = answer.trim().toLowerCase() === o.trim().toLowerCase();
              const isRightChoice = question.correctAnswer.trim().toLowerCase() === o.trim().toLowerCase();

              if (isUserChoice && !isCorrect) {
                // WRONG: full soft red strip with ✕ badge
                return (
                  <View
                    key={o}
                    className="flex-row items-center gap-2.5 rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] px-3.5 py-2.5"
                  >
                    <View className="h-4 w-4 rounded-full bg-[#DC2626] items-center justify-center">
                      <Text className="text-[10px] font-black text-white leading-none">✕</Text>
                    </View>
                    <Text className="text-[13.5px] font-semibold text-[#B91C1C] flex-1">{o}</Text>
                  </View>
                );
              }

              if (isRightChoice) {
                // CORRECT: full soft green strip with ✓ badge
                return (
                  <View
                    key={o}
                    className="flex-row items-center gap-2.5 rounded-lg border border-[#86EFAC] bg-[#DCFCE7] px-3.5 py-2.5"
                  >
                    <View className="h-4 w-4 rounded-full bg-[#16A34A] items-center justify-center">
                      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 6L9 17l-5-5" />
                      </Svg>
                    </View>
                    <Text className="text-[13.5px] font-semibold text-[#15803D] flex-1">{o}</Text>
                  </View>
                );
              }

              // Neutral unselected choice
              return (
                <View key={o} className="flex-row items-center gap-2.5 px-3.5 py-2 opacity-60">
                  <View className="h-[17px] w-[17px] rounded-full border border-gray-300" />
                  <Text className="text-[13.5px] text-gray-600">{o}</Text>
                </View>
              );
            })
          ) : (
            // Text fill review
            <View className="gap-2">
              <View
                className={`flex-row items-center gap-2 rounded-lg border px-3 py-2.5 ${
                  isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
                }`}
              >
                <Text className="text-xs font-bold text-gray-500">Bạn điền:</Text>
                <Text className={`text-[13.5px] font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {answer || '(Bỏ trống)'}
                </Text>
                {isCorrect ? (
                  <Text className="text-xs text-emerald-600 font-bold ml-auto">✓ Đúng</Text>
                ) : (
                  <Text className="text-xs text-rose-600 font-bold ml-auto">✕ Sai</Text>
                )}
              </View>

              {!isCorrect ? (
                <View className="flex-row items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5">
                  <Text className="text-xs font-bold text-gray-500">Đáp án đúng:</Text>
                  <Text className="text-[13.5px] font-bold text-emerald-700">{question.correctAnswer}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Render Linear Explanation */}
          <IeltsLinearExplanation
            question={question}
            questionNumber={number}
            userAnswer={answer}
            isCorrect={isCorrect}
            paragraphs={paragraphs}
            locateEvidence={locateEvidence}
            onToggleLocateEvidence={onToggleLocateEvidence}
          />
        </View>
      ) : (
        // TEST MODE: Exact radio circle matching Image 1
        <View className="gap-2.5">
          {choices ? (
            choices.map((o) => {
              const selected = answer === o;
              return (
                <Pressable
                  key={o}
                  onPress={() => pick(o)}
                  accessibilityRole="radio"
                  aria-checked={selected}
                  className="flex-row items-center gap-2.5 py-1 select-none hover:opacity-85"
                >
                  <View
                    className={`h-[18px] w-[18px] rounded-full border items-center justify-center ${
                      selected ? 'border-[#3B82F6]' : 'border-gray-300'
                    }`}
                  >
                    {selected ? <View className="h-2 w-2 rounded-full bg-[#3B82F6]" /> : null}
                  </View>
                  <Text className="text-[13.5px] text-gray-700 font-normal">
                    {o}
                  </Text>
                </Pressable>
              );
            })
          ) : !inline ? (
            <View className="mt-2">
              <GapInput number={number} value={answer} onChange={setAnswer} width="100%" />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
});

function InlineGap({
  text,
  number,
  value,
  onChange,
}: {
  text: string;
  number: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const [before, ...rest] = text.split(BLANK);
  const after = rest.join(' ________ ');
  return (
    <Text className="text-[14px] text-gray-900 leading-loose">
      {before}
      <View
        style={
          Platform.OS === 'web'
            ? ({ display: 'inline-flex', verticalAlign: 'middle', marginHorizontal: 4 } as object)
            : { marginHorizontal: 4 }
        }
      >
        <GapInput number={number} value={value} onChange={onChange} />
      </View>
      {after}
    </Text>
  );
}

function MultiChoiceBlock({
  block,
  answers,
  activeNumber,
  onActivate,
  onAnswer,
}: {
  block: QuestionBlockView;
  answers: Record<string, string>;
  activeNumber?: number;
  onActivate?: (number: number) => void;
  onAnswer: (questionId: string, answer: string) => void;
}) {
  const members = block.questions;
  const options = members[0]?.options ?? [];
  const picked = members.map((m) => answers[m.id] ?? '').filter(Boolean);

  const write = (next: string[]) => {
    const ordered = [...next].sort((a, b) => options.indexOf(a) - options.indexOf(b));
    members.forEach((m, i) => onAnswer(m.id, ordered[i] ?? ''));
  };

  const toggle = (opt: string) => {
    onActivate?.(block.from + Math.min(picked.length, members.length - 1));
    if (picked.includes(opt)) return write(picked.filter((p) => p !== opt));
    const next = picked.length >= members.length ? [...picked.slice(1), opt] : [...picked, opt];
    write(next);
  };

  return (
    <View className="gap-2 rounded-2xl border border-gray-200 bg-white p-5">
      <View className="flex-row items-start gap-2 mb-2">
        <Text className="text-[14px] font-bold text-[#2563EB]">
          {block.from} - {block.to}.
        </Text>
        <Text className="flex-1 text-[13.5px] font-bold text-gray-900">
          {members[0]?.prompt}
        </Text>
      </View>

      <View className="gap-2 mt-1">
        {options.map((o, i) => {
          const on = picked.includes(o);
          return (
            <Pressable
              key={o}
              onPress={() => toggle(o)}
              className="flex-row items-center gap-2.5 py-1"
            >
              <View
                className={`h-4 w-4 rounded-sm border items-center justify-center ${
                  on ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}
              >
                {on ? <Text className="text-[10px] font-bold text-white">✓</Text> : null}
              </View>
              <Text className="text-xs font-bold text-gray-500 w-4">{String.fromCharCode(65 + i)}</Text>
              <Text className="text-[13.5px] text-gray-700">{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SquareChip({ label, selected, onPress, wide }: { label: string; selected: boolean; onPress: () => void; wide?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      aria-checked={selected}
      style={{
        minWidth: 44,
        height: 44,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: selected ? EXAM.accent : EXAM.accentLine,
        backgroundColor: selected ? EXAM.accent : EXAM.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '800', color: selected ? '#FFFFFF' : EXAM.accentDeep }}>{label}</Text>
    </Pressable>
  );
}

/** Ô trống của nối tiêu đề: thanh có số câu, hiện tiêu đề đã chọn khi có. */
function HeadingGap({ number, value }: { number: number; value: string }) {
  return (
    <View
      style={{
        minHeight: 44,
        borderRadius: 10,
        borderWidth: 1.5,
        borderStyle: value ? 'solid' : 'dashed',
        borderColor: value ? EXAM.accent : EXAM.accentLine,
        backgroundColor: value ? EXAM.accentSoft : '#FBF9F4',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text style={{ fontSize: 14.5, lineHeight: 20, fontWeight: value ? '600' : '800', color: value ? EXAM.ink : EXAM.accentDeep, textAlign: value ? 'left' : 'center' }}>
        {value || number}
      </Text>
    </View>
  );
}

/** Câu có chỗ trống ________: ô điền nằm ngay trong câu, giữa hai nửa chữ. */
function InlineGap({ text, number, value, onChange }: { text: string; number: number; value: string; onChange: (v: string) => void }) {
  const [before, ...rest] = text.split(BLANK);
  const after = rest.join(' ________ ');
  const textStyle = { fontSize: 16, lineHeight: 48, color: EXAM.ink } as const;
  return (
    <Text style={textStyle}>
      {before}
      <View style={Platform.OS === 'web' ? ({ display: 'inline-flex', verticalAlign: 'middle', marginHorizontal: 4 } as object) : { marginHorizontal: 4 }}>
        <GapInput number={number} value={value} onChange={onChange} />
      </View>
      {after}
    </Text>
  );
}

/* ------------------------------------------------------- chọn nhiều đáp án */

/**
 * "Choose TWO letters": MỘT bảng phương án, người học tích đủ n ô. Mỗi ô tích đã
 * chiếm một số câu của nhóm (câu 21 và 22 chung một danh sách), nên huy hiệu số
 * câu sáng lên theo số ô đã tích. Tích quá n ô thì ô cũ nhất bị thay.
 */
function MultiChoiceBlock({
  block,
  answers,
  activeNumber,
  onActivate,
  onAnswer,
}: {
  block: QuestionBlockView;
  answers: Record<string, string>;
  activeNumber?: number;
  onActivate?: (number: number) => void;
  onAnswer: (questionId: string, answer: string) => void;
}) {
  const { L } = useL();
  const members = block.questions;
  const options = members[0]?.options ?? [];
  const picked = members.map((m) => answers[m.id] ?? '').filter(Boolean);

  const write = (next: string[]) => {
    // Theo thứ tự phương án cho gọn; ô còn thừa để trống.
    const ordered = [...next].sort((a, b) => options.indexOf(a) - options.indexOf(b));
    members.forEach((m, i) => onAnswer(m.id, ordered[i] ?? ''));
  };

  const toggle = (opt: string) => {
    onActivate?.(block.from + Math.min(picked.length, members.length - 1));
    if (picked.includes(opt)) return write(picked.filter((p) => p !== opt));
    const next = picked.length >= members.length ? [...picked.slice(1), opt] : [...picked, opt];
    write(next);
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ gap: 4 }}>
          {members.map((m, i) => {
            const filled = i < picked.length;
            const current = activeNumber === block.from + i;
            return (
              <View
                key={m.id}
                style={{
                  minWidth: 30,
                  height: 28,
                  paddingHorizontal: 8,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filled || current ? EXAM.accent : EXAM.accentSoft,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: filled || current ? '#FFFFFF' : EXAM.accentDeep }}>{block.from + i}</Text>
              </View>
            );
          })}
        </View>
        <Text style={{ flex: 1, fontSize: 16, lineHeight: 24, fontWeight: '600', color: EXAM.ink }}>{members[0]?.prompt}</Text>
      </View>
      <View style={{ paddingLeft: 40 }} accessibilityRole="list">
        {options.map((o, i) => {
          const on = picked.includes(o);
          return (
            <Pressable
              key={o}
              onPress={() => toggle(o)}
              accessibilityRole="checkbox"
              aria-checked={on}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 11, minHeight: 44 }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  marginTop: 1,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: on ? EXAM.accent : '#C9C4B6',
                  backgroundColor: on ? EXAM.accent : EXAM.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on ? <Icon name="check" size={13} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              <Text style={{ width: 20, fontSize: 15, fontWeight: '800', color: EXAM.accentDeep }}>{String.fromCharCode(65 + i)}</Text>
              <Text style={{ flex: 1, fontSize: 15.5, lineHeight: 22, color: EXAM.ink, fontWeight: on ? '700' : '400' }}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ paddingLeft: 40, fontSize: 12.5, color: EXAM.muted }}>
        {L(`Chọn ${members.length} đáp án (đã chọn ${picked.length}).`, `Choose ${members.length} answers (${picked.length} selected).`)}
      </Text>
    </View>
  );
}
