import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Button, Icon, PaperCard } from '@/components/ui';
import { buildMixedRuleQuestionSet } from '@/services/questions/build-set';
import type { GeneratedQuestion } from '@/services/questions/types';
import type { TranscriptSentence } from '@/services/youtube/transcript';
import { observeSkill } from '@/store/useMasteryStore';
import { color, paper } from '@/theme/tokens';
import { useGameStore } from '@/store/useGameStore';
import { currentLocale, pick, useL } from '@/i18n/useL';

/**
 * Nghe hiểu: câu hỏi sinh thẳng từ phụ đề của chính video đang xem.
 *
 * VÌ SAO CÓ PHẦN NÀY BÊN CẠNH CHÉP CHÍNH TẢ. Chép chính tả rèn tai bắt được ÂM —
 * rất hợp khi còn chưa nghe ra từ. Nhưng chép đúng từng chữ mà không hiểu người
 * ta đang nói gì thì vẫn không trả lời được đề Listening thật: đề hỏi ý chính,
 * hỏi thái độ người nói, hỏi thông tin đã được diễn đạt lại bằng từ khác. Đó là
 * hai kỹ năng khác nhau, và cái thứ hai không tự đến từ cái thứ nhất.
 *
 * Câu hỏi sinh TỪ PHỤ ĐỀ CHỨ KHÔNG SOẠN SẴN, nên bất kỳ video nào người học dán
 * vào cũng có đề — kể cả video vừa đăng hôm qua.
 *
 * Phụ đề chỉ đi qua máy chủ một lượt để sinh đề rồi thôi, không lưu lại thành
 * nội dung của app; video vẫn phát qua trình nhúng chính thức của YouTube.
 */

type Props = {
  videoId: string;
  sentences: TranscriptSentence[];
  /** Bấm vào dẫn chứng thì nhảy tới đúng chỗ đó trong video. */
  onSeek: (seconds: number) => void;
};

type Status = 'loading' | 'ready' | 'error';

/** Gom câu thành đoạn để model có ngữ cảnh, thay vì hỏi trên từng câu rời. */
const SENTENCES_PER_PARAGRAPH = 6;

/**
 * Ba dạng câu có bộ phương án CỐ ĐỊNH theo luật đề, không do model nghĩ ra.
 *
 * Model trả `options: null` cho chúng lúc có lúc không — đo thật trên production:
 * cùng một dạng true_false_not_given, lượt này kèm đủ ba phương án, lượt sau để
 * trống. Không tự bù thì đúng những lượt ấy hiện ra ô gõ tự do, và người học phải
 * đoán xem nên gõ "TRUE", "True" hay "Đúng".
 */
const FIXED_OPTIONS: Partial<Record<string, string[]>> = {
  true_false_not_given: ['TRUE', 'FALSE', 'NOT GIVEN'],
  yes_no_not_given: ['YES', 'NO', 'NOT GIVEN'],
};

/** Phương án để hiện: của model nếu có, không thì bộ cố định của dạng câu. */
function optionsFor(question: GeneratedQuestion): string[] {
  if (question.options?.length) return question.options;
  return FIXED_OPTIONS[question.type] ?? [];
}

export function ListeningQuiz({ videoId, sentences, onSeek }: Props) {
  // Bắt đầu ở 'loading' chứ không phải 'idle': lượt sinh đầu luôn chạy ngay khi
  // mở tab, nên để 'idle' rồi lại đổi sang 'loading' ngay trong effect là một
  // lượt render thừa — và là đúng cái React Compiler cảnh báo.
  const [status, setStatus] = useState<Status>('loading');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  /** Đoạn người học cho là chứa đáp án — trục thứ hai của sổ bằng chứng. */
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const { L } = useL();

  /**
   * Đoạn văn, kèm mốc thời gian của câu đầu mỗi đoạn.
   *
   * Giữ mốc lại để bấm vào dẫn chứng là tua được tới chỗ đó — không có nó thì
   * người học đọc "đáp án nằm ở đoạn 3" rồi phải tự mò lại trong video.
   */
  const { paragraphs, startAt } = useMemo(() => {
    const out: string[] = [];
    const marks: number[] = [];
    for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARAGRAPH) {
      const group = sentences.slice(i, i + SENTENCES_PER_PARAGRAPH);
      if (group.length === 0) continue;
      out.push(group.map((s) => s.text).join(' '));
      marks.push(group[0]?.start ?? 0);
    }
    return { paragraphs: out, startAt: marks };
  }, [sentences]);

  const load = useCallback(async () => {
    /*
      DỰNG NGAY TRÊN MÁY, KHÔNG GỌI MẠNG.

      Trước đây mỗi lần mở tab này là một lượt gọi `/api/questions`, tức một lượt
      gọi AI cho một video mà phần lớn người vào đây chỉ để chép chính tả. Bộ
      sinh theo luật dựng đề từ chính phụ đề, xong trong vài mili giây, và không
      tốn lượt gọi nào — cùng cách đề đọc đã chuyển sang từ 07/09/2026.

      Phụ đề không phải văn xuôi học thuật nên số câu dựng được ít hơn bài đọc;
      trộn dạng là hợp ở đây, vì đây là luyện nghe chứ không phải thi Reading.
    */
    try {
      const set = buildMixedRuleQuestionSet({
        id: `yt-${videoId}`,
        title: `Video ${videoId}`,
        paragraphs,
      });
      if (set.questions.length === 0) {
        throw new Error(
          pick(
            currentLocale(),
            'Phụ đề này quá ngắn hoặc quá ít từ để dựng được câu hỏi.',
            'These subtitles are too short or have too few words to build questions.',
          ),
        );
      }
      setQuestions(set.questions);
      setError(null);
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(currentLocale(), 'Lỗi lạ', 'Unexpected error'));
      setStatus('error');
    }
  }, [paragraphs, videoId]);

  /*
    Chỉ dựng khi người học mở tab này, không dựng sẵn lúc nạp video.

    Hoãn một nhịp thay vì gọi thẳng trong effect. Lý do thật, không phải để chiều
    lint: `load` có `setState` bên trong, nên gọi thẳng là chạy cả bộ dựng đề ngay
    giữa lượt commit của màn — chặn đúng vào lúc người dùng vừa bấm sang tab và
    đang chờ thấy khung chờ hiện ra. Dời ra sau commit thì khung chờ vẽ trước.
    `clearTimeout` lo trường hợp rời tab trước khi kịp dựng.
  */
  useEffect(() => {
    if (paragraphs.length === 0) return;
    const defer = setTimeout(() => void load(), 0);
    return () => clearTimeout(defer);
  }, [paragraphs.length, load]);

  /** Bấm "Ra đề khác"/"Thử lại" — ở đây đặt cờ chờ là hợp lệ, đang trong handler. */
  const reload = () => {
    setStatus('loading');
    setAnswers({});
    setMarks({});
    void load();
  };

  if (paragraphs.length === 0) {
    return (
      <PaperCard>
        <Text className="font-sans text-body text-paper-body">
          {L('Phụ đề của video này quá ngắn để sinh câu hỏi nghe hiểu.', 'This video’s subtitles are too short to generate listening questions.')}
        </Text>
      </PaperCard>
    );
  }

  if (status === 'loading') {
    return (
      <PaperCard className="items-center py-10">
        <ActivityIndicator color={paper.brandMid} />
        <Text className="mt-3 font-sans text-body text-paper-muted">
          {L('Đang đọc phụ đề và ra đề nghe hiểu…', 'Reading the subtitles and building listening questions…')}
        </Text>
        <Text className="mt-1 font-sans text-label text-paper-muted">
          {L('Mất khoảng 10–20 giây cho một video.', 'Takes about 10–20 seconds per video.')}
        </Text>
      </PaperCard>
    );
  }

  if (status === 'error') {
    return (
      <PaperCard>
        <View className="flex-row items-center gap-2">
          <Icon name="info" size={18} color={color.warning} strokeWidth={2.2} />
          <Text className="font-strong text-body text-paper-ink">{L('Chưa ra được đề', 'Couldn’t build questions')}</Text>
        </View>
        <Text className="mt-1.5 font-sans text-body text-paper-body">{error}</Text>
        <Button
          className="mt-4 self-start"
          variant="brand"
          label={L('Thử lại', 'Try again')}
          iconLeft="refresh"
          onPress={reload}
        />
      </PaperCard>
    );
  }

  const answered = questions.filter((q) => answers[q.id]).length;
  const correct = questions.filter((q) => sameAnswer(answers[q.id] ?? null, q.correctAnswer)).length;

  return (
    <View>
      <View className="mb-3 flex-row flex-wrap items-center gap-2">
        <Text className="font-strong text-body text-paper-ink">
          {L(`${answered}/${questions.length} câu đã trả lời`, `${answered}/${questions.length} answered`)}
        </Text>
        {answered > 0 ? (
          <Text className="font-sans text-label text-paper-body">{L(`· đúng ${correct}`, `· ${correct} correct`)}</Text>
        ) : null}
        <View className="flex-1" />
        <Button variant="brandOutline" label={L('Ra đề khác', 'New questions')} iconLeft="refresh" onPress={reload} />
      </View>

      <View className="gap-3">
        {questions.map((q, i) => (
          <QuizItem
            key={q.id}
            question={q}
            order={i + 1}
            picked={answers[q.id] ?? null}
            paragraphCount={paragraphs.length}
            markedPart={marks[q.id] ?? null}
            onPick={(value) => {
              if (answers[q.id]) return;
              setAnswers((prev) => (prev[q.id] ? prev : { ...prev, [q.id]: value }));
              useGameStore.getState().answer(sameAnswer(value, q.correctAnswer), 'listen', { key: `lq:${q.id}` });
            }}
            onMark={(part) => {
              if (marks[q.id] !== undefined) return;
              setMarks((prev) => ({ ...prev, [q.id]: part }));
              observeSkill({
                skill: { domain: 'listening', key: q.type },
                sourceId: `yt-${videoId}`,
                answerCorrect: sameAnswer(answers[q.id] ?? null, q.correctAnswer),
                pointer: { kind: 'transcript-line', index: part },
                truth: { kind: 'transcript-line', index: q.evidenceParagraphIndex },
                at: new Date().toISOString(),
              });
            }}
            onSeek={() => onSeek(startAt[q.evidenceParagraphIndex] ?? 0)}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Câu ĐIỀN TỪ — không có phương án để bấm.
 *
 * Bốn trong tám câu mà model sinh ra là dạng điền (sentence completion, short
 * answer). Bản đầu của màn này chỉ vẽ danh sách phương án, nên đúng những câu ấy
 * hiện ra như một câu hỏi cụt: đọc được đề mà không có chỗ nào trả lời.
 *
 * Chấm rộng tay: bỏ hoa thường, bỏ dấu câu, bỏ mạo từ ở đầu. Đề IELTS thật chấp
 * nhận "expel" cho "expel." và "the algae" cho "algae"; bắt gõ khớp từng ký tự là
 * chấm sai chứ không phải chấm chặt.
 */
function FillIn({
  question,
  picked,
  onPick,
}: {
  question: GeneratedQuestion;
  picked: string | null;
  onPick: (value: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const answered = picked !== null;
  const { L } = useL();

  return (
    <View className="mt-3 flex-row flex-wrap items-center gap-2">
      <TextInput
        value={answered ? picked : draft}
        onChangeText={setDraft}
        editable={!answered}
        placeholder={L('Gõ câu trả lời…', 'Type your answer…')}
        placeholderTextColor={paper.muted}
        onSubmitEditing={() => draft.trim() && onPick(draft.trim())}
        className="min-w-[220px] flex-1 rounded-panel border px-3.5 py-2.5 font-sans text-body text-paper-ink"
        style={{
          borderColor: answered
            ? sameAnswer(picked, question.correctAnswer)
              ? color.success
              : color.danger
            : paper.brandSoft,
          backgroundColor: '#FFFFFF',
        }}
      />
      {!answered ? (
        <Button
          variant="brand"
          size="sm"
          label={L('Trả lời', 'Answer')}
          onPress={() => draft.trim() && onPick(draft.trim())}
        />
      ) : null}
    </View>
  );
}

/** So đáp án điền: bỏ hoa thường, dấu câu, và mạo từ đứng đầu. */
export function sameAnswer(a: string | null, b: string): boolean {
  const chuan = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/^(a|an|the)\s+/, '')
      .replace(/\s+/g, ' ')
      .trim();
  return a !== null && chuan(a) === chuan(b);
}

function QuizItem({
  question,
  order,
  picked,
  paragraphCount,
  markedPart,
  onPick,
  onMark,
  onSeek,
}: {
  question: GeneratedQuestion;
  order: number;
  picked: string | null;
  paragraphCount: number;
  /** Đoạn người học đã chỉ, hoặc `null` nếu chưa chỉ. */
  markedPart: number | null;
  onPick: (value: string) => void;
  onMark: (part: number) => void;
  onSeek: () => void;
}) {
  const answered = picked !== null;
  const marked = markedPart !== null;
  const right = sameAnswer(picked, question.correctAnswer);
  const options = optionsFor(question);
  const { L } = useL();

  return (
    <PaperCard>
      <View className="flex-row gap-3">
        <View
          className="h-7 w-7 items-center justify-center rounded-pill"
          style={{ backgroundColor: paper.brandTint }}
        >
          <Text className="font-strong text-label" style={{ color: paper.body }}>
            {order}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          {question.instruction ? (
            <Text className="mb-1 font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 12 }}>
              {question.instruction}
            </Text>
          ) : null}
          <Text className="font-mid text-bodyLg text-paper-ink" style={{ lineHeight: 25 }}>
            {question.prompt}
          </Text>
        </View>
      </View>

      {options.length === 0 ? (
        <FillIn question={question} picked={picked} onPick={onPick} />
      ) : (
      <View className="mt-3 gap-2">
        {options.map((option) => {
          const isAnswer = option === question.correctAnswer;
          const isPicked = option === picked;
          const tone = !answered
            ? { border: paper.brandSoft, bg: '#FFFFFF' }
            : isAnswer
              ? { border: color.success, bg: color.successSoft }
              : isPicked
                ? { border: color.danger, bg: color.dangerSoft }
                : { border: paper.brandSoft, bg: '#FFFFFF' };

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              aria-selected={isPicked} aria-disabled={answered}
              disabled={answered}
              onPress={() => onPick(option)}
              className="rounded-panel border px-3.5 py-2.5"
              style={{ borderColor: tone.border, backgroundColor: tone.bg }}
            >
              <Text className="font-sans text-body text-paper-ink">{option}</Text>
            </Pressable>
          );
        })}
      </View>
      )}

      {/*
        Hỏi "nghe thấy ở đoạn nào" TRƯỚC khi hiện lời giải.

        Đây là trục thứ hai của sổ bằng chứng ở mảng Nghe, đóng đúng vai trò mà
        "khoanh đoạn chứa đáp án" đóng ở mảng Đọc. Trả lời đúng mà chỉ sai đoạn
        nghĩa là bắt được từ khoá chứ chưa theo được mạch — hai chuyện khác nhau,
        và không hỏi thì không tách ra được.

        Hiện lời giải trước rồi mới hỏi thì câu hỏi thành vô nghĩa: đáp án đã nằm
        trên màn hình.
      */}
      {answered && !marked ? (
        <View className="mt-3 rounded-panel border border-paper-line bg-white p-3.5">
          <Text className="font-strong text-label text-paper-ink">
            {L('Bạn nghe thấy đáp án ở đoạn nào?', 'Which part did you hear the answer in?')}
          </Text>
          <Text className="mt-0.5 font-sans text-label text-paper-muted">
            {L('Chọn xong mới hiện lời giải. Chọn sai không bị trừ gì.', 'The explanation appears once you pick. A wrong pick costs nothing.')}
          </Text>
          <View className="mt-2.5 flex-row flex-wrap gap-1.5">
            {Array.from({ length: paragraphCount }, (_, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                onPress={() => onMark(i)}
                className="rounded-pill border border-brand-soft bg-white px-3 py-1.5"
              >
                <Text className="font-semi text-label text-paper-body">{L('Đoạn', 'Part')} {i + 1}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {answered && marked ? (
        <View
          className="mt-3 rounded-panel border-l-4 p-3.5"
          style={{
            borderLeftColor: right ? color.success : color.warning,
            backgroundColor: paper.brandTint,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Icon
              name={right ? 'check' : 'info'}
              size={16}
              color={right ? color.success : color.warning}
              strokeWidth={2.2}
            />
            <Text className="font-strong text-body text-paper-ink">
              {right ? L('Đúng rồi', 'Correct') : L(`Đáp án đúng: ${question.correctAnswer}`, `Correct answer: ${question.correctAnswer}`)}
            </Text>
          </View>

          {question.explanation ? (
            <Text className="mt-1.5 font-sans text-body text-paper-body" style={{ lineHeight: 23 }}>
              {question.explanation}
            </Text>
          ) : null}

          {markedPart !== null ? (
            <Text className="mt-1.5 font-sans text-label text-paper-muted" style={{ lineHeight: 19 }}>
              {markedPart === question.evidenceParagraphIndex
                ? L(
                    `Bạn chỉ đúng đoạn ${markedPart + 1} — chỗ thật sự chứa đáp án.`,
                    `You picked part ${markedPart + 1} — exactly where the answer is.`,
                  )
                : L(
                    `Bạn chỉ đoạn ${markedPart + 1}, nhưng đáp án nằm ở đoạn ${question.evidenceParagraphIndex + 1}.`,
                    `You picked part ${markedPart + 1}, but the answer is in part ${question.evidenceParagraphIndex + 1}.`,
                  )}
            </Text>
          ) : null}

          {question.evidenceText ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSeek}
              className="mt-2.5 flex-row items-start gap-2 rounded-panel bg-white/70 p-2.5"
            >
              <Icon name="play" size={14} color={paper.brandMid} strokeWidth={2.2} />
              <Text className="min-w-0 flex-1 font-mid text-label text-paper-body" style={{ lineHeight: 19 }}>
                “{question.evidenceText}” — {L('bấm để nghe lại đúng chỗ này', 'tap to replay this exact spot')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </PaperCard>
  );
}
