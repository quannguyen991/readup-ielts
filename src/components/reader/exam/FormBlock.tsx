import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import type { GeneratedQuestion } from '@/services/questions/types';
import { useL } from '@/i18n/useL';
import { BankGap, GapInput } from './GapInput';
import { EXAM } from './exam-theme';
import { parseFormLine, parseTableRow } from './form-lines';

/**
 * Khuôn điền chỗ trống kiểu đề thật: bảng, sơ đồ quy trình, ghi chú, đoạn tóm tắt,
 * sơ đồ chữ. Cả nhóm chung MỘT khuôn; mỗi ô trống `{{k}}` là câu số `from + k - 1`.
 *
 * Có bảng từ (A–I) thì ô trống thành ô chọn: bấm ô rồi bấm từ, hoặc bấm từ để điền
 * vào ô trống đầu tiên. Không có thì là ô gõ chữ.
 */

type Props = {
  questions: GeneratedQuestion[];
  from: number;
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  activeNumber?: number;
  onActivate?: (number: number) => void;
};

const TEXT = { fontSize: 15.5, lineHeight: 36, color: EXAM.ink } as const;

export function FormBlock({ questions, from, answers, onAnswer, activeNumber, onActivate }: Props) {
  const form = questions[0]?.form;
  const bank = questions[0]?.options && questions[0].options.length > 0 ? questions[0].options : null;
  const [focusK, setFocusK] = useState<number | null>(null);
  const { L } = useL();

  if (!form) return null;

  const byK = (k: number): GeneratedQuestion | undefined => questions[k - 1];
  const valueOf = (k: number) => answers[byK(k)?.id ?? ''] ?? '';
  const setValue = (k: number, v: string) => {
    const q = byK(k);
    if (q) onAnswer(q.id, v);
  };
  const activate = (k: number) => onActivate?.(from + k - 1);

  const pickWord = (word: string) => {
    const used = questions.findIndex((_, i) => valueOf(i + 1) === word);
    if (used !== -1) {
      setValue(used + 1, '');
      return;
    }
    const target = focusK ?? questions.findIndex((_, i) => !valueOf(i + 1)) + 1;
    if (target <= 0 || !byK(target)) return;
    setValue(target, word);
    activate(target);
    setFocusK(null);
  };

  const gap = (k: number) => {
    if (!byK(k)) return null;
    return bank ? (
      <BankGap
        number={from + k - 1}
        value={valueOf(k)}
        focused={focusK === k || activeNumber === from + k - 1}
        onPress={() => {
          if (valueOf(k)) setValue(k, '');
          setFocusK(k);
          activate(k);
        }}
      />
    ) : (
      <GapInput
        number={from + k - 1}
        value={valueOf(k)}
        onChange={(v) => {
          setValue(k, v);
          activate(k);
        }}
        onFocus={() => activate(k)}
        width={118}
      />
    );
  };

  const inlineWrap = Platform.OS === 'web' ? ({ display: 'inline-flex', verticalAlign: 'middle', marginHorizontal: 4 } as object) : { marginHorizontal: 4 };

  /** Một dòng chữ có ô trống nằm trong dòng. */
  const line = (text: string, style: object = TEXT) => (
    <Text style={style}>
      {parseFormLine(text).map((p, i) =>
        'blank' in p ? (
          <View key={i} style={inlineWrap}>
            {gap(p.blank)}
          </View>
        ) : (
          <Text key={i}>{p.text}</Text>
        ),
      )}
    </Text>
  );

  let body: React.ReactNode = null;

  if (form.kind === 'table') {
    const rows = form.lines.map(parseTableRow);
    const width = rows[0]?.length ?? 0;
    const colMin = width >= 4 ? 130 : 110;
    body = (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ borderWidth: 1, borderColor: EXAM.accentLine, borderRadius: 10, overflow: 'hidden', minWidth: '100%' }}>
          {rows.map((cells, r) => (
            <View key={r} style={{ flexDirection: 'row', borderTopWidth: r === 0 ? 0 : 1, borderTopColor: EXAM.accentLine, backgroundColor: r === 0 ? EXAM.accentSoft : EXAM.white }}>
              {cells.map((cell, c) => (
                <View
                  key={c}
                  style={{
                    flex: 1,
                    minWidth: colMin,
                    padding: 10,
                    justifyContent: 'center',
                    borderLeftWidth: c === 0 ? 0 : 1,
                    borderLeftColor: EXAM.accentLine,
                  }}
                >
                  {line(cell, r === 0 ? { fontSize: 13.5, fontWeight: '800', color: EXAM.accentDeep, lineHeight: 20 } : { fontSize: 14.5, lineHeight: 34, color: EXAM.ink })}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  } else if (form.kind === 'flow') {
    body = (
      <View style={{ gap: 4, alignItems: 'stretch' }}>
        {form.lines.map((l, i) => (
          <View key={i}>
            <View style={{ borderWidth: 1.5, borderColor: EXAM.accentLine, borderRadius: 12, backgroundColor: EXAM.white, paddingHorizontal: 14, paddingVertical: 6 }}>
              {line(l)}
            </View>
            {i < form.lines.length - 1 ? (
              <Text style={{ textAlign: 'center', fontSize: 18, lineHeight: 22, color: EXAM.accent, fontWeight: '800' }}>↓</Text>
            ) : null}
          </View>
        ))}
      </View>
    );
  } else if (form.kind === 'notes') {
    body = (
      <View style={{ gap: 2 }}>
        {form.lines.map((l, i) =>
          l.startsWith('## ') ? (
            <Text key={i} style={{ marginTop: i === 0 ? 0 : 10, fontSize: 15, fontWeight: '800', color: EXAM.accentDeep }}>
              {l.slice(3)}
            </Text>
          ) : (
            <View key={i} style={{ flexDirection: 'row', gap: 8, paddingLeft: 6 }}>
              <Text style={{ ...TEXT, color: EXAM.accent }}>•</Text>
              <View style={{ flex: 1 }}>{line(l.replace(/^[-•]\s*/, ''))}</View>
            </View>
          ),
        )}
      </View>
    );
  } else if (form.kind === 'diagram') {
    body = (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {form.lines.map((l, i) => (
          <View
            key={i}
            style={{ flexGrow: 1, flexBasis: 240, borderWidth: 1.5, borderColor: EXAM.accentLine, borderRadius: 12, backgroundColor: EXAM.white, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            {line(l)}
          </View>
        ))}
      </View>
    );
  } else {
    // summary: các dòng nối thành một đoạn văn liền.
    body = (
      <Text style={TEXT}>
        {form.lines.map((l, i) => (
          <Text key={i}>
            {parseFormLine(l).map((p, j) =>
              'blank' in p ? (
                <View key={j} style={inlineWrap}>
                  {gap(p.blank)}
                </View>
              ) : (
                <Text key={j}>{p.text}</Text>
              ),
            )}
            {i < form.lines.length - 1 ? ' ' : ''}
          </Text>
        ))}
      </Text>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {bank ? (
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: EXAM.accentSoft, gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: EXAM.accentDeep }}>{L('Bảng từ', 'Word list')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {bank.map((word, i) => {
              const used = questions.some((_, k) => valueOf(k + 1) === word);
              return (
                <Pressable
                  key={word}
                  onPress={() => pickWord(word)}
                  accessibilityRole="button"
                  aria-pressed={used}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 36,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: used ? EXAM.accent : EXAM.accentLine,
                    backgroundColor: used ? EXAM.accent : EXAM.white,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: used ? '#FFFFFF' : EXAM.accentDeep }}>{String.fromCharCode(65 + i)}</Text>
                  <Text style={{ fontSize: 14.5, fontWeight: '600', color: used ? '#FFFFFF' : EXAM.ink }}>{word}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
      {form.title ? <Text style={{ fontSize: 16, fontWeight: '800', color: EXAM.ink }}>{form.title}</Text> : null}
      {body}
    </View>
  );
}
