import React, { useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { useHydrated } from '@/components/layout/useHydrated';
import { CRITERION_COLOR, DarkButton, INK, LINE, MUTED, STAGE_TONES, SoftButton, StageShell, WindowCard, stageLabels, useWide } from '@/components/hsa/stage';
import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { bi, useL } from '@/i18n/useL';
import { CRITERIA } from '@/services/hsa/criteria';
import { restoreItems } from '@/services/hsa/attempts';
import { buildPlacement } from '@/services/hsa/placement';
import { scoreItems } from '@/services/hsa/scoring';
import { placementAttempts, useHsaStore } from '@/store/useHsaStore';

const TONE = STAGE_TONES.test;
const INDEX = new Map(HSA_QUESTION_BANK.map((q) => [q.id, q]));

/** Bước 2: bài test đầu vào năm phần, mỗi phần đo một tiêu chí chấm. */
export default function HsaPlacementScreen() {
  const { L, locale } = useL();
  const wide = useWide();
  const hydrated = useHydrated();
  const profile = useHsaStore((s) => s.profile);
  const attempts = useHsaStore((s) => s.attempts);
  const sections = useMemo(() => buildPlacement(HSA_QUESTION_BANK), []);

  // Chưa có hồ sơ thì làm khảo sát trước: bài test và kế hoạch đều cần hồ sơ.
  useEffect(() => {
    if (hydrated && !profile) router.replace('/hsa/setup' as never);
  }, [hydrated, profile]);

  const done = placementAttempts(attempts);
  const doneCount = CRITERIA.filter((c) => done[c.id]).length;
  const next = sections.find((s) => !done[s.id]);
  const minutesLeft = Math.ceil(sections.filter((s) => !done[s.id]).reduce((n, s) => n + s.seconds, 0) / 60);
  const open = (id: string) => router.push(`/hsa/placement/${id}` as never);

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1080 }}>
        <StageShell
          tone={TONE}
          step={2}
          progress={doneCount / CRITERIA.length}
          labels={stageLabels(L, wide)}
          eyebrow={L(`Làm test · ${doneCount}/5 phần${doneCount < 5 ? ` · còn ~${minutesLeft} phút` : ''}`, `Entry test · ${doneCount}/5 parts${doneCount < 5 ? ` · ~${minutesLeft} min left` : ''}`)}
          title={L('Làm bài test đầu vào để mở lộ trình', 'Take the entry test to open your plan')}
          line={
            wide
              ? L(
                  'Kế hoạch mỗi ngày bám đúng điểm yếu của bạn khi làm xong cả 5 phần. Làm phần nào trước cũng được; làm dở thì lần sau vào làm tiếp.',
                  'Your daily plan aims at your weak spots once all 5 parts are done. Do them in any order, and pick up where you left off.',
                )
              : L('Làm đủ 5 phần để kế hoạch bám đúng điểm yếu của bạn.', 'Do all 5 parts so the plan aims at your weak spots.')
          }
          pose="think"
        >
          <WindowCard frame={TONE.frame}>
            <View style={{ gap: 10 }}>
              {sections.map((s) => {
                const c = CRITERIA.find((x) => x.id === s.id)!;
                const attempt = done[s.id];
                const report = attempt ? scoreItems(restoreItems(attempt, INDEX)) : null;
                const isNext = next?.id === s.id;
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    onPress={() => open(s.id)}
                    style={({ hovered }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isNext ? TONE.accent : LINE,
                      backgroundColor: hovered ? '#F8F6FF' : '#FFFFFF',
                    })}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: CRITERION_COLOR[s.id] }}>
                      <Text className="font-nun-heavy" style={{ fontSize: 14, color: '#FFFFFF' }}>
                        {c.short}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        <Text className="font-nun-heavy" style={{ fontSize: 16, color: INK }}>
                          {bi(c.title, locale)}
                        </Text>
                        {isNext ? (
                          <View style={{ backgroundColor: TONE.accent, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 }}>
                            <Text className="font-nun-heavy" style={{ fontSize: 12, color: '#FFFFFF' }}>
                              {L('Tiếp theo', 'Next')}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="font-nun-strong" numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, color: MUTED }}>
                        {report
                          ? L(`Đã làm · đúng ${report.correct}/${report.total} · chạm để xem kết quả`, `Done · ${report.correct}/${report.total} correct · tap to review`)
                          : `${s.questions.length} ${L('câu', 'questions')} · ${Math.ceil(s.seconds / 60)} ${L('phút', 'min')} · ${bi(c.hint, locale)}`}
                      </Text>
                    </View>
                    {wide ? (
                      <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: isNext ? INK : '#F3F2F7' }}>
                        <Text className="font-nun-heavy" style={{ fontSize: 13, color: isNext ? '#FFFFFF' : INK }}>
                          {attempt ? L('Làm lại', 'Retake') : L('Làm', 'Start')} →
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderColor: LINE }}>
              <SoftButton label={L('Để sau', 'Later')} onPress={() => router.replace('/hsa' as never)} />
              {next ? (
                <DarkButton label={L(`Bắt đầu: ${bi(CRITERIA.find((c) => c.id === next.id)!.title, 'vi').split(' & ')[0]}`, `Start: ${bi(CRITERIA.find((c) => c.id === next.id)!.title, 'en').split(' & ')[0]}`)} onPress={() => open(next.id)} />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                  <SoftButton label={L('Kết quả tổng hợp', 'Combined results')} onPress={() => router.push('/hsa/result/placement' as never)} />
                  <DarkButton label={L('Xem lộ trình của bạn', 'See your plan')} onPress={() => router.replace('/hsa/plan' as never)} />
                </View>
              )}
            </View>
          </WindowCard>
        </StageShell>
      </View>
    </Screen>
  );
}
