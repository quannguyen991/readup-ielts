import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Badge, Button, Card, Icon } from '@/components/ui';
import { ChartFigure } from '@/components/writing/ChartFigure';
import { getWritingPromptById } from '@/data/writing-repository';
import { analyseDraft } from '@/services/writing/analyzer';
import { gradeBrainstorm, gradeOverview, gradeParaphrase } from '@/services/writing/drill-grader';
import { useWritingStore } from '@/store/useWritingStore';
import { color, layout } from '@/theme/tokens';
import type { DrillPart, WritingPrompt } from '@/lib/writing/types';

/**
 * Luyện từng phần một.
 *
 * Viết trọn bài 250 từ rồi nhận về một điểm số không cho biết phải sửa gì.
 * Người mới cần tách kỹ năng: hôm nay chỉ luyện overview, hôm sau chỉ luyện
 * thân bài.
 *
 * Ba phần đầu chấm được NGAY TRÊN MÁY nhờ `analysisKey` của đề — nên lặp lại
 * bao nhiêu lần cũng được mà không tốn token. Ba phần sau cần AI, và ở lát này
 * chưa nối; màn hình nói rõ điều đó thay vì im lặng.
 */

type PartSpec = {
  key: DrillPart;
  label: string;
  brief: string;
  placeholder: string;
  /** Chấm được ngay trên máy hay phải chờ AI. */
  offline: boolean;
  /** Chỉ hiện với đúng loại task này; bỏ trống nghĩa là hiện với cả hai. */
  onlyTask?: WritingPrompt['task'];
};

const PARTS: PartSpec[] = [
  {
    key: 'brainstorm',
    label: 'Brainstorm',
    brief: 'Liệt kê các ý bạn nhìn ra từ biểu đồ. Viết tiếng Việt cũng được — đây là bước để nghĩ, chưa phải để diễn đạt.',
    placeholder: '- Country A tăng mạnh\n- Country B giảm đều\n- hai đường cắt nhau quanh 2010',
    offline: true,
  },
  {
    key: 'introduction',
    label: 'Introduction',
    brief: 'Viết đúng MỘT câu paraphrase đề bài. Không có số liệu.',
    placeholder: 'The line graph compares…',
    offline: true,
  },
  {
    key: 'overview',
    label: 'Overview',
    brief: 'Viết 2 câu nêu xu hướng lớn. Tuyệt đối không có con số.',
    placeholder: 'Overall, …',
    offline: true,
    onlyTask: 'ielts_task1',
  },
  {
    key: 'outline',
    label: 'Dàn ý',
    brief: 'Ghi khung bốn đoạn: mở bài, overview, thân bài 1, thân bài 2.',
    placeholder: '1. Mở bài: …\n2. Overview: …\n3. Thân bài 1: …\n4. Thân bài 2: …',
    offline: false,
  },
  {
    key: 'body',
    label: 'Thân bài',
    brief: 'Viết một đoạn thân bài có số liệu và có so sánh.',
    placeholder: 'In 2000, …',
    offline: false,
  },
  {
    key: 'conclusion',
    label: 'Kết luận',
    brief: 'Viết đoạn kết luận. Chỉ Task 2 mới có — Task 1 không viết kết luận.',
    placeholder: 'In conclusion, …',
    offline: false,
    onlyTask: 'ielts_task2',
  },
];

export default function WritingDrillScreen() {
  const { promptId } = useLocalSearchParams<{ promptId: string }>();
  const prompt = typeof promptId === 'string' ? getWritingPromptById(promptId) : undefined;

  const saveDraft = useWritingStore((s) => s.saveDraft);
  const getDraft = useWritingStore((s) => s.getDraft);

  const parts = useMemo(
    () => PARTS.filter((p) => !p.onlyTask || p.onlyTask === prompt?.task),
    [prompt?.task],
  );
  const [part, setPart] = useState<DrillPart>(parts[0]?.key ?? 'brainstorm');
  const spec = parts.find((p) => p.key === part) ?? parts[0];

  const [text, setText] = useState(() => (prompt ? getDraft(prompt.id, part) : ''));
  const [checked, setChecked] = useState(false);

  if (!prompt || !spec) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas p-6">
        <Text className="font-heavy text-cardTitle text-ink">Không tìm thấy đề này</Text>
        <View className="mt-4">
          <Button label="Về kho đề" onPress={() => router.replace('/write/tests')} />
        </View>
      </View>
    );
  }

  const switchPart = (next: DrillPart) => {
    setPart(next);
    setText(getDraft(prompt.id, next));
    setChecked(false);
  };

  const onChange = (next: string) => {
    setText(next);
    saveDraft(prompt.id, part, next);
    setChecked(false);
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
      <View
        className="w-full self-center px-4 py-4 lg:px-6 lg:py-6"
        style={{ maxWidth: layout.contentMaxWidth }}
      >
        <Pressable onPress={() => router.push('/write/tests')} className="mb-3 flex-row items-center gap-1">
          <Icon name="chevron-left" size={18} color={color.muted} />
          <Text className="font-semi text-body text-muted">Kho đề</Text>
        </Pressable>

        <Text className="font-heavy text-pageTitle text-ink">Luyện từng phần</Text>
        <Text className="mt-1 font-sans text-bodyLg text-muted">{prompt.promptText}</Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {parts.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => switchPart(p.key)}
              accessibilityRole="button"
              aria-selected={part === p.key}
              className={[
                'flex-row items-center gap-1.5 rounded-pill border px-3 py-1.5',
                part === p.key ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
              ].join(' ')}
            >
              <Text
                className={['font-semi text-label', part === p.key ? 'text-white' : 'text-body'].join(' ')}
              >
                {p.label}
              </Text>
              {p.offline ? (
                <View className={part === p.key ? 'opacity-80' : ''}>
                  <Icon name="check" size={12} color={part === p.key ? color.white : color.success} />
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
        <Text className="mt-2 font-sans text-label text-subtle">
          Phần có dấu ✓ chấm được ngay trên máy, lặp lại bao nhiêu lần cũng được.
        </Text>

        <View className="mt-4 flex-col gap-4 lg:flex-row">
          <View className="lg:w-[36%]">
            {prompt.chartData ? <ChartFigure data={prompt.chartData} width={400} /> : null}
          </View>

          <View className="lg:flex-1">
            <Card>
              <View className="flex-row items-center gap-2">
                <Text className="font-heavy text-cardTitle text-ink">{spec.label}</Text>
                <Badge
                  tone={spec.offline ? 'success' : 'neutral'}
                  label={spec.offline ? 'Chấm ngay' : 'Cần AI'}
                />
              </View>
              <Text className="mt-1 font-sans text-body text-muted">{spec.brief}</Text>

              <TextInput
                value={text}
                onChangeText={onChange}
                multiline
                textAlignVertical="top"
                placeholder={spec.placeholder}
                placeholderTextColor={color.subtle}
                className="mt-3 min-h-[180px] rounded-md border border-border bg-surface p-3 font-sans text-body text-ink"
                style={{ lineHeight: 22 }}
              />

              <View className="mt-3 flex-row gap-2">
                <Button
                  label={spec.offline ? 'Chấm phần này' : 'Chưa nối AI ở lát này'}
                  disabled={!spec.offline || text.trim() === ''}
                  onPress={() => setChecked(true)}
                />
              </View>

              {checked && spec.offline ? (
                <View className="mt-4">
                  <DrillFeedback part={part} text={text} prompt={prompt} />
                </View>
              ) : null}
            </Card>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function DrillFeedback({
  part,
  text,
  prompt,
}: {
  part: DrillPart;
  text: string;
  prompt: WritingPrompt;
}) {
  const key = prompt.chartData?.analysisKey;

  if (part === 'introduction') {
    const r = gradeParaphrase(prompt.promptText, text);
    const tone =
      r.verdict === 'good' ? 'success' : r.verdict === 'weak' ? 'warning' : 'danger';
    return (
      <View>
        <View className="flex-row items-center gap-2">
          <Badge
            tone={tone}
            label={
              r.verdict === 'good' ? 'Paraphrase tốt' : r.verdict === 'weak' ? 'Còn yếu' : 'Gần như chép đề'
            }
          />
          <Text className="font-sans text-label text-muted">
            Giữ lại {Math.round(r.overlapRatio * 100)}% từ nội dung của đề
          </Text>
        </View>
        <Text className="mt-2 font-sans text-body text-body">{r.note}</Text>
        {r.repeatedWords.length > 0 ? (
          <Text className="mt-2 font-sans text-label text-muted">
            Từ còn nguyên từ đề: {r.repeatedWords.join(', ')}
          </Text>
        ) : null}
        <Text className="mt-3 font-sans text-label text-subtle">
          Chỉ số này đo số từ giữ lại, không đo việc đổi cấu trúc câu.
        </Text>
      </View>
    );
  }

  if (!key) {
    return (
      <Text className="font-sans text-body text-muted">
        Đề này không có dữ liệu biểu đồ nên phần đó chưa chấm tự động được.
      </Text>
    );
  }

  if (part === 'brainstorm') {
    const r = gradeBrainstorm(text, key);
    return (
      <View>
        <Text className="font-sans text-body text-body">{r.note}</Text>
        <Text className="mt-2 font-sans text-label text-muted">
          {r.ideaCount} ý · bao được {r.matchedSubjects.length}/{key.trends.length} đối tượng
        </Text>
      </View>
    );
  }

  if (part === 'overview') {
    const r = gradeOverview(text, key);
    return (
      <View>
        <View className="flex-row items-center gap-2">
          <Badge
            tone={r.score >= 80 ? 'success' : r.score >= 50 ? 'warning' : 'danger'}
            label={`${r.score}/100`}
          />
          <Text className="font-sans text-label text-muted">
            Bắt được {r.covered.length}/{key.trends.length} xu hướng
          </Text>
        </View>
        {r.notes.map((n) => (
          <Text key={n} className="mt-2 font-sans text-body text-body">
            • {n}
          </Text>
        ))}
      </View>
    );
  }

  const a = analyseDraft(text, { task: prompt.task, minWords: prompt.minWords });
  return (
    <View className="gap-2">
      {a.hints.map((h) => (
        <Text key={h.code} className="font-sans text-body text-body">
          • {h.message}
        </Text>
      ))}
    </View>
  );
}
