import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';

import { hasActiveSelection } from './useTextSelection';
import { highlightRanges, sentenceAround, sentenceBounds } from './passage-text';
import { color, highlightColors, wordStatusColor } from '@/theme/tokens';
import { lemmatize } from '@/services/dictionary/lookup';
import type { Highlight } from '@/store/useReaderStore';
import type { WordStatusKind } from '@/types/database';
import { useL } from '@/i18n/useL';

export { highlightRanges, sentenceAround, sentenceBounds, snapToWords } from './passage-text';

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
  /** In chữ cái đậm (A., B., …) ở lề trái mỗi đoạn, như đề IELTS. */
  letters?: boolean;
  /** Cỡ chữ gốc, mặc định 15. */
  baseSize?: number;
  /** Bằng chứng câu hỏi đang chọn trong chế độ xem lại (Định vị đáp án). */
  activeEvidence?: {
    paragraphIndex: number;
    text?: string;
    questionNumber?: number;
  } | null;
};

type Token = { text: string; isWord: boolean; start: number; end: number };

export const PASSAGE_CONTAINER_ID = 'passage-body';

export const PassageView = memo(function PassageView({
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
  activeEvidence = null,
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
          isEvidence={activeEvidence ? activeEvidence.paragraphIndex === index : false}
          evidenceQuestionNumber={activeEvidence?.paragraphIndex === index ? activeEvidence.questionNumber : undefined}
          evidenceSnippet={activeEvidence?.paragraphIndex === index ? activeEvidence.text : undefined}
        />
      ))}
    </View>
  );
});

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
  isEvidence,
  evidenceQuestionNumber,
  evidenceSnippet,
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
  isEvidence?: boolean;
  evidenceQuestionNumber?: number;
  evidenceSnippet?: string;
}) {
  const { L } = useL();
  const tokens = useMemo(() => tokenize(text), [text]);
  const ranges = useMemo(() => highlightRanges(text, highlights), [text, highlights]);

  const fontSize = baseSize * fontScale;
  const lineHeight = fontSize * 1.75;

  return (
    <View
      nativeID={`passage-para-${index}`}
      className="flex-col gap-1.5 rounded-2xl transition-all"
      style={
        isEvidence
          ? {
              backgroundColor: '#FEF9C3',
              borderLeftWidth: 4,
              borderLeftColor: '#E11D48',
              paddingLeft: 12,
              paddingRight: 10,
              paddingVertical: 10,
              marginHorizontal: -4,
              borderRadius: 14,
            }
          : speaking
            ? {
                borderLeftWidth: 3,
                borderLeftColor: color.primary,
                backgroundColor: color.primarySoft,
                paddingLeft: 10,
                paddingVertical: 4,
                marginLeft: -13,
              }
            : undefined
      }
    >
      {isEvidence && evidenceQuestionNumber ? (
        <View className="flex-row items-center gap-1.5 self-start rounded-full bg-rose-600 px-2.5 py-0.5 mb-1 shadow-xs">
          <View className="h-1.5 w-1.5 rounded-full bg-white" />
          <Text className="text-[11px] font-bold text-white">
            {L(`Vị trí bằng chứng câu ${evidenceQuestionNumber}`, `Evidence for Question ${evidenceQuestionNumber}`)}
          </Text>
        </View>
      ) : null}

      <View className="flex-row gap-3">
        {letter ? (
          <Text
            style={{
              width: 22,
              fontSize,
              lineHeight,
              fontWeight: '800',
              color: isEvidence ? '#9F1239' : (textColor ?? '#334155'),
              ...(fontFamily ? { fontFamily } : null),
            }}
          >
            {letter}.
          </Text>
        ) : null}
        <View className="flex-1">
          <Text
            className="font-sans text-body"
            style={{
              fontSize,
              lineHeight,
              color: isEvidence ? '#1F2937' : (textColor ?? '#334155'),
              ...(fontFamily ? { fontFamily } : null),
            }}
            selectable
            {...({ dataSet: { para: String(index) } } as object)}
          >
            {tokens.map((token, tokenIndex) => {
              const highlightColor = ranges.find((r) => token.start >= r.start && token.end <= r.end);

              if (!token.isWord) {
                return (
                  <Text
                    key={tokenIndex}
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

          {translation !== null ? (
            <View className="mt-1.5 border-l-2 pl-2.5" style={{ borderColor: color.border }}>
              {translation ? (
                <Text
                  className="font-sans"
                  style={{ fontSize: fontSize * 0.94, lineHeight: lineHeight * 0.92, color: color.muted }}
                  selectable
                >
                  {translation}
                </Text>
              ) : (
                <Text className="font-sans text-label text-subtle">
                  {L('Đoạn này chưa dịch được.', "This paragraph couldn't be translated yet.")}
                </Text>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

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
