import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { EvidenceMarker } from '@/components/reader/EvidenceMarker';
import { Badge, Button, Card } from '@/components/ui';
import { QUESTION_TYPE_LABEL, type GeneratedQuestion } from '@/services/questions/types';
import { groupIntoBlocks, optionsFor } from './QuestionBlocks';
import type { EvidenceMark } from '@/services/proofloop/types';
import { color } from '@/theme/tokens';
import type { QuestionType } from '@/types/database';

/**
 * Panel câu hỏi bên phải màn hình đọc: lưới số câu, lọc theo dạng,
 * Clear Answer / Mark for Review / Submit — bám ảnh tham chiếu số 2.
 */
export function QuestionPanel({
  questions,
  answers,
  marked,
  onAnswer,
  onToggleMark,
  onSubmit,
  submitting,
  evidenceMarks,
  evidenceFor,
  onStartEvidence,
  onClearEvidence,
}: {
  questions: GeneratedQuestion[];
  answers: Record<string, string>;
  marked: Record<string, boolean>;
  onAnswer: (questionId: string, answer: string) => void;
  onToggleMark: (questionId: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  /**
   * Bốn prop ProofLoop dưới đây đều TUỲ CHỌN.
   *
   * Panel này còn phục vụ SAT và bài dán tay — những chỗ chưa bật ProofLoop.
   * Bắt buộc chúng là làm hỏng ba màn khác để thêm một tính năng cho một màn.
   */
  evidenceMarks?: Record<string, EvidenceMark>;
  evidenceFor?: string | null;
  onStartEvidence?: (questionId: string) => void;
  onClearEvidence?: (questionId: string) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');

  const types = useMemo(
    () => [...new Set(questions.map((q) => q.type))] as QuestionType[],
    [questions],
  );

  const visible = useMemo(
    () => (typeFilter === 'all' ? questions : questions.filter((q) => q.type === typeFilter)),
    [questions, typeFilter],
  );

  const answered = Object.keys(answers).filter((id) => answers[id]).length;

  if (visible.length === 0) {
    return (
      <Card>
        <Text className="font-sans text-body text-muted">Chưa có câu hỏi nào cho bài này.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Text className="font-strong text-cardTitle text-ink">Questions</Text>
        <Text className="font-mid text-label text-muted">
          {answered} / {questions.length} đã trả lời
        </Text>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        {visible.map((q, index) => {
          const isAnswered = Boolean(answers[q.id]);
          const isMarked = marked[q.id];

          /*
            Dải số giờ là BẢNG TRẠNG THÁI, không phải thanh điều hướng.

            Cả bộ câu đã hiện hết bên dưới nên không còn "câu đang mở" để nhảy
            tới; việc còn lại của dải này là cho biết câu nào đã trả lời và câu
            nào đã đánh dấu — liếc một cái là thấy còn sót chỗ nào.
          */
          return (
            <View
              key={q.id}
              accessibilityLabel={`Câu ${index + 1}`}
              className={[
                'h-8 w-8 items-center justify-center rounded-md border',
                isAnswered ? 'border-primary-200 bg-primary-50' : 'border-border bg-surface',
              ].join(' ')}
            >
              <Text
                className={[
                  'font-semi text-label',
                  isAnswered ? 'text-primary-700' : 'text-muted',
                ].join(' ')}
              >
                {index + 1}
              </Text>
              {isMarked ? (
                <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-pill bg-warning" />
              ) : null}
            </View>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
        <View className="flex-row gap-2">
          <FilterChip
            label="Tất cả"
            active={typeFilter === 'all'}
            onPress={() => {
              setTypeFilter('all');
            }}
          />
          {types.map((type) => (
            <FilterChip
              key={type}
              label={QUESTION_TYPE_LABEL[type]}
              active={typeFilter === type}
              onPress={() => {
                setTypeFilter(type);
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/*
        LIỆT KÊ CẢ KHỐI, KHÔNG PHẢI MỘT CÂU MỘT LÚC.

        Bản trước hiện đúng một câu và bắt bấm mũi tên để đi tiếp. Đề thi thật in
        cả khối ra một lượt, và điều đó không phải chuyện in ấn: rất nhiều câu
        TFNG chỉ trả lời được khi đã liếc câu sau, còn khối nối tiêu đề thì bắt
        buộc phải thấy hết danh sách mới chọn được. Che đi chín câu là bắt người
        học luyện một bài thi không tồn tại.

        Lời dẫn đứng MỘT LẦN cho cả khối, đúng chỗ nó đứng trong đề.
      */}
      {groupIntoBlocks(visible).map((block) => (
        <View key={`${block.type}-${block.from}`} className="mt-4 border-t border-border pt-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-heavy text-cardTitle text-ink">
              {block.from === block.to
                ? `Question ${block.from}`
                : `Questions ${block.from}–${block.to}`}
            </Text>
            <Badge label={QUESTION_TYPE_LABEL[block.type]} tone="accent" />
          </View>

          {block.rubric ? (
            <Text className="mt-2 font-sans text-label text-muted">{block.rubric}</Text>
          ) : null}

          <View className="mt-3 gap-3">
            {block.questions.map((question, i) => {
              const choices = optionsFor(question);
              const number = block.from + i;

              return (
                <View
                  key={question.id}
                  className="rounded-panel border border-border bg-surface p-3.5"
                >
                  <View className="flex-row gap-2.5">
                    <View className="h-7 w-7 items-center justify-center rounded-md border border-border bg-surfaceAlt">
                      <Text className="font-heavy text-label text-muted">{number}</Text>
                    </View>
                    <Text className="flex-1 font-semi text-body text-ink">{question.prompt}</Text>
                  </View>

                  {onStartEvidence ? (
                    <EvidenceMarker
                      mark={evidenceMarks?.[question.id]}
                      active={evidenceFor === question.id}
                      onStart={() => onStartEvidence(question.id)}
                      onClear={() => onClearEvidence?.(question.id)}
                    />
                  ) : null}

                  <View className="mt-3">
                    {choices ? (
                      /*
                        Ba lựa chọn TFNG nằm NGANG khi đủ chỗ: chúng ngắn, và xếp
                        dọc thì một câu chiếm gần nửa màn hình, làm khối mười ba
                        câu dài gấp đôi mà không thêm thông tin nào.
                      */
                      <View className="flex-row flex-wrap gap-2">
                        {choices.map((option) => {
                          const selected = answers[question.id] === option;
                          return (
                            <Pressable
                              key={option}
                              onPress={() => onAnswer(question.id, option)}
                              className={[
                                'flex-row items-center gap-2 rounded-panel border px-3 py-2',
                                selected
                                  ? 'border-primary-600 bg-primary-50'
                                  : 'border-border bg-surface',
                              ].join(' ')}
                            >
                              <View
                                className={[
                                  'h-4 w-4 items-center justify-center rounded-pill border',
                                  selected ? 'border-primary-600 bg-primary-600' : 'border-borderStrong',
                                ].join(' ')}
                              >
                                {selected ? (
                                  <View className="h-1.5 w-1.5 rounded-pill bg-white" />
                                ) : null}
                              </View>
                              <Text
                                className={[
                                  'font-mid text-label',
                                  selected ? 'text-primary-700' : 'text-body',
                                ].join(' ')}
                              >
                                {option}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : (
                      <TextInput
                        value={answers[question.id] ?? ''}
                        onChangeText={(text) => onAnswer(question.id, text)}
                        placeholder="Nhập câu trả lời…"
                        placeholderTextColor={color.subtle}
                        className="h-11 rounded-panel border border-border bg-surface px-3 font-sans text-body text-ink"
                        style={{ outlineStyle: 'none' } as never}
                      />
                    )}
                  </View>

                  <View className="mt-2.5 flex-row items-center gap-2">
                    <Pressable onPress={() => onAnswer(question.id, '')}>
                      <Text className="font-semi text-label text-muted">Xoá</Text>
                    </Pressable>
                    <Text className="text-muted">·</Text>
                    <Pressable onPress={() => onToggleMark(question.id)}>
                      <Text
                        className={[
                          'font-semi text-label',
                          marked[question.id] ? 'text-accent-700' : 'text-muted',
                        ].join(' ')}
                      >
                        {marked[question.id] ? 'Bỏ đánh dấu' : 'Đánh dấu xem lại'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <View className="mt-4">
        <Button
          label="Submit Answers"
          iconRight="check"
          fullWidth
          loading={submitting}
          className="mt-4"
          onPress={onSubmit}
        />
      </View>
    </Card>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        'rounded-pill px-3 py-1.5',
        active ? 'bg-accent-50' : 'bg-surfaceAlt',
      ].join(' ')}
    >
      <Text
        className={['font-semi text-label', active ? 'text-accent-700' : 'text-muted'].join(' ')}
      >
        {label}
      </Text>
    </Pressable>
  );
}
