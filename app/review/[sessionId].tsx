import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Grid } from '@/components/layout/Grid';
import {
  Badge,
  Button,
  Card,
  Icon,
  QuestionTypeIcon,
  SectionHeader,
  StatCard,
} from '@/components/ui';
import { ARTICLES, getArticleWithBody } from '@/data/articles';
import { pickTransferSource } from '@/services/proofloop/transfer-source';
import { readingSkillFor } from '@/services/mastery/reading-skill';
import { resolveProbe } from '@/store/useMasteryStore';
import { formatBand } from '@/lib/band';
import { findEvidenceSpan, mergeSpans, type EvidenceSpan } from '@/lib/reading/evidence';
import { ReadingCoachPanel, type CoachRequest } from '@/components/reader/ReadingCoachPanel';
import { ProofStateBadge } from '@/components/reader/ProofStateBadge';
import { ProbePanel } from '@/components/reader/ProbePanel';
import { ExplainPanel } from '@/components/reader/ExplainPanel';
import { classify } from '@/services/proofloop/state';
import { QUESTION_TYPE_LABEL } from '@/services/questions/types';
import { useQuestionStore } from '@/store/useQuestionStore';
import { useStudyStore } from '@/store/useStudyStore';
import { usePlan } from '@/store/useBillingStore';
import { color, highlightColors } from '@/theme/tokens';
import type { QuestionType } from '@/types/database';

/** Test Review — phần quan trọng nhất, bám ảnh tham chiếu số 1. */
export default function ReviewScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const session = useStudyStore((s) => s.sessions.find((x) => x.id === sessionId));
  const questionSet = useQuestionStore((s) => (session ? s.sets[session.articleId] : undefined));

  const plan = usePlan();
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  /*
    Bài đã dùng cho phép thử chuyển giao vừa rồi.

    Giữ ở ref chứ không ở state: nó chỉ được đọc lúc ghi kết quả, và đưa vào
    state thì mỗi lần dựng phép thử lại vẽ lại cả màn xem lại.
  */
  const lastTransferId = useRef<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);

  // Màn này hiện lại nguyên bài để soi câu dẫn chứng, nên cần toàn văn chứ
  // không chỉ metadata.
  const article = session ? getArticleWithBody(session.articleId) : undefined;


  const rows = useMemo(() => {
    if (!session || !questionSet) return [];

    return session.attempts.map((attempt) => ({
      attempt,
      question: questionSet.questions.find((q) => q.id === attempt.questionId),
    }));
  }, [session, questionSet]);

  /*
    Gói dữ liệu cho AI: CHỈ những câu sai, và chỉ những trường AI thật sự cần.

    Gửi cả lượt làm bài lên là gửi thừa — câu đúng không nói được gì về lỗi, mà
    lại làm loãng phần AI phải đọc và tốn thêm token cho mỗi lượt.
  */
  const coachRequest = useMemo<CoachRequest | null>(() => {
    if (!session) return null;
    return {
      articleTitle: session.articleTitle,
      total: session.total,
      correct: session.rawScore,
      wrong: rows
        .filter(({ attempt }) => !attempt.isCorrect)
        .map(({ attempt, question }) => ({
          questionId: attempt.questionId,
          type: attempt.type,
          typeLabel: QUESTION_TYPE_LABEL[attempt.type],
          prompt: question?.prompt ?? '',
          userAnswer: attempt.userAnswer,
          correctAnswer: attempt.correctAnswer,
          evidenceText: question?.evidenceText ?? '',
        }))
        .filter((w) => w.prompt !== ''),
    };
  }, [rows, session]);

  const filtered = rows.filter(({ attempt }) => {
    if (filter === 'correct' && !attempt.isCorrect) return false;
    if (filter === 'incorrect' && attempt.isCorrect) return false;
    if (typeFilter !== 'all' && attempt.type !== typeFilter) return false;
    return true;
  });

  if (!session) {
    return (
      <Screen>
        <Text className="font-strong text-cardTitle text-ink">Không tìm thấy lượt làm bài này.</Text>
        <Button label="Về Practice" className="mt-4" onPress={() => router.push('/practice' as never)} />
      </Screen>
    );
  }

  const incorrect = session.attempts.filter((a) => !a.isCorrect).length;
  /*
    "Bỏ qua" là câu KHÔNG có câu trả lời, "sai" là câu có trả lời mà trật. Cộng
    hai cái lại đúng bằng số câu không đúng — nên bảng chấm không có chỗ hụt.
  */
  const skipped = session.attempts.filter((a) => !a.isCorrect && !a.userAnswer?.trim()).length;
  const wrong = incorrect - skipped;

  return (
    <Screen>
      <Pressable onPress={() => router.push('/practice' as never)} className="flex-row items-center gap-1.5">
        <Icon name="chevron-left" size={16} color={color.muted} />
        <Text className="font-semi text-body text-muted">Back to Practice</Text>
      </Pressable>

      <View className="mt-3 flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="font-heavy text-pageTitle text-ink">Test Review</Text>
            <Badge
              label={session.exam === 'sat' ? 'SAT Reading' : 'Academic Reading'}
              tone="success"
            />
          </View>
          <Text className="mt-1 font-sans text-body text-muted">
            Practice Set: {session.articleTitle}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Button
            label="Review Vocabulary"
            variant="outline"
            iconLeft="letters"
            onPress={() => router.push('/vocabulary' as never)}
          />
          <Button
            label={`Retry Mistakes (${incorrect})`}
            iconLeft="refresh"
            disabled={incorrect === 0}
            onPress={() => router.push(`/read/${session.articleId}` as never)}
          />
        </View>
      </View>

      {/*
        BẢNG CHẤM, và nó tách BỎ QUA khỏi SAI.

        Bản trước chỉ có "đúng / tổng" và một tỉ lệ. Hai con số ấy gộp mất một
        phân biệt quan trọng: bỏ trống 34 câu vì hết giờ khác hẳn làm sai 34 câu
        vì đọc sai. Người thứ nhất cần luyện tốc độ, người thứ hai cần luyện kỹ
        năng — mà một tỉ lệ đúng thì cho cả hai cùng một con số.
      */}
      <View className="mt-4">
        <Grid columns={4} tabletColumns={2} mobileColumns={2}>
          <StatCard
            variant="sticker"
            label="Câu đúng"
            value={String(session.rawScore)}
            unit={`/ ${session.total}`}
            icon="check"
            tone="success"
            caption={`${pct(session.rawScore, session.total)}%`}
          />
          <StatCard
            variant="sticker"
            label="Bỏ qua"
            value={String(skipped)}
            icon="clock"
            tone="warning"
            caption={`${pct(skipped, session.total)}%`}
          />
          <StatCard
            variant="sticker"
            label="Câu sai"
            value={String(wrong)}
            icon="close"
            tone="danger"
            caption={`${pct(wrong, session.total)}%`}
          />
          <StatCard
            variant="sticker"
            label="Band IELTS"
            value={formatBand(session.estimatedBand)}
            icon="trending"
            tone="accent"
            caption={
              session.estimatedBand == null
                ? 'Bài SAT không quy ra band'
                : `Làm trong ${formatDuration(session.durationMs)}`
            }
          />
        </Grid>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button
          label="Làm lại bài"
          variant="outline"
          iconLeft="refresh"
          onPress={() => router.push(`/read/${session.articleId}` as never)}
        />
        <Button
          label={`Xem bài giải chi tiết (${incorrect})`}
          iconRight="arrow-right"
          disabled={incorrect === 0}
          onPress={() => setFilter('incorrect')}
        />
      </View>

      {coachRequest ? <ReadingCoachPanel request={coachRequest} /> : null}

      <View className="mt-4 flex-row flex-wrap gap-4">
        {/* Danh sách câu hỏi */}
        <View className="min-w-[320px] flex-[3]">
          <Card>
            <View className="flex-row flex-wrap items-center gap-2">
              <FilterPill
                label={`All Questions (${session.attempts.length})`}
                active={filter === 'all'}
                onPress={() => setFilter('all')}
              />
              <FilterPill
                label={`Correct (${session.rawScore})`}
                active={filter === 'correct'}
                tone="success"
                onPress={() => setFilter('correct')}
              />
              <FilterPill
                label={`Incorrect (${incorrect})`}
                active={filter === 'incorrect'}
                tone="danger"
                onPress={() => setFilter('incorrect')}
              />

              <View className="flex-1" />

              <Pressable
                onPress={() => setTypeFilter('all')}
                className="rounded-pill bg-surfaceAlt px-3 py-1.5"
              >
                <Text className="font-semi text-label text-muted">
                  {typeFilter === 'all' ? 'All Types' : QUESTION_TYPE_LABEL[typeFilter]}
                </Text>
              </Pressable>
            </View>

            <View className="mt-4 gap-3">
              {filtered.map(({ attempt, question }, index) => (
                <View
                  key={attempt.questionId}
                  className="rounded-panel border border-border bg-surface p-4"
                >
                  <View className="flex-row flex-wrap items-center gap-2">
                    <View className="rounded-md bg-primary-50 px-2 py-1">
                      <Text className="font-strong text-label text-primary-700">Q{index + 1}</Text>
                    </View>
                    <Pressable onPress={() => setTypeFilter(attempt.type)}>
                      <Badge label={QUESTION_TYPE_LABEL[attempt.type]} tone="accent" />
                    </Pressable>
                    <View className="flex-1" />
                    <Badge
                      label={attempt.isCorrect ? 'Correct' : 'Incorrect'}
                      tone={attempt.isCorrect ? 'success' : 'danger'}
                    />
                  </View>

                  <Text className="mt-3 font-semi text-bodyLg text-ink">
                    {question?.prompt ?? '—'}
                  </Text>

                  {/*
                    Trạng thái ProofLoop chỉ hiện khi lượt này CÓ khoanh bằng
                    chứng. Lượt cũ và bài SAT không có trường đó — hiện
                    "chưa khoanh" cho chúng là trách người học vì một tính năng
                    chưa tồn tại lúc họ làm bài.
                  */}
                  {attempt.evidenceMark !== undefined ? (
                    <>
                      <ProofStateBadge
                        state={classify({
                          answerCorrect: attempt.isCorrect,
                          mark: attempt.evidenceMark ?? null,
                          truthParagraphIndex: question?.evidenceParagraphIndex ?? null,
                        })}
                      />
                      {article && question ? (
                        <ProbePanel
                          state={classify({
                            answerCorrect: attempt.isCorrect,
                            mark: attempt.evidenceMark ?? null,
                            truthParagraphIndex: question.evidenceParagraphIndex ?? null,
                          })}
                          mark={attempt.evidenceMark ?? null}
                          fetchProbe={async () => {
                            /*
                              Phép thử chuyển giao cần một bài KHÁC, và bài ấy
                              phải chọn ở đây chứ không ở máy chủ: kho bài nằm
                              trong bundle của client, máy chủ không có nó.

                              Nạp toàn văn có thể không ra gì (bài chỉ có tiêu
                              đề, hoặc chunk hỏng) — khi đó gửi đi mà thiếu, và
                              route trả `no-transfer-source`. Nói không chạy
                              được vẫn đúng hơn là chạy trên chính bài cũ.
                            */
                            const pick = pickTransferSource(article, ARTICLES);
                            const transfer = pick ? getArticleWithBody(pick.id) : undefined;

                            const res = await fetch('/api/proofloop/probe', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                answerCorrect: attempt.isCorrect,
                                mark: attempt.evidenceMark ?? null,
                                truthParagraphIndex: question.evidenceParagraphIndex ?? null,
                                passage: article.paragraphs.join('\n\n'),
                                questionPrompt: question.prompt,
                                correctAnswer: question.correctAnswer,
                                truthEvidenceText: question.evidenceText,
                                sourceId: article.id,
                                transferPassage: transfer?.paragraphs.join('\n\n'),
                                transferSourceId: transfer?.id,
                              }),
                            });
                            const json = await res.json();
                            lastTransferId.current = transfer?.id ?? null;
                            return json;
                          }}
                          /*
                            Kết quả phép thử phải chảy vào sổ, nếu không thì
                            `confirmed` là một trạng thái không đường nào tới
                            được ở Reading — luật công nhận vẫn đúng, vẫn có
                            test, và vẫn không bao giờ chạy.

                            Kỹ năng lấy từ DẠNG CÂU HỎI, không hỏi model. Nguồn
                            phép thử lấy từ bài vừa gửi đi; `applyOutcome` so nó
                            với nguồn gốc, và chỉ khác nhau mới tính chuyển giao.
                          */
                          onResolved={({ kind, passed }) => {
                            const skillKey = readingSkillFor(question.type);
                            if (skillKey === null) return;
                            resolveProbe({
                              skill: { domain: 'reading', key: skillKey },
                              kind,
                              passed,
                              sourceId: article.id,
                              probeSourceId: lastTransferId.current ?? article.id,
                              at: new Date().toISOString(),
                            });
                          }}
                        />
                      ) : null}
                    </>
                  ) : null}

                  <View className="mt-3 flex-row flex-wrap gap-6">
                    <View>
                      <Text className="font-mid text-label text-muted">Your Answer</Text>
                      <Text
                        className={[
                          'mt-0.5 font-strong text-body',
                          attempt.isCorrect ? 'text-success-ink' : 'text-danger-ink',
                        ].join(' ')}
                      >
                        {attempt.userAnswer || '(bỏ trống)'}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-mid text-label text-muted">Correct Answer</Text>
                      <Text className="mt-0.5 font-strong text-body text-success-ink">
                        {attempt.correctAnswer}
                      </Text>
                    </View>
                  </View>

                  {question ? (
                    <View className="mt-3 rounded-panel bg-surfaceAlt p-3">
                      <Pressable
                        onPress={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [attempt.questionId]: !prev[attempt.questionId],
                          }))
                        }
                        className="flex-row items-center justify-between"
                      >
                        <Text className="font-semi text-body text-ink">Explanation</Text>
                        <Icon
                          name={expanded[attempt.questionId] ? 'chevron-down' : 'chevron-right'}
                          size={16}
                          color={color.subtle}
                        />
                      </Pressable>

                      {expanded[attempt.questionId] !== false ? (
                        <View className="mt-2 gap-2">
                          <Text className="font-sans text-body text-body">
                            {question.explanation}
                          </Text>

                          <View
                            className="rounded-md px-2 py-1.5"
                            style={{ backgroundColor: highlightColors.yellow.fill }}
                          >
                            <Text className="font-sans text-body text-ink">
                              “{question.evidenceText}”
                            </Text>
                            <Text className="mt-1 font-mid text-label text-muted">
                              Đoạn {question.evidenceParagraphIndex + 1}
                            </Text>
                          </View>

                          {question.lessonTip ? (
                            <View className="flex-row items-start gap-2 rounded-md bg-accent-50 px-2 py-1.5">
                              <Badge label="LESSON" tone="accent" />
                              <Text className="flex-1 font-sans text-body text-accent-700">
                                {question.lessonTip}
                              </Text>
                            </View>
                          ) : null}

                          {/*
                            Nút "Why this is correct" đã bỏ (07/09/2026).

                            Nó chỉ đưa người học quay lại chính bài đọc — tức là
                            trả lời "vì sao đúng" bằng cách bảo họ tự đi tìm lấy.
                            Câu bằng chứng và đoạn số đã nằm ngay phía trên rồi;
                            thứ còn thiếu là lời giải theo bước, và đó là việc của
                            khối dưới đây.
                          */}
                          <ExplainPanel
                            paid={plan !== 'free'}
                            fetchExplanation={async () => {
                              const res = await fetch('/api/reading/explain', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  articleId: session.articleId,
                                  prompt: question.prompt,
                                  correctAnswer: question.correctAnswer,
                                  userAnswer: attempt.userAnswer,
                                  evidenceText: question.evidenceText,
                                  typeLabel: QUESTION_TYPE_LABEL[question.type],
                                }),
                              });
                              const json = (await res.json()) as { text?: string; error?: string };
                              if (!res.ok || !json.text) {
                                throw new Error(json.error ?? `Máy chủ trả ${res.status}`);
                              }
                              return json.text;
                            }}
                          />
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))}

              {filtered.length === 0 ? (
                <Text className="py-8 text-center font-sans text-body text-muted">
                  Không có câu nào khớp bộ lọc.
                </Text>
              ) : null}
            </View>
          </Card>
        </View>

        {/* Panel phải: toàn văn passage + evidence */}
        <View className="min-w-[300px] flex-[2]">
          <Card>
            <SectionHeader
              title={`Passage: ${session.articleTitle}`}
              icon="book"
              right={
                <Pressable
                  onPress={() => setShowHighlights((v) => !v)}
                  className={[
                    'h-6 w-11 justify-center rounded-pill px-0.5',
                    showHighlights ? 'bg-primary-600' : 'bg-surfaceAlt',
                  ].join(' ')}
                >
                  <View
                    className={[
                      'h-5 w-5 rounded-pill bg-white',
                      showHighlights ? 'self-end' : 'self-start',
                    ].join(' ')}
                  />
                </Pressable>
              }
            />

            <Text className="mt-1 font-mid text-label text-muted">Your Highlights</Text>

            <View className="mt-3 gap-3">
              {(article?.paragraphs ?? []).map((paragraph, index) => {
                const evidence = rows
                  .map((r, i) => ({ ...r, order: i }))
                  .filter((r) => r.question?.evidenceParagraphIndex === index);

                const marked = showHighlights && evidence.length > 0;

                return (
                  <View key={index} className="flex-row gap-2">
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-md ${
                        marked ? 'bg-primary-600' : 'bg-surfaceAlt'
                      }`}
                    >
                      <Text
                        className={`font-strong text-label ${marked ? 'text-white' : 'text-muted'}`}
                      >
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>

                    {/*
                      CẢ ĐOẠN được đánh dấu, không chỉ câu trích.

                      Câu trích chỉ tô được khi dò ra vị trí của nó; mà `evidenceParagraphIndex`
                      thì LUÔN có. Nên đoạn chứa đáp án được nền nhạt + viền trái + chữ
                      cái đảo màu — ba dấu hiệu ấy không phụ thuộc việc dò chuỗi, nên
                      người học luôn nhìn ra ngay đáp án nằm ở đoạn nào, kể cả khi câu
                      trích của model chép sai một dấu và không tô được.
                    */}
                    <View
                      className={
                        marked
                          ? 'flex-1 rounded-panel border-l-[3px] border-primary bg-primary-50 px-3 py-2'
                          : 'flex-1'
                      }
                    >
                      <Text className="font-sans text-body text-body">
                        {marked ? renderWithEvidence(paragraph, evidence) : paragraph}
                      </Text>

                      {marked ? (
                        <Text className="mt-1.5 font-mid text-label text-primary-700">
                          Đáp án câu {evidence.map((e) => e.order + 1).join(', ')} nằm ở đoạn này
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>

            <View className="mt-4 flex-row flex-wrap items-center gap-3 border-t border-border pt-3">
              <LegendDot color={highlightColors.yellow.dot} label="Evidence câu sai" />
              <LegendDot color={highlightColors.green.dot} label="Evidence câu đúng" />
              <View className="flex-1" />
              <Pressable onPress={() => setShowHighlights(false)}>
                <Text className="font-semi text-label text-primary-600">Clear all highlights</Text>
              </Pressable>
            </View>

            <View className="mt-4 flex-row items-start gap-2 rounded-panel bg-primary-50 p-3">
              <QuestionTypeIcon type={worstType(session.attempts)} size={32} />
              <View className="flex-1">
                <Text className="font-semi text-body text-primary-700">Gợi ý luyện tiếp</Text>
                <Text className="mt-0.5 font-sans text-label text-muted">
                  Dạng yếu nhất lượt này: {QUESTION_TYPE_LABEL[worstType(session.attempts)]}. Vào
                  Progress để sinh bộ bài tập riêng cho dạng đó.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </View>
    </Screen>
  );
}

function renderWithEvidence(
  paragraph: string,
  evidence: { question?: { evidenceText: string }; attempt: { isCorrect: boolean }; order: number }[],
): React.ReactNode {
  /*
    Tô MỌI câu trích trong đoạn, không chỉ câu đầu.

    Bản trước chỉ lấy `evidence[0]`, nên khi hai câu hỏi cùng dựa vào một đoạn
    thì câu thứ hai không được chỉ ra — mà đó lại đúng lúc người học cần nhất,
    vì hai câu cùng đoạn là chỗ dễ lẫn nhất.
  */
  const found = evidence
    .map((e) => {
      const text = e.question?.evidenceText;
      const span = text ? findEvidenceSpan(paragraph, text) : null;
      return span ? { span, isCorrect: e.attempt.isCorrect } : null;
    })
    .filter((x): x is { span: EvidenceSpan; isCorrect: boolean } => x !== null);

  if (found.length === 0) return paragraph;

  // Gộp trước khi tô: hai vùng chồng nhau sẽ đè màu lên nhau và nhoè ranh giới.
  const spans = mergeSpans(found.map((f) => f.span));

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const [i, span] of spans.entries()) {
    if (span.start > cursor) parts.push(paragraph.slice(cursor, span.start));

    // Một vùng gộp có thể trùm cả câu đúng lẫn câu sai; ưu tiên màu của câu SAI
    // vì đó là chỗ người học cần xem lại.
    const wrong = found.some((f) => f.span.start < span.end && f.span.end > span.start && !f.isCorrect);
    const fill = wrong ? highlightColors.yellow.fill : highlightColors.green.fill;

    parts.push(
      <Text key={`ev-${i}`} style={{ backgroundColor: fill }}>
        {paragraph.slice(span.start, span.end)}
      </Text>,
    );
    cursor = span.end;
  }

  if (cursor < paragraph.length) parts.push(paragraph.slice(cursor));

  return <>{parts}</>;
}

function worstType(attempts: { type: QuestionType; isCorrect: boolean }[]): QuestionType {
  const tally = new Map<QuestionType, { correct: number; total: number }>();

  for (const attempt of attempts) {
    const entry = tally.get(attempt.type) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (attempt.isCorrect) entry.correct += 1;
    tally.set(attempt.type, entry);
  }

  let worst: QuestionType = 'true_false_not_given';
  let worstRate = 2;

  for (const [type, v] of tally) {
    const rate = v.correct / v.total;
    if (rate < worstRate) {
      worstRate = rate;
      worst = type;
    }
  }

  return worst;
}

function FilterPill({
  label,
  active,
  tone = 'primary',
  onPress,
}: {
  label: string;
  active: boolean;
  tone?: 'primary' | 'success' | 'danger';
  onPress: () => void;
}) {
  const activeClass =
    tone === 'success'
      ? 'bg-success-soft'
      : tone === 'danger'
        ? 'bg-danger-soft'
        : 'bg-primary-50';
  const activeText =
    tone === 'success' ? 'text-success-ink' : tone === 'danger' ? 'text-danger-ink' : 'text-primary-700';

  return (
    <Pressable
      onPress={onPress}
      className={['rounded-pill px-3 py-1.5', active ? activeClass : 'bg-surface'].join(' ')}
    >
      <Text className={['font-semi text-label', active ? activeText : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}

function LegendDot({ color: dot, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2.5 w-2.5 rounded-pill" style={{ backgroundColor: dot }} />
      <Text className="font-mid text-label text-muted">{label}</Text>
    </View>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/** Phần trăm làm tròn, và 0/0 ra 0 chứ không ra NaN. */
function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
