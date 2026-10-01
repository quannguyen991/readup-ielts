import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Appear } from '@/components/motion/Motion';
import { Button, Card, Icon } from '@/components/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';
import { currentLocale, pick, useL } from '@/i18n/useL';

/**
 * Khối "AI xem lại lượt làm bài" ở màn Review.
 *
 * KHÔNG TỰ CHẠY KHI MỞ TRANG. Mỗi lượt gọi là tiền thật và tính vào hạn mức
 * tháng của người dùng — bắt họ trả một lượt chỉ vì lỡ mở màn xem lại là cách
 * nhanh nhất khiến họ tránh cả màn hình này. Có nút, và nút nói rõ nó sẽ tốn
 * một lượt.
 *
 * Nội dung ở đây KHÁC hẳn phần lời giải từng câu ngay bên dưới: lời giải nói
 * "câu này đáp án là B vì dòng thứ tư", còn khối này nói "bạn sai ba câu và cả
 * ba đều vì bỏ qua từ giới hạn". Cái sau chỉ nhìn thấy được khi xét cả lượt.
 */

export type Coaching = {
  headline: string;
  patterns: Array<{ typeLabel: string; wrongCount: number; diagnosis: string; strategy: string[] }>;
  perQuestion: Array<{ questionId: string; whyWrong: string; signal: string }>;
  topPriority: string;
  model: string;
};

export type CoachRequest = {
  articleTitle: string;
  total: number;
  correct: number;
  wrong: Array<{
    questionId: string;
    type: string;
    typeLabel: string;
    prompt: string;
    userAnswer: string | null;
    correctAnswer: string;
    evidenceText: string;
  }>;
};

export function ReadingCoachPanel({ request }: { request: CoachRequest }) {
  const { L } = useL();
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const [coaching, setCoaching] = useState<Coaching | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number | null } | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reading/coach', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      const body = (await res.json()) as {
        coaching?: Coaching;
        usage?: { used: number; limit: number | null };
        skipped?: boolean;
        message?: string;
        error?: string;
      };
      if (body.skipped) {
        setError(body.message ?? pick(currentLocale(), 'Không có câu sai nào để phân tích.', 'No wrong answers to analyse.'));
        return;
      }
      if (!res.ok || !body.coaching) throw new Error(body.error ?? pick(currentLocale(), `Lỗi ${res.status}`, `Error ${res.status}`));
      setCoaching(body.coaching);
      if (body.usage) setUsage(body.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(currentLocale(), 'Không lấy được nhận xét.', "Couldn't get feedback."));
    } finally {
      setLoading(false);
    }
  }, [request, token]);

  if (request.wrong.length === 0) {
    return (
      <Card className="mt-4">
        <View className="flex-row items-center gap-2">
          <Icon name="trophy" size={17} color={color.success} />
          <Text className="font-strong text-cardTitle text-ink">{L('Đúng hết — không có gì để chữa', 'All correct — nothing to fix')}</Text>
        </View>
        <Text className="mt-1 font-sans text-body text-muted">
          {L(
            'Lượt này bạn không sai câu nào, nên không gọi AI và không trừ lượt nào của bạn.',
            "You didn't get anything wrong this time, so we won't call the AI or use any of your credits.",
          )}
        </Text>
      </Card>
    );
  }

  if (!coaching) {
    return (
      <Card className="mt-4">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-pill bg-primary-50">
            <Icon name="sparkle" size={18} color={color.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-strong text-cardTitle text-ink">
              {L(`Nhờ AI xem lại ${request.wrong.length} câu sai`, `Ask AI to review ${request.wrong.length} wrong answers`)}
            </Text>
            <Text className="mt-1 font-sans text-body text-muted">
              {L('Không phải giải lại từng câu — phần đó đã có sẵn bên dưới. AI tìm', "It won't re-explain each question — that's already below. AI looks for")}{' '}
              <Text className="font-strong text-ink">{L('mẫu hình lỗi', 'error patterns')}</Text>{' '}
              {L(
                'giữa các câu, rồi chỉ ra chiến lược làm bài cho đúng dạng bạn đang yếu.',
                'across questions, then points out strategies for the question types you find hardest.',
              )}
            </Text>
            <Text className="mt-2 font-sans text-label text-subtle">
              {L('Tốn một lượt AI trong hạn mức tháng của bạn.', 'Uses one AI credit from your monthly limit.')}
            </Text>
          </View>
        </View>

        {error ? (
          <View className="mt-3 flex-row items-start gap-2 rounded-card bg-danger-soft p-2.5">
            <Icon name="info" size={15} color={color.danger} />
            <Text className="flex-1 font-sans text-label text-danger-ink">{error}</Text>
          </View>
        ) : null}

        <Button
          className="mt-3 self-start"
          label={loading ? L('AI đang đọc lại bài…', 'AI is rereading your work…') : L('Xem nhận xét của AI', 'See AI feedback')}
          iconRight="arrow-right"
          loading={loading}
          disabled={loading}
          onPress={() => void run()}
        />
      </Card>
    );
  }

  return (
    <View className="mt-4 gap-3">
      <Appear>
        <Card>
          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-pill bg-primary-50">
              <Icon name="sparkle" size={18} color={color.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-strong text-cardTitle text-ink">{coaching.headline}</Text>
              {usage ? (
                <Text className="mt-1 font-sans text-label text-subtle">
                  {L('Đã dùng', 'Used')} {usage.used}
                  {usage.limit === null ? '' : `/${usage.limit}`} {L('lượt AI tháng này', 'AI credits this month')} · {coaching.model}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>
      </Appear>

      {coaching.patterns.map((pattern, index) => (
        <Appear key={pattern.typeLabel + index} index={index + 1}>
          <Card>
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="font-strong text-cardTitle text-ink">{pattern.typeLabel}</Text>
              <View className="rounded-pill bg-danger-soft px-2 py-0.5">
                <Text className="font-strong text-label text-danger-ink">
                  {L(`sai ${pattern.wrongCount}`, `${pattern.wrongCount} wrong`)}
                </Text>
              </View>
            </View>
            <Text className="mt-1.5 font-sans text-body text-body">{pattern.diagnosis}</Text>

            <View className="mt-3 gap-2">
              {pattern.strategy.map((step, i) => (
                <View key={i} className="flex-row items-start gap-2.5">
                  <View className="h-6 w-6 items-center justify-center rounded-pill bg-primary-50">
                    <Text className="font-heavy text-label text-primary-700">{i + 1}</Text>
                  </View>
                  <Text className="flex-1 font-sans text-body text-ink">{step}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Appear>
      ))}

      {coaching.topPriority ? (
        <Appear index={coaching.patterns.length + 1}>
          {/* Một việc duy nhất, tô đậm hơn mọi thứ khác. Người học chỉ sửa được
              một thói quen mỗi lần; đưa năm việc là không đưa việc nào. */}
          <Card>
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-pill bg-warning-soft">
                <Icon name="target" size={18} color={color.warning} />
              </View>
              <View className="flex-1">
                <Text className="font-mid text-label text-muted">{L('Sửa thứ này trước', 'Fix this first')}</Text>
                <Text className="mt-0.5 font-strong text-cardTitle text-ink">
                  {coaching.topPriority}
                </Text>
              </View>
            </View>
          </Card>
        </Appear>
      ) : null}
    </View>
  );
}
