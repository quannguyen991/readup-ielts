import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { EvidenceMarker } from '@/components/reader/EvidenceMarker';
import { FormBlock } from '@/components/reader/exam/FormBlock';
import { GapInput } from '@/components/reader/exam/GapInput';
import { EXAM, parseLegend, roman } from '@/components/reader/exam/exam-theme';
import { LIST_MATCH_TYPES } from '@/services/questions/ielts-types';
import { Icon } from '@/components/ui';
import { QUESTION_TYPE_LABEL, type GeneratedQuestion } from '@/services/questions/types';
import { groupIntoBlocks, optionsFor, type QuestionBlockView } from './QuestionBlocks';
import type { EvidenceMark } from '@/services/proofloop/types';
import { useL } from '@/i18n/useL';

/**
 * Khung câu hỏi của phòng thi Reading, kiểu YouPass: gọn, không viền thẻ.
 *
 * Mỗi khối đứng dưới một dòng "Questions 27 – 30" in đậm, lời dẫn một cỡ chữ nhỏ
 * (TFNG có bảng chú giải hai cột). Mỗi câu là một huy hiệu số + câu hỏi, rồi các
 * dòng chọn phẳng. Dạng điền chỗ trống thì ô điền nằm NGAY trong câu, mang số câu.
 * Việc nộp bài và dải số câu thuộc về thanh đáy của màn chứa, không nằm ở đây.
 */

export type QuestionPanelHandle = {
  /** Toạ độ y (trong nội dung của panel) của câu số `number` (đếm từ 1), nếu đã đo được. */
  positionOf: (number: number) => number | null;
};

type Props = {
  questions: GeneratedQuestion[];
  answers: Record<string, string>;
  marked: Record<string, boolean>;
  onAnswer: (questionId: string, answer: string) => void;
  onToggleMark: (questionId: string) => void;
  /** Số câu (từ 1) đang là câu hiện tại — huy hiệu của nó tô đặc. */
  activeNumber?: number;
  onActivate?: (number: number) => void;
  /**
   * `mixed` = nhánh luyện xen kẽ dạng bài: bỏ lời dẫn khối, mỗi câu tự mang nhãn dạng.
   */
  layout?: 'blocks' | 'mixed';
  /** Các prop ProofLoop đều TUỲ CHỌN: panel còn phục vụ nơi chưa bật ProofLoop. */
  evidenceMarks?: Record<string, EvidenceMark>;
  evidenceFor?: string | null;
  onStartEvidence?: (questionId: string) => void;
  onClearEvidence?: (questionId: string) => void;
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
    evidenceMarks,
    evidenceFor,
    onStartEvidence,
    onClearEvidence,
  },
  ref,
) {
  const { L } = useL();
  const mixed = layout === 'mixed';
  const blocks = useMemo(() => groupIntoBlocks(questions), [questions]);

  // Toạ độ đo được: khối → danh sách câu → câu. Cộng lúc cần (onLayout của con
  // và của cha không có thứ tự cố định nên không cộng sẵn).
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
    return <Text style={{ fontSize: 15, color: EXAM.muted }}>{L('Chưa có câu hỏi nào cho bài này.', 'No questions for this passage yet.')}</Text>;
  }

  return (
    <View style={{ gap: 28 }}>
      {blocks.map((block) => {
        const key = `${block.type}-${block.from}`;

        // Nhóm chung một khuôn (bảng, sơ đồ, ghi chú…, hoặc Choose TWO): cả nhóm là MỘT
        // thành phần, mọi số câu của nó cùng trỏ về toạ độ của thành phần ấy.
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
              {mixed ? null : <BlockHeader block={block} />}
              <View style={{ marginTop: mixed ? 0 : 14 }}>
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
              mixed={mixed}
              answer={answers[question.id] ?? ''}
              marked={Boolean(marked[question.id])}
              active={activeNumber === block.from + i}
              onAnswer={(a) => {
                onActivate?.(block.from + i);
                onAnswer(question.id, a);
              }}
              onToggleMark={() => onToggleMark(question.id)}
              evidenceMark={evidenceMarks?.[question.id]}
              evidenceActive={evidenceFor === question.id}
              onStartEvidence={onStartEvidence ? () => onStartEvidence(question.id) : undefined}
              onClearEvidence={() => onClearEvidence?.(question.id)}
            />
          </View>
        ));

        return (
          <View key={key} onLayout={(e) => (blockY.current[key] = e.nativeEvent.layout.y)}>
            {mixed ? null : <BlockHeader block={block} />}
            <View onLayout={(e) => (listY.current[key] = e.nativeEvent.layout.y)} style={{ gap: mixed ? 22 : 20, marginTop: mixed ? 0 : 14 }}>
              {list}
            </View>
          </View>
        );
      })}
    </View>
  );
});

/* ------------------------------------------------------------ đầu khối câu hỏi */

function BlockHeader({ block }: { block: QuestionBlockView }) {
  const legend = parseLegend(block.rubric);
  const headings = LIST_MATCH_TYPES.has(block.type) ? headingList(block) : null;
  const isHeadingList = block.type === 'matching_headings';
  const listTitle = isHeadingList ? 'List of Headings' : block.type === 'matching_features' ? 'List of Options' : 'List of Endings';
  return (
    <View>
      <Text style={{ fontSize: 19, fontWeight: '800', color: EXAM.ink }}>
        {block.from === block.to ? `Question ${block.from}` : `Questions ${block.from} - ${block.to}`}
      </Text>
      {legend ? (
        <View style={{ marginTop: 8, gap: 6 }}>
          <Text style={{ fontSize: 14, lineHeight: 20, color: EXAM.body }}>{legend.lead}</Text>
          <View style={{ gap: 4, marginTop: 2 }}>
            {legend.rows.map((r) => (
              <View key={r.key} style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ width: 86, fontSize: 13, fontWeight: '800', color: EXAM.ink }}>{r.key}</Text>
                <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: EXAM.body }}>{r.text}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : block.rubric ? (
        <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 20, color: EXAM.body }}>{block.rubric}</Text>
      ) : null}

      {headings ? (
        <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: EXAM.accentSoft, gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: EXAM.accentDeep }}>{listTitle}</Text>
          {headings.map((h, i) => (
            <View key={h} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ width: 28, fontSize: 14, fontWeight: '700', color: EXAM.accentDeep }}>{isHeadingList ? roman(i + 1) : String.fromCharCode(65 + i)}</Text>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: EXAM.ink }}>{h}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Danh sách tiêu đề chung của cả khối nối tiêu đề (đề thật in một lần, dùng cho mọi câu). */
function headingList(block: QuestionBlockView): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of block.questions) {
    for (const o of optionsFor(q) ?? []) {
      if (!seen.has(o)) {
        seen.add(o);
        out.push(o);
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------- một câu */

const BLANK = /_{3,}/;

function QuestionItem({
  question,
  number,
  block,
  mixed,
  answer,
  marked,
  active,
  onAnswer,
  onToggleMark,
  evidenceMark,
  evidenceActive,
  onStartEvidence,
  onClearEvidence,
}: {
  question: GeneratedQuestion;
  number: number;
  block: QuestionBlockView;
  mixed: boolean;
  answer: string;
  marked: boolean;
  active: boolean;
  onAnswer: (answer: string) => void;
  onToggleMark: () => void;
  evidenceMark: EvidenceMark | undefined;
  evidenceActive: boolean;
  onStartEvidence?: () => void;
  onClearEvidence: () => void;
}) {
  const { L } = useL();
  const choices = optionsFor(question);
  const isHeadings = LIST_MATCH_TYPES.has(question.type) && choices !== null;
  const romanLabels = question.type === 'matching_headings';
  // Phương án chỉ là một chữ cái (nối đoạn / nối ý): xếp thành hàng ô vuông.
  const letters = choices !== null && !isHeadings && choices.every((o) => o.length <= 3);
  const prompt = question.prompt.replace(/^[–-]\s*/, '');
  const inline = choices === null && BLANK.test(prompt);

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <NumberBadge n={number} active={active} />
      <View style={{ flex: 1 }}>
        {mixed ? (
          <Text style={{ fontSize: 11.5, fontWeight: '800', color: EXAM.accentDeep, marginBottom: 2 }}>{QUESTION_TYPE_LABEL[question.type]}</Text>
        ) : null}
        {inline ? (
          <InlineGap text={prompt} number={number} value={answer} onChange={onAnswer} />
        ) : (
          <Text style={{ fontSize: 16, lineHeight: 24, color: EXAM.ink, fontWeight: choices && !letters ? '600' : '400' }}>{prompt}</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {answer ? (
          <Pressable onPress={() => onAnswer('')} accessibilityRole="button" accessibilityLabel={L('Xoá đáp án', 'Clear answer')} style={{ minHeight: 32, paddingHorizontal: 6, justifyContent: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: EXAM.muted }}>{L('Xoá', 'Clear')}</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onToggleMark}
          accessibilityRole="button"
          accessibilityLabel={marked ? L('Bỏ đánh dấu', 'Unmark') : L('Đánh dấu xem lại', 'Mark for review')}
          aria-pressed={marked}
          style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="bookmark" size={16} color={marked ? EXAM.flag : '#B8B3A6'} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View>
      {header}
      {onStartEvidence ? (
        <View style={{ paddingLeft: 38 }}>
          <EvidenceMarker mark={evidenceMark} active={evidenceActive} onStart={onStartEvidence} onClear={onClearEvidence} />
        </View>
      ) : null}

      {isHeadings ? (
        <View style={{ paddingLeft: 38, marginTop: 10, gap: 10 }}>
          <HeadingGap number={number} value={answer} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(choices as string[]).map((o, i) => {
              const sel = answer === o;
              const at = headingIndex(block, o, i);
              return <SquareChip key={o} label={romanLabels ? roman(at + 1) : String.fromCharCode(65 + at)} selected={sel} onPress={() => onAnswer(sel ? '' : o)} wide />;
            })}
          </View>
        </View>
      ) : letters ? (
        <View style={{ paddingLeft: 38, marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(choices as string[]).map((o) => (
            <SquareChip key={o} label={o} selected={answer === o} onPress={() => onAnswer(answer === o ? '' : o)} />
          ))}
        </View>
      ) : choices ? (
        <View style={{ paddingLeft: 38, marginTop: 4 }} accessibilityRole="radiogroup">
          {choices.map((o) => (
            <RadioRow key={o} label={o} selected={answer === o} onPress={() => onAnswer(o)} />
          ))}
        </View>
      ) : !inline ? (
        <View style={{ paddingLeft: 38, marginTop: 8 }}>
          <GapInput number={number} value={answer} onChange={onAnswer} width="100%" />
        </View>
      ) : null}
    </View>
  );
}

function headingIndex(block: QuestionBlockView, option: string, fallback: number): number {
  const i = headingList(block).indexOf(option);
  return i === -1 ? fallback : i;
}

/* ------------------------------------------------------------- phần tử nhỏ */

function NumberBadge({ n, active }: { n: number; active: boolean }) {
  return (
    <View
      style={{
        minWidth: 30,
        height: 28,
        paddingHorizontal: 8,
        marginTop: 1,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? EXAM.accent : EXAM.accentSoft,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '800', color: active ? '#FFFFFF' : EXAM.accentDeep }}>{n}</Text>
    </View>
  );
}

function RadioRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      aria-checked={selected}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 9, minHeight: 40 }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          marginTop: 1,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? EXAM.accent : '#C9C4B6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: EXAM.accent }} /> : null}
      </View>
      <Text style={{ flex: 1, fontSize: 15.5, lineHeight: 22, color: EXAM.ink, fontWeight: selected ? '700' : '400' }}>{label}</Text>
    </Pressable>
  );
}

function SquareChip({ label, selected, onPress, wide }: { label: string; selected: boolean; onPress: () => void; wide?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      aria-checked={selected}
      style={{
        minWidth: wide ? 44 : 40,
        height: 40,
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
        minHeight: 40,
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
  const textStyle = { fontSize: 16, lineHeight: 34, color: EXAM.ink } as const;
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
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 9, minHeight: 40 }}
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
