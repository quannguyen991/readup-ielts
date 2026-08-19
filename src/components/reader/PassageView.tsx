import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { hasActiveSelection } from './useTextSelection';
import { highlightColors, wordStatusColor, type HighlightColorKey } from '@/theme/tokens';
import { lemmatize } from '@/services/dictionary/lookup';
import type { Highlight } from '@/store/useReaderStore';
import type { WordStatusKind } from '@/types/database';

/**
 * Khối bài đọc: đánh số đoạn, chạm vào từ để tra, giữ lâu để giải thích cả câu,
 * và tô sẵn những từ đã lưu ở bài trước.
 */

export type PassageViewProps = {
  paragraphs: string[];
  fontScale: number;
  highlights: Highlight[];
  /** Trạng thái của từ theo lemma, để tô màu 5 mức. */
  statusOf: (lemma: string) => WordStatusKind;
  onWordPress: (word: string, sentence: string, paragraphIndex: number) => void;
  onSentenceLongPress: (sentence: string, paragraphIndex: number) => void;
  /** Đang ở chế độ chọn cụm: chạm từ đầu rồi chạm từ cuối. */
  phraseMode: boolean;
  phraseAnchor: { paragraphIndex: number; tokenIndex: number } | null;
  onPhraseToken: (paragraphIndex: number, tokenIndex: number, token: string) => void;
  /** Đoạn đang được đọc to bởi text-to-speech. */
  speakingParagraph: number | null;
};

type Token = { text: string; isWord: boolean; start: number; end: number };

/**
 * Id của khối bài đọc trong DOM. `useTextSelection` dựa vào nó để biết vùng bôi
 * đen nằm trong bài chứ không phải ở sidebar hay panel câu hỏi.
 */
export const PASSAGE_CONTAINER_ID = 'passage-body';

export function PassageView({
  paragraphs,
  fontScale,
  highlights,
  statusOf,
  onWordPress,
  onSentenceLongPress,
  phraseMode,
  phraseAnchor,
  onPhraseToken,
  speakingParagraph,
}: PassageViewProps) {
  return (
    <View className="gap-4" nativeID={PASSAGE_CONTAINER_ID}>
      {paragraphs.map((paragraph, index) => (
        <Paragraph
          key={index}
          index={index}
          text={paragraph}
          fontScale={fontScale}
          highlights={highlights.filter((h) => h.paragraphIndex === index)}
          statusOf={statusOf}
          onWordPress={onWordPress}
          onSentenceLongPress={onSentenceLongPress}
          phraseMode={phraseMode}
          phraseAnchor={phraseAnchor?.paragraphIndex === index ? phraseAnchor.tokenIndex : null}
          onPhraseToken={onPhraseToken}
          speaking={speakingParagraph === index}
        />
      ))}
    </View>
  );
}

function Paragraph({
  index,
  text,
  fontScale,
  highlights,
  statusOf,
  onWordPress,
  onSentenceLongPress,
  phraseMode,
  phraseAnchor,
  onPhraseToken,
  speaking,
}: {
  index: number;
  text: string;
  fontScale: number;
  highlights: Highlight[];
  statusOf: (lemma: string) => WordStatusKind;
  onWordPress: PassageViewProps['onWordPress'];
  onSentenceLongPress: PassageViewProps['onSentenceLongPress'];
  phraseMode: boolean;
  phraseAnchor: number | null;
  onPhraseToken: PassageViewProps['onPhraseToken'];
  speaking: boolean;
}) {
  const tokens = useMemo(() => tokenize(text), [text]);
  const ranges = useMemo(() => highlightRanges(text, highlights), [text, highlights]);

  const fontSize = 15 * fontScale;
  const lineHeight = fontSize * 1.75;

  return (
    <View className="flex-row gap-3">
      <View
        className={[
          'h-6 w-6 items-center justify-center rounded-md',
          speaking ? 'bg-primary-600' : 'bg-surfaceAlt',
        ].join(' ')}
      >
        <Text
          className={['font-strong text-label', speaking ? 'text-white' : 'text-muted'].join(' ')}
        >
          {index + 1}
        </Text>
      </View>

      <Text
        className="flex-1 font-sans text-body"
        style={{ fontSize, lineHeight, color: '#334155' }}
        selectable
      >
        {tokens.map((token, tokenIndex) => {
          if (!token.isWord) return <Text key={tokenIndex}>{token.text}</Text>;

          const highlightColor = ranges.find((r) => token.start >= r.start && token.end <= r.end);
          const status = statusOf(lemmatize(token.text));
          const inPhrase = phraseMode && phraseAnchor !== null && tokenIndex >= phraseAnchor;

          const background = highlightColor
            ? highlightColors[highlightColor.color].fill
            : inPhrase
              ? '#DBE7FE'
              : status !== 'new' && status !== 'ignored'
                ? wordStatusColor[status].fill
                : undefined;

          return (
            <Text
              key={tokenIndex}
              onPress={() => {
                // Kéo chuột bôi đen xong, trình duyệt vẫn bắn `click` vào từ
                // cuối cùng. Không chặn thì thẻ tra MỘT từ đó sẽ đè lên nghĩa
                // của cả cụm vừa bôi.
                if (hasActiveSelection()) return;
                if (phraseMode) onPhraseToken(index, tokenIndex, token.text);
                else onWordPress(token.text, sentenceAround(text, token.start), index);
              }}
              onLongPress={() => onSentenceLongPress(sentenceAround(text, token.start), index)}
              style={background ? { backgroundColor: background, borderRadius: 3 } : undefined}
            >
              {token.text}
            </Text>
          );
        })}
      </Text>
    </View>
  );
}

/** Tách đoạn thành token có vị trí, để biết token nào nằm trong vùng bôi màu. */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /[A-Za-z][A-Za-z'-]*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push({
        text: text.slice(cursor, match.index),
        isWord: false,
        start: cursor,
        end: match.index,
      });
    }
    tokens.push({
      text: match[0],
      isWord: match[0].length > 1,
      start: match.index,
      end: match.index + match[0].length,
    });
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    tokens.push({ text: text.slice(cursor), isWord: false, start: cursor, end: text.length });
  }

  return tokens;
}

function highlightRanges(
  text: string,
  highlights: Highlight[],
): Array<{ start: number; end: number; color: HighlightColorKey }> {
  const ranges: Array<{ start: number; end: number; color: HighlightColorKey }> = [];

  for (const highlight of highlights) {
    const start = text.indexOf(highlight.text);
    if (start === -1) continue;
    ranges.push({ start, end: start + highlight.text.length, color: highlight.color });
  }

  return ranges;
}

/** Câu chứa vị trí ký tự đã cho — dùng làm ngữ cảnh khi tra từ. */
export function sentenceAround(text: string, position: number): string {
  const before = text.slice(0, position);
  const after = text.slice(position);

  const start = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('! '),
    before.lastIndexOf('? '),
  );
  const endMatch = after.match(/[.!?](\s|$)/);
  const end = endMatch?.index !== undefined ? position + endMatch.index + 1 : text.length;

  return text.slice(start === -1 ? 0 : start + 2, end).trim();
}
