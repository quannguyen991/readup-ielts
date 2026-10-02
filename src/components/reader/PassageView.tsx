import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { hasActiveSelection } from './useTextSelection';
import { highlightRanges, sentenceAround, sentenceBounds } from './passage-text';
import { color, highlightColors, wordStatusColor } from '@/theme/tokens';
import { lemmatize } from '@/services/dictionary/lookup';
import type { Highlight } from '@/store/useReaderStore';
import type { WordStatusKind } from '@/types/database';
import { useL } from '@/i18n/useL';

export { highlightRanges, sentenceAround, sentenceBounds, snapToWords } from './passage-text';

/**
 * Khối bài đọc: chạm vào từ để tra, giữ lâu để giải thích cả câu, tô sẵn những
 * từ đã lưu ở bài trước — và highlight.
 *
 * CHẠM LÀM GÌ TUỲ CÔNG CỤ ĐANG BẬT (`tool`), người dùng chốt 26/09/2026:
 *   - 'read'      : chạm không làm gì, như đề thi thật. Mặc định.
 *   - 'highlight' : chạm một từ = tô cả câu; chạm vào vệt đã tô = xoá vệt đó.
 *                   (Kéo bôi để tô đúng một đoạn chữ thì màn cha lo, qua DOM.)
 *   - 'vocab'     : chạm từ mới mở thẻ nghĩa; giữ lâu để giải thích cả câu.
 * Bản cũ lúc nào chạm cũng mở thẻ dịch — đang làm đề mà lỡ tay là thẻ bật lên.
 */

export type ReaderTool = 'read' | 'highlight' | 'vocab';

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
  /** Mặt chữ và màu chữ của bài — màn luyện Reading cho người học tự chọn. */
  fontFamily?: string;
  textColor?: string;
  /** Công cụ đang bật; không truyền = 'vocab' (giữ hành vi cũ cho nơi khác dùng). */
  tool?: ReaderTool;
  /** Công cụ highlight: tô đoạn [start, end) của đoạn văn `paragraphIndex`. */
  onHighlightRange?: (paragraphIndex: number, start: number, end: number) => void;
  /** Công cụ highlight: chạm vào một vệt đã tô. */
  onHighlightPress?: (highlightId: string) => void;
  /** In chữ cái đậm (A., B., …) ở lề trái mỗi đoạn, như đề IELTS. Chữ nằm ngoài vùng bôi nên không lệch vị trí tô. */
  letters?: boolean;
  /** Cỡ chữ gốc, mặc định 15. */
  baseSize?: number;
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
  fontFamily,
  textColor,
  tool = 'vocab',
  onHighlightRange,
  onHighlightPress,
  letters = false,
  baseSize = 15,
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
          fontFamily={fontFamily}
          textColor={textColor}
          tool={tool}
          onHighlightRange={onHighlightRange}
          onHighlightPress={onHighlightPress}
          letter={letters && index < 26 ? String.fromCharCode(65 + index) : null}
          baseSize={baseSize}
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
  fontFamily,
  textColor,
  tool,
  onHighlightRange,
  onHighlightPress,
  letter,
  baseSize,
}: {
  letter: string | null;
  baseSize: number;
  tool: ReaderTool;
  onHighlightRange?: PassageViewProps['onHighlightRange'];
  onHighlightPress?: PassageViewProps['onHighlightPress'];
  fontFamily?: string;
  textColor?: string;
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
  const { L } = useL();
  const tokens = useMemo(() => tokenize(text), [text]);
  const ranges = useMemo(() => highlightRanges(text, highlights), [text, highlights]);

  const fontSize = baseSize * fontScale;
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
      {letter ? (
        <Text style={{ width: 22, fontSize, lineHeight, fontWeight: '800', color: textColor ?? '#334155', ...(fontFamily ? { fontFamily } : null) }}>
          {letter}.
        </Text>
      ) : null}
      <View className="flex-1">
      <Text
        className="font-sans text-body"
        style={{ fontSize, lineHeight, color: textColor ?? '#334155', ...(fontFamily ? { fontFamily } : null) }}
        selectable
        {...({ dataSet: { para: String(index) } } as object)}
      >
        {tokens.map((token, tokenIndex) => {
          const highlightColor = ranges.find((r) => token.start >= r.start && token.end <= r.end);

          // Dấu cách và dấu câu nằm GIỮA một vệt tô cũng phải tô, không thì vệt
          // bị đứt thành từng ô chữ rời — lý do người dùng thấy highlight "không mượt".
          if (!token.isWord) {
            return (
              <Text
                key={tokenIndex}
                // Ở chế độ highlight, chạm trúng dấu cách / dấu câu cũng tô (hoặc xoá) câu đó —
                // khe giữa hai chữ nhỏ, chạm lệch một chút không được thành "không có gì xảy ra".
                onPress={
                  tool === 'highlight' && !phraseMode
                    ? () => {
                        if (hasActiveSelection()) return;
                        if (highlightColor) onHighlightPress?.(highlightColor.id);
                        else {
                          const b = sentenceBounds(text, token.start);
                          onHighlightRange?.(index, b.start, b.end);
                        }
                      }
                    : undefined
                }
                style={highlightColor ? { backgroundColor: highlightColors[highlightColor.color].fill } : undefined}
              >
                {token.text}
              </Text>
            );
          }

          const status = statusOf(lemmatize(token.text));
          const inPhrase = phraseMode && phraseAnchor !== null && tokenIndex >= phraseAnchor;

          const background = highlightColor
            ? highlightColors[highlightColor.color].fill
            : inPhrase
              ? '#F8F0E1'
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
                if (phraseMode) {
                  onPhraseToken(index, tokenIndex, token.text);
                  return;
                }
                if (tool === 'highlight') {
                  if (highlightColor) onHighlightPress?.(highlightColor.id);
                  else {
                    const b = sentenceBounds(text, token.start);
                    onHighlightRange?.(index, b.start, b.end);
                  }
                  return;
                }
                if (tool === 'vocab') onWordPress(token.text, sentenceAround(text, token.start), index);
              }}
              onLongPress={tool === 'vocab' ? () => onSentenceLongPress(sentenceAround(text, token.start), index) : undefined}
              style={
                background
                  ? { backgroundColor: background, borderRadius: highlightColor ? 0 : 3 }
                  : tool === 'read'
                    ? ({ cursor: 'text' } as object)
                    : undefined
              }
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
            <Text className="font-sans text-label text-subtle">{L('Đoạn này chưa dịch được.', "This paragraph couldn't be translated yet.")}</Text>
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
