import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import * as WebBrowser from 'expo-web-browser';

import { PASSAGE_CONTAINER_ID, PassageView, sentenceAround } from '@/components/reader/PassageView';
import { QuestionPanel } from '@/components/reader/QuestionPanel';
import { useTextSelection } from '@/components/reader/useTextSelection';
import { WordSheet, type WordSheetTarget } from '@/components/reader/WordSheet';
import { ChatPanel } from '@/components/reader/ChatPanel';
import { Badge, Button, Card, Icon, IconButton } from '@/components/ui';
import {
  getArticleById,
  getArticleWithBody,
  isReadable,
  readingLevelLabel,
  tierLabel,
  topicLabel,
  type Article,
  type ArticleMeta,
} from '@/data/articles';
import { lemmatize } from '@/services/dictionary/lookup';
import { useQuestionStore } from '@/store/useQuestionStore';
import { useReaderStore } from '@/store/useReaderStore';
import { rawScoreToBand, useStudyStore, type AttemptRecord } from '@/store/useStudyStore';
import { useUserArticleStore } from '@/store/useUserArticleStore';
import { useVocabStore } from '@/store/useVocabStore';
import { color, highlightColors, type HighlightColorKey } from '@/theme/tokens';

/** Màn hình đọc + luyện đề, bố cục 2 cột — bám ảnh tham chiếu số 2. */
export default function ReadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userArticle = useUserArticleStore((s) => (id ? s.articles[id] : undefined));

  // Bài tự dán không nằm trong seed nên phải tra cả hai nguồn.
  const meta = useMemo<ArticleMeta | undefined>(
    () => (id ? getArticleById(id) : undefined) ?? userArticle,
    [id, userArticle],
  );

  // Toàn văn nằm trong bodies/chunk-NN.json, nạp lười — chỉ lấy khi bài thật
  // sự đọc được. Bài chỉ tiêu đề không có chunk nào để nạp.
  const article = useMemo<Article | undefined>(() => {
    if (!meta || !isReadable(meta)) return undefined;
    return (id ? getArticleWithBody(id) : undefined) ?? userArticle;
  }, [id, meta, userArticle]);

  const fontScale = useReaderStore((s) => s.fontScale);
  const setFontScale = useReaderStore((s) => s.setFontScale);
  const ttsRate = useReaderStore((s) => s.ttsRate);
  const setTtsRate = useReaderStore((s) => s.setTtsRate);
  const addHighlight = useReaderStore((s) => s.addHighlight);
  const clearHighlights = useReaderStore((s) => s.clearHighlights);
  const highlights = useReaderStore((s) => s.highlights);
  const addNote = useReaderStore((s) => s.addNote);

  const statusOf = useVocabStore((s) => s.statusOf);
  const markSeen = useVocabStore((s) => s.markSeen);

  const setProgress = useStudyStore((s) => s.setProgress);
  const addSession = useStudyStore((s) => s.addSession);
  const logWpm = useStudyStore((s) => s.logWpm);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);

  const ensureSet = useQuestionStore((s) => s.ensureSet);
  const questionSet = useQuestionStore((s) => (id ? s.sets[id] : undefined));

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sheet, setSheet] = useState<WordSheetTarget | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [highlightColor, setHighlightColor] = useState<HighlightColorKey>('yellow');
  const [phraseMode, setPhraseMode] = useState(false);
  const [phraseAnchor, setPhraseAnchor] = useState<{
    paragraphIndex: number;
    tokenIndex: number;
    word: string;
  } | null>(null);
  const [speakingParagraph, setSpeakingParagraph] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const [paused, setPaused] = useState(false);

  const startedAt = useRef(Date.now());
  const articleHighlights = useMemo(
    () => highlights.filter((h) => h.articleId === article?.id),
    [highlights, article?.id],
  );

  // Đồng hồ đếm ngược, tạm dừng được.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [paused]);

  // Đánh dấu các từ trong bài là "đã gặp" để lần sau tô nhạt sẵn.
  useEffect(() => {
    if (!article?.bodyText) return;
    const lemmas = [...new Set((article.bodyText.toLowerCase().match(/[a-z]{4,}/g) ?? []).slice(0, 400))].map(
      lemmatize,
    );
    markSeen(lemmas);
  }, [article?.id, article?.bodyText, markSeen]);

  useEffect(() => {
    if (!article || !isReadable(article)) return;
    setLoadingQuestions(true);
    void ensureSet(article).finally(() => setLoadingQuestions(false));
  }, [article, ensureSet]);

  useEffect(() => {
    return () => {
      Speech.stop();
      const minutes = Math.round((Date.now() - startedAt.current) / 60000);
      if (minutes > 0) logStudyTime('reading_library', minutes);
    };
  }, [logStudyTime]);

  /**
   * Bôi đen bất kỳ chỗ nào trong bài → mở luôn thẻ nghĩa cho đúng cụm đó, kèm
   * nguyên câu chứa nó làm ngữ cảnh. Không phải bật chế độ gì trước.
   *
   * Gọi ở đây, trước mấy nhánh return sớm bên dưới, vì hook không được nằm sau
   * điều kiện. `article` chưa nạp xong thì bỏ qua.
   */
  useTextSelection(PASSAGE_CONTAINER_ID, (selected) => {
    if (!article) return;

    const paragraphIndex = article.paragraphs.findIndex((p) => p.includes(selected));
    const paragraph = paragraphIndex === -1 ? undefined : article.paragraphs[paragraphIndex];

    setSheet({
      word: selected,
      sentence: paragraph ? sentenceAround(paragraph, paragraph.indexOf(selected)) : selected,
      // Bôi vắt qua hai đoạn thì không quy về đoạn nào được; ghi đoạn đầu để
      // phần "Lưu từ" vẫn có chỗ neo.
      paragraphIndex: paragraphIndex === -1 ? 0 : paragraphIndex,
      mode: selectionMode(selected),
    });
  });

  if (!meta) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="font-strong text-cardTitle text-ink">Không tìm thấy bài đọc.</Text>
        <Button label="Về Library" className="mt-4" onPress={() => router.push('/library' as never)} />
      </View>
    );
  }

  if (!isReadable(meta)) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Card className="max-w-[520px]">
          <Badge label="Chỉ tiêu đề" tone="warning" />
          <Text className="mt-3 font-strong text-sectionTitle text-ink">{meta.title}</Text>
          <Text className="mt-2 font-sans text-body text-muted">{meta.summary}</Text>
          <Text className="mt-3 font-sans text-label text-subtle">
            Bài từ nguồn có bản quyền ({meta.sourceName}) nên app không lưu toàn văn. Bấm để đọc
            trên trang gốc.
          </Text>
          <Button
            label="Mở link gốc"
            iconRight="arrow-right"
            className="mt-4"
            onPress={() => void WebBrowser.openBrowserAsync(meta.sourceUrl)}
          />
        </Card>
      </View>
    );
  }

  // Metadata có nhưng không nạp được toàn văn: file chunk thiếu hoặc hỏng.
  // Báo rõ thay vì render một bài rỗng.
  if (!article) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Card className="max-w-[520px]">
          <Text className="font-strong text-sectionTitle text-ink">{meta.title}</Text>
          <Text className="mt-2 font-sans text-body text-muted">
            Không nạp được toàn văn của bài này. Chạy lại `npm run ingest` để dựng lại kho bài.
          </Text>
          <Button
            label="Về Library"
            className="mt-4"
            onPress={() => router.push('/library' as never)}
          />
        </Card>
      </View>
    );
  }

  const questions = questionSet?.questions ?? [];
  const answeredCount = Object.values(answers).filter(Boolean).length;

  const speakParagraph = (index: number) => {
    const paragraph = article.paragraphs[index];
    if (!paragraph) return;

    Speech.stop();
    setSpeakingParagraph(index);
    Speech.speak(paragraph, {
      language: 'en-US',
      rate: ttsRate,
      onDone: () => setSpeakingParagraph(null),
      onStopped: () => setSpeakingParagraph(null),
    });
  };

  const handleWordPress = (word: string, sentence: string, paragraphIndex: number) => {
    setSheet({ word, sentence, paragraphIndex, mode: 'word' });
  };

  const handlePhraseToken = (paragraphIndex: number, tokenIndex: number, token: string) => {
    if (!phraseAnchor || phraseAnchor.paragraphIndex !== paragraphIndex) {
      setPhraseAnchor({ paragraphIndex, tokenIndex, word: token });
      return;
    }

    const paragraph = article.paragraphs[paragraphIndex] ?? '';
    const start = paragraph.indexOf(phraseAnchor.word);
    const endWordPos = paragraph.indexOf(token, start);
    const phrase =
      start >= 0 && endWordPos >= 0
        ? paragraph.slice(start, endWordPos + token.length)
        : `${phraseAnchor.word} ${token}`;

    setSheet({
      word: phrase,
      sentence: sentenceAround(paragraph, start >= 0 ? start : 0),
      paragraphIndex,
      mode: 'phrase',
    });
    setPhraseAnchor(null);
    setPhraseMode(false);
  };

  const submit = () => {
    setSubmitting(true);

    const attempts: AttemptRecord[] = questions.map((q) => {
      const userAnswer = answers[q.id]?.trim() ?? '';
      return {
        questionId: q.id,
        type: q.type,
        userAnswer: userAnswer || null,
        correctAnswer: q.correctAnswer,
        isCorrect: isAnswerCorrect(userAnswer, q.correctAnswer),
        timeSpentMs: 0,
        markedForReview: Boolean(marked[q.id]),
      };
    });

    const correct = attempts.filter((a) => a.isCorrect).length;
    const durationMs = Date.now() - startedAt.current;

    const sessionId = addSession({
      articleId: article.id,
      articleTitle: article.title,
      exam: article.exam,
      mode: 'practice',
      rawScore: correct,
      total: attempts.length,
      accuracy: attempts.length === 0 ? 0 : Math.round((correct / attempts.length) * 100),
      // Band là thang riêng của IELTS — bài SAT không quy đổi được.
      estimatedBand: article.exam === 'sat' ? null : rawScoreToBand(correct, attempts.length),
      durationMs,
      attempts,
    });

    setProgress(article.id, 100, article.paragraphs.length - 1);

    const minutes = durationMs / 60000;
    if (minutes > 0.2 && article.wordCount) logWpm(article.wordCount / minutes);

    setSubmitting(false);
    router.push(`/review/${sessionId}` as never);
  };

  return (
    <View className="flex-1 bg-canvas">
      {/* Header: độ khó, thời gian, tiến độ câu, đồng hồ */}
      <View className="flex-row flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1.5"
          accessibilityRole="button"
        >
          <Icon name="chevron-left" size={16} color={color.muted} />
          <Text className="font-semi text-body text-muted">Quay lại</Text>
        </Pressable>

        <Badge
          label={article.cefrLevel ?? '—'}
          tone={article.cefrLevel === 'C2' ? 'danger' : article.cefrLevel === 'C1' ? 'warning' : 'success'}
        />
        <Badge label={readingLevelLabel(article) ?? '—'} tone="primary" />

        <View className="flex-row items-center gap-1.5">
          <Icon name="clock" size={14} color={color.subtle} />
          <Text className="font-mid text-label text-muted">{article.estMinutes} min</Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Icon name="clipboard" size={14} color={color.subtle} />
          <Text className="font-mid text-label text-muted">
            {answeredCount} / {questions.length}
          </Text>
        </View>

        <View className="flex-1" />

        <View className="flex-row items-center gap-2 rounded-panel bg-primary-50 px-3 py-1.5">
          <Icon name="clock" size={15} color={color.primary} />
          <Text className="font-strong text-body text-primary-700">{formatTime(secondsLeft)}</Text>
          <Pressable onPress={() => setPaused((p) => !p)} accessibilityLabel="Tạm dừng">
            <Icon name={paused ? 'chevron-right' : 'close'} size={14} color={color.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="mx-auto w-full max-w-[1400px] flex-row flex-wrap gap-4">
          {/* Cột trái: bài đọc */}
          <View className="min-w-[320px] flex-[3]">
            <Card>
              <View className="flex-row flex-wrap items-center gap-2">
                <Badge
                  label={
                    article.exam === 'sat'
                      ? 'SAT'
                      : article.track === 'academic'
                        ? 'IELTS Academic'
                        : 'IELTS General Training'
                  }
                  tone="primary"
                  shape="tag"
                  uppercase
                />
                {article.passageTier ? (
                  <Badge label={tierLabel(article.passageTier) ?? ''} tone="neutral" />
                ) : null}
              </View>

              <Text className="mt-2 font-heavy text-pageTitle text-ink">{article.title}</Text>

              <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
                <Text className="font-mid text-label text-muted">
                  {topicLabel(article.topic)} · {article.sourceName}
                </Text>
                <Text className="font-mid text-label text-muted">{article.wordCount} từ</Text>
              </View>

              {article.attribution ? (
                <Text className="mt-2 font-sans text-label text-subtle">{article.attribution}</Text>
              ) : null}

              <View className="mt-4 border-t border-border pt-4">
                <PassageView
                  paragraphs={article.paragraphs}
                  fontScale={fontScale}
                  highlights={articleHighlights}
                  statusOf={statusOf}
                  onWordPress={handleWordPress}
                  onSentenceLongPress={(sentence, paragraphIndex) =>
                    setSheet({ word: sentence, sentence, paragraphIndex, mode: 'sentence' })
                  }
                  phraseMode={phraseMode}
                  phraseAnchor={phraseAnchor}
                  onPhraseToken={handlePhraseToken}
                  speakingParagraph={speakingParagraph}
                />
              </View>
            </Card>

            {/* Thanh công cụ dưới bài */}
            <Card className="mt-3">
              <View className="flex-row flex-wrap items-center gap-2">
                <View className="flex-row items-center gap-1.5 rounded-panel border border-border px-2.5 py-1.5">
                  <Icon name="pencil" size={14} color={color.muted} />
                  <Text className="font-semi text-label text-muted">Highlight</Text>
                </View>

                {(Object.keys(highlightColors) as HighlightColorKey[]).map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => setHighlightColor(key)}
                    accessibilityLabel={highlightColors[key].label}
                    className={[
                      'h-7 w-7 items-center justify-center rounded-pill border-2',
                      highlightColor === key ? 'border-primary-600' : 'border-transparent',
                    ].join(' ')}
                  >
                    <View
                      className="h-5 w-5 rounded-pill"
                      style={{ backgroundColor: highlightColors[key].dot }}
                    />
                  </Pressable>
                ))}

                <Button
                  label={phraseMode ? 'Đang chọn cụm…' : 'Chọn cụm từ'}
                  variant={phraseMode ? 'primary' : 'outline'}
                  size="sm"
                  iconLeft="letters"
                  onPress={() => {
                    setPhraseMode((p) => !p);
                    setPhraseAnchor(null);
                  }}
                />

                <Button
                  label="Highlight câu đang đọc"
                  variant="outline"
                  size="sm"
                  iconLeft="check"
                  onPress={() => {
                    const paragraphIndex = speakingParagraph ?? 0;
                    const paragraph = article.paragraphs[paragraphIndex];
                    if (!paragraph) return;
                    addHighlight({
                      articleId: article.id,
                      paragraphIndex,
                      text: sentenceAround(paragraph, 0),
                      color: highlightColor,
                      note: null,
                      evidenceForQuestionId: null,
                    });
                  }}
                />

                <Button
                  label="Ghi chú"
                  variant="outline"
                  size="sm"
                  iconLeft="note"
                  onPress={() =>
                    addNote({
                      articleId: article.id,
                      articleTitle: article.title,
                      paragraphIndex: null,
                      body: `Ghi chú cho "${article.title}"`,
                    })
                  }
                />

                <View className="flex-1" />

                <View className="flex-row items-center gap-1">
                  <IconButton
                    name="close"
                    accessibilityLabel="Giảm cỡ chữ"
                    onPress={() => setFontScale(fontScale - 0.1)}
                  />
                  <Text className="font-semi text-body text-ink">A</Text>
                  <IconButton
                    name="plus"
                    accessibilityLabel="Tăng cỡ chữ"
                    onPress={() => setFontScale(fontScale + 0.1)}
                  />
                </View>
              </View>

              <View className="mt-3 flex-row flex-wrap items-center gap-2 border-t border-border pt-3">
                <Button
                  label="Đọc to bài"
                  variant="outline"
                  size="sm"
                  iconLeft="volume"
                  onPress={() => speakParagraph(0)}
                />
                <Button
                  label="Dừng đọc"
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    Speech.stop();
                    setSpeakingParagraph(null);
                  }}
                />

                {[0.75, 1, 1.5, 2].map((rate) => (
                  <Pressable
                    key={rate}
                    onPress={() => setTtsRate(rate)}
                    className={[
                      'rounded-pill px-2.5 py-1',
                      ttsRate === rate ? 'bg-primary-600' : 'bg-surfaceAlt',
                    ].join(' ')}
                  >
                    <Text
                      className={[
                        'font-semi text-label',
                        ttsRate === rate ? 'text-white' : 'text-muted',
                      ].join(' ')}
                    >
                      {rate}x
                    </Text>
                  </Pressable>
                ))}

                <View className="flex-1" />

                <Button
                  label="Xoá hết highlight"
                  variant="ghost"
                  size="sm"
                  onPress={() => clearHighlights(article.id)}
                />
              </View>
            </Card>
          </View>

          {/* Cột phải: câu hỏi */}
          <View className="min-w-[320px] flex-[2]">
            {loadingQuestions && questions.length === 0 ? (
              <Card className="items-center py-10">
                <ActivityIndicator color={color.primary} />
                <Text className="mt-2 font-sans text-body text-muted">Đang chuẩn bị bộ đề…</Text>
              </Card>
            ) : (
              <QuestionPanel
                questions={questions}
                answers={answers}
                marked={marked}
                submitting={submitting}
                onAnswer={(questionId, answer) =>
                  setAnswers((prev) => ({ ...prev, [questionId]: answer }))
                }
                onToggleMark={(questionId) =>
                  setMarked((prev) => ({ ...prev, [questionId]: !prev[questionId] }))
                }
                onSubmit={submit}
              />
            )}

            {questionSet?.generatedBy === 'offline' ? (
              <Text className="mt-2 font-sans text-label text-subtle">
                {article.exam === 'sat'
                  ? 'Bộ đề đang sinh offline từ chính bài đọc, mới có Words in Context và Inferences. Cấu hình ANTHROPIC_API_KEY để Claude ra đủ năm dạng của SAT.'
                  : 'Bộ đề đang sinh offline từ chính bài đọc. Cấu hình ANTHROPIC_API_KEY để Claude ra đề sát chuẩn IELTS hơn.'}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Nút chat nổi */}
      <Pressable
        onPress={() => setChatOpen(true)}
        accessibilityLabel="Mở trợ giảng"
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-pill bg-primary-600"
        style={{ boxShadow: '0 12px 32px rgba(37,99,235,0.35)' } as never}
      >
        <Icon name="chat" size={24} color={color.white} strokeWidth={1.9} />
      </Pressable>

      <WordSheet
        target={sheet}
        articleId={article.id}
        articleTitle={article.title}
        onClose={() => setSheet(null)}
      />

      <ChatPanel articleId={article.id} visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}

/**
 * Bôi một từ thì tra từ, bôi vài từ thì tra cả cụm, bôi nguyên câu thì giải
 * thích ngữ pháp — ba chế độ này đã có sẵn trong WordSheet, ở đây chỉ chọn đúng
 * chế độ theo thứ người đọc vừa bôi.
 */
function selectionMode(selected: string): WordSheetTarget['mode'] {
  const words = selected.trim().split(/\s+/).length;
  if (words === 1) return 'word';
  // Có dấu kết câu ở giữa, hoặc quá dài để còn là một collocation.
  if (words > 8 || /[.!?]/.test(selected.slice(0, -1))) return 'sentence';
  return 'phrase';
}

/** So đáp án khoan dung: bỏ qua hoa thường, dấu câu và mạo từ thừa. */
export function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(the|a|an)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const user = normalize(userAnswer);
  const correct = normalize(correctAnswer);

  return user.length > 0 && user === correct;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
