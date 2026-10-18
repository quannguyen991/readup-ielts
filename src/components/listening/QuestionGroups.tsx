import React, { createContext, memo, useContext, useEffect, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { coveredNumbers } from '@/services/listening/scoring';
import type { ListeningAnswers, ListeningGroup, ListeningOption, ListeningQuestion } from '@/services/listening/types';
import { playSfx } from '@/services/audio/sfx-ui';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { focusNextGap, registerGap, revealOnFocus } from '@/lib/mobile/gap-focus';

/**
 * Hiển thị các nhóm câu hỏi của một section: điền từ (ghi chú / biểu mẫu /
 * bảng), chọn một đáp án, chọn nhiều đáp án, nối (chọn chữ cái từ danh sách).
 *
 * Giao diện phòng thi: ô điền là số trong khung vuông + đường gạch chân; ô đang
 * làm có viền vàng. Cỡ chữ và kiểu chữ do thanh công cụ chỉnh, truyền qua
 * `ExamTextCtx` để không phải đi qua từng prop.
 */

const MARKER = /\{\{\s*(\d+)\s*\}\}/g;

const INK = '#1F1A14';
const GOLD = '#F2B84B';
const GOLD_SOFT = '#FDF0CF';
const RULE = '#CFC6B4';
const MUTED_INK = '#4A4438';

export type SetAnswer = (n: number, value: string | string[]) => void;

/** Cỡ chữ (px) và kiểu chữ của đề. */
export type ExamText = { size: number; bold: boolean };
export const ExamTextCtx = createContext<ExamText>({ size: 15, bold: false });

type Common = {
  answers: ListeningAnswers;
  setAnswer: SetAnswer;
  locked?: boolean;
  /** Báo câu đang làm (để thanh công cụ viền nổi). Phải là hàm ổn định. */
  onFocusQ?: (n: number) => void;
};

export const qDomId = (n: number) => `lq-${n}`;

export function groupTitle(group: ListeningGroup): string {
  if (group.title) return group.title;
  const nums = group.questions.flatMap(coveredNumbers).sort((a, b) => a - b);
  const a = nums[0];
  const b = nums[nums.length - 1];
  return a === b ? `Question ${a}` : `Questions ${a}-${b}`;
}

// memo: bản thân màn Listening dựng lại ~4 lần/giây theo tiến độ audio; khối câu hỏi chỉ đổi khi đáp án đổi.
export const GroupBlock = memo(function GroupBlock({ group, ...common }: { group: ListeningGroup } & Common) {
  const { size, bold } = useContext(ExamTextCtx);
  return (
    <View style={{ marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: RULE, backgroundColor: '#FFFFFF' }}>
      <Text
        className="font-heavy"
        style={{ alignSelf: 'flex-start', fontSize: size + 1, color: INK, paddingBottom: 2, borderBottomWidth: 2.5, borderColor: GOLD }}
      >
        {groupTitle(group)}
      </Text>
      <Text className={bold ? 'font-mid' : 'font-sans'} style={{ marginTop: 8, fontSize: size - 1, lineHeight: Math.round((size - 1) * 1.5), color: MUTED_INK }}>
        {group.instruction}
      </Text>
      {group.wordLimit && !group.instruction.toUpperCase().includes(group.wordLimit.toUpperCase()) ? (
        <Text className="font-strong" style={{ marginTop: 4, fontSize: size - 2, color: '#8A5A00', letterSpacing: 0.3 }}>
          {group.wordLimit}
        </Text>
      ) : null}
      <View style={{ marginTop: 14 }}>
        {group.type === 'gap' ? <GapBody group={group} {...common} /> : null}
        {group.type === 'mcq-one' ? <McqOneBody group={group} {...common} /> : null}
        {group.type === 'mcq-many' ? <McqManyBody group={group} {...common} /> : null}
        {group.type === 'matching' ? <MatchingBody group={group} {...common} /> : null}
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Điền từ
// ---------------------------------------------------------------------------

function GapInput({ n, answers, setAnswer, locked, onFocusQ }: { n: number } & Common) {
  const { L } = useL();
  const { size } = useContext(ExamTextCtx);
  const [focus, setFocus] = React.useState(false);
  const ref = useRef<TextInput>(null);
  // Phím "Tiếp" trên bàn phím nhảy sang ô kế tiếp; ô cuối thì đóng bàn phím.
  useEffect(() => registerGap('listening', n, ref.current), [n]);
  const v = typeof answers[n] === 'string' ? (answers[n] as string) : '';
  const filled = v.trim() !== '';
  return (
    <View
      nativeID={qDomId(n)}
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '100%', marginVertical: 3 }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: INK,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focus ? GOLD : filled ? GOLD_SOFT : '#FFFFFF',
        }}
      >
        <Text className="font-heavy" style={{ fontSize: 12, color: INK }}>
          {n}
        </Text>
      </View>
      <View
        style={{
          width: 170,
          maxWidth: '100%',
          borderBottomWidth: focus ? 2.5 : 1.5,
          borderColor: focus ? GOLD : INK,
        }}
      >
        <TextInput
          ref={ref}
          value={v}
          editable={!locked}
          onChangeText={(t) => setAnswer(n, t)}
          returnKeyType="next"
          enterKeyHint="next"
          submitBehavior="submit"
          onSubmitEditing={() => focusNextGap('listening', n, ref.current)}
          inputMode="text"
          autoComplete="off"
          onFocus={() => {
            setFocus(true);
            onFocusQ?.(n);
            revealOnFocus(ref.current);
          }}
          onBlur={() => setFocus(false)}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          accessibilityLabel={L(`Câu ${n}`, `Question ${n}`)}
          style={{ width: '100%', paddingHorizontal: 4, paddingVertical: 4, fontSize: size, color: INK, outlineStyle: 'none' } as never}
        />
      </View>
    </View>
  );
}

function Segments({ text, ...common }: { text: string } & Common) {
  const { size, bold } = useContext(ExamTextCtx);
  const wordClass = bold ? 'font-mid' : 'font-sans';
  const wordStyle = { fontSize: size, lineHeight: Math.round(size * 2), color: INK };
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(MARKER)) {
    const before = text.slice(last, m.index);
    before.split(/(\s+)/).forEach((w) => {
      if (w) out.push(<Text key={k++} className={wordClass} style={wordStyle}>{w}</Text>);
    });
    out.push(<GapInput key={k++} n={Number(m[1])} {...common} />);
    last = (m.index ?? 0) + m[0].length;
  }
  text.slice(last).split(/(\s+)/).forEach((w) => {
    if (w) out.push(<Text key={k++} className={wordClass} style={wordStyle}>{w}</Text>);
  });
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 8 }}>{out}</View>;
}

function GapBody({ group, ...common }: { group: ListeningGroup } & Common) {
  const { size } = useContext(ExamTextCtx);
  const lines = group.lines ?? [];
  const rows: React.ReactNode[] = [];
  let table: string[][] = [];
  const flushTable = (key: string) => {
    if (!table.length) return;
    const t = table;
    table = [];
    rows.push(
      <View key={key} style={{ borderWidth: 1, borderColor: color.borderStrong, borderRadius: 10, overflow: 'hidden', marginVertical: 4 }}>
        {t.map((cells, r) => (
          <View key={r} style={{ flexDirection: 'row', borderTopWidth: r ? 1 : 0, borderColor: color.borderStrong, backgroundColor: r === 0 ? '#FBF7EE' : '#FFFFFF' }}>
            {cells.map((c, ci) => (
              <View key={ci} style={{ flex: 1, minWidth: 0, padding: 8, borderLeftWidth: ci ? 1 : 0, borderColor: color.borderStrong }}>
                {r === 0 && !c.includes('{{') ? (
                  <Text className="font-strong" style={{ fontSize: size - 1, color: INK }}>{c}</Text>
                ) : (
                  <Segments text={c} {...common} />
                )}
              </View>
            ))}
          </View>
        ))}
      </View>,
    );
  };
  lines.forEach((line, i) => {
    if (line.trim().startsWith('|')) {
      table.push(line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      return;
    }
    flushTable(`t${i}`);
    if (line.startsWith('## ')) {
      rows.push(
        <Text key={i} className="font-heavy" style={{ fontSize: size, color: INK, marginTop: i ? 10 : 0, marginBottom: 2 }}>
          {line.slice(3)}
        </Text>,
      );
    } else {
      rows.push(<Segments key={i} text={line} {...common} />);
    }
  });
  flushTable('tend');
  return <View style={{ gap: 6 }}>{rows}</View>;
}

// ---------------------------------------------------------------------------
// Chọn một đáp án
// ---------------------------------------------------------------------------

function OptionRow({
  option, on, multi, onPress, disabled,
}: { option: ListeningOption; on: boolean; multi?: boolean; onPress: () => void; disabled?: boolean }) {
  const { size, bold } = useContext(ExamTextCtx);
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      aria-checked={on}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: on ? 2 : 1.5,
        borderColor: on ? INK : RULE,
        backgroundColor: on ? GOLD_SOFT : '#FFFFFF',
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: multi ? 6 : 14,
          borderWidth: 1.5,
          borderColor: INK,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: on ? INK : '#FFFFFF',
        }}
      >
        {on && multi ? (
          <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <Text className="font-heavy" style={{ fontSize: 12, color: on ? '#FFFFFF' : INK }}>{option.key}</Text>
        )}
      </View>
      <Text
        className={bold ? 'font-mid' : 'font-sans'}
        style={{ flexShrink: 1, minWidth: 0, fontSize: size, lineHeight: Math.round(size * 1.4), color: INK }}
      >
        {option.text}
      </Text>
    </Pressable>
  );
}

function QuestionLabel({ q, span }: { q: ListeningQuestion; span?: number }) {
  const { size } = useContext(ExamTextCtx);
  const label = span && span > 1 ? `${q.n}-${q.n + span - 1}` : String(q.n);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
      <View
        style={{
          minWidth: 30,
          height: 26,
          paddingHorizontal: 6,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: INK,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text className="font-heavy" style={{ fontSize: 12, color: INK }}>{label}</Text>
      </View>
      {q.prompt ? (
        <Text className="font-strong" style={{ flexShrink: 1, minWidth: 0, fontSize: size, lineHeight: Math.round(size * 1.45), color: INK, paddingTop: 1 }}>
          {q.prompt}
        </Text>
      ) : null}
    </View>
  );
}

function McqOneBody({ group, answers, setAnswer, locked, onFocusQ }: { group: ListeningGroup } & Common) {
  return (
    <View style={{ gap: 18 }}>
      {group.questions.map((q) => {
        const opts = q.options ?? group.options ?? [];
        return (
          <View key={q.n} nativeID={qDomId(q.n)}>
            <QuestionLabel q={q} />
            <View style={{ gap: 8 }}>
              {opts.map((o) => (
                <OptionRow
                  key={o.key}
                  option={o}
                  on={answers[q.n] === o.key}
                  disabled={locked}
                  onPress={() => {
                    playSfx('tap');
                    onFocusQ?.(q.n);
                    setAnswer(q.n, answers[q.n] === o.key ? '' : o.key);
                  }}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chọn nhiều đáp án
// ---------------------------------------------------------------------------

function McqManyBody({ group, answers, setAnswer, locked, onFocusQ }: { group: ListeningGroup } & Common) {
  const { L } = useL();
  const { size } = useContext(ExamTextCtx);
  const opts = group.options ?? [];
  return (
    <View style={{ gap: 18 }}>
      {group.questions.map((q) => {
        const k = coveredNumbers(q).length;
        const picked = Array.isArray(answers[q.n]) ? (answers[q.n] as string[]) : [];
        return (
          <View key={q.n} nativeID={qDomId(q.n)}>
            <QuestionLabel q={q} span={k} />
            <Text className="font-mid" style={{ marginBottom: 8, fontSize: size - 2, color: '#6B6353' }}>
              {L(`Chọn ${k} đáp án`, `Choose ${k === 2 ? 'TWO' : 'THREE'} answers`)} · {picked.length}/{k}
            </Text>
            <View style={{ gap: 8 }}>
              {opts.map((o) => {
                const on = picked.includes(o.key);
                return (
                  <OptionRow
                    key={o.key}
                    option={o}
                    on={on}
                    multi
                    disabled={locked}
                    onPress={() => {
                      playSfx('tap');
                      onFocusQ?.(q.n);
                      if (on) setAnswer(q.n, picked.filter((x) => x !== o.key));
                      else setAnswer(q.n, [...picked, o.key].slice(-k));
                    }}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Nối
// ---------------------------------------------------------------------------

function MatchingBody({ group, answers, setAnswer, locked, onFocusQ }: { group: ListeningGroup } & Common) {
  const { size, bold } = useContext(ExamTextCtx);
  const opts = group.options ?? [];
  return (
    <View>
      <View style={{ marginBottom: 14, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: RULE, backgroundColor: '#FBF7EE', gap: 4 }}>
        {opts.map((o) => (
          <View key={o.key} style={{ flexDirection: 'row', gap: 10 }}>
            <Text className="font-heavy" style={{ width: 20, color: INK, fontSize: size - 1 }}>{o.key}</Text>
            <Text className={bold ? 'font-mid' : 'font-sans'} style={{ flexShrink: 1, minWidth: 0, fontSize: size - 1, lineHeight: Math.round((size - 1) * 1.4), color: INK }}>
              {o.text}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 12 }}>
        {group.questions.map((q) => (
          <View key={q.n} nativeID={qDomId(q.n)} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 8 }}>
            <View style={{ width: 130, maxWidth: '100%' }}>
              <QuestionLabel q={q} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {opts.map((o) => {
                const on = answers[q.n] === o.key;
                return (
                  <Pressable
                    key={o.key}
                    accessibilityRole="radio"
                    aria-checked={on}
                    accessibilityLabel={`${q.n}: ${o.key}`}
                    disabled={locked}
                    onPress={() => {
                      playSfx('select');
                      onFocusQ?.(q.n);
                      setAnswer(q.n, on ? '' : o.key);
                    }}
                    style={{
                      width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 2 : 1.5,
                      borderColor: INK, backgroundColor: on ? INK : '#FFFFFF',
                    }}
                  >
                    <Text className="font-heavy" style={{ fontSize: 14, color: on ? '#FFFFFF' : INK }}>{o.key}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
