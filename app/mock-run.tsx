import React from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, PaperCard, SectionHeader } from '@/components/ui';
import { type ArticleMeta, getArticleById, topicLabel } from '@/data/articles';
import { getListeningTest } from '@/data/listening-tests';
import { averageBand, formatBand } from '@/lib/band';
import { useListeningStore } from '@/store/useListeningStore';
import { rawScoreToBand, useStudyStore } from '@/store/useStudyStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Hub một Mock Test: phần Listening (4 section) trước, rồi Reading (3 passage), đúng thứ tự
 * bài thi thật. Mỗi phần tự biết đã làm hay chưa, nên làm dở ở đâu thì quay lại đúng chỗ.
 *
 * Bản trước, "Đi thi" mở thẳng passage 1 rồi dừng: không có chỗ nào gom phần còn lại. Trạng
 * thái từng phần được tra theo đường dẫn của CHÍNH hub (`mock` của lượt nghe, `mockKey` của
 * phiên đọc), không theo mã bài, vì một bài có thể nằm trong nhiều Mock Test.
 */
export default function MockRunScreen() {
  const { L } = useL();
  const { n, l, r } = useLocalSearchParams<{ n?: string; l?: string; r?: string }>();
  const attempts = useListeningStore((s) => s.attempts);
  const sessions = useStudyStore((s) => s.sessions);

  const number = Number(n);
  const listening = l ? getListeningTest(l) : undefined;
  const ids = r ? r.split(',').filter(Boolean) : [];
  const passages = ids.map((id) => getArticleById(id)).filter((a): a is ArticleMeta => a !== undefined);
  const valid =
    Number.isInteger(number) && number > 0 && listening !== undefined && ids.length > 0 && passages.length === ids.length;

  if (!valid || !listening) {
    return (
      <Screen>
        <PaperCard className="mt-4">
          <SectionHeader title={L('Không mở được đề này', 'This mock test cannot be opened')} icon="info" />
          <Text className="mt-2 font-sans text-body text-muted">
            {L(
              'Đường dẫn thiếu phần Listening hoặc passage Reading. Quay lại danh sách để chọn đề khác.',
              'The link is missing its Listening or Reading part. Go back to the list to pick another test.',
            )}
          </Text>
          <View className="mt-4 flex-row">
            <Button
              label={L('Về danh sách Mock Test', 'Back to mock tests')}
              variant="outline"
              iconLeft="chevron-left"
              onPress={() => router.replace('/mock-tests' as never)}
            />
          </View>
        </PaperCard>
      </Screen>
    );
  }

  // Đường dẫn của hub là khoá của cả đề: đổi bộ đề thì bài và passage đổi theo, nên trạng thái
  // của bộ cũ không bị gắn nhầm sang bộ mới. Không mã hoá `r`: `from` đi qua hai lần giải mã,
  // nên `%2C` sẽ thành dấu phẩy ở trang nhận và khoá không còn khớp. Mã bài chỉ gồm chữ, số, gạch.
  const hubUrl = `/mock-run?n=${number}&l=${listening.id}&r=${ids.join(',')}`;
  const from = encodeURIComponent(hubUrl);

  const listeningAttempt = latest(
    attempts.filter((a) => a.mock === hubUrl && a.testId === listening.id && a.section === null),
  );
  const passageSessions = passages.map((p) =>
    latest(sessions.filter((s) => s.mode === 'mock_test' && s.mockKey === hubUrl && s.articleId === p.id)),
  );
  const doneCount = passageSessions.filter((s) => s !== undefined).length;

  // Band Reading tính từ tổng số câu đúng của cả ba passage, không lấy trung bình ba band lẻ.
  const readingBand =
    doneCount === passages.length
      ? rawScoreToBand(
          passageSessions.reduce((sum, s) => sum + (s?.rawScore ?? 0), 0),
          passageSessions.reduce((sum, s) => sum + (s?.total ?? 0), 0),
        )
      : null;
  const listeningBand = listeningAttempt?.band ?? null;
  const overall = listeningBand != null && readingBand != null ? averageBand([listeningBand, readingBand]) : null;

  return (
    <Screen>
      <LightHero
        scene="verbal"
        art="test"
        cat="read"
        badge="IELTS · MOCK TEST"
        line1={`Mock Test ${String(number).padStart(2, '0')}`}
        line2={L('Listening trước, Reading sau', 'Listening first, then Reading')}
        subtitle={L(
          'Đề gồm 4 section Listening và 3 passage Reading, làm đúng thứ tự bài thi thật. Phần nào làm xong, trang này sẽ nhớ để bạn làm tiếp lúc khác.',
          'The test has 4 Listening sections and 3 Reading passages, in real exam order. Finished parts are remembered, so you can pick up later.',
        )}
        footer={
          <>
            <HeroStat value={`${listeningAttempt ? 1 : 0}/1`} label="Listening" />
            <HeroStat value={`${doneCount}/${passages.length}`} label="Reading" />
            <HeroStat value={formatBand(overall)} label={L('band trung bình', 'average band')} />
          </>
        }
      >
        <Button
          label={L('Về danh sách Mock Test', 'Back to mock tests')}
          variant="outline"
          iconLeft="chevron-left"
          onPress={() => router.replace('/mock-tests' as never)}
        />
      </LightHero>

      <View className="mt-4">
        <Grid columns={2} tabletColumns={1} mobileColumns={1}>
          <PaperCard className="h-full">
            <SectionHeader title="Listening" subtitle={L('4 section · 40 câu', '4 sections · 40 questions')} icon="volume" />
            <View className="mt-3 rounded-panel border border-border p-3">
              <Text className="font-semi text-body text-ink" numberOfLines={2}>
                {L(listening.titleVi ?? listening.title, listening.title)}
              </Text>
              <View className="mt-2 flex-row flex-wrap items-center gap-2">
                {listeningAttempt ? (
                  <>
                    <Badge label={`Band ${formatBand(listeningAttempt.band)}`} tone="primary" />
                    <Text className="font-sans text-label text-muted">
                      {listeningAttempt.score}/{listeningAttempt.total} {L('câu đúng', 'correct')}
                    </Text>
                  </>
                ) : (
                  <Badge label={L('Chưa làm', 'Not started')} tone="neutral" />
                )}
              </View>
              <View className="mt-3 flex-row">
                {listeningAttempt ? (
                  <Button
                    label={L('Xem kết quả', 'See result')}
                    variant="outline"
                    size="sm"
                    iconLeft="check"
                    onPress={() =>
                      router.push(
                        `/listening/${listening.id}?attempt=${encodeURIComponent(listeningAttempt.id)}&from=${from}` as never,
                      )
                    }
                  />
                ) : (
                  <Button
                    label={L('Làm phần Listening', 'Start Listening')}
                    size="sm"
                    iconLeft="play"
                    onPress={() => router.push(`/listening/${listening.id}?from=${from}` as never)}
                  />
                )}
              </View>
            </View>
          </PaperCard>

          <PaperCard className="h-full">
            <SectionHeader title="Reading" subtitle={L('3 passage · 60 phút', '3 passages · 60 minutes')} icon="book" />
            <View className="mt-3 gap-2">
              {passages.map((p, i) => {
                const s = passageSessions[i];
                return (
                  <View key={p.id} className="flex-row items-center gap-3 rounded-panel border border-border p-3">
                    <View
                      className="h-6 w-6 items-center justify-center rounded-pill"
                      style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: color.border }}
                    >
                      <Text className="font-heavy text-muted" style={{ fontSize: 12 }}>
                        {i + 1}
                      </Text>
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="font-semi text-label text-ink" numberOfLines={1}>
                        {p.title}
                      </Text>
                      <Text className="mt-0.5 font-sans text-label text-muted" numberOfLines={1}>
                        {p.cefrLevel ? `${topicLabel(p.topic)} · ${p.cefrLevel}` : topicLabel(p.topic)}
                      </Text>
                    </View>
                    {s ? <Badge label={`${s.rawScore}/${s.total}`} tone="primary" /> : null}
                    {s ? (
                      <Button
                        label={L('Xem bài chấm', 'Review')}
                        variant="outline"
                        size="sm"
                        iconLeft="check"
                        onPress={() => router.push(`/review/${s.id}` as never)}
                      />
                    ) : (
                      <Button
                        label={L('Làm passage', 'Start')}
                        size="sm"
                        iconLeft="book"
                        onPress={() => router.push(`/read/${p.id}?from=${from}` as never)}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </PaperCard>
        </Grid>
      </View>

      <PaperCard className="mt-4">
        <SectionHeader title={L('Band trung bình', 'Average band')} icon="trophy" />
        <View className="mt-3 flex-row flex-wrap items-end gap-x-6 gap-y-2">
          <View>
            <Text className="font-heavy text-ink" style={{ fontSize: 34, lineHeight: 40 }}>
              {formatBand(overall)}
            </Text>
            <Text className="font-sans text-label text-muted">
              {L('Trung bình Listening và Reading', 'Average of Listening and Reading')}
            </Text>
          </View>
          <View>
            <Text className="font-strong text-ink" style={{ fontSize: 16 }}>
              {formatBand(listeningBand)}
            </Text>
            <Text className="font-sans text-label text-muted">Listening</Text>
          </View>
          <View>
            <Text className="font-strong text-ink" style={{ fontSize: 16 }}>
              {formatBand(readingBand)}
            </Text>
            <Text className="font-sans text-label text-muted">Reading</Text>
          </View>
        </View>
        <Text className="mt-3 font-sans text-label text-muted">
          {overall != null
            ? L(
                'Chưa gồm Writing và Speaking, nên đây không phải band IELTS tổng.',
                'Writing and Speaking are not included, so this is not an overall IELTS band.',
              )
            : L(
                'Làm xong phần Listening và cả ba passage để có band trung bình.',
                'Finish Listening and all three passages to see the average band.',
              )}
        </Text>
      </PaperCard>
    </Screen>
  );
}

/** Lượt mới nhất trong danh sách. Mọi lượt có `finishedAt` dạng ISO nên so chuỗi là đủ. */
function latest<T extends { finishedAt: string }>(list: T[]): T | undefined {
  return list.reduce<T | undefined>((best, item) => (!best || item.finishedAt > best.finishedAt ? item : best), undefined);
}
