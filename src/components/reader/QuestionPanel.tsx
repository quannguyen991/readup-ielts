import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { EvidenceMarker } from '@/components/reader/EvidenceMarker';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { QUESTION_TYPE_LABEL, type GeneratedQuestion } from '@/services/questions/types';
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
  const [current, setCurrent] = useState(0);
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');

  const types = useMemo(
    () => [...new Set(questions.map((q) => q.type))] as QuestionType[],
    [questions],
  );

  const visible = useMemo(
    () => (typeFilter === 'all' ? questions : questions.filter((q) => q.type === typeFilter)),
    [questions, typeFilter],
  );

  const question = visible[Math.min(current, visible.length - 1)];
  const answered = Object.keys(answers).filter((id) => answers[id]).length;

  if (!question) {
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
          const isCurrent = index === current;
          const isAnswered = Boolean(answers[q.id]);
          const isMarked = marked[q.id];

          return (
            <Pressable
              key={q.id}
              onPress={() => setCurrent(index)}
              accessibilityLabel={`Câu ${index + 1}`}
              className={[
                'h-8 w-8 items-center justify-center rounded-md border',
                isCurrent
                  ? 'border-primary-600 bg-primary-600'
                  : isAnswered
                    ? 'border-primary-200 bg-primary-50'
                    : 'border-border bg-surface',
              ].join(' ')}
            >
              <Text
                className={[
                  'font-semi text-label',
                  isCurrent ? 'text-white' : isAnswered ? 'text-primary-700' : 'text-muted',
                ].join(' ')}
              >
                {index + 1}
              </Text>
              {isMarked ? (
                <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-pill bg-warning" />
              ) : null}
            </Pressable>
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
              setCurrent(0);
            }}
          />
          {types.map((type) => (
            <FilterChip
              key={type}
              label={QUESTION_TYPE_LABEL[type]}
              active={typeFilter === type}
              onPress={() => {
                setTypeFilter(type);
                setCurrent(0);
              }}
            />
          ))}
        </View>
      </ScrollView>

      <View className="mt-4 border-t border-border pt-4">
        <View className="flex-row items-center justify-between">
          <Badge label={QUESTION_TYPE_LABEL[question.type]} tone="accent" />
          <Text className="font-mid text-label text-muted">
            Câu {current + 1} / {visible.length}
          </Text>
        </View>

        {question.instruction ? (
          <Text className="mt-3 font-mid text-label text-muted">{question.instruction}</Text>
        ) : null}

        <Text className="mt-2 font-semi text-bodyLg text-ink">{question.prompt}</Text>

        {onStartEvidence ? (
          <EvidenceMarker
            mark={evidenceMarks?.[question.id]}
            active={evidenceFor === question.id}
            onStart={() => onStartEvidence(question.id)}
            onClear={() => onClearEvidence?.(question.id)}
          />
        ) : null}

        <View className="mt-4">
          {question.options ? (
            <View className="gap-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => onAnswer(question.id, option)}
                    className={[
                      'flex-row items-center gap-3 rounded-panel border px-3 py-3',
                      selected ? 'border-primary-600 bg-primary-50' : 'border-border bg-surface',
                    ].join(' ')}
                  >
                    <View
                      className={[
                        'h-4 w-4 items-center justify-center rounded-pill border',
                        selected ? 'border-primary-600 bg-primary-600' : 'border-borderStrong',
                      ].join(' ')}
                    >
                      {selected ? <View className="h-1.5 w-1.5 rounded-pill bg-white" /> : null}
                    </View>
                    <Text
                      className={[
                        'flex-1 font-mid text-body',
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
              className="h-12 rounded-panel border border-border bg-surface px-3 font-sans text-body text-ink"
              style={{ outlineStyle: 'none' } as never}
            />
          )}
        </View>

        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          <Button
            label="Clear Answer"
            variant="outline"
            size="sm"
            iconLeft="refresh"
            onPress={() => onAnswer(question.id, '')}
          />
          <Button
            label={marked[question.id] ? 'Bỏ đánh dấu' : 'Mark for Review'}
            variant="outline"
            size="sm"
            iconLeft="bookmark"
            onPress={() => onToggleMark(question.id)}
          />

          <View className="flex-1" />

          <Pressable
            onPress={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="h-9 w-9 items-center justify-center rounded-md border border-border"
          >
            <Icon name="chevron-left" size={16} color={color.muted} />
          </Pressable>
          <Pressable
            onPress={() => setCurrent((c) => Math.min(visible.length - 1, c + 1))}
            disabled={current === visible.length - 1}
            className="h-9 w-9 items-center justify-center rounded-md border border-border"
          >
            <Icon name="chevron-right" size={16} color={color.muted} />
          </Pressable>
        </View>

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
