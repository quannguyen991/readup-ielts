import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Appear } from '@/components/motion/Motion';
import { SpeakButton } from '@/components/vocab/study/StudyKit';
import { Icon } from '@/components/ui/Icon';
import { lookupLex, type LexEntry } from '@/data/sat-rw-lexicon';
import { color, paper } from '@/theme/tokens';

/**
 * Từ điển của các phương án, hiện sau khi chọn đáp án ở dạng Từ nối và Từ
 * trong ngữ cảnh. Đáp án đúng mở sẵn đầy đủ; ba phương án còn lại gọn một dòng,
 * bấm để mở — người học thường cần biết VÌ SAO phương án mình chọn sai nghĩa
 * khác, nên phải xem được cả chúng.
 *
 * Dữ liệu viết tay trong `data/sat-rw-lexicon.ts`, không gọi AI.
 */
export function WordNotes({ options, answerIndex }: { options: string[]; answerIndex: number }) {
  const rows = options.map((o, i) => ({ o, i, e: lookupLex(o) })).filter((r): r is { o: string; i: number; e: LexEntry } => !!r.e);
  if (rows.length === 0) return null;
  // Đáp án đúng lên đầu.
  rows.sort((a, b) => Number(b.i === answerIndex) - Number(a.i === answerIndex));
  return (
    <Appear>
      <View className="mt-4">
        <Text className="mb-2 font-strong text-label uppercase tracking-[1.2px]" style={{ color: paper.muted }}>
          Từ vựng trong các phương án
        </Text>
        <View className="gap-2">
          {rows.map((r) => (
            <Entry key={r.o} word={r.o} letter={'ABCD'[r.i]!} entry={r.e} correct={r.i === answerIndex} />
          ))}
        </View>
      </View>
    </Appear>
  );
}

function Entry({ word, letter, entry, correct }: { word: string; letter: string; entry: LexEntry; correct: boolean }) {
  const [open, setOpen] = useState(correct);
  return (
    <View
      className="rounded-panel border p-3.5"
      style={{ borderColor: correct ? '#BBF7D0' : paper.brandSoft, backgroundColor: correct ? '#F0FDF4' : '#FFFFFF' }}
    >
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} className="flex-row items-center gap-2">
        <Text className="font-strong text-label" style={{ color: correct ? color.success : paper.muted }}>
          {letter}
        </Text>
        <Text className="font-heavy text-bodyLg text-paper-ink">{word}</Text>
        <Text className="font-sans text-label" style={{ color: paper.muted }}>
          {entry.logic ? `từ nối · ${entry.logic}` : entry.pos}
        </Text>
        <Text className="min-w-0 flex-1 font-semi text-body text-paper-body" numberOfLines={open ? undefined : 1}>
          · {entry.meaningVi}
        </Text>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} color={paper.muted} />
      </Pressable>

      {open ? (
        <View className="mt-2.5 gap-2">
          <View className="flex-row items-start gap-2">
            <Text className="min-w-0 flex-1 font-sans text-body text-paper-ink" style={{ lineHeight: 22 }}>
              {entry.definitionEn}
            </Text>
            <SpeakButton text={word} size={16} />
          </View>
          <Chips label="Đồng nghĩa" words={entry.synonyms} tone={color.success} bg="#ECFDF3" />
          {entry.antonyms.length > 0 ? (
            <Chips label={entry.logic ? 'Ngược chiều logic' : 'Trái nghĩa'} words={entry.antonyms} tone={color.danger} bg="#FFF1F2" />
          ) : null}
          <View className="rounded-xl px-3 py-2" style={{ backgroundColor: paper.brandTint }}>
            <Text className="font-strong text-label" style={{ color: paper.muted }}>
              Ví dụ
            </Text>
            <Text className="mt-0.5 font-sans text-body italic text-paper-ink">{entry.example}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Chips({ label, words, tone, bg }: { label: string; words: string[]; tone: string; bg: string }) {
  return (
    <View className="flex-row flex-wrap items-center gap-1.5">
      <Text className="mr-1 font-strong text-label" style={{ color: paper.muted }}>
        {label}
      </Text>
      {words.map((w) => (
        <View key={w} className="rounded-pill px-2.5 py-1" style={{ backgroundColor: bg }}>
          <Text className="font-semi text-label" style={{ color: tone }}>
            {w}
          </Text>
        </View>
      ))}
    </View>
  );
}
