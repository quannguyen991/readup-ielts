import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { hasActiveSelection } from './useTextSelection';
import { color, highlightColors, wordStatusColor, type HighlightColorKey } from '@/theme/tokens';
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
  /**
   * Bản dịch tiếng Việt, MỘT PHẦN TỬ MỘT ĐOẠN, cùng thứ tự với `paragraphs`.
   *
   * `null` = chưa bật song ngữ. Phần tử rỗng = đoạn đó chưa dịch được; hiện chỗ
   * trống có lời nhắn còn hơn ghép nhầm bản dịch của đoạn bên cạnh vào.
   */
  translations?: string[] | null;
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
  translations = null,
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
          translation={translations ? (translations[index] ?? '') : null}
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
  translation,
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
  translation: string | null;
}) {
  const tokens = useMemo(() => tokenize(text), [text]);
  const ranges = useMemo(() => highlightRanges(text, highlights), [text, highlights]);

  const fontSize = 15 * fontScale;
  const lineHeight = fontSize * 1.75;

  return (
    /*
      KHÔNG đánh số đoạn.

      Đề thi thật không đánh số từng đoạn của passage, và ô số ở đầu mỗi đoạn ăn
      mất một khoảng lề trên màn hình hẹp. Nó vốn kiêm một việc khác — cho biết
      đoạn nào đang được đọc to — nên bỏ số thì phải trả việc đó cho thứ khác:
      một vạch màu bên trái, chỉ hiện đúng lúc đang đọc.
    */
    <View
      className="flex-row gap-3 rounded-r-card"
      style={
        speaking
          ? { borderLeftWidth: 3, borderLeftColor: color.primary, backgroundColor: color.primarySoft, paddingLeft: 10, paddingVertical: 4, marginLeft: -13 }
          : undefined
      }
    >
      <View className="flex-1">
      <Text
        className="font-sans text-body"
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

      {/*
        Bản dịch nằm NGAY DƯỚI đoạn của nó, không phải ở cột bên cạnh.

        Hai cột song song trông gọn trên màn hình rộng nhưng hỏng trên điện
        thoại — và người học đối chiếu theo CÂU chứ không theo cả đoạn, nên mắt
        phải đi xuống một đoạn ngắn là đúng hơn đi ngang cả màn hình.

        Chữ nhỏ hơn và nhạt hơn bản gốc, cố ý: bản tiếng Anh vẫn là thứ phải đọc,
        tiếng Việt chỉ để đối chiếu khi vướng.
      */}
      {translation !== null ? (
        <View
          className="mt-1.5 border-l-2 pl-2.5"
          style={{ borderColor: color.border }}
        >
          {translation ? (
            <Text
              className="font-sans"
              style={{ fontSize: fontSize * 0.94, lineHeight: lineHeight * 0.92, color: color.muted }}
              selectable
            >
              {translation}
            </Text>
          ) : (
            <Text className="font-sans text-label text-subtle">Đoạn này chưa dịch được.</Text>
          )}
        </View>
      ) : null}
      </View>
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
