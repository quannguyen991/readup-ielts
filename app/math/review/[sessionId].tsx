import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { MathQuestionView } from '@/components/math/MathQuestionView';
import { Badge, Button, Card, ProgressBar, SectionHeader, StatCard } from '@/components/ui';
import {
  MATH_DOMAIN_LABEL,
  MATH_ERROR_LABEL,
  MATH_SKILL_LABEL,
  type MathDomain,
} from '@/lib/math/types';
import { getSet, getUnitOfSet } from '@/services/math/curriculum';
import { diagnosticHeadline, readDiagnostic } from '@/services/math/diagnostic';
import { regenerateMathItem } from '@/services/math/generator';
import { countErrorTags, formatAccuracy, summarizeByDomain } from '@/services/math/scoring';
import { useMathStore } from '@/store/useMathStore';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label, Sticker } from '@/components/illust/Sticker';
import { CuteMagnifier, CuteRocket, CuteTrophy, Motion } from '@/components/illust/CuteMore';

/**
 * Xem lại một lượt làm bài.
 *
 * Câu hỏi được DỰNG LẠI TỪ ID chứ không đọc từ storage — xem `useMathStore` để
 * biết vì sao. Câu nào không dựng lại được (template đã bị xoá) thì hiện một
 * dòng nói rõ, chứ không lặng lẽ biến mất khỏi danh sách và làm lệch tổng số.
 */
export default function MathReviewScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const session = useMathStore((s) => s.sessions.find((x) => x.id === sessionId));

  const rebuilt = useMemo(
    () =>
      (session?.attempts ?? []).map((attempt) => ({
        attempt,
        item: regenerateMathItem(attempt.itemId),
      })),
    [session],
  );

  const domainStats = useMemo(
    () => summarizeByDomain(session?.attempts ?? []),
    [session],
  );
  const errorTags = useMemo(() => countErrorTags(session?.attempts ?? []), [session]);
  const diagnosticReading = useMemo(
    () => (session?.mode === 'diagnostic' ? readDiagnostic(session.attempts) : null),
    [session],
  );

  if (!session) {
    return (
      <Screen>
        <Card>
          <View aria-hidden className="mb-3">
            <Motion kind="wobble">
              <Sticker tilt={-6}>
                <CuteMagnifier size={60} />
              </Sticker>
            </Motion>
          </View>
          <Text className="font-strong text-cardTitle text-ink">Không tìm thấy lượt làm bài</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Lượt này có thể đã bị xoá khỏi lịch sử trên thiết bị.
          </Text>
          <Button className="mt-3" label="Về trang Math" onPress={() => router.replace('/math')} />
        </Card>
      </Screen>
    );
  }

  const set = session.setId ? getSet(session.setId) : undefined;
  const unit = session.setId ? getUnitOfSet(session.setId) : undefined;

  const title =
    session.mode === 'diagnostic'
      ? 'Kết quả bài chẩn đoán'
      : session.mode === 'mock'
        ? 'Kết quả thi thử'
        : set
          ? `${unit ? `${unit.title} · ` : ''}${set.title}`
          : session.skill
            ? `Luyện nhanh · ${MATH_SKILL_LABEL[session.skill]}`
            : 'Kết quả lượt làm bài';

  const blank = session.attempts.filter((a) => a.userAnswer === null).length;
  const acc = session.total === 0 ? 0 : session.rawScore / session.total;
  const cheer = acc >= 0.8 ? { text: 'Xuất sắc 🏆', bg: '#22A06B' } : acc >= 0.6 ? { text: 'Khá lắm ⭐', bg: '#4A7FE8' } : { text: 'Ôn tiếp nhé 💪', bg: '#F0703F' };

  return (
    <Screen>
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-heavy text-pageTitle text-ink">{title}</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            {new Date(session.finishedAt).toLocaleString('vi-VN')} · {Math.round(session.durationMs / 60_000)} phút
          </Text>
        </View>
        <View aria-hidden>
          <PageStickers scene="progress" />
        </View>
      </View>

      <View aria-hidden className="mt-4 flex-row items-center gap-3">
        <Motion kind="wobble">
          <Sticker tilt={-8}>
            <CuteTrophy size={46} />
          </Sticker>
        </Motion>
        <Label text={cheer.text} color={cheer.bg} ink="#FFFFFF" tilt={-4} size={13} />
      </View>

      <View className="mt-4">
        <Grid columns={4} tabletColumns={2} mobileColumns={2}>
          <StatCard
            label="Đúng"
            value={`${session.rawScore}/${session.total}`}
            icon="check"
            tone="primary"
          />
          <StatCard
            label="Độ chính xác"
            value={formatAccuracy(session.total === 0 ? null : session.rawScore / session.total)}
            icon="target"
            tone="success"
          />
          <StatCard label="Bỏ trắng" value={String(blank)} icon="close" tone="accent" />
          <StatCard
            label={session.estimatedScore === null ? 'Thời gian/câu' : 'Điểm ước lượng'}
            value={
              session.estimatedScore === null
                ? `${Math.round(session.durationMs / 1000 / Math.max(1, session.total))}s`
                : String(session.estimatedScore)
            }
            icon={session.estimatedScore === null ? 'clock' : 'trophy'}
            tone="primary"
          />
        </Grid>
      </View>

      {session.mode === 'mock' && session.estimatedScore !== null ? (
        <Card className="mt-4">
          <View aria-hidden className="mb-2 flex-row items-center gap-3">
            <Motion kind="float">
              <Sticker tilt={6}>
                <CuteRocket size={44} />
              </Sticker>
            </Motion>
            <Label
              text={session.moduleTier === 'harder' ? 'Nhánh khó 🚀' : 'Nhánh dễ 🎯'}
              color={session.moduleTier === 'harder' ? '#F0703F' : '#0EA5E9'}
              ink="#FFFFFF"
              tilt={4}
              size={12}
            />
          </View>
          <Text className="font-sans text-body text-muted">
            Module 2 của bạn ở nhánh{' '}
            <Text className="font-strong text-ink">
              {session.moduleTier === 'harder' ? 'khó hơn' : 'dễ hơn'}
            </Text>
            . Điểm {session.estimatedScore} là <Text className="font-strong text-ink">ước lượng</Text>{' '}
            — dùng để so với chính bạn lần trước, không phải để dự đoán điểm thi thật.
          </Text>
          <Button
            className="mt-4"
            label="Luyện tiếp SAT Math"
            iconRight="arrow-right"
            onPress={() => router.push('/math' as never)}
          />
        </Card>
      ) : null}

      {diagnosticReading ? (
        <Card className="mt-4">
          <View className="flex-row items-center gap-2.5">
            <View aria-hidden>
              <SealIcon name="search" color="#0EA5E9" size={36} />
            </View>
            <Text className="min-w-0 flex-1 font-strong text-cardTitle text-ink">Đọc kết quả</Text>
          </View>
          <Text className="mt-1 font-sans text-body text-muted">
            {diagnosticHeadline(diagnosticReading)}
          </Text>
          <View className="mt-3 gap-2">
            {diagnosticReading.bySkill
              .filter((s) => s.verdict === 'can_kiem_lai')
              .map(({ stat }) => (
                <View
                  key={stat.skill}
                  className="flex-row flex-wrap items-center justify-between gap-2 rounded-card border border-border p-2"
                >
                  <Text className="flex-1 font-sans text-body text-ink" style={{ minWidth: 180 }}>
                    {MATH_SKILL_LABEL[stat.skill]}
                  </Text>
                  <Button
                    label="Drill 6 câu"
                    size="sm"
                    variant="outline"
                    onPress={() => router.push(`/math/drill/${stat.skill}`)}
                  />
                </View>
              ))}
          </View>
        </Card>
      ) : null}

      <SectionHeader className="mt-6" title="Theo domain" icon="trending" />
      <Card className="mt-3">
        <View className="gap-3">
          {(Object.keys(domainStats) as MathDomain[])
            .filter((d) => domainStats[d].total > 0)
            .map((domain) => (
              <View key={domain}>
                <View className="flex-row items-center justify-between">
                  <Text className="font-sans text-body text-ink">{MATH_DOMAIN_LABEL[domain]}</Text>
                  <Text className="font-strong text-label text-muted">
                    {domainStats[domain].correct}/{domainStats[domain].total} ·{' '}
                    {formatAccuracy(domainStats[domain].accuracy)}
                  </Text>
                </View>
                <View className="mt-1">
                  <ProgressBar
                    value={Math.round((domainStats[domain].accuracy ?? 0) * 100)}
                    tone={(domainStats[domain].accuracy ?? 0) >= 0.8 ? 'success' : 'primary'}
                  />
                </View>
              </View>
            ))}
        </View>
      </Card>

      {errorTags.length > 0 ? (
        <>
          <SectionHeader
            className="mt-6"
            title="Lỗi đã mắc trong lượt này"
            subtitle="Chỉ tính những câu chọn nhầm một đáp án có nhãn — bỏ trắng không bị gán lỗi."
            icon="info"
          />
          <View className="mt-3 gap-2">
            {errorTags.map(({ tag, count }) => (
              <Card key={tag} variant="flat">
                <View className="flex-row items-start gap-3">
                  <Badge label={`${count}×`} tone="danger" />
                  <Text className="flex-1 font-sans text-body text-ink">{MATH_ERROR_LABEL[tag]}</Text>
                </View>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader
        className="mt-6"
        title="Từng câu"
        subtitle="Đáp án đúng, lời giải từng bước, và tên của lỗi nếu bạn chọn nhầm."
        icon="list"
      />
      <View className="mt-3 gap-4">
        {rebuilt.map(({ attempt, item }, index) => (
          <Card key={attempt.itemId}>
            {item ? (
              <MathQuestionView item={item} index={index} answer={attempt.userAnswer} revealed />
            ) : (
              <View>
                <Text className="font-strong text-body text-ink">Câu {index + 1}</Text>
                <Text className="mt-1 font-sans text-body text-muted">
                  Không dựng lại được câu này ({attempt.itemId}) — template của nó không còn trong
                  danh bạ. Kết quả đúng/sai của bạn vẫn được giữ nguyên.
                </Text>
              </View>
            )}
            <Text className="mt-2 font-sans text-label text-muted">
              Thời gian: {Math.round(attempt.timeSpentMs / 1000)}s
            </Text>
          </Card>
        ))}
      </View>

      <View className="mt-6 flex-row flex-wrap gap-2">
        <Button label="Về trang Math" variant="outline" onPress={() => router.replace('/math')} />
        {set ? (
          <Button
            label="Làm lại bộ này (đề mới)"
            onPress={() => router.replace(`/math/set/${set.id}` as never)}
          />
        ) : session.mode === 'drill' && session.skill ? (
          <Button
            label="Drill tiếp kỹ năng này"
            onPress={() => router.replace(`/math/drill/${session.skill}` as never)}
          />
        ) : null}
      </View>
    </Screen>
  );
}
