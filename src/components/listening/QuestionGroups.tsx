import React, { memo, useEffect, useRef } from 'react';
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
 */

const MARKER = /\{\{\s*(\d+)\s*\}\}/g;

export type SetAnswer = (n: number, value: string | string[]) => void;

type Common = { answers: ListeningAnswers; setAnswer: SetAnswer; locked?: boolean };

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
  return (
    <View className="rounded-card border border-border bg-surface p-4" style={{ marginBottom: 16 }}>
      <Text className="font-heavy text-ink" style={{ fontSize: 16 }}>
        {groupTitle(group)}
      </Text>
      <Text className="mt-1 font-sans text-body text-body" style={{ lineHeight: 22 }}>
        {group.instruction}
      </Text>
      {group.wordLimit && !group.instruction.toUpperCase().includes(group.wordLimit.toUpperCase()) ? (
        <Text className="mt-1 font-strong text-label" style={{ color: color.primary, letterSpacing: 0.3 }}>
          {group.wordLimit}
        </Text>
      ) : null}
      <View className="mt-3.5">
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

function GapInput({ n, answers, setAnswer, locked }: { n: number } & Common) {
  const { L } = useL();
  const [focus, setFocus] = React.useState(false);
  const ref = useRef<TextInput>(null);
  // Phím "Tiếp" trên bàn phím nhảy sang ô kế tiếp; ô cuối thì đóng bàn phím.
  useEffect(() => registerGap('listening', n, ref.current), [n]);
  const v = typeof answers[n] === 'string' ? (answers[n] as string) : '';
  return (
    <View
      nativeID={qDomId(n)}
      className="flex-row items-center overflow-hidden rounded-lg"
      style={{
        minWidth: 150,
        minHeight: 44,
        borderWidth: 1.5,
        borderColor: focus ? color.primary : v ? '#CDAB6C' : color.borderStrong,
        backgroundColor: '#FFFFFF',
      }}
    >
      <View style={{ width: 32, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBF7EE' }}>
        <Text className="font-heavy" style={{ fontSize: 13, color: color.primary }}>
          {n}
        </Text>
      </View>
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
          revealOnFocus(ref.current);
        }}
        onBlur={() => setFocus(false)}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        accessibilityLabel={L(`Câu ${n}`, `Question ${n}`)}
        style={{ flex: 1, minWidth: 110, paddingHorizontal: 8, paddingVertical: 8, fontSize: 16, color: color.ink, outlineStyle: 'none' } as never}
      />
    </View>
  );
}

function Segments({ text, ...common }: { text: string } & Common) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(MARKER)) {
    const before = text.slice(last, m.index);
    before.split(/(\s+)/).forEach((w) => {
      if (w) out.push(<Text key={k++} className="font-sans text-body text-ink" style={{ fontSize: 15, lineHeight: 30 }}>{w}</Text>);
    });
    out.push(<GapInput key={k++} n={Number(m[1])} {...common} />);
    last = (m.index ?? 0) + m[0].length;
  }
  text.slice(last).split(/(\s+)/).forEach((w) => {
    if (w) out.push(<Text key={k++} className="font-sans text-body text-ink" style={{ fontSize: 15, lineHeight: 30 }}>{w}</Text>);
  });
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 6 }}>{out}</View>;
}

function GapBody({ group, ...common }: { group: ListeningGroup } & Common) {
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
                  <Text className="font-strong text-ink" style={{ fontSize: 14 }}>{c}</Text>
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
        <Text key={i} className="font-heavy text-ink" style={{ fontSize: 15, marginTop: i ? 8 : 0, marginBottom: 2 }}>
          {line.slice(3)}
        </Text>,
      );
    } else {
      rows.push(<Segments key={i} text={line} {...common} />);
    }
  });
  flushTable('tend');
  return <View style={{ gap: 4 }}>{rows}</View>;
}

// ---------------------------------------------------------------------------
// Chọn một đáp án
// ---------------------------------------------------------------------------

function OptionRow({
  option, on, multi, onPress, disabled,
}: { option: ListeningOption; on: boolean; multi?: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      aria-checked={on}
      disabled={disabled}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-panel border px-3 py-2.5"
      style={{ minHeight: 48, borderColor: on ? color.primary : color.borderStrong, backgroundColor: on ? '#FBF7EE' : '#FFFFFF' }}
    >
      <View
        style={{
          width: 28, height: 28, borderRadius: multi ? 7 : 13, alignItems: 'center', justifyContent: 'center',
          backgroundColor: on ? color.primary : '#F5F1E9',
        }}
      >
        {on && multi ? (
          <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <Text className="font-heavy" style={{ fontSize: 12, color: on ? '#FFFFFF' : color.muted }}>{option.key}</Text>
        )}
      </View>
      <Text className="min-w-0 flex-1 font-sans text-body text-ink" style={{ fontSize: 15, lineHeight: 21 }}>
        {option.text}
      </Text>
    </Pressable>
  );
}

function QuestionLabel({ q, span }: { q: ListeningQuestion; span?: number }) {
  const label = span && span > 1 ? `${q.n}-${q.n + span - 1}` : String(q.n);
  return (
    <View className="mb-2 flex-row items-start gap-2.5">
      <View style={{ minWidth: 28, height: 28, paddingHorizontal: 6, borderRadius: 14, backgroundColor: '#FBF7EE', alignItems: 'center', justifyContent: 'center' }}>
        <Text className="font-heavy" style={{ fontSize: 12, color: color.primary }}>{label}</Text>
      </View>
      {q.prompt ? (
        <Text className="min-w-0 flex-1 font-strong text-ink" style={{ fontSize: 15, lineHeight: 22, paddingTop: 3 }}>
          {q.prompt}
        </Text>
      ) : null}
    </View>
  );
}

function McqOneBody({ group, answers, setAnswer, locked }: { group: ListeningGroup } & Common) {
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

function McqManyBody({ group, answers, setAnswer, locked }: { group: ListeningGroup } & Common) {
  const { L } = useL();
  const opts = group.options ?? [];
  return (
    <View style={{ gap: 18 }}>
      {group.questions.map((q) => {
        const k = coveredNumbers(q).length;
        const picked = Array.isArray(answers[q.n]) ? (answers[q.n] as string[]) : [];
        return (
          <View key={q.n} nativeID={qDomId(q.n)}>
            <QuestionLabel q={q} span={k} />
            <Text className="mb-2 font-mid text-label text-muted">
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

function MatchingBody({ group, answers, setAnswer, locked }: { group: ListeningGroup } & Common) {
  const opts = group.options ?? [];
  return (
    <View>
      <View className="mb-3.5 rounded-panel border border-border p-3" style={{ backgroundColor: '#FCFAF5', gap: 4 }}>
        {opts.map((o) => (
          <View key={o.key} className="flex-row gap-2.5">
            <Text className="font-heavy" style={{ width: 18, color: color.primary, fontSize: 14 }}>{o.key}</Text>
            <Text className="min-w-0 flex-1 font-sans text-ink" style={{ fontSize: 14, lineHeight: 20 }}>{o.text}</Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 12 }}>
        {group.questions.map((q) => (
          <View key={q.n} nativeID={qDomId(q.n)} className="flex-row flex-wrap items-center gap-x-3 gap-y-2">
            <View className="min-w-0 flex-row items-center gap-2.5" style={{ width: 130 }}>
              <QuestionLabel q={q} />
            </View>
            <View className="flex-row flex-wrap gap-1.5">
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
                      setAnswer(q.n, on ? '' : o.key);
                    }}
                    style={{
                      width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
                      borderColor: on ? color.primary : color.borderStrong, backgroundColor: on ? color.primary : '#FFFFFF',
                    }}
                  >
                    <Text className="font-heavy" style={{ fontSize: 14, color: on ? '#FFFFFF' : color.body }}>{o.key}</Text>
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
