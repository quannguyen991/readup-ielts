import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ArticleCard } from '@/components/article/ArticleCard';
import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, SectionHeader, StatCard } from '@/components/ui';
import { EXAMS, filterArticles } from '@/data/articles';
import { averageBand, formatBand } from '@/lib/band';
import { QUESTION_TYPE_LABEL } from '@/services/questions/types';
import { useAccuracyByType, useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';
import type { CefrLevel, ExamKind } from '@/types/database';

/** Practice hub: chọn bài theo mục tiêu, xem lượt làm gần đây, hoặc dán văn bản của mình. */
export default function PracticeScreen() {
  const sessions = useStudyStore((s) => s.sessions);
  const accuracyByType = useAccuracyByType();
  const progress = useStudyStore((s) => s.progress);

  const [level, setLevel] = useState<CefrLevel | 'all'>('all');
  const [exam, setExam] = useState<ExamKind | 'all'>('all');
  const [pasted, setPasted] = useState('');

  const suggestions = useMemo(
    () => filterArticles({ kind: 'readable', exam, level, sort: 'easiest' }).slice(0, 6),
    [exam, level],
  );

  const inProgress = useMemo(
    () =>
      Object.values(progress)
        .filter((p) => p.percentCompleted > 0 && p.percentCompleted < 100)
        .sort((a, b) => b.lastReadAt.localeCompare(a.lastReadAt))
        .slice(0, 3),
    [progress],
  );

  const weakest = accuracyByType[0];
  // Chỉ lượt IELTS mới có band; lượt SAT bị bỏ qua chứ không tính là 0.
  const avgBand = averageBand(sessions.slice(0, 5).map((s) => s.estimatedBand));

  return (
    <Screen>
      <Text className="font-heavy text-pageTitle text-ink">Practice</Text>
      <Text className="mt-1 font-sans text-body text-muted">
        Chọn một bài, làm đề có bấm giờ, rồi xem lại từng câu kèm bằng chứng trong bài.
      </Text>

      <View className="mt-4">
        <Grid columns={4} tabletColumns={2} mobileColumns={1}>
          <StatCard
            label="Lượt làm bài"
            value={String(sessions.length)}
            icon="clipboard"
            tone="primary"
          />
          <StatCard
            label="Band 5 lượt gần nhất"
            value={formatBand(avgBand)}
            icon="trending"
            tone="success"
          />
          <StatCard
            label="Đang đọc dở"
            value={String(inProgress.length)}
            icon="book"
            tone="warning"
          />
          <StatCard
            label="Dạng câu yếu nhất"
            value={weakest ? `${weakest.percent}%` : '—'}
            icon="target"
            tone="danger"
            caption={weakest ? QUESTION_TYPE_LABEL[weakest.type] : 'Chưa có dữ liệu'}
          />
        </Grid>
      </View>

      {inProgress.length > 0 ? (
        <Card className="mt-4">
          <SectionHeader title="Đọc tiếp" subtitle="Những bài bạn đang dở" icon="book" />
          <View className="mt-3 gap-2">
            {inProgress.map((item) => {
              // Không lọc kỳ thi ở đây: bài đang đọc dở là bài nào cũng phải hiện.
              const article = filterArticles().find((a) => a.id === item.articleId);
              if (!article) return null;
              return <ArticleCard key={item.articleId} article={article} />;
            })}
          </View>
        </Card>
      ) : null}

      <Card className="mt-4">
        <SectionHeader
          title="Bài gợi ý"
          subtitle="Sắp theo độ khó, dễ trước"
          icon="sparkle"
          iconTone="accent"
          right={
            <View className="flex-row flex-wrap items-center gap-1.5">
              {/* Kho bài có cả IELTS lẫn SAT; không lọc theo kỳ thi thì passage
                  SAT ngắn luôn đứng đầu danh sách "dễ trước". */}
              {(['all', ...EXAMS.map((e) => e.value)] as const).map((e) => (
                <Pill
                  key={e}
                  label={e === 'all' ? 'Mọi kỳ thi' : e.toUpperCase()}
                  active={exam === e}
                  onPress={() => setExam(e)}
                />
              ))}

              <View className="w-2" />

              {(['all', 'B1', 'B2', 'C1', 'C2'] as const).map((l) => (
                <Pill
                  key={l}
                  label={l === 'all' ? 'Mọi độ khó' : l}
                  active={level === l}
                  onPress={() => setLevel(l)}
                />
              ))}
            </View>
          }
        />

        <View className="mt-3 gap-2">
          {suggestions.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </View>
      </Card>

      <Card className="mt-4">
        <SectionHeader
          title="Dán văn bản của tôi"
          subtitle="Dùng được toàn bộ tính năng: tra từ, highlight, sinh đề"
          icon="pencil"
        />

        <TextInput
          value={pasted}
          onChangeText={setPasted}
          multiline
          numberOfLines={6}
          placeholder="Dán một đoạn tiếng Anh bất kỳ vào đây…"
          placeholderTextColor={color.subtle}
          className="mt-3 min-h-[120px] rounded-panel border border-border bg-surfaceAlt p-3 font-sans text-body text-ink"
          style={{ outlineStyle: 'none', textAlignVertical: 'top' } as never}
        />

        <View className="mt-3 flex-row items-center gap-3">
          <Button
            label="Tạo bài đọc"
            iconRight="arrow-right"
            disabled={pasted.trim().split(/\s+/).length < 80}
            onPress={() => router.push(`/paste?text=${encodeURIComponent(pasted)}` as never)}
          />
          <Text className="font-sans text-label text-muted">
            {pasted.trim() ? `${pasted.trim().split(/\s+/).length} từ` : 'Cần ít nhất 80 từ'}
          </Text>
        </View>
      </Card>

      <Card className="mt-4">
        <SectionHeader title="Lượt làm gần đây" icon="clock" />

        <View className="mt-3 gap-2">
          {sessions.slice(0, 6).map((session) => (
            <Pressable
              key={session.id}
              onPress={() => router.push(`/review/${session.id}` as never)}
              className="flex-row items-center gap-3 rounded-panel border border-border p-3"
            >
              <View className="min-w-0 flex-1">
                <Text className="font-semi text-body text-ink" numberOfLines={1}>
                  {session.articleTitle}
                </Text>
                <Text className="font-mid text-label text-muted">
                  {session.finishedAt.slice(0, 10)} · {session.rawScore}/{session.total} đúng
                </Text>
              </View>
              <Badge
                label={session.estimatedBand == null ? 'SAT' : `Band ${formatBand(session.estimatedBand)}`}
                tone="primary"
              />
              <Badge
                label={`${session.accuracy}%`}
                tone={session.accuracy >= 70 ? 'success' : 'warning'}
              />
            </Pressable>
          ))}

          {sessions.length === 0 ? (
            <Text className="py-6 text-center font-sans text-body text-muted">
              Chưa có lượt nào. Chọn một bài ở trên để bắt đầu.
            </Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}

/** Nút lọc nhỏ trong SectionHeader — nhỏ hơn Chip của Library một cỡ. */
function Pill({
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
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={['rounded-pill px-2.5 py-1', active ? 'bg-primary-600' : 'bg-surfaceAlt'].join(' ')}
    >
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
