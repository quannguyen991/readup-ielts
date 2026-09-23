import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { MathRunner } from '@/components/math/MathRunner';
import { Button, Card } from '@/components/ui';
import { Grid } from '@/components/layout/Grid';
import { Icon } from '@/components/ui/Icon';
import { MATH_DOMAIN_LABEL, MATH_SKILL_DOMAIN, MATH_SKILL_LABEL, type MathSkill } from '@/lib/math/types';
import { ROUND_SIZE, bankProgress, bankRoundId, bankRoundItems, roundLength, roundsFor } from '@/services/math/bank';
import { countCorrect, gradeMathSession, type MathResponse } from '@/services/math/grade';
import { useMathBankProgress, useMathSetProgress, useMathStore } from '@/store/useMathStore';
import { color } from '@/theme/tokens';
import { useStudyStore } from '@/store/useStudyStore';

/** Hai phút mỗi câu — nhịp của đề thật (22 câu / 35 phút ≈ 1,6 phút). */
const MINUTES_PER_QUESTION = 2;

/**
 * Bấm "Luyện" ở thẻ kỹ năng thì vào DANH SÁCH BỘ ĐỀ của kỹ năng đó trước — mỗi
 * bộ 10 câu cố định, có trạng thái đã làm / điểm cao nhất — rồi mới chọn bộ để
 * làm. Trước đây bấm là nhảy thẳng vào "lượt kế tiếp", người học không thấy
 * mình đang ở bộ nào trong kho, cũng không làm lại được một bộ cụ thể.
 */
export default function MathDrillScreen() {
  const params = useLocalSearchParams<{ skill?: string; round?: string }>();
  const skill = params.skill as MathSkill | undefined;
  const valid = !!skill && skill in MATH_SKILL_DOMAIN;
  const asked = Number(params.round);
  if (valid && !(params.round !== undefined && Number.isInteger(asked) && asked >= 0 && asked < roundsFor(skill))) {
    return <SetPicker skill={skill} />;
  }
  return <DrillRunner />;
}

function SetPicker({ skill }: { skill: MathSkill }) {
  const bank = useMathBankProgress()[skill];
  const sets = useMathSetProgress();
  const total = roundsFor(skill);
  const done = bank.doneRounds.length;
  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 1040 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/math' as never)}
          className="flex-row items-center gap-2 self-start rounded-pill bg-white/85 px-4 py-2"
        >
          <Icon name="chevron-left" size={18} color={color.ink} />
          <Text className="font-semi text-body text-ink">SAT Math</Text>
        </Pressable>

        <View className="mt-5 rounded-[22px] bg-white p-6" style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 14px 34px rgba(30,41,99,0.10)' } as object}>
          <Text className="font-strong text-label uppercase tracking-[1.2px] text-primary-600">{MATH_DOMAIN_LABEL[MATH_SKILL_DOMAIN[skill]]}</Text>
          <Text className="mt-1 font-heavy text-pageTitle text-ink">{MATH_SKILL_LABEL[skill]}</Text>
          <Text className="mt-1 font-sans text-bodyLg text-muted">
            {total} bộ đề · mỗi bộ {ROUND_SIZE} câu · đã làm {done}/{total} bộ
          </Text>
          <View className="mt-4 h-2.5 overflow-hidden rounded-pill" style={{ backgroundColor: '#E8EEF8' }}>
            <View className="h-2.5 rounded-pill" style={{ width: `${(done / total) * 100}%`, backgroundColor: '#16A34A' }} />
          </View>
          <Button
            className="mt-5 self-start"
            label={done === 0 ? 'Bắt đầu từ Bộ đề 1' : `Làm tiếp: Bộ đề ${bank.nextRound + 1}`}
            onPress={() => router.push(`/math/drill/${skill}?round=${bank.nextRound}` as never)}
          />
        </View>

        <Text className="mb-3 mt-7 font-heavy text-sectionTitle text-ink">Chọn bộ đề</Text>
        <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={14}>
          {Array.from({ length: total }, (_, r) => {
            const p = sets[bankRoundId(skill, r)];
            const n = roundLength(skill, r);
            const isNext = r === bank.nextRound;
            const best = p ? Math.round(p.bestRatio * n) : null;
            const tone = !p ? '#94A3B8' : p.bestRatio >= 0.8 ? '#16A34A' : p.bestRatio >= 0.5 ? '#D97706' : '#E11D48';
            return (
              <Pressable
                key={r}
                accessibilityRole="button"
                accessibilityLabel={`Bộ đề ${r + 1}`}
                onPress={() => router.push(`/math/drill/${skill}?round=${r}` as never)}
                className="rounded-2xl bg-white p-4"
                style={{ borderWidth: 2, borderColor: isNext ? color.primary : 'transparent', boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 8px 20px rgba(30,41,99,0.08)' } as object}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-strong text-bodyLg text-ink">Bộ đề {r + 1}</Text>
                  {p ? <Icon name="check" size={18} color={tone} strokeWidth={2.4} /> : null}
                </View>
                <Text className="mt-1 font-sans text-label text-muted">{n} câu · ~{n * MINUTES_PER_QUESTION} phút</Text>
                <View className="mt-3 flex-row items-center justify-between">
                  {p ? (
                    <Text className="font-heavy text-bodyLg" style={{ color: tone }}>
                      {best}/{n}
                    </Text>
                  ) : (
                    <Text className="font-semi text-body" style={{ color: isNext ? color.primary : '#94A3B8' }}>
                      {isNext ? 'Làm tiếp' : 'Chưa làm'}
                    </Text>
                  )}
                  {p ? <Text className="font-sans text-label text-muted">{p.rounds} lần</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </Grid>
        <Text className="mt-4 font-sans text-label text-muted">Điểm trên mỗi bộ là lần làm tốt nhất. Làm lại một bộ thì được đúng các câu cũ.</Text>
      </View>
    </Screen>
  );
}

function DrillRunner() {
  const params = useLocalSearchParams<{ skill?: string; round?: string }>();
  const skill = params.skill as MathSkill | undefined;
  const valid = !!skill && skill in MATH_SKILL_DOMAIN;

  /*
    Làm LƯỢT KẾ TIẾP của ngân hàng kỹ năng (xem `services/math/bank.ts`), chốt
    một lần lúc mở màn. Trước đây màn này bốc 6 câu ngẫu nhiên, không thuộc kho
    "148 câu" ghi trên thẻ — làm bao nhiêu lần con số trên thẻ cũng không nói
    lên mình đã đi được bao xa trong kho.
  */
  const [round] = useState(() => {
    if (!valid) return 0;
    const asked = Number(params.round);
    if (Number.isInteger(asked) && asked >= 0 && asked < roundsFor(skill)) return asked;
    return bankProgress(useMathStore.getState().sessions)[skill].nextRound;
  });
  const items = useMemo(() => (valid ? bankRoundItems(skill, round) : []), [round, skill, valid]);

  const addSession = useMathStore((s) => s.addSession);
  const logStudyTime = useStudyStore((s) => s.logStudyTime);
  const logQuestions = useStudyStore((s) => s.logQuestions);

  const finish = useCallback(
    (responses: MathResponse[], elapsedMs: number) => {
      const attempts = gradeMathSession(items, responses);
      const id = addSession({
        mode: 'drill',
        skill: skill ?? null,
        setId: skill ? bankRoundId(skill, round) : null,
        attempts,
        rawScore: countCorrect(attempts),
        total: attempts.length,
        durationMs: elapsedMs,
        moduleTier: null,
        estimatedScore: null,
      });

      logStudyTime('practice', Math.round(elapsedMs / 60_000));
      logQuestions(attempts.length);
      router.replace(`/math/review/${id}`);
    },
    [addSession, items, logQuestions, logStudyTime, round, skill],
  );

  if (!valid) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">Không có kỹ năng này</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            Đường dẫn trỏ tới một kỹ năng không nằm trong 19 kỹ năng của Digital SAT Math.
          </Text>
          <Button className="mt-3" label="Về trang Math" onPress={() => router.replace('/math')} />
        </Card>
      </Screen>
    );
  }

  return (
    <MathRunner
      surface="paper"
      title={`${MATH_SKILL_LABEL[skill]} · Bộ đề ${round + 1}/${roundsFor(skill)}`}
      subtitle={`${items.length} câu của ngân hàng kỹ năng này (mỗi bộ ${ROUND_SIZE} câu). Làm hết rồi xem lại từng câu — sai chỗ nào sẽ được gọi đúng tên chỗ đó.`}
      items={items}
      minutes={items.length * MINUTES_PER_QUESTION}
      submitLabel="Nộp và xem lại"
      onFinish={finish}
    />
  );
}
