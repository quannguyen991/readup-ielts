import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { EvidenceTable, NotesList } from '@/components/sat-rw/ItemBody';
import { PassageText } from '@/components/sat-rw/PassageText';
import { Icon, PaperCard } from '@/components/ui';
import type { SatRwQuestion } from '@/data/sat-rw-repository';
import { WordNotes } from '@/components/sat-rw/WordNotes';
import { color, paper } from '@/theme/tokens';

/**
 * Một câu SAT R&W: đoạn văn, câu hỏi, bốn phương án, và lời giải hiện ngay sau
 * khi chọn.
 *
 * Tách khỏi màn luyện unit để màn "đề trộn" dùng lại nguyên vẹn. Hai màn khác
 * nhau ở chỗ LẤY CÂU TỪ ĐÂU và tiêu đề hiện gì, còn phần trình bày một câu thì
 * phải giống hệt — người học không nên phải học lại cách đọc màn hình chỉ vì đổi
 * kiểu luyện.
 *
 * Chọn xong là KHOÁ, không đổi được nữa: sửa lựa chọn sau khi đã thấy đáp án thì
 * con số đúng/sai không còn nói lên điều gì.
 */
export function QuestionCard({
  question,
  picked,
  onPick,
  showSolution = true,
  hidden = [],
}: {
  question: SatRwQuestion;
  picked: number | null;
  onPick: (choice: number) => void;
  /** Phương án Cú đã loại (game khi học) — mờ, gạch ngang, không bấm được. */
  hidden?: number[];
  /**
   * Có được hiện lời giải chưa.
   *
   * Màn đề trộn giữ lại lời giải cho tới khi người học trả lời xong câu "câu này
   * kiểm luật gì". Hiện lời giải trước thì câu hỏi ấy vô nghĩa — đáp án và tên
   * luật đã nằm sẵn trên màn hình. Mặc định `true` để màn luyện unit giữ nguyên
   * hành vi cũ.
   */
  showSolution?: boolean;
}) {
  const answered = picked !== null;

  return (
    <PaperCard>
      <PassageText passage={question.passage} underline={question.underline} tone="paper" />
      {/*
        Ghi chú và bảng số CHỈ câu sinh mới có, nhưng phải vẽ ở đây chứ không
        chỉ ở phòng thi: bộ "Sinh mới" của lộ trình đi qua đúng thẻ này, và một
        câu hỏi "dùng số liệu trong bảng" mà không có bảng thì không trả lời
        được. Dùng lại đúng hai component của `ItemBody` nên hai nơi vẽ bảng
        giống hệt nhau.
      */}
      {question.notes ? <NotesList notes={question.notes} /> : null}
      {question.table ? <EvidenceTable table={question.table} /> : null}

      <Text className="mt-4 font-strong text-body text-paper-ink">{question.stem}</Text>

      <View className="mt-3 gap-2">
        {question.options.map((option, i) => {
          const isAnswer = i === question.answerIndex;
          const isPicked = picked === i;
          const out = !answered && hidden.includes(i) && !isAnswer;

          const tone = !answered
            ? { border: paper.brandSoft, bg: '#FFFFFF' }
            : isAnswer
              ? { border: color.success, bg: color.successSoft }
              : isPicked
                ? { border: color.danger, bg: color.dangerSoft }
                : { border: paper.brandSoft, bg: '#FFFFFF' };

          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              aria-selected={isPicked} aria-disabled={answered || out}
              accessibilityLabel={out ? `${'ABCD'[i]}. ${option} — Cú đã loại` : undefined}
              disabled={answered || out}
              onPress={() => onPick(i)}
              className="flex-row items-start gap-3 rounded-panel border px-3.5 py-3"
              style={{ borderColor: tone.border, backgroundColor: tone.bg, opacity: out ? 0.38 : 1 }}
            >
              <View
                className="h-6 w-6 items-center justify-center rounded-pill"
                style={{ backgroundColor: answered && isAnswer ? color.success : paper.brandTint }}
              >
                <Text
                  className="font-strong text-label"
                  style={{ color: answered && isAnswer ? '#FFFFFF' : paper.body }}
                >
                  {'ABCD'[i]}
                </Text>
              </View>
              <Text
                className="min-w-0 flex-1 font-sans text-body text-paper-ink"
                style={out ? { textDecorationLine: 'line-through' } : undefined}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {answered && showSolution ? (
        <View
          className="mt-4 rounded-panel border-l-4 p-3.5"
          style={{
            borderLeftColor: picked === question.answerIndex ? color.success : color.warning,
            backgroundColor: paper.brandTint,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Icon
              name={picked === question.answerIndex ? 'check' : 'info'}
              size={16}
              color={picked === question.answerIndex ? color.success : color.warning}
              strokeWidth={2.2}
            />
            <Text className="font-strong text-body text-paper-ink">
              {picked === question.answerIndex ? 'Đúng rồi' : `Đáp án đúng là ${'ABCD'[question.answerIndex]}`}
            </Text>
          </View>
          <Text className="mt-1.5 font-sans text-body text-paper-body" style={{ lineHeight: 23 }}>
            {question.solutionVi}
          </Text>
        </View>
      ) : null}

      {/* Từ điển của bốn phương án: định nghĩa, đồng nghĩa, trái nghĩa, ví dụ. */}
      {answered && showSolution ? <WordNotes options={question.options} answerIndex={question.answerIndex} /> : null}
    </PaperCard>
  );
}
