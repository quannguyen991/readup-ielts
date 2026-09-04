import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Appear } from '@/components/motion/Motion';
import { Button, Card, Icon } from '@/components/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { color } from '@/theme/tokens';

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
        setError(body.message ?? 'Không có câu sai nào để phân tích.');
        return;
      }
      if (!res.ok || !body.coaching) throw new Error(body.error ?? `Lỗi ${res.status}`);
      setCoaching(body.coaching);
      if (body.usage) setUsage(body.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lấy được nhận xét.');
    } finally {
      setLoading(false);
    }
  }, [request, token]);

  if (request.wrong.length === 0) {
    return (
      <Card className="mt-4">
        <View className="flex-row items-center gap-2">
          <Icon name="trophy" size={17} color={color.success} />
          <Text className="font-strong text-cardTitle text-ink">Đúng hết — không có gì để chữa</Text>
        </View>
        <Text className="mt-1 font-sans text-body text-muted">
          Lượt này bạn không sai câu nào, nên không gọi AI và không trừ lượt nào của bạn.
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
              Nhờ AI xem lại {request.wrong.length} câu sai
            </Text>
            <Text className="mt-1 font-sans text-body text-muted">
              Không phải giải lại từng câu — phần đó đã có sẵn bên dưới. AI tìm{' '}
              <Text className="font-strong text-ink">mẫu hình lỗi</Text> giữa các câu, rồi chỉ ra
              chiến lược làm bài cho đúng dạng bạn đang yếu.
            </Text>
            <Text className="mt-2 font-sans text-label text-subtle">
              Tốn một lượt AI trong hạn mức tháng của bạn.
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
          label={loading ? 'AI đang đọc lại bài…' : 'Xem nhận xét của AI'}
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
                  Đã dùng {usage.used}
                  {usage.limit === null ? '' : `/${usage.limit}`} lượt AI tháng này · {coaching.model}
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
                  sai {pattern.wrongCount}
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
                <Text className="font-mid text-label text-muted">Sửa thứ này trước</Text>
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
